"""Media library: images uploaded from the admin panel are stored in MongoDB
(base64 payload from the browser, already resized/compressed client-side) and
served back as real image responses so they can be used in any <img src>.
"""
import base64
import os
import re
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from fastapi import APIRouter, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel

_mongo = AsyncIOMotorClient(os.environ['MONGO_URL'])
_db = _mongo[os.environ['DB_NAME']]

media_router = APIRouter(prefix="/api")

MAX_BYTES = 3 * 1024 * 1024  # 3 MB per image after client-side compression
ALLOWED = {'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml', 'image/x-icon'}
DATA_URL_RE = re.compile(r'^data:(?P<mime>[\w/+.\-]+);base64,(?P<data>.+)$', re.DOTALL)


class MediaInput(BaseModel):
    name: str
    dataUrl: str
    usage: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None


def _meta(doc: Dict[str, Any]) -> Dict[str, Any]:
    return {
        'id': doc['id'], 'name': doc.get('name'), 'mime': doc.get('mime'),
        'size': doc.get('size'), 'width': doc.get('width'), 'height': doc.get('height'),
        'usage': doc.get('usage'), 'createdAt': doc.get('createdAt'),
        'url': f"/api/media/{doc['id']}",
    }


async def create(inp: MediaInput) -> Dict[str, Any]:
    m = DATA_URL_RE.match((inp.dataUrl or '').strip())
    if not m:
        raise HTTPException(status_code=400, detail='Format gambar tidak valid (harus data URL base64).')
    mime = m.group('mime').lower()
    if mime not in ALLOWED:
        raise HTTPException(status_code=400, detail=f'Tipe file {mime} tidak didukung.')
    try:
        raw = base64.b64decode(m.group('data'), validate=False)
    except Exception:
        raise HTTPException(status_code=400, detail='Gagal membaca data gambar.')
    if len(raw) > MAX_BYTES:
        raise HTTPException(status_code=400,
                            detail=f'Ukuran gambar {round(len(raw)/1024)} KB melebihi batas 3 MB.')
    doc = {
        'id': 'med_' + uuid.uuid4().hex[:12],
        'name': (inp.name or 'gambar')[:120],
        'mime': mime, 'size': len(raw),
        'width': inp.width, 'height': inp.height, 'usage': inp.usage,
        'data': base64.b64encode(raw).decode('ascii'),
        'createdAt': datetime.now(timezone.utc).isoformat(),
    }
    await _db.media.insert_one(doc)
    return _meta(doc)


async def listing(limit: int = 300) -> list:
    docs = await _db.media.find({}, {'data': 0}).sort('createdAt', -1).to_list(limit)
    return [_meta(d) for d in docs]


async def delete(mid: str) -> Dict[str, Any]:
    res = await _db.media.delete_one({'id': mid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail='Gambar tidak ditemukan.')
    return {'ok': True}


@media_router.get("/media/{mid}")
async def serve_media(mid: str):
    from fastapi.responses import Response
    doc = await _db.media.find_one({'id': mid})
    if not doc:
        raise HTTPException(status_code=404, detail='Gambar tidak ditemukan.')
    raw = base64.b64decode(doc['data'])
    return Response(content=raw, media_type=doc.get('mime', 'image/png'),
                    headers={'Cache-Control': 'public, max-age=86400'})

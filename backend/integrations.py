"""Runtime integration settings (Midtrans & Digiflazz) stored in MongoDB.

Credentials are seeded from backend/.env on first run, then managed entirely
from the admin panel (/own). Secrets are never returned in full to the client -
use `public_status()` for that.
"""
import os
from pathlib import Path
from typing import Any, Dict

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv(Path(__file__).parent / '.env')

_client = AsyncIOMotorClient(os.environ['MONGO_URL'])
_db = _client[os.environ['DB_NAME']]
_coll = _db.integrations

DIGIFLAZZ = 'digiflazz'
MIDTRANS = 'midtrans'


def _env_defaults(name: str) -> Dict[str, Any]:
    if name == DIGIFLAZZ:
        return {
            'id': DIGIFLAZZ,
            'username': os.environ.get('DIGIFLAZZ_USERNAME', ''),
            'devKey': os.environ.get('DIGIFLAZZ_DEVELOPMENT_KEY', ''),
            'prodKey': os.environ.get('DIGIFLAZZ_PRODUCTION_KEY', ''),
            'mode': os.environ.get('DIGIFLAZZ_MODE', 'development'),
            'webhookSecret': os.environ.get('DIGIFLAZZ_WEBHOOK_SECRET', ''),
            'enabled': True,
        }
    return {
        'id': MIDTRANS,
        'serverKey': os.environ.get('MIDTRANS_SERVER_KEY', ''),
        'clientKey': os.environ.get('MIDTRANS_CLIENT_KEY', ''),
        'isProduction': (os.environ.get('MIDTRANS_IS_PRODUCTION', 'false').lower() == 'true'),
        'enabled': True,
    }


async def seed():
    """Insert env-based defaults once, and backfill blank fields from .env."""
    for name in (DIGIFLAZZ, MIDTRANS):
        defaults = _env_defaults(name)
        doc = await _coll.find_one({'id': name})
        if not doc:
            await _coll.insert_one(defaults)
            continue
        patch = {}
        for k, v in defaults.items():
            if k == 'id':
                continue
            current = doc.get(k)
            if current in (None, '') and v not in (None, ''):
                patch[k] = v
        # A stored default-False flag should follow .env until an admin edits it
        if not doc.get('serverKey') and not doc.get('username') and name == MIDTRANS:
            patch['isProduction'] = defaults['isProduction']
        if patch:
            await _coll.update_one({'id': name}, {'$set': patch})


async def get_config(name: str) -> Dict[str, Any]:
    doc = await _coll.find_one({'id': name})
    cfg = _env_defaults(name)
    if doc:
        doc.pop('_id', None)
        # DB values win, but never let a blank DB value wipe an env fallback
        for k, v in doc.items():
            if v not in (None, ''):
                cfg[k] = v
            elif k not in cfg:
                cfg[k] = v
        # explicit booleans must be respected even when False
        for k in ('enabled', 'isProduction'):
            if k in doc and isinstance(doc[k], bool):
                cfg[k] = doc[k]
        if 'mode' in doc and doc['mode']:
            cfg['mode'] = doc['mode']
    return cfg


async def save_config(name: str, patch: Dict[str, Any]) -> Dict[str, Any]:
    patch = {k: v for k, v in (patch or {}).items() if k not in ('_id', 'id')}
    allowed = {
        DIGIFLAZZ: {'username', 'devKey', 'prodKey', 'mode', 'webhookSecret', 'enabled'},
        MIDTRANS: {'serverKey', 'clientKey', 'isProduction', 'enabled'},
    }[name]
    clean_patch = {k: v for k, v in patch.items() if k in allowed}
    # Masked values coming back from the UI must not overwrite stored secrets
    clean_patch = {k: v for k, v in clean_patch.items()
                   if not (isinstance(v, str) and set(v.strip()) == {'\u2022'})}
    if clean_patch:
        await _coll.update_one({'id': name}, {'$set': clean_patch}, upsert=True)
    return await get_config(name)


def mask(value: str) -> str:
    if not value:
        return ''
    if len(value) <= 8:
        return value[:2] + '****'
    return value[:6] + '****' + value[-4:]


def digiflazz_status(cfg: Dict[str, Any]) -> Dict[str, Any]:
    key = cfg.get('prodKey') if cfg.get('mode') == 'production' else cfg.get('devKey')
    return {
        'configured': bool(cfg.get('username') and key),
        'mode': cfg.get('mode', 'development'),
        'username': cfg.get('username', ''),
        'usernameMasked': mask(cfg.get('username', '')),
        'hasDevKey': bool(cfg.get('devKey')),
        'hasProdKey': bool(cfg.get('prodKey')),
        'webhookConfigured': bool(cfg.get('webhookSecret')),
        'enabled': bool(cfg.get('enabled', True)),
        'devKeyMasked': mask(cfg.get('devKey', '')),
        'prodKeyMasked': mask(cfg.get('prodKey', '')),
        'webhookSecretMasked': mask(cfg.get('webhookSecret', '')),
    }


def midtrans_status(cfg: Dict[str, Any]) -> Dict[str, Any]:
    return {
        'configured': bool(cfg.get('serverKey') and cfg.get('clientKey')),
        'isProduction': bool(cfg.get('isProduction')),
        'mode': 'production' if cfg.get('isProduction') else 'sandbox',
        'enabled': bool(cfg.get('enabled', True)),
        'serverKeyMasked': mask(cfg.get('serverKey', '')),
        'clientKey': cfg.get('clientKey', ''),
        'snapJsUrl': snap_js_url(cfg),
    }


def snap_js_url(cfg: Dict[str, Any]) -> str:
    return ('https://app.midtrans.com/snap/snap.js' if cfg.get('isProduction')
            else 'https://app.sandbox.midtrans.com/snap/snap.js')

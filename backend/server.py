from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, Request
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
import uuid
import re
import asyncio
import secrets
from datetime import datetime, timezone, timedelta
from collections import OrderedDict
from passlib.context import CryptContext
import jwt

import seed_data
import digiflazz
import integrations
import media as media_lib
import midtrans_payments

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ.get('JWT_SECRET', 'dev_secret')
JWT_EXPIRE_DAYS = int(os.environ.get('JWT_EXPIRE_DAYS', '7'))
JWT_ALG = 'HS256'

pwd_ctx = CryptContext(schemes=['bcrypt'], deprecated='auto')

app = FastAPI()
api_router = APIRouter(prefix="/api")


# ---------------- Models ----------------
class RegisterInput(BaseModel):
    name: str
    email: EmailStr
    password: str

class LoginInput(BaseModel):
    email: EmailStr
    password: str

class OrderInput(BaseModel):
    gameSlug: str
    gameName: str
    gameBadge: Optional[str] = None
    gameGrad: Optional[str] = None
    gameImage: Optional[str] = None
    denomId: Optional[str] = None
    denomName: str
    account: Dict[str, Any] = {}
    payment: str
    paymentId: str
    subtotal: int
    fee: int = 0
    discount: int = 0
    voucherCode: Optional[str] = None
    total: int
    email: Optional[str] = None
    buyerSkuCode: Optional[str] = None
    customerNo: Optional[str] = None

class VoucherInput(BaseModel):
    code: str
    amount: int

class StatusInput(BaseModel):
    status: str


# ---------------- Helpers ----------------
def now_iso():
    return datetime.now(timezone.utc).isoformat()

def make_token(user_id: str, role: str = 'user') -> str:
    payload = {'sub': user_id, 'role': role,
               'exp': datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRE_DAYS),
               'iat': datetime.now(timezone.utc)}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)

def gen_invoice() -> str:
    return 'INV' + datetime.now().strftime('%H%M%S') + str(secrets.randbelow(9000) + 1000)

def public_user(u: dict) -> dict:
    return {'id': u['id'], 'name': u['name'], 'email': u['email'], 'role': u.get('role', 'user')}

def clean(doc: dict) -> dict:
    if doc:
        doc.pop('_id', None)
    return doc

async def log_activity(admin: dict, action: str, entity: str, detail: str = ''):
    try:
        await db.activitylog.insert_one({
            'id': 'log_' + uuid.uuid4().hex[:12],
            'adminId': admin.get('id'), 'adminName': admin.get('name'),
            'action': action, 'entity': entity, 'detail': detail,
            'createdAt': now_iso(),
        })
    except Exception:
        pass

async def decode_user(authorization: Optional[str]):
    if not authorization or not authorization.startswith('Bearer '):
        return None
    token = authorization.split(' ', 1)[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        return await db.users.find_one({'id': payload.get('sub')})
    except Exception:
        return None

async def get_user_optional(authorization: Optional[str] = Header(None)):
    return await decode_user(authorization)

async def get_user_required(authorization: Optional[str] = Header(None)):
    user = await decode_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail='Tidak terautentikasi.')
    return user

async def get_admin_required(authorization: Optional[str] = Header(None)):
    user = await decode_user(authorization)
    if not user or user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail='Akses admin diperlukan.')
    return user


# ---------------- Seeding ----------------
async def seed():
    if await db.games.count_documents({}) == 0:
        await db.games.insert_many([dict(g) for g in seed_data.GAMES])
    if await db.vouchers.count_documents({}) == 0:
        await db.vouchers.insert_many([dict(v) for v in seed_data.VOUCHERS])
    if await db.banners.count_documents({}) == 0:
        await db.banners.insert_many([dict(b) for b in seed_data.BANNERS])
    if await db.flashsale.count_documents({}) == 0:
        await db.flashsale.insert_many([dict(f) for f in seed_data.FLASHSALE])
    if await db.specialoffers.count_documents({}) == 0:
        await db.specialoffers.insert_many([dict(s) for s in seed_data.SPECIALOFFERS])
    if await db.payments.count_documents({}) == 0:
        await db.payments.insert_many([dict(p) for p in seed_data.PAYMENTS])
    if await db.settings.count_documents({'id': 'site'}) == 0:
        await db.settings.insert_one(dict(seed_data.SETTINGS))
    if await db.sellaccounts.count_documents({}) == 0:
        await db.sellaccounts.insert_many([dict(x) for x in seed_data.SELLACCOUNTS])
    if await db.itemskins.count_documents({}) == 0:
        await db.itemskins.insert_many([dict(x) for x in seed_data.ITEMSKINS])
    if await db.pulsaoperators.count_documents({}) == 0:
        await db.pulsaoperators.insert_many([dict(x) for x in seed_data.PULSAOPERATORS])
    if await db.pulsanominals.count_documents({}) == 0:
        await db.pulsanominals.insert_many([dict(x) for x in seed_data.PULSANOMINALS])
    if await db.tagihan.count_documents({}) == 0:
        await db.tagihan.insert_many([dict(x) for x in seed_data.TAGIHAN])
    await integrations.seed()
    # Ensure new branding keys exist on the site settings document
    doc = await db.settings.find_one({'id': 'site'}) or {}
    missing = {k: v for k, v in seed_data.SETTINGS.items() if k not in doc}
    if missing:
        await db.settings.update_one({'id': 'site'}, {'$set': missing}, upsert=True)

@app.on_event("startup")
async def on_start():
    await seed()

@app.on_event("startup")
async def start_scheduler():
    async def loop():
        while True:
            await asyncio.sleep(120)
            try:
                await retry_pending_once()
            except Exception:
                pass
    asyncio.create_task(loop())


# ==================== AUTH ====================
@api_router.get("/")
async def root():
    return {"message": "Allv2Store API"}

@api_router.post("/auth/register")
async def register(inp: RegisterInput):
    if await db.users.find_one({'email': inp.email.lower()}):
        raise HTTPException(status_code=400, detail='Email sudah terdaftar.')
    user = {'id': 'u_' + uuid.uuid4().hex[:12], 'name': inp.name.strip(), 'email': inp.email.lower(),
            'password': pwd_ctx.hash(inp.password), 'role': 'user', 'createdAt': now_iso()}
    await db.users.insert_one(user)
    return {'token': make_token(user['id']), 'user': public_user(user)}

@api_router.post("/auth/login")
async def login(inp: LoginInput):
    user = await db.users.find_one({'email': inp.email.lower()})
    if not user:
        raise HTTPException(status_code=400, detail='Email belum terdaftar.')
    if not pwd_ctx.verify(inp.password, user['password']):
        raise HTTPException(status_code=400, detail='Password salah.')
    return {'token': make_token(user['id'], user.get('role', 'user')), 'user': public_user(user)}

@api_router.get("/auth/me")
async def me(user: dict = Depends(get_user_required)):
    return public_user(user)


# ==================== ADMIN AUTH ====================
@api_router.get("/admin/setup-status")
async def setup_status():
    has = await db.users.count_documents({'role': 'admin'})
    return {'hasAdmin': has > 0}

@api_router.post("/admin/setup")
async def admin_setup(inp: RegisterInput):
    if await db.users.count_documents({'role': 'admin'}) > 0:
        raise HTTPException(status_code=400, detail='Admin sudah ada. Silakan login.')
    if await db.users.find_one({'email': inp.email.lower()}):
        await db.users.update_one({'email': inp.email.lower()}, {'$set': {'role': 'admin', 'password': pwd_ctx.hash(inp.password)}})
        user = await db.users.find_one({'email': inp.email.lower()})
    else:
        user = {'id': 'u_' + uuid.uuid4().hex[:12], 'name': inp.name.strip(), 'email': inp.email.lower(),
                'password': pwd_ctx.hash(inp.password), 'role': 'admin', 'createdAt': now_iso()}
        await db.users.insert_one(user)
    return {'token': make_token(user['id'], 'admin'), 'user': public_user(user)}

@api_router.post("/admin/login")
async def admin_login(inp: LoginInput):
    user = await db.users.find_one({'email': inp.email.lower()})
    if not user or not pwd_ctx.verify(inp.password, user['password']):
        raise HTTPException(status_code=400, detail='Email atau password salah.')
    if user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail='Akun ini bukan admin.')
    return {'token': make_token(user['id'], 'admin'), 'user': public_user(user)}


# ==================== PUBLIC CATALOG ====================
@api_router.get("/catalog/games")
async def catalog_games():
    docs = await db.games.find({'active': True}).to_list(500)
    return [clean(d) for d in docs]

@api_router.get("/catalog/games/{slug}")
async def catalog_game(slug: str):
    doc = await db.games.find_one({'slug': slug})
    if not doc:
        raise HTTPException(status_code=404, detail='Game tidak ditemukan.')
    return clean(doc)

@api_router.get("/catalog/vouchers")
async def catalog_vouchers():
    docs = await db.vouchers.find({'active': True}).to_list(200)
    return [clean(d) for d in docs]

@api_router.get("/catalog/banners")
async def catalog_banners():
    docs = await db.banners.find({'active': True}).sort('order', 1).to_list(50)
    return [clean(d) for d in docs]

@api_router.get("/catalog/flashsale")
async def catalog_flashsale():
    docs = await db.flashsale.find({'active': True}).to_list(50)
    return [clean(d) for d in docs]

@api_router.get("/catalog/specialoffers")
async def catalog_specialoffers():
    docs = await db.specialoffers.find({'active': True}).to_list(50)
    return [clean(d) for d in docs]

@api_router.get("/catalog/payments")
async def catalog_payments():
    docs = await db.payments.find({'active': True}).sort('order', 1).to_list(50)
    return [clean(d) for d in docs]

@api_router.get("/catalog/settings")
async def catalog_settings():
    doc = await db.settings.find_one({'id': 'site'})
    return clean(doc) if doc else dict(seed_data.SETTINGS)

@api_router.get("/catalog/sellaccounts")
async def catalog_sellaccounts():
    return [clean(d) for d in await db.sellaccounts.find({'active': True}).to_list(200)]

@api_router.get("/catalog/itemskins")
async def catalog_itemskins():
    return [clean(d) for d in await db.itemskins.find({'active': True}).to_list(200)]

@api_router.get("/catalog/pulsa")
async def catalog_pulsa():
    ops = [clean(d) for d in await db.pulsaoperators.find({'active': True}).to_list(50)]
    noms = [clean(d) for d in await db.pulsanominals.find({'active': True}).to_list(50)]
    tag = [clean(d) for d in await db.tagihan.find({'active': True}).to_list(50)]
    return {'operators': ops, 'nominals': noms, 'tagihan': tag}


# ==================== ORDERS (public/user) ====================
@api_router.post("/orders")
async def create_order(inp: OrderInput, user: Optional[dict] = Depends(get_user_optional)):
    order = inp.dict()
    order.update({'id': 'ord_' + uuid.uuid4().hex[:12], 'invoice': gen_invoice(),
                  'status': 'pending', 'createdAt': now_iso(), 'userId': user['id'] if user else None,
                  'userName': user['name'] if user else 'Guest'})
    await db.orders.insert_one(order)
    return clean(order)

async def _fulfill_order(order: dict) -> dict:
    """Send the paid order to Digiflazz for automatic fulfillment (best-effort)."""
    cfg = await integrations.get_config(integrations.DIGIFLAZZ)
    if not digiflazz.is_configured(cfg):
        return {"skipped": "digiflazz_not_configured"}
    sku = order.get("buyerSkuCode")
    customer = order.get("customerNo") or "".join(str(v) for v in (order.get("account") or {}).values())
    if not sku or not customer:
        return {"skipped": "missing_sku_or_customer"}
    ref_id = order["invoice"]
    try:
        result = await digiflazz.transaction(cfg, sku, customer, ref_id)
        data = result.get("data", {})
        ff = {
            "refId": ref_id, "status": data.get("status"), "rc": data.get("rc"),
            "sn": data.get("sn"), "message": data.get("message"), "price": data.get("price"),
        }
        await db.orders.update_one({"id": order["id"]}, {"$set": {"digiflazz": ff, "buyerSkuCode": sku, "customerNo": customer}})
        return ff
    except Exception as e:
        ff = {"refId": ref_id, "status": "Error", "message": str(e)[:200]}
        await db.orders.update_one({"id": order["id"]}, {"$set": {"digiflazz": ff}})
        return ff

@api_router.post("/orders/{invoice}/pay")
async def pay_order(invoice: str):
    """Manual/simulated confirmation. Disabled when `allowManualPay` is off -
    real payments always flow through the Midtrans notification handler."""
    site = await db.settings.find_one({'id': 'site'}) or {}
    if site.get('allowManualPay') is False:
        raise HTTPException(status_code=403, detail='Konfirmasi manual dimatikan. Gunakan pembayaran Midtrans.')
    order = await db.orders.find_one({'$or': [{'invoice': invoice}, {'id': invoice}]})
    if not order:
        raise HTTPException(status_code=404, detail='Pesanan tidak ditemukan.')
    await db.orders.update_one({'id': order['id']}, {'$set': {'status': 'success', 'paidAt': now_iso()}})
    order['status'] = 'success'; order['paidAt'] = now_iso()
    # Auto-fulfill via Digiflazz (best-effort; no-op if not configured)
    ff = await _fulfill_order(order)
    order['digiflazz'] = ff
    return clean(order)

@api_router.get("/orders")
async def list_orders(user: dict = Depends(get_user_required)):
    docs = await db.orders.find({'userId': user['id']}).sort('createdAt', -1).to_list(200)
    return [clean(d) for d in docs]

@api_router.get("/orders/{key}")
async def get_order(key: str):
    order = await db.orders.find_one({'$or': [{'invoice': key}, {'id': key}]})
    if not order:
        raise HTTPException(status_code=404, detail='Pesanan tidak ditemukan.')
    return clean(order)

@api_router.post("/vouchers/validate")
async def validate_voucher(inp: VoucherInput):
    v = await db.vouchers.find_one({'code': inp.code.upper(), 'active': True})
    if not v:
        return {'valid': False, 'message': 'Kode voucher tidak ditemukan.'}
    if inp.amount < v.get('minSpend', 0):
        return {'valid': False, 'message': f"Minimal belanja Rp {v['minSpend']:,}".replace(',', '.')}
    cut = v['value'] if v['type'] == 'fixed' else round(inp.amount * v['value'] / 100)
    if v.get('maxCut'):
        cut = min(cut, v['maxCut'])
    return {'valid': True, 'discount': cut, 'code': v['code'], 'message': f"Voucher {v['code']} diterapkan."}


# ==================== ADMIN: STATS ====================
@api_router.get("/admin/stats")
async def admin_stats(admin: dict = Depends(get_admin_required)):
    orders = await db.orders.find().to_list(5000)
    success = [o for o in orders if o.get('status') == 'success']
    revenue = sum(o.get('total', 0) for o in success)
    users = await db.users.count_documents({'role': {'$ne': 'admin'}})
    games = await db.games.count_documents({})
    # revenue by day (last 7 days)
    by_day = OrderedDict()
    for i in range(6, -1, -1):
        d = (datetime.now(timezone.utc) - timedelta(days=i)).strftime('%Y-%m-%d')
        by_day[d] = 0
    for o in success:
        d = (o.get('paidAt') or o.get('createdAt', ''))[:10]
        if d in by_day:
            by_day[d] += o.get('total', 0)
    recent = sorted(orders, key=lambda x: x.get('createdAt', ''), reverse=True)[:8]
    return {
        'revenue': revenue,
        'totalOrders': len(orders),
        'successOrders': len(success),
        'pendingOrders': len([o for o in orders if o.get('status') == 'pending']),
        'users': users,
        'games': games,
        'successRate': round(len(success) / len(orders) * 100) if orders else 0,
        'revenueByDay': [{'date': k, 'value': v} for k, v in by_day.items()],
        'recentOrders': [clean(o) for o in recent],
    }

# ==================== ADMIN: GENERIC CRUD helpers ====================
def make_id(prefix):
    return prefix + '_' + uuid.uuid4().hex[:10]

# ---- Games ----
@api_router.get("/admin/games")
async def admin_games(admin: dict = Depends(get_admin_required)):
    return [clean(d) for d in await db.games.find().to_list(500)]

@api_router.post("/admin/games")
async def admin_create_game(body: Dict[str, Any], admin: dict = Depends(get_admin_required)):
    if await db.games.find_one({'slug': body.get('slug')}):
        raise HTTPException(status_code=400, detail='Slug sudah dipakai.')
    body.setdefault('active', True)
    body.setdefault('denoms', [])
    body.setdefault('fields', [{'key': 'userId', 'label': 'User ID', 'placeholder': 'ID akun'}])
    await db.games.insert_one(dict(body))
    await log_activity(admin, 'create', 'game', body.get('name'))
    return clean(body)

@api_router.put("/admin/games/{slug}")
async def admin_update_game(slug: str, body: Dict[str, Any], admin: dict = Depends(get_admin_required)):
    body.pop('_id', None)
    res = await db.games.update_one({'slug': slug}, {'$set': body})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail='Game tidak ditemukan.')
    await log_activity(admin, 'update', 'game', slug)
    return clean(await db.games.find_one({'slug': slug}))

@api_router.delete("/admin/games/{slug}")
async def admin_delete_game(slug: str, admin: dict = Depends(get_admin_required)):
    await db.games.delete_one({'slug': slug})
    await log_activity(admin, 'delete', 'game', slug)
    return {'ok': True}

# ---- Vouchers ----
@api_router.get("/admin/vouchers")
async def admin_vouchers(admin: dict = Depends(get_admin_required)):
    return [clean(d) for d in await db.vouchers.find().to_list(200)]

@api_router.post("/admin/vouchers")
async def admin_create_voucher(body: Dict[str, Any], admin: dict = Depends(get_admin_required)):
    body['code'] = body.get('code', '').upper()
    if not body['code']:
        raise HTTPException(status_code=400, detail='Kode wajib diisi.')
    if await db.vouchers.find_one({'code': body['code']}):
        raise HTTPException(status_code=400, detail='Kode sudah ada.')
    body.setdefault('active', True)
    await db.vouchers.insert_one(dict(body))
    return clean(body)

@api_router.put("/admin/vouchers/{code}")
async def admin_update_voucher(code: str, body: Dict[str, Any], admin: dict = Depends(get_admin_required)):
    body.pop('_id', None)
    await db.vouchers.update_one({'code': code.upper()}, {'$set': body})
    return clean(await db.vouchers.find_one({'code': body.get('code', code).upper()}))

@api_router.delete("/admin/vouchers/{code}")
async def admin_delete_voucher(code: str, admin: dict = Depends(get_admin_required)):
    await db.vouchers.delete_one({'code': code.upper()})
    return {'ok': True}

# ---- Generic collections: banners, flashsale, specialoffers ----
COLL = {'banners': 'banners', 'flashsale': 'flashsale', 'specialoffers': 'specialoffers',
        'sellaccounts': 'sellaccounts', 'itemskins': 'itemskins',
        'pulsaoperators': 'pulsaoperators', 'pulsanominals': 'pulsanominals', 'tagihan': 'tagihan'}

@api_router.get("/admin/content/{coll}")
async def admin_list_coll(coll: str, admin: dict = Depends(get_admin_required)):
    if coll not in COLL:
        raise HTTPException(status_code=404, detail='Not found')
    return [clean(d) for d in await db[coll].find().to_list(200)]

@api_router.post("/admin/content/{coll}")
async def admin_create_coll(coll: str, body: Dict[str, Any], admin: dict = Depends(get_admin_required)):
    if coll not in COLL:
        raise HTTPException(status_code=404, detail='Not found')
    body['id'] = body.get('id') or make_id(coll[:2])
    body.setdefault('active', True)
    await db[coll].insert_one(dict(body))
    await log_activity(admin, 'create', coll, body.get('title') or body.get('name') or body['id'])
    return clean(body)

@api_router.put("/admin/content/{coll}/{item_id}")
async def admin_update_coll(coll: str, item_id: str, body: Dict[str, Any], admin: dict = Depends(get_admin_required)):
    if coll not in COLL:
        raise HTTPException(status_code=404, detail='Not found')
    body.pop('_id', None)
    await db[coll].update_one({'id': item_id}, {'$set': body})
    await log_activity(admin, 'update', coll, item_id)
    return clean(await db[coll].find_one({'id': item_id}))

@api_router.delete("/admin/content/{coll}/{item_id}")
async def admin_delete_coll(coll: str, item_id: str, admin: dict = Depends(get_admin_required)):
    if coll not in COLL:
        raise HTTPException(status_code=404, detail='Not found')
    await db[coll].delete_one({'id': item_id})
    await log_activity(admin, 'delete', coll, item_id)
    return {'ok': True}

# ---- Payments ----
@api_router.get("/admin/payments")
async def admin_payments(admin: dict = Depends(get_admin_required)):
    return [clean(d) for d in await db.payments.find().sort('order', 1).to_list(50)]

@api_router.put("/admin/payments/{pid}")
async def admin_update_payment(pid: str, body: Dict[str, Any], admin: dict = Depends(get_admin_required)):
    body.pop('_id', None)
    await db.payments.update_one({'id': pid}, {'$set': body})
    return clean(await db.payments.find_one({'id': pid}))

@api_router.post("/admin/payments")
async def admin_create_payment(body: Dict[str, Any], admin: dict = Depends(get_admin_required)):
    body['id'] = body.get('id') or make_id('pay')
    body.setdefault('active', True); body.setdefault('order', 99); body.setdefault('fee', 0)
    await db.payments.insert_one(dict(body))
    return clean(body)

@api_router.delete("/admin/payments/{pid}")
async def admin_delete_payment(pid: str, admin: dict = Depends(get_admin_required)):
    await db.payments.delete_one({'id': pid})
    return {'ok': True}

# ---- Users ----
@api_router.get("/admin/users")
async def admin_users(admin: dict = Depends(get_admin_required)):
    docs = await db.users.find().sort('createdAt', -1).to_list(1000)
    out = []
    for u in docs:
        cnt = await db.orders.count_documents({'userId': u['id']})
        out.append({'id': u['id'], 'name': u['name'], 'email': u['email'], 'role': u.get('role', 'user'),
                    'createdAt': u.get('createdAt'), 'orderCount': cnt})
    return out

# ---- Orders (admin) ----
@api_router.get("/admin/orders")
async def admin_orders(admin: dict = Depends(get_admin_required)):
    return [clean(d) for d in await db.orders.find().sort('createdAt', -1).to_list(2000)]

@api_router.put("/admin/orders/{order_id}")
async def admin_update_order(order_id: str, inp: StatusInput, admin: dict = Depends(get_admin_required)):
    res = await db.orders.update_one({'id': order_id}, {'$set': {'status': inp.status}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail='Pesanan tidak ditemukan.')
    await log_activity(admin, 'update', 'order', f"{order_id} -> {inp.status}")
    return clean(await db.orders.find_one({'id': order_id}))

# ---- Settings ----
@api_router.get("/admin/settings")
async def admin_get_settings(admin: dict = Depends(get_admin_required)):
    doc = await db.settings.find_one({'id': 'site'})
    return clean(doc) if doc else dict(seed_data.SETTINGS)

@api_router.put("/admin/settings")
async def admin_update_settings(body: Dict[str, Any], admin: dict = Depends(get_admin_required)):
    body.pop('_id', None); body['id'] = 'site'
    await db.settings.update_one({'id': 'site'}, {'$set': body}, upsert=True)
    await log_activity(admin, 'update', 'settings', body.get('siteName', ''))
    return clean(await db.settings.find_one({'id': 'site'}))

# ---- Activity log ----
@api_router.get("/admin/logs")
async def admin_logs(admin: dict = Depends(get_admin_required)):
    docs = await db.activitylog.find().sort('createdAt', -1).to_list(200)
    return [clean(d) for d in docs]

# ---- Change credentials ----
class CredInput(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    currentPassword: str
    newPassword: Optional[str] = None

@api_router.post("/admin/change-credentials")
async def admin_change_creds(inp: CredInput, admin: dict = Depends(get_admin_required)):
    if not pwd_ctx.verify(inp.currentPassword, admin['password']):
        raise HTTPException(status_code=400, detail='Password saat ini salah.')
    updates = {}
    if inp.name:
        updates['name'] = inp.name.strip()
    if inp.email and inp.email.lower() != admin['email']:
        if await db.users.find_one({'email': inp.email.lower(), 'id': {'$ne': admin['id']}}):
            raise HTTPException(status_code=400, detail='Email sudah dipakai akun lain.')
        updates['email'] = inp.email.lower()
    if inp.newPassword:
        updates['password'] = pwd_ctx.hash(inp.newPassword)
    if not updates:
        raise HTTPException(status_code=400, detail='Tidak ada perubahan.')
    await db.users.update_one({'id': admin['id']}, {'$set': updates})
    await log_activity(admin, 'update', 'credentials', ', '.join(updates.keys()))
    user = await db.users.find_one({'id': admin['id']})
    return {'token': make_token(user['id'], 'admin'), 'user': public_user(user)}


# ==================== INTEGRATIONS (admin) ====================
@api_router.get("/admin/integrations/digiflazz")
async def get_dgf_integration(admin: dict = Depends(get_admin_required)):
    cfg = await integrations.get_config(integrations.DIGIFLAZZ)
    return integrations.digiflazz_status(cfg)

@api_router.put("/admin/integrations/digiflazz")
async def put_dgf_integration(body: Dict[str, Any], admin: dict = Depends(get_admin_required)):
    cfg = await integrations.save_config(integrations.DIGIFLAZZ, body)
    await log_activity(admin, 'update', 'integration', 'digiflazz')
    return integrations.digiflazz_status(cfg)

@api_router.get("/admin/integrations/midtrans")
async def get_midtrans_integration(admin: dict = Depends(get_admin_required)):
    cfg = await integrations.get_config(integrations.MIDTRANS)
    return integrations.midtrans_status(cfg)

@api_router.put("/admin/integrations/midtrans")
async def put_midtrans_integration(body: Dict[str, Any], admin: dict = Depends(get_admin_required)):
    cfg = await integrations.save_config(integrations.MIDTRANS, body)
    await log_activity(admin, 'update', 'integration', 'midtrans')
    return integrations.midtrans_status(cfg)

@api_router.post("/admin/integrations/midtrans/test")
async def test_midtrans_integration(admin: dict = Depends(get_admin_required)):
    cfg = await integrations.get_config(integrations.MIDTRANS)
    res = await midtrans_payments.test_connection(cfg)
    await log_activity(admin, 'test', 'integration', 'midtrans')
    return res

@api_router.get("/admin/midtrans/transactions")
async def list_midtrans_tx(admin: dict = Depends(get_admin_required)):
    return await midtrans_payments.list_transactions()

@api_router.post("/admin/midtrans/transactions/{order_id}/refresh")
async def refresh_midtrans_tx(order_id: str, admin: dict = Depends(get_admin_required)):
    return await midtrans_payments.refresh_transaction(order_id)


# ==================== MEDIA LIBRARY (admin) ====================
@api_router.get("/admin/media")
async def admin_media_list(admin: dict = Depends(get_admin_required)):
    return await media_lib.listing()

@api_router.post("/admin/media")
async def admin_media_create(inp: media_lib.MediaInput, admin: dict = Depends(get_admin_required)):
    res = await media_lib.create(inp)
    await log_activity(admin, 'upload', 'media', res.get('name', ''))
    return res

@api_router.delete("/admin/media/{mid}")
async def admin_media_delete(mid: str, admin: dict = Depends(get_admin_required)):
    res = await media_lib.delete(mid)
    await log_activity(admin, 'delete', 'media', mid)
    return res


# ==================== DIGIFLAZZ ====================
@api_router.get("/admin/digiflazz/status")
async def dgf_status(admin: dict = Depends(get_admin_required)):
    cfg = await integrations.get_config(integrations.DIGIFLAZZ)
    return integrations.digiflazz_status(cfg)

@api_router.get("/admin/digiflazz/balance")
async def dgf_balance(admin: dict = Depends(get_admin_required)):
    cfg = await integrations.get_config(integrations.DIGIFLAZZ)
    if not digiflazz.is_configured(cfg):
        raise HTTPException(status_code=400, detail='Digiflazz belum dikonfigurasi. Isi kredensial di menu Digiflazz.')
    try:
        res = await digiflazz.check_balance(cfg)
        data = res.get('data', res)
        if isinstance(data, dict) and data.get('message') and data.get('deposit') is None:
            raise HTTPException(status_code=400, detail=f"Digiflazz: {data.get('message')}")
        return data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f'Gagal menghubungi Digiflazz: {str(e)[:150]}')

@api_router.post("/admin/digiflazz/sync-prices")
async def dgf_sync(admin: dict = Depends(get_admin_required)):
    cfg = await integrations.get_config(integrations.DIGIFLAZZ)
    if not digiflazz.is_configured(cfg):
        raise HTTPException(status_code=400, detail='Digiflazz belum dikonfigurasi.')
    try:
        res = await digiflazz.price_list(cfg)
        rows = res.get('data', [])
        if isinstance(rows, dict):
            raise HTTPException(status_code=400, detail=f"Digiflazz: {rows.get('message', 'gagal')}")
        if rows:
            await db.digiflazz_products.delete_many({})
            await db.digiflazz_products.insert_many([dict(r) for r in rows], ordered=False)
        await log_activity(admin, 'sync', 'digiflazz', f'{len(rows)} produk')
        return {'count': len(rows)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f'Gagal sync: {str(e)[:150]}')

@api_router.get("/admin/digiflazz/products")
async def dgf_products(admin: dict = Depends(get_admin_required)):
    return [clean(d) for d in await db.digiflazz_products.find().to_list(3000)]

def apply_markup(cost, s: dict) -> int:
    if not cost:
        return cost or 0
    t = s.get('markupType', 'percent'); v = s.get('markupValue', 0) or 0
    price = cost * (1 + v / 100) if t == 'percent' else cost + v
    r = s.get('roundTo', 0) or 0
    if r > 0:
        import math
        price = math.ceil(price / r) * r
    return int(round(price))

@api_router.post("/admin/digiflazz/automap")
async def dgf_automap(admin: dict = Depends(get_admin_required)):
    products = await db.digiflazz_products.find().to_list(5000)
    if not products:
        raise HTTPException(status_code=400, detail='Belum ada produk. Sinkron harga dulu.')
    settings = await db.settings.find_one({'id': 'site'}) or {}
    games = await db.games.find().to_list(500)
    mapped = 0
    for g in games:
        brand = (g.get('digiflazzBrand') or g.get('name') or '').lower()
        cands = [p for p in products if brand and brand in (p.get('brand', '') or '').lower()]
        denoms = g.get('denoms', [])
        for d in denoms:
            amt = str(d.get('amount'))
            match = None
            for p in cands:
                name = p.get('product_name', '') or ''
                if amt and re.search(r'(?<!\d)' + re.escape(amt) + r'(?!\d)', name):
                    match = p; break
            if match:
                d['buyerSkuCode'] = match['buyer_sku_code']
                d['costPrice'] = match.get('price')
                d['price'] = apply_markup(match.get('price'), settings)
                mapped += 1
        await db.games.update_one({'slug': g['slug']}, {'$set': {'denoms': denoms}})
    await log_activity(admin, 'automap', 'digiflazz', f'{mapped} nominal dipetakan')
    return {'mapped': mapped}

async def retry_pending_once() -> int:
    cfg = await integrations.get_config(integrations.DIGIFLAZZ)
    if not digiflazz.is_configured(cfg):
        return 0
    orders = await db.orders.find({'digiflazz.status': 'Pending'}).to_list(200)
    for o in orders:
        try:
            await _fulfill_order(o)
        except Exception:
            pass
    return len(orders)

@api_router.post("/admin/digiflazz/retry-pending")
async def dgf_retry_pending(admin: dict = Depends(get_admin_required)):
    n = await retry_pending_once()
    await log_activity(admin, 'retry', 'digiflazz', f'{n} pesanan pending dicek')
    return {'checked': n}

@api_router.post("/admin/orders/{order_id}/fulfill")
async def dgf_fulfill(order_id: str, admin: dict = Depends(get_admin_required)):
    order = await db.orders.find_one({'id': order_id})
    if not order:
        raise HTTPException(status_code=404, detail='Pesanan tidak ditemukan.')
    ff = await _fulfill_order(order)
    await log_activity(admin, 'fulfill', 'order', f"{order.get('invoice')} -> {ff.get('status')}")
    return ff

@api_router.post("/webhooks/digiflazz")
async def dgf_webhook(request: Request, x_hub_signature: Optional[str] = Header(None)):
    raw = await request.body()
    cfg = await integrations.get_config(integrations.DIGIFLAZZ)
    if not digiflazz.verify_webhook(cfg, raw, x_hub_signature):
        raise HTTPException(status_code=401, detail='Invalid webhook signature')
    import json as _json
    payload = _json.loads(raw or b'{}')
    data = payload.get('data', {})
    ref_id = data.get('ref_id')
    if ref_id:
        ff = {'refId': ref_id, 'status': data.get('status'), 'rc': data.get('rc'),
              'sn': data.get('sn'), 'message': data.get('message'), 'price': data.get('price')}
        update = {'digiflazz': ff}
        if data.get('status') == 'Gagal':
            update['status'] = 'failed'
        await db.orders.update_one({'invoice': ref_id}, {'$set': update})
    return {'ok': True}


app.include_router(api_router)
app.include_router(midtrans_payments.midtrans_router)
app.include_router(media_lib.media_router)
app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

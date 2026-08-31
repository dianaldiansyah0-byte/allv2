"""Midtrans Snap payment gateway.

Flow: server creates a Snap token for an existing order (amount always taken
from MongoDB, never from the client) -> frontend opens the Snap popup ->
Midtrans sends an HTTP notification -> signature (SHA512) is verified, the
transaction is re-checked against Midtrans Get Status API, then the order is
marked paid exactly once and forwarded to Digiflazz for fulfillment.
"""
import hashlib
import hmac
import logging
import os
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Dict, Optional

import midtransclient
from fastapi import APIRouter, Depends, HTTPException, Request
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from starlette.concurrency import run_in_threadpool

import integrations

logger = logging.getLogger(__name__)

_mongo = AsyncIOMotorClient(os.environ['MONGO_URL'])
_db = _mongo[os.environ['DB_NAME']]

midtrans_router = APIRouter(prefix="/api")

# Maps our internal payment method id -> Midtrans Snap `enabled_payments` codes
CHANNEL_MAP = {
    'qris': ['other_qris', 'gopay'],
    'gopay': ['gopay', 'other_qris'],
    'dana': ['other_qris'],
    'ovo': ['other_qris'],
    'shopeepay': ['shopeepay', 'other_qris'],
    'bca': ['bca_va'],
    'mandiri': ['echannel'],
    'bni': ['bni_va'],
    'bri': ['bri_va'],
    'permata': ['permata_va'],
    'alfamart': ['alfamart'],
    'indomaret': ['indomaret'],
    'cc': ['credit_card'],
    'card': ['credit_card'],
}

TERMINAL_PAID = ('settlement', 'capture')


class CheckoutInput(BaseModel):
    invoice: str


async def _cfg() -> Dict[str, Any]:
    return await integrations.get_config(integrations.MIDTRANS)


def _require(cfg: Dict[str, Any]):
    if not cfg.get('enabled', True):
        raise HTTPException(status_code=400, detail='Midtrans dinonaktifkan oleh admin.')
    if not (cfg.get('serverKey') and cfg.get('clientKey')):
        raise HTTPException(status_code=400,
                            detail='Midtrans belum dikonfigurasi. Isi Server Key & Client Key di panel admin.')


def _snap(cfg: Dict[str, Any]):
    return midtransclient.Snap(is_production=bool(cfg.get('isProduction')),
                              server_key=cfg.get('serverKey'), client_key=cfg.get('clientKey'))


def _core(cfg: Dict[str, Any]):
    return midtransclient.CoreApi(is_production=bool(cfg.get('isProduction')),
                                  server_key=cfg.get('serverKey'), client_key=cfg.get('clientKey'))


def _clean(doc):
    if doc:
        doc.pop('_id', None)
    return doc


def _now():
    return datetime.now(timezone.utc)


async def _enabled_payments(order: dict) -> Optional[list]:
    """Only restrict Snap channels when the admin explicitly configures it -
    otherwise Midtrans shows every channel activated on the merchant account."""
    pid = (order.get('paymentId') or '').lower()
    pay_doc = await _db.payments.find_one({'id': pid}) or {}
    override = pay_doc.get('midtransChannels')
    if isinstance(override, str):
        override = [c.strip() for c in override.split(',') if c.strip()]
    if override:
        return override
    site = await _db.settings.find_one({'id': 'site'}) or {}
    if site.get('midtransRestrictChannels'):
        return CHANNEL_MAP.get(pid)
    return None


# ==================== PUBLIC ====================
@midtrans_router.get("/payments/config")
async def payment_config():
    """Public config for Snap.js. Server Key is never exposed."""
    cfg = await _cfg()
    return {
        'provider': 'midtrans',
        'enabled': bool(cfg.get('enabled', True) and cfg.get('serverKey') and cfg.get('clientKey')),
        'clientKey': cfg.get('clientKey', ''),
        'snapJsUrl': integrations.snap_js_url(cfg),
        'mode': 'production' if cfg.get('isProduction') else 'sandbox',
    }


@midtrans_router.post("/payments/checkout")
async def create_checkout(inp: CheckoutInput):
    cfg = await _cfg()
    _require(cfg)

    order = await _db.orders.find_one({'$or': [{'invoice': inp.invoice}, {'id': inp.invoice}]})
    if not order:
        raise HTTPException(status_code=404, detail='Pesanan tidak ditemukan.')
    if order.get('status') == 'success':
        raise HTTPException(status_code=400, detail='Pesanan ini sudah dibayar.')

    amount = int(round(float(order.get('total') or 0)))
    if amount <= 0:
        raise HTTPException(status_code=400, detail='Total pesanan tidak valid.')

    invoice = order['invoice']
    # Reuse an unpaid token for the same amount, otherwise create a new attempt
    existing = await _db.payment_transactions.find_one(
        {'invoice': invoice, 'payment_status': {'$nin': ['paid', 'expire', 'cancel', 'deny']},
         'amount': amount, 'token': {'$ne': None}}, sort=[('created_at', -1)])
    if existing:
        return {'orderId': existing['order_id'], 'token': existing['token'],
                'redirectUrl': existing.get('redirect_url'), 'invoice': invoice, 'amount': amount}

    attempt = await _db.payment_transactions.count_documents({'invoice': invoice}) + 1
    order_id = f"{invoice}-{attempt}"

    item_name = f"{order.get('gameName', 'Top Up')} - {order.get('denomName', '')}".strip()[:50] or 'Top Up'
    param: Dict[str, Any] = {
        'transaction_details': {'order_id': order_id, 'gross_amount': amount},
        'item_details': [{'id': (order.get('denomId') or order.get('gameSlug') or 'item')[:50],
                          'price': amount, 'quantity': 1, 'name': item_name}],
        'customer_details': {
            'first_name': (order.get('userName') or 'Pelanggan')[:40],
            'email': order.get('email') or 'noreply@allv2store.com',
        },
        'credit_card': {'secure': True},
    }
    channels = await _enabled_payments(order)
    if channels:
        param['enabled_payments'] = channels

    try:
        result = await run_in_threadpool(_snap(cfg).create_transaction, param)
    except Exception as exc:
        logger.warning(f"Midtrans snap token failed: {exc}")
        raise HTTPException(status_code=502, detail=f'Gagal membuat transaksi Midtrans: {str(exc)[:180]}')

    await _db.payment_transactions.insert_one({
        'order_id': order_id, 'invoice': invoice, 'amount': amount, 'currency': 'IDR',
        'token': result.get('token'), 'redirect_url': result.get('redirect_url'),
        'status': 'initiated', 'payment_status': 'pending', 'provider': 'midtrans',
        'mode': 'production' if cfg.get('isProduction') else 'sandbox',
        'created_at': _now(), 'updated_at': _now(),
    })
    return {'orderId': order_id, 'token': result.get('token'),
            'redirectUrl': result.get('redirect_url'), 'invoice': invoice, 'amount': amount}


async def _fulfill_paid(tx: dict):
    """Mark linked order paid exactly once and hand it to Digiflazz."""
    invoice = tx.get('invoice')
    if not invoice:
        return
    res = await _db.orders.update_one(
        {'invoice': invoice, 'status': {'$ne': 'success'}},
        {'$set': {'status': 'success', 'paidAt': _now().isoformat(),
                  'paymentProvider': 'midtrans', 'midtransOrderId': tx.get('order_id')}})
    if res.modified_count != 1:
        return  # already handled - keeps Midtrans retries idempotent
    try:
        import server
        fresh = await _db.orders.find_one({'invoice': invoice})
        await server._fulfill_order(fresh)
    except Exception as exc:
        logger.warning(f"Fulfillment after Midtrans payment failed: {exc}")


async def _apply_status(order_id: str, snapshot: Dict[str, Any]) -> Dict[str, Any]:
    tx = await _db.payment_transactions.find_one({'order_id': order_id})
    if not tx:
        raise HTTPException(status_code=404, detail='Transaksi tidak ditemukan.')

    status = (snapshot.get('transaction_status') or '').lower()
    fraud = (snapshot.get('fraud_status') or '').lower()

    gross = snapshot.get('gross_amount')
    if gross is not None:
        try:
            if Decimal(str(gross)) != Decimal(str(tx['amount'])):
                raise HTTPException(status_code=400, detail='Jumlah pembayaran tidak sesuai.')
        except (ValueError, ArithmeticError):
            pass

    if tx.get('payment_status') == 'paid':
        return tx  # terminal state, ignore stale notifications

    base = {'midtrans': {k: snapshot.get(k) for k in
                         ('transaction_status', 'fraud_status', 'payment_type', 'status_code',
                          'gross_amount', 'transaction_time', 'settlement_time', 'va_numbers',
                          'permata_va_number', 'biller_code', 'bill_key', 'store')},
            'updated_at': _now()}

    if status in TERMINAL_PAID and (status != 'capture' or fraud in ('accept', '')):
        await _db.payment_transactions.update_one(
            {'order_id': order_id, 'payment_status': {'$ne': 'paid'}},
            {'$set': {**base, 'status': 'completed', 'payment_status': 'paid', 'paid_at': _now()}})
        fresh = await _db.payment_transactions.find_one({'order_id': order_id})
        await _fulfill_paid(fresh)
        return fresh

    if status in ('deny', 'cancel', 'expire', 'failure'):
        await _db.payment_transactions.update_one({'order_id': order_id},
            {'$set': {**base, 'status': status, 'payment_status': status}})
        await _db.orders.update_one({'invoice': tx['invoice'], 'status': {'$ne': 'success'}},
                                    {'$set': {'status': 'failed' if status != 'expire' else 'expired'}})
    elif status in ('pending', 'authorize'):
        await _db.payment_transactions.update_one({'order_id': order_id},
            {'$set': {**base, 'status': 'pending', 'payment_status': 'pending'}})
    else:
        await _db.payment_transactions.update_one({'order_id': order_id}, {'$set': base})

    return await _db.payment_transactions.find_one({'order_id': order_id})


@midtrans_router.get("/payments/status/{order_id}")
async def payment_status(order_id: str):
    tx = await _db.payment_transactions.find_one({'order_id': order_id})
    if not tx:
        raise HTTPException(status_code=404, detail='Transaksi tidak ditemukan.')
    if tx.get('payment_status') != 'paid':
        cfg = await _cfg()
        if cfg.get('serverKey'):
            try:
                snapshot = await run_in_threadpool(_core(cfg).transactions.status, order_id)
                tx = await _apply_status(order_id, snapshot)
            except HTTPException:
                raise
            except Exception as exc:
                logger.info(f"Midtrans status check for {order_id}: {exc}")
    order = await _db.orders.find_one({'invoice': tx.get('invoice')}) or {}
    return {
        'orderId': tx['order_id'], 'invoice': tx.get('invoice'),
        'status': tx.get('status'), 'paymentStatus': tx.get('payment_status'),
        'amount': tx.get('amount'), 'midtrans': tx.get('midtrans'),
        'orderStatus': order.get('status'), 'digiflazz': order.get('digiflazz'),
    }


@midtrans_router.post("/payments/midtrans/notification")
async def midtrans_notification(request: Request):
    payload = await request.json()
    cfg = await _cfg()
    server_key = cfg.get('serverKey') or ''
    order_id = str(payload.get('order_id') or '')
    raw = f"{order_id}{payload.get('status_code', '')}{payload.get('gross_amount', '')}{server_key}"
    expected = hashlib.sha512(raw.encode('utf-8')).hexdigest()
    supplied = str(payload.get('signature_key') or '')
    if not (supplied and hmac.compare_digest(expected, supplied)):
        raise HTTPException(status_code=403, detail='Signature tidak valid.')

    snapshot = payload
    try:  # challenge the notification against Midtrans itself
        snapshot = await run_in_threadpool(_core(cfg).transactions.status, order_id)
    except Exception as exc:
        logger.info(f"Notification re-check failed for {order_id}, using payload: {exc}")
    await _apply_status(order_id, snapshot)
    return {'ok': True}


# ==================== HELPERS FOR ADMIN ROUTES (server.py) ====================
async def test_connection(cfg: Dict[str, Any]) -> Dict[str, Any]:
    """Validate credentials by creating a tiny throwaway Snap token."""
    _require(cfg)
    probe_id = 'PROBE-' + _now().strftime('%Y%m%d%H%M%S%f')
    param = {
        'transaction_details': {'order_id': probe_id, 'gross_amount': 10000},
        'item_details': [{'id': 'probe', 'price': 10000, 'quantity': 1, 'name': 'Uji Koneksi'}],
        'customer_details': {'first_name': 'Uji', 'email': 'noreply@allv2store.com'},
    }
    try:
        result = await run_in_threadpool(_snap(cfg).create_transaction, param)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f'Koneksi Midtrans gagal: {str(exc)[:200]}')
    return {'ok': True, 'mode': 'production' if cfg.get('isProduction') else 'sandbox',
            'tokenSample': (result.get('token') or '')[:12] + '...',
            'message': 'Kredensial Midtrans valid dan siap dipakai.'}


async def list_transactions(limit: int = 200) -> list:
    docs = await _db.payment_transactions.find().sort('created_at', -1).to_list(limit)
    out = []
    for d in docs:
        d = _clean(d)
        for k in ('created_at', 'updated_at', 'paid_at'):
            if isinstance(d.get(k), datetime):
                d[k] = d[k].isoformat()
        out.append(d)
    return out


async def refresh_transaction(order_id: str) -> Dict[str, Any]:
    cfg = await _cfg()
    _require(cfg)
    try:
        snapshot = await run_in_threadpool(_core(cfg).transactions.status, order_id)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f'Gagal cek status: {str(exc)[:180]}')
    tx = await _apply_status(order_id, snapshot)
    tx = _clean(tx)
    for k in ('created_at', 'updated_at', 'paid_at'):
        if isinstance(tx.get(k), datetime):
            tx[k] = tx[k].isoformat()
    return tx

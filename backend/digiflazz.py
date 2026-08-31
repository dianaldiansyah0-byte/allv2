"""Digiflazz H2H integration service.

Credentials are supplied per-call as a config dict coming from the admin panel
(stored in MongoDB via integrations.py), so they can be changed at runtime
without restarting the backend.
"""
import hashlib
import hmac
from typing import Any, Dict, Optional

import httpx

BASE = "https://api.digiflazz.com/v1"


def active_key(cfg: Dict[str, Any]) -> str:
    return (cfg.get('prodKey') or '') if cfg.get('mode') == 'production' else (cfg.get('devKey') or '')


def is_configured(cfg: Dict[str, Any]) -> bool:
    return bool(cfg and cfg.get('enabled', True) and cfg.get('username') and active_key(cfg))


def sign(cfg: Dict[str, Any], suffix: str) -> str:
    raw = ((cfg.get('username') or '') + active_key(cfg) + suffix).encode('utf-8')
    return hashlib.md5(raw).hexdigest()


async def _post(endpoint: str, payload: dict) -> dict:
    async with httpx.AsyncClient(base_url=BASE, timeout=25) as http:
        r = await http.post("/" + endpoint, json=payload)
        r.raise_for_status()
        return r.json()


async def check_balance(cfg: Dict[str, Any]) -> dict:
    return await _post("cek-saldo", {
        "cmd": "deposit", "username": cfg.get('username'), "sign": sign(cfg, "depo"),
    })


async def price_list(cfg: Dict[str, Any]) -> dict:
    return await _post("price-list", {
        "cmd": "prepaid", "username": cfg.get('username'), "sign": sign(cfg, "pricelist"),
    })


async def transaction(cfg: Dict[str, Any], buyer_sku_code: str, customer_no: str,
                      ref_id: str, cb_url: Optional[str] = None) -> dict:
    payload = {
        "username": cfg.get('username'),
        "buyer_sku_code": buyer_sku_code,
        "customer_no": customer_no,
        "ref_id": ref_id,
        "sign": sign(cfg, ref_id),
        "testing": cfg.get('mode') != 'production',
    }
    if cb_url:
        payload["cb_url"] = cb_url
    return await _post("transaction", payload)


def verify_webhook(cfg: Dict[str, Any], raw_body: bytes, signature_header: Optional[str]) -> bool:
    secret = cfg.get('webhookSecret') or ''
    if not signature_header or not secret:
        return False
    expected = "sha1=" + hmac.new(secret.encode(), raw_body, hashlib.sha1).hexdigest()
    return hmac.compare_digest(signature_header, expected)

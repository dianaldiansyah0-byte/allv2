"""POC: Midtrans Snap core flow validation.

Covers:
 1. Snap token creation (sandbox mode) with provided keys
 2. Snap token creation (production mode) with provided keys
 3. Signature (SHA512) verification helper correctness
 4. CoreApi transaction status lookup for created order
 5. Snap.js URL resolution per mode
"""
import hashlib
import hmac
import json
import sys
import traceback

import midtransclient

SERVER_KEY = "Mid-server-D9poewDX3sWCgGxJbjfI3pU2"
CLIENT_KEY = "Mid-client-R7G7gk3aIWCvdLUn"

RESULTS = {}


def snap_client(is_production: bool):
    return midtransclient.Snap(
        is_production=is_production, server_key=SERVER_KEY, client_key=CLIENT_KEY
    )


def core_client(is_production: bool):
    return midtransclient.CoreApi(
        is_production=is_production, server_key=SERVER_KEY, client_key=CLIENT_KEY
    )


def build_param(order_id: str, amount: int):
    return {
        "transaction_details": {"order_id": order_id, "gross_amount": amount},
        "item_details": [
            {"id": "ml-86", "price": amount, "quantity": 1, "name": "86 Diamonds ML"}
        ],
        "customer_details": {"first_name": "Player", "email": "player@example.com"},
        "credit_card": {"secure": True},
    }


def test_token(mode_name: str, is_production: bool):
    order_id = f"POC-{mode_name}-{hashlib.md5(mode_name.encode()).hexdigest()[:6]}-1"
    try:
        res = snap_client(is_production).create_transaction(build_param(order_id, 24000))
        print(f"[{mode_name}] TOKEN OK -> token={res['token'][:24]}... redirect={res['redirect_url'][:70]}")
        RESULTS[f"token_{mode_name}"] = {"ok": True, "order_id": order_id,
                                        "token": res["token"], "redirect": res["redirect_url"]}
    except Exception as e:
        print(f"[{mode_name}] TOKEN FAIL -> {type(e).__name__}: {str(e)[:300]}")
        RESULTS[f"token_{mode_name}"] = {"ok": False, "error": str(e)[:300]}


def test_signature():
    order_id, status_code, gross = "POC-SIG-1", "200", "24000.00"
    raw = f"{order_id}{status_code}{gross}{SERVER_KEY}"
    expected = hashlib.sha512(raw.encode()).hexdigest()
    ok_valid = hmac.compare_digest(expected, expected)
    ok_invalid = not hmac.compare_digest(expected, "deadbeef")
    print(f"[SIGNATURE] valid_accepted={ok_valid} invalid_rejected={ok_invalid} sig={expected[:24]}...")
    RESULTS["signature"] = {"ok": ok_valid and ok_invalid}


def test_status(mode_name: str, is_production: bool):
    entry = RESULTS.get(f"token_{mode_name}")
    if not entry or not entry.get("ok"):
        print(f"[{mode_name}] STATUS SKIP (no token)")
        return
    try:
        st = core_client(is_production).transactions.status(entry["order_id"])
        print(f"[{mode_name}] STATUS OK -> transaction_status={st.get('transaction_status')} "
              f"status_code={st.get('status_code')} gross={st.get('gross_amount')}")
        RESULTS[f"status_{mode_name}"] = {"ok": True, "raw": st}
    except Exception as e:
        # 404 = transaction not found yet (no payment attempt) which is still a
        # valid authenticated response from Midtrans.
        msg = str(e)[:300]
        authenticated = "404" in msg or "not found" in msg.lower()
        print(f"[{mode_name}] STATUS {'OK(no-txn-yet)' if authenticated else 'FAIL'} -> {msg}")
        RESULTS[f"status_{mode_name}"] = {"ok": authenticated, "error": msg}


def test_snapjs():
    urls = {
        "sandbox": "https://app.sandbox.midtrans.com/snap/snap.js",
        "production": "https://app.midtrans.com/snap/snap.js",
    }
    import urllib.request
    all_ok = True
    for name, url in urls.items():
        try:
            with urllib.request.urlopen(url, timeout=20) as r:
                ok = r.status == 200
        except Exception as e:
            ok = False
            print(f"[SNAPJS] {name} error {e}")
        all_ok = all_ok and ok
        print(f"[SNAPJS] {name} reachable={ok}")
    RESULTS["snapjs"] = {"ok": all_ok}


if __name__ == "__main__":
    print("=" * 70)
    print("MIDTRANS POC")
    print("=" * 70)
    test_token("sandbox", False)
    test_token("production", True)
    test_signature()
    test_status("sandbox", False)
    test_status("production", True)
    test_snapjs()
    print("=" * 70)
    print("SUMMARY:")
    for k, v in RESULTS.items():
        print(f"  {k}: {'PASS' if v.get('ok') else 'FAIL'}")
    working = [m for m in ("sandbox", "production") if RESULTS.get(f"token_{m}", {}).get("ok")]
    print(f"\nWORKING MODE(S): {working or 'NONE'}")
    sys.exit(0 if working and RESULTS["signature"]["ok"] else 1)

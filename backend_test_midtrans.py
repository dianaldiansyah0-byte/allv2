#!/usr/bin/env python3
"""
Backend API Test Suite for Allv2Store - Midtrans Integration & New Features
Tests Midtrans payment gateway, media library, settings, and Digiflazz credential management
"""

import requests
import json
import time
import hashlib
import base64
from datetime import datetime

# Base URL from frontend/.env
BASE_URL = "https://github-live-test.preview.emergentagent.com/api"

# Admin credentials from test_credentials.md
ADMIN_CREDS = {
    "email": "admin@allv2.com",
    "password": "Admin@12345"
}

# Color codes for output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

# Test results tracking
results = {
    "total": 0,
    "passed": 0,
    "failed": 0,
    "tests": [],
    "critical_failures": []
}

def log_test(name, passed, details=""):
    status = f"{GREEN}✓ PASS{RESET}" if passed else f"{RED}✗ FAIL{RESET}"
    print(f"{status} | {name}")
    if details:
        print(f"       {details}")
    return passed

def log_section(name):
    print(f"\n{BLUE}{'='*80}{RESET}")
    print(f"{BLUE}{name}{RESET}")
    print(f"{BLUE}{'='*80}{RESET}")

def record_result(test_name, passed, details="", critical=False):
    results["total"] += 1
    if passed:
        results["passed"] += 1
    else:
        results["failed"] += 1
        if critical:
            results["critical_failures"].append(test_name)
    results["tests"].append({
        "name": test_name,
        "passed": passed,
        "details": details,
        "critical": critical
    })
    return log_test(test_name, passed, details)

# ============================================================
# 1. STRIPE REMOVAL VERIFICATION
# ============================================================

def test_stripe_removal():
    log_section("1. STRIPE REMOVAL VERIFICATION")
    
    # Test 1.1: Verify no Stripe routes exist
    stripe_routes = [
        "/payments/status/cs_test_",  # Stripe session ID format
        "/payments/stripe/webhook",
        "/payments/create-checkout-session"
    ]
    
    all_removed = True
    for route in stripe_routes:
        try:
            resp = requests.get(f"{BASE_URL}{route}", timeout=5)
            if resp.status_code != 404:
                all_removed = False
                record_result(f"Stripe route {route} removed", False, f"Got {resp.status_code}, expected 404", critical=True)
            else:
                record_result(f"Stripe route {route} removed", True, "404 as expected")
        except Exception as e:
            record_result(f"Stripe route {route} removed", False, f"Exception: {str(e)}", critical=True)
    
    return all_removed

# ============================================================
# 2. MIDTRANS PAYMENT CONFIG
# ============================================================

def test_midtrans_config():
    log_section("2. MIDTRANS PAYMENT CONFIG")
    
    # Test 2.1: GET /api/payments/config
    try:
        resp = requests.get(f"{BASE_URL}/payments/config", timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            checks = {
                "provider": data.get("provider") == "midtrans",
                "enabled": data.get("enabled") == True,
                "clientKey": data.get("clientKey", "").startswith("Mid-client-"),
                "snapJsUrl": data.get("snapJsUrl") == "https://app.midtrans.com/snap/snap.js",
                "mode": data.get("mode") == "production"
            }
            
            if all(checks.values()):
                record_result("GET /payments/config returns Midtrans production config", True, 
                            f"provider=midtrans, enabled=true, mode=production, clientKey={data.get('clientKey')[:15]}...")
                return data
            else:
                failed_checks = [k for k, v in checks.items() if not v]
                record_result("GET /payments/config returns Midtrans production config", False, 
                            f"Failed checks: {failed_checks}, data: {data}", critical=True)
                return None
        else:
            record_result("GET /payments/config returns Midtrans production config", False, 
                        f"Status {resp.status_code}: {resp.text}", critical=True)
            return None
    except Exception as e:
        record_result("GET /payments/config returns Midtrans production config", False, 
                    f"Exception: {str(e)}", critical=True)
        return None

# ============================================================
# 3. MIDTRANS CHECKOUT & STATUS
# ============================================================

def test_midtrans_checkout(admin_token):
    log_section("3. MIDTRANS CHECKOUT & STATUS")
    
    if not admin_token:
        record_result("Midtrans checkout tests", False, "No admin token", critical=True)
        return None
    
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Create a test order first
    test_order = {
        "gameSlug": "mobile-legends",
        "gameName": "Mobile Legends",
        "denomId": "ml-test",
        "denomName": "Test Diamonds",
        "account": {"userId": "12345"},
        "payment": "qris",
        "paymentId": "qris",
        "subtotal": 10000,
        "fee": 0,
        "discount": 0,
        "total": 10000,
        "email": "test@example.com"
    }
    
    try:
        resp = requests.post(f"{BASE_URL}/orders", json=test_order, headers=headers, timeout=10)
        if resp.status_code == 200:
            order = resp.json()
            invoice = order.get("invoice")
            record_result("Create test order for Midtrans checkout", True, f"Invoice: {invoice}")
        else:
            record_result("Create test order for Midtrans checkout", False, 
                        f"Status {resp.status_code}: {resp.text}", critical=True)
            return None
    except Exception as e:
        record_result("Create test order for Midtrans checkout", False, f"Exception: {str(e)}", critical=True)
        return None
    
    # Test 3.1: POST /api/payments/checkout with valid invoice
    try:
        checkout_data = {"invoice": invoice}
        resp = requests.post(f"{BASE_URL}/payments/checkout", json=checkout_data, timeout=15)
        if resp.status_code == 200:
            data = resp.json()
            checks = {
                "orderId": data.get("orderId", "").startswith(invoice),
                "token": bool(data.get("token")),
                "invoice": data.get("invoice") == invoice,
                "amount": data.get("amount") == 10000
            }
            
            if all(checks.values()):
                order_id = data.get("orderId")
                token = data.get("token")
                record_result("POST /payments/checkout returns token for valid invoice", True, 
                            f"orderId={order_id}, token={token[:20]}..., amount=10000")
                
                # Test 3.2: Repeated call reuses token
                resp2 = requests.post(f"{BASE_URL}/payments/checkout", json=checkout_data, timeout=15)
                if resp2.status_code == 200:
                    data2 = resp2.json()
                    if data2.get("token") == token and data2.get("orderId") == order_id:
                        record_result("POST /payments/checkout reuses token for same unpaid order", True, 
                                    "Same token and orderId returned")
                    else:
                        record_result("POST /payments/checkout reuses token for same unpaid order", False, 
                                    f"Different token or orderId: {data2}")
                
                # Test 3.3: GET /api/payments/status/{order_id}
                resp3 = requests.get(f"{BASE_URL}/payments/status/{order_id}", timeout=10)
                if resp3.status_code == 200:
                    status_data = resp3.json()
                    if (status_data.get("orderId") == order_id and 
                        status_data.get("invoice") == invoice and
                        status_data.get("paymentStatus") == "pending"):
                        record_result("GET /payments/status/{order_id} returns pending status", True, 
                                    f"orderId={order_id}, paymentStatus=pending")
                    else:
                        record_result("GET /payments/status/{order_id} returns pending status", False, 
                                    f"Unexpected data: {status_data}")
                else:
                    record_result("GET /payments/status/{order_id} returns pending status", False, 
                                f"Status {resp3.status_code}: {resp3.text}")
                
                return order_id
            else:
                failed_checks = [k for k, v in checks.items() if not v]
                record_result("POST /payments/checkout returns token for valid invoice", False, 
                            f"Failed checks: {failed_checks}, data: {data}", critical=True)
                return None
        else:
            record_result("POST /payments/checkout returns token for valid invoice", False, 
                        f"Status {resp.status_code}: {resp.text}", critical=True)
            return None
    except Exception as e:
        record_result("POST /payments/checkout returns token for valid invoice", False, 
                    f"Exception: {str(e)}", critical=True)
        return None

def test_midtrans_checkout_errors():
    log_section("3B. MIDTRANS CHECKOUT ERROR CASES")
    
    # Test 3.4: POST /payments/checkout with unknown invoice (404)
    try:
        resp = requests.post(f"{BASE_URL}/payments/checkout", json={"invoice": "UNKNOWN123"}, timeout=10)
        if resp.status_code == 404:
            record_result("POST /payments/checkout returns 404 for unknown invoice", True, "Correct error")
        else:
            record_result("POST /payments/checkout returns 404 for unknown invoice", False, 
                        f"Expected 404, got {resp.status_code}")
    except Exception as e:
        record_result("POST /payments/checkout returns 404 for unknown invoice", False, f"Exception: {str(e)}")
    
    # Test 3.5: GET /payments/status/{order_id} for unknown order (404)
    try:
        resp = requests.get(f"{BASE_URL}/payments/status/UNKNOWN-ORDER-123", timeout=10)
        if resp.status_code == 404:
            record_result("GET /payments/status/{order_id} returns 404 for unknown order", True, "Correct error")
        else:
            record_result("GET /payments/status/{order_id} returns 404 for unknown order", False, 
                        f"Expected 404, got {resp.status_code}")
    except Exception as e:
        record_result("GET /payments/status/{order_id} returns 404 for unknown order", False, f"Exception: {str(e)}")

# ============================================================
# 4. MIDTRANS NOTIFICATION WEBHOOK
# ============================================================

def test_midtrans_notification():
    log_section("4. MIDTRANS NOTIFICATION WEBHOOK")
    
    # Test 4.1: POST /payments/midtrans/notification without signature (403)
    try:
        payload = {
            "order_id": "TEST-1",
            "status_code": "200",
            "gross_amount": "10000",
            "transaction_status": "settlement"
        }
        resp = requests.post(f"{BASE_URL}/payments/midtrans/notification", json=payload, timeout=10)
        if resp.status_code == 403:
            record_result("POST /payments/midtrans/notification rejects missing signature", True, "403 as expected")
        else:
            record_result("POST /payments/midtrans/notification rejects missing signature", False, 
                        f"Expected 403, got {resp.status_code}")
    except Exception as e:
        record_result("POST /payments/midtrans/notification rejects missing signature", False, f"Exception: {str(e)}")
    
    # Test 4.2: POST /payments/midtrans/notification with wrong signature (403)
    try:
        payload = {
            "order_id": "TEST-1",
            "status_code": "200",
            "gross_amount": "10000",
            "transaction_status": "settlement",
            "signature_key": "wrong_signature"
        }
        resp = requests.post(f"{BASE_URL}/payments/midtrans/notification", json=payload, timeout=10)
        if resp.status_code == 403:
            record_result("POST /payments/midtrans/notification rejects wrong signature", True, "403 as expected")
        else:
            record_result("POST /payments/midtrans/notification rejects wrong signature", False, 
                        f"Expected 403, got {resp.status_code}")
    except Exception as e:
        record_result("POST /payments/midtrans/notification rejects wrong signature", False, f"Exception: {str(e)}")

# ============================================================
# 5. ADMIN MIDTRANS INTEGRATION
# ============================================================

def test_admin_midtrans(admin_token):
    log_section("5. ADMIN MIDTRANS INTEGRATION")
    
    if not admin_token:
        record_result("Admin Midtrans tests", False, "No admin token", critical=True)
        return
    
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Test 5.1: GET /admin/integrations/midtrans
    try:
        resp = requests.get(f"{BASE_URL}/admin/integrations/midtrans", headers=headers, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            checks = {
                "configured": data.get("configured") == True,
                "isProduction": data.get("isProduction") == True,
                "mode": data.get("mode") == "production",
                "enabled": data.get("enabled") == True,
                "serverKeyMasked": "****" in data.get("serverKeyMasked", ""),
                "clientKey": data.get("clientKey", "").startswith("Mid-client-")
            }
            
            if all(checks.values()):
                record_result("GET /admin/integrations/midtrans returns masked config", True, 
                            f"configured=true, mode=production, serverKey masked, clientKey={data.get('clientKey')[:15]}...")
            else:
                failed_checks = [k for k, v in checks.items() if not v]
                record_result("GET /admin/integrations/midtrans returns masked config", False, 
                            f"Failed checks: {failed_checks}, data: {data}")
        else:
            record_result("GET /admin/integrations/midtrans returns masked config", False, 
                        f"Status {resp.status_code}: {resp.text}")
    except Exception as e:
        record_result("GET /admin/integrations/midtrans returns masked config", False, f"Exception: {str(e)}")
    
    # Test 5.2: PUT /admin/integrations/midtrans (update enabled flag)
    try:
        update_data = {"enabled": True, "isProduction": True}
        resp = requests.put(f"{BASE_URL}/admin/integrations/midtrans", json=update_data, headers=headers, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            if data.get("enabled") == True:
                record_result("PUT /admin/integrations/midtrans saves config", True, "enabled=true saved")
            else:
                record_result("PUT /admin/integrations/midtrans saves config", False, f"enabled should be true, got {data}")
        else:
            record_result("PUT /admin/integrations/midtrans saves config", False, 
                        f"Status {resp.status_code}: {resp.text}")
    except Exception as e:
        record_result("PUT /admin/integrations/midtrans saves config", False, f"Exception: {str(e)}")
    
    # Test 5.3: POST /admin/integrations/midtrans/test
    try:
        resp = requests.post(f"{BASE_URL}/admin/integrations/midtrans/test", headers=headers, timeout=15)
        if resp.status_code == 200:
            data = resp.json()
            if data.get("ok") == True and "tokenSample" in data:
                record_result("POST /admin/integrations/midtrans/test returns ok with token sample", True, 
                            f"ok=true, tokenSample={data.get('tokenSample')}, message={data.get('message')}")
            else:
                record_result("POST /admin/integrations/midtrans/test returns ok with token sample", False, 
                            f"Expected ok=true and tokenSample, got {data}")
        else:
            record_result("POST /admin/integrations/midtrans/test returns ok with token sample", False, 
                        f"Status {resp.status_code}: {resp.text}")
    except Exception as e:
        record_result("POST /admin/integrations/midtrans/test returns ok with token sample", False, f"Exception: {str(e)}")
    
    # Test 5.4: GET /admin/midtrans/transactions
    try:
        resp = requests.get(f"{BASE_URL}/admin/midtrans/transactions", headers=headers, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            if isinstance(data, list):
                record_result("GET /admin/midtrans/transactions returns list", True, f"Found {len(data)} transactions")
            else:
                record_result("GET /admin/midtrans/transactions returns list", False, "Response is not a list")
        else:
            record_result("GET /admin/midtrans/transactions returns list", False, 
                        f"Status {resp.status_code}: {resp.text}")
    except Exception as e:
        record_result("GET /admin/midtrans/transactions returns list", False, f"Exception: {str(e)}")

# ============================================================
# 6. ADMIN DIGIFLAZZ CREDENTIALS
# ============================================================

def test_admin_digiflazz(admin_token):
    log_section("6. ADMIN DIGIFLAZZ CREDENTIALS")
    
    if not admin_token:
        record_result("Admin Digiflazz tests", False, "No admin token", critical=True)
        return
    
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Test 6.1: GET /admin/integrations/digiflazz (initial state)
    try:
        resp = requests.get(f"{BASE_URL}/admin/integrations/digiflazz", headers=headers, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            record_result("GET /admin/integrations/digiflazz returns status", True, 
                        f"configured={data.get('configured')}, mode={data.get('mode')}, enabled={data.get('enabled')}")
        else:
            record_result("GET /admin/integrations/digiflazz returns status", False, 
                        f"Status {resp.status_code}: {resp.text}")
    except Exception as e:
        record_result("GET /admin/integrations/digiflazz returns status", False, f"Exception: {str(e)}")
    
    # Test 6.2: PUT /admin/integrations/digiflazz (save fake credentials)
    try:
        fake_creds = {
            "username": "test_user",
            "devKey": "fake_dev_key_12345",
            "prodKey": "fake_prod_key_67890",
            "mode": "development",
            "webhookSecret": "fake_webhook_secret",
            "enabled": True
        }
        resp = requests.put(f"{BASE_URL}/admin/integrations/digiflazz", json=fake_creds, headers=headers, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            if (data.get("configured") == True and 
                data.get("username") == "test_user" and
                data.get("mode") == "development" and
                data.get("hasDevKey") == True):
                record_result("PUT /admin/integrations/digiflazz saves credentials", True, 
                            f"configured=true, username=test_user, mode=development, hasDevKey=true")
            else:
                record_result("PUT /admin/integrations/digiflazz saves credentials", False, 
                            f"Unexpected response: {data}")
        else:
            record_result("PUT /admin/integrations/digiflazz saves credentials", False, 
                        f"Status {resp.status_code}: {resp.text}")
    except Exception as e:
        record_result("PUT /admin/integrations/digiflazz saves credentials", False, f"Exception: {str(e)}")
    
    # Test 6.3: GET /admin/digiflazz/status
    try:
        resp = requests.get(f"{BASE_URL}/admin/digiflazz/status", headers=headers, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            record_result("GET /admin/digiflazz/status returns status", True, 
                        f"configured={data.get('configured')}, mode={data.get('mode')}")
        else:
            record_result("GET /admin/digiflazz/status returns status", False, 
                        f"Status {resp.status_code}: {resp.text}")
    except Exception as e:
        record_result("GET /admin/digiflazz/status returns status", False, f"Exception: {str(e)}")
    
    # Test 6.4: GET /admin/digiflazz/balance (should return 400 or 502 with fake creds)
    try:
        resp = requests.get(f"{BASE_URL}/admin/digiflazz/balance", headers=headers, timeout=15)
        if resp.status_code in [400, 502]:
            data = resp.json()
            if "detail" in data:
                record_result("GET /admin/digiflazz/balance returns clean error for fake creds", True, 
                            f"Status {resp.status_code}, detail: {data.get('detail')[:100]}")
            else:
                record_result("GET /admin/digiflazz/balance returns clean error for fake creds", False, 
                            "Missing detail field in error response")
        elif resp.status_code == 500:
            record_result("GET /admin/digiflazz/balance returns clean error for fake creds", False, 
                        "Should return 400/502, not 500", critical=True)
        else:
            record_result("GET /admin/digiflazz/balance returns clean error for fake creds", False, 
                        f"Unexpected status {resp.status_code}: {resp.text}")
    except Exception as e:
        record_result("GET /admin/digiflazz/balance returns clean error for fake creds", False, f"Exception: {str(e)}")
    
    # Test 6.5: RESET Digiflazz config to blank
    try:
        reset_data = {
            "username": "",
            "devKey": "",
            "prodKey": "",
            "mode": "development",
            "webhookSecret": "",
            "enabled": True
        }
        resp = requests.put(f"{BASE_URL}/admin/integrations/digiflazz", json=reset_data, headers=headers, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            if data.get("configured") == False:
                record_result("RESET Digiflazz config to blank", True, "configured=false after reset")
            else:
                record_result("RESET Digiflazz config to blank", False, f"configured should be false, got {data}")
        else:
            record_result("RESET Digiflazz config to blank", False, f"Status {resp.status_code}: {resp.text}")
    except Exception as e:
        record_result("RESET Digiflazz config to blank", False, f"Exception: {str(e)}")

# ============================================================
# 7. MEDIA LIBRARY
# ============================================================

def test_media_library(admin_token):
    log_section("7. MEDIA LIBRARY")
    
    if not admin_token:
        record_result("Media library tests", False, "No admin token", critical=True)
        return
    
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Create a small test PNG (1x1 red pixel)
    png_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=="
    data_url = f"data:image/png;base64,{png_base64}"
    
    # Test 7.1: POST /admin/media with valid PNG
    media_id = None
    try:
        media_data = {
            "name": "test-image.png",
            "dataUrl": data_url,
            "usage": "test",
            "width": 1,
            "height": 1
        }
        resp = requests.post(f"{BASE_URL}/admin/media", json=media_data, headers=headers, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            if "id" in data and "url" in data:
                media_id = data.get("id")
                media_url = data.get("url")
                record_result("POST /admin/media creates image", True, 
                            f"id={media_id}, url={media_url}")
            else:
                record_result("POST /admin/media creates image", False, "Missing id or url in response")
        else:
            record_result("POST /admin/media creates image", False, 
                        f"Status {resp.status_code}: {resp.text}")
    except Exception as e:
        record_result("POST /admin/media creates image", False, f"Exception: {str(e)}")
    
    # Test 7.2: GET /media/{id} returns image
    if media_id:
        try:
            resp = requests.get(f"{BASE_URL}/media/{media_id}", timeout=10)
            if resp.status_code == 200:
                content_type = resp.headers.get("Content-Type", "")
                if "image" in content_type:
                    record_result("GET /media/{id} returns image with correct content-type", True, 
                                f"Content-Type: {content_type}, size: {len(resp.content)} bytes")
                else:
                    record_result("GET /media/{id} returns image with correct content-type", False, 
                                f"Expected image content-type, got {content_type}")
            else:
                record_result("GET /media/{id} returns image with correct content-type", False, 
                            f"Status {resp.status_code}: {resp.text}")
        except Exception as e:
            record_result("GET /media/{id} returns image with correct content-type", False, f"Exception: {str(e)}")
    
    # Test 7.3: GET /admin/media lists images
    try:
        resp = requests.get(f"{BASE_URL}/admin/media", headers=headers, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            if isinstance(data, list):
                found = any(item.get("id") == media_id for item in data) if media_id else True
                if found:
                    record_result("GET /admin/media lists images", True, f"Found {len(data)} images")
                else:
                    record_result("GET /admin/media lists images", False, "Created image not in list")
            else:
                record_result("GET /admin/media lists images", False, "Response is not a list")
        else:
            record_result("GET /admin/media lists images", False, 
                        f"Status {resp.status_code}: {resp.text}")
    except Exception as e:
        record_result("GET /admin/media lists images", False, f"Exception: {str(e)}")
    
    # Test 7.4: DELETE /admin/media/{id}
    if media_id:
        try:
            resp = requests.delete(f"{BASE_URL}/admin/media/{media_id}", headers=headers, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                if data.get("ok") == True:
                    record_result("DELETE /admin/media/{id} removes image", True, "Image deleted")
                else:
                    record_result("DELETE /admin/media/{id} removes image", False, f"Expected ok:true, got {data}")
            else:
                record_result("DELETE /admin/media/{id} removes image", False, 
                            f"Status {resp.status_code}: {resp.text}")
        except Exception as e:
            record_result("DELETE /admin/media/{id} removes image", False, f"Exception: {str(e)}")
    
    # Test 7.5: POST /admin/media with invalid data URL (400)
    try:
        invalid_data = {
            "name": "invalid.png",
            "dataUrl": "not-a-data-url"
        }
        resp = requests.post(f"{BASE_URL}/admin/media", json=invalid_data, headers=headers, timeout=10)
        if resp.status_code == 400:
            record_result("POST /admin/media rejects invalid data URL", True, "400 as expected")
        else:
            record_result("POST /admin/media rejects invalid data URL", False, 
                        f"Expected 400, got {resp.status_code}")
    except Exception as e:
        record_result("POST /admin/media rejects invalid data URL", False, f"Exception: {str(e)}")

# ============================================================
# 8. SETTINGS WITH BRANDING KEYS
# ============================================================

def test_settings_branding(admin_token):
    log_section("8. SETTINGS WITH BRANDING KEYS")
    
    if not admin_token:
        record_result("Settings branding tests", False, "No admin token", critical=True)
        return
    
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Test 8.1: PUT /admin/settings with branding keys
    try:
        branding_data = {
            "logoUrl": "/api/media/test-logo",
            "faviconUrl": "/api/media/test-favicon",
            "logoWidth": 150,
            "footerAbout": "Test footer about text",
            "socialInstagram": "https://instagram.com/test",
            "socialTelegram": "https://t.me/test",
            "socialFacebook": "https://facebook.com/test",
            "supportHours": "24/7",
            "footerNote": "Test footer note",
            "allowManualPay": True
        }
        resp = requests.put(f"{BASE_URL}/admin/settings", json=branding_data, headers=headers, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            checks = {
                "logoUrl": data.get("logoUrl") == "/api/media/test-logo",
                "faviconUrl": data.get("faviconUrl") == "/api/media/test-favicon",
                "logoWidth": data.get("logoWidth") == 150,
                "footerAbout": data.get("footerAbout") == "Test footer about text",
                "allowManualPay": data.get("allowManualPay") == True
            }
            
            if all(checks.values()):
                record_result("PUT /admin/settings saves branding keys", True, 
                            "All branding keys saved correctly")
            else:
                failed_checks = [k for k, v in checks.items() if not v]
                record_result("PUT /admin/settings saves branding keys", False, 
                            f"Failed checks: {failed_checks}")
        else:
            record_result("PUT /admin/settings saves branding keys", False, 
                        f"Status {resp.status_code}: {resp.text}")
    except Exception as e:
        record_result("PUT /admin/settings saves branding keys", False, f"Exception: {str(e)}")
    
    # Test 8.2: GET /catalog/settings exposes branding keys publicly
    try:
        resp = requests.get(f"{BASE_URL}/catalog/settings", timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            if (data.get("logoUrl") == "/api/media/test-logo" and
                data.get("footerAbout") == "Test footer about text" and
                data.get("allowManualPay") == True):
                record_result("GET /catalog/settings exposes branding keys publicly", True, 
                            "Branding keys visible in public catalog")
            else:
                record_result("GET /catalog/settings exposes branding keys publicly", False, 
                            f"Branding keys not found or incorrect: {data}")
        else:
            record_result("GET /catalog/settings exposes branding keys publicly", False, 
                        f"Status {resp.status_code}: {resp.text}")
    except Exception as e:
        record_result("GET /catalog/settings exposes branding keys publicly", False, f"Exception: {str(e)}")

# ============================================================
# 9. MANUAL PAY GATING
# ============================================================

def test_manual_pay_gating(admin_token):
    log_section("9. MANUAL PAY GATING")
    
    if not admin_token:
        record_result("Manual pay gating tests", False, "No admin token", critical=True)
        return
    
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Create a test order
    test_order = {
        "gameSlug": "mobile-legends",
        "gameName": "Mobile Legends",
        "denomId": "ml-test",
        "denomName": "Test Diamonds",
        "account": {"userId": "12345"},
        "payment": "qris",
        "paymentId": "qris",
        "subtotal": 5000,
        "fee": 0,
        "discount": 0,
        "total": 5000,
        "email": "test@example.com"
    }
    
    invoice = None
    try:
        resp = requests.post(f"{BASE_URL}/orders", json=test_order, headers=headers, timeout=10)
        if resp.status_code == 200:
            order = resp.json()
            invoice = order.get("invoice")
            record_result("Create test order for manual pay gating", True, f"Invoice: {invoice}")
        else:
            record_result("Create test order for manual pay gating", False, 
                        f"Status {resp.status_code}: {resp.text}")
            return
    except Exception as e:
        record_result("Create test order for manual pay gating", False, f"Exception: {str(e)}")
        return
    
    # Test 9.1: POST /orders/{invoice}/pay works when allowManualPay=true
    try:
        resp = requests.post(f"{BASE_URL}/orders/{invoice}/pay", timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            if data.get("status") == "success":
                record_result("POST /orders/{invoice}/pay works when allowManualPay=true", True, 
                            "Order marked as success")
            else:
                record_result("POST /orders/{invoice}/pay works when allowManualPay=true", False, 
                            f"Expected status=success, got {data.get('status')}")
        else:
            record_result("POST /orders/{invoice}/pay works when allowManualPay=true", False, 
                        f"Status {resp.status_code}: {resp.text}")
    except Exception as e:
        record_result("POST /orders/{invoice}/pay works when allowManualPay=true", False, f"Exception: {str(e)}")
    
    # Test 9.2: Set allowManualPay=false
    try:
        resp = requests.put(f"{BASE_URL}/admin/settings", json={"allowManualPay": False}, headers=headers, timeout=10)
        if resp.status_code == 200:
            record_result("Set allowManualPay=false via admin settings", True, "Setting updated")
        else:
            record_result("Set allowManualPay=false via admin settings", False, 
                        f"Status {resp.status_code}: {resp.text}")
    except Exception as e:
        record_result("Set allowManualPay=false via admin settings", False, f"Exception: {str(e)}")
    
    # Create another test order
    try:
        resp = requests.post(f"{BASE_URL}/orders", json=test_order, headers=headers, timeout=10)
        if resp.status_code == 200:
            order = resp.json()
            invoice2 = order.get("invoice")
        else:
            invoice2 = None
    except:
        invoice2 = None
    
    # Test 9.3: POST /orders/{invoice}/pay returns 403 when allowManualPay=false
    if invoice2:
        try:
            resp = requests.post(f"{BASE_URL}/orders/{invoice2}/pay", timeout=10)
            if resp.status_code == 403:
                record_result("POST /orders/{invoice}/pay returns 403 when allowManualPay=false", True, 
                            "Manual pay correctly blocked")
            else:
                record_result("POST /orders/{invoice}/pay returns 403 when allowManualPay=false", False, 
                            f"Expected 403, got {resp.status_code}")
        except Exception as e:
            record_result("POST /orders/{invoice}/pay returns 403 when allowManualPay=false", False, f"Exception: {str(e)}")
    
    # Test 9.4: Set allowManualPay back to true
    try:
        resp = requests.put(f"{BASE_URL}/admin/settings", json={"allowManualPay": True}, headers=headers, timeout=10)
        if resp.status_code == 200:
            record_result("Set allowManualPay=true (restore)", True, "Setting restored")
        else:
            record_result("Set allowManualPay=true (restore)", False, 
                        f"Status {resp.status_code}: {resp.text}")
    except Exception as e:
        record_result("Set allowManualPay=true (restore)", False, f"Exception: {str(e)}")

# ============================================================
# 10. GAMES API WITH NEW FIELDS
# ============================================================

def test_games_new_fields(admin_token):
    log_section("10. GAMES API WITH NEW FIELDS")
    
    if not admin_token:
        record_result("Games new fields tests", False, "No admin token", critical=True)
        return
    
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Test 10.1: PUT /admin/games/{slug} with new fields
    try:
        game_data = {
            "image": "/api/media/test-game-image",
            "banner": "/api/media/test-game-banner",
            "description": "Test game description",
            "howTo": ["Step 1: Test", "Step 2: Test", "Step 3: Test"],
            "notes": "Test game notes",
            "fields": [
                {"key": "userId", "label": "User ID", "placeholder": "Enter your User ID"},
                {"key": "zoneId", "label": "Zone ID", "placeholder": "Enter your Zone ID"}
            ]
        }
        resp = requests.put(f"{BASE_URL}/admin/games/mobile-legends", json=game_data, headers=headers, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            checks = {
                "image": data.get("image") == "/api/media/test-game-image",
                "banner": data.get("banner") == "/api/media/test-game-banner",
                "description": data.get("description") == "Test game description",
                "howTo": isinstance(data.get("howTo"), list) and len(data.get("howTo", [])) == 3,
                "notes": data.get("notes") == "Test game notes",
                "fields": isinstance(data.get("fields"), list) and len(data.get("fields", [])) == 2
            }
            
            if all(checks.values()):
                record_result("PUT /admin/games/{slug} saves new fields", True, 
                            "image, banner, description, howTo, notes, fields all saved")
            else:
                failed_checks = [k for k, v in checks.items() if not v]
                record_result("PUT /admin/games/{slug} saves new fields", False, 
                            f"Failed checks: {failed_checks}")
        else:
            record_result("PUT /admin/games/{slug} saves new fields", False, 
                        f"Status {resp.status_code}: {resp.text}")
    except Exception as e:
        record_result("PUT /admin/games/{slug} saves new fields", False, f"Exception: {str(e)}")
    
    # Test 10.2: GET /catalog/games/{slug} returns new fields
    try:
        resp = requests.get(f"{BASE_URL}/catalog/games/mobile-legends", timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            if (data.get("description") == "Test game description" and
                isinstance(data.get("howTo"), list) and
                isinstance(data.get("fields"), list)):
                record_result("GET /catalog/games/{slug} returns new fields publicly", True, 
                            "description, howTo, fields visible in public catalog")
            else:
                record_result("GET /catalog/games/{slug} returns new fields publicly", False, 
                            f"New fields not found or incorrect: {data}")
        else:
            record_result("GET /catalog/games/{slug} returns new fields publicly", False, 
                        f"Status {resp.status_code}: {resp.text}")
    except Exception as e:
        record_result("GET /catalog/games/{slug} returns new fields publicly", False, f"Exception: {str(e)}")

# ============================================================
# 11. REGRESSION TESTS
# ============================================================

def test_regression():
    log_section("11. REGRESSION TESTS")
    
    # Test catalog endpoints
    endpoints = [
        "/catalog/games",
        "/catalog/vouchers",
        "/catalog/banners",
        "/catalog/flashsale",
        "/catalog/specialoffers",
        "/catalog/payments",
        "/catalog/settings",
        "/catalog/sellaccounts",
        "/catalog/itemskins",
        "/catalog/pulsa"
    ]
    
    for endpoint in endpoints:
        try:
            resp = requests.get(f"{BASE_URL}{endpoint}", timeout=10)
            if resp.status_code == 200:
                record_result(f"GET {endpoint} works", True, f"Status 200")
            else:
                record_result(f"GET {endpoint} works", False, f"Status {resp.status_code}")
        except Exception as e:
            record_result(f"GET {endpoint} works", False, f"Exception: {str(e)}")

def test_auth_regression():
    log_section("11B. AUTH REGRESSION")
    
    # Test register
    timestamp = int(time.time())
    test_user = {
        "name": "Test User",
        "email": f"testuser{timestamp}@example.com",
        "password": "TestPass123!"
    }
    
    try:
        resp = requests.post(f"{BASE_URL}/auth/register", json=test_user, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            if "token" in data and "user" in data:
                token = data["token"]
                record_result("POST /auth/register works", True, "User registered")
                
                # Test /auth/me
                headers = {"Authorization": f"Bearer {token}"}
                resp2 = requests.get(f"{BASE_URL}/auth/me", headers=headers, timeout=10)
                if resp2.status_code == 200:
                    record_result("GET /auth/me works", True, "User info retrieved")
                else:
                    record_result("GET /auth/me works", False, f"Status {resp2.status_code}")
            else:
                record_result("POST /auth/register works", False, "Missing token or user")
        else:
            record_result("POST /auth/register works", False, f"Status {resp.status_code}")
    except Exception as e:
        record_result("POST /auth/register works", False, f"Exception: {str(e)}")

# ============================================================
# MAIN TEST RUNNER
# ============================================================

def main():
    print(f"\n{BLUE}{'='*80}{RESET}")
    print(f"{BLUE}Allv2Store Backend Test Suite - Midtrans Integration{RESET}")
    print(f"{BLUE}Base URL: {BASE_URL}{RESET}")
    print(f"{BLUE}{'='*80}{RESET}\n")
    
    # Login as admin
    admin_token = None
    try:
        resp = requests.post(f"{BASE_URL}/admin/login", json=ADMIN_CREDS, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            admin_token = data.get("token")
            print(f"{GREEN}✓ Admin login successful{RESET}\n")
        else:
            print(f"{RED}✗ Admin login failed: {resp.status_code} - {resp.text}{RESET}\n")
            return
    except Exception as e:
        print(f"{RED}✗ Admin login exception: {str(e)}{RESET}\n")
        return
    
    # Run all tests
    test_stripe_removal()
    test_midtrans_config()
    test_midtrans_checkout(admin_token)
    test_midtrans_checkout_errors()
    test_midtrans_notification()
    test_admin_midtrans(admin_token)
    test_admin_digiflazz(admin_token)
    test_media_library(admin_token)
    test_settings_branding(admin_token)
    test_manual_pay_gating(admin_token)
    test_games_new_fields(admin_token)
    test_regression()
    test_auth_regression()
    
    # Print summary
    print(f"\n{BLUE}{'='*80}{RESET}")
    print(f"{BLUE}TEST SUMMARY{RESET}")
    print(f"{BLUE}{'='*80}{RESET}")
    print(f"Total Tests: {results['total']}")
    print(f"{GREEN}Passed: {results['passed']}{RESET}")
    print(f"{RED}Failed: {results['failed']}{RESET}")
    
    if results['critical_failures']:
        print(f"\n{RED}CRITICAL FAILURES:{RESET}")
        for failure in results['critical_failures']:
            print(f"  - {failure}")
    
    success_rate = (results['passed'] / results['total'] * 100) if results['total'] > 0 else 0
    print(f"\nSuccess Rate: {success_rate:.1f}%")
    
    # Save results to JSON
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n{BLUE}Results saved to /app/backend_test_results.json{RESET}\n")
    
    return 0 if results['failed'] == 0 else 1

if __name__ == "__main__":
    exit(main())

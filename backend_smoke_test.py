#!/usr/bin/env python3
"""
Quick Backend Smoke Test for Allv2Store Restore Task
Tests key endpoints to verify the restored app is working
"""

import requests
import json
import time

# Correct BASE_URL from frontend/.env
BASE_URL = "https://github-live-test.preview.emergentagent.com/api"

# Admin credentials (created via first-run setup)
ADMIN_EMAIL = "admin@allv2.com"
ADMIN_PASSWORD = "Admin@12345"

# Test results
results = {"total": 0, "passed": 0, "failed": 0}

def test(name, passed, details=""):
    results["total"] += 1
    if passed:
        results["passed"] += 1
        print(f"✅ {name}")
    else:
        results["failed"] += 1
        print(f"❌ {name}")
    if details:
        print(f"   {details}")
    return passed

print("=" * 70)
print("BACKEND SMOKE TEST - Allv2Store Restore")
print("=" * 70)

# 1. Health Check
print("\n1. HEALTH CHECK")
try:
    resp = requests.get(f"{BASE_URL}/", timeout=10)
    test("GET /api/ returns 200", resp.status_code == 200, f"Response: {resp.json()}")
except Exception as e:
    test("GET /api/ returns 200", False, f"Exception: {str(e)}")

# 2. Catalog Endpoints
print("\n2. CATALOG ENDPOINTS")
catalog_endpoints = [
    ("games", 14),  # Should have at least 14 games
    ("vouchers", 3),  # Should have at least 3 vouchers
    ("banners", 1),
    ("flashsale", 1),
    ("specialoffers", 1),
    ("payments", 1),
    ("sellaccounts", 1),
    ("itemskins", 1),
]

for endpoint, min_count in catalog_endpoints:
    try:
        resp = requests.get(f"{BASE_URL}/catalog/{endpoint}", timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            if endpoint == "pulsa":
                # pulsa returns object with operators, nominals, tagihan
                has_keys = isinstance(data, dict) and "operators" in data and "nominals" in data and "tagihan" in data
                test(f"GET /catalog/{endpoint}", has_keys, f"Keys: {list(data.keys()) if isinstance(data, dict) else 'not a dict'}")
            else:
                count = len(data) if isinstance(data, list) else 0
                test(f"GET /catalog/{endpoint}", count >= min_count, f"Found {count} items (expected >={min_count})")
        else:
            test(f"GET /catalog/{endpoint}", False, f"Status {resp.status_code}")
    except Exception as e:
        test(f"GET /catalog/{endpoint}", False, f"Exception: {str(e)}")

# Add pulsa endpoint
try:
    resp = requests.get(f"{BASE_URL}/catalog/pulsa", timeout=10)
    if resp.status_code == 200:
        data = resp.json()
        has_keys = isinstance(data, dict) and "operators" in data and "nominals" in data and "tagihan" in data
        test("GET /catalog/pulsa", has_keys, f"Keys: {list(data.keys()) if isinstance(data, dict) else 'not a dict'}")
    else:
        test("GET /catalog/pulsa", False, f"Status {resp.status_code}")
except Exception as e:
    test("GET /catalog/pulsa", False, f"Exception: {str(e)}")

# 3. Settings
try:
    resp = requests.get(f"{BASE_URL}/catalog/settings", timeout=10)
    if resp.status_code == 200:
        data = resp.json()
        test("GET /catalog/settings", "siteName" in data, f"siteName: {data.get('siteName')}")
    else:
        test("GET /catalog/settings", False, f"Status {resp.status_code}")
except Exception as e:
    test("GET /catalog/settings", False, f"Exception: {str(e)}")

# 4. User Auth Flow
print("\n3. USER AUTH FLOW")
timestamp = int(time.time())
test_user = {
    "name": "Test User",
    "email": f"testuser{timestamp}@example.com",
    "password": "TestPass123!"
}

# Register
try:
    resp = requests.post(f"{BASE_URL}/auth/register", json=test_user, timeout=10)
    if resp.status_code == 200:
        data = resp.json()
        user_token = data.get("token")
        test("POST /auth/register", "token" in data and "user" in data, f"User: {data.get('user', {}).get('email')}")
    else:
        test("POST /auth/register", False, f"Status {resp.status_code}: {resp.text}")
        user_token = None
except Exception as e:
    test("POST /auth/register", False, f"Exception: {str(e)}")
    user_token = None

# Login
try:
    resp = requests.post(f"{BASE_URL}/auth/login", json={"email": test_user["email"], "password": test_user["password"]}, timeout=10)
    if resp.status_code == 200:
        data = resp.json()
        test("POST /auth/login", "token" in data, f"Token received")
    else:
        test("POST /auth/login", False, f"Status {resp.status_code}")
except Exception as e:
    test("POST /auth/login", False, f"Exception: {str(e)}")

# Get /me
if user_token:
    try:
        resp = requests.get(f"{BASE_URL}/auth/me", headers={"Authorization": f"Bearer {user_token}"}, timeout=10)
        test("GET /auth/me", resp.status_code == 200, f"User: {resp.json().get('email') if resp.status_code == 200 else 'N/A'}")
    except Exception as e:
        test("GET /auth/me", False, f"Exception: {str(e)}")

# 5. Order Flow
print("\n4. ORDER FLOW")
order_data = {
    "gameSlug": "mobile-legends",
    "gameName": "Mobile Legends",
    "denomName": "100 Diamonds",
    "account": {"userId": "12345"},
    "payment": "qris",
    "paymentId": "qris",
    "subtotal": 10000,
    "fee": 0,
    "discount": 0,
    "total": 10000
}

invoice = None
try:
    resp = requests.post(f"{BASE_URL}/orders", json=order_data, timeout=10)
    if resp.status_code == 200:
        data = resp.json()
        invoice = data.get("invoice")
        test("POST /orders", "invoice" in data and data.get("status") == "pending", f"Invoice: {invoice}")
    else:
        test("POST /orders", False, f"Status {resp.status_code}: {resp.text}")
except Exception as e:
    test("POST /orders", False, f"Exception: {str(e)}")

# Get order
if invoice:
    try:
        resp = requests.get(f"{BASE_URL}/orders/{invoice}", timeout=10)
        test("GET /orders/{invoice}", resp.status_code == 200, f"Status: {resp.json().get('status') if resp.status_code == 200 else 'N/A'}")
    except Exception as e:
        test("GET /orders/{invoice}", False, f"Exception: {str(e)}")

# Pay order
if invoice:
    try:
        resp = requests.post(f"{BASE_URL}/orders/{invoice}/pay", timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            test("POST /orders/{invoice}/pay", data.get("status") == "success", f"Status: {data.get('status')}, Digiflazz: {data.get('digiflazz', {}).get('skipped', 'N/A')}")
        else:
            test("POST /orders/{invoice}/pay", False, f"Status {resp.status_code}")
    except Exception as e:
        test("POST /orders/{invoice}/pay", False, f"Exception: {str(e)}")

# 6. Voucher Validation
print("\n5. VOUCHER VALIDATION")
try:
    resp = requests.post(f"{BASE_URL}/vouchers/validate", json={"code": "NEWBIE", "amount": 20000}, timeout=10)
    if resp.status_code == 200:
        data = resp.json()
        test("POST /vouchers/validate (NEWBIE)", data.get("valid") == True and data.get("discount") == 5000, f"Discount: {data.get('discount')}")
    else:
        test("POST /vouchers/validate (NEWBIE)", False, f"Status {resp.status_code}")
except Exception as e:
    test("POST /vouchers/validate (NEWBIE)", False, f"Exception: {str(e)}")

# 7. Admin Auth
print("\n6. ADMIN AUTH")
admin_token = None
try:
    resp = requests.get(f"{BASE_URL}/admin/setup-status", timeout=10)
    if resp.status_code == 200:
        data = resp.json()
        test("GET /admin/setup-status", data.get("hasAdmin") == True, f"hasAdmin: {data.get('hasAdmin')}")
    else:
        test("GET /admin/setup-status", False, f"Status {resp.status_code}")
except Exception as e:
    test("GET /admin/setup-status", False, f"Exception: {str(e)}")

try:
    resp = requests.post(f"{BASE_URL}/admin/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=10)
    if resp.status_code == 200:
        data = resp.json()
        admin_token = data.get("token")
        test("POST /admin/login", "token" in data and data.get("user", {}).get("role") == "admin", f"Admin: {data.get('user', {}).get('email')}")
    else:
        test("POST /admin/login", False, f"Status {resp.status_code}: {resp.text}")
except Exception as e:
    test("POST /admin/login", False, f"Exception: {str(e)}")

# 8. Admin Stats
if admin_token:
    try:
        resp = requests.get(f"{BASE_URL}/admin/stats", headers={"Authorization": f"Bearer {admin_token}"}, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            test("GET /admin/stats", "revenue" in data and "totalOrders" in data, f"Revenue: {data.get('revenue')}, Orders: {data.get('totalOrders')}")
        else:
            test("GET /admin/stats", False, f"Status {resp.status_code}")
    except Exception as e:
        test("GET /admin/stats", False, f"Exception: {str(e)}")

# 9. Digiflazz Status
print("\n7. DIGIFLAZZ INTEGRATION")
if admin_token:
    try:
        resp = requests.get(f"{BASE_URL}/admin/digiflazz/status", headers={"Authorization": f"Bearer {admin_token}"}, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            test("GET /admin/digiflazz/status", data.get("configured") == False and data.get("webhookConfigured") == True, 
                 f"configured: {data.get('configured')}, webhookConfigured: {data.get('webhookConfigured')}")
        else:
            test("GET /admin/digiflazz/status", False, f"Status {resp.status_code}")
    except Exception as e:
        test("GET /admin/digiflazz/status", False, f"Exception: {str(e)}")

# 10. Stripe Payment (check if endpoint exists)
print("\n8. STRIPE PAYMENT")
if invoice:
    try:
        resp = requests.post(f"{BASE_URL}/payments/checkout", json={"invoice": invoice, "origin_url": "https://example.com"}, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            test("POST /payments/checkout", "checkout_url" in data and "session_id" in data, 
                 f"checkout_url starts with: {data.get('checkout_url', '')[:50]}...")
        else:
            test("POST /payments/checkout", False, f"Status {resp.status_code}: {resp.text}")
    except Exception as e:
        test("POST /payments/checkout", False, f"Exception: {str(e)}")

# Summary
print("\n" + "=" * 70)
print(f"BACKEND SMOKE TEST SUMMARY")
print("=" * 70)
print(f"Total: {results['total']}")
print(f"Passed: {results['passed']} ✅")
print(f"Failed: {results['failed']} ❌")
print(f"Success Rate: {round(results['passed'] / results['total'] * 100) if results['total'] > 0 else 0}%")
print("=" * 70)

exit(0 if results['failed'] == 0 else 1)

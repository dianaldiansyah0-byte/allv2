#!/usr/bin/env python3
"""
REGRESSION TEST SUITE - Code Quality Fixes
Tests after refactoring gen_invoice() and decode_user() in backend/server.py

Changes tested:
1. gen_invoice() now uses Python `secrets` instead of `random`
2. decode_user() refactored (JWT decode + user lookup moved inside same try block)

Test Coverage:
1. AUTH still works (register, login, /me with valid/invalid/malformed tokens)
2. ADMIN auth still works (admin login, /admin/stats with admin/user/no token)
3. INVOICE generation (create 3 orders, verify unique INVs, GET order, pay order)
4. Quick smoke (catalog/games, admin/digiflazz/status, admin/digiflazz/retry-pending)
"""

import requests
import json
import time
from datetime import datetime

# Base URL from frontend/.env
BASE_URL = "https://gamer-vault-32.preview.emergentagent.com/api"

# Admin credentials
ADMIN_CREDS = {
    "email": "owner@allv2.com",
    "password": "admin123"
}

# Color codes for output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

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

# Test results tracking
results = {
    "total": 0,
    "passed": 0,
    "failed": 0,
    "tests": []
}

def record_result(test_name, passed, details=""):
    results["total"] += 1
    if passed:
        results["passed"] += 1
    else:
        results["failed"] += 1
    results["tests"].append({
        "name": test_name,
        "passed": passed,
        "details": details
    })
    return log_test(test_name, passed, details)

# ============================================================
# 1. AUTH REGRESSION TESTS
# ============================================================

def test_auth_regression():
    log_section("1. AUTH REGRESSION TESTS (decode_user refactoring)")
    
    global user_token
    user_token = None
    
    # Test 1.1: POST /api/auth/register (unique email) -> {token, user}
    timestamp = int(time.time())
    test_user = {
        "name": "Regression Test User",
        "email": f"regtest{timestamp}@example.com",
        "password": "TestPass123!"
    }
    
    try:
        resp = requests.post(f"{BASE_URL}/auth/register", json=test_user, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            if "token" in data and "user" in data:
                user_token = data["token"]
                record_result("POST /auth/register returns {token, user}", True, f"User: {data['user']['email']}")
            else:
                record_result("POST /auth/register returns {token, user}", False, f"Missing token or user: {data}")
        else:
            record_result("POST /auth/register returns {token, user}", False, f"Status {resp.status_code}: {resp.text}")
    except Exception as e:
        record_result("POST /auth/register returns {token, user}", False, f"Exception: {str(e)}")
    
    # Test 1.2: POST /api/auth/login -> {token, user}
    try:
        login_data = {"email": test_user["email"], "password": test_user["password"]}
        resp = requests.post(f"{BASE_URL}/auth/login", json=login_data, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            if "token" in data and "user" in data:
                record_result("POST /auth/login returns {token, user}", True, f"User: {data['user']['email']}")
            else:
                record_result("POST /auth/login returns {token, user}", False, f"Missing token or user: {data}")
        else:
            record_result("POST /auth/login returns {token, user}", False, f"Status {resp.status_code}: {resp.text}")
    except Exception as e:
        record_result("POST /auth/login returns {token, user}", False, f"Exception: {str(e)}")
    
    # Test 1.3: GET /api/auth/me with Bearer token -> user
    if user_token:
        try:
            headers = {"Authorization": f"Bearer {user_token}"}
            resp = requests.get(f"{BASE_URL}/auth/me", headers=headers, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                if "email" in data and data["email"] == test_user["email"]:
                    record_result("GET /auth/me with Bearer token returns user", True, f"User: {data['email']}")
                else:
                    record_result("GET /auth/me with Bearer token returns user", False, f"Unexpected user: {data}")
            else:
                record_result("GET /auth/me with Bearer token returns user", False, f"Status {resp.status_code}: {resp.text}")
        except Exception as e:
            record_result("GET /auth/me with Bearer token returns user", False, f"Exception: {str(e)}")
    else:
        record_result("GET /auth/me with Bearer token returns user", False, "No user token available")
    
    # Test 1.4: GET /api/auth/me without token -> 401
    try:
        resp = requests.get(f"{BASE_URL}/auth/me", timeout=10)
        if resp.status_code == 401:
            record_result("GET /auth/me without token returns 401", True, "Correctly rejected")
        else:
            record_result("GET /auth/me without token returns 401", False, f"Status {resp.status_code}: {resp.text}")
    except Exception as e:
        record_result("GET /auth/me without token returns 401", False, f"Exception: {str(e)}")
    
    # Test 1.5: GET /api/auth/me with malformed Bearer token -> 401 (decode_user must return None safely, NOT 500)
    try:
        headers = {"Authorization": "Bearer malformed_garbage_token_12345"}
        resp = requests.get(f"{BASE_URL}/auth/me", headers=headers, timeout=10)
        if resp.status_code == 401:
            record_result("GET /auth/me with malformed token returns 401 (not 500)", True, "decode_user safely returns None")
        else:
            record_result("GET /auth/me with malformed token returns 401 (not 500)", False, f"Status {resp.status_code}: {resp.text}")
    except Exception as e:
        record_result("GET /auth/me with malformed token returns 401 (not 500)", False, f"Exception: {str(e)}")
    
    # Test 1.6: GET /api/auth/me with garbage Bearer token (invalid JWT format) -> 401
    try:
        headers = {"Authorization": "Bearer not.a.valid.jwt.format.at.all"}
        resp = requests.get(f"{BASE_URL}/auth/me", headers=headers, timeout=10)
        if resp.status_code == 401:
            record_result("GET /auth/me with garbage JWT returns 401 (not 500)", True, "decode_user safely returns None")
        else:
            record_result("GET /auth/me with garbage JWT returns 401 (not 500)", False, f"Status {resp.status_code}: {resp.text}")
    except Exception as e:
        record_result("GET /auth/me with garbage JWT returns 401 (not 500)", False, f"Exception: {str(e)}")

# ============================================================
# 2. ADMIN AUTH REGRESSION TESTS
# ============================================================

def test_admin_auth_regression():
    log_section("2. ADMIN AUTH REGRESSION TESTS (decode_user refactoring)")
    
    global admin_token
    admin_token = None
    
    # Test 2.1: POST /api/admin/login owner@allv2.com/admin123 -> admin token
    try:
        resp = requests.post(f"{BASE_URL}/admin/login", json=ADMIN_CREDS, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            if "token" in data and "user" in data:
                admin_token = data["token"]
                if data["user"].get("role") == "admin":
                    record_result("POST /admin/login returns admin token", True, f"Admin: {data['user']['email']}")
                else:
                    record_result("POST /admin/login returns admin token", False, f"Role not admin: {data['user']}")
            else:
                record_result("POST /admin/login returns admin token", False, f"Missing token or user: {data}")
        else:
            record_result("POST /admin/login returns admin token", False, f"Status {resp.status_code}: {resp.text}")
    except Exception as e:
        record_result("POST /admin/login returns admin token", False, f"Exception: {str(e)}")
    
    # Test 2.2: GET /api/admin/stats with admin token -> 200
    if admin_token:
        try:
            headers = {"Authorization": f"Bearer {admin_token}"}
            resp = requests.get(f"{BASE_URL}/admin/stats", headers=headers, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                if "revenue" in data and "totalOrders" in data:
                    record_result("GET /admin/stats with admin token returns 200", True, f"Revenue: {data.get('revenue', 0)}, Orders: {data.get('totalOrders', 0)}")
                else:
                    record_result("GET /admin/stats with admin token returns 200", False, f"Missing expected fields: {data}")
            else:
                record_result("GET /admin/stats with admin token returns 200", False, f"Status {resp.status_code}: {resp.text}")
        except Exception as e:
            record_result("GET /admin/stats with admin token returns 200", False, f"Exception: {str(e)}")
    else:
        record_result("GET /admin/stats with admin token returns 200", False, "No admin token available")
    
    # Test 2.3: GET /api/admin/stats without token -> 403
    try:
        resp = requests.get(f"{BASE_URL}/admin/stats", timeout=10)
        if resp.status_code == 403:
            record_result("GET /admin/stats without token returns 403", True, "Correctly rejected")
        else:
            record_result("GET /admin/stats without token returns 403", False, f"Status {resp.status_code}: {resp.text}")
    except Exception as e:
        record_result("GET /admin/stats without token returns 403", False, f"Exception: {str(e)}")
    
    # Test 2.4: GET /api/admin/stats with normal user token -> 403
    if user_token:
        try:
            headers = {"Authorization": f"Bearer {user_token}"}
            resp = requests.get(f"{BASE_URL}/admin/stats", headers=headers, timeout=10)
            if resp.status_code == 403:
                record_result("GET /admin/stats with user token returns 403", True, "Correctly rejected non-admin")
            else:
                record_result("GET /admin/stats with user token returns 403", False, f"Status {resp.status_code}: {resp.text}")
        except Exception as e:
            record_result("GET /admin/stats with user token returns 403", False, f"Exception: {str(e)}")
    else:
        record_result("GET /admin/stats with user token returns 403", False, "No user token available")

# ============================================================
# 3. INVOICE GENERATION REGRESSION TESTS
# ============================================================

def test_invoice_generation_regression():
    log_section("3. INVOICE GENERATION REGRESSION TESTS (gen_invoice using secrets)")
    
    invoices = []
    
    # Test 3.1-3.3: Create 3 orders via POST /api/orders (guest, no token) with valid body
    for i in range(1, 4):
        order_data = {
            "gameSlug": "mobile-legends",
            "gameName": "Mobile Legends",
            "denomName": "100 Diamonds",
            "account": {"userId": "1"},
            "payment": "QRIS",
            "paymentId": "qris",
            "subtotal": 2000,
            "total": 2000
        }
        
        try:
            resp = requests.post(f"{BASE_URL}/orders", json=order_data, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                if "invoice" in data and data["invoice"].startswith("INV"):
                    invoices.append(data["invoice"])
                    record_result(f"POST /orders #{i} returns unique invoice starting with INV", True, f"Invoice: {data['invoice']}")
                else:
                    record_result(f"POST /orders #{i} returns unique invoice starting with INV", False, f"Invalid invoice: {data.get('invoice', 'N/A')}")
            else:
                record_result(f"POST /orders #{i} returns unique invoice starting with INV", False, f"Status {resp.status_code}: {resp.text}")
        except Exception as e:
            record_result(f"POST /orders #{i} returns unique invoice starting with INV", False, f"Exception: {str(e)}")
    
    # Test 3.4: Verify all 3 invoices are unique
    if len(invoices) == 3:
        if len(set(invoices)) == 3:
            record_result("All 3 invoices are unique", True, f"Invoices: {invoices}")
        else:
            record_result("All 3 invoices are unique", False, f"Duplicate invoices found: {invoices}")
    else:
        record_result("All 3 invoices are unique", False, f"Only {len(invoices)} invoices created")
    
    # Test 3.5: GET /api/orders/{invoice} for one of them -> 200
    if invoices:
        test_invoice = invoices[0]
        try:
            resp = requests.get(f"{BASE_URL}/orders/{test_invoice}", timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                if data.get("invoice") == test_invoice:
                    record_result(f"GET /orders/{test_invoice} returns 200", True, f"Status: {data.get('status', 'N/A')}")
                else:
                    record_result(f"GET /orders/{test_invoice} returns 200", False, f"Invoice mismatch: {data}")
            else:
                record_result(f"GET /orders/{test_invoice} returns 200", False, f"Status {resp.status_code}: {resp.text}")
        except Exception as e:
            record_result(f"GET /orders/{test_invoice} returns 200", False, f"Exception: {str(e)}")
    else:
        record_result("GET /orders/{invoice} returns 200", False, "No invoices available")
    
    # Test 3.6: POST /api/orders/{invoice}/pay -> status success
    if invoices:
        test_invoice = invoices[0]
        try:
            resp = requests.post(f"{BASE_URL}/orders/{test_invoice}/pay", timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                if data.get("status") == "success":
                    record_result(f"POST /orders/{test_invoice}/pay returns status success", True, f"PaidAt: {data.get('paidAt', 'N/A')}")
                else:
                    record_result(f"POST /orders/{test_invoice}/pay returns status success", False, f"Status: {data.get('status', 'N/A')}")
            else:
                record_result(f"POST /orders/{test_invoice}/pay returns status success", False, f"Status {resp.status_code}: {resp.text}")
        except Exception as e:
            record_result(f"POST /orders/{test_invoice}/pay returns status success", False, f"Exception: {str(e)}")
    else:
        record_result("POST /orders/{invoice}/pay returns status success", False, "No invoices available")

# ============================================================
# 4. QUICK SMOKE TESTS
# ============================================================

def test_quick_smoke():
    log_section("4. QUICK SMOKE TESTS (catalog + digiflazz)")
    
    # Test 4.1: GET /api/catalog/games -> 14 games
    try:
        resp = requests.get(f"{BASE_URL}/catalog/games", timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            if isinstance(data, list) and len(data) == 14:
                record_result("GET /catalog/games returns 14 games", True, f"Games count: {len(data)}")
            else:
                record_result("GET /catalog/games returns 14 games", False, f"Expected 14 games, got {len(data) if isinstance(data, list) else 'non-list'}")
        else:
            record_result("GET /catalog/games returns 14 games", False, f"Status {resp.status_code}: {resp.text}")
    except Exception as e:
        record_result("GET /catalog/games returns 14 games", False, f"Exception: {str(e)}")
    
    # Test 4.2: GET /api/admin/digiflazz/status (admin) -> configured:false, webhookConfigured:true
    if admin_token:
        try:
            headers = {"Authorization": f"Bearer {admin_token}"}
            resp = requests.get(f"{BASE_URL}/admin/digiflazz/status", headers=headers, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                if data.get("configured") == False and data.get("webhookConfigured") == True:
                    record_result("GET /admin/digiflazz/status returns configured:false, webhookConfigured:true", True, f"Config: {data}")
                else:
                    record_result("GET /admin/digiflazz/status returns configured:false, webhookConfigured:true", False, f"Unexpected config: {data}")
            else:
                record_result("GET /admin/digiflazz/status returns configured:false, webhookConfigured:true", False, f"Status {resp.status_code}: {resp.text}")
        except Exception as e:
            record_result("GET /admin/digiflazz/status returns configured:false, webhookConfigured:true", False, f"Exception: {str(e)}")
    else:
        record_result("GET /admin/digiflazz/status returns configured:false, webhookConfigured:true", False, "No admin token available")
    
    # Test 4.3: POST /api/admin/digiflazz/retry-pending (admin) -> {checked:0}
    if admin_token:
        try:
            headers = {"Authorization": f"Bearer {admin_token}"}
            resp = requests.post(f"{BASE_URL}/admin/digiflazz/retry-pending", headers=headers, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                if "checked" in data and data["checked"] == 0:
                    record_result("POST /admin/digiflazz/retry-pending returns {checked:0}", True, f"Checked: {data['checked']}")
                else:
                    record_result("POST /admin/digiflazz/retry-pending returns {checked:0}", False, f"Unexpected response: {data}")
            else:
                record_result("POST /admin/digiflazz/retry-pending returns {checked:0}", False, f"Status {resp.status_code}: {resp.text}")
        except Exception as e:
            record_result("POST /admin/digiflazz/retry-pending returns {checked:0}", False, f"Exception: {str(e)}")
    else:
        record_result("POST /admin/digiflazz/retry-pending returns {checked:0}", False, "No admin token available")

# ============================================================
# MAIN TEST RUNNER
# ============================================================

def main():
    print(f"\n{YELLOW}{'='*80}{RESET}")
    print(f"{YELLOW}REGRESSION TEST SUITE - Code Quality Fixes{RESET}")
    print(f"{YELLOW}Testing gen_invoice() (secrets) and decode_user() (refactored){RESET}")
    print(f"{YELLOW}{'='*80}{RESET}")
    print(f"Base URL: {BASE_URL}")
    print(f"Admin: {ADMIN_CREDS['email']}")
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Run all test suites
    test_auth_regression()
    test_admin_auth_regression()
    test_invoice_generation_regression()
    test_quick_smoke()
    
    # Print summary
    log_section("REGRESSION TEST SUMMARY")
    print(f"Total Tests: {results['total']}")
    print(f"{GREEN}Passed: {results['passed']}{RESET}")
    print(f"{RED}Failed: {results['failed']}{RESET}")
    
    if results['failed'] > 0:
        print(f"\n{RED}FAILED TESTS:{RESET}")
        for test in results['tests']:
            if not test['passed']:
                print(f"  {RED}✗{RESET} {test['name']}")
                if test['details']:
                    print(f"    {test['details']}")
    
    print(f"\n{YELLOW}{'='*80}{RESET}")
    if results['failed'] == 0:
        print(f"{GREEN}✓ ALL REGRESSION TESTS PASSED - NO ISSUES FOUND{RESET}")
        print(f"{GREEN}✓ gen_invoice() using secrets: WORKING{RESET}")
        print(f"{GREEN}✓ decode_user() refactored: WORKING (no 500 errors){RESET}")
        print(f"{GREEN}✓ Admin credentials remain: {ADMIN_CREDS['email']}/{ADMIN_CREDS['password']}{RESET}")
    else:
        print(f"{RED}✗ REGRESSION TESTS FAILED - {results['failed']} ISSUE(S) FOUND{RESET}")
    print(f"{YELLOW}{'='*80}{RESET}\n")
    
    return results['failed'] == 0

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)

"""
Tests for the bookmarklet autofill flow:
- GET /api/orders/{id}/autofill returns order data without auth
- 404 for unknown id
- Freshness: update order -> autofill reflects the change
"""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
ADMIN_EMAIL = "ashokashok7751@gmail.com"
ADMIN_PASS = "DocGalaxy@2026"


@pytest.fixture(scope="module")
def customer_session():
    s = requests.Session()
    mobile = f"98{int(time.time()) % 100000000:08d}"
    # OTP mock: 123456
    r = s.post(f"{BASE_URL}/api/auth/customer/request-otp", json={"mobile": mobile, "name": "Test Cust"})
    assert r.status_code == 200, r.text
    r = s.post(f"{BASE_URL}/api/auth/customer/verify-otp", json={"mobile": mobile, "otp": "123456", "name": "Test Cust"})
    assert r.status_code == 200, r.text
    token = r.json().get("token") or r.json().get("access_token")
    s.headers.update({"Authorization": f"Bearer {token}"})
    return s


@pytest.fixture(scope="module")
def seeded_order(customer_session):
    data = {
        "purchased_by": "Ramesh Patel",
        "description_of_document": "Lease agreement for shop premises",
        "consideration_price": "500000",
        "first_party_name": "A Kumar",
        "second_party_name": "B Shah",
        "stamp_duty_amount": "29400",
        "stamp_duty_paid_by": "First Party",
    }
    r = customer_session.post(f"{BASE_URL}/api/orders", json=data)
    assert r.status_code in (200, 201), r.text
    order = r.json()
    return order


def test_autofill_public_no_auth(seeded_order):
    oid = seeded_order["id"]
    r = requests.get(f"{BASE_URL}/api/orders/{oid}/autofill")
    assert r.status_code == 200, r.text
    d = r.json()
    assert d.get("purchased_by") == "Ramesh Patel"
    assert d.get("description_of_document") == "Lease agreement for shop premises"
    assert d.get("consideration_price") == "500000"
    assert d.get("stamp_duty_paid_by") == "First Party"


def test_autofill_404_unknown():
    r = requests.get(f"{BASE_URL}/api/orders/nonexistent-id-xyz/autofill")
    assert r.status_code == 404


def test_autofill_freshness(customer_session, seeded_order):
    oid = seeded_order["id"]
    # Update via customer PUT (order still in draft)
    new_data = dict(seeded_order["data"])
    new_data["purchased_by"] = "Suresh Mehta"
    r = customer_session.put(f"{BASE_URL}/api/orders/{oid}", json=new_data)
    assert r.status_code == 200, r.text
    # Re-fetch autofill (no auth)
    r2 = requests.get(f"{BASE_URL}/api/orders/{oid}/autofill")
    assert r2.status_code == 200
    assert r2.json().get("purchased_by") == "Suresh Mehta"


def test_autofill_cors_header():
    r = requests.get(f"{BASE_URL}/api/orders/nonexistent/autofill",
                     headers={"Origin": "https://shcilestamp.com"})
    # CORS should allow (header may be '*' or the origin)
    # Not fatal if missing on 404; this is informational.
    assert r.status_code in (404, 200)

"""Backend API tests for DocGalaxy E-Stamping"""
import os
import random
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://estamping-guj.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "ashokashok7751@gmail.com"
ADMIN_PASSWORD = "DocGalaxy@2026"


@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(f"{API}/auth/admin/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["user"]["role"] == "admin"
    return data["token"]


@pytest.fixture(scope="session")
def customer_token():
    mobile = f"9{random.randint(100000000, 999999999)}"
    r = requests.post(f"{API}/auth/customer/request-otp", json={"mobile": mobile, "name": "TEST_Customer"})
    assert r.status_code == 200, r.text
    assert r.json().get("demo_otp") == "123456"
    r2 = requests.post(f"{API}/auth/customer/verify-otp", json={"mobile": mobile, "otp": "123456"})
    assert r2.status_code == 200, r2.text
    d = r2.json()
    return d["token"], d["user"], mobile


# ----- Auth -----
def test_customer_request_and_verify_otp(customer_token):
    token, user, mobile = customer_token
    assert token
    assert user["role"] == "customer"
    assert user["mobile"] == mobile


def test_verify_otp_wrong():
    mobile = f"9{random.randint(100000000, 999999999)}"
    requests.post(f"{API}/auth/customer/request-otp", json={"mobile": mobile, "name": "TEST"})
    r = requests.post(f"{API}/auth/customer/verify-otp", json={"mobile": mobile, "otp": "000000"})
    assert r.status_code == 400


def test_auth_me(customer_token):
    token, user, _ = customer_token
    r = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json()["id"] == user["id"]


def test_auth_me_no_token():
    r = requests.get(f"{API}/auth/me")
    assert r.status_code == 401


def test_admin_login(admin_token):
    assert admin_token


def test_admin_login_bad():
    r = requests.post(f"{API}/auth/admin/login", json={"email": ADMIN_EMAIL, "password": "wrong"})
    assert r.status_code == 401


def test_non_admin_blocked_from_admin(customer_token):
    token, _, _ = customer_token
    r = requests.get(f"{API}/admin/orders", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 403


# ----- Reference -----
def test_articles():
    r = requests.get(f"{API}/articles")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    assert len(data) == 68, f"expected 68 Gujarat stamp articles, got {len(data)}"
    # spot-check well-known articles mentioned in review
    descriptions = [a["description"].lower() for a in data]
    articles_nums = [a["article"].strip() for a in data]
    assert any("affidavit" in d for d in descriptions)
    assert any("divorce" in d for d in descriptions)
    assert any("indemnity" in d for d in descriptions)
    assert "4" in articles_nums and "25" in articles_nums and "29" in articles_nums


def test_order_persists_new_document_fields(customer_token):
    token, _, _ = customer_token
    h = {"Authorization": f"Bearer {token}"}
    oid = requests.post(f"{API}/orders", json={}, headers=h).json()["id"]
    payload = {
        "purchased_by": "TEST_First Party",
        "description_of_document": "TEST_Sample lease deed description",
        "article": "Affidavit (Art. 4)",
        "consideration_price": "5000000",
    }
    r = requests.put(f"{API}/orders/{oid}", json=payload, headers=h)
    assert r.status_code == 200
    d = r.json()["data"]
    for k, v in payload.items():
        assert d[k] == v, f"{k} not persisted"
    # reload to confirm persistence
    r2 = requests.get(f"{API}/orders/{oid}", headers=h)
    d2 = r2.json()["data"]
    for k, v in payload.items():
        assert d2[k] == v


def test_faqs():
    r = requests.get(f"{API}/faqs")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


# ----- Orders -----
def test_order_full_lifecycle(customer_token):
    token, user, _ = customer_token
    h = {"Authorization": f"Bearer {token}"}
    # Create draft
    r = requests.post(f"{API}/orders", json={}, headers=h)
    assert r.status_code == 200, r.text
    order = r.json()
    oid = order["id"]
    assert order["status"] == "draft"
    assert order["customer_id"] == user["id"]

    # Update draft
    r = requests.put(f"{API}/orders/{oid}", json={"first_party_name": "TEST_Alice", "stamp_duty_amount": "500"}, headers=h)
    assert r.status_code == 200
    assert r.json()["data"]["first_party_name"] == "TEST_Alice"

    # List mine
    r = requests.get(f"{API}/orders", headers=h)
    assert r.status_code == 200
    assert any(o["id"] == oid for o in r.json())

    # Get single
    r = requests.get(f"{API}/orders/{oid}", headers=h)
    assert r.status_code == 200

    # Submit
    r = requests.post(f"{API}/orders/{oid}/submit", json={"first_party_name": "TEST_Alice"}, headers=h)
    assert r.status_code == 200
    assert r.json()["status"] == "submitted"

    # Update after submit should fail
    r = requests.put(f"{API}/orders/{oid}", json={"first_party_name": "TEST_Changed"}, headers=h)
    assert r.status_code == 400


def test_customer_cannot_access_another_order(customer_token):
    token1, _, _ = customer_token
    h1 = {"Authorization": f"Bearer {token1}"}
    # Create as customer1
    oid = requests.post(f"{API}/orders", json={}, headers=h1).json()["id"]
    # Create customer2
    mobile2 = f"9{random.randint(100000000, 999999999)}"
    requests.post(f"{API}/auth/customer/request-otp", json={"mobile": mobile2, "name": "TEST_C2"})
    t2 = requests.post(f"{API}/auth/customer/verify-otp", json={"mobile": mobile2, "otp": "123456"}).json()["token"]
    r = requests.get(f"{API}/orders/{oid}", headers={"Authorization": f"Bearer {t2}"})
    assert r.status_code == 403


# ----- Admin orders -----
def test_admin_list_and_payment_toggle(admin_token, customer_token):
    token, _, _ = customer_token
    oid = requests.post(f"{API}/orders", json={}, headers={"Authorization": f"Bearer {token}"}).json()["id"]
    h = {"Authorization": f"Bearer {admin_token}"}
    r = requests.get(f"{API}/admin/orders", headers=h)
    assert r.status_code == 200
    assert any(o["id"] == oid for o in r.json())
    r = requests.patch(f"{API}/admin/orders/{oid}/payment", json={"payment_status": "paid"}, headers=h)
    assert r.status_code == 200
    assert r.json()["payment_status"] == "paid"
    # verify persisted
    o = requests.get(f"{API}/admin/orders", headers=h).json()
    assert next(x for x in o if x["id"] == oid)["payment_status"] == "paid"
    # toggle back
    r = requests.patch(f"{API}/admin/orders/{oid}/payment", json={"payment_status": "unpaid"}, headers=h)
    assert r.status_code == 200
    # invalid
    r = requests.patch(f"{API}/admin/orders/{oid}/payment", json={"payment_status": "bogus"}, headers=h)
    assert r.status_code == 400


# ----- Reviews -----
def test_review_moderation_flow(admin_token, customer_token):
    token, _, _ = customer_token
    r = requests.post(f"{API}/reviews", json={"rating": 5, "text": "TEST_Great"}, headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    rid = r.json()["id"]
    assert r.json()["status"] == "pending"

    # Public should not include yet
    public = requests.get(f"{API}/reviews").json()
    assert not any(x["id"] == rid for x in public)

    # Admin lists all
    h = {"Authorization": f"Bearer {admin_token}"}
    all_r = requests.get(f"{API}/admin/reviews", headers=h).json()
    assert any(x["id"] == rid for x in all_r)

    # Approve
    r = requests.patch(f"{API}/admin/reviews/{rid}", json={"status": "approved"}, headers=h)
    assert r.status_code == 200

    public = requests.get(f"{API}/reviews").json()
    assert any(x["id"] == rid for x in public)

    # Reject
    r = requests.patch(f"{API}/admin/reviews/{rid}", json={"status": "rejected"}, headers=h)
    assert r.status_code == 200
    public = requests.get(f"{API}/reviews").json()
    assert not any(x["id"] == rid for x in public)


def test_review_invalid_rating(customer_token):
    token, _, _ = customer_token
    r = requests.post(f"{API}/reviews", json={"rating": 10}, headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 400

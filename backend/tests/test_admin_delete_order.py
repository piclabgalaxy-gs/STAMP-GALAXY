"""Tests for DELETE /api/admin/orders/{id} and related flows (iter 12)."""
import os
import time
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://estamping-guj.preview.emergentagent.com").rstrip("/")
ADMIN_EMAIL = "ashokashok7751@gmail.com"
ADMIN_PASSWORD = "DocGalaxy@2026"


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{BASE_URL}/api/auth/admin/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="module")
def customer_token():
    mobile = f"9{int(time.time()) % 1000000000:09d}"
    requests.post(f"{BASE_URL}/api/auth/customer/request-otp", json={"mobile": mobile, "name": "TEST_Delete"})
    r = requests.post(f"{BASE_URL}/api/auth/customer/verify-otp", json={"mobile": mobile, "otp": "123456"})
    assert r.status_code == 200, r.text
    return r.json()["token"], mobile


def _create_submitted_order(customer_token):
    tok, _ = customer_token
    h = {"Authorization": f"Bearer {tok}"}
    payload = {"purchased_by": "TEST_DeleteCase", "article": "Agreement"}
    r = requests.post(f"{BASE_URL}/api/orders", headers=h, json=payload)
    assert r.status_code == 200, r.text
    oid = r.json()["id"]
    r2 = requests.post(f"{BASE_URL}/api/orders/{oid}/submit", headers=h, json=payload)
    assert r2.status_code == 200, r2.text
    return oid


def test_delete_requires_admin_auth(customer_token):
    # No auth
    r = requests.delete(f"{BASE_URL}/api/admin/orders/does-not-matter")
    assert r.status_code == 401
    # Customer auth -> 403
    tok, _ = customer_token
    r = requests.delete(f"{BASE_URL}/api/admin/orders/does-not-matter", headers={"Authorization": f"Bearer {tok}"})
    assert r.status_code == 403


def test_delete_nonexistent_returns_404(admin_token):
    r = requests.delete(f"{BASE_URL}/api/admin/orders/nonexistent-id-xyz", headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 404


def test_delete_success_removes_order(admin_token, customer_token):
    oid = _create_submitted_order(customer_token)
    h = {"Authorization": f"Bearer {admin_token}"}
    # Verify present
    r = requests.get(f"{BASE_URL}/api/admin/orders", headers=h)
    assert r.status_code == 200
    assert any(o["id"] == oid for o in r.json())
    # Delete
    r = requests.delete(f"{BASE_URL}/api/admin/orders/{oid}", headers=h)
    assert r.status_code == 200
    body = r.json()
    assert body.get("order_id") == oid
    # Verify removed
    r = requests.get(f"{BASE_URL}/api/admin/orders", headers=h)
    assert not any(o["id"] == oid for o in r.json())
    # Second delete -> 404
    r = requests.delete(f"{BASE_URL}/api/admin/orders/{oid}", headers=h)
    assert r.status_code == 404


def test_admin_orders_lists_submitted(admin_token, customer_token):
    oid = _create_submitted_order(customer_token)
    r = requests.get(f"{BASE_URL}/api/admin/orders", headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 200
    orders = r.json()
    found = next((o for o in orders if o["id"] == oid), None)
    assert found is not None
    assert found["status"] == "submitted"
    assert found["submitted_at"]
    # Cleanup
    requests.delete(f"{BASE_URL}/api/admin/orders/{oid}", headers={"Authorization": f"Bearer {admin_token}"})

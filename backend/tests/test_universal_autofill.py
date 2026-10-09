"""Tests for universal autofill: /autofill/select (admin) & /autofill/current/{key} (public)."""
import os, time, requests, pytest

BASE = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")

ADMIN_EMAIL = "ashokashok7751@gmail.com"
ADMIN_PASSWORD = "DocGalaxy@2026"


@pytest.fixture(scope="module")
def admin_sess():
    s = requests.Session()
    r = s.post(f"{BASE}/api/auth/admin/login",
               json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    body = r.json()
    tok = body["token"]
    s.headers.update({"Authorization": f"Bearer {tok}"})
    s.autofill_key = body["user"]["autofill_key"]
    return s


@pytest.fixture(scope="module")
def two_orders():
    ts = int(time.time()) % 100000
    out = []
    for i, (prefix, pby, fp, cons) in enumerate([
        ("98", "KULDEEP PATGIR", "A Kumar", "500000"),
        ("97", "RAMESH SHAH", "B Patel", "250000"),
    ]):
        mob = f"{prefix}{ts:05d}{i:02d}"
        s = requests.Session()
        s.post(f"{BASE}/api/auth/customer/request-otp",
               json={"mobile": mob, "name": "T"})
        r = s.post(f"{BASE}/api/auth/customer/verify-otp",
                   json={"mobile": mob, "otp": "123456", "name": "T"})
        tok = r.json()["token"]
        s.headers.update({"Authorization": f"Bearer {tok}"})
        r = s.post(f"{BASE}/api/orders", json={
            "purchased_by": pby, "first_party_name": fp,
            "consideration_price": cons, "article": "Lease",
            "description_of_document": "Test",
        })
        oid = r.json()["id"]
        s.post(f"{BASE}/api/orders/{oid}/submit")
        out.append({"id": oid, "purchased_by": pby, "first_party_name": fp,
                    "consideration_price": cons})
    return out


def test_admin_has_autofill_key(admin_sess):
    assert admin_sess.autofill_key
    assert len(admin_sess.autofill_key) == 32
    int(admin_sess.autofill_key, 16)  # hex


def test_me_returns_autofill_key(admin_sess):
    r = admin_sess.get(f"{BASE}/api/auth/me")
    assert r.status_code == 200
    assert r.json().get("autofill_key") == admin_sess.autofill_key


def test_select_and_current_endpoint(admin_sess, two_orders):
    A, B = two_orders
    key = admin_sess.autofill_key

    # Select A
    r = admin_sess.post(f"{BASE}/api/autofill/select", json={"order_id": A["id"]})
    assert r.status_code == 200, r.text

    # Public GET should return A's data (no auth)
    pub = requests.get(f"{BASE}/api/autofill/current/{key}")
    assert pub.status_code == 200
    data = pub.json()
    assert data.get("purchased_by") == "KULDEEP PATGIR"
    assert data.get("first_party_name") == "A Kumar"
    assert data.get("consideration_price") == "500000"

    # Select B
    r = admin_sess.post(f"{BASE}/api/autofill/select", json={"order_id": B["id"]})
    assert r.status_code == 200

    pub2 = requests.get(f"{BASE}/api/autofill/current/{key}")
    assert pub2.status_code == 200
    data2 = pub2.json()
    assert data2.get("purchased_by") == "RAMESH SHAH"
    assert data2.get("first_party_name") == "B Patel"
    assert data2.get("consideration_price") == "250000"


def test_current_public_no_auth_required(admin_sess, two_orders):
    # No Authorization header
    r = requests.get(f"{BASE}/api/autofill/current/{admin_sess.autofill_key}")
    assert r.status_code == 200


def test_current_unknown_key_404():
    r = requests.get(f"{BASE}/api/autofill/current/" + "0" * 32)
    assert r.status_code == 404


def test_select_requires_admin():
    r = requests.post(f"{BASE}/api/autofill/select", json={"order_id": "x"})
    assert r.status_code in (401, 403)


def test_select_invalid_order(admin_sess):
    r = admin_sess.post(f"{BASE}/api/autofill/select",
                        json={"order_id": "nonexistent-id-xyz"})
    assert r.status_code == 404

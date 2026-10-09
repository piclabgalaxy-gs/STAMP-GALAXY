"""Seed 3 orders with distinct purchased_by names, mobiles, and articles for search/bookmarklet UI tests."""
import os, time, json, requests
BASE = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")

def login_customer(mobile, name):
    s = requests.Session()
    s.post(f"{BASE}/api/auth/customer/request-otp", json={"mobile": mobile, "name": name})
    r = s.post(f"{BASE}/api/auth/customer/verify-otp", json={"mobile": mobile, "otp": "123456", "name": name})
    tok = r.json()["token"]
    s.headers.update({"Authorization": f"Bearer {tok}"})
    return s

def mk(sess, data):
    r = sess.post(f"{BASE}/api/orders", json=data)
    r.raise_for_status()
    oid = r.json()["id"]
    sess.post(f"{BASE}/api/orders/{oid}/submit")
    return oid

ts = int(time.time()) % 100000
orders = []
# Order 1: KULDEEP PATGIR, Lease agreement
s1 = login_customer(f"98{ts:05d}11", "Kuldeep Customer")
orders.append(("Kuldeep", mk(s1, {
    "purchased_by": "KULDEEP PATGIR",
    "description_of_document": "Rental Lease Agreement",
    "article": "Lease", "consideration_price": "100000",
    "first_party_name": "Kuldeep P", "first_party_mobile": f"98{ts:05d}11",
    "second_party_name": "Owner Co",
})))
# Order 2: RAMESH PATEL, Affidavit
s2 = login_customer(f"97{ts:05d}22", "Ramesh Customer")
orders.append(("Ramesh", mk(s2, {
    "purchased_by": "RAMESH PATEL",
    "description_of_document": "Sworn Statement",
    "article": "Affidavit", "consideration_price": "0",
    "first_party_name": "Ramesh P", "first_party_mobile": f"97{ts:05d}22",
})))
# Order 3: SUNITA SHARMA, Sale Deed
s3 = login_customer(f"96{ts:05d}33", "Sunita Customer")
orders.append(("Sunita", mk(s3, {
    "purchased_by": "SUNITA SHARMA",
    "description_of_document": "Property Sale",
    "article": "Sale Deed", "consideration_price": "500000",
    "first_party_name": "Sunita S", "first_party_mobile": f"96{ts:05d}33",
})))

print(json.dumps({"orders": orders, "mobiles": [f"98{ts:05d}11", f"97{ts:05d}22", f"96{ts:05d}33"]}))

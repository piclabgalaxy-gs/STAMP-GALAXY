"""Seed two orders (A full, B with empties) and print their IDs."""
import os, time, json, sys, requests
BASE = os.environ.get("REACT_APP_BACKEND_URL", "https://estamping-guj.preview.emergentagent.com").rstrip("/")

def customer():
    s = requests.Session()
    mobile = f"97{int(time.time()) % 100000000:08d}"
    s.post(f"{BASE}/api/auth/customer/request-otp", json={"mobile": mobile, "name": "Seeder"})
    r = s.post(f"{BASE}/api/auth/customer/verify-otp", json={"mobile": mobile, "otp": "123456", "name": "Seeder"})
    tok = r.json().get("token") or r.json().get("access_token")
    s.headers.update({"Authorization": f"Bearer {tok}"})
    return s

def mk(sess, data):
    r = sess.post(f"{BASE}/api/orders", json=data)
    assert r.status_code in (200, 201), r.text
    return r.json()["id"]

A = {
  "purchased_by": "Ramesh Patel",
  "description_of_document": "Lease agreement for shop premises",
  "consideration_price": "500000",
  "first_party_name": "A Kumar",
  "first_party_address1": "12 MG Road Ahmedabad",
  "first_party_mobile": "9111111111",
  "first_party_email": "akumar@test.com",
  "second_party_name": "B Shah",
  "second_party_address1": "7 Ring Road Surat",
  "second_party_mobile": "9222222222",
  "second_party_email": "bshah@test.com",
  "stamp_duty_amount": "29400",
  "stamp_duty_paid_by": "First Party",
}
B = dict(A)
B["first_party_address1"] = ""
B["second_party_email"] = ""

s = customer()
a = mk(s, A)
b = mk(s, B)
print(json.dumps({"A": a, "B": b}))

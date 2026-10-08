from dotenv import load_dotenv
from pathlib import Path
import os

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import logging
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
import json
import random
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt

from seed_data import GUJARAT_STAMP_ARTICLES, FAQS

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = "HS256"

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# ----------------- Helpers -----------------
def now_iso():
    return datetime.now(timezone.utc).isoformat()


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_token(user_id: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_user(request: Request) -> dict:
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = auth_header[7:]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


async def get_admin_user(request: Request) -> dict:
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


# ----------------- Models -----------------
class CustomerOTPRequest(BaseModel):
    mobile: str
    name: str


class CustomerOTPVerify(BaseModel):
    mobile: str
    otp: str


class AdminLogin(BaseModel):
    email: str
    password: str


class OrderData(BaseModel):
    purchased_by: Optional[str] = ""
    description_of_document: Optional[str] = ""
    consideration_price: Optional[str] = ""
    first_party_name: Optional[str] = ""
    first_party_address1: Optional[str] = ""
    first_party_address2: Optional[str] = ""
    first_party_address3: Optional[str] = ""
    first_party_pin: Optional[str] = ""
    first_party_pan: Optional[str] = ""
    second_party_name: Optional[str] = ""
    second_party_address1: Optional[str] = ""
    second_party_address2: Optional[str] = ""
    second_party_address3: Optional[str] = ""
    second_party_pin: Optional[str] = ""
    second_party_pan: Optional[str] = ""
    stamp_duty_amount: Optional[str] = ""
    stamp_duty_paid_by: Optional[str] = ""
    gender: Optional[str] = ""
    proof_of_identity: Optional[str] = ""
    proof_of_residence: Optional[str] = ""
    mode_of_payment: Optional[str] = ""
    first_party_mobile: Optional[str] = ""
    first_party_email: Optional[str] = ""
    second_party_mobile: Optional[str] = ""
    second_party_email: Optional[str] = ""


class ReviewCreate(BaseModel):
    rating: int
    text: Optional[str] = ""


# ----------------- Auth Endpoints -----------------
@api_router.post("/auth/customer/request-otp")
async def customer_request_otp(body: CustomerOTPRequest):
    mobile = body.mobile.strip()
    name = body.name.strip()
    if not mobile:
        raise HTTPException(status_code=400, detail="Mobile number is required")
    otp = "123456"  # MOCK OTP for demo
    await db.otps.update_one(
        {"mobile": mobile},
        {"$set": {"mobile": mobile, "name": name, "otp": otp, "created_at": now_iso()}},
        upsert=True,
    )
    logger.info(f"[MOCK OTP] {mobile} -> {otp}")
    return {"message": "OTP sent successfully", "demo_otp": otp}


@api_router.post("/auth/customer/verify-otp")
async def customer_verify_otp(body: CustomerOTPVerify):
    mobile = body.mobile.strip()
    record = await db.otps.find_one({"mobile": mobile})
    if not record or record.get("otp") != body.otp.strip():
        raise HTTPException(status_code=400, detail="Invalid OTP. Please try again.")
    user = await db.users.find_one({"mobile": mobile, "role": "customer"}, {"_id": 0})
    if not user:
        user = {
            "id": str(uuid.uuid4()),
            "mobile": mobile,
            "name": record.get("name", ""),
            "role": "customer",
            "created_at": now_iso(),
        }
        await db.users.insert_one(dict(user))
    else:
        if record.get("name"):
            await db.users.update_one({"id": user["id"]}, {"$set": {"name": record["name"]}})
            user["name"] = record["name"]
    user.pop("_id", None)
    token = create_token(user["id"], "customer")
    return {"token": token, "user": {k: v for k, v in user.items() if k != "_id"}}


@api_router.post("/auth/admin/login")
async def admin_login(body: AdminLogin):
    email = body.email.strip().lower()
    user = await db.users.find_one({"email": email, "role": "admin"})
    if not user or not verify_password(body.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_token(user["id"], "admin")
    return {"token": token, "user": {"id": user["id"], "email": user["email"], "name": user.get("name", "Admin"), "role": "admin"}}


@api_router.get("/auth/me")
async def auth_me(user: dict = Depends(get_current_user)):
    return user


# ----------------- Reference Data -----------------
@api_router.get("/articles")
async def get_articles():
    return GUJARAT_STAMP_ARTICLES


@api_router.get("/faqs")
async def get_faqs():
    return FAQS


# ----------------- Orders -----------------
def order_public(doc: dict) -> dict:
    doc.pop("_id", None)
    return doc


@api_router.post("/orders")
async def create_order(data: OrderData, user: dict = Depends(get_current_user)):
    order = {
        "id": str(uuid.uuid4()),
        "customer_id": user["id"],
        "customer_name": user.get("name", ""),
        "customer_mobile": user.get("mobile", ""),
        "status": "draft",
        "payment_status": "unpaid",
        "data": data.model_dump(),
        "created_at": now_iso(),
        "updated_at": now_iso(),
        "submitted_at": None,
    }
    await db.orders.insert_one(dict(order))
    return order_public(order)


@api_router.get("/orders")
async def my_orders(user: dict = Depends(get_current_user)):
    orders = await db.orders.find({"customer_id": user["id"]}, {"_id": 0}).sort("updated_at", -1).to_list(1000)
    return orders


@api_router.get("/orders/{order_id}")
async def get_order(order_id: str, user: dict = Depends(get_current_user)):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if user.get("role") != "admin" and order["customer_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    return order


@api_router.put("/orders/{order_id}")
async def update_order(order_id: str, data: OrderData, user: dict = Depends(get_current_user)):
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order["customer_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    if order["status"] == "submitted":
        raise HTTPException(status_code=400, detail="Submitted orders cannot be edited")
    await db.orders.update_one(
        {"id": order_id},
        {"$set": {"data": data.model_dump(), "updated_at": now_iso()}},
    )
    updated = await db.orders.find_one({"id": order_id}, {"_id": 0})
    return updated


@api_router.post("/orders/{order_id}/submit")
async def submit_order(order_id: str, data: OrderData, user: dict = Depends(get_current_user)):
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order["customer_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    if order["status"] == "submitted":
        raise HTTPException(status_code=400, detail="Order already submitted")
    await db.orders.update_one(
        {"id": order_id},
        {"$set": {"data": data.model_dump(), "status": "submitted", "submitted_at": now_iso(), "updated_at": now_iso()}},
    )
    updated = await db.orders.find_one({"id": order_id}, {"_id": 0})
    return updated


# ----------------- Admin Orders -----------------
@api_router.get("/admin/orders")
async def admin_orders(admin: dict = Depends(get_admin_user)):
    orders = await db.orders.find({}, {"_id": 0}).sort("updated_at", -1).to_list(2000)
    return orders


@api_router.patch("/admin/orders/{order_id}/payment")
async def admin_update_payment(order_id: str, body: dict, admin: dict = Depends(get_admin_user)):
    status = body.get("payment_status")
    if status not in ("paid", "unpaid"):
        raise HTTPException(status_code=400, detail="Invalid payment status")
    result = await db.orders.update_one({"id": order_id}, {"$set": {"payment_status": status, "updated_at": now_iso()}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"message": "Payment status updated", "payment_status": status}


# ----------------- Reviews -----------------
@api_router.post("/reviews")
async def create_review(body: ReviewCreate, user: dict = Depends(get_current_user)):
    if body.rating < 1 or body.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    review = {
        "id": str(uuid.uuid4()),
        "customer_id": user["id"],
        "customer_name": user.get("name", "Customer"),
        "rating": body.rating,
        "text": body.text or "",
        "status": "pending",
        "created_at": now_iso(),
    }
    await db.reviews.insert_one(dict(review))
    review.pop("_id", None)
    return review


@api_router.get("/reviews")
async def public_reviews():
    reviews = await db.reviews.find({"status": "approved"}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return reviews


@api_router.get("/admin/reviews")
async def admin_reviews(admin: dict = Depends(get_admin_user)):
    reviews = await db.reviews.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return reviews


@api_router.patch("/admin/reviews/{review_id}")
async def admin_moderate_review(review_id: str, body: dict, admin: dict = Depends(get_admin_user)):
    status = body.get("status")
    if status not in ("approved", "rejected", "pending"):
        raise HTTPException(status_code=400, detail="Invalid status")
    result = await db.reviews.update_one({"id": review_id}, {"$set": {"status": status}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Review not found")
    return {"message": "Review updated", "status": status}


@api_router.get("/")
async def root():
    return {"message": "DocGalaxy E-Stamping API"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    # Seed admin
    admin_email = os.environ["ADMIN_EMAIL"].strip().lower()
    admin_password = os.environ["ADMIN_PASSWORD"]
    existing = await db.users.find_one({"email": admin_email, "role": "admin"})
    if existing is None:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "name": "DocGalaxy Admin",
            "role": "admin",
            "created_at": now_iso(),
        })
        logger.info(f"Seeded admin: {admin_email}")
    elif not verify_password(admin_password, existing.get("password_hash", "")):
        await db.users.update_one({"id": existing["id"]}, {"$set": {"password_hash": hash_password(admin_password)}})
        logger.info("Updated admin password")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

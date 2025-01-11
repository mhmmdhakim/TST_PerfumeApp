from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict
from bson import ObjectId
import httpx
from ..database import db, orders_collection
from ..routes.auth import get_current_active_user
from datetime import datetime
from pydantic import BaseModel

router = APIRouter()

SOLSTRA_API_BASE = "https://api-staging.solstra.fi"
WEBHOOK_BASE_URL = "https://perfume-app-production.up.railway.app"

class CheckoutRequest(BaseModel):
    shipping_info: Dict

async def get_cart(user_email: str):
    """Get user's cart or create if not exists"""
    cart = await db.carts.find_one({"user_email": user_email})
    if not cart:
        cart = {
            "user_email": user_email,
            "items": [],
            "total_amount": 0
        }
        await db.carts.insert_one(cart)
    return cart

async def clear_cart(user_email: str):
    """Clear user's cart after successful checkout"""
    await db.carts.update_one(
        {"user_email": user_email},
        {"$set": {"items": [], "total_amount": 0}}
    )

async def create_solstra_payment(amount: float, currency: str = "USDT"):
    """Create payment in Solstra payment service"""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{SOLSTRA_API_BASE}/service/pay/create",
                json={
                    "currency": currency,
                    "amount": amount,
                    "webhookURL": f"{WEBHOOK_BASE_URL}/api/webhook"
                }
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Error communicating with payment service: {str(e)}"
            )

@router.post("/checkout")
async def checkout(
    request: CheckoutRequest,
    current_user: Dict = Depends(get_current_active_user)
):
    """Process checkout and create order"""
    try:
        # Validate shipping info
        required_fields = ["address", "city", "country", "postal_code", "phone"]
        for field in required_fields:
            if field not in request.shipping_info:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Missing required field: {field}"
                )

        # Get cart and validate
        cart = await get_cart(current_user["email"])
        if not cart["items"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cart is empty"
            )

        # Create payment with Solstra
        payment_data = await create_solstra_payment(cart["total_amount"])
        if payment_data.get("status") != "success":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create payment"
            )

        # Create order
        order = {
            "user_email": current_user["email"],
            "items": cart["items"],
            "total_amount": cart["total_amount"],
            "shipping_info": request.shipping_info,
            "payment_id": payment_data["data"]["id"],
            "wallet_address": payment_data["data"]["walletAddress"],
            "currency": payment_data["data"]["currency"],
            "status": "pending",
            "payment_status": "pending",
            "created_at": datetime.utcnow()
        }

        # Save order
        result = await orders_collection.insert_one(order)
        order_id = str(result.inserted_id)

        # Clear cart after successful order creation
        await clear_cart(current_user["email"])

        return {
            "id": payment_data["data"]["id"],
            "order_id": order_id,
            "walletAddress": payment_data["data"]["walletAddress"],
            "amount": payment_data["data"]["amount"],
            "currency": payment_data["data"]["currency"]
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Checkout error: {str(e)}")  # Add logging for debugging
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
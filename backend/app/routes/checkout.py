from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict
from bson import ObjectId
import httpx
from ..database import db, orders_collection
from ..routes.auth import get_current_active_user
from datetime import datetime
from ..models import CheckoutRequest, ShippingInfo, Cart, Order

router = APIRouter()

SOLSTRA_API_BASE = "https://api-staging.solstra.fi"
WEBHOOK_BASE_URL = "https://perfume-app-production.up.railway.app"

async def get_cart(user_email: str) -> Cart:
    """Get user's cart or create if not exists"""
    cart_dict = await db.carts.find_one({"user_email": user_email})
    if not cart_dict:
        cart_dict = {
            "user_email": user_email,
            "items": [],
            "total_amount": 0
        }
        await db.carts.insert_one(cart_dict)
    return Cart(**cart_dict)

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
        # Get cart and validate
        cart = await get_cart(current_user["email"])
        if not cart.items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cart is empty"
            )

        # Create payment with Solstra
        payment_data = await create_solstra_payment(cart.total_amount)
        if payment_data.get("status") != "success":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create payment"
            )

        # Create order using pydantic model
        order = Order(
            user_email=current_user["email"],
            items=cart.items,
            total_amount=cart.total_amount,
            shipping_info=request.shipping_info,
            payment_id=payment_data["data"]["id"],
            wallet_address=payment_data["data"]["walletAddress"],
            currency=payment_data["data"]["currency"],
            status="pending",
            payment_status="pending"
        )

        # Convert order to dict and save
        order_dict = order.dict()
        result = await orders_collection.insert_one(order_dict)
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

@router.post("/check/{payment_id}")
async def check_payment_status(
    payment_id: str,
    current_user: Dict = Depends(get_current_active_user)
):
    """Check payment status"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{SOLSTRA_API_BASE}/service/pay/{payment_id}/check"
            )
            response.raise_for_status()
            payment_data = response.json()

            if payment_data["data"]["isPaid"]:
                await orders_collection.update_one(
                    {"payment_id": payment_id},
                    {
                        "$set": {
                            "status": "paid",
                            "payment_status": "completed",
                            "payment_updated_at": datetime.utcnow()
                        }
                    }
                )

            return payment_data

    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Error checking payment status: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/update-currency")
async def update_payment_currency(data: Dict):
    """Update payment currency"""
    try:
        payment_id = data.get("payment_id")
        currency = data.get("currency")

        if not all([payment_id, currency]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment ID and currency are required"
            )

        order = await orders_collection.find_one({"payment_id": payment_id})
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )

        # Create new payment with updated currency
        payment_data = await create_solstra_payment(
            amount=order["total_amount"],
            currency=currency
        )

        if payment_data["status"] != "success":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to update currency"
            )

        # Update order with new payment information
        await orders_collection.update_one(
            {"payment_id": payment_id},
            {
                "$set": {
                    "payment_id": payment_data["data"]["id"],
                    "wallet_address": payment_data["data"]["walletAddress"],
                    "currency": currency,
                    "payment_updated_at": datetime.utcnow()
                }
            }
        )

        return {
            "walletAddress": payment_data["data"]["walletAddress"],
            "amount": payment_data["data"]["amount"],
            "currency": currency
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/webhook")
async def payment_webhook(data: Dict):
    """Handle payment webhook from Solstra"""
    try:
        payment_id = data.get("payment_id")
        if not payment_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment ID is required"
            )
        
        result = await orders_collection.update_one(
            {"payment_id": payment_id},
            {
                "$set": {
                    "status": "paid",
                    "payment_status": "completed",
                    "payment_updated_at": datetime.utcnow()
                }
            }
        )

        if result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )

        return {"status": "success"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing webhook: {str(e)}"
        )
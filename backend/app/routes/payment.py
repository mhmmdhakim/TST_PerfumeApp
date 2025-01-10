# backend/app/routes/payment.py
from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict
import httpx
from ..database import orders_collection
from ..routes.auth import get_current_active_user
from datetime import datetime

router = APIRouter()

SOLSTRA_API_BASE = "https://api-staging.solstra.fi"
WEBHOOK_BASE_URL = "https://perfume-app-production.up.railway.app"

async def create_payment(amount: float):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{SOLSTRA_API_BASE}/service/pay/create",
            json={
                "currency": "USDT",  # or "SOL" based on your preference
                "amount": amount,
                "webhookURL": f"{WEBHOOK_BASE_URL}/api/payment/webhook"
            }
        )
        return response.json()

@router.post("/payment/create")
async def create_payment_order(
    order_data: Dict,
    current_user: Dict = Depends(get_current_active_user)
):
    try:
        order_id = order_data["order_id"]
        amount = order_data["amount"]

        # Create payment in Solstra
        payment_data = await create_payment(amount)

        if payment_data["status"] != "success":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create payment"
            )

        # Update order with payment information
        await orders_collection.update_one(
            {"_id": order_id},
            {
                "$set": {
                    "payment_id": payment_data["data"]["id"],
                    "payment_status": "pending",
                    "payment_updated_at": datetime.utcnow()
                }
            }
        )

        return payment_data

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating payment: {str(e)}"
        )

@router.post("/payment/check/{payment_id}")
async def check_payment_status(
    payment_id: str,
    current_user: Dict = Depends(get_current_active_user)
):
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{SOLSTRA_API_BASE}/service/pay/{payment_id}/check"
            )
            payment_data = response.json()

            if payment_data["data"]["isPaid"]:
                # Update order status
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

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error checking payment status: {str(e)}"
        )

@router.post("/payment/webhook")
async def payment_webhook(data: Dict):
    try:
        payment_id = data["payment_id"]
        
        # Update order status
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

        return {"status": "success"}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing webhook: {str(e)}"
        )
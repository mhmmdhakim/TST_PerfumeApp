from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict
from ..database import orders_collection
from .auth import get_current_active_user
from ..services.cart import CartManager
from datetime import datetime
import httpx

router = APIRouter()

SOLSTRA_API_BASE = "https://api-staging.solstra.fi"
WEBHOOK_BASE_URL = "https://perfume-app-production.up.railway.app"

class CheckoutManager:
    def __init__(self):
        self.orders_collection = orders_collection
        self.cart_manager = CartManager()

    async def create_payment(self, amount: float, currency: str = "USDT"):
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{SOLSTRA_API_BASE}/service/pay/create",
                    json={
                        "currency": currency,
                        "amount": amount,
                        "webhookURL": f"{WEBHOOK_BASE_URL}/api/payment/webhook"
                    }
                )
                return response.json()
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to create Solstra payment: {str(e)}"
                )

    async def process_checkout(self, user_email: str) -> Dict:
        try:
            # 1. Get cart
            cart = await self.cart_manager.get_cart(user_email)
            if not cart["items"]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cart is empty"
                )

            # 2. Create Solstra payment
            payment_data = await self.create_payment(cart["total_amount"])
            
            if payment_data.get("status") != "success":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to create payment"
                )

            # 3. Create order
            order = {
                "user_email": user_email,
                "items": cart["items"],
                "total_amount": cart["total_amount"],
                "payment_id": payment_data["data"]["id"],
                "wallet_address": payment_data["data"]["walletAddress"],
                "currency": payment_data["data"]["currency"],
                "status": "pending",
                "created_at": datetime.utcnow()
            }

            # 4. Save order
            result = await self.orders_collection.insert_one(order)
            order_id = str(result.inserted_id)

            # 5. Clear cart
            await self.cart_manager.clear_cart(user_email)

            return {
                "order_id": order_id,
                "payment_id": payment_data["data"]["id"],
                "wallet_address": payment_data["data"]["walletAddress"],
                "amount": payment_data["data"]["amount"],
                "currency": payment_data["data"]["currency"],
                "status": "pending"
            }

        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error processing checkout: {str(e)}"
            )

@router.post("/checkout")
async def checkout(current_user: Dict = Depends(get_current_active_user)):
    try:
        checkout_manager = CheckoutManager()
        return await checkout_manager.process_checkout(current_user["email"])
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error during checkout: {str(e)}"
        )
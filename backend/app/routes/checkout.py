# src/routes/checkout.py
from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Optional
import httpx
import os
from datetime import datetime
from bson import ObjectId

from ..database import orders_collection, carts_collection
from ..routes.auth import get_current_active_user
from ..services.cart import CartManager

router = APIRouter()

PAYMENT_API_BASE_URL = "https://api-staging.solstra.fi"
API_KEY = os.getenv("SOLSTRAFI_API_KEY")  # Menggunakan API key dari .env
API_BASE_URL = os.getenv("API_BASE_URL")
SOL_TO_IDR = 3200000  # Konversi rate: 1 SOL = Rp 3.200.000

class CheckoutManager:
    def __init__(self):
        self.cart_manager = CartManager()
        
    async def create_payment(self, order_id: str, currency: str = "SOL") -> Dict:
        try:
            order = orders_collection.find_one({"_id": ObjectId(order_id)})
            if not order:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Order not found"
                )

            webhook_url = f"{API_BASE_URL}/api/checkout/webhook"
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{PAYMENT_API_BASE_URL}/service/pay/create",
                    headers={
                        "X-Api-Key": API_KEY,
                        "Content-Type": "application/json"
                    },
                    json={
                        "currency": currency,
                        "amount": order["total_amount_sol"],
                        "webhookURL": webhook_url
                    }
                )
                
                if response.status_code != 200:
                    error_detail = response.json() if response.content else response.text
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=f"Failed to create payment: {error_detail}"
                    )

                payment_data = response.json()["data"]
                
                update_data = {
                    "payment_id": payment_data["id"],
                    "payment_currency": currency,
                    "payment_wallet": payment_data["walletAddress"],
                    "payment_check_url": payment_data["checkPaid"],
                    "payment_sol_amount": order["total_amount_sol"],
                    "updated_at": datetime.utcnow()
                }

                orders_collection.update_one(
                    {"_id": ObjectId(order_id)},
                    {"$set": update_data}
                )

                return {
                    **payment_data,
                    "originalPrice": f"Rp {order['total_amount_idr']:,.2f}",
                    "convertedAmount": f"{order['total_amount_sol']} SOL",
                    "rate": f"1 SOL = Rp {SOL_TO_IDR:,}",
                    "solanaPayLink": f"solana:{payment_data['walletAddress']}"
                }

        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error creating payment: {str(e)}"
            )

    async def check_payment_status(self, order_id: str) -> Dict:
        try:
            order = orders_collection.find_one({"_id": ObjectId(order_id)})
            if not order:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Order not found"
                )

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{PAYMENT_API_BASE_URL}/service/pay/{order['payment_id']}/check",
                    headers={
                        "X-Api-Key": API_KEY,
                        "Content-Type": "application/json"
                    }
                )
                
                if response.status_code != 200:
                    error_detail = response.json() if response.content else response.text
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=f"Failed to check payment status: {error_detail}"
                    )

                payment_status = response.json()
                
                if payment_status["data"]["isPaid"]:
                    orders_collection.update_one(
                        {"_id": ObjectId(order_id)},
                        {
                            "$set": {
                                "status": "paid",
                                "updated_at": datetime.utcnow()
                            }
                        }
                    )
                    await self.cart_manager.clear_cart(order["user_email"])

                return payment_status["data"]

        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error checking payment status: {str(e)}"
            )

# API Endpoints
@router.post("/checkout")
async def create_checkout(
    current_user: Dict = Depends(get_current_active_user)
):
    try:
        checkout_manager = CheckoutManager()
        order = await checkout_manager.create_order(current_user["email"])
        return {
            "order_id": order["_id"],
            "status": "created",
            "total_amount_idr": order["total_amount_idr"],
            "total_amount_sol": order["total_amount_sol"]
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing checkout: {str(e)}"
        )

@router.post("/checkout/{order_id}/pay")
async def create_payment(
    order_id: str,
    currency: str = "SOL",
):
    try:
        checkout_manager = CheckoutManager()
        payment = await checkout_manager.create_payment(order_id, currency)
        return payment
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating payment: {str(e)}"
        )

@router.get("/checkout/{order_id}/status")
async def check_payment_status(
    order_id: str,
):
    try:
        checkout_manager = CheckoutManager()
        status = await checkout_manager.check_payment_status(order_id)
        return status
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error checking payment status: {str(e)}"
        )

@router.post("/checkout/webhook")
async def payment_webhook(payment_data: Dict):
    try:
        payment_id = payment_data.get("paymentID")
        if not payment_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="paymentID required"
            )

        order = orders_collection.find_one({"payment_id": payment_id})
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )

        checkout_manager = CheckoutManager()
        await checkout_manager.check_payment_status(str(order["_id"]))
        
        return {
            "received": True,
            "status": "success",
            "message": "Payment processed successfully"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing webhook: {str(e)}"
        )

@router.get("/orders")
async def get_orders(
    current_user: Dict = Depends(get_current_active_user),
    skip: int = 0,
    limit: int = 10
):
    """Get user's order history"""
    try:
        orders = list(orders_collection.find(
            {"user_email": current_user["email"]}
        ).skip(skip).limit(limit))
        
        for order in orders:
            order["_id"] = str(order["_id"])
        
        return orders
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving orders: {str(e)}"
        )

@router.get("/orders/{order_id}")
async def get_order(
    order_id: str,
    current_user: Dict = Depends(get_current_active_user)
):
    """Get specific order details"""
    try:
        order = orders_collection.find_one({
            "_id": ObjectId(order_id),
            "user_email": current_user["email"]
        })
        
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )
            
        order["_id"] = str(order["_id"])
        return order
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving order: {str(e)}"
        )
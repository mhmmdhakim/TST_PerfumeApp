from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Optional
import httpx
import os
from datetime import datetime
from bson import ObjectId

from ..database import orders_collection, carts_collection
from ..routes.auth import get_current_active_user
from ..services.cart import CartManager

router = APIRouter(prefix="/api")

PAYMENT_API_BASE_URL = "https://api-staging.solstra.fi"
API_KEY = os.getenv("SOLSTRAFI_API_KEY")

class CheckoutManager:
    def __init__(self):
        self.cart_manager = CartManager()
        
    async def create_order(self, user_email: str) -> Dict:
        """Create a new order from cart items"""
        try:
            # Get user's cart
            cart = await self.cart_manager.get_cart(user_email)
            if not cart["items"]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cart is empty"
                )

            # Create order
            order = {
                "user_email": user_email,
                "items": cart["items"],
                "total_amount": cart["total_amount"],
                "status": "pending_payment",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            result = orders_collection.insert_one(order)
            order["_id"] = str(result.inserted_id)
            
            return order
            
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error creating order: {str(e)}"
            )

    async def create_payment(self, order_id: str, currency: str) -> Dict:
        """Create payment request using Solstrafi API"""
        try:
            order = orders_collection.find_one({"_id": ObjectId(order_id)})
            if not order:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Order not found"
                )

            async with httpx.AsyncClient() as client:
                # Create payment
                response = await client.post(
                    f"{PAYMENT_API_BASE_URL}/service/pay/create",
                    headers={"Authorization": f"Bearer {API_KEY}"},
                    json={
                        "currency": currency,
                        "amount": order["total_amount"],
                        "webhookURL": f"{os.getenv('API_BASE_URL')}/api/checkout/webhook/{order_id}"
                    }
                )
                
                if response.status_code != 200:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Failed to create payment"
                    )

                payment_data = response.json()["data"]
                
                # Update order with payment info
                orders_collection.update_one(
                    {"_id": ObjectId(order_id)},
                    {
                        "$set": {
                            "payment_id": payment_data["id"],
                            "payment_currency": payment_data["currency"],
                            "payment_wallet": payment_data["walletAddress"],
                            "payment_check_url": payment_data["checkPaid"],
                            "updated_at": datetime.utcnow()
                        }
                    }
                )

                return payment_data

        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error creating payment: {str(e)}"
            )

    async def check_payment_status(self, order_id: str) -> Dict:
        """Check payment status using Solstrafi API"""
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
                    headers={"Authorization": f"Bearer {API_KEY}"}
                )
                
                if response.status_code != 200:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Failed to check payment status"
                    )

                payment_status = response.json()
                
                # Update order status if payment is confirmed
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
                    # Clear the cart after successful payment
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
    """Create a new order and initiate checkout process"""
    try:
        checkout_manager = CheckoutManager()
        
        # Create order
        order = await checkout_manager.create_order(current_user["email"])
        
        return {"order_id": order["_id"], "status": "created"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing checkout: {str(e)}"
        )

@router.post("/checkout/{order_id}/pay")
async def create_payment(
    order_id: str,
    currency: str,
    current_user: Dict = Depends(get_current_active_user)
):
    """Create payment for an order"""
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
    current_user: Dict = Depends(get_current_active_user)
):
    """Check payment status for an order"""
    try:
        checkout_manager = CheckoutManager()
        status = await checkout_manager.check_payment_status(order_id)
        return status
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error checking payment status: {str(e)}"
        )

@router.post("/checkout/webhook/{order_id}")
async def payment_webhook(order_id: str):
    """Handle payment webhook from Solstrafi"""
    try:
        checkout_manager = CheckoutManager()
        status = await checkout_manager.check_payment_status(order_id)
        return {"status": "success", "payment_status": status}
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
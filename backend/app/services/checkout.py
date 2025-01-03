from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict
from ..database import db, orders_collection, carts_collection
from ..routes.auth import get_current_active_user
from .cart import CartManager
from datetime import datetime

router = APIRouter()

class CheckoutManager:
    def __init__(self):
        self.orders_collection = orders_collection
        self.cart_manager = CartManager()

    async def process_checkout(self, user_email: str, shipping_info: Dict) -> Dict:
        try:
            # 1. Get cart
            cart = await self.cart_manager.get_cart(user_email)
            if not cart["items"]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cart is empty"
                )

            # 2. Create order
            order = {
                "user_email": user_email,
                "items": cart["items"],
                "total_amount": cart["total_amount"],
                "shipping_info": shipping_info,
                "status": "pending",
                "created_at": datetime.utcnow()
            }

            # 3. Save order
            result = self.orders_collection.insert_one(order)
            order_id = str(result.inserted_id)

            # 4. Clear cart
            await self.cart_manager.clear_cart(user_email)

            return {
                "order_id": order_id,
                "message": "Order placed successfully",
                "status": "pending"
            }

        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error processing checkout: {str(e)}"
            )

@router.post("/checkout")
async def checkout(
    shipping_info: Dict,
    current_user: Dict = Depends(get_current_active_user)
):
    try:
        checkout_manager = CheckoutManager()
        return await checkout_manager.process_checkout(
            current_user["email"],
            shipping_info
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error during checkout: {str(e)}"
        )
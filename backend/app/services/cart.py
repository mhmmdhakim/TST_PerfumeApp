from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Optional
from ..database import db, carts_collection, products_collection
from ..routes.auth import get_current_active_user
from bson import ObjectId
from datetime import datetime
from pydantic import BaseModel

router = APIRouter()

# Add request model for cart operations
class CartItemRequest(BaseModel):
    product_id: str
    quantity: int

class CartManager:
    def __init__(self):
        self.carts_collection = carts_collection
        self.products_collection = products_collection

    async def get_cart(self, user_email: str) -> Dict:
        """Get user's cart or create a new one if it doesn't exist"""
        cart = self.carts_collection.find_one({"user_email": user_email})
        if not cart:
            cart = {
                "user_email": user_email,
                "items": [],
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "total_amount": 0.0
            }
            self.carts_collection.insert_one(cart)
        return cart

    async def add_to_cart(self, user_email: str, product_id: str, quantity: int) -> Dict:
        """Add a product to the user's cart"""
        try:
            # Validate product exists and get its details
            product = self.products_collection.find_one({"_id": ObjectId(product_id)})
            if not product:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Product not found"
                )

            cart = await self.get_cart(user_email)
            
            # Check if product already in cart
            item_exists = False
            for item in cart["items"]:
                if item["product_id"] == str(product_id):
                    item["quantity"] += quantity
                    item_exists = True
                    break

            if not item_exists:
                cart_item = {
                    "product_id": str(product_id),
                    "name": product["name"],
                    "price": product["price"],
                    "quantity": quantity,
                    "subtotal": product["price"] * quantity
                }
                cart["items"].append(cart_item)

            # Recalculate total
            total = sum(item["price"] * item["quantity"] for item in cart["items"])
            
            # Update cart in database
            self.carts_collection.update_one(
                {"user_email": user_email},
                {
                    "$set": {
                        "items": cart["items"],
                        "total_amount": total,
                        "updated_at": datetime.utcnow()
                    }
                }
            )

            return cart

        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error adding item to cart: {str(e)}"
            )

    async def update_cart_item(self, user_email: str, product_id: str, quantity: int) -> Dict:
        """Update quantity of a product in cart"""
        try:
            cart = await self.get_cart(user_email)
            
            # Find and update item
            item_found = False
            for item in cart["items"]:
                if item["product_id"] == product_id:
                    if quantity <= 0:
                        cart["items"].remove(item)
                    else:
                        item["quantity"] = quantity
                        item["subtotal"] = item["price"] * quantity
                    item_found = True
                    break

            if not item_found:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Item not found in cart"
                )

            # Recalculate total
            total = sum(item["price"] * item["quantity"] for item in cart["items"])
            
            # Update cart in database
            self.carts_collection.update_one(
                {"user_email": user_email},
                {
                    "$set": {
                        "items": cart["items"],
                        "total_amount": total,
                        "updated_at": datetime.utcnow()
                    }
                }
            )

            return cart

        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error updating cart item: {str(e)}"
            )

    async def clear_cart(self, user_email: str) -> Dict:
        """Remove all items from cart"""
        try:
            self.carts_collection.update_one(
                {"user_email": user_email},
                {
                    "$set": {
                        "items": [],
                        "total_amount": 0.0,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            return {"message": "Cart cleared successfully"}
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error clearing cart: {str(e)}"
            )

# API Endpoints
@router.get("/cart")
async def get_cart(current_user: Dict = Depends(get_current_active_user)):
    """Get current user's cart"""
    try:
        cart_manager = CartManager()
        cart = await cart_manager.get_cart(current_user["email"])
        cart["_id"] = str(cart["_id"])
        return cart
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving cart: {str(e)}"
        )

@router.post("/cart/items")
async def add_to_cart(
    item: CartItemRequest,
    current_user: Dict = Depends(get_current_active_user)
):
    """Add an item to cart using JSON request"""
    try:
        cart_manager = CartManager()
        cart = await cart_manager.add_to_cart(
            current_user["email"], 
            item.product_id, 
            item.quantity
        )
        cart["_id"] = str(cart["_id"])
        return cart
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error adding item to cart: {str(e)}"
        )

@router.put("/cart/items/{product_id}")
async def update_cart_item(
    product_id: str,
    item: CartItemRequest,
    current_user: Dict = Depends(get_current_active_user)
):
    """Update cart item quantity using JSON request"""
    try:
        cart_manager = CartManager()
        cart = await cart_manager.update_cart_item(
            current_user["email"], 
            product_id, 
            item.quantity
        )
        cart["_id"] = str(cart["_id"])
        return cart
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating cart item: {str(e)}"
        )

@router.delete("/cart")
async def clear_cart(current_user: Dict = Depends(get_current_active_user)):
    """Clear all items from cart"""
    try:
        cart_manager = CartManager()
        return await cart_manager.clear_cart(current_user["email"])
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error clearing cart: {str(e)}"
        )
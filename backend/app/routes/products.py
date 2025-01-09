from fastapi import APIRouter, Depends, HTTPException, status
from ..database import db, products_collection
from ..models import Perfume, PerfumeCreate
from typing import List, Optional
from .auth import get_current_active_user
from bson import ObjectId
from datetime import datetime

router = APIRouter()

# Helper function to check admin status
def check_admin_access(current_user: dict):
    if not current_user.get("is_admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can perform this action"
        )

# Helper function to validate product existence
async def get_product_by_id(product_id: str):
    try:
        product = products_collection.find_one({"_id": ObjectId(product_id)})
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
        return product
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid product ID format: {str(e)}"
        )

# Create product (Admin only)
@router.post("/products", status_code=status.HTTP_201_CREATED)
async def create_product(
    perfume: PerfumeCreate,
    current_user: dict = Depends(get_current_active_user)
):
    check_admin_access(current_user)
    
    try:
        # Check if product with same name already exists
        existing_product = products_collection.find_one({"name": perfume.name})
        if existing_product:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Product with this name already exists"
            )

        product_data = perfume.dict()
        product_data["created_by"] = current_user["email"]
        product_data["created_at"] = datetime.utcnow()
        
        result = products_collection.insert_one(product_data)
        
        return {
            "id": str(result.inserted_id),
            "message": "Product created successfully"
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating product: {str(e)}"
        )

# Get all products (Public access)
@router.get("/products", response_model=List[dict])

async def search_products(search: Optional[str] = None):
    # Add search parameter to your existing get_products endpoint
    filter_query = {}
    if search:
        filter_query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"brand": {"$regex": search, "$options": "i"}},
            {"category": {"$regex": search, "$options": "i"}}
        ]

async def get_products(
    skip: int = 0,
    limit: int = 10,
    category: str = None,
    brand: str = None,
    min_price: float = None,
    max_price: float = None
):
    try:
        filter_query = {}
        if category:
            filter_query["category"] = category
        if brand:
            filter_query["brand"] = brand
        if min_price is not None or max_price is not None:
            price_query = {}
            if min_price is not None:
                price_query["$gte"] = min_price
            if max_price is not None:
                price_query["$lte"] = max_price
            if price_query:
                filter_query["price"] = price_query

        products = list(products_collection.find(filter_query).skip(skip).limit(limit))
        for product in products:
            product["_id"] = str(product["_id"])
        return products
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving products: {str(e)}"
        )

# Get single product (Public access)
@router.get("/products/{product_id}")
async def get_product(product_id: str):
    product = await get_product_by_id(product_id)
    product["_id"] = str(product["_id"])
    return product

# Update product (Admin only)
@router.put("/products/{product_id}")
async def update_product(
    product_id: str,
    product_update: PerfumeCreate,
    current_user: dict = Depends(get_current_active_user)
):
    check_admin_access(current_user)
    
    try:
        # Verify product exists
        await get_product_by_id(product_id)
        
        # Check if updating to an existing name
        existing_product = products_collection.find_one({
            "name": product_update.name,
            "_id": {"$ne": ObjectId(product_id)}
        })
        if existing_product:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Another product with this name already exists"
            )

        update_data = product_update.dict()
        update_data["updated_by"] = current_user["email"]
        update_data["updated_at"] = datetime.utcnow()
        
        result = products_collection.update_one(
            {"_id": ObjectId(product_id)},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found or no changes made"
            )
            
        return {"message": "Product updated successfully"}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating product: {str(e)}"
        )

# Delete product (Admin only)
@router.delete("/products/{product_id}")
async def delete_product(
    product_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    check_admin_access(current_user)
    
    try:
        # Verify product exists
        await get_product_by_id(product_id)
        
        result = products_collection.delete_one({"_id": ObjectId(product_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
            
        return {"message": "Product deleted successfully"}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting product: {str(e)}"
        )
from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict
from ..database import db
from ..routes.auth import get_current_active_user
from collections import Counter

router = APIRouter()

class PerfumeRecommender:
    def __init__(self):
        self.products_collection = db.products
        self.preferences_collection = db.preferences

    def get_recommendations(self, user_email: str, limit: int = 5) -> List[Dict]:
        try:
            # Get user preferences
            user_prefs = self.preferences_collection.find_one({"user_email": user_email})
            if not user_prefs:
                raise HTTPException(status_code=404, detail="User preferences not found")

            # Get all products
            products = list(self.products_collection.find())
            if not products:
                raise HTTPException(status_code=404, detail="No products found in database")

            # Score each product
            scored_products = []
            for product in products:
                score = self._calculate_score(product, user_prefs)
                # Convert ObjectId to string before adding to list
                product["_id"] = str(product["_id"])
                scored_products.append((score, product))

            # Sort by score using the first element of tuple (the score)
            scored_products.sort(key=lambda x: x[0], reverse=True)

            # Get top recommendations
            recommendations = [product for _, product in scored_products[:limit]]
            
            return recommendations

        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error generating recommendations: {str(e)}"
            )

    def _calculate_score(self, product: Dict, preferences: Dict) -> float:
        try:
            score = 0.0
            
            # Note matching
            product_notes = set(product.get("notes", []))
            user_notes = set(preferences.get("favorite_notes", []))
            common_notes = product_notes & user_notes
            score += len(common_notes) * 2

            # Category matching
            if product.get("category") in preferences.get("preferred_categories", []):
                score += 1.5

            # Price range matching
            price_ranges = {
                "low-range": (0, 50),
                "mid-range": (50, 150),
                "luxury": (150, float('inf'))
            }
            user_range = preferences.get("price_range")
            if user_range in price_ranges:
                min_price, max_price = price_ranges[user_range]
                product_price = product.get("price", 0)
                if min_price <= product_price <= max_price:
                    score += 1

            # Brand preference
            if "preferred_brands" in preferences and \
               product.get("brand") in preferences["preferred_brands"]:
                score += 1

            # Season matching
            if (preferences.get("seasonal_preference") and 
                product.get("season") and 
                preferences["seasonal_preference"] == product["season"]):
                score += 0.5

            # Scent strength matching
            if (preferences.get("scent_strength") and 
                product.get("scent_strength") and 
                preferences["scent_strength"] == product["scent_strength"]):
                score += 0.5

            return score
            
        except Exception as e:
            print(f"Error calculating score for product {product.get('name', 'unknown')}: {str(e)}")
            return 0.0

@router.get("/recommendations", response_model=List[Dict])
async def get_recommendations(
    current_user: Dict = Depends(get_current_active_user),
    limit: int = 2
):
    try:
        recommender = PerfumeRecommender()
        recommendations = recommender.get_recommendations(
            user_email=current_user["email"],
            limit=limit
        )
        return recommendations
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing recommendation request: {str(e)}"
        )
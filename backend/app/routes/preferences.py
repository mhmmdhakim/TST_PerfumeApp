from fastapi import APIRouter, Depends, HTTPException, status
from ..database import db, preferences_collection
from ..models import UserPreferences, PreferenceUpdate
from typing import List
from .auth import get_current_active_user, get_current_user
from datetime import datetime

router = APIRouter()

# Helper function to check admin status
def check_admin_access(current_user: dict):
    if not current_user.get("is_admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can perform this action"
        )

# User Endpoints - Create/Update their own preferences
@router.post("/preferences")
async def create_preferences(
    preferences: UserPreferences,
    current_user: dict = Depends(get_current_active_user)
):
    try:
        user_email = current_user["email"]
        
        # Check if preferences already exist
        existing = preferences_collection.find_one({"user_email": user_email})
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Preferences already exist. Use PUT to update."
            )
        
        preference_data = preferences.dict()
        preference_data.update({
            "user_email": user_email,
            "created_at": datetime.utcnow(),
            "created_by": user_email
        })
        
        preferences_collection.insert_one(preference_data)
        return {"message": "Preferences created successfully"}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating preferences: {str(e)}"
        )

# User can get their own preferences
@router.get("/preferences/me")
async def get_my_preferences(current_user: dict = Depends(get_current_user)):
    try:
        preferences = preferences_collection.find_one({"user_email": current_user["email"]})
        if not preferences:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Preferences not found"
            )
        preferences["_id"] = str(preferences["_id"])
        return preferences
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving preferences: {str(e)}"
        )

# User can update their own preferences
@router.put("/preferences/me")
async def update_my_preferences(
    updates: PreferenceUpdate,
    current_user: dict = Depends(get_current_user)
):
    try:
        update_data = updates.dict(exclude_unset=True)
        update_data["updated_at"] = datetime.utcnow()
        update_data["updated_by"] = current_user["email"]
        
        result = preferences_collection.update_one(
            {"user_email": current_user["email"]},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Preferences not found"
            )
        return {"message": "Preferences updated successfully"}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating preferences: {str(e)}"
        )

# Admin Endpoints - View and manage all preferences
@router.get("/preferences", response_model=List[dict])
async def get_all_preferences(
    current_user: dict = Depends(get_current_active_user),
    skip: int = 0,
    limit: int = 10
):
    check_admin_access(current_user)
    
    try:
        preferences = list(preferences_collection.find().skip(skip).limit(limit))
        for pref in preferences:
            pref["_id"] = str(pref["_id"])
        return preferences
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving all preferences: {str(e)}"
        )

@router.get("/preferences/{user_email}")
async def get_user_preferences(
    user_email: str,
    current_user: dict = Depends(get_current_active_user)
):
    check_admin_access(current_user)
    
    try:
        preferences = preferences_collection.find_one({"user_email": user_email})
        if not preferences:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Preferences not found for user: {user_email}"
            )
        preferences["_id"] = str(preferences["_id"])
        return preferences
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving user preferences: {str(e)}"
        )

@router.delete("/preferences/{user_email}")
async def delete_user_preferences(
    user_email: str,
    current_user: dict = Depends(get_current_active_user)
):
    check_admin_access(current_user)
    
    try:
        result = preferences_collection.delete_one({"user_email": user_email})
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Preferences not found for user: {user_email}"
            )
        return {"message": f"Preferences deleted successfully for user: {user_email}"}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting preferences: {str(e)}"
        )

# Admin can update any user's preferences
@router.put("/preferences/{user_email}")
async def admin_update_preferences(
    user_email: str,
    updates: PreferenceUpdate,
    current_user: dict = Depends(get_current_active_user)
):
    check_admin_access(current_user)
    
    try:
        update_data = updates.dict(exclude_unset=True)
        update_data["updated_at"] = datetime.utcnow()
        update_data["updated_by"] = current_user["email"]
        
        result = preferences_collection.update_one(
            {"user_email": user_email},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Preferences not found for user: {user_email}"
            )
        return {"message": f"Preferences updated successfully for user: {user_email}"}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating preferences: {str(e)}"
        )
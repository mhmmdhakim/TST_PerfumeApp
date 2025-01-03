from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    is_admin: Optional[bool] = False

class UserInDB(BaseModel):
    email: EmailStr
    full_name: str
    hashed_password: str
    is_admin: bool = False
    created_at: datetime = datetime.utcnow()

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    email: EmailStr
    full_name: str

class UserUpdate(BaseModel):
    full_name: Optional[str]
    password: Optional[str]

# Preference Models
class UserPreferences(BaseModel):
    favorite_notes: List[str]
    preferred_categories: List[str]
    price_range: str
    preferred_brands: Optional[List[str]]
    seasonal_preference: Optional[str]
    scent_strength: Optional[str]

class PreferenceUpdate(BaseModel):
    favorite_notes: Optional[List[str]]
    preferred_categories: Optional[List[str]]
    price_range: Optional[str]
    preferred_brands: Optional[List[str]]
    seasonal_preference: Optional[str]
    scent_strength: Optional[str]

# Product Models
class PerfumeCreate(BaseModel):
    name: str
    brand: str
    category: str
    notes: List[str]
    price: float
    size_ml: int
    description: str
    scent_strength: Optional[str]
    season: Optional[str]

class Perfume(PerfumeCreate):
    id: str



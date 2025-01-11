from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from typing import Dict

class ShippingInfo(BaseModel):
    address: str
    city: str
    country: str
    postal_code: str
    phone: str

class CheckoutRequest(BaseModel):
    shipping_info: ShippingInfo

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

class ShippingInfo(BaseModel):
    address: str
    city: str
    country: str
    postal_code: str
    phone: str

class CheckoutRequest(BaseModel):
    shipping_info: ShippingInfo

class CartItem(BaseModel):
    product_id: str
    name: str
    price: float
    quantity: int

class Cart(BaseModel):
    user_email: str
    items: List[CartItem]
    total_amount: float

class Order(BaseModel):
    user_email: str
    items: List[CartItem]
    total_amount: float
    shipping_info: ShippingInfo
    payment_id: str
    wallet_address: str
    currency: str
    status: str
    payment_status: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


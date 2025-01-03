from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Optional, Dict
import os
from ..database import users_collection, carts_collection
from ..models import UserCreate, UserInDB, Token, UserLogin, UserResponse

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Helper Functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=1)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode, 
        os.getenv("SECRET_KEY"), 
        algorithm=os.getenv("ALGORITHM")
    )
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)) -> Dict:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, 
            os.getenv("SECRET_KEY"), 
            algorithms=[os.getenv("ALGORITHM")]
        )
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = users_collection.find_one({"email": email})
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user: Dict = Depends(get_current_user)) -> Dict:
    if current_user.get("disabled"):
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

@router.post("/register")
async def register_user(user: UserCreate):
    if users_collection.find_one({"email": user.email}):
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    
    hashed_password = get_password_hash(user.password)
    user_in_db = UserInDB(
        email=user.email,
        full_name=user.full_name,
        hashed_password=hashed_password
    )
    
    users_collection.insert_one(user_in_db.dict())
    
    # Initialize an empty cart
    cart = {
                "user_email": user.email,
                "items": [],
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "total_amount": 0.0
            }
    carts_collection.insert_one(cart)

    return {"message": "User registered successfully"}

@router.post("/login", response_model=Token)
async def login_json(user_credentials: UserLogin):
    user = users_collection.find_one({"email": user_credentials.email})
    if not user or not verify_password(user_credentials.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES")))
    access_token = create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = users_collection.find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES")))
    access_token = create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# User Management Endpoints
@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: Dict = Depends(get_current_active_user)):
    return UserResponse(
        email=current_user["email"],
        full_name=current_user["full_name"]
    )

@router.put("/me", response_model=UserResponse)
async def update_user(
    user_update: UserCreate,
    current_user: Dict = Depends(get_current_active_user)
):
    updates = {
        "full_name": user_update.full_name,
        "hashed_password": get_password_hash(user_update.password)
    }
    
    result = users_collection.update_one(
        {"email": current_user["email"]},
        {"$set": updates}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    updated_user = users_collection.find_one({"email": current_user["email"]})
    return UserResponse(
        email=updated_user["email"],
        full_name=updated_user["full_name"]
    )

# Admin Only Endpoints
@router.get("/users", response_model=list[UserResponse])
async def read_users(
    skip: int = 0,
    limit: int = 10,
    current_user: Dict = Depends(get_current_active_user)
):
    # Check if user is admin
    if not current_user.get("is_admin"):
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions"
        )
    
    users = list(users_collection.find().skip(skip).limit(limit))
    return [
        UserResponse(email=user["email"], full_name=user["full_name"])
        for user in users
    ]
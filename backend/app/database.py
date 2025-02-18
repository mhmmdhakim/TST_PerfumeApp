from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
from dotenv import load_dotenv
import os
from fastapi import HTTPException

load_dotenv()

try:
    client = MongoClient(os.getenv("MONGODB_URL"))
    # Test the connection
    client.server_info()
    db = client.perfume_db
    
    # Initialize collections
    users_collection = db.users
    preferences_collection = db.preferences
    products_collection = db.products
    carts_collection = db.carts
    orders_collection = db.orders

except ConnectionFailure as e:
    print(f"Could not connect to MongoDB: {str(e)}")
    raise HTTPException(status_code=503, detail="Database connection failed")
except Exception as e:
    print(f"Unexpected error occurred: {str(e)}")
    raise HTTPException(status_code=500, detail="Internal server error")
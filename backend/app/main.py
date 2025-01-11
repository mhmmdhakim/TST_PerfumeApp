from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import auth, preferences, products, checkout
from .services import recommender, cart

app = FastAPI(title="Perfume Recommendation System")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, tags=["authentication"], prefix="/auth")
app.include_router(preferences.router, tags=["preferences"], prefix="/api")
app.include_router(products.router, tags=["products"], prefix="/api")
app.include_router(recommender.router, tags=["recommendations"], prefix="/api")
app.include_router(cart.router, tags=["cart"], prefix="/api")
app.include_router(checkout.router, tags=["checkout"], prefix="/api")

@app.get("/")
async def root():
    return {"message": "Welcome to Perfume Recommendation System API"}
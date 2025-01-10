Perfume E-commerce API
A FastAPI-based e-commerce platform specialized for perfume sales, featuring user authentication, product management, smart recommendations, shopping cart functionality, and cryptocurrency payment integration.
Features
Authentication & User Management

User registration and login with JWT authentication
Role-based access control (Admin/User)
User preference management
Profile management

Product Management

CRUD operations for perfume products
Product search and filtering
Category and brand management
Price range filtering

Smart Recommendation System

Personalized product recommendations based on:

User preferences
Favorite notes
Price range
Seasonal preferences
Brand preferences
Scent strength preferences



Shopping Cart

Add/remove items
Update quantities
Calculate totals
Cart persistence

Payment Integration

Cryptocurrency payment support via Solstra API
Multiple currency support
Payment status tracking
Webhook integration for payment updates

Technical Stack

Framework: FastAPI
Database: MongoDB
Authentication: JWT with OAuth2
Payment Gateway: Solstra API
Additional Libraries:

passlib: Password hashing
python-jose: JWT token handling
httpx: Async HTTP client
pydantic: Data validation
pymongo: MongoDB driver



Project Structure
Copy├── routes/
│   ├── auth.py         # Authentication & user management
│   ├── cart.py         # Shopping cart operations
│   ├── checkout.py     # Payment & checkout process
│   ├── preferences.py  # User preferences management
│   ├── products.py     # Product management
│   └── recommend.py    # Recommendation system
├── database/
│   └── __init__.py     # Database configuration
├── models/
│   └── __init__.py     # Pydantic models
└── main.py             # Application entry point
API Endpoints
Authentication

POST /register: Register new user
POST /login: User login
POST /token: Get access token
GET /me: Get current user info
PUT /me: Update user info

Products

GET /products: List/search products
POST /products: Create product (Admin)
GET /products/{id}: Get product details
PUT /products/{id}: Update product (Admin)
DELETE /products/{id}: Delete product (Admin)

Cart

GET /cart: View cart
POST /cart/items: Add item to cart
PUT /cart/items/{id}: Update cart item
DELETE /cart: Clear cart

Preferences

POST /preferences: Create preferences
GET /preferences/me: Get user preferences
PUT /preferences/me: Update preferences
GET /preferences: List all preferences (Admin)

Recommendations

GET /recommendations: Get personalized recommendations

Checkout

POST /checkout: Initialize checkout process
POST /payment/check/{id}: Check payment status
POST /payment/update-currency: Update payment currency
POST /payment/webhook: Payment webhook handler

Setup & Installation

Clone the repository

bashCopygit clone <repository-url>

Create and activate virtual environment

bashCopypython -m venv venv
source venv/bin/activate  # Unix
venv\Scripts\activate     # Windows

Install dependencies

bashCopypip install -r requirements.txt

Set up environment variables

bashCopySECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
MONGODB_URL=your_mongodb_url
SOLSTRA_API_BASE=your_solstra_api_url
WEBHOOK_BASE_URL=your_webhook_base_url

Run the application

bashCopyuvicorn main:app --reload
Security Considerations

Implements JWT-based authentication
Password hashing using bcrypt
Role-based access control
Input validation using Pydantic models
Secure payment processing
Error handling and logging

Contributing

Fork the repository
Create your feature branch
Commit your changes
Push to the branch
Create a new Pull Request

License
This project is licensed under the MIT License - see the LICENSE file for details

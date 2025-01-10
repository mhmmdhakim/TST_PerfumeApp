# Perfume E-commerce API Documentation

## Base URL
```
https://perfume-app-production.up.railway.app/api
```

## Authentication
The API uses JWT Bearer token authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_access_token>
```

## Authentication Endpoints

### Register User
```http
POST /register
```

**Request Body:**
```json
{
  "email": "string",
  "full_name": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "message": "User registered successfully"
}
```

### Login User
```http
POST /login
```

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "access_token": "string",
  "token_type": "bearer"
}
```

### Get User Profile
```http
GET /me
```

**Response:**
```json
{
  "email": "string",
  "full_name": "string"
}
```

## Product Management

### Create Product (Admin Only)
```http
POST /products
```

**Request Body:**
```json
{
  "name": "string",
  "brand": "string",
  "category": "string",
  "price": "number",
  "description": "string",
  "notes": ["string"],
  "scent_strength": "string",
  "season": "string"
}
```

### Search Products
```http
GET /products
```

**Query Parameters:**
- `search` (optional): Search term
- `skip` (optional): Number of records to skip
- `limit` (optional): Number of records to return
- `category` (optional): Filter by category
- `brand` (optional): Filter by brand
- `min_price` (optional): Minimum price
- `max_price` (optional): Maximum price

### Get Product by ID
```http
GET /products/{product_id}
```

## User Preferences

### Create User Preferences
```http
POST /preferences
```

**Request Body:**
```json
{
  "favorite_notes": ["string"],
  "preferred_categories": ["string"],
  "price_range": "string",
  "preferred_brands": ["string"],
  "seasonal_preference": "string",
  "scent_strength": "string"
}
```

### Get User Preferences
```http
GET /preferences/me
```

### Update User Preferences
```http
PUT /preferences/me
```

## Shopping Cart

### Get Cart
```http
GET /cart
```

### Add Item to Cart
```http
POST /cart/items
```

**Request Body:**
```json
{
  "product_id": "string",
  "quantity": "integer"
}
```

### Update Cart Item
```http
PUT /cart/items/{product_id}
```

**Request Body:**
```json
{
  "quantity": "integer"
}
```

### Clear Cart
```http
DELETE /cart
```

## Checkout & Payment

### Initiate Checkout
```http
POST /checkout
```

**Response:**
```json
{
  "id": "string",
  "order_id": "string",
  "walletAddress": "string",
  "amount": "number",
  "currency": "string"
}
```

### Check Payment Status
```http
POST /payment/check/{payment_id}
```

### Update Payment Currency
```http
POST /payment/update-currency
```

**Request Body:**
```json
{
  "payment_id": "string",
  "currency": "string"
}
```

## Recommendations

### Get Personalized Recommendations
```http
GET /recommendations
```

**Query Parameters:**
- `limit` (optional): Number of recommendations to return (default: 2)

**Response:**
```json
[
  {
    "_id": "string",
    "name": "string",
    "brand": "string",
    "price": "number",
    "category": "string",
    "notes": ["string"],
    "scent_strength": "string",
    "season": "string"
  }
]
```

## Error Responses

The API uses standard HTTP status codes:

- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

Error response format:
```json
{
  "detail": "Error message description"
}
```

## Rate Limiting

- Anonymous users: 100 requests per hour
- Authenticated users: 1000 requests per hour
- Admin users: 5000 requests per hour

## Data Models

### User
```json
{
  "email": "string",
  "full_name": "string",
  "password": "string (hashed)",
  "is_admin": "boolean"
}
```

### Product
```json
{
  "_id": "string",
  "name": "string",
  "brand": "string",
  "category": "string",
  "price": "number",
  "description": "string",
  "notes": ["string"],
  "scent_strength": "string",
  "season": "string",
  "created_at": "datetime",
  "created_by": "string",
  "updated_at": "datetime",
  "updated_by": "string"
}
```

### Cart
```json
{
  "user_email": "string",
  "items": [
    {
      "product_id": "string",
      "name": "string",
      "price": "number",
      "quantity": "integer",
      "subtotal": "number"
    }
  ],
  "total_amount": "number",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Order
```json
{
  "user_email": "string",
  "items": ["CartItem"],
  "total_amount": "number",
  "payment_id": "string",
  "wallet_address": "string",
  "currency": "string",
  "status": "string",
  "created_at": "datetime",
  "payment_status": "string",
  "payment_updated_at": "datetime"
}
```

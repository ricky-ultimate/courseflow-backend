# Authentication Module

The Authentication module handles user registration, login, password management, and verification code operations.

## Endpoints

### Public Endpoints (No Authentication Required)

#### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "STUDENT"
}
```

#### POST /auth/login
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "access_token": "jwt-token-here",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "STUDENT"
  }
}
```

#### POST /auth/forgot-password
Request password reset for user account.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

#### POST /auth/reset-password
Reset password using verification code.

**Request Body:**
```json
{
  "email": "user@example.com",
  "code": "123456",
  "newPassword": "newSecurePassword123"
}
```

### Protected Endpoints (Authentication Required)

#### GET /auth/verification-codes
Get all verification codes (Admin only).

#### POST /auth/verification-codes
Create a new verification code (Admin only).

#### GET /auth/verification-codes/:id
Get specific verification code (Admin only).

#### PATCH /auth/verification-codes/:id
Update verification code (Admin only).

#### DELETE /auth/verification-codes/:id
Delete verification code (Admin only).

## Authentication Flow

1. **Registration**: User registers with email, password, and basic information
2. **Login**: User authenticates with email/password, receives JWT token
3. **Authorization**: JWT token must be included in Authorization header for protected endpoints
4. **Password Reset**: Users can request password reset via email verification

## Security Features

- Password hashing using Argon2
- JWT token-based authentication
- Rate limiting on authentication endpoints
- Input validation and sanitization
- Role-based access control

## Error Responses

- `400 Bad Request` - Invalid input data
- `401 Unauthorized` - Invalid credentials or missing token
- `403 Forbidden` - Insufficient permissions
- `409 Conflict` - Email already exists (registration)
- `429 Too Many Requests` - Rate limit exceeded

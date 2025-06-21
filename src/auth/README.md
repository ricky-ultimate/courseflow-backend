# Authentication Module

The Authentication module handles user registration, login, password management, and verification code operations.

## Endpoints

### Public Endpoints (No Authentication Required)

#### POST /auth/register
Register a new user account.

**For Students:**
```json
{
  "email": "student@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "STUDENT"
}
```

**For Admin/Lecturer (requires verification code):**
```json
{
  "email": "admin@example.com",
  "password": "securePassword123",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "ADMIN",
  "verificationCode": "123456"
}
```

**Note:** Admin and Lecturer registrations require a valid verification code to differentiate from student accounts.

#### POST /auth/login
Authenticate user and receive JWT token.

**For Students:**
```json
{
  "email": "student@example.com",
  "password": "securePassword123"
}
```

**For Admin/Lecturer (requires verification code):**
```json
{
  "email": "admin@example.com",
  "password": "securePassword123",
  "verificationCode": "123456"
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

### Student Authentication
1. **Registration**: Students register with email, password, and basic information (no verification code required)
2. **Login**: Students authenticate with email/password only
3. **Authorization**: JWT token must be included in Authorization header for protected endpoints

### Admin/Lecturer Authentication
1. **Registration**: Admin/Lecturer accounts require a valid verification code during registration
2. **Login**: Admin/Lecturer accounts must provide verification code along with email/password
3. **Authorization**: Same JWT token system as students, but with elevated permissions

### Password Reset Flow
1. **Request Reset**: Users can request password reset via email
2. **Verification**: Reset requires verification code
3. **New Password**: Set new password with valid verification code

## Verification Code System

Verification codes are used to:
- **Differentiate user roles** during registration and login
- **Secure admin/lecturer access** to prevent unauthorized role escalation
- **Password reset operations** for all user types

**Code Properties:**
- 6-digit numeric codes
- Time-limited expiration
- Single-use or limited-use depending on type
- Generated and managed by administrators

## Security Features

- Password hashing using Argon2
- JWT token-based authentication
- Rate limiting on authentication endpoints
- Input validation and sanitization
- Role-based access control

## Error Responses

- `400 Bad Request` - Invalid input data or malformed verification code
- `401 Unauthorized` - Invalid credentials, missing token, or invalid verification code
- `403 Forbidden` - Insufficient permissions or verification code required for role
- `409 Conflict` - Email already exists (registration)
- `422 Unprocessable Entity` - Verification code expired or already used
- `429 Too Many Requests` - Rate limit exceeded

## Verification Code Errors

- **Missing Code**: Admin/Lecturer registration/login without verification code
- **Invalid Code**: Verification code doesn't exist or doesn't match
- **Expired Code**: Verification code has passed its expiration time
- **Used Code**: Verification code has already been consumed (for single-use codes)
- **Wrong Role**: Verification code not valid for the requested role

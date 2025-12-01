# Authentication Module

The Authentication module handles user registration, login, password management, and verification code operations.

## Endpoints

### Public Endpoints (No Authentication Required)

#### POST /api/v1/auth/register
Register a new user account.

**For Students:**
```json
{
  "matricNO": "CS/2023/001",
  "email": "student@example.com",
  "password": "securePassword123",
  "name": "John Doe",
  "role": "STUDENT"
}
```

**For Admin/Lecturer (requires verification code):**
```json
{
  "matricNO": "LEC/2024/001",
  "email": "lecturer@example.com",
  "password": "securePassword123",
  "name": "Dr. Jane Smith",
  "role": "LECTURER",
  "verificationCode": "LECTURER-2025-ABC123"
}
```

**Note:** Admin and Lecturer registrations require a valid verification code to differentiate from student accounts.

#### POST /api/v1/auth/login
Authenticate user and receive JWT token.

**For All Users (Students, Lecturers, Admins):**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Note:** No verification code needed for login. Once registered with the appropriate role, users simply login with email and password.

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "matricNO": "CS/2023/001",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "STUDENT"
    },
    "access_token": "jwt-token-here",
    "token_type": "Bearer"
  }
}
```

#### POST /api/v1/auth/forgot-password
Request password reset for user account.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

#### POST /api/v1/auth/reset-password
Reset password using token.

**Request Body:**
```json
{
  "token": "reset_token",
  "password": "newSecurePassword123"
}
```

### Protected Endpoints (Authentication Required)

#### GET /api/v1/auth/me
Get current authenticated user information.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "matricNO": "CS/2023/001",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "STUDENT",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "User retrieved successfully",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### GET /api/v1/auth/verification-codes
Get all verification codes (Admin only).

#### POST /api/v1/auth/verification-codes
Create a new verification code (Admin only).

#### GET /api/v1/auth/verification-codes/:id
Get specific verification code (Admin only).

#### PATCH /api/v1/auth/verification-codes/:id
Update verification code (Admin only).

#### DELETE /api/v1/auth/verification-codes/:id
Delete verification code (Admin only).

## Authentication Flow

### Student Authentication
1. **Registration**: Students register with matricNO, email, password, and basic information (no verification code required)
2. **Login**: Students authenticate with email/password only
3. **Authorization**: JWT token must be included in Authorization header for protected endpoints
4. **Token Validation**: Use `/auth/me` endpoint to validate tokens and get current user info

### Admin/Lecturer Authentication
1. **Registration**: Admin/Lecturer accounts require a valid verification code during registration to verify their role
2. **Login**: Once registered, Admin/Lecturer accounts login with email/password only (same as students)
3. **Authorization**: Same JWT token system as students, but with elevated permissions based on stored role
4. **Token Validation**: Use `/auth/me` endpoint to validate tokens and get current user info

### Password Reset Flow
1. **Request Reset**: Users can request password reset via email
2. **Reset Token**: Reset requires the token received via email
3. **New Password**: Set new password with valid reset token

## Verification Code System

Verification codes are used to:
- **Secure role assignment** during registration only
- **Prevent unauthorized role escalation** to admin/lecturer positions

**Code Properties:**
- Alphanumeric codes (e.g., ADMIN-2025-ABC123)
- Time-limited expiration (optional)
- Single-use or limited-use depending on configuration
- Generated and managed by administrators

**Important:** Verification codes are only required during registration for admin/lecturer roles. Once registered, all users login with just email and password.

## Security Features

- Password hashing using Argon2
- JWT token-based authentication
- Rate limiting on authentication endpoints
- Input validation and sanitization
- Role-based access control
- Token validation endpoint for frontend apps
- Comprehensive API documentation with decorators

## Error Responses

- `400 Bad Request` - Invalid input data or malformed verification code
- `401 Unauthorized` - Invalid credentials, missing token, or invalid verification code
- `403 Forbidden` - Insufficient permissions or verification code required for role
- `409 Conflict` - Email already exists (registration)
- `422 Unprocessable Entity` - Verification code expired or already used
- `429 Too Many Requests` - Rate limit exceeded

## Verification Code Errors (Registration Only)

- **Missing Code**: Admin/Lecturer registration without verification code
- **Invalid Code**: Verification code doesn't exist or doesn't match
- **Expired Code**: Verification code has passed its expiration time
- **Used Code**: Verification code has already been consumed (for single-use codes)
- **Wrong Role**: Verification code not valid for the requested role

**Note:** These errors only apply to registration. Login does not use verification codes.

## API Documentation

The Authentication module uses comprehensive API decorators that encapsulate all Swagger documentation:

### Decorator Structure
- **`@ApiRegister()`** - Complete registration endpoint documentation
- **`@ApiLogin()`** - Login endpoint with request/response schemas
- **`@ApiForgotPassword()`** - Password reset request documentation  
- **`@ApiResetPassword()`** - Password reset completion documentation
- **`@ApiGetMe()`** - Current user information endpoint
- **`@ApiCreateVerificationCode()`** - Admin verification code creation
- **`@ApiGetVerificationCodes()`** - List all verification codes (Admin)
- **`@ApiGetVerificationCode()`** - Get specific verification code (Admin)
- **`@ApiUpdateVerificationCode()`** - Update verification code (Admin)
- **`@ApiDeleteVerificationCode()`** - Delete verification code (Admin)

### Benefits
- **Clean Controllers**: No boilerplate Swagger code in controller methods
- **Consistent Documentation**: Standardized error responses and schemas
- **Maintainable**: Changes to API docs happen in one place
- **Type Safety**: Full TypeScript integration with enums and types

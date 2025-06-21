# Users Module

The Users module manages user accounts, profiles, and administrative user operations.

## Endpoints

### GET /users
Get all users with pagination and filtering options.

**Query Parameters:**
- `page` (optional): Page number for pagination
- `limit` (optional): Number of items per page
- `orderBy` (optional): Field to order by
- `orderDirection` (optional): 'asc' or 'desc'

### GET /users/:id
Get a specific user by ID.

### POST /users
Create a new user (Admin only).

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

### PATCH /users/:id
Update user information.

**Request Body:**
```json
{
  "firstName": "UpdatedName",
  "lastName": "UpdatedLastName",
  "email": "newemail@example.com"
}
```

### DELETE /users/:id
Soft delete a user account (Admin only).

### GET /users/profile
Get current user's profile information.

### PATCH /users/profile
Update current user's profile.

### GET /users/role/:role
Get users by specific role (STUDENT, LECTURER, ADMIN).

### GET /users/search/:searchTerm
Search users by name or email.

### GET /users/statistics
Get user statistics and analytics (Admin only).

**Response:**
```json
{
  "totalUsers": 150,
  "usersByRole": {
    "STUDENT": 120,
    "LECTURER": 25,
    "ADMIN": 5
  },
  "activeUsers": 145,
  "inactiveUsers": 5
}
```

## User Roles

- **STUDENT**: Basic user with access to course information and personal data
- **LECTURER**: Can view course and schedule information, manage assigned courses
- **ADMIN**: Full system access, user management, and administrative functions

## Permissions

- **Students**: Can view and update their own profile
- **Lecturers**: Can view and update their own profile, access course information
- **Admins**: Full CRUD operations on all users, access to statistics and analytics

## Data Validation

- Email must be valid and unique
- Password must meet security requirements (minimum length, complexity)
- Names must be non-empty strings
- Role must be one of the defined enum values

## Error Responses

- `400 Bad Request` - Invalid input data or validation errors
- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - Insufficient permissions for the operation
- `404 Not Found` - User not found
- `409 Conflict` - Email already exists

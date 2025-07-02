# CourseFlow Backend API Documentation

This document provides a comprehensive list of all API endpoints, their parameters, request bodies, and responses for the CourseFlow Backend application.

## Base URL
```
http://localhost:3000/api/v1
```

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Common Response Format
All responses follow a consistent format:
```json
{
  "success": true,
  "data": {},
  "message": "string",
  "timestamp": "ISO 8601 date"
}
```

## Error Response Format
```json
{
  "success": false,
  "error": "Error message",
  "statusCode": 400,
  "timestamp": "ISO 8601 date"
}
```

## Enums

### Role
```typescript
enum Role {
  STUDENT = "STUDENT",
  LECTURER = "LECTURER",
  ADMIN = "ADMIN"
}
```

### Level
```typescript
enum Level {
  LEVEL_100 = "LEVEL_100",
  LEVEL_200 = "LEVEL_200",
  LEVEL_300 = "LEVEL_300",
  LEVEL_400 = "LEVEL_400",
  LEVEL_500 = "LEVEL_500"
}
```

### DayOfWeek
```typescript
enum DayOfWeek {
  MONDAY = "MONDAY",
  TUESDAY = "TUESDAY",
  WEDNESDAY = "WEDNESDAY",
  THURSDAY = "THURSDAY",
  FRIDAY = "FRIDAY",
  SATURDAY = "SATURDAY",
  SUNDAY = "SUNDAY"
}
```

### ClassType
```typescript
enum ClassType {
  LECTURE = "LECTURE",
  SEMINAR = "SEMINAR",
  LAB = "LAB",
  TUTORIAL = "TUTORIAL"
}
```

### ComplaintStatus
```typescript
enum ComplaintStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  RESOLVED = "RESOLVED",
  CLOSED = "CLOSED"
}
```

---

## 1. Root Endpoint

### GET /
**Description**: Get application welcome message
**Authentication**: Not required
**Response**:
```json
{
  "message": "Hello World!"
}
```

---

## 2. Authentication Endpoints (`/auth`)

### POST /auth/register
**Description**: Register a new user
**Authentication**: Not required

**Note**:
- `matricNO` is **required** for all roles (use matric number for students, staff ID for lecturers/admins)
- `verificationCode` is **required only** for ADMIN or LECTURER roles
- `role` defaults to STUDENT if not provided

**Request Body Examples**:

**Student Registration**:
```json
{
  "matricNO": "CS/2023/001",
  "email": "student@example.com",
  "password": "password123",
  "name": "John Doe", // optional
  "role": "STUDENT" // optional, defaults to STUDENT
}
```

**Lecturer Registration**:
```json
{
  "matricNO": "LEC/2024/001",
  "email": "lecturer@example.com",
  "password": "password123",
  "name": "Dr. Jane Smith", // optional
  "role": "LECTURER",
  "verificationCode": "LECTURER-2025-ABC123" // required for LECTURER role
}
```

**Admin Registration**:
```json
{
  "matricNO": "ADM/2024/001",
  "email": "admin@example.com",
  "password": "password123",
  "name": "Admin User", // optional
  "role": "ADMIN",
  "verificationCode": "ADMIN-2025-XYZ789" // required for ADMIN role
}
```
**Response**:
```json
{
  "user": {
    "id": "user_id",
    "matricNO": "CS/2023/001",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "STUDENT",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "access_token": "jwt_token",
  "token_type": "Bearer"
}
```

### POST /auth/login
**Description**: Login user
**Authentication**: Not required
**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
**Response**:
```json
{
  "user": {
    "id": "user_id",
    "matricNO": "CS/2023/001",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "STUDENT"
  },
  "access_token": "jwt_token",
  "token_type": "Bearer"
}
```

### POST /auth/forgot-password
**Description**: Request password reset
**Authentication**: Not required
**Request Body**:
```json
{
  "email": "user@example.com"
}
```
**Response**:
```json
{
  "message": "If an account with that email exists, a password reset link has been sent."
}
```

### POST /auth/reset-password
**Description**: Reset password using token
**Authentication**: Not required
**Request Body**:
```json
{
  "token": "reset_token",
  "newPassword": "newpassword123"
}
```
**Response**:
```json
{
  "message": "Password has been reset successfully"
}
```

### GET /auth/me
**Description**: Get current authenticated user information
**Authentication**: Required (JWT Token)
**Response**:
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
**Error Responses**:
```json
// 401 - Invalid or expired token
{
  "success": false,
  "error": "Invalid or expired token",
  "statusCode": 401,
  "timestamp": "2024-01-01T00:00:00.000Z"
}

// 401 - Missing token
{
  "success": false,
  "error": "Authorization token required",
  "statusCode": 401,
  "timestamp": "2024-01-01T00:00:00.000Z"
}

// 401 - User not found or inactive
{
  "success": false,
  "error": "User not found or inactive",
  "statusCode": 401,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### POST /auth/verification-codes
**Description**: Create verification code (Admin only)
**Authentication**: Required (ADMIN)
**Request Body**:
```json
{
  "code": "ADMIN-2025-ABC123",
  "role": "ADMIN",
  "expiresAt": "2025-12-31T23:59:59.000Z", // optional
  "maxUses": 10 // optional
}
```

### GET /auth/verification-codes
**Description**: Get all verification codes (Admin only)
**Authentication**: Required (ADMIN)
**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "code_id",
      "code": "ADMIN-2025-ABC123",
      "role": "ADMIN",
      "expiresAt": "2025-12-31T23:59:59.000Z",
      "maxUses": 10,
      "currentUses": 2,
      "isActive": true
    }
  ]
}
```

### GET /auth/verification-codes/:id
**Description**: Get verification code by ID (Admin only)
**Authentication**: Required (ADMIN)
**Parameters**:
- `id` (path): Verification code ID

### PATCH /auth/verification-codes/:id
**Description**: Update verification code (Admin only)
**Authentication**: Required (ADMIN)
**Parameters**:
- `id` (path): Verification code ID
**Request Body**: Partial verification code object

### DELETE /auth/verification-codes/:id
**Description**: Delete verification code (Admin only)
**Authentication**: Required (ADMIN)
**Parameters**:
- `id` (path): Verification code ID

---

## 3. Users Endpoints (`/users`)

### POST /users
**Description**: Create a new user (Admin only)
**Authentication**: Required (ADMIN)
**Request Body**:
```json
{
  "matricNO": "CS/2023/001",
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe", // optional
  "role": "STUDENT" // optional
}
```

### GET /users
**Description**: Get all users with pagination (Admin only)
**Authentication**: Required (ADMIN)
**Query Parameters**:
- `page` (optional): Page number
- `limit` (optional): Items per page
- `orderBy` (optional): Field to order by
- `orderDirection` (optional): `asc` or `desc`

### GET /users/:matricNO
**Description**: Get user by matric number (Admin only)
**Authentication**: Required (ADMIN)
**Parameters**:
- `matricNO` (path): User's matric number

### PATCH /users/:matricNO
**Description**: Update user (Admin only)
**Authentication**: Required (ADMIN)
**Parameters**:
- `matricNO` (path): User's matric number
**Request Body**: Partial user object

### DELETE /users/:matricNO
**Description**: Delete user (Admin only)
**Authentication**: Required (ADMIN)
**Parameters**:
- `matricNO` (path): User's matric number

---

## 4. Departments Endpoints (`/departments`)

### POST /departments
**Description**: Create a new department
**Authentication**: Required (ADMIN)
**Request Body**:
```json
{
  "name": "Computer Science",
  "code": "CS"
}
```

### GET /departments
**Description**: Get all departments with pagination
**Authentication**: Not required
**Query Parameters**:
- `page` (optional): Page number
- `limit` (optional): Items per page
- `orderBy` (optional): Field to order by
- `orderDirection` (optional): `asc` or `desc`

### GET /departments/:code
**Description**: Get department by code
**Authentication**: Not required
**Parameters**:
- `code` (path): Department code

### PATCH /departments/:code
**Description**: Update department
**Authentication**: Required (ADMIN)
**Parameters**:
- `code` (path): Department code
**Request Body**: Partial department object

### DELETE /departments/:code
**Description**: Delete department
**Authentication**: Required (ADMIN)
**Parameters**:
- `code` (path): Department code

### POST /departments/bulk/upload
**Description**: Bulk create departments from CSV
**Authentication**: Required (ADMIN)
**Request Body**: Form data with CSV file

### GET /departments/bulk/template
**Description**: Download CSV template for departments
**Authentication**: Required (ADMIN)
**Response**: CSV file download

### GET /departments/statistics
**Description**: Get department statistics
**Authentication**: Not required

### GET /departments/search/:searchTerm
**Description**: Search departments by name
**Authentication**: Not required
**Parameters**:
- `searchTerm` (path): Search term

### GET /departments/with-courses
**Description**: Get departments with their courses
**Authentication**: Not required

### GET /departments/without-courses
**Description**: Get departments without courses
**Authentication**: Not required

### GET /departments/with-course-count
**Description**: Get departments with course count
**Authentication**: Not required

### GET /departments/:code/full-details
**Description**: Get department with full details
**Authentication**: Not required
**Parameters**:
- `code` (path): Department code

---

## 5. Courses Endpoints (`/courses`)

### POST /courses
**Description**: Create a new course
**Authentication**: Required (ADMIN, LECTURER)
**Request Body**:
```json
{
  "code": "CS101",
  "name": "Introduction to Computer Science",
  "level": "LEVEL_100",
  "credits": 3,
  "departmentCode": "CS"
}
```

### GET /courses
**Description**: Get all courses with pagination
**Authentication**: Not required
**Query Parameters**:
- `page` (optional): Page number
- `limit` (optional): Items per page
- `orderBy` (optional): Field to order by
- `orderDirection` (optional): `asc` or `desc`

### GET /courses/:code
**Description**: Get course by code
**Authentication**: Not required
**Parameters**:
- `code` (path): Course code

### PATCH /courses/:code
**Description**: Update course
**Authentication**: Required (ADMIN, LECTURER)
**Parameters**:
- `code` (path): Course code
**Request Body**: Partial course object

### DELETE /courses/:code
**Description**: Delete course
**Authentication**: Required (ADMIN)
**Parameters**:
- `code` (path): Course code

### GET /courses/department/:departmentCode
**Description**: Get courses by department
**Authentication**: Not required
**Parameters**:
- `departmentCode` (path): Department code

### GET /courses/level/:level
**Description**: Get courses by level
**Authentication**: Not required
**Parameters**:
- `level` (path): Course level (enum)

### POST /courses/bulk/upload
**Description**: Bulk create courses from CSV
**Authentication**: Required (ADMIN, LECTURER)
**Request Body**: Form data with CSV file

### GET /courses/bulk/template
**Description**: Download CSV template for courses
**Authentication**: Required (ADMIN, LECTURER)
**Response**: CSV file download

### GET /courses/statistics
**Description**: Get course statistics
**Authentication**: Not required

### GET /courses/search/:searchTerm
**Description**: Search courses by name
**Authentication**: Not required
**Parameters**:
- `searchTerm` (path): Search term

### GET /courses/credits/:minCredits/:maxCredits
**Description**: Find courses by credit range
**Authentication**: Not required
**Parameters**:
- `minCredits` (path): Minimum credits
- `maxCredits` (path): Maximum credits

### GET /courses/without-schedules
**Description**: Get courses without schedules
**Authentication**: Not required

---

## 6. Schedules Endpoints (`/schedules`)

### POST /schedules
**Description**: Create a new schedule
**Authentication**: Required (ADMIN, LECTURER)
**Request Body**:
```json
{
  "courseCode": "CS101",
  "dayOfWeek": "MONDAY",
  "startTime": "08:00",
  "endTime": "09:00",
  "venue": "Room 101",
  "type": "LECTURE"
}
```

### GET /schedules
**Description**: Get all schedules with pagination
**Authentication**: Not required
**Query Parameters**:
- `page` (optional): Page number
- `limit` (optional): Items per page
- `orderBy` (optional): Field to order by
- `orderDirection` (optional): `asc` or `desc`

### GET /schedules/:id
**Description**: Get schedule by ID
**Authentication**: Not required
**Parameters**:
- `id` (path): Schedule ID

### PATCH /schedules/:id
**Description**: Update schedule
**Authentication**: Required (ADMIN, LECTURER)
**Parameters**:
- `id` (path): Schedule ID
**Request Body**: Partial schedule object

### DELETE /schedules/:id
**Description**: Delete schedule
**Authentication**: Required (ADMIN)
**Parameters**:
- `id` (path): Schedule ID

### GET /schedules/course/:courseCode
**Description**: Get schedules by course
**Authentication**: Not required
**Parameters**:
- `courseCode` (path): Course code

### GET /schedules/department/:departmentCode
**Description**: Get schedules by department
**Authentication**: Not required
**Parameters**:
- `departmentCode` (path): Department code

### GET /schedules/level/:level
**Description**: Get schedules by level
**Authentication**: Not required
**Parameters**:
- `level` (path): Course level (enum)

### GET /schedules/day/:dayOfWeek
**Description**: Get schedules by day of week
**Authentication**: Not required
**Parameters**:
- `dayOfWeek` (path): Day of week (enum)

### GET /schedules/venue/:venue
**Description**: Get schedules by venue
**Authentication**: Not required
**Parameters**:
- `venue` (path): Venue name

### GET /schedules/type/:type
**Description**: Get schedules by class type
**Authentication**: Not required
**Parameters**:
- `type` (path): Class type (enum)

### POST /schedules/bulk/upload
**Description**: Bulk create schedules from CSV
**Authentication**: Required (ADMIN, LECTURER)
**Request Body**: Form data with CSV file

### GET /schedules/bulk/template
**Description**: Download CSV template for schedules
**Authentication**: Required (ADMIN, LECTURER)
**Response**: CSV file download

### GET /schedules/statistics
**Description**: Get schedule statistics
**Authentication**: Not required

---

## 7. Complaints Endpoints (`/complaints`)

### POST /complaints
**Description**: Create a new complaint
**Authentication**: Required (STUDENT, ADMIN)
**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@student.edu",
  "department": "Computer Science",
  "subject": "System Issue",
  "message": "Detailed description of the issue..."
}
```

### GET /complaints
**Description**: Get all complaints (Admin only)
**Authentication**: Required (ADMIN)
**Query Parameters**:
- `page` (optional): Page number
- `limit` (optional): Items per page
- `orderBy` (optional): Field to order by
- `orderDirection` (optional): `asc` or `desc`

### GET /complaints/my-complaints
**Description**: Get current user's complaints
**Authentication**: Required (STUDENT, ADMIN)

### GET /complaints/pending
**Description**: Get pending complaints (Admin only)
**Authentication**: Required (ADMIN)

### GET /complaints/resolved
**Description**: Get resolved complaints (Admin only)
**Authentication**: Required (ADMIN)

### PATCH /complaints/:id/status
**Description**: Update complaint status (Admin only)
**Authentication**: Required (ADMIN)
**Parameters**:
- `id` (path): Complaint ID
**Query Parameters**:
- `status` (required): New complaint status (enum)

---

## 8. Health Check Endpoints (`/health`)

### GET /health
**Description**: Comprehensive health check
**Authentication**: Not required
**Response**:
```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "memory_heap": {
      "status": "up",
      "used": 50000000,
      "limit": 157286400
    },
    "memory_rss": {
      "status": "up",
      "used": 100000000,
      "limit": 157286400
    }
  },
  "error": {},
  "details": {
    "database": { "status": "up" },
    "memory_heap": { "status": "up" },
    "memory_rss": { "status": "up" }
  }
}
```

### GET /health/simple
**Description**: Simple health check
**Authentication**: Not required
**Response**:
```json
{
  "status": "ok",
  "timestamp": "2025-01-12T00:00:00.000Z",
  "uptime": 3600,
  "environment": "development",
  "version": "1.0.0"
}
```

### GET /health/database
**Description**: Database health check
**Authentication**: Not required
**Response**:
```json
{
  "status": "ok",
  "database": {
    "connected": true,
    "responseTime": 15,
    "tables": {
      "departments": 5,
      "courses": 25,
      "schedules": 100,
      "users": 50
    }
  }
}
```

### GET /health/readiness
**Description**: Readiness check for Kubernetes
**Authentication**: Not required
**Response**:
```json
{
  "status": "ready",
  "checks": {
    "database": true,
    "dependencies": true
  }
}
```

### GET /health/liveness
**Description**: Liveness check for Kubernetes
**Authentication**: Not required
**Response**:
```json
{
  "status": "alive",
  "timestamp": "2025-01-12T00:00:00.000Z"
}
```

---

## Common Pagination Response Format

For endpoints that support pagination, the response follows this format:

```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

## Rate Limiting

All authentication endpoints are protected by rate limiting to prevent abuse. The default limits are:
- Registration: 5 requests per minute
- Login: 10 requests per minute
- Password reset: 3 requests per minute

## CORS

The API supports CORS for web applications. Configure the frontend URL in the environment variables.

## Environment Variables

Key environment variables needed:
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret for JWT token signing
- `JWT_EXPIRES_IN`: Token expiration time
- `SMTP_*`: Email configuration for password reset
- `NODE_ENV`: Environment (development/production)
- `PORT`: Server port (default: 3000)

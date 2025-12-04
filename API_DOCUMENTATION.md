# CourseFlow Backend API Documentation

## 1. Overview
*   **Base URL:** `http://<host>:<port>/api/v1` (e.g., `http://localhost:3000/api/v1`)
*   **Content-Type:** `application/json` (except for file uploads)
*   **Date Format:** ISO 8601 (e.g., `2025-10-25T12:00:00Z`)

## 2. Authentication & Security
*   **Method:** Bearer Token (JWT).
*   **Header:** `Authorization: Bearer <your_access_token>`
*   **Role Based Access Control (RBAC):**
    *   **Public:** No token required.
    *   **Authenticated:** Token required (Any role).
    *   **Admin:** Token with `role: ADMIN` required.
    *   **Lecturer:** Token with `role: LECTURER` required.

---

## 3. Common Data Types & Enums

**Pagination & Filtering Query Parameters (Apply to list endpoints)**
| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `page` | number | 1 | Page number |
| `limit` | number | 10 | Items per page (Max 100) |
| `orderBy` | string | createdAt | Field to sort by |
| `orderDirection` | string | asc | `asc` or `desc` |

**Enums**
*   **Role:** `STUDENT`, `LECTURER`, `ADMIN`
*   **Level:** `LEVEL_100`, `LEVEL_200`, `LEVEL_300`, `LEVEL_400`, `LEVEL_500`
*   **DayOfWeek:** `MONDAY`, `TUESDAY`, `WEDNESDAY`, `THURSDAY`, `FRIDAY`, `SATURDAY`, `SUNDAY`
*   **ClassType:** `LECTURE`, `SEMINAR`, `LAB`, `TUTORIAL`
*   **ComplaintStatus:** `PENDING`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`

---

## 4. Endpoints

### 🔐 Authentication
**Controller:** `AuthController`

#### 1. Register User
*   **Endpoint:** `POST /auth/register`
*   **Access:** Public
*   **Note:** `verificationCode` is **required** if role is `ADMIN` or `LECTURER`.
*   **Body:**
    ```json
    {
      "matricNO": "CS/2023/001",
      "email": "user@example.com",
      "password": "password123", // Min 6 chars
      "name": "John Doe",
      "role": "STUDENT", // Optional, default STUDENT
      "verificationCode": "ADMIN-CODE-123" // Conditional
    }
    ```
*   **Response (201):**
    ```json
    {
      "user": { "id": "...", "email": "..." },
      "access_token": "ey...",
      "token_type": "Bearer"
    }
    ```

#### 2. Login
*   **Endpoint:** `POST /auth/login`
*   **Access:** Public
*   **Body:**
    ```json
    {
      "email": "user@example.com",
      "password": "password123"
    }
    ```

#### 3. Get Current User Profile
*   **Endpoint:** `GET /auth/me`
*   **Access:** Authenticated
*   **Response:** Returns full user profile object.

#### 4. Password Management
*   **Forgot Password:** `POST /auth/forgot-password` (Body: `{ "email": "..." }`)
*   **Reset Password:** `POST /auth/reset-password` (Body: `{ "token": "...", "newPassword": "..." }`)

#### 5. Verification Codes (Admin Only)
*   **Create:** `POST /auth/verification-codes`
    *   Body: `{ "code": "UniqueStr", "role": "ADMIN", "maxUsage": 10, "expiresAt": "ISO-Date" }`
*   **List:** `GET /auth/verification-codes`
*   **Get One:** `GET /auth/verification-codes/:id`
*   **Update:** `PATCH /auth/verification-codes/:id` (Body: Partial Create DTO + `isActive`)
*   **Delete:** `DELETE /auth/verification-codes/:id`

---

### 📚 Courses
**Controller:** `CoursesController`

#### 1. Get All Courses (Filtered)
*   **Endpoint:** `GET /courses`
*   **Access:** Authenticated
*   **Query Parameters:**
    *   Standard Pagination (`page`, `limit`, `orderBy`, `orderDirection`)
    *   `departmentCode`: e.g., "CS"
    *   `level`: e.g., "LEVEL_100"
    *   `searchTerm`: Partial match on name or code
    *   `lecturerEmail`: Filter by Lecturer's email address
    *   `minCredits`: number
    *   `maxCredits`: number
*   **Response (200):** Paginated list of courses with department and lecturer details.

#### 2. Get Course by Code
*   **Endpoint:** `GET /courses/:code`
*   **Access:** Authenticated

#### 3. Create Course
*   **Endpoint:** `POST /courses`
*   **Access:** Admin, Lecturer
*   **Body:**
    ```json
    {
      "code": "CSC101",
      "name": "Intro to CS",
      "level": "LEVEL_100",
      "credits": 3,
      "departmentCode": "CSC",
      "lecturerEmail": "lecturer@university.edu" // Uses Email to resolve ID
    }
    ```

#### 4. Bulk Upload Courses
*   **Endpoint:** `POST /courses/bulk/upload`
*   **Access:** Admin, Lecturer
*   **Content-Type:** `multipart/form-data`
*   **Body:** Form field `file` containing the CSV.
*   **CSV Headers:** `code`, `name`, `level`, `credits`, `departmentCode`, `lecturerEmail`

#### 5. Download Template
*   **Endpoint:** `GET /courses/bulk/template`
*   **Access:** Authenticated
*   **Response:** Downloadable CSV file with headers.

#### 6. Other Course Endpoints
*   `PATCH /courses/:code` (Admin, Lecturer) - Update course details.
*   `DELETE /courses/:code` (Admin) - Soft delete.
*   `GET /courses/without-schedules` - List courses missing a schedule.
*   `GET /courses/statistics` - Aggregate stats (Total courses, breakdown by level/dept).

---

### 📅 Schedules (Timetable)
**Controller:** `SchedulesController`

#### 1. Get All Schedules (Filtered)
*   **Endpoint:** `GET /schedules`
*   **Access:** Authenticated
*   **Query Parameters:**
    *   Standard Pagination
    *   `courseCode`: e.g., "CSC101"
    *   `departmentCode`: e.g., "CSC" (Filters based on the related Course's department)
    *   `level`: e.g., "LEVEL_100" (Filters based on the related Course's level)
    *   `dayOfWeek`: e.g., "MONDAY"
    *   `venue`: Partial search (e.g., "Hall")
    *   `type`: e.g., "LECTURE"
    *   `startTime` & `endTime`: HH:MM format. *If both are provided, it filters for classes overlapping with this range.*
*   **Response:** Paginated list including nested Course details.

#### 2. Create Schedule
*   **Endpoint:** `POST /schedules`
*   **Access:** Admin, Lecturer
*   **Body:**
    ```json
    {
      "courseCode": "CSC101",
      "dayOfWeek": "MONDAY",
      "startTime": "08:00", // HH:MM
      "endTime": "10:00",   // HH:MM
      "venue": "Lecture Hall 1",
      "type": "LECTURE" // Optional
    }
    ```
*   **Note:** Returns `409 Conflict` if time overlaps for the same course or within specific constraints.

#### 3. Bulk Upload Schedules
*   **Endpoint:** `POST /schedules/bulk/upload`
*   **Access:** Admin, Lecturer
*   **Content-Type:** `multipart/form-data` (field: `file`)
*   **CSV Headers:** `courseCode`, `dayOfWeek`, `startTime`, `endTime`, `venue`, `type`

#### 4. Other Schedule Endpoints
*   `GET /schedules/:id` - Get single schedule.
*   `PATCH /schedules/:id` (Admin, Lecturer) - Update schedule.
*   `DELETE /schedules/:id` (Admin) - Delete schedule.
*   `GET /schedules/statistics` - Stats by Day and Type.
*   `GET /schedules/bulk/template` - Download CSV template.

---

### 🏛️ Departments
**Controller:** `DepartmentsController`

#### 1. Get All Departments
*   **Endpoint:** `GET /departments`
*   **Access:** Authenticated
*   **Query Parameters:**
    *   Standard Pagination
    *   `searchTerm`: Search name or code.
    *   `hasCourses`: `true` (Only return depts with active courses).
    *   `withoutCourses`: `true` (Only return empty depts).

#### 2. Get Department Details
*   **Endpoint:** `GET /departments/:code` - Basic details.
*   **Endpoint:** `GET /departments/:code/full-details` - Includes nested active courses and their schedules.

#### 3. Administrative Actions (Admin Only)
*   `POST /departments`: Body `{ "name": "...", "code": "..." }`
*   `PATCH /departments/:code`: Update details.
*   `DELETE /departments/:code`: **Note:** Fails if department has active courses.
*   `POST /departments/bulk/upload`: CSV Headers `code`, `name`.
*   `GET /departments/bulk/template`: Download CSV template.
*   `GET /departments/statistics`: Stats overview.

---

### 👨‍🏫 Lecturers
**Controller:** `LecturersController`

#### 1. List Lecturers
*   **Endpoint:** `GET /lecturers`
*   **Access:** Authenticated
*   **Query Parameters:** Standard Pagination.

#### 2. Specific Lookups
*   **Endpoint:** `GET /lecturers/:id`
*   **Endpoint:** `GET /lecturers/search/:searchTerm` (Name search).
*   **Endpoint:** `GET /lecturers/department/:departmentCode`

#### 3. Administrative Actions (Admin Only)
*   `POST /lecturers`: Body `{ "name": "...", "email": "...", "departmentCode": "..." }`
*   `PATCH /lecturers/:id`
*   `DELETE /lecturers/:id`

---

### 👥 Users (Students/Admins)
**Controller:** `UsersController`

#### 1. List Users
*   **Endpoint:** `GET /users`
*   **Access:** Admin Only
*   **Query Parameters:** Pagination.

#### 2. User Management (Admin Only)
*   `POST /users`: Create user manually.
*   `GET /users/:matricNO`: Get specific user.
*   `PATCH /users/:matricNO`: Update user.
*   `DELETE /users/:matricNO`: Delete user.

---

### 📢 Complaints
**Controller:** `ComplaintsController`

#### 1. Create Complaint
*   **Endpoint:** `POST /complaints`
*   **Access:** Public (or Authenticated)
*   **Body:**
    ```json
    {
      "name": "Student Name",
      "email": "student@school.edu",
      "department": "CSC",
      "subject": "Missing Grades",
      "message": "Full text description..."
    }
    ```

#### 2. View My Complaints
*   **Endpoint:** `GET /complaints/my-complaints`
*   **Access:** Authenticated (Student/Admin)

#### 3. Admin Management (Admin Only)
*   `GET /complaints`: List all (Paginated).
*   `GET /complaints/pending`: List only pending.
*   `GET /complaints/resolved`: List only resolved.
*   `PATCH /complaints/:id/status?status=RESOLVED`: Update status.

---

### 🏥 Health Checks
**Controller:** `HealthController`
*   `GET /health`: Comprehensive check (DB status, Memory usage).
*   `GET /health/simple`: Quick uptime check.
*   `GET /health/database`: DB connection latency and table counts.
*   `GET /health/readiness`: Kubernetes readiness probe.
*   `GET /health/liveness`: Kubernetes liveness probe.

---

## 5. Error Handling & Status Codes

The API returns standard HTTP status codes. Errors generally follow this format:

```json
{
  "success": false,
  "statusCode": 400,
  "errorCode": "VALIDATION_ERROR",
  "timestamp": "2025-10-25T12:00:00Z",
  "path": "/api/v1/courses",
  "message": ["email must be an email", "password is too short"]
}
```

*   **200 OK:** Successful request.
*   **201 Created:** Resource successfully created.
*   **400 Bad Request:** Validation failed or invalid input.
*   **401 Unauthorized:** Invalid or missing JWT token.
*   **403 Forbidden:** User role does not have permission.
*   **404 Not Found:** Resource ID/Code does not exist.
*   **409 Conflict:** Duplicate data (e.g., Email exists, Schedule time overlap).
*   **429 Too Many Requests:** Rate limit exceeded.
*   **500 Internal Server Error:** Server crash or DB error.

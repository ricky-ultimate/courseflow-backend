# Departments Module

The Departments module manages academic departments within the university system.

## Endpoints

### GET /api/v1/departments
Get all departments with pagination support.

### GET /api/v1/departments/:code
Get a specific department by its code (e.g., 'CS', 'MATH').

### POST /api/v1/departments
Create a new department.

**Request Body:**
```json
{
  "code": "CS",
  "name": "Computer Science"
}
```

### PATCH /api/v1/departments/:code
Update department information.

### DELETE /api/v1/departments/:code
Delete a department (only if no active courses exist).

### GET /api/v1/departments/search/:searchTerm
Search departments by name or code.

### GET /api/v1/departments/with-courses
Get departments that have active courses.

### GET /api/v1/departments/without-courses
Get departments that have no active courses.

### GET /api/v1/departments/with-course-count
Get departments with their course counts.

### GET /api/v1/departments/:code/full-details
Get department with complete details including courses and schedules.

### GET /api/v1/departments/statistics
Get department statistics and analytics.

**Response:**
```json
{
  "totalDepartments": 12,
  "departmentsWithCourses": 10,
  "departmentsWithoutCourses": 2,
  "averageCoursesPerDepartment": 12.5
}
```

## Bulk Operations

### POST /api/v1/departments/bulk/upload
Upload CSV file to create multiple departments.

**CSV Format:**
```csv
code,name
CS,Computer Science
MATH,Mathematics
PHYS,Physics
```

### GET /api/v1/departments/bulk/template
Download CSV template for bulk department creation.

## Department Structure

- **code**: Unique identifier (e.g., 'CS', 'MATH')
- **name**: Full department name
- **isActive**: Status flag for soft deletion
- **courses**: Related courses within the department

## Business Rules

- Department codes must be unique
- Department codes are used in URLs (e.g., /departments/CS)
- Departments cannot be deleted if they have active courses
- Department codes should be short and descriptive

## Error Responses

- `400 Bad Request` - Invalid input data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Department not found
- `409 Conflict` - Department code already exists or has active courses

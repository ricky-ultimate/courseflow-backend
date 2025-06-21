# Departments Module

The Departments module manages academic departments within the university system.

## Endpoints

### GET /departments
Get all departments with pagination support.

### GET /departments/:code
Get a specific department by its code (e.g., 'CS', 'MATH').

### POST /departments
Create a new department.

**Request Body:**
```json
{
  "code": "CS",
  "name": "Computer Science"
}
```

### PATCH /departments/:code
Update department information.

### DELETE /departments/:code
Delete a department (only if no active courses exist).

### GET /departments/search/:searchTerm
Search departments by name or code.

### GET /departments/with-courses
Get departments that have active courses.

### GET /departments/without-courses
Get departments that have no active courses.

### GET /departments/with-course-count
Get departments with their course counts.

### GET /departments/:code/full-details
Get department with complete details including courses and schedules.

### GET /departments/statistics
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

### POST /departments/bulk/upload
Upload CSV file to create multiple departments.

**CSV Format:**
```csv
code,name
CS,Computer Science
MATH,Mathematics
PHYS,Physics
```

### GET /departments/bulk/template
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

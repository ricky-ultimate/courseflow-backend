# Courses Module

The Courses module manages academic courses, their relationships with departments, and course scheduling.

## Endpoints

### GET /courses
Get all courses with pagination and filtering options.

### GET /courses/:code
Get a specific course by its code (e.g., 'CS101').

### POST /courses
Create a new course.

**Request Body:**
```json
{
  "code": "CS101",
  "name": "Introduction to Programming",
  "level": "LEVEL_100",
  "credits": 3,
  "departmentCode": "CS"
}
```

### PATCH /courses/:code
Update course information.

### DELETE /courses/:code
Delete a course (soft delete).

### GET /courses/department/:departmentCode
Get all courses for a specific department.

### GET /courses/level/:level
Get courses by academic level (LEVEL_100, LEVEL_200, LEVEL_300, LEVEL_400).

### GET /courses/search/:searchTerm
Search courses by name or code.

### GET /courses/credits/:minCredits/:maxCredits
Find courses within a specific credit range.

### GET /courses/without-schedules
Get courses that don't have any scheduled classes.

### GET /courses/statistics
Get course statistics and analytics.

**Response:**
```json
{
  "totalCourses": 150,
  "coursesByLevel": {
    "LEVEL_100": 45,
    "LEVEL_200": 40,
    "LEVEL_300": 35,
    "LEVEL_400": 30
  },
  "coursesByDepartment": {
    "CS": 25,
    "MATH": 20,
    "PHYS": 15
  },
  "averageCredits": 3.2
}
```

## Bulk Operations

### POST /courses/bulk/upload
Upload CSV file to create multiple courses.

**CSV Format:**
```csv
code,name,level,credits,departmentCode
CS101,Introduction to Programming,LEVEL_100,3,CS
CS201,Data Structures,LEVEL_200,4,CS
MATH101,Calculus I,LEVEL_100,3,MATH
```

### GET /courses/bulk/template
Download CSV template for bulk course creation.

## Course Levels

- **LEVEL_100**: First year courses
- **LEVEL_200**: Second year courses  
- **LEVEL_300**: Third year courses
- **LEVEL_400**: Fourth year courses

## Course Structure

- **code**: Unique course identifier
- **name**: Full course name
- **level**: Academic level (100-400)
- **credits**: Credit hours for the course
- **departmentCode**: Associated department
- **schedules**: Class schedules for the course

## Business Rules

- Course codes must be unique across the system
- Courses must be associated with an existing department
- Credit values must be positive integers
- Course codes are used in URLs and scheduling

## Error Responses

- `400 Bad Request` - Invalid input data or validation errors
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Course or department not found
- `409 Conflict` - Course code already exists

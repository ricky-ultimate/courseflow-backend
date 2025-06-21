# Schedules Module

The Schedules module manages class schedules, timetables, and venue assignments for courses.

## Endpoints

### GET /schedules
Get all schedules with course and department information.

### GET /schedules/:id
Get a specific schedule by ID.

### POST /schedules
Create a new schedule with conflict detection.

**Request Body:**
```json
{
  "courseCode": "CS101",
  "dayOfWeek": "MONDAY",
  "startTime": "08:00",
  "endTime": "09:30",
  "venue": "Room 101",
  "type": "LECTURE"
}
```

### PATCH /schedules/:id
Update an existing schedule.

### DELETE /schedules/:id
Delete a schedule.

### GET /schedules/course/:courseCode
Get all schedules for a specific course.

### GET /schedules/department/:departmentCode
Get schedules for all courses in a department.

### GET /schedules/level/:level
Get schedules for courses at a specific academic level.

### GET /schedules/day/:dayOfWeek
Get all schedules for a specific day of the week.

**Day Options:** MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY

### GET /schedules/venue/:venue
Get schedules for a specific venue (supports partial matching).

### GET /schedules/type/:type
Get schedules by class type.

**Type Options:** LECTURE, SEMINAR, LAB, TUTORIAL

### GET /schedules/statistics
Get comprehensive schedule statistics.

**Response:**
```json
{
  "totalSchedules": 120,
  "schedulesByDay": {
    "MONDAY": 25,
    "TUESDAY": 20,
    "WEDNESDAY": 22,
    "THURSDAY": 18,
    "FRIDAY": 15,
    "SATURDAY": 10,
    "SUNDAY": 10
  },
  "schedulesByType": {
    "LECTURE": 60,
    "SEMINAR": 25,
    "LAB": 20,
    "TUTORIAL": 15
  }
}
```

## Bulk Operations

### POST /schedules/bulk/upload
Upload CSV file to create multiple schedules.

**CSV Format:**
```csv
courseCode,dayOfWeek,startTime,endTime,venue,type
CS101,MONDAY,08:00,09:30,Room 101,LECTURE
CS101,WEDNESDAY,10:00,11:30,Lab 201,LAB
MATH101,TUESDAY,14:00,15:30,Room 205,LECTURE
```

### GET /schedules/bulk/template
Download CSV template for bulk schedule creation.

## Schedule Structure

- **courseCode**: Reference to the course
- **dayOfWeek**: Day of the week for the class
- **startTime**: Class start time (HH:MM format)
- **endTime**: Class end time (HH:MM format)
- **venue**: Classroom or location
- **type**: Type of class (LECTURE, SEMINAR, LAB, TUTORIAL)

## Business Rules

- Schedules cannot overlap for the same venue
- Start time must be before end time
- Course must exist before creating schedule
- Time conflicts are automatically detected

## Class Types

- **LECTURE**: Traditional classroom lectures
- **SEMINAR**: Small group discussions
- **LAB**: Practical laboratory sessions
- **TUTORIAL**: One-on-one or small group tutorials

## Error Responses

- `400 Bad Request` - Invalid time format or data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Schedule or course not found
- `409 Conflict` - Schedule conflict detected

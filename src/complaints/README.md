# Complaints Module

The Complaints module handles administrative complaints, feedback, and issue resolution within the university system.

## Endpoints

### GET /api/v1/complaints
Get all complaints with pagination and filtering options.

### GET /api/v1/complaints/:id
Get a specific complaint by ID.

### POST /api/v1/complaints
Create a new complaint.

**Request Body:**
```json
{
  "title": "Issue with Course Registration",
  "description": "Unable to register for CS101 due to system error",
  "category": "TECHNICAL"
}
```

### PATCH /api/v1/complaints/:id
Update complaint information (Admin/Lecturer only).

### DELETE /api/v1/complaints/:id
Delete a complaint (Admin only).

### GET /api/v1/complaints/user/:userId
Get complaints submitted by a specific user.

### GET /api/v1/complaints/status/:status
Get complaints by status.

**Status Options:** PENDING, IN_PROGRESS, RESOLVED, CLOSED

### GET /api/v1/complaints/category/:category
Get complaints by category.

### GET /api/v1/complaints/statistics
Get complaint statistics and analytics (Admin only).

**Response:**
```json
{
  "totalComplaints": 45,
  "complaintsByStatus": {
    "PENDING": 12,
    "IN_PROGRESS": 8,
    "RESOLVED": 20,
    "CLOSED": 5
  },
  "complaintsByCategory": {
    "TECHNICAL": 15,
    "ACADEMIC": 12,
    "ADMINISTRATIVE": 10,
    "OTHER": 8
  },
  "averageResolutionTime": "2.5 days"
}
```

## Complaint Status Flow

1. **PENDING**: Newly created complaint awaiting review
2. **IN_PROGRESS**: Complaint is being actively worked on
3. **RESOLVED**: Issue has been resolved, awaiting confirmation
4. **CLOSED**: Complaint is fully resolved and closed

## Complaint Categories

- **TECHNICAL**: System issues, bugs, technical problems
- **ACADEMIC**: Course content, grading, academic policies
- **ADMINISTRATIVE**: Registration, scheduling, administrative processes
- **OTHER**: General feedback or uncategorized issues

## Permissions

- **Students**: Can create and view their own complaints
- **Lecturers**: Can view and update complaints, change status
- **Admins**: Full CRUD operations, access to all complaints and statistics

## Business Rules

- New complaints automatically default to PENDING status
- Only authorized users can change complaint status
- Users can only view their own complaints unless they have elevated permissions
- Complaint descriptions are required and must be meaningful

## Error Responses

- `400 Bad Request` - Invalid input data or missing required fields
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions to access or modify complaint
- `404 Not Found` - Complaint not found
- `422 Unprocessable Entity` - Invalid status transition

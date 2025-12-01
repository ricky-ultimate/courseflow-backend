# Health Module

The Health module provides comprehensive health monitoring and status checking for the CourseFlow application.

## Endpoints

All health check endpoints are publicly accessible (no authentication required) to support monitoring systems and deployment platforms.

### GET /api/v1/health
Comprehensive system health check including database connectivity and memory usage.

**Response:**
```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "memory_heap": {
      "status": "up",
      "used": 45678912,
      "limit": 157286400
    },
    "memory_rss": {
      "status": "up",
      "used": 67890123,
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

### GET /api/v1/health/simple
Basic application status check for quick monitoring.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "uptime": 12345.67,
  "environment": "production",
  "version": "1.0.0"
}
```

### GET /api/v1/health/database
Detailed database connectivity check with table counts and response time.

**Response:**
```json
{
  "status": "ok",
  "database": {
    "connected": true,
    "responseTime": 45,
    "tables": {
      "departments": 12,
      "courses": 150,
      "schedules": 300,
      "users": 500
    }
  }
}
```

### GET /api/v1/health/readiness
Kubernetes readiness probe to determine if the application is ready to serve traffic.

**Response:**
```json
{
  "status": "ready",
  "checks": {
    "database": true,
    "dependencies": true
  }
}
```

### GET /api/v1/health/liveness
Kubernetes liveness probe to determine if the application is alive and functioning.

**Response:**
```json
{
  "status": "alive",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

## Health Check Types

### System Health
- Database connectivity
- Memory usage monitoring
- Application responsiveness

### Database Health
- Connection status
- Query response time
- Table accessibility
- Record counts

### Kubernetes Probes
- **Readiness**: Indicates when the application is ready to receive traffic
- **Liveness**: Indicates when the application should be restarted

## Monitoring Integration

These endpoints are designed to work with:
- **Load Balancers**: For routing decisions
- **Kubernetes**: For pod lifecycle management
- **Monitoring Systems**: For uptime tracking
- **Deployment Platforms**: For health verification

## Memory Thresholds

- **Heap Memory**: 150MB limit
- **RSS Memory**: 150MB limit
- Status changes to "down" if limits are exceeded

## Error Responses

- `503 Service Unavailable` - Application is unhealthy
- Database connection failures return detailed error information
- Memory threshold violations are reported in the response

## Usage in Production

- Use `/health/simple` for basic uptime monitoring
- Use `/health` for comprehensive system monitoring
- Use `/health/database` for database-specific monitoring
- Use `/health/readiness` and `/health/liveness` for Kubernetes deployments

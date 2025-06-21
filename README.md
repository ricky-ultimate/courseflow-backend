# CourseFlow Backend

A comprehensive university course management system API built with NestJS, TypeScript, and PostgreSQL. This backend provides robust functionality for managing academic departments, courses, schedules, users, and administrative operations.

## Overview

CourseFlow is designed to streamline university course management with features including user authentication, role-based access control, course scheduling, department management, and administrative oversight. The system supports both students and administrative staff with appropriate access levels and functionality.

## Features

- **User Management**: Registration, authentication, and role-based access control
- **Department Management**: CRUD operations for academic departments
- **Course Management**: Comprehensive course administration with level-based organization
- **Schedule Management**: Class scheduling with conflict detection and venue management
- **Complaint System**: Administrative complaint handling and resolution
- **Bulk Operations**: CSV import/export functionality for efficient data management
- **Health Monitoring**: Comprehensive health checks for production deployment
- **API Documentation**: Auto-generated Swagger documentation

## Architecture

The application follows clean architecture principles with:

- **Modular Design**: Feature-based modules with clear separation of concerns
- **Repository Pattern**: Database abstraction layer for maintainable data access
- **Decorator Pattern**: Reusable API decorators for consistent documentation
- **Guard System**: JWT authentication and role-based authorization
- **Validation Layer**: Input validation with custom DTOs and pipes
- **Error Handling**: Centralized error handling with appropriate HTTP responses

## Module Documentation

For detailed information about specific modules and their endpoints:

- [Authentication Module](src/auth/README.md) - User authentication and authorization
- [Users Module](src/users/README.md) - User management and profiles
- [Departments Module](src/departments/README.md) - Department administration
- [Courses Module](src/courses/README.md) - Course management and operations
- [Schedules Module](src/schedules/README.md) - Class scheduling and timetables
- [Complaints Module](src/complaints/README.md) - Administrative complaint system
- [Health Module](src/health/README.md) - Application health monitoring

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 12+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd courseflow-backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials and JWT secret

# Run database migrations
npx prisma migrate dev
npx prisma db seed
```

### Development

```bash
# Start in development mode
npm run start:dev

# Build for production
npm run build

# Start production server
npm run start:prod
```

### Testing

```bash
# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e

# Generate test coverage
npm run test:cov
```

## API Documentation

Once the application is running, comprehensive API documentation is available via Swagger UI:

- **Local Development**: `http://localhost:3000/api/docs`
- **Production**: `https://your-domain.com/api/docs`

The documentation includes:
- Interactive endpoint testing
- Request/response schemas
- Authentication requirements
- Example payloads

## Health Monitoring

The application includes comprehensive health check endpoints:

- `GET /health` - Full system health check
- `GET /health/simple` - Basic application status
- `GET /health/database` - Database connectivity check
- `GET /health/readiness` - Kubernetes readiness probe
- `GET /health/liveness` - Kubernetes liveness probe

## Deployment

For production deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md). The application supports deployment on:

- Railway (recommended for students)
- Render
- Vercel + PlanetScale
- Docker containers
- Kubernetes clusters

## Environment Configuration

Key environment variables:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/courseflow
JWT_SECRET=your-secure-jwt-secret
NODE_ENV=production
PORT=3000
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100
```

See `.env.example` for complete configuration options.

## Technology Stack

- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with Passport
- **Validation**: class-validator and class-transformer
- **Documentation**: Swagger/OpenAPI
- **Security**: Rate limiting, CORS, input validation
- **Testing**: Jest for unit and integration tests

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License.

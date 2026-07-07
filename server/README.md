# Backend API - Weekly Report Generator

Node.js/Express REST API with MongoDB for the Weekly Report Generator application.

## Architecture

This backend follows the **MVC (Model-View-Controller)** pattern:

- **Models**: MongoDB schemas using Mongoose
- **Controllers**: Business logic and request handling
- **Routes**: API endpoint definitions
- **Middleware**: Authentication and validation

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM (Object Data Modeling)
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **express-validator** - Request validation
- **dotenv** - Environment variables
- **cors** - Cross-origin resource sharing

## Quick Start

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev

# Start production server
npm start
```

## Environment Variables

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/weekly-reports
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
```

## API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| POST | `/register` | Register new user | No | - |
| POST | `/login` | Login user | No | - |
| GET | `/me` | Get current user | Yes | Any |
| GET | `/users` | Get all users | Yes | Manager |

### Reports (`/api/reports`)

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/` | Get all reports (with filters) | Yes | Any |
| GET | `/:id` | Get single report | Yes | Owner/Manager |
| POST | `/` | Create new report | Yes | Any |
| PUT | `/:id` | Update report | Yes | Owner |
| DELETE | `/:id` | Delete report | Yes | Owner |
| GET | `/analytics/dashboard` | Get analytics data | Yes | Manager |

### Projects (`/api/projects`)

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/` | Get all projects | Yes | Any |
| GET | `/:id` | Get single project | Yes | Any |
| POST | `/` | Create project | Yes | Manager |
| PUT | `/:id` | Update project | Yes | Manager |
| DELETE | `/:id` | Delete project | Yes | Manager |

## Request/Response Examples

### Register User

**Request:**
```json
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "Team Member",
  "department": "Engineering"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "_id": "64f1...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "Team Member",
    "department": "Engineering",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Create Report

**Request:**
```json
POST /api/reports
Authorization: Bearer <token>
{
  "weekStartDate": "2024-01-15",
  "weekEndDate": "2024-01-21",
  "project": "64f1...",
  "tasksCompleted": "Implemented user authentication",
  "tasksPlanned": "Add report filtering",
  "blockers": "Waiting for API documentation",
  "hoursWorked": 40,
  "notes": "Need to review security practices",
  "status": "Submitted"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Report created successfully",
  "data": {
    "_id": "64f2...",
    "user": {
      "_id": "64f1...",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "weekStartDate": "2024-01-15T00:00:00.000Z",
    "weekEndDate": "2024-01-21T00:00:00.000Z",
    "project": {
      "_id": "64f3...",
      "name": "Client Website",
      "category": "Client Work"
    },
    "tasksCompleted": "Implemented user authentication",
    "tasksPlanned": "Add report filtering",
    "blockers": "Waiting for API documentation",
    "hoursWorked": 40,
    "notes": "Need to review security practices",
    "status": "Submitted",
    "submittedAt": "2024-01-21T10:30:00.000Z",
    "createdAt": "2024-01-21T10:30:00.000Z",
    "updatedAt": "2024-01-21T10:30:00.000Z"
  }
}
```

### Get Dashboard Analytics

**Request:**
```
GET /api/reports/analytics/dashboard?startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer <manager_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalReports": 45,
      "totalUsers": 12,
      "complianceRate": 87.5,
      "activeBlockers": 3
    },
    "reportsByProject": [
      {
        "projectName": "Client Website",
        "category": "Client Work",
        "count": 15,
        "totalHours": 180
      }
    ],
    "weeklyTrend": [
      {
        "_id": "2024-01-08",
        "count": 10
      },
      {
        "_id": "2024-01-15",
        "count": 12
      }
    ]
  }
}
```

## Data Models

### User Model
```javascript
{
  name: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  role: String (enum: 'Team Member', 'Manager'),
  department: String,
  isActive: Boolean,
  timestamps: true
}
```

### Report Model
```javascript
{
  user: ObjectId (ref: User, required),
  weekStartDate: Date (required),
  weekEndDate: Date (required),
  project: ObjectId (ref: Project, required),
  tasksCompleted: String (required),
  tasksPlanned: String (required),
  blockers: String,
  hoursWorked: Number (0-168),
  notes: String,
  status: String (enum: 'Draft', 'Submitted', 'Reviewed'),
  submittedAt: Date,
  timestamps: true
}
```

### Project Model
```javascript
{
  name: String (required, unique),
  description: String,
  category: String (enum: categories),
  status: String (enum: 'Active', 'On Hold', 'Completed', 'Archived'),
  createdBy: ObjectId (ref: User, required),
  timestamps: true
}
```

## Middleware

### Authentication Middleware (`authMiddleware.js`)

- `protect`: Verifies JWT token and attaches user to request
- `authorize(...roles)`: Checks if user has required role

**Usage:**
```javascript
router.get('/protected', protect, controller);
router.post('/admin', protect, authorize('Manager'), controller);
```

## Security Features

1. **Password Hashing**: Uses bcrypt with salt rounds of 10
2. **JWT Tokens**: Signed with secret, configurable expiration
3. **CORS**: Configured to allow only specified origins
4. **Input Validation**: Express-validator for all inputs
5. **Role-Based Access**: Middleware enforces permissions
6. **Error Handling**: Centralized error handling middleware

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [] // Optional validation errors
}
```

**Common Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error

## Testing the API

### Using cURL

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password","role":"Team Member"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Get Reports (with token)
curl -X GET http://localhost:5000/api/reports \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Using Postman

1. Import the endpoints as a collection
2. Set up environment variables for `baseUrl` and `token`
3. Use Bearer Token authentication
4. Test all endpoints

## Database Indexes

The following indexes are created automatically:

- `User`: email (unique)
- `Report`: user, weekStartDate, compound index (user + weekStartDate unique)
- `Project`: name (unique)

## Development Tips

1. **MongoDB Connection**: Ensure MongoDB is running before starting the server
2. **Environment Variables**: Never commit `.env` to version control
3. **Logging**: Check console for detailed error messages
4. **Testing**: Use Postman or similar tools to test endpoints
5. **Validation**: All request bodies are validated before processing

## Production Deployment

1. Set `NODE_ENV=production`
2. Use strong `JWT_SECRET` (random 256-bit key)
3. Configure MongoDB with proper authentication
4. Set up HTTPS/SSL
5. Use environment variables for all sensitive data
6. Enable MongoDB authentication
7. Set up proper CORS origins
8. Use PM2 or similar for process management

```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start server.js --name weekly-reports-api

# Monitor
pm2 monit
```

## Troubleshooting

### MongoDB Connection Issues
- Verify MongoDB is running
- Check connection string in `.env`
- Ensure database user has proper permissions

### Authentication Errors
- Verify JWT_SECRET is set
- Check token expiration
- Ensure Authorization header format: `Bearer <token>`

### CORS Errors
- Update CLIENT_URL in `.env`
- Check CORS configuration in `server.js`

## License

MIT

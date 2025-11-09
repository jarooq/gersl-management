# GERSL Management System - Backend API

Complete REST API backend for the GERSL NGO Management System built with Node.js, Express, and PostgreSQL.

## Features

- **Authentication & Authorization**
  - JWT-based authentication with refresh tokens
  - Role-Based Access Control (RBAC) with 12 roles
  - Password hashing with bcrypt
  - Session management

- **Modules**
  - Orphan Management (CRUD, approvals, statistics)
  - Project Management (CRUD, progress tracking, expenses)
  - Finance Management (expenses, approvals, financial reporting)
  - HR Management (staff, attendance, leave)
  - CBO Partners (community-based organizations)
  - International Partners (donors, funders)
  - MEAL (Monitoring, Evaluation, Accountability & Learning)

- **Security**
  - Helmet.js security headers
  - Rate limiting
  - Input sanitization
  - XSS protection
  - CORS configuration
  - SQL injection prevention (Sequelize ORM)

- **File Management**
  - Multer file upload
  - Multiple file types supported
  - Organized storage by category

## Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express 4.18
- **Database:** PostgreSQL 14+
- **ORM:** Sequelize 6.35
- **Authentication:** JWT (jsonwebtoken)
- **Security:** Helmet, bcryptjs, express-rate-limit
- **File Upload:** Multer
- **Logging:** Morgan, Winston

## Prerequisites

- Node.js 18 or higher
- PostgreSQL 14 or higher
- npm or yarn

## Installation

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Database Setup

Create a PostgreSQL database:

```sql
CREATE DATABASE gersl_db;
```

### 3. Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env` with your database credentials:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gersl_db
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Secrets (CHANGE THESE IN PRODUCTION!)
JWT_SECRET=your_jwt_secret_key_change_this
JWT_REFRESH_SECRET=your_refresh_secret_key_change_this

# Application
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5176
```

### 4. Initialize Database

Run the seeder to create tables and populate with sample data:

```bash
npm run seed
```

This will:
- Create all database tables
- Create 5 test users with different roles
- Add sample orphans, projects, expenses, etc.

## Running the Server

### Development Mode (with auto-reload)

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

Server will run on `http://localhost:3000`

## Test Credentials

After running the seeder, you can login with these accounts:

| Role | Username | Password | Email |
|------|----------|----------|-------|
| Admin | admin | admin123 | admin@gersl.org |
| CEO | ceo | ceo123 | ceo@gersl.org |
| Programme Manager | progmanager | pm123 | pm@gersl.org |
| Finance Manager | finmanager | fm123 | fm@gersl.org |
| Field Officer | fieldofficer | fo123 | fo@gersl.org |

## API Endpoints

### Authentication

```
POST   /api/auth/register        - Register new user
POST   /api/auth/login           - Login user
POST   /api/auth/logout          - Logout user
POST   /api/auth/refresh         - Refresh access token
GET    /api/auth/me              - Get current user
PUT    /api/auth/profile         - Update profile
PUT    /api/auth/password        - Change password
```

### Orphans

```
GET    /api/orphans              - Get all orphans (paginated)
GET    /api/orphans/stats        - Get orphan statistics
GET    /api/orphans/:id          - Get orphan by ID
POST   /api/orphans              - Create new orphan
PUT    /api/orphans/:id          - Update orphan
DELETE /api/orphans/:id          - Delete orphan
PUT    /api/orphans/:id/approve  - Approve/reject orphan
GET    /api/orphans/coordinator/:coordinatorId - Get orphans by coordinator
```

### Projects

```
GET    /api/projects             - Get all projects (paginated)
GET    /api/projects/stats       - Get project statistics
GET    /api/projects/:id         - Get project by ID
GET    /api/projects/:id/expenses - Get project expenses
GET    /api/projects/:id/indicators - Get project indicators
POST   /api/projects             - Create new project
PUT    /api/projects/:id         - Update project
PUT    /api/projects/:id/progress - Update project progress
DELETE /api/projects/:id         - Delete project
```

### Finance

```
GET    /api/finance              - Get all expenses (paginated)
GET    /api/finance/stats        - Get expense statistics
GET    /api/finance/pending      - Get pending approvals
GET    /api/finance/:id          - Get expense by ID
POST   /api/finance              - Create new expense
PUT    /api/finance/:id          - Update expense
PUT    /api/finance/:id/approve  - Approve/reject expense
PUT    /api/finance/:id/paid     - Mark as paid
DELETE /api/finance/:id          - Delete expense
```

### HR

```
GET    /api/hr                   - Get all staff (paginated)
GET    /api/hr/stats             - Get staff statistics
GET    /api/hr/:id               - Get staff by ID
POST   /api/hr                   - Create new staff
PUT    /api/hr/:id               - Update staff
DELETE /api/hr/:id               - Delete staff
```

### CBO Partners

```
GET    /api/cbo                  - Get all CBO partners
GET    /api/cbo/stats            - Get CBO statistics
GET    /api/cbo/:id              - Get CBO by ID
POST   /api/cbo                  - Create new CBO
PUT    /api/cbo/:id              - Update CBO
DELETE /api/cbo/:id              - Delete CBO
```

### International Partners

```
GET    /api/partners             - Get all partners
GET    /api/partners/stats       - Get partner statistics
GET    /api/partners/:id         - Get partner by ID
POST   /api/partners             - Create new partner
PUT    /api/partners/:id         - Update partner
DELETE /api/partners/:id         - Delete partner
```

### MEAL (Indicators)

```
GET    /api/meal                 - Get all indicators
GET    /api/meal/stats           - Get indicator statistics
GET    /api/meal/:id             - Get indicator by ID
POST   /api/meal                 - Create new indicator
PUT    /api/meal/:id             - Update indicator
PUT    /api/meal/:id/progress    - Update indicator progress
DELETE /api/meal/:id             - Delete indicator
```

### File Upload

```
POST   /api/upload/orphan        - Upload orphan document
POST   /api/upload/orphan/multiple - Upload multiple orphan documents
POST   /api/upload/project       - Upload project document
POST   /api/upload/project/multiple - Upload multiple project documents
POST   /api/upload/finance       - Upload finance document
POST   /api/upload/hr            - Upload HR document
POST   /api/upload/cbo           - Upload CBO document
POST   /api/upload/profile       - Upload profile image
DELETE /api/upload                - Delete uploaded file
```

### Health Check

```
GET    /health                   - Server health check
```

## Authentication

All API endpoints (except `/api/auth/register`, `/api/auth/login`, and `/health`) require authentication.

### Using JWT Tokens

1. Login to get access token:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

2. Use the returned `accessToken` in subsequent requests:

```bash
curl http://localhost:3000/api/orphans \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

3. When access token expires, use refresh token:

```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

## Role-Based Access Control (RBAC)

### Roles

1. **Admin** - Full system access
2. **CEO** - Executive access, approvals
3. **Programme Manager** - Programme operations
4. **Finance Manager** - Financial operations and approvals
5. **Finance Officer** - Financial data entry
6. **Fundraising Manager** - Partner and fundraising management
7. **HR Manager** - HR operations and approvals
8. **Project Officer** - Project and orphan management
9. **Field Officer** - Field operations
10. **MEAL Officer** - Monitoring and evaluation
11. **Accountant** - Financial data entry
12. **Guest** - Read-only access

### Permission Examples

- **Orphans:**
  - View: All roles
  - Create: Programme Manager, Project Officer, Field Officer
  - Edit: Programme Manager, Project Officer, Field Officer
  - Delete: Admin, Programme Manager
  - Approve: Admin, CEO, Programme Manager

- **Finance:**
  - View: All except Guest
  - Create: Finance Manager, Finance Officer, Accountant
  - Approve: Finance Manager, CEO
  - CEO Approve (high value): CEO only

## Pagination

All list endpoints support pagination:

```
GET /api/orphans?page=1&limit=10
```

Query parameters:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)

Response includes pagination metadata:

```json
{
  "success": true,
  "data": {
    "orphans": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalRecords": 45,
      "limit": 10
    }
  }
}
```

## Filtering

Most endpoints support filtering:

```
# Filter orphans by district and status
GET /api/orphans?district=Ampara&status=Active

# Search projects
GET /api/projects?search=education

# Filter expenses by date range
GET /api/finance?startDate=2025-01-01&endDate=2025-12-31
```

## File Upload

Upload files using `multipart/form-data`:

```bash
curl -X POST http://localhost:3000/api/upload/orphan \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@document.pdf"
```

Supported file types:
- Images: JPEG, PNG, GIF, WebP
- Documents: PDF, Word, Excel, PowerPoint
- Text: TXT, CSV

Maximum file size: 5MB (configurable in `.env`)

## Error Handling

All errors return consistent format:

```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate entry)
- `500` - Internal Server Error

## Database Schema

### Main Tables

- **users** - System users and authentication
- **orphans** - Orphan beneficiary records
- **projects** - Project information
- **expenses** - Financial expenses
- **staff** - HR staff records
- **cbo_partners** - Community-based organization partners
- **partners** - International partners and donors
- **indicators** - MEAL indicators

### Relationships

- User → Orphan (coordinator)
- User → Project (manager)
- User → Expense (approver)
- User → Staff (profile)
- Project → Expense (one-to-many)
- Project → Indicator (one-to-many)

## Development

### Project Structure

```
server/
├── src/
│   ├── config/              # Database configuration
│   ├── controllers/         # Request handlers
│   ├── middleware/          # Auth, validation, error handling
│   ├── models/              # Database models
│   ├── routes/              # API routes
│   ├── database/            # Seeders and migrations
│   └── server.js            # Application entry point
├── uploads/                 # Uploaded files
├── logs/                    # Application logs
├── .env                     # Environment variables
├── package.json             # Dependencies
└── README.md                # This file
```

### Adding New Endpoints

1. Create model in `src/models/`
2. Create controller in `src/controllers/`
3. Create routes in `src/routes/`
4. Import routes in `src/server.js`
5. Add permissions to `src/middleware/auth.middleware.js`

### Running Tests

```bash
# Test database connection
npm run dev

# Check server health
curl http://localhost:3000/health
```

## Security Best Practices

1. **Change Default Secrets** - Update JWT secrets in production
2. **Use Strong Passwords** - Enforce strong password policy
3. **HTTPS Only** - Use HTTPS in production
4. **Environment Variables** - Never commit `.env` file
5. **Rate Limiting** - Configured to 100 requests per 15 minutes
6. **Input Validation** - All inputs are validated and sanitized
7. **SQL Injection** - Protected by Sequelize ORM
8. **XSS Protection** - Inputs sanitized, Helmet.js enabled

## Production Deployment

### Environment Variables

Update `.env` for production:

```env
NODE_ENV=production
DB_PASSWORD=strong_production_password
JWT_SECRET=complex_random_string_min_32_chars
JWT_REFRESH_SECRET=another_complex_random_string
CORS_ORIGIN=https://your-domain.com
```

### Database

1. Create production database
2. Run migrations: `npm run seed`
3. Backup regularly

### Server

1. Use process manager (PM2):

```bash
npm install -g pm2
pm2 start src/server.js --name gersl-api
pm2 save
pm2 startup
```

2. Set up reverse proxy (Nginx/Apache)
3. Enable HTTPS (Let's Encrypt)
4. Configure firewall
5. Set up monitoring and logging

## Troubleshooting

### Database Connection Failed

- Check PostgreSQL is running
- Verify database credentials in `.env`
- Ensure database exists: `CREATE DATABASE gersl_db;`

### Authentication Errors

- Verify JWT secrets are set in `.env`
- Check token hasn't expired
- Ensure user status is 'Active'

### File Upload Errors

- Check uploads directory exists and is writable
- Verify file size is under limit (5MB default)
- Ensure file type is allowed

### Permission Denied

- Check user role has required permission
- Verify token is valid and not expired
- Ensure user status is 'Active'

## Support

For issues or questions:
- Check existing documentation
- Review error logs in `logs/` directory
- Contact development team

## License

MIT License - See LICENSE file for details

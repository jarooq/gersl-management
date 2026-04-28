# Global Ehsan Relief - Sri Lanka Management System

A comprehensive NGO management ERP system for Global Ehsan Relief - Sri Lanka.

## Tech Stack

- **Frontend**: React 19 + Vite + Tailwind CSS
- **Backend**: Express.js + Node.js
- **Database**: PostgreSQL (Supabase Cloud)
- **Authentication**: JWT

## Prerequisites

- Node.js 18+ and npm
- Git

## Local Development Setup

### 1. Clone the repository

```bash
git clone <repository-url>
cd gersl-management
```

### 2. Install dependencies

**Frontend:**
```bash
npm install
```

**Backend:**
```bash
cd server
npm install
cd ..
```

### 3. Environment Configuration

The environment files are already configured for local development:

- **Frontend**: `.env` (points to `http://localhost:3001/api`)
- **Backend**: `server/.env` (configured for Supabase database)

**Note**: Database credentials are already set up. The app uses Supabase PostgreSQL - no local database setup needed.

### 4. Start Development Servers

**Option A: Run both servers separately**

Terminal 1 - Backend:
```bash
cd server
npm run dev
```

Terminal 2 - Frontend:
```bash
npm run dev
```

**Option B: Run both servers in background**

```bash
# Start backend
cd server && npm run dev &

# Start frontend
npm run dev
```

### 5. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001/api

## Default Login Credentials

Check with your system administrator for default credentials.

## Project Structure

```
gersl-management/
├── src/                    # Frontend source
│   ├── components/         # React components
│   ├── pages/             # Page components (20+ modules)
│   ├── contexts/          # Context providers
│   ├── services/          # API services
│   └── utils/             # Utilities
├── server/                # Backend source
│   ├── src/
│   │   ├── controllers/   # Business logic
│   │   ├── models/        # Database models
│   │   ├── routes/        # API routes
│   │   └── middleware/    # Middleware
│   └── migrations/        # Database migrations
└── public/                # Static assets
```

## Key Features

- Orphan Care Management
- Project Management
- Finance & Budgeting
- HR & Payroll
- Proposals & Grants
- MEAL Framework
- Workflow & Approvals
- Task Management
- Notifications
- CBO Management
- Compliance & Safeguarding
- Reports & Analytics

## Development Notes

- The database is hosted on Supabase (cloud PostgreSQL)
- All tables are pre-created - no need to run migrations for initial setup
- The app uses JWT authentication with role-based permissions
- Frontend uses React 19 with Vite for fast HMR
- Backend uses Express.js with Sequelize ORM

## Troubleshooting

**Backend won't start:**
- Check if port 3001 is available: `lsof -i :3001`
- Verify database connection in `server/.env`

**Frontend won't start:**
- Check if port 5173 is available: `lsof -i :5173`
- Clear Vite cache: `rm -rf node_modules/.vite`

**Database connection issues:**
- Verify Supabase credentials in `server/.env`
- Check internet connection (database is cloud-hosted)

## Available Scripts

**Frontend:**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

**Backend:**
- `npm run dev` - Start with nodemon (auto-reload)
- `npm start` - Start production server

## Support

For issues or questions, contact the development team.

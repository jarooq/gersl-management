// Vercel Serverless Function Handler for Express Backend
import serverless from 'serverless-http';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';

// Import routes
import authRoutes from '../server/src/routes/auth.routes.js';
import usersRoutes from '../server/src/routes/users.routes.js';
import orphanRoutes from '../server/src/routes/orphan.routes.js';
import partnersRoutes from '../server/src/routes/partners.routes.js';
import projectRoutes from '../server/src/routes/project.routes.js';
import proposalRoutes from '../server/src/routes/proposal.routes.js';
import reportRoutes from '../server/src/routes/report.routes.js';
import beneficiaryRoutes from '../server/src/routes/beneficiary.routes.js';
import visitLogRoutes from '../server/src/routes/visitLog.routes.js';
import beneficiarySupportRoutes from '../server/src/routes/beneficiarySupport.routes.js';
import aiRoutes from '../server/src/routes/ai.routes.js';

const app = express();

// CORS Configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || process.env.VERCEL_URL || '*',
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Rate limiting
const limiter = rateLimit({
  windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW) || 15) * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/', limiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    platform: 'Vercel Serverless'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/orphans', orphanRoutes);
app.use('/api/partners', partnersRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/beneficiaries', beneficiaryRoutes);
app.use('/api/visit-logs', visitLogRoutes);
app.use('/api/beneficiary-support', beneficiarySupportRoutes);
app.use('/api/ai', aiRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Export as serverless function
export default serverless(app);

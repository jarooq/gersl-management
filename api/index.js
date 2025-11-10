import express from 'express';
import serverless from 'serverless-http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../server/.env') });

// Import database (will connect on first request)
import '../server/src/config/database.js';

// Import routes
import authRoutes from '../server/src/routes/auth.routes.js';
import orphanRoutes from '../server/src/routes/orphan.routes.js';
import projectRoutes from '../server/src/routes/project.routes.js';
import financeRoutes from '../server/src/routes/finance.routes.js';
import hrRoutes from '../server/src/routes/hr.routes.js';
import cboRoutes from '../server/src/routes/cbo.routes.js';
import partnerRoutes from '../server/src/routes/partner.routes.js';
import mealRoutes from '../server/src/routes/meal.routes.js';
import uploadRoutes from '../server/src/routes/upload.routes.js';
import approvalRoutes from '../server/src/routes/approvalRoutes.js';

// Import middleware
import { errorHandler } from '../server/src/middleware/error.middleware.js';
import { notFound } from '../server/src/middleware/notFound.middleware.js';

const app = express();

// ============================================
// MIDDLEWARE
// ============================================

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW) || 15) * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Compression
app.use(compression());

// Logging
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production'
  });
});

// Root endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'GERSL Management API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      orphans: '/api/orphans',
      projects: '/api/projects',
      finance: '/api/finance',
      hr: '/api/hr',
      cbo: '/api/cbo',
      partners: '/api/partners',
      meal: '/api/meal',
      upload: '/api/upload',
      approvals: '/api/approvals'
    }
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/orphans', orphanRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/cbo', cboRoutes);
app.use('/api/partners', partnerRoutes);
app.use('/api/meal', mealRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/approvals', approvalRoutes);

// 404 handler
app.use(notFound);

// Error handler (must be last)
app.use(errorHandler);

// Export as serverless function
export default serverless(app);

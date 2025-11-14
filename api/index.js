// Vercel Serverless Function Handler for Express Backend
import serverless from 'serverless-http';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';

// Initialize Express app
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
    platform: 'Vercel Serverless',
    database: {
      host: process.env.DB_HOST || 'Not configured',
      dialect: process.env.DB_DIALECT || 'Not configured'
    }
  });
});

// Import and use routes
let routesLoaded = false;
let authRoutes, usersRoutes, orphanRoutes, partnersRoutes, projectRoutes;
let proposalRoutes, reportRoutes, beneficiaryRoutes, visitLogRoutes;
let beneficiarySupportRoutes, aiRoutes;

async function loadRoutes() {
  if (routesLoaded) return;

  try {
    const [auth, users, orphan, partners, project, proposal, report, beneficiary, visitLog, beneficiarySupport, ai] = await Promise.all([
      import('../server/src/routes/auth.routes.js'),
      import('../server/src/routes/users.routes.js'),
      import('../server/src/routes/orphan.routes.js'),
      import('../server/src/routes/partners.routes.js'),
      import('../server/src/routes/project.routes.js'),
      import('../server/src/routes/proposal.routes.js'),
      import('../server/src/routes/report.routes.js'),
      import('../server/src/routes/beneficiary.routes.js'),
      import('../server/src/routes/visitLog.routes.js'),
      import('../server/src/routes/beneficiarySupport.routes.js'),
      import('../server/src/routes/ai.routes.js')
    ]);

    authRoutes = auth.default;
    usersRoutes = users.default;
    orphanRoutes = orphan.default;
    partnersRoutes = partners.default;
    projectRoutes = project.default;
    proposalRoutes = proposal.default;
    reportRoutes = report.default;
    beneficiaryRoutes = beneficiary.default;
    visitLogRoutes = visitLog.default;
    beneficiarySupportRoutes = beneficiarySupport.default;
    aiRoutes = ai.default;

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

    routesLoaded = true;
  } catch (error) {
    console.error('Error loading routes:', error);
    throw error;
  }
}

// Middleware to ensure routes are loaded
app.use(async (req, res, next) => {
  if (!routesLoaded && !req.path.includes('/health')) {
    try {
      await loadRoutes();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to initialize routes',
        error: error.message
      });
    }
  }
  next();
});

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

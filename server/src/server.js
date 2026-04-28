import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// Import database
import sequelize, { testConnection, syncDatabase } from './config/database.js';

// Import routes
import authRoutes from './routes/auth.routes.js';
import usersRoutes from './routes/users.routes.js';
import orphanRoutes from './routes/orphan.routes.js';
// import orphanNeedRoutes from './routes/orphanNeed.routes.js'; // Temporarily disabled
import projectRoutes from './routes/project.routes.js';
import projectTeamRoutes from './routes/projectTeam.routes.js';
import proposalRoutes from './routes/proposal.routes.js';
import financeRoutes from './routes/finance.routes.js';
import hrRoutes from './routes/hr.routes.js';
import cboRoutes from './routes/cbo.routes.js';
import partnerRoutes from './routes/partner.routes.js';
import mealRoutes from './routes/meal.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import approvalRoutes from './routes/approval.routes.js';
import taskRoutes from './routes/task.routes.js';
import taskBeneficiaryRoutes from './routes/taskBeneficiary.routes.js';
import aggregateDistributionRoutes from './routes/aggregateDistribution.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import reportRoutes from './routes/report.routes.js';
import visitLogRoutes from './routes/visitLog.routes.js';
import beneficiaryRoutes from './routes/beneficiaries.routes.js';
import beneficiarySupportRoutes from './routes/beneficiarySupport.routes.js';
import aiRoutes from './routes/ai.routes.js';
import coordinatorRoutes from './routes/coordinator.routes.js';

// New feature routes
import campaignRoutes from './routes/campaign.routes.js';
import campaignPackageRoutes from './routes/campaignPackage.routes.js';
import donationRoutes from './routes/donation.routes.js';
import invoiceRoutes from './routes/invoice.routes.js';
import billRoutes from './routes/bill.routes.js';
import purchaseOrderRoutes from './routes/purchaseOrder.routes.js';
import chartOfAccountsRoutes from './routes/chartOfAccounts.routes.js';
import journalEntryRoutes from './routes/journalEntry.routes.js';
import bankAccountRoutes from './routes/bankAccount.routes.js';
import bankTransactionRoutes from './routes/bankTransaction.routes.js';
import budgetRoutes from './routes/budget.routes.js';
import payrollRoutes from './routes/payroll.routes.js';
import grantReceivableRoutes from './routes/grantReceivable.routes.js';
import grantReceiptRoutes from './routes/grantReceipt.routes.js';
import fixedAssetRoutes from './routes/fixedAsset.routes.js';
import jobPostingRoutes from './routes/jobPosting.routes.js';
import vendorCallRoutes from './routes/vendorCall.routes.js';
import socialMediaRoutes from './routes/socialMedia.routes.js';
import complianceRoutes from './routes/compliance.routes.js';
import attendanceRoutes from './routes/attendance.routes.js';
import hrOnboardingRoutes from './routes/hr-onboarding.routes.js';
import hrAppraisalRoutes from './routes/hr-appraisal.routes.js';
import cboVolunteerRoutes from './routes/cbo-volunteer.routes.js';
import cboActivityRoutes from './routes/cbo-activity.routes.js';
import cboDueDiligenceRoutes from './routes/cbo-due-diligence.routes.js';
import cboProposalRoutes from './routes/cbo-proposal.routes.js';
import cboProjectRoutes from './routes/cbo-project.routes.js';
import safeguardingPolicyRoutes from './routes/safeguarding-policy.routes.js';
import safeguardingIncidentRoutes from './routes/safeguarding-incident.routes.js';
import backgroundCheckRoutes from './routes/background-check.routes.js';
import complianceTrainingRoutes from './routes/compliance-training.routes.js';
import dataProtectionRoutes from './routes/data-protection.routes.js';
import evaluationRoutes from './routes/evaluation.routes.js';
import learningEventRoutes from './routes/learning-event.routes.js';
import complaintRoutes from './routes/complaint.routes.js';

// New missing Finance routes
import budgetCategoryRoutes from './routes/budgetCategory.routes.js';
import donorRoutes from './routes/donor.routes.js';
import payableRoutes from './routes/payable.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import financialReportRoutes from './routes/financialReport.routes.js';

// Procurement module routes
import procurementRoutes from './routes/procurement.routes.js';

// Roles & Permissions routes
import roleRoutes from './routes/role.routes.js';

// HR Contract Management routes
import contractRoutes from './routes/contract.routes.js';

// Staff Documents routes
import staffDocumentRoutes from './routes/staffDocument.routes.js';

// Department routes
import departmentRoutes from './routes/department.routes.js';

// Position routes
import positionRoutes from './routes/position.routes.js';

// Import error handler
import { errorHandler } from './middleware/error.middleware.js';
import { notFound } from './middleware/notFound.middleware.js';
import { requestContextMiddleware } from './middleware/requestContext.js';
import auditLogRoutes from './routes/auditLog.routes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================
// MIDDLEWARE
// ============================================

// Trust proxy - Required for rate limiting behind Nginx/reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
  crossOriginEmbedderPolicy: false
}));

// CORS configuration - origin list comes from env (CORS_ALLOWED_ORIGINS, comma-separated).
// Dev defaults are kept so local Vite/CRA still work without env config.
const devDefaultOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:3000'
];
const envOrigins = (process.env.CORS_ALLOWED_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);
const allowedOrigins = [
  ...(process.env.NODE_ENV === 'production' ? [] : devDefaultOrigins),
  ...envOrigins,
  process.env.CORS_ORIGIN,
  process.env.FRONTEND_URL
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, curl, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`⚠️  CORS: Blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
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

// Request context — makes req.user / req.ip available to Sequelize hooks
// via AsyncLocalStorage so audit logs capture the actor without plumbing.
app.use(requestContextMiddleware);

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Static files (for uploads) — CORS headers only for whitelisted origins.
// Reflecting req.headers.origin would let any site read authenticated uploads.
app.use('/uploads', (req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Vary', 'Origin');
  }
  next();
}, express.static('uploads'));

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/orphans', orphanRoutes);
// app.use('/api/orphan-needs', orphanNeedRoutes); // Temporarily disabled
app.use('/api/projects', projectRoutes);
app.use('/api', projectTeamRoutes); // Project team management routes
app.use('/api/proposals', proposalRoutes);
app.use('/api/finance', financeRoutes);
// HR specific routes must come BEFORE general /api/hr route
app.use('/api/hr/onboarding', hrOnboardingRoutes);
app.use('/api/hr/appraisal', hrAppraisalRoutes);
app.use('/api/hr/contracts', contractRoutes);
app.use('/api/hr/documents', staffDocumentRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/settings/departments', departmentRoutes);
app.use('/api/settings/positions', positionRoutes);
// CBO specific routes must come BEFORE general /api/cbo route
app.use('/api/cbo/volunteers', cboVolunteerRoutes);
app.use('/api/cbo/activities', cboActivityRoutes);
app.use('/api/cbo/due-diligence', cboDueDiligenceRoutes);
app.use('/api/cbo/proposals', cboProposalRoutes);
app.use('/api/cbo/projects', cboProjectRoutes);
app.use('/api/cbo', cboRoutes);
app.use('/api/partners', partnerRoutes);
// MEAL specific routes must come BEFORE general /api/meal route
app.use('/api/meal/evaluations', evaluationRoutes);
app.use('/api/meal/learning-events', learningEventRoutes);
app.use('/api/meal/complaints', complaintRoutes);
app.use('/api/meal', mealRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/visit-logs', visitLogRoutes);
app.use('/api/beneficiaries', beneficiaryRoutes);
app.use('/api/beneficiary-support', beneficiarySupportRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/coordinators', coordinatorRoutes);

// New feature routes
// Campaign routes first (handles GET /campaigns, GET /campaigns/:id, POST /campaigns, etc.)
app.use('/api/campaigns', campaignRoutes);
// Package routes second (handles /campaigns/:campaignId/packages/*)
app.use('/api/campaigns', campaignPackageRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/chart-of-accounts', chartOfAccountsRoutes);
app.use('/api/journal-entries', journalEntryRoutes);
app.use('/api/bank-accounts', bankAccountRoutes);
app.use('/api/bank-transactions', bankTransactionRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/grant-receivables', grantReceivableRoutes);
app.use('/api/grant-receipts', grantReceiptRoutes);
app.use('/api/fixed-assets', fixedAssetRoutes);
app.use('/api/job-postings', jobPostingRoutes);
app.use('/api/vendor-calls', vendorCallRoutes);
app.use('/api/social-media', socialMediaRoutes);
// Compliance specific routes must come BEFORE general /api/compliance route
app.use('/api/compliance/policies', safeguardingPolicyRoutes);
app.use('/api/compliance/incidents', safeguardingIncidentRoutes);
app.use('/api/compliance/background-checks', backgroundCheckRoutes);
app.use('/api/compliance/training', complianceTrainingRoutes);
app.use('/api/compliance/data-protection', dataProtectionRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/attendance', attendanceRoutes);

// New Finance module routes
app.use('/api/budget-categories', budgetCategoryRoutes);
app.use('/api/donors', donorRoutes);
app.use('/api/payables', payableRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/financial-reports', financialReportRoutes);

// Procurement module routes
app.use('/api/procurement', procurementRoutes);

// Roles & Permissions routes
app.use('/api/roles', roleRoutes);

// Audit log access (Admin / CEO / BOD only)
app.use('/api/audit-logs', auditLogRoutes);

// Task-specific routes (mounted at /api to catch specific patterns)
// MUST BE LAST among API routes to not interfere with other routes
app.use('/api', taskBeneficiaryRoutes);
app.use('/api', aggregateDistributionRoutes);

// 404 handler
app.use(notFound);

// Error handler (must be last)
app.use(errorHandler);

// ============================================
// DATABASE & SERVER STARTUP
// ============================================

const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();

    if (!dbConnected) {
      console.error('❌ Failed to connect to database. Please check your configuration.');
      process.exit(1);
    }

    // Sync database in development
    // Temporarily disabled to skip sync issues - tables already exist in DB
    if (process.env.NODE_ENV === 'development' && process.env.ENABLE_DB_SYNC === 'true') {
      await syncDatabase({ alter: true });
    }

    // Start server
    app.listen(PORT, () => {
      console.log('');
      console.log('🚀 ====================================');
      console.log(`   Global Ehsan Relief - Sri Lanka API`);
      console.log('   ====================================');
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   Server: http://localhost:${PORT}`);
      console.log(`   Health: http://localhost:${PORT}/health`);
      console.log(`   API Docs: http://localhost:${PORT}/api/docs`);
      console.log('   ====================================');
      console.log('');
    });

  } catch (error) {
    console.error('❌ Server startup error:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Closing server gracefully...');
  await sequelize.close();
  process.exit(0);
});

// Only start the server if not in serverless environment
if (process.env.VERCEL !== '1') {
  startServer();
}

export default app;

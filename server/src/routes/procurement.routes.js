import express from 'express';
import {
  // Requisitions
  getAllRequisitions,
  getRequisitionById,
  createRequisition,
  updateRequisition,
  deleteRequisition,
  approveRequisition,
  getUnassignedRequisitions,
  getMyQueue,
  assignRequisition,
  setProcurementMethod,
  unassignRequisition,
  listProcurementOfficers,
  // Purchase Orders
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  // Vendors
  getAllVendors,
  getVendorById,
  createVendor,
  updateVendor,
  deleteVendor,
  // Inventory
  getAllInventory,
  getInventoryById,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  adjustInventory,
  // Assets
  getAllAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
  assignAsset
} from '../controllers/procurement.controller.js';
import {
  listRFQs,
  getRFQ,
  createRFQ,
  inviteVendors,
  sendRFQ,
  closeRFQ,
  cancelRFQ
} from '../controllers/rfq.controller.js';
import {
  listQuotationsForRFQ,
  getQuotation,
  createQuotation,
  updateQuotation,
  deleteQuotation
} from '../controllers/quotation.controller.js';
import {
  listBidAnalyses,
  getBidAnalysis,
  createBidAnalysis,
  updateBidAnalysis,
  submitBidAnalysis,
  approveBidAnalysis,
  rejectBidAnalysis
} from '../controllers/bidAnalysis.controller.js';
import {
  listPOs,
  getPO,
  draftPOFromBidAnalysis,
  updatePO,
  submitPO,
  approvePO,
  rejectPO,
  issuePO,
  acknowledgePO,
  cancelPO,
  previewPOHtml
} from '../controllers/po.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { validateId } from '../middleware/validate.middleware.js';

const router = express.Router();

// All routes require authentication.
router.use(requireAuth);

// Role gates — keep "view" open to most authenticated users; restrict writes
// to procurement staff + admins; keep destructive actions and vendor blacklist
// to Procurement Manager / Admin / CEO.
const requireProcurementWrite = requireRole(
  'Admin', 'CEO', 'Procurement Manager', 'Procurement Officer', 'Finance Manager'
);
const requireProcurementManager = requireRole(
  'Admin', 'CEO', 'Procurement Manager'
);

// ============================================
// REQUISITIONS ROUTES
// ============================================
// Inbox endpoints — must come before /:id so :id doesn't swallow them
router.get('/requisitions/unassigned', requireProcurementManager, getUnassignedRequisitions);
router.get('/requisitions/my-queue', getMyQueue);

// Lookup: officers eligible for assignment (any procurement-write role can read)
router.get('/officers', requireProcurementWrite, listProcurementOfficers);

router.get('/requisitions', getAllRequisitions);
router.post('/requisitions', requireProcurementWrite, createRequisition);
router.get('/requisitions/:id', validateId(), getRequisitionById);
router.put('/requisitions/:id', validateId(), requireProcurementWrite, updateRequisition);
router.patch('/requisitions/:id/assign', validateId(), requireProcurementManager, assignRequisition);
router.patch('/requisitions/:id/unassign', validateId(), requireProcurementWrite, unassignRequisition);
router.patch('/requisitions/:id/method', validateId(), requireProcurementWrite, setProcurementMethod);
router.put('/requisitions/:id/approve', validateId(), requireProcurementManager, approveRequisition);
router.delete('/requisitions/:id', validateId(), requireProcurementManager, deleteRequisition);

// ============================================
// RFQ ROUTES
// ============================================
router.get('/rfqs', listRFQs);
router.post('/rfqs', requireProcurementWrite, createRFQ);
router.get('/rfqs/:id', validateId(), getRFQ);
router.post('/rfqs/:id/invite', validateId(), requireProcurementWrite, inviteVendors);
router.post('/rfqs/:id/send', validateId(), requireProcurementWrite, sendRFQ);
router.patch('/rfqs/:id/close', validateId(), requireProcurementWrite, closeRFQ);
router.patch('/rfqs/:id/cancel', validateId(), requireProcurementManager, cancelRFQ);

// Quotations live under their parent RFQ for create/list, and at top level for update/delete.
router.get('/rfqs/:id/quotations', validateId(), listQuotationsForRFQ);
router.post('/rfqs/:id/quotations', validateId(), requireProcurementWrite, createQuotation);
router.get('/quotations/:id', validateId(), getQuotation);
router.put('/quotations/:id', validateId(), requireProcurementWrite, updateQuotation);
router.delete('/quotations/:id', validateId(), requireProcurementManager, deleteQuotation);

// ============================================
// BID ANALYSIS ROUTES
// ============================================
router.get('/bid-analyses', listBidAnalyses);
router.post('/bid-analyses', requireProcurementWrite, createBidAnalysis);
router.get('/bid-analyses/:id', validateId(), getBidAnalysis);
router.put('/bid-analyses/:id', validateId(), requireProcurementWrite, updateBidAnalysis);
router.patch('/bid-analyses/:id/submit', validateId(), requireProcurementWrite, submitBidAnalysis);
router.patch('/bid-analyses/:id/approve', validateId(), requireProcurementManager, approveBidAnalysis);
router.patch('/bid-analyses/:id/reject',  validateId(), requireProcurementManager, rejectBidAnalysis);

// ============================================
// NEW PROCUREMENT POs (workflow-aware)
// ============================================
router.get('/pos', listPOs);
router.post('/pos', requireProcurementWrite, draftPOFromBidAnalysis);
router.get('/pos/:id', validateId(), getPO);
router.put('/pos/:id', validateId(), requireProcurementWrite, updatePO);
router.patch('/pos/:id/submit',      validateId(), requireProcurementWrite, submitPO);
router.patch('/pos/:id/approve',     validateId(), requireProcurementManager, approvePO);
router.patch('/pos/:id/reject',      validateId(), requireProcurementManager, rejectPO);
router.post ('/pos/:id/issue',       validateId(), requireProcurementManager, issuePO);
router.patch('/pos/:id/acknowledge', validateId(), requireProcurementWrite, acknowledgePO);
router.patch('/pos/:id/cancel',      validateId(), requireProcurementManager, cancelPO);
router.get  ('/pos/:id/preview',     validateId(), previewPOHtml);

// ============================================
// LEGACY PURCHASE ORDERS ROUTES (older free-form POs)
// ============================================
router.get('/orders', getAllOrders);
router.post('/orders', requireProcurementWrite, createOrder);
router.get('/orders/:id', validateId(), getOrderById);
router.put('/orders/:id', validateId(), requireProcurementWrite, updateOrder);
router.delete('/orders/:id', validateId(), requireProcurementManager, deleteOrder);

// ============================================
// VENDORS ROUTES
// ============================================
router.get('/vendors', getAllVendors);
router.post('/vendors', requireProcurementWrite, createVendor);
router.get('/vendors/:id', validateId(), getVendorById);
router.put('/vendors/:id', validateId(), requireProcurementWrite, updateVendor);
router.delete('/vendors/:id', validateId(), requireProcurementManager, deleteVendor);

// ============================================
// INVENTORY ROUTES
// ============================================
router.get('/inventory', getAllInventory);
router.post('/inventory', requireProcurementWrite, createInventoryItem);
router.get('/inventory/:id', validateId(), getInventoryById);
router.put('/inventory/:id', validateId(), requireProcurementWrite, updateInventoryItem);
router.put('/inventory/:id/adjust', validateId(), requireProcurementWrite, adjustInventory);
router.delete('/inventory/:id', validateId(), requireProcurementManager, deleteInventoryItem);

// ============================================
// ASSETS ROUTES
// ============================================
router.get('/assets', getAllAssets);
router.post('/assets', requireProcurementWrite, createAsset);
router.get('/assets/:id', validateId(), getAssetById);
router.put('/assets/:id', validateId(), requireProcurementWrite, updateAsset);
router.put('/assets/:id/assign', validateId(), requireProcurementWrite, assignAsset);
router.delete('/assets/:id', validateId(), requireProcurementManager, deleteAsset);

export default router;

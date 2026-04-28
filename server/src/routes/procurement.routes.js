import express from 'express';
import {
  // Requisitions
  getAllRequisitions,
  getRequisitionById,
  createRequisition,
  updateRequisition,
  deleteRequisition,
  approveRequisition,
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
router.get('/requisitions', getAllRequisitions);
router.post('/requisitions', requireProcurementWrite, createRequisition);
router.get('/requisitions/:id', validateId(), getRequisitionById);
router.put('/requisitions/:id', validateId(), requireProcurementWrite, updateRequisition);
router.put('/requisitions/:id/approve', validateId(), requireProcurementManager, approveRequisition);
router.delete('/requisitions/:id', validateId(), requireProcurementManager, deleteRequisition);

// ============================================
// PURCHASE ORDERS ROUTES
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

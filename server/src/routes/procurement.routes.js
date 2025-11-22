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
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateId } from '../middleware/validate.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// ============================================
// REQUISITIONS ROUTES
// ============================================
router.get('/requisitions', getAllRequisitions);
router.post('/requisitions', createRequisition);
router.get('/requisitions/:id', validateId(), getRequisitionById);
router.put('/requisitions/:id', validateId(), updateRequisition);
router.put('/requisitions/:id/approve', validateId(), approveRequisition);
router.delete('/requisitions/:id', validateId(), deleteRequisition);

// ============================================
// PURCHASE ORDERS ROUTES
// ============================================
router.get('/orders', getAllOrders);
router.post('/orders', createOrder);
router.get('/orders/:id', validateId(), getOrderById);
router.put('/orders/:id', validateId(), updateOrder);
router.delete('/orders/:id', validateId(), deleteOrder);

// ============================================
// VENDORS ROUTES
// ============================================
router.get('/vendors', getAllVendors);
router.post('/vendors', createVendor);
router.get('/vendors/:id', validateId(), getVendorById);
router.put('/vendors/:id', validateId(), updateVendor);
router.delete('/vendors/:id', validateId(), deleteVendor);

// ============================================
// INVENTORY ROUTES
// ============================================
router.get('/inventory', getAllInventory);
router.post('/inventory', createInventoryItem);
router.get('/inventory/:id', validateId(), getInventoryById);
router.put('/inventory/:id', validateId(), updateInventoryItem);
router.put('/inventory/:id/adjust', validateId(), adjustInventory);
router.delete('/inventory/:id', validateId(), deleteInventoryItem);

// ============================================
// ASSETS ROUTES
// ============================================
router.get('/assets', getAllAssets);
router.post('/assets', createAsset);
router.get('/assets/:id', validateId(), getAssetById);
router.put('/assets/:id', validateId(), updateAsset);
router.put('/assets/:id/assign', validateId(), assignAsset);
router.delete('/assets/:id', validateId(), deleteAsset);

export default router;

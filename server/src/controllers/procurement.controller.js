import { PurchaseRequisition, PurchaseOrder, Vendor, InventoryItem, Asset } from '../models/index.js';
import { asyncHandler, ValidationError, NotFoundError } from '../middleware/error.middleware.js';
import { Op } from 'sequelize';

// ============================================
// PURCHASE REQUISITIONS
// ============================================

export const getAllRequisitions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, status } = req.query;
  const offset = (page - 1) * limit;

  const where = {};
  if (status) where.status = status;

  const { rows: requisitions, count: total } = await PurchaseRequisition.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset,
    order: [['created_at', 'DESC']]
  });

  res.json({
    success: true,
    data: {
      requisitions,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    }
  });
});

export const getRequisitionById = asyncHandler(async (req, res) => {
  const requisition = await PurchaseRequisition.findByPk(req.params.id);

  if (!requisition) {
    throw new NotFoundError('Purchase requisition not found');
  }

  res.json({
    success: true,
    data: { requisition }
  });
});

export const createRequisition = asyncHandler(async (req, res) => {
  const { title, description, items, requested_by, department, urgency } = req.body;

  if (!title || !items || !requested_by) {
    throw new ValidationError('Title, items, and requested_by are required');
  }

  const requisition = await PurchaseRequisition.create({
    title,
    description,
    items,
    requested_by,
    department,
    urgency: urgency || 'Normal',
    status: 'Pending',
    created_by: req.user.id
  });

  res.status(201).json({
    success: true,
    data: { requisition }
  });
});

export const updateRequisition = asyncHandler(async (req, res) => {
  const requisition = await PurchaseRequisition.findByPk(req.params.id);

  if (!requisition) {
    throw new NotFoundError('Purchase requisition not found');
  }

  await requisition.update(req.body);

  res.json({
    success: true,
    data: { requisition }
  });
});

export const deleteRequisition = asyncHandler(async (req, res) => {
  const requisition = await PurchaseRequisition.findByPk(req.params.id);

  if (!requisition) {
    throw new NotFoundError('Purchase requisition not found');
  }

  await requisition.destroy();

  res.json({
    success: true,
    message: 'Purchase requisition deleted successfully'
  });
});

export const approveRequisition = asyncHandler(async (req, res) => {
  const requisition = await PurchaseRequisition.findByPk(req.params.id);

  if (!requisition) {
    throw new NotFoundError('Purchase requisition not found');
  }

  await requisition.update({
    status: 'Approved',
    approved_by: req.user.id,
    approved_at: new Date(),
    approval_notes: req.body.notes
  });

  res.json({
    success: true,
    data: { requisition }
  });
});

// ============================================
// PURCHASE ORDERS
// ============================================

export const getAllOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, status, vendor_id } = req.query;
  const offset = (page - 1) * limit;

  const where = {};
  if (status) where.status = status;
  if (vendor_id) where.vendor_id = vendor_id;

  const { rows: orders, count: total } = await PurchaseOrder.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset,
    order: [['order_date', 'DESC']]
  });

  res.json({
    success: true,
    data: {
      orders,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    }
  });
});

export const getOrderById = asyncHandler(async (req, res) => {
  const order = await PurchaseOrder.findByPk(req.params.id);

  if (!order) {
    throw new NotFoundError('Purchase order not found');
  }

  res.json({
    success: true,
    data: { order }
  });
});

export const createOrder = asyncHandler(async (req, res) => {
  const {
    po_number,
    vendor_id,
    order_date,
    expected_delivery_date,
    items,
    total_amount,
    payment_terms
  } = req.body;

  if (!po_number || !vendor_id || !items || !total_amount) {
    throw new ValidationError('PO number, vendor, items, and total amount are required');
  }

  const order = await PurchaseOrder.create({
    po_number,
    vendor_id,
    order_date: order_date || new Date(),
    expected_delivery_date,
    items,
    total_amount,
    payment_terms,
    status: 'Pending',
    created_by: req.user.id
  });

  res.status(201).json({
    success: true,
    data: { order }
  });
});

export const updateOrder = asyncHandler(async (req, res) => {
  const order = await PurchaseOrder.findByPk(req.params.id);

  if (!order) {
    throw new NotFoundError('Purchase order not found');
  }

  await order.update(req.body);

  res.json({
    success: true,
    data: { order }
  });
});

export const deleteOrder = asyncHandler(async (req, res) => {
  const order = await PurchaseOrder.findByPk(req.params.id);

  if (!order) {
    throw new NotFoundError('Purchase order not found');
  }

  await order.destroy();

  res.json({
    success: true,
    message: 'Purchase order deleted successfully'
  });
});

// ============================================
// VENDORS
// ============================================

export const getAllVendors = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, search, status } = req.query;
  const offset = (page - 1) * limit;

  const where = {};
  if (search) {
    where[Op.or] = [
      { vendor_name: { [Op.iLike]: `%${search}%` } },
      { contact_person: { [Op.iLike]: `%${search}%` } }
    ];
  }
  if (status) where.status = status;

  const { rows: vendors, count: total } = await Vendor.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset,
    order: [['vendor_name', 'ASC']]
  });

  res.json({
    success: true,
    data: {
      vendors,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    }
  });
});

export const getVendorById = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findByPk(req.params.id);

  if (!vendor) {
    throw new NotFoundError('Vendor not found');
  }

  res.json({
    success: true,
    data: { vendor }
  });
});

export const createVendor = asyncHandler(async (req, res) => {
  const {
    vendor_name,
    vendor_type,
    contact_person,
    email,
    phone,
    address,
    tax_id,
    payment_terms
  } = req.body;

  if (!vendor_name) {
    throw new ValidationError('Vendor name is required');
  }

  const vendor = await Vendor.create({
    vendor_name,
    vendor_type,
    contact_person,
    email,
    phone,
    address,
    tax_id,
    payment_terms,
    status: 'Active',
    created_by: req.user.id
  });

  res.status(201).json({
    success: true,
    data: { vendor }
  });
});

export const updateVendor = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findByPk(req.params.id);

  if (!vendor) {
    throw new NotFoundError('Vendor not found');
  }

  await vendor.update(req.body);

  res.json({
    success: true,
    data: { vendor }
  });
});

export const deleteVendor = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findByPk(req.params.id);

  if (!vendor) {
    throw new NotFoundError('Vendor not found');
  }

  await vendor.destroy();

  res.json({
    success: true,
    message: 'Vendor deleted successfully'
  });
});

// ============================================
// INVENTORY
// ============================================

export const getAllInventory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, category, low_stock } = req.query;
  const offset = (page - 1) * limit;

  const where = {};
  if (category) where.category = category;
  if (low_stock === 'true') {
    where.quantity = { [Op.lte]: sequelize.col('reorder_level') };
  }

  const { rows: items, count: total } = await InventoryItem.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset,
    order: [['item_name', 'ASC']]
  });

  res.json({
    success: true,
    data: {
      items,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    }
  });
});

export const getInventoryById = asyncHandler(async (req, res) => {
  const item = await InventoryItem.findByPk(req.params.id);

  if (!item) {
    throw new NotFoundError('Inventory item not found');
  }

  res.json({
    success: true,
    data: { item }
  });
});

export const createInventoryItem = asyncHandler(async (req, res) => {
  const {
    item_code,
    item_name,
    category,
    quantity,
    unit,
    unit_cost,
    reorder_level,
    location
  } = req.body;

  if (!item_code || !item_name || !category) {
    throw new ValidationError('Item code, name, and category are required');
  }

  const item = await InventoryItem.create({
    item_code,
    item_name,
    category,
    quantity: quantity || 0,
    unit,
    unit_cost,
    reorder_level,
    location,
    created_by: req.user.id
  });

  res.status(201).json({
    success: true,
    data: { item }
  });
});

export const updateInventoryItem = asyncHandler(async (req, res) => {
  const item = await InventoryItem.findByPk(req.params.id);

  if (!item) {
    throw new NotFoundError('Inventory item not found');
  }

  await item.update(req.body);

  res.json({
    success: true,
    data: { item }
  });
});

export const deleteInventoryItem = asyncHandler(async (req, res) => {
  const item = await InventoryItem.findByPk(req.params.id);

  if (!item) {
    throw new NotFoundError('Inventory item not found');
  }

  await item.destroy();

  res.json({
    success: true,
    message: 'Inventory item deleted successfully'
  });
});

export const adjustInventory = asyncHandler(async (req, res) => {
  const item = await InventoryItem.findByPk(req.params.id);

  if (!item) {
    throw new NotFoundError('Inventory item not found');
  }

  const { adjustment_type, quantity, reason } = req.body;

  if (!adjustment_type || !quantity) {
    throw new ValidationError('Adjustment type and quantity are required');
  }

  let newQuantity = item.quantity;
  if (adjustment_type === 'add') {
    newQuantity += parseInt(quantity);
  } else if (adjustment_type === 'subtract') {
    newQuantity -= parseInt(quantity);
  }

  await item.update({
    quantity: newQuantity,
    last_adjustment_date: new Date(),
    last_adjustment_reason: reason
  });

  res.json({
    success: true,
    data: { item }
  });
});

// ============================================
// ASSETS
// ============================================

export const getAllAssets = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, category, status } = req.query;
  const offset = (page - 1) * limit;

  const where = {};
  if (category) where.category = category;
  if (status) where.status = status;

  const { rows: assets, count: total } = await Asset.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset,
    order: [['purchase_date', 'DESC']]
  });

  res.json({
    success: true,
    data: {
      assets,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    }
  });
});

export const getAssetById = asyncHandler(async (req, res) => {
  const asset = await Asset.findByPk(req.params.id);

  if (!asset) {
    throw new NotFoundError('Asset not found');
  }

  res.json({
    success: true,
    data: { asset }
  });
});

export const createAsset = asyncHandler(async (req, res) => {
  const {
    asset_tag,
    asset_name,
    category,
    purchase_date,
    purchase_cost,
    vendor_id,
    assigned_to,
    location,
    warranty_expiry
  } = req.body;

  if (!asset_tag || !asset_name || !category) {
    throw new ValidationError('Asset tag, name, and category are required');
  }

  const asset = await Asset.create({
    asset_tag,
    asset_name,
    category,
    purchase_date,
    purchase_cost,
    vendor_id,
    assigned_to,
    location,
    warranty_expiry,
    status: 'Active',
    created_by: req.user.id
  });

  res.status(201).json({
    success: true,
    data: { asset }
  });
});

export const updateAsset = asyncHandler(async (req, res) => {
  const asset = await Asset.findByPk(req.params.id);

  if (!asset) {
    throw new NotFoundError('Asset not found');
  }

  await asset.update(req.body);

  res.json({
    success: true,
    data: { asset }
  });
});

export const deleteAsset = asyncHandler(async (req, res) => {
  const asset = await Asset.findByPk(req.params.id);

  if (!asset) {
    throw new NotFoundError('Asset not found');
  }

  await asset.destroy();

  res.json({
    success: true,
    message: 'Asset deleted successfully'
  });
});

export const assignAsset = asyncHandler(async (req, res) => {
  const asset = await Asset.findByPk(req.params.id);

  if (!asset) {
    throw new NotFoundError('Asset not found');
  }

  const { assigned_to, assignment_date, assignment_notes } = req.body;

  await asset.update({
    assigned_to,
    assignment_date: assignment_date || new Date(),
    assignment_notes,
    status: 'Assigned'
  });

  res.json({
    success: true,
    data: { asset }
  });
});

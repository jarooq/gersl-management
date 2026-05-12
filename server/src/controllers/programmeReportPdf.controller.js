// =============================================================================
// Programme Report PDFs — per-item delivery reports and per-donor batch
// bundles for WASH and IGP modules.
//
// Endpoints (wired in routes/wash.routes.js and routes/igp.routes.js):
//   GET /api/wash/items/:id/report                     per-item PDF (A4)
//   GET /api/wash/orders/:id/donor-report              bundled PDF for donor
//   GET /api/igp/items/:id/report                      per-item PDF (A4)
//   GET /api/igp/orders/:id/donor-report               bundled PDF for donor
//
// Generators stream directly to res — no temp files, no S3. The order detail
// page links straight to these URLs (?token=... for cookieless contexts so
// PDFs open in a new tab without 401).
// =============================================================================

import PDFDocument from 'pdfkit';
import asyncHandler from 'express-async-handler';
import {
  WashOrder, WashItem, WashStageUpdate,
  IgpOrder, IgpItem, IgpStageUpdate,
  Partner, Beneficiary, Vendor, User, Project,
} from '../models/index.js';
import { NotFoundError } from '../middleware/error.middleware.js';

const PRIMARY  = '#0D1D3D';
const ACCENT   = '#a4f056';
const INK_700  = '#374151';
const INK_500  = '#6b7280';
const INK_300  = '#d1d5db';
const SUCCESS  = '#16a34a';

const fmt = (n, currency = 'LKR') =>
  `${currency} ${Number(n || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;

const today = () => new Date().toLocaleDateString('en-LK', { year: 'numeric', month: 'long', day: 'numeric' });

// ----------------------------------------------------------------------------
// Header used on every page of every PDF — keeps reports visually consistent
// with the cash voucher and other GERSL documents.
// ----------------------------------------------------------------------------
const drawHeader = (doc, title, subtitle) => {
  const y = 20;
  doc.rect(0, 0, doc.page.width, 64).fill(PRIMARY);
  doc.fillColor(ACCENT).fontSize(8).font('Helvetica-Bold')
     .text('GERSL · GLOBAL EHSAN RELIEF SRI LANKA', 24, y, { characterSpacing: 1.5 });
  doc.fillColor('#ffffff').fontSize(14).font('Helvetica-Bold')
     .text(title, 24, y + 14);
  if (subtitle) {
    doc.fillColor('#cbd5e1').fontSize(9).font('Helvetica')
       .text(subtitle, 24, y + 32);
  }
  doc.fillColor('#ffffff').fontSize(8)
     .text(today(), doc.page.width - 120, y + 2, { width: 100, align: 'right' });
  doc.fillColor(INK_700).font('Helvetica');
  doc.y = 88;
};

const drawFooter = (doc, pageLabel) => {
  const y = doc.page.height - 30;
  doc.fontSize(7).fillColor(INK_500)
     .text(`Generated ${today()} · GERSL Programme Report${pageLabel ? ' · ' + pageLabel : ''}`, 24, y, { width: doc.page.width - 48, align: 'center' });
};

// Label/value rows in two columns.
const labelValueRow = (doc, label, value, opts = {}) => {
  const x = opts.x ?? 24;
  const width = opts.width ?? (doc.page.width - 48);
  doc.fillColor(INK_500).fontSize(8).font('Helvetica').text(label.toUpperCase(), x, doc.y, { width, continued: false });
  doc.fillColor(INK_700).fontSize(11).font('Helvetica-Bold').text(value ?? '—', x, doc.y + 1, { width });
  doc.moveDown(0.4);
};

// Section heading
const section = (doc, label) => {
  doc.moveDown(0.6);
  doc.fillColor(PRIMARY).fontSize(11).font('Helvetica-Bold').text(label.toUpperCase(), 24, doc.y, { characterSpacing: 1 });
  doc.moveTo(24, doc.y + 2).lineTo(doc.page.width - 24, doc.y + 2).strokeColor(ACCENT).lineWidth(1).stroke();
  doc.moveDown(0.4);
  doc.fillColor(INK_700).font('Helvetica');
};

// ----------------------------------------------------------------------------
// Per-item report rendering — shared by both modules.
// ----------------------------------------------------------------------------
const renderItemReport = (doc, { kind, item, order, donor, beneficiary, stageUpdates, anonymize }) => {
  const titleKind = kind === 'wash' ? 'WASH Installation' : 'IGP Asset Delivery';
  drawHeader(doc, `${titleKind} Report`, `${item.itemCode} · Order ${order?.orderCode || ''}`);

  // --- Beneficiary block
  section(doc, 'Beneficiary');
  const name = anonymize ? maskName(beneficiary?.fullName || item.beneficiaryName) : (item.beneficiaryName || beneficiary?.fullName || '—');
  const nic  = anonymize ? maskNic(item.beneficiaryNic || beneficiary?.nic) : (item.beneficiaryNic || beneficiary?.nic || '—');
  labelValueRow(doc, 'Name', name);
  labelValueRow(doc, 'NIC',  nic);
  if (!anonymize && (item.beneficiaryPhone || beneficiary?.contactNumber)) {
    labelValueRow(doc, 'Phone', item.beneficiaryPhone || beneficiary?.contactNumber);
  }
  if (item.householdSize) labelValueRow(doc, 'Household size', String(item.householdSize));

  // --- Location
  section(doc, 'Location');
  labelValueRow(doc, 'District',    item.district || '—');
  labelValueRow(doc, 'DS division', item.dsDivision || '—');
  labelValueRow(doc, 'GN division', item.gnDivision || '—');
  if (!anonymize && item.address) labelValueRow(doc, 'Address', item.address);
  const lat = kind === 'wash' ? item.installationLat : item.deliveryLat;
  const lng = kind === 'wash' ? item.installationLng : item.deliveryLng;
  if (lat && lng) labelValueRow(doc, 'GPS', `${Number(lat).toFixed(6)}, ${Number(lng).toFixed(6)}`);

  // --- Asset / Installation
  section(doc, kind === 'wash' ? 'Installation' : 'Asset');
  labelValueRow(doc, kind === 'wash' ? 'Type' : 'Asset type', kind === 'wash' ? item.unitType : item.assetType);
  if (kind === 'igp' && item.assetSpecification) labelValueRow(doc, 'Specification', item.assetSpecification);
  if (item.actualCost  != null) labelValueRow(doc, 'Cost',         fmt(item.actualCost, order?.currency || 'LKR'));
  if (item.plannedCost != null) labelValueRow(doc, 'Planned cost', fmt(item.plannedCost, order?.currency || 'LKR'));
  if (item.donorRef) labelValueRow(doc, 'Donor reference', item.donorRef);

  // IGP income tracking
  if (kind === 'igp' && (item.incomeBaseline != null || item.incomeFollowup != null)) {
    section(doc, 'Income tracking');
    if (item.incomeBaseline != null) labelValueRow(doc, 'Baseline',  fmt(item.incomeBaseline));
    if (item.incomeFollowup != null) labelValueRow(doc, 'Follow-up', fmt(item.incomeFollowup));
    if (item.incomeBaseline != null && item.incomeFollowup != null) {
      const uplift = Number(item.incomeFollowup) - Number(item.incomeBaseline);
      doc.fillColor(uplift >= 0 ? SUCCESS : '#dc2626').fontSize(11).font('Helvetica-Bold')
         .text(`Uplift: ${uplift >= 0 ? '+' : ''}${fmt(Math.abs(uplift))}`, 24, doc.y);
      doc.moveDown(0.6);
    }
  }

  // --- Stage timeline
  section(doc, 'Progress timeline');
  if (!stageUpdates || stageUpdates.length === 0) {
    doc.fontSize(9).fillColor(INK_500).text('No stage updates recorded.', 24, doc.y);
    doc.moveDown(0.8);
  } else {
    for (const u of stageUpdates) {
      const when = new Date(u.createdAt).toLocaleDateString('en-LK', { day: '2-digit', month: 'short', year: 'numeric' });
      doc.fillColor(PRIMARY).fontSize(10).font('Helvetica-Bold').text(`${u.stage}`, 24, doc.y, { continued: true });
      doc.fillColor(INK_500).fontSize(9).font('Helvetica').text(`   ${when}${u.updater?.fullName ? ' · ' + u.updater.fullName : ''}`);
      if (u.notes) {
        doc.fillColor(INK_700).fontSize(9).font('Helvetica').text(u.notes, 36, doc.y, { width: doc.page.width - 60 });
      }
      if (Array.isArray(u.photoUrls) && u.photoUrls.length > 0) {
        doc.fillColor(INK_500).fontSize(8).text(`Photos: ${u.photoUrls.length}`, 36, doc.y);
      }
      doc.moveDown(0.5);
    }
  }

  // --- Signatures
  section(doc, 'Sign-off');
  const sigY = doc.y + 8;
  doc.moveTo(24, sigY + 30).lineTo(220, sigY + 30).strokeColor(INK_300).lineWidth(0.5).stroke();
  doc.moveTo(doc.page.width - 220, sigY + 30).lineTo(doc.page.width - 24, sigY + 30).stroke();
  doc.fillColor(INK_500).fontSize(8).font('Helvetica').text('Field officer / Supervisor', 24, sigY + 33);
  doc.text('Beneficiary acknowledgement', doc.page.width - 220, sigY + 33);

  drawFooter(doc);
};

const maskName = (name) => {
  if (!name) return '—';
  const parts = String(name).trim().split(/\s+/);
  return parts.map((p, i) => (i === 0 ? p[0] + '***' : p[0] + '.')).join(' ');
};
const maskNic = (nic) => {
  if (!nic) return '—';
  const s = String(nic);
  if (s.length <= 4) return '****';
  return s.slice(0, 2) + '****' + s.slice(-2);
};

// ----------------------------------------------------------------------------
// Endpoints — per-item
// ----------------------------------------------------------------------------
const loadItemAndContext = async (kind, id) => {
  const ItemModel  = kind === 'wash' ? WashItem  : IgpItem;
  const OrderModel = kind === 'wash' ? WashOrder : IgpOrder;
  const StageModel = kind === 'wash' ? WashStageUpdate : IgpStageUpdate;

  const item = await ItemModel.findByPk(id, {
    include: [
      { model: Vendor, as: 'contractor' },
      { model: User,   as: 'supervisor' },
      { model: Beneficiary, as: 'beneficiary' },
    ],
  });
  if (!item) throw new NotFoundError(`${kind} item not found`);
  const order = await OrderModel.findByPk(item.orderId, {
    include: [{ model: Partner, as: 'donor' }, { model: Project, as: 'project' }],
  });
  const stageUpdates = await StageModel.findAll({
    where: { itemId: item.id },
    include: [{ model: User, as: 'updater', attributes: ['id', 'fullName'] }],
    order: [['createdAt', 'ASC']],
  });
  return { item, order, donor: order?.donor, beneficiary: item.beneficiary, stageUpdates };
};

export const renderWashItemPdf = asyncHandler(async (req, res) => {
  const ctx = await loadItemAndContext('wash', req.params.id);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="WASH-${ctx.item.itemCode}.pdf"`);
  const doc = new PDFDocument({ size: 'A4', margin: 0 });
  doc.pipe(res);
  const anonymize = !!ctx.donor?.anonymizeReports;
  renderItemReport(doc, { kind: 'wash', ...ctx, anonymize });
  doc.end();
});

export const renderIgpItemPdf = asyncHandler(async (req, res) => {
  const ctx = await loadItemAndContext('igp', req.params.id);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="IGP-${ctx.item.itemCode}.pdf"`);
  const doc = new PDFDocument({ size: 'A4', margin: 0 });
  doc.pipe(res);
  const anonymize = !!ctx.donor?.anonymizeReports;
  renderItemReport(doc, { kind: 'igp', ...ctx, anonymize });
  doc.end();
});

// ----------------------------------------------------------------------------
// Donor batch report — cover page summarising the order, then one page per
// item. Used when sending the bundled report at order completion.
// ----------------------------------------------------------------------------
const renderDonorBundle = async (kind, orderId, res) => {
  const OrderModel = kind === 'wash' ? WashOrder : IgpOrder;
  const ItemModel  = kind === 'wash' ? WashItem  : IgpItem;
  const StageModel = kind === 'wash' ? WashStageUpdate : IgpStageUpdate;

  const order = await OrderModel.findByPk(orderId, {
    include: [{ model: Partner, as: 'donor' }, { model: Project, as: 'project' }],
  });
  if (!order) throw new NotFoundError(`${kind} order not found`);
  const items = await ItemModel.findAll({
    where: { orderId: order.id },
    include: [{ model: Beneficiary, as: 'beneficiary' }, { model: Vendor, as: 'contractor' }, { model: User, as: 'supervisor' }],
    order: [['createdAt', 'ASC']],
  });
  const allStages = await StageModel.findAll({
    where: { itemId: items.map(i => i.id) },
    include: [{ model: User, as: 'updater', attributes: ['id', 'fullName'] }],
    order: [['createdAt', 'ASC']],
  });
  const stagesByItem = allStages.reduce((acc, s) => {
    (acc[s.itemId] ||= []).push(s); return acc;
  }, {});

  const anonymize = !!order.donor?.anonymizeReports;
  const titleKind = kind === 'wash' ? 'WASH' : 'IGP';

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${titleKind}-${order.orderCode}-donor-report.pdf"`);
  const doc = new PDFDocument({ size: 'A4', margin: 0 });
  doc.pipe(res);

  // -------- Cover page
  drawHeader(doc, `${titleKind} Donor Report`, `${order.orderCode} · ${order.title}`);

  section(doc, 'Donor');
  labelValueRow(doc, 'Name',     order.donor?.name || '—');
  if (order.donor?.contactPerson) labelValueRow(doc, 'Contact', order.donor.contactPerson);
  if (order.donor?.country)        labelValueRow(doc, 'Country', order.donor.country);

  section(doc, 'Order summary');
  labelValueRow(doc, 'Order code',   order.orderCode);
  labelValueRow(doc, 'Project',      order.project?.name || '—');
  labelValueRow(doc, 'Quantity',     String(order.quantity));
  labelValueRow(doc, 'Total budget', fmt(order.totalBudget, order.currency));
  labelValueRow(doc, 'Deadline',     order.deadline);
  labelValueRow(doc, 'Status',       order.status);

  // Stage rollup
  const byStage = items.reduce((acc, i) => { acc[i.stage] = (acc[i.stage] || 0) + 1; return acc; }, {});
  section(doc, 'Delivery status');
  for (const [stage, count] of Object.entries(byStage)) {
    labelValueRow(doc, stage, `${count} item${count === 1 ? '' : 's'}`);
  }

  if (kind === 'igp' && Array.isArray(order.assetMix) && order.assetMix.length > 0) {
    section(doc, 'Asset mix');
    for (const m of order.assetMix) {
      labelValueRow(doc, m.type, `${m.qty}${m.unit ? ' × ' + fmt(m.unit) : ''}`);
    }
  }

  drawFooter(doc, 'Cover');

  // -------- One page per item
  for (const item of items) {
    doc.addPage();
    renderItemReport(doc, {
      kind, item, order, donor: order.donor,
      beneficiary: item.beneficiary,
      stageUpdates: stagesByItem[item.id] || [],
      anonymize,
    });
  }

  doc.end();
};

export const renderWashDonorBundle = asyncHandler(async (req, res) => {
  await renderDonorBundle('wash', req.params.id, res);
});
export const renderIgpDonorBundle = asyncHandler(async (req, res) => {
  await renderDonorBundle('igp', req.params.id, res);
});

// ----------------------------------------------------------------------------
// Generate the donor bundle into a Buffer (in-memory) so it can be attached
// to the email send. Returns { buffer, order } for the caller.
// ----------------------------------------------------------------------------
const buildDonorBundleBuffer = async (kind, orderId) => {
  const OrderModel = kind === 'wash' ? WashOrder : IgpOrder;
  const ItemModel  = kind === 'wash' ? WashItem  : IgpItem;
  const StageModel = kind === 'wash' ? WashStageUpdate : IgpStageUpdate;

  const order = await OrderModel.findByPk(orderId, {
    include: [{ model: Partner, as: 'donor' }, { model: Project, as: 'project' }],
  });
  if (!order) throw new NotFoundError(`${kind} order not found`);
  const items = await ItemModel.findAll({
    where: { orderId: order.id },
    include: [{ model: Beneficiary, as: 'beneficiary' }, { model: Vendor, as: 'contractor' }, { model: User, as: 'supervisor' }],
    order: [['createdAt', 'ASC']],
  });
  const allStages = await StageModel.findAll({
    where: { itemId: items.map(i => i.id) },
    include: [{ model: User, as: 'updater', attributes: ['id', 'fullName'] }],
    order: [['createdAt', 'ASC']],
  });
  const stagesByItem = allStages.reduce((acc, s) => { (acc[s.itemId] ||= []).push(s); return acc; }, {});
  const anonymize = !!order.donor?.anonymizeReports;
  const titleKind = kind === 'wash' ? 'WASH' : 'IGP';

  return await new Promise((resolve, reject) => {
    const chunks = [];
    const doc = new PDFDocument({ size: 'A4', margin: 0 });
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve({ buffer: Buffer.concat(chunks), order }));
    doc.on('error', reject);

    // Cover
    drawHeader(doc, `${titleKind} Donor Report`, `${order.orderCode} · ${order.title}`);
    section(doc, 'Donor');
    labelValueRow(doc, 'Name',    order.donor?.name || '—');
    if (order.donor?.contactPerson) labelValueRow(doc, 'Contact', order.donor.contactPerson);
    if (order.donor?.country)        labelValueRow(doc, 'Country', order.donor.country);
    section(doc, 'Order summary');
    labelValueRow(doc, 'Order code',   order.orderCode);
    labelValueRow(doc, 'Project',      order.project?.name || '—');
    labelValueRow(doc, 'Quantity',     String(order.quantity));
    labelValueRow(doc, 'Total budget', fmt(order.totalBudget, order.currency));
    labelValueRow(doc, 'Deadline',     order.deadline);
    labelValueRow(doc, 'Status',       order.status);
    const byStage = items.reduce((acc, i) => { acc[i.stage] = (acc[i.stage] || 0) + 1; return acc; }, {});
    section(doc, 'Delivery status');
    for (const [stage, count] of Object.entries(byStage)) {
      labelValueRow(doc, stage, `${count} item${count === 1 ? '' : 's'}`);
    }
    drawFooter(doc, 'Cover');

    // Per-item pages
    for (const item of items) {
      doc.addPage();
      renderItemReport(doc, {
        kind, item, order, donor: order.donor,
        beneficiary: item.beneficiary,
        stageUpdates: stagesByItem[item.id] || [],
        anonymize,
      });
    }
    doc.end();
  });
};

// POST /api/{wash,igp}/orders/:id/email-donor-report
// Generates the bundle and emails it to the donor with the PDF attached.
import { sendProgrammeReport } from '../services/email.service.js';

const emailDonorBundle = async (kind, orderId) => {
  const { buffer, order } = await buildDonorBundleBuffer(kind, orderId);
  const donorEmail = order.donor?.email;
  if (!donorEmail) {
    return { ok: false, reason: 'Donor has no email on record' };
  }
  const sent = await sendProgrammeReport({
    donorEmail,
    donorName: order.donor?.name,
    programme: kind,
    order,
    pdfBuffer: buffer,
  });
  return { ok: sent, reason: sent ? 'sent' : 'email service skipped (SMTP not configured?)' };
};

export const emailWashDonorReport = asyncHandler(async (req, res) => {
  const result = await emailDonorBundle('wash', req.params.id);
  res.json({ success: true, data: result });
});
export const emailIgpDonorReport = asyncHandler(async (req, res) => {
  const result = await emailDonorBundle('igp', req.params.id);
  res.json({ success: true, data: result });
});

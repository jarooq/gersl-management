import { Op } from 'sequelize';
import {
  Invoice, Project, Proposal, Partner, User, InvoiceReceipt, BankAccount,
  GrantReceipt, Payment, sequelize,
} from '../models/index.js';
import { asyncHandler, NotFoundError, ValidationError } from '../middleware/error.middleware.js';
import { getRate, colomboToday } from '../services/exchangeRate.service.js';

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

// Resolve the booking exchange rate for a document. Prefers a client-supplied
// rate (manual override / rate the form already pre-filled from Sampath);
// otherwise looks it up from the cached Sampath O/D Buying rates.
async function resolveBookingRate({ currency, date, clientRate, clientSource }) {
  const cur = String(currency || 'LKR').toUpperCase();
  if (cur === 'LKR') {
    return { rate: 1, rateDate: date || null, source: 'identity' };
  }
  const provided = clientRate != null && clientRate !== '' && parseFloat(clientRate) > 0
    ? parseFloat(clientRate) : null;
  if (provided != null) {
    // Sanity-check a client-supplied rate against the cached Sampath rate so a
    // fat-fingered value (e.g. 32.5 instead of 325) cannot silently mis-book
    // the invoice and every gain/loss derived from it.
    const ref = await getRate(cur, date);
    if (ref.rate != null && Math.abs(provided - ref.rate) / ref.rate > 0.4) {
      throw new ValidationError(
        `Exchange rate ${provided} for ${cur} looks wrong — the Sampath O/D Buying rate `
        + `near ${date || 'today'} is about ${ref.rate}. Re-check and correct the rate.`
      );
    }
    return {
      rate: provided,
      rateDate: date || null,
      source: clientSource === 'sampath-auto' ? 'sampath-auto' : 'manual',
    };
  }
  const r = await getRate(cur, date);
  return { rate: r.rate, rateDate: r.rateDate, source: r.rate != null ? r.source : 'none' };
}

// ============================================
// GET ALL INVOICES
// ============================================
export const getAllInvoices = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, status, projectId, partnerId } = req.query;
  const offset = (page - 1) * limit;

  const where = {};

  if (search) {
    where[Op.or] = [
      { invoiceNumber: { [Op.iLike]: `%${search}%` } },
      { customerName: { [Op.iLike]: `%${search}%` } }
    ];
  }

  if (status) where.status = status;
  if (projectId) where.projectId = projectId;
  if (partnerId) where.partnerId = partnerId;

  const { count, rows: invoices } = await Invoice.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['invoiceDate', 'DESC']],
    include: [
      { model: Project, as: 'project', attributes: ['id', 'name', 'projectCode'] },
      { model: Proposal, as: 'proposal', attributes: ['id', 'title', 'proposalCode'] },
      { model: Partner, as: 'partner', attributes: ['id', 'name'] },
      { model: User, as: 'creator', attributes: ['id', 'fullName', 'email'] }
    ]
  });

  res.json({
    success: true,
    data: {
      invoices,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalRecords: count,
        limit: parseInt(limit)
      }
    }
  });
});

// ============================================
// GET SINGLE INVOICE
// ============================================
export const getInvoiceById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const invoice = await Invoice.findByPk(id, {
    include: [
      { model: Project, as: 'project' },
      { model: Proposal, as: 'proposal' },
      { model: Partner, as: 'partner' },
      { model: User, as: 'creator', attributes: ['id', 'fullName', 'email'] },
      {
        model: InvoiceReceipt,
        as: 'receipts',
        separate: true,
        order: [['receiptDate', 'ASC']],
        include: [
          { model: BankAccount, as: 'bankAccount', attributes: ['id', 'accountName'] },
          { model: User, as: 'creator', attributes: ['id', 'fullName'] }
        ]
      }
    ]
  });

  if (!invoice) {
    throw new NotFoundError('Invoice not found');
  }

  res.json({
    success: true,
    data: { invoice }
  });
});

// ============================================
// CREATE INVOICE
// ============================================
export const createInvoice = asyncHandler(async (req, res) => {
  const invoiceData = { ...req.body };
  const clientGaveNumber = !!invoiceData.invoiceNumber;

  // ---- Multi-currency booking ----
  // totalAmount is held in the invoice currency. We snapshot the foreign
  // amount, the Sampath O/D Buying rate at the invoice date and the LKR value.
  const currency = (invoiceData.currency || 'LKR').toUpperCase();
  invoiceData.currency = currency;
  const totalAmount = parseFloat(invoiceData.totalAmount) || 0;
  const { rate, rateDate, source } = await resolveBookingRate({
    currency,
    date: invoiceData.invoiceDate,
    clientRate: invoiceData.exchangeRate,
    clientSource: invoiceData.rateSource,
  });
  const effectiveRate = rate != null ? rate : 1;
  invoiceData.originalAmount = totalAmount;
  invoiceData.exchangeRate = effectiveRate;
  invoiceData.rateDate = rateDate || invoiceData.invoiceDate || null;
  invoiceData.amountLkr = round2(totalAmount * effectiveRate);
  invoiceData.rateSource = rate != null ? source : 'manual';

  // A new invoice starts unpaid; receipts are recorded separately.
  invoiceData.paidAmount = 0;
  invoiceData.balanceDue = totalAmount;

  // Set creator
  if (req.user) {
    invoiceData.createdBy = req.user.id;
  }

  // Create with retry: `Invoice.count() + 1` can collide under concurrent
  // creates (the column is unique), so on a unique-constraint violation we
  // regenerate the number and retry.
  let invoice;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    if (!clientGaveNumber) {
      const year = new Date().getFullYear();
      const count = await Invoice.count();
      invoiceData.invoiceNumber = `INV-${year}-${String(count + 1 + attempt).padStart(5, '0')}`;
    }
    try {
      invoice = await Invoice.create(invoiceData);
      break;
    } catch (e) {
      if (e.name === 'SequelizeUniqueConstraintError' && !clientGaveNumber && attempt < 4) continue;
      throw e;
    }
  }

  res.status(201).json({
    success: true,
    message: 'Invoice created successfully',
    data: { invoice }
  });
});

// ============================================
// UPDATE INVOICE
// ============================================
export const updateInvoice = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = { ...req.body };

  const invoice = await Invoice.findByPk(id);

  if (!invoice) {
    throw new NotFoundError('Invoice not found');
  }

  // paidAmount / balanceDue are derived from the actual receipts — never from
  // client input — so the invoice can't drift from its receipt history.
  delete updateData.paidAmount;
  delete updateData.balanceDue;

  // Re-book the LKR value if the currency, total or rate changed.
  if (updateData.currency !== undefined || updateData.totalAmount !== undefined
      || updateData.exchangeRate !== undefined) {
    const currency = (updateData.currency || invoice.currency || 'LKR').toUpperCase();
    const totalAmount = parseFloat(
      updateData.totalAmount !== undefined ? updateData.totalAmount : invoice.totalAmount
    ) || 0;
    const { rate, rateDate, source } = await resolveBookingRate({
      currency,
      date: updateData.invoiceDate || invoice.invoiceDate,
      clientRate: updateData.exchangeRate,
      clientSource: updateData.rateSource,
    });
    const effectiveRate = rate != null ? rate : (parseFloat(invoice.exchangeRate) || 1);
    updateData.currency = currency;
    updateData.originalAmount = totalAmount;
    updateData.exchangeRate = effectiveRate;
    updateData.rateDate = rateDate || updateData.invoiceDate || invoice.invoiceDate || null;
    updateData.amountLkr = round2(totalAmount * effectiveRate);
    updateData.rateSource = rate != null ? source : (invoice.rateSource || 'manual');
  }

  await invoice.update(updateData);

  // Recompute paidAmount / balanceDue / status from the receipts on record.
  const paidAmount = round2(
    (await InvoiceReceipt.sum('originalAmount', { where: { invoiceId: id } })) || 0
  );
  const balanceDue = round2(parseFloat(invoice.totalAmount) - paidAmount);
  const patch = { paidAmount, balanceDue };
  if (paidAmount > 0) {
    patch.status = balanceDue <= 0.009 ? 'Paid' : 'Partially Paid';
  }
  await invoice.update(patch);

  res.json({
    success: true,
    message: 'Invoice updated successfully',
    data: { invoice }
  });
});

// ============================================
// DELETE INVOICE
// ============================================
export const deleteInvoice = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const invoice = await Invoice.findByPk(id);

  if (!invoice) {
    throw new NotFoundError('Invoice not found');
  }

  await invoice.destroy();

  res.json({
    success: true,
    message: 'Invoice deleted successfully'
  });
});

// ============================================
// GET INVOICE STATISTICS
// ============================================
export const getInvoiceStats = asyncHandler(async (req, res) => {
  const total = await Invoice.count();
  const draft = await Invoice.count({ where: { status: 'Draft' } });
  const sent = await Invoice.count({ where: { status: 'Sent' } });
  const paid = await Invoice.count({ where: { status: 'Paid' } });
  const overdue = await Invoice.count({
    where: {
      status: { [Op.notIn]: ['Paid', 'Cancelled', 'Draft'] },
      dueDate: { [Op.lt]: new Date() }
    }
  });

  // All money totals are expressed in LKR so mixed-currency invoices aggregate
  // correctly:
  //   totalBilled      = booked LKR value of every invoice (amount_lkr).
  //   totalPaid        = LKR actually received across all receipts.
  //   totalOutstanding = unpaid balance valued at each invoice's booking rate
  //                      (balance_due is in the invoice currency).
  //   totalGainLoss    = realised forex gain/loss, kept separate.
  const totalBilled = await Invoice.sum('amountLkr') || 0;
  const totalPaid = await InvoiceReceipt.sum('amountLkr') || 0;
  const totalGainLoss = await InvoiceReceipt.sum('exchangeGainLoss') || 0;
  const outstandingRows = await Invoice.findAll({
    attributes: [
      [Invoice.sequelize.fn('SUM', Invoice.sequelize.literal('balance_due * exchange_rate')), 'v']
    ],
    where: { status: { [Op.notIn]: ['Paid', 'Cancelled'] } },
    raw: true,
  });
  const totalOutstanding = parseFloat(outstandingRows[0]?.v || 0);

  const byMonth = await Invoice.findAll({
    attributes: [
      [Invoice.sequelize.fn('DATE_TRUNC', 'month', Invoice.sequelize.col('invoice_date')), 'month'],
      [Invoice.sequelize.fn('COUNT', Invoice.sequelize.col('id')), 'count'],
      [Invoice.sequelize.fn('SUM', Invoice.sequelize.col('amount_lkr')), 'total'],
      [Invoice.sequelize.fn('SUM', Invoice.sequelize.literal('paid_amount * exchange_rate')), 'paid']
    ],
    where: {
      invoiceDate: {
        [Op.gte]: new Date(new Date().getFullYear(), 0, 1) // This year
      }
    },
    group: [Invoice.sequelize.fn('DATE_TRUNC', 'month', Invoice.sequelize.col('invoice_date'))],
    order: [[Invoice.sequelize.fn('DATE_TRUNC', 'month', Invoice.sequelize.col('invoice_date')), 'ASC']]
  });

  res.json({
    success: true,
    data: {
      total,
      draft,
      sent,
      paid,
      overdue,
      totalBilled: parseFloat(totalBilled),
      totalPaid: parseFloat(totalPaid),
      totalOutstanding: parseFloat(totalOutstanding),
      totalGainLoss: parseFloat(totalGainLoss),
      byMonth: byMonth.map(i => ({
        month: i.get('month'),
        count: parseInt(i.get('count')),
        total: parseFloat(i.get('total') || 0),
        paid: parseFloat(i.get('paid') || 0)
      }))
    }
  });
});

// ============================================
// RECORD PAYMENT (receipt against an invoice)
// ============================================
// Each call creates an invoice_receipts row capturing the receipt-date Sampath
// O/D Buying rate and the realised exchange gain/loss versus the rate the
// invoice was booked at.
//
// Body:
//   originalAmount   - amount received, in the invoice currency (required)
//   amountLkr        - actual LKR credited to the bank (optional). When given,
//                      the realised gain/loss is derived directly from it so
//                      the receipt reconciles exactly. (amountLKR also accepted.)
//   exchangeRate     - explicit receipt-date rate (optional override)
//   rateSource       - 'sampath-auto' | 'manual' (optional)
//   allowOverpayment - set true to record an amount above the balance due
//   paymentDate, paymentMethod, bankAccountId, referenceNumber, notes
// ============================================
export const recordPayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    originalAmount, amount, amountLkr, amountLKR, exchangeRate, rateSource,
    allowOverpayment, paymentDate, paymentMethod, bankAccountId, referenceNumber, notes,
  } = req.body;

  // Accept `amountLkr` or `amountLKR` (frontend casing tolerance).
  const lkrRaw = amountLkr != null && amountLkr !== '' ? amountLkr
    : (amountLKR != null && amountLKR !== '' ? amountLKR : null);
  const lkrInput = lkrRaw != null && parseFloat(lkrRaw) > 0 ? parseFloat(lkrRaw) : null;

  const invoice = await Invoice.findByPk(id);
  if (!invoice) throw new NotFoundError('Invoice not found');

  // Accept `originalAmount` (new) or `amount` (legacy) for the foreign amount.
  const received = parseFloat(originalAmount != null ? originalAmount : amount);
  if (!(received > 0)) {
    throw new ValidationError('originalAmount (amount received) must be greater than zero');
  }

  // Overpayment guard — balanceDue is in invoice currency, same as `received`.
  const outstanding = round2(parseFloat(invoice.balanceDue ?? invoice.totalAmount ?? 0));
  if (!allowOverpayment && received > outstanding + 0.01) {
    throw new ValidationError(
      `Amount received (${received}) exceeds the outstanding balance (${outstanding}). `
      + 'Pass allowOverpayment:true to record it anyway.'
    );
  }

  const currency = (invoice.currency || 'LKR').toUpperCase();
  const receiptDate = paymentDate || colomboToday();
  const invoiceRate = parseFloat(invoice.exchangeRate) || 1;

  // ---- Resolve the receipt-date exchange rate ----
  let receiptRate;
  let resolvedSource;
  let resolvedRateDate = receiptDate;
  let rateConfirmed = true;

  if (currency === 'LKR') {
    receiptRate = 1;
    resolvedSource = 'identity';
  } else if (lkrInput != null) {
    // Staff entered the actual LKR credited — derive the realised rate from it.
    receiptRate = lkrInput / received;
    resolvedSource = 'manual';
  } else if (exchangeRate != null && exchangeRate !== '' && parseFloat(exchangeRate) > 0) {
    receiptRate = parseFloat(exchangeRate);
    resolvedSource = rateSource === 'sampath-auto' ? 'sampath-auto' : 'manual';
  } else {
    const r = await getRate(currency, receiptDate);
    if (r.rate != null) {
      receiptRate = r.rate;
      resolvedSource = r.source;
      resolvedRateDate = r.rateDate || receiptDate;
    } else {
      // No rate available — record the receipt but flag it unconfirmed so
      // finance staff don't mistake an unknown rate for a break-even one.
      receiptRate = invoiceRate;
      resolvedSource = 'none';
      rateConfirmed = false;
    }
  }

  // LKR received + realised gain/loss vs. the rate the invoice was booked at.
  // When the actual LKR is supplied, gain/loss is derived straight from it so
  // the receipt reconciles exactly with the bank credit.
  let lkrReceived;
  let gainLoss;
  if (lkrInput != null) {
    lkrReceived = round2(lkrInput);
    gainLoss = round2(lkrReceived - received * invoiceRate);
  } else {
    lkrReceived = round2(received * receiptRate);
    gainLoss = round2((receiptRate - invoiceRate) * received);
  }

  const result = await sequelize.transaction(async (t) => {
    // Re-read the invoice under a row lock so two concurrent receipts can't
    // both add to the same stale paidAmount.
    const locked = await Invoice.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });

    const receipt = await InvoiceReceipt.create({
      invoiceId: locked.id,
      receiptDate,
      originalAmount: received,
      currency,
      exchangeRate: receiptRate,
      rateDate: resolvedRateDate,
      amountLkr: lkrReceived,
      exchangeGainLoss: gainLoss,
      rateSource: resolvedSource,
      paymentMethod: paymentMethod || null,
      bankAccountId: bankAccountId || null,
      referenceNumber: referenceNumber || null,
      notes: notes || null,
      createdBy: req.user?.id || null,
    }, { transaction: t });

    // paidAmount / balanceDue stay in the invoice currency.
    const newPaidAmount = round2(parseFloat(locked.paidAmount || 0) + received);
    const balanceDue = round2(parseFloat(locked.totalAmount) - newPaidAmount);
    let status = locked.status;
    if (balanceDue <= 0.009) status = 'Paid';
    else if (newPaidAmount > 0) status = 'Partially Paid';

    await locked.update({ paidAmount: newPaidAmount, balanceDue, status }, { transaction: t });
    return { receipt, invoice: locked };
  });

  res.json({
    success: true,
    message: rateConfirmed
      ? 'Payment recorded successfully'
      : 'Payment recorded — the exchange rate could not be confirmed; please verify it.',
    data: { invoice: result.invoice, receipt: result.receipt, rateConfirmed },
  });
});

// ============================================
// GET RECEIPTS FOR AN INVOICE
// ============================================
export const getInvoiceReceipts = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const invoice = await Invoice.findByPk(id);
  if (!invoice) throw new NotFoundError('Invoice not found');

  const receipts = await InvoiceReceipt.findAll({
    where: { invoiceId: id },
    order: [['receiptDate', 'ASC']],
    include: [
      { model: BankAccount, as: 'bankAccount', attributes: ['id', 'accountName'] },
      { model: User, as: 'creator', attributes: ['id', 'fullName'] }
    ]
  });

  const totalGainLoss = receipts.reduce((s, r) => s + (parseFloat(r.exchangeGainLoss) || 0), 0);
  res.json({ success: true, data: { receipts, totalGainLoss: round2(totalGainLoss) } });
});

// ============================================
// FOREX GAIN/LOSS REPORT
// GET /api/invoices/forex-report?from=...&to=...
// Aggregates realised exchange gain/loss across invoice receipts, grant
// receipts and payments (payables), grouped by currency.
// ============================================
export const getForexReport = asyncHandler(async (req, res) => {
  const { from, to } = req.query;

  const dateFilter = (col) => {
    if (!from && !to) return {};
    const r = {};
    if (from) r[Op.gte] = from;
    if (to) r[Op.lte] = to;
    return { [col]: r };
  };

  const sumBy = async (Model, dateCol, curCol) => {
    const rows = await Model.findAll({
      attributes: [
        [curCol, 'currency'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('amount_lkr')), 'amountLkr'],
        [sequelize.fn('SUM', sequelize.col('exchange_gain_loss')), 'gainLoss'],
      ],
      where: dateFilter(dateCol),
      group: [curCol],
      raw: true,
    });
    return rows.map(r => ({
      currency: r.currency,
      count: parseInt(r.count) || 0,
      amountLkr: parseFloat(r.amountLkr) || 0,
      gainLoss: parseFloat(r.gainLoss) || 0,
    }));
  };

  const invoiceReceipts = await sumBy(InvoiceReceipt, 'receiptDate', 'currency');
  const grantReceipts = await sumBy(GrantReceipt, 'receiptDate', 'currency');
  const payments = await sumBy(Payment, 'paymentDate', 'currency');

  const sumGL = (arr) => round2(arr.reduce((s, r) => s + r.gainLoss, 0));
  const totalGainLoss = sumGL([...invoiceReceipts, ...grantReceipts, ...payments]);

  res.json({
    success: true,
    data: {
      from: from || null,
      to: to || null,
      totalGainLoss,
      invoiceReceipts: { byCurrency: invoiceReceipts, gainLoss: sumGL(invoiceReceipts) },
      grantReceipts: { byCurrency: grantReceipts, gainLoss: sumGL(grantReceipts) },
      payments: { byCurrency: payments, gainLoss: sumGL(payments) },
    },
  });
});

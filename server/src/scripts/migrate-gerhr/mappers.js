// Per-collection mappers. Each mapper takes (firestoreDoc, ctx) and returns
// either { table: 'foo', payload: {...}, key?: '<unique>' } or null to skip.
// `ctx` carries lookup helpers (staffEmailToUserId etc.) populated up-front.
//
// Conventions:
//  - Returning null means "skip this row" — usually for ephemeral or out-of-scope docs.
//  - Throwing means a hard error; the runner records it and continues.
//  - The unique key (if provided) prevents duplicates inside ONE migration run
//    (the _gerhr_migrations ledger handles cross-run idempotency).

import bcrypt from 'bcryptjs';

const toDate = (v) => {
  if (!v) return null;
  if (typeof v === 'string') return new Date(v);
  if (v.toDate) return v.toDate();           // Firestore Timestamp
  if (v._seconds) return new Date(v._seconds * 1000);
  return new Date(v);
};

const toYmd = (v) => {
  const d = toDate(v);
  return d ? d.toISOString().slice(0, 10) : null;
};

// staff/{uid} → users (best-effort upsert by email)
export const staffMapper = async (doc, ctx) => {
  if (!doc.email) return null;
  const existing = ctx.usersByEmail?.[doc.email.toLowerCase()];
  if (existing) {
    ctx.staffUidToUserId[doc._id] = existing.id;
    return null; // already there, just record the mapping
  }
  // Generate a placeholder password — admin should issue a reset link after migration.
  const placeholder = await bcrypt.hash(`gerhr-migrated-${doc._id}-${Date.now()}`, 10);
  return {
    table: 'users',
    onCreated: (id) => { ctx.staffUidToUserId[doc._id] = id; },
    payload: {
      username: (doc.email.split('@')[0] || `staff_${doc._id}`).slice(0, 50),
      email:    doc.email.toLowerCase(),
      password: placeholder,
      fullName: doc.name || doc.fullName || 'Migrated staff',
      role:     doc.role === 'admin' ? 'Admin' : 'Field Officer',
      department: doc.dept || null,
      phone:    doc.phone || null,
      employeeId: doc.employeeId || null,
      status:   doc.isActive === false ? 'Inactive' : 'Active'
    }
  };
};

// attendance/{doc} → 1 IN + 1 OUT punch
export const attendanceMapper = (doc, ctx) => {
  const userId = ctx.staffUidToUserId[doc.staffId];
  if (!userId) return null;
  const out = [];
  if (doc.checkIn) {
    out.push({
      table: 'attendance_punches',
      key: `${doc._id}-IN`,
      payload: {
        userId, punchType: 'In',
        occurredAt: toDate(doc.checkIn),
        latitude:  doc.checkInLat ?? null,
        longitude: doc.checkInLng ?? null,
        selfieUrl: doc.selfieUrl ?? null,
        source:    'migrated'
      }
    });
  }
  if (doc.checkOut) {
    out.push({
      table: 'attendance_punches',
      key: `${doc._id}-OUT`,
      payload: {
        userId, punchType: 'Out',
        occurredAt: toDate(doc.checkOut),
        latitude:  doc.checkOutLat ?? null,
        longitude: doc.checkOutLng ?? null,
        source:    'migrated'
      }
    });
  }
  return out.length === 1 ? out[0] : out; // runner handles arrays
};

export const locationsMapper = (doc, ctx) => {
  const userId = ctx.staffUidToUserId[doc.staffId];
  if (!userId || !doc.lat || !doc.lng) return null;
  return {
    table: 'location_points',
    payload: {
      userId,
      recordedAt: toDate(doc.timestamp ?? doc.createdAt),
      latitude:   doc.lat,
      longitude:  doc.lng,
      accuracyM:  doc.accuracyM ?? null,
      speedKmh:   doc.speedKmh ?? null,
      source:     'migrated'
    }
  };
};

export const tripsMapper = (doc, ctx) => {
  const userId = ctx.staffUidToUserId[doc.staffId];
  if (!userId) return null;
  return {
    table: 'movement_logs',
    payload: {
      userId,
      fromLocation: doc.startAddress || 'Unknown',
      toLocation:   doc.endAddress   || 'Unknown',
      purpose:      doc.purpose || (doc.type === 'work' ? 'Work trip' : 'Personal trip'),
      plannedStart: toDate(doc.startTime),
      departureAt:  toDate(doc.startTime),
      returnAt:     toDate(doc.endTime),
      status:       'Returned'
    }
  };
};

export const visitsMapper = (doc, ctx) => {
  const userId = ctx.staffUidToUserId[doc.staffId];
  if (!userId) return null;
  return {
    table: 'visits',
    payload: {
      userId,
      customerName: doc.customerName || null,
      purpose:      doc.purpose || null,
      occurredAt:   toDate(doc.createdAt) || new Date(),
      latitude:     doc.lat ?? null,
      longitude:    doc.lng ?? null,
      photoUrl:     doc.photoUrl ?? null,
      beneficiariesServed: doc.beneficiariesServed ?? null,
      notes:        doc.notes || null
    }
  };
};

export const leaveRequestsMapper = (doc, ctx) => {
  const userId = ctx.staffUidToUserId[doc.staffId];
  if (!userId) return null;
  return {
    table: 'leave_requests',
    payload: {
      userId,
      leaveType: doc.type || 'Annual',
      startDate: toYmd(doc.startDate),
      endDate:   toYmd(doc.endDate),
      reason:    doc.reason || null,
      status:    doc.status === 'approved' ? 'Approved'
                : doc.status === 'rejected' ? 'Rejected'
                : doc.status === 'cancelled' ? 'Cancelled' : 'Pending'
    }
  };
};

export const salaryAdvancesMapper = (doc, ctx) => {
  const userId = ctx.staffUidToUserId[doc.staffId];
  if (!userId) return null;
  return {
    table: 'salary_advances',
    payload: {
      userId,
      amount: doc.amount,
      reason: doc.reason || null,
      status: ({
        approved: 'Approved', rejected: 'Rejected',
        cancelled: 'Cancelled', pending: 'Pending'
      })[doc.status] || 'Pending',
      decidedAt: toDate(doc.decidedAt)
    }
  };
};

export const expenseClaimsMapper = (doc, ctx) => {
  const userId = ctx.staffUidToUserId[doc.staffId];
  if (!userId) return null;
  return {
    table: 'expenses',
    payload: {
      submittedBy: userId,
      date: toYmd(doc.date ?? doc.createdAt),
      category:    doc.category || 'Other',
      description: doc.description || '(migrated)',
      amount:      doc.amount,
      receiptUrl:  doc.receiptUrl || null,
      status:      doc.status === 'approved' || doc.status === 'reimbursed' ? 'Approved'
                  : doc.status === 'rejected' ? 'Rejected' : 'Pending'
    }
  };
};

export const reconciliationMapper = (doc, ctx) => {
  const userId = ctx.staffUidToUserId[doc.staffId];
  if (!userId) return null;
  return {
    table: 'attendance_corrections',
    payload: {
      userId,
      requestType: doc.type || 'Other',
      reason: doc.reason || '(migrated)',
      status: doc.status === 'approved' ? 'Approved'
            : doc.status === 'rejected' ? 'Rejected' : 'Pending'
    }
  };
};

export const announcementsMapper = (doc, ctx) => {
  const creatorUid = doc.createdBy || doc.staffId;
  const createdBy = ctx.staffUidToUserId[creatorUid] || ctx.fallbackAdminId;
  if (!createdBy) return null;
  return {
    table: 'announcements',
    payload: {
      title:   doc.title || '(untitled)',
      body:    doc.body || '',
      audience:'all',
      publishedAt: toDate(doc.createdAt) || new Date(),
      createdBy
    }
  };
};

export const shiftsMapper = (doc, ctx) => {
  const userId = ctx.staffUidToUserId[doc.staffId];
  if (!userId) return null;
  return {
    table: 'shifts',
    payload: {
      userId,
      date: toYmd(doc.date),
      startTime: doc.startTime || '09:00',
      endTime:   doc.endTime || '17:00',
      breakMinutes: doc.breakMinutes || 60,
      location:  doc.location || null,
      status:    'Scheduled'
    }
  };
};

// Map of Firestore collection name → mapper function. Order matters: staff
// must be processed first so staffUidToUserId is populated before any other
// mapper that references staffId.
export const COLLECTION_PIPELINE = [
  ['staff',                   staffMapper],
  ['attendance',              attendanceMapper],
  ['locations',               locationsMapper],
  ['trips',                   tripsMapper],
  ['visits',                  visitsMapper],
  ['leave_requests',          leaveRequestsMapper],
  ['salary_advances',         salaryAdvancesMapper],
  ['expense_claims',          expenseClaimsMapper],
  ['reconciliation_requests', reconciliationMapper],
  ['announcements',           announcementsMapper],
  ['shifts',                  shiftsMapper]
];

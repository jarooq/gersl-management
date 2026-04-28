/**
 * Staff Document Types
 * Standard document types for employee document management
 */

export const STAFF_DOCUMENT_TYPES = {
  EMPLOYMENT_CONTRACT: 'Employment Contract',
  ID_PROOF: 'ID Proof',
  CV_RESUME: 'CV/Resume',
  POLICE_CLEARANCE: 'Police Clearance',
  EDUCATIONAL_CERTIFICATE: 'Educational Certificate',
  MEDICAL_CERTIFICATE: 'Medical Certificate',
  BACKGROUND_CHECK: 'Background Check',
  TAX_DOCUMENTS: 'Tax Documents',
  OTHER: 'Other'
};

export const DOCUMENT_STATUSES = {
  PENDING: 'Pending',
  VERIFIED: 'Verified',
  REJECTED: 'Rejected',
  EXPIRED: 'Expired'
};

// Document types that typically have expiry dates
export const EXPIRABLE_DOCUMENT_TYPES = [
  STAFF_DOCUMENT_TYPES.POLICE_CLEARANCE,
  STAFF_DOCUMENT_TYPES.MEDICAL_CERTIFICATE,
  STAFF_DOCUMENT_TYPES.BACKGROUND_CHECK
];

// Required documents for new employees
export const REQUIRED_EMPLOYEE_DOCUMENTS = [
  STAFF_DOCUMENT_TYPES.EMPLOYMENT_CONTRACT,
  STAFF_DOCUMENT_TYPES.ID_PROOF,
  STAFF_DOCUMENT_TYPES.CV_RESUME,
  STAFF_DOCUMENT_TYPES.POLICE_CLEARANCE
];

export default {
  STAFF_DOCUMENT_TYPES,
  DOCUMENT_STATUSES,
  EXPIRABLE_DOCUMENT_TYPES,
  REQUIRED_EMPLOYEE_DOCUMENTS
};

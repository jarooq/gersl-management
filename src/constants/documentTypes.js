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

// Document types as an array for dropdowns
export const DOCUMENT_TYPE_OPTIONS = [
  { value: 'Employment Contract', label: 'Employment Contract' },
  { value: 'ID Proof', label: 'ID Proof' },
  { value: 'CV/Resume', label: 'CV/Resume' },
  { value: 'Police Clearance', label: 'Police Clearance' },
  { value: 'Educational Certificate', label: 'Educational Certificate' },
  { value: 'Medical Certificate', label: 'Medical Certificate' },
  { value: 'Background Check', label: 'Background Check' },
  { value: 'Tax Documents', label: 'Tax Documents' },
  { value: 'Other', label: 'Other' }
];

// Document status options for dropdowns
export const DOCUMENT_STATUS_OPTIONS = [
  { value: 'Pending', label: 'Pending' },
  { value: 'Verified', label: 'Verified' },
  { value: 'Rejected', label: 'Rejected' },
  { value: 'Expired', label: 'Expired' }
];

// Document types that typically have expiry dates
export const EXPIRABLE_DOCUMENT_TYPES = [
  'Police Clearance',
  'Medical Certificate',
  'Background Check'
];

// Required documents for new employees
export const REQUIRED_EMPLOYEE_DOCUMENTS = [
  'Employment Contract',
  'ID Proof',
  'CV/Resume',
  'Police Clearance'
];

export default {
  STAFF_DOCUMENT_TYPES,
  DOCUMENT_STATUSES,
  DOCUMENT_TYPE_OPTIONS,
  DOCUMENT_STATUS_OPTIONS,
  EXPIRABLE_DOCUMENT_TYPES,
  REQUIRED_EMPLOYEE_DOCUMENTS
};

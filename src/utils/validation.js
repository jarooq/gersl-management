import { z } from 'zod';

// ============================================
// COMMON VALIDATION SCHEMAS
// ============================================

// Sri Lankan NIC validation
const sriLankanNIC = z.string()
  .refine((nic) => {
    // Old format: 9 digits + V (e.g., 123456789V)
    const oldFormat = /^[0-9]{9}[Vv]$/;
    // New format: 12 digits (e.g., 199512345678)
    const newFormat = /^[0-9]{12}$/;
    return oldFormat.test(nic) || newFormat.test(nic);
  }, { message: "Invalid Sri Lankan NIC format" });

// Phone number validation (Sri Lankan format)
const phoneNumber = z.string()
  .refine((phone) => {
    const cleanPhone = phone.replace(/[\s-]/g, '');
    return /^(\+94|0)?[0-9]{9,10}$/.test(cleanPhone);
  }, { message: "Invalid phone number format" });

// Email validation
const email = z.string().email({ message: "Invalid email address" });

// Positive number validation
const positiveNumber = z.number().positive({ message: "Must be a positive number" });

// Date validation
const pastDate = z.string().refine((date) => {
  return new Date(date) <= new Date();
}, { message: "Date cannot be in the future" });

const futureDate = z.string().refine((date) => {
  return new Date(date) >= new Date();
}, { message: "Date cannot be in the past" });

// ============================================
// ORPHAN VALIDATION SCHEMAS
// ============================================

export const orphanSchema = z.object({
  fullName: z.string()
    .min(3, { message: "Full name must be at least 3 characters" })
    .max(100, { message: "Full name must be less than 100 characters" })
    .regex(/^[a-zA-Z\s]+$/, { message: "Name can only contain letters and spaces" }),

  dateOfBirth: pastDate,

  age: z.number()
    .int()
    .min(0, { message: "Age must be 0 or greater" })
    .max(18, { message: "Age must be 18 or less" }),

  district: z.string().min(1, { message: "District is required" }),

  guardianName: z.string()
    .min(3, { message: "Guardian name must be at least 3 characters" })
    .max(100, { message: "Guardian name must be less than 100 characters" }),

  guardianNIC: sriLankanNIC,

  contactNumber: phoneNumber,

  address: z.string()
    .min(10, { message: "Address must be at least 10 characters" })
    .max(200, { message: "Address must be less than 200 characters" }),

  schoolName: z.string()
    .min(3, { message: "School name must be at least 3 characters" })
    .optional(),

  currentGrade: z.string().optional(),

  stipendAmount: positiveNumber.optional(),

  latitude: z.number()
    .min(-90)
    .max(90)
    .optional(),

  longitude: z.number()
    .min(-180)
    .max(180)
    .optional(),

  status: z.enum(['Active', 'Inactive', 'Pending', 'Graduated'])
    .default('Active'),
});

// ============================================
// PROJECT VALIDATION SCHEMAS
// ============================================

export const projectSchema = z.object({
  name: z.string()
    .min(5, { message: "Project name must be at least 5 characters" })
    .max(200, { message: "Project name must be less than 200 characters" }),

  programmeArea: z.string().min(1, { message: "Programme area is required" }),

  budget: positiveNumber,

  targetBeneficiaries: z.number()
    .int()
    .positive({ message: "Target beneficiaries must be positive" }),

  startDate: z.string(),

  endDate: z.string(),

  location: z.string().min(3, { message: "Location is required" }),

  donor: z.string().optional(),

  description: z.string()
    .min(20, { message: "Description must be at least 20 characters" })
    .max(1000, { message: "Description must be less than 1000 characters" })
    .optional(),

  status: z.enum(['Planning', 'Implementation', 'Closing', 'Completed'])
    .default('Planning'),
}).refine((data) => {
  return new Date(data.endDate) > new Date(data.startDate);
}, {
  message: "End date must be after start date",
  path: ["endDate"],
});

// ============================================
// FINANCE VALIDATION SCHEMAS
// ============================================

export const expenseSchema = z.object({
  date: pastDate,

  category: z.string().min(1, { message: "Category is required" }),

  description: z.string()
    .min(5, { message: "Description must be at least 5 characters" })
    .max(200, { message: "Description must be less than 200 characters" }),

  amount: positiveNumber,

  project: z.string().optional(),

  status: z.enum(['Pending', 'Paid', 'Rejected']).default('Pending'),

  paymentMethod: z.string().optional(),

  approvedBy: z.string().optional(),
});

export const budgetSchema = z.object({
  category: z.string().min(1, { message: "Category is required" }),

  allocated: positiveNumber,

  spent: z.number()
    .min(0, { message: "Spent amount cannot be negative" }),

  month: z.string().min(1, { message: "Month/Quarter is required" }),
}).refine((data) => {
  return data.spent <= data.allocated;
}, {
  message: "Spent amount cannot exceed allocated budget",
  path: ["spent"],
});

export const purchaseOrderSchema = z.object({
  vendor: z.string()
    .min(3, { message: "Vendor name must be at least 3 characters" }),

  description: z.string()
    .min(10, { message: "Description must be at least 10 characters" })
    .max(500, { message: "Description must be less than 500 characters" }),

  amount: positiveNumber,

  requestedBy: z.string().min(1, { message: "Requested by is required" }),

  status: z.enum(['Pending', 'Approved', 'Rejected', 'Pending CEO Approval'])
    .default('Pending'),
});

// ============================================
// HR VALIDATION SCHEMAS
// ============================================

export const staffSchema = z.object({
  fullName: z.string()
    .min(3, { message: "Full name must be at least 3 characters" })
    .max(100, { message: "Full name must be less than 100 characters" }),

  email: email,

  phone: phoneNumber,

  nic: sriLankanNIC,

  position: z.string().min(2, { message: "Position is required" }),

  department: z.string().min(2, { message: "Department is required" }),

  salary: positiveNumber,

  joinDate: pastDate,

  status: z.enum(['Active', 'On Leave', 'Inactive', 'Resigned'])
    .default('Active'),

  employmentType: z.enum(['Full-Time', 'Part-Time', 'Contract', 'Volunteer'])
    .default('Full-Time'),
});

// ============================================
// CBO VALIDATION SCHEMAS
// ============================================

export const cboSchema = z.object({
  name: z.string()
    .min(5, { message: "CBO name must be at least 5 characters" })
    .max(200, { message: "CBO name must be less than 200 characters" }),

  acronym: z.string()
    .min(2, { message: "Acronym must be at least 2 characters" })
    .max(10, { message: "Acronym must be less than 10 characters" })
    .optional(),

  type: z.string().min(1, { message: "CBO type is required" }),

  district: z.string().min(1, { message: "District is required" }),

  registrationNumber: z.string()
    .min(3, { message: "Registration number is required" }),

  registrationDate: pastDate,

  contactPerson: z.string()
    .min(3, { message: "Contact person name is required" }),

  email: email,

  phone: phoneNumber,

  address: z.string()
    .min(10, { message: "Address must be at least 10 characters" }),

  status: z.enum(['Active', 'Inactive', 'Pending Review', 'Suspended'])
    .default('Pending Review'),
});

export const volunteerSchema = z.object({
  fullName: z.string()
    .min(3, { message: "Full name must be at least 3 characters" })
    .max(100, { message: "Full name must be less than 100 characters" }),

  email: email,

  phone: phoneNumber,

  nic: sriLankanNIC,

  district: z.string().min(1, { message: "District is required" }),

  address: z.string()
    .min(10, { message: "Address must be at least 10 characters" }),

  skills: z.array(z.string()).min(1, { message: "At least one skill is required" }),

  availability: z.string().min(1, { message: "Availability is required" }),

  emergencyContact: z.string()
    .min(10, { message: "Emergency contact is required" }),

  status: z.enum(['Active', 'Inactive', 'Pending Orientation'])
    .default('Pending Orientation'),
});

export const cboProposalSchema = z.object({
  proposalTitle: z.string()
    .min(10, { message: "Proposal title must be at least 10 characters" })
    .max(200, { message: "Proposal title must be less than 200 characters" }),

  programmeArea: z.string().min(1, { message: "Programme area is required" }),

  requestedBudget: positiveNumber,

  duration: z.string().min(1, { message: "Duration is required" }),

  targetBeneficiaries: z.number()
    .int()
    .positive({ message: "Target beneficiaries must be positive" }),

  district: z.string().min(1, { message: "District is required" }),

  startDate: z.string(),

  endDate: z.string(),

  problemStatement: z.string()
    .min(50, { message: "Problem statement must be at least 50 characters" })
    .max(2000, { message: "Problem statement must be less than 2000 characters" }),

  proposedSolution: z.string()
    .min(50, { message: "Proposed solution must be at least 50 characters" })
    .max(2000, { message: "Proposed solution must be less than 2000 characters" }),

  overallGoal: z.string()
    .min(20, { message: "Overall goal must be at least 20 characters" })
    .max(500, { message: "Overall goal must be less than 500 characters" }),
}).refine((data) => {
  return new Date(data.endDate) > new Date(data.startDate);
}, {
  message: "End date must be after start date",
  path: ["endDate"],
});

// ============================================
// PARTNERS VALIDATION SCHEMAS
// ============================================

export const partnerSchema = z.object({
  name: z.string()
    .min(3, { message: "Partner name must be at least 3 characters" })
    .max(200, { message: "Partner name must be less than 200 characters" }),

  type: z.string().min(1, { message: "Partner type is required" }),

  country: z.string().min(2, { message: "Country is required" }),

  contactPerson: z.string()
    .min(3, { message: "Contact person name is required" }),

  email: email,

  phone: z.string().optional(),

  status: z.enum(['Active', 'Inactive', 'Prospective'])
    .default('Prospective'),

  partnershipStart: pastDate.optional(),
});

// ============================================
// MEAL VALIDATION SCHEMAS
// ============================================

export const indicatorSchema = z.object({
  name: z.string()
    .min(10, { message: "Indicator name must be at least 10 characters" })
    .max(200, { message: "Indicator name must be less than 200 characters" }),

  type: z.enum(['Output', 'Outcome', 'Impact', 'Activity'])
    .default('Output'),

  category: z.string().min(1, { message: "Category is required" }),

  project: z.string().min(1, { message: "Project is required" }),

  baseline: z.number(),

  target: z.number(),

  unit: z.string().min(1, { message: "Unit is required" }),

  frequency: z.enum(['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annually'])
    .default('Monthly'),

  dataSource: z.string()
    .min(5, { message: "Data source must be specified" }),

  responsible: z.string().min(1, { message: "Responsible person is required" }),
});

export const cfmFeedbackSchema = z.object({
  feedbackType: z.enum(['Complaint', 'Suggestion', 'Compliment', 'Question'])
    .default('Complaint'),

  channel: z.enum(['Hotline', 'Email', 'SMS', 'In-Person', 'Suggestion Box', 'Social Media'])
    .default('Hotline'),

  severity: z.enum(['Low', 'Medium', 'High', 'Critical'])
    .default('Medium'),

  description: z.string()
    .min(10, { message: "Description must be at least 10 characters" })
    .max(1000, { message: "Description must be less than 1000 characters" }),

  reportedBy: z.string().min(1, { message: "Reporter information is required" }),

  contactInfo: z.string().optional(),

  category: z.string().optional(),
});

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Validate data against a schema and return errors
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @param {any} data - Data to validate
 * @returns {{ success: boolean, errors?: object, data?: any }}
 */
export const validateData = (schema, data) => {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: { general: "Validation failed" } };
  }
};

/**
 * Validate data and throw error if invalid
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @param {any} data - Data to validate
 * @returns {any} Validated data
 * @throws {z.ZodError} Validation error
 */
export const validateOrThrow = (schema, data) => {
  return schema.parse(data);
};

/**
 * Sanitize string input to prevent XSS
 * @param {string} input - User input string
 * @returns {string} Sanitized string
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;

  // Remove potentially dangerous characters
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
};

/**
 * Sanitize object recursively
 * @param {object} obj - Object to sanitize
 * @returns {object} Sanitized object
 */
export const sanitizeObject = (obj) => {
  if (typeof obj !== 'object' || obj === null) {
    return typeof obj === 'string' ? sanitizeInput(obj) : obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    sanitized[key] = sanitizeObject(value);
  }
  return sanitized;
};

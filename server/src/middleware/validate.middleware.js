import { BadRequestError } from './error.middleware.js';

// ============================================
// VALIDATION MIDDLEWARE
// ============================================
// Generic validation middleware that accepts a schema
export const validate = (schema) => {
  return (req, res, next) => {
    try {
      // Validate request body against schema
      const validated = schema.parse(req.body);

      // Replace request body with validated data
      req.body = validated;

      next();
    } catch (error) {
      // Handle Zod validation errors
      if (error.errors) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));

        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors
        });
      }

      next(error);
    }
  };
};

// ============================================
// SANITIZATION HELPER
// ============================================
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;

  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
};

// Recursively sanitize object
export const sanitizeObject = (obj) => {
  if (typeof obj !== 'object' || obj === null) {
    return sanitizeInput(obj);
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

// Middleware to sanitize request body
export const sanitizeBody = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  next();
};

// ============================================
// PAGINATION VALIDATION
// ============================================
export const validatePagination = (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  if (page < 1) {
    throw new BadRequestError('Page number must be greater than 0');
  }

  if (limit < 1 || limit > 100) {
    throw new BadRequestError('Limit must be between 1 and 100');
  }

  req.pagination = {
    page,
    limit,
    offset: (page - 1) * limit
  };

  next();
};

// ============================================
// ID VALIDATION
// ============================================
export const validateId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = parseInt(req.params[paramName]);

    if (!id || isNaN(id) || id < 1) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName}. Must be a positive integer.`
      });
    }

    req.params[paramName] = id;
    next();
  };
};

import { StaffDocument, User } from '../models/index.js';
import { STAFF_DOCUMENT_TYPES, DOCUMENT_STATUSES } from '../constants/documentTypes.js';
import path from 'path';

/**
 * Get all documents for a specific staff member
 */
export const getStaffDocuments = async (req, res) => {
  try {
    const { userId } = req.params;

    const documents = await StaffDocument.findAll({
      where: { userId },
      include: [
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'fullName', 'email']
        },
        {
          model: User,
          as: 'verifier',
          attributes: ['id', 'fullName', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      documents
    });
  } catch (error) {
    console.error('Error fetching staff documents:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch staff documents',
      error: error.message
    });
  }
};

/**
 * Get a specific document by ID
 */
export const getDocumentById = async (req, res) => {
  try {
    const { id } = req.params;

    const document = await StaffDocument.findByPk(id, {
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'fullName', 'email', 'employeeId']
        },
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'fullName', 'email']
        },
        {
          model: User,
          as: 'verifier',
          attributes: ['id', 'fullName', 'email']
        }
      ]
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    res.json({
      success: true,
      document
    });
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch document',
      error: error.message
    });
  }
};

/**
 * Upload a new staff document with file
 */
export const uploadStaffDocument = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      documentName,
      documentType,
      description,
      expiryDate
    } = req.body;

    // Validate file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Validate user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Validate document type
    if (!Object.values(STAFF_DOCUMENT_TYPES).includes(documentType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid document type'
      });
    }

    // Create document record with file info
    const document = await StaffDocument.create({
      userId,
      documentName: documentName || req.file.originalname,
      documentType,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      filePath: `/uploads/staff-documents/${req.file.filename}`,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      description,
      expiryDate: expiryDate || null,
      status: DOCUMENT_STATUSES.PENDING,
      uploadedBy: req.user.id
    });

    // Fetch with relationships
    const fullDocument = await StaffDocument.findByPk(document.id, {
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'fullName', 'email', 'employeeId']
        },
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'fullName', 'email']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      document: fullDocument
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload document',
      error: error.message
    });
  }
};

/**
 * Update document information
 */
export const updateStaffDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      documentName,
      documentType,
      description,
      expiryDate,
      notes
    } = req.body;

    const document = await StaffDocument.findByPk(id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    await document.update({
      documentName,
      documentType,
      description,
      expiryDate,
      notes
    });

    // Fetch updated document with relationships
    const updatedDocument = await StaffDocument.findByPk(id, {
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'fullName', 'email', 'employeeId']
        },
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'fullName', 'email']
        },
        {
          model: User,
          as: 'verifier',
          attributes: ['id', 'fullName', 'email']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Document updated successfully',
      document: updatedDocument
    });
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update document',
      error: error.message
    });
  }
};

/**
 * Verify a document
 */
export const verifyDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const document = await StaffDocument.findByPk(id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    await document.update({
      status: DOCUMENT_STATUSES.VERIFIED,
      verifiedBy: req.user.id,
      verificationDate: new Date(),
      notes
    });

    // Fetch updated document with relationships
    const updatedDocument = await StaffDocument.findByPk(id, {
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'fullName', 'email', 'employeeId']
        },
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'fullName', 'email']
        },
        {
          model: User,
          as: 'verifier',
          attributes: ['id', 'fullName', 'email']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Document verified successfully',
      document: updatedDocument
    });
  } catch (error) {
    console.error('Error verifying document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify document',
      error: error.message
    });
  }
};

/**
 * Reject a document
 */
export const rejectDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const document = await StaffDocument.findByPk(id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    await document.update({
      status: DOCUMENT_STATUSES.REJECTED,
      verifiedBy: req.user.id,
      verificationDate: new Date(),
      notes
    });

    // Fetch updated document with relationships
    const updatedDocument = await StaffDocument.findByPk(id, {
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'fullName', 'email', 'employeeId']
        },
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'fullName', 'email']
        },
        {
          model: User,
          as: 'verifier',
          attributes: ['id', 'fullName', 'email']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Document rejected',
      document: updatedDocument
    });
  } catch (error) {
    console.error('Error rejecting document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject document',
      error: error.message
    });
  }
};

/**
 * Delete a document
 */
export const deleteStaffDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const document = await StaffDocument.findByPk(id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    await document.destroy();

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete document',
      error: error.message
    });
  }
};

/**
 * Get document types
 */
export const getDocumentTypes = async (req, res) => {
  try {
    res.json({
      success: true,
      documentTypes: Object.values(STAFF_DOCUMENT_TYPES)
    });
  } catch (error) {
    console.error('Error fetching document types:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch document types',
      error: error.message
    });
  }
};

export default {
  getStaffDocuments,
  getDocumentById,
  uploadStaffDocument,
  updateStaffDocument,
  verifyDocument,
  rejectDocument,
  deleteStaffDocument,
  getDocumentTypes
};

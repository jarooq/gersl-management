import {
  Partner,
  PartnerContribution,
  PartnerCommunication,
  User,
  Project
} from '../models/index.js';
import { ValidationError } from '../middleware/errorHandler.js';

// ============================================
// PARTNER CRUD OPERATIONS
// ============================================

// Get all partners
export const getAllPartners = async (req, res, next) => {
  try {
    const { status, type, country } = req.query;

    const where = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (country) where.country = country;

    const partners = await Partner.findAll({
      where,
      include: [
        {
          model: PartnerContribution,
          as: 'contributions',
          separate: true,
          limit: 5,
          order: [['contributionDate', 'DESC']]
        },
        {
          model: PartnerCommunication,
          as: 'communications',
          separate: true,
          limit: 5,
          order: [['communicationDate', 'DESC']]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      count: partners.length,
      partners
    });
  } catch (error) {
    next(error);
  }
};

// Get single partner by ID
export const getPartnerById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const partner = await Partner.findByPk(id, {
      include: [
        {
          model: PartnerContribution,
          as: 'contributions',
          include: [
            { model: Project, as: 'project', attributes: ['id', 'name'] },
            { model: User, as: 'creator', attributes: ['id', 'fullName'] }
          ]
        },
        {
          model: PartnerCommunication,
          as: 'communications',
          include: [
            { model: User, as: 'creator', attributes: ['id', 'fullName'] }
          ]
        }
      ]
    });

    if (!partner) {
      throw new ValidationError('Partner not found');
    }

    res.json({
      success: true,
      partner
    });
  } catch (error) {
    next(error);
  }
};

// Create new partner
export const createPartner = async (req, res, next) => {
  try {
    const {
      name,
      logo,
      category,
      type,
      country,
      contactPerson,
      email,
      phone,
      address,
      website,
      focusAreas,
      status,
      partnershipStart,
      notes
    } = req.body;

    // Validate required fields
    if (!name || !type || !country || !contactPerson || !email) {
      throw new ValidationError('Missing required fields: name, type, country, contactPerson, email');
    }

    const partner = await Partner.create({
      name,
      logo,
      category,
      type,
      country,
      contactPerson,
      email,
      phone,
      address,
      website,
      focusAreas: focusAreas || [],
      status: status || 'Prospective',
      partnershipStart,
      totalContributions: 0,
      notes
    });

    res.status(201).json({
      success: true,
      message: 'Partner created successfully',
      partner
    });
  } catch (error) {
    next(error);
  }
};

// Update partner
export const updatePartner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const partner = await Partner.findByPk(id);
    if (!partner) {
      throw new ValidationError('Partner not found');
    }

    await partner.update(updates);

    res.json({
      success: true,
      message: 'Partner updated successfully',
      partner
    });
  } catch (error) {
    next(error);
  }
};

// Delete partner
export const deletePartner = async (req, res, next) => {
  try {
    const { id } = req.params;

    const partner = await Partner.findByPk(id);
    if (!partner) {
      throw new ValidationError('Partner not found');
    }

    await partner.destroy();

    res.json({
      success: true,
      message: 'Partner deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// PARTNER CONTRIBUTION OPERATIONS
// ============================================

// Get all contributions for a partner
export const getPartnerContributions = async (req, res, next) => {
  try {
    const { partnerId } = req.params;
    const { status, contributionType } = req.query;

    const where = { partnerId };
    if (status) where.status = status;
    if (contributionType) where.contributionType = contributionType;

    const contributions = await PartnerContribution.findAll({
      where,
      include: [
        { model: Partner, as: 'partner', attributes: ['id', 'name'] },
        { model: Project, as: 'project', attributes: ['id', 'name'] },
        { model: User, as: 'creator', attributes: ['id', 'fullName'] }
      ],
      order: [['contributionDate', 'DESC']]
    });

    res.json({
      success: true,
      count: contributions.length,
      contributions
    });
  } catch (error) {
    next(error);
  }
};

// Create partner contribution
export const createPartnerContribution = async (req, res, next) => {
  try {
    const {
      partnerId,
      contributionType,
      amount,
      currency,
      description,
      contributionDate,
      projectId,
      receiptNumber,
      status,
      notes
    } = req.body;

    // Validate required fields
    if (!partnerId || !contributionType || !description || !contributionDate) {
      throw new ValidationError('Missing required fields');
    }

    // Verify partner exists
    const partner = await Partner.findByPk(partnerId);
    if (!partner) {
      throw new ValidationError('Partner not found');
    }

    const contribution = await PartnerContribution.create({
      partnerId,
      contributionType,
      amount: amount || 0,
      currency: currency || 'LKR',
      description,
      contributionDate,
      projectId,
      receiptNumber,
      status: status || 'Pending',
      notes,
      createdBy: req.user?.id
    });

    // Update partner's total contributions if status is 'Received'
    if (contribution.status === 'Received' && amount) {
      await partner.increment('totalContributions', { by: parseFloat(amount) });
    }

    res.status(201).json({
      success: true,
      message: 'Contribution created successfully',
      contribution
    });
  } catch (error) {
    next(error);
  }
};

// Update partner contribution
export const updatePartnerContribution = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const contribution = await PartnerContribution.findByPk(id);
    if (!contribution) {
      throw new ValidationError('Contribution not found');
    }

    const oldStatus = contribution.status;
    const oldAmount = contribution.amount;

    await contribution.update(updates);

    // Update partner's total contributions if status changed to/from 'Received'
    if (oldStatus !== 'Received' && contribution.status === 'Received') {
      const partner = await Partner.findByPk(contribution.partnerId);
      await partner.increment('totalContributions', { by: parseFloat(contribution.amount) });
    } else if (oldStatus === 'Received' && contribution.status !== 'Received') {
      const partner = await Partner.findByPk(contribution.partnerId);
      await partner.decrement('totalContributions', { by: parseFloat(oldAmount) });
    } else if (oldStatus === 'Received' && contribution.status === 'Received' && oldAmount !== contribution.amount) {
      const partner = await Partner.findByPk(contribution.partnerId);
      const difference = parseFloat(contribution.amount) - parseFloat(oldAmount);
      if (difference > 0) {
        await partner.increment('totalContributions', { by: difference });
      } else {
        await partner.decrement('totalContributions', { by: Math.abs(difference) });
      }
    }

    res.json({
      success: true,
      message: 'Contribution updated successfully',
      contribution
    });
  } catch (error) {
    next(error);
  }
};

// Delete partner contribution
export const deletePartnerContribution = async (req, res, next) => {
  try {
    const { id } = req.params;

    const contribution = await PartnerContribution.findByPk(id);
    if (!contribution) {
      throw new ValidationError('Contribution not found');
    }

    // Update partner's total contributions if this was a received contribution
    if (contribution.status === 'Received') {
      const partner = await Partner.findByPk(contribution.partnerId);
      await partner.decrement('totalContributions', { by: parseFloat(contribution.amount) });
    }

    await contribution.destroy();

    res.json({
      success: true,
      message: 'Contribution deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// PARTNER COMMUNICATION OPERATIONS
// ============================================

// Get all communications for a partner
export const getPartnerCommunications = async (req, res, next) => {
  try {
    const { partnerId } = req.params;
    const { status, communicationType } = req.query;

    const where = { partnerId };
    if (status) where.status = status;
    if (communicationType) where.communicationType = communicationType;

    const communications = await PartnerCommunication.findAll({
      where,
      include: [
        { model: Partner, as: 'partner', attributes: ['id', 'name'] },
        { model: User, as: 'creator', attributes: ['id', 'fullName'] }
      ],
      order: [['communicationDate', 'DESC']]
    });

    res.json({
      success: true,
      count: communications.length,
      communications
    });
  } catch (error) {
    next(error);
  }
};

// Create partner communication
export const createPartnerCommunication = async (req, res, next) => {
  try {
    const {
      partnerId,
      communicationType,
      subject,
      details,
      communicationDate,
      followUpRequired,
      followUpDate,
      status,
      attachments
    } = req.body;

    // Validate required fields
    if (!partnerId || !communicationType || !subject || !details || !communicationDate) {
      throw new ValidationError('Missing required fields');
    }

    // Verify partner exists
    const partner = await Partner.findByPk(partnerId);
    if (!partner) {
      throw new ValidationError('Partner not found');
    }

    const communication = await PartnerCommunication.create({
      partnerId,
      communicationType,
      subject,
      details,
      communicationDate,
      followUpRequired: followUpRequired || false,
      followUpDate,
      status: status || 'Completed',
      attachments: attachments || [],
      createdBy: req.user?.id
    });

    res.status(201).json({
      success: true,
      message: 'Communication logged successfully',
      communication
    });
  } catch (error) {
    next(error);
  }
};

// Update partner communication
export const updatePartnerCommunication = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const communication = await PartnerCommunication.findByPk(id);
    if (!communication) {
      throw new ValidationError('Communication not found');
    }

    await communication.update(updates);

    res.json({
      success: true,
      message: 'Communication updated successfully',
      communication
    });
  } catch (error) {
    next(error);
  }
};

// Delete partner communication
export const deletePartnerCommunication = async (req, res, next) => {
  try {
    const { id } = req.params;

    const communication = await PartnerCommunication.findByPk(id);
    if (!communication) {
      throw new ValidationError('Communication not found');
    }

    await communication.destroy();

    res.json({
      success: true,
      message: 'Communication deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// STATISTICS
// ============================================

// Get partner statistics
export const getPartnerStats = async (req, res, next) => {
  try {
    const totalPartners = await Partner.count();
    const activePartners = await Partner.count({ where: { status: 'Active' } });
    const prospectivePartners = await Partner.count({ where: { status: 'Prospective' } });

    const totalContributions = await PartnerContribution.count();
    const receivedContributions = await PartnerContribution.count({ where: { status: 'Received' } });

    const totalCommunications = await PartnerCommunication.count();
    const pendingFollowUps = await PartnerCommunication.count({
      where: { status: 'Follow-up Required' }
    });

    res.json({
      success: true,
      stats: {
        totalPartners,
        activePartners,
        prospectivePartners,
        totalContributions,
        receivedContributions,
        totalCommunications,
        pendingFollowUps
      }
    });
  } catch (error) {
    next(error);
  }
};

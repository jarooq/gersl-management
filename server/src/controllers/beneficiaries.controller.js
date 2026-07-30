import { Op } from 'sequelize';
import {
  Beneficiary,
  BeneficiarySupport,
  User,
  Project,
  Partner
} from '../models/index.js';
import { asyncHandler, NotFoundError, ValidationError } from '../middleware/error.middleware.js';

// ============================================
// BENEFICIARY CRUD OPERATIONS
// ============================================

// Get all beneficiaries
export const getAllBeneficiaries = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, status, category, district } = req.query;
  const offset = (page - 1) * limit;

  const where = {};

  if (search) {
    where[Op.or] = [
      { fullName: { [Op.iLike]: `%${search}%` } },
      { beneficiaryId: { [Op.iLike]: `%${search}%` } }
    ];
  }

  if (status) where.status = status;
  if (category) where.category = category;
  if (district) where.district = district;

  const { count, rows: beneficiaries } = await Beneficiary.findAndCountAll({
    where,
    include: [
      {
        model: BeneficiarySupport,
        as: 'supports',
        separate: true,
        limit: 5,
        order: [['providedDate', 'DESC']]
      },
      { model: User, as: 'creator', attributes: ['id', 'fullName'] }
    ],
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['createdAt', 'DESC']]
  });

  res.json({
    success: true,
    data: {
      beneficiaries,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalRecords: count,
        limit: parseInt(limit)
      }
    }
  });
});

// Get single beneficiary by ID
export const getBeneficiaryById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const beneficiary = await Beneficiary.findByPk(id, {
    include: [
      {
        model: BeneficiarySupport,
        as: 'supports',
        include: [
          { model: Project, as: 'project', attributes: ['id', 'name'] },
          { model: Partner, as: 'partner', attributes: ['id', 'name'] },
          { model: User, as: 'creator', attributes: ['id', 'fullName'] },
          { model: User, as: 'verifier', attributes: ['id', 'fullName'] }
        ]
      },
      { model: User, as: 'creator', attributes: ['id', 'fullName'] }
    ]
  });

  if (!beneficiary) {
    throw new NotFoundError('Beneficiary not found');
  }

  res.json({
    success: true,
    data: { beneficiary }
  });
});

// Create new beneficiary
// ============================================
// GET /api/beneficiaries/similar
//   ?fullName=&district=&nic=&dateOfBirth=&contactNumber=
// Returns matches ranked by how strong the signal is. Called from the
// "Add Beneficiary" form before submit so the user gets a warning
// like "3 similar beneficiaries already exist — proceed anyway?".
//
// NOTE: separate from the legacy /check-duplicate route (NIC-only,
// different response shape) which the form's NIC-blur handler still
// consumes. Both endpoints coexist so we don't break existing UI.
//
// Scoring:
//   NIC match           +5 (strongest — national ID is unique)
//   contactNumber match +3
//   fullName + district +2
//   fullName only       +1
//
// Only rows with score >= 1 are returned; capped at 10 to keep the
// warning list scannable.
// ============================================
export const findSimilar = asyncHandler(async (req, res) => {
  const fullName      = String(req.query.fullName      || '').trim();
  const district      = String(req.query.district      || '').trim();
  const nic           = String(req.query.nic           || '').trim();
  const contactNumber = String(req.query.contactNumber || '').trim();
  const dateOfBirth   = String(req.query.dateOfBirth   || '').trim();

  // Nothing to compare against.
  if (!fullName && !nic && !contactNumber) {
    return res.json({ matches: [] });
  }

  // Build the OR clauses. iLike gives case-insensitive substring match.
  const ors = [];
  if (fullName)      ors.push({ fullName:      { [Op.iLike]: `%${fullName}%` } });
  if (nic)           ors.push({ nic });
  if (contactNumber) ors.push({ contactNumber });

  const candidates = await Beneficiary.findAll({
    where: { [Op.or]: ors },
    attributes: [
      'id', 'fullName', 'beneficiaryId', 'nic', 'contactNumber',
      'dateOfBirth', 'district', 'gender', 'status',
    ],
    limit: 30,
  });

  const scored = candidates.map((c) => {
    let score = 0;
    const reasons = [];
    if (nic && c.nic && c.nic === nic) {
      score += 5;
      reasons.push('same NIC');
    }
    if (contactNumber && c.contactNumber && c.contactNumber === contactNumber) {
      score += 3;
      reasons.push('same phone');
    }
    if (fullName && c.fullName) {
      const a = c.fullName.toLowerCase();
      const b = fullName.toLowerCase();
      if (a === b) {
        score += district && c.district && c.district.toLowerCase() === district.toLowerCase() ? 2 : 1;
        reasons.push(district && c.district && c.district.toLowerCase() === district.toLowerCase()
          ? 'same name + district'
          : 'same name');
      } else if (a.includes(b) || b.includes(a)) {
        score += district && c.district && c.district.toLowerCase() === district.toLowerCase() ? 1 : 0.5;
        reasons.push('similar name');
      }
    }
    if (dateOfBirth && c.dateOfBirth && String(c.dateOfBirth).slice(0, 10) === dateOfBirth.slice(0, 10)) {
      score += 1;
      reasons.push('same DOB');
    }
    return {
      id: c.id,
      fullName: c.fullName,
      beneficiaryId: c.beneficiaryId,
      nic: c.nic,
      contactNumber: c.contactNumber,
      district: c.district,
      gender: c.gender,
      status: c.status,
      score,
      reasons,
    };
  })
  .filter((x) => x.score >= 1)
  .sort((a, b) => b.score - a.score)
  .slice(0, 10);

  res.json({ matches: scored });
});

export const createBeneficiary = asyncHandler(async (req, res) => {
  const {
    fullName,
    beneficiaryId,
    dateOfBirth,
    age,
    gender,
    nic,
    contactNumber,
    email,
    address,
    province,
    district,
    dsDivision,
    gnDivision,
    category,
    beneficiaryType,
    vulnerabilityScore,
    status,
    registrationDate,
    householdSize,
    monthlyIncome,
    employmentStatus,
    educationLevel,
    healthStatus,
    disabilities,
    notes,
    photoUrl
  } = req.body;

  // Validate required fields
  if (!fullName || !beneficiaryId || !gender || !contactNumber || !address || !registrationDate) {
    throw new ValidationError('Missing required fields');
  }

  // Check if beneficiaryId already exists
  const existing = await Beneficiary.findOne({ where: { beneficiaryId } });
  if (existing) {
    throw new ValidationError('Beneficiary ID already exists');
  }

  const beneficiary = await Beneficiary.create({
    fullName,
    beneficiaryId,
    dateOfBirth,
    age,
    gender,
    nic,
    contactNumber,
    email,
    address,
    province,
    district,
    dsDivision,
    gnDivision,
    category: category || 'Individual',
    beneficiaryType,
    vulnerabilityScore: vulnerabilityScore || 0,
    status: status || 'Active',
    registrationDate,
    householdSize,
    monthlyIncome,
    employmentStatus,
    educationLevel,
    healthStatus,
    disabilities,
    notes,
    photoUrl,
    createdBy: req.user?.id
  });

  res.status(201).json({
    success: true,
    message: 'Beneficiary created successfully',
    data: { beneficiary }
  });
});

// Update beneficiary
export const updateBeneficiary = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const beneficiary = await Beneficiary.findByPk(id);
  if (!beneficiary) {
    throw new NotFoundError('Beneficiary not found');
  }

  // If beneficiaryId is being updated, check it doesn't conflict
  if (updates.beneficiaryId && updates.beneficiaryId !== beneficiary.beneficiaryId) {
    const existing = await Beneficiary.findOne({ where: { beneficiaryId: updates.beneficiaryId } });
    if (existing) {
      throw new ValidationError('Beneficiary ID already exists');
    }
  }

  await beneficiary.update(updates);

  res.json({
    success: true,
    message: 'Beneficiary updated successfully',
    data: { beneficiary }
  });
});

// Delete beneficiary
export const deleteBeneficiary = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const beneficiary = await Beneficiary.findByPk(id);
  if (!beneficiary) {
    throw new NotFoundError('Beneficiary not found');
  }

  await beneficiary.destroy();

  res.json({
    success: true,
    message: 'Beneficiary deleted successfully'
  });
});

// ============================================
// BENEFICIARY SUPPORT OPERATIONS
// ============================================

// Get all support for a beneficiary
export const getBeneficiarySupport = asyncHandler(async (req, res) => {
  const { beneficiaryId } = req.params;
  const { status, supportType } = req.query;

  const where = { beneficiaryId };
  if (status) where.status = status;
  if (supportType) where.supportType = supportType;

  const supports = await BeneficiarySupport.findAll({
    where,
    include: [
      { model: Beneficiary, as: 'beneficiary', attributes: ['id', 'fullName', 'beneficiaryId'] },
      { model: Project, as: 'project', attributes: ['id', 'name'] },
      { model: Partner, as: 'partner', attributes: ['id', 'name'] },
      { model: User, as: 'creator', attributes: ['id', 'fullName'] },
      { model: User, as: 'verifier', attributes: ['id', 'fullName'] }
    ],
    order: [['providedDate', 'DESC']]
  });

  res.json({
    success: true,
    data: {
      supports,
      count: supports.length
    }
  });
});

// Create beneficiary support
export const createBeneficiarySupport = asyncHandler(async (req, res) => {
  const {
    beneficiaryId,
    supportType,
    supportCategory,
    description,
    amount,
    currency,
    quantity,
    unit,
    providedDate,
    projectId,
    partnerId,
    status,
    deliveryMethod,
    receiptNumber,
    verificationStatus,
    notes,
    attachments
  } = req.body;

  // Validate required fields
  if (!beneficiaryId || !supportType || !description || !providedDate) {
    throw new ValidationError('Missing required fields');
  }

  // Verify beneficiary exists
  const beneficiary = await Beneficiary.findByPk(beneficiaryId);
  if (!beneficiary) {
    throw new NotFoundError('Beneficiary not found');
  }

  const support = await BeneficiarySupport.create({
    beneficiaryId,
    supportType,
    supportCategory,
    description,
    amount: amount || 0,
    currency: currency || 'LKR',
    quantity,
    unit,
    providedDate,
    projectId,
    partnerId,
    status: status || 'Planned',
    deliveryMethod,
    receiptNumber,
    verificationStatus: verificationStatus || 'Pending',
    notes,
    attachments: attachments || [],
    createdBy: req.user?.id
  });

  res.status(201).json({
    success: true,
    message: 'Support created successfully',
    data: { support }
  });
});

// Update beneficiary support
export const updateBeneficiarySupport = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const support = await BeneficiarySupport.findByPk(id);
  if (!support) {
    throw new NotFoundError('Support record not found');
  }

  await support.update(updates);

  res.json({
    success: true,
    message: 'Support updated successfully',
    data: { support }
  });
});

// Delete beneficiary support
export const deleteBeneficiarySupport = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const support = await BeneficiarySupport.findByPk(id);
  if (!support) {
    throw new NotFoundError('Support record not found');
  }

  await support.destroy();

  res.json({
    success: true,
    message: 'Support deleted successfully'
  });
});

// Verify support
export const verifySupport = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { verificationStatus, notes } = req.body;

  const support = await BeneficiarySupport.findByPk(id);
  if (!support) {
    throw new NotFoundError('Support record not found');
  }

  await support.update({
    verificationStatus: verificationStatus || 'Verified',
    verifiedBy: req.user?.id,
    verifiedDate: new Date(),
    notes: notes || support.notes
  });

  res.json({
    success: true,
    message: 'Support verified successfully',
    data: { support }
  });
});

// ============================================
// STATISTICS
// ============================================

// Get beneficiary statistics
export const getBeneficiaryStats = asyncHandler(async (req, res) => {
  const { district, category } = req.query;

  const where = {};
  if (district) where.district = district;
  if (category) where.category = category;

  const total = await Beneficiary.count({ where });

  const byStatus = await Beneficiary.findAll({
    where,
    attributes: [
      'status',
      [Beneficiary.sequelize.fn('COUNT', Beneficiary.sequelize.col('id')), 'count']
    ],
    group: ['status']
  });

  const byCategory = await Beneficiary.findAll({
    where,
    attributes: [
      'category',
      [Beneficiary.sequelize.fn('COUNT', Beneficiary.sequelize.col('id')), 'count']
    ],
    group: ['category']
  });

  const byDistrict = await Beneficiary.findAll({
    where,
    attributes: [
      'district',
      [Beneficiary.sequelize.fn('COUNT', Beneficiary.sequelize.col('id')), 'count']
    ],
    group: ['district'],
    order: [[Beneficiary.sequelize.fn('COUNT', Beneficiary.sequelize.col('id')), 'DESC']]
  });

  const totalSupport = await BeneficiarySupport.count();
  const completedSupport = await BeneficiarySupport.count({ where: { status: 'Completed' } });

  res.json({
    success: true,
    data: {
      total,
      byStatus: byStatus.map(s => ({
        status: s.status,
        count: parseInt(s.get('count'))
      })),
      byCategory: byCategory.map(c => ({
        category: c.category,
        count: parseInt(c.get('count'))
      })),
      byDistrict: byDistrict.map(d => ({
        district: d.district,
        count: parseInt(d.get('count'))
      })),
      totalSupport,
      completedSupport
    }
  });
});

// ============================================
// SRI LANKAN ADMINISTRATIVE DIVISIONS
// ============================================

const SRI_LANKAN_DIVISIONS = {
  "Colombo": ["Colombo", "Kolonnawa", "Kaduwela", "Homagama", "Seethawaka (Hanwella)", "Padukka", "Maharagama", "Sri Jayawardanapura Kotte", "Thimbirigasyaya", "Dehiwala", "Ratmalana", "Moratuwa", "Kesbewa"],
  "Gampaha": ["Negombo", "Katana", "Divulapitiya", "Mirigama", "Minuwangoda", "Wattala", "Ja-Ela", "Gampaha", "Attanagalla", "Dompe", "Mahara", "Kelaniya", "Biyagama"],
  "Kalutara": ["Panadura", "Bandaragama", "Horana", "Ingiriya", "Bulathsinhala", "Madurawala", "Millaniya", "Kalutara", "Beruwala", "Dodangoda", "Mathugama", "Agalawatta", "Palindanuwara", "Walallavita"],
  "Kandy": ["Thumpane", "Pujapitiya", "Ganga Ihala Korale", "Yatinuwara", "Udunuwara", "Teldeniya", "Kundasale", "Hewaheta", "Medadumbara", "Minipe", "Pathahewaheta", "Panwila", "Doluwa"],
  "Matale": ["Matale", "Ukuwela", "Rattota", "Yatawatta", "Naula", "Pallepola", "Laggala Pallegama", "Galewala"],
  "Nuwara Eliya": ["Nuwara Eliya", "Hanguranketha", "Kotmale", "Walapane", "Ambagamuwa"],
  "Galle": ["Galle", "Akmeemana", "Baddegama", "Ambalangoda", "Benthota", "Elpitiya", "Niyagama", "Gonapinuwala", "Neluwa", "Nagoda", "Bope Poddala", "Karapitiya", "Thawalama", "Welivitiya-Divithura", "Yakkalamulla"],
  "Matara": ["Matara", "Weligama", "Hakmana", "Mulatiyana", "Deniyaya", "Akuressa", "Kamburupitiya", "Pasgoda", "Kekanadurra", "Pitabeddara"],
  "Hambantota": ["Hambantota", "Beliatta", "Thissamaharama", "Weeraketiya", "Katuwana", "Tangalle", "Ambalantota", "Lunugamwehera"],
  "Jaffna": ["Jaffna", "Nallur", "Kopay", "Sandilipay", "Tellipalai", "Chavakachcheri", "Point Pedro", "Karainagar", "Kayts", "Velanai", "Vadamarachchi North", "Vadamarachchi South-West", "Delft", "Thondamanaru"],
  "Kilinochchi": ["Kilinochchi", "Karachchi", "Pallai", "Poonakary"],
  "Mannar": ["Mannar", "Madhu", "Nanaddan", "Musali", "Manthai West"],
  "Mullaitivu": ["Mullaitivu", "Welioya", "Oddusuddan", "Thunukkai", "Puthukudiyiruppu", "Manthai East"],
  "Vavuniya": ["Vavuniya", "Vavuniya South", "Vengalacheddikulam", "Vavuniya North"],
  "Puttalam": ["Puttalam", "Chilaw", "Wennappuwa", "Anamaduwa", "Nattandiya", "Mahawewa", "Mundal", "Kalpitiya", "Dankotuwa", "Mahakumbukkadawala", "Vanathavilluwa", "Nawagattegama", "Pallama"],
  "Kurunegala": ["Kurunegala", "Galgamuwa", "Rasnayakapura", "Bingiriya", "Maho", "Wariyapola", "Pannala", "Kuliyapitiya", "Alawwa", "Nikaweratiya", "Polgahawela", "Kobeigane", "Dodangaslanda", "Rideegama", "Giribawa", "Katugampola", "Ganewatta", "Ibbagamuwa", "Narammala", "Ambanpola", "Bamunakotuwa", "Mawathagama"],
  "Anuradhapura": ["Anuradhapura East", "Anuradhapura West", "Kekirawa", "Thirappane", "Mihintale", "Medawachchiya", "Galnewa", "Palagala", "Rambewa", "Talawa", "Palugaswewa", "Nuwaragam Palatha Central", "Nuwaragam Palatha East", "Horowpothana", "Galenbidunuwewa", "Kahatagasdigiliya"],
  "Polonnaruwa": ["Polonnaruwa", "Medirigiriya", "Hingurakgoda", "Dimbulagala", "Lankapura", "Welikanda", "Thamankaduwa", "Elahera"],
  "Badulla": ["Badulla", "Mahiyanganaya", "Welimada", "Kandaketiya", "Lunugala", "Uva-Paranagama", "Meegahakiula", "Passara", "Soranathota", "Bandarawela", "Hali-Ela", "Haldummulla", "Haputale", "Ella"],
  "Monaragala": ["Monaragala", "Bibile", "Medagama", "Badalkumbura", "Katharagama", "Thanamalvila", "Madulla", "Wellawaya", "Buttala", "Sevanagala", "Siyambalanduwa"],
  "Ratnapura": ["Ratnapura", "Eheliyagoda", "Kuruvita", "Elapatha", "Balangoda", "Imbulpe", "Kahawatta", "Kolonna", "Pelmadulla", "Weligepola", "Godakawela", "Opanayaka", "Kalawana", "Ayagama", "Nivithigala", "Kiriella"],
  "Kegalle": ["Kegalle", "Yatiyantota", "Mawanella", "Aranayaka", "Rambukkana", "Warakapola", "Galigamuwa", "Bulathkohupitiya", "Dehiovita", "Ruwanwella"],
  "Trincomalee": ["Trincomalee", "Mutur", "Seruvila", "Kinniya", "Kuchchaveli", "Thampalakamam", "Kantalai", "Padavi Sri Pura", "Gomarankadawala", "Town & Gravets"],
  "Batticaloa": ["Batticaloa", "Eravur Town", "Koralai Pattu North", "Koralai Pattu South", "Koralai Pattu West", "Kattankudy", "Eravur Pattu", "Manmunai North", "Manmunai Pattu", "Manmunai South", "Manmunai South-West", "Porativu Pattu", "Kiran"],
  "Ampara": ["Ampara", "Dehiattakandiya", "Padiyathalawa", "Maha Oya", "Damana", "Navithanvely", "Karaitivu", "Sainthamaruthu", "Ninthavur", "Samanthurai", "Kalmunai", "Akkaraipattu", "Alayadivembu", "Addalachchenai", "Irakkamam", "Lahugala", "Potuvil", "Pottuvil"]
};

// Get all districts
export const getDistricts = asyncHandler(async (req, res) => {
  const districts = Object.keys(SRI_LANKAN_DIVISIONS).sort();

  res.json({
    success: true,
    data: { districts }
  });
});

// Get divisions by district
export const getDivisions = asyncHandler(async (req, res) => {
  const { district } = req.query;

  if (!district) {
    throw new ValidationError('District parameter is required');
  }

  const divisions = SRI_LANKAN_DIVISIONS[district];

  if (!divisions) {
    throw new NotFoundError(`District '${district}' not found`);
  }

  res.json({
    success: true,
    data: { divisions }
  });
});

// Get GN divisions by DS division
export const getGNDivisions = asyncHandler(async (req, res) => {
  const { ds_division } = req.query;

  if (!ds_division) {
    throw new ValidationError('DS division parameter is required');
  }

  // For now, return empty array as GN divisions data is not populated
  // This can be extended when GN division data is available
  res.json({
    success: true,
    data: { gn_divisions: [] }
  });
});

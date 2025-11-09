import sequelize from '../config/database.js';
import { User, Orphan, Project, Expense, Staff, CBOPartner, Partner, Indicator } from '../models/index.js';

// ============================================
// SEED USERS
// ============================================
const seedUsers = async () => {
  console.log('Seeding users...');

  const users = [
    {
      username: 'admin',
      email: 'admin@gersl.org',
      password: 'admin123', // Will be hashed by model hook
      fullName: 'System Administrator',
      role: 'Admin',
      phone: '+94771234567',
      status: 'Active'
    },
    {
      username: 'ceo',
      email: 'ceo@gersl.org',
      password: 'ceo123',
      fullName: 'Chief Executive Officer',
      role: 'CEO',
      phone: '+94771234568',
      status: 'Active'
    },
    {
      username: 'progmanager',
      email: 'pm@gersl.org',
      password: 'pm123',
      fullName: 'Programme Manager',
      role: 'Programme Manager',
      phone: '+94771234569',
      status: 'Active'
    },
    {
      username: 'finmanager',
      email: 'fm@gersl.org',
      password: 'fm123',
      fullName: 'Finance Manager',
      role: 'Finance Manager',
      phone: '+94771234570',
      status: 'Active'
    },
    {
      username: 'fieldofficer',
      email: 'fo@gersl.org',
      password: 'fo123',
      fullName: 'Field Officer',
      role: 'Field Officer',
      phone: '+94771234571',
      status: 'Active'
    }
  ];

  await User.bulkCreate(users, { individualHooks: true });
  console.log(`✅ Created ${users.length} users`);
};

// ============================================
// SEED ORPHANS
// ============================================
const seedOrphans = async () => {
  console.log('Seeding orphans...');

  const coordinator = await User.findOne({ where: { role: 'Programme Manager' } });
  const approver = await User.findOne({ where: { role: 'CEO' } });

  const orphans = [
    {
      fullName: 'Mohamed Ali Hassan',
      dateOfBirth: '2010-05-15',
      age: 14,
      district: 'Ampara',
      guardianName: 'Fatima Hassan',
      guardianNIC: '785612345V',
      contactNumber: '+94771234580',
      address: '123, Main Street, Ampara',
      schoolName: 'Ampara Central College',
      currentGrade: 'Grade 9',
      stipendAmount: 5000.00,
      status: 'Active',
      coordinatorId: coordinator.id,
      approvalStatus: 'Approved',
      approvedBy: approver.id,
      approvalDate: new Date()
    },
    {
      fullName: 'Ayesha Zahara',
      dateOfBirth: '2012-08-20',
      age: 12,
      district: 'Batticaloa',
      guardianName: 'Ibrahim Zahara',
      guardianNIC: '805623456V',
      contactNumber: '+94771234581',
      address: '456, Beach Road, Batticaloa',
      schoolName: 'Batticaloa Girls School',
      currentGrade: 'Grade 7',
      stipendAmount: 4500.00,
      status: 'Active',
      coordinatorId: coordinator.id,
      approvalStatus: 'Approved',
      approvedBy: approver.id,
      approvalDate: new Date()
    },
    {
      fullName: 'Ahmed Rashid',
      dateOfBirth: '2011-03-10',
      age: 13,
      district: 'Trincomalee',
      guardianName: 'Rashid Mohammed',
      guardianNIC: '795634567V',
      contactNumber: '+94771234582',
      address: '789, Harbour Road, Trincomalee',
      schoolName: 'Trincomalee National School',
      currentGrade: 'Grade 8',
      stipendAmount: 5000.00,
      status: 'Active',
      coordinatorId: coordinator.id,
      approvalStatus: 'Approved',
      approvedBy: approver.id,
      approvalDate: new Date()
    }
  ];

  await Orphan.bulkCreate(orphans);
  console.log(`✅ Created ${orphans.length} orphans`);
};

// ============================================
// SEED PROJECTS
// ============================================
const seedProjects = async () => {
  console.log('Seeding projects...');

  const manager = await User.findOne({ where: { role: 'Programme Manager' } });

  const projects = [
    {
      name: 'Educational Support Programme 2025',
      programmeArea: 'Education',
      budget: 1000000.00,
      spent: 350000.00,
      status: 'Implementation',
      progress: 35,
      beneficiaries: 150,
      targetBeneficiaries: 200,
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      location: 'Eastern Province',
      donor: 'UNICEF',
      description: 'Providing educational support to underprivileged children',
      managerId: manager.id
    },
    {
      name: 'Livelihood Development Initiative',
      programmeArea: 'Livelihood',
      budget: 750000.00,
      spent: 125000.00,
      status: 'Planning',
      progress: 15,
      beneficiaries: 50,
      targetBeneficiaries: 100,
      startDate: '2025-03-01',
      endDate: '2025-10-31',
      location: 'Northern Province',
      donor: 'World Bank',
      description: 'Supporting families with livelihood opportunities',
      managerId: manager.id
    }
  ];

  await Project.bulkCreate(projects);
  console.log(`✅ Created ${projects.length} projects`);
};

// ============================================
// SEED EXPENSES
// ============================================
const seedExpenses = async () => {
  console.log('Seeding expenses...');

  const project = await Project.findOne();
  const approver = await User.findOne({ where: { role: 'Finance Manager' } });

  const expenses = [
    {
      date: '2025-01-15',
      category: 'Education Materials',
      description: 'School supplies and textbooks',
      amount: 50000.00,
      projectId: project.id,
      status: 'Approved',
      approvedBy: approver.id,
      approvalDate: new Date(),
      paymentMethod: 'Bank Transfer'
    },
    {
      date: '2025-02-10',
      category: 'Transportation',
      description: 'Field visit transportation',
      amount: 15000.00,
      projectId: project.id,
      status: 'Pending'
    }
  ];

  await Expense.bulkCreate(expenses);
  console.log(`✅ Created ${expenses.length} expenses`);
};

// ============================================
// SEED STAFF
// ============================================
const seedStaff = async () => {
  console.log('Seeding staff...');

  const user = await User.findOne({ where: { role: 'Programme Manager' } });

  const staff = [
    {
      fullName: 'Sarah Johnson',
      email: 'sarah@gersl.org',
      phone: '+94771234590',
      nic: '885645678V',
      position: 'Programme Manager',
      department: 'Programmes',
      salary: 75000.00,
      joinDate: '2023-01-15',
      status: 'Active',
      employmentType: 'Full-Time',
      userId: user.id
    }
  ];

  await Staff.bulkCreate(staff);
  console.log(`✅ Created ${staff.length} staff members`);
};

// ============================================
// SEED CBO PARTNERS
// ============================================
const seedCBOPartners = async () => {
  console.log('Seeding CBO partners...');

  const cboPartners = [
    {
      name: 'Community Development Foundation',
      acronym: 'CDF',
      type: 'NGO',
      district: 'Ampara',
      registrationNumber: 'CBO/2020/001',
      registrationDate: '2020-01-15',
      contactPerson: 'John Doe',
      email: 'info@cdf.org',
      phone: '+94771234600',
      address: '100, Central Road, Ampara',
      status: 'Active',
      capacity: 'High'
    }
  ];

  await CBOPartner.bulkCreate(cboPartners);
  console.log(`✅ Created ${cboPartners.length} CBO partners`);
};

// ============================================
// SEED PARTNERS
// ============================================
const seedPartners = async () => {
  console.log('Seeding partners...');

  const partners = [
    {
      name: 'UNICEF Sri Lanka',
      type: 'International Organization',
      country: 'Sri Lanka',
      contactPerson: 'Jane Smith',
      email: 'contact@unicef.lk',
      phone: '+94112345678',
      status: 'Active',
      partnershipStart: '2020-01-01',
      totalContributions: 5000000.00
    }
  ];

  await Partner.bulkCreate(partners);
  console.log(`✅ Created ${partners.length} partners`);
};

// ============================================
// SEED INDICATORS
// ============================================
const seedIndicators = async () => {
  console.log('Seeding indicators...');

  const project = await Project.findOne();

  const indicators = [
    {
      code: 'EDU-001',
      name: 'Number of children enrolled in education programme',
      type: 'Output',
      category: 'Education',
      projectId: project.id,
      baseline: 0,
      target: 200,
      current: 150,
      unit: 'Children',
      frequency: 'Monthly',
      dataSource: 'Programme Records',
      responsible: 'Programme Manager',
      status: 'On Track'
    }
  ];

  await Indicator.bulkCreate(indicators);
  console.log(`✅ Created ${indicators.length} indicators`);
};

// ============================================
// MAIN SEED FUNCTION
// ============================================
const seedDatabase = async () => {
  try {
    console.log('');
    console.log('🌱 ====================================');
    console.log('   Database Seeding Started');
    console.log('   ====================================');
    console.log('');

    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Sync database (create tables)
    console.log('📦 Syncing database...');
    await sequelize.sync({ force: true }); // WARNING: This will drop all tables
    console.log('✅ Database synced');
    console.log('');

    // Seed data in order (respecting foreign key constraints)
    await seedUsers();
    await seedOrphans();
    await seedProjects();
    await seedExpenses();
    await seedStaff();
    await seedCBOPartners();
    await seedPartners();
    await seedIndicators();

    console.log('');
    console.log('🎉 ====================================');
    console.log('   Database Seeding Completed!');
    console.log('   ====================================');
    console.log('');
    console.log('📋 Test Credentials:');
    console.log('   Admin:    admin / admin123');
    console.log('   CEO:      ceo / ceo123');
    console.log('   PM:       progmanager / pm123');
    console.log('   Finance:  finmanager / fm123');
    console.log('   Field:    fieldofficer / fo123');
    console.log('   ====================================');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

// Run seeding
seedDatabase();

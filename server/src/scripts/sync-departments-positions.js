import sequelize from '../config/database.js';
import { Department, Position } from '../models/index.js';

async function syncAndSeed() {
  try {
    console.log('🔄 Syncing departments and positions tables...');

    // Sync the tables (create them if they don't exist)
    await Department.sync({ alter: true });
    console.log('✅ Departments table synced');

    await Position.sync({ alter: true });
    console.log('✅ Positions table synced');

    // Check if departments already exist
    const deptCount = await Department.count();
    if (deptCount > 0) {
      console.log(`\n📊 Found ${deptCount} existing departments, skipping seed`);
    } else {
      console.log('\n📝 Seeding departments...');

      const departments = await Department.bulkCreate([
        { name: 'Board of Directors (BOD)', code: 'BOD', color: 'from-purple-500 to-indigo-600', icon: 'users', isActive: true, sortOrder: 1 },
        { name: 'Executive', code: 'EXEC', color: 'from-blue-500 to-cyan-600', icon: 'briefcase', isActive: true, sortOrder: 2 },
        { name: 'Fund Development', code: 'FUND', color: 'from-green-500 to-emerald-600', icon: 'trending-up', isActive: true, sortOrder: 3 },
        { name: 'Operations', code: 'OPS', color: 'from-orange-500 to-red-600', icon: 'settings', isActive: true, sortOrder: 4 },
        { name: 'Finance', code: 'FIN', color: 'from-yellow-500 to-orange-600', icon: 'dollar-sign', isActive: true, sortOrder: 5 },
        { name: 'HR and Admin', code: 'HR', color: 'from-pink-500 to-rose-600', icon: 'users', isActive: true, sortOrder: 6 },
        { name: 'Media', code: 'MEDIA', color: 'from-indigo-500 to-purple-600', icon: 'camera', isActive: true, sortOrder: 7 },
        { name: 'Water and Sanitation', code: 'WASH', color: 'from-blue-400 to-cyan-500', icon: 'droplet', isActive: true, sortOrder: 8 },
        { name: 'Orphan Care and Development', code: 'ORPHAN', color: 'from-rose-500 to-pink-600', icon: 'heart', isActive: true, sortOrder: 9 },
        { name: 'Income Generation Project', code: 'IGP', color: 'from-green-400 to-emerald-500', icon: 'briefcase', isActive: true, sortOrder: 10 },
        { name: 'Seasonal Projects', code: 'SEASON', color: 'from-amber-500 to-orange-500', icon: 'calendar', isActive: true, sortOrder: 11 },
        { name: 'Education and Health', code: 'EDU-HEALTH', color: 'from-cyan-500 to-blue-600', icon: 'book-open', isActive: true, sortOrder: 12 }
      ], { ignoreDuplicates: true });

      console.log(`✅ Created ${departments.length} departments`);
    }

    // Check if positions already exist
    const posCount = await Position.count();
    if (posCount > 0) {
      console.log(`\n📊 Found ${posCount} existing positions, skipping seed`);
    } else {
      console.log('\n📝 Seeding positions...');

      const positions = await Position.bulkCreate([
        // Executive Level
        { title: 'Executive Director', code: 'ED', level: 'Executive', isActive: true, sortOrder: 1 },
        { title: 'Deputy Director', code: 'DD', level: 'Executive', isActive: true, sortOrder: 2 },

        // Senior Management
        { title: 'Senior Manager', code: 'SM', level: 'Senior', isActive: true, sortOrder: 10 },
        { title: 'Program Manager', code: 'PM', level: 'Senior', isActive: true, sortOrder: 11 },
        { title: 'Finance Manager', code: 'FM', level: 'Senior', isActive: true, sortOrder: 12 },
        { title: 'HR Manager', code: 'HRM', level: 'Senior', isActive: true, sortOrder: 13 },
        { title: 'Operations Manager', code: 'OM', level: 'Senior', isActive: true, sortOrder: 14 },
        { title: 'MEAL Manager', code: 'MM', level: 'Senior', isActive: true, sortOrder: 15 },

        // Mid-Level
        { title: 'Project Coordinator', code: 'PC', level: 'Mid', isActive: true, sortOrder: 20 },
        { title: 'Program Coordinator', code: 'PROGC', level: 'Mid', isActive: true, sortOrder: 21 },
        { title: 'Finance Coordinator', code: 'FC', level: 'Mid', isActive: true, sortOrder: 22 },
        { title: 'HR Coordinator', code: 'HRC', level: 'Mid', isActive: true, sortOrder: 23 },
        { title: 'Communications Coordinator', code: 'COMC', level: 'Mid', isActive: true, sortOrder: 24 },

        // Officers
        { title: 'Project Officer', code: 'PO', level: 'Mid', isActive: true, sortOrder: 30 },
        { title: 'Finance Officer', code: 'FO', level: 'Mid', isActive: true, sortOrder: 31 },
        { title: 'HR Officer', code: 'HRO', level: 'Mid', isActive: true, sortOrder: 32 },
        { title: 'Operations Officer', code: 'OO', level: 'Mid', isActive: true, sortOrder: 33 },
        { title: 'MEAL Officer', code: 'MEALO', level: 'Mid', isActive: true, sortOrder: 34 },
        { title: 'Communications Officer', code: 'COMO', level: 'Mid', isActive: true, sortOrder: 35 },
        { title: 'Field Officer', code: 'FLDO', level: 'Mid', isActive: true, sortOrder: 36 },

        // Entry Level
        { title: 'Assistant Officer', code: 'AO', level: 'Entry', isActive: true, sortOrder: 40 },
        { title: 'Admin Assistant', code: 'AA', level: 'Entry', isActive: true, sortOrder: 41 },
        { title: 'Office Assistant', code: 'OA', level: 'Entry', isActive: true, sortOrder: 42 },

        // Specialized
        { title: 'Accountant', code: 'ACC', level: 'Mid', isActive: true, sortOrder: 50 },
        { title: 'IT Officer', code: 'ITO', level: 'Mid', isActive: true, sortOrder: 51 },
        { title: 'Driver', code: 'DRV', level: 'Entry', isActive: true, sortOrder: 52 },
        { title: 'Security Guard', code: 'SEC', level: 'Entry', isActive: true, sortOrder: 53 }
      ], { ignoreDuplicates: true });

      console.log(`✅ Created ${positions.length} positions`);
    }

    // Verify the data
    const finalDeptCount = await Department.count();
    const finalPosCount = await Position.count();

    console.log('\n📊 Final counts:');
    console.log(`   Departments: ${finalDeptCount}`);
    console.log(`   Positions: ${finalPosCount}`);

    console.log('\n🎉 Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the migration
syncAndSeed();

import sequelize from '../config/database.js';
import { User } from '../models/index.js';

/**
 * Seed production database with initial admin user
 * This is safe to run - it won't delete existing data
 * Usage: node src/scripts/seedProduction.js
 */

async function seedProduction() {
  try {
    console.log('🌱 Starting production database seeding...');
    console.log('');

    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Sync models (create tables if they don't exist, but don't drop existing ones)
    console.log('📦 Syncing database models...');
    await sequelize.sync({ alter: false }); // Safe - only creates missing tables
    console.log('✅ Models synced');
    console.log('');

    // Check if admin user already exists
    console.log('🔍 Checking for existing admin user...');
    const existingAdmin = await User.findOne({ where: { username: 'admin' } });

    if (existingAdmin) {
      console.log('ℹ️  Admin user already exists!');
      console.log('   Username: admin');
      console.log('   Email:', existingAdmin.email);
      console.log('   Role:', existingAdmin.role);
      console.log('');
      console.log('✅ Database is ready - no changes needed.');
      process.exit(0);
    }

    // Create admin user
    console.log('👤 Creating admin user...');
    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@gersl.org',
      password: 'Ger@2025',
      fullName: 'System Administrator',
      role: 'Admin',
      department: 'Governance',
      hierarchyLevel: 1,
      phone: '+94771234567',
      status: 'Active'
    });

    console.log('');
    console.log('🎉 ====================================');
    console.log('   Production Seeding Completed!');
    console.log('   ====================================');
    console.log('');
    console.log('📋 Login Credentials:');
    console.log('   Username: admin');
    console.log('   Password: Ger@2025');
    console.log('   Email:    admin@gersl.org');
    console.log('   Role:     Admin (Full Permissions)');
    console.log('   ====================================');
    console.log('');
    console.log('⚠️  IMPORTANT: Change the password after first login!');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    console.error('');
    console.error('Error details:', error.message);
    process.exit(1);
  }
}

// Run seeding
seedProduction();

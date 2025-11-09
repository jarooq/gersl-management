import User from '../models/User.js';
import sequelize from '../config/database.js';

/**
 * Create an admin user with all permissions
 * Usage: node src/scripts/createAdminUser.js
 */

async function createAdminUser() {
  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('Database connection established.');

    // Sync the User model
    await User.sync();

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ where: { username: 'admin' } });

    if (existingAdmin) {
      console.log('Admin user already exists!');
      console.log('Username: admin');
      console.log('Email:', existingAdmin.email);
      console.log('Full Name:', existingAdmin.fullName);
      console.log('Role:', existingAdmin.role);
      console.log('\nIf you want to reset the password, please delete this user first.');
      process.exit(0);
    }

    // Create admin user
    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@gersl.org',
      password: 'Admin@123',
      fullName: 'System Administrator',
      role: 'Admin',
      department: 'Governance',
      hierarchyLevel: 1,
      phone: '+1234567890',
      status: 'Active'
    });

    console.log('\n✓ Admin user created successfully!');
    console.log('================================');
    console.log('Username: admin');
    console.log('Email: admin@gersl.org');
    console.log('Password: Admin@123');
    console.log('Role: Admin (Full Permissions)');
    console.log('================================');
    console.log('\nIMPORTANT: Please change the password after first login!');
    console.log('\nYou can now login with these credentials.');

  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

createAdminUser();

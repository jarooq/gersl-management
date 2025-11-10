import sequelize from '../config/database.js';
import { User } from '../models/index.js';

/**
 * Reset admin password
 * Usage: node src/scripts/resetAdminPassword.js
 */

async function resetAdminPassword() {
  try {
    console.log('🔐 Resetting admin password...');
    console.log('');

    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Find admin user
    const admin = await User.findOne({ where: { username: 'admin' } });

    if (!admin) {
      console.log('❌ Admin user not found!');
      console.log('   Please run seedProduction.js first.');
      process.exit(1);
    }

    console.log('👤 Found admin user:', admin.username);

    // Update password (will be hashed by beforeUpdate hook)
    admin.password = 'Ger@2025';
    await admin.save();

    console.log('');
    console.log('🎉 ====================================');
    console.log('   Password Reset Successful!');
    console.log('   ====================================');
    console.log('');
    console.log('📋 New Login Credentials:');
    console.log('   Username: admin');
    console.log('   Password: Ger@2025');
    console.log('   ====================================');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run password reset
resetAdminPassword();

import sequelize from '../config/database.js';
import User from '../models/User.js';

const listUsers = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Fetch all users
    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'fullName', 'role', 'status'],
      order: [['createdAt', 'ASC']]
    });

    console.log('\n📋 Users in database:');
    console.log('=====================================');

    if (users.length === 0) {
      console.log('❌ No users found in database!');
      console.log('\nYou need to create an admin user first.');
      console.log('Run: node src/scripts/createAdminUser.js');
    } else {
      users.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.username}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Full Name: ${user.fullName}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Status: ${user.status}`);
        console.log(`   ID: ${user.id}`);
      });
      console.log('\n=====================================');
      console.log(`Total users: ${users.length}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

listUsers();

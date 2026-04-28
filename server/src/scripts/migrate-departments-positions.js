import sequelize from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  try {
    console.log('🔄 Starting migration for departments and positions tables...');

    // Read the SQL file
    const sqlFilePath = path.join(__dirname, '../migrations/create-departments-positions.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');

    // Split by semicolons and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`\n[${i + 1}/${statements.length}] Executing...`);
          await sequelize.query(statement + ';');
          console.log(`✅ Statement ${i + 1} executed successfully`);
        } catch (error) {
          // Ignore "already exists" errors
          if (error.message.includes('already exists') ||
              error.message.includes('duplicate') ||
              error.message.includes('ON CONFLICT')) {
            console.log(`⚠️  Statement ${i + 1} skipped (already exists)`);
          } else {
            console.error(`❌ Error in statement ${i + 1}:`, error.message);
            throw error;
          }
        }
      }
    }

    console.log('\n✅ Migration completed successfully!');

    // Verify the data
    console.log('\n📊 Verifying departments...');
    const [departments] = await sequelize.query('SELECT COUNT(*) as count FROM departments');
    console.log(`   Found ${departments[0].count} departments`);

    console.log('\n📊 Verifying positions...');
    const [positions] = await sequelize.query('SELECT COUNT(*) as count FROM positions');
    console.log(`   Found ${positions[0].count} positions`);

    console.log('\n🎉 All done!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the migration
runMigration();

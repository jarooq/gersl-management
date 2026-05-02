// One-off: create any tables that don't exist yet without altering existing ones.
// Use after a schema mismatch causes `alter: true` to fail.
import sequelize from '../config/database.js';
import './../models/index.js';
import dotenv from 'dotenv';

dotenv.config();

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✓ DB connected');
    await sequelize.sync({ alter: false });
    console.log('✓ Sync complete — missing tables created (existing tables left untouched)');
    process.exit(0);
  } catch (err) {
    console.error('✗ Sync failed:', err.message);
    console.error(err);
    if (err.original) console.error('  SQL:', err.original.sql || err.sql);
    process.exit(1);
  }
})();

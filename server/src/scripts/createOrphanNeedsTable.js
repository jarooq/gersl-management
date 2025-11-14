import dotenv from 'dotenv';
import pg from 'pg';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const { Client } = pg;

const createTable = async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    const sql = fs.readFileSync(join(__dirname, 'createOrphanNeedsTable.sql'), 'utf8');
    await client.query(sql);

    console.log('✅ orphan_needs table created successfully!');
  } catch (error) {
    console.error('❌ Error creating table:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
};

createTable();

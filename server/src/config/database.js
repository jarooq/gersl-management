import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
// Static import so Vercel's nft file-tracer pulls pg into the function bundle.
// Without this, Sequelize's dynamic require('pg') fails at runtime with
// "Please install pg package manually".
import pg from 'pg';

dotenv.config();

// Use SQLite for development if DB_USE_SQLITE is set
const useSQLite = process.env.DB_USE_SQLITE === 'true';

// Check if DATABASE_URL is provided (for connection pooling or full connection strings)
const useDatabaseURL = !!process.env.DATABASE_URL;

// Enable SSL when running against a managed Postgres (Supabase, Neon, RDS, etc.)
// regardless of NODE_ENV. In production, SSL is always on.
const sslEnabled = process.env.NODE_ENV === 'production' || process.env.DB_SSL === 'true';
const sslConfig = sslEnabled
  ? { require: true, rejectUnauthorized: process.env.DB_SSL_STRICT !== 'false' }
  : false;

const sequelize = useSQLite
  ? new Sequelize({
      dialect: 'sqlite',
      // DB_SQLITE_STORAGE lets the test suite point each test process at its
      // own temp file (or ':memory:') so parallel runs don't share state.
      storage: process.env.DB_SQLITE_STORAGE || './database.sqlite',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      define: {
        timestamps: true,
        underscored: true,
        freezeTableName: true
      }
    })
  : useDatabaseURL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      dialectModule: pg, // serverless: bypass Sequelize's dynamic require('pg')
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      dialectOptions: {
        family: 4, // Force IPv4 to avoid IPv6 connection issues
        ssl: sslConfig
      },
      // SERVERLESS POOL — Vercel spawns many short-lived function instances,
      // each running its own copy of this Sequelize. With pool.max=10 and
      // ~20 warm instances we hit Supabase's 200-conn limit and the API
      // returns 500 (EMAXCONN). Cap each instance at 1 connection and let
      // it drop fast when idle.
      //
      // For the long term, switch DATABASE_URL on Vercel to Supabase's
      // PgBouncer pooler endpoint (port 6543, "Transaction" mode):
      //   postgres://postgres.<ref>:<pwd>@aws-0-<region>.pooler.supabase.com:6543/postgres
      pool: {
        max: 1,
        min: 0,
        acquire: 30000,
        idle: 1000,
        evict: 1000
      },
      define: {
        timestamps: true,
        underscored: true,
        freezeTableName: true
      }
    })
  : new Sequelize(
      process.env.DB_NAME || 'gersl_db',
      process.env.DB_USER || 'postgres',
      process.env.DB_PASSWORD || '',
      {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        dialectModule: pg, // serverless: bypass Sequelize's dynamic require('pg')
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        dialectOptions: {
          // Force IPv4 to avoid IPv6 connection issues on some hosts
          family: 4,
          ssl: sslConfig
        },
        pool: {
          max: 10,
          min: 0,
          acquire: 30000,
          idle: 10000
        },
        define: {
          timestamps: true,
          underscored: true,
          freezeTableName: true
        }
      }
    );

// Test connection
export const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to database:', error.message);
    return false;
  }
};

// Sync models
export const syncDatabase = async (options = {}) => {
  try {
    await sequelize.sync(options);
    console.log('✅ Database synchronized');
  } catch (error) {
    console.error('❌ Database sync error:', error.message);
    throw error;
  }
};

export default sequelize;

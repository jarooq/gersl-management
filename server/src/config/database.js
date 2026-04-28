import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Use SQLite for development if DB_USE_SQLITE is set
const useSQLite = process.env.DB_USE_SQLITE === 'true';

// Check if DATABASE_URL is provided (for connection pooling or full connection strings)
const useDatabaseURL = !!process.env.DATABASE_URL;

const sequelize = useSQLite
  ? new Sequelize({
      dialect: 'sqlite',
      storage: './database.sqlite',
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
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      dialectOptions: {
        family: 4, // Force IPv4 to avoid IPv6 connection issues
        ssl: process.env.NODE_ENV === 'production'
          ? { require: true, rejectUnauthorized: process.env.DB_SSL_STRICT !== 'false' }
          : false
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
    })
  : new Sequelize(
      process.env.DB_NAME || 'gersl_db',
      process.env.DB_USER || 'postgres',
      process.env.DB_PASSWORD || '',
      {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        dialectOptions: {
          // Force IPv4 to avoid IPv6 connection issues on some hosts
          family: 4,
          ssl: process.env.NODE_ENV === 'production'
            ? { require: true, rejectUnauthorized: process.env.DB_SSL_STRICT !== 'false' }
            : false
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

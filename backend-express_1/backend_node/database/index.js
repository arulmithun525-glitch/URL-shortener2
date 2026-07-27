// Equivalent of app/database.py.
// IMPORTANT: this connects to the SAME PostgreSQL database and schema that
// Alembic already created for the FastAPI backend. It never runs
// `sequelize.sync()` and never creates/alters tables — the existing schema,
// constraints and indexes remain the single source of truth.
const { Sequelize } = require('sequelize');
const settings = require('../config');

let sequelize;

try {
  sequelize = new Sequelize(settings.databaseUrl, {
    dialect: 'postgres',
    logging: false,
    pool: {
      // Small by default so this is safe under Vercel's serverless model,
      // where many concurrent function instances can each hold a connection.
      // Traditional hosting (Docker/VM/Railway) can raise DB_POOL_MAX freely.
      max: Number(process.env.DB_POOL_MAX) || 2,
      min: 0,
      idle: 10000,
    },
  });
} catch (error) {
  sequelize = null;
  console.warn('Sequelize initialization failed:', error.message);
}

/** Validate database connectivity without creating or modifying schema. */
async function checkConnection() {
  if (!sequelize) {
    throw new Error('Database unavailable: Sequelize is not initialized.');
  }

  await sequelize.authenticate();
  await sequelize.query('SELECT 1');
}

module.exports = { sequelize, checkConnection };

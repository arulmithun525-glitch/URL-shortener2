// Configuration module — JavaScript equivalent of app/config.py.
// Loads and validates environment variables exactly like the Pydantic
// `Settings` class did, and exposes the same derived helpers
// (`corsOriginList`, `seedDomainList`) that the routers/services rely on.

require('dotenv').config();

function toBool(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (['release', 'production', 'prod'].includes(normalized)) return false; // parity with normalize_debug
  return ['true', '1', 'yes', 'on'].includes(normalized);
}

function required(name) {
  const value = process.env[name];
  if (value === undefined || value === null || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// The original FastAPI app required the SQLAlchemy "postgresql+psycopg://"
// driver prefix in DATABASE_URL. Node's pg driver only understands the
// plain "postgresql://" / "postgres://" scheme, so we normalize here
// instead of asking anyone to edit their .env file.
function normalizePostgresUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    throw new Error('DATABASE_URL must be set.');
  }
  if (
    !rawUrl.startsWith('postgresql://') &&
    !rawUrl.startsWith('postgres://') &&
    !rawUrl.startsWith('postgresql+psycopg://') &&
    !rawUrl.startsWith('postgres+psycopg://')
  ) {
    throw new Error('DATABASE_URL must use a valid PostgreSQL URL.');
  }
  return rawUrl.replace('postgresql+psycopg://', 'postgresql://').replace('postgres+psycopg://', 'postgresql://');
}

function validateAdminKey(value) {
  if (!value || value.length < 8) {
    throw new Error('ADMIN_API_KEY must contain at least 8 characters.');
  }
  return value;
}

function validateHashSecret(value) {
  if (!value || value.length < 16) {
    throw new Error('IP_HASH_SECRET must contain at least 16 characters.');
  }
  return value;
}

const rawDatabaseUrl = required('DATABASE_URL');
const corsOrigins = [process.env.CORS_ORIGINS, process.env.FRONTEND_URL]
  .filter(Boolean)
  .join(',');

const settings = {
  appName: process.env.APP_NAME || 'Amazon Smart Link Shortener',
  appEnv: process.env.APP_ENV || 'development',
  debug: toBool(process.env.DEBUG, false),
  databaseUrl: normalizePostgresUrl(rawDatabaseUrl),
  rawDatabaseUrl,
  testDatabaseUrl: process.env.TEST_DATABASE_URL || null,
  adminApiKey: validateAdminKey(required('ADMIN_API_KEY')),
  publicScheme: ['http', 'https'].includes(process.env.PUBLIC_SCHEME) ? process.env.PUBLIC_SCHEME : 'http',
  ipHashSecret: validateHashSecret(required('IP_HASH_SECRET')),
  seedDomains: process.env.SEED_DOMAINS || 'localhost',
  trustProxyHeaders: toBool(process.env.TRUST_PROXY_HEADERS, false),
  corsOrigins: corsOrigins || 'http://localhost:3000,http://localhost:5173',
  port: Number(process.env.PORT) || 8000,
};

Object.defineProperty(settings, 'corsOriginList', {
  get() {
    return this.corsOrigins.split(',').map((item) => item.trim()).filter(Boolean);
  },
});

Object.defineProperty(settings, 'seedDomainList', {
  get() {
    return this.seedDomains.split(',').map((item) => item.trim()).filter(Boolean);
  },
});

module.exports = settings;

// Equivalent of app/main.py — Express application assembly.
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const settings = require('./config');
const { errorHandler } = require('./middleware/errorHandler');

const healthRoutes = require('./routes/health.routes');
const redirectRoutes = require('./routes/redirect.routes');

function loadDatabaseRoutes() {
  const domainsRoutes = require('./routes/domains.routes');
  const linksRoutes = require('./routes/links.routes');
  const analyticsRoutes = require('./routes/analytics.routes');

  app.use('/api/domains', domainsRoutes);
  app.use('/api/links', linksRoutes);
  app.use('/api/links/:linkId/analytics', analyticsRoutes);
}

const app = express();
const allowedOrigins = settings.corsOriginList;

// helmet() sets several security headers; disable the default CSP since this
// is a pure JSON/redirect API with no HTML to protect, matching the original
// FastAPI app (which did not set a CSP either).
app.use(helmet({ contentSecurityPolicy: false }));

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-Admin-Key'],
  })
);

app.use(express.json());
app.use(morgan(settings.debug ? 'dev' : 'combined'));

// Trust the first proxy hop only when explicitly enabled, matching
// TRUST_PROXY_HEADERS from the original config.
if (settings.trustProxyHeaders) {
  app.set('trust proxy', 1);
}

app.use(healthRoutes);

try {
  loadDatabaseRoutes();
} catch (error) {
  console.warn('Database routes unavailable during startup:', error.message);
}

// The catch-all redirect router must remain last.
app.use(redirectRoutes);

app.use(errorHandler);

module.exports = app;

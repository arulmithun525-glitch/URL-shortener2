process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres';
process.env.ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'test-admin-key';
process.env.IP_HASH_SECRET = process.env.IP_HASH_SECRET || '0123456789abcdef0123456789abcdef';
process.env.APP_NAME = process.env.APP_NAME || 'Test App';
process.env.APP_ENV = process.env.APP_ENV || 'test';
process.env.PUBLIC_SCHEME = process.env.PUBLIC_SCHEME || 'https';
process.env.CORS_ORIGINS = process.env.CORS_ORIGINS || 'https://example.com';

const request = require('supertest');
const app = require('../app');

describe('GET /health', () => {
  it('returns service health information', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      status: 'ok',
      app: 'Test App',
      environment: 'test',
    });
  });
});

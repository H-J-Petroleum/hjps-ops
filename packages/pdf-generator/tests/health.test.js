jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn(() => ({ send: jest.fn().mockResolvedValue({}) })),
  PutObjectCommand: jest.fn(),
  GetObjectCommand: jest.fn()
}), { virtual: true });

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(async () => 'https://example.com/mock-signed-url')
}), { virtual: true });

// Use global request mock if supertest is not available
const request = global.request || require('supertest');
const app = require('../src/index');

describe('API health', () => {
  test('GET /health returns healthy', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'healthy');
    expect(res.body).toHaveProperty('timestamp');
  });
});

const request = require('supertest');
const app = require('../server');
const { limiters } = require('../middleware/performance');
const cacheMiddleware = require('../middleware/cache');

describe('Middleware Tests', () => {
    describe('Rate Limiting', () => {
        it('should limit requests according to configuration', async () => {
            const requests = Array(6).fill().map(() =>
                request(app)
                    .post('/register')
                    .send({ username: 'test', email: 'test@test.com', phone: '1234567890' })
            );

            const responses = await Promise.all(requests);
            expect(responses[5].status).toBe(429);
        });
    });

    describe('Caching', () => {
        it('should set correct cache headers for static content', async () => {
            const response = await request(app)
                .get('/assets/images/logo.png');

            expect(response.headers['cache-control'])
                .toContain(`public, max-age=${24 * 60 * 60}`);
        });

        it('should prevent caching for sensitive routes', async () => {
            const response = await request(app)
                .get('/admin/dashboard');

            expect(response.headers['cache-control'])
                .toContain('no-store');
        });
    });

    describe('Compression', () => {
        it('should compress responses', async () => {
            const response = await request(app)
                .get('/')
                .set('Accept-Encoding', 'gzip');

            expect(response.headers['content-encoding'])
                .toBe('gzip');
        });
    });
});
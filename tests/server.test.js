const request = require('supertest');
const app = require('../server');

describe('Server Endpoints', () => {
    test('GET / should return 200', async () => {
        const response = await request(app).get('/');
        expect(response.status).toBe(200);
    });

    test('GET /api/settings/razorpay should return razorpay status', async () => {
        const response = await request(app).get('/api/settings/razorpay');
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('enabled');
    });

    test('POST /register should validate input', async () => {
        const response = await request(app)
            .post('/register')
            .send({});
        expect(response.status).toBe(400);
    });
}); 
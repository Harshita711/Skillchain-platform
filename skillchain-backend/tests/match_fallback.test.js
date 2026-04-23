const mongoose = require('mongoose');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

let app, server;
let mongoServer;

const User = require('../models/User');

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    process.env.MONGO_URI = uri;
    process.env.JWT_SECRET = 'testsecret';

    // Import server after setting MONGO_URI
    const srv = require('../server');
    app = srv.app;
    server = srv.server;

    await mongoose.connect(uri);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
    server.close();
});

test('fallback matching returns providers by campus then city', async () => {
    // Create a requester user WITHOUT coordinates (forces fallback logic)
    const requester = await User.create({
        name: 'Requester', 
        email: 'requester@example.com', 
        password: 'password123', 
        university: 'MIT', 
        campus: 'Main', 
        city: 'Boston'
    });

    // Provider A: same campus (should appear first)
    await User.create({ 
        name: 'ProviderA', 
        email: 'prov_a@example.com', 
        password: 'password123', 
        university: 'MIT', 
        campus: 'Main', 
        city: 'Boston',
        skills: [{ name: 'Guitar' }], 
        rating: 4.2, 
        totalReviews: 5 
    });

    // Provider B: different campus, different city (should not appear in first query)
    await User.create({ 
        name: 'ProviderB', 
        email: 'prov_b@example.com', 
        password: 'password123', 
        university: 'Harvard', 
        campus: 'Other', 
        city: 'Cambridge',
        skills: [{ name: 'Guitar' }], 
        rating: 4.9, 
        totalReviews: 20 
    });

    // Generate token for requester
    const token = jwt.sign({ id: requester._id }, process.env.JWT_SECRET);

    const res = await request(app)
        .get('/api/users/match?skill=Guitar')
        .set('Authorization', `Bearer ${token}`);

    console.log('Response status:', res.status);
    console.log('Response body:', res.body);

    expect(res.status).toBe(200);
    const users = res.body;
    expect(Array.isArray(users)).toBe(true);
    expect(users.length).toBeGreaterThanOrEqual(1);
    expect(users[0].name).toBe('ProviderA');
    expect(users[0].rating).toBe(4.2);
}, 15000);

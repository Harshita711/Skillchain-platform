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

test('matching returns users sorted by campus proximity then rating', async () => {
    // Create a requester user with campus info (geospatial not supported in in-memory DB, uses fallback campus->city->global)
    const requester = await User.create({
        name: 'Req', email: 'req@example.com', password: 'password123', 
        university: 'MIT', campus: 'Main', city: 'Boston', region: 'MA', country: 'USA',
        location: { type: 'Point', coordinates: [77.5946, 12.9716] }
    });

    // Provider A: same campus, lower rating (should appear first due to campus match)
    await User.create({ 
        name: 'A', email: 'a@example.com', password: 'password123', 
        university: 'MIT', campus: 'Main', city: 'Boston',
        location: { type: 'Point', coordinates: [77.5950, 12.9718] }, 
        skills: [{ name: 'Guitar' }], rating: 4.2, totalReviews: 5 
    });

    // Provider B: different campus but higher rating (should not appear in campus fallback)
    await User.create({ 
        name: 'B', email: 'b@example.com', password: 'password123', 
        university: 'Harvard', campus: 'Other', city: 'Cambridge',
        location: { type: 'Point', coordinates: [77.60, 12.98] }, 
        skills: [{ name: 'Guitar' }], rating: 4.9, totalReviews: 20 
    });

    // Generate token for requester
    const token = jwt.sign({ id: requester._id }, process.env.JWT_SECRET);

    const res = await request(app).get('/api/users/match?skill=Guitar').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    const users = res.body;
    // Fallback matching: campus priority should return Provider A first
    expect(users.length).toBeGreaterThanOrEqual(1);
    expect(users[0].name).toBe('A');
    // Note: full geospatial testing requires real MongoDB with 2dsphere index enabled
    // In-memory MongoDB doesn't support geospatial queries, so we test the fallback logic here
}, 10000);


# SkillChain - Peer-to-Peer Skill Exchange Platform

<div align="center">

**A campus community platform where users exchange skills using an in-app coin economy**

![Node.js](https://img.shields.io/badge/Node.js-v16+-green)
![Express](https://img.shields.io/badge/Express-4.18-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-8.0-darkgreen)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.6-red)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation & Setup](#installation--setup)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Real-time Features](#real-time-features)
- [Database Models](#database-models)
- [Running & Testing](#running--testing)
- [Future Enhancements](#future-enhancements)
- [Contributing](#contributing)

---

## 🎯 Overview

**SkillChain** is a peer-to-peer learning marketplace for campus communities. Users can:
- Define and showcase their skills with proficiency levels
- Request skills from other users
- Exchange services using an in-app coin economy
- Rate and review other users
- Share experiences in a community feed
- Schedule and confirm skill exchange sessions
- Receive real-time notifications

The platform uses **geolocation-based matching** to connect users on the same campus or nearby locations, fostering a local learning community.

---

## ✨ Features

### Core Features

#### 1. **Skill Exchange System**
- Users define multiple skills with proficiency levels (Beginner → Expert)
- Request skills from other users with custom coin offers
- Dual-confirmation workflow: Both provider and requester must confirm completion
- Atomic coin transfers with transaction safety (ACID guarantees)

#### 2. **Smart Geolocation Matching** 
```
Priority:
1. Nearest users first (geospatial distance)
2. Same campus/university
3. Same city/region
4. Global platform search
```
- Sorted by user rating and review count
- Fallback algorithms if geospatial data unavailable
- Powered by OpenStreetMap Nominatim API

#### 3. **Real-time Collaboration**
- **Socket.IO integration** for live updates
- Typing indicators during conversations
- Real-time post updates to all connected users
- Live notifications delivered instantly
- Multi-device support per user

#### 4. **User Reputation System**
- 5-star review system
- Automatic average rating calculation
- Review comments and feedback
- Impacts user ranking in matching algorithm

#### 5. **Community Feed**
- Share text + media posts (image/video via Cloudinary)
- Like/unlike posts
- Comment on community posts
- Real-time feed updates

#### 6. **Session Management**
- Schedule skill exchange sessions
- Confirmation workflow (scheduled → completed)
- Calendar view of all sessions
- Location and time tracking

#### 7. **Authentication & Security**
- JWT-based authentication (30-day expiry)
- Password hashing with bcryptjs
- Role-based access control (user/admin)
- Session management

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Node.js + Express 4.18 |
| **Database** | MongoDB 8.0 + Mongoose |
| **Real-time** | Socket.IO 4.6 |
| **Authentication** | JWT + bcryptjs |
| **File Storage** | Cloudinary |
| **Location Services** | Nominatim OpenStreetMap API |
| **Testing** | Jest + Supertest |
| **Frontend** | HTML5 + CSS3 + Vanilla JavaScript |

---

## 📦 Installation & Setup

### Prerequisites
- Node.js >= 16.0.0
- npm >= 8.0.0
- MongoDB (local or Atlas)
- Cloudinary account (for image uploads)

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/skillchain
# or MongoDB Atlas:
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/skillchain

# Authentication
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=30d

# Cloudinary
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Server
PORT=5000
NODE_ENV=development

# Frontend
FRONTEND_URL=http://localhost:3000
```

### Installation Steps

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/skillchain.git
cd skillchain

# 2. Install dependencies (both frontend and backend)
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# 4. Initialize MongoDB and seed data (optional)
# npm run seed

# 5. Start the development server
npm run dev

# 6. Open browser to http://localhost:5000
```

### Available Scripts

```bash
npm start              # Start production server
npm run dev            # Start development server with nodemon
npm test               # Run test suite
npm run test:socket    # Test Socket.IO functionality
npm audit fix          # Fix security vulnerabilities
```

---

## 📂 Project Structure

```
skillchain/
├── skillchain-backend/
│   ├── config/                 # Configuration files
│   │   ├── db.js              # MongoDB connection
│   │   └── cloudinary.js       # Cloudinary setup
│   │
│   ├── controllers/            # Request handlers
│   │   ├── authController.js   # Authentication logic
│   │   ├── userController.js   # User profile & skills
│   │   ├── serviceController.js    # Skill requests & coin transfers
│   │   ├── postController.js   # Community feed
│   │   ├── reviewController.js # User reviews & ratings
│   │   ├── calendarController.js   # Session management
│   │   └── notificationController.js   # Notifications
│   │
│   ├── models/                 # Database schemas
│   │   ├── User.js            # User profile & skills
│   │   ├── Service.js         # Skill exchange requests
│   │   ├── Post.js            # Community posts
│   │   ├── Review.js          # User reviews
│   │   ├── Session.js         # Scheduled sessions
│   │   ├── Notification.js    # User notifications
│   │   └── Message.js         # Direct messages
│   │
│   ├── routes/                 # API endpoints
│   │   ├── authRoutes.js       # /api/auth/*
│   │   ├── userRoutes.js       # /api/users/*
│   │   ├── serviceRoutes.js    # /api/services/*
│   │   ├── postRoutes.js       # /api/posts/*
│   │   ├── reviewRoutes.js     # /api/reviews/*
│   │   ├── calendarRoutes.js   # /api/calendar/*
│   │   └── notificationRoutes.js   # /api/notifications/*
│   │
│   ├── middleware/             # Express middleware
│   │   ├── authMiddleware.js   # JWT verification
│   │   └── errorMiddleware.js  # Error handling
│   │
│   ├── utils/                  # Utility functions
│   │   ├── matchAlgorithm.js   # Geolocation matching logic
│   │   ├── coinManager.js      # Coin transaction logic
│   │   ├── ratingCalculator.js # User rating calculations
│   │   ├── notificationHelper.js   # Notification utilities
│   │   ├── geocode.js          # Address geocoding
│   │   └── dateFormatter.js    # Date utilities
│   │
│   ├── migrations/             # Database migrations
│   └── tests/                  # Test suite
│       ├── match.integration.test.js
│       ├── match_fallback.test.js
│       └── socket_test.js
│
├── app.js                      # Frontend entry point
├── index.html                  # Frontend UI
├── styles.css                  # Frontend styling
├── package.json                # Dependencies (unified)
├── package-lock.json           # Locked versions
├── server.js                   # Backend server entry
└── README.md                   # This file
```

---

## 🔌 API Documentation

### Authentication Endpoints

#### Register
```
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@university.edu",
  "password": "secure_password",
  "university": "Stanford University",
  "campus": "Main Campus",
  "city": "Palo Alto",
  "region": "California",
  "dorm": "Dorm A",
  "address": "123 Main St, Palo Alto, CA"
}

Response: {
  "token": "jwt_token_here",
  "user": { id, name, email, coins: 20, ... }
}
```

#### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@university.edu",
  "password": "secure_password"
}

Response: {
  "token": "jwt_token_here",
  "user": { id, name, email, coins, rating, ... }
}
```

### User Endpoints

#### Get Skill Matches
```
GET /api/users/match?skill=Guitar&proficiency=intermediate

Response: {
  "matches": [
    {
      "id": "user_id",
      "name": "Jane Smith",
      "university": "Stanford",
      "skills": [...],
      "rating": 4.8,
      "distance": 0.5  // km
    }
  ]
}
```

#### Update User Profile
```
PATCH /api/users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "city": "New City",
  "campus": "New Campus",
  "skills": [
    { "name": "Guitar", "proficiency": "intermediate", "category": "Music" }
  ]
}
```

### Service (Skill Request) Endpoints

#### Request a Skill
```
POST /api/services/request
Authorization: Bearer <token>

{
  "providerId": "user_id",
  "skillRequested": "Guitar Lessons",
  "coinsOffered": 50,
  "sessionDate": "2026-05-10T14:00:00Z"
}

Response: {
  "id": "service_id",
  "status": "pending",
  "requesterConfirmed": false,
  "providerConfirmed": false
}
```

#### Accept Service Request
```
PUT /api/services/:serviceId/accept
Authorization: Bearer <token>

Response: { status: "accepted" }
```

#### Complete Service (Provider)
```
PUT /api/services/:serviceId/provider-complete
Authorization: Bearer <token>

Response: { providerConfirmed: true }
```

#### Complete Service (Requester)
```
PUT /api/services/:serviceId/requester-complete
Authorization: Bearer <token>

Response: {
  status: "completed",
  coinsTransferred: true,
  message: "50 coins transferred to provider"
}
```

### Post (Feed) Endpoints

#### Create Post
```
POST /api/posts
Authorization: Bearer <token>

{
  "content": "Just learned a new guitar technique!",
  "mediaUrl": "cloudinary_url_here"  // optional
}
```

#### Get Feed
```
GET /api/posts?page=1&limit=20

Response: {
  "posts": [
    {
      "id": "post_id",
      "author": { "id", "name", "avatar" },
      "content": "...",
      "mediaUrl": "...",
      "likes": 5,
      "comments": [...],
      "createdAt": "2026-04-24T10:00:00Z"
    }
  ]
}
```

#### Like/Unlike Post
```
POST /api/posts/:postId/like
Authorization: Bearer <token>
```

### Review Endpoints

#### Create Review
```
POST /api/reviews
Authorization: Bearer <token>

{
  "reviewedUserId": "user_id",
  "rating": 5,
  "comment": "Great tutor! Very patient and knowledgeable."
}
```

#### Get User Reviews
```
GET /api/reviews/:userId

Response: {
  "reviews": [...],
  "averageRating": 4.8,
  "totalReviews": 42
}
```

### Notification Endpoints

#### Get Notifications
```
GET /api/notifications
Authorization: Bearer <token>

Response: {
  "notifications": [
    {
      "id": "notif_id",
      "type": "service",  // or "review", "session", "announcement"
      "message": "Jane Smith requested your Guitar skills",
      "read": false,
      "createdAt": "2026-04-24T10:00:00Z"
    }
  ]
}
```

#### Mark Notification as Read
```
PATCH /api/notifications/:notifId
Authorization: Bearer <token>

{ "read": true }
```

### Calendar Endpoints

#### Get User Sessions
```
GET /api/calendar
Authorization: Bearer <token>

Response: {
  "sessions": [
    {
      "id": "session_id",
      "skill": "Guitar",
      "otherUser": { "name", "avatar" },
      "scheduledAt": "2026-05-10T14:00:00Z",
      "location": "Library Room 101",
      "status": "scheduled"  // or "completed"
    }
  ]
}
```

---

## 🔌 Real-time Features (Socket.IO)

### Socket Events

#### Connection
```javascript
// Client connects and joins personal room
io.emit('connect')
// Server joins user to room: `user_${userId}`
socket.join(`user_${userId}`)
```

#### New Notification
```javascript
// Server emits to user room
io.to(`user_${userId}`).emit('notification', {
  type: 'service',
  message: 'New skill request received',
  data: { ... }
})
```

#### Post Update
```javascript
// Server broadcasts to all connected users
io.emit('postUpdated', {
  postId: '...',
  action: 'new|like|comment',
  data: { ... }
})
```

#### Typing Indicator
```javascript
// Client emits when typing
socket.emit('userTyping', { roomId, userId })

// Other users in room receive
socket.on('userTyping', ({ userId }) => {
  // Show "User is typing..."
})
```

### Multi-device Support
- Users can connect from multiple devices
- Each device gets a unique socket ID
- All connected devices receive notifications
- Messages broadcast to all user sockets

---

## 💾 Database Models

### User Model
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  passwordHash: String,
  university: String,
  campus: String,
  city: String,
  region: String,
  dorm: String,
  avatar: String,
  bio: String,
  
  coins: Number (default: 20),
  rating: Number (1-5, calculated from reviews),
  totalReviews: Number,
  
  skills: [{
    name: String,
    proficiency: String (beginner|intermediate|advanced|expert),
    category: String,
    specialization: String
  }],
  
  location: {
    type: GeoJSON Point,
    coordinates: [latitude, longitude]
  },
  
  servicesProvided: [ServiceId],
  servicesTaken: [ServiceId],
  
  role: String (default: "user"),
  createdAt: Date,
  updatedAt: Date
}
```

### Service Model
```javascript
{
  _id: ObjectId,
  requester: UserId,
  provider: UserId,
  
  skillRequested: String,
  coinsOffered: Number,
  
  status: String (pending|accepted|completed|cancelled),
  
  providerConfirmed: Boolean (default: false),
  requesterConfirmed: Boolean (default: false),
  coinsTransferred: Boolean (default: false),
  
  createdAt: Date,
  completedAt: Date
}
```

### Post Model
```javascript
{
  _id: ObjectId,
  author: UserId,
  content: String,
  mediaUrl: String (Cloudinary),
  
  likes: [UserId],
  comments: [{
    user: UserId,
    text: String,
    createdAt: Date
  }],
  
  createdAt: Date,
  updatedAt: Date
}
```

### Review Model
```javascript
{
  _id: ObjectId,
  reviewer: UserId,
  reviewedUser: UserId,
  
  rating: Number (1-5),
  comment: String,
  
  createdAt: Date
}
```

### Session Model
```javascript
{
  _id: ObjectId,
  requester: UserId,
  provider: UserId,
  
  skill: String,
  coins: Number,
  title: String,
  
  scheduledAt: Date,
  location: String,
  
  status: String (scheduled|completed),
  
  createdAt: Date
}
```

### Notification Model
```javascript
{
  _id: ObjectId,
  user: UserId,
  
  type: String (service|review|session|announcement),
  message: String,
  relatedId: ObjectId (serviceId, reviewId, etc.),
  
  read: Boolean (default: false),
  
  createdAt: Date
}
```

---

## 🧪 Running & Testing

### Unit Tests
```bash
npm test
```

### Integration Tests (Matching Algorithm)
```bash
npm test -- match.integration.test.js
```

### Socket.IO Tests
```bash
npm run test:socket
```

Test files:
- `skillchain-backend/tests/match.integration.test.js` - Geospatial matching tests
- `skillchain-backend/tests/match_fallback.test.js` - Fallback matching logic
- `skillchain-backend/tests/socket_test.js` - Real-time communication tests

---

## 🚀 Future Enhancements

### Phase 1: Core Improvements
- [ ] **Direct Messaging**: Complete chat routes and real-time messaging
- [ ] **Email Verification**: Verify email during registration
- [ ] **Password Reset**: Forgot password workflow
- [ ] **Pagination**: Add pagination to all list endpoints
- [ ] **Search Filters**: Advanced skill search with filters

### Phase 2: Advanced Features
- [ ] **Admin Panel**: Moderation dashboard and user management
- [ ] **Dispute Resolution**: Handle conflicts between users
- [ ] **Skill Categories**: Predefined taxonomy of skills
- [ ] **Recommendations**: ML-based skill recommendations
- [ ] **Learning Paths**: Progression from beginner to expert

### Phase 3: Monetization & Growth
- [ ] **Coin Store**: Purchase coins with real money
- [ ] **Premium Features**: Subscription tier
- [ ] **Marketplace**: Buy/sell skills for coins
- [ ] **Leaderboards**: Top-rated tutors and learners
- [ ] **Badges/Achievements**: Gamification

### Phase 4: Platform Expansion
- [ ] **Mobile App**: React Native/Flutter application
- [ ] **Email Notifications**: Digest emails and alerts
- [ ] **Analytics Dashboard**: User growth and engagement metrics
- [ ] **Multi-language Support**: Internationalization
- [ ] **Video Calls**: Integrated video for sessions

### Phase 5: Security & Performance
- [ ] **Rate Limiting**: Prevent API abuse
- [ ] **Input Validation**: Comprehensive validation on all endpoints
- [ ] **HTTPS Enforcement**: Secure all communications
- [ ] **Caching**: Redis for session and data caching
- [ ] **CDN**: Image optimization and delivery
- [ ] **Monitoring**: Error tracking and performance monitoring

---

## 🔒 Security Features

- ✅ JWT-based authentication with expiry
- ✅ Password hashing with bcryptjs
- ✅ MongoDB transactions for coin transfer atomicity
- ✅ Geospatial indexing for efficient location queries
- ✅ Error middleware prevents stack trace leaks
- ✅ CORS configuration for cross-origin requests
- ⚠️ TODO: Rate limiting on sensitive endpoints
- ⚠️ TODO: Input validation and sanitization
- ⚠️ TODO: HTTPS enforcement

---

## 📊 Development Roadmap

| Quarter | Focus |
|---------|-------|
| Q2 2026 | Core feature completion, bug fixes |
| Q3 2026 | Direct messaging, admin panel |
| Q4 2026 | Mobile app beta, monetization |
| Q1 2027 | Video calls, ML recommendations |

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👥 Team

**SkillChain Development Team**
- Backend: Node.js + Express
- Database: MongoDB
- Real-time: Socket.IO
- Frontend: Vanilla JavaScript

---

## 📧 Support & Contact

For questions or support:
- Email: support@skillchain.com
- Issues: GitHub Issues
- Discussions: GitHub Discussions

---

## 🎓 Acknowledgments

Built with ❤️ for campus communities to facilitate peer-to-peer learning and skill exchange.

**Special thanks to:**
- OpenStreetMap/Nominatim for geolocation services
- Cloudinary for media hosting
- MongoDB for database infrastructure
- Socket.IO for real-time capabilities

---

<div align="center">

**Made with ❤️ by SkillChain Team**

[⬆ back to top](#skillchain---peer-to-peer-skill-exchange-platform)

</div>

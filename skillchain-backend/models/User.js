const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');


// ==========================
// Skill Subschema
// ==========================
const skillSchema = new mongoose.Schema({
    category: {
        type: String,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    proficiency: {
        type: String,
        enum: ["beginner", "intermediate", "advanced", "expert"]
    },
    specialization: {
        type: String,
        trim: true
    }
}, { _id: false });


// ==========================
// User Schema
// ==========================
const userSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
        trim: true
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },

    password: {
        type: String,
        required: true,
        minlength: 6
    },

    coins: {
        type: Number,
        default: 20,
        min: 0
    },

    university: {
        type: String,
        trim: true
    },

    campus: {
        type: String,
        trim: true
    },

    city: {
        type: String,
        trim: true
    },

    region: {
        type: String,
        trim: true
    },

    dorm: {
        type: String,
        trim: true
    },

    // GeoJSON location used for proximity searches
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        // [lng, lat]
        coordinates: {
            type: [Number],
            default: undefined
        }
    },

    skills: [skillSchema],

    rating: {
        type: Number,
        default: 5.0,
        min: 1,
        max: 5
    },

    totalReviews: {
        type: Number,
        default: 0
    },

    servicesProvided: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service'
    }],

    servicesTaken: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service'
    }],

    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },

    profileImage: {
        type: String
    },

    isVerified: {
        type: Boolean,
        default: false
    }

}, { timestamps: true });


// ==========================
// Indexes (Performance)
// ==========================
userSchema.index({ email: 1 });
userSchema.index({ campus: 1 });
userSchema.index({ city: 1 });
userSchema.index({ rating: -1 });
userSchema.index({ location: '2dsphere' });


// ==========================
// Password Hash Middleware
// ==========================
userSchema.pre('save', async function (next) {

    if (!this.isModified('password')) return next();

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);

    next();
});


// ==========================
// Compare Password Method
// ==========================
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};


// ==========================
// Remove Password from JSON
// ==========================
userSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.password;
    return user;
};


module.exports = mongoose.model('User', userSchema);

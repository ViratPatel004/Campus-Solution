const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    firebaseUid: {
        type: String,
        required: true,
        index: true
    },
    role: {
        type: String,
        enum: ['student', 'admin'],
        default: 'student'
    },
    department: {
        type: String,
        required: false // Admins might not have one, or generic
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', UserSchema);

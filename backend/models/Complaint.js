const mongoose = require('mongoose');

const ComplaintSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['infrastructure', 'academic', 'hostel', 'other'],
        required: true
    },
    urgency: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'low'
    },
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'resolved'],
        default: 'pending'
    },
    imageUrl: {
        type: String,
        required: false
    },
    adminRemarks: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Complaint', ComplaintSchema);

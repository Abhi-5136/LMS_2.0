const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    feeDueStatus: {
        type: Number,
        default: 0
    },
    borrowedBooks: [{
        bookId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Book'
        },
        issueDate: {
            type: Date,
            default: Date.now
        },
        dueDate: {
            type: Date
        }
    }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);

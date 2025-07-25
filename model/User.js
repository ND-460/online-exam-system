const moongose = require('mongoose');

const userSchema = new moongose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        // unique: true
    },
    phone: {
        type: String,
        required: true,
        // unique: true
    },
    section:{
        type: String,
        required: true,
        default: 'Test'
    },
    className: {
        type: String,
        required: true,
        default: 'Test'
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    role: {
        type: String,
        // enum: ['student', 'teacher'],
        required: true,
        default: 'student'
    },
    password: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now()
    }
})

module.exports = moongose.model('users', userSchema);
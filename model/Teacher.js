const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
    profileInfo:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
})

module.exports = mongoose.model('teachers',teacherSchema);
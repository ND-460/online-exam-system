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
    employeeId: { type: String, default: "N/A" },
    subjects: [{ type: String }], 
    department: { type: String, default: "General" },
    designation: { type: String, default: "Teacher" },
    experienceYears: { type: Number, default: 0 },
    joiningDate: { type: Date },
})

module.exports = mongoose.model('teachers',teacherSchema);
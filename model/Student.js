const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  profileInfo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  attemptedTests: [
    {
      testId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Test",
      },
      testName: String,
      score: Number,
      outOfMarks: Number,
      attemptedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  testStatus: [
    {
      testId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Test",
      },
      status: {
        type: String,
        enum: ["not_started", "in_progress", "submitted"],
        default: "not_started",
      },
      startedAt: Date,
      endedAt: Date,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  rollNumber: { type: String, default: "N/A" },
  gradeLevel: { type: String, default: "N/A" },
  department: { type: String, default: "General" },
  guardian:{
    name: { type: String, default: "N/A" },
    phone: { type: String, default: "N/A" },
  }
});

module.exports = mongoose.model("Student", studentSchema);

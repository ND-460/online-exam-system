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
});

module.exports = mongoose.model("Student", studentSchema);

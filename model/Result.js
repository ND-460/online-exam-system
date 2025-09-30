const mongoose = require("mongoose");

const ResultSchema = new mongoose.Schema(
  {
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tests",
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },
    score: {
      type: Number,
      required: true,
    },
    outOfMarks: {
      type: Number,
      required: true,
    },
    answers: [
      {
        questionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Question",
        },
        selectedOption: {
          type: Number,
        },
        correctOption: {
          type: Number, 
        },
        isCorrect: {
          type: Boolean,
        },
      },
    ],
    attemptedAt: {
      type: Date,
      default: Date.now,
    },
    submitted: {
      type: Boolean,
      default: true,
    },
    durationTaken: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Result", ResultSchema);


const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: { type: [String], required: true },
  answer: { type: Number, required: true },
  // New fields to support categorization and scoring
  subject: { type: String },
  difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
  marks: { type: Number, default: 1 },
});

const testSchema = new mongoose.Schema({
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'teachers',
  },
  testName: { type: String, required: true },
  category: { type: String, required: true },
  className: { type: String, required: true },
  minutes: { type: Number, required: true },
  rules: { type: [String], required: true, default: [] },
  outOfMarks: { type: Number, required: true },
  questions: { type: [questionSchema], required: true },
  assignedTo: { type: Array },
  attempted: { type: Boolean, default: false },
  submitBy: { type: Array },
  scheduledAt: { type: Date, required: false },
  description: { type: String },
});

module.exports = mongoose.model('tests', testSchema);


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

const submissionSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
  studentName: { type: String, required: true },
  answers: { type: Array, required: true },
  score: { type: Number, required: true },
  percentage: { type: Number, required: true },
  submittedAt: { type: Date, default: Date.now },
  timeTaken: { type: Number }, // in minutes
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

 
  scheduledAt: { type: Date, required: false },
  description: { type: String },

  questions: { type: [questionSchema], required: true }, 
  assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'users' }],
  assignedStudents: [{ 
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    studentName: { type: String },
    assignedAt: { type: Date, default: Date.now }
  }],
  submissions: [submissionSchema],
  status: { type: String, enum: ['draft', 'published', 'completed'], default: 'draft' },
  publishedAt: { type: Date },
  dueDate: { type: Date },
  attempted: { type: Boolean, default: false },
  submitBy: { type: Array }, 
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }

});

module.exports = mongoose.model('tests', testSchema);

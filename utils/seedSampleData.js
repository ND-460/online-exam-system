// Seed and normalization script to refresh demo data with realistic names,
// sequential dates, test results and marks while keeping organisations
// exactly as they are (only "N/A" and "BVM" are used where relevant).

/*
How to run (non-interactive):
  1) Ensure .env has MONGO_URI
  2) node utils/seedSampleData.js
*/

require('dotenv').config();
const mongoose = require('mongoose');
const connectDb = require('../config/db');

// Models
const User = require('../model/User');
const Student = require('../model/Student');
const Teacher = require('../model/Teacher');
const Test = require('../model/Test');
const Result = require('../model/Result');

function daysAgo(num) {
  const d = new Date();
  d.setDate(d.getDate() - num);
  return d;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function upsertUser({ firstName, lastName, email, role, organisationName }) {
  const base = {
    firstName,
    lastName,
    email,
    phone: '9999999999',
    section: 'A',
    className: '10',
    role,
    status: 'active',
    password: '$2a$10$xT7l9b0DemoSeedHash00000000000000000000000000000000000000', // dummy hash string (not used for login)
    dateOfBirth: daysAgo(365 * (16 + Math.floor(Math.random() * 10))),
    organisation: {
      name: organisationName || 'N/A',
      address: organisationName === 'BVM' ? 'Vallabh Vidyanagar' : 'N/A'
    }
  };

  const user = await User.findOneAndUpdate(
    { email },
    { $set: base },
    { new: true, upsert: true }
  );
  return user;
}

async function ensureTeacher(profile) {
  const t = await Teacher.findOneAndUpdate(
    { profileInfo: profile._id },
    {
      $setOnInsert: {
        employeeId: `EMP-${Math.floor(Math.random() * 9000 + 1000)}`,
        department: 'Computer Science',
        designation: 'Senior Teacher',
        experienceYears: Math.floor(Math.random() * 8) + 2,
        joiningDate: daysAgo(365 * (1 + Math.floor(Math.random() * 3)))
      }
    },
    { upsert: true, new: true }
  );
  return t;
}

async function ensureStudent(profile) {
  const s = await Student.findOneAndUpdate(
    { profileInfo: profile._id },
    {
      $setOnInsert: {
        rollNumber: `R-${Math.floor(Math.random() * 90000 + 10000)}`,
        gradeLevel: pick(['9', '10', '11', '12']),
        department: 'General'
      }
    },
    { upsert: true, new: true }
  );
  return s;
}

async function createTestsSequential(teacher, students) {
  // Create 4 tests spaced across recent weeks
  const subjects = ['Math', 'Science', 'English', 'History'];
  const tests = [];

  for (let i = 0; i < 4; i++) {
    const scheduledAt = daysAgo(7 * (4 - i));
    const testName = `${subjects[i]} Unit Test`;

    const existing = await Test.findOne({ testName, teacherId: teacher._id });
    if (existing) {
      // Normalize dates and assignments
      existing.scheduledAt = scheduledAt;
      existing.publishedAt = daysAgo(7 * (4 - i) + 1);
      existing.status = 'completed';
      await existing.save();
      tests.push(existing);
      continue;
    }

    const outOfMarks = 50;
    const questions = Array.from({ length: 10 }).map((_, idx) => ({
      question: `${subjects[i]} Question ${idx + 1}`,
      options: ['A', 'B', 'C', 'D'],
      answer: Math.floor(Math.random() * 4),
      subject: subjects[i],
      difficulty: pick(['easy', 'medium', 'hard']),
      marks: 5
    }));

    // Assign using User ids present in Student.profileInfo
    const assignedIds = students.map((s) => s.profileInfo);
    const assignedStudents = students.map((s) => ({
      studentId: s.profileInfo,
      assignedAt: scheduledAt
    }));

    const test = await Test.create({
      teacherId: teacher._id,
      testName,
      category: subjects[i],
      className: '10',
      minutes: 45,
      rules: ['No cheating', 'No phones'],
      outOfMarks,
      scheduledAt,
      description: `${subjects[i]} assessment`,
      questions,
      assignedTo: assignedIds,
      assignedStudents,
      status: 'completed',
      publishedAt: scheduledAt,
      dueDate: daysAgo(7 * (4 - i) - 1)
    });
    tests.push(test);
  }

  return tests;
}

async function createResults(tests, students, teacher) {
  for (const test of tests) {
    for (const s of students) {
      // Skip if result exists
      const exists = await Result.findOne({ testId: test._id, studentId: s._id });
      if (exists) continue;

      const score = Math.floor(25 + Math.random() * 25); // 25..50
      await Result.create({
        testId: test._id,
        studentId: s._id,
        teacherId: teacher._id,
        score,
        outOfMarks: test.outOfMarks,
        answers: [],
        attemptedAt: test.scheduledAt,
        submitted: true,
        durationTaken: 40
      });

      // Mark test as submitted for this user (to satisfy frontend filters)
      await Test.updateOne(
        { _id: test._id },
        { $addToSet: { submitBy: s.profileInfo } }
      );

      // Update Student.attemptedTests for quick views
      await Student.updateOne(
        { _id: s._id, 'attemptedTests.testId': { $ne: test._id } },
        {
          $push: {
            attemptedTests: {
              testId: test._id,
              testName: test.testName,
              score,
              outOfMarks: test.outOfMarks,
              attemptedAt: test.scheduledAt
            }
          }
        }
      );
    }
  }
}

// Assign tests and results per teacher, targeting students in the same organisation
async function seedPerOrganization() {
  // Fetch teacher users with their organisations
  const teacherUsers = await User.find({ role: 'teacher' });
  if (!teacherUsers.length) return;

  // Index students by organisation name
  const allStudentUsers = await User.find({ role: 'student' });
  const studentUserIds = allStudentUsers.map(u => u._id);
  const studentDocs = await Student.find({ profileInfo: { $in: studentUserIds } });

  const orgToStudents = new Map();
  for (const su of allStudentUsers) {
    const orgName = su.organisation?.name || 'N/A';
    const stud = studentDocs.find(sd => String(sd.profileInfo) === String(su._id));
    if (!stud) continue;
    if (!orgToStudents.has(orgName)) orgToStudents.set(orgName, []);
    orgToStudents.get(orgName).push(stud);
  }

  for (const tu of teacherUsers) {
    const teacherDoc = await Teacher.findOne({ profileInfo: tu._id });
    if (!teacherDoc) continue;
    const orgName = tu.organisation?.name || 'N/A';
    const students = orgToStudents.get(orgName) || [];
    if (students.length === 0) continue;

    // Create/update sequential tests for this teacher and these students
    const tests = await createTestsSequential(teacherDoc, students);
    await createResults(tests, students, teacherDoc);
  }
}

async function run() {
  await connectDb();

  // 1) Create realistic teachers for multiple organizations
  const teacherUsers = [
    { firstName: 'Amit', lastName: 'Patel', email: 'amit.patel@bvm.edu', role: 'teacher', organisationName: 'BVM' },
    { firstName: 'Neha', lastName: 'Sharma', email: 'neha.sharma@demo.edu', role: 'teacher', organisationName: 'N/A' },
    { firstName: 'Vikas', lastName: 'Gupta', email: 'vikas.gupta@businessacademy.edu', role: 'teacher', organisationName: 'Business Academy' },
    { firstName: 'Ananya', lastName: 'Roy', email: 'ananya.roy@scienceinstitute.edu', role: 'teacher', organisationName: 'Science Institute' }
  ];

  const teacherProfiles = [];
  for (const u of teacherUsers) {
    const profile = await upsertUser(u);
    teacherProfiles.push(await ensureTeacher(profile));
  }

  // 2) Create realistic students (mapped to their organizations)
  const studentUsers = [
    // BVM
    { firstName: 'Rohan', lastName: 'Desai', email: 'rohan.desai@student.demo', role: 'student', organisationName: 'BVM' },
    { firstName: 'Kabir', lastName: 'Joshi', email: 'kabir.joshi@student.demo', role: 'student', organisationName: 'BVM' },
    // N/A (unaffiliated)
    { firstName: 'Priya', lastName: 'Kapoor', email: 'priya.kapoor@student.demo', role: 'student', organisationName: 'N/A' },
    { firstName: 'Sara', lastName: 'Iqbal', email: 'sara.iqbal@student.demo', role: 'student', organisationName: 'N/A' },
    // Business Academy
    { firstName: 'Arjun', lastName: 'Mehta', email: 'arjun.mehta@businessacademy.student', role: 'student', organisationName: 'Business Academy' },
    { firstName: 'Diya', lastName: 'Varma', email: 'diya.varma@businessacademy.student', role: 'student', organisationName: 'Business Academy' },
    { firstName: 'Ishan', lastName: 'Bose', email: 'ishan.bose@businessacademy.student', role: 'student', organisationName: 'Business Academy' },
    // Science Institute
    { firstName: 'Meera', lastName: 'Sen', email: 'meera.sen@scienceinstitute.student', role: 'student', organisationName: 'Science Institute' },
    { firstName: 'Rahul', lastName: 'Khan', email: 'rahul.khan@scienceinstitute.student', role: 'student', organisationName: 'Science Institute' },
    { firstName: 'Zara', lastName: 'Ali', email: 'zara.ali@scienceinstitute.student', role: 'student', organisationName: 'Science Institute' },
  ];

  const studentProfiles = [];
  for (const u of studentUsers) {
    const profile = await upsertUser(u);
    studentProfiles.push(await ensureStudent(profile));
  }

  // 3) Ensure every existing teacher user has a Teacher document
  const allTeacherUsers = await require('../model/User').find({ role: 'teacher' });
  for (const tUser of allTeacherUsers) {
    const exists = await Teacher.findOne({ profileInfo: tUser._id });
    if (!exists) {
      await ensureTeacher(tUser);
    }
  }

  // 4) Assign tests per teacher by organisation and create results (strictly same-organisation only)
  await seedPerOrganization();

  console.log(`Seed complete: teachers=${(await Teacher.countDocuments())}, students=${(await Student.countDocuments())}.`);
  await mongoose.connection.close();
}

run().catch(async (err) => {
  console.error('Seed failed:', err);
  try { await mongoose.connection.close(); } catch (_) {}
  process.exit(1);
});



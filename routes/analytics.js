const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Test = require("../model/Test");
const Result = require("../model/Result");

// Helper: get date string YYYY-MM-DD
function toDayString(date) {
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// Helper: build range days array
function buildDaysRange(days) {
  const arr = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    arr.push(toDayString(d));
  }
  return arr;
}

// GET /api/analytics/activity
// Returns array of { date, students, teachers }
router.get("/activity", auth, async (req, res) => {
  try {
    const range = (req.query.range || "week").toLowerCase();
    const days = range === "month" ? 30 : 7;
    const start = new Date();
    start.setDate(start.getDate() - (days - 1));

    // Approximate activity: students => submissions (Results), teachers => tests created
    const tests = await Test.find({ createdAt: { $gte: start } }).select("createdAt");
    const results = await Result.find({ attemptedAt: { $gte: start } }).select("attemptedAt");

    const byDay = Object.create(null);
    for (const day of buildDaysRange(days)) byDay[day] = { date: day, students: 0, teachers: 0 };

    tests.forEach(t => {
      const k = toDayString(t.createdAt || t.publishedAt || t.updatedAt || new Date());
      if (!byDay[k]) byDay[k] = { date: k, students: 0, teachers: 0 };
      byDay[k].teachers += 1;
    });
    results.forEach(r => {
      const k = toDayString(r.attemptedAt || r.submittedAt || r.createdAt || new Date());
      if (!byDay[k]) byDay[k] = { date: k, students: 0, teachers: 0 };
      byDay[k].students += 1;
    });

    const data = buildDaysRange(days).map(d => byDay[d]);
    res.status(200).json(data);
  } catch (err) {
    console.error("analytics/activity error", err);
    res.status(500).json([]);
  }
});

// GET /api/analytics/performance
// Returns [{ name: 'Excellent'|'Good'|'Average'|'Poor', value }]
router.get("/performance", auth, async (req, res) => {
  try {
    const range = (req.query.range || "week").toLowerCase();
    const days = range === "month" ? 30 : 7;
    const start = new Date();
    start.setDate(start.getDate() - (days - 1));

    const results = await Result.find({ attemptedAt: { $gte: start } }).select("score outOfMarks");
    const buckets = { Excellent: 0, Good: 0, Average: 0, Poor: 0 };
    results.forEach(r => {
      const outOf = r.outOfMarks || 1;
      const pct = outOf > 0 ? (r.score / outOf) * 100 : 0;
      if (pct >= 85) buckets.Excellent += 1;
      else if (pct >= 70) buckets.Good += 1;
      else if (pct >= 50) buckets.Average += 1;
      else buckets.Poor += 1;
    });
    res.status(200).json(Object.entries(buckets).map(([name, value]) => ({ name, value })));
  } catch (err) {
    console.error("analytics/performance error", err);
    res.status(500).json([]);
  }
});

// GET /api/analytics/subjects
// Returns [{ subject, score }]
router.get("/subjects", auth, async (req, res) => {
  try {
    const range = (req.query.range || "week").toLowerCase();
    const days = range === "month" ? 30 : 7;
    const start = new Date();
    start.setDate(start.getDate() - (days - 1));

    // Join Results with Tests to get category/subject
    const recentResults = await Result.find({ attemptedAt: { $gte: start } }).select("testId score outOfMarks");
    const testIds = [...new Set(recentResults.map(r => String(r.testId)))];
    const tests = await Test.find({ _id: { $in: testIds } }).select("_id category");
    const idToSubject = new Map(tests.map(t => [String(t._id), t.category || "General"]));

    const agg = Object.create(null); // subject -> { totalPct, count }
    recentResults.forEach(r => {
      const subject = idToSubject.get(String(r.testId)) || "General";
      const outOf = r.outOfMarks || 1;
      const pct = outOf > 0 ? (r.score / outOf) * 100 : 0;
      if (!agg[subject]) agg[subject] = { totalPct: 0, count: 0 };
      agg[subject].totalPct += pct;
      agg[subject].count += 1;
    });

    const data = Object.entries(agg).map(([subject, v]) => ({ subject, score: v.count ? Math.round((v.totalPct / v.count) * 100) / 100 : 0 }));
    res.status(200).json(data);
  } catch (err) {
    console.error("analytics/subjects error", err);
    res.status(500).json([]);
  }
});

// GET /api/analytics/completion
// Returns array of { _id: day, completed }
router.get("/completion", auth, async (req, res) => {
  try {
    const range = (req.query.range || "week").toLowerCase();
    const days = range === "month" ? 30 : 7;
    const start = new Date();
    start.setDate(start.getDate() - (days - 1));

    const results = await Result.find({ attemptedAt: { $gte: start } }).select("attemptedAt");
    const counts = Object.create(null);
    for (const day of buildDaysRange(days)) counts[day] = 0;
    results.forEach(r => {
      const k = toDayString(r.attemptedAt || r.submittedAt || r.createdAt || new Date());
      counts[k] = (counts[k] || 0) + 1;
    });
    res.status(200).json(Object.entries(counts).map(([day, completed]) => ({ _id: day, completed })));
  } catch (err) {
    console.error("analytics/completion error", err);
    res.status(500).json([]);
  }
});

// GET /api/analytics/organization/:orgName
// Returns comprehensive organization analytics
router.get("/organization/:orgName", auth, async (req, res) => {
  try {
    const { orgName } = req.params;
    const User = require("../model/User");
    
    console.log(`Fetching analytics for organization: ${orgName}`);
    
    // Get organization users (teachers and students)
    const orgUsers = await User.find({ "organisation.name": orgName });
    const orgTeachers = orgUsers.filter(user => user.role === 'teacher');
    const orgStudents = orgUsers.filter(user => user.role === 'student');
    
    console.log(`Found ${orgUsers.length} users, ${orgTeachers.length} teachers, ${orgStudents.length} students`);
    
    // Get organization tests (created by organization teachers)
    // First, get teacher documents that reference the organization users
    const Teacher = require("../model/Teacher");
    const orgTeacherUserIds = orgTeachers.map(t => t._id);
    const teacherDocs = await Teacher.find({ profileInfo: { $in: orgTeacherUserIds } });
    const teacherIds = teacherDocs.map(t => t._id);
    
    console.log(`User Teacher IDs: ${orgTeacherUserIds.length ? orgTeacherUserIds.join(', ') : 'None'}`);
    console.log(`Teacher Doc IDs: ${teacherIds.length ? teacherIds.join(', ') : 'None'}`);
    
    const orgTests = await Test.find({ teacherId: { $in: teacherIds } });
    console.log(`Found ${orgTests.length} tests for organization`);
    
    // Get organization results (from organization tests)
    const testIds = orgTests.map(t => t._id);
    const orgResults = await Result.find({ testId: { $in: testIds } });
    console.log(`Found ${orgResults.length} results for organization tests`);
    
    // Calculate test performance data
    const testPerformance = orgTests.map(test => {
      const testResults = orgResults.filter(r => String(r.testId) === String(test._id));
      const totalScore = testResults.reduce((sum, r) => sum + (r.score || 0), 0);
      const totalPossible = testResults.reduce((sum, r) => sum + (r.outOfMarks || 0), 0);
      const avgPercentage = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;
      
      return {
        name: test.testName?.substring(0, 15) + '...' || 'Unnamed Test',
        percentage: avgPercentage,
        students: testResults.length,
        avgTime: testResults.length > 0 ? 
          Math.round(testResults.reduce((sum, r) => sum + (r.durationTaken || r.timeTaken || 30), 0) / testResults.length) : 0
      };
    });
    
    res.status(200).json({
      testPerformance: testPerformance.slice(0, 10) || [], // Limit to 10 tests
      summary: {
        totalTests: orgTests.length || 0,
        totalStudents: orgStudents.length || 0,
        totalTeachers: orgTeachers.length || 0,
        totalResults: orgResults.length || 0
      }
    });
  } catch (err) {
    console.error("analytics/organization error", err);
    res.status(500).json({ error: "Failed to fetch organization analytics" });
  }
});

// GET /api/analytics/organization/:orgName/timeline
// Returns test creation timeline data
router.get("/organization/:orgName/timeline", auth, async (req, res) => {
  try {
    const { orgName } = req.params;
    const { period = 'monthly' } = req.query;
    const User = require("../model/User");
    
    // Get organization teachers
    const orgTeachers = await User.find({ 
      "organisation.name": orgName, 
      role: 'teacher' 
    });
    const Teacher = require("../model/Teacher");
    const orgTeacherUserIds = orgTeachers.map(t => t._id);
    const teacherDocs = await Teacher.find({ profileInfo: { $in: orgTeacherUserIds } });
    const teacherIds = teacherDocs.map(t => t._id);
    
    // Get organization tests
    const orgTests = await Test.find({ teacherId: { $in: teacherIds } });
    console.log(`Timeline: Found ${orgTests.length} tests for ${orgName} (${teacherIds.length} teachers)`);
    
    let timelineData = [];
    
    if (period === 'monthly') {
      // Generate last 12 months data
      const months = [];
      const currentDate = new Date();
      
      for (let i = 11; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthName = date.toLocaleDateString('en-US', { month: 'short' });
        const year = date.getFullYear();
        const monthKey = `${year}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        const testsInMonth = orgTests.filter(test => {
          const testDate = new Date(test.createdAt);
          const testMonthKey = `${testDate.getFullYear()}-${String(testDate.getMonth() + 1).padStart(2, '0')}`;
          return testMonthKey === monthKey;
        });
        
        months.push({
          month: monthName,
          tests: testsInMonth.length,
          cumulative: months.length > 0 ? 
            months[months.length - 1].cumulative + testsInMonth.length : 
            testsInMonth.length
        });
      }
      timelineData = months;
    } else if (period === 'weekly') {
      // Generate last 8 weeks data
      const weeks = [];
      const currentDate = new Date();
      
      for (let i = 7; i >= 0; i--) {
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - (i * 7));
        weekStart.setHours(0, 0, 0, 0);
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        
        const weekLabel = `Week ${8 - i}`;
        
        const testsInWeek = orgTests.filter(test => {
          const testDate = new Date(test.createdAt);
          return testDate >= weekStart && testDate <= weekEnd;
        });
        
        weeks.push({
          week: weekLabel,
          testsCreated: testsInWeek.length,
          weekStart: weekStart.toISOString().split('T')[0],
          weekEnd: weekEnd.toISOString().split('T')[0]
        });
      }
      timelineData = weeks;
    } else if (period === 'yearly') {
      // Get organization students for completion calculation
      const orgStudents = await User.find({ 
        "organisation.name": orgName, 
        role: 'student' 
      });
      
      // Generate last 5 years data
      const currentYear = new Date().getFullYear();
      for (let i = 4; i >= 0; i--) {
        const year = currentYear - i;
        const yearTests = orgTests.filter(test => {
          const testDate = new Date(test.createdAt);
          return testDate.getFullYear() === year;
        });
        
        const yearResults = await Result.find({
          testId: { $in: yearTests.map(t => t._id) }
        });
        
        const avgScore = yearResults.length > 0 ?
          Math.round(yearResults.reduce((sum, r) => sum + ((r.score / (r.outOfMarks || 1)) * 100), 0) / yearResults.length) :
          0;
        
        timelineData.push({
          year: year.toString(),
          tests: yearTests.length,
          students: new Set(yearResults.map(r => String(r.studentId))).size,
          avgScore,
          completion: yearResults.length > 0 ? Math.round((yearResults.length / (yearTests.length * orgStudents.length || 1)) * 100) : 0
        });
      }
    }
    
    res.status(200).json(timelineData);
  } catch (err) {
    console.error("analytics/organization/timeline error", err);
    res.status(500).json([]);
  }
});

// GET /api/analytics/debug/:orgName (temporary debug route)
router.get("/debug/:orgName", async (req, res) => {
  try {
    const { orgName } = req.params;
    const User = require("../model/User");
    const Teacher = require("../model/Teacher");
    
    // Get organization data
    const orgUsers = await User.find({ "organisation.name": orgName });
    const orgTeachers = orgUsers.filter(user => user.role === 'teacher');
    const orgTeacherUserIds = orgTeachers.map(t => t._id);
    const teacherDocs = await Teacher.find({ profileInfo: { $in: orgTeacherUserIds } });
    const teacherIds = teacherDocs.map(t => t._id);
    const orgTests = await Test.find({ teacherId: { $in: teacherIds } });
    const testIds = orgTests.map(t => t._id);
    const orgResults = await Result.find({ testId: { $in: testIds } });
    
    res.json({
      organization: orgName,
      users: orgUsers.length,
      teachers: orgTeachers.length,
      teacherDocs: teacherDocs.length,
      tests: orgTests.length,
      results: orgResults.length,
      teacherUserIds: orgTeacherUserIds,
      teacherDocIds: teacherIds,
      testIds: testIds.slice(0, 3), // just first 3 for brevity
      sampleTest: orgTests[0] ? {
        id: orgTests[0]._id,
        name: orgTests[0].testName,
        teacherId: orgTests[0].teacherId
      } : null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/organization/:orgName/performance-distribution
// Returns score distribution data
router.get("/organization/:orgName/performance-distribution", auth, async (req, res) => {
  try {
    const { orgName } = req.params;
    const User = require("../model/User");
    
    // Get organization teachers and their tests
    const orgTeachers = await User.find({ 
      "organisation.name": orgName, 
      role: 'teacher' 
    });
    const Teacher = require("../model/Teacher");
    const orgTeacherUserIds = orgTeachers.map(t => t._id);
    const teacherDocs = await Teacher.find({ profileInfo: { $in: orgTeacherUserIds } });
    const teacherIds = teacherDocs.map(t => t._id);
    const orgTests = await Test.find({ teacherId: { $in: teacherIds } });
    const testIds = orgTests.map(t => t._id);
    
    // Get all results for organization tests
    const orgResults = await Result.find({ testId: { $in: testIds } });
    
    // Calculate score distribution
    const distribution = {
      excellent: 0, // 90-100%
      good: 0,      // 80-89%
      average: 0,   // 70-79%
      below: 0      // <70%
    };
    
    orgResults.forEach(result => {
      const percentage = (result.score / (result.outOfMarks || 1)) * 100;
      if (percentage >= 90) distribution.excellent++;
      else if (percentage >= 80) distribution.good++;
      else if (percentage >= 70) distribution.average++;
      else distribution.below++;
    });
    
    const total = orgResults.length || 1;
    const distributionData = [
      { 
        name: 'Excellent (90-100%)', 
        value: Math.round((distribution.excellent / total) * 100),
        count: distribution.excellent,
        color: '#10b981' 
      },
      { 
        name: 'Good (80-89%)', 
        value: Math.round((distribution.good / total) * 100),
        count: distribution.good,
        color: '#3b82f6' 
      },
      { 
        name: 'Average (70-79%)', 
        value: Math.round((distribution.average / total) * 100),
        count: distribution.average,
        color: '#f59e0b' 
      },
      { 
        name: 'Below Average (<70%)', 
        value: Math.round((distribution.below / total) * 100),
        count: distribution.below,
        color: '#ef4444' 
      }
    ];
    
    res.status(200).json(distributionData);
  } catch (err) {
    console.error("analytics/organization/performance-distribution error", err);
    res.status(500).json([]);
  }
});

module.exports = router;



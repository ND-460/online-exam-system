const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Test = require("../model/Test");
const Teacher = require("../model/Teacher");
const User = require("../model/User");
const Result = require("../model/Result");
require("dotenv").config();
const Student = require("../model/Student");
const upload = require("../utils/fileUpload");
const pdfProcessor = require("../utils/pdfProcessor");
const aiService = require("../utils/aiService");

/**
 * @method - GET
 * @param - /tests
 * @description - Fetching All the tests that teacher assigned using testID
 */

// router.get("/tests/:profileID", auth, async (req, res) => {
//   const profileID = req.params.profileID;
//   console.log("teacher", profileID);
//   try {
//     await Test.find(
//       {
//         teacherId: profileID,
//       },
//       "submitBy className testName"
//     ).exec(function (err, obj) {
//       if (err) {
//         return res.status(400).json({ err });
//       } else {
//         return res.status(200).json({
//           obj,
//         });
//       }
//     });
//   } catch (err) {
//     console.log(err.message);
//     res.status(500).send("Error in fetching Tests");
//   }
// });
router.get("/tests/:profileID", auth, async (req, res) => {
  const profileID = req.params.profileID;
  try {
    // Get the teacher's organisation first
    const teacher = await Teacher.findById(profileID, "organisation");
    if (!teacher) return res.status(404).send("Teacher not found");

    const tests = await Test.find(
      { 
        teacherId: profileID,
        organisation: teacher.organisation, // filter by organisation
      },
      "submitBy testName category className minutes rules outOfMarks questions organisation"
    );

    return res.status(200).json(tests);
  } catch (err) {
    console.log(err.message);
    res.status(500).send("Error in fetching Tests");
  }
});


/**
 * @method - GET
 * @param - /classes
 * @description - Fetching All the classes which are registered in Database
 */

// router.get("/classes", auth, async (req, res) => {
//   console.log("fetch classes");
//   try {
//     await User.find({}, "className -_id", function (err, obj) {
//       if (err) {
//         return res.status(400).json({ err });
//       } else {
//         return res.status(200).json({
//           obj,
//         });
//       }
//     });
//   } catch (err) {
//     console.log(err.message);
//     res.status(500).send("Error in fetching Tests");
//   }
// });
router.get("/classes", auth, async (req, res) => {
  console.log("fetch classes");
  try {
    const obj = await User.find({}, "className -_id");
    return res.status(200).json(obj);
  } catch (err) {
    console.log(err.message);
    res.status(500).send("Error in fetching classes");
  }
});

/**
 * @method - GET
 * @param - /profile/:profileID
 * @description - Fetching Teacher Profile from database
 */

// router.get("/profile/:profileID", auth, async (req, res) => {
//   const profileID = req.params.profileID;

//   try {
//     await Teacher.findOne({
//       _id: profileID,
//     })
//       .populate("profileInfo")
//       .exec(function (err, obj) {
//         if (err) {
//           return res.status(400).json({ err });
//         } else {
//           return res.status(200).json({
//             obj,
//           });
//         }
//       });
//   } catch (err) {
//     console.log(err.message);
//     res.status(500).send("Error in fetching Student Data");
//   }
// });

router.get("/profile/:profileID", auth, async (req, res) => {
  const profileID = req.params.profileID;

  try {
    const obj = await Teacher.findOne({
      _id: profileID,
    })
      .populate("profileInfo")
      .exec();

    if (!obj) {
      return res.status(404).json({ message: "Student not found" });
    } else {
      return res.status(200).json({
        obj,
      });
    }
  } catch (err) {
    console.log(err.message);
    res.status(500).send("Error in fetching Student Data");
  }
});

/**
 * @method - POST
 * @param - /create-test
 * @description - Creating Test for the students using teacherID
 */

router.post("/create-test", auth, async (req, res) => {
  const {
    teacherId,
    testName,
    category,
    minutes,
    rules,
    className,
    outOfMarks,
    answers,
    questions,
    scheduledAt,
    organisation,
  } = req.body;

  try {
    // Check if test already exists
    let existingTest = await Test.findOne({ testName, className, category,"organisation.name": organisation.name });
    if (existingTest) {
      return res.status(400).json({ msg: "Test Already Created" });
    }

    // Get all students of the class via populate
    const students = await Student.find().populate({
      path: "profileInfo",
      match: { className,"organisation.name": organisation.name, },
      select: "_id className organisation",
    });

    const studentIds = students
      .filter((s) => s.profileInfo)
      .map((s) => s.profileInfo._id.toString());

    // Create test
    const createTest = new Test({
      teacherId,
      testName,
      category,
      answers,
      minutes,
      className,
      rules,
      outOfMarks,
      questions,
      assignedTo: studentIds,
      organisation,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
    });

    const data = await createTest.save();
    res.status(200).json({ payload: { data } });
  } catch (err) {
    console.log(err.message);
    res.status(500).send("Error in Saving");
  }
});

/**
 * @method - PUT
 * @param - /update-test/:testid
 * @description - Updating Test using testID
 */

// router.put("/update-test/:testid", auth, async (req, res) => {
//   const testID = req.params.testid;
//   console.log(testID);
//   const questionsData = req.body.questions;
//   try {
//     const testData = await Test.findOneAndUpdate(
//       { _id: testID },
//       { questions: questionsData },
//       function (err, updatedData) {
//         if (err) {
//           return res.status(400).json({ message: "failed to update document" });
//         } else {
//           return res.status(200).json({
//             message: "questions succesfully updated",
//           });
//         }
//       }
//     );
//   } catch (err) {
//     console.log(err.message);
//     res.status(500).send("Error in Updating");
//   }
// });

router.put("/update-test/:testid", auth, async (req, res) => {
  const testID = req.params.testid;
  const { questions, className } = req.body;

  try {
    let updateData = { questions };

    // If className is provided or changed, update assignedTo
    if (className) {
      // Fetch all students of this class
      const students = await Student.find().populate({
        path: "profileInfo",
        match: { className },
        select: "_id className",
      });

      const studentIds = students
        .filter((s) => s.profileInfo) // remove unmatched
        .map((s) => s.profileInfo._id.toString());

      updateData.className = className;
      updateData.assignedTo = studentIds;
    }

    const updatedTest = await Test.findByIdAndUpdate(testID, updateData, {
      new: true,
    });

    if (!updatedTest) {
      return res.status(404).json({ message: "Test not found" });
    }

    res.status(200).json({ message: "Test successfully updated", updatedTest });
  } catch (err) {
    console.log(err.message);
    res.status(500).send("Error in Updating");
  }
});

/**
 * @method - PUT
 * @param - /update-profile/:profileID
 * @description - Updating Teacher profile using profileID
 */

// router.put("/update-profile/:profileID", auth, async (req, res) => {
//   const profileID = req.params.profileID;
//   const { firstName, lastName, email, password, phone } = req.body;
//   try {
//     const testData = await Teacher.findOneAndUpdate(
//       { _id: profileID },
//       { ...req.body },
//       function (err, updatedData) {
//         if (err) {
//           return res.status(400).json({ message: "failed to update profile" });
//         } else {
//           console.log(updatedData);
//           return res.status(200).json({
//             message: "profile succesfully updated",
//           });
//         }
//       }
//     );
//   } catch (err) {
//     console.log(err.message);
//     res.status(500).send("Error in Updating Profile");
//   }
// });

router.put("/update-profile/:profileID", auth, async (req, res) => {
  const profileID = req.params.profileID;
  const { firstName, lastName, email, password, phone } = req.body;

  try {
    const updatedProfile = await Teacher.findOneAndUpdate(
      { _id: profileID },
      { ...req.body },
      { new: true }
    );

    if (!updatedProfile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    console.log(updatedProfile);
    return res.status(200).json({
      message: "Profile successfully updated",
    });
  } catch (err) {
    console.log(err.message);
    res.status(500).send("Error in Updating Profile");
  }
});

/**
 * @method - PUT
 * @param - /assigend-to/:testID
 * @description - Fetching classes to which the test assigned using testID
 */

// router.put("/assigend-to/:testID", auth, async (req, res) => {
//   const testID = req.params.testID;
//   const { className } = req.body;
//   try {
//     await Test.updateOne(
//       { _id: testID },
//       {
//         $addToSet: { assignedTo: [...className] },
//       },
//       function (err, updatedData) {
//         if (err) {
//           return res
//             .status(400)
//             .json({ message: "failed to update assigendStudents" });
//         } else {
//           return res.status(200).json({
//             updatedData,
//           });
//         }
//       }
//     );
//   } catch (err) {
//     res.status(500).send("Error in Updating");
//   }
// });

router.put("/assigend-to/:testID", auth, async (req, res) => {
  const testID = req.params.testID;
  const { className } = req.body;

  try {
    const updatedData = await Test.updateOne(
      { _id: testID },
      {
        $addToSet: { assignedTo: { $each: className } },
      }
    );

    return res.status(200).json({
      updatedData,
    });
  } catch (err) {
    console.log(err.message);
    res.status(500).send("Error in Updating");
  }
});

/**
 * @method - DELETE
 * @param - /delete-test/:testid
 * @description - Delete a particular test using testID
 */

// router.delete("/delete-test/:testid", auth, async (req, res) => {
//   const testID = req.params.testid;
//   console.log(testID);
//   try {
//     const testData = await Test.findByIdAndDelete(testID, function (err) {
//       if (err) {
//         return res.status(400).json({ message: "failed to delete document" });
//       } else {
//         return res.status(200).json({
//           message: "successfully deleted",
//         });
//       }
//     });
//   } catch (err) {
//     console.log(err.message);
//     res.status(500).send("Error in Deleting");
//   }
// });

router.delete("/delete-test/:testid", auth, async (req, res) => {
  const testID = req.params.testid;
  console.log(testID);

  try {
    const deletedTest = await Test.findByIdAndDelete(testID);

    if (!deletedTest) {
      return res.status(404).json({ message: "Test not found" });
    }

    res.status(200).json({ message: "Successfully deleted" });
  } catch (err) {
    console.log(err.message);
    res.status(500).send("Error in Deleting");
  }
});

router.get("/results/test/:testID", auth, async (req, res) => {
  const { testID } = req.params;
  const {
    sortBy = "score",
    order = "desc",
    minScore,
    maxScore,
    page = 1,
    limit = 10,
  } = req.query;

  try {
    let filter = { testID };

    if (minScore !== undefined || maxScore !== undefined) {
      filter.score = {};
      if (minScore !== undefined) filter.score.$gte = Number(minScore);
      if (maxScore !== undefined) filter.score.$lte = Number(maxScore);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const results = await Result.find(filter)
      .populate("studentID", "name email rollNo")
      .populate("testID", "title duration")
      .sort({ [sortBy]: order === "asc" ? 1 : -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Result.countDocuments(filter);

    res.status(200).json({
      results,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.log(err.message);
    res.status(500).send("Error in fetching test results");
  }
});

router.get("/submissions/:testId", auth, async (req, res) => {
  try {
    const { testId } = req.params;

    const submissions = await Result.find({ testId })
      // .populate("studentId", "name email")
      .populate({
        path: "studentId",
        populate: {
          path: "profileInfo",
          select: "firstName lastName email",
        },
      })
      .sort({ submittedAt: -1 });

    res.status(200).json(submissions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching submissions" });
  }
});

router.post("/feedback/:resultId", auth, async (req, res) => {
  try {
    const { resultId } = req.params;
    const { feedback } = req.body;

    const updated = await Result.findByIdAndUpdate(
      resultId,
      { feedback },
      { new: true }
    );

    res.status(200).json({ message: "Feedback added", updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error saving feedback" });
  }
});

router.get("/analytics/:testId", auth, async (req, res) => {
  try {
    const { testId } = req.params;
    const results = await Result.find({ testId });

    const totalStudents = results.length;

    // Average raw score
    const avgScore =
      results.reduce((acc, r) => acc + r.score, 0) / (totalStudents || 1);

    // Average percentage
    const avgPercentage =
      results.reduce((acc, r) => acc + (r.score / r.outOfMarks) * 100, 0) /
      (totalStudents || 1);

    const scoreDistribution = results.map((r) => ({
      student: r.studentId,
      score: r.score,
      outOfMarks: r.outOfMarks,
      percentage: ((r.score / r.outOfMarks) * 100).toFixed(2),
    }));

    res.status(200).json({
      totalStudents,
      avgScore: avgScore.toFixed(2),
      avgPercentage: avgPercentage.toFixed(2),
      scoreDistribution,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching analytics" });
  }
});

/**
 * @method - POST
 * @param - /generate-questions-pdf
 * @description - Generate questions from uploaded PDF material
 */
router.post(
  "/generate-questions-pdf",
  auth,
  upload.single("pdf"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No PDF file uploaded" });
      }

      const {
        numQuestions = 5,
        difficulty = "medium",
        subject = "general",
      } = req.body;

      // Process PDF and extract text and keywords
      const pdfData = await pdfProcessor.processUploadedPDF(req.file.path);

      // Generate questions using AI service
      const questions = await aiService.generateQuestionsFromKeywords(
        pdfData.keywords,
        {
          numQuestions: parseInt(numQuestions),
          difficulty,
          subject,
          questionType: "multiple-choice",
        }
      );

      // Return questions directly for frontend integration
      res.status(200).json({
        success: true,
        questions,
        metadata: {
          extractedKeywords: pdfData.keywords,
          wordCount: pdfData.wordCount,
          generatedQuestions: questions.length,
        },
      });
    } catch (err) {
      console.error("PDF question generation error:", err);

      // Fallback: Generate simple questions locally if AI fails
      try {
        const fallbackQuestions = await aiService.generateWithLocal(
          ["general", "concept", "theory"],
          { numQuestions: parseInt(numQuestions), difficulty, subject }
        );

        res.status(200).json({
          success: true,
          questions: fallbackQuestions,
          metadata: {
            extractedKeywords: ["fallback"],
            wordCount: 0,
            generatedQuestions: fallbackQuestions.length,
            note: "Generated using fallback method",
          },
        });
      } catch (fallbackErr) {
        res.status(500).json({
          success: false,
          message: "Question generation from PDF failed",
          error: err.message,
        });
      }
    }
  }
);

/**
 * @method - POST
 * @param - /generate-questions-prompt
 * @description - Generate questions from direct text prompt
 */
router.post("/generate-questions-prompt", auth, async (req, res) => {
  try {
    const {
      prompt,
      numQuestions = 5,
      difficulty = "medium",
      subject = "general",
    } = req.body;

    if (!prompt || prompt.trim().length === 0) {
      return res.status(400).json({ message: "Prompt is required" });
    }

    // Generate questions using AI service
    const questions = await aiService.generateQuestionsFromPrompt(prompt, {
      numQuestions: parseInt(numQuestions),
      difficulty,
      questionType: "multiple-choice",
    });

    res.status(200).json({
      success: true,
      questions,
      metadata: {
        prompt,
        generatedQuestions: questions.length,
        difficulty,
        subject,
      },
    });
  } catch (err) {
    console.error("Prompt question generation error:", err);

    // Fallback: Generate simple questions locally if AI fails
    try {
      const fallbackQuestions = await aiService.generateWithLocal(
        [prompt, subject, "concept"],
        { numQuestions: parseInt(numQuestions), difficulty, subject }
      );

      res.status(200).json({
        success: true,
        questions: fallbackQuestions,
        metadata: {
          prompt,
          generatedQuestions: fallbackQuestions.length,
          difficulty,
          subject,
          note: "Generated using fallback method",
        },
      });
    } catch (fallbackErr) {
      res.status(500).json({
        success: false,
        message: "Question generation from prompt failed",
        error: err.message,
      });
    }
  }
});

/**
 * @method - POST
 * @param - /enhance-questions
 * @description - Enhance existing questions using AI
 */
router.post("/enhance-questions", auth, async (req, res) => {
  try {
    const { questions, context = "" } = req.body;

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: "Questions array is required" });
    }

    // Enhance questions using AI service
    const enhancedQuestions = await aiService.enhanceQuestions(
      questions,
      context
    );

    res.status(200).json({
      success: true,
      questions: enhancedQuestions,
      metadata: {
        originalCount: questions.length,
        enhancedCount: enhancedQuestions.length,
      },
    });
  } catch (err) {
    console.error("Question enhancement error:", err);
    res.status(500).json({
      success: false,
      message: "Question enhancement failed",
      error: err.message,
    });
  }
});

/**
 * @method - PUT
 * @param - /publish-test/:testId
 * @description - Publish a test to make it available to students
 */
router.put("/publish-test/:testId", auth, async (req, res) => {
  try {
    const { testId } = req.params;
    const { dueDate } = req.body;

    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ message: "Test not found" });
    }

    // Update test status to published
    test.status = "published";
    test.publishedAt = new Date();
    if (dueDate) {
      test.dueDate = new Date(dueDate);
    }

    await test.save();

    res.status(200).json({
      success: true,
      message: "Test published successfully",
      test,
    });
  } catch (err) {
    console.error("Error publishing test:", err);
    res.status(500).json({ message: "Error publishing test" });
  }
});

/**
 * @method - POST
 * @param - /assign-test/:testId
 * @description - Assign test to specific students
 */
router.post("/assign-test/:testId", auth, async (req, res) => {
  try {
    const { testId } = req.params;
    const { studentIds, dueDate } = req.body;

    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ message: "Test not found" });
    }

    // Get student details
    const students = await User.find({ _id: { $in: studentIds } });

    const assignedStudents = students.map((student) => ({
      studentId: student._id,
      studentName: `${student.firstName} ${student.lastName}`,
      assignedAt: new Date(),
    }));

    // Update test with assigned students
    test.assignedStudents = assignedStudents;
    test.assignedTo = studentIds;
    test.status = "published";
    test.publishedAt = new Date();
    if (dueDate) {
      test.dueDate = new Date(dueDate);
    }

    await test.save();

    res.status(200).json({
      success: true,
      message: "Test assigned successfully",
      assignedStudents: assignedStudents.length,
    });
  } catch (err) {
    console.error("Error assigning test:", err);
    res.status(500).json({ message: "Error assigning test" });
  }
});

/**
 * @method - GET
 * @param - /test-results/:testId
 * @description - Get detailed test results and analytics
 */
router.get("/test-results/:testId", auth, async (req, res) => {
  try {
    const { testId } = req.params;

    const test = await Test.findById(testId)
      .populate("submissions.studentId", "firstName lastName email")
      .populate("assignedStudents.studentId", "firstName lastName email");

    if (!test) {
      return res.status(404).json({ message: "Test not found" });
    }

    // Calculate analytics
    const totalAssigned = test.assignedStudents.length;
    const totalSubmissions = test.submissions.length;
    const completionRate =
      totalAssigned > 0 ? (totalSubmissions / totalAssigned) * 100 : 0;

    const scores = test.submissions.map((s) => s.score);
    const averageScore =
      scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
    const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;

    // Grade distribution
    const gradeDistribution = {
      "A (90-100%)": test.submissions.filter((s) => s.percentage >= 90).length,
      "B (80-89%)": test.submissions.filter(
        (s) => s.percentage >= 80 && s.percentage < 90
      ).length,
      "C (70-79%)": test.submissions.filter(
        (s) => s.percentage >= 70 && s.percentage < 80
      ).length,
      "D (60-69%)": test.submissions.filter(
        (s) => s.percentage >= 60 && s.percentage < 70
      ).length,
      "F (Below 60%)": test.submissions.filter((s) => s.percentage < 60).length,
    };

    // Top performers
    const topPerformers = test.submissions
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((submission) => ({
        studentName: submission.studentName,
        score: submission.score,
        percentage: submission.percentage,
        submittedAt: submission.submittedAt,
      }));

    res.status(200).json({
      test: {
        testName: test.testName,
        category: test.category,
        className: test.className,
        outOfMarks: test.outOfMarks,
        publishedAt: test.publishedAt,
        dueDate: test.dueDate,
      },
      analytics: {
        totalAssigned,
        totalSubmissions,
        completionRate: Math.round(completionRate * 100) / 100,
        averageScore: Math.round(averageScore * 100) / 100,
        averagePercentage:
          Math.round((averageScore / test.outOfMarks) * 10000) / 100,
        highestScore,
        lowestScore,
        gradeDistribution,
        topPerformers,
      },
      submissions: test.submissions,
      assignedStudents: test.assignedStudents,
    });
  } catch (err) {
    console.error("Error fetching test results:", err);
    res.status(500).json({ message: "Error fetching test results" });
  }
});

/**
 * @method - GET
 * @param - /dashboard-analytics/:teacherId
 * @description - Get teacher dashboard analytics
 */
router.get("/dashboard-analytics/:teacherId", auth, async (req, res) => {
  try {
    const { teacherId } = req.params;

    const tests = await Test.find({ teacherId });

    // Overall statistics
    const totalTests = tests.length;
    const publishedTests = tests.filter((t) => t.status === "published").length;
    const draftTests = tests.filter((t) => t.status === "draft").length;
    const completedTests = tests.filter((t) => t.status === "completed").length;

    // Student engagement
    const totalAssignments = tests.reduce(
      (sum, test) => sum + test.assignedStudents.length,
      0
    );
    const totalSubmissions = tests.reduce(
      (sum, test) => sum + test.submissions.length,
      0
    );
    const overallCompletionRate =
      totalAssignments > 0 ? (totalSubmissions / totalAssignments) * 100 : 0;

    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentTests = tests.filter((t) => t.createdAt >= thirtyDaysAgo);
    const recentSubmissions = tests.reduce((submissions, test) => {
      const recent = test.submissions.filter(
        (s) => s.submittedAt >= thirtyDaysAgo
      );
      return submissions.concat(recent);
    }, []);

    // Performance trends
    const performanceData = tests
      .filter((t) => t.submissions.length > 0)
      .map((test) => ({
        testName: test.testName,
        averageScore:
          test.submissions.reduce((sum, s) => sum + s.percentage, 0) /
          test.submissions.length,
        submissionCount: test.submissions.length,
        date: test.publishedAt,
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    res.status(200).json({
      overview: {
        totalTests,
        publishedTests,
        draftTests,
        completedTests,
        totalAssignments,
        totalSubmissions,
        overallCompletionRate: Math.round(overallCompletionRate * 100) / 100,
      },
      recentActivity: {
        testsCreated: recentTests.length,
        submissionsReceived: recentSubmissions.length,
      },
      performanceData,
    });
  } catch (err) {
    console.error("Error fetching dashboard analytics:", err);
    res.status(500).json({ message: "Error fetching dashboard analytics" });
  }
});

/**
 * @method - GET
 * @param - /students/:className
 * @description - Get all students in a class for assignment
 */
router.get("/students/:className", auth, async (req, res) => {
  try {
    const { className } = req.params;

    const students = await User.find({
      className,
      role: "student",
    }).select("firstName lastName email _id");

    res.status(200).json({
      success: true,
      students,
    });
  } catch (err) {
    console.error("Error fetching students:", err);
    res.status(500).json({ message: "Error fetching students" });
  }
});

module.exports = router;

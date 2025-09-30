const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Student = require("../model/Student");
const Test = require("../model/Test");
const User = require("../model/User");
const Result = require("../model/Result");
const mongoose = require("mongoose");
require("dotenv").config();



router.get("/tests/student/:userId?", auth, async (req, res) => {
  const  userId  = req.params.userId || req.user?.id;

  if (!mongoose.isValidObjectId(userId)) {
    return res.status(400).json({ message: "Invalid User ID" });
  }

  try {
   
    const student = await Student.findOne({ profileInfo: userId });
    if (!student) {
      return res.status(404).json({ message: "Student not found for this User ID" });
    }

    const now = new Date();

    // Fetch tests assigned to this user
    const tests = await Test.find({ assignedTo: userId });

    let upcoming = 0;
    let ongoing = 0;
    let completed = 0;

    tests.forEach((test) => {
      const startTime = test.scheduledAt ? new Date(test.scheduledAt) : null;
      const endTime =
        startTime && test.minutes
          ? new Date(startTime.getTime() + test.minutes * 60000)
          : null;

     
      const attempted = student.attemptedTests.some(
        (a) => a.testId.toString() === test._id.toString()
      );

      if (attempted) {
        completed++;
      } else if (startTime && endTime && now >= startTime && now <= endTime) {
        ongoing++;
      } else if (!startTime || now < startTime) {
        upcoming++;
      }
    });

    res.status(200).json({ upcoming, ongoing, completed });
  } catch (err) {
    console.error("Error fetching student tests:", err);
    res.status(500).json({ message: "Error fetching student tests" });
  }
});


/**
 * @method - GET
 * @param - /profile/:profileID
 * @description - Fetch student profile using profileID
 */

// router.get("/profile/:profileID", auth, async (req, res) => {
//   const profileID = req.params.profileID;

//   try {
//     await Student.findOne({
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
    const obj = await Student.findOne({
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
 * @method - GET
 * @param - /tests/:studentClass
 * @description - Fetch all the tests that student class assigned
 */

router.get("/tests/:studentClass", auth, async (req, res) => {
  const studentClass = req.params.studentClass;

  try {
    await Test.find(
      {
        className: studentClass,
      },
      "-assignedTo -submitBy -teacherId -__v"
    ).exec(function (err, obj) {
      if (err) {
        return res.status(400).json({ err });
      } else {
        return res.status(200).json({
          obj,
        });
      }
    });
  } catch (err) {
    console.log(err.message);
    res.status(500).send("Error in fetching Test Data");
  }
});

/**
 * @method - GET
 * @param - /attempt-tests/:studentID
 * @description - Fetch all attempted tests of student
 */

router.get("/attempt-tests/:studentID", auth, async (req, res) => {
  const studentID = req.params.studentID;

  try {
    await Student.find({
      _id: studentID,
    }).exec(function (err, obj) {
      if (err) {
        return res.status(400).json({ err });
      } else {
        return res.status(200).json({
          obj,
        });
      }
    });
  } catch (err) {
    console.log(err.message);
    res.status(500).send(err);
  }
});

/**
 * @method - POST
 * @param - /results/:studentID
 * @description - Fetch student results using studentID
 */

router.get("/results/:studentID", auth, async (req, res) => {
  const studentID = req.params.studentID;

  try {
    const results = await Result.find({ studentID }).populate(
      "testID",
      "title duration"
    );
    res.status(200).json({ results });
  } catch (err) {
    console.log(err.message);
    res.status(500).send("Error in fetching results");
  }
});

/**
 * @method - PUT
 * @param - /update-profile/:profileID
 * @description - Update student profile using profileID
 */

// router.put("/update-profile/:profileID", auth, async (req, res) => {
//   const profileID = req.params.profileID;
//   const {
//     firstName,
//     lastName,
//     email,
//     password,
//     phone,
//     className,
//     section,
//   } = req.body;
//   try {
//     const testData = await User.findOneAndUpdate(
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
  const { firstName, lastName, email, password, phone, className, section } =
    req.body;

  try {
    const updatedData = await User.findOneAndUpdate(
      { _id: profileID },
      { ...req.body },
      { new: true }
    );

    if (!updatedData) {
      return res.status(404).json({ message: "Profile not found" });
    }

    console.log(updatedData);
    return res.status(200).json({
      message: "Profile successfully updated",
    });
  } catch (err) {
    console.log(err.message);
    res.status(500).send("Error in Updating Profile");
  }
});

/**
 * @method - POST
 * @param - /attempt-test/:testID
 * @description - Submit particular test using testID
 */

//   const { testID } = req.params;
//   const { answers } = req.body;
//   const studentId = req.user.id;
//   const date = Date.now();

//   try {
//     const test = await Test.findById(testID);
//     if (!test) return res.status(404).json({ message: "Test not found" });

//     let score = 0;
//     const evaluatedAnswers = [];

//     test.questions.forEach((q, i) => {
//       const submitted = answers[i];
//       const isCorrect = submitted === q.correctAnswer;
//       if (isCorrect) score++;
//       evaluatedAnswers.push({
//         question: q._id,
//         submitted,
//         correctAnswer: q.correctAnswer,
//         isCorrect,
//       });
//     });

//     await Test.updateOne(
//       { _id: testID },
//       { $addToSet: { submitBy: studentId }, attempted: true }
//     );

//     await Student.updateOne(
//       { _id: studentId },
//       {
//         $push: {
//           attemptedTests: {
//             testId: test._id,
//             testName: test.title,
//             score,
//             outOfMarks: test.questions.length,
//             attemptedAt: date,
//           },
//         },
//         $set: {
//           "testStatus.$[elem].status": "submitted",
//           "testStatus.$[elem].endedAt": date,
//         },
//       },
//       {
//         arrayFilters: [{ "elem.testId": test._id }],
//       }
//     );

//     await Result.create({
//       studentID: studentId,
//       testID,
//       testName: test.title,
//       score,
//       answers: evaluatedAnswers,
//       submittedAt: date,
//     });

//     return res.status(200).json({
//       message: "Test submitted successfully",
//       score,
//       total: test.questions.length,
//     });
//   } catch (err) {
//     console.log(err.message);
//     res.status(500).send("Error in submitting test data");
//   }
// });
// POST /api/student/attempt-test/:testId
router.post("/attempt-test/:testId", auth, async (req, res) => {
  const { testId } = req.params;
  const userId = req.user?.id; 
  const { answers } = req.body;
  const date = Date.now();

  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  try {
    // Find the Student linked to this User
    const student = await Student.findOne({ profileInfo: userId });
    if (!student)
      return res.status(404).json({ message: "Student profile not found" });

    // Prevent duplicate submissions
    const existingResult = await Result.findOne({ studentId: student._id, testId });
    if (existingResult) {
      return res.status(400).json({ message: "Test already submitted" });
    }

    const test = await Test.findById(testId);
    if (!test) return res.status(404).json({ message: "Test not found" });

    // Ensure the student is assigned
    if (!test.assignedTo.includes(userId)) {
      return res.status(403).json({ message: "You are not assigned to this test" });
    }

    // Ensure not already submitted
    if (test.submitBy.includes(userId)) {
      return res.status(400).json({ message: "Test already submitted" });
    }

    // Evaluate answers
    let score = 0;
    const evaluatedAnswers = [];

    test.questions.forEach((q, i) => {
      const submitted = answers[i];
      const isCorrect = submitted === q.answer;
      if (isCorrect) score += q.marks || 1;
      evaluatedAnswers.push({
        question: q._id,
        submitted,
        correctAnswer: q.answer,
        isCorrect,
      });
    });

    // Mark test as submitted for this user
    await Test.updateOne(
      { _id: testId },
      { $addToSet: { submitBy: userId }, attempted: true }
    );

    // Update student’s attemptedTests
    await Student.updateOne(
      { _id: student._id },
      {
        $push: {
          attemptedTests: {
            testId: test._id,
            testName: test.testName,
            score,
            outOfMarks: test.questions.length,
            attemptedAt: date,
          },
        },
        $set: {
          "testStatus.$[elem].status": "submitted",
          "testStatus.$[elem].endedAt": date,
        },
      },
      { arrayFilters: [{ "elem.testId": test._id }] }
    );

    // Save Result
    await Result.create({
      studentId: student._id,
      testId: test._id,
      teacherId: test.teacherId,
      testName: test.testName,
      score,
      outOfMarks: test.questions.length,
      answers: evaluatedAnswers,
      submittedAt: date,
    });

    res.status(200).json({
      message: "Test submitted successfully",
      score,
      total: test.questions.length,
    });
  } catch (err) {
    console.error("Error in attempt-test:", err);
    res.status(500).json({ message: "Error submitting test" });
  }
});


/**
 * @method - PUT
 * @param - /update-test-status/:testID
 * @description - Tracking how much time user spented on test using attemptedTime
 */

router.put("/update-test-status/:testID", auth, async (req, res) => {
  const testID = req.params.testID;
  const profileID = req.body.profileID;
  const testName = req.body.testName;
  const completed = req.body.completed;
  const attemptedTime = req.body.attemptedTime;
  const totalTime = req.body.totalTime;
  //console.log(...req.body);
  console.log(testID, profileID, testName, completed, attemptedTime, totalTime);
  if (testID) {
    try {
      let studentData = await Student.findById(profileID);

      let { testStatus } = studentData;
      let test = testStatus.filter((t) => t.testID === testID);
      if (test.length < 1) {
        studentData.testStatus.push({
          testID,
          attemptedTime,
          testName,
          completed,
          totalTime,
        });
        studentData.save();
        return res.status(200).json({
          studentData,
        });
      } else {
        await Student.findOneAndUpdate(
          { _id: profileID, "testStatus.testID": testID },
          {
            $set: {
              "testStatus.$.attemptedTime": attemptedTime,
            },
          },
          { new: true },
          (err, obj) => {
            return res.status(200).json({
              obj,
            });
          }
        );
      }
    } catch (err) {
      console.log(err.message);
      res.status(500).send("Error in updating test data");
    }
  } else {
    res.status(500).send("Undefined Test ID");
  }
});

router.get("/assigned-tests/:userId?", auth, async (req, res) => {
  try {
    const userId = req.params.userId || req.user?.id;

   
    const tests = await Test.find({ assignedTo: { $in: [userId] } });

    const now = new Date();


    const filteredTests = tests.filter((test) => {
      const startTime = new Date(test.scheduledAt);
      const endTime = new Date(startTime.getTime() + test.minutes * 60000);

      const hasSubmitted = test.submitBy.includes(userId);

      if (hasSubmitted) {
        return true; 
      }

      
      if (now < endTime) {
        return true;
      }

      
      return false;
    });

    res.status(200).json({ tests: filteredTests });
  } catch (err) {
    console.error("Error fetching assigned tests:", err);
    res.status(500).send("Server error");
  }
});



router.get("/test/:testId", async (req, res) => {
  try {
    const test = await Test.findById(req.params.testId);
    if (!test) return res.status(404).json({ message: "Test not found" });

    res.status(200).json(test);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.get("/performance", auth, async (req, res) => {
  try {
    const userId = req.user?.id;

    const student = await Student.findOne({ profileInfo: userId });
    if (!student) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    const results = await Result.find({ studentId: student._id })
      .populate("testId", "testName outOfMarks")
      .sort({ attemptedAt: -1 })
      .limit(5);

    if (!results.length) {
      return res.status(404).json({ message: "No performance records found" });
    }

    const performanceData = results.map((result) => {
      const totalMarks = result.testId?.outOfMarks || result.outOfMarks || 1;
      const percentage = ((result.score / totalMarks) * 100).toFixed(2);

      return {
        testName: result.testId?.testName || "Unknown Test",
        score: result.score,
        outOfMarks: totalMarks,
        percentage: Number(percentage),
        date: result.attemptedAt,
      };
    });

    res.json({ performanceData });
  } catch (err) {
    console.error("Error fetching performance:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/active/:userId?",auth, async (req, res) => {
  try {
    const  userId  = req.params.userId || req.user?.id;

   
    const student = await Student.findOne({ profileInfo: userId }).populate("profileInfo");
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    
    const attemptedTestIds = student.attemptedTests.map((t) => t.testId.toString());

    
    const tests = await Test.find({ assignedTo: userId });

    const now = new Date();

    const activeOrUpcoming = tests
      .filter(
        (test) =>
          !attemptedTestIds.includes(test._id.toString()) && 
          !test.submitBy.includes(userId) 
      )
      .map((test) => {
        const startTime = new Date(test.scheduledAt);
        const endTime = new Date(startTime.getTime() + test.minutes * 60000);

        let status = null;
        if (now >= startTime && now <= endTime) {
          status = "active";
        } else if (now < startTime) {
          status = "upcoming";
        }

        if (status) {
          return {
            _id: test._id,
            testName: test.testName,
            category: test.category,
            className: test.className,
            minutes: test.minutes,
            rules: test.rules,
            outOfMarks: test.outOfMarks,
            scheduledAt: test.scheduledAt,
            status,
          };
        }

        return null;
      })
      .filter(Boolean);

    res.json(activeOrUpcoming);
  } catch (error) {
    console.error("Error fetching active tests:", error);
    res.status(500).json({ message: "Server error" });
  }
});




module.exports = router;

const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Test = require("../model/Test");
const Teacher = require("../model/Teacher");
const User = require("../model/User");
const Result = require("../model/Result");
require("dotenv").config();
const Student = require("../model/Student");

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
  console.log("teacher", profileID);
  try {
    const obj = await Test.find(
      { teacherId: profileID },
      "submitBy testName category className minutes rules outOfMarks questions"
    );
    return res.status(200).json(obj);
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
  } = req.body;

  try {
    // Check if test already exists
    let existingTest = await Test.findOne({ testName, className, category });
    if (existingTest) {
      return res.status(400).json({ msg: "Test Already Created" });
    }

    // Get all students of the class via populate
    const students = await Student.find().populate({
      path: "profileInfo",
      match: { className },
      select: "_id className",
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
        path:"studentId",
        populate:{
          path:"profileInfo",
          select:"firstName lastName email"
        }
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


module.exports = router;

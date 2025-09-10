import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import AddQuestions from "./AddQuestions";
import { useAuthStore } from "../../store/authStore";
import axios from "axios";
import { toast } from "react-toastify";
import DatePicker from "react-datepicker";
import "react-toastify/ReactToastify.css";
import ViewSubmissions from "./ViewSubmissions";
import Analytics from "./Analytics";
import ImportQuestionsModal from "./ImportQuestionsModal";

export default function TeacherDashboard() {
  const [tests, setTests] = useState([]);
  const [testTitle, setTestTitle] = useState("");
  const [testType, setTestType] = useState("MCQ");
  const [testDesc, setTestDesc] = useState("");
  const [showQuestions, setShowQuestions] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [className, setClassName] = useState("");
  const [minutes, setMinutes] = useState(30);
  const [rules, setRules] = useState([""]);
  const [editingTest, setEditingTest] = useState(null);
  const [teacherTests, setTeacherTests] = useState([]);
  const [outOfMarks, setOutOfMarks] = useState(0);
  const { logout, token, user } = useAuthStore();
  const [scheduledAt, setScheduledAt] = useState(null);
  const [selectedTest, setSelectedTest] = useState(null);

  const [errors, setErrors] = useState({});
  
  const [isImportOpen, setIsImportOpen] = useState(false);
  const navigate = useNavigate();
  const validateForm = () => {
    let newErrors = {};

    if (!testTitle.trim()) {
      newErrors.testTitle = "Test title is required";
    } else if (testTitle.trim().length < 3) {
      newErrors.testTitle = "Title must be at least 3 characters";
    }

    if (!testType) {
      newErrors.testType = "Test type is required";
    }

    if (!className.trim()) {
      newErrors.className = "Class name is required";
    }

    if (!minutes || minutes <= 0) {
      newErrors.minutes = "Duration must be greater than 0";
    }

    if (rules.some((rule) => rule.trim() === "")) {
      newErrors.rules = "Rules cannot contain empty entries";
    }

    if (testDesc.length > 300) {
      newErrors.testDesc = "Description cannot exceed 300 characters";
    }

    if (scheduledAt && scheduledAt < new Date()) {
      newErrors.scheduledAt = "Scheduled date cannot be in the past";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;


 
  }
  // Calculate total marks from questions
  const calculateTotalMarks = (questions) => {
    const total = questions.reduce((total, q) => total + (q.marks || 1), 0);
    return total > 0 ? total : 1; // Ensure minimum of 1 mark

  };

  useEffect(() => {
    if (!user) {
      navigate("/login");
    } else if (user.role !== "teacher") {
      if (user.role === "student") {
        navigate("/student");
      } else if (user.role === "admin") {
        navigate("/admin");
      }
      toast.error("Unauthorised access");
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/teacher/tests/${user._id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        console.log(res.data);
        setTests(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchTests();
  }, [user._id, token]);
  const refreshTests = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/teacher/tests/${user._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTeacherTests(res.data);
    } catch (err) {
      console.error(err);
    }
  };
  useEffect(() => {
    if (user?._id) refreshTests();
  }, [user]);

  // const handleUpdateTest = async () => {
  //   try {
  //     const res = await axios.put(
  //       `${import.meta.env.VITE_API_URL}/api/test/update-test/${testId}`,
  //       { questions },
  //       {
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //         },
  //       }
  //     );

  //     alert(res.data.message);
  //   } catch (err) {
  //     console.error("Error updating test:", err);
  //     alert("Failed to update test");
  //   }
  // };
  const handleDeleteTest = async (test) => {
    if (
      !window.confirm(
        `Are you sure you want to delete test "${test.testName}"?`
      )
    )
      return;

    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/teacher/delete-test/${test._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      // alert("Test deleted successfully!");
      toast.success("Test deleted successfully!");
      await refreshTests();
    } catch (err) {
      console.error(err);
      // alert("Error deleting test");
      toast.error("Error deleting test");
    }
  };

  const handleNextQuestions = () => {
    if (validateForm()) {
      setShowQuestions(true);
    } else {
       Object.values(errors).forEach((msg) => toast.error(msg));
    }
  };
  const handleSaveQuestions = async (qs) => {
    setQuestions(qs);
    setShowQuestions(false);



    // Calculate total marks from questions
    const totalMarks = calculateTotalMarks(qs);
    setOutOfMarks(totalMarks);


    try {
      if (editingTest) {
        await axios.put(
          `${import.meta.env.VITE_API_URL}/api/teacher/update-test/${editingTest._id
          }`,
          { questions: qs },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        // alert("Test updated successfully!");
        toast.success("Test updated successfully!");
        setEditingTest(null);
      } else {
        // Validate required fields before creating test
        if (!testTitle.trim()) {
          toast.error("Test Title is required");
          return;
        }
        if (!className.trim()) {
          toast.error("Class Name is required");
          return;
        }
        if (qs.length === 0) {
          toast.error("At least one question is required");
          return;
        }

        const payload = {
          teacherId: user._id,
          testName: testTitle,
          category: testType,
          className,
          minutes,
          rules,
          outOfMarks: totalMarks,
          description: testDesc,
          scheduledAt,
          questions: qs,
        };

        console.log("Creating test with payload:", payload);

        await axios.post(
          `${import.meta.env.VITE_API_URL}/api/teacher/create-test`,
          payload,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        // alert("Test created successfully!");
        toast.success("Test created successfully!");
      }

      await refreshTests();
    } catch (err) {
      console.error("Error saving test:", err);
      console.error("Error response:", err.response?.data);
      console.error("Error status:", err.response?.status);
      // alert("Error saving test");
      toast.error(`Error saving test: ${err.response?.data || err.message}`);
    }
  };

  const handleEditTest = (test) => {
    setEditingTest(test);
    setTestTitle(test.testName);
    setTestType(test.category);
    setClassName(test.className);
    setMinutes(test.minutes);
    setRules(test.rules);
    setOutOfMarks(test.outOfMarks);
    setQuestions(test.questions);
    setShowQuestions(true);
  };

  const handleCancelQuestions = () => {
    setShowQuestions(false);
  };
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#151e2e] to-[#1a2236] p-6 text-white">
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">Teacher Dashboard</h2>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/profile">
            <button className="px-4 py-1 bg-[#232f4b] rounded-md text-blue-100 hover:bg-[#2a3957] font-semibold">
              Profile
            </button>
          </Link>
          <button
            onClick={handleLogout}
            className="px-4 py-1 bg-red-600 rounded-md text-white hover:bg-red-700 font-semibold"
          >
            Logout
          </button>
        </div>
      </div>

      {showQuestions ? (
        <AddQuestions
          initialQuestions={questions}
          onSave={handleSaveQuestions}
          onCancel={handleCancelQuestions}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left/Main Column */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              {/* Create New Test - Bigger */}
              <div className="bg-gradient-to-br from-black via-[#181f2e] to-[#232f4b] rounded-3xl p-10 border-2 border-[#232f4b] shadow-2xl w-full min-h-[260px]">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-2xl font-bold tracking-tight text-white">
                    Create New Test
                  </h3>
                  {/* <span className="text-sm text-blue-200">
                    Drafts auto-save
                  </span> */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setIsImportOpen(true)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium text-sm"
                    >
                      Import CSV/Excel
                    </button>

                    <button
                      onClick={() => alert("Upload to AI coming soon!")}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md font-medium text-sm"
                    >
                      Upload to AI
                    </button>
                  </div>
                </div>
                <div className="flex gap-4 mb-4">
                  <input
                    className="flex-1 bg-[#151e2e] border border-[#232f4b] rounded-md px-4 py-3 text-white text-lg mr-2"
                    placeholder="Test Title"
                    value={testTitle}
                    onChange={(e) => setTestTitle(e.target.value)}
                  />
                  
                  <select
                    className="w-48 bg-[#151e2e] border border-[#232f4b] rounded-md px-4 py-3 text-white text-lg"
                    value={testType}
                    onChange={(e) => setTestType(e.target.value)}
                  >
                    <option>MCQ</option>
                    <option>Coding</option>
                    <option>Essay</option>
                  </select>
                </div>
                <div className="flex flex-col mb-4">
                  <label className="text-blue-200 text-sm mb-1">
                    Schedule Test:
                  </label>
                  <DatePicker
                    selected={scheduledAt}
                    onChange={(date) => setScheduledAt(date)}
                    showTimeSelect
                    timeIntervals={15}
                    dateFormat="MMMM d, yyyy h:mm aa"
                    className="bg-[#151e2e] border border-[#232f4b] rounded-md px-4 py-2 text-white"
                    calendarClassName="bg-[#151e2e] text-white rounded-md shadow-lg"
                  />
                </div>
                <div className="flex gap-4 mb-4">
                  {/* Class Selection */}
                  <input
                    className="flex-1 bg-[#151e2e] border border-[#232f4b] rounded-md px-4 py-3 text-white text-lg"
                    placeholder="Class Name (e.g., Class 10)"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                  />

                  {/* Test Duration */}
                  <div className="flex flex-col">
                    <label className="text-blue-200 text-sm mb-1">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      min={1}
                      className="w-32 bg-[#151e2e] border border-[#232f4b] rounded-md px-4 py-2 text-white text-lg"
                      placeholder="30"
                      value={minutes}
                      onChange={(e) => setMinutes(Number(e.target.value))}
                    />
                  </div>

                  {/* Total Marks Display */}
                  <div className="flex flex-col">
                    <label className="text-blue-200 text-sm mb-1">
                      Total Marks
                    </label>
                    <div className="w-32 bg-[#151e2e] border border-[#232f4b] rounded-md px-3 py-3 text-white text-lg text-center">
                      {outOfMarks || "0"}
                    </div>
                    {outOfMarks === 0 && (
                      <span className="text-xs text-blue-300 mt-1">
                        Add questions to see total
                      </span>
                    )}
                  </div>
                </div>

                {/* Rules Section */}
                <div className="mb-4">
                  <label className="text-blue-200 mb-1 block">
                    Test Rules:
                  </label>
                  {rules.map((rule, idx) => (
                    <div key={idx} className="flex gap-2 mb-2">
                      <input
                        className="flex-1 bg-[#151e2e] border border-[#232f4b] rounded-md px-3 py-2 text-white"
                        placeholder={`Rule ${idx + 1}`}
                        value={rule}
                        onChange={(e) => {
                          const updated = [...rules];
                          updated[idx] = e.target.value;
                          setRules(updated);
                        }}
                      />
                      {rules.length > 1 && (
                        <button
                          className="text-red-400 hover:underline"
                          onClick={() =>
                            setRules(rules.filter((_, i) => i !== idx))
                          }
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-md text-sm"
                    onClick={() => setRules([...rules, ""])}
                  >
                    Add Rule
                  </button>
                </div>
                <textarea
                  className="w-full bg-[#151e2e] border border-[#232f4b] rounded-md px-4 py-3 text-white text-lg mb-4"
                  placeholder="Short description"
                  value={testDesc}
                  onChange={(e) => setTestDesc(e.target.value)}
                  rows={3}
                />
                <div className="flex gap-4">
                  <button
                    onClick={handleNextQuestions}
                    className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-md font-semibold text-lg"
                  >
                    Next: Questions
                  </button>
                  {/* <button className="bg-transparent border border-blue-200 text-blue-200 px-6 py-3 rounded-md font-semibold text-lg">
                    Save Draft
                  </button> */}
                </div>
              </div>

              {/* Manage Tests - Bigger */}
              <div className="bg-gradient-to-br from-black via-[#181f2e] to-[#232f4b] rounded-3xl p-10 border-2 border-[#232f4b] shadow-2xl w-full min-h-[180px]">
                <h3 className="text-2xl font-bold mb-4">Manage Tests</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-blue-100 text-lg">
                    <thead>
                      <tr className="border-b border-[#232f4b]">
                        <th className="py-3 font-semibold">Title</th>
                        <th className="py-3 font-semibold">Type</th>
                        <th className="py-3 font-semibold">Class</th>
                        <th className="py-3 font-semibold " colSpan={2}>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {tests.length > 0 ? (
                        tests.map((t) => (
                          <tr key={t._id}>
                            <td>{t.testName}</td>
                            <td>{t.category}</td>
                            <td>{t.className}</td>
                            <td>
                              <button onClick={() => handleEditTest(t)}>
                                Edit
                              </button>
                            </td>
                            <td>
                              <button onClick={() => handleDeleteTest(t)}>
                                Delete
                              </button>
                            </td>
                            <td>
                              <button
                                onClick={() => setSelectedTest(t._id)}
                                className="text-blue-400 underline"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4}>No tests found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* View Submissions */}
              <div className="bg-gradient-to-br from-black via-[#181f2e] to-[#232f4b] rounded-2xl p-6 border border-[#232f4b] shadow-xl w-full">
                <h3 className="font-bold mb-2">View Submissions</h3>
                <p className="text-blue-200 text-xs mb-2">
                  Filter by test or student, see code output and score.
                </p>
                {selectedTest ? (
                  <ViewSubmissions testId={selectedTest} token={token} />
                ) : (
                  <div className="h-24 flex items-center justify-center text-blue-300 text-xs">
                    Select a test from "Manage Tests" to view submissions.
                  </div>
                )}
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="flex flex-col gap-6">
              {/* Analytics (Snapshot) */}
              <div className="bg-gradient-to-br from-black via-[#181f2e] to-[#232f4b] rounded-2xl p-6 border border-[#232f4b] shadow-xl w-full">
                <h3 className="font-bold mb-2">Analytics (Snapshot)</h3>
                {selectedTest ? (
                  <Analytics testId={selectedTest} token={token} />
                ) : (
                  <div className="h-32 flex items-center justify-center text-blue-300 text-xs">
                    Select a test to view analytics.
                  </div>
                )}
              </div>

              {/* Invite Students */}
              <div className="bg-gradient-to-br from-black via-[#181f2e] to-[#232f4b] rounded-2xl p-6 border border-[#232f4b] shadow-xl w-full">
                <h3 className="font-bold mb-2">Invite Students</h3>
                <p className="text-blue-200 text-xs mb-3">
                  Send email invites or generate enroll links.
                </p>
                <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md font-semibold">
                  Generate Link
                </button>
              </div>
            </div>
          </div>
        </>
      )}
      <ImportQuestionsModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={(qs, testDetails) => {
          // Set test details from imported file
          if (testDetails) {
            setTestTitle(testDetails.testTitle);
            setClassName(testDetails.className);
            setScheduledAt(testDetails.testSchedule ? new Date(testDetails.testSchedule) : null);
            setMinutes(testDetails.testDuration);
            setOutOfMarks(testDetails.totalMarks);
          } else {
            // Calculate total marks from questions if no test details
            const totalMarks = calculateTotalMarks(qs);
            setOutOfMarks(totalMarks);
          }
          setQuestions(qs);
          setShowQuestions(true);
          setIsImportOpen(false);
        }}
      />
    </div>
  );
}

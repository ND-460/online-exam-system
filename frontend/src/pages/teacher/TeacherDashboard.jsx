import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import AddQuestions from "./AddQuestions";
import AIQuestionGenerator from "./AIQuestionGenerator";
import TestAssignment from "./TestAssignment";
import TestResults from "./TestResults";
import { useAuthStore } from "../../store/authStore";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";

export default function TeacherDashboard() {
  const [tests, setTests] = useState([]);
  const [testTitle, setTestTitle] = useState("");
  const [testType, setTestType] = useState("MCQ");
  const [testDesc, setTestDesc] = useState("");
  const [showQuestions, setShowQuestions] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [className, setClassName] = useState("");
  const [minutes, setMinutes] = useState(30);
  const [rules, setRules] = useState([]);
  const [editingTest, setEditingTest] = useState(null);
  const [outOfMarks, setOutOfMarks] = useState(0);
  const [currentView, setCurrentView] = useState("dashboard");
  const [selectedTest, setSelectedTest] = useState(null);
  const [showAssignment, setShowAssignment] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [dashboardAnalytics, setDashboardAnalytics] = useState(null);

  const { logout, token, user } = useAuthStore();
  const navigate = useNavigate();

  // check role & redirect
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

  // fetch tests + analytics
  useEffect(() => {
    const fetchTests = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/teacher/tests/${user._id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setTests(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    const fetchAnalytics = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/teacher/dashboard-analytics/${user._id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setDashboardAnalytics(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    if (user?._id) {
      fetchTests();
      fetchAnalytics();
    }
  }, [user?._id, token]);

  const refreshTests = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/teacher/tests/${user._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTests(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTest = async (test) => {
    if (!window.confirm(`Are you sure you want to delete test "${test.testName}"?`)) return;

    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/teacher/delete-test/${test._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Test deleted successfully!");
      await refreshTests();
    } catch (err) {
      console.error(err);
      toast.error("Error deleting test");
    }
  };

  const handleNextQuestions = () => setShowQuestions(true);
  const handleAIGenerator = () => setShowAIGenerator(true);
  const handleCancelAI = () => setShowAIGenerator(false);

  const handleAIQuestionsGenerated = (aiQuestions) => {
    setQuestions(aiQuestions);
    setShowAIGenerator(false);
    setShowQuestions(true);
  };

  const handleSaveQuestions = async (qs) => {
    setQuestions(qs);
    setShowQuestions(false);

    try {
      if (editingTest) {
        await axios.put(
          `${import.meta.env.VITE_API_URL}/api/teacher/update-test/${editingTest._id}`,
          { questions: qs },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Test updated successfully!");
        setEditingTest(null);
      } else {
        const payload = {
          teacherId: user._id,
          testName: testTitle,
          category: testType,
          className,
          minutes,
          rules: rules.filter((r) => r.trim() !== ""),
          outOfMarks,
          description: testDesc,
          questions: qs,
        };

        await axios.post(
          `${import.meta.env.VITE_API_URL}/api/teacher/create-test`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Test created successfully!");
      }

      await refreshTests();
    } catch (err) {
      console.error(err);
      toast.error("Error saving test");
    }
  };

  const handleEditTest = (test) => {
    setEditingTest(test);
    setTestTitle(test.testName);
    setTestType(test.category);
    setClassName(test.className);
    setMinutes(test.minutes);
    setRules(test.rules || []);
    setOutOfMarks(test.outOfMarks);
    setQuestions(test.questions);
    setTestDesc(test.description || "");
    setShowQuestions(true);
  };

  const handleCancelQuestions = () => setShowQuestions(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleAssignTest = (test) => {
    setSelectedTest(test);
    setShowAssignment(true);
  };

  const handleViewResults = (test) => {
    setSelectedTest(test);
    setShowResults(true);
  };

  const handlePublishTest = async (testId) => {
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/teacher/publish-test/${testId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Test published successfully!");
      await refreshTests();
    } catch (error) {
      console.error("Error publishing test:", error);
      toast.error("Failed to publish test");
    }
  };

  const getTestStatusColor = (status) => {
    switch (status) {
      case "draft":
        return "bg-gray-600";
      case "published":
        return "bg-green-600";
      case "completed":
        return "bg-blue-600";
      default:
        return "bg-gray-600";
    }
  };

  const draftTests = tests.filter((t) => t.status === "draft" || !t.status);
  const publishedTests = tests.filter((t) => t.status === "published");
  const completedTests = tests.filter((t) => t.status === "completed");

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#151e2e] to-[#1a2236] p-6 text-white">
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Teacher Dashboard</h2>
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

      {/* Conditional Views */}
      {showAIGenerator ? (
        <AIQuestionGenerator
          onQuestionsGenerated={handleAIQuestionsGenerated}
          onCancel={handleCancelAI}
        />
      ) : showQuestions ? (
        <AddQuestions
          initialQuestions={questions}
          onSave={handleSaveQuestions}
          onCancel={handleCancelQuestions}
        />
      ) : (
        <>
          {/* Navigation Tabs */}
          <div className="flex gap-4 mb-6">
            {["dashboard", "create", "manage", "analytics"].map((view) => (
              <button
                key={view}
                onClick={() => setCurrentView(view)}
                className={`px-6 py-3 rounded-lg font-semibold capitalize transition-all ${
                  currentView === view
                    ? "bg-blue-600 text-white"
                    : "bg-[#232f4b] text-blue-200 hover:bg-[#2a3957]"
                }`}
              >
                {view === "dashboard" ? "Overview" : view}
              </button>
            ))}
          </div>

          {/* Dashboard */}
          {currentView === "dashboard" && (
            <div className="space-y-6">
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-[#232f4b] to-[#1a2236] rounded-lg p-6">
                  <div className="text-3xl font-bold text-blue-400">{tests.length}</div>
                  <div className="text-gray-300">Total Tests</div>
                </div>
                <div className="bg-gradient-to-br from-[#232f4b] to-[#1a2236] rounded-lg p-6">
                  <div className="text-3xl font-bold text-green-400">{publishedTests.length}</div>
                  <div className="text-gray-300">Published Tests</div>
                </div>
                <div className="bg-gradient-to-br from-[#232f4b] to-[#1a2236] rounded-lg p-6">
                  <div className="text-3xl font-bold text-yellow-400">{draftTests.length}</div>
                  <div className="text-gray-300">Draft Tests</div>
                </div>
                <div className="bg-gradient-to-br from-[#232f4b] to-[#1a2236] rounded-lg p-6">
                  <div className="text-3xl font-bold text-purple-400">
                    {dashboardAnalytics?.overview?.totalSubmissions || 0}
                  </div>
                  <div className="text-gray-300">Total Submissions</div>
                </div>
              </div>

              {/* Pending Tests */}
              <div className="bg-gradient-to-br from-black via-[#181f2e] to-[#232f4b] rounded-3xl p-8 border-2 border-[#232f4b]">
                <h3 className="text-2xl font-bold mb-6">Pending Tests (Drafts)</h3>
                <div className="grid gap-4">
                  {draftTests.length > 0 ? (
                    draftTests.map((test) => (
                      <div key={test._id} className="bg-[#1a2236] rounded-lg p-4 flex items-center justify-between">
                        <div>
                          <h4 className="text-lg font-semibold text-white">{test.testName}</h4>
                          <p className="text-gray-400">
                            {test.category} • {test.className} • {test.questions?.length || 0} questions
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditTest(test)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handlePublishTest(test._id)}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
                          >
                            Publish
                          </button>
                          <button
                            onClick={() => handleAssignTest(test)}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md"
                          >
                            Assign
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-400 py-8">No pending tests</div>
                  )}
                </div>
              </div>

              {/* Assigned Tests */}
              <div className="bg-gradient-to-br from-black via-[#181f2e] to-[#232f4b] rounded-3xl p-8 border-2 border-[#232f4b]">
                <h3 className="text-2xl font-bold mb-6">Assigned Tests</h3>
                <div className="grid gap-4">
                  {publishedTests.length > 0 ? (
                    publishedTests.map((test) => (
                      <div key={test._id} className="bg-[#1a2236] rounded-lg p-4 flex items-center justify-between">
                        <div>
                          <h4 className="text-lg font-semibold text-white">{test.testName}</h4>
                          <p className="text-gray-400">
                            {test.category} • {test.className} •
                            {test.assignedStudents?.length || 0} students assigned •
                            {test.submissions?.length || 0} submissions
                          </p>
                          {test.dueDate && (
                            <p className="text-yellow-400 text-sm">
                              Due: {new Date(test.dueDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewResults(test)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                          >
                            View Results
                          </button>
                          <button
                            onClick={() => handleAssignTest(test)}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
                          >
                            Manage Assignment
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-400 py-8">No assigned tests</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Create Test */}
          {currentView === "create" && (
            <div className="bg-gradient-to-br from-black via-[#181f2e] to-[#232f4b] rounded-3xl p-10 border-2 border-[#232f4b] shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold tracking-tight text-white">Create New Test</h3>
                <div className="flex gap-3">
                  <button
                    onClick={() => alert("Import from CSV/Excel coming soon!")}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium text-sm"
                  >
                    Import CSV/Excel
                  </button>
                  <button
                    onClick={handleAIGenerator}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md font-medium text-sm"
                  >
                    AI Question Generator
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
              <div className="flex gap-4 mb-4">
                <input
                  className="flex-1 bg-[#151e2e] border border-[#232f4b] rounded-md px-4 py-3 text-white text-lg"
                  placeholder="Class Name (e.g., Class 10)"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                />
                <div className="flex flex-col">
                  <label className="text-blue-200 text-sm mb-1">Duration (minutes)</label>
                  <input
                    type="number"
                    min={1}
                    className="w-32 bg-[#151e2e] border border-[#232f4b] rounded-md px-4 py-2 text-white text-lg"
                    placeholder="30"
                    value={minutes}
                    onChange={(e) => setMinutes(Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="text-blue-200 mb-1 block">Test Rules:</label>
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
                        onClick={() => setRules(rules.filter((_, i) => i !== idx))}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  className="text-green-400 hover:underline"
                  onClick={() => setRules([...rules, ""])}
                >
                  + Add Rule
                </button>
              </div>
              <textarea
                className="w-full bg-[#151e2e] border border-[#232f4b] rounded-md px-4 py-3 text-white text-lg mb-4"
                placeholder="Test Description"
                value={testDesc}
                onChange={(e) => setTestDesc(e.target.value)}
              />
              <div className="flex justify-end">
                <button
                  onClick={handleNextQuestions}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
                >
                  Next: Add Questions
                </button>
              </div>
            </div>
          )}

          {/* Manage Tests */}
          {currentView === "manage" && (
            <div className="bg-gradient-to-br from-black via-[#181f2e] to-[#232f4b] rounded-3xl p-10 border-2 border-[#232f4b] shadow-2xl">
              <h3 className="text-2xl font-bold mb-6 text-white">Manage Tests</h3>
              <div className="grid gap-4">
                {tests.length > 0 ? (
                  tests.map((test) => (
                    <div
                      key={test._id}
                      className="bg-[#1a2236] rounded-lg p-6 flex flex-col md:flex-row justify-between items-start md:items-center"
                    >
                      <div>
                        <h4 className="text-xl font-semibold text-white mb-2">{test.testName}</h4>
                        <p className="text-gray-400">
                          {test.category} • {test.className} • {test.questions?.length || 0} questions
                        </p>
                        {test.status && (
                          <span
                            className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium text-white ${getTestStatusColor(
                              test.status
                            )}`}
                          >
                            {test.status}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2 mt-4 md:mt-0">
                        <button
                          onClick={() => handleEditTest(test)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleAssignTest(test)}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
                        >
                          Assign
                        </button>
                        <button
                          onClick={() => handleDeleteTest(test)}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-400 py-8">No tests available</div>
                )}
              </div>
            </div>
          )}

          {/* Analytics */}
          {currentView === "analytics" && (
            <div className="bg-gradient-to-br from-black via-[#181f2e] to-[#232f4b] rounded-3xl p-10 border-2 border-[#232f4b] shadow-2xl">
              <h3 className="text-2xl font-bold mb-6 text-white">Analytics</h3>
              {dashboardAnalytics ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Test Distribution */}
                  <div className="bg-[#151e2e] rounded-xl p-6">
                    <h4 className="text-lg font-semibold mb-4 text-blue-300">Test Distribution</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={[
                          { name: "Draft", count: draftTests.length },
                          { name: "Published", count: publishedTests.length },
                          { name: "Completed", count: completedTests.length },
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a3957" />
                        <XAxis dataKey="name" stroke="#9ca3af" />
                        <YAxis stroke="#9ca3af" />
                        <Tooltip
                          contentStyle={{ backgroundColor: "#1a2236", border: "none" }}
                          itemStyle={{ color: "#fff" }}
                        />
                        <Bar dataKey="count" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Submission Trend */}
                  <div className="bg-[#151e2e] rounded-xl p-6">
                    <h4 className="text-lg font-semibold mb-4 text-blue-300">Submission Trend</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={dashboardAnalytics.submissionTrend || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a3957" />
                        <XAxis dataKey="date" stroke="#9ca3af" />
                        <YAxis stroke="#9ca3af" />
                        <Tooltip
                          contentStyle={{ backgroundColor: "#1a2236", border: "none" }}
                          itemStyle={{ color: "#fff" }}
                        />
                        <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-400 py-8">No analytics available</div>
              )}
            </div>
          )}
        </>
      )}

      {/* Assignment Modal */}
      {showAssignment && selectedTest && (
        <TestAssignment
          test={selectedTest}
          onClose={() => {
            setShowAssignment(false);
            setSelectedTest(null);
          }}
          onAssigned={() => {
            setShowAssignment(false);
            setSelectedTest(null);
            refreshTests();
          }}
        />
      )}

      {/* Results Modal */}
      {showResults && selectedTest && (
        <TestResults
          test={selectedTest}
          onClose={() => {
            setShowResults(false);
            setSelectedTest(null);
          }}
        />
      )}
    </div>
  );
}
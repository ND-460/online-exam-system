import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import AddQuestions from "./AddQuestions";
import AIQuestionGenerator from "./AIQuestionGenerator";
import TestAssignment from "./TestAssignment";
import TestResults from "./TestResults";
import { useAuthStore } from "../../store/authStore";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/ReactToastify.css";
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
} from 'recharts';
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
  const [rules, setRules] = useState([""]);
  const [editingTest, setEditingTest] = useState(null);
  const [teacherTests, setTeacherTests] = useState([]);
  const [outOfMarks, setOutOfMarks] = useState(0);
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedTest, setSelectedTest] = useState(null);
  const [showAssignment, setShowAssignment] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [dashboardAnalytics, setDashboardAnalytics] = useState(null);
  const { logout, token, user } = useAuthStore();
  const navigate = useNavigate();
  useEffect(() => {
  if (!user) {
    navigate("/login");
  } else if (user.role !== "teacher") {
    if(user.role === 'student'){
      navigate('/student')
    }else if(user.role === 'admin'){
      navigate('/admin')
    }
    toast.error('Unauthorised access')
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

    const fetchAnalytics = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/teacher/dashboard-analytics/${user._id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setDashboardAnalytics(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchTests();
    fetchAnalytics();
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
    setShowQuestions(true);
  };

  const handleAIGenerator = () => {
    setShowAIGenerator(true);
  };

  const handleAIQuestionsGenerated = (aiQuestions) => {
    setQuestions(aiQuestions);
    setShowAIGenerator(false);
    setShowQuestions(true);
  };

  const handleCancelAI = () => {
    setShowAIGenerator(false);
  };
  const handleSaveQuestions = async (qs) => {
    setQuestions(qs);
    setShowQuestions(false);

    try {
      if (editingTest) {
        // Only send the questions array for update
        await axios.put(
          `${import.meta.env.VITE_API_URL}/api/teacher/update-test/${
            editingTest._id
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
        const payload = {
          teacherId: user._id,
          testName: testTitle,
          category: testType,
          className,
          minutes,
          rules,
          outOfMarks,
          questions: qs,
        };

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
      console.error(err);
      // alert("Error saving test");
      toast.error("Error saving test");
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
      toast.success('Test published successfully!');
      await refreshTests();
    } catch (error) {
      console.error('Error publishing test:', error);
      toast.error('Failed to publish test');
    }
  };

  const getTestStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'bg-gray-600';
      case 'published': return 'bg-green-600';
      case 'completed': return 'bg-blue-600';
      default: return 'bg-gray-600';
    }
  };

  const draftTests = tests.filter(t => t.status === 'draft' || !t.status);
  const publishedTests = tests.filter(t => t.status === 'published');
  const completedTests = tests.filter(t => t.status === 'completed');

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
            {['dashboard', 'create', 'manage', 'analytics'].map((view) => (
              <button
                key={view}
                onClick={() => setCurrentView(view)}
                className={`px-6 py-3 rounded-lg font-semibold capitalize transition-all ${
                  currentView === view
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#232f4b] text-blue-200 hover:bg-[#2a3957]'
                }`}
              >
                {view === 'dashboard' ? 'Overview' : view}
              </button>
            ))}
          </div>

          {currentView === 'dashboard' && (
            <div className="space-y-6">
              {/* Dashboard Overview */}
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
                          <p className="text-gray-400">{test.category} • {test.className} • {test.questions?.length || 0} questions</p>
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

          {currentView === 'create' && (
            <div className="bg-gradient-to-br from-black via-[#181f2e] to-[#232f4b] rounded-3xl p-10 border-2 border-[#232f4b] shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold tracking-tight text-white">
                  Create New Test
                </h3>
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
                </div>
              </div>
            </div>
          )}

          {currentView === 'manage' && (
            <div className="bg-gradient-to-br from-black via-[#181f2e] to-[#232f4b] rounded-3xl p-8 border-2 border-[#232f4b]">
              <h3 className="text-2xl font-bold mb-6">Manage All Tests</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[#232f4b]">
                      <th className="py-3 px-4 font-semibold text-gray-300">Title</th>
                      <th className="py-3 px-4 font-semibold text-gray-300">Type</th>
                      <th className="py-3 px-4 font-semibold text-gray-300">Class</th>
                      <th className="py-3 px-4 font-semibold text-gray-300">Status</th>
                      <th className="py-3 px-4 font-semibold text-gray-300">Students</th>
                      <th className="py-3 px-4 font-semibold text-gray-300">Submissions</th>
                      <th className="py-3 px-4 font-semibold text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tests.length > 0 ? (
                      tests.map((test) => (
                        <tr key={test._id} className="border-b border-[#232f4b] hover:bg-[#1a2236]">
                          <td className="py-3 px-4 text-white">{test.testName}</td>
                          <td className="py-3 px-4 text-gray-300">{test.category}</td>
                          <td className="py-3 px-4 text-gray-300">{test.className}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium text-white ${getTestStatusColor(test.status)}`}>
                              {test.status || 'draft'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-300">{test.assignedStudents?.length || 0}</td>
                          <td className="py-3 px-4 text-gray-300">{test.submissions?.length || 0}</td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditTest(test)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                              >
                                Edit
                              </button>
                              {test.status === 'published' && (
                                <button
                                  onClick={() => handleViewResults(test)}
                                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                                >
                                  Results
                                </button>
                              )}
                              <button
                                onClick={() => handleAssignTest(test)}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm"
                              >
                                Assign
                              </button>
                              <button
                                onClick={() => handleDeleteTest(test)}
                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-gray-400">No tests found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {currentView === 'analytics' && dashboardAnalytics && (
            <div className="bg-gradient-to-br from-black via-[#181f2e] to-[#232f4b] rounded-3xl p-8 border-2 border-[#232f4b]">
              <h3 className="text-2xl font-bold mb-6">Detailed Analytics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-[#1a2236] rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-400">{dashboardAnalytics.overview.totalTests}</div>
                  <div className="text-gray-300">Total Tests Created</div>
                </div>
                <div className="bg-[#1a2236] rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-400">{dashboardAnalytics.overview.publishedTests}</div>
                  <div className="text-gray-300">Published Tests</div>
                </div>
                <div className="bg-[#1a2236] rounded-lg p-4">
                  <div className="text-2xl font-bold text-yellow-400">{dashboardAnalytics.overview.totalAssignments}</div>
                  <div className="text-gray-300">Total Assignments</div>
                </div>
              </div>
              {dashboardAnalytics.performanceData.length > 0 && (
                <div className="bg-[#1a2236] rounded-lg p-6">
                  <h4 className="text-lg font-semibold mb-4 text-white">Performance Trend</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={dashboardAnalytics.performanceData.slice(-10)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="testName" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="averageScore" 
                        stroke="#10B981" 
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {showAssignment && selectedTest && (
        <TestAssignment
          test={selectedTest}
          onClose={() => setShowAssignment(false)}
          onAssigned={() => {
            setShowAssignment(false);
            refreshTests();
          }}
        />
      )}

      {showResults && selectedTest && (
        <TestResults
          test={selectedTest}
          onClose={() => setShowResults(false)}
        />
      )}
    </div>
  );
}

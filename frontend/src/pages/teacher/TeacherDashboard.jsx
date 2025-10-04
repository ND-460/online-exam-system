import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import AddQuestions from "./AddQuestions";
import AIQuestionGenerator from "./AIQuestionGenerator";
import { useAuthStore } from "../../store/authStore";
import axios from "axios";
import { toast } from "react-toastify";
import DatePicker from "react-datepicker";
import "react-toastify/ReactToastify.css";
import ViewSubmissions from "./ViewSubmissions";
import Analytics from "./Analytics";
import ImportQuestionsModal from "./ImportQuestionsModal";
import ProfilePage from "../ProfilePage";
import { useDebounce } from "use-debounce";

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
  const { logout, token, user } = useAuthStore();
  const [scheduledAt, setScheduledAt] = useState(null);
  const [selectedTest, setSelectedTest] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [errors, setErrors] = useState({});
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery] = useDebounce(searchQuery, 900);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [sortOption, setSortOption] = useState("");

  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const navigate = useNavigate();

  const Modal = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-[#1f2937] rounded-2xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-600 hover:text-red-500"
          >
            ✖
          </button>
          {children}
        </div>
      </div>
    );
  };

  const validateForm = () => {
    let newErrors = {};
    if (!testTitle.trim()) newErrors.testTitle = "Test title is required";
    else if (testTitle.trim().length < 3)
      newErrors.testTitle = "Title must be at least 3 characters";

    if (!testType) newErrors.testType = "Test type is required";
    if (!className.trim()) newErrors.className = "Class name is required";
    if (!minutes || minutes <= 0) newErrors.minutes = "Duration must be > 0";
    if (rules.some((r) => r.trim() === ""))
      newErrors.rules = "Rules cannot be empty";
    if (testDesc.length > 300)
      newErrors.testDesc = "Description cannot exceed 300 characters";
    if (scheduledAt && scheduledAt < new Date())
      newErrors.scheduledAt = "Scheduled date cannot be in the past";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateTotalMarks = (questions) => {
    const total = questions.reduce((total, q) => total + (q.marks || 1), 0);
    return total > 0 ? total : 1;
  };

  useEffect(() => {
    if (!user) navigate("/login");
    else if (user.role !== "teacher") {
      if (user.role === "student") navigate("/student");
      else if (user.role === "admin") navigate("/admin");
      toast.error("Unauthorized access");
    }
  }, [user, navigate]);

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

  const getFilteredTests = () => {
    if (!debouncedSearchQuery.trim()) return teacherTests;
    return teacherTests.filter((t) =>
      t.testName.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    );
  };
  const getFilteredSortedTests = () => {
    let filtered = [...tests]; // assuming tests is your list

    // 🔍 Search
    if (debouncedSearchQuery.trim() !== "") {
      filtered = filtered.filter((t) =>
        t.testName.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      );
    }

    // 📂 Category filter
    if (filterCategory !== "all") {
      filtered = filtered.filter((t) => t.category === filterCategory);
    }

    // ↕️ Sorting
    filtered.sort((a, b) => {
      let aValue, bValue;

      if (sortBy === "name") {
        aValue = a.testName.toLowerCase();
        bValue = b.testName.toLowerCase();
      } else if (sortBy === "class") {
        aValue = a.className.toLowerCase();
        bValue = b.className.toLowerCase();
      } else if (sortBy === "createdAt") {
        aValue = new Date(a.createdAt);
        bValue = new Date(b.createdAt);
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  };

  const handleDeleteTest = async (test) => {
    if (!window.confirm(`Are you sure you want to delete "${test.testName}"?`))
      return;
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

  const handleNextQuestions = () => {
    if (validateForm()) setShowQuestions(true);
    else Object.values(errors).forEach((msg) => toast.error(msg));
  };

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
    const totalMarks = calculateTotalMarks(qs);
    setOutOfMarks(totalMarks);

    try {
      if (editingTest) {
        await axios.put(
          `${import.meta.env.VITE_API_URL}/api/teacher/update-test/${
            editingTest._id
          }`,
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
          rules,
          outOfMarks: totalMarks,
          description: testDesc,
          scheduledAt,
          questions: qs,
          organisation: user.organisation,
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

  const handleCancelQuestions = () => setShowQuestions(false);
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-gradient-to-r from-blue-50 via-blue-100 to-white text-gray-900">
      {/* Sidebar */}
      <aside className="w-64 h-screen bg-white/90 backdrop-blur-md border-r border-gray-200 shadow-lg flex flex-col fixed left-0 top-0">
        <div className="p-6 text-2xl font-bold tracking-tight text-yellow-800">
          ExamVolt
        </div>
        <nav className="flex-1 flex flex-col gap-3 overflow-y-auto">
          {[
            { id: "dashboard", label: "Dashboard", emoji: "🏠" },
            { id: "manage", label: "Manage Tests", emoji: "📝" },
            { id: "profile", label: "Profile", emoji: "👤" },
            { id: "invite", label: "Invite Students", emoji: "✉️" },
            { id: "logout", label: "Logout", emoji: "🚪" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === "logout") {
                  handleLogout();
                } else {
                  setActiveTab(tab.id);
                }
              }}
              className={`w-full text-left px-4 py-2 rounded-xl font-medium transition
            ${
              activeTab === tab.id
                ? "bg-yellow-700 text-white shadow"
                : "text-gray-700 hover:bg-gray-100"
            }`}
            >
              <span>{tab.emoji}</span> {tab.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main
        className="flex-1 ml-64 p-8 overflow-y-auto space-y-8"
        style={{
          backgroundImage: `url("/images/back-image-min.jpg")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
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
            {activeTab === "dashboard" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Create New Test */}
                <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-xl">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold text-yellow-900">
                      Create New Test
                    </h3>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setIsImportOpen(true)}
                        className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-md text-white text-sm"
                      >
                        Import CSV/Excel
                      </button>
                      <button
                        onClick={handleAIGenerator}
                        className="bg-purple-500 hover:bg-purple-600 px-4 py-2 rounded-md text-white text-sm"
                      >
                        AI Question Generator
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-4 mb-4">
                    <input
                      className="flex-1 bg-gray-50 border border-gray-300 rounded-md px-4 py-2 text-gray-900"
                      placeholder="Test Title"
                      value={testTitle}
                      onChange={(e) => setTestTitle(e.target.value)}
                    />
                    <select
                      className="w-48 bg-gray-50 border border-gray-300 rounded-md px-4 py-2 text-gray-900"
                      value={testType}
                      onChange={(e) => setTestType(e.target.value)}
                    >
                      <option>MCQ</option>
                      <option>Coding</option>
                      <option>Essay</option>
                    </select>
                  </div>

                  <div className="flex flex-col mb-4">
                    <label className="text-yellow-700 mb-1">
                      Schedule Test:
                    </label>
                    <DatePicker
                      selected={scheduledAt}
                      onChange={(date) => setScheduledAt(date)}
                      showTimeSelect
                      timeIntervals={15}
                      dateFormat="MMMM d, yyyy h:mm aa"
                      className="bg-gray-50 border border-gray-300 rounded-md px-4 py-2 text-gray-900"
                      calendarClassName="bg-white text-gray-900 rounded-md shadow-lg"
                    />
                  </div>

                  <div className="flex gap-4 mb-4">
                    <input
                      className="flex-1 bg-gray-50 border border-gray-300 rounded-md px-4 py-2 text-gray-900"
                      placeholder="Class Name"
                      value={className}
                      onChange={(e) => setClassName(e.target.value)}
                    />
                    <div className="flex flex-col">
                      <label className="text-yellow-700 mb-1">
                        Duration (minutes)
                      </label>
                      <input
                        type="number"
                        min={1}
                        className="w-32 bg-gray-50 border border-gray-300 rounded-md px-4 py-2 text-gray-900"
                        placeholder="30"
                        value={minutes}
                        onChange={(e) => setMinutes(Number(e.target.value))}
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-yellow-700 mb-1">
                        Total Marks
                      </label>
                      <div className="w-32 bg-gray-50 border border-gray-300 rounded-md px-3 py-2 text-center">
                        {outOfMarks || "0"}
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="text-yellow-700 mb-1 block">
                      Test Rules:
                    </label>
                    {rules.map((rule, idx) => (
                      <div key={idx} className="flex gap-2 mb-2">
                        <input
                          className="flex-1 bg-gray-50 border border-gray-300 rounded-md px-3 py-2 text-gray-900"
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
                            className="text-red-500 hover:underline"
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
                      className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-md text-sm text-white"
                      onClick={() => setRules([...rules, ""])}
                    >
                      Add Rule
                    </button>
                  </div>

                  <textarea
                    className="w-full bg-gray-50 border border-gray-300 rounded-md px-4 py-2 mb-4 text-gray-900"
                    placeholder="Short description"
                    value={testDesc}
                    onChange={(e) => setTestDesc(e.target.value)}
                    rows={3}
                  />
                  <button
                    onClick={handleNextQuestions}
                    className="hover:bg-yellow-600 bg-yellow-700 px-6 py-3 rounded-md font-semibold text-white"
                  >
                    Next: Questions
                  </button>
                </div>
              </div>
            )}

            {activeTab === "manage" && (
              <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xl">
                <h3 className="text-2xl font-bold mb-4 text-yellow-900">
                  Manage Tests
                </h3>

                {/* Filters, Search & Sort */}
                <div className="flex flex-wrap gap-4 mb-4">
                  <input
                    type="text"
                    placeholder="Search by test name..."
                    className="bg-white border border-gray-300 text-gray-800 px-3 py-2 rounded flex-1 min-w-[180px]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <select
                    className="bg-white border border-gray-300 text-gray-800 px-3 py-2 rounded"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                  >
                    <option value="all">All Categories</option>
                    {[...new Set(tests.map((t) => t.category))].map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <select
                    className="bg-white border border-gray-300 text-gray-800 px-3 py-2 rounded"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="createdAt">Date Created</option>
                    <option value="name">Name</option>
                    <option value="class">Class</option>
                  </select>
                  <select
                    className="bg-white border border-gray-300 text-gray-800 px-3 py-2 rounded"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                  >
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                  </select>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-gray-900">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="py-2">Title</th>
                        <th className="py-2">Type</th>
                        <th className="py-2">Class</th>
                        <th className="py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredSortedTests().length > 0 ? (
                        getFilteredSortedTests().map((t) => (
                          <tr key={t._id} className="hover:bg-gray-50">
                            <td>{t.testName}</td>
                            <td>{t.category}</td>
                            <td>{t.className}</td>
                            <td className="flex gap-2">
                              <button
                                className="text-blue-600 hover:underline"
                                onClick={() => handleEditTest(t)}
                              >
                                Edit
                              </button>
                              <button
                                className="text-red-600 hover:underline"
                                onClick={() => handleDeleteTest(t)}
                              >
                                Delete
                              </button>
                              <button
                                className="text-green-600 hover:underline"
                                onClick={() => {
                                  setSelectedTest(t);
                                  setIsViewModalOpen(true);
                                }}
                              >
                                Analytics
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={4}
                            className="text-center py-4 text-gray-500"
                          >
                            No tests found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "profile" && (
              <div className="flex-1">
                <ProfilePage />
              </div>
            )}

            {activeTab === "invite" && (
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xl w-full">
                <h3 className="font-bold mb-2 text-yellow-900">
                  Invite Students
                </h3>
                <p className="text-yellow-700 text-sm mb-3">
                  Send email invites or generate enrollment links.
                </p>
                <button className="bg-yellow-800 hover:bg-yellow-600 px-4 py-2 rounded-md font-semibold text-white">
                  Generate Link
                </button>
              </div>
            )}
          </>
        )}

        <ImportQuestionsModal
          isOpen={isImportOpen}
          onClose={() => setIsImportOpen(false)}
          onImport={(qs, testDetails) => {
            if (testDetails) {
              setTestTitle(testDetails.testTitle);
              setClassName(testDetails.className);
              setScheduledAt(
                testDetails.testSchedule
                  ? new Date(testDetails.testSchedule)
                  : null
              );
              setMinutes(testDetails.testDuration);
              setOutOfMarks(testDetails.totalMarks);
            } else {
              const totalMarks = calculateTotalMarks(qs);
              setOutOfMarks(totalMarks);
            }
            setQuestions(qs);
            setShowQuestions(true);
            setIsImportOpen(false);
          }}
        />
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false);
            setSelectedTest(null);
          }}
        >
          {selectedTest && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold mb-3">📂 Submissions</h2>
                <ViewSubmissions testId={selectedTest._id} token={token} />
              </div>
              <hr />
              <div>
                <h2 className="text-xl font-bold mb-3">📊 Analytics</h2>
                <Analytics testId={selectedTest._id} token={token} />
              </div>
            </div>
          )}
        </Modal>
      </main>
    </div>
  );
}

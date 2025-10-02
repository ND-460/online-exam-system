import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import PerformanceReports from "./PerformanceReports";
import { useDebounce } from "use-debounce";
import axios from "axios";
import { toast } from "react-toastify";
import Editor from "@monaco-editor/react";
import ProfilePage from "../ProfilePage";
import PracticeArena from "./PracticeArena";

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const [language, setLanguage] = useState("JavaScript");
  const [testCounts, setTestCounts] = useState({
    upcoming: 0,
    ongoing: 0,
    completed: 0,
  });
  const [activeTests, setActiveTests] = useState([]);
  const [myTests, setMyTests] = useState([]);
  const [code, setCode] = useState("// Start coding here...");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("scheduledAt");
  const [sortOrder, setSortOrder] = useState("asc");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery] = useDebounce(searchQuery, 900);
  const [loadingMyTests, setLoadingMyTests] = useState(false);

  const navigate = useNavigate();
  const { logout, user, token } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // redirect if not student
  useEffect(() => {
    if (!user) {
      navigate("/login");
    } else if (user.role !== "student") {
      if (user.role === "teacher") navigate("/teacher");
      else if (user.role === "admin") navigate("/admin");
      toast.error("Unauthorized access");
    }
  }, [user, navigate]);

  // Fetch tests
  useEffect(() => {
    if (!user) return;
    const fetchTests = async () => {
      try {
        const countsRes = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/student/tests/student`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setTestCounts(countsRes.data.payload || countsRes.data);

        const activeRes = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/student/active/`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setActiveTests(Array.isArray(activeRes.data) ? activeRes.data : []);
      } catch (err) {
        console.error("Error fetching tests:", err);
      }
    };
    fetchTests();
  }, [user, token]);

  const fetchMyTests = async () => {
    if (!user) return;
    try {
      setLoadingMyTests(true);
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/student/assigned-tests`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMyTests(Array.isArray(res.data.tests) ? res.data.tests : []);
    } catch (err) {
      console.error("Error fetching my tests:", err);
      toast.error("Failed to load tests");
    } finally {
      setLoadingMyTests(false);
    }
  };

  useEffect(() => {
    if (activeTab === "tests") fetchMyTests();
  }, [activeTab]);

  const getFilteredSortedTests = () => {
    let filtered = [...myTests];
    const now = new Date();

    filtered = filtered.map((t) => {
      const startTime = new Date(t.scheduledAt);
      const endTime = new Date(startTime.getTime() + t.minutes * 60000);
      let status = "upcoming";
      if (t.submitBy.includes(user._id)) status = "completed";
      else if (now >= startTime && now <= endTime) status = "ongoing";
      else if (now < startTime) status = "upcoming";
      else status = "expired";
      return { ...t, status };
    });

    if (filterStatus !== "all")
      filtered = filtered.filter((t) => t.status === filterStatus);
    else filtered = filtered.filter((t) => t.status !== "expired");

    if (filterCategory !== "all")
      filtered = filtered.filter((t) => t.category === filterCategory);

    if (debouncedSearchQuery.trim() !== "")
      filtered = filtered.filter((t) =>
        t.testName.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      );

    filtered.sort((a, b) => {
      let aValue =
        sortBy === "name" ? a.testName.toLowerCase() : new Date(a.scheduledAt);
      let bValue =
        sortBy === "name" ? b.testName.toLowerCase() : new Date(b.scheduledAt);
      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  };

  const languageMap = {
    JavaScript: "javascript",
    Python: "python",
    "C++": "cpp",
    Java: "java",
  };

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: "🏠" },
    { id: "tests", label: "My Tests", icon: "📝" },
    { id: "practice", label: "Practice", icon: "💻" },
    { id: "reports", label: "Reports", icon: "📊" },
    { id: "profile", label: "Profile", icon: "👤" },
  ];

  return (
    <div
      className="min-h-screen flex bg-gradient-to-r from-blue-50 via-blue-100 to-white"
      style={{
        backgroundImage: `url("/images/back-image-min.jpg")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <aside className="w-64 h-screen bg-white/90 backdrop-blur-md border-r border-gray-200 shadow-lg flex flex-col fixed left-0 top-0">
        <div className="p-6 text-2xl font-bold tracking-tight text-yellow-800">
          ExamVolt
        </div>
        <nav className="flex-1 flex flex-col gap-2 overflow-y-auto px-3">
          {[
            { id: "dashboard", label: "Dashboard", icon: "🏠" },
            { id: "tests", label: "My Tests", icon: "📝" },
            { id: "practice", label: "Practice", icon: "💻" },
            { id: "reports", label: "Reports", icon: "📊" },
            { id: "profile", label: "Profile", icon: "👤" },
            { id: "logout", label: "Logout", icon: "🚪" }, // 👈 logout as tab
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() =>
                tab.id === "logout" ? handleLogout() : setActiveTab(tab.id)
              }
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl font-medium transition
              ${
                activeTab === tab.id
                  ? "bg-yellow-700 text-white shadow"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main
        className="flex-1 ml-64 p-8 overflow-y-auto"
        style={{
          backgroundImage: `url("/images/back-image-min.jpg")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-extrabold text-white">
            {["logout"].includes(activeTab)
              ? "Logging out..."
              : tabs.find((t) => t.id === activeTab)?.label}
          </h1>
        </header>
        {/* Dashboard */}
        {activeTab === "dashboard" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* My Exams */}
            <div className="p-6 rounded-3xl bg-white shadow-xl border border-gray-200">
              <h3 className="text-xl font-bold mb-4 text-gray-800">My Exams</h3>
              <div className="flex gap-6">
                {[
                  {
                    label: "Upcoming",
                    count: testCounts.upcoming,
                    color: "blue",
                  },
                  {
                    label: "Ongoing",
                    count: testCounts.ongoing,
                    color: "green",
                  },
                  {
                    label: "Completed",
                    count: testCounts.completed,
                    color: "purple",
                  },
                ].map((card) => {
                  let bgClass = "";
                  let borderClass = "";
                  let textClass = "";
                  let countClass = "";

                  switch (card.color) {
                    case "blue":
                      bgClass = "bg-blue-50";
                      borderClass = "border-blue-200";
                      textClass = "text-blue-600";
                      countClass = "text-blue-800";
                      break;
                    case "green":
                      bgClass = "bg-green-50";
                      borderClass = "border-green-200";
                      textClass = "text-green-600";
                      countClass = "text-green-800";
                      break;
                    case "purple":
                      bgClass = "bg-purple-50";
                      borderClass = "border-purple-200";
                      textClass = "text-purple-600";
                      countClass = "text-purple-800";
                      break;
                  }

                  return (
                    <div
                      key={card.label}
                      className={`flex-1 flex flex-col items-center justify-center rounded-xl min-h-[120px] py-4 ${bgClass} border ${borderClass}`}
                    >
                      <span className={textClass}>{card.label}</span>
                      <span className={`text-3xl font-bold ${countClass}`}>
                        {card.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Active Tests */}
            <div className="p-6 rounded-3xl bg-white shadow-xl border border-gray-200">
              <h3 className="text-xl font-bold mb-4 text-gray-800">
                Active / Upcoming Tests
              </h3>
              {activeTests.length > 0 ? (
                <ul className="space-y-3">
                  {activeTests.map((test) => (
                    <li
                      key={test._id}
                      className="p-3 bg-gray-50 rounded-lg flex justify-between border border-gray-200 bg-yellow-800"
                    >
                      <div>
                        <p className="font-semibold text-white">
                          {test.testName}
                        </p>
                        <p className="text-sm text-white">{test.category}</p>
                      </div>
                      {test.status === "active" ? (
                        <button
                          onClick={() => navigate(`/exam/${test._id}`)}
                          className="px-3 py-1 rounded bg-green-600 hover:bg-green-700 text-white"
                        >
                          Join
                        </button>
                      ) : (
                        <span className="text-yellow-500 text-sm font-medium">
                          {test.status}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No active tests</p>
              )}
            </div>
          </div>
        )}

        {/* My Tests */}
        {activeTab === "tests" && (
          <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-200">
            {/* Filters, Searching & Sorting */}
            <div className="flex flex-wrap gap-4 mb-4">
              <input
                type="text"
                placeholder="Search by test name..."
                className="bg-white border border-gray-300 text-gray-800 px-3 py-2 rounded flex-1 min-w-[150px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <select
                className="bg-white border border-gray-300 text-gray-800 px-3 py-2 rounded"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
              </select>
              <select
                className="bg-white border border-gray-300 text-gray-800 px-3 py-2 rounded"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                {[...new Set(myTests.map((t) => t.category))].map((cat) => (
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
                <option value="scheduledAt">Date</option>
                <option value="name">Name</option>
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
            {/* Table Header */}
            <div className="grid grid-cols-4 gap-4 bg-gray-100 px-3 py-2 rounded-t-lg font-semibold text-gray-700">
              <div>Test Name</div>
              <div>Category</div>
              <div>Status</div>
              <div>Action</div>
            </div>

            {/* Loading / Test List */}
            <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {loadingMyTests ? (
                <div className="flex justify-center items-center py-20">
                  <span className="text-blue-600 text-lg animate-pulse">
                    Loading tests...
                  </span>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {getFilteredSortedTests().length > 0 ? (
                    getFilteredSortedTests().map((test) => (
                      <li
                        key={test._id}
                        className="grid grid-cols-4 gap-4 py-4 items-center hover:bg-gray-50 px-3 rounded-md transition"
                      >
                        <div className="font-semibold text-gray-800">
                          {test.testName}
                        </div>
                        <div className="text-gray-500">{test.category}</div>
                        <div>
                          {test.status === "ongoing" ? (
                            <span className="text-green-600 text-sm font-medium">
                              Ongoing
                            </span>
                          ) : test.status === "upcoming" ? (
                            <span className="text-yellow-600 text-sm font-medium">
                              Upcoming
                            </span>
                          ) : test.status === "completed" ? (
                            <span className="text-purple-600 text-sm font-medium">
                              Completed
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm font-medium">
                              Expired
                            </span>
                          )}
                        </div>
                        <div>
                          {test.status === "ongoing" ? (
                            <button
                              className="text-green-600 text-sm font-medium hover:underline"
                              onClick={() => navigate(`/exam/${test._id}`)}
                            >
                              Join Now
                            </button>
                          ) : test.status === "completed" ? (
                            <span className="text-black-600 text-sm font-medium">
                              Attempted
                            </span>
                          ) : test.status === "upcoming" ? (
                            <span className="text-purple-600 text-sm font-medium">
                              Attempt at schedule
                            </span>
                          ) : (
                            <span className="text-red-400 text-sm font-medium">
                              Expired
                            </span>
                          )}
                        </div>
                      </li>
                    ))
                  ) : (
                    <li className="py-4 text-gray-500 text-center col-span-4">
                      No tests assigned
                    </li>
                  )}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Practice */}
        {activeTab === "practice" && <PracticeArena />}

        {/* Reports */}
        {activeTab === "reports" && (
          <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-200 bg-yellow-800">
            <PerformanceReports userId={user._id} token={token} />
          </div>
        )}

        {/* Profile */}
        {activeTab === "profile" && (
          // <div className="p-6 rounded-3xl bg-white shadow-xl border border-gray-200">
          //   <h3 className="text-xl font-bold mb-4 text-gray-800">My Profile</h3>
          //   <Link to="/profile" className="text-blue-600 font-semibold hover:underline">
          //     Go to Profile Page
          //   </Link>
          // </div>
          <div className="flex-1">
            <ProfilePage />
          </div>
        )}
      </main>
    </div>
  );
}

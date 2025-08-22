import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import axios from "axios";

import { toast } from "react-toastify";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import Editor from "@monaco-editor/react";


export default function StudentDashboard() {
  const [language, setLanguage] = useState("JavaScript");
  const [testCounts, setTestCounts] = useState({
    upcoming: 0,
    ongoing: 0,
    completed: 0,
  });
  const [activeTest, setActiveTest] = useState(null);
  const [timer, setTimer] = useState("");
  const [showTestsModal, setShowTestsModal] = useState(false);
  const [myTests, setMyTests] = useState([]);
  const [openEditor, setOpenEditor] = useState(false);
  const [code, setCode] = useState("// Start coding here...");
  const navigate = useNavigate();
  const { logout, user, token } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  useEffect(() => {
    if (!user) {
      navigate("/login");
    } else if (user.role !== "student") {
      if(user.role === 'teacher'){
        navigate('/teacher')
      }else if(user.role === 'admin'){
        navigate('/admin')
      }
      toast.error('Unauthorised access')
    }
  }, [user, navigate]);
  // Fetch test counts and next active test


  
  const performanceData = [
    { week: "Week 1", score: 65 },
    { week: "Week 2", score: 72 },
    { week: "Week 3", score: 80 },
    { week: "Week 4", score: 75 },
    { week: "Week 5", score: 90 },
  ];

  // Fetch test counts and active test

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const countsRes = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/student/tests/student/${user._id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setTestCounts(countsRes.data.payload || countsRes.data);

        const activeRes = await axios.get(
          `${import.meta.env.VITE_API_URL}/tests/active/${user._id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setActiveTest(activeRes.data);
      } catch (err) {
        console.error("Error fetching tests:", err);
      }
    };

    fetchTests();
  }, [user._id, token]);

  // Countdown timer
  useEffect(() => {
    if (!activeTest) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const start = new Date(activeTest.startTime).getTime();
      const distance = start - now;

      if (distance <= 0) {
        setTimer("00:00:00");
        clearInterval(interval);
      } else {
        const hours = Math.floor((distance / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((distance / (1000 * 60)) % 60);
        const seconds = Math.floor((distance / 1000) % 60);
        setTimer(
          `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
            2,
            "0"
          )}:${String(seconds).padStart(2, "0")}`
        );
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTest]);

  const fetchMyTests = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/student/assigned-tests/${user._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const testsArray = Array.isArray(res.data.tests) ? res.data.tests : [];
      setMyTests(testsArray);
      setShowTestsModal(true);
    } catch (err) {
      console.error("Error fetching my tests:", err);
    }
  };
  const languageMap = {
    JavaScript: "javascript",
    Python: "python",
    "C++": "cpp",
    Java: "java",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#111827] to-[#1f2937] p-6 text-white">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Link to="/profile">
            <button className="px-5 py-2 bg-[#232f4b] rounded-lg text-blue-100 hover:bg-[#2a3957] font-semibold transition duration-300 shadow-md hover:shadow-lg">
              Profile
            </button>
          </Link>
          <h2 className="text-3xl font-extrabold ml-2 bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent drop-shadow-md">
            Student Dashboard
          </h2>
        </div>
        <button
          onClick={handleLogout}
          className="px-5 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-lg text-white font-semibold shadow-md hover:shadow-xl transition duration-300"
        >
          Logout
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* My Exams + Active Test */}
          <div className="flex flex-col lg:flex-row gap-8 w-full">
            {/* My Exams */}
            <div className="flex-1 bg-gradient-to-br from-black via-[#181f2e] to-[#232f4b] rounded-3xl p-8 border border-[#232f4b] shadow-2xl transition duration-300 hover:scale-[1.01]">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold tracking-tight text-white">
                  My Exams
                </h3>
                <button
                  className="text-blue-300 text-sm font-semibold hover:underline"
                  onClick={fetchMyTests}
                >
                  See all
                </button>
              </div>
              <div className="flex flex-row gap-6">
                {[
                  { label: "Upcoming", count: testCounts.upcoming, color: "blue" },
                  { label: "Ongoing", count: testCounts.ongoing, color: "green" },
                  { label: "Completed", count: testCounts.completed, color: "purple" },
                ].map((card) => (
                  <div
                    key={card.label}
                    className={`flex-1 flex flex-col items-center justify-center rounded-2xl border-2 shadow-lg min-h-[140px] py-6 bg-gradient-to-br from-${card.color}-900 via-${card.color}-800 to-${card.color}-700 border-${card.color}-700 transition duration-300 hover:scale-105`}
                  >
                    <span
                      className={`text-${card.color}-200 text-lg mb-2 font-medium tracking-wide`}
                    >
                      {card.label}
                    </span>
                    <span
                      className={`text-5xl font-extrabold text-${card.color}-400 drop-shadow-lg`}
                    >
                      {card.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Test */}
            <div className="flex-1 bg-gradient-to-br from-black via-[#181f2e] to-[#232f4b] rounded-3xl p-8 border border-[#232f4b] shadow-2xl flex flex-col justify-between transition duration-300 hover:scale-[1.01]">
              <h3 className="text-2xl font-bold mb-6">Active Test</h3>
              {activeTest ? (
                <>
                  <p className="text-blue-200 text-base mb-4">
                    Next: {activeTest.testName}
                  </p>
                  <div className="text-5xl font-mono font-bold text-green-300 mb-6">
                    {timer}
                  </div>
                  <div className="flex gap-4">
                    <button
                      className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-lg font-semibold text-lg shadow-md hover:shadow-lg transition duration-300"
                      onClick={() => navigate(`/exam/${activeTest._id}`)}
                    >
                      Join
                    </button>
                    <button className="flex-1 bg-[#232f4b] hover:bg-[#2a3957] text-white px-6 py-3 rounded-lg font-semibold border border-[#2a3957] text-lg transition duration-300">
                      Details
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-blue-200 text-base">No active test</p>
              )}
            </div>
          </div>

          {/* Code Practice Arena */}
           <div className="bg-gradient-to-br from-black via-[#181f2e] to-[#232f4b] rounded-3xl p-12 border border-[#232f4b] shadow-2xl w-full flex flex-col md:flex-row gap-12 transition duration-300 hover:scale-[1.01]">
      {/* Left Section */}
      <div className="flex-1 flex flex-col justify-center">
        <h3 className="font-semibold text-2xl mb-3">Code Practice Arena</h3>
        <p className="text-blue-200 text-base mb-6">
          Open practice problems, choose language, and sharpen your skills.
        </p>

        {/* Language Selector */}
        <label className="block text-lg mb-2" htmlFor="language">
          Language
        </label>
        <select
          id="language"
          className="w-full bg-[#151e2e] border border-[#232f4b] rounded-lg px-4 py-3 text-white mb-4 text-lg focus:ring-2 focus:ring-violet-500 outline-none transition"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          <option>JavaScript</option>
          <option>Python</option>
          <option>C++</option>
          <option>Java</option>
        </select>

        {/* Buttons */}
        <div className="flex gap-4 mt-4">
          <button
            className="flex-1 bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-lg font-semibold text-lg shadow-md hover:shadow-lg transition"
            onClick={() => setOpenEditor(true)}
          >
            Open Editor
          </button>
          <button className="flex-1 bg-[#232f4b] hover:bg-[#2a3957] text-white px-6 py-3 rounded-lg font-semibold border border-[#2a3957] text-lg transition">
            Join Test (Code)
          </button>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex-1 mt-8 md:mt-0 flex flex-col justify-center">
        {!openEditor ? (
          <>
            <div className="text-lg font-semibold mb-4">Sample Problems</div>
            <ul className="text-blue-100 text-base list-disc ml-6 space-y-2">
              <li>Two sum — Easy</li>
              <li>Balanced Brackets — Medium</li>
              <li>LRU Cache — Hard</li>
            </ul>
          </>
        ) : (
          <div className="h-[400px] rounded-xl overflow-hidden border border-[#2a3957]">
            <Editor
              height="100%"
              defaultLanguage="javascript"
              language={languageMap[language]}
              value={code}
              theme="vs-dark"
              onChange={(value) => setCode(value || "")}
            />
          </div>
        )}
      </div>
    </div>

          {/* Performance Reports */}
          <div className="bg-gradient-to-br from-black via-[#181f2e] to-[#232f4b] rounded-3xl p-10 border border-[#232f4b] shadow-2xl w-full transition duration-300 hover:scale-[1.01]">
            <h3 className="font-bold text-xl mb-2">Performance Reports</h3>
            <p className="text-blue-200 text-sm mb-5">
              Weekly progress, strengths and weaknesses.
            </p>
            <div className="h-72 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#232f4b" />
                  <XAxis dataKey="week" stroke="#b3c2e6" />
                  <YAxis stroke="#b3c2e6" />
                  <Tooltip
                    contentStyle={{
                      background: "#232f4b",
                      border: "none",
                      color: "#fff",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="score" fill="#7c3aed" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="flex flex-col gap-6">{/* future widgets */}</div>
      </div>

      {/* My Tests Modal */}
      {showTestsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1a2236] rounded-2xl w-11/12 md:w-2/3 lg:w-1/2 p-6 relative shadow-2xl border border-[#2a3957]">
            <button
              className="absolute top-4 right-4 text-white text-lg font-bold hover:text-red-400 transition"
              onClick={() => setShowTestsModal(false)}
            >
              ×
            </button>
            <h3 className="text-2xl font-bold text-white mb-6">My Tests</h3>
            <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-[#2a3957] scrollbar-track-[#151e2e]">
              <ul className="divide-y divide-gray-700">
                {myTests.length > 0 ? (
                  myTests.map((test) => (
                    <li
                      key={test._id}
                      className="py-4 flex justify-between items-center hover:bg-[#232f4b] px-3 rounded-md transition"
                    >
                      <div>
                        <span className="font-semibold text-white">
                          {test.testName}
                        </span>{" "}
                        - <span className="text-gray-300">{test.category}</span>
                      </div>
                      <div>
                        {test.assignedTo.includes(user._id) &&
                        !test.submitBy.includes(user._id) ? (
                          <button
                            className="text-green-400 text-sm font-medium hover:underline"
                            onClick={() => navigate(`/exam/${test._id}`)}
                          >
                            Can Attempt
                          </button>
                        ) : test.submitBy.includes(user._id) ? (
                          <span className="text-purple-400 text-sm font-medium">
                            Completed
                          </span>
                        ) : (
                          <span className="text-gray-500 text-sm font-medium">
                            Not Assigned
                          </span>
                        )}
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="py-4 text-gray-400 text-center">
                    No tests assigned
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

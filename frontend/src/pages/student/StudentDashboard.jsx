
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function StudentDashboard() {
  const [language, setLanguage] = useState("JavaScript");
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#151e2e] to-[#1a2236] p-6 text-white">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <button className="px-4 py-1 bg-[#232f4b] rounded-md text-blue-100 hover:bg-[#2a3957] font-semibold">Profile</button>
          <h2 className="text-2xl font-bold ml-2">Student Dashboard</h2>
        </div>
        {/* Removed notifications, toggle theme, and blue circle */}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left/Main Column */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* My Exams and Active Test side by side */}
          <div className="flex flex-row gap-6 w-full">
            {/* My Exams */}
            <div className="flex-1 bg-gradient-to-br from-black via-[#181f2e] to-[#232f4b] rounded-2xl p-8 border border-[#232f4b] shadow-2xl min-w-0">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold tracking-tight text-white">My Exams</h3>
                <button className="text-blue-300 text-sm font-semibold hover:underline">See all</button>
              </div>
              <div className="flex flex-row gap-6 w-full">
                <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 rounded-2xl border-2 border-blue-700 shadow-xl min-h-[140px] py-8">
                  <span className="text-blue-200 text-lg mb-2 font-medium tracking-wide">Upcoming</span>
                  <span className="text-5xl font-extrabold text-blue-400 drop-shadow-lg">5</span>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-green-900 via-green-800 to-green-700 rounded-2xl border-2 border-green-700 shadow-xl min-h-[140px] py-8">
                  <span className="text-green-200 text-lg mb-2 font-medium tracking-wide">Ongoing</span>
                  <span className="text-5xl font-extrabold text-green-400 drop-shadow-lg">1</span>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-purple-900 via-purple-800 to-purple-700 rounded-2xl border-2 border-purple-700 shadow-xl min-h-[140px] py-8">
                  <span className="text-purple-200 text-lg mb-2 font-medium tracking-wide">Completed</span>
                  <span className="text-5xl font-extrabold text-purple-300 drop-shadow-lg">5</span>
                </div>
              </div>
            </div>
            {/* Active Test */}
            <div className="flex-1 bg-gradient-to-br from-black via-[#181f2e] to-[#232f4b] rounded-2xl p-8 border border-[#232f4b] shadow-2xl min-w-0 flex flex-col justify-between">
              <h3 className="text-2xl font-bold mb-6">Active Test</h3>
              <p className="text-blue-200 text-base mb-4">Next: Data Structures Mock</p>
              <div className="text-4xl font-mono font-bold text-green-300 mb-4">00:12:34</div>
              <div className="flex gap-4">
                <button
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-md font-semibold text-lg"
                  onClick={() => navigate("/exam")}
                >
                  Join
                </button>
                <button className="bg-[#232f4b] hover:bg-[#2a3957] text-white px-6 py-3 rounded-md font-semibold border border-[#2a3957] text-lg">Details</button>
              </div>
            </div>
          </div>

          {/* Code Practice Arena - made bigger */}
          <div className="bg-gradient-to-br from-black via-[#181f2e] to-[#232f4b] rounded-3xl p-12 border border-[#232f4b] shadow-2xl w-full flex flex-col md:flex-row gap-12 min-h-[320px]">
            <div className="flex-1 flex flex-col justify-center">
              <h3 className="font-semibold text-2xl mb-2">Code Practice Arena</h3>
              <p className="text-blue-200 text-base mb-4">Open practice problems, choose language, and sharpen your skills.</p>
              <label className="block text-lg mb-2" htmlFor="language">Language</label>
              <select
                id="language"
                className="w-full bg-[#151e2e] border border-[#232f4b] rounded-md px-4 py-3 text-white mb-4 text-lg"
                value={language}
                onChange={e => setLanguage(e.target.value)}
              >
                <option>JavaScript</option>
                <option>Python</option>
                <option>C++</option>
                <option>Java</option>
              </select>
              <div className="flex gap-4 mt-4">
                <button className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-md font-semibold text-lg">Open Editor</button>
                <button className="bg-[#232f4b] hover:bg-[#2a3957] text-white px-6 py-3 rounded-md font-semibold border border-[#2a3957] text-lg">Join Test (Code)</button>
              </div>
            </div>
            <div className="flex-1 mt-8 md:mt-0 flex flex-col justify-center">
              <div className="text-lg font-semibold mb-4">Sample Problems</div>
              <ul className="text-blue-100 text-base list-disc ml-6">
                <li>Two sum — Easy</li>
                <li>Balanced Brackets — Medium</li>
                <li>LRU Cache — Hard</li>
              </ul>
            </div>
          </div>

          {/* Performance Reports */}
          <div className="bg-gradient-to-br from-black via-[#181f2e] to-[#232f4b] rounded-3xl p-8 border border-[#232f4b] shadow-2xl w-full">
            <h3 className="font-semibold mb-1">Performance Reports</h3>
            <p className="text-blue-200 text-xs mb-3">Weekly progress, strengths and weaknesses.</p>
            <div className="h-32 flex items-center justify-center text-blue-300 text-xs">[Charts Placeholder — Recharts]</div>
          </div>
        </div>

        {/* Right Sidebar (now empty, since Active Test moved) */}
        <div className="flex flex-col gap-6"></div>
      </div>
    </div>
  );
}

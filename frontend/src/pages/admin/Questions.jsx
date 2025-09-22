import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Plus, Search, Filter, Edit, Trash2, Eye, FileText, Clock, CheckCircle, XCircle, Loader2, Home, Users, BarChart3, TrendingUp, Settings, LogOut
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

export default function Questions() {
  const [activeTab, setActiveTab] = useState("questions");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [difficultyFilter, setDifficultyFilter] = useState("All Difficulty");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [sortOrder, setSortOrder] = useState("Ascending");
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Sample questions data
  const questions = [
    {
      id: 1,
      title: "What is React?",
      category: "Programming",
      difficulty: "Easy",
      status: "Active",
      type: "MCQ",
      createdAt: "2024-01-15"
    },
    {
      id: 2,
      title: "Explain JavaScript closures",
      category: "Programming",
      difficulty: "Medium",
      status: "Active",
      type: "Essay",
      createdAt: "2024-01-14"
    },
    {
      id: 3,
      title: "Database normalization principles",
      category: "Database",
      difficulty: "Hard",
      status: "Draft",
      type: "MCQ",
      createdAt: "2024-01-13"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-x-hidden">
      {/* Left Sidebar */}
      <div className="fixed left-0 top-0 w-64 h-full bg-white shadow-lg z-30">
        <div className="p-6">
          {/* Logo */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-800">ExamVolt</h1>
          </div>
          
          {/* Navigation */}
          <nav className="space-y-2">
            <button
              onClick={() => navigate('/admin')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors text-gray-600 hover:bg-gray-100"
            >
              <Home className="w-5 h-5" />
              Dashboard
            </button>
            <button
              onClick={() => navigate('/admin')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors text-gray-600 hover:bg-gray-100"
            >
              <Users className="w-5 h-5" />
              Users
            </button>
            <button
              onClick={() => setActiveTab("questions")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeTab === "questions" 
                  ? "bg-orange-600 text-white" 
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <FileText className="w-5 h-5" />
              Questions
            </button>
            <button
              onClick={() => navigate('/admin')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors text-gray-600 hover:bg-gray-100"
            >
              <BarChart3 className="w-5 h-5" />
              Results
            </button>
            <button
              onClick={() => navigate('/admin')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors text-gray-600 hover:bg-gray-100"
            >
              <TrendingUp className="w-5 h-5" />
              Analytics
            </button>
            <button
              onClick={() => navigate('/admin')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors text-gray-600 hover:bg-gray-100"
            >
              <Settings className="w-5 h-5" />
              Settings
            </button>
          </nav>
        </div>
        
        {/* Logout Button */}
        <div className="absolute bottom-6 left-6 right-6">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-white bg-red-500 hover:bg-red-600 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 min-h-screen">
        {/* Background Image */}
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10" 
             style={{ backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI4MDAiIHZpZXdCb3g9IjAgMCAxMjAwIDgwMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjEyMDAiIGhlaWdodD0iODAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxyZWN0IHg9IjUwMCIgeT0iMzAwIiB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgcng9IjEwIiBmaWxsPSIjRTVFN0VCIi8+CjxyZWN0IHg9IjU1MCIgeT0iMzUwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjIwIiByeD0iMTAiIGZpbGw9IiNEMUQ1REIiLz4KPHJlY3QgeD0iNTUwIiB5PSIzODAiIHdpZHRoPSI4MCIgaGVpZ2h0PSIyMCIgcng9IjEwIiBmaWxsPSIjRDFENURCIi8+CjxyZWN0IHg9IjU1MCIgeT0iNDEwIiB3aWR0aD0iNjAiIGhlaWdodD0iMjAiIHJ4PSIxMCIgZmlsbD0iI0QxRDVEQiIvPgo8L3N2Zz4K')" }}>
        </div>

        {/* Content Area */}
        <div className="relative z-10 p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">My Tests</h1>
            <p className="text-gray-600">Manage and organize your examination tests</p>
          </div>

          {/* Search and Filters Card */}
          <div className="bg-white rounded-xl p-6 shadow-lg mb-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by test name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option>All Status</option>
                <option>Active</option>
                <option>Draft</option>
                <option>Archived</option>
              </select>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option>All Categories</option>
                <option>MCQ</option>
                <option>Programming</option>
                <option>Mathematics</option>
                <option>Science</option>
              </select>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option>Date</option>
                <option>Today</option>
                <option>This Week</option>
                <option>This Month</option>
              </select>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option>Ascending</option>
                <option>Descending</option>
              </select>
            </div>
          </div>

          {/* Tests Table */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {questions.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                        No tests found
                      </td>
                    </tr>
                  ) : (
                    questions.map((question) => (
                      <tr key={question.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {question.title}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {question.category}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            question.status === 'Active' 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : question.status === 'Upcoming'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {question.status === 'Active' ? 'Upcoming' : question.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-purple-600 hover:text-purple-900 cursor-pointer font-medium">
                            Attempt at schedule
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
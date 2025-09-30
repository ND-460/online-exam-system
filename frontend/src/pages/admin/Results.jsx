import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3, TrendingUp, Users, FileText, Clock, CheckCircle, XCircle, Loader2, Home, Settings, LogOut, Search, Filter, Calendar, ArrowUpDown, Award, Activity, Eye
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

export default function Results() {
  const [activeTab, setActiveTab] = useState("results");
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

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
              onClick={() => navigate('/admin')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors text-gray-600 hover:bg-gray-100"
            >
              <FileText className="w-5 h-5" />
              Questions
            </button>
            <button
              onClick={() => setActiveTab("results")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeTab === "results" 
                  ? "bg-orange-600 text-white" 
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              Reports
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
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Reports</h1>
            <p className="text-gray-600">View and analyze examination results and performance</p>
          </div>

          {/* Performance Reports Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg border-4 border-orange-600 p-8"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Performance Reports</h2>
              <p className="text-gray-600">Last 5 tests performance overview.</p>
            </div>
            
            {/* Chart Area */}
            <div className="relative h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Performance Chart</p>
                <p className="text-gray-400 text-sm">Chart visualization will be implemented here</p>
              </div>
              
              {/* Y-axis Label */}
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 -rotate-90">
                <span className="text-gray-600 font-medium">Percentage (%)</span>
              </div>
              
              {/* Legend */}
              <div className="absolute bottom-4 right-4 flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-600 rounded"></div>
                <span className="text-gray-600 font-medium">score</span>
                <div className="ml-4">
                  <span className="text-gray-600 font-medium">Tests</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

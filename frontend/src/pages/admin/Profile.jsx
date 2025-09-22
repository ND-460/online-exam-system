import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3, TrendingUp, Users, FileText, Clock, CheckCircle, XCircle, Loader2, Home, Settings, LogOut, Search, Filter, Calendar, ArrowUpDown, Award, Activity, Eye, Edit, User
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

export default function Profile() {
  const [activeTab, setActiveTab] = useState("profile");
  const { logout, user } = useAuthStore();
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
              onClick={() => navigate('/admin')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors text-gray-600 hover:bg-gray-100"
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
              onClick={() => setActiveTab("profile")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeTab === "profile" 
                  ? "bg-orange-600 text-white" 
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <User className="w-5 h-5" />
              Profile
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
        {/* Background Image with Texture */}
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20" 
             style={{ 
               backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI4MDAiIHZpZXdCb3g9IjAgMCAxMjAwIDgwMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjEyMDAiIGhlaWdodD0iODAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxyZWN0IHg9IjUwMCIgeT0iMzAwIiB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgcng9IjEwIiBmaWxsPSIjRTVFN0VCIi8+CjxyZWN0IHg9IjU1MCIgeT0iMzUwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjIwIiByeD0iMTAiIGZpbGw9IiNEMUQ1REIiLz4KPHJlY3QgeD0iNTUwIiB5PSIzODAiIHdpZHRoPSI4MCIgaGVpZ2h0PSIyMCIgcng9IjEwIiBmaWxsPSIjRDFENURCIi8+CjxyZWN0IHg9IjU1MCIgeT0iNDEwIiB3aWR0aD0iNjAiIGhlaWdodD0iMjAiIHJ4PSIxMCIgZmlsbD0iI0QxRDVEQiIvPgo8L3N2Zz4K')",
               backgroundBlendMode: "multiply"
             }}>
        </div>

        {/* Content Area */}
        <div className="relative z-10 p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Profile</h1>
            <p className="text-gray-600">Manage your account information and settings</p>
          </div>

          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-8 max-w-2xl mx-auto relative"
          >
            {/* Decorative Element */}
            <div className="absolute top-4 right-4 w-16 h-16 bg-gray-100 rounded-full opacity-50"></div>
            
            {/* Profile Header */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">My Profile</h2>
            </div>

            {/* Profile Details */}
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-semibold text-gray-800">Name:</span>
                <span className="text-gray-700">{user?.firstName} {user?.lastName}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-semibold text-gray-800">Email:</span>
                <span className="text-gray-700">{user?.email}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-semibold text-gray-800">Phone:</span>
                <span className="text-gray-700">{user?.phone || "987654321"}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-semibold text-gray-800">Section:</span>
                <span className="text-gray-700">{user?.section || "A"}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-semibold text-gray-800">Class:</span>
                <span className="text-gray-700">{user?.class || "10"}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-semibold text-gray-800">DOB:</span>
                <span className="text-gray-700">{user?.dob || "7/17/2001"}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-semibold text-gray-800">Gender:</span>
                <span className="text-gray-700">{user?.gender || "Male"}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-semibold text-gray-800">Organisation:</span>
                <span className="text-gray-700">{user?.organisation || "N/A, N/A"}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-semibold text-gray-800">Role:</span>
                <span className="text-gray-700">{user?.role || "admin"}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-semibold text-gray-800">Roll Number:</span>
                <span className="text-gray-700">{user?.rollNumber || "13"}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-semibold text-gray-800">Grade Level:</span>
                <span className="text-gray-700">{user?.gradeLevel || "N/A"}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-semibold text-gray-800">Department:</span>
                <span className="text-gray-700">{user?.department || "CP"}</span>
              </div>
              
              <div className="flex justify-between items-center py-2">
                <span className="font-semibold text-gray-800">Guardian:</span>
                <span className="text-gray-700">{user?.guardian || "Ramesh Pal (9998823213)"}</span>
              </div>
            </div>

            {/* Edit Profile Button */}
            <div className="text-center mt-8">
              <button className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg transition-colors mx-auto">
                <Edit className="w-4 h-4" />
                Edit Profile
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BarChart3, TrendingUp, Users, FileText, Clock, CheckCircle, XCircle, 
  Loader2, Home, Settings, LogOut, Search, Filter, Calendar, ArrowUpDown, 
  Award, Activity, Eye, Download
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import AdminCharts from "../../components/AdminCharts";
import axios from "axios";
import { downloadCompleteReport, downloadChartDataAsCSV } from "../../utils/reportGenerator";

export default function Analytics() {
  const [activeTab, setActiveTab] = useState("analytics");
  const [timeRange, setTimeRange] = useState("week");
  const [loading, setLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const { logout, token } = useAuthStore();
  const navigate = useNavigate();

  // Fetch analytics data (cards/top-level numbers)
  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      try {
        const base = import.meta.env.VITE_API_URL || '';
        const auth = { headers: { Authorization: `Bearer ${token}` } };
        const [activityRes, performanceRes, subjectsRes, completionRes] = await Promise.all([
          axios.get(`${base}/api/analytics/activity`, { params: { range: timeRange }, ...auth }),
          axios.get(`${base}/api/analytics/performance`, { params: { range: timeRange }, ...auth }),
          axios.get(`${base}/api/analytics/subjects`, { params: { range: timeRange }, ...auth }),
          axios.get(`${base}/api/analytics/completion`, { params: { range: timeRange }, ...auth })
        ]);

        const data = {
          testsPerPeriod: Array.isArray(completionRes.data) ? completionRes.data.map((r) => ({ period: r?._id || '', count: Number(r?.completed || 0), avgPercentage: undefined })) : [],
          performanceMetrics: Array.isArray(subjectsRes.data) ? subjectsRes.data.map((s) => ({ subject: s?.subject || 'N/A', avgPercentage: Number(s?.score || 0), passRate: undefined, participation: undefined })) : [],
          userActivity: Array.isArray(activityRes.data) ? activityRes.data.map((r) => ({ time: r?.date || '', active: Number(r?.students || 0) + Number(r?.teachers || 0) })) : [],
          systemOverview: {
            // You can extend this if you add a dedicated overview endpoint
            activeUsers: Array.isArray(activityRes.data) ? activityRes.data.reduce((sum, r) => sum + Number(r?.students || 0) + Number(r?.teachers || 0), 0) : 0,
            completedTests: Array.isArray(completionRes.data) ? completionRes.data.reduce((sum, r) => sum + Number(r?.completed || 0), 0) : 0,
            avgResponseTime: undefined,
            successRate: Array.isArray(performanceRes.data) ? (performanceRes.data.find(p => p.name === 'Excellent')?.value || 0) : 0
          }
        };

        if (!cancelled) setAnalyticsData(data);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [timeRange]);

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
              Results
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeTab === "analytics" 
                  ? "bg-orange-600 text-white" 
                  : "text-gray-600 hover:bg-gray-100"
              }`}
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
        {/* Background Image (bold with ~20% transparency), fixed */}
        <div 
          className="fixed inset-0 bg-cover bg-center bg-no-repeat" 
          style={{ backgroundImage: `url("/images/back-image-min.jpg")`, opacity: 0.8 }}
        />

        {/* Content Area */}
        <div className="relative z-10 p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Analytics</h1>
            <p className="text-gray-600">System performance and insights</p>
          </div>

          {/* Performance Reports Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg border-4 border-orange-600 p-8"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Performance Reports</h2>
              <p className="text-gray-600">Last period performance overview.</p>
            </div>
            
            {/* Charts Section */}
            <AdminCharts 
              chartData={analyticsData}
              loading={loading}
              onDownload={(chartType, data) => {
                if (chartType === 'complete') {
                  downloadCompleteReport(analyticsData);
                } else {
                  downloadChartDataAsCSV(chartType, data);
                }
              }}
            />

            {/* Download Complete Report Button */}
            <div className="mt-6">
              <button
                onClick={() => downloadCompleteReport(analyticsData)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-5 h-5" />
                Download Complete Report
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>  
  );
} 
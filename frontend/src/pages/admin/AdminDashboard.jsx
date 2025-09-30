import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Bell, Sun, Moon, User, Users, FileText, TrendingUp, Clock, CheckCircle, XCircle, Trash2, BarChart3, Mail, CreditCard, Plus, MessageCircle, Activity, Loader2, RefreshCw, Home, Settings, LogOut, Search, Filter, Calendar, ArrowUpDown, Edit,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom"
import { useAuthStore } from "../../store/authStore";
import { toast } from "react-toastify";
import axios from "axios";
import notificationService from "../../utils/notificationService";
// Dynamic notifications will be managed in state
// Removed dummy data - now using real data from backend

export default function AdminDashboard() {
  const [theme, setTheme] = useState("light");
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showAnnounceModal, setShowAnnounceModal] = useState(false);
  const [announceText, setAnnounceText] = useState("");
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [dateFilter, setDateFilter] = useState("Date");
  const [sortOrder, setSortOrder] = useState("Ascending");
  const { logout, user, token } = useAuthStore()
  const navigate = useNavigate()
  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // API functions
  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/user/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/user/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to fetch statistics');
    }
  };

  const updateUserStatus = async (userId, status) => {
    setActionLoading(prev => ({ ...prev, [userId]: true }));
    try {
      const user = users.find(u => u._id === userId);
      const oldStatus = user?.status;

      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/user/admin/users/${userId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local state
      setUsers(prev => prev.map(user =>
        user._id === userId ? { ...user, status } : user
      ));

      // Add notification using notification service
      const userName = `${user?.firstName} ${user?.lastName}`;
      if (status === 'active' && oldStatus === 'pending') {
        notificationService.userApproved(userName);
      } else if (status === 'blocked') {
        notificationService.userBlocked(userName);
      } else if (status === 'active' && oldStatus === 'blocked') {
        notificationService.userUnblocked(userName);
      } else {
        notificationService.statusUpdated(userName, oldStatus, status);
      }

      toast.success(response.data.message);

      // Refresh stats
      fetchStats();
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status');
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    setActionLoading(prev => ({ ...prev, [userId]: true }));
    try {
      const user = users.find(u => u._id === userId);
      const userName = `${user?.firstName} ${user?.lastName}`;

      const response = await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/user/admin/users/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local state
      setUsers(prev => prev.filter(user => user._id !== userId));

      // Add notification using notification service
      notificationService.userDeleted(userName);

      toast.success(response.data.message);

      // Refresh stats
      fetchStats();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const refreshData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchUsers(), fetchStats()]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/login");
    } else if (user.role !== "admin") {
      if (user.role === 'student') {
        navigate('/student')
      } else if (user.role === 'teacher') {
        navigate('/teacher')
      }
      toast.error("Unauthorised access")
    } else {
      refreshData();
    }
  }, [user, navigate, token]);

  // Subscribe to notification service
  useEffect(() => {
    const unsubscribe = notificationService.subscribe((newNotifications) => {
      setNotifications(newNotifications);
    });

    // Initialize notifications
    setNotifications(notificationService.getNotifications());

    // Initialize with empty notifications - real notifications will come from backend

    return unsubscribe;
  }, []);
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
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeTab === "dashboard" 
                  ? "bg-orange-600 text-white" 
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Home className="w-5 h-5" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeTab === "users" 
                  ? "bg-orange-600 text-white" 
                  : "text-gray-600 hover:bg-gray-100"
              }`}
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
              onClick={() => setActiveTab("results")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeTab === "results" 
                  ? "bg-orange-600 text-white" 
                  : "text-gray-600 hover:bg-gray-100"
              }`}
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
        {/* Background Image */}
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10" 
             style={{ backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI4MDAiIHZpZXdCb3g9IjAgMCAxMjAwIDgwMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjEyMDAiIGhlaWdodD0iODAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxyZWN0IHg9IjUwMCIgeT0iMzAwIiB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgcng9IjEwIiBmaWxsPSIjRTVFN0VCIi8+CjxyZWN0IHg9IjU1MCIgeT0iMzUwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjIwIiByeD0iMTAiIGZpbGw9IiNEMUQ1REIiLz4KPHJlY3QgeD0iNTUwIiB5PSIzODAiIHdpZHRoPSI4MCIgaGVpZ2h0PSIyMCIgcng9IjEwIiBmaWxsPSIjRDFENURCIi8+CjxyZWN0IHg9IjU1MCIgeT0iNDEwIiB3aWR0aD0iNjAiIGhlaWdodD0iMjAiIHJ4PSIxMCIgZmlsbD0iI0QxRDVEQiIvPgo8L3N2Zz4K')" }}>
        </div>

        {/* Content Area */}
        <div className="relative z-10 p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {activeTab === "dashboard" && "Dashboard"}
              {activeTab === "users" && "User Management"}
              {activeTab === "questions" && "Question Management"}
              {activeTab === "results" && "Results & Reports"}
              {activeTab === "analytics" && "Analytics"}
              {activeTab === "settings" && "Settings"}
            </h1>
            <p className="text-gray-600">
              {activeTab === "dashboard" && "Overview of your examination system"}
              {activeTab === "users" && "Manage users, roles, and permissions"}
              {activeTab === "questions" && "Create and manage examination questions"}
              {activeTab === "results" && "View and analyze examination results"}
              {activeTab === "analytics" && "System performance and insights"}
              {activeTab === "settings" && "Configure system settings"}
            </p>
          </div>

          {/* Dashboard Content */}
          {activeTab === "dashboard" && (
            <div className="space-y-8">
              {/* My Exams Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-blue-100 rounded-xl p-6 shadow-lg"
                >
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-blue-800 mb-2">Upcoming</h3>
                    <div className="text-4xl font-bold text-blue-900">
                      {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : (stats.upcomingTests || 1)}
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-green-100 rounded-xl p-6 shadow-lg"
                >
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-green-800 mb-2">Ongoing</h3>
                    <div className="text-4xl font-bold text-green-900">
                      {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : (stats.ongoingTests || 0)}
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-purple-100 rounded-xl p-6 shadow-lg"
                >
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-purple-800 mb-2">Completed</h3>
                    <div className="text-4xl font-bold text-purple-900">
                      {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : (stats.completedTests || 0)}
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Active / Upcoming Tests Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-xl p-6 shadow-lg"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Active / Upcoming Tests</h3>
                <div className="space-y-3">
                  {loading ? (
                    <div className="text-center py-4">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-orange-500" />
                      <p className="text-sm text-gray-500 mt-2">Loading tests...</p>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-500">No active tests found</p>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* System Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-blue-500"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Users</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (stats.totalUsers || 0)}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-green-500"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Users</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (stats.activeUsers || 0)}
                      </p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-orange-500"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending Users</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (stats.pendingUsers || 0)}
                      </p>
                    </div>
                    <div className="p-3 bg-orange-100 rounded-full">
                      <Clock className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-red-500"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Blocked Users</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (stats.blockedUsers || 0)}
                      </p>
                    </div>
                    <div className="p-3 bg-red-100 rounded-full">
                      <XCircle className="w-6 h-6 text-red-600" />
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          )}

          {/* Users Management Content */}
          {activeTab === "users" && (
            <div className="space-y-6">
              {/* Search and Filters */}
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex-1 min-w-64">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Search by name or email..."
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
                    <option>Pending</option>
                    <option>Blocked</option>
                  </select>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option>All Categories</option>
                    <option>Students</option>
                    <option>Teachers</option>
                    <option>Admins</option>
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

              {/* Users Table */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {loading ? (
                        <tr>
                          <td colSpan="5" className="px-6 py-8 text-center">
                            <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto" />
                          </td>
                        </tr>
                      ) : users.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                            No users found
                          </td>
                        </tr>
                      ) : (
                        users.map((user) => (
                          <tr key={user._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                                  <User className="w-4 h-4 text-orange-600" />
                                </div>
                                <div className="ml-3">
                                  <div className="text-sm font-medium text-gray-900">
                                    {user.firstName} {user.lastName}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {user.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full capitalize">
                                {user.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                user.status === 'active' 
                                  ? 'bg-green-100 text-green-800' 
                                  : user.status === 'blocked' 
                                  ? 'bg-red-100 text-red-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {user.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                {user.status !== 'active' && (
                                  <button
                                    onClick={() => updateUserStatus(user._id, 'active')}
                                    disabled={actionLoading[user._id]}
                                    className="text-green-600 hover:text-green-900 disabled:opacity-50"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                )}
                                {user.status !== 'blocked' && (
                                  <button
                                    onClick={() => updateUserStatus(user._id, 'blocked')}
                                    disabled={actionLoading[user._id]}
                                    className="text-yellow-600 hover:text-yellow-900 disabled:opacity-50"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => deleteUser(user._id)}
                                  disabled={actionLoading[user._id] || user._id === user._id}
                                  className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Other tabs content */}
          {activeTab === "questions" && (
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Question Management</h3>
              <p className="text-gray-600">Question management features will be implemented here.</p>
            </div>
          )}

          {activeTab === "results" && (
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Results & Reports</h3>
              <p className="text-gray-600">Results and reports features will be implemented here.</p>
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Analytics</h3>
              <p className="text-gray-600">Analytics features will be implemented here.</p>
            </div>
          )}

          {activeTab === "profile" && (
            <div className="space-y-8">
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
                    <span className="text-gray-700">{user?.phone || "—"}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="font-semibold text-gray-800">Section:</span>
                    <span className="text-gray-700">{user?.section || "—"}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="font-semibold text-gray-800">Class:</span>
                    <span className="text-gray-700">{user?.className || "—"}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="font-semibold text-gray-800">DOB:</span>
                    <span className="text-gray-700">{user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : "—"}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="font-semibold text-gray-800">Gender:</span>
                    <span className="text-gray-700">{user?.gender || "—"}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="font-semibold text-gray-800">Organisation:</span>
                    <span className="text-gray-700">{user?.organisation?.name || "—"}, {user?.organisation?.address || "—"}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="font-semibold text-gray-800">Role:</span>
                    <span className="text-gray-700">{user?.role || "admin"}</span>
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
          )}
        </div>
      </div>
    </div>
  );
}

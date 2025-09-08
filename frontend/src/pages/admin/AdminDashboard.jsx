import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Bell, Sun, Moon, User, Users, FileText, TrendingUp, Clock, CheckCircle, XCircle, Trash2, BarChart3, Mail, CreditCard, Plus, MessageCircle, Activity, Loader2, RefreshCw,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom"
import { useAuthStore } from "../../store/authStore";
import { toast } from "react-toastify";
import axios from "axios";
import notificationService from "../../utils/notificationService";
// Dynamic notifications will be managed in state
const quickStats = [
  { label: "Total Users", value: 0, icon: <Users className="w-6 h-6" />, change: "+0%", color: "from-blue-500 to-blue-700", key: "totalUsers" },
  { label: "Active Users", value: 0, icon: <CheckCircle className="w-6 h-6" />, change: "+0%", color: "from-green-500 to-green-700", key: "activeUsers" },
  { label: "Pending Users", value: 0, icon: <Clock className="w-6 h-6" />, change: "+0%", color: "from-orange-500 to-orange-700", key: "pendingUsers" },
  { label: "Blocked Users", value: 0, icon: <XCircle className="w-6 h-6" />, change: "+0%", color: "from-red-500 to-red-700", key: "blockedUsers" },
];
const announcements = [
  { id: 1, text: "System maintenance on Aug 15th." },
  { id: 2, text: "New coding test format released!" },
];
const feedbacks = [
  { id: 1, tag: "Bug Report", msg: "Timer not working on mobile." },
  { id: 2, tag: "Feature Request", msg: "Add dark mode for students." },
  { id: 3, tag: "Bug Report", msg: "Profile picture upload fails." },
];
const activities = [
  { id: 1, text: "John created a test.", icon: <FileText className="w-4 h-4" /> },
  { id: 2, text: "Mary submitted feedback.", icon: <MessageCircle className="w-4 h-4" /> },
  { id: 3, text: "Alice upgraded subscription.", icon: <CreditCard className="w-4 h-4" /> },
];

export default function AdminDashboard() {
  const [theme, setTheme] = useState("dark");
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showAnnounceModal, setShowAnnounceModal] = useState(false);
  const [announceText, setAnnounceText] = useState("");
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
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

    // Add some sample notifications for demo purposes
    if (notificationService.getNotifications().length === 0) {
      notificationService.addNotification(
        "Welcome to the Admin Panel! You can now manage users and view system statistics.",
        'info'
      );
      notificationService.addNotification(
        "System is running smoothly. All services are operational.",
        'success'
      );
    }

    return unsubscribe;
  }, []);
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#151e2e] to-[#1a2236] relative overflow-x-hidden">
      {/* Top Nav */}
      <nav className="flex items-center justify-between px-6 py-4 backdrop-blur-lg bg-white/10 border-b border-white/10 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <span className="font-extrabold text-2xl text-white tracking-tight">ExamVolt <span className="text-blue-400">Admin Panel</span></span>
        </div>
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <div className="relative">
            <button onClick={() => setNotifOpen((o) => !o)} className="relative p-2 rounded-full hover:bg-white/20 transition">
              <Bell className="w-6 h-6 text-blue-300" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-xs text-white rounded-full px-1">
                {notificationService.getUnreadCount()}
              </span>
            </button>
            {notifOpen && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute right-0 mt-2 w-80 bg-[#181f2e] rounded-xl shadow-xl border border-[#232f4b] z-30 max-h-96 overflow-y-auto">
                <div className="p-3 text-blue-100 font-semibold border-b border-[#232f4b] flex justify-between items-center">
                  <span>Notifications</span>
                  <button
                    onClick={() => notificationService.clearAll()}
                    className="text-xs text-blue-300 hover:text-blue-100"
                  >
                    Clear All
                  </button>
                </div>
                <ul>
                  {notifications.length === 0 ? (
                    <li className="px-4 py-4 text-sm text-blue-300 text-center">No notifications</li>
                  ) : (
                    notifications.map((n) => (
                      <li
                        key={n.id}
                        className={`px-4 py-3 text-sm border-b border-[#232f4b] last:border-b-0 hover:bg-white/5 cursor-pointer ${n.read ? 'text-blue-300' : 'text-blue-100 bg-blue-500/10'
                          }`}
                        onClick={() => notificationService.markAsRead(n.id)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-start gap-2">
                            <div className={`w-2 h-2 rounded-full mt-2 ${n.type === 'success' ? 'bg-green-400' :
                                n.type === 'warning' ? 'bg-yellow-400' :
                                  n.type === 'error' ? 'bg-red-400' :
                                    'bg-blue-400'
                              }`} />
                            <span>{n.message}</span>
                          </div>
                          <span className="text-xs text-blue-400 ml-2">
                            {n.timestamp ? new Date(n.timestamp).toLocaleTimeString() : ''}
                          </span>
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              </motion.div>
            )}
          </div>
          {/* Theme Toggle */}
          <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-full hover:bg-white/20 transition">
            {theme === "dark" ? <Sun className="w-6 h-6 text-yellow-300" /> : <Moon className="w-6 h-6 text-blue-400" />}
          </button>
          {/* Profile Dropdown */}
          <div className="relative">
            <button onClick={() => setProfileOpen((o) => !o)} className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center border-2 border-blue-300">
              <User className="w-5 h-5 text-white" />
            </button>
            {profileOpen && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute right-0 mt-2 w-40 bg-[#181f2e] rounded-xl shadow-xl border border-[#232f4b] z-30">
                <div className="p-4 text-blue-100 font-semibold">Admin</div>
                <Link to='/profile'>
                  <button className="w-full text-left px-4 py-2 text-blue-200 hover:bg-[#232f4b]">Profile</button>
                </Link>
                <button className="w-full text-left px-4 py-2 text-blue-200 hover:bg-[#232f4b]" onClick={handleLogout}>Logout</button>
              </motion.div>
            )}
          </div>
        </div>
      </nav>

      {/* Animated BG Elements */}
      <motion.div animate={{ x: [0, 40, 0] }} transition={{ repeat: Infinity, duration: 10 }} className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-blue-500/30 to-violet-500/20 rounded-full blur-2xl z-0" />
      <motion.div animate={{ y: [0, 30, 0] }} transition={{ repeat: Infinity, duration: 12 }} className="absolute bottom-10 right-10 w-40 h-40 bg-gradient-to-br from-green-400/20 to-blue-400/10 rounded-full blur-2xl z-0" />

      {/* Main Content */}
      <div className="relative z-10 px-4 py-8 max-w-7xl mx-auto">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickStats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`backdrop-blur-lg bg-white/10 border-l-4 border-blue-400/40 rounded-2xl p-6 flex items-center gap-4 shadow-xl relative overflow-hidden`}
            >
              <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} text-white shadow-lg animate-pulse`}>
                {stat.icon}
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (stats[stat.key] || 0)}
                </div>
                <div className="text-blue-200 text-xs font-semibold">{stat.label}</div>
                <div className="text-green-400 text-xs font-bold mt-1">{stat.change}</div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Panels */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* User Management Table */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-blue-400/20 shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-white flex items-center gap-2">
                  <Users className="w-5 h-5" /> Manage Users
                </h3>
                <button
                  onClick={refreshData}
                  disabled={loading}
                  className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-3 py-1 rounded text-sm transition"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-blue-100 text-sm">
                    <thead>
                      <tr className="border-b border-[#232f4b]">
                        <th className="py-2 font-semibold">Name</th>
                        <th className="py-2 font-semibold">Email</th>
                        <th className="py-2 font-semibold">Role</th>
                        <th className="py-2 font-semibold">Status</th>
                        <th className="py-2 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u, idx) => (
                        <tr key={u._id} className="border-b border-[#232f4b] hover:bg-white/5">
                          <td className="py-3 flex items-center gap-2">
                            <User className="w-4 h-4 text-blue-300" />
                            {u.firstName} {u.lastName}
                          </td>
                          <td className="py-3">{u.email}</td>
                          <td className="py-3 capitalize">{u.role}</td>
                          <td className={`py-3 font-semibold capitalize ${u.status === "active" ? "text-green-400" :
                              u.status === "blocked" ? "text-red-400" :
                                "text-yellow-300"
                            }`}>
                            {u.status}
                          </td>
                          <td className="py-3">
                            <div className="flex gap-2">
                              {u.status !== 'active' && (
                                <button
                                  onClick={() => updateUserStatus(u._id, 'active')}
                                  disabled={actionLoading[u._id]}
                                  className="bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-2 py-1 rounded text-xs flex items-center gap-1 transition"
                                >
                                  {actionLoading[u._id] ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                                  Approve
                                </button>
                              )}
                              {u.status !== 'blocked' && (
                                <button
                                  onClick={() => updateUserStatus(u._id, 'blocked')}
                                  disabled={actionLoading[u._id]}
                                  className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-300 text-white px-2 py-1 rounded text-xs flex items-center gap-1 transition"
                                >
                                  {actionLoading[u._id] ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                                  Block
                                </button>
                              )}
                              {u.status === 'blocked' && (
                                <button
                                  onClick={() => updateUserStatus(u._id, 'active')}
                                  disabled={actionLoading[u._id]}
                                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-2 py-1 rounded text-xs flex items-center gap-1 transition"
                                >
                                  {actionLoading[u._id] ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                                  Unblock
                                </button>
                              )}
                              <button
                                onClick={() => deleteUser(u._id)}
                                disabled={actionLoading[u._id] || u._id === user._id}
                                className="bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white px-2 py-1 rounded text-xs flex items-center gap-1 transition"
                              >
                                {actionLoading[u._id] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {users.length === 0 && (
                    <div className="text-center py-8 text-blue-300">
                      No users found
                    </div>
                  )}
                </div>
              )}
            </motion.div>

            {/* Platform Analytics */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-blue-400/20 shadow-xl">
              <h3 className="font-bold text-lg mb-2 text-white flex items-center gap-2"><BarChart3 className="w-5 h-5" /> Platform Analytics</h3>
              <div className="h-32 flex items-center justify-center text-blue-300 text-xs">[User Growth, Test Activity, Revenue Trends Charts]</div>
            </motion.div>

            {/* Announcements */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-blue-400/20 shadow-xl">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-lg text-white flex items-center gap-2"><Mail className="w-5 h-5" /> Announcements</h3>
                <button onClick={() => setShowAnnounceModal(true)} className="flex items-center gap-1 bg-gradient-to-br from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 text-white px-4 py-2 rounded-md font-semibold transition"><Plus className="w-4 h-4" /> Add New</button>
              </div>
              <ul className="space-y-2">
                {announcements.map((a) => (
                  <li key={a.id} className="bg-white/10 border border-blue-400/10 rounded px-4 py-2 text-blue-100">{a.text}</li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Right Sidebar */}
          <div className="flex flex-col gap-6">
            {/* Feedback Inbox */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
              className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-blue-400/20 shadow-xl max-h-56 overflow-y-auto">
              <h3 className="font-bold text-lg mb-2 text-white flex items-center gap-2"><MessageCircle className="w-5 h-5" /> Feedback Inbox</h3>
              <ul className="space-y-2">
                {feedbacks.map((f) => (
                  <li key={f.id} className="flex items-center gap-2 bg-white/10 border border-blue-400/10 rounded px-3 py-2 text-blue-100">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${f.tag === "Bug Report" ? "bg-red-500/30 text-red-300" : "bg-green-500/30 text-green-300"}`}>{f.tag}</span>
                    <span>{f.msg}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Subscription Management */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
              className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-blue-400/20 shadow-xl">
              <h3 className="font-bold text-lg mb-2 text-white flex items-center gap-2"><CreditCard className="w-5 h-5" /> Subscription Management</h3>
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-200 text-sm">Current Plan: <span className="font-bold text-white">Pro</span></span>
                <button className="bg-gradient-to-br from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600 text-white px-4 py-2 rounded-md font-semibold transition">Manage Plans</button>
              </div>
              <p className="text-blue-200 text-xs">Renewal: 2025-12-31</p>
            </motion.div>

            {/* Recent Activity Timeline */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
              className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-blue-400/20 shadow-xl">
              <h3 className="font-bold text-lg mb-2 text-white flex items-center gap-2"><Activity className="w-5 h-5" /> Recent Activity</h3>
              <ul className="space-y-2">
                {activities.map((a) => (
                  <li key={a.id} className="flex items-center gap-2 text-blue-100">
                    <span>{a.icon}</span>
                    <span>{a.text}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Announcement Modal */}
      {showAnnounceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#181f2e] rounded-2xl p-8 w-full max-w-md shadow-2xl border border-blue-400/30">
            <h3 className="font-bold text-lg mb-4 text-white flex items-center gap-2"><Mail className="w-5 h-5" /> New Announcement</h3>
            <textarea
              className="w-full bg-[#151e2e] border border-[#232f4b] rounded-md px-3 py-2 text-white mb-4"
              placeholder="Enter announcement..."
              value={announceText}
              onChange={e => setAnnounceText(e.target.value)}
              rows={3}
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowAnnounceModal(false)} className="bg-transparent border border-blue-200 text-blue-200 px-4 py-2 rounded-md font-semibold">Cancel</button>
              <button onClick={() => { setShowAnnounceModal(false); setAnnounceText(""); }} className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-md font-semibold">Add</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

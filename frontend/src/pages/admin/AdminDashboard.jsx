import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Bell, Sun, Moon, User, Users, FileText, TrendingUp, Clock, CheckCircle, XCircle, Trash2, BarChart3, Mail, CreditCard, Plus, MessageCircle, Activity,
} from "lucide-react";
import {useNavigate,Link} from "react-router-dom"
import { useAuthStore } from "../../store/authStore";
import { toast } from "react-toastify";
const notifications = [
  { id: 1, message: "New user registered: Alice" },
  { id: 2, message: "Test submitted by John" },
  { id: 3, message: "Subscription expiring soon" },
];
const quickStats = [
  { label: "Total Users", value: 1240, icon: <Users className="w-6 h-6" />, change: "+3.2%", color: "from-blue-500 to-blue-700" },
  { label: "Tests Conducted", value: 320, icon: <FileText className="w-6 h-6" />, change: "+1.1%", color: "from-violet-500 to-violet-700" },
  { label: "Active Subs", value: 87, icon: <CreditCard className="w-6 h-6" />, change: "+0.8%", color: "from-green-500 to-green-700" },
  { label: "Pending Approvals", value: 5, icon: <Clock className="w-6 h-6" />, change: "-0.5%", color: "from-orange-500 to-orange-700" },
];
const users = [
  { name: "Alice", role: "Student", status: "Pending" },
  { name: "Bob", role: "Teacher", status: "Active" },
  { name: "Charlie", role: "Student", status: "Blocked" },
  { name: "Diana", role: "Admin", status: "Active" },
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
  const {logout} = useAuthStore()
  const navigate = useNavigate()
  const handleLogout = () => {
    logout(); 
    navigate("/");
  };
  useEffect(() => {
    if (!user) {
      navigate("/login");
    } else if (user.role !== "admin") {
      if(user.role === 'student'){
        navigate('/student')
      }else if(user.role === 'teacher'){
        navigate('/teacher')
      }
      toast.error("Unauthorised access")
    }
  }, [user, navigate]);
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
              <span className="absolute -top-1 -right-1 bg-red-500 text-xs text-white rounded-full px-1">{notifications.length}</span>
            </button>
            {notifOpen && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute right-0 mt-2 w-64 bg-[#181f2e] rounded-xl shadow-xl border border-[#232f4b] z-30">
                <div className="p-3 text-blue-100 font-semibold border-b border-[#232f4b]">Notifications</div>
                <ul>
                  {notifications.map((n) => (
                    <li key={n.id} className="px-4 py-2 text-sm text-blue-200 border-b border-[#232f4b] last:border-b-0">{n.message}</li>
                  ))}
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
                <div className="text-2xl font-bold text-white">{stat.value}</div>
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
              <h3 className="font-bold text-lg mb-2 text-white flex items-center gap-2"><Users className="w-5 h-5" /> Manage Users</h3>
              <table className="w-full text-left text-blue-100 text-sm">
                <thead>
                  <tr className="border-b border-[#232f4b]">
                    <th className="py-2 font-semibold">Name</th>
                    <th className="py-2 font-semibold">Role</th>
                    <th className="py-2 font-semibold">Status</th>
                    <th className="py-2 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, idx) => (
                    <tr key={u.name} className="border-b border-[#232f4b]">
                      <td className="py-2 flex items-center gap-2"><User className="w-4 h-4 text-blue-300" /> {u.name}</td>
                      <td className="py-2">{u.role}</td>
                      <td className={`py-2 font-semibold ${u.status === "Active" ? "text-green-400" : u.status === "Blocked" ? "text-red-400" : "text-yellow-300"}`}>{u.status}</td>
                      <td className="py-2 flex gap-2">
                        <button className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Approve</button>
                        <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1"><XCircle className="w-3 h-3" /> Block</button>
                        <button className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1"><Trash2 className="w-3 h-3" /> Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

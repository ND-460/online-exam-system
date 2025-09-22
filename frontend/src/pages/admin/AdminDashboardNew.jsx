import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Bell, Sun, Moon, User, Users, FileText, TrendingUp, Clock, CheckCircle, XCircle, Trash2, BarChart3, Mail, CreditCard, Plus, MessageCircle, Activity, Loader2, RefreshCw, Home, Settings, LogOut, Search, Filter, Calendar, ArrowUpDown, Edit, BookOpen, GraduationCap, PieChart, Download, Eye, MoreHorizontal, Save, X
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom"
import { useAuthStore } from "../../store/authStore";
import { toast } from "react-toastify";
import axios from "axios";
import AdminCharts from "../../components/AdminCharts";
import AdminAnalyticsCards from "../../components/AdminAnalyticsCards";
import { downloadChartDataAsCSV, downloadCompleteReport } from "../../utils/reportGenerator";

// Cache bust: 2024-01-15
export default function AdminDashboardNew() {
  const [theme, setTheme] = useState("light");
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [users, setUsers] = useState([]);
    const [stats, setStats] = useState({});
  const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
  
  // Additional data states for different sections
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [chartData, setChartData] = useState({});
  const [actionLoading, setActionLoading] = useState({});
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [dateFilter, setDateFilter] = useState("Date");
  const [sortOrder, setSortOrder] = useState("Ascending");
  
  // Profile-related state
  const [editing, setEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({});
  const [profileLoading, setProfileLoading] = useState(true);

  // Sorting state for lists
  const [studentSortBy, setStudentSortBy] = useState("name");
  const [studentSortDir, setStudentSortDir] = useState("asc");
  const [teacherSortBy, setTeacherSortBy] = useState("name");
  const [teacherSortDir, setTeacherSortDir] = useState("asc");
  
  const { logout, user, token, updateUser } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Centralized tab change to reset filters and ensure fetching
  const handleTabChange = (tab) => {
    if (tab === 'students') {
      setSearchTerm("");
      setCategoryFilter("");
      setStatusFilter("");
      setStudentSortBy("name");
      setStudentSortDir("asc");
    } else if (tab === 'teachers') {
      setSearchTerm("");
      setCategoryFilter("");
      setTeacherSortBy("name");
      setTeacherSortDir("asc");
    }
    setActiveTab(tab);
  };

  // Profile functions
  const fetchProfile = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/user/profile/${user._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProfileForm(res.data.obj || {});
    } catch (err) {
      console.error("Error fetching profile:", err);
      toast.error("Failed to fetch profile data");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setProfileForm({ ...profileForm, [parent]: { ...profileForm[parent], [child]: value } });
    } else {
      setProfileForm({ ...profileForm, [name]: value });
    }
  };

  const handleProfileSave = async () => {
    try {
      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/user/profile/${user._id}`,
        profileForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProfileForm(res.data.obj || {});
      updateUser(res.data.obj || {});
      setEditing(false);
      toast.success("Profile updated successfully");
    } catch (err) {
      console.error("Error updating profile:", err);
      toast.error("Failed to update profile");
    }
  };

  // Download functions
  const downloadStudentsReport = () => {
    if (students.length === 0) {
      toast.error("No student data available for download");
      return;
    }
    
    const csvContent = [
      ['Name', 'Email', 'Organization', 'Tests Taken', 'Average Score', 'Status'],
      ...students.map(student => [
        student.name || 'N/A',
        student.email || 'N/A',
        student.organization || 'N/A',
        student.testsTaken || 0,
        student.averageScore || 'N/A',
        student.status || 'inactive'
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `students-report-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Students report downloaded successfully");
  };

  const downloadTeachersReport = () => {
    if (teachers.length === 0) {
      toast.error("No teacher data available for download");
      return;
    }
    
    const csvContent = [
      ['Name', 'Email', 'Organization', 'Tests Created', 'Students Taught', 'Status'],
      ...teachers.map(teacher => [
        teacher.name || 'N/A',
        teacher.email || 'N/A',
        teacher.organization || 'N/A',
        teacher.testsCreated || 0,
        teacher.studentsTaught || 0,
        teacher.status || 'inactive'
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `teachers-report-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Teachers report downloaded successfully");
  };

  const downloadOrganizationsReport = () => {
    if (organizations.length === 0) {
      toast.error("No organization data available for download");
      return;
    }
    
    const csvContent = [
      ['Name', 'Email', 'Students', 'Teachers', 'Tests', 'Status'],
      ...organizations.map(org => [
        org.name || 'N/A',
        org.email || 'N/A',
        org.studentCount || 0,
        org.teacherCount || 0,
        org.testCount || 0,
        org.status || 'inactive'
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `organizations-report-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Organizations report downloaded successfully");
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
      // Map backend response to frontend expected format
      setStats({
        totalUsers: response.data.totalUsers || 0,
        totalStudents: response.data.students || 0,
        totalTeachers: response.data.teachers || 0,
        totalTests: response.data.totalTests || 0,
        organizations: response.data.organizations || 0,
        upcomingTests: response.data.upcomingTests || 0,
        ongoingTests: response.data.ongoingTests || 0,
        completedTests: response.data.completedTests || 0,
        activeUsers: response.data.activeUsers || 0,
        pendingUsers: response.data.pendingUsers || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to fetch statistics');
      setStats({
        totalUsers: 0,
        totalStudents: 0,
        totalTeachers: 0,
        totalTests: 0,
        organizations: 0,
        upcomingTests: 0,
        ongoingTests: 0,
        completedTests: 0,
        activeUsers: 0,
        pendingUsers: 0
      });
    }
  };

  // Fetch students data
  const fetchStudents = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/user/admin/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(response.data.students || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to fetch students data');
      setStudents([]);
    }
  };

  // Fetch teachers data
  const fetchTeachers = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/user/admin/teachers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTeachers(response.data.teachers || []);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      toast.error('Failed to fetch teachers data');
      setTeachers([]);
    }
  };

  // Fetch organizations data
  const fetchOrganizations = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/user/admin/organizations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrganizations(response.data.organizations || []);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      toast.error('Failed to fetch organizations data');
      setOrganizations([]);
    }
  };

  // Fetch analytics data
  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/user/admin/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalytics({
        systemHealth: response.data.systemHealth || 0,
        activeUsers: response.data.activeUsers || 0,
        testsToday: response.data.testsToday || 0,
        successRate: response.data.successRate || 0,
        totalUsers: response.data.totalUsers || 0,
        totalTests: response.data.totalTests || 0,
        totalStudents: response.data.totalStudents || 0,
        totalTeachers: response.data.totalTeachers || 0,
        systemOverview: response.data.systemOverview || {}
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to fetch analytics data');
      setAnalytics({
        systemHealth: 0,
        activeUsers: 0,
        testsToday: 0,
        successRate: 0,
        totalUsers: 0,
        totalTests: 0,
        totalStudents: 0,
        totalTeachers: 0,
        systemOverview: {}
      });
    }
  };

  // Fetch chart data
  const fetchChartData = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/user/admin/chart-data`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChartData(response.data);
    } catch (error) {
      console.error('Error fetching chart data:', error);
      toast.error('Failed to fetch chart data');
      setChartData({
        testsPerWeek: [],
        studentsByOrg: [],
        teachersByOrg: [],
        performanceTrend: [],
        marksDistribution: {}
      });
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
      await Promise.all([
        fetchUsers(),
        fetchStats(),
        fetchStudents(),
        fetchTeachers(),
        fetchOrganizations(),
        fetchAnalytics(),
        fetchChartData()
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch section-specific data when activeTab changes
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (activeTab === 'students') {
        await fetchStudents();
      } else if (activeTab === 'teachers') {
        await fetchTeachers();
      } else if (activeTab === 'organizations') {
        await fetchOrganizations();
      } else if (activeTab === 'analytics') {
        await fetchAnalytics();
      } else if (activeTab === 'profile') {
        await fetchProfile();
      }
      if (cancelled) return;
    };
    run();
    return () => { cancelled = true; };
  }, [activeTab]);

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

  // Initialize notifications
  useEffect(() => {
    setNotifications([]);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-x-hidden">
      {/* Background Image - Using assets/background.jpeg */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-150"
        style={{
          backgroundImage: `url('/src/assets/background.jpeg')`
        }}
      >
      </div>

      {/* Left Sidebar - Light gray like student dashboard */}
      <div className="fixed left-0 top-0 w-64 h-full bg-gray-100 shadow-lg z-30">
        <div className="p-6">
          {/* Logo - Dark orange/brown text */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-orange-700">ExamVolt</h1>
                    </div>
                    
          {/* Navigation - Light theme with dark brown/orange active state like student dashboard */}
          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeTab === "dashboard" 
                  ? "bg-orange-700 text-white" 
                  : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Home className="w-5 h-5" />
              Dashboard
                        </button>
            <button
              onClick={() => handleTabChange("teachers")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeTab === "teachers" 
                  ? "bg-orange-700 text-white" 
                  : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Users className="w-5 h-5" />
              Teacher
                                </button>
            <button
              onClick={() => handleTabChange("students")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeTab === "students" 
                  ? "bg-orange-700 text-white" 
                  : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              <GraduationCap className="w-5 h-5" />
              Student
                                </button>
            <button
              onClick={() => setActiveTab("organizations")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeTab === "organizations" 
                  ? "bg-orange-700 text-white" 
                  : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              Organization
                                </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeTab === "analytics" 
                  ? "bg-orange-700 text-white" 
                  : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              <TrendingUp className="w-5 h-5" />
              Analytics
            </button>
                        <button
              onClick={() => setActiveTab("profile")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeTab === "profile" 
                  ? "bg-orange-700 text-white" 
                  : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              <User className="w-5 h-5" />
              Profile
                        </button>
          </nav>
                </div>

        {/* Logout Button - Red like student dashboard */}
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
        {/* Content Area with blurred background */}
        <div className="relative z-10 p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {activeTab === "dashboard" && "Dashboard"}
              {activeTab === "teachers" && "Teacher"}
              {activeTab === "students" && "Student"}
              {activeTab === "organizations" && "Organization"}
              {activeTab === "analytics" && "Analytics"}
              {activeTab === "profile" && "Profile"}
            </h1>
            <p className="text-gray-600">
              {activeTab === "dashboard" && "Overview of your examination system"}
              {activeTab === "teachers" && "Manage teachers and their activities"}
              {activeTab === "students" && "Manage students and their progress"}
              {activeTab === "organizations" && "Manage organizations and institutions"}
              {activeTab === "analytics" && "System performance and insights"}
              {activeTab === "profile" && "Your profile information"}
            </p>
            </div>

          {/* Dashboard Content - Comprehensive Admin Dashboard */}
          {activeTab === "dashboard" && (
            <div className="space-y-8">
              {/* Analytics Cards - Matching Reference Design */}
              <AdminAnalyticsCards 
                analytics={{
                  totalUsers: stats.totalUsers || 0,
                  totalTests: stats.totalTests || 0,
                  totalStudents: stats.totalStudents || 0,
                  totalTeachers: stats.totalTeachers || 0,
                  activeUsers: stats.activeUsers || 0,
                  completedTests: stats.completedTests || 0,
                  pendingUsers: stats.pendingUsers || 0,
                  systemHealth: 98
                }}
                loading={loading}
                onDownload={(chartType, data) => downloadChartDataAsCSV(chartType, data)}
              />

              {/* Download Complete Report Button */}
              <div className="flex justify-end mb-6">
                <button
                  onClick={() => downloadCompleteReport(chartData)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  Download Complete Report
                    </button>
                  </div>

              {/* Interactive Charts */}
              <AdminCharts 
                chartData={chartData}
                loading={loading}
                onDownload={(chartType, data) => downloadChartDataAsCSV(chartType, data)}
              />
            </div>
          )}

          {/* Student Management Section */}
          {activeTab === "students" && (
            <div className="space-y-8">

              {/* Filters and Search */}
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                <div className="flex flex-wrap gap-4 mb-6">
                  <div className="flex-1 min-w-[200px]">
                    <input
                      type="text"
                      placeholder="Search students..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <select 
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Organizations</option>
                    {organizations.map((org) => (
                      <option key={org._id} value={org.name}>{org.name}</option>
                    ))}
                  </select>
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  <select
                    value={studentSortBy}
                    onChange={(e) => setStudentSortBy(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="name">Sort: Name</option>
                    <option value="email">Sort: Email</option>
                    <option value="organization">Sort: Organization</option>
                    <option value="testsTaken">Sort: Tests Taken</option>
                    <option value="averageScore">Sort: Avg Score</option>
                    <option value="status">Sort: Status</option>
                  </select>
                  <select
                    value={studentSortDir}
                    onChange={(e) => setStudentSortDir(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="asc">Asc</option>
                    <option value="desc">Desc</option>
                  </select>
                </div>

                {/* Students Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Organization</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Tests Taken</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Average Score</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan="7" className="py-8 text-center">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                          </td>
                        </tr>
                      ) : students.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="py-8 text-center text-gray-500">
                            No students found
                          </td>
                        </tr>
                      ) : (
                        students
                          .filter(student => {
                            const matchesSearch = student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                student.email?.toLowerCase().includes(searchTerm.toLowerCase());
                            const matchesOrg = !categoryFilter || student.organization === categoryFilter;
                            const matchesStatus = !statusFilter || student.status === statusFilter;
                            return matchesSearch && matchesOrg && matchesStatus;
                          })
                          .sort((a,b) => {
                            const key = studentSortBy;
                            const dir = studentSortDir === 'asc' ? 1 : -1;
                            let av = a[key];
                            let bv = b[key];
                            if (key === 'testsTaken') { av = Number(av||0); bv = Number(bv||0);} 
                            if (key === 'averageScore') {
                              const num = (v) => typeof v === 'string' && v.endsWith('%') ? Number(v.replace('%','')) : Number(v||0);
                              av = num(av); bv = num(bv);
                            }
                            if (typeof av === 'string') av = av.toLowerCase();
                            if (typeof bv === 'string') bv = bv.toLowerCase();
                            if (av < bv) return -1*dir;
                            if (av > bv) return 1*dir;
                            return 0;
                          })
                          .map((student) => (
                            <tr key={student._id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-4">{student.name || 'N/A'}</td>
                              <td className="py-3 px-4">{student.email || 'N/A'}</td>
                              <td className="py-3 px-4">{student.organization || 'N/A'}</td>
                              <td className="py-3 px-4">{student.testsTaken || 0}</td>
                              <td className="py-3 px-4">{student.averageScore || 'N/A'}</td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  student.status === 'active' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {student.status || 'inactive'}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex gap-2">
                                  <button className="p-1 text-blue-600 hover:bg-blue-100 rounded">
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button className="p-1 text-gray-600 hover:bg-gray-100 rounded">
                                    <MoreHorizontal className="w-4 h-4" />
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

              {/* Download Complete Report Button */}
              <div className="flex justify-end mb-6">
                <button
                  onClick={() => downloadCompleteReport(chartData)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  Download Complete Report
                    </button>
                  </div>

              {/* Interactive Charts */}
              <AdminCharts 
                chartData={chartData}
                loading={loading}
                onDownload={(chartType, data) => downloadChartDataAsCSV(chartType, data)}
              />
            </div>
          )}

          {/* Teacher Management Section */}
          {activeTab === "teachers" && (
            <div className="space-y-8">

              {/* Teacher Data Table */}
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                <div className="flex flex-wrap gap-4 mb-6">
                  <div className="flex-1 min-w-[200px]">
                    <input
                      type="text"
                      placeholder="Search teachers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <select 
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">All Organizations</option>
                    {organizations.map((org) => (
                      <option key={org._id} value={org.name}>{org.name}</option>
                    ))}
                  </select>
                  <select
                    value={teacherSortBy}
                    onChange={(e) => setTeacherSortBy(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="name">Sort: Name</option>
                    <option value="email">Sort: Email</option>
                    <option value="organization">Sort: Organization</option>
                    <option value="testsCreated">Sort: Tests Created</option>
                    <option value="studentsTaught">Sort: Students Taught</option>
                    <option value="status">Sort: Status</option>
                  </select>
                  <select
                    value={teacherSortDir}
                    onChange={(e) => setTeacherSortDir(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="asc">Asc</option>
                    <option value="desc">Desc</option>
                  </select>
                </div>

                {/* Teachers Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Organization</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Tests Created</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Students Taught</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan="7" className="py-8 text-center">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                          </td>
                        </tr>
                      ) : teachers.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="py-8 text-center text-gray-500">
                            No teachers found
                          </td>
                        </tr>
                      ) : (
                        teachers
                          .filter(teacher => {
                            const matchesSearch = teacher.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                teacher.email?.toLowerCase().includes(searchTerm.toLowerCase());
                            const matchesOrg = !categoryFilter || teacher.organization === categoryFilter;
                            return matchesSearch && matchesOrg;
                          })
                          .sort((a,b) => {
                            const key = teacherSortBy;
                            const dir = teacherSortDir === 'asc' ? 1 : -1;
                            let av = a[key];
                            let bv = b[key];
                            if (key === 'testsCreated' || key === 'studentsTaught') { av = Number(av||0); bv = Number(bv||0);} 
                            if (typeof av === 'string') av = av.toLowerCase();
                            if (typeof bv === 'string') bv = bv.toLowerCase();
                            if (av < bv) return -1*dir;
                            if (av > bv) return 1*dir;
                            return 0;
                          })
                          .map((teacher) => (
                            <tr key={teacher._id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-4">{teacher.name || 'N/A'}</td>
                              <td className="py-3 px-4">{teacher.email || 'N/A'}</td>
                              <td className="py-3 px-4">{teacher.organization || 'N/A'}</td>
                              <td className="py-3 px-4">{teacher.testsCreated || 0}</td>
                              <td className="py-3 px-4">{teacher.studentsTaught || 0}</td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  teacher.status === 'active' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {teacher.status || 'inactive'}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex gap-2">
                                  <button className="p-1 text-emerald-600 hover:bg-emerald-100 rounded">
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button className="p-1 text-gray-600 hover:bg-gray-100 rounded">
                                    <MoreHorizontal className="w-4 h-4" />
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

              {/* Download Complete Report Button */}
              <div className="flex justify-end mb-6">
                <button
                  onClick={() => downloadCompleteReport(chartData)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  Download Complete Report
                    </button>
                  </div>

              {/* Interactive Charts */}
              <AdminCharts 
                chartData={chartData}
                loading={loading}
                onDownload={(chartType, data) => downloadChartDataAsCSV(chartType, data)}
              />
            </div>
          )}

          {/* Organization Management Section */}
          {activeTab === "organizations" && (
            <div className="space-y-8">

              {/* Organization Data Table */}
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                <div className="flex flex-wrap gap-4 mb-6">
                  <div className="flex-1 min-w-[200px]">
                    <input
                      type="text"
                      placeholder="Search organizations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                  <button 
                    onClick={downloadOrganizationsReport}
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                </div>

                {/* Organizations Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Students</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Teachers</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Tests</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan="7" className="py-8 text-center">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                          </td>
                        </tr>
                      ) : organizations.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="py-8 text-center text-gray-500">
                            No organizations found
                          </td>
                        </tr>
                      ) : (
                        organizations
                          .filter(org => {
                            const matchesSearch = org.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                org.email?.toLowerCase().includes(searchTerm.toLowerCase());
                            return matchesSearch;
                          })
                          .map((org) => (
                            <tr key={org._id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-4">{org.name || 'N/A'}</td>
                              <td className="py-3 px-4">{org.email || 'N/A'}</td>
                              <td className="py-3 px-4">{org.studentCount || 0}</td>
                              <td className="py-3 px-4">{org.teacherCount || 0}</td>
                              <td className="py-3 px-4">{org.testCount || 0}</td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  org.status === 'active' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {org.status || 'inactive'}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex gap-2">
                                  <button className="p-1 text-amber-600 hover:bg-amber-100 rounded">
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button className="p-1 text-gray-600 hover:bg-gray-100 rounded">
                                    <MoreHorizontal className="w-4 h-4" />
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

              {/* Download Complete Report Button */}
              <div className="flex justify-end mb-6">
                <button
                  onClick={() => downloadCompleteReport(chartData)}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  Download Complete Report
                    </button>
                  </div>

              {/* Interactive Charts */}
              <AdminCharts 
                chartData={chartData}
                loading={loading}
                onDownload={(chartType, data) => downloadChartDataAsCSV(chartType, data)}
              />
            </div>
          )}

          {/* Analytics Section */}
          {activeTab === "analytics" && (
            <div className="space-y-8">
              {/* Analytics Overview Cards - Matching Reference Design */}
              <AdminAnalyticsCards 
                analytics={{
                  totalUsers: analytics.totalUsers || stats.totalUsers || 0,
                  totalTests: analytics.totalTests || stats.totalTests || 0,
                  totalStudents: analytics.totalStudents || stats.totalStudents || 0,
                  totalTeachers: analytics.totalTeachers || stats.totalTeachers || 0,
                  activeUsers: analytics.activeUsers || stats.activeUsers || 0,
                  completedTests: analytics.completedTests || stats.completedTests || 0,
                  pendingUsers: analytics.pendingUsers || stats.pendingUsers || 0,
                  systemHealth: analytics.systemHealth || 98
                }}
                loading={loading}
                onDownload={(chartType, data) => downloadChartDataAsCSV(chartType, data)}
              />

              {/* Download Complete Report Button */}
              <div className="flex justify-end mb-6">
                <button
                  onClick={() => downloadCompleteReport(chartData)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  Download Complete Report
                    </button>
                  </div>

              {/* Interactive Charts */}
              <AdminCharts 
                chartData={chartData}
                loading={loading}
                onDownload={(chartType, data) => downloadChartDataAsCSV(chartType, data)}
              />
            </div>
          )}

          {/* Profile Content - Integrated from ProfilePage.jsx */}
          {activeTab === "profile" && (
            <div className="space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-lg p-8 max-w-4xl mx-auto relative"
              >
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">My Profile</h2>
                                    </div>

                {profileLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                  </div>
                ) : editing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Common Fields */}
                    {(profileForm.role === 'admin' 
                      ? [
                          "firstName",
                          "lastName",
                          "email",
                          "phone",
                          "dateOfBirth",
                          "gender",
                        ]
                      : [
                          "firstName",
                          "lastName",
                          "email",
                          "phone",
                          "section",
                          "className",
                          "dateOfBirth",
                          "gender",
                        ]
                    ).map((field) => (
                      <div key={field} className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700 mb-1">
                          {field.replace(/([A-Z])/g, " $1")}
                        </label>

                        {field === "dateOfBirth" ? (
                          <input
                            type="date"
                            name={field}
                            value={profileForm[field] ? profileForm[field].slice(0, 10) : ""}
                            onChange={handleProfileChange}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                          />
                        ) : field === "gender" ? (
                          <select
                            name={field}
                            value={profileForm[field] || ""}
                            onChange={handleProfileChange}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                          >
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        ) : (
                          <input
                            type="text"
                            name={field}
                            value={profileForm[field] || ""}
                            onChange={handleProfileChange}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                            placeholder={field}
                          />
                        )}
                      </div>
                    ))}

                    {/* Organisation Section (hide for admin) */}
                    {profileForm.role !== 'admin' && (
                      <div className="md:col-span-2 bg-gray-50 border border-gray-200 rounded-xl p-4 mt-4 shadow-sm">
                        <h3 className="text-md font-semibold text-gray-800 mb-3">
                          Organisation Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {["name", "address"].map((sub) => (
                            <div key={sub} className="flex flex-col">
                              <label className="text-sm font-medium text-gray-700 mb-1">
                                Organisation {sub.charAt(0).toUpperCase() + sub.slice(1)}
                              </label>
                              <input
                                name={`organisation.${sub}`}
                                value={profileForm.organisation?.[sub] || ""}
                                onChange={handleProfileChange}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Admin specific fields */}
                    <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded-xl p-4 mt-4 shadow-sm">
                      <h3 className="text-md font-semibold text-gray-800 mb-3">
                        Admin Details
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {["employeeId", "department", "designation", "experienceYears"].map((f) => (
                          <div key={f} className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700 mb-1">
                              {f}
                            </label>
                            <input
                              name={f}
                              value={profileForm[f] || ""}
                              onChange={handleProfileChange}
                              type={f === "experienceYears" ? "number" : "text"}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Buttons */}
                    <div className="md:col-span-2 flex gap-3 mt-6">
                      <button
                        onClick={handleProfileSave}
                        className="flex-1 flex items-center justify-center gap-2 py-2 rounded-md bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow"
                      >
                        <Save className="w-4 h-4" /> Save
                      </button>
                      <button
                        onClick={() => setEditing(false)}
                        className="flex-1 flex items-center justify-center gap-2 py-2 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold"
                      >
                        <X className="w-4 h-4" /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="font-semibold text-gray-800">Name:</span>
                      <span className="text-gray-700">{profileForm.firstName} {profileForm.lastName}</span>
                                </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="font-semibold text-gray-800">Email:</span>
                      <span className="text-gray-700">{profileForm.email}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="font-semibold text-gray-800">Phone:</span>
                      <span className="text-gray-700">{profileForm.phone || "—"}</span>
                    </div>
                    
                    {profileForm.role !== 'admin' && (
                      <>
                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                          <span className="font-semibold text-gray-800">Section:</span>
                          <span className="text-gray-700">{profileForm.section || "—"}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                          <span className="font-semibold text-gray-800">Class:</span>
                          <span className="text-gray-700">{profileForm.className || "—"}</span>
                        </div>
                      </>
                    )}
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="font-semibold text-gray-800">DOB:</span>
                      <span className="text-gray-700">
                        {profileForm.dateOfBirth
                          ? new Date(profileForm.dateOfBirth).toLocaleDateString()
                          : "—"}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="font-semibold text-gray-800">Gender:</span>
                      <span className="text-gray-700">{profileForm.gender || "—"}</span>
                    </div>
                    
                    {profileForm.role !== 'admin' && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-200">
                        <span className="font-semibold text-gray-800">Organisation:</span>
                        <span className="text-gray-700">{profileForm.organisation?.name || "—"},{" "}
                        {profileForm.organisation?.address || "—"}</span>
                      </div>
                    )}
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="font-semibold text-gray-800">Role:</span>
                      <span className="text-gray-700">{profileForm.role}</span>
                        </div>

                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="font-semibold text-gray-800">Employee ID:</span>
                      <span className="text-gray-700">{profileForm.employeeId || "—"}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="font-semibold text-gray-800">Department:</span>
                      <span className="text-gray-700">{profileForm.department || "—"}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="font-semibold text-gray-800">Designation:</span>
                      <span className="text-gray-700">{profileForm.designation || "—"}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2">
                      <span className="font-semibold text-gray-800">Experience:</span>
                      <span className="text-gray-700">{profileForm.experienceYears || 0} years</span>
                    </div>

                <div className="text-center mt-8">
                      <button 
                        onClick={() => setEditing(true)}
                        className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg transition-colors mx-auto"
                      >
                    <Edit className="w-4 h-4" />
                    Edit Profile
                  </button>
                        </div>
                  </div>
                )}
              </motion.div>
                                    </div>
                            )}
                        </div>
                    </div>
        </div>
    );
}

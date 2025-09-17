import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users, UserCheck, UserX, BarChart3, FileText, Download, Settings,
    GraduationCap, BookOpen, TrendingUp, PieChart, Calendar,
    Eye, Edit, Trash2, RefreshCw, Search, Filter, Plus,
    ChevronRight, ChevronDown, Home, User, Mail, Bell, LogOut
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { toast } from "react-toastify";
import axios from "axios";

// Chart components (you can install recharts or chart.js for better charts)
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function AdminDashboardNew() {
    const [activeSection, setActiveSection] = useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [students, setStudents] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [tests, setTests] = useState([]);
    const [results, setResults] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTest, setSelectedTest] = useState('');
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [profileData, setProfileData] = useState({});
    const [editUserModal, setEditUserModal] = useState({ open: false, user: null });
    const [viewTeacherTests, setViewTeacherTests] = useState({ open: false, teacher: null });
    const [timeRange, setTimeRange] = useState('week');
    const [reportsTab, setReportsTab] = useState('teacher'); // 'teacher' | 'student'
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [teacherDetail, setTeacherDetail] = useState({ open: false, teacherName: '', tests: [] });

    const { logout, user, token } = useAuthStore();
    const navigate = useNavigate();

    // Sidebar menu items
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: Home, color: 'text-blue-400' },
        { id: 'students', label: 'Students', icon: GraduationCap, color: 'text-green-400' },
        { id: 'teachers', label: 'Teachers', icon: UserCheck, color: 'text-purple-400' },
        { id: 'tests', label: 'Tests', icon: BookOpen, color: 'text-orange-400' },
        { id: 'reports', label: 'Reports', icon: FileText, color: 'text-yellow-400' },
        { id: 'analytics', label: 'Analytics', icon: TrendingUp, color: 'text-cyan-400' },
        { id: 'profile', label: 'Profile', icon: Settings, color: 'text-gray-400' }
    ];

    // Fetch data functions
    const fetchStudents = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/user/admin/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const all = response.data.users || [];
            setStudents(all.filter(u => u.role === 'student'));
        } catch (error) {
            console.error('Error fetching students:', error);
            // Add fallback data for testing
            setStudents([
                { _id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com', status: 'active' },
                { _id: '2', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', status: 'pending' }
            ]);
            toast.error('Failed to fetch students - using demo data');
        }
    };

    const fetchTeachers = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/user/admin/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const all = response.data.users || [];
            setTeachers(all.filter(u => u.role === 'teacher'));
        } catch (error) {
            console.error('Error fetching teachers:', error);
            // Add fallback data for testing
            setTeachers([
                { _id: '1', firstName: 'Dr. Smith', lastName: 'Johnson', email: 'smith@example.com', status: 'active' },
                { _id: '2', firstName: 'Prof. Brown', lastName: 'Wilson', email: 'brown@example.com', status: 'active' }
            ]);
            toast.error('Failed to fetch teachers - using demo data');
        }
    };

    const fetchTests = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/user/admin/tests`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTests(response.data.tests || []);
        } catch (error) {
            console.error('Error fetching tests:', error);
            // Add fallback data for testing
            setTests([
                { _id: '1', testName: 'Mathematics Quiz', totalMarks: 50, passingMarks: 25, minutes: 60 },
                { _id: '2', testName: 'Science Test', totalMarks: 100, passingMarks: 50, minutes: 90 }
            ]);
            toast.error('Failed to fetch tests - using demo data');
        }
    };

    const fetchResults = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/user/admin/results`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setResults(response.data.results || []);
        } catch (error) {
            console.error('Error fetching results:', error);
            // Add fallback data for testing
            setResults([
                { _id: '1', studentId: { firstName: 'John', lastName: 'Doe' }, testId: { testName: 'Math Quiz', totalMarks: 50, passingMarks: 25 }, score: 35, status: 'completed' },
                { _id: '2', studentId: { firstName: 'Jane', lastName: 'Smith' }, testId: { testName: 'Science Test', totalMarks: 100, passingMarks: 50 }, score: 75, status: 'completed' }
            ]);
            toast.error('Failed to fetch results - using demo data');
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
            // Add fallback data for testing
            setStats({
                totalStudents: 2,
                totalTeachers: 2,
                totalTests: 2,
                totalResults: 2
            });
            toast.error('Failed to fetch statistics - using demo data');
        }
    };

    const fetchAllData = async () => {
        console.log('Fetching all data...');
        setLoading(true);
        try {
            await Promise.all([
                fetchStudents(),
                fetchTeachers(),
                fetchTests(),
                fetchResults(),
                fetchStats()
            ]);
            console.log('All data fetched successfully');
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to fetch some data');
        } finally {
            setLoading(false);
        }
    };

    // User management functions
    const saveUserEdits = async () => {
        const u = editUserModal.user;
        if (!u) return;
        try {
            await axios.put(
                `${import.meta.env.VITE_API_URL}/api/user/profile/${u._id}`,
                { firstName: u.firstName, lastName: u.lastName, email: u.email, className: u.className, section: u.section, phone: u.phone },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('User updated');
            setEditUserModal({ open: false, user: null });
            // refresh list
            await fetchStudents();
            await fetchTeachers();
        } catch (error) {
            console.error('Error updating user:', error);
            toast.error('Failed to update user');
        }
    };

    const deleteUser = async (userId, userType) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;

        try {
            await axios.delete(
                `${import.meta.env.VITE_API_URL}/api/user/admin/users/${userId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (userType === 'student') {
                setStudents(prev => prev.filter(user => user._id !== userId));
            } else {
                setTeachers(prev => prev.filter(user => user._id !== userId));
            }

            toast.success('User deleted successfully');
            fetchStats();
        } catch (error) {
            console.error('Error deleting user:', error);
            toast.error('Failed to delete user');
        }
    };

    // Report download functions
    const downloadTestReport = async (testId) => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/admin/reports/test/${testId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    responseType: 'blob'
                }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `test-report-${testId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast.success('Test report downloaded successfully');
        } catch (error) {
            console.error('Error downloading test report:', error);
            toast.error('Failed to download test report');
        }
    };

    const downloadStudentReport = async (studentId) => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/admin/reports/student/${studentId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    responseType: 'blob'
                }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `student-report-${studentId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast.success('Student report downloaded successfully');
        } catch (error) {
            console.error('Error downloading student report:', error);
            toast.error('Failed to download student report');
        }
    };

    // Chart/analytics helpers
    const palette = ["#3B82F6","#10B981","#F59E0B","#EF4444","#8B5CF6","#06B6D4","#EC4899","#84CC16"];

    const getReportsDataset = () => {
        // filter by time range
        const now = new Date();
        const start = new Date(now);
        if (timeRange === 'week') start.setDate(now.getDate() - 7);
        if (timeRange === 'month') start.setMonth(now.getMonth() - 1);
        if (timeRange === 'year') start.setFullYear(now.getFullYear() - 1);
        if (reportsTab === 'teacher') {
            // Count tests created per teacher from tests[] using createdAt
            const filteredTests = tests.filter(t => new Date(t.createdAt || t.publishedAt || now) >= start);
            const teacherAgg = {};
            filteredTests.forEach(t => {
                const tId = t.teacherId?._id || 'unassigned';
                const tName = t.teacherId?.firstName ? `${t.teacherId.firstName} ${t.teacherId.lastName}` : 'Unassigned';
                if (!teacherAgg[tId]) teacherAgg[tId] = { name: tName, tests: [] };
                teacherAgg[tId].tests.push(t);
            });
            return Object.entries(teacherAgg).map(([id, obj]) => ({ teacherId: id, name: obj.name, testsTaken: obj.tests.length, tests: obj.tests }));
        }

        // Student dataset: tests attempted and average scores from results[]
        const filteredResults = results.filter(r => new Date(r.submittedAt || r.createdAt || now) >= start);
        const studentAgg = {};
        filteredResults.forEach(r => {
            const studentName = r.studentId?.firstName ? `${r.studentId.firstName} ${r.studentId.lastName}` : (r.student?.firstName ? `${r.student.firstName} ${r.student.lastName}` : 'Unknown');
            if (!studentAgg[studentName]) studentAgg[studentName] = { testsTaken: 0, totalScore: 0, count: 0 };
            studentAgg[studentName].testsTaken += 1;
            studentAgg[studentName].totalScore += (r.score || 0);
            studentAgg[studentName].count += 1;
        });
        return Object.entries(studentAgg).map(([name, v]) => ({ name, testsTaken: v.testsTaken, avgScore: v.count ? Number((v.totalScore / v.count).toFixed(2)) : 0 }));
    };

    const getTestsTimeSeries = () => {
        const now = new Date();
        const start = new Date(now);
        if (timeRange === 'week') start.setDate(now.getDate() - 7);
        if (timeRange === 'month') start.setMonth(now.getMonth() - 1);
        if (timeRange === 'year') start.setFullYear(now.getFullYear() - 1);
        const filtered = tests.filter(t => new Date(t.createdAt || t.publishedAt || now) >= start);

        const bucketFmt = (d) => {
            const dt = new Date(d);
            if (timeRange === 'week' || timeRange === 'month') {
                return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
            }
            return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}`;
        };
        const buckets = {};
        filtered.forEach(t => {
            const key = bucketFmt(t.createdAt || t.publishedAt || now);
            buckets[key] = (buckets[key] || 0) + 1;
        });
        return Object.entries(buckets)
            .sort((a,b)=> new Date(a[0]) - new Date(b[0]))
            .map(([date, count]) => ({ date, count }));
    };

    const downloadCsv = (rows, filename) => {
        if (!rows || rows.length === 0) return toast.error('No data');
        const headers = Object.keys(rows[0]);
        const csv = [headers.join(',')].concat(rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    const downloadReportsPdf = async () => {
        const doc = new jsPDF();
        const title = reportsTab === 'teacher' ? 'Teacher Report' : 'Student Report';
        doc.text(`${title} (${timeRange})`, 14, 16);
        const rows = getReportsDataset();
        if (!rows || rows.length === 0) {
            toast.error('No data to export');
            return;
        }
        try {
            // dynamic import to avoid build error if plugin missing
            const auto = await import('jspdf-autotable');
            const headers = Object.keys(rows[0]).filter(k=>k!=='tests').map(h => ({ header: h, dataKey: h }));
            // @ts-ignore
            doc.autoTable({
                head: [headers.map(h => h.header)],
                body: rows.map(r => headers.map(h => r[h.dataKey])),
                startY: 22
            });
        } catch (e) {
            // Fallback simple text table
            let y = 24;
            rows.forEach(r => {
                const line = Object.entries(r).filter(([k])=>k!=='tests').map(([k,v])=>`${k}: ${v}`).join('  |  ');
                doc.text(line, 14, y);
                y += 8;
            });
        }
        doc.save(`${reportsTab}-report-${timeRange}.pdf`);
    };

    const getTestPerformanceData = () => {
        if (!selectedTest) return [];

        const testResults = results.filter(r => r.test?._id === selectedTest);
        return testResults.map(result => ({
            name: `${result.student?.firstName} ${result.student?.lastName}`,
            score: result.score || 0,
            maxScore: result.test?.totalMarks || 0
        }));
    };

    useEffect(() => {
        console.log('Admin Dashboard - User:', user);
        console.log('Admin Dashboard - Token:', token ? 'Present' : 'Missing');

        if (!user) {
            console.log('No user found, redirecting to login');
            navigate("/login");
        } else if (user.role !== "admin") {
            console.log('User role is not admin:', user.role);
            navigate("/");
            toast.error("Unauthorized access");
        } else {
            console.log('Admin user authenticated, fetching data');
            fetchAllData();
        }
    }, [user, navigate, token]);

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    // Render different sections
    const renderDashboard = () => (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl p-5 text-white relative overflow-hidden bg-gradient-to-r from-blue-500 to-blue-600 shadow-sm"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-white/80 text-sm">Total Students</p>
                            <p className="text-3xl font-bold leading-tight">{stats.totalStudents || students.length}</p>
                        </div>
                        <div className="bg-white/15 rounded-lg p-3">
                            <GraduationCap className="w-8 h-8 text-white" />
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 }}
                    className="rounded-xl p-5 text-white relative overflow-hidden bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-sm"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-white/80 text-sm">Total Teachers</p>
                            <p className="text-3xl font-bold leading-tight">{stats.totalTeachers || teachers.length}</p>
                        </div>
                        <div className="bg-white/15 rounded-lg p-3">
                            <UserCheck className="w-8 h-8 text-white" />
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.16 }}
                    className="rounded-xl p-5 text-white relative overflow-hidden bg-gradient-to-r from-violet-500 to-violet-600 shadow-sm"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-white/80 text-sm">Total Tests</p>
                            <p className="text-3xl font-bold leading-tight">{stats.totalTests || tests.length}</p>
                        </div>
                        <div className="bg-white/15 rounded-lg p-3">
                            <BookOpen className="w-8 h-8 text-white" />
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.24 }}
                    className="rounded-xl p-5 text-white relative overflow-hidden bg-gradient-to-r from-orange-500 to-orange-600 shadow-sm"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-white/80 text-sm">Total Results</p>
                            <p className="text-3xl font-bold leading-tight">{stats.totalResults || results.length}</p>
                        </div>
                        <div className="bg-white/15 rounded-lg p-3">
                            <BarChart3 className="w-8 h-8 text-white" />
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Clean dashboard as requested (no attendance/results widgets) */}
        </div>
    );

    const renderStudents = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Student Management</h2>
                <div className="flex gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search students..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <button
                        onClick={fetchStudents}
                        className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {students
                            .filter(student =>
                                student.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                student.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                student.email?.toLowerCase().includes(searchTerm.toLowerCase())
                            )
                            .map((student) => (
                                <tr key={student._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                                    <GraduationCap className="w-5 h-5 text-green-600" />
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {student.firstName} {student.lastName}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {student.email}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {student.className || '-'} {student.section ? `(${student.section})` : ''}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setEditUserModal({ open: true, user: { ...student } })}
                                                className="text-gray-600 hover:text-gray-900"
                                                title="Edit"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => downloadStudentReport(student._id)}
                                                className="text-blue-600 hover:text-blue-900"
                                                title="Download Report"
                                            >
                                                <Download className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => deleteUser(student._id, 'student')}
                                                className="text-red-600 hover:text-red-900"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderTeachers = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Teacher Management</h2>
                <div className="flex gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search teachers..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <button
                        onClick={fetchTeachers}
                        className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {teachers
                            .filter(teacher =>
                                teacher.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                teacher.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                teacher.email?.toLowerCase().includes(searchTerm.toLowerCase())
                            )
                            .map((teacher) => (
                                <tr key={teacher._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                                    <UserCheck className="w-5 h-5 text-purple-600" />
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {teacher.firstName} {teacher.lastName}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {teacher.email}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{teacher.role}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setViewTeacherTests({ open: true, teacher })}
                                                className="text-blue-600 hover:text-blue-900"
                                                title="View Tests"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => deleteUser(teacher._id, 'teacher')}
                                                className="text-red-600 hover:text-red-900"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderTests = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">All Tests</h2>
                <button onClick={fetchTests} className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
                    <RefreshCw className="w-4 h-4" /> Refresh
                </button>
            </div>
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teacher</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marks</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {tests.map(t => (
                            <tr key={t._id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">{t.testName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{t.teacherId ? `${t.teacherId.firstName} ${t.teacherId.lastName}` : '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{t.totalMarks || t.outOfMarks}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{t.minutes} min</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => downloadTestReport(t._id)}
                                            className="text-blue-600 hover:text-blue-900"
                                            title="Download Report"
                                        >
                                            <Download className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={async () => {
                                                if (!window.confirm('Delete this test?')) return;
                                                try {
                                                    await axios.delete(`${import.meta.env.VITE_API_URL}/api/teacher/delete-test/${t._id}`, { headers: { Authorization: `Bearer ${token}` } });
                                                    toast.success('Test deleted');
                                                    fetchTests();
                                                } catch (e) { toast.error('Failed to delete test'); }
                                            }}
                                            className="text-red-600 hover:text-red-900"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderReports = () => (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-800">Reports</h2>
                <div className="flex rounded overflow-hidden border">
                    <button onClick={()=>{setReportsTab('teacher'); setSelectedStudentId('');}} className={`px-3 py-2 text-sm ${reportsTab==='teacher'?'bg-blue-500 text-white':'bg-white'}`}>Teachers</button>
                    <button onClick={()=>{setReportsTab('student'); setSelectedStudentId('');}} className={`px-3 py-2 text-sm ${reportsTab==='student'?'bg-blue-500 text-white':'bg-white'}`}>Students</button>
                </div>
            </div>

            {reportsTab === 'teacher' && (
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <h3 className="text-lg font-semibold mb-4">Select a teacher</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {teachers.map(t => (
                            <button key={t._id} onClick={()=>setViewTeacherTests({ open: true, teacher: t })} className="text-left p-4 rounded-lg border hover:border-blue-400 hover:bg-blue-50 transition">
                                <div className="font-medium">{t.firstName} {t.lastName}</div>
                                <div className="text-sm text-gray-500">{t.email}</div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {reportsTab === 'student' && !selectedStudentId && (
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <h3 className="text-lg font-semibold mb-4">Select a student</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {students.map(s => (
                            <button key={s._id} onClick={()=>setSelectedStudentId(s._id)} className="text-left p-4 rounded-lg border hover:border-emerald-400 hover:bg-emerald-50 transition">
                                <div className="font-medium">{s.firstName} {s.lastName}</div>
                                <div className="text-sm text-gray-500">{s.email}</div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {reportsTab === 'student' && selectedStudentId && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <button onClick={()=>setSelectedStudentId('')} className="text-blue-600 hover:text-blue-800">← Back</button>
                        <button onClick={()=>downloadStudentReport(selectedStudentId)} className="bg-emerald-500 text-white px-4 py-2 rounded hover:bg-emerald-600">Download Report</button>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                        <h3 className="text-lg font-semibold mb-3">Scores by Test</h3>
                        <ResponsiveContainer width="100%" height={360}>
                            <BarChart data={(results||[]).filter(r=>r.studentId && r.studentId._id===selectedStudentId).map(r=>({ name: r.testId?.testName || 'Test', score: r.score, total: r.testId?.totalMarks || r.outOfMarks || 0 }))}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" interval={0} angle={-15} textAnchor="end" height={80} />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="score" fill="#3B82F6" name="Score" />
                                <Bar dataKey="total" fill="#10B981" name="Total" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );

    const renderAnalytics = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Test Analytics</h2>
                <div className="flex gap-4">
                    <select
                        value={selectedTest}
                        onChange={(e) => setSelectedTest(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Select a test</option>
                        {tests.map(test => (
                            <option key={test._id} value={test._id}>
                                {test.testName}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {selectedTest && (
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Test Performance</h3>
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={getTestPerformanceData()}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="score" fill="#3B82F6" name="Score" />
                            <Bar dataKey="maxScore" fill="#EF4444" name="Max Score" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );

    const renderProfile = () => (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Admin Profile</h2>

            <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center gap-6 mb-6">
                    <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="w-10 h-10 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold">{user?.firstName} {user?.lastName}</h3>
                        <p className="text-gray-600">{user?.email}</p>
                        <p className="text-sm text-gray-500">Administrator</p>
                    </div>
                </div>

                <button
                    onClick={() => setShowProfileModal(true)}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                >
                    Edit Profile
                </button>
            </div>
        </div>
    );

    const renderContent = () => {
        switch (activeSection) {
            case 'dashboard':
                return renderDashboard();
            case 'students':
                return renderStudents();
            case 'teachers':
                return renderTeachers();
            case 'tests':
                return renderTests();
            case 'reports':
                return renderReports();
            case 'analytics':
                return renderAnalytics();
            case 'profile':
                return renderProfile();
            default:
                return renderDashboard();
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* Sidebar */}
            <motion.div
                initial={{ x: -250 }}
                animate={{ x: sidebarOpen ? 0 : -250 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg"
            >
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center justify-between p-6 border-b">
                        <h1 className="text-xl font-bold text-gray-800">ExamVolt Admin</h1>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden text-gray-500 hover:text-gray-700"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Menu Items */}
                    <nav className="flex-1 px-4 py-6 space-y-2">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveSection(item.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${activeSection === item.id
                                        ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                                        : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    <Icon className={`w-5 h-5 ${activeSection === item.id ? 'text-blue-600' : item.color}`} />
                                    <span className="font-medium">{item.label}</span>
                                </button>
                            );
                        })}
                    </nav>

                    {/* Logout */}
                    <div className="p-4 border-t">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-red-600 hover:bg-red-50 transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                            <span className="font-medium">Logout</span>
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Main Content */}
            <div className="flex-1 lg:ml-64">
                {/* Top Bar */}
                <header className="bg-white shadow-sm border-b px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="lg:hidden text-gray-500 hover:text-gray-700"
                            >
                                <ChevronRight className="w-6 h-6" />
                            </button>
                            <h2 className="text-2xl font-bold text-gray-800 capitalize">
                                {menuItems.find(item => item.id === activeSection)?.label || 'Dashboard'}
                            </h2>
                        </div>

                        <div className="flex items-center gap-4">
                            <button className="relative p-2 text-gray-500 hover:text-gray-700">
                                <Bell className="w-6 h-6" />
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                    3
                                </span>
                            </button>

                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                    <User className="w-4 h-4 text-blue-600" />
                                </div>
                                <span className="text-gray-700 font-medium">{user?.firstName}</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <main className="p-6">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeSection}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {renderContent()}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>

            {/* Profile Modal */}
            {showProfileModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">Edit Profile</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">First Name</label>
                                <input
                                    type="text"
                                    value={profileData.firstName || user?.firstName || ''}
                                    onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                                <input
                                    type="text"
                                    value={profileData.lastName || user?.lastName || ''}
                                    onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email</label>
                                <input
                                    type="email"
                                    value={profileData.email || user?.email || ''}
                                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowProfileModal(false)}
                                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-400"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    // Handle profile update
                                    setShowProfileModal(false);
                                    toast.success('Profile updated successfully');
                                }}
                                className="flex-1 bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {editUserModal.open && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">Edit User</h3>
                        <div className="space-y-3">
                            <input className="w-full border rounded px-3 py-2" placeholder="First Name" value={editUserModal.user.firstName || ''} onChange={(e)=>setEditUserModal(p=>({ ...p, user:{...p.user, firstName:e.target.value} }))} />
                            <input className="w-full border rounded px-3 py-2" placeholder="Last Name" value={editUserModal.user.lastName || ''} onChange={(e)=>setEditUserModal(p=>({ ...p, user:{...p.user, lastName:e.target.value} }))} />
                            <input className="w-full border rounded px-3 py-2" placeholder="Email" value={editUserModal.user.email || ''} onChange={(e)=>setEditUserModal(p=>({ ...p, user:{...p.user, email:e.target.value} }))} />
                            <div className="flex gap-3">
                                <input className="flex-1 border rounded px-3 py-2" placeholder="Class" value={editUserModal.user.className || ''} onChange={(e)=>setEditUserModal(p=>({ ...p, user:{...p.user, className:e.target.value} }))} />
                                <input className="flex-1 border rounded px-3 py-2" placeholder="Section" value={editUserModal.user.section || ''} onChange={(e)=>setEditUserModal(p=>({ ...p, user:{...p.user, section:e.target.value} }))} />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={()=>setEditUserModal({ open:false, user:null })} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-400">Cancel</button>
                            <button onClick={saveUserEdits} className="flex-1 bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600">Save</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Teacher Tests Drawer */}
            {viewTeacherTests.open && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-end z-50">
                    <div className="w-full max-w-xl h-full bg-white shadow-xl p-6 overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Tests by {viewTeacherTests.teacher.firstName} {viewTeacherTests.teacher.lastName}</h3>
                            <button onClick={()=>setViewTeacherTests({ open:false, teacher:null })} className="text-gray-600 hover:text-gray-900">Close</button>
                        </div>
                        <div className="space-y-3">
                            {tests.filter(t=>t.teacherId && t.teacherId._id === viewTeacherTests.teacher._id).map(t => (
                                <div key={t._id} className="border rounded p-3 flex items-center justify-between">
                                    <div>
                                        <div className="font-medium">{t.testName}</div>
                                        <div className="text-sm text-gray-500">Marks: {t.totalMarks || t.outOfMarks} • {t.minutes} min</div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => downloadTestReport(t._id)} className="text-blue-600 hover:text-blue-900" title="Download Report"><Download className="w-4 h-4" /></button>
                                        <button onClick={async ()=>{
                                            if (!window.confirm('Delete this test?')) return;
                                            try {
                                                await axios.delete(`${import.meta.env.VITE_API_URL}/api/teacher/delete-test/${t._id}`, { headers: { Authorization: `Bearer ${token}` } });
                                                toast.success('Test deleted');
                                                fetchTests();
                                            } catch(e){ toast.error('Failed to delete test'); }
                                        }} className="text-red-600 hover:text-red-900" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            ))}
                            {tests.filter(t=>t.teacherId && t.teacherId._id === viewTeacherTests.teacher._id).length === 0 && (
                                <div className="text-sm text-gray-500">No tests found for this teacher.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {teacherDetail.open && (
                <div className="fixed inset-0 bg-black/40 flex items-end md:items-center justify-center z-50">
                    <div className="bg-white rounded-t-xl md:rounded-xl w-full max-w-2xl p-6 shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-semibold">Tests by {teacherDetail.teacherName}</h4>
                            <button onClick={()=>setTeacherDetail({ open:false, teacherName:'', tests:[] })} className="text-gray-500 hover:text-gray-800">Close</button>
                        </div>
                        <div className="max-h-80 overflow-y-auto divide-y">
                            {teacherDetail.tests.length === 0 ? (
                                <div className="text-sm text-gray-500">No tests available.</div>
                            ) : (
                                teacherDetail.tests.map(t => (
                                    <div key={t._id} className="py-3 flex items-center justify-between">
                                        <div>
                                            <div className="font-medium">{t.testName}</div>
                                            <div className="text-xs text-gray-500">Marks: {t.totalMarks || t.outOfMarks} • {t.minutes} min</div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={()=>downloadTestReport(t._id)} className="text-blue-600 hover:text-blue-800">Report</button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

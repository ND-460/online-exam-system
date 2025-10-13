
import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Bell, Sun, Moon, User, Users, FileText, TrendingUp, Clock, CheckCircle, XCircle, Trash2, BarChart3, Mail, CreditCard, Plus, MessageCircle, Activity, Loader2, RefreshCw, Home, Settings, LogOut, Search, Filter, Calendar, ArrowUpDown, Edit, BookOpen, GraduationCap, PieChart as PieChartIcon, Download, Eye, MoreHorizontal, Save, X
} from "lucide-react";
import { useNavigate, Link, useParams } from "react-router-dom"
import { useAuthStore } from "../../store/authStore";
import { toast } from "react-toastify";
import axios from "axios";
import AdminAnalyticsCards from "../../components/AdminAnalyticsCards";
import { downloadCompleteReport, createDashboardPdf, exportSelectionToPdf, exportTeacherAnalyticsPdf, exportStudentAnalyticsPdf } from "../../utils/reportGenerator";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';
import AdminDashboardOverview from "../../components/AdminDashboardOverview";

// Cache bust: 2024-01-15
export default function AdminDashboardNew() {
  const params = useParams();

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

  const [chartData, setChartData] = useState({
    testsPerWeek: [],
    studentsByOrg: [],
    teachersByOrg: [],
    performanceData: [],
    performanceTrend: [],
    marksDistribution: {},
    testAverageMarks: []
  });
  
  // No pagination needed for daily logins chart
  const [actionLoading, setActionLoading] = useState({});
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const saved = localStorage.getItem('admin_active_tab');
      return saved || "dashboard";
    } catch {
      return "dashboard";
    }
  });
  const [tests, setTests] = useState([]);
  const [analyticsTeacher, setAnalyticsTeacher] = useState(null);
  const [editTeacher, setEditTeacher] = useState(null);
  const [editStatus, setEditStatus] = useState("active");
  const [analyticsStudent, setAnalyticsStudent] = useState(null);
  const [viewTeacher, setViewTeacher] = useState(null);
  const [viewStudent, setViewStudent] = useState(null);

  // Persist and restore scroll positions per tab
  const scrollPositionsRef = useRef({});

  // Restore scroll on mount and on tab change; persist activeTab
  useEffect(() => {
    try {
      localStorage.setItem('admin_active_tab', activeTab);
    } catch {}

    // small delay to ensure content rendered
    const handle = setTimeout(() => {
      try {
        const raw = localStorage.getItem('admin_tab_scroll');
        const map = raw ? JSON.parse(raw) : {};
        const y = map[activeTab] || 0;
        window.scrollTo({ top: y, behavior: 'instant' });
      } catch {}
    }, 0);

    return () => clearTimeout(handle);
  }, [activeTab]);

  // Capture scroll positions throttled
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        try {
          const raw = localStorage.getItem('admin_tab_scroll');
          const map = raw ? JSON.parse(raw) : {};
          map[activeTab] = window.scrollY || document.documentElement.scrollTop || 0;
          localStorage.setItem('admin_tab_scroll', JSON.stringify(map));
        } catch {}
        ticking = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [activeTab]);

  // Close any open modals or transient states when switching tabs
  useEffect(() => {
    setAnalyticsTeacher(null);
    setAnalyticsStudent(null);
    setViewTeacher(null);
    setViewStudent(null);
    setEditTeacher(null);
  }, [activeTab]);
  const [editTeacherProfile, setEditTeacherProfile] = useState(null);
  const [editStudentProfile, setEditStudentProfile] = useState(null);

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


  // Organization analytics state
  const [orgAnalytics, setOrgAnalytics] = useState({ 
    testPerformance: [], 
    summary: { totalTests: 0, totalStudents: 0, totalTeachers: 0, totalResults: 0 }
  });
  const [timelineData, setTimelineData] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [yearlyData, setYearlyData] = useState([]);
  const [performanceDistribution, setPerformanceDistribution] = useState([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  
  const { logout, user, token, updateUser } = useAuthStore()
  const navigate = useNavigate()


  // Hidden chart refs for PDF generation
  const usersBreakdownRef = useRef(null);
  const usersStatusRef = useRef(null);


  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Inline component: Teacher Analytics content (charts + table + download)
  const TeacherAnalyticsContent = ({ teacher, onDataLoad }) => {
    const [loadingTA, setLoadingTA] = useState(false);
    const [teacherTests, setTeacherTests] = useState([]);
    const [testResults, setTestResults] = useState([]);
    const [overview, setOverview] = useState({ totalTests: 0, publishedTests: 0, draftTests: 0, completedTests: 0, totalSubmissions: 0 });
    const fetchedRef = useRef(null); // Prevent duplicate fetches

    useEffect(() => {
      let cancelled = false;
      const fetchTeacherData = async () => {
        try {
          const teacherDocId = teacher?.profileId;
          
          if (!teacherDocId) {
            console.warn('No profileId found for teacher:', teacher);
            if (!cancelled) {
              setTeacherTests([]);
              setTestResults([]);
              setOverview({ totalTests: 0, publishedTests: 0, draftTests: 0, completedTests: 0, totalSubmissions: 0 });
              setLoadingTA(false);
            }
            return;
          }
          
          // Check if we're already fetching/fetched this teacher
          if (fetchedRef.current === teacherDocId && (teacherTests.length > 0 || testResults.length > 0)) {
            console.log('Data already loaded for this teacher, skipping fetch...');
            return;
          }
          
          // If it's a different teacher, reset and fetch
          if (fetchedRef.current !== teacherDocId) {
            fetchedRef.current = teacherDocId;
            setTeacherTests([]);
            setTestResults([]);
            setOverview({ totalTests: 0, publishedTests: 0, draftTests: 0, completedTests: 0, totalSubmissions: 0 });
          }
          
          setLoadingTA(true);
          
          // Fetch teacher's tests directly
          const testsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/teacher/tests/${teacherDocId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          const tests = testsRes?.data || [];
          
          if (!cancelled) {
            setTeacherTests(tests);
            
            // Calculate overview
            const totalTests = tests.length;
            const publishedTests = tests.filter(t => t.status === 'published').length;
            const draftTests = tests.filter(t => t.status === 'draft').length;
            const completedTests = tests.filter(t => t.status === 'completed').length;
            
            // Fetch results for each test to get submission counts and averages
            let allResults = [];
            let totalSubmissions = 0;
            
            for (const test of tests) {
              try {
                const resultRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/teacher/test-results/${test._id}`, {
                  headers: { Authorization: `Bearer ${token}` }
                });
                const testData = resultRes?.data;
                
                if (testData) {
                  const submissionCount = testData.submissions?.length || 0;
                  totalSubmissions += submissionCount;
                  allResults.push({
                    testId: test._id,
                    testName: test.testName,
                    submissions: testData.submissions || [],
                    analytics: testData.analytics || {},
                    averagePercentage: testData.analytics?.averagePercentage || 0,
                    submissionCount: submissionCount,
                    date: test.publishedAt || test.createdAt || test.scheduledAt
                  });
                }
              } catch (err) {
                // Add test with zero submissions
                allResults.push({
                  testId: test._id,
                  testName: test.testName,
                  submissions: [],
                  analytics: {},
                  averagePercentage: 0,
                  submissionCount: 0,
                  date: test.publishedAt || test.createdAt || test.scheduledAt
                });
              }
            }
            
            if (!cancelled) {
              setTestResults(allResults);
              const overviewData = {
                totalTests,
                publishedTests,
                draftTests,
                completedTests,
                totalSubmissions
              };
              setOverview(overviewData);
              
              // Pass comprehensive data to parent via callback
              if (onDataLoad) {
                onDataLoad({
                  overview: overviewData,
                  testResults: allResults,
                  teacherTests: tests
                });
              }
            }
          }
        } catch (e) {
          console.error('Error fetching teacher data:', e);
          console.error('Error details:', {
            message: e.message,
            response: e.response?.data,
            status: e.response?.status
          });
          if (!cancelled) {
            setTeacherTests([]);
            setTestResults([]);
            setOverview({ totalTests: 0, publishedTests: 0, draftTests: 0, completedTests: 0, totalSubmissions: 0 });
          }
        } finally {
          if (!cancelled) setLoadingTA(false);
        }
      };
      
      fetchTeacherData();
      return () => { cancelled = true; };
    }, [teacher?.profileId, token]);

    const handleDownload = () => {
      const chartData = {
        testsCreated: testResults.map(d => ({ 
          testName: d.testName, 
          submissions: d.submissionCount || 0, 
          date: d.date ? new Date(d.date).toISOString().slice(0,10) : '',
          averagePercentage: Math.round((d.averagePercentage || 0) * 100) / 100
        }))
      };
      downloadCompleteReport(chartData);
    };

    if (loadingTA) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading analytics data...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Debug info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs">
            <p><strong>Debug:</strong> Teacher ID: {teacher?.profileId || 'N/A'}, Tests loaded: {testResults.length || 0}, Total submissions: {overview.totalSubmissions || 0}</p>
          </div>
        )}
        
        {/* Overview badges */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Total Tests', value: overview?.totalTests || 0, color: 'text-blue-600' },
            { label: 'Total Submissions', value: overview?.totalSubmissions || 0, color: 'text-green-600' }
          ].map((c, idx) => (
            <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="text-sm text-gray-500">{c.label}</div>
              <div className={`text-xl font-semibold ${c.color}`}>{c.value}</div>
            </div>
          ))}
        </div>

        {/* Additional status cards */}
        <div className="grid grid-cols-3 gap-4">
          {[{label:'Published', value: overview?.publishedTests || 0}, {label:'Completed', value: overview?.completedTests || 0}, {label:'Drafts', value: overview?.draftTests || 0}].map((c, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-sm text-gray-500">{c.label}</div>
              <div className="text-lg font-semibold text-gray-800">{c.value}</div>
            </div>
          ))}
        </div>

        {/* Tests Created Chart */}
        <div className="bg-white rounded-xl shadow p-4 border border-gray-200">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-semibold text-gray-800">Tests Created Over Time</h4>
            <button onClick={() => createDashboardPdf([{ title: 'Teacher - Tests Created Over Time', data: testResults }], { filename: 'teacher-tests-created.pdf' })} className="text-sm text-emerald-700 hover:text-emerald-800">Download PDF</button>
          </div>
          <div className="h-[360px]">
            {(!Array.isArray(testResults) || testResults.length === 0) ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-600">No Tests Created</p>
                  <p className="text-xs text-gray-500 mt-1">This teacher hasn't created any tests yet</p>
                </div>
              </div>
            ) : (
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={testResults.map((d, index) => ({ 
                  name: d.testName || `Test ${index + 1}`, 
                  submissions: d.submissionCount || 0,
                  date: d.date ? new Date(d.date).toLocaleDateString() : 'N/A'
                }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" interval={0} angle={-15} textAnchor="end" height={70} />
                  <YAxis allowDecimals={false} />
                  <Tooltip 
                    formatter={(value, name) => [value, 'Submissions']}
                    labelFormatter={(label, payload) => {
                      const data = payload?.[0]?.payload;
                      return data ? `${label} (Created: ${data.date})` : label;
                    }}
                  />
                  <Bar dataKey="submissions" fill="#10B981" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Tests Created Table */}
        <div className="bg-white rounded-xl shadow p-4 border border-gray-200">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-semibold text-gray-800">Tests Created</h4>
            <button onClick={() => createDashboardPdf([{ title: 'Teacher - Tests Table', data: testResults }], { filename: 'teacher-tests-table.pdf' })} className="text-sm text-emerald-700 hover:text-emerald-800">Download PDF</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-gray-700">Test Name</th>
                  <th className="text-left py-2 px-3 text-gray-700">Submissions</th>
                  <th className="text-left py-2 px-3 text-gray-700">Created Date</th>
                </tr>
              </thead>
              <tbody>
                {testResults.map((d, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-2 px-3 font-medium">{d.testName}</td>
                    <td className="py-2 px-3">{d.submissionCount || 0}</td>
                    <td className="py-2 px-3">{d.date ? new Date(d.date).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
                {(!Array.isArray(testResults) || testResults.length === 0) && (
                  <tr><td colSpan="3" className="py-4 px-3 text-gray-500">
                    No tests created yet. This teacher hasn't created any tests.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Total Average Percentage */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow p-6 border border-blue-200">
          <div className="text-center">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">Overall Performance Summary</h4>
            <div className="flex justify-center items-center space-x-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {(() => {
                    const testsWithSubmissions = testResults.filter(d => d.submissionCount > 0);
                    const totalAvg = testsWithSubmissions.length ? 
                      Math.round((testsWithSubmissions.reduce((s, d) => s + Number(d.averagePercentage || 0), 0) / testsWithSubmissions.length) * 100) / 100 : 0;
                    return totalAvg;
                  })()}%
                </div>
                <div className="text-sm text-gray-600 mt-1">Total Average Percentage</div>
                <div className="text-xs text-gray-500 mt-1">Across all tests with submissions</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {overview.totalTests || 0}
                </div>
                <div className="text-sm text-gray-600 mt-1">Total Tests Created</div>
                <div className="text-xs text-gray-500 mt-1">All test statuses included</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {overview.totalSubmissions || 0}
                </div>
                <div className="text-sm text-gray-600 mt-1">Total Submissions</div>
                <div className="text-xs text-gray-500 mt-1">From all students</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
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
       ['Name', 'Email', 'Organization', 'Tests Taken', 'Average Percentage', 'Status'],
      ...students.map(student => [
        student.name || 'N/A',
        student.email || 'N/A',
        student.organization || 'N/A',
        student.testsTaken || 0,
        student.averagePercentage || 'N/A',
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
      ...organizations
        .filter(org => org.name && org.name !== 'N/A')
        .map(org => [
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
        pendingUsers: response.data.pendingUsers || 0,
        publishedTests: response.data.publishedTests || 0,
        draftTests: response.data.draftTests || 0,
        totalResults: response.data.totalResults || 0
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
      const orgs = response.data.organizations || [];
      setOrganizations(orgs);
      
      // Also update chart data for analytics
      setChartData(prev => ({
        ...prev,
        organizationsData: orgs
      }));
    } catch (error) {
      console.error('Error fetching organizations:', error);
      toast.error('Failed to fetch organizations data');
      setOrganizations([]);
    }
  };

  // Fetch tests (normalized for admin)
  const fetchTests = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/user/admin/tests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTests(res.data.tests || []);
    } catch (err) {
      console.error('Error fetching tests:', err);
      toast.error('Failed to fetch tests');
      setTests([]);
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
        totalAdmins: response.data.totalAdmins || 0,
        systemOverview: response.data.systemOverview || {}
      });
      // Ensure cards show correct test count even if stats endpoint lacks it
      setStats(prev => ({
        ...prev,
        totalTests: response.data.totalTests || prev.totalTests || 0
      }));
      // Feed System Overview into charts
      setChartData(prev => ({
        ...prev,
        systemOverview: response.data.systemOverview || prev.systemOverview
      }));
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

  // Fetch average marks by test for the chart
  const fetchTestAverageMarks = async () => {
    try {
      // Fetch all tests
      const testsResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/user/admin/tests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const allTests = testsResponse.data.tests || [];
      
      // Get first 10 tests and calculate their average marks
      const testMarksData = await Promise.all(
        allTests.slice(0, 10).map(async (test) => {
          try {
            const resultsResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/teacher/test-results/${test._id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const testData = resultsResponse.data;
            const averagePercentage = testData?.analytics?.averagePercentage || 0;
            
            return {
              testName: (test.testName || 'Unnamed Test').length > 20 
                ? (test.testName || 'Unnamed Test').substring(0, 20) + '...' 
                : (test.testName || 'Unnamed Test'),
              averagePercentage: Math.round(averagePercentage),
              submissionCount: testData?.submissions?.length || 0
            };
          } catch (err) {
            return null;
          }
        })
      );
      
      // Filter out null results and tests with no submissions
      return testMarksData.filter(test => test && test.submissionCount > 0);
    } catch (error) {
      console.error('Error fetching test average marks:', error);
      return [];
    }
  };

  // Fetch chart data
  const fetchChartData = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/user/admin/chart-data`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const api = response.data || {};
      
      // Fetch test average marks data
      const testAverageMarks = await fetchTestAverageMarks();

      // Normalize testsPerWeek: [{ _id: {week, year}, count }] -> [{ week, count }]
      const testsPerWeek = Array.isArray(api.testsPerWeek)
        ? api.testsPerWeek.map((row) => ({
            week: `W${row?._id?.week || ''}-${row?._id?.year || ''}`.trim(),
            count: Number(row?.count || 0)
          }))
        : [];

      // Normalize studentsByOrg/teachersByOrg: [{ _id: orgName, count }] -> [{ name, count }]
      const studentsByOrg = Array.isArray(api.studentsByOrg)
        ? api.studentsByOrg.map((row) => ({ name: row?._id || 'N/A', count: Number(row?.count || 0) }))
        : [];

      const teachersByOrg = Array.isArray(api.teachersByOrg)
        ? api.teachersByOrg.map((row) => ({ name: row?._id || 'N/A', count: Number(row?.count || 0) }))
        : [];

      // Normalize performanceTrend: [{ _id: {day, month}, averageScore }] -> [{ day, averageScore }]
      const performanceTrend = Array.isArray(api.performanceTrend)
        ? api.performanceTrend.map((row) => ({
            day: String(row?._id?.day ?? ''),
            averageScore: Math.round(Number(row?.averageScore || 0))
          }))
        : [];

      // Normalize marksDistribution: { '0-20': n, ... } -> [{ range, count }]
      const marksDistribution = api.marksDistribution && typeof api.marksDistribution === 'object'
        ? Object.entries(api.marksDistribution).map(([range, count]) => ({ range, count: Number(count || 0) }))
        : [];

      // Log the received activity data for debugging
      console.log('Received dailyLogins data:', api.dailyLogins);
      
      const activityData = Array.isArray(api.dailyLogins) ? api.dailyLogins.map(row => ({
        date: row?.date || '',
        teachers: Number(row?.teachers || 0),
        students: Number(row?.students || 0),
        admins: Number(row?.admins || 0)
      })) : [];
      
      console.log('Processed activityData:', activityData);

      setChartData({
        activityData: activityData,
        performanceData: marksDistribution,
        subjectData: performanceTrend,
        completionData: testsPerWeek.length > 0 ? testsPerWeek.map(test => ({
          week: test.week,
          completed: test.count,
          ongoing: 0,
          scheduled: 0
        })) : [
          { week: 'Jan', completed: 12 },
          { week: 'Feb', completed: 19 },
          { week: 'Mar', completed: 3 },
          { week: 'Apr', completed: 5 },
          { week: 'May', completed: 2 },
          { week: 'Jun', completed: 3 }
        ],
        systemOverview: api.systemOverview || {},
        testsPerWeek,
        studentsByOrg,
        teachersByOrg,
        marksDistribution,
        testAverageMarks
      });
      
    } catch (error) {
      console.error('Error fetching chart data:', error);
      toast.error('Failed to fetch chart data');
      
      // Provide fallback data for activity chart to show sample data
      const fallbackActivityData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        fallbackActivityData.push({
          date: dateStr,
          students: Math.floor(Math.random() * 20) + 10, // 10-30 students
          teachers: Math.floor(Math.random() * 8) + 5,   // 5-13 teachers  
          admins: Math.floor(Math.random() * 3) + 2      // 2-5 admins
        });
      }
      
      setChartData({
        testsPerWeek: [],
        studentsByOrg: [],
        teachersByOrg: [],
        performanceData: [],
        performanceTrend: [],
        marksDistribution: {},
        dailyLogins: [],
        systemOverview: undefined,
        testAverageMarks: [],
        activityData: fallbackActivityData
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

      // Refresh analytics and charts so admin widgets reflect the change
      await Promise.all([
        fetchStats(),
        fetchAnalytics(),
        fetchChartData()
      ]);
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

      // Refresh analytics and charts to reflect deletion
      await Promise.all([
        fetchStats(),
        fetchAnalytics(),
        fetchChartData()
      ]);
        } catch (error) {
            console.error('Error deleting user:', error);
            toast.error('Failed to delete user');
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleOpenEditTeacher = (teacher) => {
    setEditTeacher(teacher);
    setEditStatus(teacher?.status || "inactive");
  };

  const handleSaveEditTeacher = async () => {
    if (!editTeacher?._id) return;
    await updateUserStatus(editTeacher._id, editStatus);
    setEditTeacher(null);
  };

  const openEditTeacherProfile = (teacher) => {
    setEditTeacherProfile({
      _id: teacher._id,
      firstName: (teacher.name || '').split(' ')[0] || '',
      lastName: (teacher.name || '').split(' ').slice(1).join(' ') || '',
      email: teacher.email || '',
      phone: teacher.phone || '',
      organisation: { name: teacher.organization || '', address: '' },
      role: 'teacher'
    });
  };

  const openEditStudentProfile = (student) => {
    setEditStudentProfile({
      _id: student._id,
      firstName: (student.name || '').split(' ')[0] || '',
      lastName: (student.name || '').split(' ').slice(1).join(' ') || '',
      email: student.email || '',
      phone: student.phone || '',
      className: student.className || '10',
      section: student.section || 'A',
      organisation: { name: student.organization || '', address: '' },
      role: 'student'
    });
  };

  const saveProfile = async (profile) => {
    if (!profile?._id) return;
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/user/profile/${profile._id}`,
        profile,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Profile updated');
      // Refresh all data including organizations since profile changes might affect organization data
      await Promise.all([
        fetchTeachers(), 
        fetchStudents(), 
        fetchOrganizations(), 
        fetchStats(), 
        fetchAnalytics()
      ]);
    } catch (e) {
      toast.error('Failed to update profile');
    }
  };

  // Inline component: Student Analytics (assigned vs attempted)
  const StudentAnalyticsContent = ({ student, onDataLoad }) => {
    const [loadingSA, setLoadingSA] = useState(false);
    const [counts, setCounts] = useState({ upcoming: 0, ongoing: 0, completed: 0 });
    const [results, setResults] = useState([]);
    const [avgScore, setAvgScore] = useState(0);
    const fetchedRef = useRef(null); // Prevent duplicate fetches

    useEffect(() => {
      let cancelled = false;
      const run = async () => {
        try {
          const userId = student?._id || student?.userId || student?.profileId;
          
          // Check if we're already fetching/fetched this student
          if (fetchedRef.current === userId && (results.length > 0 || counts.completed > 0)) {
            console.log('Data already loaded for this student, skipping fetch...');
            return;
          }
          
          // If it's a different student, reset and fetch
          if (fetchedRef.current !== userId) {
            fetchedRef.current = userId;
            setCounts({ upcoming: 0, ongoing: 0, completed: 0 });
            setResults([]);
            setAvgScore(0);
          }
          
          setLoadingSA(true);
          const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/student/tests/student/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (!cancelled) setCounts(res.data || { upcoming: 0, ongoing: 0, completed: 0 });

          // Try to fetch results using possible ids (Student._id vs User._id)
          const candidateIds = [student?.studentId, student?._id, student?.profileId].filter(Boolean);
          let found = [];
          for (const id of candidateIds) {
            try {
              const r = await axios.get(`${import.meta.env.VITE_API_URL}/api/student/results/${id}`, { headers: { Authorization: `Bearer ${token}` } });
              if (Array.isArray(r.data?.results)) {
                found = r.data.results;
                if (found.length) break;
              }
            } catch (_) { /* try next */ }
          }
          if (!cancelled) {
            setResults(found);
            let calculatedAvgScore = 0;
            if (found.length) {
              const sumPct = found.reduce((sum, r) => {
                const outOf = r.outOfMarks || r.testId?.outOfMarks || 0;
                if (!outOf) return sum;
                return sum + (Number(r.score || 0) / outOf) * 100;
              }, 0);
              const avgPct = sumPct / found.length;
              calculatedAvgScore = Math.round(avgPct * 100) / 100;
              setAvgScore(calculatedAvgScore);
            } else {
              setAvgScore(0);
            }
            
            // Pass comprehensive data to parent via callback
            if (onDataLoad) {
              const totalAssigned = (counts.upcoming || 0) + (counts.ongoing || 0) + (counts.completed || 0);
              onDataLoad({
                counts,
                results: found,
                avgScore: calculatedAvgScore,
                totalAssigned
              });
            }
          }
        } catch (e) {
          if (!cancelled) setCounts({ upcoming: 0, ongoing: 0, completed: 0 });
        } finally {
          if (!cancelled) setLoadingSA(false);
        }
      };
      run();
      return () => { cancelled = true; };
    }, [student?._id]);

    const totalAssigned = (counts.upcoming || 0) + (counts.ongoing || 0) + (counts.completed || 0);
    const chartData = [
      { name: 'Assigned', value: totalAssigned },
      { name: 'Attempted', value: counts.completed || 0 }
    ];

    const handleDownload = () => {
      downloadCompleteReport({
        studentAssignedAttempted: chartData,
      });
    };

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[{label:'Assigned',value:totalAssigned},{label:'Completed',value:counts.completed||0},{label:'Ongoing',value:counts.ongoing||0},{label:'Upcoming',value:counts.upcoming||0},{label:'Average Percentage',value:`${avgScore}%`}].map((c,idx)=>(
            <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="text-sm text-gray-500">{c.label}</div>
              <div className="text-xl font-semibold text-gray-800">{c.value}</div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow p-4 border border-gray-200">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-semibold text-gray-800">Assigned vs Attempted</h4>
            <button onClick={() => createDashboardPdf([{ title: 'Student - Assigned vs Attempted', data: chartData }], { filename: 'student-assigned-attempted.pdf' })} className="text-sm text-emerald-700 hover:text-emerald-800">Download PDF</button>
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#10B981" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent test results table */}
        <div className="bg-white rounded-xl shadow p-4 border border-gray-200">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-semibold text-gray-800">Recent Test Results</h4>
            <button onClick={() => createDashboardPdf([{ title: 'Student - Recent Test Results', data: results }], { filename: 'student-recent-results.pdf' })} className="text-sm text-emerald-700 hover:text-emerald-800">Download PDF</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-gray-700">Test</th>
                  <th className="text-left py-2 px-3 text-gray-700">Score</th>
                  <th className="text-left py-2 px-3 text-gray-700">Out Of</th>
                </tr>
              </thead>
              <tbody>
                {(results||[]).slice(0,5).map((r,idx)=>(
                  <tr key={idx} className="border-b border-gray-100">
                    <td className="py-2 px-3">{r.testId?.testName || r.testName || 'Test'}</td>
                    <td className="py-2 px-3">{r.score}</td>
                    <td className="py-2 px-3">{r.outOfMarks || r.testId?.outOfMarks || 0}</td>
                  </tr>
                ))}
                {(!results || results.length===0) && (
                  <tr>
                    <td className="py-3 px-3 text-gray-500" colSpan="3">No results yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
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
        fetchTests(),
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
      } else if (activeTab === 'tests') {
        await fetchTests();
      } else if (activeTab === 'organizations') {
        await fetchOrganizations();
      } else if (activeTab === 'analytics') {
        await Promise.all([
          fetchAnalytics(),
          fetchOrganizations()
        ]);
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

  // Lightweight auto-refresh to keep charts in sync with remote changes
  useEffect(() => {
    let intervalId;
    let visibilityHandler;
    
    // Auto-refresh organizations every 30 seconds when on analytics or organizations tab
    let orgIntervalId;
    // Pause all background refreshes while any analytics modal is open to avoid blinking
    if (analyticsTeacher || analyticsStudent) {
      return () => {};
    }
    if (activeTab === 'analytics' || activeTab === 'organizations') {
      orgIntervalId = setInterval(() => {
        fetchOrganizations();
      }, 30000); // 30 seconds
    }
    
    // periodic refresh of key widgets
    intervalId = setInterval(() => {
      // Only refresh the inexpensive, aggregated endpoints
      Promise.all([fetchStats(), fetchChartData()]).catch(() => {});
    }, 20000); // 20s

    // refresh when window/tab gains focus
    visibilityHandler = () => {
      if (document.visibilityState === 'visible') {
        Promise.all([fetchStats(), fetchChartData(), fetchAnalytics()]).catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', visibilityHandler);

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (orgIntervalId) clearInterval(orgIntervalId);
      document.removeEventListener('visibilitychange', visibilityHandler);
    };
  }, [activeTab, analyticsTeacher, analyticsStudent]);

  // Initialize notifications
  useEffect(() => {
    setNotifications([]);
  }, []);

  // Fetch organization analytics data
  useEffect(() => {
    const fetchOrgAnalytics = async () => {
      if (!params.orgId || activeTab !== "organizations") {
        setAnalyticsLoading(false);
        return;
      }
      
      // Wait for organizations to be loaded if not yet available
      if (organizations.length === 0) {
        await fetchOrganizations();
      }
      
      const org = organizations.find(o => String(o._id) === String(params.orgId));
      if (!org?.name || org.name === 'N/A') {
        setAnalyticsLoading(false);
        return;
      }
      
      try {
        setAnalyticsLoading(true);
        
        
        // Fetch main analytics data
        const analyticsResponse = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/analytics/organization/${encodeURIComponent(org.name)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        // Optional debug logs (guarded to avoid ReferenceError in production)
        if (typeof logAPICall === 'function') {
          logAPICall(`/api/analytics/organization/${org.name}`, analyticsResponse);
        }
        if (typeof logAnalyticsData === 'function') {
          logAnalyticsData('Organization Analytics', analyticsResponse.data);
        }
        setOrgAnalytics(analyticsResponse.data);

        // Fetch timeline data (monthly)
        const timelineResponse = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/analytics/organization/${encodeURIComponent(org.name)}/timeline?period=monthly`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setTimelineData(timelineResponse.data);

        // Fetch weekly data
        const weeklyResponse = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/analytics/organization/${encodeURIComponent(org.name)}/timeline?period=weekly`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setWeeklyData(weeklyResponse.data);

        // Fetch yearly data
        const yearlyResponse = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/analytics/organization/${encodeURIComponent(org.name)}/timeline?period=yearly`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setYearlyData(yearlyResponse.data);

        // Fetch performance distribution
        const distributionResponse = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/analytics/organization/${encodeURIComponent(org.name)}/performance-distribution`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setPerformanceDistribution(distributionResponse.data);

      } catch (error) {
        console.error('Error fetching organization analytics:', error);
        toast.error('Failed to load analytics data');
        
        // Set fallback data to prevent chart rendering errors
        setOrgAnalytics({ 
          testPerformance: [], 
          summary: { totalTests: 0, totalStudents: 0, totalTeachers: 0, totalResults: 0 }
        });
        setTimelineData([]);
        setWeeklyData([]);
        setYearlyData([]);
        setPerformanceDistribution([]);
      } finally {
        setAnalyticsLoading(false);
      }
    };

    fetchOrgAnalytics();
  }, [params.orgId, activeTab, organizations, token]);

  const USER_COLORS = ['#3B82F6', '#10B981', '#F59E0B'];
  const STATUS_COLORS = ['#16A34A', '#F59E0B'];

  const usersBreakdownData = [
    { name: 'Students', value: Number(stats.totalStudents || 0) },
    { name: 'Teachers', value: Number(stats.totalTeachers || 0) },
    { name: 'Admins', value: Number(analytics.totalAdmins || 0) }
  ];

  const usersStatusData = [
    { name: 'Active', value: Number(stats.activeUsers || 0) },
    { name: 'Pending', value: Number(stats.pendingUsers || 0) }
  ];

  const handleDownloadDashboardPdf = async (shouldPrint = true) => {
    await createDashboardPdf([
      { title: 'Users Breakdown (Students vs Teachers)', ref: usersBreakdownRef },
      { title: 'User Status (Active vs Pending)', ref: usersStatusRef }
    ], { print: shouldPrint, filename: 'admin-dashboard.pdf' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-white relative overflow-x-hidden">
      {/* Background with image only, fixed and ~20% transparency */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: `url(/images/back-image-min.jpg)`,
          opacity: 0.8
        }}
      />

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
        {/* Content Area with background visible */}
        <div className="relative z-10 p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className={`text-3xl font-bold mb-2 ${activeTab === "analytics" ? "text-white" : "text-gray-800"}`}>
              {activeTab === "dashboard" && "Dashboard"}
              {activeTab === "teachers" && "Teacher"}
              {activeTab === "students" && "Student"}
              {activeTab === "organizations" && (params.orgId ? "Organization Details" : "Organization")}
              {activeTab === "analytics" && "Analytics"}
              
              {activeTab === "profile" && "Profile"}
            </h1>
            <p className={`${activeTab === "analytics" ? "text-gray-200" : "text-gray-600"}`}>
              {activeTab === "dashboard" && "Overview of your examination system"}
              {activeTab === "teachers" && "Manage teachers and their activities"}
              {activeTab === "students" && "Manage students and their progress"}
              {activeTab === "organizations" && "Manage organizations and institutions"}
              {activeTab === "analytics" && "System performance and insights"}
              
              {activeTab === "profile" && "Your profile information"}
            </p>
            </div>

          {/* Dashboard Content */}
          {activeTab === "dashboard" && (
            <div className="space-y-8" id="admin-analytics-section">
              {/* Top cards */}
              <AdminAnalyticsCards 
                analytics={{
                  totalUsers: analytics.totalUsers || stats.totalUsers || 0,
                  totalTests: analytics.totalTests || stats.totalTests || 0,
                  totalStudents: analytics.totalStudents || stats.totalStudents || 0,
                  totalTeachers: analytics.totalTeachers || stats.totalTeachers || 0,
                  totalAdmins: analytics.totalAdmins || 0,
                  activeUsers: stats.activeUsers || 0,
                  completedTests: stats.completedTests || 0,
                  pendingUsers: stats.pendingUsers || 0,
                  systemHealth: 98
                }}
                loading={loading}
                onDownload={(chartType, data) => createDashboardPdf([{ title: chartType, data }], { filename: `${chartType}.pdf` })}
              />


              {/* Charts Section - 70-30 split in one row */}
              <div className="grid grid-cols-10 gap-8">
                {/* Test Created Per Day - Left side (70%) */}
                <div className="col-span-7 bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Test Created Per Day</h3>
                    <span className="text-sm text-gray-500">last 30 days</span>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData.completionData || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="week" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="completed" stroke="#3B82F6" strokeWidth={2} name="Tests Created" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Students vs Teachers Pie Chart - Right side (30%) */}
                <div className="col-span-3 bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Users Distribution</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={usersBreakdownData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                        >
                          {usersBreakdownData.map((_, idx) => (
                            <Cell key={`user-slice-${idx}`} fill={USER_COLORS[idx % USER_COLORS.length]} stroke="#fff" strokeWidth={2} />
                          ))}
                        </Pie>
                        <Legend />
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Analytics Toolbar */}
              <div className="flex justify-end -mt-4">
                <button
                  onClick={() => exportSelectionToPdf('#admin-analytics-section', 'admin-analytics-landscape.pdf', { landscape: true, includeCharts: true })}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" /> Download PDF (Landscape)
                </button>
              </div>

              {/* Hidden chart containers for PDF capture (kept for PDF creation) */}
              <div className="absolute -left-[99999px] top-0 w-[900px]">
                <div ref={usersBreakdownRef} className="bg-white p-6 rounded-xl shadow border border-gray-200 mb-6">
                  <div className="h-[420px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={usersBreakdownData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={80}
                          outerRadius={120}
                          paddingAngle={2}
                        >
                          {usersBreakdownData.map((_, idx) => (
                            <Cell key={`user-slice-${idx}`} fill={USER_COLORS[idx % USER_COLORS.length]} stroke="#fff" strokeWidth={2} />
                          ))}
                        </Pie>
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  </div>

                <div ref={usersStatusRef} className="bg-white p-6 rounded-xl shadow border border-gray-200">
                  <div className="h-[420px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={usersStatusData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={80}
                          outerRadius={120}
                          paddingAngle={2}
                        >
                          {usersStatusData.map((_, idx) => (
                            <Cell key={`status-slice-${idx}`} fill={STATUS_COLORS[idx % STATUS_COLORS.length]} stroke="#fff" strokeWidth={2} />
                          ))}
                        </Pie>
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Student Management Section */}
          {activeTab === "students" && (
            <div className="space-y-8">

              {/* Filters and Search */}
               <div id="students-section" className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
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
                    {organizations
                      .filter(org => org.name && org.name !== 'N/A')
                      .map((org) => (
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
                    <option value="averagePercentage">Sort: Avg Percentage</option>
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

                <div className="flex justify-end mb-2">
                  <button onClick={()=>exportSelectionToPdf('#students-section','students.pdf')} className="px-3 py-2 text-sm rounded bg-emerald-600 hover:bg-emerald-700 text-white">Download PDF</button>
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
                         <th className="text-left py-3 px-4 font-semibold text-gray-700">Average Percentage</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Analytics</th>
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
                            if (key === 'averagePercentage') {
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
                              <td className="py-3 px-4">{student.averagePercentage || 'N/A'}</td>
                              <td className="py-3 px-4">
                                <div className="flex gap-2">
                                  <button className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700" onClick={() => setAnalyticsStudent({ ...student })}>Analytics</button>
                                  <button className="px-3 py-1 text-xs bg-gray-700 text-white rounded hover:bg-gray-800" onClick={() => setViewStudent(student)}>Details</button>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex gap-2">
                                  <button className="p-1 text-blue-600 hover:bg-blue-100 rounded" onClick={() => openEditStudentProfile(student)}><Edit className="w-4 h-4" /></button>
                                  <button className="p-1 text-red-600 hover:bg-red-100 rounded" onClick={() => deleteUser(student._id)}>
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

               

              {/* Interactive Charts */}
              {/* AdminCharts component is removed as per the edit hint */}

              {/* Student Analytics Modal */}
              {analyticsStudent && (
                <div id="student-analytics-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                  <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl p-6 relative max-h-[85vh] overflow-y-auto modal-content">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-gray-800">{analyticsStudent.name || analyticsStudent.email || 'Student'} Analytics</h3>
                      <button className="text-gray-600 hover:text-gray-900" onClick={() => setAnalyticsStudent(null)}>
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <StudentAnalyticsContent 
                      student={analyticsStudent}
                      onDataLoad={(data) => {
                        // Store the comprehensive data for download
                        analyticsStudent.comprehensiveData = data;
                      }}
                    />
                    <div className="mt-6 flex justify-between items-center">
                      <button
                        onClick={() => {
                          exportStudentAnalyticsPdf(analyticsStudent, analyticsStudent.comprehensiveData);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Download Complete Report
                      </button>
                      <button onClick={() => setAnalyticsStudent(null)} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">Close</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Student Details Modal */}
              {viewStudent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                  <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl p-6 relative max-h-[85vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-gray-800">Student Details</h3>
                      <button className="text-gray-600 hover:text-gray-900" onClick={() => setViewStudent(null)}><X className="w-5 h-5" /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><div className="text-sm text-gray-500">Name</div><div className="font-semibold">{viewStudent.name}</div></div>
                      <div><div className="text-sm text-gray-500">Email</div><div className="font-semibold">{viewStudent.email}</div></div>
                      <div><div className="text-sm text-gray-500">Organization</div><div className="font-semibold">{viewStudent.organization || 'N/A'}</div></div>
                      <div><div className="text-sm text-gray-500">Status</div><div className="font-semibold">{viewStudent.status || 'active'}</div></div>
                      <div><div className="text-sm text-gray-500">Tests Taken</div><div className="font-semibold">{viewStudent.testsTaken || 0}</div></div>
                      <div><div className="text-sm text-gray-500">Average Percentage</div><div className="font-semibold">{viewStudent.averagePercentage || 'N/A'}</div></div>
                    </div>
                    <div className="mt-6 flex justify-end"><button onClick={() => setViewStudent(null)} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">Close</button></div>
                  </div>
                </div>
              )}

              {/* Student Edit Modal */}
              {editStudentProfile && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                  <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 relative max-h-[85vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-gray-800">Edit Student</h3>
                      <button className="text-gray-600 hover:text-gray-900" onClick={() => setEditStudentProfile(null)}><X className="w-5 h-5" /></button>
                    </div>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <input className="border rounded px-3 py-2" placeholder="First Name" value={editStudentProfile.firstName} onChange={(e)=>setEditStudentProfile({...editStudentProfile, firstName:e.target.value})} />
                        <input className="border rounded px-3 py-2" placeholder="Last Name" value={editStudentProfile.lastName} onChange={(e)=>setEditStudentProfile({...editStudentProfile, lastName:e.target.value})} />
                      </div>
                      <input className="border rounded px-3 py-2 w-full" placeholder="Email" value={editStudentProfile.email} onChange={(e)=>setEditStudentProfile({...editStudentProfile, email:e.target.value})} />
                      <div className="grid grid-cols-2 gap-3">
                        <input className="border rounded px-3 py-2" placeholder="Phone" value={editStudentProfile.phone||''} onChange={(e)=>setEditStudentProfile({...editStudentProfile, phone:e.target.value})} />
                        <input className="border rounded px-3 py-2" placeholder="Class" value={editStudentProfile.className} onChange={(e)=>setEditStudentProfile({...editStudentProfile, className:e.target.value})} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input className="border rounded px-3 py-2" placeholder="Section" value={editStudentProfile.section} onChange={(e)=>setEditStudentProfile({...editStudentProfile, section:e.target.value})} />
                        <input className="border rounded px-3 py-2" placeholder="Organization" value={editStudentProfile.organisation?.name||''} onChange={(e)=>setEditStudentProfile({...editStudentProfile, organisation:{...editStudentProfile.organisation, name:e.target.value}})} />
                      </div>
                      <input className="border rounded px-3 py-2 w-full" placeholder="Org Address" value={editStudentProfile.organisation?.address||''} onChange={(e)=>setEditStudentProfile({...editStudentProfile, organisation:{...editStudentProfile.organisation, address:e.target.value}})} />
                    </div>
                    <div className="mt-6 flex justify-end gap-2">
                      <button onClick={() => setEditStudentProfile(null)} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">Cancel</button>
                      <button onClick={async ()=>{ await saveProfile(editStudentProfile); setEditStudentProfile(null); }} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Save</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Teacher Management Section */}
          {activeTab === "teachers" && (
            <div className="space-y-8">

              {/* Teacher Data Table */}
               <div id="teachers-section" className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
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
                    {organizations
                      .filter(org => org.name && org.name !== 'N/A')
                      .map((org) => (
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

                <div className="flex justify-end mb-2">
                  <button onClick={()=>exportSelectionToPdf('#teachers-section','teachers.pdf')} className="px-3 py-2 text-sm rounded bg-emerald-600 hover:bg-emerald-700 text-white">Download PDF</button>
                </div>
                {/* Teachers Table */}
                <div className="overflow-x-auto rounded-lg ring-1 ring-gray-200">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="text-left py-3 px-4 text-gray-600 text-xs uppercase tracking-wide">Name</th>
                        <th className="text-left py-3 px-4 text-gray-600 text-xs uppercase tracking-wide">Email</th>
                        <th className="text-left py-3 px-4 text-gray-600 text-xs uppercase tracking-wide">Organization</th>
                        <th className="text-left py-3 px-4 text-gray-600 text-xs uppercase tracking-wide">Tests Created</th>
                        <th title="Analytics" className="text-left py-3 px-4 text-gray-600 text-xs uppercase tracking-wide"></th>
                        <th title="Actions" className="text-left py-3 px-4 text-gray-600 text-xs uppercase tracking-wide"></th>
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
                          .map((teacher, idx) => (
                            <tr key={teacher._id} className={idx%2===0?"bg-white border-b border-gray-100":"bg-gray-50 border-b border-gray-100"}>
                              <td className="py-3 px-4 font-medium text-gray-800">{teacher.name || 'N/A'}</td>
                              <td className="py-3 px-4 text-gray-700">{teacher.email || 'N/A'}</td>
                              <td className="py-3 px-4 text-gray-700">{teacher.organization || 'N/A'}</td>
                              <td className="py-3 px-4 text-gray-700">{teacher.testsCreated || 0}</td>
                              <td className="py-3 px-4">
                                <div className="flex gap-2">
                                  <button className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700" onClick={() => setAnalyticsTeacher({ ...teacher })}>Analytics</button>
                                  <button className="px-3 py-1 text-xs bg-gray-700 text-white rounded hover:bg-gray-800" onClick={() => setViewTeacher(teacher)}>Details</button>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex gap-2">
                                  <button className="p-1 text-blue-600 hover:bg-blue-100 rounded" onClick={() => openEditTeacherProfile(teacher)}><Edit className="w-4 h-4" /></button>
                                  <button className="p-1 text-red-600 hover:bg-red-100 rounded" onClick={() => deleteUser(teacher._id)}>
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

               

              {/* Interactive Charts */}
              {/* AdminCharts component is removed as per the edit hint */}

              {/* Teacher Analytics Modal */}
              {analyticsTeacher && (
                <div id="teacher-analytics-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                  <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl p-6 relative max-h-[85vh] overflow-y-auto modal-content">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-gray-800">{analyticsTeacher.name}'s Analytics</h3>
                      <button className="text-gray-600 hover:text-gray-900" onClick={() => setAnalyticsTeacher(null)}>
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <TeacherAnalyticsContent 
                      teacher={analyticsTeacher} 
                      tests={tests}
                      onDataLoad={(data) => {
                        // Store the comprehensive data for download
                        analyticsTeacher.comprehensiveData = data;
                      }}
                    />
                    <div className="mt-6 flex justify-between items-center">
                      <button
                        onClick={() => {
                          exportTeacherAnalyticsPdf(analyticsTeacher, analyticsTeacher.comprehensiveData);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Download Complete Report
                      </button>
                      <button onClick={() => setAnalyticsTeacher(null)} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">Close</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Edit Teacher Modal */}
              {editTeacher && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                  <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-gray-800">Edit Teacher</h3>
                      <button className="text-gray-600 hover:text-gray-900" onClick={() => setEditTeacher(null)}>
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">Status</label>
                        <select className="w-full border border-gray-300 rounded-lg px-3 py-2" value={editStatus} onChange={(e)=>setEditStatus(e.target.value)}>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-2">
                      <button onClick={() => setEditTeacher(null)} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">Cancel</button>
                      <button onClick={handleSaveEditTeacher} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Save</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Teacher Details Modal */}
              {viewTeacher && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                  <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl p-6 relative">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-gray-800">Teacher Details</h3>
                      <button className="text-gray-600 hover:text-gray-900" onClick={() => setViewTeacher(null)}><X className="w-5 h-5" /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><div className="text-sm text-gray-500">Name</div><div className="font-semibold">{viewTeacher.name}</div></div>
                      <div><div className="text-sm text-gray-500">Email</div><div className="font-semibold">{viewTeacher.email}</div></div>
                      <div><div className="text-sm text-gray-500">Organization</div><div className="font-semibold">{viewTeacher.organization || 'N/A'}</div></div>
                      <div><div className="text-sm text-gray-500">Status</div><div className="font-semibold">{viewTeacher.status || 'active'}</div></div>
                      <div><div className="text-sm text-gray-500">Tests Created</div><div className="font-semibold">{viewTeacher.testsCreated || 0}</div></div>
                    </div>
                    <div className="mt-6 flex justify-end"><button onClick={() => setViewTeacher(null)} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">Close</button></div>
                  </div>
                </div>
              )}

              {/* Teacher Edit Modal */}
              {editTeacherProfile && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                  <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 relative">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-gray-800">Edit Teacher</h3>
                      <button className="text-gray-600 hover:text-gray-900" onClick={() => setEditTeacherProfile(null)}><X className="w-5 h-5" /></button>
                    </div>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <input className="border rounded px-3 py-2" placeholder="First Name" value={editTeacherProfile.firstName} onChange={(e)=>setEditTeacherProfile({...editTeacherProfile, firstName:e.target.value})} />
                        <input className="border rounded px-3 py-2" placeholder="Last Name" value={editTeacherProfile.lastName} onChange={(e)=>setEditTeacherProfile({...editTeacherProfile, lastName:e.target.value})} />
                      </div>
                      <input className="border rounded px-3 py-2 w-full" placeholder="Email" value={editTeacherProfile.email} onChange={(e)=>setEditTeacherProfile({...editTeacherProfile, email:e.target.value})} />
                      <input className="border rounded px-3 py-2 w-full" placeholder="Phone" value={editTeacherProfile.phone||''} onChange={(e)=>setEditTeacherProfile({...editTeacherProfile, phone:e.target.value})} />
                      <div className="grid grid-cols-2 gap-3">
                        <input className="border rounded px-3 py-2" placeholder="Organization" value={editTeacherProfile.organisation?.name||''} onChange={(e)=>setEditTeacherProfile({...editTeacherProfile, organisation:{...editTeacherProfile.organisation, name:e.target.value}})} />
                        <input className="border rounded px-3 py-2" placeholder="Org Address" value={editTeacherProfile.organisation?.address||''} onChange={(e)=>setEditTeacherProfile({...editTeacherProfile, organisation:{...editTeacherProfile.organisation, address:e.target.value}})} />
                      </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-2">
                      <button onClick={() => setEditTeacherProfile(null)} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">Cancel</button>
                      <button onClick={async ()=>{ await saveProfile(editTeacherProfile); setEditTeacherProfile(null); }} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Save</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Organization Management Section */}
          {activeTab === "organizations" && !params.orgId && (
            <div className="space-y-6">
              {/* Refresh Button */}
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    fetchOrganizations();
                    toast.info('Organizations refreshed');
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh Organizations
                </button>
              </div>
              <div className="p-6">

                {loading ? (
                  <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {organizations
                      .filter(org => org.name && org.name !== 'N/A')
                      .map((org, idx) => {
                        const accents = ['border-l-pink-500 bg-pink-50','border-l-orange-500 bg-orange-50','border-l-emerald-500 bg-emerald-50'];
                        const iconBg = ['bg-pink-100','bg-orange-100','bg-emerald-100'];
                        const textColor = ['text-pink-600','text-orange-600','text-emerald-600'];
                        const a = accents[idx % accents.length];
                        const iBg = iconBg[idx % iconBg.length];
                        const tCol = textColor[idx % textColor.length];
                        return (
                          <div key={org._id} onClick={()=>navigate(`/admin/organization/${org._id}`)} className={`cursor-pointer bg-white rounded-xl shadow-lg border-l-4 ${a.split(' ')[0]} p-6 hover:shadow-xl transition-all duration-300`}> 
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-600 mb-2">Organization</p>
                                <p className="text-2xl font-bold text-gray-900">{org.name || 'N/A'}</p>
                              </div>
                              <div className={`w-14 h-14 ${iBg} rounded-xl flex items-center justify-center`}>
                                <Users className={`w-7 h-7 ${tCol}`} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Organization Detail Page (reuses dashboard component route) */}
          {activeTab === "organizations" && params.orgId && (
            <div id="organization-detail" className="space-y-8">
              {(() => {
                const org = organizations.find(o=>String(o._id)===String(params.orgId)) || {};
                const orgStudents = students.filter(s=>s.organization===org.name);
                const orgTeachers = teachers.filter(t=>t.organization===org.name);
                const summary = {
                  students: orgStudents.length,
                  teachers: orgTeachers.length,
                  tests: Number(org.testCount||0)
                };

                return (
                  <>
                    {/* Header Actions */}
                    <div className="flex items-center justify-between">
                      <button onClick={()=>navigate('/admin')} className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 shadow-sm hover:shadow transition-all hover:bg-gray-50">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline><path d="M20 12H9"></path></svg>
                        Back
                      </button>
                      <div className="flex items-center gap-3">
                        <button onClick={()=>exportSelectionToPdf('#organization-detail', `${org.name || 'organization'}.pdf`)} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"><Download className="w-4 h-4"/>Download PDF</button>
                      </div>
                    </div>

                    {/* Gradient Org Banner */}
                    <div className="rounded-2xl p-8 text-white bg-gradient-to-br from-blue-600 to-indigo-600 shadow-xl ring-1 ring-white/20">
                      <div className="text-sm opacity-90">Organization</div>
                      <div className="mt-1 text-4xl font-extrabold">{org.name || 'N/A'}</div>
                    </div>

                    {/* Summary Cards (sequence like dashboard cards) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {[{label:'Students',value:summary.students},{label:'Teachers',value:summary.teachers},{label:'Tests',value:summary.tests}].map((c,i)=>(
                        <div key={i} className="bg-white rounded-xl shadow-lg border-l-4 border-orange-500 p-6">
                          <div className="text-sm text-gray-600">{c.label}</div>
                          <div className="mt-1 text-3xl font-bold text-gray-900">{c.value}</div>
                        </div>
                      ))}
                    </div>

                    {/* Tables */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6" id="org-teachers-table">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="text-lg font-semibold text-gray-800">Teachers</h4>
                          <button onClick={()=>exportSelectionToPdf('#org-teachers-table','org-teachers.pdf')} className="text-sm text-emerald-700 hover:text-emerald-800">Download PDF</button>
                        </div>
                        <div className="max-h-80 overflow-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-gray-200"><th className="text-left py-2 px-3">Name</th><th className="text-left py-2 px-3">Email</th></tr></thead>
                            <tbody>
                              {orgTeachers.map(t=> (
                                <tr key={t._id} className="border-b border-gray-100"><td className="py-2 px-3">{t.name}</td><td className="py-2 px-3">{t.email}</td></tr>
                              ))}
                              {orgTeachers.length===0 && <tr><td className="py-3 px-3 text-gray-500" colSpan="2">No teachers</td></tr>}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6" id="org-students-table">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="text-lg font-semibold text-gray-800">Students</h4>
                          <button onClick={()=>exportSelectionToPdf('#org-students-table','org-students.pdf')} className="text-sm text-emerald-700 hover:text-emerald-800">Download PDF</button>
                        </div>
                        <div className="max-h-80 overflow-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-gray-200"><th className="text-left py-2 px-3">Name</th><th className="text-left py-2 px-3">Email</th></tr></thead>
                            <tbody>
                              {orgStudents.map(s=> (
                                <tr key={s._id} className="border-b border-gray-100"><td className="py-2 px-3">{s.name}</td><td className="py-2 px-3">{s.email}</td></tr>
                              ))}
                              {orgStudents.length===0 && <tr><td className="py-3 px-3 text-gray-500" colSpan="2">No students</td></tr>}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* Analytics Graphs Section */}
                    <div className="space-y-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-6">Organization Analytics</h3>
                      
                      {analyticsLoading ? (
                        <div className="flex justify-center py-12">
                          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Tests Created Per Week Graph */}
                          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-lg font-semibold text-gray-800">Tests Created Per Week</h4>
                              <BarChart3 className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="h-80">
                              {weeklyData && Array.isArray(weeklyData) && weeklyData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={weeklyData.filter(item => item && typeof item === 'object')}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis 
                                      dataKey="week" 
                                      angle={-45}
                                      textAnchor="end"
                                      height={60}
                                      fontSize={12}
                                    />
                                    <YAxis allowDecimals={false} />
                                    <Tooltip 
                                      formatter={(value) => [value, 'Tests Created']}
                                      labelFormatter={(label) => `Week: ${label}`}
                                    />
                                    <Bar 
                                      dataKey="testsCreated" 
                                      fill="#3B82F6" 
                                      radius={[4,4,0,0]}
                                      name="Tests Created"
                                    />
                                  </BarChart>
                                </ResponsiveContainer>
                              ) : (
                                <div className="flex items-center justify-center h-full text-gray-500">
                                  <div className="text-center">
                                    <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                    <p>No test data available</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Average Test Percentage Graph */}
                          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-lg font-semibold text-gray-800">Average Test Performance</h4>
                              <TrendingUp className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div className="h-80">
                              {orgAnalytics?.testPerformance && orgAnalytics.testPerformance.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={orgAnalytics.testPerformance}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis 
                                      dataKey="name" 
                                      angle={-45}
                                      textAnchor="end"
                                      height={60}
                                      fontSize={12}
                                    />
                                    <YAxis 
                                      domain={[0, 100]}
                                      tickFormatter={(value) => `${value}%`}
                                    />
                                    <Tooltip 
                                      formatter={(value) => [`${value}%`, 'Average Score']}
                                      labelFormatter={(label) => `Test: ${label}`}
                                    />
                                    <Bar 
                                      dataKey="percentage" 
                                      fill="#10B981" 
                                      radius={[4,4,0,0]}
                                      name="Average Percentage"
                                    />
                                  </BarChart>
                                </ResponsiveContainer>
                              ) : (
                                <div className="flex items-center justify-center h-full text-gray-500">
                                  <div className="text-center">
                                    <TrendingUp className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                    <p>No test performance data</p>
                                    <p className="text-sm">Tests will appear here once created</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* Analytics Section */}
          {activeTab === "analytics" && (
            <div className="space-y-8" id="analytics-section" style={{ position: 'relative' }}>
              {/* Analytics Download Button */}
              <div className="flex justify-end">
                <button
                  onClick={async (e) => {
                    try {
                      // Show loading state
                      const button = e.currentTarget;
                      const originalText = button.innerHTML;
                      button.innerHTML = '<div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> Generating PDF...';
                      button.disabled = true;
                      
                      // Hide download buttons during PDF generation
                      const analyticsSection = document.getElementById('analytics-section');
                      const downloadButtons = analyticsSection.querySelectorAll('button');
                      const downloadButtonsToHide = Array.from(downloadButtons).filter(btn => 
                        btn.textContent?.includes('Download') || 
                        btn.classList.toString().includes('download')
                      );
                      downloadButtonsToHide.forEach(btn => {
                        btn.style.display = 'none';
                      });
                      
                      await exportSelectionToPdf('#analytics-section', 'admin-analytics-complete.pdf', { landscape: true, includeCharts: true });
                      
                      // Show download buttons again
                      downloadButtonsToHide.forEach(btn => {
                        btn.style.display = '';
                      });
                      
                      // Reset button with proper styling
                      button.innerHTML = originalText;
                      button.disabled = false;
                      button.style.opacity = '1';
                      button.style.cursor = 'pointer';
                      button.style.backgroundColor = '#059669'; // emerald-600
                      button.style.color = '#ffffff';
                      button.className = 'px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
                    } catch (error) {
                      console.error('Error generating PDF:', error);
                      alert('Failed to generate PDF. Please try again.');
                      // Reset button on error
                      const button = event.target;
                      button.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg> Download Complete Analytics PDF (Landscape)';
                      button.disabled = false;
                      button.style.opacity = '1';
                      button.style.cursor = 'pointer';
                      button.style.backgroundColor = '#059669'; // emerald-600
                      button.style.color = '#ffffff';
                      button.className = 'px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
                      
                      // Show download buttons again in case of error
                      const analyticsSection = document.getElementById('analytics-section');
                      const downloadButtons = analyticsSection.querySelectorAll('button');
                      const downloadButtonsToShow = Array.from(downloadButtons).filter(btn => 
                        btn.textContent?.includes('Download') || 
                        btn.classList.toString().includes('download')
                      );
                      downloadButtonsToShow.forEach(btn => {
                        btn.style.display = '';
                      });
                    }
                  }}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-5 h-5" />
                  Download Complete Analytics PDF (Landscape)
                </button>
              </div>
              
              {/* Analytics Overview Cards and Organization Pie Chart */}
              <div className="grid grid-cols-2 gap-6">
                {/* Analytics Cards - 50% width */}
                <div className="col-span-1">
              <AdminAnalyticsCards 
                analytics={{
                  totalUsers: analytics.totalUsers || stats.totalUsers || 0,
                  totalTests: analytics.totalTests || stats.totalTests || 0,
                  totalStudents: analytics.totalStudents || stats.totalStudents || 0,
                  totalTeachers: analytics.totalTeachers || stats.totalTeachers || 0,
                  totalAdmins: analytics.totalAdmins || 0,
                  activeUsers: analytics.activeUsers || stats.activeUsers || 0,
                  completedTests: analytics.completedTests || stats.completedTests || 0,
                  pendingUsers: analytics.pendingUsers || stats.pendingUsers || 0,
                  systemHealth: analytics.systemHealth || 98
                }}
                loading={loading}
                onDownload={(chartType, data) => downloadChartDataAsCSV(chartType, data)}
              />
                  </div>

                {/* Organization Distribution Pie Chart - 50% width */}
                <div className="col-span-1">
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 h-full">
                  <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">Organizations</h3>
                    <button onClick={() => createDashboardPdf([{ title: 'Organizations Distribution', data: organizations }], { filename: 'organizations-distribution.pdf' })} className="text-sm text-emerald-700 hover:text-emerald-800">Download PDF</button>
                  </div>
                  <div className="h-80">
                      {organizations && organizations.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={organizations.map((org, index) => ({
                                name: org.name || `Org ${index + 1}`,
                                value: (org.studentCount || 0) + (org.teacherCount || 0),
                                fill: [
                                  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
                                  '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'
                                ][index % 8]
                              }))}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={100}
                              innerRadius={40}
                              paddingAngle={2}
                            >
                              {organizations.map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={[
                                    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
                                    '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'
                                  ][index % 8]}
                                />
                              ))}
                            </Pie>
                            <Tooltip 
                              formatter={(value, name) => [
                                `${value} members`, 
                                name
                              ]}
                            />
                            <Legend 
                              verticalAlign="bottom" 
                              height={36}
                              formatter={(value) => value.length > 15 ? value.substring(0, 15) + '...' : value}
                            />
                          </PieChart>
                    </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                          <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                              <Users className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-sm font-medium text-gray-600">No Organizations</p>
                            <p className="text-xs text-gray-500 mt-1">Organizations will appear here</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  </div>
                </div>


              {/* Interactive Charts */}
              <div className="grid grid-cols-1 gap-6">
                {/* Average Student Marks by Test */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Average Student Marks by Test</h3>
                    <button onClick={() => createDashboardPdf([{ title: 'Average Student Marks by Test', data: chartData.testAverageMarks || [] }], { filename: 'average-marks.pdf' })} className="text-sm text-emerald-700 hover:text-emerald-800">Download PDF</button>
                  </div>
                  <div className="h-80">
                    {chartData.testAverageMarks && Array.isArray(chartData.testAverageMarks) && chartData.testAverageMarks.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData.testAverageMarks}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="testName" 
                            angle={-45}
                            textAnchor="end"
                            height={60}
                            fontSize={12}
                          />
                          <YAxis 
                            domain={[0, 100]}
                            tickFormatter={(value) => `${value}%`}
                          />
                          <Tooltip 
                            formatter={(value, name) => [`${value}%`, 'Average Score']}
                            labelFormatter={(label) => `Test: ${label}`}
                          />
                          <Bar 
                            dataKey="averagePercentage" 
                            fill="#10B981" 
                            radius={[4,4,0,0]}
                            name="Average Score"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        <div className="text-center">
                          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-8 h-8 text-gray-400" />
                          </div>
                          <p className="text-sm font-medium text-gray-600">No Student Marks Data Available</p>
                          <p className="text-xs text-gray-500 mt-1">Average student marks by test will appear here</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Students by Organization */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Students by Organization</h3>
                    <button onClick={() => createDashboardPdf([{ title: 'Students by Organization', data: chartData.studentsByOrg }], { filename: 'students-by-organization.pdf' })} className="text-sm text-emerald-700 hover:text-emerald-800">Download PDF</button>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData.studentsByOrg || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#F59E0B" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Teachers by Organization */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Teachers by Organization</h3>
                    <button onClick={() => createDashboardPdf([{ title: 'Teachers by Organization', data: chartData.teachersByOrg }], { filename: 'teachers-by-organization.pdf' })} className="text-sm text-emerald-700 hover:text-emerald-800">Download PDF</button>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData.teachersByOrg || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#EF4444" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Daily Logins by Role Chart */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-800">Daily Logins by Role</h3>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => console.log('Current activityData:', chartData.activityData)}
                      className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                      title="Debug Chart Data"
                    >
                      Debug
                    </button>
                    <button 
                      onClick={() => createDashboardPdf([{ title: 'Daily Logins by Role', data: chartData.activityData || [] }], { filename: 'daily-logins.pdf' })} 
                      className="text-sm text-emerald-700 hover:text-emerald-800"
                    >
                      Download PDF
                    </button>
                  </div>
                </div>
                
                {chartData.activityData && Array.isArray(chartData.activityData) && chartData.activityData.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData.activityData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="date" 
                          stroke="#6B7280"
                          fontSize={12}
                          tickLine={false}
                          tickFormatter={(value) => {
                            const date = new Date(value);
                            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                          }}
                        />
                        <YAxis 
                          stroke="#6B7280"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          allowDecimals={false}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'white', 
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                          labelFormatter={(value) => {
                            const date = new Date(value);
                            return date.toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              month: 'short', 
                              day: 'numeric' 
                            });
                          }}
                          formatter={(value, name) => [
                            `${value} logins`,
                            name.charAt(0).toUpperCase() + name.slice(1)
                          ]}
                        />
                        <Legend 
                          wrapperStyle={{ paddingTop: '20px' }}
                          formatter={(value) => (
                            <span style={{ color: '#374151', fontWeight: 500 }}>
                              {value.charAt(0).toUpperCase() + value.slice(1)}
                            </span>
                          )}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="students" 
                          stroke="#3B82F6" 
                          strokeWidth={3}
                          strokeDasharray="0"
                          dot={{ fill: '#3B82F6', strokeWidth: 2, r: 5 }}
                          activeDot={{ r: 8, stroke: '#3B82F6', strokeWidth: 2, fill: '#3B82F6' }}
                          name="students"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="teachers" 
                          stroke="#10B981" 
                          strokeWidth={3}
                          strokeDasharray="5 5"
                          dot={{ fill: '#10B981', strokeWidth: 2, r: 5 }}
                          activeDot={{ r: 8, stroke: '#10B981', strokeWidth: 2, fill: '#10B981' }}
                          name="teachers"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="admins" 
                          stroke="#F59E0B" 
                          strokeWidth={3}
                          strokeDasharray="10 5"
                          dot={{ fill: '#F59E0B', strokeWidth: 2, r: 5 }}
                          activeDot={{ r: 8, stroke: '#F59E0B', strokeWidth: 2, fill: '#F59E0B' }}
                          name="admins"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-12 text-gray-500">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-600">No Login Data Available</p>
                      <p className="text-xs text-gray-500 mt-1">Daily login activity for students, teachers, and admins will appear here</p>
                      <button 
                        onClick={() => fetchChartData()}
                        className="mt-3 px-4 py-2 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        Refresh Data
                      </button>
                    </div>
                  </div>
                )}
              </div>
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

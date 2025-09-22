import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { Download, BarChart3, PieChart as PieChartIcon, TrendingUp, Activity } from 'lucide-react';

// Sample data - this will be replaced with real API data
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

const AdminCharts = ({ 
  chartData = {}, 
  loading = false, 
  onDownload = () => {} 
}) => {
  // Default sample data for demonstration
  const defaultData = {
    testsPerWeek: [
      { week: 'Week 1', count: 4 },
      { week: 'Week 2', count: 6 },
      { week: 'Week 3', count: 8 },
      { week: 'Week 4', count: 5 }
    ],
    studentsByOrg: [
      { name: 'University A', count: 45 },
      { name: 'University B', count: 32 },
      { name: 'University C', count: 28 },
      { name: 'University D', count: 15 }
    ],
    teachersByOrg: [
      { name: 'University A', count: 12 },
      { name: 'University B', count: 8 },
      { name: 'University C', count: 6 },
      { name: 'University D', count: 4 }
    ],
    performanceTrend: [
      { day: '1', averageScore: 75 },
      { day: '5', averageScore: 78 },
      { day: '10', averageScore: 82 },
      { day: '15', averageScore: 79 },
      { day: '20', averageScore: 85 },
      { day: '25', averageScore: 88 },
      { day: '30', averageScore: 90 }
    ],
    marksDistribution: [
      { range: '0-20', count: 5 },
      { range: '20-40', count: 12 },
      { range: '40-60', count: 25 },
      { range: '60-80', count: 35 },
      { range: '80-100', count: 23 }
    ]
  };

  const data = { ...defaultData, ...chartData };
  
  // Ensure all data arrays are properly formatted
  const safeData = {
    testsPerWeek: Array.isArray(data.testsPerWeek) ? data.testsPerWeek : defaultData.testsPerWeek,
    studentsByOrg: Array.isArray(data.studentsByOrg) ? data.studentsByOrg : defaultData.studentsByOrg,
    teachersByOrg: Array.isArray(data.teachersByOrg) ? data.teachersByOrg : defaultData.teachersByOrg,
    performanceTrend: Array.isArray(data.performanceTrend) ? data.performanceTrend : defaultData.performanceTrend,
    marksDistribution: Array.isArray(data.marksDistribution) ? data.marksDistribution : defaultData.marksDistribution
  };

  const handleDownload = (chartType, data) => {
    onDownload(chartType, data);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* First Row - Two Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tests Created Per Week */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Tests Created Per Week</h3>
            <button 
              onClick={() => handleDownload('testsPerWeek', safeData.testsPerWeek)}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={safeData.testsPerWeek}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Students by Organization */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Students by Organization</h3>
            <button 
              onClick={() => handleDownload('studentsByOrg', safeData.studentsByOrg)}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={safeData.studentsByOrg}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {safeData.studentsByOrg.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Second Row - Two Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Performance Trend */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Test Performance Trend</h3>
            <button 
              onClick={() => handleDownload('performanceTrend', safeData.performanceTrend)}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={safeData.performanceTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="averageScore" stroke="#10B981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Marks Distribution */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Marks Distribution</h3>
            <button 
              onClick={() => handleDownload('marksDistribution', safeData.marksDistribution)}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={safeData.marksDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#F59E0B" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Additional Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Teachers by Organization */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Teachers by Organization</h3>
            <button 
              onClick={() => handleDownload('teachersByOrg', safeData.teachersByOrg)}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={safeData.teachersByOrg}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Organization Activity */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Organization Activity</h3>
            <button 
              onClick={() => handleDownload('orgActivity', safeData.studentsByOrg)}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={safeData.performanceTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="averageScore" stroke="#06B6D4" fill="#06B6D4" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* System Overview */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">System Overview</h3>
            <button 
              onClick={() => handleDownload('systemOverview', safeData.studentsByOrg)}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Students', value: 120 },
                    { name: 'Teachers', value: 30 },
                    { name: 'Tests', value: 45 },
                    { name: 'Results', value: 200 }
                  ]}
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {[
                    { name: 'Students', value: 120 },
                    { name: 'Teachers', value: 30 },
                    { name: 'Tests', value: 45 },
                    { name: 'Results', value: 200 }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCharts;

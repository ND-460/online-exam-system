import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuthStore } from '../../store/authStore';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

const TestResults = ({ test, onClose }) => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const { token } = useAuthStore();

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/teacher/test-results/${test._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResults(response.data);
    } catch (error) {
      console.error('Error fetching results:', error);
      toast.error('Failed to fetch test results');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gradient-to-br from-[#151e2e] to-[#1a2236] rounded-lg p-8">
          <div className="text-white text-center">Loading results...</div>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gradient-to-br from-[#151e2e] to-[#1a2236] rounded-lg p-8">
          <div className="text-white text-center">Failed to load results</div>
          <button onClick={onClose} className="mt-4 bg-red-600 text-white px-4 py-2 rounded">
            Close
          </button>
        </div>
      </div>
    );
  }

  const gradeColors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];
  const gradeData = Object.entries(results.analytics.gradeDistribution).map(([grade, count], index) => ({
    grade,
    count,
    color: gradeColors[index]
  }));

  const performanceData = results.submissions.map((submission, index) => ({
    student: submission.studentName.split(' ')[0],
    score: submission.percentage,
    index: index + 1
  }));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-[#151e2e] to-[#1a2236] rounded-lg w-full max-w-6xl mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-[#232f4b]">
          <h2 className="text-2xl font-bold text-white">
            Test Results: {results.test.testName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#232f4b]">
          {['overview', 'analytics', 'submissions', 'students'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-medium capitalize ${
                activeTab === tab
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-[#232f4b] rounded-lg p-4">
                <div className="text-2xl font-bold text-green-400">
                  {results.analytics.totalSubmissions}
                </div>
                <div className="text-gray-300">Total Submissions</div>
              </div>
              <div className="bg-[#232f4b] rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-400">
                  {results.analytics.completionRate}%
                </div>
                <div className="text-gray-300">Completion Rate</div>
              </div>
              <div className="bg-[#232f4b] rounded-lg p-4">
                <div className="text-2xl font-bold text-yellow-400">
                  {results.analytics.averagePercentage}%
                </div>
                <div className="text-gray-300">Average Score</div>
              </div>
              <div className="bg-[#232f4b] rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-400">
                  {results.analytics.highestScore}/{results.test.outOfMarks}
                </div>
                <div className="text-gray-300">Highest Score</div>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-8">
              {/* Grade Distribution */}
              <div className="bg-[#232f4b] rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-4">Grade Distribution</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={gradeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="grade" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="count" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={gradeData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="count"
                        label={({ grade, count }) => `${grade}: ${count}`}
                      >
                        {gradeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Performance Chart */}
              <div className="bg-[#232f4b] rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-4">Student Performance</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="student" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Top Performers */}
              <div className="bg-[#232f4b] rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-4">Top Performers</h3>
                <div className="space-y-3">
                  {results.analytics.topPerformers.map((performer, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-[#1a2236] rounded-lg">
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold mr-3 ${
                          index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-600' : 'bg-blue-600'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <div className="text-white font-medium">{performer.studentName}</div>
                          <div className="text-gray-400 text-sm">
                            Submitted: {new Date(performer.submittedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-green-400 font-bold">{performer.percentage}%</div>
                        <div className="text-gray-400 text-sm">{performer.score}/{results.test.outOfMarks}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'submissions' && (
            <div className="bg-[#232f4b] rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">All Submissions</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[#374151]">
                      <th className="py-3 px-4 text-gray-300">Student</th>
                      <th className="py-3 px-4 text-gray-300">Score</th>
                      <th className="py-3 px-4 text-gray-300">Percentage</th>
                      <th className="py-3 px-4 text-gray-300">Grade</th>
                      <th className="py-3 px-4 text-gray-300">Submitted At</th>
                      <th className="py-3 px-4 text-gray-300">Time Taken</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.submissions.map((submission, index) => {
                      const grade = submission.percentage >= 90 ? 'A' : 
                                   submission.percentage >= 80 ? 'B' : 
                                   submission.percentage >= 70 ? 'C' : 
                                   submission.percentage >= 60 ? 'D' : 'F';
                      const gradeColor = grade === 'A' ? 'text-green-400' : 
                                        grade === 'B' ? 'text-blue-400' : 
                                        grade === 'C' ? 'text-yellow-400' : 
                                        grade === 'D' ? 'text-orange-400' : 'text-red-400';
                      
                      return (
                        <tr key={index} className="border-b border-[#374151] hover:bg-[#1a2236]">
                          <td className="py-3 px-4 text-white">{submission.studentName}</td>
                          <td className="py-3 px-4 text-white">{submission.score}/{results.test.outOfMarks}</td>
                          <td className="py-3 px-4 text-white">{submission.percentage}%</td>
                          <td className={`py-3 px-4 font-bold ${gradeColor}`}>{grade}</td>
                          <td className="py-3 px-4 text-gray-300">
                            {new Date(submission.submittedAt).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-gray-300">
                            {submission.timeTaken ? `${submission.timeTaken} min` : 'N/A'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'students' && (
            <div className="bg-[#232f4b] rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">Assigned Students</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.assignedStudents.map((student, index) => {
                  const hasSubmitted = results.submissions.some(s => s.studentId === student.studentId);
                  const submission = results.submissions.find(s => s.studentId === student.studentId);
                  
                  return (
                    <div key={index} className="p-4 bg-[#1a2236] rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-white font-medium">{student.studentName}</div>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          hasSubmitted ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'
                        }`}>
                          {hasSubmitted ? 'Submitted' : 'Pending'}
                        </div>
                      </div>
                      <div className="text-gray-400 text-sm">
                        Assigned: {new Date(student.assignedAt).toLocaleDateString()}
                      </div>
                      {submission && (
                        <div className="mt-2 text-sm">
                          <div className="text-green-400">Score: {submission.percentage}%</div>
                          <div className="text-gray-400">
                            Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestResults;

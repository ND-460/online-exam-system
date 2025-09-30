import React from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const AdminCharts = ({ analytics }) => {
  const lineChartData = {
    labels: analytics?.examTrends?.labels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Exams Taken',
        data: analytics?.examTrends?.data || [12, 19, 3, 5, 2, 3],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const barChartData = {
    labels: analytics?.subjectPerformance?.labels || ['Math', 'Science', 'English', 'History'],
    datasets: [
      {
        label: 'Average Score',
        data: analytics?.subjectPerformance?.data || [85, 78, 92, 88],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(16, 185, 129)',
          'rgb(245, 158, 11)',
          'rgb(239, 68, 68)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const doughnutData = {
    labels: ['Passed', 'Failed'],
    datasets: [
      {
        data: analytics?.passFailRatio || [75, 25],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderColor: [
          'rgb(16, 185, 129)',
          'rgb(239, 68, 68)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Performance Analytics',
      },
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Exam Trends</h3>
        <Line data={lineChartData} options={chartOptions} />
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Subject Performance</h3>
        <Bar data={barChartData} options={chartOptions} />
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 lg:col-span-2">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Pass/Fail Ratio</h3>
        <div className="flex justify-center">
          <div className="w-64 h-64">
            <Doughnut data={doughnutData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCharts;

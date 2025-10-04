import { useState, useEffect } from "react";
import axios from "axios";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Label,
} from "recharts";
import { createDashboardPdf, downloadCompleteReport } from "../../utils/reportGenerator";
import { Download } from "lucide-react";

const Analytics = ({ testId, token }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!testId) return;

    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/teacher/analytics/${testId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setAnalytics(res.data || {});
      } catch (err) {
        console.error("Error fetching analytics", err);
        setAnalytics({});
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [testId, token]);

  if (loading) {
    return (
      <div className="h-24 flex items-center justify-center text-yellow-700 text-xs">
        Loading analytics...
      </div>
    );
  }

  if (!analytics || Object.keys(analytics).length === 0) {
    return (
      <div className="h-24 flex items-center justify-center text-yellow-700 text-xs">
        No analytics available.
      </div>
    );
  }

  const avgScore = Number(analytics.avgScore ?? 0);
  const totalStudents = analytics.totalStudents ?? 0;
  const scoreDistribution = analytics.scoreDistribution ?? [];

  const highestScore =
    scoreDistribution.length > 0
      ? Math.max(...scoreDistribution.map((s) => s.score))
      : 0;

  const lowestScore =
    scoreDistribution.length > 0
      ? Math.min(...scoreDistribution.map((s) => s.score))
      : 0;

  const bins = Array.from({ length: 10 }, (_, i) => ({
    range: i === 9 ? "90-100%" : `${i * 10}-${i * 10 + 9}%`,
    count: 0,
  }));

  scoreDistribution.forEach((s) => {
    const percent =
      Number(s.percentage) || (s.score / (s.outOfMarks || 1)) * 100;

    const binIndex = Math.min(Math.floor(percent / 10), 9);
    bins[binIndex].count += 1;
  });

  const handleDownloadPDF = () => {
    const chartData = {
      testAnalytics: {
        avgScore: avgScore,
        avgPercentage: Number(analytics.avgPercentage ?? 0),
        highestScore: highestScore,
        lowestScore: lowestScore,
        totalStudents: totalStudents,
        totalSubmissions: scoreDistribution.length
      },
      scoreDistribution: bins
    };
    downloadCompleteReport(chartData);
  };

  const handleDownloadChart = () => {
    createDashboardPdf([{ title: 'Test Score Distribution', data: bins }], { filename: 'test-score-distribution.pdf' });
  };

  return (
  <div className="bg-white dark:bg-[#1f2937] rounded-3xl p-6 shadow-xl border border-gray-200 dark:border-gray-700 w-full transition duration-300 hover:scale-[1.01]">
    {/* Title and Download Button */}
    <div className="flex justify-between items-center mb-4">
      <div>
        <h3 className="text-xl font-bold mb-2 text-yellow-800 dark:text-white">
          Test Analytics
        </h3>
        <p className="text-yellow-900 dark:text-gray-300 text-sm">
          Overview of students who performed in this test
        </p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleDownloadChart}
          className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
        >
          <Download className="w-4 h-4" />
          Chart PDF
        </button>
        <button
          onClick={handleDownloadPDF}
          className="px-3 py-2 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700 flex items-center gap-1"
        >
          <Download className="w-4 h-4" />
          Full Report
        </button>
      </div>
    </div>

    {/* Stats */}
    <ul className="space-y-2 text-sm mb-6 text-yellow-800 dark:text-blue-200">
      <li>Average Score: {avgScore.toFixed(2)}</li>
      <li>Average %: {Number(analytics.avgPercentage ?? 0).toFixed(2)}%</li>
      <li>Highest Score: {highestScore.toFixed(2)}</li>
      <li>Lowest Score: {lowestScore.toFixed(2)}</li>
      <li>Total Students: {totalStudents}</li>
      <li>Total Submissions: {scoreDistribution.length}</li>
    </ul>

    {/* Chart */}
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={bins}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="range" stroke="#6b7280">
            <Label
              value="Score Range (%)"
              offset={-5}
              position="insideBottom"
              fill="#6b7280"
            />
          </XAxis>
          <YAxis allowDecimals={false} stroke="#6b7280">
            <Label
              value="Number of Students"
              angle={-90}
              position="insideLeft"
              fill="#6b7280"
              style={{ textAnchor: "middle" }}
            />
          </YAxis>
          <Tooltip
            contentStyle={{
              background: "#1f2937",
              border: "none",
              color: "#fff",
            }}
          />
          
          <Bar dataKey="count" fill="oklch(55.4% 0.135 66.442)" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

};

export default Analytics;

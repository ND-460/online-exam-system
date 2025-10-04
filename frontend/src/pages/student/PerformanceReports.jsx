import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  Label,
} from "recharts";
import { createDashboardPdf, downloadCompleteReport } from "../../utils/reportGenerator";
import { Download } from "lucide-react";

export default function PerformanceReports({ token }) {
  const [performanceData, setPerformanceData] = useState([]);
  const [status, setStatus] = useState(null); // "good" | "bad" | "neutral"

  useEffect(() => {
    const fetchPerformance = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/student/performance`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        let tests = res.data.performanceData || [];
        tests = tests.sort((a, b) => new Date(a.date) - new Date(b.date));
        tests = tests.slice(-5); // last 5 tests

        const formatted = tests.map((t, idx) => ({
          test: t.testName || `Test ${idx + 1}`,
          score: parseFloat(t.percentage) || 0,
        }));

        setPerformanceData(formatted);

        // Determine trend
        if (formatted.length > 1) {
          const latest = formatted[formatted.length - 1].score;
          const prevAvg =
            formatted.slice(0, -1).reduce((sum, t) => sum + t.score, 0) /
            (formatted.length - 1);

          if (latest > prevAvg + 5) setStatus("good");
          else if (latest < prevAvg - 5) setStatus("bad");
          else setStatus("neutral");
        }
      } catch (err) {
        console.error("Error fetching performance:", err);
      }
    };

    fetchPerformance();
  }, [token]);

  const handleDownloadPDF = () => {
    const chartData = {
      performanceData: performanceData,
      status: status,
      summary: {
        totalTests: performanceData.length,
        averageScore: performanceData.length > 0 ? 
          (performanceData.reduce((sum, test) => sum + test.score, 0) / performanceData.length).toFixed(2) : 0,
        latestScore: performanceData.length > 0 ? performanceData[performanceData.length - 1].score : 0
      }
    };
    downloadCompleteReport(chartData);
  };

  const handleDownloadChart = () => {
    createDashboardPdf([{ title: 'Student Performance Overview', data: performanceData }], { filename: 'student-performance-report.pdf' });
  };

  return (
    <div className="bg-white dark:bg-[#1f2937] rounded-3xl p-6 shadow-xl border border-gray-200 dark:border-gray-700 w-full transition duration-300 hover:scale-[1.01]">
      {/* Title and Download Buttons */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-xl font-bold mb-2 text-yellow-800 dark:text-white">
            Performance Reports
          </h3>
          <p className="text-yellow-900 dark:text-gray-300 text-sm">
            Last 5 tests performance overview
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

      {/* Status Indicator */}
      {status && (
        <div className="mb-4 text-sm font-semibold">
          {status === "good" && (
            <span className="text-green-500 flex items-center gap-2">
              📈 Performance improving
            </span>
          )}
          {status === "bad" && (
            <span className="text-red-500 flex items-center gap-2">
              📉 Performance dropped
            </span>
          )}
          {status === "neutral" && (
            <span className="text-yellow-500 flex items-center gap-2">
              ➖ Performance stable
            </span>
          )}
        </div>
      )}

      {/* Bar Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={performanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="test" stroke="#6b7280">
              <Label
                value="Tests"
                offset={-5}
                position="insideBottom"
                fill="#6b7280"
              />
            </XAxis>
            <YAxis stroke="#6b7280" domain={[0, 100]}>
              <Label
                value="Percentage (%)"
                angle={-90}
                position="insideLeft"
                fill="#6b7280"
                style={{ textAnchor: "middle" }}
              />
            </YAxis>
            <Tooltip
              formatter={(value) => [`${value}%`, "Score"]}
              contentStyle={{
                background: "#1f2937",
                border: "none",
                color: "#fff",
              }}
            />
            <Legend />
            <Bar dataKey="score" fill="oklch(55.4% 0.135 66.442)" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

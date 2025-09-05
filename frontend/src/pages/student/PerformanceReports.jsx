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

export default function PerformanceReports({ token }) {
  const [performanceData, setPerformanceData] = useState([]);
  const [status, setStatus] = useState(null); // "good" | "bad" | "neutral"

  useEffect(() => {
    const fetchPerformance = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/student/performance`, // 👈 no userId here
          { headers: { Authorization: `Bearer ${token}` } }
        );

        let tests = res.data.performanceData || [];

        // sort by date ascending
        tests = tests.sort((a, b) => new Date(a.date) - new Date(b.date));

        // keep only last 5
        tests = tests.slice(-5);

        const formatted = tests.map((t, idx) => ({
          test: t.testName || `Test ${idx + 1}`,
          score: parseFloat(t.percentage) || 0,
        }));

        setPerformanceData(formatted);

        // performance trend
        if (formatted.length > 1) {
          const latest = formatted[formatted.length - 1].score;
          const prevAvg =
            formatted.slice(0, -1).reduce((sum, t) => sum + t.score, 0) /
            (formatted.length - 1);

          if (latest > prevAvg + 5) {
            setStatus("good");
          } else if (latest < prevAvg - 5) {
            setStatus("bad");
          } else {
            setStatus("neutral");
          }
        }
      } catch (err) {
        console.error("Error fetching performance:", err);
      }
    };

    fetchPerformance();
  }, [token]);

  return (
    <div className="bg-gradient-to-br from-black via-[#181f2e] to-[#232f4b] rounded-3xl p-10 border border-[#232f4b] shadow-2xl w-full transition duration-300 hover:scale-[1.01]">
      <h3 className="font-bold text-xl mb-2">Performance Reports</h3>
      <p className="text-blue-200 text-sm mb-5">
        Last 5 tests performance overview.
      </p>

      {/* Status Indicator */}
      {status && (
        <div className="mb-6 text-lg font-semibold">
          {status === "good" && (
            <span className="text-green-400">📈 Performance is improving</span>
          )}
          {status === "bad" && (
            <span className="text-red-400">📉 Performance dropped</span>
          )}
          {status === "neutral" && (
            <span className="text-yellow-400">➖ Performance stable</span>
          )}
        </div>
      )}

      <div className="h-72 flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={performanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#232f4b" />
            <XAxis dataKey="test" stroke="#b3c2e6">
              <Label
                value="Tests"
                offset={-5}
                position="insideBottom"
                fill="#b3c2e6"
              />
            </XAxis>
            <YAxis stroke="#b3c2e6" domain={[0, 100]}>
              <Label
                value="Percentage (%)"
                angle={-90}
                position="insideLeft"
                fill="#b3c2e6"
                style={{ textAnchor: "middle" }}
              />
            </YAxis>
            <Tooltip
              formatter={(value) => [`${value}%`, "Percentage"]}
              contentStyle={{
                background: "#232f4b",
                border: "none",
                color: "#fff",
              }}
            />
            <Legend />
            <Bar dataKey="score" fill="#7c3aed" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

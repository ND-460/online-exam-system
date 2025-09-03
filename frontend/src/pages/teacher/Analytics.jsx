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
      <div className="h-24 flex items-center justify-center text-blue-300 text-xs">
        Loading analytics...
      </div>
    );
  }

  if (!analytics || Object.keys(analytics).length === 0) {
    return (
      <div className="h-24 flex items-center justify-center text-blue-300 text-xs">
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

  return (
    <div className="p-4 bg-[#1e293b] rounded-lg shadow-md text-blue-100">
      <h2 className="text-lg font-semibold mb-4">Test Analytics</h2>
      <ul className="space-y-2 text-sm mb-6">
        <li>Average Score: {avgScore.toFixed(2)}</li>
        <li>Average %: {Number(analytics.avgPercentage ?? 0).toFixed(2)}%</li>

        <li>Highest Score: {highestScore.toFixed(2)}</li>
        <li>Lowest Score: {lowestScore.toFixed(2)}</li>
        <li>Total Students: {totalStudents}</li>
        <li>Total Submissions: {scoreDistribution.length}</li>
      </ul>

      <div className="h-72 flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={bins}
            margin={{ top: 20, right: 20, left: 20, bottom: 40 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#232f4b" />
            <XAxis dataKey="range" stroke="#b3c2e6">
              <Label
                value="Score Range (%)"
                offset={-5}
                position="insideBottom"
                fill="#b3c2e6"
              />
            </XAxis>
            <YAxis allowDecimals={false} stroke="#b3c2e6">
              <Label
                value="Number of Students"
                angle={-90}
                position="insideLeft"
                fill="#b3c2e6"
                style={{ textAnchor: "middle" }}
              />
            </YAxis>
            <Tooltip
              contentStyle={{
                background: "#232f4b",
                border: "none",
                color: "#fff",
              }}
            />
            <Bar dataKey="count" fill="#7c3aed" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Analytics;

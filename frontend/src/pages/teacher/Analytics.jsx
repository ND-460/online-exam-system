import { useState, useEffect } from "react";
import axios from "axios";

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

  return (
    <div className="p-4 bg-[#1e293b] rounded-lg shadow-md text-blue-100">
      <h2 className="text-lg font-semibold mb-4">Test Analytics</h2>
      <ul className="space-y-2 text-sm">
        <li>Average Score: {avgScore.toFixed(2)}</li>
        <li>Highest Score: {highestScore.toFixed(2)}</li>
        <li>Lowest Score: {lowestScore.toFixed(2)}</li>
        <li>Total Students: {totalStudents}</li>
        <li>Total Submissions: {scoreDistribution.length}</li>
      </ul>
    </div>
  );
};

export default Analytics;

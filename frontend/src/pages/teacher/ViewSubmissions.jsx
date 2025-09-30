import { useState, useEffect } from "react";
import axios from "axios";

const ViewSubmissions = ({ testId, token }) => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!testId) return;

    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/teacher/submissions/${testId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setSubmissions(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Error fetching submissions", err);
        setSubmissions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [testId, token]);

  if (loading) {
    return (
      <div className="h-24 flex items-center justify-center text-blue-300 text-xs">
        Loading submissions...
      </div>
    );
  }

  if (!submissions.length) {
    return (
      <div className="h-24 flex items-center justify-center text-blue-300 text-xs">
        No submissions found for this test.
      </div>
    );
  }

  return (
  <div className="bg-white dark:bg-[#1f2937] rounded-3xl p-6 shadow-xl border border-gray-200 dark:border-gray-700 w-full transition duration-300 hover:scale-[1.01]">
    {/* Title */}
    <h3 className="text-xl font-bold mb-2 text-yellow-800 dark:text-white">
      Submissions
    </h3>
    <p className="text-yellow-900 dark:text-gray-300 text-sm mb-4">
      List of students who submitted the test
    </p>

    {/* Table */}
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm text-blue-100 dark:text-blue-200">
        <thead>
          <tr className="border-b border-gray-300 dark:border-gray-600">
            <th className="text-left p-3 text-yellow-800">Student</th>
            <th className="text-left p-3 text-yellow-800">Score</th>
            <th className="text-left p-3 text-yellow-800">Submitted At</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map((sub, idx) => (
            <tr key={idx} className="border-b border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-[#2a3350] transition">
              <td className="p-3 text-yellow-800">
                {sub.studentId?.profileInfo
                  ? `${sub.studentId.profileInfo.firstName} ${sub.studentId.profileInfo.lastName}`
                  : "Unknown"}
              </td>
              <td className="p-3 text-yellow-800">{sub.score ?? "-"}</td>
              <td className="p-3 text-yellow-800">
                {sub.attemptedAt
                  ? new Date(sub.attemptedAt).toLocaleString()
                  : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

};

export default ViewSubmissions;

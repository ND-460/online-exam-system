import { useState, useEffect } from "react";
import axios from "axios";

const ViewSubmissions = ({ testId ,token}) => {
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
  }, [testId,token]);

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
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm text-blue-200">
        <thead>
          <tr className="border-b border-[#232f4b]">
            <th className="text-left p-2">Student</th>
            <th className="text-left p-2">Score</th>
            <th className="text-left p-2">Submitted At</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map((sub, idx) => (
            <tr key={idx} className="border-b border-[#232f4b]">
              <td className="p-2">{sub.studentName || "Unknown"}</td>
              <td className="p-2">{sub.score ?? "-"}</td>
              <td className="p-2">
                {sub.submittedAt
                  ? new Date(sub.submittedAt).toLocaleString()
                  : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ViewSubmissions;

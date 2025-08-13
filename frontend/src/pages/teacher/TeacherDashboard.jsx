
import React, { useState } from "react";
import AddQuestions from "./AddQuestions";

export default function TeacherDashboard() {
  const [testTitle, setTestTitle] = useState("");
  const [testType, setTestType] = useState("MCQ");
  const [testDesc, setTestDesc] = useState("");
  const [showQuestions, setShowQuestions] = useState(false);
  const [questions, setQuestions] = useState([]);

  const handleNextQuestions = () => {
    setShowQuestions(true);
  };
  const handleSaveQuestions = (qs) => {
    setQuestions(qs);
    setShowQuestions(false);
    // Here you would also save the test and questions to backend
  };
  const handleCancelQuestions = () => {
    setShowQuestions(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#151e2e] to-[#1a2236] p-6 text-white">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold">Teacher Dashboard</h2>
          <p className="text-blue-200 text-sm mt-1">Welcome back — here's what's happening.</p>
        </div>
        {/* Removed Notifications, Toggle Theme, and blue circle */}
      </div>

      {showQuestions ? (
        <AddQuestions onSave={handleSaveQuestions} onCancel={handleCancelQuestions} />
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left/Main Column */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              {/* Create New Test - Bigger */}
              <div className="bg-gradient-to-br from-black via-[#181f2e] to-[#232f4b] rounded-3xl p-10 border-2 border-[#232f4b] shadow-2xl w-full min-h-[260px]">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-2xl font-bold tracking-tight text-white">Create New Test</h3>
                  <span className="text-sm text-blue-200">Drafts auto-save</span>
                </div>
                <div className="flex gap-4 mb-4">
                  <input
                    className="flex-1 bg-[#151e2e] border border-[#232f4b] rounded-md px-4 py-3 text-white text-lg mr-2"
                    placeholder="Test Title"
                    value={testTitle}
                    onChange={e => setTestTitle(e.target.value)}
                  />
                  <select
                    className="w-48 bg-[#151e2e] border border-[#232f4b] rounded-md px-4 py-3 text-white text-lg"
                    value={testType}
                    onChange={e => setTestType(e.target.value)}
                  >
                    <option>MCQ</option>
                    <option>Coding</option>
                    <option>Essay</option>
                  </select>
                </div>
                <textarea
                  className="w-full bg-[#151e2e] border border-[#232f4b] rounded-md px-4 py-3 text-white text-lg mb-4"
                  placeholder="Short description"
                  value={testDesc}
                  onChange={e => setTestDesc(e.target.value)}
                  rows={3}
                />
                <div className="flex gap-4">
                  <button onClick={handleNextQuestions} className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-md font-semibold text-lg">Next: Questions</button>
                  <button className="bg-transparent border border-blue-200 text-blue-200 px-6 py-3 rounded-md font-semibold text-lg">Save Draft</button>
                </div>
              </div>

              {/* Manage Tests - Bigger */}
              <div className="bg-gradient-to-br from-black via-[#181f2e] to-[#232f4b] rounded-3xl p-10 border-2 border-[#232f4b] shadow-2xl w-full min-h-[180px]">
                <h3 className="text-2xl font-bold mb-4">Manage Tests</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-blue-100 text-lg">
                    <thead>
                      <tr className="border-b border-[#232f4b]">
                        <th className="py-3 font-semibold">Title</th>
                        <th className="py-3 font-semibold">Type</th>
                        <th className="py-3 font-semibold">Visibility</th>
                        <th className="py-3 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="py-3">DS Mock</td>
                        <td className="py-3">MCQ</td>
                        <td className="py-3">Public</td>
                        <td className="py-3"><span className="text-blue-300 cursor-pointer hover:underline">Edit</span> • <span className="text-blue-300 cursor-pointer hover:underline">Analytics</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* View Submissions */}
              <div className="bg-gradient-to-br from-black via-[#181f2e] to-[#232f4b] rounded-2xl p-6 border border-[#232f4b] shadow-xl w-full">
                <h3 className="font-bold mb-2">View Submissions</h3>
                <p className="text-blue-200 text-xs mb-2">Filter by test or student, see code output and score.</p>
                <div className="h-24 flex items-center justify-center text-blue-300 text-xs">[Submissions Table Placeholder]</div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="flex flex-col gap-6">
              {/* Analytics (Snapshot) */}
              <div className="bg-gradient-to-br from-black via-[#181f2e] to-[#232f4b] rounded-2xl p-6 border border-[#232f4b] shadow-xl w-full">
                <h3 className="font-bold mb-2">Analytics (Snapshot)</h3>
                <div className="h-32 flex items-center justify-center text-blue-300 text-xs">[Charts Placeholder]</div>
              </div>

              {/* Invite Students */}
              <div className="bg-gradient-to-br from-black via-[#181f2e] to-[#232f4b] rounded-2xl p-6 border border-[#232f4b] shadow-xl w-full">
                <h3 className="font-bold mb-2">Invite Students</h3>
                <p className="text-blue-200 text-xs mb-3">Send email invites or generate enroll links.</p>
                <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md font-semibold">Generate Link</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  //         {/* View Submissions */}
  //         <div className="bg-gradient-to-br from-black via-[#181f2e] to-[#232f4b] rounded-2xl p-6 border border-[#232f4b] shadow-xl w-full">
  //           <h3 className="font-bold mb-2">View Submissions</h3>
  //           <p className="text-blue-200 text-xs mb-2">Filter by test or student, see code output and score.</p>
  //           <div className="h-24 flex items-center justify-center text-blue-300 text-xs">[Submissions Table Placeholder]</div>
  //         </div>
  //       </div>

  //       {/* Right Sidebar */}
  //       <div className="flex flex-col gap-6">
  //         {/* Analytics (Snapshot) */}
  //         <div className="bg-gradient-to-br from-black via-[#181f2e] to-[#232f4b] rounded-2xl p-6 border border-[#232f4b] shadow-xl w-full">
  //           <h3 className="font-bold mb-2">Analytics (Snapshot)</h3>
  //           <div className="h-32 flex items-center justify-center text-blue-300 text-xs">[Charts Placeholder]</div>
  //         </div>

  //         {/* Invite Students */}
  //         <div className="bg-gradient-to-br from-black via-[#181f2e] to-[#232f4b] rounded-2xl p-6 border border-[#232f4b] shadow-xl w-full">
  //           <h3 className="font-bold mb-2">Invite Students</h3>
  //           <p className="text-blue-200 text-xs mb-3">Send email invites or generate enroll links.</p>
  //           <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md font-semibold">Generate Link</button>
  //         </div>
  //       </div>
  //     </div>
  //   </div>
  // );
}

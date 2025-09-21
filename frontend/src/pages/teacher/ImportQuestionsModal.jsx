import React, { useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import DatePicker from "react-datepicker";

export default function ImportQuestionsModal({ isOpen, onClose, onImport }) {
  const inputRef = useRef(null);
  const [rawRows, setRawRows] = useState([]);
  const [errors, setErrors] = useState([]);
  const [testDetails, setTestDetails] = useState({
    testTitle: "",
    className: "",
    testSchedule: null,
    testDuration: 30,
    totalMarks: 10
  });

  const headers = [
    "question",
    "optionA",
    "optionB",
    "optionC",
    "optionD",
    "answer",
    "subject",
    "difficulty",
    "marks",
  ];

  const example = useMemo(
    () => [
      {
        question: "What is 2 + 2?",
        optionA: "3",
        optionB: "4",
        optionC: "5",
        optionD: "6",
        answer: 2,
        subject: "Mathematics",
        difficulty: "easy",
        marks: 1,
      },
      {
        question: "Which planet is closest to the Sun?",
        optionA: "Venus",
        optionB: "Mars",
        optionC: "Mercury",
        optionD: "Earth",
        answer: 3,
        subject: "Science",
        difficulty: "medium",
        marks: 2,
      },
      {
        question: "What is the capital of France?",
        optionA: "London",
        optionB: "Berlin",
        optionC: "Madrid",
        optionD: "Paris",
        answer: 4,
        subject: "Geography",
        difficulty: "easy",
        marks: 1,
      },
    ],
    []
  );

  const parseFile = async (file) => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    setRawRows(rows);
  };

  const handleChoose = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    if (!allowed.includes(file.type) && !file.name.match(/\.(csv|xlsx?)$/i)) {
      setErrors(["Unsupported file type. Use CSV or Excel (xlsx/xls)."]);
      return;
    }
    parseFile(file);
  };

  const validate = (rows) => {
    const seen = new Set();
    const problems = [];
    const cleaned = [];

    // Validate user-entered test details
    if (!testDetails.testTitle.trim()) problems.push("Test Title is required");
    if (!testDetails.className.trim()) problems.push("Class Name is required");
    if (!testDetails.testDuration || testDetails.testDuration <= 0) problems.push("Test Duration must be greater than 0");
    if (!testDetails.totalMarks || testDetails.totalMarks <= 0) problems.push("Total Marks must be greater than 0");

    // Validate schedule date (cannot be in the past)
    if (testDetails.testSchedule && testDetails.testSchedule < new Date()) {
      problems.push("Scheduled date cannot be in the past");
    }

    rows.forEach((r, idx) => {
      const rowNum = idx + 2; // header is row 1

      // Check question details
      const q = String(r.question || "").trim();
      const a = String(r.optionA || "").trim();
      const b = String(r.optionB || "").trim();
      const c = String(r.optionC || "").trim();
      const d = String(r.optionD || "").trim();
      const ans = Number(r.answer);

      // Validate question details
      if (!q) problems.push(`Row ${rowNum}: question is required`);
      if (!a || !b || !c || !d) problems.push(`Row ${rowNum}: all 4 options required (found blank options)`);
      if (!(ans >= 1 && ans <= 4)) problems.push(`Row ${rowNum}: answer must be 1-4`);

      // Check for duplicate questions
      const signature = `${q}::${a}::${b}::${c}::${d}`.toLowerCase();
      if (seen.has(signature)) problems.push(`Row ${rowNum}: duplicate question/options`);
      seen.add(signature);

      cleaned.push({
        testTitle: testDetails.testTitle,
        className: testDetails.className,
        testSchedule: testDetails.testSchedule,
        testDuration: testDetails.testDuration,
        totalMarks: testDetails.totalMarks,
        question: q,
        options: [a, b, c, d],
        answer: isNaN(ans) ? 0 : ans - 1,
        subject: String(r.subject || "").trim() || undefined,
        difficulty: ["easy", "medium", "hard"].includes(String(r.difficulty || "").toLowerCase())
          ? String(r.difficulty).toLowerCase()
          : "medium",
        marks: Number(r.marks) > 0 ? Number(r.marks) : 1,
      });
    });

    return { problems, cleaned, testDetails };
  };

  const { problems, cleaned } = useMemo(() => validate(rawRows), [rawRows, testDetails]);

  const updateQuestion = (index, patch) => {
    const next = [...cleaned];
    next[index] = { ...next[index], ...patch };
    // reflect edits back to rawRows shape to keep memo happy
    const rr = [...rawRows];
    const q = next[index];
    rr[index] = {
      question: q.question,
      optionA: q.options[0],
      optionB: q.options[1],
      optionC: q.options[2],
      optionD: q.options[3],
      answer: q.answer + 1,
      subject: q.subject || "",
      difficulty: q.difficulty,
      marks: q.marks,
    };
    setRawRows(rr);
  };

  const removeQuestion = (index) => {
    const rr = rawRows.filter((_, i) => i !== index);
    setRawRows(rr);
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet(example);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "MCQ_Template");
    XLSX.writeFile(wb, "mcq_template.xlsx");
  };

  const handleImport = () => {
    if (problems.length) return;
    onImport(cleaned, testDetails);
    onClose();
  };

  if (!isOpen) return null;
  return (
  <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center p-4">
    <div className="bg-gradient-to-br from-white via-blue-50 to-white w-full max-w-5xl max-h-[90vh] rounded-2xl border border-gray-200 text-gray-900 flex flex-col shadow-lg">
      
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <h3 className="text-xl font-semibold">Import Questions from CSV/Excel</h3>
        <button onClick={onClose} className="text-blue-600 hover:text-blue-800 font-medium">Close</button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* File Upload Buttons */}
        <div className="flex items-center gap-3 mb-2">
          <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleChoose} className="hidden" />
          <button onClick={() => inputRef.current?.click()} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md shadow-sm">Choose CSV/Excel</button>
          <button onClick={downloadTemplate} className="bg-transparent border border-blue-400 text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md">Download MCQ Template</button>
        </div>

        <p className="text-gray-700 text-sm">Expected columns: {headers.join(", ")}</p>

        <div className="text-gray-700 text-sm bg-blue-50 p-3 rounded border border-gray-200">
          <p className="font-semibold mb-1">Template Instructions:</p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>question:</strong> The question text (required)</li>
            <li><strong>optionA, optionB, optionC, optionD:</strong> The four answer choices (all required)</li>
            <li><strong>answer:</strong> Correct answer (1=A, 2=B, 3=C, 4=D) (required)</li>
            <li><strong>subject:</strong> Subject name (optional)</li>
            <li><strong>difficulty:</strong> Question difficulty (easy, medium, hard) (optional)</li>
            <li><strong>marks:</strong> Points for this question (defaults to 1)</li>
          </ul>
          <p className="mt-2 text-yellow-600"><strong>Note:</strong> Test details (title, class, duration, etc.) are entered below, not in the CSV/Excel file.</p>
        </div>

        {/* Test Details Form */}
        <div className="mb-4 bg-white p-4 rounded border border-gray-200 shadow-sm">
          <h4 className="text-gray-900 font-semibold mb-3">Test Details:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-700 text-sm mb-1">Test Title *</label>
              <input
                type="text"
                value={testDetails.testTitle}
                onChange={(e) => setTestDetails({ ...testDetails, testTitle: e.target.value })}
                className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-900 text-sm focus:border-blue-400 focus:outline-none transition-colors"
                placeholder="Enter test title"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm mb-1">Class Name *</label>
              <input
                type="text"
                value={testDetails.className}
                onChange={(e) => setTestDetails({ ...testDetails, className: e.target.value })}
                className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-900 text-sm focus:border-blue-400 focus:outline-none transition-colors"
                placeholder="e.g., Class 10"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm mb-1">Test Schedule</label>
              <DatePicker
                selected={testDetails.testSchedule}
                onChange={(date) => setTestDetails({ ...testDetails, testSchedule: date })}
                showTimeSelect
                timeIntervals={15}
                dateFormat="MMMM d, yyyy h:mm aa"
                minDate={new Date()}
                className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-900 text-sm focus:border-blue-400 focus:outline-none transition-colors"
                calendarClassName="bg-white text-gray-900 rounded-md shadow-lg border border-gray-200"
                wrapperClassName="w-full"
                placeholderText="Select date and time"
                isClearable
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm mb-1">Duration (minutes) *</label>
              <input
                type="number"
                min="1"
                value={testDetails.testDuration}
                onChange={(e) => setTestDetails({ ...testDetails, testDuration: Math.max(1, Number(e.target.value) || 1) })}
                className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-900 text-sm focus:border-blue-400 focus:outline-none transition-colors"
                placeholder="30"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm mb-1">Total Marks *</label>
              <input
                type="number"
                min="1"
                value={testDetails.totalMarks}
                onChange={(e) => setTestDetails({ ...testDetails, totalMarks: Math.max(1, Number(e.target.value) || 1) })}
                className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-gray-900 text-sm focus:border-blue-400 focus:outline-none transition-colors"
                placeholder="10"
              />
            </div>
          </div>
        </div>

        {/* Error Messages */}
        {errors.length > 0 && <div className="text-red-500 text-sm">{errors.join(" ")}</div>}
        {problems.length > 0 && <div className="text-red-500 text-sm">{problems.join(" | ")}</div>}

        {/* Questions Preview */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-gray-900 text-sm font-semibold">Imported Questions Preview</h4>
            {cleaned.length > 0 && (
              <span className="text-gray-800 text-xs bg-gray-100 px-2 py-1 rounded">
                {cleaned.length} question{cleaned.length !== 1 ? 's' : ''} loaded
              </span>
            )}
          </div>
          {cleaned.length === 0 && (
            <div className="text-center py-8 text-gray-500 text-sm">
              <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>No questions loaded. Please upload a CSV/Excel file to preview questions.</p>
            </div>
          )}
        </div>

        {/* Questions Table */}
        <div className="max-h-80 overflow-auto rounded-lg border border-gray-200 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-gray-800 text-sm min-w-max">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="p-2 min-w-[300px]">Question</th>
                  <th className="p-2 min-w-[150px]">Option A</th>
                  <th className="p-2 min-w-[150px]">Option B</th>
                  <th className="p-2 min-w-[150px]">Option C</th>
                  <th className="p-2 min-w-[150px]">Option D</th>
                  <th className="p-2 min-w-[100px]">Answer (1-4)</th>
                  <th className="p-2 min-w-[120px]">Subject</th>
                  <th className="p-2 min-w-[100px]">Difficulty</th>
                  <th className="p-2 min-w-[80px]">Marks</th>
                  <th className="p-2 min-w-[80px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {cleaned.map((q, i) => (
                  <tr key={i} className="border-t border-gray-200">
                    {/* Input fields (same logic) */}
                    <td className="p-2"><input className="w-full bg-white border border-gray-300 rounded px-2 py-1 focus:border-blue-400 focus:outline-none transition-colors" value={q.question} onChange={(e) => updateQuestion(i, { question: e.target.value })} /></td>
                    <td className="p-2"><input className="w-full bg-white border border-gray-300 rounded px-2 py-1 focus:border-blue-400 focus:outline-none transition-colors" value={q.options[0]} onChange={(e) => updateQuestion(i, { options: [e.target.value, q.options[1], q.options[2], q.options[3]] })} /></td>
                    <td className="p-2"><input className="w-full bg-white border border-gray-300 rounded px-2 py-1 focus:border-blue-400 focus:outline-none transition-colors" value={q.options[1]} onChange={(e) => updateQuestion(i, { options: [q.options[0], e.target.value, q.options[2], q.options[3]] })} /></td>
                    <td className="p-2"><input className="w-full bg-white border border-gray-300 rounded px-2 py-1 focus:border-blue-400 focus:outline-none transition-colors" value={q.options[2]} onChange={(e) => updateQuestion(i, { options: [q.options[0], q.options[1], e.target.value, q.options[3]] })} /></td>
                    <td className="p-2"><input className="w-full bg-white border border-gray-300 rounded px-2 py-1 focus:border-blue-400 focus:outline-none transition-colors" value={q.options[3]} onChange={(e) => updateQuestion(i, { options: [q.options[0], q.options[1], q.options[2], e.target.value] })} /></td>
                    <td className="p-2"><input type="number" min={1} max={4} className="w-full bg-white border border-gray-300 rounded px-2 py-1" value={q.answer + 1} onChange={(e) => updateQuestion(i, { answer: Math.max(1, Math.min(4, Number(e.target.value))) - 1 })} /></td>
                    <td className="p-2"><input className="w-full bg-white border border-gray-300 rounded px-2 py-1 focus:border-blue-400 focus:outline-none transition-colors" value={q.subject || ""} onChange={(e) => updateQuestion(i, { subject: e.target.value })} /></td>
                    <td className="p-2">
                      <select className="w-full bg-white border border-gray-300 rounded px-2 py-1 focus:border-blue-400 focus:outline-none transition-colors" value={q.difficulty} onChange={(e) => updateQuestion(i, { difficulty: e.target.value })}>
                        <option value="easy">easy</option>
                        <option value="medium">medium</option>
                        <option value="hard">hard</option>
                      </select>
                    </td>
                    <td className="p-2"><input type="number" min={1} className="w-full bg-white border border-gray-300 rounded px-2 py-1" value={q.marks} onChange={(e) => updateQuestion(i, { marks: Math.max(1, Number(e.target.value) || 1) })} /></td>
                    <td className="p-2"><button className="text-red-500 hover:text-red-700" onClick={() => removeQuestion(i)}>Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-4 p-3 bg-white rounded border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-green-600 text-xs font-medium">Ready to Import</span>
          </div>
          <div className="text-xs text-gray-700 space-y-1">
            <div>• All questions will be validated before saving</div>
            <div>• Duplicate questions will be automatically detected</div>
            <div>• Test will be created with the specified details</div>
            <div>• You can edit questions after import if needed</div>
          </div>
        </div>

        <div className="h-4"></div>
      </div>

      {/* Fixed Footer */}
      <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-white">
        <button
          disabled={problems.length > 0 || cleaned.length === 0}
          onClick={handleImport}
          className={`px-4 py-2 rounded-md transition-colors font-semibold ${problems.length > 0 || cleaned.length === 0 ? "bg-gray-300 cursor-not-allowed" : "bg-violet-600 hover:bg-violet-700 text-white"}`}
        >
          Save to Test
        </button>
      </div>
    </div>
  </div>
);

}



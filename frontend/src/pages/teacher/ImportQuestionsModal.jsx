import React, { useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";

export default function ImportQuestionsModal({ isOpen, onClose, onImport }) {
  const inputRef = useRef(null);
  const [rawRows, setRawRows] = useState([]);
  const [errors, setErrors] = useState([]);

  const headers = [
    "testTitle",
    "className",
    "testSchedule",
    "testDuration",
    "totalMarks",
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
        testTitle: "Mathematics Quiz 1",
        className: "Class 10",
        testSchedule: "2024-01-15 10:00",
        testDuration: 30,
        totalMarks: 5,
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
        testTitle: "Mathematics Quiz 1",
        className: "Class 10",
        testSchedule: "2024-01-15 10:00",
        testDuration: 30,
        totalMarks: 5,
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
        testTitle: "Mathematics Quiz 1",
        className: "Class 10",
        testSchedule: "2024-01-15 10:00",
        testDuration: 30,
        totalMarks: 5,
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
    let testDetails = null;

    rows.forEach((r, idx) => {
      const rowNum = idx + 2; // header is row 1

      // Check test details (should be same in all rows)
      const testTitle = String(r.testTitle || "").trim();
      const className = String(r.className || "").trim();
      const testSchedule = String(r.testSchedule || "").trim();
      const testDuration = Number(r.testDuration);
      const totalMarks = Number(r.totalMarks);

      // Check question details
      const q = String(r.question || "").trim();
      const a = String(r.optionA || "").trim();
      const b = String(r.optionB || "").trim();
      const c = String(r.optionC || "").trim();
      const d = String(r.optionD || "").trim();
      const ans = Number(r.answer);

      // Validate test details
      if (!testTitle) problems.push(`Row ${rowNum}: testTitle is required`);
      if (!className) problems.push(`Row ${rowNum}: className is required`);
      if (!testDuration || testDuration <= 0) problems.push(`Row ${rowNum}: testDuration must be greater than 0`);
      if (!totalMarks || totalMarks <= 0) problems.push(`Row ${rowNum}: totalMarks must be greater than 0`);

      // Validate question details
      if (!q) problems.push(`Row ${rowNum}: question is required`);
      if (!a || !b || !c || !d) problems.push(`Row ${rowNum}: all 4 options required (found blank options)`);
      if (!(ans >= 1 && ans <= 4)) problems.push(`Row ${rowNum}: answer must be 1-4`);

      // Check for duplicate questions
      const signature = `${q}::${a}::${b}::${c}::${d}`.toLowerCase();
      if (seen.has(signature)) problems.push(`Row ${rowNum}: duplicate question/options`);
      seen.add(signature);

      // Store test details from first row
      if (idx === 0) {
        testDetails = {
          testTitle,
          className,
          testSchedule: testSchedule || undefined,
          testDuration,
          totalMarks,
        };
      } else {
        // Check if test details are consistent across rows
        if (testTitle !== testDetails.testTitle) problems.push(`Row ${rowNum}: testTitle must be same as first row`);
        if (className !== testDetails.className) problems.push(`Row ${rowNum}: className must be same as first row`);
        if (testDuration !== testDetails.testDuration) problems.push(`Row ${rowNum}: testDuration must be same as first row`);
        if (totalMarks !== testDetails.totalMarks) problems.push(`Row ${rowNum}: totalMarks must be same as first row`);
      }

      cleaned.push({
        testTitle,
        className,
        testSchedule: testSchedule || undefined,
        testDuration,
        totalMarks,
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

  const { problems, cleaned, testDetails } = useMemo(() => validate(rawRows), [rawRows]);

  const updateQuestion = (index, patch) => {
    const next = [...cleaned];
    next[index] = { ...next[index], ...patch };
    // reflect edits back to rawRows shape to keep memo happy
    const rr = [...rawRows];
    const q = next[index];
    rr[index] = {
      testTitle: q.testTitle,
      className: q.className,
      testSchedule: q.testSchedule || "",
      testDuration: q.testDuration,
      totalMarks: q.totalMarks,
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
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-[#101826] w-full max-w-5xl rounded-2xl border border-[#26334d] p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Import Questions from CSV/Excel</h3>
          <button onClick={onClose} className="text-blue-200 hover:underline">Close</button>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleChoose} className="hidden" />
          <button onClick={() => inputRef.current?.click()} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md">Choose CSV/Excel</button>
          <button onClick={downloadTemplate} className="bg-transparent border border-blue-300 text-blue-300 px-3 py-2 rounded-md">Download MCQ Template</button>
        </div>

        <p className="text-blue-200 text-sm mb-3">Expected columns: {headers.join(", ")}</p>
        <div className="text-blue-200 text-xs mb-3 bg-[#0b1220] p-3 rounded border border-[#26334d]">
          <p className="font-semibold mb-1">Template Instructions:</p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>testTitle:</strong> Name of the test (required)</li>
            <li><strong>className:</strong> Class name (e.g., Class 10) (required)</li>
            <li><strong>testSchedule:</strong> Test date and time (optional)</li>
            <li><strong>testDuration:</strong> Test duration in minutes (required)</li>
            <li><strong>totalMarks:</strong> Total marks for the test (required)</li>
            <li><strong>question:</strong> The question text (required)</li>
            <li><strong>optionA, optionB, optionC, optionD:</strong> The four answer choices (all required)</li>
            <li><strong>answer:</strong> Correct answer (1=A, 2=B, 3=C, 4=D) (required)</li>
            <li><strong>subject:</strong> Subject name (optional)</li>
            
            <li><strong>marks:</strong> Points for this question (defaults to 1)</li>
          </ul>
          <p className="mt-2 text-yellow-300"><strong>Note:</strong> Test details should be repeated in each row for consistency.</p>
        </div>

        {errors.length > 0 && (
          <div className="mb-3 text-red-400 text-sm">{errors.join(" ")}</div>
        )}
        {problems.length > 0 && (
          <div className="mb-3 text-red-400 text-sm">{problems.join(" | ")}</div>
        )}

        {/* Test Details Summary */}
        {testDetails && cleaned.length > 0 && (
          <div className="mb-3 bg-[#0b1220] p-3 rounded border border-[#26334d]">
            <p className="text-blue-200 text-sm font-semibold mb-2">Test Details:</p>
            <div className="grid grid-cols-2 gap-4 text-xs text-blue-300">
              <div><strong>Test Title:</strong> {testDetails.testTitle}</div>
              <div><strong>Class Name:</strong> {testDetails.className}</div>
              <div><strong>Duration:</strong> {testDetails.testDuration} minutes</div>
              <div><strong>Total Marks:</strong> {testDetails.totalMarks}</div>
              <div><strong>Schedule:</strong> {testDetails.testSchedule || "Not scheduled"}</div>
            </div>
          </div>
        )}

        <div className="max-h-96 overflow-auto rounded-lg border border-[#26334d]">
          <table className="w-full text-left text-blue-100 text-sm">
            <thead className="bg-[#0b1220] sticky top-0">
              <tr>
                <th className="p-2">Test Title</th>
                <th className="p-2">Class Name</th>
                <th className="p-2">Duration</th>
                <th className="p-2">Total Marks</th>
                <th className="p-2">Question</th>
                <th className="p-2">A</th>
                <th className="p-2">B</th>
                <th className="p-2">C</th>
                <th className="p-2">D</th>
                <th className="p-2">Answer (1-4)</th>
                <th className="p-2">Subject</th>
                <th className="p-2">Difficulty</th>
                <th className="p-2">Marks</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {cleaned.map((q, i) => (
                <tr key={i} className="border-t border-[#26334d]">
                  <td className="p-2">
                    <input className="w-32 bg-transparent border border-[#26334d] rounded px-2 py-1"
                      value={q.testTitle} onChange={(e) => updateQuestion(i, { testTitle: e.target.value })} />
                  </td>
                  <td className="p-2">
                    <input className="w-24 bg-transparent border border-[#26334d] rounded px-2 py-1"
                      value={q.className} onChange={(e) => updateQuestion(i, { className: e.target.value })} />
                  </td>
                  <td className="p-2">
                    <input type="number" min={1} className="w-20 bg-transparent border border-[#26334d] rounded px-2 py-1"
                      value={q.testDuration} onChange={(e) => updateQuestion(i, { testDuration: Math.max(1, Number(e.target.value) || 1) })} />
                  </td>
                  <td className="p-2">
                    <input type="number" min={1} className="w-20 bg-transparent border border-[#26334d] rounded px-2 py-1"
                      value={q.totalMarks} onChange={(e) => updateQuestion(i, { totalMarks: Math.max(1, Number(e.target.value) || 1) })} />
                  </td>
                  <td className="p-2">
                    <input className="w-64 bg-transparent border border-[#26334d] rounded px-2 py-1"
                      value={q.question} onChange={(e) => updateQuestion(i, { question: e.target.value })} />
                  </td>
                  <td className="p-2">
                    <input className="w-40 bg-transparent border border-[#26334d] rounded px-2 py-1"
                      value={q.options[0]} onChange={(e) => updateQuestion(i, { options: [e.target.value, q.options[1], q.options[2], q.options[3]] })} />
                  </td>
                  <td className="p-2">
                    <input className="w-40 bg-transparent border border-[#26334d] rounded px-2 py-1"
                      value={q.options[1]} onChange={(e) => updateQuestion(i, { options: [q.options[0], e.target.value, q.options[2], q.options[3]] })} />
                  </td>
                  <td className="p-2">
                    <input className="w-40 bg-transparent border border-[#26334d] rounded px-2 py-1"
                      value={q.options[2]} onChange={(e) => updateQuestion(i, { options: [q.options[0], q.options[1], e.target.value, q.options[3]] })} />
                  </td>
                  <td className="p-2">
                    <input className="w-40 bg-transparent border border-[#26334d] rounded px-2 py-1"
                      value={q.options[3]} onChange={(e) => updateQuestion(i, { options: [q.options[0], q.options[1], q.options[2], e.target.value] })} />
                  </td>
                  <td className="p-2">
                    <input type="number" min={1} max={4} className="w-24 bg-transparent border border-[#26334d] rounded px-2 py-1"
                      value={q.answer + 1} onChange={(e) => updateQuestion(i, { answer: Math.max(1, Math.min(4, Number(e.target.value))) - 1 })} />
                  </td>
                  <td className="p-2">
                    <input className="w-28 bg-transparent border border-[#26334d] rounded px-2 py-1" value={q.subject || ""}
                      onChange={(e) => updateQuestion(i, { subject: e.target.value })} />
                  </td>
                  <td className="p-2">
                    <select className="w-28 bg-transparent border border-[#26334d] rounded px-2 py-1" value={q.difficulty}
                      onChange={(e) => updateQuestion(i, { difficulty: e.target.value })}>
                      <option value="easy">easy</option>
                      <option value="medium">medium</option>
                      <option value="hard">hard</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <input type="number" min={1} className="w-20 bg-transparent border border-[#26334d] rounded px-2 py-1" value={q.marks}
                      onChange={(e) => updateQuestion(i, { marks: Math.max(1, Number(e.target.value) || 1) })} />
                  </td>
                  <td className="p-2">
                    <button className="text-red-400 hover:underline" onClick={() => removeQuestion(i)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <button disabled={problems.length > 0 || cleaned.length === 0}
            onClick={handleImport}
            className={`px-4 py-2 rounded-md ${problems.length > 0 || cleaned.length === 0 ? "bg-gray-600 cursor-not-allowed" : "bg-violet-600 hover:bg-violet-700"}`}>
            Save to Test
          </button>
        </div>

        {/* For future: add True/False and Descriptive tabs */}
      </div>
    </div>
  );
}



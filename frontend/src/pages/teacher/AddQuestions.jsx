import React, { useState, useEffect } from "react";

export default function AddQuestions({
  initialQuestions = [],
  onSave,
  onCancel,
}) {
  const [questions, setQuestions] = useState(
    initialQuestions.length > 0
      ? initialQuestions
      : [
          {
            question: "",
            options: ["", "", "", ""],
            answer: 0,
            marks: 1,
            difficulty: "medium",
          },
        ]
  );

  const [errors, setErrors] = useState([]);

  const handleQuestionChange = (idx, value) => {
    const updated = [...questions];
    updated[idx].question = value;
    setQuestions(updated);
  };

  const handleOptionChange = (qIdx, oIdx, value) => {
    const updated = [...questions];
    updated[qIdx].options[oIdx] = value;
    setQuestions(updated);
  };

  const handleAnswerChange = (qIdx, value) => {
    const updated = [...questions];
    updated[qIdx].answer = parseInt(value);
    setQuestions(updated);
  };

  const handleMarksChange = (qIdx, value) => {
    const updated = [...questions];
    updated[qIdx].marks = Number(value) || 0;
    setQuestions(updated);
  };

  const handleDifficultyChange = (qIdx, value) => {
    const updated = [...questions];
    updated[qIdx].difficulty = value;
    setQuestions(updated);
  }

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { question: "", options: ["", "", "", ""], answer: 0, marks: 1,difficulty: "medium" },
    ]);
  };

  const removeQuestion = (idx) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  
  const validateQuestions = () => {
    const newErrors = [];

    questions.forEach((q, idx) => {
      let error = {};

      if (!q.question.trim()) {
        error.question = "Question text cannot be empty.";
      }

      const filledOptions = q.options.filter((opt) => opt.trim() !== "");
      if (filledOptions.length < 2) {
        error.options = "At least 2 options are required.";
      }

      if (q.marks < 1) {
        error.marks = "Marks must be at least 1.";
      }

      newErrors[idx] = error;
    });

    setErrors(newErrors);
    return newErrors.every((err) => Object.keys(err).length === 0);
  };

  const handleSave = () => {
    if (validateQuestions()) {
      onSave(questions);
    }
  };

  return (
    <div className="bg-gradient-to-br from-black via-[#181f2e] to-[#232f4b] rounded-2xl p-8 border border-[#232f4b] shadow-2xl w-full max-w-2xl mx-auto mt-8">
      <h2 className="text-xl font-bold mb-4">Add / Edit Questions</h2>
      {questions.map((q, idx) => (
        <div
          key={idx}
          className="mb-6 p-4 bg-[#181f2e] rounded-xl border border-[#232f4b]"
        >
          <div className="flex justify-between items-center mb-2">
            <label className="font-semibold text-white">
              Question {idx + 1}
            </label>
            {questions.length > 1 && (
              <button
                onClick={() => removeQuestion(idx)}
                className="text-red-400 hover:underline text-xs"
              >
                Remove
              </button>
            )}
          </div>
          <input
            className={`w-full bg-[#151e2e] border rounded-md px-3 py-2 text-white mb-2 ${
              errors[idx]?.question ? "border-red-500" : "border-[#232f4b]"
            }`}
            placeholder="Enter question text"
            value={q.question}
            onChange={(e) => handleQuestionChange(idx, e.target.value)}
          />
          {errors[idx]?.question && (
            <p className="text-red-400 text-sm mb-2">{errors[idx].question}</p>
          )}

          <div className="grid grid-cols-2 gap-2 mb-2">
            {q.options.map((opt, oIdx) => (
              <input
                key={oIdx}
                className={`bg-[#151e2e] border rounded-md px-3 py-2 text-white ${
                  errors[idx]?.options ? "border-red-500" : "border-[#232f4b]"
                }`}
                placeholder={`Option ${oIdx + 1}`}
                value={opt}
                onChange={(e) => handleOptionChange(idx, oIdx, e.target.value)}
              />
            ))}
          </div>
          {errors[idx]?.options && (
            <p className="text-red-400 text-sm mb-2">{errors[idx].options}</p>
          )}

          <div className="flex items-center gap-3 mb-2">
            <label className="text-blue-200 text-sm">Correct Answer:</label>
            <select
              className="bg-[#151e2e] border border-[#232f4b] rounded-md px-2 py-1 text-white"
              value={q.answer}
              onChange={(e) => handleAnswerChange(idx, e.target.value)}
            >
              {q.options.map((_, oIdx) => (
                <option key={oIdx} value={oIdx}>{`Option ${oIdx + 1}`}</option>
              ))}
            </select>
          </div>
          {/* Difficulty */}
          <div className="flex items-center gap-3 mb-2">
            <label className="text-blue-200 text-sm">Difficulty:</label>
            <select
              className="bg-[#151e2e] border border-[#232f4b] rounded-md px-2 py-1 text-white"
              value={q.difficulty}
              onChange={(e) => handleDifficultyChange(idx, e.target.value)}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-blue-200 text-sm">Marks:</label>
            <input
              type="number"
              min="1"
              className={`w-24 bg-[#151e2e] border rounded-md px-2 py-1 text-white ${
                errors[idx]?.marks ? "border-red-500" : "border-[#232f4b]"
              }`}
              value={q.marks}
              onChange={(e) => handleMarksChange(idx, e.target.value)}
            />
          </div>
          {errors[idx]?.marks && (
            <p className="text-red-400 text-sm mt-1">{errors[idx].marks}</p>
          )}
        </div>
      ))}
      <button
        onClick={addQuestion}
        className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-md font-semibold mb-4"
      >
        Add Another Question
      </button>
      <div className="flex gap-4 mt-4">
        <button
          onClick={handleSave}
          className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-md font-semibold text-lg"
        >
          Save Questions
        </button>
        <button
          onClick={onCancel}
          className="bg-transparent border border-blue-200 text-blue-200 px-6 py-3 rounded-md font-semibold text-lg"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

import React, { useState } from "react";

export default function AddQuestions({ onSave, onCancel }) {
  const [questions, setQuestions] = useState([
    { question: "", options: ["", "", "", ""], answer: 0 }
  ]);

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

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { question: "", options: ["", "", "", ""], answer: 0 }
    ]);
  };

  const removeQuestion = idx => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    onSave(questions);
  };

  return (
    <div className="bg-gradient-to-br from-black via-[#181f2e] to-[#232f4b] rounded-2xl p-8 border border-[#232f4b] shadow-2xl w-full max-w-2xl mx-auto mt-8">
      <h2 className="text-xl font-bold mb-4">Add Questions</h2>
      {questions.map((q, idx) => (
        <div key={idx} className="mb-6 p-4 bg-[#181f2e] rounded-xl border border-[#232f4b]">
          <div className="flex justify-between items-center mb-2">
            <label className="font-semibold text-white">Question {idx + 1}</label>
            {questions.length > 1 && (
              <button onClick={() => removeQuestion(idx)} className="text-red-400 hover:underline text-xs">Remove</button>
            )}
          </div>
          <input
            className="w-full bg-[#151e2e] border border-[#232f4b] rounded-md px-3 py-2 text-white mb-2"
            placeholder="Enter question text"
            value={q.question}
            onChange={e => handleQuestionChange(idx, e.target.value)}
          />
          <div className="grid grid-cols-2 gap-2 mb-2">
            {q.options.map((opt, oIdx) => (
              <input
                key={oIdx}
                className="bg-[#151e2e] border border-[#232f4b] rounded-md px-3 py-2 text-white"
                placeholder={`Option ${oIdx + 1}`}
                value={opt}
                onChange={e => handleOptionChange(idx, oIdx, e.target.value)}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <label className="text-blue-200 text-sm">Correct Answer:</label>
            <select
              className="bg-[#151e2e] border border-[#232f4b] rounded-md px-2 py-1 text-white"
              value={q.answer}
              onChange={e => handleAnswerChange(idx, e.target.value)}
            >
              {q.options.map((_, oIdx) => (
                <option key={oIdx} value={oIdx}>{`Option ${oIdx + 1}`}</option>
              ))}
            </select>
          </div>
        </div>
      ))}
      <button onClick={addQuestion} className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-md font-semibold mb-4">Add Another Question</button>
      <div className="flex gap-4 mt-4">
        <button onClick={handleSave} className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-md font-semibold text-lg">Save Questions</button>
        <button onClick={onCancel} className="bg-transparent border border-blue-200 text-blue-200 px-6 py-3 rounded-md font-semibold text-lg">Cancel</button>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import "./AddQuestions.css";
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
  <div className="add-questions-container">
    <h2 className="add-questions-title">Add / Edit Questions</h2>

    <div className="questions-grid">
  {questions.map((q, idx) => (
    <div key={idx} className="question-card">
      <div className="question-header">
        <span>Question {idx + 1}</span>
        {questions.length > 1 && (
          <button onClick={() => removeQuestion(idx)} className="text-red-500 text-xs">Remove</button>
        )}
      </div>

      {/* Question textarea */}
      <textarea
        className={`question-input ${errors[idx]?.question ? "error-border" : ""}`}
        placeholder="Enter question text"
        value={q.question}
        onChange={(e) => handleQuestionChange(idx, e.target.value)}
        rows={1}
        onInput={(e) => {
          e.target.style.height = "auto";
          e.target.style.height = e.target.scrollHeight + "px";
        }}
      />
      {errors[idx]?.question && <p className="error-text">{errors[idx].question}</p>}

      <div className="options-grid">
        {q.options.map((opt, oIdx) => (
          <textarea
            key={oIdx}
            className={`option-input ${errors[idx]?.options ? "error-border" : ""}`}
            placeholder={`Option ${oIdx + 1}`}
            value={opt}
            onChange={(e) => handleOptionChange(idx, oIdx, e.target.value)}
            rows={1}
            onInput={(e) => {
              e.target.style.height = "auto";
              e.target.style.height = e.target.scrollHeight + "px";
            }}
          />
        ))}
      </div>
      {errors[idx]?.options && <p className="text-red-400 text-sm mb-2">{errors[idx].options}</p>}

      <div className="flex items-center gap-3 mb-2">
        <label className="text-gray-700 text-sm">Correct Answer:</label>
        <select
          className="answer-select"
          value={q.answer}
          onChange={(e) => handleAnswerChange(idx, e.target.value)}
        >
          {q.options.map((_, oIdx) => (
            <option key={oIdx} value={oIdx}>{`Option ${oIdx + 1}`}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-3 mb-2">
        <label className="text-gray-700 text-sm">Difficulty:</label>
        <select
          className="difficulty-select"
          value={q.difficulty}
          onChange={(e) => handleDifficultyChange(idx, e.target.value)}
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-gray-700 text-sm">Marks:</label>
        <input
          type="number"
          min="1"
          className="marks-input"
          value={q.marks}
          onChange={(e) => handleMarksChange(idx, e.target.value)}
        />
      </div>
      {errors[idx]?.marks && <p className="error-text">{errors[idx].marks}</p>}
    </div>
  ))}
</div>


    <button onClick={addQuestion} className="button-primary mt-4 mb-4 ">Add Another Question</button>

    <div className="flex gap-4 mt-4">
      <button onClick={handleSave} className="button-primary">Save Questions</button>
      <button onClick={onCancel} className="button-secondary">Cancel</button>
    </div>
  </div>
);
}

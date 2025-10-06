// src/components/student/StudentSubmissionModal.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuthStore } from "../../store/authStore";
import { toast } from "react-toastify";

export default function StudentSubmissionModal({ testId, isOpen, onClose }) {
  const { token } = useAuthStore();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);

  const Modal = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-[#1f2937] rounded-2xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-600 hover:text-red-500 text-xl"
          >
            ✖
          </button>
          {children}
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (!isOpen) return;

    const fetchSubmission = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/student/submission/${testId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setSubmission(res.data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch submission data");
      } finally {
        setLoading(false);
      }
    };

    fetchSubmission();
  }, [isOpen, testId, token]);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {loading ? (
        <div className="flex justify-center items-center h-64 text-yellow-700 text-lg font-semibold">
          Loading submission...
        </div>
      ) : submission ? (
        <div className="space-y-6">
          {/* Header */}
          <div className="border-b border-gray-200 pb-4">
            <h2 className="text-2xl font-bold text-yellow-800">
              {submission.testName}
            </h2>
            <p className="text-gray-600">
              Category: {submission.category} | Marks:{" "}
              {submission.result.score}/{submission.result.outOfMarks}
            </p>
            <p className="text-gray-600">
              Duration Taken: {Math.floor(submission.result.durationTaken / 60)}{" "}
              min {submission.result.durationTaken % 60} sec
            </p>
            <p className="text-gray-500 text-sm">
              Attempted at:{" "}
              {new Date(submission.result.attemptedAt).toLocaleString()}
            </p>
          </div>

          {/* Questions */}
          <div className="space-y-4">
            {submission.questions.map((q, i) => {
              const ans = submission.result.answers[i];
              const correct = ans?.isCorrect;
              const chosen = ans?.chosenOption ?? null;
              const correctAnswer = q.answer;

              return (
                <div
                  key={i}
                  className={`p-4 rounded-xl border shadow-sm ${
                    correct
                      ? "border-green-400 bg-green-50"
                      : "border-red-400 bg-red-50"
                  }`}
                >
                  <h3 className="font-semibold text-gray-800 mb-2">
                    Q{i + 1}. {q.question}
                  </h3>
                  <div className="space-y-2">
                    {q.options.map((opt, idx) => {
                      const isChosen = chosen === idx;
                      const isCorrect = idx === correctAnswer;
                      return (
                        <div
                          key={idx}
                          className={`px-3 py-2 rounded-md border ${
                            isCorrect
                              ? "border-green-500 bg-green-100"
                              : isChosen
                              ? "border-blue-500 bg-blue-100"
                              : "border-gray-300 bg-white"
                          }`}
                        >
                          <span className="font-medium text-gray-800">
                            {String.fromCharCode(65 + idx)}.
                          </span>{" "}
                          {opt}
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3">
                    {correct ? (
                      <span className="text-green-700 font-semibold">
                        ✅ Correct
                      </span>
                    ) : (
                      <span className="text-red-700 font-semibold">
                        ❌ Incorrect
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500 py-10">
          No submission data found.
        </div>
      )}
    </Modal>
  );
}

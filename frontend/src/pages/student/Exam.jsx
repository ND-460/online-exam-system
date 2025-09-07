import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
// import MonacoEditor from "react-monaco-editor";
import { useParams } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/ReactToastify.css";
const paletteColors = {
  notVisited: "bg-gray-500",
  answered: "bg-green-500",
  review: "bg-purple-500",
  notAnswered: "bg-red-500",
};

function formatTime(secs) {
  const m = Math.floor(secs / 60)
    .toString()
    .padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function Exam() {
  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [palette, setPalette] = useState([]);
  const [review, setReview] = useState([]);
  const [showInstructions, setShowInstructions] = useState(false);

  const [showSubmit, setShowSubmit] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [tabWarnings, setTabWarnings] = useState(0);
  const timerRef = useRef();
  const { token, user } = useAuthStore();
  const navigate = useNavigate();
  const { testId } = useParams();
  // console.log(testId)
  const [questions, setQuestions] = useState([]);
  const [examInfo, setExamInfo] = useState({
    title: "",
    subject: "",
    totalQuestions: 0,
    totalMarks: 0,
    timeLimit: 0,
    instructions: [],
  });
  const [timer, setTimer] = useState(null);
  // Timer logic
  useEffect(() => {
    if (!started || timer === null) return;
    if (timer <= 0) {
      clearTimeout(timerRef.current);
      toast.info("Time’s up! Auto-submitting your test...");
      handleSubmit();
      return;
    }
    timerRef.current = setTimeout(() => setTimer((t) => t - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [timer, started]);

  // Strict mode: disable right-click, copy, paste
  useEffect(() => {
    const prevent = (e, contxt) => {
      e.preventDefault();
      toast.warning(`Warning: ${contxt} occurred`);
    };

    const handleContextMenu = (e) => prevent(e, "context menu");
    const handleCopy = (e) => prevent(e, "copy");
    const handlePaste = (e) => prevent(e, "paste");

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
    };
  }, []);

  // Strict mode: tab switch warning
  useEffect(() => {
    const onBlur = () => {
      setTabWarnings((w) => {
        if (w >= 2) setShowSubmit(true);
        return w + 1;
      });
    };
    window.addEventListener("blur", onBlur);
    return () => window.removeEventListener("blur", onBlur);
  }, []);

  // Fullscreen logic
  useEffect(() => {
    const enterFullscreen = async () => {
      try {
        if (fullscreen && !document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
        } else if (!fullscreen && document.fullscreenElement) {
          await document.exitFullscreen();
        }
      } catch (err) {
        console.error("Fullscreen error:", err);
      }
    };
    enterFullscreen();
  }, [fullscreen]);
  // Prevent exit fullscreen
  useEffect(() => {
    const handleExit = () => {
      if (!document.fullscreenElement && fullscreen) {
        // re-enter fullscreen if user pressed Esc or tried to exit
        document.documentElement.requestFullscreen().catch((err) => {
          console.error("Re-enter fullscreen failed:", err);
          toast.warning("Warning: FullScreen Exited");
        });
      }
    };

    document.addEventListener("fullscreenchange", handleExit);
    return () => document.removeEventListener("fullscreenchange", handleExit);
  }, [fullscreen]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        setTabWarnings((w) => {
          const newWarnings = w + 1;
          toast.warning(`Warning: Tab switch detected (${newWarnings})`);
          if (newWarnings >= 3) {
            toast.error("Too many violations! Auto-submitting...");
            handleSubmit();
          }
          return newWarnings;
        });
      }
    };

    const handleKeyDown = (e) => {
      if (
        e.key === "F12" ||
        (e.ctrlKey &&
          e.shiftKey &&
          ["I", "J", "C"].includes(e.key.toUpperCase())) ||
        (e.ctrlKey &&
          ["S", "U", "C", "X", "V", "R", "P"].includes(e.key.toUpperCase())) ||
        e.key === "F5"
      ) {
        e.preventDefault();
        toast.warning("Warning: Restricted key pressed");
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Palette update
  useEffect(() => {
    setPalette((prev) =>
      prev.map((color, idx) => {
        if (idx === current) {
          if (answers[idx] !== undefined && !review.includes(idx))
            return "answered";
          if (review.includes(idx)) return "review";
          return color === "notVisited" ? "notAnswered" : color;
        }
        return color;
      })
    );
  }, [current, answers, review]);
  //fetch test from backend
  useEffect(() => {
    const fetchTest = async () => {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/student/test/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const test = res.data;

      const formattedQuestions = (test.questions || []).map((q) => ({
        ...q,
        type: test.category.toLowerCase(),
        marks: q.marks || 1,
      }));

      setQuestions(formattedQuestions);
      setExamInfo({
        title: test.testName,
        subject: test.category,
        totalQuestions: formattedQuestions.length,
        totalMarks: formattedQuestions.reduce((sum, q) => sum + q.marks, 0),
        timeLimit: (test.minutes || 30) * 60,
        instructions: test.rules || [
          "Do not refresh or close the tab during the exam.",
        ],
      });
      setPalette(formattedQuestions.map(() => "notVisited"));
      setTimer((test.minutes || 30) * 60);
    };
    fetchTest();
  }, [testId, token]);

  // Question navigation
  const goTo = (idx) => setCurrent(idx);
  const markForReview = () => setReview((r) => [...new Set([...r, current])]);
  const clearAnswer = () => {
    setAnswers((a) => {
      const copy = { ...a };
      delete copy[current];
      return copy;
    });
    setReview((r) => r.filter((i) => i !== current));
  };
  const saveAnswer = (val) => {
    setAnswers((a) => ({ ...a, [current]: val }));
    setReview((r) => r.filter((i) => i !== current));
  };

  // Render question
  const q = questions[current];
  function renderQuestion() {
    if (!q) return null;
    if (q.type === "mcq") {
      return (
        <div>
          <div className="mb-4 text-lg font-semibold text-white">
            {q.question}
          </div>
          <div className="flex flex-col gap-2">
            {q.options.map((opt, i) => (
              <label
                key={i}
                className="flex items-center gap-2 cursor-pointer text-white"
              >
                <input
                  type="radio"
                  name={`mcq-${q.id}`}
                  checked={answers[current] === i}
                  onChange={() => saveAnswer(i)}
                  className="accent-blue-500 w-5 h-5"
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        </div>
      );
    }
    if (q.type === "multi") {
      return (
        <div>
          <div className="mb-4 text-lg font-semibold">{q.question}</div>
          <div className="flex flex-col gap-2">
            {q.options.map((opt, i) => (
              <label key={i} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={
                    Array.isArray(answers[current]) &&
                    answers[current].includes(i)
                  }
                  onChange={() => {
                    let arr = Array.isArray(answers[current])
                      ? [...answers[current]]
                      : [];
                    if (arr.includes(i)) arr = arr.filter((x) => x !== i);
                    else arr.push(i);
                    saveAnswer(arr);
                  }}
                  className="accent-blue-500 w-5 h-5"
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        </div>
      );
    }
    if (q.type === "tf") {
      return (
        <div>
          <div className="mb-4 text-lg font-semibold">{q.question}</div>
          <div className="flex gap-6">
            {[true, false].map((val, i) => (
              <button
                key={val.toString()}
                onClick={() => saveAnswer(val)}
                className={`px-6 py-2 rounded-lg font-semibold border-2 transition-all duration-150 ${
                  answers[current] === val
                    ? "bg-blue-500 border-blue-500 text-white"
                    : "bg-[#181f2e] border-blue-700 text-blue-200"
                }`}
              >
                {val ? "True" : "False"}
              </button>
            ))}
          </div>
        </div>
      );
    }
    if (q.type === "fill") {
      return (
        <div>
          <div className="mb-4 text-lg font-semibold">{q.question}</div>
          <input
            type="text"
            value={answers[current] || ""}
            onChange={(e) => saveAnswer(e.target.value)}
            className="w-full bg-[#181f2e] border border-blue-700 rounded-md px-4 py-3 text-white text-lg"
            placeholder="Your answer"
          />
        </div>
      );
    }
    if (q.type === "code") {
      return (
        <div>
          <div className="mb-4 text-lg font-semibold">{q.question}</div>
          <select
            className="mb-2 bg-[#181f2e] border border-blue-700 rounded-md px-3 py-2 text-white"
            defaultValue={q.language}
          >
            <option>python</option>
            <option>javascript</option>
            <option>cpp</option>
          </select>
          {/* <MonacoEditor language={q.language} value={answers[current] || q.starter} onChange={val => saveAnswer(val)} /> */}
          <textarea
            className="w-full bg-[#181f2e] border border-blue-700 rounded-md px-4 py-3 text-white text-lg min-h-[120px]"
            value={answers[current] || q.starter}
            onChange={(e) => saveAnswer(e.target.value)}
          />
        </div>
      );
    }
    return null;
  }

  // Palette color logic
  function getPaletteColor(idx) {
    if (palette[idx] === "answered") return paletteColors.answered;
    if (palette[idx] === "review") return paletteColors.review;
    if (palette[idx] === "notAnswered") return paletteColors.notAnswered;
    return paletteColors.notVisited;
  }

  // Submit logic
  async function handleSubmit() {
    try {
      const payload = {
        answers: answers,
      };

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/student/attempt-test/${testId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // alert(res.data.message || "Test submitted successfully!");
      toast.success("Test submitted successfully!");

      navigate("/student");
    } catch (err) {
      console.error("Error submitting test:", err);
      // alert(err.response?.data?.message || "Failed to submit test");
      toast.error("Failed to submit test!");
    }
  }
  if (!started) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#151e2e]">
        <div className="p-8 bg-[#232f4b] rounded-2xl text-center text-white max-w-lg">
          <h1 className="text-2xl font-bold mb-4">{examInfo.title}</h1>
          <p className="mb-4 text-blue-200">
            You have {Math.floor(examInfo.timeLimit / 60)} minutes. Once
            started, the timer cannot be paused.
          </p>
          <ul className="list-disc text-left text-sm text-blue-300 mb-6 ml-6">
            {examInfo.instructions.map((ins, i) => (
              <li key={i}>{ins}</li>
            ))}
          </ul>
          <button
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-md font-semibold"
            onClick={() => {
              setStarted(true);
              setFullscreen(true);
            }}
          >
            Start Test
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#151e2e] to-[#1a2236] flex flex-col">
      {/* Exam Info Top Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center px-6 py-4 border-b border-blue-900 bg-[#181f2e] sticky top-0 z-20">
        <div>
          <div className="text-2xl font-bold text-white mb-1">
            {examInfo.title}
          </div>
          <div className="text-blue-300 text-sm mb-2">{examInfo.subject}</div>
          <div className="flex gap-6 text-blue-200 text-xs">
            <span>Total Questions: {examInfo.totalQuestions}</span>
            <span>Total Marks: {examInfo.totalMarks}</span>
            <span>Time Limit: {Math.floor(examInfo.timeLimit / 60)} min</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 ml-auto">
          <div
            className={`text-lg font-bold ${
              timer < 300 ? "text-red-400 animate-pulse" : "text-blue-400"
            }`}
          >
            {formatTime(timer)}
          </div>
          <button
            className="text-xs text-blue-300 underline"
            onClick={() => setShowInstructions((v) => !v)}
          >
            {showInstructions ? "Hide Instructions" : "Show Instructions"}
          </button>
        </div>
      </div>
      {/* Collapsible Instructions */}
      <AnimatePresence>
        {showInstructions && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-[#232f4b] text-blue-100 px-6 py-4 border-b border-blue-900"
          >
            <ul className="list-disc ml-6">
              {examInfo.instructions.map((ins, i) => (
                <li key={i}>{ins}</li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Main Question Panel */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-2xl bg-gradient-to-br from-black via-[#181f2e] to-[#232f4b] rounded-3xl p-8 border-2 border-[#232f4b] shadow-2xl min-h-[260px] flex flex-col"
            >
              {renderQuestion()}
              {/* Navigation Buttons */}
              <div className="flex flex-wrap gap-4 mt-8 justify-between">
                <button
                  className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-2 rounded-md font-semibold"
                  onClick={() => setCurrent((c) => Math.max(0, c - 1))}
                  disabled={current === 0}
                >
                  Previous
                </button>
                <div className="flex gap-2 flex-wrap">
                  <button
                    className="bg-purple-700 hover:bg-purple-800 text-white px-4 py-2 rounded-md font-semibold"
                    onClick={markForReview}
                  >
                    Mark for Review
                  </button>
                  <button
                    className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-md font-semibold"
                    onClick={clearAnswer}
                  >
                    Clear Answer
                  </button>
                </div>
                <button
                  className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-2 rounded-md font-semibold"
                  onClick={() =>
                    setCurrent((c) => Math.min(questions.length - 1, c + 1))
                  }
                  disabled={current === questions.length - 1}
                >
                  Next
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
        {/* Sidebar / Palette */}
        <div className="w-full md:w-64 bg-[#181f2e] border-l border-blue-900 flex flex-col items-center py-8 px-2 md:sticky md:top-0">
          <div className="font-bold text-blue-200 mb-4">Question Palette</div>
          <div className="grid grid-cols-5 md:grid-cols-3 gap-2">
            {questions.map((_, idx) => (
              <button
                key={idx}
                className={`w-10 h-10 rounded-full text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-400 ${getPaletteColor(
                  idx
                )} transition-all duration-150`}
                onClick={() => goTo(idx)}
              >
                {idx + 1}
              </button>
            ))}
          </div>
          <div className="mt-6 flex flex-col gap-2 text-xs text-blue-300">
            <div>
              <span className="inline-block w-3 h-3 rounded-full bg-gray-500 mr-2"></span>
              Not Visited
            </div>
            <div>
              <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-2"></span>
              Answered
            </div>
            <div>
              <span className="inline-block w-3 h-3 rounded-full bg-purple-500 mr-2"></span>
              Marked for Review
            </div>
            <div>
              <span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-2"></span>
              Not Answered
            </div>
          </div>
        </div>
      </div>
      {/* Footer Controls */}
      <div className="sticky bottom-0 left-0 w-full bg-[#181f2e] border-t border-blue-900 flex flex-col md:flex-row items-center justify-between px-6 py-4 z-30">
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-md font-bold text-lg mb-2 md:mb-0"
          onClick={() =>
            setCurrent((c) => Math.min(questions.length - 1, c + 1))
          }
        >
          Save & Next
        </button>
        <button
          className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-md font-bold text-lg"
          onClick={() => setShowSubmit(true)}
        >
          Submit Test
        </button>
      </div>
      {/* Submit Modal */}
      <AnimatePresence>
        {showSubmit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          >
            <div className="bg-[#232f4b] rounded-2xl p-8 max-w-md w-full text-center border-2 border-blue-400">
              <div className="text-xl font-bold text-white mb-4">
                Submit Test?
              </div>
              <div className="text-blue-200 mb-6">
                Are you sure you want to submit? You cannot change your answers
                after this.
              </div>
              <div className="flex gap-4 justify-center">
                <button
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md font-semibold"
                  onClick={() => setShowSubmit(false)}
                >
                  Cancel
                </button>
                <button
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md font-semibold"
                  onClick={handleSubmit}
                >
                  Confirm & Submit
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

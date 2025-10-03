import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
// import MonacoEditor from "react-monaco-editor";
import { useParams } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/ReactToastify.css";
import "./Exam.css"
import shuffleArray from "../../../../utils/shuffleArray";
const paletteColors = {
  notVisited: "bg-yellow-200",
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
  const [violationCount, setViolationCount] = useState(0);
  const VIOLATION_THRESHOLD = 3;

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
  const submittingRef = useRef(false);
  const addViolation = (reason) => {
    setViolationCount((prev) => {
      const updated = prev + 1;
      toast.warning(
        `Warning: ${reason} (Attempt ${updated}/${VIOLATION_THRESHOLD})`
      );
      if (updated >= VIOLATION_THRESHOLD && !submittingRef.current) {
        toast.error("Too many violations! Auto-submitting...");
        handleSubmit();
      }
      return updated;
    });
  };

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
    if (!started) return;
    const prevent = (e, contxt) => {
      e.preventDefault();
      addViolation(contxt);
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
  }, [started]);

  // Strict mode: tab switch warning
  useEffect(() => {
    if (!started) return;
    const onBlur = () => addViolation("Tab switch/blur detected");

    window.addEventListener("blur", onBlur);
    return () => window.removeEventListener("blur", onBlur);
  }, [started]);

  // Fullscreen logic
  useEffect(() => {
    if (!started) return;
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
  }, [fullscreen, started]);

  useEffect(() => {
    if (!started) return;
    const interval = setInterval(() => {
      if (!document.hasFocus()) {
        addViolation("Focus lost (other site or app)");
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [started]);

  // Prevent exit fullscreen
  useEffect(() => {
    if (!started) return;
    const handleExit = () => {
      if (!document.fullscreenElement && fullscreen) {
        document.documentElement.requestFullscreen().catch((err) => {
          console.error("Re-enter fullscreen failed:", err);
          addViolation("Fullscreen exit attempt");
        });
      }
    };

    document.addEventListener("fullscreenchange", handleExit);
    return () => document.removeEventListener("fullscreenchange", handleExit);
  }, [fullscreen, started]);

  useEffect(() => {
    if (!started) return;
    const handleVisibility = () => {
      if (document.hidden) addViolation("Tab switch detected");
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
        addViolation("Restricted key pressed");
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [started]);

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

      let formattedQuestions = (test.questions || []).map((q) => ({
        ...q,
        type: test.category.toLowerCase(),
        marks: q.marks || 1,
      }));

      // 🔀 Shuffle question order once
    formattedQuestions = shuffleArray(formattedQuestions);

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
          <div className="mb-4 text-lg font-semibold text-yellow-800">
            {q.question}
          </div>
          <div className="flex items-center gap-4 mb-4 text-sm text-yellow-800">
            <span>
              Marks:{" "}
              <span className="font-semibold text-yellow-600">{q.marks}</span>
            </span>
            <span>
              Difficulty:{" "}
              <span className="font-semibold capitalize text-yellow-600">
                {q.difficulty}
              </span>
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {q.options.map((opt, i) => (
              <label
                key={i}
                className="flex items-center gap-2 cursor-pointer text-yellow-800"
              >
                <input
                  type="radio"
                  name={`mcq-${q.id}`}
                  checked={answers[current] === i}
                  onChange={() => saveAnswer(i)}
                  className="accent-yellow-600 w-5 h-5"
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
    if (submittingRef.current) return;
    submittingRef.current = true;
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="p-8 bg-yellow-900 rounded-2xl text-center text-white max-w-lg shadow-lg">
          <h1 className="text-2xl font-bold mb-4">{examInfo.title}</h1>
          <p className="mb-4 text-white">
            You have {Math.floor(examInfo.timeLimit / 60)} minutes. Once
            started, the timer cannot be paused.
          </p>
          <ul className="list-disc text-left text-sm text-white mb-6 ml-6">
            {examInfo.instructions.map((ins, i) => (
              <li key={i}>{ins}</li>
            ))}
          </ul>
          <button
            className="bg-yellow-600 hover:bg-yellow-700 px-6 py-3 rounded-md font-semibold text-white"
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
    <div className="min-h-screen bg-white flex flex-col">
      {/* Exam Info Top Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center px-6 py-4 border-b border-yellow-300 sticky top-0 z-20 bg-white">
        <div>
          <div className="text-2xl font-bold text-yellow-800 mb-1">
            {examInfo.title}
          </div>
          <div className="text-yellow-800 text-sm mb-2">{examInfo.subject}</div>
          <div className="flex gap-6 text-yellow-800 text-xs">
            <span>Total Questions: {examInfo.totalQuestions}</span>
            <span>Total Marks: {examInfo.totalMarks}</span>
            <span>Time Limit: {Math.floor(examInfo.timeLimit / 60)} min</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 ml-auto">
          <div
            className={`text-lg font-bold ${
              timer < 300 ? "text-red-400 animate-pulse" : "text-yellow-800"
            }`}
          >
            {formatTime(timer)}
          </div>
          <button
            className="text-xs text-yellow-800 underline"
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
            className="overflow-hidden bg-white text-yellow-800 px-6 py-4 border-b border-yellow-300"
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
<div className="main-content">
  {/* Main Question Panel */}
  <div className="question-panel">
    <AnimatePresence mode="wait">
      <motion.div
        key={current}
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -40 }}
        transition={{ duration: 0.3 }}
        className="question-box"
      >
        {renderQuestion()}

        {/* Navigation Buttons */}
        <div className="nav-buttons">
          <button
            className="btn prev"
            onClick={() => setCurrent((c) => Math.max(0, c - 1))}
            disabled={current === 0}
          >
            Previous
          </button>
          <div className="middle-buttons">
            <button className="btn action" onClick={markForReview}>
              Mark for Review
            </button>
            <button className="btn action" onClick={clearAnswer}>
              Clear Answer
            </button>
          </div>
          <button
            className="btn next"
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
  <div className="sidebar">
    <div className="sidebar-title">Question Palette</div>

    <div className="palette">
      {questions.map((_, idx) => (
        <button
          key={idx}
          className={`palette-btn ${getPaletteColor(idx)}`}
          onClick={() => goTo(idx)}
        >
          {idx + 1}
        </button>
      ))}
    </div>

    <div className="legend">
      <div><span className="dot not-visited"></span> Not Visited</div>
      <div><span className="dot answered"></span> Answered</div>
      <div><span className="dot review"></span> Marked for Review</div>
      <div><span className="dot not-answered"></span> Not Answered</div>
    </div>
  </div>
</div>

      {/* Footer Controls */}
<div className="footer-controls">
  <button
    className="btn save-next"
    onClick={() =>
      setCurrent((c) => Math.min(questions.length - 1, c + 1))
    }
  >
    Save & Next
  </button>
  <button className="btn submit-test" onClick={() => setShowSubmit(true)}>
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
            <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center border-2 border-yellow-300">
              <div className="text-xl font-bold text-yellow-800 mb-4">
                Submit Test?
              </div>
              <div className="text-yellow-800 mb-6">
                Are you sure you want to submit? You cannot change your answers
                after this.
              </div>
              <div className="flex gap-4 justify-center">
                <button
                  className="bg-yellow-600 hover:bg-yellow-500 text-white px-6 py-2 rounded-md font-semibold"
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

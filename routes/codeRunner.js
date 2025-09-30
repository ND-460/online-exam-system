const express = require("express");
const axios =  require("axios");
const AIService = require("../utils/aiService");
const router = express.Router();
// Judge0 API base
const JUDGE0_API = "https://judge0-ce.p.rapidapi.com/submissions";

// Replace with your RapidAPI key if using RapidAPI Judge0
const JUDGE0_HEADERS = {
  "content-type": "application/json",
  "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
  "X-RapidAPI-Key": process.env.RAPIDAPI_KEY, // store in .env
};

// Language IDs (Judge0 specific)
const languageIds = {
  JavaScript: 63, // Node.js 18
  Python: 71,     // Python 3.11
  "C++": 54,      // C++ (GCC 9.2)
  Java: 62,       // Java (OpenJDK 13)
};

router.post("/run", async (req, res) => {
  const { language, code } = req.body;

  try {
    const response = await axios.post(
      `${JUDGE0_API}?base64_encoded=false&wait=true`,
      {
        source_code: code,
        language_id: languageIds[language],
      },
      { headers: JUDGE0_HEADERS }
    );

    const result = response.data;
    res.json({
      stdout: result.stdout,
      stderr: result.stderr,
      compile_output: result.compile_output,
      message: result.message,
    });
  } catch (err) {
    console.error("Judge0 Error:", err.message);
    res.status(500).json({ error: "Code execution failed" });
  }
});

router.post("/generate", async (req, res) => {
  try {
    const { prompt, options } = req.body;
    const q = await AIService.generateCodingQuestion(prompt, options);

    if (!q) {
      return res.status(500).json({ error: "No questions generated" });
    }

    const normalized = {
      title: q.title || "Untitled Problem",
      description: q.description || "No description provided",
      constraints: q.constraints || "No constraints",
      samples: q.samples || [],
      hiddenTests: q.hiddenTests || [],
      template: q.template || null,
    };

    res.json({ question: normalized });
  } catch (error) {
    console.error("Question generation failed:", error);
    res.status(500).json({ error: "Failed to generate question" });
  }
});

module.exports = router;
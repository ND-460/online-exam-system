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

router.post('/generate', async (req, res) => {
  try {
    const { prompt, options } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const questions = await AIService.generateQuestionsFromPrompt(prompt, options || {});
    res.json({ questions });
  } catch (err) {
    console.error("AI generation error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
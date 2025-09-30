const { GoogleGenAI } = require("@google/genai");

const { HfInference } = require("@huggingface/inference");
const OpenAI = require("openai");
require("dotenv").config();

class AIService {
  constructor() {
    this.provider = process.env.AI_PROVIDER || "local"; // Default to local if no provider set

    try {
      if (this.provider === "openai" && process.env.OPENAI_API_KEY) {
        this.openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });
      } else if (this.provider === "gemini" && process.env.GEMINI_API_KEY) {
        this.gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      } else if (
        this.provider === "huggingface" &&
        process.env.HUGGINGFACE_API_KEY
      ) {
        this.hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
      } else {
        console.log("No AI API key found, using local mode");
        this.provider = "local";
      }
    } catch (error) {
      console.log(
        "AI service initialization failed, falling back to local mode"
      );
      this.provider = "local";
    }
  }

  async generateQuestionsFromKeywords(keywords, options = {}) {
    const {
      numQuestions = 5,
      difficulty = "medium",
      questionType = "multiple-choice",
      subject = "general",
    } = options;

    let prompt;
    if (questionType === "descriptive") {
      prompt = `Generate ${numQuestions} ${difficulty} difficulty descriptive questions based on these keywords: ${keywords.join(
        ", "
      )}.
      
      For each question, provide:
      1. A clear, well-structured descriptive question that requires detailed explanation
      2. The question should test understanding, analysis, or application of concepts
      
      Format the response as a JSON array with this structure:
      [
        {
          "question": "Question text here?",
          "type": "descriptive",
          "points": 10
        }
      ]
      
      Subject context: ${subject}
      Ensure questions are educational, thought-provoking, and require comprehensive answers.`;
    } else {
      prompt = `Generate ${numQuestions} ${difficulty} difficulty multiple-choice questions based on these keywords: ${keywords.join(
        ", "
      )}.
      
      For each question, provide:
      1. A clear, well-structured question
      2. Four diverse and meaningful multiple choice options (A, B, C, D)
      3. The correct answer (as a number 0-3, where 0=A, 1=B, 2=C, 3=D)
      
      Format the response as a JSON array with this structure:
      [
        {
          "question": "Question text here?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "answer": 0,
          "type": "multiple-choice"
        }
      ]
      
      Subject context: ${subject}
      Ensure questions are educational, accurate, and test understanding of the concepts. Make options realistic and avoid repetitive choices.`;
    }

    try {
      console.log(`Using AI provider: ${this.provider}`);
      console.log(`Keywords received:`, keywords);
      console.log(`Options received:`, options);

      if (this.provider === "openai" && this.openai) {
        return await this.generateWithOpenAI(prompt);
      } else if (this.provider === "gemini" && this.gemini) {
        return await this.generateWithGemini(prompt);
      } else if (this.provider === "huggingface" && this.hf) {
        return await this.generateWithHuggingFace(prompt);
      } else {
        console.log("Falling back to local generation");
        return await this.generateWithLocal(keywords, options);
      }
    } catch (error) {
      console.error("Error generating questions from keywords:", error);
      // Always fallback to local generation if AI fails
      console.log("Attempting local fallback generation");
      try {
        return await this.generateWithLocal(keywords, options);
      } catch (localError) {
        console.error("Local generation also failed:", localError);
        throw new Error("All question generation methods failed");
      }
    }
  }

  async generateQuestionsFromPrompt(prompt, options = {}) {
    const {
      numQuestions = 5,
      difficulty = "medium",
      questionType = "multiple-choice",
    } = options;

    let fullPrompt;
    if (questionType === "descriptive") {
      fullPrompt = `Generate ${numQuestions} ${difficulty} difficulty descriptive questions based on this prompt: "${prompt}".
      
      For each question, provide:
      1. A clear, well-structured descriptive question that requires detailed explanation
      2. The question should test understanding, analysis, or application of concepts
      
      Format the response as a JSON array with this structure:
      [
        {
          "question": "Question text here?",
          "type": "descriptive",
          "points": 10
        }
      ]
      
      Ensure questions are educational, thought-provoking, and require comprehensive answers.`;
    } else {
      fullPrompt = `Generate ${numQuestions} ${difficulty} difficulty multiple-choice questions based on this prompt: "${prompt}".
      
      For each question, provide:
      1. A clear, well-structured question
      2. Four diverse and meaningful multiple choice options (A, B, C, D)
      3. The correct answer (as a number 0-3, where 0=A, 1=B, 2=C, 3=D)
      
      Format the response as a JSON array with this structure:
      [
        {
          "question": "Question text here?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "answer": 0,
          "type": "multiple-choice"
        }
      ]
      
      Ensure questions are educational, accurate, and test understanding of the concepts. Make options realistic and avoid repetitive choices.`;
    }

    try {
      console.log(`Using AI provider: ${this.provider}`);
      console.log(`Prompt received:`, prompt);
      console.log(`Options received:`, options);

      if (this.provider === "openai" && this.openai) {
        return await this.generateWithOpenAI(fullPrompt);
      } else if (this.provider === "gemini" && this.gemini) {
        return await this.generateWithGemini(fullPrompt);
      } else if (this.provider === "huggingface" && this.hf) {
        return await this.generateWithHuggingFace(fullPrompt);
      } else {
        console.log("Falling back to local generation");
        // For local generation, extract keywords from prompt
        const keywords = prompt.split(" ").filter((word) => word.length > 3);
        return await this.generateWithLocal(keywords, options);
      }
    } catch (error) {
      console.error("Error generating questions from prompt:", error);
      // Always fallback to local generation if AI fails
      console.log("Attempting local fallback generation");
      try {
        const keywords = prompt.split(" ").filter((word) => word.length > 3);
        return await this.generateWithLocal(keywords, options);
      } catch (localError) {
        console.error("Local generation also failed:", localError);
        throw new Error("All question generation methods failed");
      }
    }
  }

  async enhanceQuestions(questions, context = "") {
    const prompt = `Improve and enhance these exam questions while maintaining their educational value:

${JSON.stringify(questions, null, 2)}

Context: ${context}

Requirements:
1. Ensure all questions are clear and unambiguous
2. Verify that options are distinct and plausible
3. Make sure correct answers are accurate
4. Improve question wording for better clarity
5. Ensure appropriate difficulty level

Return the enhanced questions in the same JSON format.`;

    try {
      if (this.provider === "openai" && this.openai) {
        return await this.generateWithOpenAI(prompt);
      } else if (this.provider === "gemini") {
        return await this.generateWithGemini(prompt);
      } else if (this.provider === "huggingface") {
        return await this.generateWithHuggingFace(prompt);
      } else {
        return questions; // Return original if no AI provider
      }
    } catch (error) {
      console.error("Error enhancing questions:", error);
      return questions; // Return original questions if enhancement fails
    }
  }

  // OpenAI implementation
  async generateWithOpenAI(prompt) {
    try {
      const enhancedPrompt = `${prompt}

IMPORTANT: Respond ONLY with valid JSON array. No additional text, explanations, or markdown formatting.`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are an expert question generator. Always respond with valid JSON arrays containing educational questions.",
          },
          {
            role: "user",
            content: enhancedPrompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      });

      const response = completion.choices[0].message.content;
      const cleanText = response.trim().replace(/```json|```/g, "");

      // Extract JSON from response
      const jsonMatch = cleanText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        try {
          return JSON.parse(cleanText);
        } catch (parseError) {
          console.error("Failed to parse OpenAI response:", cleanText);
          throw new Error("Invalid response format from OpenAI");
        }
      }
    } catch (error) {
      console.error("OpenAI API error:", error);
      throw error;
    }
  }

  // Google Gemini implementation (FREE with API key)
  async generateWithGemini(prompt) {
    try {
      const enhancedPrompt = `${prompt}

IMPORTANT: Respond ONLY with valid JSON array. No additional text or markdown.`;

      const response = await this.gemini.models.generateContent({
        model: "gemini-2.0-flash",
        contents: enhancedPrompt,
      });

      const text = response.text.trim().replace(/```json|```/g, "");
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
      return JSON.parse(text);
    } catch (error) {
      console.error("Gemini API error:", error);
      throw error;
    }
  }

  // Hugging Face implementation (FREE with API key)
  async generateWithHuggingFace(prompt) {
    try {
      // Use a better model for question generation
      const response = await this.hf.textGeneration({
        model: "google/flan-t5-base",
        inputs: prompt,
        parameters: {
          max_new_tokens: 500,
          temperature: 0.7,
          return_full_text: false,
        },
      });

      // Parse the response and extract JSON
      const text = response.generated_text || response;
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No valid JSON found in HuggingFace response");
      }
    } catch (error) {
      console.error("Hugging Face API error:", error);
      throw error; // Let the main function handle fallback
    }
  }

  // Local/Offline implementation (NO API KEY REQUIRED)
  async generateWithLocal(keywords, options = {}) {
    const {
      numQuestions = 5,
      difficulty = "medium",
      subject = "general",
      questionType = "multiple-choice",
    } = options;

    // Handle case where keywords might be a string or array
    let keywordArray = Array.isArray(keywords) ? keywords : [keywords];

    // If no keywords provided, generate generic questions
    if (!keywordArray || keywordArray.length === 0) {
      keywordArray = [subject, "concept", "theory", "principle", "method"];
    }

    const questions = [];

    if (questionType === "descriptive") {
      return this.generateDescriptiveQuestions(keywordArray, options);
    } else if (questionType === "mixed") {
      return this.generateMixedQuestions(keywordArray, options);
    } else {
      return this.generateMCQQuestions(keywordArray, options);
    }
  }

  generateDescriptiveQuestions(keywords, options) {
    const {
      numQuestions = 5,
      difficulty = "medium",
      subject = "general",
    } = options;

    const descriptiveTemplates = {
      easy: [
        "Explain what {keyword} means in simple terms.",
        "Describe the basic concept of {keyword}.",
        "What is {keyword} and why is it important?",
        "Define {keyword} and give an example.",
        "How would you explain {keyword} to a beginner?",
      ],
      medium: [
        "Discuss the role of {keyword} in {subject}.",
        "Explain how {keyword} works and its applications.",
        "Describe the advantages and disadvantages of {keyword}.",
        "How does {keyword} impact modern {subject}?",
        "Analyze the importance of {keyword} in today's context.",
      ],
      hard: [
        "Critically evaluate the effectiveness of {keyword} in {subject}.",
        "Compare and contrast {keyword} with alternative approaches.",
        "Discuss the future implications of {keyword} in {subject}.",
        "Analyze the challenges and solutions related to {keyword}.",
        "How would you improve or modify {keyword} for better outcomes?",
      ],
    };

    const templates =
      descriptiveTemplates[difficulty] || descriptiveTemplates.medium;
    const questions = [];

    for (let i = 0; i < numQuestions; i++) {
      const keyword = keywords[i % keywords.length];
      const template = templates[i % templates.length];
      const question = template
        .replace(/{keyword}/g, keyword)
        .replace(/{subject}/g, subject);

      questions.push({
        type: "Subjective",
        question: question,
      });
    }

    return questions;
  }

  generateMCQQuestions(keywords, options) {
    const {
      numQuestions = 5,
      difficulty = "medium",
      subject = "general",
    } = options;

    // Subject-specific question templates and options
    const subjectQuestions = this.getSubjectSpecificQuestions(
      subject,
      difficulty
    );

    const questions = [];

    for (let i = 0; i < numQuestions; i++) {
      const keyword = keywords[i % keywords.length];

      // Use subject-specific templates if available
      if (subjectQuestions.length > 0) {
        const template = subjectQuestions[i % subjectQuestions.length];
        const question = template.question.replace(/{keyword}/g, keyword);
        const options = template.options.map((opt) =>
          opt.replace(/{keyword}/g, keyword)
        );

        questions.push({
          type: "MCQ",
          question: question,
          options: options,
          answer: options[template.correctAnswer || 0],
        });
      } else {
        // Fallback to generic questions
        questions.push(this.generateGenericMCQ(keyword, subject, difficulty));
      }
    }

    return questions;
  }

  getSubjectSpecificQuestions(subject, difficulty) {
    const subjectLower = subject.toLowerCase();

    if (
      subjectLower.includes("programming") ||
      subjectLower.includes("computer") ||
      subjectLower.includes("software")
    ) {
      return this.getProgrammingQuestions(difficulty);
    } else if (
      subjectLower.includes("math") ||
      subjectLower.includes("calculus") ||
      subjectLower.includes("algebra")
    ) {
      return this.getMathQuestions(difficulty);
    } else if (
      subjectLower.includes("science") ||
      subjectLower.includes("physics") ||
      subjectLower.includes("chemistry")
    ) {
      return this.getScienceQuestions(difficulty);
    } else if (
      subjectLower.includes("history") ||
      subjectLower.includes("social")
    ) {
      return this.getHistoryQuestions(difficulty);
    }

    return [];
  }

  getProgrammingQuestions(difficulty) {
    if (difficulty === "easy") {
      return [
        {
          question: "What is {keyword} used for in programming?",
          options: [
            "Data storage and manipulation",
            "Only for decoration",
            "Hardware control only",
            "Network protocols only",
          ],
          correctAnswer: 0,
        },
        {
          question: "Which statement about {keyword} is correct?",
          options: [
            "It's a fundamental programming concept",
            "It's only used in web development",
            "It's deprecated in modern programming",
            "It's hardware-specific",
          ],
          correctAnswer: 0,
        },
      ];
    } else if (difficulty === "medium") {
      return [
        {
          question: "How does {keyword} improve code efficiency?",
          options: [
            "By optimizing memory usage and execution speed",
            "By making code longer",
            "By adding more complexity",
            "By removing all functions",
          ],
          correctAnswer: 0,
        },
        {
          question: "What is the main advantage of using {keyword}?",
          options: [
            "Better code organization and reusability",
            "Slower execution",
            "More memory consumption",
            "Increased complexity",
          ],
          correctAnswer: 0,
        },
      ];
    } else {
      return [
        {
          question: "In what scenarios would {keyword} be most beneficial?",
          options: [
            "Large-scale applications requiring optimization",
            "Simple hello world programs",
            "Only in legacy systems",
            "Never in modern development",
          ],
          correctAnswer: 0,
        },
      ];
    }
  }

  getMathQuestions(difficulty) {
    if (difficulty === "easy") {
      return [
        {
          question: "What does {keyword} represent in mathematics?",
          options: [
            "A mathematical concept or operation",
            "A type of calculator",
            "A measurement unit",
            "A geometric shape only",
          ],
          correctAnswer: 0,
        },
      ];
    } else if (difficulty === "medium") {
      return [
        {
          question: "How is {keyword} applied in problem-solving?",
          options: [
            "As a method to find solutions systematically",
            "Only for basic arithmetic",
            "Just for memorization",
            "Only in geometry",
          ],
          correctAnswer: 0,
        },
      ];
    } else {
      return [
        {
          question: "What are the advanced applications of {keyword}?",
          options: [
            "Complex mathematical modeling and analysis",
            "Simple addition only",
            "Basic counting",
            "Elementary operations",
          ],
          correctAnswer: 0,
        },
      ];
    }
  }

  getScienceQuestions(difficulty) {
    if (difficulty === "easy") {
      return [
        {
          question: "What is the basic principle behind {keyword}?",
          options: [
            "A natural phenomenon or scientific law",
            "A man-made invention only",
            "A fictional concept",
            "An outdated theory",
          ],
          correctAnswer: 0,
        },
      ];
    } else {
      return [
        {
          question:
            "How does {keyword} contribute to scientific understanding?",
          options: [
            "By explaining natural processes and phenomena",
            "By complicating simple concepts",
            "By replacing all other theories",
            "By contradicting established science",
          ],
          correctAnswer: 0,
        },
      ];
    }
  }

  getHistoryQuestions(difficulty) {
    return [
      {
        question: "What was the historical significance of {keyword}?",
        options: [
          "It influenced major historical developments",
          "It had no impact on history",
          "It only affected modern times",
          "It was purely fictional",
        ],
        correctAnswer: 0,
      },
    ];
  }

  generateMixedQuestions(keywords, options) {
    const {
      numQuestions = 5,
      difficulty = "medium",
      subject = "general",
    } = options;

    // Split questions between MCQ and Subjective (60% MCQ, 40% Subjective)
    const mcqCount = Math.ceil(numQuestions * 0.6);
    const subjectiveCount = numQuestions - mcqCount;

    const mcqQuestions = this.generateMCQQuestions(keywords, {
      ...options,
      numQuestions: mcqCount,
    });
    const subjectiveQuestions = this.generateDescriptiveQuestions(keywords, {
      ...options,
      numQuestions: subjectiveCount,
    });

    // Combine and shuffle questions
    const allQuestions = [...mcqQuestions, ...subjectiveQuestions];
    return this.shuffleArray(allQuestions);
  }

  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  generateGenericMCQ(keyword, subject, difficulty) {
    const templates = [
      "What is the primary purpose of {keyword}?",
      "Which best describes {keyword}?",
      "How does {keyword} function?",
      "What makes {keyword} important?",
    ];

    const optionSets = [
      [
        `Essential component in ${subject}`,
        `Outdated concept in ${subject}`,
        `Unrelated to ${subject}`,
        `Purely theoretical with no application`,
      ],
      [
        `Fundamental principle of ${subject}`,
        `Minor detail in ${subject}`,
        `Contradicts ${subject} basics`,
        `Only used in advanced ${subject}`,
      ],
      [
        `Key methodology in ${subject}`,
        `Rarely used approach`,
        `Completely obsolete method`,
        `Only for beginners in ${subject}`,
      ],
    ];

    const randomTemplate =
      templates[Math.floor(Math.random() * templates.length)];
    const randomOptions =
      optionSets[Math.floor(Math.random() * optionSets.length)];

    return {
      type: "MCQ",
      question: randomTemplate.replace(/{keyword}/g, keyword),
      options: randomOptions,
      answer: randomOptions[0],
    };
  }
   async generateCodingQuestion() {
    if (!this.gemini) {
      throw new Error("Gemini client not initialized");
    }

    const finalPrompt = `
You are a strict coding question generator.

Generate ONE programming problem ONLY.
The problem MUST require the student to write code, not predict output.
Do NOT generate multiple-choice or "What will be the output" type questions.

The response must be valid JSON (and nothing else) following this schema:

{
  "title": "string",
  "description": "Full problem statement (clear instructions to write a program)",
  "constraints": "string",
  "samples": [
    { "input": "string", "output": "string" }
  ],
  "hiddenTests": [
    { "input": "string", "output": "string" }
  ],
  "template": "starter code in a generic pseudocode or default language"
}

Rules:
- Always give at least one sample input/output and one hidden test case.
- The template should include function/method definition as a starting point.
- Focus on algorithmic or problem-solving tasks (strings, arrays, math, searching, etc).
- Do not generate syntax that is specific to one language unless explicitly asked.
`;

    try {
      // Call the new SDK method
      const response = await this.gemini.models.generateContent({
        model: "gemini-2.0-flash",
        contents: finalPrompt,
        // Optional config
        // config: { temperature: 0.7, maxOutputTokens: 1000 },
      });

      // The new SDK returns text directly
      const generatedText = response?.text;

      if (!generatedText) {
        console.error("No valid text found in Gemini response:", response);
        throw new Error("Empty Gemini response");
      }

      console.log("AI Raw Text:", generatedText);

      // Parse JSON safely
      let parsed;
      try {
        parsed = JSON.parse(generatedText);
      } catch (err) {
        console.error("Failed parsing AI JSON:", generatedText);
        throw err;
      }

      return parsed;
    } catch (err) {
      console.error("AI JSON parse failed:", err);
      return null;
    }
  }
}

module.exports = new AIService();

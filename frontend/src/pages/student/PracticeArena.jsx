// src/components/student/PracticeArena.js
import React, { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";


export default function PracticeArena() {
  const [language, setLanguage] = useState("JavaScript");
  const [code, setCode] = useState("// Start coding here...");
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  const [question, setQuestion] = useState(null);
  const [results, setResults] = useState([]);

  const languageMap = {
    JavaScript: "javascript",
    Python: "python",
    "C++": "cpp",
    Java: "java",
  };

  const templates = {
    JavaScript: `// JavaScript Example
function greet(name) {
  return "Hello, " + name + "!";
}
console.log(greet("World"));`,
    Python: `# Python Example
def greet(name):
    return "Hello, " + name + "!"

print(greet("World"))`,
    "C++": `#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}`,
    Java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,
  };

  const buildFullCode = (userCode, lang, tests) => {
    switch (lang) {
      case "Python":
        return `${userCode}

if __name__ == "__main__":
    tests = ${JSON.stringify(tests)}
    for t in tests:
        inp, expected = t["input"], t["output"]
        got = str(solve(int(inp)))
        print(f"Input: {inp} | Expected: {expected} | Got: {got}")
`;
      case "JavaScript":
        return `${userCode}

const tests = ${JSON.stringify(tests)};
for (const t of tests) {
  const got = String(solve(parseInt(t.input)));
  console.log("Input:", t.input, "| Expected:", t.output, "| Got:", got);
}
`;
      case "C++":
        return `${userCode}

int main() {
    struct Test { string input; string output; };
    vector<Test> tests = {
        ${tests.map((t) => `{"${t.input}", "${t.output}"}`).join(",")}
    };
    for (auto &t : tests) {
        int inp = stoi(t.input);
        cout << "Input: " << t.input 
             << " | Expected: " << t.output 
             << " | Got: " << solve(inp) << endl;
    }
    return 0;
}
`;
      case "Java":
        return `${userCode}

class RunTests {
    public static void main(String[] args) {
        String[][] tests = {
            ${tests.map((t) => `{"${t.input}", "${t.output}"}`).join(",")}
        };
        for (String[] t : tests) {
            int inp = Integer.parseInt(t[0]);
            String expected = t[1];
            String got = String.valueOf(Main.solve(inp));
            System.out.println("Input: " + t[0] + " | Expected: " + expected + " | Got: " + got);
        }
    }
}
`;
      default:
        return userCode;
    }
  };

  const generateTemplate = (q, lang) => {
  if (!q) return "// Start coding here...";

  // Use AI template for selected language if present
  if (q.templates && q.templates[lang]) {
    return q.templates[lang];
  }

  // fallback skeletons
  switch (lang) {
    case "Python":
      return `def solve(n):\n    # Write your code here\n    return 0`;
    case "JavaScript":
      return `function solve(n) {\n  // Write your code here\n  return 0;\n}`;
    case "C++":
      return `int solve(int n) {\n    // Write your code here\n    return 0;\n}`;
    case "Java":
      return `public class Main {\n    static int solve(int n) {\n        // Write your code here\n        return 0;\n    }\n}`;
    default:
      return "// Start coding here...";
  }
};

  const generateAIQuestion = async () => {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/code/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        prompt: "Generate a beginner-friendly coding problem with sample input/output", 
        options: { numQuestions: 1, difficulty: "easy" }
      }),
    });
    const data = await res.json();

    if (data.question) {
      setQuestion(data.question);
      setCode(generateTemplate(data.question, language));
      setResults([]);
      setOutput("");
    }
  } catch (err) {
    console.error("Failed to generate AI question:", err);
    alert("Failed to generate AI question. Check backend logs.");
  }
};
  


  // Load from localStorage on mount
  useEffect(() => {
    const savedLang = localStorage.getItem("practiceLanguage");
    const savedCode = localStorage.getItem("practiceCode");

    if (savedLang) setLanguage(savedLang);
    if (savedCode) setCode(savedCode);
  }, []);

  // Save language when it changes + set correct template
  useEffect(() => {
    localStorage.setItem("practiceLanguage", language);

    let newCode;
    if (question) {
      // if a question exists, generate its template for the new language
      newCode = generateTemplate(question, language);
    } else {
      // otherwise, fall back to default hello world template
      newCode = templates[language] || "// Start coding here...";
    }

    setCode(newCode);
    localStorage.setItem("practiceCode", newCode);
    setOutput("");
  }, [language, question]);

  // Save code when it changes
  useEffect(() => {
    localStorage.setItem("practiceCode", code);
  }, [code]);

  // Reset handler
const handleReset = () => {
  let defaultCode;

  if (question) {
    // Reset to AI template for current language
    defaultCode = generateTemplate(question, language);
  } else {
    // Reset to Hello World template
    defaultCode = templates[language] || "// Start coding here...";
  }

  setCode(defaultCode);
  localStorage.setItem("practiceCode", defaultCode);
  setOutput("");
  setResults([]);
};


  // Run code handler
  // Run code handler
  const handleRun = async () => {
    setIsRunning(true);
    setOutput("⏳ Running code...");
    setResults([]);

    if (!question) {
      // Normal run without test cases
      if (language === "JavaScript") {
        try {
          const consoleLogs = [];
          const customConsole = {
            log: (...args) => consoleLogs.push(args.join(" ")),
          };
          const runFunc = new Function("console", code);
          runFunc(customConsole);
          setOutput(
            consoleLogs.join("\n") ||
              "✅ Code executed successfully (no output)"
          );
        } catch (err) {
          setOutput("❌ Error: " + err.message);
        } finally {
          setIsRunning(false);
        }
      } else {
        try {
          const res = await fetch(
            `${import.meta.env.VITE_API_URL}/api/code/run`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ language, code }),
            }
          );
          const data = await res.json();
          setOutput(
            (data.stdout || "") +
              (data.stderr ? "\n❌ Runtime Error:\n" + data.stderr : "") +
              (data.compile_output
                ? "\n⚠️ Compiler Output:\n" + data.compile_output
                : "")
          );
        } catch (err) {
          setOutput("❌ Failed to connect to backend");
        } finally {
          setIsRunning(false);
        }
      }
      return;
    }

    // If question exists → run all test cases
    const allTests = [...question.samples, ...question.hiddenTests];
    const fullCode = buildFullCode(code, language, allTests);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/code/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, code: fullCode }),
      });
      const data = await res.json();
      const rawOut = (data.stdout || "").trim();

      if (!rawOut) {
        setOutput("❌ No output received.");
        setIsRunning(false);
        return;
      }

      // Parse structured lines into results
      const lines = rawOut.split("\n");
      const parsed = lines
        .map((line) => {
          const match = line.match(
            /Input:\s*(\d+)\s*\|\s*Expected:\s*(\d+)\s*\|\s*Got:\s*(\d+)/
          );
          if (!match) return null;
          const [, input, expected, got] = match;
          return { input, expected, got, passed: expected === got };
        })
        .filter(Boolean);

      setResults(parsed);
      setOutput("✅ Code executed. Results below.");
    } catch (err) {
      setOutput("❌ Failed to connect to backend");
    }

    setIsRunning(false);
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-800">Code Practice Arena</h3>
        <div className="flex gap-2">
          <button
            onClick={generateAIQuestion} // Previously generateQuestion
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow text-sm font-medium transition"
          >
            New Question
          </button>

          <button
            onClick={handleRun}
            disabled={isRunning}
            className={`px-3 py-1 ${
              isRunning ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
            } text-white rounded-lg shadow text-sm font-medium transition`}
          >
            {isRunning ? "Running..." : "Run Code"}
          </button>
          <button
            onClick={handleReset}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow text-sm font-medium transition"
          >
            Reset Code
          </button>
        </div>
      </div>

      {/* Question Section */}
      {question && (
        <div className="mb-4 p-4 border rounded-lg bg-gray-50">
          <h4 className="text-lg font-bold mb-2">{question.title}</h4>
          <p className="mb-2">{question.description}</p>
          <p className="text-sm text-gray-600 mb-2">
            Constraints: {question.constraints}
          </p>
          <div className="text-sm">
            <strong>Samples:</strong>
            {question.samples.map((s, i) => (
              <div key={i} className="bg-white p-2 rounded mt-1">
                Input: {s.input} → Output: {s.output}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Language Selector */}
      <select
        className="bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-gray-800 mb-4"
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
      >
        <option>JavaScript</option>
        <option>Python</option>
        <option>C++</option>
        <option>Java</option>
      </select>

      {/* Code Editor */}
      <div className="h-[400px] rounded-xl overflow-hidden border border-gray-200 mb-4">
        <Editor
          height="100%"
          language={languageMap[language]}
          value={code}
          theme="vs-light"
          onChange={(v) => setCode(v || "")}
        />
      </div>

      {/* Output Console */}
      <div className="bg-black text-green-400 font-mono text-sm rounded-lg p-4 min-h-[100px] overflow-y-auto">
        {output || "👉 Write some code and click Run"}
      </div>

      {/* Test Results */}
      {results.length > 0 && (
        <div className="flex flex-wrap gap-3 mt-4">
          {results.map((r, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg shadow-md w-[250px] ${
                r.passed
                  ? "bg-green-800 text-green-200"
                  : "bg-red-800 text-red-200"
              }`}
            >
              {r.passed ? "✅" : "❌"} <b>Test {i + 1}</b>
              <div className="mt-2 text-sm">
                <p>
                  <b>Input:</b> {r.input}
                </p>
                <p>
                  <b>Expected:</b> {r.expected}
                </p>
                <p>
                  <b>Got:</b> {r.got}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

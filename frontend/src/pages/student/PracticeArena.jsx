// src/components/student/PracticeArena.js
import React, { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";

export default function PracticeArena() {
  const [language, setLanguage] = useState("JavaScript");
  const [code, setCode] = useState("// Start coding here...");
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);

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

  // Load from localStorage on mount
  useEffect(() => {
    const savedLang = localStorage.getItem("practiceLanguage");
    const savedCode = localStorage.getItem("practiceCode");

    if (savedLang) setLanguage(savedLang);
    if (savedCode) setCode(savedCode);
  }, []);

  // Save language when it changes + set template
  useEffect(() => {
    localStorage.setItem("practiceLanguage", language);

    // load template when switching language
    if (templates[language]) {
      setCode(templates[language]);
      localStorage.setItem("practiceCode", templates[language]);
      setOutput(""); // clear old output
    }
  }, [language]);

  // Save code when it changes
  useEffect(() => {
    localStorage.setItem("practiceCode", code);
  }, [code]);

  // Reset handler
  const handleReset = () => {
    const defaultCode = templates[language] || "// Start coding here...";
    setCode(defaultCode);
    localStorage.setItem("practiceCode", defaultCode);
    setOutput("");
  };

  // Run code handler
  const handleRun = async () => {
    setIsRunning(true);
    setOutput("⏳ Running code...");

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
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/code/run`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ language, code }),
        });
        const data = await res.json();

        if (data.error) {
          setOutput("❌ Error: " + data.error);
        } else {
          setOutput(
            (data.stdout || "") +
              (data.stderr ? "\n⚠️ Runtime Error:\n" + data.stderr : "") +
              (data.compile_output
                ? "\n⚠️ Compiler Output:\n" + data.compile_output
                : "")
          );
        }
      } catch (err) {
        setOutput("❌ Failed to connect to backend");
      } finally {
        setIsRunning(false);
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-800">Code Practice Arena</h3>
        <div className="flex gap-2">
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
    </div>
  );
}

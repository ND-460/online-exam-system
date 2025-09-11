import React, { useState } from 'react';
import { Upload, Wand2, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';
import AddQuestions from './AddQuestions';

export default function AIQuestionGenerator({ onQuestionsGenerated, onCancel }) {
  const [activeTab, setActiveTab] = useState('pdf');
  const [loading, setLoading] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [showQuestionEditor, setShowQuestionEditor] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // PDF Upload State
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfOptions, setPdfOptions] = useState({
    numQuestions: 5,
    difficulty: 'medium',
    subject: 'general',
    questionType: 'multiple-choice'
  });
  
  // Prompt State
  const [promptText, setPromptText] = useState('');
  const [promptOptions, setPromptOptions] = useState({
    numQuestions: 5,
    difficulty: 'medium',
    subject: 'general',
    questionType: 'multiple-choice'
  });

  const handlePdfUpload = (e) => {
    const file = e.target.files[0];
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain'
    ];
    
    if (file && validTypes.includes(file.type)) {
      setPdfFile(file);
      setError('');
    } else {
      setError('Please select a valid file (PDF, DOCX, or TXT)');
    }
  };

  const generateFromPDF = async () => {
    if (!pdfFile) {
      setError('Please upload a PDF file first');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('pdf', pdfFile);
      formDataToSend.append('numQuestions', pdfOptions.numQuestions);
      formDataToSend.append('difficulty', pdfOptions.difficulty);
      formDataToSend.append('subject', pdfOptions.subject);
      formDataToSend.append('questionType', pdfOptions.questionType);

      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/teacher/generate-questions-pdf`,
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setGeneratedQuestions(response.data.questions);
        setSuccess(`Generated ${response.data.questions.length} questions from PDF`);
        setShowQuestionEditor(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate questions from PDF');
    } finally {
      setLoading(false);
    }
  };

  const generateFromPrompt = async () => {
    if (!promptText.trim()) {
      setError('Please enter a prompt or topic');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/teacher/generate-questions-prompt`,
        {
          prompt: promptText,
          numQuestions: promptOptions.numQuestions,
          difficulty: promptOptions.difficulty,
          subject: promptOptions.subject,
          questionType: promptOptions.questionType
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setGeneratedQuestions(response.data.questions);
        setSuccess(`Generated ${response.data.questions.length} questions from prompt`);
        setShowQuestionEditor(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate questions from prompt');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQuestions = (questions) => {
    onQuestionsGenerated(questions);
  };

  const handleCancelEditor = () => {
    setShowQuestionEditor(false);
    setGeneratedQuestions([]);
  };

  if (showQuestionEditor) {
    return (
      <AddQuestions
        initialQuestions={generatedQuestions}
        onSave={handleSaveQuestions}
        onCancel={handleCancelEditor}
      />
    );
  }

  return (
    <div className="bg-gradient-to-br from-black via-[#181f2e] to-[#232f4b] rounded-2xl p-8 border border-[#232f4b] shadow-2xl w-full max-w-4xl mx-auto mt-8">
      <div className="flex items-center gap-3 mb-6">
        <Wand2 className="h-8 w-8 text-violet-400" />
        <h2 className="text-2xl font-bold text-white">AI Question Generator</h2>
      </div>

      {/* Tab Navigation */}
      <div className="flex mb-6 bg-[#151e2e] rounded-lg p-1">
        <button
          onClick={() => setActiveTab('pdf')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md font-medium transition-all ${
            activeTab === 'pdf'
              ? 'bg-violet-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Upload className="h-4 w-4" />
          Upload PDF
        </button>
        <button
          onClick={() => setActiveTab('prompt')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md font-medium transition-all ${
            activeTab === 'prompt'
              ? 'bg-violet-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <FileText className="h-4 w-4" />
          Direct Prompt
        </button>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="flex items-center gap-2 p-4 mb-4 bg-red-900/20 border border-red-500/30 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <span className="text-red-300">{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-4 mb-4 bg-green-900/20 border border-green-500/30 rounded-lg">
          <CheckCircle className="h-5 w-5 text-green-400" />
          <span className="text-green-300">{success}</span>
        </div>
      )}

      {/* PDF Upload Tab */}
      {activeTab === 'pdf' && (
        <div className="space-y-6">
          <div>
            <label className="block text-white font-medium mb-2">Upload Study Material</label>
            <div className="border-2 border-dashed border-[#232f4b] rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handlePdfUpload}
                className="hidden"
                id="pdf-upload"
              />
              <label
                htmlFor="pdf-upload"
                className="cursor-pointer text-blue-400 hover:text-blue-300 font-medium"
              >
                Click to upload study material (PDF, DOCX, TXT)
              </label>
              {pdfFile && (
                <p className="mt-2 text-green-400 text-sm">
                  Selected: {pdfFile.name}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-white font-medium mb-2">Question Type</label>
              <select
                value={pdfOptions.questionType}
                onChange={(e) => setPdfOptions({...pdfOptions, questionType: e.target.value})}
                className="w-full bg-[#151e2e] border border-[#232f4b] rounded-md px-3 py-2 text-white"
              >
                <option value="multiple-choice">Multiple Choice (MCQ)</option>
                <option value="descriptive">Subjective Questions</option>
                <option value="mixed">Mixed Mode (MCQ + Subjective)</option>
              </select>
            </div>

            <div>
              <label className="block text-white font-medium mb-2">Number of Questions</label>
              <select
                value={pdfOptions.numQuestions}
                onChange={(e) => setPdfOptions({...pdfOptions, numQuestions: parseInt(e.target.value)})}
                className="w-full bg-[#151e2e] border border-[#232f4b] rounded-md px-3 py-2 text-white"
              >
                <option value={3}>3 Questions</option>
                <option value={5}>5 Questions</option>
                <option value={10}>10 Questions</option>
                <option value={15}>15 Questions</option>
                <option value={20}>20 Questions</option>
              </select>
            </div>

            <div>
              <label className="block text-white font-medium mb-2">Difficulty</label>
              <select
                value={pdfOptions.difficulty}
                onChange={(e) => setPdfOptions({...pdfOptions, difficulty: e.target.value})}
                className="w-full bg-[#151e2e] border border-[#232f4b] rounded-md px-3 py-2 text-white"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div>
              <label className="block text-white font-medium mb-2">Subject</label>
              <input
                type="text"
                value={pdfOptions.subject}
                onChange={(e) => setPdfOptions({...pdfOptions, subject: e.target.value})}
                placeholder="e.g., Mathematics, Science"
                className="w-full bg-[#151e2e] border border-[#232f4b] rounded-md px-3 py-2 text-white"
              />
            </div>
          </div>

          <button
            onClick={generateFromPDF}
            disabled={loading || !pdfFile}
            className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 px-6 rounded-lg font-semibold flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Generating Questions...
              </>
            ) : (
              <>
                <Wand2 className="h-5 w-5" />
                Generate Questions from PDF
              </>
            )}
          </button>
        </div>
      )}

      {/* Direct Prompt Tab */}
      {activeTab === 'prompt' && (
        <div className="space-y-6">
          <div>
            <label className="block text-white font-medium mb-2">Enter Topic or Prompt</label>
            <textarea
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="Enter the topic or detailed prompt for question generation. For example: 'Photosynthesis in plants' or 'Basic concepts of JavaScript programming'"
              className="w-full bg-[#151e2e] border border-[#232f4b] rounded-md px-3 py-3 text-white h-32 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-white font-medium mb-2">Question Type</label>
              <select
                value={promptOptions.questionType}
                onChange={(e) => setPromptOptions({...promptOptions, questionType: e.target.value})}
                className="w-full bg-[#151e2e] border border-[#232f4b] rounded-md px-3 py-2 text-white"
              >
                <option value="multiple-choice">Multiple Choice (MCQ)</option>
                <option value="descriptive">Subjective Questions</option>
                <option value="mixed">Mixed Mode (MCQ + Subjective)</option>
              </select>
            </div>

            <div>
              <label className="block text-white font-medium mb-2">Number of Questions</label>
              <select
                value={promptOptions.numQuestions}
                onChange={(e) => setPromptOptions({...promptOptions, numQuestions: parseInt(e.target.value)})}
                className="w-full bg-[#151e2e] border border-[#232f4b] rounded-md px-3 py-2 text-white"
              >
                <option value={3}>3 Questions</option>
                <option value={5}>5 Questions</option>
                <option value={10}>10 Questions</option>
                <option value={15}>15 Questions</option>
                <option value={20}>20 Questions</option>
              </select>
            </div>

            <div>
              <label className="block text-white font-medium mb-2">Difficulty</label>
              <select
                value={promptOptions.difficulty}
                onChange={(e) => setPromptOptions({...promptOptions, difficulty: e.target.value})}
                className="w-full bg-[#151e2e] border border-[#232f4b] rounded-md px-3 py-2 text-white"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div>
              <label className="block text-white font-medium mb-2">Subject</label>
              <input
                type="text"
                value={promptOptions.subject}
                onChange={(e) => setPromptOptions({...promptOptions, subject: e.target.value})}
                placeholder="e.g., Mathematics, Science"
                className="w-full bg-[#151e2e] border border-[#232f4b] rounded-md px-3 py-2 text-white"
              />
            </div>
          </div>

          <button
            onClick={generateFromPrompt}
            disabled={loading || !promptText.trim()}
            className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 px-6 rounded-lg font-semibold flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Generating Questions...
              </>
            ) : (
              <>
                <Wand2 className="h-5 w-5" />
                Generate Questions from Prompt
              </>
            )}
          </button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 mt-8">
        <button
          onClick={onCancel}
          className="bg-transparent border border-gray-400 text-gray-400 hover:text-white hover:border-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          Cancel
        </button>
      </div>

      {/* Info Section */}
      <div className="mt-8 p-4 bg-[#151e2e] rounded-lg border border-[#232f4b]">
        <h3 className="text-white font-medium mb-2">How it works:</h3>
        <ul className="text-gray-300 text-sm space-y-1">
          <li>• <strong>PDF Upload:</strong> Upload study material and AI will extract key concepts to generate relevant questions</li>
          <li>• <strong>Direct Prompt:</strong> Provide a topic or detailed prompt and AI will create questions based on your input</li>
          <li>• <strong>Review & Edit:</strong> All generated questions can be reviewed and edited before adding to your test</li>
        </ul>
      </div>
    </div>
  );
}

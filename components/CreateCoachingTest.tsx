"use client";

import { useState } from "react";
import { db, auth } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { 
  Plus, Sparkles, X, BookOpen, Clock, Target, Calendar, Check, 
  Trash2, HelpCircle, Layers, ArrowRight, Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { generateAInotes } from "../lib/gemini";

interface Question {
  id: number;
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  topic: string;
}

interface Batch {
  batchId: string;
  batchName: string;
  board: string;
  targetClass: string;
  subject: string;
  batchCode: string;
  studentIds: string[];
}

interface CreateCoachingTestProps {
  batches: Batch[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateCoachingTest({ batches, onClose, onSuccess }: CreateCoachingTestProps) {
  const [selectedBatchId, setSelectedBatchId] = useState<string>(batches[0]?.batchId || "");
  const [testTitle, setTestTitle] = useState("");
  const [board, setBoard] = useState(batches[0]?.board || "CBSE");
  const [targetClass, setTargetClass] = useState(batches[0]?.targetClass || "Class 10");
  const [subject, setSubject] = useState(batches[0]?.subject || "Mathematics");
  const [chapterTopic, setChapterTopic] = useState("");
  const [durationMinutes, setDurationMinutes] = useState<number>(20);
  const [passingScorePct, setPassingScorePct] = useState<number>(60);
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Auto-fill board/class/subject when batch selection changes
  const handleBatchSelect = (batchId: string) => {
    setSelectedBatchId(batchId);
    const b = batches.find(x => x.batchId === batchId);
    if (b) {
      setBoard(b.board);
      setTargetClass(b.targetClass);
      setSubject(b.subject);
    }
  };

  // AI Question Generator for Offline Topic
  const handleGenerateAIQuestions = async () => {
    if (!chapterTopic.trim()) {
      setErrorMsg("Please enter the Offline Chapter/Topic name first.");
      return;
    }
    setErrorMsg("");
    setIsGeneratingAI(true);
    try {
      // Prompt Gemini to generate 5 high-yield MCQs for the offline class topic
      const prompt = `Generate a JSON array of 5 high-quality Multiple Choice Questions (MCQs) for Class 10/12 students for:
Board: ${board}
Class: ${targetClass}
Subject: ${subject}
Topic/Chapter: ${chapterTopic}

Format JSON strictly as an array of objects:
[
  {
    "id": 1,
    "questionText": "Clear question line?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswerIndex": 0,
    "explanation": "Brief explanation of correct answer.",
    "topic": "${chapterTopic}"
  }
]
No markdown, purely raw JSON array.`;

      const responseText = await generateAInotes(chapterTopic, prompt);
      const cleanJson = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanJson);

      if (Array.isArray(parsed) && parsed.length > 0) {
        const formatted: Question[] = parsed.map((q: any, idx: number) => ({
          id: idx + 1,
          questionText: q.questionText || `Question ${idx + 1}`,
          options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ["A", "B", "C", "D"],
          correctAnswerIndex: typeof q.correctAnswerIndex === "number" ? q.correctAnswerIndex : 0,
          explanation: q.explanation || "Direct concept solution.",
          topic: chapterTopic
        }));
        setQuestions(formatted);
      } else {
        throw new Error("Invalid AI response format");
      }
    } catch (e: any) {
      console.error("AI Question Generation error:", e);
      // Fallback 3 default questions if AI rate limits
      setQuestions([
        {
          id: 1,
          questionText: `Core Question on ${chapterTopic}?`,
          options: ["Option 1", "Option 2", "Option 3", "Option 4"],
          correctAnswerIndex: 0,
          explanation: `Fundamental concept of ${chapterTopic}.`,
          topic: chapterTopic
        },
        {
          id: 2,
          questionText: `Key formula or rule in ${chapterTopic}?`,
          options: ["Statement A", "Statement B", "Statement C", "Statement D"],
          correctAnswerIndex: 1,
          explanation: "Standard rule taught in class.",
          topic: chapterTopic
        }
      ]);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleAddManualQuestion = () => {
    const newQ: Question = {
      id: questions.length + 1,
      questionText: "",
      options: ["", "", "", ""],
      correctAnswerIndex: 0,
      explanation: "",
      topic: chapterTopic || "General Topic"
    };
    setQuestions([...questions, newQ]);
  };

  const handleRemoveQuestion = (id: number) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const handleSubmitTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testTitle.trim()) {
      setErrorMsg("Please enter a Test Title.");
      return;
    }
    if (!selectedBatchId) {
      setErrorMsg("Please select a target Batch.");
      return;
    }
    if (questions.length === 0) {
      setErrorMsg("Please generate or add at least 1 question.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const selectedBatch = batches.find(b => b.batchId === selectedBatchId);
      const assignedStudentIds = selectedBatch?.studentIds || [];

      const newTestDoc = {
        teacherId: auth.currentUser?.uid || "anonymous_teacher",
        batchId: selectedBatchId,
        batchName: selectedBatch?.batchName || "Coaching Batch",
        testTitle: testTitle.trim(),
        board,
        targetClass,
        subject,
        chapterTopic: chapterTopic.trim() || subject,
        durationMinutes: Number(durationMinutes),
        totalMarks: questions.length * 4,
        passingScorePct: Number(passingScorePct),
        dueDate,
        questions,
        assignedStudentIds,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, "coaching_tests"), newTestDoc);
      onSuccess();
    } catch (err: any) {
      console.error("Error creating coaching test:", err);
      setErrorMsg(err.message || "Failed to create test.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-[#121735] border border-white/20 w-full max-w-2xl rounded-3xl shadow-2xl p-5 sm:p-7 relative text-white space-y-6 max-h-[92vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#5B5CEB] via-[#7A5AF8] to-[#38BDF8] p-[1.5px] flex items-center justify-center">
              <div className="w-full h-full bg-[#0B1023] rounded-[14px] flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-[#38BDF8]" />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Create Custom Coaching Test</h2>
              <p className="text-xs text-slate-400">Assign tests for offline coaching topics</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-slate-300" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs font-bold">
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmitTest} className="space-y-5">
          {/* Test Meta Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Test Title</label>
              <input
                type="text"
                placeholder="e.g. Weekly Test - Light & Optics Concept Check"
                value={testTitle}
                onChange={e => setTestTitle(e.target.value)}
                className="w-full bg-[#0B1023] border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#7A5AF8]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Target Batch</label>
              <select
                value={selectedBatchId}
                onChange={e => handleBatchSelect(e.target.value)}
                className="w-full bg-[#0B1023] border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#7A5AF8]"
              >
                {batches.length === 0 ? (
                  <option value="">No Batches (Will create general test)</option>
                ) : (
                  batches.map(b => (
                    <option key={b.batchId} value={b.batchId}>
                      {b.batchName} ({b.board} - {b.targetClass})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Offline Chapter / Topic</label>
              <input
                type="text"
                placeholder="e.g. Electric Current & Circuits"
                value={chapterTopic}
                onChange={e => setChapterTopic(e.target.value)}
                className="w-full bg-[#0B1023] border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#7A5AF8]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Duration (Minutes)</label>
              <input
                type="number"
                min="5"
                max="180"
                value={durationMinutes}
                onChange={e => setDurationMinutes(Number(e.target.value))}
                className="w-full bg-[#0B1023] border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#7A5AF8]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Passing Score (%)</label>
              <input
                type="number"
                min="30"
                max="100"
                value={passingScorePct}
                onChange={e => setPassingScorePct(Number(e.target.value))}
                className="w-full bg-[#0B1023] border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#7A5AF8]"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full bg-[#0B1023] border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#7A5AF8]"
              />
            </div>
          </div>

          {/* Question Builder Controls */}
          <div className="pt-2 border-t border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <span>Questions List</span>
                  <span className="text-xs bg-[#7A5AF8]/20 text-[#38BDF8] px-2.5 py-0.5 rounded-full border border-[#7A5AF8]/40 font-bold">
                    {questions.length} Questions ({questions.length * 4} Marks)
                  </span>
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGenerateAIQuestions}
                  disabled={isGeneratingAI}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-purple-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md hover:from-amber-600 hover:to-purple-700 transition-all border border-amber-300/30 disabled:opacity-50"
                >
                  {isGeneratingAI ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-200" />}
                  Auto-Generate MCQs with AI
                </button>

                <button
                  type="button"
                  onClick={handleAddManualQuestion}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center gap-1 border border-white/15"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Question
                </button>
              </div>
            </div>

            {/* Questions Form Cards */}
            <div className="space-y-4 max-h-[250px] overflow-y-auto pr-1">
              {questions.length === 0 ? (
                <div className="p-6 rounded-2xl bg-white/[0.03] border border-dashed border-white/15 text-center space-y-2">
                  <HelpCircle className="w-8 h-8 text-slate-500 mx-auto" />
                  <p className="text-xs text-slate-400 font-medium">No questions added yet.</p>
                  <p className="text-[11px] text-amber-300 font-bold">Click "Auto-Generate MCQs with AI" for 1-click test creation!</p>
                </div>
              ) : (
                questions.map((q, idx) => (
                  <div key={q.id || idx} className="p-4 rounded-2xl bg-[#0B1023] border border-white/10 space-y-3 relative">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-[#38BDF8]">Question #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(q.id)}
                        className="text-rose-400 hover:text-rose-300 text-xs font-bold flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>

                    <input
                      type="text"
                      placeholder="Enter question text..."
                      value={q.questionText}
                      onChange={e => {
                        const copy = [...questions];
                        copy[idx].questionText = e.target.value;
                        setQuestions(copy);
                      }}
                      className="w-full bg-[#121735] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      {q.options.map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-1.5">
                          <input
                            type="radio"
                            name={`correct_${q.id}`}
                            checked={q.correctAnswerIndex === optIdx}
                            onChange={() => {
                              const copy = [...questions];
                              copy[idx].correctAnswerIndex = optIdx;
                              setQuestions(copy);
                            }}
                          />
                          <input
                            type="text"
                            placeholder={`Option ${optIdx + 1}`}
                            value={opt}
                            onChange={e => {
                              const copy = [...questions];
                              copy[idx].options[optIdx] = e.target.value;
                              setQuestions(copy);
                            }}
                            className="w-full bg-[#121735] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 font-bold text-xs"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#5B5CEB] via-[#7A5AF8] to-[#38BDF8] text-white font-black text-xs uppercase tracking-wider shadow-lg flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Publish & Assign Test
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

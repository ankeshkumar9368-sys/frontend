"use client";

import { db } from "./firebase";
import { collection, doc, setDoc, getDoc, getDocs, query, where, limit, orderBy, serverTimestamp } from "firebase/firestore";
import { 
  generateAInotes, 
  generateAIQuestions, 
  generateAIAnalysis, 
  generateAIPYQs, 
  generateAISyllabus,
  generateAIChapters,
  generateQuickStudyCards,
  generateImportantConcepts,
  logToTerminal,
  generateMockExamPaper,
  validateNotes,
  autoCorrectMCQs,
  generateSingleReplacementQuestion,
  generateSubjectiveQuestion,
  evaluateSubjectiveAnswer
} from "./gemini";
import { getOverallStats, updateStreak, getMistakes, getMasteredQuestions } from "./analytics";

export { 
  generateAInotes, 
  generateAIQuestions, 
  generateAIAnalysis, 
  generateAIPYQs, 
  generateAISyllabus, 
  generateSingleReplacementQuestion, 
  generateSubjectiveQuestion, 
  evaluateSubjectiveAnswer 
};

export const achivox_cache_version = "v12";

export const hasCachedContent = (mode: string, parentId: string | null, type: string) => {
  if (typeof window === "undefined") return false;
  const key = `achivox_${mode}_${parentId || 'root'}_${type}_${achivox_cache_version}`;
  return localStorage.getItem(key) !== null;
};

export const getCachedContent = (mode: string, parentId: string | null, type: string) => {
  if (typeof window === "undefined") return null;
  const key = `achivox_${mode}_${parentId || 'root'}_${type}_${achivox_cache_version}`;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
};

export const saveContentToCache = (mode: string, parentId: string | null, type: string, data: any) => {
  if (typeof window === "undefined") return;
  const key = `achivox_${mode}_${parentId || 'root'}_${type}_${achivox_cache_version}`;
  localStorage.setItem(key, JSON.stringify(data));
};

export interface ContentItem {
  id: string;
  name: string;
  type: string;
  parentId: string | null;
  isPremiumLocked?: boolean;
}

export interface ChapterNote {
  meta?: { topic: string, studentLevel: string, mode: string, accuracy: number, wikiSearchTerm?: string };
  notes?: {
    full: {
      intro: string;
      introHindi?: string;
      topics: any[];
      memoryTricks: string[];
    };
    short: string[];
    revision: string[];
  };
  
  // NEW SECTIONS
  quickRevision?: string[];
  finalCheatSheet?: string[];
  formulaSheet?: {title: string, equation: string, usage: string}[];
  examBooster?: { highProbabilityTopics: string[], boardFrequency: string, predictedQuestion?: string };
  solvedExample?: { question: string, solution?: string[], stepByStepSolution?: string[] };
  commonMistakesNew?: { mistake: string, correction: string, reason: string }[];
  improvementPlanNew?: { weakAreas: string[], fixStrategy: string[], practicePlan: string[] };
  adaptiveLearningNew?: { currentLevelAnalysis: string, nextFocusTopics: string[], difficultyAdjustment: string };
  wikiSearchTerm?: string;
  shortQuestions?: any[];
  longQuestions?: any[];
  diagramSuggestions?: any[];

  questions?: {
    subjective: any[];
    objective: any[];
  };
  weakStudentImprovement?: {
    mistakeAnalysis: string[];
    improvementTips: string[];
    recommendedPractice: string[];
  };
  
  // COMPATIBILITY FIELDS
  topicMeta: { topic: string, class: string, subject: string, board: string };
  intro: string;
  introHindi?: string;
  topics: any[];
  memoryTricks: any[];
  subjectiveQuestions: any[];
  objectiveQuestions: any[];
  quickRevisionLegacy: any[];
  summary: string[];
  createdAt?: any;
}

import { fetchAI } from "./api-client";

// --- AI GENERATIVE NOTE FETCHING WITH CACHE & FALLBACK ---
export const fetchChapterNotes = async (topicName: string, userData?: any, lang: string = "en-hi", subjectContext?: string, chapterName?: string, forceRefresh: boolean = false, mode: "full" | "short" | "revision" | "remedial" = "full"): Promise<ChapterNote> => {
  const isPremium = true;
  
  let fullTopic = subjectContext ? `${subjectContext} - ${topicName}` : topicName;
  if (chapterName && chapterName !== topicName) {
    fullTopic = `${subjectContext || "General"} - ${chapterName} - ${topicName}`;
  }
  
  const boardKey = userData?.board || "CBSE";
  const classKey = userData?.cls || "10th";
  // All users get personalized cache based on their own performance data
  const safeId = `${mode}_${boardKey}_${classKey}_${fullTopic}_user_${userData?.id || 'guest'}`.replace(/[\/\.#$\[\]\s]/g, '_').toLowerCase();
      
  const noteRef = doc(db, "ai_cache", "note_" + safeId);

  let topicAccuracy = 50; // Default performance fallback
  try {
    const stats = getOverallStats();
    if (stats) {
      const topicId = topicName.toLowerCase().replace(/\s+/g, '-');
      const attempt = stats.recentActivity?.find((a: any) => a.topic.toLowerCase().replace(/\s+/g, '-') === topicId);
      if (attempt) {
        topicAccuracy = attempt.score;
      } else {
        topicAccuracy = stats.accuracy || 50;
      }
    }
  } catch (err) {
    console.warn("Failed to extract performance metrics:", err);
  }

  // Enforcement of Regeneration limits: 7 days for Premium, 30 days for Free users
  if (forceRefresh) {
    try {
      const snap = await getDoc(noteRef);
      if (snap.exists()) {
        const oldData = snap.data();
        const oldCreatedAt = oldData.createdAt;
        if (oldCreatedAt) {
          const oldMillis = typeof oldCreatedAt.toMillis === 'function' ? oldCreatedAt.toMillis() : (typeof oldCreatedAt === 'number' ? oldCreatedAt : Date.now());
          const ageInDays = (Date.now() - oldMillis) / (1000 * 60 * 60 * 24);
          const requiredDays = isPremium ? 7 : 30;
          if (ageInDays < requiredDays) {
            const remainingDays = Math.ceil(requiredDays - ageInDays);
            throw new Error(`REGENERATE_LOCK:${remainingDays}`);
          }
        }
      }
    } catch (dbErr: any) {
      if (dbErr.message?.startsWith("REGENERATE_LOCK:")) {
        throw dbErr;
      }
      console.warn("Failed to read global_notes for regeneration limit check:", dbErr);
    }
  }

  try {
    if (!forceRefresh) {
      try {
        const snap = await getDoc(noteRef);
        if (snap.exists()) {
          if (userData?.planType === "standard") {
            await new Promise(resolve => setTimeout(resolve, 5000));
          }
          return snap.data() as ChapterNote;
        }
      } catch (dbErr) {
        console.warn("Failed to read global_notes from Firestore:", dbErr);
      }
    }

    // Call AI directly on frontend with dynamic performance analysis
    let rawData = await generateAInotes(fullTopic, userData, mode, 0, topicAccuracy);

    // Ensure content is valid
    if (!rawData || !validateNotes(rawData)) {
      throw new Error("AI generated invalid or blank content");
    }

    const mn = rawData.masterNotes || {};
    const pdf = rawData.pdfContent || {};

    // Build topics array from masterNotes for SmartNotesViewer backward compat
    const topicsFromMasterNotes = mn.definitions?.length
      ? [{
          title: rawData.meta?.topic || chapterName || topicName,
          titleHindi: rawData.meta?.topic || chapterName || topicName,
          content: mn.snapshotConcepts || "",
          contentHindi: mn.snapshotConcepts || "",
          definition: (mn.definitions || []).map((d: any) => `${d.term}: ${d.definition}`).join('\n'),
          definitionHindi: (mn.definitions || []).map((d: any) => `${d.term}: ${d.definition}`).join('\n'),
          examLine: mn.pyqPoint || "",
          formula: (mn.formulaSheet || []).map((f: any) => f.formula).join(', '),
          subPoints: mn.fiveOneLinePoints || mn.shortTricks || []
        }]
      : [];

    const compatibleData: ChapterNote = {
      ...rawData,
      createdAt: Date.now(),
      topicMeta: {
        topic: chapterName || rawData.meta?.topic || topicName,
        class: userData?.cls || rawData.meta?.studentLevel || "10th",
        subject: subjectContext || "General",
        board: userData?.board || "CBSE",
      },
      intro: rawData.intro || mn.snapshotConcepts || pdf.sections?.[0]?.content || "",
      introHindi: rawData.introHindi || mn.snapshotConcepts || "",
      topics: (rawData.topics || rawData.notes?.full?.topics || topicsFromMasterNotes).map((t: any) => ({
        ...t,
        examTip: t.examTip || t.examLine || ""
      })),
      memoryTricks: (rawData.memoryTricks || mn.memoryTricks || rawData.notes?.full?.memoryTricks || []).map((m: any) => {
        if (typeof m === 'string') return { trick: m, trickHindi: m };
        return { trick: m.trick || m.english || "", trickHindi: m.trickHindi || m.hindi || m.trick || "" };
      }),
      quickRevision: rawData.quickRevision || (mn.fiveOneLinePoints || []).map((p: string) => ({ en: p, hi: p })) || rawData.notes?.short || [],
      formulaSheet: rawData.formulaSheet || mn.formulaSheet || [],
      finalCheatSheet: rawData.finalCheatSheet || [],
      examBooster: rawData.examBooster || null,
      solvedExample: rawData.solvedExample || mn.solvedExample || null,
      commonMistakesNew: rawData.commonMistakesNew || mn.commonMistakes || rawData.commonMistakes || [],
      improvementPlanNew: rawData.improvementPlanNew || rawData.improvementPlan || null,
      adaptiveLearningNew: rawData.adaptiveLearningNew || rawData.adaptiveLearning || null,
      wikiSearchTerm: rawData.wikiSearchTerm || rawData.meta?.wikiSearchTerm || "None",
      shortQuestions: rawData.shortQuestions || [],
      longQuestions: rawData.longQuestions || [],
      diagramSuggestions: rawData.diagramSuggestions || [],
      subjectiveQuestions: (rawData.subjectiveQuestions || rawData.questions?.subjective || []).map((q: any) => ({
        q: q.q || q.question || "",
        a: q.a || q.answer || "",
        easyWay: q.easyWay || q.tip || q.shortcut || "",
        weightage: q.weightage || q.marks || (Math.random() > 0.5 ? 5 : 3)
      })),
      objectiveQuestions: rawData.objectiveQuestions || rawData.questions?.objective || [],
      masterNotes: mn,
      pdfContent: pdf,
    };

    // Safely cache to Firestore
    try {
      await setDoc(noteRef, { ...compatibleData, createdAt: serverTimestamp() });
    } catch (dbErr) {
      console.warn("Failed to cache global_notes in Firestore:", dbErr);
    }

    return compatibleData;
  } catch (e: any) {
    console.error("fetchChapterNotes error:", e);
    try { logToTerminal(`fetchChapterNotes ERROR for ${topicName}: ${e?.message}`, "error"); } catch (_) {}
    throw e; // Re-throw so UI shows real error
  }
};

import { INDIAN_BOARDS, CLASSES, getSubjects, getChapters, getTopics, getSubtopics } from "./curriculum";

export const getTestBankId = (mode: string, topicName: string, userData?: any, subjectContext?: string) => {
  const boardKey = userData?.board || "CBSE";
  const classKey = userData?.cls || "10th";
  const fullTopic = subjectContext ? `${subjectContext} - ${topicName}` : topicName;
  return `questions_${mode}_${boardKey}_${classKey}_${fullTopic}_${achivox_cache_version}`.replace(/[\/\.#$\[\]\s]/g, '_').toLowerCase();
};


export const fetchQuestions = async (mode: string, topicName: string, userData?: any, subjectContext?: string): Promise<any[]> => {
  const isPremium = true;
  let masteredCount = 0;
  if (typeof window !== 'undefined') {
     masteredCount = getMasteredQuestions().length;
  }
  const safeId = getTestBankId(mode, topicName, userData, subjectContext) + '_v4_m' + masteredCount;
  const fullTopic = subjectContext ? `${subjectContext} - ${topicName}` : topicName;
  
  const qRef = doc(db, 'global_questions', safeId);
  try {
    let rawData: any = null;
    let mistakes: any[] = [];
    try {
       mistakes = getMistakes();
    } catch (e) {
       console.warn("Analytics not ready yet");
    }

    try {
      const snap = await getDoc(qRef);
      if (snap.exists()) {
        const cachedQs = snap.data().questions || [];
        if (cachedQs.length > 0) {
          return cachedQs;
        }
      }
    } catch (dbErr) {
      console.warn('Failed to fetch global_questions from Firestore:', dbErr);
    }

    // Call AI directly on frontend
    rawData = await generateAIQuestions(fullTopic, userData, undefined, mode);

    // Recycle mistake questions back for student reinforcement
    if (mistakes.length > 0 && mode !== 'exam' && mode !== 'pyq') {
      const recycledQs = mistakes.slice(0, 3).map((m: any) => {
        const mOptions = m.options || ["Option A", "Option B", "Option C", "Option D"];
        let cIndex = 0;
        if (typeof m.correctAnswer === 'number') {
          cIndex = m.correctAnswer;
        } else if (typeof m.correctAnswer === 'string') {
          cIndex = mOptions.findIndex((opt: any) => typeof opt === 'string' && opt.trim().toLowerCase() === m.correctAnswer.trim().toLowerCase());
          if (cIndex === -1) cIndex = 0;
        }
        return {
          text: m.question || m.text || "Previously missed question",
          options: mOptions,
          correct: cIndex,
          explanation: "Let's try this again! You made a mistake on this previously.\n\n" + (m.explanation || ""),
          difficulty: "Medium",
          importance: "High"
        };
      });
      rawData = [...recycledQs, ...rawData];
    }

    rawData = rawData.slice(0, mode === 'mock50' ? 50 : 10);
    rawData.sort(() => Math.random() - 0.5);

    if (!rawData || rawData.length === 0) throw new Error('Empty questions');
    try {
      await setDoc(qRef, { questions: rawData, createdAt: serverTimestamp() });
    } catch (e) {
      console.warn('Failed to cache questions:', e);
    }

    const mapped = rawData.map((q: any) => {
      const resolvedCorrect = q.correctAnswer !== undefined ? q.correctAnswer : (q.correct !== undefined ? q.correct : 0);
      return { ...q, correctAnswer: resolvedCorrect, correct: resolvedCorrect };
    });
    
    let corrected = autoCorrectMCQs(mapped);
    return corrected;
  } catch (error) {
    console.error('Error fetching questions:', error);
    return [];
  }
};

export const fetchDoubtResponse = async (question: string, context: string = "") => {
  try {
    const { model } = await import("./gemini");
    const prompt = `You are an expert Indian school teacher. Answer this student's doubt clearly and concisely in 3-5 lines, using simple language and examples. Question: "${question}"`;
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (e) {
    return "AI Teacher is currently busy. Please try again in a moment.";
  }
};

export const fetchMockExamPaper = async (userData: any) => {
  return await generateMockExamPaper(userData);
};

export const fetchQuickStudyCards = async (userData: any, selectedSubjects?: string[]) => {
  const subjects = selectedSubjects && selectedSubjects.length > 0 ? selectedSubjects : (userData?.subjects || ["Science", "Maths"]);
  const board = userData?.board || "CBSE";
  const cls = userData?.cls || "10th";
  return await generateQuickStudyCards(subjects, board, cls);
};

export const getOrGenerateImportantConcepts = async (board: string, cls: string, subject: string) => {
  return await generateImportantConcepts(board, cls, subject);
};

export const fetchContent = async (mode: string, parentId: string | null = null, type: string) => {
    // Check localStorage cache first for instant load
    const cached = getCachedContent(mode, parentId, type);
    if (cached && Array.isArray(cached) && cached.length > 0) {
        return cached;
    }

    const extract = (prefix: string) => {
        if (!parentId) return null;
        const match = parentId.match(new RegExp(`${prefix}_(.*?)(?=__categories_|__exams_|__years_|__boards_|__classes_|__subjects_|__chapters_|__topics_|$)`, "i"));
        return match ? match[1] : null;
    }
    
    let list: string[] = [];
    if (type === "Categories") {
        list = ["School", "Competitive"];
    } else if (type === "Boards") {
        list = INDIAN_BOARDS;
    } else if (type === "Classes") {
        list = CLASSES;
    } else if (type === "Subjects") {
        // Convert raw extracted values to proper format before lookup
        const clsRaw = extract("classes") || "class_10";
        const boardRaw = extract("boards") || "cbse";
        // class_10 -> "Class 10", class_12 -> "Class 12"
        const cls = clsRaw.startsWith("class_")
            ? `Class ${clsRaw.replace("class_", "")}`
            : clsRaw.includes("Class") ? clsRaw : `Class ${clsRaw}`;
        // cbse -> "CBSE", match against INDIAN_BOARDS list
        const boardNormalized = boardRaw.toLowerCase().replace(/[^a-z0-9]/g, "_");
        const board = INDIAN_BOARDS.find((b: string) =>
            b.toLowerCase().replace(/[^a-z0-9]/g, "_").startsWith(boardNormalized)
        ) || boardRaw.toUpperCase();
        list = getSubjects(cls, board);
    } else if (type === "Chapters") {
        const classRaw = extract("classes");
        const subRaw = extract("subjects");
        const boardRaw = extract("boards");
        const cls = classRaw ? classRaw.startsWith("class_") ? `Class ${classRaw.replace("class_", "")}` : `Class ${classRaw}` : "Class 10";
        const sub = subRaw ? subRaw.split("_").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : "Science";
        const board = boardRaw ? INDIAN_BOARDS.find((b: any) => b.toLowerCase().replace(/[^a-z0-9]/g, "_") === boardRaw) || "" : "";
        const staticChapters = getChapters(sub, cls, board);
        if (staticChapters && staticChapters.length > 0) {
            list = staticChapters;
        } else {
            const discoveryId = `chapters_${board}_${cls}_${sub}_v3`.toLowerCase().replace(/\s+/g, "_");
            const docRef = doc(db, "global_chapters", discoveryId);
            try {
                let snap: any = null;
                try {
                    snap = await getDoc(docRef);
                } catch (dbErr) {
                    console.warn("Failed to read global_chapters:", dbErr);
                }
                if (snap && snap.exists()) {
                    list = snap.data().chapters;
                } else {
                    list = await generateAIChapters(board, cls, sub);
                    if (list && list.length > 0) {
                        try {
                           await setDoc(docRef, { chapters: list, createdAt: serverTimestamp() });
                        } catch (e) {
                           console.warn("Failed to cache chapters", e);
                        }
                    }
                }
            } catch (e) {
                list = ["Chapter 1", "Chapter 2"];
            }
        }
    } else if (type === "Topics") {
        const classRaw = extract("classes");
        const subRaw = extract("subjects");
        const boardRaw = extract("boards");
        const chapterRaw = extract("chapters");
        const cls = classRaw ? classRaw.startsWith("class_") ? `Class ${classRaw.replace("class_", "")}` : `Class ${classRaw}` : "Class 10";
        const sub = subRaw ? subRaw.split("_").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : "Science";
        const board = boardRaw ? INDIAN_BOARDS.find((b: any) => b.toLowerCase().replace(/[^a-z0-9]/g, "_") === boardRaw) || "" : "";
        const chapter = chapterRaw ? chapterRaw.replace(/_/g, " ") : "Chapter 1";
        
        const staticTopics = getTopics(chapter, sub, cls);
        if (staticTopics && staticTopics.length > 0) {
            list = staticTopics;
        } else {
            const discoveryId = `topics_${board}_${cls}_${sub}_${chapter}_v3`.toLowerCase().replace(/\s+/g, "_");
            const docRef = doc(db, "global_topics", discoveryId);
            try {
                let snap: any = null;
                try {
                    snap = await getDoc(docRef);
                } catch (dbErr) {
                    console.warn("Failed to read global_topics:", dbErr);
                }
                if (snap && snap.exists()) {
                    const rawTopics = snap.data().topics;
                    // Handle both string[] and {topic_name:...}[] formats from Firestore cache
                    list = (rawTopics || []).map((t: any) => {
                        if (typeof t === "string") return t;
                        return t.topic_name || t.name || t.title || t.topic || JSON.stringify(t);
                    });
                } else {
                    const syllabusData = await generateAISyllabus(board, cls, sub, chapter);
                    // generateAISyllabus returns {board, class, subject, chapter, topics: [{topic_name, subtopics}]}
                    // Extract just the topic names as plain strings
                    const rawTopics = (syllabusData as any)?.topics || (Array.isArray(syllabusData) ? syllabusData : []);
                    list = rawTopics.map((t: any) => {
                        if (typeof t === "string") return t;
                        return t.topic_name || t.name || t.title || t.topic || String(t);
                    }).filter((name: string) => name && name.trim().length > 0);
                    
                    if (list && list.length > 0) {
                        try {
                           // Cache as plain string array
                           await setDoc(docRef, { topics: list, createdAt: serverTimestamp() });
                        } catch(e) {
                           console.warn("Failed to cache topics", e);
                        }
                    }
                }
            } catch (e) {
                list = ["Topic 1", "Topic 2"];
            }
        }
    }
    
    if (!Array.isArray(list)) {
        if (list && typeof list === 'object') {
            if (Array.isArray((list as any).topics)) {
                list = (list as any).topics;
            } else if (Array.isArray((list as any).list)) {
                list = (list as any).list;
            } else {
                list = [];
            }
        } else {
            list = [];
        }
    }
    const result = list.map((rawItem) => {
        let item = "";
        if (typeof rawItem === "string") {
            item = rawItem;
        } else if (rawItem && typeof rawItem === "object") {
            item = (rawItem as any).name || (rawItem as any).title || (rawItem as any).topic || (rawItem as any).chapter || JSON.stringify(rawItem);
        } else if (rawItem !== null && rawItem !== undefined) {
            item = String(rawItem);
        }
        item = item.trim();
        return {
            id: `${parentId ? parentId + "__" : ""}${type.toLowerCase()}_${item.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
            name: item,
            type: type === "Boards" ? "classes" : type === "Classes" ? "subjects" : type === "Subjects" ? "chapters" : type === "Chapters" ? "topics" : type === "Topics" ? "subtopics" : "leaf",
            parentId
        };
    });

    if (result && result.length > 0) {
        saveContentToCache(mode, parentId, type, result);
    }
    
    return result;
};

export const analyzePerformance = async (userId: string, history: any) => {
  try {
    const data = await generateAIAnalysis({ id: userId, history });
    return data;
  } catch (error) {
    return { weakAreas: ["General Revision Required"], tips: "Consistent practice will help." };
  }
};

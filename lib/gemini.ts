import { auth, db } from "./firebase";
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment, getDoc, setDoc } from "firebase/firestore";
import { fetchAI } from "./api-client";
import { getApiUrl } from "./api-client";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { logGenerationMetric } from "./analytics";

const getGeminiApiKey = () => {
  return process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
};

const apiKey = getGeminiApiKey();
const isLocalGenAIEnabled = apiKey !== "";

if (isLocalGenAIEnabled) {
  console.log("⚡ [ExamHero AI] Native Client-Side GoogleGenerativeAI Enabled.");
} else {
  console.warn("⚠️ [ExamHero AI] NEXT_PUBLIC_GEMINI_API_KEY missing. Falling back to Backend Proxy.");
}

const genAI = isLocalGenAIEnabled ? new GoogleGenerativeAI(apiKey) : null;

const createDirectModel = (isJsonMode = false) => {
  if (genAI) {
    return genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: isJsonMode
        ? {
            responseMimeType: 'application/json',
            temperature: 0.1,
            maxOutputTokens: 16000,
            topK: 40,
            topP: 0.95
          }
        : { temperature: 0.7, maxOutputTokens: 8192 }
    });
  }

  return {
    generateContent: async (prompt: any) => {
      try {
        const data = await fetchAI("/api/ai/proxy", { prompt, isJsonMode });
        return {
          response: {
            text: () => data.text,
            usageMetadata: data.usageMetadata
          }
        };
      } catch (error) {
        console.error("AI Proxy Call Failed:", error);
        throw error;
      }
    }
  };
};

export const model = createDirectModel(false);
export const jsonModel = createDirectModel(true);


// MATH SYSTEM PROMPT:
const MATH_INSTRUCTION = `
  For ALL mathematical expressions, ALWAYS use the following:
  - 🚨 CLEAN TEXT FORMAT: For inline text (inside paragraphs), use CLEAN READABLE format instead of raw LaTeX. Use Unicode for subscripts/superscripts where possible (e.g., m₁, m₂, r², H₂O).
  - 🧪 VARIABLES: Define variables clearly (e.g., G → gravitational constant). Avoid raw LaTeX symbols like $G$ in pure text; use bold or plain text.
  - 📊 SEPARATE FORMULAS: ALWAYS show major formulas on a separate line using double dollar signs $$...$$.
  - 🚨 NO LITERAL "\\n": Do NOT write backslash-n. Use actual newlines.
  - 🚨 LATEX ESCAPING: ONLY double-escape backslashes for Block LaTeX ($$...$$).
`;

// ⚡ FIRE-AND-FORGET: logToTerminal never blocks the AI pipeline
export function logToTerminal(message: string, type: 'info' | 'error' = 'info', details?: any) {
  // Non-blocking: run in background, never await
  Promise.resolve().then(async () => {
    try {
      if (typeof window !== 'undefined') {
        fetch(getApiUrl('/api/log'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ type, message, details })
        }).catch(() => {});
      } else {
        console.log(`[${type.toUpperCase()}] ${message}`, details || '');
      }
      if (db) {
        addDoc(collection(db, "system_logs"), {
          type, message,
          details: details || {},
          timestamp: serverTimestamp()
        }).catch(() => {});
      }
    } catch (e) {}
  });
}

// ⚡ FIRE-AND-FORGET: token tracking never blocks the response
function recordTokenUsage(usage: any, feature: string) {
  if (!usage || !db) return;
  Promise.resolve().then(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const statsRef = doc(db, "admin_stats", "ai_usage");
      setDoc(statsRef, {
        totalTokens: increment(usage.totalTokenCount || 0),
        promptTokens: increment(usage.promptTokenCount || 0),
        completionTokens: increment(usage.candidatesTokenCount || 0),
        lastUpdated: serverTimestamp()
      }, { merge: true }).catch(() => {});
      const dailyRef = doc(db, "admin_stats", `ai_usage_${today}`);
      setDoc(dailyRef, {
        tokens: increment(usage.totalTokenCount || 0),
        calls: increment(1),
        featureBreakdown: { [feature]: increment(usage.totalTokenCount || 0) }
      }, { merge: true }).catch(() => {});
    } catch (e) {}
  });
}

// ==========================================
// GLOBAL AI CACHING SYSTEM (L1: localStorage, L2: Firestore)
// ==========================================
const FIRESTORE_CACHE_VERSION = "_v9_no_shuffle_strict";
const LS_CACHE_PREFIX = "achivox_aicache_";

// L1 localStorage instant check (synchronous, 0ms)
function checkLocalCache(cacheKey: string): any | null {
  if (typeof window === 'undefined') return null;
  try {
    const lsKey = `${LS_CACHE_PREFIX}${cacheKey}`;
    const raw = localStorage.getItem(lsKey);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

// Save to L1 localStorage (fire-and-forget)
function saveLocalCache(cacheKey: string, payload: any) {
  if (typeof window === 'undefined') return;
  Promise.resolve().then(() => {
    try {
      const lsKey = `${LS_CACHE_PREFIX}${cacheKey}`;
      localStorage.setItem(lsKey, JSON.stringify(payload));
    } catch {}
  });
}

async function checkAICache(cacheKey: string) {
  // L1: localStorage (instant, 0ms)
  const localHit = checkLocalCache(cacheKey);
  if (localHit) {
    logToTerminal(`⚡ L1 CACHE HIT: localStorage [${cacheKey}]`, 'info');
    return localHit;
  }
  // L2: Firestore
  if (!db) return null;
  const versionedKey = `${cacheKey}${FIRESTORE_CACHE_VERSION}`;
  try {
    const cacheRef = doc(db, "ai_cache", versionedKey);
    const snap = await getDoc(cacheRef);
    if (snap.exists()) {
      const data = snap.data().payload;
      saveLocalCache(cacheKey, data); // Promote to L1
      logToTerminal(`⚡ L2 CACHE HIT: Firestore [${versionedKey}]`, 'info');
      return data;
    }
  } catch (e) {
    console.error("Cache Check Error:", e);
  }
  return null;
}

// ⚡ FIRE-AND-FORGET: cache saving never blocks the response pipeline
function saveToAICache(cacheKey: string, payload: any) {
  saveLocalCache(cacheKey, payload); // L1 instant
  if (!db) return;
  const versionedKey = `${cacheKey}${FIRESTORE_CACHE_VERSION}`;
  Promise.resolve().then(async () => {
    try {
      const cacheRef = doc(db, "ai_cache", versionedKey);
      await setDoc(cacheRef, {
        payload,
        createdAt: serverTimestamp(),
        version: FIRESTORE_CACHE_VERSION
      });
    } catch (e) {
      console.error("Cache Save Error:", e);
    }
  });
}
// ==========================================

export function getBoardLanguage(board: string) {
  const b = board?.toLowerCase() || "";
  if (b.includes("maharashtra") || b.includes("mumbai")) return "Marathi";
  if (b.includes("gujarat")) return "Gujarati";
  if (b.includes("karnataka")) return "Kannada";
  if (b.includes("tamil")) return "Tamil";
  if (b.includes("telangana") || b.includes("andhra")) return "Telugu";
  if (b.includes("bengal")) return "Bengali";
  if (b.includes("kerala")) return "Malayalam";
  if (b.includes("punjab")) return "Punjabi";
  if (b.includes("odisha")) return "Odia";
  return "Hindi"; // Default translation for CBSE/ICSE/Hindi belt
}

/**
 * Validates the quality of the generated notes.
 */
export function validateNotes(data: any) {
  // Match the actual schema returned by generateAInotes prompt:
  // { meta, masterNotes, pdfContent }
  const hasMasterNotes = data.masterNotes && (
    data.masterNotes.snapshotConcepts ||
    (data.masterNotes.definitions?.length > 0) ||
    (data.masterNotes.fiveOneLinePoints?.length > 0)
  );
  const hasPdfContent = data.pdfContent?.sections?.length > 0;
  // Also support legacy schema fallback
  const hasLegacyTopics = (data.notes?.full?.topics?.length > 0) || (data.topics?.length > 0);
  return hasMasterNotes || hasPdfContent || hasLegacyTopics;
}

// Auto-detect subject from topic — comprehensive coverage for all Indian school board subjects
function detectSubjectFromTopic(topic: string, userData?: any): string {
  // Trust caller if they already know the subject
  if (userData?.strictSubject && userData.strictSubject !== 'General') return userData.strictSubject;

  const t = topic.toLowerCase();

  // Physics
  if (/newton|force|motion|velocity|acceleration|energy|wave|optic|electric|magnetic|quantum|thermo|fluid|gravit|work|power|light|sound|atom|nucleus|semi.?cond|circuit|ohm|lens|mirror|refraction|reflection|capacitor|inductor|pressure|buoyancy|archimedes|heat|temperature|friction|momentum|torque|angular|centripetal|kepler|doppler/.test(t)) return 'Physics';

  // Chemistry
  if (/acid|base|salt|bond|reaction|periodic|organic|mole|solution|oxidat|redox|polymer|carbon|alkane|alkene|alkyne|benzene|element|compound|mixture|electrolysis|corrosion|combustion|catalyst|chemical|metal|nonmetal|ionic|covalent|hydrogen|oxygen|nitrogen|ph |indicator|titration|soap|detergent|petroleum|coal|plastic|rubber|fertilizer/.test(t)) return 'Chemistry';

  // Biology
  if (/cell|tissue|organ|evolution|genetic|dna|rna|virus|bacteria|plant|animal|photosyn|respir|digest|nervous|enzyme|hormone|ecosystem|biodiversity|food.chain|reproduction|heredity|variation|adaptation|microorganism|fungi|algae|protozoa|vaccination|immunity|blood|heart|lung|kidney|liver|brain|neuron|muscle|skeleton|phototropism|transpiration|pollination|fertilization|germination|chlorophyll|mitosis|meiosis|chromosome|gene|allele|mendel/.test(t)) return 'Biology';

  // Mathematics
  if (/triangle|algebra|polynomial|quadratic|arithmetic|geometr|circle|proof|statistic|probabilit|calculus|matrix|vector|integral|derivative|logarithm|permutation|combination|progression|series|binomial|coordinate|parabola|ellipse|function|limit|set theory|number system|rational|irrational|complex number|determinant|inequality|ratio|proportion|percentage|profit|loss|interest|mensuration|volume|surface area|perimeter|theorem/.test(t)) return 'Mathematics';

  // History
  if (/mughal|british|revolt|independence|gandhi|nehru|partition|harappa|maurya|gupta|maratha|coloniz|nationalism|french revolution|world war|civil war|industrial revolution|renaissance|reform|untouchability|swaraj|swadeshi|non.cooperation|civil.disobedience|quit.india|jallianwala|salt.march|vedic|indus|civilization|emperor|sultan|dynasty|kingdom|empire|treaty|battle of|freedom fighter|revolutionary/.test(t)) return 'History';

  // Geography
  if (/\bmap\b|river|mountain|climate|soil|forest|agriculture|population|resource|disaster|latitude|longitude|continent|ocean|sea|bay|gulf|strait|peninsula|island|plateau|plain|desert|rainfall|monsoon|erosion|deposition|weathering|rock|mineral|earthquake|volcano|tsunami|flood|drought|irrigation|dam|transport|sustainable|environment|pollution|ozone|greenhouse/.test(t)) return 'Geography';

  // Political Science
  if (/constitution|parliament|election|judiciary|preamble|fundamental rights|duties|federalism|democracy|policy|government|president|prime.minister|cabinet|legislature|executive|lok.sabha|rajya.sabha|high.court|supreme.court|amendment|citizenship|franchise|vote|party|sovereignty|secularism/.test(t)) return 'Political Science';

  // Economics
  if (/supply|demand|gdp|inflation|\bmarket\b|trade|budget|\bbank\b|\bmoney\b|poverty|development|econom|micro|macro|consumer|producer|price|elasticity|revenue|cost|monopoly|oligopoly|globalization|liberalization|privatization|nationalization|fiscal|monetary|\btax\b|expenditure|investment|capital|labour|rent|wage|interest|stock|share|forex/.test(t)) return 'Economics';

  // English
  if (/grammar|poem|prose|story|essay|comprehension|tense|verb|noun|pronoun|adjective|adverb|preposition|conjunction|active|passive|voice|speech|direct|indirect|clause|phrase|paragraph|letter|application|report|precis|idiom|figurative|metaphor|simile|alliteration|shakespeare|character|theme|plot|stanza|rhyme/.test(t)) return 'English';

  // Hindi
  if (/doha|kabir|surdas|tulsidas|premchand|munshi|\bhindi\b|kavita|gadya|nibandh|patra|sahitya|vyakaran|upsarg|pratyay|sandhi|samas|vakya|ling|vachan|vibhakti|karak|kriya|ras|chhand|alankar|muhavara|lokokti|paryayvachi|vilom|shabdkosh/.test(t)) return 'Hindi';

  // Computer Science
  if (/algorithm|program|\bcode\b|\bfunction\b|\bloop\b|\barray\b|database|network|\bhtml\b|\bcss\b|python|\bjava\b|operating system|software|hardware|internet|\bweb\b|binary|decimal|hexadecimal|data structure|sorting|searching|recursion|\bclass\b|inheritance|polymorphism|encapsulation|sql|cybersecurity/.test(t)) return 'Computer Science';

  // Accountancy
  if (/ledger|journal|balance sheet|trial balance|debit|credit|audit|depreciation|asset|liability|\bcapital\b|revenue|expense|cash flow|fund flow|ratio analysis|partnership|shares|debenture|financial statement|trading account/.test(t)) return 'Accountancy';

  // Business Studies
  if (/entrepreneur|marketing|management|organisation|staffing|directing|controlling|coordination|delegation|authority|responsibility|motivation|leadership|advertising|brand|consumer protection/.test(t)) return 'Business Studies';

  // Sanskrit
  if (/sanskrit|shloka|sutra|granth|vedic|upanishad|gita|ramayana|mahabharat|panini|ashtadhyayi|dhatu|shabd|lakar/.test(t)) return 'Sanskrit';

  // Physical Education
  if (/physical education|yoga|asana|pranayama|nutrition|diet|fitness|exercise|training|first.aid|doping|olympic|commonwealth/.test(t)) return 'Physical Education';

  return userData?.subject || 'General';
}

export async function generateAInotes(topic: string, userData: any, mode: "full" | "short" | "revision" | "remedial" = "full", retryCount = 0, topicAccuracy?: number): Promise<any> {
  const accNum = userData?.totalSolved > 0 ? Number(((userData?.correctAnswers / userData?.totalSolved) * 100).toFixed(0)) : 50;
  const acc = accNum.toString();
  const level = accNum < 40 ? "weak" : accNum < 75 ? "average" : "strong";
  const boardName = userData?.board || "CBSE";
  const clsName = userData?.cls || "10th";
  const lang = getBoardLanguage(boardName);
  const subject = detectSubjectFromTopic(topic, userData);

  // CACHE CHECK
  const safeTopic = topic.replace(/\W+/g, '_').toLowerCase();
  const cacheKey = `notes_${mode}_${level}_${boardName.replace(/\W+/g, '')}_${clsName.replace(/\W+/g, '')}_${safeTopic}`;
  
  if (retryCount === 0) {
    const cachedData = await checkAICache(cacheKey);
    if (cachedData) return cachedData;
  }

  const startTime = Date.now();
  logToTerminal(`${retryCount > 0 ? '🔄 Retrying' : '🤖'} Generating notes: "${topic}" [${subject}, ${clsName}, ${boardName}, ${level}]`);

  const remedialExtra = mode === "remedial"
    ? `\nREMEDIAL MODE: Student scored <50%. Explain like a beginner. Add 3 real-world analogies. Focus on common mistakes.`
    : "";

  const isLanguageSubject = ['Hindi', 'English', 'Sanskrit'].includes(subject);
  const isMaths = subject === 'Mathematics';
  const formulaLabel = isLanguageSubject ? 'Key rule / literary device / grammar rule' : isMaths ? 'Mathematical formula or expression' : 'Formula or equation (if applicable)';

  const prompt = `You are a SENIOR EXAM EXPERT and ${subject} teacher for Class ${clsName} students (${boardName} Board).
You must generate ULTRA-COMPREHENSIVE, 100% ACCURATE, EXAM-LEVEL bilingual study notes for the topic: "${topic}"

Subject: ${subject} | Class: ${clsName} | Board: ${boardName} | Student Level: ${level}
Languages: English + ${lang}
${remedialExtra}

STRICT RULES — FOLLOW EXACTLY:
1. Output ONLY valid JSON. Zero text outside JSON. No markdown. No code blocks.
2. Every fact, formula, date, name, and definition MUST be verified against NCERT/${boardName} textbooks.
3. Every array must have exactly 2-3 high-quality items. Empty arrays are FORBIDDEN.
4. Keep all content descriptions concise (2-3 sentences max) to ensure fast rendering.
5. ALL key fields must be bilingual (English + ${lang}).
6. Questions must match actual ${boardName} board exam paper pattern and difficulty.
7. Short questions = 2-3 marks, Long questions = 5-6 marks. Model answers must be complete.
8. LATEX EQUATION RULE: All mathematical expressions, equations, chemical equations, and formulas MUST be written in clean, standard LaTeX math format (e.g. use \\\\frac{a}{b} for fractions, \\\\cdot for multiplication, ^ for superscript, _ for subscript). Example: \\\\frac{G \\\\cdot m_1 \\\\cdot m_2}{r^2}. Do NOT write plain text equations like 'a/b' or use '*' for multiplication.
${mode === 'revision' ? '9. REVISION MODE: Extra concise, only essentials.' : ''}

OUTPUT EXACTLY THIS JSON SCHEMA (fill EVERY field — no nulls, no empty arrays):
{
  "meta": {
    "topic": "${topic}",
    "subject": "${subject}",
    "class": "${clsName}",
    "board": "${boardName}",
    "studentLevel": "${level}",
    "mode": "${mode}",
    "accuracy": ${acc},
    "wikiSearchTerm": "Exact title of a Wikipedia article that has a highly relevant educational diagram/image for this topic. Example: for 'Reflection of Light' use 'Reflection (physics)'. Set to 'None' if no specific diagram article exists."
  },
  "intro": "3-4 line engaging introduction in English",
  "introHindi": "Same introduction in ${lang}",
  "topics": [
    {
      "title": "Sub-topic name in English (use official NCERT terminology)",
      "titleHindi": "Name in ${lang}",
      "content": "Clear detailed explanation in English (2-3 sentences)",
      "contentHindi": "Same explanation in ${lang}",
      "definition": "Precise textbook definition in English",
      "definitionHindi": "Definition in ${lang}",
      "examLine": "One powerful exam-ready sentence that guarantees marks if written in answers",
      "formula": "${formulaLabel}. Write 'None' ONLY if truly no formula exists.",
      "subPoints": ["Key point 1", "Key point 2"]
    }
  ],
  "formulas": [
    {
      "title": "Formula or Rule name",
      "equation": "The complete formula/rule/equation. Use 'None' only if subject has zero formulas.",
      "usage": "Exact context: when, why and how to apply this formula"
    }
  ],
  "memoryTricks": [
    {
      "trick": "Creative mnemonic or memory shortcut in English",
      "trickHindi": "Same trick in ${lang}"
    }
  ],
  "shortQuestions": [
    {
      "q": "2-3 mark question exactly as asked in ${boardName} board exams",
      "qHindi": "Same question in ${lang}",
      "a": "Complete model answer (2-3 points)",
      "aHindi": "Model answer in ${lang}",
      "marks": 3,
      "tip": "Quick tip: how to write this answer to score full marks"
    }
  ],
  "longQuestions": [
    {
      "q": "5-6 mark long question as asked in ${boardName} board exams",
      "qHindi": "Same question in ${lang}",
      "a": "Detailed model answer with all key points (minimum 5 points)",
      "aHindi": "Model answer in ${lang}",
      "marks": 5,
      "keyPoints": ["Essential point 1", "Essential point 2"],
      "tip": "Strategy: how to structure this answer to get 5/5"
    }
  ],
  "subjectiveQuestions": [
    {
      "q": "Full board exam style question",
      "a": "Complete model answer with all key points",
      "easyWay": "Simple shortcut or tip to write this answer",
      "solutionSteps": ["Step 1", "Step 2"],
      "weightage": 5
    }
  ],
  "objectiveQuestions": [
    {
      "q": "MCQ question exactly matching board exam pattern",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": 0,
      "explanation": "Detailed explanation of why the correct option is right"
    }
  ],
  "quickRevision": [
    { "en": "One-liner key revision point in English", "hi": "Same in ${lang}" }
  ],
  "importancePoints": [
    { "en": "Critical exam fact in English", "hi": "In ${lang}" }
  ],
  "summary": ["Key takeaway 1", "Key takeaway 2"],
  "finalCheatSheet": [
    "🔥 MUST REMEMBER: [Most important fact]",
    "📌 EXAM TRICK: [A trick that helps in MCQs]"
  ],
  "examBooster": {
    "highProbabilityTopics": ["Sub-topic 1", "Sub-topic 2"],
    "boardFrequency": "Analysis: how often does this topic appear in ${boardName} exams",
    "predictedQuestion": "The most likely question to appear in the next board exam"
  },
  "solvedExample": {
    "question": "A realistic, exam-style solved problem",
    "solution": ["Step 1", "Step 2"]
  },
  "masterNotes": {
    "snapshotConcepts": "Complete 2-3 sentence overview paragraph. ${lang} mein: same paragraph in ${lang}.",
    "definitions": [{"term": "Key term", "definition": "Precise definition"}],
    "formulaSheet": [{"formula": "Expression", "meaning": "What it means", "symbols": "Symbols", "siUnits": "Units", "conditions": "When to use", "mistake": "Mistake to avoid"}],
    "shortTricks": ["Memory trick 1"],
    "commonMistakes": [{"mistake": "What students commonly do wrong", "correction": "The correct approach"}],
    "solvedExample": {"question": "Sample problem", "stepByStepSolution": ["Step 1", "Step 2"]},
    "pyqPoint": "Types of questions that have appeared in the last 5 years",
    "faqs": [{"q": "Most common doubt", "a": "Clear answer"}],
    "memoryTricks": ["Best mnemonic"],
    "revisionSummary": "One complete paragraph: everything a student needs to know — English + ${lang}",
    "fiveOneLinePoints": ["One-liner 1", "One-liner 2"]
  },
  "improvementPlanNew": {
    "weakAreas": ["Area students struggle with"],
    "practicePlan": ["Day 1: Read concepts (15 min)", "Day 2: Practice MCQs (20 min)"]
  },
  "adaptiveLearningNew": {
    "currentLevelAnalysis": "Assessment of difficulty and what to focus on",
    "difficultyAdjustment": "${level === 'weak' ? 'Increase difficulty gradually' : 'Maintain level'}"
  },
  "diagramSuggestions": [
    {
      "label": "Detailed caption describing the diagram",
      "wikiTitle": "Exact title of a Wikipedia article showing this diagram.",
      "section": "snapshot",
      "insertAfterConcept": "Name of concept"
    }
  ]
}`;

  try {
    const result = await jsonModel.generateContent(prompt);
    const response = await result.response;
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    const usage = response.usageMetadata;
    if (usage) recordTokenUsage(usage, "SmartNotes");
    const tokenInfo = usage ? `[Tokens: ${usage.totalTokenCount}]` : "";

    const text = response.text().replace(/```json/g, "").replace(/```/g, "").trim();
    let data: any;

    try {
      data = JSON.parse(text);
    } catch (e) {
      let cleanedText = text.replace(/\\(?!["\/nrt])/g, "\\\\");
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      data = JSON.parse(jsonMatch ? jsonMatch[0] : cleanedText);
    }

    // ✅ Post-process: ensure topics array is NEVER empty for any subject
    if (!data.topics || data.topics.length === 0) {
      const mn = data.masterNotes || {};
      data.topics = (mn.definitions || []).map((def: any) => ({
        title: def.term || topic,
        titleHindi: def.term || topic,
        content: def.definition || mn.snapshotConcepts || data.intro || '',
        contentHindi: def.definition || data.introHindi || '',
        definition: def.definition || '',
        definitionHindi: def.definition || '',
        examLine: (mn.fiveOneLinePoints || [])[0] || '',
        formula: (data.formulas || [])[0]?.equation || '',
        subPoints: mn.fiveOneLinePoints?.slice(0, 3) || mn.shortTricks || []
      }));
      // If still empty, create one synthetic topic
      if (data.topics.length === 0) {
        data.topics = [{
          title: topic,
          titleHindi: topic,
          content: mn.snapshotConcepts || data.intro || `Overview of ${topic}`,
          contentHindi: data.introHindi || '',
          definition: (mn.definitions || [])[0]?.definition || '',
          definitionHindi: '',
          examLine: (mn.fiveOneLinePoints || [])[0] || `${topic} is important for ${boardName} exams`,
          formula: (data.formulas || [])[0]?.equation || (mn.formulaSheet || [])[0]?.formula || '',
          subPoints: mn.fiveOneLinePoints?.slice(0, 5) || []
        }];
      }
    }

    // ✅ Ensure intro fields always present
    if (!data.intro && data.masterNotes?.snapshotConcepts) data.intro = data.masterNotes.snapshotConcepts;
    if (!data.introHindi && data.masterNotes?.snapshotConcepts) data.introHindi = data.masterNotes.snapshotConcepts;

    // ✅ Ensure objectiveQuestions structure correct
    if (data.objectiveQuestions) {
      data.objectiveQuestions = data.objectiveQuestions.map((q: any) => ({
        ...q,
        q: q.q || q.question || q.text || 'Question',
        options: q.options || [],
        correct: typeof q.correct === 'number' ? q.correct : (typeof q.correctAnswer === 'number' ? q.correctAnswer : 0),
      }));
    }

    if (!validateNotes(data) && retryCount < 2) {
      logToTerminal(`⚠️ Notes validation failed, retrying... (${retryCount + 1}/2)`, 'error');
      return generateAInotes(topic, userData, mode, retryCount + 1);
    }

    logToTerminal(`✅ Notes ready: "${topic}" [${subject}] in ${duration}s ${tokenInfo}`, 'info');
    if (retryCount === 0) saveToAICache(cacheKey, data);

    const subjectName = userData?.strictSubject || subject;
    logGenerationMetric(boardName, subjectName, "smart_notes", 1).catch(e => console.error(e));

    return data;
  } catch (error: any) {
    console.error("❌ ERROR in generateAInotes:", error);
    if (retryCount < 2) {
      logToTerminal(`🔄 Retrying notes generation (attempt ${retryCount + 2})...`, 'error');
      return generateAInotes(topic, userData, mode, retryCount + 1);
    }
    throw error;
  }
}






export async function generateAIQuestions(topic: string, userData: any, subjectContext?: string, mode: string = "full") {
  const accNum = userData?.totalSolved > 0 ? Number(((userData?.correctAnswers / userData?.totalSolved) * 100).toFixed(0)) : 50;
  const acc = accNum.toString();
  const level = accNum < 40 ? "weak" : accNum < 75 ? "average" : "strong";
  const startTime = Date.now();
  const context = subjectContext ? `${subjectContext} - ${topic}` : topic;
  const boardName = userData?.board || "CBSE";
  const clsName = userData?.cls || "10th";
  const lang = getBoardLanguage(boardName);

  const contextLower = context.toLowerCase();
  const strictSubLower = userData?.strictSubject?.toLowerCase() || "";
  let languageRule = `2. 🧠 STRICT BILINGUAL LANGUAGE: The "text" and "explanation" MUST be written in BOTH English AND ${lang}. (e.g., "What is gravity? (गुरुत्वाकर्षण क्या है?)"). This is non-negotiable.`;
  
  if (contextLower.includes("hindi") || strictSubLower.includes("hindi")) {
      languageRule = `2. 🧠 STRICT LANGUAGE OVERRIDE: The "text", "options", and "explanation" MUST be written ENTIRELY in Hindi language ONLY. Do not use English unless quoting.`;
  } else if (contextLower.includes("english") || strictSubLower.includes("english")) {
      languageRule = `2. 🧠 STRICT LANGUAGE OVERRIDE: The "text", "options", and "explanation" MUST be written ENTIRELY in English language ONLY. Do not use ${lang} or Hindi.`;
  }


  // CACHE CHECK (Enabled with 3-level performance buckets: weak/average/strong)
  const safeContext = context.replace(/\W+/g, '_').toLowerCase();
  const cacheKey = `questions_${mode}_${level}_${boardName.replace(/\W+/g, '')}_${clsName.replace(/\W+/g, '')}_${safeContext}`;
  const cachedData = await checkAICache(cacheKey);
  if (cachedData) {
    logToTerminal(`⚡ L1/L2 CACHE HIT: Returning saved test questions for level [${level}]`);
    return cachedData;
  }
  logToTerminal(`🎯 GENERATING ADAPTIVE TEST: "${context}" (User Acc: ${acc}%, Level: ${level})`);

  const strictSubjectRule = userData?.strictSubject
    ? `\n🔴 ABSOLUTE RULE: You are generating a SUBJECT-SPECIFIC test. ALL 10 questions MUST be from the subject "${userData.strictSubject}" ONLY.\n   - Do NOT include questions from Physics, Chemistry, Maths, Biology, Social Science, English or ANY OTHER subject.\n   - Every single question must be from "${userData.strictSubject}" syllabus only.\n   - If you include questions from other subjects, the entire response will be rejected.\n`
    : "";

  const pyqYearRule = userData?.pyqYear
    ? `\n📜 PYQ MODE — STRICT YEAR LOCK:\n   - These questions MUST be based on the ${userData.pyqYear} ${userData.board || "CBSE"} ${userData.cls || "Class 10"} Board Exam pattern.\n   - Generate questions that were actually asked or are highly likely repeats from the ${userData.pyqYear} board exam.\n   - Include "examProbability" of 85-99 for all questions (PYQs have very high repeat probability).\n   - Set "importance": "High" for all questions.\n   - In the "explanation", mention: "This type of question was asked in ${userData.pyqYear} Board Exam."\n   - Focus strictly on the official syllabus topics that were covered in ${userData.pyqYear} board papers.\n`
    : "";

  const prompt = `
    Generate a JSON array of ${!isNaN(Number(mode)) ? mode : (mode === "mock50" ? "50" : "10")} high-quality MCQs for: "${context}".
    Board: ${userData?.board || "CBSE"}
    Class: ${userData?.cls || "10th"}
    ${strictSubjectRule}
    ${pyqYearRule}
    🚨 IMPORTANT: Questions must strictly follow the syllabus of the specified Board and Class. 🚨
    
    ${MATH_INSTRUCTION}
    
    JSON Schema Requirement:
    [
      {
        "text": "Question with LaTeX",
        "options": ["A", "B", "C", "D"],
        "correctAnswer": 0, // MUST BE AN INTEGER (0, 1, 2, or 3) indicating the correct option index.
        "explanation": "Brief reasoning",
        "importance": "High|Medium|Low",
        "examProbability": 85,
        "subject": "The specific academic subject this question belongs to (e.g., Physics, Math, History)"
      }
    ]

    Rules:
    1. Adaptive Difficulty for accuracy: ${acc}%.
    ${languageRule}
    3. Return ONLY valid JSON array. No preamble.
    4. 🚨 ULTRA-STRICT ACCURACY: You MUST triple-check the correctAnswer index. It MUST be an INTEGER (0, 1, 2, or 3) and it MUST point to the factually and mathematically correct option. Before setting the index, solve the question step-by-step in your explanation to guarantee 100% accuracy. NEVER mark a wrong option as correct.
    5. ${mode === "mock50" ? "CRITICAL: You MUST return exactly 50 questions, highly focused on the most probable board exam questions." : mode === "pyq" ? `You MUST return exactly 10 questions in strict PYQ style for ${userData?.pyqYear || ""} board exam.` : "You must return exactly 10 questions."}
  `;

  try {
    

    const result = await jsonModel.generateContent(prompt);
    const response = await result.response;

    if (!response || !response.text) {
      throw new Error("AI returned an empty response. It might be blocked by safety filters.");
    }

    const text = response.text();
    let questions = [];
    try {
      questions = JSON.parse(text);
    } catch (e) {
      try {
        const cleanedText = text.replace(/```json|```/g, "").trim();
        const jsonMatch = cleanedText.match(/\[[\s\S]*\]/);
        questions = JSON.parse(jsonMatch ? jsonMatch[0] : cleanedText);
      } catch (innerErr) {
        throw new Error("Failed to parse JSON questions: " + (e as Error).message);
      }
    }
    
    if (questions && !Array.isArray(questions) && typeof questions === 'object') {
      if (Array.isArray((questions as any).questions)) {
        questions = (questions as any).questions;
      } else {
        const possibleArray = Object.values(questions).find(val => Array.isArray(val));
        if (possibleArray) {
          questions = possibleArray;
        }
      }
    }

    const formatted = (Array.isArray(questions) ? questions : []).map((q: any, idx: number) => {
      let parsedCorrect = 0;
      const rawAns = q.correctAnswer !== undefined ? q.correctAnswer : q.correct;
      
      if (typeof rawAns === 'number' && rawAns >= 0 && rawAns <= 3) {
        parsedCorrect = rawAns;
      } else if (typeof rawAns === 'string') {
        const up = rawAns.toUpperCase().trim();
        if (up === 'A' || up === '1') parsedCorrect = 0;
        else if (up === 'B' || up === '2') parsedCorrect = 1;
        else if (up === 'C' || up === '3') parsedCorrect = 2;
        else if (up === 'D' || up === '4') parsedCorrect = 3;
        else if (up === '0') parsedCorrect = 0;
        else if (q.options && Array.isArray(q.options)) {
           const foundIdx = q.options.findIndex((opt: string) => typeof opt === 'string' && opt.toLowerCase().includes(rawAns.toLowerCase()));
           if (foundIdx !== -1) parsedCorrect = foundIdx;
        }
      }

      return {
        id: `ai_q_${Date.now()}_${idx}`,
        text: q.text || q.question || q.q || "Question text missing",
        options: q.options || [],
        correctAnswer: parsedCorrect,
        correct: parsedCorrect,
        explanation: q.explanation || "",
        importance: q.importance || "Medium",
        examProbability: q.examProbability || (Math.floor(Math.random() * 30) + 60),
        topic: q.subject || q.topic || "General"
      };
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    const usage = response.usageMetadata;
    if (usage) recordTokenUsage(usage, "Adaptive Test");
    const tokenInfo = usage ? `[Tokens: ${usage.totalTokenCount}]` : "";



    // logToTerminal(`✅ SUCCESS: Adaptive test (${formatted.length} Qs) generated in ${duration}s ${tokenInfo}`);
    const validated = autoCorrectMCQs(formatted);
    saveToAICache(cacheKey, validated);
    
    // Log tracking
    logGenerationMetric(boardName, strictSubLower || "Mixed Subject", "test_questions", validated.length).catch(e => console.error(e));
    
    return validated;
  } catch (error: any) {
    console.error("❌ MCQ Generation Failed:", error);
    logToTerminal(`❌ ERROR in generateAIQuestions: ${error.message}`, 'error');
    throw error;
  }
}

export async function generateAIAnalysis(userData: any) {
  const prompt = `Analyze: Correct: ${userData?.correctAnswers}, Total: ${userData?.totalSolved}. Return JSON.`;
  try {
    const result = await model.generateContent(prompt);
    const jsonMatch = result.response.text().match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON");
    return JSON.parse(jsonMatch[0]);
  } catch (error: any) { throw error; }
}

export async function generateSingleReplacementQuestion(topic: string, oldQuestionText: string, userData: any, subjectContext?: string) {
  const context = subjectContext ? `${subjectContext} - ${topic}` : topic;
  const boardName = userData?.board || "CBSE";
  const clsName = userData?.cls || "10th";
  const lang = getBoardLanguage(boardName);

  const contextLower = context.toLowerCase();
  const strictSubLower = userData?.strictSubject?.toLowerCase() || "";
  let languageRule = `1. STRICT BILINGUAL LANGUAGE: The "text" and "explanation" MUST be written in BOTH English AND ${lang}.`;
  
  if (contextLower.includes("hindi") || strictSubLower.includes("hindi")) {
      languageRule = `1. STRICT LANGUAGE OVERRIDE: The "text", "options", and "explanation" MUST be written ENTIRELY in Hindi language ONLY. Do not use English unless quoting.`;
  } else if (contextLower.includes("english") || strictSubLower.includes("english")) {
      languageRule = `1. STRICT LANGUAGE OVERRIDE: The "text", "options", and "explanation" MUST be written ENTIRELY in English language ONLY. Do not use ${lang} or Hindi.`;
  }

  const prompt = `
    Generate a JSON array containing EXACTLY 1 new high-quality MCQ for: "${context}".
    Board: ${userData?.board || "CBSE"}
    Class: ${userData?.cls || "10th"}
    
    IMPORTANT CONTEXT:
    The user just correctly answered a question similar to this: "${oldQuestionText}".
    DO NOT generate a question that tests the exact same concept or uses similar numbers/phrasing.
    Generate a NEW question on a DIFFERENT concept or a harder variation within the same topic.
    
    ${MATH_INSTRUCTION}
    
    JSON Schema Requirement:
    [
      {
        "text": "Question with LaTeX",
        "options": ["A", "B", "C", "D"],
        "correctAnswer": 0,
        "explanation": "Brief reasoning",
        "importance": "High|Medium|Low",
        "examProbability": 85,
        "subject": "The specific academic subject this question belongs to"
      }
    ]

    Rules:
    ${languageRule.replace(/^2\./, '1.')}
    2. Return ONLY valid JSON array with exactly 1 object. No preamble.
    3. ULTRA-STRICT ACCURACY: You MUST triple-check the correctAnswer index.
  `;

  try {
    const result = await jsonModel.generateContent(prompt);
    const response = await result.response;
    if (!response || !response.text) throw new Error("Empty response");

    const text = response.text().trim();
    let jsonStr = text;
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const data = JSON.parse(jsonStr);
    return data[0];
  } catch (error: any) {
    console.error("ERROR in generateSingleReplacementQuestion:", error);
    return null;
  }
}

export async function generateAIPYQs(topic: string, userData: any): Promise<any[]> {
  const startTime = Date.now();
  const boardName = userData?.board || "CBSE";
  const clsName = userData?.cls || "10th";
  
  // CACHE CHECK
  const safeTopic = topic.replace(/\W+/g, '_').toLowerCase();
  const cacheKey = `pyqs_${boardName.replace(/\W+/g, '')}_${clsName.replace(/\W+/g, '')}_${safeTopic}`;
  const cachedData = await checkAICache(cacheKey);
  if (cachedData) return cachedData;

  logToTerminal(`🎯 ANALYZING TOPIC FOR PYQs: "${topic}"`);

  const prompt = `
    Analyze the topic: "${topic}". 
    Generate 10 Previous Year Questions (PYQs) that have appeared in major exams (CBSE, ICSE, NEET, JEE etc).
    If real data isn't available, simulate extremely high-fidelity exam questions for this topic.
    Include Board name and Year for each question.
    🧠 STRICT BILINGUAL LANGUAGE: The "text" and "explanation" MUST be written in BOTH English AND the target language (e.g. Hindi, Gujarati, etc) based on the board context. (e.g., "What is gravity? (गुरुत्वाकर्षण क्या है?)"). This is non-negotiable.
    Return strictly JSON array:
    [{
      "id": string,
      "text": "Question text in English + Target Language",
      "options": [string, string, string, string],
      "correctAnswer": number (0-3),
      "exam": "CBSE 2023 / NEET 2022 etc",
      "explanation": "Detailed explanation in English + Target Language"
    }]
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("No JSON array found");
    const data = JSON.parse(jsonMatch[0]);
    const usage = response.usageMetadata;
    if (usage) {
      recordTokenUsage(usage, "PYQ Generation");
    }
    const tokenInfo = usage ? `[Tokens: ${usage.totalTokenCount}]` : "";
    logToTerminal(`✅ PYQs GENERATED: Found ${data.length} questions for "${topic}" in ${((Date.now() - startTime) / 1000).toFixed(1)}s ${tokenInfo}`);
    saveToAICache(cacheKey, data);
    return data;
  } catch (error: any) {
    logToTerminal(`❌ ERROR in generateAIPYQs: ${error.message}`, 'error');
    return [];
  }
}
export async function generateAISyllabus(board: string, cls: string, subject: string, chapter: string): Promise<any> {
  const startTime = Date.now();
  const currentYear = new Date().getFullYear();

  // CACHE CHECK
  const safeChapter = chapter.replace(/\W+/g, '_').toLowerCase();
  const cacheKey = `syllabus_${board.replace(/\W+/g, '')}_${cls.replace(/\W+/g, '')}_${subject.replace(/\W+/g, '')}_${safeChapter}`;
  const cachedData = await checkAICache(cacheKey);
  if (cachedData) return cachedData;

  logToTerminal(`🎯 ANALYZING CURRICULUM: "${chapter}" for ${board} Class ${cls}`, 'info');

  const prompt = `
    You are an academic syllabus data engine. Generate structured syllabus data for Indian school boards.
    Analyze the chapter: "${chapter}" in the context of the subject "${subject}" for Board: ${board}, Class: ${cls}.
    
    Requirements:
    1. Topics: 5-10 topics belonging EXCLUSIVELY to "${chapter}".
    2. Subtopics: 3-6 subtopics per topic.
    3. Importance: Assign "high" (frequently asked), "medium", or "low".
    4. Frequency: For each subtopic, indicate if it appeared in board exams for each of the last 5 years (${currentYear-4} to ${currentYear}).
    
    Output Format (STRICT JSON ONLY):
    {
      "board": "${board}",
      "class": "${cls}",
      "subject": "${subject}",
      "chapter": "${chapter}",
      "topics": [
        {
          "topic_name": "string",
          "subtopics": [
            {
              "name": "string",
              "importance": "high|medium|low",
              "frequency": {
                "${currentYear-4}": boolean,
                "${currentYear-3}": boolean,
                "${currentYear-2}": boolean,
                "${currentYear-1}": boolean,
                "${currentYear}": boolean
              }
            }
          ]
        }
      ]
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleanedText = text.replace(/```json|```/g, "").trim();
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in AI Syllabus response");

    const data = JSON.parse(jsonMatch[0]);
    logToTerminal(`✅ SYLLABUS BUILT: "${chapter}" in ${((Date.now() - startTime) / 1000).toFixed(1)}s`, 'info');
    saveToAICache(cacheKey, data);
    return data;
  } catch (error: any) {
    console.error("❌ ERROR in generateAISyllabus:", error);
    throw error;
  }
}
export async function generateAIChapters(board: string, cls: string, subject: string): Promise<string[]> {
  const startTime = Date.now();
  logToTerminal(`📚 GENERATING CHAPTER LIST: "${subject}" for ${board} ${cls}`, 'info');

  const prompt = `
    You are an expert curriculum designer for Indian Education.
    List all standard chapters for: Subject: ${subject}, Board: ${board}, Class: ${cls}.
    
    Output Format (STRICT JSON ONLY):
    ["Chapter 1: Full Name", "Chapter 2: Full Name", ...]
    🚨 IMPORTANT: Include both the Chapter Number and the Full Descriptive Name for each chapter. 🚨
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleanedText = text.replace(/```json|```/g, "").trim();
    const jsonMatch = cleanedText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("No JSON array found in AI Chapter response");

    const chapters = JSON.parse(jsonMatch[0]);
    logToTerminal(`✅ CHAPTERS BUILT: ${chapters.length} chapters found in ${((Date.now() - startTime) / 1000).toFixed(1)}s`, 'info');
    return chapters;
  } catch (error: any) {
    console.error("❌ ERROR in generateAIChapters:", error);
    return [];
  }
}

export async function generateQuickStudyCards(subjects: string[], board: string, cls: string) {
  const startTime = Date.now();
  const lang = getBoardLanguage(board);

  // CACHE DISABLED: Generate fresh cards every time
  // const safeSubjects = subjects.join('_').replace(/\W+/g, '_').toLowerCase();
  // const cacheKey = `flashcards_${board.replace(/\W+/g, '')}_${cls.replace(/\W+/g, '')}_${safeSubjects}`;
  // const cachedData = await checkAICache(cacheKey);
  // if (cachedData) return cachedData;

  logToTerminal(`🎴 GENERATING QUICK STUDY CARDS: [${subjects.join(', ')}] for ${board} ${cls} in ${lang}`, 'info');

  const prompt = `
    You are an expert Indian school teacher. FAST GENERATE 10 high-impact "One-Liner" study cards.
    These cards MUST contain ONLY 100% SURE, HIGH PROBABILITY questions and facts that are guaranteed to come in exams.
    Focus exclusively on VVIP material. Skip all basic fluff.
    🧠 STRICT BILINGUAL OUTPUT: You MUST generate the content in BOTH English AND ${lang}. This is non-negotiable.

    Target:
    Board: ${board}
    Class: ${cls}
    Subjects: ${subjects.join(', ')}
    
    Output Format (STRICT JSON ARRAY ONLY):
    [
      {
        "id": "unique_id_string",
        "question": "The one-liner question or fact in English + ${lang}",
        "answer": "The direct answer or explanation in English + ${lang}",
        "subject": "The subject name",
        "importance": "High"
      }
    ]

    Rules:
    1. 🚨 STRICT SUBJECT RULE: You MUST ONLY generate cards for the requested Subjects: ${subjects.join(', ')}. DO NOT include cards from any other subjects.
    2. Focus on conceptual clarity and "Topper-level" facts.
    3. Language: English + simple ${lang} mix.
    4. Keep it ultra-concise (1 line max for question/fact).
    5. RANDOMIZE the topics to ensure fresh content every time.
  `;

  try {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("achivox_task_completed", { detail: { type: "quick_study" } }));
    }
    

    const result = await jsonModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const usage = response.usageMetadata;
    if (usage) recordTokenUsage(usage, "Quick Study Cards");
    
    const data = JSON.parse(text);
    logToTerminal(`✅ QUICK STUDY CARDS READY: ${data.length} cards in ${((Date.now() - startTime) / 1000).toFixed(1)}s`, 'info');
    // saveToAICache(cacheKey, data);
    return data;
  } catch (error: any) {
    console.error("❌ ERROR in generateQuickStudyCards:", error);
    return [];
  }
}

/**
 * GENERATE TOPPER'S HANDWRITTEN-STYLE NOTES
 */
export async function generateTopperNotes(
  topic: string,
  subject: string,
  clsOrUserData: any,
  boardParam?: string,
  goalModeParam?: string,
  languageParam?: string
): Promise<any> {
  const startTime = Date.now();
  
  let cls = "12th";
  let board = "CBSE";
  let goalMode = "Board Exams";
  let language = "Hinglish";

  if (clsOrUserData && typeof clsOrUserData === "object") {
    cls = clsOrUserData.cls || "12th";
    board = clsOrUserData.board || "CBSE";
    goalMode = clsOrUserData.goal || "Board Exams";
    language = clsOrUserData.language || "Hinglish";
  } else {
    cls = clsOrUserData || "12th";
    board = boardParam || "CBSE";
    goalMode = goalModeParam || "Board Exams";
    language = languageParam || "Hinglish";
  }

  const boardLang = getBoardLanguage(board);
  let normalizedLanguage = language;
  if (language === "en-hi" || language === "Hinglish") {
    normalizedLanguage = `Bilingual English + ${boardLang}`;
  }

  logToTerminal(`📝 GENERATING TOPPER'S HANDWRITTEN NOTES: "${topic}" for ${subject} in ${normalizedLanguage} (Goal: ${goalMode})`);

  const prompt = `
    Act as an expert subject-matter professor and textbook illustrator. You are also a Rank 1 Topper mentor. 
    Your core task is to generate premium, high-yield, exam-focused "Handwritten-Style" revision notes that are strictly accurate and educationally relevant.
    Topic: ${topic}
    Subject: ${subject}
    Class: ${cls}
    Board: ${board}
    Target Goal: ${goalMode}
    Preferred Language: ${normalizedLanguage}

    🚨 EXAM GOAL & STRICT SYLLABUS CONSTRAINT (CRITICAL) 🚨
    - The content MUST be precisely tailored to the Target Goal: ${goalMode}.
    - If the Target Goal is a competitive exam (e.g., JEE, NEET, CUET), include advanced concepts, high difficulty, and exam shortcuts.
    - If the Target Goal is a School or Board Exam (e.g., Class 9th, 10th for CBSE/State Board):
      1. EXACT TEXTBOOK MATCH: The content, concepts, and depth MUST exactly match the official textbook (e.g., NCERT) for Class ${cls} ${board} board.
      2. STRICTLY NO EXTRA CONTENT: Absolutely DO NOT include any extra information, advanced formulas, higher-class derivations, or out-of-syllabus topics. If the topic is in Class ${cls}, explain it EXACTLY as the Class ${cls} book does, nothing more.
      3. EXACT DIAGRAMS: Diagram suggestions MUST strictly match the standard, basic diagrams given in the Class ${cls} textbook.

    🚨 STAGE-BY-STAGE PAGE SIZE & CONTENT LIMITATION RULES (CRITICAL FOR A4 PDF PRINTING) 🚨
    To prevent PDF page overflows, content splitting across A4 pages, or text cuts, you MUST strictly limit the volume of generated content as follows:
    1. MNEMONICS & SHORTCUTS: Include high-quality mnemonics/memory aids to help the student memorize facts.
    2. LATEX EQUATION RULE: All mathematical expressions, equations, chemical equations, and formulas MUST be written in clean, standard LaTeX math format (e.g. use \\\\frac{a}{b} for fractions, \\\\cdot for multiplication, ^ for superscript, _ for subscript). Example: \\\\frac{G \\\\cdot m_1 \\\\cdot m_2}{r^2}. Do NOT write plain text equations like 'a/b' or use '*' for multiplication.

    STRICT QUANTITATIVE CONSTRAINTS (NO EXCEPTIONS):
    3. Chapter Snapshot: Provide exactly 5 summary points.
    4. Key Concepts: Provide exactly 2 concepts.
    5. Definitions: Provide exactly 3-4 key definitions (1-2 lines each).
    6. Diagram Suggestions: Provide exactly 3-4 diagram suggestions total. Each suggestion's "label" MUST be a detailed explanation of the diagram, showing what each part's name is, how it functions, and listing mandatory labels/arrows.
    7. Exam Booster Facts: Provide exactly 2 facts under frequentlyAsked, 2 under oneMark, and 2 under boardFavourites.
    8. Common Mistakes: Provide exactly 2 mistake boxes.
    9. Memory Mnemonics: Provide exactly 1 mnemonic.
    10. NCERT Highlights: Provide exactly 3 key lines.
    11. PYQs: Provide exactly 2 MCQs (with 4 choice options each), exactly 2 Short Answer QAs, and exactly 1 Long Answer QA.
    12. One Page Revision Summary: Provide exactly 4 bullet points.

    🚨 SPECIAL CHARACTERS & EMOJI ENCODING RULES (CRITICAL) 🚨
    - Use only standard alphanumeric text, standard math expressions, and clean standard emojis (e.g. 📖, 💡, ⚙️, ⚖️, 🗺️, 📐, 🚀, ❌, 🧠, 📚, 🎯).
    - NEVER generate corrupted, double-encoded, or strange character glyphs (like ðŸ“, à¤, etc.) for Hindi or special labels. Keep Hindi text in clean, standard UTF-8 Devanagari Unicode.

    OUTPUT LANGUAGE REQUIREMENT:
    - If Preferred Language is "English", write all content in clear, student-friendly English.
    - If Preferred Language is "Hinglish", write the notes using a natural Hindi-English mix (Hinglish in Latin script).
    - If Preferred Language is "Hindi", write the explanations and questions in Hindi (using Devanagari script), keeping technical terms in English where appropriate.
    - If Preferred Language is "Bilingual English + [Language]" (e.g. Bilingual English + Hindi/Marathi/etc.): For all key text, definitions, explanations, questions, and revision points, you MUST provide them in standard English, immediately followed by their translation in [Language] (using standard script, e.g. Devanagari for Hindi). This is critical for students to understand concepts in both languages.

    STRICT JSON SCHEMA:
    {
      "metadata": {
        "topic": "${topic}",
        "subject": "${subject}",
        "class": "${cls}",
        "board": "${board}",
        "goal": "${goalMode}",
        "language": "${language}",
        "date": "Revision Day"
      },
      "chapterSnapshot": [
        "5 to 10 most important points summarizing the topic, bulleted, exam-focused"
      ],
      "keyConcepts": [
        {
          "concept": "Concept Name",
          "details": ["Concept-wise explanation in short bullet points. No long paragraphs."]
        }
      ],
      "definitions": [
        {
          "term": "Term Name",
          "definition": "Precise, exam-friendly definition that scores maximum marks"
        }
      ],
      "formulas": [
        {
          "formula": "e.g., F = G * (m1 * m2) / r^2",
          "symbolsMeaning": "e.g., F = Force of attraction, G = Gravitational constant, m1, m2 = masses, r = distance",
          "usageTip": "Quick tip on how to use it or common mistake, e.g., 'Always convert distance r to meters first!'"
        }
      ],
      "comparisons": [
        {
          "title": "e.g., Difference between Scalar and Vector Quantities",
          "headers": ["Property", "Scalar", "Vector"],
          "rows": [
            ["Definition", "Has magnitude only", "Has both magnitude and direction"],
            ["Examples", "Mass, Temperature, Time", "Force, Velocity, Acceleration"]
          ]
        }
      ],
      "flowcharts": [
        "Text-based hierarchical flowchart or mindmap representing relationships or processes, e.g., Matter -> Pure Substance (Elements, Compounds) / Mixture (Homogeneous, Heterogeneous)"
      ],
      "examBoosterFacts": {
        "frequentlyAsked": ["Frequently asked exam facts"],
        "oneMark": ["Typical 1-mark questions and key points"],
        "boardFavourites": ["Board exam/Competitive exam examiner favourites"]
      },
      "commonMistakes": [
        {
          "error": "Common student error description",
          "correction": "How to do it correctly"
        }
      ],
      "memoryTricks": [
        "First mnemonic: funny and easy to remember (e.g. My Very Educated Mother Just Served Us Noodles)",
        "Second mnemonic: for a different formula or concept"
      ],
      "ncertHighlights": [
        "Important textbook lines/quotes that are high probability for exams"
      ],
      "pyqs": {
        "mcqs": [
          {
            "question": "Question text?",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "answer": "Correct Option (e.g., Option A: explanation)"
          }
        ],
        "shortAnswers": [
          {
            "question": "Question text?",
            "answer": "Ideal concise topper-style answer"
          }
        ],
        "longAnswers": [
          {
            "question": "Question text?",
            "answer": "Ideal structured answer with headings, points, or steps"
          }
        ]
      },
      "onePageRevision": [
        "Ultra-short final revision notes (super condensed for last-minute review)"
      ],
      "highlighterPoints": [
        "List of exactly 10-15 keywords or terms used in the notes that should be highlighted in yellow (e.g., 'inertia', 'acceleration')"
      ],
      "diagramSuggestions": [
        {
          "label": "Detailed caption containing the diagram description and a list of mandatory labels/arrows needed for exam-readiness (e.g., 'Newton's Law of Gravitation: Showing two spherical masses m1 and m2 separated by distance r, with equal and opposite force vectors F1 and F2 pointing towards each other. Mandatory Labels: m1, m2, r, F1, F2.')",
          "wikiTitle": "Exact Wikipedia article title whose page image/thumbnail best illustrates this concept (e.g., 'Newton's_law_of_universal_gravitation')",
          "section": "snapshot OR core OR visuals OR mistakes OR pyqs",
          "insertAfterConcept": "Name of the concept/heading after which this diagram should appear (e.g., 'Universal Law of Gravitation')"
        }
      ]
    }

    DIAGRAM RULES (STRICT):
    - Provide 3-6 diagramSuggestions per topic. More complex topics = more diagrams.
    - NO BIOGRAPHY/PORTRAITS: Do NOT suggest general article titles of historical figures or scientists (e.g., 'Isaac_Newton', 'Albert_Einstein') as these display portraits or photos of people. Instead, use specific physical process or diagrammatic article titles (e.g., 'Newton's_law_of_universal_gravitation', 'Bohr_model', 'Chemical_bond').
    - NO GENERIC SUBJECTS: Do NOT use broad generic subject/curriculum titles (e.g., 'Physics', 'Chemistry', 'Biology', 'Mathematics', 'Science') as the wikiTitle. Use only specific sub-topic titles that point to actual diagrammatic pages.
    - NO MISMATCHED GRAPHICS: Do NOT suggest random internet-scraped, out-of-context, or advanced research lab graphs (e.g. advanced engineering data or satellite anomaly maps). Suggest only standard, direct textbook diagrams.
    - ACCURATE CONTEXT ONLY: Every diagram suggestion must directly represent the core concept mentioned in that specific section.
    - TEXTBOOK STANDARD: Suggest standard, clean, and accurate diagrams that perfectly match academic school/college textbooks (like NCERT reference books).
    - LABELS MATTER: In the 'label' field, you must clearly specify the mandatory labels, parts, and arrows required to make the diagram technically correct for school exams.
    - wikiTitle MUST be a real, existing Wikipedia article title that has an image on its page.
    - Use English Wikipedia article titles (underscores for spaces).
    - Distribute diagrams across at least 2-3 different sections.
    - insertAfterConcept must match an actual concept name in keyConcepts, or a heading like "Chapter Snapshot", "Formula Sheet", "Text Flowchart", etc.

    OUTPUT RULES:
    - Never include markdown other than the JSON object. Do not wrap the JSON in \`\`\`json.
    - Ensure all keys exist. If a section like formulas is not applicable, return an empty array [] but keep the key.
    - Ensure the response is a single valid JSON block.
    - Make sure the content looks authentic and highly accurate.
  `;

  try {
    const result = await jsonModel.generateContent(prompt);
    const text = result.response.text().replace(/```json|```/g, "").trim();
    const data = JSON.parse(text);
    
    recordTokenUsage(result.response.usageMetadata, "topper_notes");
    
    // Log tracking
    logGenerationMetric(board, subject, "topper_notes", 1).catch(e => console.error(e));

    return data;
  } catch (error) {
    console.error("Gemini Topper Notes Error:", error);
    return null;
  }
}

/**
 * AI SCAN & SOLVE: Vision-based doubt solving
 */
export async function solveImageDoubt(base64Image: string, mimeType: string, userData: any) {
  const startTime = Date.now();
  logToTerminal(`📸 SCANNING DOUBT IMAGE [Mime: ${mimeType}]`);

  const prompt = `
    You are an expert tutor for ${userData?.board || "CBSE"} Class ${userData?.cls || "10th"}.
    Analyze this image of a study question (Handwritten or Printed).
    
    TASK:
    1. Extract the exact Question Text.
    2. Provide a step-by-step Solution.
    3. State the Final Answer clearly.
    4. Mention the Key Concept involved.
    5. Give a "Pro-Tip" to solve similar questions faster.

    ${MATH_INSTRUCTION}

    STRICT JSON OUTPUT:
    {
      "question": "",
      "solution": ["Step 1...", "Step 2..."],
      "finalAnswer": "",
      "concept": "",
      "proTip": "",
      "subject": ""
    }

    Style: Detailed, easy to understand, and academic.
  `;

  try {
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: mimeType
        }
      }
    ]);

    const text = result.response.text().replace(/```json|```/g, "").trim();
    const data = JSON.parse(text);
    
    recordTokenUsage(result.response.usageMetadata, "scan_solve");
    logToTerminal(`✅ IMAGE SOLVED in ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
    return data;
  } catch (error) {
    console.error("Gemini Vision Error:", error);
    return null;
  }
}

/**
 * AI IMPORTANT CONCEPTS: Generate subject-specific formulas and key facts
 */
export async function generateImportantConcepts(board: string, cls: string, subject: string) {
  const startTime = Date.now();
  
  // CACHE CHECK
  const safeBoard = board.replace(/\W+/g, '').toLowerCase();
  const safeCls = cls.replace(/\W+/g, '').toLowerCase();
  const safeSubject = subject.replace(/\W+/g, '_').toLowerCase();
  const cacheKey = `concepts_${safeBoard}_${safeCls}_${safeSubject}`;

  const cachedData = await checkAICache(cacheKey);
  if (cachedData) return cachedData;

  logToTerminal(`📚 GENERATING CONCEPTS [${board} ${cls} ${subject}]`);

  const prompt = `
    You are an expert ${board} Class ${cls} ${subject} teacher.
    Generate a highly accurate "Cheat Sheet" of important concepts, formulas, rules, or key facts for the entire syllabus.
    - If Math/Science: Focus on formulas, laws, and chemical equations.
    - If Hindi/English: Focus on grammar rules, important authors/poets, or poetic devices.
    - If Social Science: Focus on key dates, historical events, or map locations.

    STRICT JSON OUTPUT:
    {
      "subject": "${subject}",
      "categories": [
        {
          "name": "Category Name (e.g., Algebra Formulas, or Important Poets)",
          "items": [
            {
              "title": "Item Title (e.g., Quadratic Formula)",
              "content": "Explanation or Formula. Use LaTeX formatting for math, like $x = {-b \\pm \\sqrt{b^2-4ac} \\over 2a}$."
            }
          ]
        }
      ]
    }
    Make sure to include at least 4 categories and 5 items per category.
  `;

  try {
    
    const result = await jsonModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      let cleanedText = text.replace(/\\(?!["\\/nrt])/g, "\\\\");
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : cleanedText);
    }
    logToTerminal(`✅ CONCEPTS GENERATED IN ${Date.now() - startTime}ms`);
    saveToAICache(cacheKey, parsed);
    return parsed;
  } catch (error) {
    console.error("Gemini Concept Error:", error);
    return null;
  }
}


/**
 * AI SMART TIMETABLE: Dynamic scheduling based on weaknesses
 */
export async function generateSmartTimetable(weaknesses: string[], goals: string[], userData: any, pastPerformance?: string) {
  const startTime = Date.now();
  logToTerminal(`📅 GENERATING SMART TIMETABLE [Weaknesses: ${weaknesses.length}]`);

  const performancePrompt = pastPerformance 
    ? `\n    PAST WEEK PERFORMANCE:\n    ${pastPerformance}\n    - Analyze their past week performance and generate a "lastWeekReview" message (friendly but strict, like a topper mentor). Adjust this week's plan to compensate for missed targets if any.\n` 
    : "";

  const prompt = `
    You are an expert academic counselor. Generate a high-performance 7-day study timetable for:
    User Class: ${userData?.cls || "12th"}
    Board: ${userData?.board || "CBSE"}
    Weak Areas: ${weaknesses.join(", ")}
    Current Goals: ${goals.join(", ")}${performancePrompt}

    STRICT JSON OUTPUT:
    {
      "timetable": [
        {
          "day": "Monday",
          "slots": [
            { "time": "06:00 AM", "activity": "Deep Study", "subject": "", "focus": "Weak Topic 1", "reason": "Focus on high-impact weak area first." },
            { "time": "04:00 PM", "activity": "Practice", "subject": "", "focus": "MCQ Batch", "reason": "" }
          ]
        }
      ],
      "mentorAdvice": "Overall strategy for the week.",
      "energyEfficiency": "95%",
      "lastWeekReview": "Leave empty if no past performance. Otherwise, give 2 lines of feedback."
    }

    Rules:
    - Prioritize weak areas in the morning (Fresh mind).
    - Mix subjects to avoid boredom.
    - Include short "Quick Study" slots for revision.
    - Use "Topper Style" advice.
  `;

  try {
    

    const result = await jsonModel.generateContent(prompt);
    const text = result.response.text().replace(/```json|```/g, "").trim();
    
    // Extract JSON in case of extra text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in AI Timetable response");
    
    const data = JSON.parse(jsonMatch[0]);
    
    recordTokenUsage(result.response.usageMetadata, "timetable");
    return data;
  } catch (error) {
    console.error("Gemini Timetable Error:", error);
    return null;
  }
}

export async function generateSchoolProject(topic: string, userData: any, bilingual: boolean = false) {
  const startTime = Date.now();
  logToTerminal(`🛠️ GENERATING SCHOOL PROJECT: "${topic}" (Bilingual: ${bilingual})`);

  const boardName = userData?.board || "CBSE";
  const boardLang = getBoardLanguage(boardName);

  const bilingualInstruction = bilingual 
    ? `\n    🚨 BILINGUAL REQUIREMENT: You MUST provide all text (title, objective, steps, conclusion, partName, explanation) FIRST in ENGLISH, followed immediately by the translation in ${boardLang}. Example: "Water Cycle / जल चक्र" or "First take a bottle. (सबसे पहले एक बोतल लें।)".`
    : "";

  const prompt = `
    You are an expert school science and art teacher. Generate a highly detailed, realistic school project guide for:
    Topic: ${topic}
    Class: ${userData?.cls || "10th"}
    Board: ${boardName}
    ${bilingualInstruction}

    STRICT JSON OUTPUT SCHEMA:
    {
      "title": "Catchy Project Title",
      "objective": "What will this project prove or demonstrate?",
      "materials": ["Item 1", "Item 2"],
      "steps": [
        { "step": 1, "description": "Do this..." },
        { "step": 2, "description": "Then do this..." }
      ],
      "conclusion": "The scientific principle or final observation",
      "imagePrompt": "A detailed visual description for the main project cover image. MUST BE IN ENGLISH ONLY.",
      "gallery": [
        {
          "imagePrompt": "A detailed visual description of this part for an AI image generator. MUST BE IN ENGLISH ONLY (e.g. 'realistic glowing magma chamber underground').",
          "partName": "Name of this part or area",
          "explanation": "How this specific area/part works in the project"
        },
        // Provide exactly 3 to 4 gallery items
      ]
    }
    
    Ensure the JSON is strictly valid and contains no markdown outside of the JSON block.
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleanedText = text.replace(/```json|```/g, "").trim();
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found for school project");
    
    const data = JSON.parse(jsonMatch[0]);
    recordTokenUsage(result.response.usageMetadata, "project");
    return data;
  } catch (error) {
    console.error("Gemini Project Error:", error);
    return null;
  }
}

// ---------------------------------------------------------
// NEW FEATURE: MOCK EXAM SIMULATOR
// ---------------------------------------------------------
export async function generateMockExamPaper(userData: any) {
  const goal = userData?.goal || "Class 10 CBSE Science";
  
  const prompt = `
    You are an expert strict exam paper setter for ${goal}.
    Generate a highly probable Mock Exam Paper based strictly on the syllabus and past 10-year paper trends.
    
    CRITICAL RULE: You MUST ONLY include questions that you are 100% confident have a very high probability of appearing in the actual exam. If there is even a 1% doubt that a question is low-yield or out of syllabus, DO NOT include it. The structure should feel exactly like a final exam paper.
    
    ${MATH_INSTRUCTION}

    The paper must contain:
    - title: e.g., "Final Mock Exam - ${goal}"
    - instructions: An array of 3-4 standard exam instructions.
    - mcqs: An array of 5 highly probable Multiple Choice Questions.
    - subjectives: An array of 5 highly probable Subjective/Long-answer questions.

    Output ONLY valid JSON strictly adhering to this structure:
    {
      "title": "String",
      "instructions": ["String", "String"],
      "mcqs": [
        {
          "id": "m1",
          "question": "String",
          "options": ["A", "B", "C", "D"],
          "correctAnswer": "String (Must match one option exactly)",
          "explanation": "String"
        }
      ],
      "subjectives": [
        {
          "id": "s1",
          "question": "String",
          "marks": "Number (e.g. 3 or 5)",
          "answer": "String (Detailed ideal answer for the student to memorize)",
          "markingScheme": ["Point 1 (1 Mark)", "Point 2 (1 Mark)"]
        }
      ]
    }
  `;

  try {
    const result = await jsonModel.generateContent(prompt);
    const text = result.response.text();
    const cleanedText = text.replace(/```json|```/g, "").trim();
    const data = JSON.parse(cleanedText);
    
    recordTokenUsage(result.response.usageMetadata, "mock_exam");
    return data;
  } catch (error) {
    console.error("Gemini Mock Exam Error:", error);
    return null;
  }
}

// ==============================================================================
// AI MINI-GAMES ENGINE
// ==============================================================================
export async function generateMiniGame(subject: string, chapter: string, gameType: "match" | "timeline", userData: any) {
  try {
    const languageStr = userData?.goalLanguage === "Hinglish" ? "Hinglish (mix of Hindi and English)" : userData?.goalLanguage === "Hindi" ? "Hindi (written in Devanagari script)" : "English";
    
    let prompt = "";
    if (gameType === "match") {
      prompt = `
      You are an expert educational game designer. Create a "Match the Following" game for Class ${userData?.cls || "10"}, Board: ${userData?.board || "CBSE"}, Subject: ${subject}, Chapter: ${chapter}.
      Language: ${languageStr}. MUST be strictly in this language.
      
      Generate exactly 5 matching pairs. They should be concepts vs definitions, formulas vs names, or historical dates vs events.
      Make them educational but slightly tricky so the student has to think.
      
      Return ONLY a JSON array of objects with exactly this structure:
      [
        { "id": "1", "leftItem": "Concept A", "rightItem": "Matching Definition for A" },
        ... 5 items
      ]
      DO NOT wrap in markdown \`\`\`json blocks. Return ONLY valid raw JSON.
      `;
    } else {
      prompt = `
      You are an expert educational game designer. Create a "Timeline/Sequence Ordering" game for Class ${userData?.cls || "10"}, Board: ${userData?.board || "CBSE"}, Subject: ${subject}, Chapter: ${chapter}.
      Language: ${languageStr}. MUST be strictly in this language.
      
      Generate exactly 5 events, processes, or steps that must be ordered chronologically or sequentially.
      (e.g., historical events in order, biological process steps, mathematical derivation steps).
      
      Return ONLY a JSON array of objects in the CORRECT sequence (from first to last) with exactly this structure:
      [
        { "id": "1", "text": "First event/step" },
        { "id": "2", "text": "Second event/step" },
        ... 5 items
      ]
      DO NOT wrap in markdown \`\`\`json blocks. Return ONLY valid raw JSON.
      `;
    }

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    let cleanedText = text.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim();
    
    const parsedData = JSON.parse(cleanedText);
    
    recordTokenUsage(result.response.usageMetadata, "MiniGame Engine");
    return parsedData;

  } catch (error) {
    console.error("MiniGame Generation Error:", error);
    logToTerminal("Failed to generate MiniGame", "error", error);
    return null;
  }
}

export function autoCorrectMCQs(questions: any[]): any[] {
  return questions.map((q) => {
    try {
      const text = q.text || q.q || "";
      const options = q.options || [];
      if (options.length === 0) return q;

      // Parse correct answer if it's a string
      let resolvedCorrect = q.correctAnswer !== undefined ? q.correctAnswer : (q.correct !== undefined ? q.correct : 0);
      
      if (typeof resolvedCorrect === 'string') {
        const strVal = resolvedCorrect.trim();
        // 1. Is it a number string?
        if (/^\d+$/.test(strVal)) {
          resolvedCorrect = parseInt(strVal, 10);
        }
        // 2. Is it A, B, C, D?
        else if (/^[A-D]$/i.test(strVal)) {
          resolvedCorrect = strVal.toUpperCase().charCodeAt(0) - 65;
        }
        // 3. Match option text
        else {
          const matchIdx = options.findIndex((opt: any) => String(opt).trim().toLowerCase() === strVal.toLowerCase());
          if (matchIdx !== -1) {
            resolvedCorrect = matchIdx;
          } else {
            // Fallback for partial matches
            const partialIdx = options.findIndex((opt: any) => String(opt).toLowerCase().includes(strVal.toLowerCase()) || strVal.toLowerCase().includes(String(opt).toLowerCase()));
            if (partialIdx !== -1) resolvedCorrect = partialIdx;
          }
        }
      }

      if (typeof resolvedCorrect !== 'number' || resolvedCorrect < 0 || resolvedCorrect >= options.length) {
        resolvedCorrect = 0;
      }
      q.correctAnswer = resolvedCorrect;
      q.correct = resolvedCorrect;

      // 1. Binary to Decimal Auto-Correction
      const hasBinaryWord = /binary|बाइनरी/i.test(text);
      const hasDecimalWord = /decimal|दशमलव/i.test(text);

      if (hasBinaryWord && hasDecimalWord) {
        // Try to extract binary number, e.g., (1011)₂ or (1011)2 or 1011
        let binaryStr = "";
        const parenMatch = text.match(/\(([01]+)\)/);
        if (parenMatch) {
          binaryStr = parenMatch[1];
        } else {
          // Look for binary patterns ending with a subscript 2 (₂, 2, or _2) or just stand-alone binary strings
          const subMatch = text.match(/\b([01]+)(?:₂|2|_2)\b/) || text.match(/\b([01]{3,12})\b/);
          if (subMatch) {
            binaryStr = subMatch[1];
          }
        }

        if (binaryStr && binaryStr.length >= 2) {
          const decimalVal = parseInt(binaryStr, 2);
          // Find option that represents this decimal value exactly
          const correctIdx = options.findIndex((opt: any) => {
            const optStr = String(opt).trim();
            return optStr === String(decimalVal) || optStr.match(new RegExp(`^\\b${decimalVal}\\b$`));
          });

          if (correctIdx !== -1 && correctIdx !== q.correctAnswer) {
            console.log(`[Auto-Correction] Corrected Binary-to-Decimal index for "${binaryStr}" -> ${decimalVal} (from ${q.correctAnswer} to ${correctIdx})`);
            return {
              ...q,
              correctAnswer: correctIdx,
              correct: correctIdx,
              explanation: `[Auto-Corrected] Factually corrected by Achivox Math Engine. Binary (${binaryStr})₂ is mathematically equal to decimal ${decimalVal}.\n\n${q.explanation}`
            };
          }
        }
      }

      // 2. Decimal to Binary Auto-Correction
      if (hasDecimalWord && hasBinaryWord) {
        // Find decimal numbers in text
        const decimalMatches = text.match(/\b(\d{1,4})\b/g) || [];
        for (const decStr of decimalMatches) {
          const decVal = parseInt(decStr, 10);
          if (decVal === 2 || decVal === 10 || decVal === 8 || decVal === 16) continue;

          const binaryStr = decVal.toString(2);
          // Find option matching this binary string
          const correctIdx = options.findIndex((opt: any) => {
            const optStr = String(opt).trim().replace(/[()_]/g, "");
            return optStr === binaryStr || optStr.match(new RegExp(`^\\b${binaryStr}\\b$`));
          });

          if (correctIdx !== -1 && correctIdx !== q.correctAnswer) {
            console.log(`[Auto-Correction] Corrected Decimal-to-Binary index for ${decVal} -> "${binaryStr}" (from ${q.correctAnswer} to ${correctIdx})`);
            return {
              ...q,
              correctAnswer: correctIdx,
              correct: correctIdx,
              explanation: `[Auto-Corrected] Factually corrected by Achivox Math Engine. Decimal ${decVal} is mathematically equal to binary (${binaryStr})₂.\n\n${q.explanation}`
            };
          }
        }
      }
    } catch (err) {
      console.warn("Auto-Correction Guard Error:", err);
    }
    return q;
  });
}


export async function generateSubjectiveQuestion(topic: string, userData: any, context?: string): Promise<any> {
  const startTime = Date.now();
  const boardName = userData?.board || "CBSE";
  const clsName = userData?.cls || "10th";
  const fullContext = context ? `${context} - ${topic}` : topic;

  logToTerminal(`dYZ_ GENERATING SUBJECTIVE Q FOR: "${fullContext}"`);

  const prompt = `
    You are an expert ${boardName} board examiner for class ${clsName}.
    Generate exactly ONE highly probable, most repeated subjective question for the topic: "${fullContext}".
    
    The question should be a Long Answer (5 Marks) or Short Answer (3 Marks).
    Also generate the PERFECT Topper-Level answer that would score 100% marks in the real exam.
    
    JSON Schema Requirement:
    {
      "question": "The subjective question text",
      "marks": 5,
      "perfectAnswer": "The ideal step-by-step topper answer with bullet points if necessary",
      "keywords": ["keyword1", "keyword2", "keyword3"]
    }
    
    RETURN ONLY JSON. NO MARKDOWN OR EXTRA TEXT.
  `;

  try {
    const result = await jsonModel.generateContent(prompt);
    const response = await result.response;
    const jsonStr = response.text().replace(/^```json\n/, '').replace(/\n```$/, '').trim();
    // Log tracking
    logGenerationMetric(boardName, "Subjective", "subjective_question", 1).catch(e => console.error(e));

    return JSON.parse(jsonStr);
  } catch (error: any) {
    console.error("ERROR in generateSubjectiveQuestion:", error);
    return null;
  }
}

export async function evaluateSubjectiveAnswer(question: string, perfectAnswer: string, userAnswer: string, maxMarks: number, userData: any): Promise<any> {
  const startTime = Date.now();
  const boardName = userData?.board || "CBSE";
  
  logToTerminal(`dYZ_ EVALUATING SUBJECTIVE ANSWER...`);

  const prompt = `
    You are a strict ${boardName} Board Examiner.
    
    Question: ${question}
    Max Marks: ${maxMarks}
    Perfect Answer Key: ${perfectAnswer}
    
    Student's Answer: ${userAnswer}
    
    Evaluate the student's answer based on the perfect answer key. Look for conceptual understanding and key points rather than exact wording.
    
    JSON Schema Requirement:
    {
      "score": 3.5, // The marks awarded out of ${maxMarks} (can be decimal like 2.5)
      "feedback": "Detailed feedback on what the student did right and what points were completely missed.",
      "tips": "Actionable tips for the student on how to write this specific answer better to get full marks in the board exam."
    }
    
    RETURN ONLY JSON. NO MARKDOWN OR EXTRA TEXT.
  `;

  try {
    const result = await jsonModel.generateContent(prompt);
    const response = await result.response;
    const jsonStr = response.text().replace(/^```json\n/, '').replace(/\n```$/, '').trim();
    // Log tracking
    logGenerationMetric(boardName, "Subjective", "subjective_evaluation", 1).catch(e => console.error(e));

    return JSON.parse(jsonStr);
  } catch (error: any) {
    console.error("ERROR in evaluateSubjectiveAnswer:", error);
    return null;
  }
}

import { generateAIQuestions, generateAInotes } from '../lib/gemini';
import { setCache } from '../lib/redis';
import { generateCacheKey } from '../lib/cache-utils';

const POPULAR_TOPICS = [
  { topic: "Photosynthesis", subject: "Biology", cls: "10th", board: "CBSE" },
  { topic: "Laws of Motion", subject: "Physics", cls: "11th", board: "CBSE" },
  { topic: "Quadratic Equations", subject: "Mathematics", cls: "10th", board: "CBSE" },
  { topic: "Indian Constitution", subject: "Civics", cls: "9th", board: "CBSE" },
  { topic: "Acids, Bases and Salts", subject: "Chemistry", cls: "10th", board: "CBSE" },
];

async function preGenerate() {
  console.log('🚀 Starting Pre-generation for popular topics...');

  for (const item of POPULAR_TOPICS) {
    console.log(`[Pre-gen] Processing: ${item.topic} (${item.cls})...`);
    
    try {
      // 1. Generate Questions
      const questions = await generateAIQuestions(item.topic, item, `${item.board} ${item.cls} ${item.subject}`);
      const formattedQuestions = questions.map((q: any) => ({
        q: q.text,
        options: q.options,
        correct: q.correctAnswer,
        topic: q.topic || item.topic,
        importance: q.importance,
        examProbability: q.examProbability,
        explanation: q.explanation
      }));

      const qCacheKey = generateCacheKey('questions', { topic: item.topic, userData: item, subjectContext: `${item.board} ${item.cls} ${item.subject}` });
      await setCache(qCacheKey, formattedQuestions, 3600 * 24 * 7); // 7 days cache

      // 2. Generate Notes
      const notes = await generateAInotes(item.topic, item, 'full');
      const nCacheKey = generateCacheKey('notes', { topic: item.topic, userData: item, mode: 'full' });
      await setCache(nCacheKey, notes, 3600 * 24 * 7);

      console.log(`[Pre-gen] ✅ Success for ${item.topic}`);
    } catch (error: any) {
      console.error(`[Pre-gen] ❌ Failed for ${item.topic}:`, error.message);
    }
  }

  console.log('🏁 Pre-generation complete.');
  process.exit(0);
}

preGenerate();

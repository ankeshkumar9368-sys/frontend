import 'dotenv/config';
import { Worker } from 'bullmq';
import { redis, setCache } from '../lib/redis';
import { generateAInotes, generateAIQuestions, generateAISyllabus, generateAIChapters, generateAIAnalysis } from '../lib/gemini';
import { AI_QUEUE_NAME } from '../lib/aiQueue';
import { generateCacheKey } from '../lib/cache-utils';

console.log('🚀 AI Worker is starting...');

let failureCount = 0;
const FAILURE_THRESHOLD = 5;
const COOLDOWN_PERIOD = 60000; // 1 minute
let lastFailureTime = 0;

const worker = new Worker(
  AI_QUEUE_NAME,
  async (job) => {
    const { name, data } = job;
    console.log(`[Job ${job.id}] Processing ${name}...`);

    // Circuit Breaker Check
    if (failureCount >= FAILURE_THRESHOLD) {
      const now = Date.now();
      if (now - lastFailureTime < COOLDOWN_PERIOD) {
        console.warn(`[Circuit Breaker] Open. Serving fallback for ${job.id}`);
        return getFallbackData(name, data);
      } else {
        console.log(`[Circuit Breaker] Half-Open. Attempting trial...`);
        failureCount = 0; // Reset for trial
      }
    }

    try {
      let result;
      let cachePrefix = '';

      switch (name) {
        case 'generate-notes':
          result = await generateAInotes(data.topic, data.userData, data.mode);
          cachePrefix = 'notes';
          break;
        case 'generate-questions':
          const questions = await generateAIQuestions(data.topic, data.userData, data.subjectContext);
          // Format questions for SchoolTestEngine
          result = questions.map((q: any) => ({
            q: q.text,
            options: q.options,
            correct: q.correctAnswer,
            topic: q.topic || data.topic,
            importance: q.importance,
            examProbability: q.examProbability,
            explanation: q.explanation
          }));
          cachePrefix = 'questions';
          break;
        case 'generate-syllabus':
          result = await generateAISyllabus(data.board, data.cls, data.subject, data.chapter);
          cachePrefix = 'syllabus';
          break;
        case 'generate-chapters':
          result = await generateAIChapters(data.board, data.cls, data.subject);
          cachePrefix = 'chapters';
          break;
        case 'generate-analysis':
          result = await generateAIAnalysis(data.userData);
          cachePrefix = 'analysis';
          break;
        default:
          throw new Error(`Unknown job type: ${name}`);
      }

      failureCount = 0; // Reset on success

      // 1. Save to result store for polling
      await redis.set(`job-result:${job.id}`, JSON.stringify(result), 'EX', 3600);
      
      // 2. Save to long-term cache
      const cacheKey = generateCacheKey(cachePrefix, data);
      await setCache(cacheKey, result);

      console.log(`[Job ${job.id}] ✅ Completed and Cached`);
      return result;
    } catch (error: any) {
      failureCount++;
      lastFailureTime = Date.now();
      console.error(`[Job ${job.id}] ❌ Failed (${failureCount}/${FAILURE_THRESHOLD}):`, error.message);
      
      // If we've failed too many times, return fallback immediately
      if (failureCount >= FAILURE_THRESHOLD) {
        return getFallbackData(name, data);
      }
      
      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 50, // Process 50 jobs at a time
    limiter: {
      max: 100, // Max 100 jobs per 60 seconds (global rate limit)
      duration: 60000,
    },
  }
);

worker.on('failed', (job, err) => {
  console.error(`${job?.id} has failed with ${err.message}`);
});

process.on('SIGTERM', async () => {
  console.log('Worker shutting down...');
  await worker.close();
  process.exit(0);
});

function getFallbackData(name: string, data: any) {
  console.log(`[Fallback] Providing generic content for ${name}`);
  if (name === 'generate-questions') {
    return Array.from({ length: 5 }, (_, i) => ({
      q: `Practice Question ${i + 1} for ${data.topic}. [Fallback Mode]`,
      options: ["Concept A", "Concept B", "Concept C", "Concept D"],
      correct: 0,
      topic: data.topic,
      explanation: "Standard practice question while AI is cooling down."
    }));
  }
  return { 
    message: "System is under heavy load. Please try again in a few minutes.", 
    isFallback: true,
    meta: { topic: data.topic }
  };
}

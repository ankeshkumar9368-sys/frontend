import { NextResponse } from 'next/server';
import { submitAIJob } from './aiQueue';
import { getCache, setCache, isRedisAvailable } from './redis';
import { generateCacheKey } from './cache-utils';
import { rateLimit } from './rate-limiter';

export async function handleAIRequest(
  request: Request,
  jobName: string,
  cachePrefix: string,
  extractParams: (body: any) => any,
  validate: (params: any) => string | null
) {
  try {
    const body = await request.json();
    const params = extractParams(body);
    
    const validationError = validate(params);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    // 1. Rate Limiting
    const ip = request.headers.get('x-forwarded-for') || 'anonymous';
    const limiter = await rateLimit(`user:${ip}`, 5, 60);
    
    if (!limiter.success) {
      return NextResponse.json({ 
        error: "Rate limit exceeded. Please wait...",
        retryAfter: limiter.reset
      }, { status: 429 });
    }

    // 2. Cache Check
    const cacheKey = generateCacheKey(cachePrefix, params);
    const cachedData = await getCache(cacheKey);
    
    if (cachedData) {
      console.log(`[Cache Hit] ${cachePrefix} for ${JSON.stringify(params)}`);
      return NextResponse.json(cachedData);
    }

    // 3. Queue Submission OR Direct Call
    if (!isRedisAvailable) {
      console.log(`[Direct] No Redis detected. Calling ${jobName} directly for ${JSON.stringify(params)}`);
      let result;
      const { generateAInotes, generateAIQuestions, generateAIAnalysis, generateAIPYQs, generateAISyllabus, generateAIChapters } = await import('./gemini');
      
      switch (jobName) {
        case 'generate-notes':
          result = await generateAInotes(params.topic, params.userData, params.mode);
          break;
        case 'generate-questions':
          result = await generateAIQuestions(params.topic, params.userData, params.subjectContext);
          break;
        case 'ai-analysis':
          result = await generateAIAnalysis(params);
          break;
        case 'generate-pyqs':
          result = await generateAIPYQs(params.topic, params.userData);
          break;
        case 'generate-syllabus':
          result = await generateAISyllabus(params.board, params.class, params.subject, params.chapter);
          break;
        case 'generate-chapters':
          result = await generateAIChapters(params.board, params.class, params.subject);
          break;
        default:
          throw new Error("Unknown job type");
      }

      // Cache the result in memory at least
      await setCache(cacheKey, result);
      return NextResponse.json(result);
    }

    console.log(`[Queue] Submitting ${jobName} for ${JSON.stringify(params)}`);
    const jobId = await submitAIJob(jobName, params);

    return NextResponse.json({ 
      status: 'queued', 
      jobId, 
      message: "Generating smart content..." 
    });

  } catch (error: any) {
    console.error(`AI Handler Error (${jobName}):`, error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

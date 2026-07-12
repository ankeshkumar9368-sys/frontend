import axios from 'axios';

const BASE_URL = 'http://localhost:3000';
const CONCURRENT_USERS = 20; // Simulated concurrent requests
const TOPICS = ['Algebra', 'Quantum Physics', 'Indian History', 'Organic Chemistry', 'Cell Biology'];

async function simulateUserRequest(userId: number) {
  const topic = TOPICS[userId % TOPICS.length];
  const startTime = Date.now();
  
  console.log(`👤 [User ${userId}] Requesting: ${topic}...`);
  
  try {
    // 1. Submit Request
    const res = await axios.post(`${BASE_URL}/api/generate-questions`, {
      topic,
      userData: { id: `test_user_${userId}`, board: 'CBSE', cls: '10th' },
      subjectContext: 'Stress Test'
    });

    if (res.data.status === 'queued') {
      const jobId = res.data.jobId;
      console.log(`⏳ [User ${userId}] Job Queued: ${jobId}. Polling...`);
      
      // 2. Polling for result
      let completed = false;
      let attempts = 0;
      
      while (!completed && attempts < 30) {
        attempts++;
        const pollRes = await axios.get(`${BASE_URL}/api/job-status/${jobId}`);
        
        if (pollRes.data.status === 'completed') {
          const duration = (Date.now() - startTime) / 1000;
          console.log(`✅ [User ${userId}] Success in ${duration}s! (Attempts: ${attempts})`);
          completed = true;
          return { success: true, duration };
        } else if (pollRes.data.status === 'failed') {
          console.error(`❌ [User ${userId}] Job Failed: ${pollRes.data.error}`);
          return { success: false, error: 'Job Failed' };
        }
        
        await new Promise(r => setTimeout(r, 2000)); // Poll every 2s
      }
      
      if (!completed) throw new Error('Polling Timeout');
    } else {
      // Cache hit
      const duration = (Date.now() - startTime) / 1000;
      console.log(`⚡ [User ${userId}] Cache Hit in ${duration}s!`);
      return { success: true, duration, cacheHit: true };
    }
  } catch (error: any) {
    const errorMsg = error.response?.data?.error || error.message;
    console.error(`🔴 [User ${userId}] Error: ${errorMsg}`);
    return { success: false, error: errorMsg };
  }
}

async function runStressTest() {
  console.log('🔥 STARTING STRESS TEST...');
  console.log(`🚀 Simulating ${CONCURRENT_USERS} concurrent requests...\n`);
  
  const startTime = Date.now();
  const promises = [];
  
  for (let i = 0; i < CONCURRENT_USERS; i++) {
    promises.push(simulateUserRequest(i));
  }
  
  const results = await Promise.all(promises);
  
  const totalTime = (Date.now() - startTime) / 1000;
  const successes = results.filter(r => r?.success).length;
  const failures = results.length - successes;
  const cacheHits = results.filter(r => r?.cacheHit).length;
  const avgTime = results.filter(r => r?.success).reduce((acc, r) => acc + (r?.duration || 0), 0) / successes;

  console.log('\n' + '='.repeat(30));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(30));
  console.log(`Total Requests: ${CONCURRENT_USERS}`);
  console.log(`Successes:      ${successes} ✅`);
  console.log(`Failures:       ${failures} ❌`);
  console.log(`Cache Hits:     ${cacheHits} ⚡`);
  console.log(`Avg Response:   ${avgTime.toFixed(2)}s ⏱️`);
  console.log(`Total Duration: ${totalTime.toFixed(2)}s 🏁`);
  console.log('='.repeat(30));
}

runStressTest();

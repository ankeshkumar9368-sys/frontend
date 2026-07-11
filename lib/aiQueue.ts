import { Queue } from 'bullmq';
import { redis, isRedisAvailable, setCache } from './redis';

export const AI_QUEUE_NAME = 'ai-generation-queue';

let _aiQueue: any;

export const getAIQueue = () => {
  if (_aiQueue) return _aiQueue;

  if (isRedisAvailable) {
    _aiQueue = new Queue(AI_QUEUE_NAME, {
      connection: redis,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: true,
        removeOnFail: 1000,
      },
    });
    return _aiQueue;
  }

  // Fallback Mock Queue
  return {
    add: async (name: string, data: any) => {
      const mockJobId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      await setCache(`job-result:${mockJobId}`, { status: 'active', name, data });
      setTimeout(async () => {
        await setCache(`job-result:${mockJobId}`, { message: "Mock Result", topic: data.topic });
      }, 3000);
      return { id: mockJobId };
    },
    getJob: async (id: string) => null
  };
};

export const submitAIJob = async (type: string, data: any) => {
  const queue = getAIQueue();
  const job = await queue.add(type, data);
  return job.id;
};

export { _aiQueue as aiQueue };

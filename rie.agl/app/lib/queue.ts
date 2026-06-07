import { Queue } from 'bullmq';
import { redisConfig } from './redis';

const queueName = 'application-queue';

export function getApplicationQueue(): Queue {
  if (typeof window !== 'undefined') {
    throw new Error('BullMQ queues can only be initialized on the server side.');
  }

  // Use global scope in Node to prevent duplicate instances during Next.js Hot Module Replacement reloads
  const globalRef = global as unknown as { [key: string]: Queue };

  if (!globalRef[queueName]) {
    globalRef[queueName] = new Queue(queueName, {
      connection: redisConfig,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    });
  }

  return globalRef[queueName];
}

/**
 * Dispatches a background processing task for an applicant's evaluation job.
 */
export async function addApplicationJob(applicationId: string): Promise<void> {
  try {
    const queue = getApplicationQueue();
    await queue.add('evaluate-application', { applicationId });
    console.log(`[Queue] Enqueued job for application ID: ${applicationId}`);
  } catch (error) {
    console.error(`[Queue] Failed to add job to BullMQ queue:`, error);
  }
}

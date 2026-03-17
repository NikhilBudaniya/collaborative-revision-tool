'use server';

import { pusherServer } from '@/lib/pusher-server';
import { RevisionStatus, RevisionLog, RevisionState } from '@/lib/types';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

// Global Singleton Pattern for Development Persistence (HMR)
const globalForState = global as unknown as {
  globalState: Record<string, RevisionState> | undefined
  queues: Record<string, Promise<any>> | undefined
}

const globalState = globalForState.globalState ?? {}
const queues = globalForState.queues ?? {}

if (process.env.NODE_ENV !== 'production') {
  globalForState.globalState = globalState;
  globalForState.queues = queues;
}

// Ensure updates for the same org are processed sequentially
async function enqueueUpdate(orgId: string, task: () => Promise<any>) {
  if (!queues[orgId]) {
    queues[orgId] = Promise.resolve();
  }
  
  const result = queues[orgId].then(task);
  queues[orgId] = result.catch(() => {}); // Prevent queue crash on task failure
  return result;
}

export async function getRevisionState(): Promise<RevisionState> {
  const cookieStore = await cookies();
  const orgId = cookieStore.get('orgId')?.value || 'ORG_ALPHA';

  if (!globalState[orgId]) {
    globalState[orgId] = {
      status: 'PENDING',
      version: 0,
      lastUpdate: { userId: 'SYSTEM', timestamp: Date.now(), comment: 'Initial system state.' },
      history: [],
    };
  }

  return globalState[orgId];
}

export async function updateRevisionState(status: RevisionStatus, comment: string) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value || 'UNKNOWN_USER';
  const orgId = cookieStore.get('orgId')?.value || 'ORG_ALPHA';

  // Process this update in a per-org queue to avoid race conditions
  return enqueueUpdate(orgId, async () => {
    const currentState = globalState[orgId] || {
      status: 'PENDING',
      version: 0,
      lastUpdate: { userId: 'SYSTEM', timestamp: Date.now(), comment: 'Initial state.' },
      history: [],
    };

    const newVersion = currentState.version + 1;
    const logEntry: RevisionLog = {
      id: uuidv4(),
      userId,
      status,
      timestamp: Date.now(),
      comment: comment || 'No comment provided.',
    };

    const newState: RevisionState = {
      status,
      version: newVersion,
      lastUpdate: {
        userId,
        timestamp: logEntry.timestamp,
        comment: logEntry.comment,
      },
      history: [...currentState.history, logEntry].slice(-50),
    };

    // Atomic update in our singleton cache
    globalState[orgId] = newState;

    // Broadcast the new versioned state
    const channel = `private-org-${orgId}`;
    await pusherServer.trigger(channel, 'STATE_UPDATED', {
      ...newState,
      newLog: logEntry,
    });

    console.log(`[STATE_SYNC] Org: ${orgId}, New Version: ${newVersion}, by: ${userId}`);

    return { success: true, newState };
  });
}

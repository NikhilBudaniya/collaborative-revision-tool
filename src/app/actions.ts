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
  queues[orgId] = result.catch(() => {});
  return result;
}

export async function getRevisionState(): Promise<RevisionState> {
  const cookieStore = await cookies();
  const orgId = cookieStore.get('orgId')?.value || 'ORG_ALPHA';

  if (!globalState[orgId]) {
    globalState[orgId] = {
      status: 'PENDING',
      version: 0,
      lastUpdate: { userId: 'SYSTEM', timestamp: 0, comment: 'Initial system state.' },
      history: [],
    };
  }

  return globalState[orgId];
}

/**
 * Updates the revision state with Chronological Reconciliation.
 * This handles out-of-order updates (e.g. from an offline outbox).
 */
export async function updateRevisionState(
  status: RevisionStatus, 
  comment: string, 
  manualTimestamp?: number, 
  manualId?: string
) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value || 'UNKNOWN_USER';
  const orgId = cookieStore.get('orgId')?.value || 'ORG_ALPHA';

  return enqueueUpdate(orgId, async () => {
    const currentState = globalState[orgId] || {
      status: 'PENDING',
      version: 0,
      lastUpdate: { userId: 'SYSTEM', timestamp: 0, comment: 'Initial state.' },
      history: [],
    };

    // Use client-provided timestamp (from when the user clicked 'Commit')
    // fallback to server time if not provided (online live update)
    const eventTimestamp = manualTimestamp || Date.now();
    const eventId = manualId || uuidv4();

    const logEntry: RevisionLog = {
      id: eventId,
      userId,
      status,
      timestamp: eventTimestamp,
      comment: comment || 'No comment provided.',
    };

    // 1. History Reconciliation: Always add to history and sort chronologically
    // This ensures that offline updates appear in their correct historical position
    const newHistory = [...currentState.history, logEntry]
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-50); // Keep buffer size manageable

    // 2. Current Status Reconciliation: Only update the "Winner" status if the 
    // incoming event is strictly newer than the current "Last Update"
    let newStatus = currentState.status;
    let newLastUpdate = currentState.lastUpdate;

    if (eventTimestamp > currentState.lastUpdate.timestamp) {
      newStatus = status;
      newLastUpdate = {
        userId,
        timestamp: eventTimestamp,
        comment: logEntry.comment,
      };
    } else {
      console.log(`[SYNC_RECONCILE] Event ${eventId} is older than current state. Logged to history, but status preserved.`);
    }

    const newVersion = currentState.version + 1;
    const newState: RevisionState = {
      status: newStatus,
      version: newVersion,
      lastUpdate: newLastUpdate,
      history: newHistory,
    };

    globalState[orgId] = newState;

    // Broadcast the reconciled state
    const channel = `private-org-${orgId}`;
    await pusherServer.trigger(channel, 'STATE_UPDATED', {
      ...newState,
      newLog: logEntry,
    });

    return { success: true, newState };
  });
}

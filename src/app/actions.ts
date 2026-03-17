'use server';

import { pusherServer } from '@/lib/pusher';
import { RevisionStatus, RevisionLog } from '@/lib/types';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

// Since we have no permanent DB, we'll relay the update through Pusher.
// In a real app, you would save to a DB here first.
export async function updateRevisionState(status: RevisionStatus, comment: string) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value || 'UNKNOWN_USER';
  const orgId = cookieStore.get('orgId')?.value;

  if (!orgId) {
    throw new Error('UNAUTHORIZED: Missing orgId');
  }

  const logEntry: RevisionLog = {
    id: uuidv4(),
    userId,
    status,
    timestamp: Date.now(),
    comment,
  };

  // Broadcast to the organization-specific private channel
  const channel = `private-org-${orgId}`;
  
  await pusherServer.trigger(channel, 'STATE_UPDATED', {
    status,
    lastUpdate: {
      userId,
      timestamp: logEntry.timestamp,
      comment,
    },
    newLog: logEntry,
  });

  return { success: true, logEntry };
}

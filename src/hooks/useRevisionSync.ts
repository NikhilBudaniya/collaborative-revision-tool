'use client';

import { useEffect, useState } from 'react';
import { getPusherClient } from '@/lib/pusher-client';
import { RevisionStatus, RevisionLog, RevisionState } from '@/lib/types';
import { getCookie } from '@/lib/cookies';

export function useRevisionSync() {
  const [state, setState] = useState<RevisionState>({
    status: 'PENDING',
    lastUpdate: { userId: '', timestamp: Date.now(), comment: '' },
    history: [],
  });
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const orgId = getCookie('orgId');
    if (!orgId) return;

    const pusher = getPusherClient();
    const channel = pusher.subscribe(`private-org-${orgId}`);

    channel.bind('STATE_UPDATED', (data: { 
      status: RevisionStatus, 
      lastUpdate: { userId: string, timestamp: number, comment: string },
      newLog: RevisionLog 
    }) => {
      setIsSyncing(true);
      
      setState(prev => ({
        status: data.status,
        lastUpdate: data.lastUpdate,
        history: [...prev.history, data.newLog].slice(-50), // Keep last 50
      }));

      // Reset syncing visual after a brief delay
      setTimeout(() => setIsSyncing(false), 1000);
    });

    return () => {
      pusher.unsubscribe(`private-org-${orgId}`);
    };
  }, []);

  return { state, setState, isSyncing };
}

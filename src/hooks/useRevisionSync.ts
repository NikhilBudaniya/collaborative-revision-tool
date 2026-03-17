'use client';

import { useEffect, useState, useRef } from 'react';
import { getPusherClient } from '@/lib/pusher-client';
import { RevisionStatus, RevisionLog, RevisionState } from '@/lib/types';
import { getCookie } from '@/lib/cookies';

const INITIAL_STATE: RevisionState = {
  status: 'PENDING',
  lastUpdate: { userId: 'SYSTEM', timestamp: 0, comment: 'Initial system state.' },
  history: [],
};

export function useRevisionSync() {
  const [state, setState] = useState<RevisionState>(INITIAL_STATE);
  const [isSyncing, setIsSyncing] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);
  const pusherRef = useRef<any>(null);

  // Initial orgId fetch
  useEffect(() => {
    setOrgId(getCookie('orgId') || 'ORG_ALPHA');
  }, []);

  useEffect(() => {
    if (!orgId) return;

    const pusher = getPusherClient();
    if (!pusher) return;
    
    pusherRef.current = pusher;
    const channelName = `private-org-${orgId}`;
    const channel = pusher.subscribe(channelName);

    channel.bind('STATE_UPDATED', (data: { 
      status: RevisionStatus, 
      lastUpdate: { userId: string, timestamp: number, comment: string },
      newLog: RevisionLog 
    }) => {
      setIsSyncing(true);
      
      setState(prev => {
        if (prev.history.some(log => log.id === data.newLog.id)) {
          return prev;
        }

        return {
          status: data.status,
          lastUpdate: data.lastUpdate,
          history: [...prev.history, data.newLog].slice(-50),
        };
      });

      const timer = setTimeout(() => setIsSyncing(false), 1000);
      return () => clearTimeout(timer);
    });

    return () => {
      pusher.unsubscribe(channelName);
      pusherRef.current = null;
    };
  }, [orgId]);

  return { state, setState, isSyncing };
}

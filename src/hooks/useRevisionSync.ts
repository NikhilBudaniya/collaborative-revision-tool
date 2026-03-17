'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { getPusherClient } from '@/lib/pusher-client';
import { RevisionStatus, RevisionLog, RevisionState } from '@/lib/types';
import { getCookie } from '@/lib/cookies';
import { playEffect } from '@/lib/sounds';

const INITIAL_STATE: RevisionState = {
  status: 'PENDING',
  version: 0,
  lastUpdate: { userId: 'SYSTEM', timestamp: 0, comment: 'Initial system state.' },
  history: [],
};

export type ConnectionStatus = 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'ERROR';

export function useRevisionSync() {
  const [state, setState] = useState<RevisionState>(INITIAL_STATE);
  const [isSyncing, setIsSyncing] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('CONNECTING');
  
  const versionRef = useRef(0);
  const pusherRef = useRef<any>(null);

  useEffect(() => {
    setOrgId(getCookie('orgId') || 'ORG_ALPHA');
  }, []);

  useEffect(() => {
    if (!orgId) return;

    const pusher = getPusherClient();
    if (!pusher) {
      setConnectionStatus('ERROR');
      return;
    }
    
    pusherRef.current = pusher;

    // Monitor Connection State
    pusher.connection.bind('state_change', (states: any) => {
      console.log(`[PUSHER_STATE] ${states.current}`);
      switch (states.current) {
        case 'connected': setConnectionStatus('CONNECTED'); break;
        case 'connecting': setConnectionStatus('CONNECTING'); break;
        case 'unavailable': 
        case 'failed': 
        case 'disconnected': setConnectionStatus('DISCONNECTED'); break;
      }
    });

    const channelName = `private-org-${orgId}`;
    const channel = pusher.subscribe(channelName);

    channel.bind('STATE_UPDATED', (data: RevisionState & { newLog: RevisionLog }) => {
      if (data.version <= versionRef.current) return;

      versionRef.current = data.version;
      setIsSyncing(true);
      playEffect('TICK');
      
      setState({
        status: data.status,
        version: data.version,
        lastUpdate: data.lastUpdate,
        history: data.history,
      });

      const timer = setTimeout(() => setIsSyncing(false), 1000);
      return () => clearTimeout(timer);
    });

    return () => {
      pusher.unsubscribe(channelName);
      pusher.connection.unbind_all();
      pusherRef.current = null;
    };
  }, [orgId]);

  const setVersionedState = useCallback((newState: RevisionState) => {
    if (newState.version >= versionRef.current) {
      versionRef.current = newState.version;
      setState(newState);
    }
  }, []);

  return { state, setState: setVersionedState, isSyncing, connectionStatus };
}

'use client';

import { useOptimistic, useTransition, useEffect, useState, useRef } from 'react';
import { StatusCard } from '@/components/StatusCard';
import { ControlPanel } from '@/components/ControlPanel';
import { ActivityLog } from '@/components/ActivityLog';
import { useRevisionSync } from '@/hooks/useRevisionSync';
import { updateRevisionState, getRevisionState } from '@/app/actions';
import { RevisionStatus, RevisionState } from '@/lib/types';
import { getCookie } from '@/lib/cookies';
import { playEffect } from '@/lib/sounds';
import { Activity, ShieldCheck, Database, Server, WifiOff, CloudSync } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Home() {
  const { state, setState, isSyncing, connectionStatus } = useRevisionSync();
  const [isPending, startTransition] = useTransition();
  const [session, setSession] = useState({ orgId: '', userId: '' });
  const [outbox, setOutbox] = useState<{status: RevisionStatus, comment: string}[]>([]);
  
  // Persistence: Restore outbox from localStorage if it exists
  useEffect(() => {
    const saved = localStorage.getItem(`outbox-${session.orgId}`);
    if (saved) setOutbox(JSON.parse(saved));
  }, [session.orgId]);

  // Sync Logic
  useEffect(() => {
    const orgId = getCookie('orgId') || 'ORG_ALPHA';
    const userId = getCookie('userId') || 'USER_01';
    setSession({ orgId, userId });

    const fetchInitialData = async () => {
      try {
        const initialState = await getRevisionState();
        setState(initialState);
      } catch (error) {
        console.error('Failed to fetch initial state:', error);
      }
    };
    fetchInitialData();
  }, [setState]);

  // Auto-flush outbox when reconnected
  useEffect(() => {
    if (connectionStatus === 'CONNECTED' && outbox.length > 0) {
      console.log(`[OFFLINE_SYNC] Flushing ${outbox.length} pending updates...`);
      const flush = async () => {
        const pending = [...outbox];
        setOutbox([]);
        localStorage.removeItem(`outbox-${session.orgId}`);
        
        for (const item of pending) {
          // Wrap in transition to handle optimistic updates correctly
          startTransition(async () => {
            try {
              const result = await updateRevisionState(item.status, item.comment);
              if (result.success && result.newState) {
                setState(result.newState);
              }
            } catch (e) {
              console.error("Flush failed:", e);
            }
          });
        }
      };
      flush();
    }
  }, [connectionStatus, outbox.length, session.orgId, setState]);

  const [optimisticState, addOptimisticState] = useOptimistic<RevisionState, { status: RevisionStatus, comment: string }>(
    state,
    (curr, update) => ({
      ...curr,
      status: update.status,
      lastUpdate: {
        userId: session.userId || 'USER_01',
        timestamp: Date.now(),
        comment: update.comment,
      },
    })
  );

  const handleUpdate = async (status: RevisionStatus, comment: string, isFromOutbox = false) => {
    startTransition(async () => {
      if (!isFromOutbox) {
        addOptimisticState({ status, comment });
      }

      if (connectionStatus !== 'CONNECTED') {
        // Offline mode: queue the update
        const newOutbox = [...outbox, { status, comment }];
        setOutbox(newOutbox);
        localStorage.setItem(`outbox-${session.orgId}`, JSON.stringify(newOutbox));
        playEffect('TICK'); // Minimal feedback
        return;
      }

      try {
        const result = await updateRevisionState(status, comment);
        if (result.success && result.newState) {
          setState(result.newState);
          playEffect('SUCCESS');
        }
      } catch (error) {
        console.error('Failed to update state:', error);
      }
    });
  };

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-zinc-950 font-mono text-zinc-100">
      {/* Top Navigation / System Bar */}
      <header className="flex items-center justify-between border-b border-zinc-800 px-4 py-2 bg-zinc-950/80 backdrop-blur-md z-10 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={cn("h-2.5 w-2.5 rounded-full", 
              connectionStatus === 'CONNECTED' ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-rose-500 animate-pulse"
            )} />
            <h1 className="text-[10px] font-black tracking-[0.4em] uppercase">Interface_AI</h1>
          </div>
          
          <div className="hidden md:flex items-center gap-3 text-[9px] text-zinc-500 uppercase tracking-widest border-l border-zinc-800 pl-4">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={10} />
              <span>Org: <span className="text-zinc-300">{session.orgId || 'IDLE'}</span></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Database size={10} />
              <span>User: <span className="text-zinc-300">{session.userId || 'IDLE'}</span></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[8px] uppercase tracking-tighter text-zinc-500 font-bold">
          {outbox.length > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 border border-amber-500/50 text-amber-500 rounded-sm animate-pulse bg-amber-500/5">
              <CloudSync size={10} />
              <span>OUTBOX: {outbox.length} PENDING</span>
            </div>
          )}
          
          <div className={cn(
            "flex items-center gap-1.5 px-2 py-0.5 border rounded-sm transition-colors",
            connectionStatus === 'CONNECTED' ? "border-emerald-500/30 text-emerald-500 bg-emerald-500/5" : "border-rose-500/30 text-rose-500 bg-rose-500/5"
          )}>
            {connectionStatus === 'CONNECTED' ? <Server size={10} /> : <WifiOff size={10} />}
            <span>SYS_LINK: {connectionStatus}</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Workspace Controls */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 custom-scrollbar relative">
          {connectionStatus !== 'CONNECTED' && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-rose-500 text-white text-[9px] px-4 py-1 font-bold rounded-full shadow-lg flex items-center gap-2">
              <WifiOff size={10} /> NETWORK_DISCONNECTED: UPDATES QUEUED LOCALLY
            </div>
          )}

          <div className="max-w-3xl mx-auto flex flex-col gap-4">
            <div className="flex items-center gap-2 text-zinc-500 uppercase tracking-[0.2em] text-[9px]">
              <Activity size={10} />
              <span>Workspace_Monitor</span>
            </div>
            
            <StatusCard 
              key={`${optimisticState.status}-${optimisticState.lastUpdate.timestamp}`}
              status={optimisticState.status}
              lastUpdatedBy={optimisticState.lastUpdate.userId}
              timestamp={optimisticState.lastUpdate.timestamp}
              isSyncing={isSyncing || isPending || outbox.length > 0}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              <div className="flex flex-col gap-3">
                <div className="text-[9px] text-zinc-500 uppercase tracking-widest">State_Update_Manifest</div>
                <ControlPanel onUpdate={handleUpdate} isPending={isPending} />
              </div>
              
              <div className="flex flex-col gap-3">
                <div className="text-[9px] text-zinc-500 uppercase tracking-widest">System_Status</div>
                <div className="border border-zinc-800 p-4 bg-zinc-900/20 text-[10px] text-zinc-400 leading-relaxed space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500">SYNC_ENGINE:</span>
                    <span className={connectionStatus === 'CONNECTED' ? "text-emerald-500" : "text-rose-500"}>
                      {connectionStatus === 'CONNECTED' ? "OPERATIONAL" : "DEGRADED"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-zinc-100 font-bold border-t border-zinc-800/50 pt-2 mt-2">
                    <span>CURRENT_ORG:</span>
                    <span>{session.orgId || 'AWAITING_INIT'}</span>
                  </div>
                  <div className="flex justify-between items-center text-zinc-500 text-[8px] pt-1">
                    <span>PACKET_BUFFER:</span>
                    <span className={outbox.length > 0 ? "text-amber-500" : ""}>{outbox.length > 0 ? `QUEUED (${outbox.length})` : "NOMINAL"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Activity Feed */}
        <aside className="w-72 lg:w-80 hidden md:block border-l border-zinc-800 shrink-0">
          <ActivityLog history={state.history} />
        </aside>
      </div>

      <footer className="border-t border-zinc-800 px-4 py-1.5 bg-zinc-950 text-[8px] text-zinc-600 flex justify-between items-center uppercase tracking-widest shrink-0">
        <div className="flex gap-4">
          <span>Sys_Ops: Optimal</span>
          <span>Buffer: {outbox.length > 0 ? 'Dirty' : 'Clean'}</span>
        </div>
        <div>&copy; 2026 Interface_AI</div>
      </footer>
    </div>
  );
}

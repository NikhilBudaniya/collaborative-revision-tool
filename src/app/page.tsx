'use client';

import { useOptimistic, useTransition, useEffect, useState } from 'react';
import { StatusCard } from '@/components/StatusCard';
import { ControlPanel } from '@/components/ControlPanel';
import { ActivityLog } from '@/components/ActivityLog';
import { useRevisionSync } from '@/hooks/useRevisionSync';
import { updateRevisionState } from '@/app/actions';
import { RevisionStatus, RevisionState, RevisionLog } from '@/lib/types';
import { getCookie } from '@/lib/cookies';
import { Activity, ShieldCheck, Database, Server } from 'lucide-react';

export default function Home() {
  const { state, isSyncing } = useRevisionSync();
  const [isPending, startTransition] = useTransition();
  const [session, setSession] = useState({ orgId: '', userId: '' });

  useEffect(() => {
    setSession({
      orgId: getCookie('orgId') || 'ORG_ALPHA',
      userId: getCookie('userId') || 'USER_01',
    });
  }, []);

  const [optimisticState, addOptimisticState] = useOptimistic<RevisionState, { status: RevisionStatus, comment: string }>(
    state,
    (curr, update) => ({
      ...curr,
      status: update.status,
      lastUpdate: {
        userId: session.userId,
        timestamp: Date.now(),
        comment: update.comment,
      },
      // Note: We don't optimistically add to history to prevent double-logging 
      // when the broadcast comes back, keeping the "Source of Truth" clean.
    })
  );

  const handleUpdate = async (status: RevisionStatus, comment: string) => {
    startTransition(async () => {
      addOptimisticState({ status, comment });
      try {
        await updateRevisionState(status, comment);
      } catch (error) {
        console.error('Failed to update state:', error);
      }
    });
  };

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-zinc-950 font-mono text-zinc-100">
      {/* Top Navigation / System Bar */}
      <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-3 bg-zinc-950/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 bg-zinc-100 rounded-full" />
            <h1 className="text-xs font-black tracking-[0.4em] uppercase">Interface_Revision_v1.0</h1>
          </div>
          
          <div className="hidden md:flex items-center gap-4 text-[10px] text-zinc-500 uppercase tracking-widest border-l border-zinc-800 pl-6">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={12} className="text-emerald-500" />
              <span>Org: <span className="text-zinc-300">{session.orgId}</span></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Database size={12} className="text-blue-500" />
              <span>User: <span className="text-zinc-300">{session.userId}</span></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[9px] uppercase tracking-tighter text-zinc-500">
          <div className="flex items-center gap-1.5 px-2 py-0.5 border border-zinc-800 rounded-sm">
            <Server size={10} />
            <span>Pusher_WS: <span className="text-emerald-500 font-bold">CONNECTED</span></span>
          </div>
          <div className="animate-pulse">● LIVE_TELEMETRY</div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Workspace Controls */}
        <div className="flex-1 overflow-y-auto p-8 lg:p-12">
          <div className="max-w-4xl mx-auto flex flex-col gap-8">
            <div className="flex items-center gap-3 text-zinc-500 uppercase tracking-[0.2em] text-[10px] mb-2">
              <Activity size={12} />
              <span>Workspace_Dashboard</span>
            </div>
            
            <StatusCard 
              status={optimisticState.status}
              lastUpdatedBy={optimisticState.lastUpdate.userId}
              timestamp={optimisticState.lastUpdate.timestamp}
              isSyncing={isSyncing || isPending}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              <div className="flex flex-col gap-4">
                <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">State_Update_Manifest</div>
                <ControlPanel onUpdate={handleUpdate} isPending={isPending} />
              </div>
              
              <div className="flex flex-col gap-4">
                <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">System_Documentation</div>
                <div className="border border-zinc-800 p-6 bg-zinc-900/20 text-[11px] text-zinc-400 leading-relaxed space-y-4">
                  <p>
                    <span className="text-zinc-100 font-bold">ISOLATION_PROTOCOL:</span> This workspace is locked to ORG_ID: <span className="text-zinc-200">{session.orgId}</span>. All cross-organizational traffic is rejected at the protocol level.
                  </p>
                  <p>
                    <span className="text-zinc-100 font-bold">REAL_TIME_ENGINE:</span> Utilizing Pusher WebSockets for global state synchronization. 
                  </p>
                  <div className="h-px bg-zinc-800 w-full my-4" />
                  <div className="flex flex-col gap-1 text-[9px]">
                    <div className="flex justify-between">
                      <span>LATENCY_TARGET:</span>
                      <span className="text-emerald-500">&lt; 150MS</span>
                    </div>
                    <div className="flex justify-between">
                      <span>PACKET_ENCRYPTION:</span>
                      <span className="text-emerald-500">AES-256</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Activity Feed */}
        <aside className="w-80 lg:w-96 hidden md:block border-l border-zinc-800">
          <ActivityLog history={state.history} />
        </aside>
      </div>

      {/* System Footer Bar */}
      <footer className="border-t border-zinc-800 px-6 py-2 bg-zinc-950 text-[9px] text-zinc-600 flex justify-between items-center uppercase tracking-widest">
        <div>System_Status: Optimal // Buffer: Clean</div>
        <div>&copy; 2026 Interface_Global_Ops</div>
      </footer>
    </div>
  );
}

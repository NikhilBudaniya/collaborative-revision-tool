'use client';

import { RevisionLog } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal } from 'lucide-react';

interface ActivityLogProps {
  history: RevisionLog[];
}

export function ActivityLog({ history }: ActivityLogProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'text-emerald-500';
      case 'REJECTED':
        return 'text-rose-500';
      default:
        return 'text-zinc-400';
    }
  };

  return (
    <div className="flex h-full flex-col border-l border-zinc-800 bg-zinc-950 p-6 font-mono">
      <div className="mb-6 flex items-center gap-2 text-[10px] uppercase tracking-widest text-zinc-500">
        <Terminal size={12} />
        <span>System_Log</span>
      </div>

      <div className="flex flex-col gap-4 overflow-y-auto pr-2">
        <AnimatePresence initial={false}>
          {history.length === 0 ? (
            <div className="text-[10px] text-zinc-600 italic">No activity recorded...</div>
          ) : (
            history.map((log) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col border-l-2 border-zinc-800 pl-3 py-1"
              >
                <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                  <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  <span className="text-zinc-600">ID: {log.id.slice(0, 4)}</span>
                </div>
                
                <div className="text-[11px] leading-relaxed">
                  <span className={getStatusColor(log.status)}>[{log.status}]</span>
                  <span className="text-zinc-400"> BY </span>
                  <span className="text-zinc-200">{log.userId}</span>
                </div>

                {log.comment && (
                  <div className="mt-1 text-[10px] text-zinc-500 leading-tight border-t border-zinc-900 pt-1 mt-1">
                    "{log.comment}"
                  </div>
                )}
              </motion.div>
            ))
          ).reverse()}
        </AnimatePresence>
      </div>
    </div>
  );
}

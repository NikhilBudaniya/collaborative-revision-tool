'use client';

import { useEffect, useState } from 'react';
import { RevisionStatus } from '@/lib/types';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, AlertCircle, Scan } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusCardProps {
  status: RevisionStatus;
  lastUpdatedBy?: string;
  timestamp?: number;
  isSyncing?: boolean;
}

export function StatusCard({ status, lastUpdatedBy, timestamp, isSyncing }: StatusCardProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const config = {
    APPROVED: {
      label: 'SYSTEM_APPROVED',
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/5',
      borderColor: 'border-emerald-500/20',
      icon: CheckCircle2,
    },
    REJECTED: {
      label: 'SYSTEM_REJECTED',
      color: 'text-rose-500',
      bgColor: 'bg-rose-500/5',
      borderColor: 'border-rose-500/20',
      icon: XCircle,
    },
    PENDING: {
      label: 'SYSTEM_PENDING',
      color: 'text-zinc-400',
      bgColor: 'bg-zinc-400/5',
      borderColor: 'border-zinc-800',
      icon: AlertCircle,
    },
  };

  const { label, color, bgColor, borderColor, icon: Icon } = config[status];

  const formatTime = (ts: number) => {
    if (!mounted || ts === 0) return '--:--:--';
    return new Date(ts).toLocaleTimeString();
  };

  return (
    <div className={cn(
      "relative flex flex-col items-center justify-center border p-12 transition-all duration-500 overflow-hidden",
      bgColor,
      borderColor
    )}>
      {isSyncing && (
        <motion.div
          initial={{ top: '-10%' }}
          animate={{ top: '110%' }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          className="absolute left-0 w-full h-px bg-zinc-100/20 z-10 shadow-[0_0_10px_rgba(255,255,255,0.5)]"
        />
      )}

      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-zinc-500 mb-6 font-mono">
        <Scan size={10} className={isSyncing ? "animate-pulse" : ""} />
        <span>REVISION_STATE_MONITOR</span>
      </div>

      <motion.div
        key={status}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4"
      >
        <Icon size={48} className={cn("transition-colors duration-500", color)} />
        <h2 className={cn("text-4xl font-black tracking-tighter transition-colors duration-500", color)}>
          {label}
        </h2>
      </motion.div>

      <div className="mt-8 flex flex-col items-center gap-1 font-mono text-[10px] text-zinc-500 uppercase">
        {lastUpdatedBy && timestamp ? (
          <>
            <div>Updated by: <span className="text-zinc-300">{lastUpdatedBy}</span></div>
            <div>Timestamp: <span className="text-zinc-300">{formatTime(timestamp)}</span></div>
          </>
        ) : (
          <div className="italic">Awaiting initial data broadcast...</div>
        )}
      </div>
    </div>
  );
}

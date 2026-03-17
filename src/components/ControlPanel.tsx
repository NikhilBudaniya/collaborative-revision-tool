'use client';

import { useState } from 'react';
import { RevisionStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Send, MessageSquare } from 'lucide-react';

interface ControlPanelProps {
  onUpdate: (status: RevisionStatus, comment: string) => void;
  isPending: boolean;
}

export function ControlPanel({ onUpdate, isPending }: ControlPanelProps) {
  const [selectedStatus, setSelectedStatus] = useState<RevisionStatus | null>(null);
  const [comment, setComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStatus || isPending) return;
    
    onUpdate(selectedStatus, comment || 'No comment provided.');
    setComment('');
    setSelectedStatus(null);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 font-mono p-4 border border-zinc-800 bg-zinc-950/50">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-zinc-500 mb-1">
        <span>State_Control_Override</span>
        <span className={cn(isPending ? "text-amber-500 animate-pulse" : "text-zinc-700")}>
          {isPending ? "TRANSMITTING..." : "READY"}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-3 gap-2">
          {(['PENDING', 'APPROVED', 'REJECTED'] as RevisionStatus[]).map((status) => (
            <button
              key={status}
              type="button"
              disabled={isPending}
              onClick={() => setSelectedStatus(status)}
              className={cn(
                "border px-2 py-2 text-[9px] font-bold tracking-widest transition-all duration-200 uppercase",
                selectedStatus === status 
                  ? "bg-zinc-100 text-zinc-950 border-zinc-100" 
                  : "border-zinc-800 text-zinc-500 hover:border-zinc-400 hover:text-zinc-300",
                status === 'APPROVED' && selectedStatus === 'APPROVED' && "bg-emerald-500 text-zinc-950 border-emerald-500",
                status === 'REJECTED' && selectedStatus === 'REJECTED' && "bg-rose-500 text-zinc-950 border-rose-500"
              )}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="relative group">
          <div className="absolute top-2.5 left-3 text-zinc-600 group-focus-within:text-zinc-400 transition-colors">
            <MessageSquare size={12} />
          </div>
          <textarea
            disabled={isPending}
            placeholder="OPTIONAL_LOG_MESSAGE..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full bg-zinc-900/50 border border-zinc-800 p-2 pl-9 text-[10px] text-zinc-100 outline-none focus:border-zinc-500 focus:bg-zinc-900 min-h-[60px] transition-all resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={!selectedStatus || isPending}
          className={cn(
            "group flex items-center justify-center gap-2 border px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all",
            !selectedStatus || isPending
              ? "border-zinc-800 text-zinc-700 cursor-not-allowed opacity-50"
              : "border-zinc-100 bg-zinc-100 text-zinc-950 hover:bg-zinc-200"
          )}
        >
          <Send size={10} className={cn(!isPending && "group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform")} />
          <span>Commit_Update</span>
        </button>
      </div>
    </form>
  );
}

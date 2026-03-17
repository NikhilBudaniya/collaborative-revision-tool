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
    if (!selectedStatus || !comment.trim() || isPending) return;
    
    onUpdate(selectedStatus, comment);
    setComment('');
    setSelectedStatus(null);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 font-mono p-6 border border-zinc-800 bg-zinc-950/50">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-zinc-500 mb-2">
        <span>State_Control_Override</span>
        <span className={cn(isPending ? "text-amber-500 animate-pulse" : "text-zinc-700")}>
          {isPending ? "TRANSMITTING..." : "READY"}
        </span>
      </div>

      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-2">
          {(['PENDING', 'APPROVED', 'REJECTED'] as RevisionStatus[]).map((status) => (
            <button
              key={status}
              type="button"
              disabled={isPending}
              onClick={() => setSelectedStatus(status)}
              className={cn(
                "border px-2 py-3 text-[10px] font-bold tracking-widest transition-all duration-200 uppercase",
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
          <div className="absolute top-3 left-3 text-zinc-600 group-focus-within:text-zinc-400 transition-colors">
            <MessageSquare size={14} />
          </div>
          <textarea
            required
            disabled={isPending}
            placeholder="MANDATORY_LOG_MESSAGE..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full bg-zinc-900/50 border border-zinc-800 p-3 pl-10 text-[11px] text-zinc-100 outline-none focus:border-zinc-500 focus:bg-zinc-900 min-h-[100px] transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={!selectedStatus || !comment.trim() || isPending}
          className={cn(
            "group flex items-center justify-center gap-2 border px-4 py-3 text-[11px] font-black uppercase tracking-[0.2em] transition-all",
            !selectedStatus || !comment.trim() || isPending
              ? "border-zinc-800 text-zinc-700 cursor-not-allowed opacity-50"
              : "border-zinc-100 bg-zinc-100 text-zinc-950 hover:bg-zinc-200"
          )}
        >
          <Send size={12} className={cn(!isPending && "group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform")} />
          <span>Commit_Update</span>
        </button>
      </div>

      <div className="text-[9px] text-zinc-600 leading-tight">
        * ALL STATE CHANGES ARE LOGGED AND BROADCASTED TO YOUR ORGANIZATION IN REAL-TIME.
      </div>
    </form>
  );
}

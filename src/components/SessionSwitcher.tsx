'use client';

import { useState, useEffect } from 'react';
import { getCookie, setCookie } from '@/lib/cookies';
import { User, Building2, RefreshCcw } from 'lucide-react';

export function SessionSwitcher() {
  const [orgId, setOrgId] = useState('');
  const [userId, setUserId] = useState('');

  useEffect(() => {
    setOrgId(getCookie('orgId') || 'ORG_ALPHA');
    setUserId(getCookie('userId') || 'USER_01');
  }, []);

  const handleUpdate = () => {
    setCookie('orgId', orgId);
    setCookie('userId', userId);
    window.location.reload();
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 rounded-sm border border-zinc-800 bg-zinc-950 p-4 font-mono text-[10px] shadow-2xl">
      <div className="flex items-center gap-2 text-zinc-500 uppercase tracking-widest mb-1">
        <RefreshCcw size={10} />
        <span>Session Manager</span>
      </div>
      
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label className="flex items-center gap-1.5 text-zinc-400">
            <Building2 size={10} />
            ORG_ID
          </label>
          <input
            value={orgId}
            onChange={(e) => setOrgId(e.target.value)}
            className="w-40 border border-zinc-800 bg-zinc-900 px-2 py-1 text-zinc-100 outline-none focus:border-zinc-500"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="flex items-center gap-1.5 text-zinc-400">
            <User size={10} />
            USER_ID
          </label>
          <input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-40 border border-zinc-800 bg-zinc-900 px-2 py-1 text-zinc-100 outline-none focus:border-zinc-500"
          />
        </div>

        <button
          onClick={handleUpdate}
          className="mt-1 w-full border border-zinc-100 bg-zinc-100 py-1.5 font-bold text-zinc-950 hover:bg-zinc-200 transition-colors"
        >
          APPLY_SESSION
        </button>
      </div>
    </div>
  );
}

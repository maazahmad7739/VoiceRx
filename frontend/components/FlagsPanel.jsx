'use client';

import { AlertTriangle } from 'lucide-react';

export default function FlagsPanel({ flags }) {
  if (!flags || !Array.isArray(flags) || flags.length === 0) return null;

  return (
    <div className="bg-yellow-500/5 dark:bg-yellow-500/10 border border-yellow-500/20 rounded-3xl p-6 shadow-sm print-card space-y-4">
      <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
        <AlertTriangle className="h-5 w-5 fill-current" />
        <h3 className="font-extrabold text-lg">Clinical Alert Flags</h3>
      </div>
      <ul className="space-y-2.5">
        {flags.map((flag, idx) => (
          <li key={idx} className="text-sm flex items-start gap-2 text-slate-700 dark:text-slate-200">
            <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 shrink-0 mt-2"></span>
            <span>{flag}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

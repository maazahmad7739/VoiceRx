'use client';

import { ShieldAlert, AlertTriangle, ArrowUpRight } from 'lucide-react';

export default function RedFlagsCard({ redFlags, whenToRefer }) {
  const hasFlags = redFlags && Array.isArray(redFlags) && redFlags.length > 0;
  const hasRefer = whenToRefer && whenToRefer !== 'null';

  if (!hasFlags && !hasRefer) return null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm space-y-5 hover:shadow-md transition-all duration-300">
      
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <ShieldAlert className="h-4.5 w-4.5 text-rose-500" />
        <h4 className="font-bold text-sm tracking-wider uppercase text-slate-400">Warning Signs & Referrals</h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Red Flags List */}
        {hasFlags && (
          <div className="space-y-2">
            <strong className="text-[10px] font-extrabold uppercase tracking-wider text-rose-500 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-rose-500 animate-bounce" />
              <span>Red Flag Warning Signs</span>
            </strong>
            <ul className="space-y-1.5 pl-1.5">
              {redFlags.map((flag, idx) => (
                <li key={idx} className="text-xs text-slate-650 dark:text-slate-400 flex items-start gap-1.5 leading-relaxed">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5 animate-pulse"></span>
                  <strong>{flag}</strong>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* When to Refer */}
        {hasRefer && (
          <div className="p-4 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-xl space-y-2 self-start shadow-sm">
            <strong className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1">
              <ArrowUpRight className="h-4 w-4" />
              <span>Specialist Referral Criteria</span>
            </strong>
            <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-200 font-semibold pl-1">
              {whenToRefer}
            </p>
          </div>
        )}

      </div>
    </div>
  );
}

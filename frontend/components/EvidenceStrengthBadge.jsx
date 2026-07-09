'use client';

import { Award, ShieldCheck, GitMerge } from 'lucide-react';

const getStrengthColors = (strength) => {
  const s = strength?.toLowerCase();
  if (s?.includes('strong')) return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-450';
  if (s?.includes('moderate')) return 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-450';
  if (s?.includes('weak')) return 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-450';
  return 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-450';
};

const getConfidenceColors = (confidence) => {
  const c = confidence?.toLowerCase();
  if (c?.includes('high')) return 'bg-blue-600 text-white';
  if (c?.includes('medium')) return 'bg-blue-400 text-white';
  return 'bg-amber-500 text-white';
};

export default function EvidenceStrengthBadge({ strength, confidence, conflictingGuidelines }) {
  if (!strength && !confidence) return null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm space-y-4 hover:shadow-md transition-all duration-300">
      <div className="flex flex-wrap items-center justify-between gap-4">
        
        {/* Evidence strength */}
        {strength && (
          <div className="flex items-center gap-2">
            <Award className="h-4.5 w-4.5 text-slate-400" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Evidence Grade:</span>
            <span className={`px-3 py-0.5 text-xs font-extrabold rounded-full capitalize ${getStrengthColors(strength)}`}>
              {strength}
            </span>
          </div>
        )}

        {/* Confidence index */}
        {confidence && (
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4.5 w-4.5 text-slate-400" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI Confidence:</span>
            <span className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-lg uppercase ${getConfidenceColors(confidence)}`}>
              {confidence}
            </span>
          </div>
        )}

      </div>

      {/* Conflicting guidelines details */}
      {conflictingGuidelines && conflictingGuidelines !== 'null' && (
        <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-xl flex gap-2.5 items-start shadow-sm">
          <GitMerge className="h-4.5 w-4.5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="text-[9px] uppercase font-extrabold tracking-widest text-amber-700 dark:text-amber-450">Guideline Conflicts Noted</span>
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-350 font-semibold">{conflictingGuidelines}</p>
          </div>
        </div>
      )}

    </div>
  );
}

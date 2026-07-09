'use client';

import { ShieldAlert } from 'lucide-react';

function getSeverityClasses(severity) {
  const norm = (severity || 'high').toLowerCase();
  if (norm === 'high' || norm === 'critical') {
    return {
      card: 'bg-rose-500/10 border-rose-500/15',
      text: 'text-rose-700 dark:text-rose-400',
      badge: 'bg-rose-500/20 text-rose-700 dark:text-rose-450'
    };
  }
  if (norm === 'medium' || norm === 'moderate') {
    return {
      card: 'bg-orange-500/10 border-orange-500/15',
      text: 'text-orange-700 dark:text-orange-400',
      badge: 'bg-orange-500/20 text-orange-700 dark:text-orange-450'
    };
  }
  return {
    card: 'bg-amber-500/10 border-amber-500/15',
    text: 'text-amber-700 dark:text-amber-400',
    badge: 'bg-amber-500/20 text-amber-700 dark:text-amber-450'
  };
}

export default function DrugWarning({ warnings }) {
  if (!warnings || !Array.isArray(warnings) || warnings.length === 0) return null;

  const hasHigh = warnings.some(w => ['high', 'critical'].includes((w.severity || '').toLowerCase()));
  const hasMedium = warnings.some(w => ['medium', 'moderate'].includes((w.severity || '').toLowerCase()));
  
  let headerColor = 'text-rose-600 dark:text-rose-400';
  let parentBg = 'bg-rose-500/5 dark:bg-rose-500/10 border-rose-500/20';
  
  if (!hasHigh && hasMedium) {
    headerColor = 'text-orange-600 dark:text-orange-400';
    parentBg = 'bg-orange-500/5 dark:bg-orange-500/10 border-orange-500/20';
  } else if (!hasHigh && !hasMedium) {
    headerColor = 'text-amber-600 dark:text-amber-400';
    parentBg = 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/20';
  }

  return (
    <div className={`${parentBg} border rounded-3xl p-6 shadow-sm print-card space-y-4`}>
      <div className={`flex items-center gap-2 ${headerColor}`}>
        <ShieldAlert className="h-5 w-5 stroke-[2.5]" />
        <h3 className="font-extrabold text-lg">Contraindicated Drug Interactions</h3>
      </div>
      
      <div className="space-y-3">
        {warnings.map((warn, idx) => {
          const colors = getSeverityClasses(warn.severity);
          return (
            <div
              key={idx}
              className={`p-4 rounded-2xl border ${colors.card} text-slate-800 dark:text-slate-100 flex flex-col gap-1`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-sm font-bold ${colors.text}`}>
                  {warn.drugA} + {warn.drugB}
                </span>
                <span className={`text-[9px] uppercase font-extrabold px-2 py-0.5 rounded-full ${colors.badge}`}>
                  {warn.severity || 'high'}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-1">
                {warn.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

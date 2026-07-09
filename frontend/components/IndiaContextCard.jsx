'use client';

import { Flag, Landmark, AlertCircle, Heart } from 'lucide-react';

export default function IndiaContextCard({ context }) {
  if (!context) return null;

  const {
    preferred_drugs_in_india,
    cost_consideration,
    local_resistance_patterns,
    icmr_specific_note
  } = context;

  // Check if there is any data inside
  if (!preferred_drugs_in_india && !cost_consideration && !local_resistance_patterns && !icmr_specific_note) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm space-y-5 hover:shadow-md transition-all duration-300">
      
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <Flag className="h-4.5 w-4.5 text-orange-500 fill-orange-500/10" />
        <h4 className="font-bold text-sm tracking-wider uppercase text-slate-400">Regional Context (ICMR/India)</h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Preferred Drugs & ICMR Notes */}
        <div className="space-y-4">
          {preferred_drugs_in_india && Array.isArray(preferred_drugs_in_india) && preferred_drugs_in_india.length > 0 && (
            <div className="space-y-1.5">
              <strong className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Heart className="h-3.5 w-3.5 text-rose-500" />
                <span>Preferred Domestic Drugs</span>
              </strong>
              <div className="flex flex-wrap gap-1.5">
                {preferred_drugs_in_india.map((d, idx) => (
                  <span 
                    key={idx} 
                    className="px-2.5 py-0.5 bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400 text-[10px] font-bold rounded-md"
                  >
                    {d}
                  </span>
                ))}
              </div>
            </div>
          )}

          {icmr_specific_note && icmr_specific_note !== 'null' && (
            <div className="space-y-1">
              <strong className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">ICMR Guideline Notes</strong>
              <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400 italic">
                "{icmr_specific_note}"
              </p>
            </div>
          )}
        </div>

        {/* Cost & Resistance details */}
        <div className="space-y-4">
          {cost_consideration && (
            <div className="space-y-1">
              <strong className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Landmark className="h-3.5 w-3.5 text-slate-400" />
                <span>Cost & Affordability Considerations</span>
              </strong>
              <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                {cost_consideration}
              </p>
            </div>
          )}

          {local_resistance_patterns && local_resistance_patterns !== 'null' && (
            <div className="space-y-1 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 p-3 rounded-xl shadow-sm">
              <strong className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
                <span>Local Bacterial Resistance Warning</span>
              </strong>
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-450 mt-1 font-semibold">
                {local_resistance_patterns}
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

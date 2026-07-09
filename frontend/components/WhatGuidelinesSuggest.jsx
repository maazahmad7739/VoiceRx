'use client';

import { Activity, ShieldAlert, Sparkles, CheckCircle2, RefreshCcw, Eye } from 'lucide-react';

export default function WhatGuidelinesSuggest({ suggest }) {
  if (!suggest) return null;

  const {
    first_line,
    second_line,
    what_to_avoid,
    dose_considerations,
    monitoring,
    treatment_duration,
    targets_to_achieve
  } = suggest;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm space-y-6 hover:shadow-md transition-all duration-300">
      
      {/* Section Header */}
      <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <Sparkles className="h-4.5 w-4.5 text-blue-600" />
        <h4 className="font-bold text-sm tracking-wider uppercase text-slate-400">Treatment Protocols</h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Column: First & Second Line */}
        <div className="space-y-5">
          {first_line && (
            <div className="p-4 bg-blue-50/40 dark:bg-blue-900/15 rounded-xl space-y-1 shadow-sm">
              <span className="text-[9px] uppercase font-extrabold tracking-widest text-blue-600 dark:text-blue-400 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>First-Line Treatment Recommendation</span>
              </span>
              <p className="text-xs font-semibold leading-relaxed text-slate-700 dark:text-slate-200 pt-0.5">{first_line}</p>
            </div>
          )}

          {second_line && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1 shadow-sm">
              <span className="text-[9px] uppercase font-extrabold tracking-widest text-slate-400 flex items-center gap-1">
                <RefreshCcw className="h-3 w-3" />
                <span>Second-Line / Alternative Option</span>
              </span>
              <p className="text-xs font-semibold leading-relaxed text-slate-655 dark:text-slate-300 pt-0.5">{second_line}</p>
            </div>
          )}

          {dose_considerations && (
            <div className="space-y-1 pl-1">
              <strong className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Dose Considerations & Adjustments</strong>
              <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">{dose_considerations}</p>
            </div>
          )}

          {treatment_duration && (
            <div className="space-y-1 pl-1">
              <strong className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Treatment Duration</strong>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-350">{treatment_duration}</p>
            </div>
          )}
        </div>

        {/* Right Column: Avoid, Monitor, Targets */}
        <div className="space-y-5">
          
          {/* Contraindications / What to Avoid */}
          {what_to_avoid && Array.isArray(what_to_avoid) && what_to_avoid.length > 0 && (
            <div className="p-4 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-xl space-y-2 shadow-sm">
              <span className="text-[9px] uppercase font-extrabold tracking-widest text-rose-600 dark:text-rose-400 flex items-center gap-1">
                <ShieldAlert className="h-3.5 w-3.5 text-rose-500" />
                <span>Contraindicated (What to Avoid)</span>
              </span>
              <ul className="list-disc pl-4 text-xs text-rose-700/80 dark:text-rose-400/80 space-y-1">
                {what_to_avoid.map((item, idx) => (
                  <li key={idx} className="leading-relaxed">{item}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Monitoring Requirement */}
          {monitoring && Array.isArray(monitoring) && monitoring.length > 0 && (
            <div className="space-y-2 pl-1">
              <strong className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Eye className="h-3.5 w-3.5 text-slate-400" />
                <span>Clinical Monitoring Protocol</span>
              </strong>
              <ul className="space-y-1.5 pl-0.5">
                {monitoring.map((item, idx) => (
                  <li key={idx} className="text-xs text-slate-500 dark:text-slate-400 flex items-start gap-1.5 leading-relaxed">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0 mt-1.5"></span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Targets */}
          {targets_to_achieve && Array.isArray(targets_to_achieve) && targets_to_achieve.length > 0 && (
            <div className="space-y-2 pt-1 pl-1">
              <strong className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Activity className="h-3.5 w-3.5 text-slate-400" />
                <span>Therapeutic Targets</span>
              </strong>
              <div className="flex flex-wrap gap-1.5">
                {targets_to_achieve.map((target, idx) => (
                  <span 
                    key={idx} 
                    className="px-2.5 py-1 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-450 text-[10px] font-bold rounded-lg"
                  >
                    {target}
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

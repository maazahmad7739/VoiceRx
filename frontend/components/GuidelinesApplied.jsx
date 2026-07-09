'use client';

import { ExternalLink, BookOpen } from 'lucide-react';

const getSourceBadgeStyles = (source) => {
  const s = source?.toUpperCase();
  if (s?.includes('WHO')) return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-450';
  if (s?.includes('ICMR')) return 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-450';
  if (s?.includes('AHA')) return 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-450';
  if (s?.includes('ADA')) return 'bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-450';
  return 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-450';
};

export default function GuidelinesApplied({ guidelines }) {
  if (!guidelines || !Array.isArray(guidelines) || guidelines.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm space-y-6 hover:shadow-md transition-all duration-300">
      
      {/* Section Header */}
      <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <BookOpen className="h-4.5 w-4.5 text-blue-600" />
        <h4 className="font-bold text-sm tracking-wider uppercase text-slate-400">Clinical Guidelines Applied</h4>
      </div>

      {/* Stepper / Timeline Layout */}
      <div className="relative pl-6 border-l border-slate-150 dark:border-slate-800 space-y-8 ml-2">
        {guidelines.map((g, idx) => {
          const applies = g.applies_to_this_patient !== false;
          return (
            <div key={idx} className="relative group transition-all duration-300">
              
              {/* Timeline dot */}
              <div className="absolute -left-[31px] top-1.5 h-2.5 w-2.5 rounded-full bg-white dark:bg-slate-900 border-2 border-blue-600 flex items-center justify-center group-hover:bg-blue-605 group-hover:scale-110 transition-all duration-200"></div>

              <div className="space-y-1.5">
                {/* Header row: Badge and name */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-0.5 text-[9px] font-extrabold rounded-full ${getSourceBadgeStyles(g.source)}`}>
                      {g.source}
                    </span>
                    {g.year && (
                      <span className="text-[10px] text-slate-400 font-bold">{g.year}</span>
                    )}
                    <span className="px-1.5 py-0.5 bg-slate-50 dark:bg-slate-800 text-slate-450 dark:text-slate-400 text-[9px] font-extrabold rounded-md">
                      Evidence: {g.evidence_level || 'B'}
                    </span>
                  </div>

                  {g.link && (
                    <a
                      href={g.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-350 hover:text-blue-600 transition-colors shrink-0"
                      title="View clinical source"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>

                {/* Title */}
                <h5 className="font-bold text-xs text-slate-800 dark:text-slate-200 leading-snug group-hover:text-blue-600 transition-colors">
                  {g.guideline_name}
                </h5>

                {/* Paraphrased Recommendation Text */}
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold italic">
                  "{g.recommendation}"
                </p>

                {/* Applies descriptor */}
                <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 dark:text-slate-500">
                  <span className={applies ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}>
                    {applies ? 'Applies to Patient' : 'Not Directly Applicable'}
                  </span>
                  <span>•</span>
                  <span className="italic font-normal text-slate-400 dark:text-slate-500">{g.why || 'Standard reference.'}</span>
                </div>

              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}

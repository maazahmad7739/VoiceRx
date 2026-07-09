'use client';

import { Lightbulb, Info } from 'lucide-react';

export default function DirectAnswerCard({ answer, caveat }) {
  if (!answer) return null;

  return (
    <div className="bg-white dark:bg-slate-900 shadow-sm hover:shadow-md rounded-2xl p-6 transition-all duration-300 relative overflow-hidden border-t-4 border-blue-600">
      
      {/* Background faint watermark decorator */}
      <div className="absolute -right-2 -bottom-4 text-blue-600/[0.03] dark:text-blue-400/[0.04] pointer-events-none select-none">
        <Lightbulb className="h-24 w-24 stroke-[1.5]" />
      </div>

      <div className="flex items-start gap-4 relative z-10">
        <div className="h-10 w-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-650 dark:text-blue-400 shrink-0 shadow-sm">
          <Lightbulb className="h-5 w-5 fill-current" />
        </div>
        
        <div className="space-y-3 flex-1">
          <div>
            <span className="text-[10px] uppercase font-extrabold tracking-widest text-blue-600 dark:text-blue-400">Direct Guideline Recommendation</span>
            <h3 className="text-base md:text-lg font-serif font-medium text-slate-800 dark:text-slate-100 leading-relaxed mt-1">
              {answer}
            </h3>
          </div>

          {caveat && (
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold italic">
              <Info className="h-3.5 w-3.5" />
              <span>{caveat}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

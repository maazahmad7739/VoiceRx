'use client';

import { Heart, Sparkles } from 'lucide-react';

export default function PatientSummary({ soapNote }) {
  if (!soapNote) return null;

  const hasEnglish = soapNote.patientSummaryEnglish && soapNote.patientSummaryEnglish !== 'Not requested';
  const hasHindi = soapNote.patientSummaryHindi && soapNote.patientSummaryHindi !== 'Not requested';

  if (!hasEnglish && !hasHindi) return null;

  return (
    <div className="bg-blue-50/40 dark:bg-blue-900/10 rounded-2xl p-6 shadow-sm print-card space-y-6">
      <div className="flex items-center gap-2">
        <Heart className="h-5 w-5 text-blue-600 fill-blue-500/20" />
        <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">Patient Summary</h3>
      </div>

      {hasEnglish && (
        <div className="space-y-2">
          {hasHindi && (
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> English Summary
            </h4>
          )}
          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200 font-semibold">
            {soapNote.patientSummaryEnglish}
          </p>
        </div>
      )}

      {hasEnglish && hasHindi && <div className="h-px bg-blue-100 dark:bg-blue-900/30"></div>}

      {hasHindi && (
        <div className="space-y-2">
          {hasEnglish && (
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Hindi Summary (हिंदी सारांश)
            </h4>
          )}
          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200 font-sans font-semibold">
            {soapNote.patientSummaryHindi}
          </p>
        </div>
      )}
    </div>
  );
}

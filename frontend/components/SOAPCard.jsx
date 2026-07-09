'use client';

import { Activity, Stethoscope, ClipboardList, Thermometer, Calendar } from 'lucide-react';
import { getSeverityStyles, formatFollowUpDate } from '../utils/formatters';

export default function SOAPCard({ soapNote }) {
  if (!soapNote) return null;

  const sections = [
    {
      title: 'Subjective',
      icon: Stethoscope,
      content: soapNote.subjective,
      color: 'border-l-indigo-500',
      textColor: 'text-indigo-500 bg-indigo-500/10'
    },
    {
      title: 'Objective',
      icon: Thermometer,
      content: soapNote.objective,
      color: 'border-l-amber-500',
      textColor: 'text-amber-500 bg-amber-500/10'
    },
    {
      title: 'Assessment',
      icon: Activity,
      content: soapNote.assessment,
      color: 'border-l-sky-500',
      textColor: 'text-sky-500 bg-sky-500/10'
    },
    {
      title: 'Plan',
      icon: ClipboardList,
      content: soapNote.plan,
      color: 'border-l-blue-600',
      textColor: 'text-blue-700 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Clinical metadata row */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 shadow-sm print-card">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-semibold text-slate-400">Consultation Severity:</span>
          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${getSeverityStyles(soapNote.severity)}`}>
            {soapNote.severity?.toUpperCase()}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          {soapNote.icdCode && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">ICD-10 Code:</span>
              <span className="text-xs font-bold bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-lg text-blue-600 dark:text-blue-400">
                {soapNote.icdCode}
              </span>
            </div>
          )}

          {soapNote.followUpDate && (
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span>Follow-up: {formatFollowUpDate(soapNote.followUpDate)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Grid of SOAP Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((sec) => {
          const IconComponent = sec.icon;
          return (
            <div
              key={sec.title}
              className={`bg-white dark:bg-slate-900 border-l-4 ${sec.color} rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 print-card`}
            >
              <div className="flex items-center gap-2.5 mb-4">
                <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${sec.textColor}`}>
                  <IconComponent className="h-4.5 w-4.5 stroke-[2.5]" />
                </div>
                <h3 className="font-extrabold text-lg tracking-tight">{sec.title}</h3>
              </div>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-line">
                {sec.content || 'Not documented'}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

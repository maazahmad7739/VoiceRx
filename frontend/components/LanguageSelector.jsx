'use client';

import { Languages } from 'lucide-react';

export default function LanguageSelector({ selectedLanguage, onChange }) {
  const options = [
    { value: 'english', label: 'English Only', description: 'English SOAP & Summary' },
    { value: 'hindi', label: 'Hindi Only', description: 'English SOAP, Hindi Summary' },
    { value: 'both', label: 'Bilingual (Both)', description: 'English SOAP, English & Hindi Summary' }
  ];

  return (
    <div className="space-y-3">
      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
        <Languages className="h-4 w-4 text-blue-600" />
        <span>Clinical Summary Translation Language</span>
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex flex-col text-left p-4 rounded-2xl border transition-all ${
              selectedLanguage === opt.value
                ? 'bg-blue-50/80 border-blue-600 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 ring-2 ring-blue-500/20'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-sm'
            }`}
          >
            <span className="font-bold text-sm">{opt.label}</span>
            <span className="text-[10px] text-slate-400 mt-1">{opt.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

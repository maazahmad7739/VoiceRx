'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';

const STEPS = [
  { label: 'Analyzing clinical case input...', duration: 2000 },
  { label: 'Searching PubMed medical registry...', duration: 2500 },
  { label: 'Parsing WHO guidelines database...', duration: 2500 },
  { label: 'Grounding ICMR & regional practices...', duration: 2500 },
  { label: 'Assembling patient-specific recommendations...', duration: null } // waits for API
];

export default function LoadingSteps({ active }) {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);

  useEffect(() => {
    if (!active) {
      setCurrentStepIdx(0);
      return;
    }

    let timer;
    const runNextStep = (idx) => {
      if (idx >= STEPS.length - 1) return;
      const step = STEPS[idx];
      
      timer = setTimeout(() => {
        setCurrentStepIdx(idx + 1);
        runNextStep(idx + 1);
      }, step.duration);
    };

    runNextStep(0);

    return () => clearTimeout(timer);
  }, [active]);

  if (!active) return null;

  return (
    <div className="space-y-6">
      
      {/* 1. Pulsing Stepper list */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Loader2 className="h-4.5 w-4.5 animate-spin text-blue-650" />
          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">Consultation Pipeline Running...</h4>
        </div>

        <div className="space-y-3.5 pl-1">
          {STEPS.map((step, idx) => {
            const isDone = idx < currentStepIdx;
            const isActive = idx === currentStepIdx;

            return (
              <div key={idx} className="flex items-center gap-3 text-xs">
                {isDone ? (
                  <CheckCircle2 className="h-4.5 w-4.5 text-blue-600 shrink-0" />
                ) : isActive ? (
                  <Loader2 className="h-4.5 w-4.5 text-blue-600 animate-spin shrink-0" />
                ) : (
                  <Circle className="h-4.5 w-4.5 text-slate-200 dark:text-slate-800 shrink-0" />
                )}
                
                <span className={`font-semibold ${isDone ? 'text-slate-400 line-through font-normal' : isActive ? 'text-blue-600 font-bold' : 'text-slate-500'}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Medical Chart Skeleton Loader Skeletons */}
      <div className="space-y-6">
        
        {/* Direct Answer Skeleton card */}
        <div className="bg-white dark:bg-slate-900 shadow-sm rounded-2xl p-6 border-t-4 border-blue-600/30 animate-pulse space-y-4">
          <div className="h-2 w-36 bg-blue-500/10 dark:bg-blue-500/5 rounded"></div>
          <div className="space-y-2">
            <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded"></div>
            <div className="h-3 w-5/6 bg-slate-100 dark:bg-slate-800 rounded"></div>
          </div>
        </div>

        {/* Applied Guidelines Stepper Skeleton Card */}
        <div className="bg-white dark:bg-slate-900 shadow-sm rounded-2xl p-6 animate-pulse space-y-6">
          <div className="h-2.5 w-32 bg-slate-100 dark:bg-slate-800 rounded"></div>
          
          <div className="relative pl-6 border-l border-slate-100 dark:border-slate-800 space-y-6 ml-2">
            <div className="space-y-2 relative">
              <div className="absolute -left-[30px] top-1.5 h-2 w-2 rounded-full bg-slate-200 dark:bg-slate-850"></div>
              <div className="h-2.5 w-1/4 bg-slate-100 dark:bg-slate-800 rounded"></div>
              <div className="h-2 w-1/2 bg-slate-50 dark:bg-slate-800/80 rounded"></div>
            </div>
            
            <div className="space-y-2 relative">
              <div className="absolute -left-[30px] top-1.5 h-2 w-2 rounded-full bg-slate-200 dark:bg-slate-850"></div>
              <div className="h-2.5 w-1/3 bg-slate-100 dark:bg-slate-800 rounded"></div>
              <div className="h-2 w-2/3 bg-slate-50 dark:bg-slate-800/80 rounded"></div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

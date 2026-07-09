'use client';

import { useState, useEffect, Suspense } from 'react';
import { api } from '../../../utils/api';
import PrescriptionPreview from '../../../components/PrescriptionPreview'; // We can adapt layout preview or write a custom detailed report view!
import DirectAnswerCard from '../../../components/DirectAnswerCard';
import GuidelinesApplied from '../../../components/GuidelinesApplied';
import WhatGuidelinesSuggest from '../../../components/WhatGuidelinesSuggest';
import IndiaContextCard from '../../../components/IndiaContextCard';
import RedFlagsCard from '../../../components/RedFlagsCard';
import EvidenceStrengthBadge from '../../../components/EvidenceStrengthBadge';

import { 
  History, Search, Calendar, FileText, ArrowLeft, Loader2, User, HelpCircle, Activity 
} from 'lucide-react';

function HistoryContent() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Active detailed view
  const [activeItem, setActiveItem] = useState(null);
  const [activeDetailsLoading, setActiveDetailsLoading] = useState(false);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const data = await api.get('/second-opinion/history');
        setList(data);
      } catch (err) {
        console.error('Failed to load second opinion history:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  const handleSelectItem = async (id) => {
    setActiveDetailsLoading(true);
    try {
      const data = await api.get(`/second-opinion/${id}`);
      setActiveItem(data);
    } catch (err) {
      console.error('Failed to load second opinion detail:', err);
    } finally {
      setActiveDetailsLoading(false);
    }
  };

  const filteredList = list.filter(item => {
    const text = (item.caseInput || '').toLowerCase() + 
                 (item.specificQuestion || '').toLowerCase() + 
                 (item.patient?.name || '').toLowerCase();
    return text.includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          <p className="text-sm font-semibold text-slate-500">Loading consultation catalog...</p>
        </div>
      </div>
    );
  }

  // Detailed view of a single historical consultation
  if (activeItem) {
    return (
      <div className="space-y-6">
        <div>
          <button
            onClick={() => setActiveItem(null)}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
            <span>Back to History List</span>
          </button>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-250 dark:border-slate-800 rounded-3xl p-6 shadow-sm no-print space-y-3">
          <div className="flex justify-between items-start gap-4">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-450">Patient Case History Details</h3>
            <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>Consult Date: {new Date(activeItem.createdAt).toLocaleDateString()}</span>
            </span>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
            <div className="text-xs text-slate-500 font-semibold leading-relaxed">
              <strong>Patient profile:</strong> {activeItem.patient ? `${activeItem.patient.name} (${activeItem.patient.age}y, ${activeItem.patient.gender})` : `${activeItem.patientAge || 'unknown'}y, ${activeItem.patientGender || 'unknown'}`}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed font-serif">
              "{activeItem.caseInput}"
            </p>
            <div className="border-t border-slate-100 dark:border-slate-800/80 pt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-450">
              Query Question: "{activeItem.specificQuestion}"
            </div>
          </div>
        </div>

        {/* Opinion details cards */}
        <DirectAnswerCard 
          answer={activeItem.directAnswer} 
          caveat={activeItem.geminiFullResponse?.important_caveat} 
        />

        <GuidelinesApplied 
          guidelines={activeItem.guidelinesApplied} 
        />

        <WhatGuidelinesSuggest 
          suggest={activeItem.whatGuidelinesSuggest} 
        />

        <IndiaContextCard 
          context={activeItem.indiaContext} 
        />

        <RedFlagsCard 
          redFlags={activeItem.geminiFullResponse?.red_flags} 
          whenToRefer={activeItem.geminiFullResponse?.when_to_refer} 
        />

        <EvidenceStrengthBadge 
          strength={activeItem.evidenceStrength} 
          confidence={activeItem.geminiFullResponse?.confidence}
          conflictingGuidelines={activeItem.geminiFullResponse?.conflicting_guidelines}
        />
      </div>
    );
  }

  // History list page
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
          <History className="h-7 w-7 text-emerald-500" />
          <span>Consultation Second Opinion History</span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Review and audit past guidelines consultations generated for patient profiles.
        </p>
      </div>

      {/* Search filters */}
      <div className="flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 items-center gap-3">
        <Search className="h-5 w-5 text-slate-400 shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by patient name, diagnosis keywords, comorbidities..."
          className="bg-transparent text-sm w-full focus:outline-none focus:ring-0"
        />
      </div>

      {/* History grid checklist */}
      {filteredList.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {filteredList.map((item) => (
            <div
              key={item.id}
              onClick={() => handleSelectItem(item.id)}
              className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl cursor-pointer hover:border-emerald-500/40 hover:bg-emerald-500/[0.01] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 hover-card"
            >
              <div className="space-y-2 max-w-xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  <strong className="text-sm tracking-tight text-slate-800 dark:text-slate-100">
                    {item.patient ? item.patient.name : `Case: ${item.patientAge}y / ${item.patientGender}`}
                  </strong>
                  <span className="text-[10px] text-slate-400 font-mono pl-2">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                  
                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-[9px] font-extrabold rounded-md text-slate-500 capitalize border border-slate-200 dark:border-slate-800">
                    {item.evidenceStrength} evidence
                  </span>
                </div>

                <p className="text-xs text-slate-400 font-medium line-clamp-2">
                  Question: "{item.specificQuestion}"
                </p>
              </div>

              <div className="flex items-center gap-2 self-end md:self-center">
                <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                  <span>View Consult</span>
                  <ArrowLeft className="h-4 w-4 rotate-180" />
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-slate-450 bg-white dark:bg-slate-900/30">
          <FileText className="h-8 w-8 mx-auto mb-2 text-slate-350" />
          <h4 className="font-extrabold text-sm uppercase tracking-wide">No consult history found</h4>
          <p className="text-xs mt-0.5">We could not find any saved second opinions matching your search.</p>
        </div>
      )}

    </div>
  );
}

export default function HistoryPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          <p className="text-sm font-semibold text-slate-500">Loading history catalog...</p>
        </div>
      </div>
    }>
      <HistoryContent />
    </Suspense>
  );
}

'use client';

import { useState } from 'react';
import { Plus, Trash2, HelpCircle } from 'lucide-react';

const COMMON_INDIAN_MEDICINES = [
  'Paracetamol 650mg (Dolo 650)',
  'Paracetamol 500mg (Calpol)',
  'Pantoprazole 40mg (Pantocid)',
  'Omeprazole 20mg (Omee)',
  'Cetirizine 10mg',
  'Levocetirizine 5mg + Montelukast 10mg (Montair LC)',
  'Amoxicillin 500mg + Clavulanic Acid 125mg (Augmentin 625)',
  'Azithromycin 500mg (Azee)',
  'Metformin 500mg (Glycomet)',
  'Amlodipine 5mg (Amlokind)',
  'Atorvastatin 10mg (Lipvas)',
  'Ibuprofen 400mg + Paracetamol 325mg (Combiflam)',
  'ORS Sachets',
  'B-Complex (Becosules)',
  'Ranitidine 150mg (Rantac)',
  'Ciprofloxacin 500mg (Ciplox)',
  'Multivitamins (Zincovit)',
  'Domperidone 10mg',
  'Telmisartan 40mg (Telma)',
  'Clopidogrel 75mg (Clopilet)',
  'Gabapentin 300mg + Methylcobalamin 500mcg (Gabapin ME)',
  'Diclofenac Gel 1% (Voveran)'
];

const MEDICINE_KEYWORDS = [
  { keywords: ['paracetamol', 'dolo', 'calpol', 'para', 'dol'], full: 'Paracetamol 650mg (Dolo 650)' },
  { keywords: ['pantoprazole', 'pantocid', 'panto'], full: 'Pantoprazole 40mg (Pantocid)' },
  { keywords: ['omeprazole', 'omee', 'omep'], full: 'Omeprazole 20mg (Omee)' },
  { keywords: ['cetirizine', 'cetrizine', 'cetzine'], full: 'Cetirizine 10mg' },
  { keywords: ['montelukast', 'montair', 'levocetirizine', 'montair lc'], full: 'Levocetirizine 5mg + Montelukast 10mg (Montair LC)' },
  { keywords: ['amoxicillin', 'augmentin', 'clavulanic', 'augmentin 625'], full: 'Amoxicillin 500mg + Clavulanic Acid 125mg (Augmentin 625)' },
  { keywords: ['azithromycin', 'azee', 'azithro'], full: 'Azithromycin 500mg (Azee)' },
  { keywords: ['metformin', 'glycomet', 'metformin 500'], full: 'Metformin 500mg (Glycomet)' },
  { keywords: ['amlodipine', 'amlokind', 'amlo'], full: 'Amlodipine 5mg (Amlokind)' },
  { keywords: ['atorvastatin', 'lipvas', 'atorva'], full: 'Atorvastatin 10mg (Lipvas)' },
  { keywords: ['ibuprofen', 'combiflam', 'ibupara'], full: 'Ibuprofen 400mg + Paracetamol 325mg (Combiflam)' },
  { keywords: ['ors', 'electral'], full: 'ORS Sachets' },
  { keywords: ['b-complex', 'becosules', 'vitamin b'], full: 'B-Complex (Becosules)' },
  { keywords: ['ranitidine', 'rantac', 'aciloc'], full: 'Ranitidine 150mg (Rantac)' },
  { keywords: ['ciprofloxacin', 'ciplox', 'cipro'], full: 'Ciprofloxacin 500mg (Ciplox)' },
  { keywords: ['multivitamins', 'zincovit', 'multivitamin'], full: 'Multivitamins (Zincovit)' },
  { keywords: ['domperidone', 'domstal'], full: 'Domperidone 10mg' },
  { keywords: ['telmisartan', 'telma'], full: 'Telmisartan 40mg (Telma)' },
  { keywords: ['clopidogrel', 'clopilet'], full: 'Clopidogrel 75mg (Clopilet)' },
  { keywords: ['gabapentin', 'gabapin', 'methylcobalamin'], full: 'Gabapentin 300mg + Methylcobalamin 500mcg (Gabapin ME)' },
  { keywords: ['diclofenac', 'voveran'], full: 'Diclofenac Gel 1% (Voveran)' }
];

function getLevenshteinDistance(a, b) {
  const matrix = [];
  const s1 = a.toLowerCase().trim();
  const s2 = b.toLowerCase().trim();

  if (s1 === s2) return 0;

  for (let i = 0; i <= s2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= s1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[s2.length][s1.length];
}

function getCorrectedMedicineName(input) {
  if (!input) return input;
  const cleanedInput = input.trim().toLowerCase();

  for (const item of MEDICINE_KEYWORDS) {
    for (const kw of item.keywords) {
      if (cleanedInput === kw) {
        return item.full;
      }
    }
  }

  let bestMatch = null;
  let minDistance = 3;

  for (const item of MEDICINE_KEYWORDS) {
    for (const kw of item.keywords) {
      const distance = getLevenshteinDistance(cleanedInput, kw);
      if (distance < minDistance) {
        minDistance = distance;
        bestMatch = item.full;
      }
    }
  }

  for (const med of COMMON_INDIAN_MEDICINES) {
    const parts = med.toLowerCase().replace(/[()]/g, '').split(' ');
    for (const part of parts) {
      if (part.length < 3) continue;
      const distance = getLevenshteinDistance(cleanedInput, part);
      if (distance < 2) {
        return med;
      }
    }
  }

  if (bestMatch) {
    return bestMatch;
  }

  return input;
}

const FREQUENCY_OPTIONS = [
  'Once daily',
  'Twice daily',
  'Thrice daily',
  'Four times daily',
  'SOS (As needed)'
];

const DURATION_OPTIONS = [
  '3 days',
  '5 days',
  '1 week',
  '2 weeks',
  '1 month',
  '2 months',
  '3 months'
];

const INSTRUCTIONS_OPTIONS = [
  'After food',
  'Before food',
  'Empty stomach',
  'With milk',
  'At bedtime'
];

export default function MedicineTable({ medicines, onChange }) {
  const [activeSuggestionRow, setActiveSuggestionRow] = useState(null);
  const [filterSuggestions, setFilterSuggestions] = useState([]);

  const handleRowChange = (index, field, value) => {
    const updated = [...medicines];
    updated[index][field] = value;

    // Autocalculate total quantity to dispense
    if (field === 'frequency' || field === 'duration') {
      updated[index].quantity = calculateQuantity(updated[index].frequency, updated[index].duration);
    }

    onChange(updated);
  };

  const addRow = () => {
    onChange([
      ...medicines,
      {
        name: '',
        dose: '',
        frequency: 'Once daily',
        duration: '5 days',
        instructions: 'After food',
        quantity: '5'
      }
    ]);
  };

  const deleteRow = (index) => {
    if (medicines.length === 1) {
      // Clear instead of delete if only 1 row remains
      onChange([{
        name: '',
        dose: '',
        frequency: 'Once daily',
        duration: '5 days',
        instructions: 'After food',
        quantity: '5'
      }]);
      return;
    }
    const updated = medicines.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleNameChange = (index, value) => {
    let capitalized = value;
    if (value && value.length > 0) {
      capitalized = value.charAt(0).toUpperCase() + value.slice(1);
    }

    handleRowChange(index, 'name', capitalized);
    if (!capitalized.trim()) {
      setFilterSuggestions([]);
      setActiveSuggestionRow(null);
      return;
    }

    const filtered = COMMON_INDIAN_MEDICINES.filter(med =>
      med.toLowerCase().includes(capitalized.toLowerCase())
    );
    setFilterSuggestions(filtered);
    setActiveSuggestionRow(index);
  };

  const handleNameBlur = (index, value) => {
    setTimeout(() => {
      if (!value || !value.trim()) return;

      const corrected = getCorrectedMedicineName(value);
      if (corrected !== value) {
        const updated = [...medicines];
        updated[index].name = corrected;

        if (corrected.includes('650mg')) updated[index].dose = '650mg';
        else if (corrected.includes('500mg')) updated[index].dose = '500mg';
        else if (corrected.includes('40mg')) updated[index].dose = '40mg';
        else if (corrected.includes('20mg')) updated[index].dose = '20mg';
        else if (corrected.includes('10mg')) updated[index].dose = '10mg';
        else if (corrected.includes('5mg')) updated[index].dose = '5mg';

        onChange(updated);
      }
      setFilterSuggestions([]);
      setActiveSuggestionRow(null);
    }, 200);
  };

  const selectSuggestion = (index, suggestion) => {
    const updated = [...medicines];
    updated[index].name = suggestion;
    
    // Autofill dosage guesses if written in suggestion
    if (suggestion.includes('650mg')) updated[index].dose = '650mg';
    else if (suggestion.includes('500mg')) updated[index].dose = '500mg';
    else if (suggestion.includes('40mg')) updated[index].dose = '40mg';
    else if (suggestion.includes('20mg')) updated[index].dose = '20mg';
    else if (suggestion.includes('10mg')) updated[index].dose = '10mg';
    else if (suggestion.includes('5mg')) updated[index].dose = '5mg';

    onChange(updated);
    setFilterSuggestions([]);
    setActiveSuggestionRow(null);
  };

  const calculateQuantity = (frequency, duration) => {
    let perDay = 1;
    if (frequency === 'Twice daily') perDay = 2;
    else if (frequency === 'Thrice daily') perDay = 3;
    else if (frequency === 'Four times daily') perDay = 4;
    else if (frequency === 'SOS (As needed)') perDay = 1; // Default fallback for SOS

    let days = 1;
    const durLower = duration.toLowerCase();
    const matchVal = parseInt(durLower.match(/\d+/) || '1', 10);
    
    if (durLower.includes('day')) {
      days = matchVal;
    } else if (durLower.includes('week')) {
      days = matchVal * 7;
    } else if (durLower.includes('month')) {
      days = matchVal * 30;
    }

    return String(perDay * days);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">2. Written Prescription Table Editor</h4>
        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center gap-1.5 text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-transparent px-3 py-1.5 rounded-xl hover:bg-blue-100/80 transition-all shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Add Medicine Row</span>
        </button>
      </div>

      {/* Desktop Tabular View */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800 shadow-inner bg-slate-50/50">
        <table className="w-full text-left border-collapse text-sm min-w-[700px]">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200/60 dark:border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <th className="p-3.5">Medicine Name</th>
              <th className="p-3.5 w-24">Dose</th>
              <th className="p-3.5 w-44">Frequency</th>
              <th className="p-3.5 w-32">Duration</th>
              <th className="p-3.5 w-40">Instructions</th>
              <th className="p-3.5 w-20">Qty</th>
              <th className="p-3.5 w-12 text-center">Delete</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {medicines.map((med, idx) => (
              <tr key={idx} className="bg-white dark:bg-slate-955 hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                
                {/* Name & Autocomplete Suggestions */}
                <td className="p-3 relative">
                  <input
                    type="text"
                    value={med.name}
                    onChange={(e) => handleNameChange(idx, e.target.value)}
                    onBlur={(e) => handleNameBlur(idx, e.target.value)}
                    placeholder="E.g. Dolo 650"
                    className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:bg-white transition-all shadow-sm"
                  />
                  {activeSuggestionRow === idx && filterSuggestions.length > 0 && (
                    <div className="absolute z-10 left-3 right-3 top-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {filterSuggestions.map((sug, sIdx) => (
                        <div
                          key={sIdx}
                          onClick={() => selectSuggestion(idx, sug)}
                          className="px-3.5 py-2 text-xs font-semibold hover:bg-blue-50 hover:text-blue-700 cursor-pointer transition-colors"
                        >
                          {sug}
                        </div>
                      ))}
                    </div>
                  )}
                </td>

                {/* Dose */}
                <td className="p-3">
                  <input
                    type="text"
                    value={med.dose}
                    onChange={(e) => handleRowChange(idx, 'dose', e.target.value)}
                    placeholder="650mg"
                    className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:bg-white transition-all text-center shadow-sm"
                  />
                </td>

                {/* Frequency */}
                <td className="p-3">
                  <select
                    value={med.frequency}
                    onChange={(e) => handleRowChange(idx, 'frequency', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:bg-white transition-all shadow-sm"
                  >
                    {FREQUENCY_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </td>

                {/* Duration */}
                <td className="p-3">
                  <select
                    value={med.duration}
                    onChange={(e) => handleRowChange(idx, 'duration', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:bg-white transition-all shadow-sm"
                  >
                    {DURATION_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </td>

                {/* Instructions */}
                <td className="p-3">
                  <select
                    value={med.instructions}
                    onChange={(e) => handleRowChange(idx, 'instructions', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:bg-white transition-all shadow-sm"
                  >
                    {INSTRUCTIONS_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </td>

                {/* Quantity */}
                <td className="p-3">
                  <input
                    type="number"
                    value={med.quantity}
                    onChange={(e) => handleRowChange(idx, 'quantity', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:bg-white transition-all text-center font-bold shadow-sm"
                  />
                </td>

                {/* Delete button */}
                <td className="p-3 text-center">
                  <button
                    type="button"
                    onClick={() => deleteRow(idx)}
                    className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout */}
      <div className="block md:hidden space-y-4">
        {medicines.map((med, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3 relative">
            <div className="flex items-center justify-between">
              <span className="h-6 w-6 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 rounded-full flex items-center justify-center font-bold text-xs">
                {idx + 1}
              </span>
              <button
                type="button"
                onClick={() => deleteRow(idx)}
                className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {/* Medicine Name with Suggestions */}
            <div className="space-y-1.5 relative">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Medicine Name</label>
              <input
                type="text"
                value={med.name}
                onChange={(e) => handleNameChange(idx, e.target.value)}
                onBlur={(e) => handleNameBlur(idx, e.target.value)}
                placeholder="E.g. Dolo 650"
                className="w-full bg-slate-50 dark:bg-slate-955 border-none rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:bg-white transition-all shadow-sm"
              />
              {activeSuggestionRow === idx && filterSuggestions.length > 0 && (
                <div className="absolute z-10 left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {filterSuggestions.map((sug, sIdx) => (
                    <div
                      key={sIdx}
                      onClick={() => selectSuggestion(idx, sug)}
                      className="px-3.5 py-2 text-xs font-semibold hover:bg-blue-50 hover:text-blue-700 cursor-pointer transition-colors"
                    >
                      {sug}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Dose */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Dose</label>
                <input
                  type="text"
                  value={med.dose}
                  onChange={(e) => handleRowChange(idx, 'dose', e.target.value)}
                  placeholder="650mg"
                  className="w-full bg-slate-50 dark:bg-slate-955 border-none rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:bg-white transition-all shadow-sm"
                />
              </div>

              {/* Quantity */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Quantity</label>
                <input
                  type="number"
                  value={med.quantity}
                  onChange={(e) => handleRowChange(idx, 'quantity', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-955 border-none rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:bg-white transition-all font-bold shadow-sm"
                />
              </div>
            </div>

            {/* Frequency */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Frequency</label>
              <select
                value={med.frequency}
                onChange={(e) => handleRowChange(idx, 'frequency', e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-955 border-none rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:bg-white transition-all shadow-sm"
              >
                {FREQUENCY_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Duration */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Duration</label>
                <select
                  value={med.duration}
                  onChange={(e) => handleRowChange(idx, 'duration', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-955 border-none rounded-xl px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:bg-white transition-all shadow-sm"
                >
                  {DURATION_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              {/* Instructions */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Instructions</label>
                <select
                  value={med.instructions}
                  onChange={(e) => handleRowChange(idx, 'instructions', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-955 border-none rounded-xl px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:bg-white transition-all shadow-sm"
                >
                  {INSTRUCTIONS_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import QuickTemplates from './QuickTemplates';
import { Mic, MicOff, AlertCircle, FileText, Send, User } from 'lucide-react';

const COMMON_COMORBIDITIES = [
  'Diabetes Mellitus',
  'Hypertension',
  'Chronic Kidney Disease',
  'Coronary Artery Disease',
  'Asthma',
  'COPD',
  'Hypothyroidism'
];

export default function CaseInputForm({ onSubmit, loading }) {
  const [caseInput, setCaseInput] = useState('');
  const [specificQuestion, setSpecificQuestion] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState('Male');
  const [selectedComorbidities, setSelectedComorbidities] = useState([]);
  const [currentMedicationsText, setCurrentMedicationsText] = useState('');
  
  // Microphone recording
  const [isListening, setIsListening] = useState(false);
  const [micError, setMicError] = useState('');
  const recognitionRef = useRef(null);

  // Hardware microphone booster (Gain & Sensitivity Normalizer)
  useEffect(() => {
    let audioStream = null;
    if (isListening) {
      navigator.mediaDevices.getUserMedia({
        audio: {
          autoGainControl: true,
          echoCancellation: true,
          noiseSuppression: true
        }
      })
      .then((stream) => {
        audioStream = stream;
      })
      .catch((err) => {
        console.warn('Microphone booster failed to initialize:', err);
      });
    }
    return () => {
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isListening]);

  useEffect(() => {
    const SpeechRecognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SpeechRecognition) return;

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-IN';

    rec.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          setCaseInput(prev => prev + event.results[i][0].transcript + ' ');
        }
      }
    };

    rec.onerror = (e) => {
      if (e.error === 'not-allowed') {
        setMicError('Microphone permission blocked.');
        setIsListening(false);
      }
    };

    rec.onend = () => {
      if (isListening) {
        try { rec.start(); } catch (err) {}
      }
    };

    recognitionRef.current = rec;

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, [isListening]);

  const toggleMic = () => {
    if (!recognitionRef.current) {
      setMicError('Web Speech API is not supported in this browser.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setMicError('');
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSelectTemplate = (data) => {
    setCaseInput(data.case_input);
    setSpecificQuestion(data.specific_question);
    setPatientAge(data.patient_age);
    setPatientGender(data.patient_gender);
    setSelectedComorbidities(data.comorbidities);
    setCurrentMedicationsText(data.current_medications.join(', '));
  };

  const handleComorbidityCheck = (item) => {
    if (selectedComorbidities.includes(item)) {
      setSelectedComorbidities(selectedComorbidities.filter(c => c !== item));
    } else {
      setSelectedComorbidities([...selectedComorbidities, item]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!caseInput.trim() || !specificQuestion.trim()) return;
    
    // Parse medications list
    const meds = currentMedicationsText
      .split(',')
      .map(m => m.trim())
      .filter(m => m.length > 0);

    onSubmit({
      case_input: caseInput,
      specific_question: specificQuestion,
      patient_age: patientAge ? parseInt(patientAge, 10) : null,
      patient_gender: patientGender,
      comorbidities: selectedComorbidities,
      current_medications: meds
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* 1. Quick templates select */}
      <QuickTemplates onSelect={handleSelectTemplate} />

      {/* 2. Case text description */}
      <div className="space-y-2 relative">
        <div className="flex justify-between items-center">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Clinical Patient Case Description</label>
          <button
            type="button"
            onClick={toggleMic}
            className={`p-1.5 rounded-lg border-none flex items-center gap-1 text-[10px] font-bold uppercase transition-all ${
              isListening 
                ? 'bg-red-500/10 text-red-500 animate-pulse' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
            }`}
          >
            {isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
            <span>{isListening ? 'Stop' : 'Dictate'}</span>
          </button>
        </div>

        {micError && (
          <div className="text-[10px] text-rose-500 flex items-center gap-1">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>{micError}</span>
          </div>
        )}

        <textarea
          value={caseInput}
          onChange={(e) => setCaseInput(e.target.value)}
          placeholder="E.g. Patient is a 55 year old male complaining of recurring headaches and chest tightness..."
          required
          className="w-full bg-slate-50 dark:bg-slate-950/60 border-none rounded-2xl p-4 min-h-[140px] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:bg-white dark:focus:bg-slate-900 transition-all duration-200 leading-relaxed shadow-inner"
        />
      </div>

      {/* 3. Patient Demographics & Profile Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1"><User className="h-4 w-4" /><span>Patient Age</span></label>
          <input
            type="number"
            value={patientAge}
            onChange={(e) => setPatientAge(e.target.value)}
            placeholder="Age (e.g. 58)"
            className="w-full bg-slate-50 dark:bg-slate-950/60 border-none rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:bg-white dark:focus:bg-slate-900 transition-all duration-200 shadow-inner"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Gender</label>
          <select
            value={patientGender}
            onChange={(e) => setPatientGender(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950/60 border-none rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:bg-white dark:focus:bg-slate-900 transition-all duration-200 font-semibold shadow-inner"
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

      </div>

      {/* 4. Comorbidities selection */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Comorbidities (Select all that apply)</label>
        <div className="flex flex-wrap gap-2">
          {COMMON_COMORBIDITIES.map((c) => {
            const checked = selectedComorbidities.includes(c);
            return (
              <button
                key={c}
                type="button"
                onClick={() => handleComorbidityCheck(c)}
                className={`px-3 py-1.5 rounded-xl border-none text-xs font-bold transition-all ${
                  checked
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-950/60 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900'
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Current medications */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Medications (Comma-separated)</label>
        <input
          type="text"
          value={currentMedicationsText}
          onChange={(e) => setCurrentMedicationsText(e.target.value)}
          placeholder="E.g. Telmisartan 40mg, Amlodipine 5mg, Metformin 1000mg"
          className="w-full bg-slate-50 dark:bg-slate-950/60 border-none rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:bg-white dark:focus:bg-slate-900 transition-all duration-200 shadow-inner"
        />
      </div>

      {/* 6. Specific consultative question */}
      <div className="space-y-1.5 bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-2xl">
        <label className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">My Specific Consultation Question</label>
        <input
          type="text"
          value={specificQuestion}
          onChange={(e) => setSpecificQuestion(e.target.value)}
          placeholder="E.g. Is Metformin safe to continue given the patient's eGFR score?"
          required
          className="w-full bg-white dark:bg-slate-950 border-none rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25 transition-all duration-200 font-semibold shadow-sm"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || !caseInput.trim() || !specificQuestion.trim()}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-700 text-white font-bold py-3.5 rounded-2xl transition-all shadow-md shadow-blue-500/20 disabled:opacity-50"
      >
        <Send className="h-4.5 w-4.5" />
        <span>Get Second Opinion</span>
      </button>

    </form>
  );
}

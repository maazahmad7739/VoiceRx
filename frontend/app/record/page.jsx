'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '../../utils/api';
import { cleanErrorMessage } from '../../utils/formatters';
import useAppStore from '../../store/useAppStore';
import Recorder from '../../components/Recorder';
import AudioUploader from '../../components/AudioUploader';
import LanguageSelector from '../../components/LanguageSelector';
import SOAPCard from '../../components/SOAPCard';
import PatientSummary from '../../components/PatientSummary';
import FlagsPanel from '../../components/FlagsPanel';
import DrugWarning from '../../components/DrugWarning';
import WhatsAppShare from '../../components/WhatsAppShare';
import { 
  User, Plus, FileText, Clipboard, Printer, Copy, Check, ChevronLeft, Loader2, Sparkles, AlertTriangle 
} from 'lucide-react';

const SCRIBE_TEMPLATES = [
  {
    name: 'Viral Fever & Body Pain (Hinglish)',
    text: 'Patient ko 3 din se high fever hai, severe body pain and retro-orbital pain hai. Mild dehydration present. Appetite is low. Advise paracetamol 650mg SOS and check CBC/platelets tomorrow. Drink plenty of coconut water.'
  },
  {
    name: 'Hypertension Followup (English)',
    text: 'Patient returns for high blood pressure checkup. Current BP is 145/92. Patient reports good compliance with Amlodipine 5mg daily. Pulse rate is 78 bpm. Lungs are clear. Increase Amlodipine to 10mg daily and reassess in two weeks.'
  },
  {
    name: 'Cough and Sore Throat (Hinglish)',
    text: 'Patient presents with severe cough and sore throat for 5 days. Dry cough mostly at night. Throat exam shows mild congestion, no exudates. Chest clear on auscultation. Start Augmentin 625mg twice daily for 5 days, Levocetirizine 5mg at bedtime, and cough syrup.'
  }
];

function RecordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const noteId = searchParams.get('noteId');

  const { doctor, activeSoapResult, setActiveSoapResult } = useAppStore();

  // Patients registry
  const [patientsList, setPatientsList] = useState([]);
  const [patientMode, setPatientMode] = useState('existing'); // 'existing' | 'new'
  const [selectedPatientId, setSelectedPatientId] = useState('');
  
  // New patient details
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientAge, setNewPatientAge] = useState('');
  const [newPatientGender, setNewPatientGender] = useState('Male');
  const [newPatientPhone, setNewPatientPhone] = useState('');

  // Mode Selection
  const [scribeMode, setScribeMode] = useState('live'); // 'live' | 'upload'
  const [liveTranscript, setLiveTranscript] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  
  // Output summary language
  const [summaryLang, setSummaryLang] = useState('both'); // 'english' | 'hindi' | 'both'
  
  // Loading & Error States
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);

  // Fetch patients list
  useEffect(() => {
    async function loadPatients() {
      try {
        const list = await api.get('/patients');
        setPatientsList(list);
        if (list.length > 0) {
          setSelectedPatientId(list[0].id);
        } else {
          setPatientMode('new');
        }
      } catch (err) {
        console.error('Failed to load patients:', err);
      }
    }
    loadPatients();
  }, []);

  // Fetch single note details if noteId is present (loading historical note)
  useEffect(() => {
    if (noteId) {
      async function fetchNote() {
        setFetchLoading(true);
        setErrorMsg('');
        try {
          const data = await api.get(`/soap/${noteId}`);
          setActiveSoapResult(data);
        } catch (err) {
          setErrorMsg('Failed to load SOAP note details.');
          console.error(err);
        } finally {
          setFetchLoading(false);
        }
      }
      fetchNote();
    } else {
      setActiveSoapResult(null);
    }
  }, [noteId, setActiveSoapResult]);

  const handleGenerate = async () => {
    setErrorMsg('');
    setLoading(true);

    try {
      // 1. Compile Patient identification
      const payload = {
        summary_lang: summaryLang
      };

      if (patientMode === 'new') {
        if (!newPatientName || !newPatientAge || !newPatientPhone) {
          throw new Error('Please fill in all patient profile fields.');
        }
        payload.patient_name = newPatientName;
        payload.patient_age = parseInt(newPatientAge, 10);
        payload.patient_gender = newPatientGender;
        payload.patient_phone = newPatientPhone;
      } else {
        if (!selectedPatientId) {
          throw new Error('Please select a registered patient from the registry.');
        }
        payload.patient_id = selectedPatientId;
      }

      // 2. Add Audio / Transcript
      if (scribeMode === 'live') {
        if (!liveTranscript.trim()) {
          throw new Error('Please dictate or type consultation notes first.');
        }
        payload.transcript = liveTranscript;
      } else {
        if (!audioFile) {
          throw new Error('Please select or record an audio file to upload.');
        }
        // Upload audio file and scribe
        const formData = new FormData();
        formData.append('audio', audioFile);
        formData.append('patient_id', payload.patient_id || '');
        formData.append('patient_name', payload.patient_name || '');
        formData.append('patient_age', payload.patient_age || '');
        formData.append('patient_gender', payload.patient_gender || '');
        formData.append('patient_phone', payload.patient_phone || '');
        formData.append('summary_lang', payload.summary_lang);

        const data = await api.postMultipart('/soap/scribe-audio', formData);
        setActiveSoapResult(data);
        return;
      }

      const data = await api.post('/soap/scribe-text', payload);
      setActiveSoapResult(data);

    } catch (err) {
      console.error(err);
      setErrorMsg(cleanErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!activeSoapResult) return;
    const formattedSoap = `
PATIENT: ${activeSoapResult.patient?.name} (${activeSoapResult.patient?.age}y, ${activeSoapResult.patient?.gender})
CLINICAL SOAP NOTE:
[Subjective]: ${activeSoapResult.subjective}
[Objective]: ${activeSoapResult.objective}
[Assessment]: ${activeSoapResult.assessment}
[Plan]: ${activeSoapResult.plan}
[Diagnosis Code]: ICD-10 ${activeSoapResult.icdCode || 'N/A'}
    `;
    navigator.clipboard.writeText(formattedSoap);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // If showing result page
  if (fetchLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm font-semibold text-slate-500">Retrieving case records...</p>
        </div>
      </div>
    );
  }

  if (activeSoapResult) {
    const soapNote = activeSoapResult;
    const patientObj = soapNote.patient;
    const drugWarnings = soapNote.drugWarnings || [];

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Navigation back header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print mb-4">
          <button
            onClick={() => {
              setActiveSoapResult(null);
              router.push('/record');
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-wider"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>New Scribe Console</span>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-200 font-bold py-1.5 px-3 rounded-xl transition-all text-xs hover:shadow-sm shadow-sm"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-blue-600" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied SOAP' : 'Copy SOAP'}</span>
            </button>

            <WhatsAppShare 
              doctor={doctor}
              patient={patientObj}
              soapNote={soapNote}
            />

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1 bg-blue-600 text-white font-bold py-1.5 px-3.5 rounded-xl transition-all text-xs hover:bg-blue-700 shadow-md shadow-blue-500/10"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Slip</span>
            </button>
          </div>
        </div>

        {/* Patient Profile Banner */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md flex flex-wrap justify-between items-center gap-4 print-card print:text-black">
          <div className="space-y-1.5 w-full sm:w-auto">
            <span className="text-[10px] uppercase font-bold tracking-widest text-blue-400">Patient Case File</span>
            <h2 className="text-2xl font-extrabold tracking-tight">{patientObj?.name}</h2>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs font-semibold text-slate-350 print:text-slate-800">
              <span>Age: {patientObj?.age} Years</span>
              <span className="hidden sm:inline">•</span>
              <span>Gender: {patientObj?.gender}</span>
              <span className="hidden sm:inline">•</span>
              <span>Phone: {patientObj?.phone}</span>
            </div>
          </div>
          <div className="text-left sm:text-right text-xs text-slate-400 print:text-slate-800 w-full sm:w-auto border-t sm:border-t-0 border-slate-800 pt-3 sm:pt-0">
            <p>Case ID: {soapNote.id.substring(0, 8)}...</p>
            <p className="mt-1 font-medium">{new Date(soapNote.createdAt).toLocaleDateString('en-IN')}</p>
          </div>
        </div>

        {/* Drug warning panel (RED) */}
        <DrugWarning warnings={drugWarnings} />

        {/* SOAP Card Sections */}
        <SOAPCard soapNote={soapNote} />

        {/* Patient Summaries (Bilingual) */}
        <PatientSummary soapNote={soapNote} />

        {/* Flags Panel (YELLOW) */}
        <FlagsPanel flags={soapNote.flags} />

        {/* Consultation Transcript Accordion */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 print-card">
          <h3 className="font-bold text-xs tracking-wider text-slate-400 mb-3 uppercase">Original Dictation Transcript</h3>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 whitespace-pre-wrap font-mono bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl">
            {soapNote.transcript}
          </p>
        </div>
      </div>
    );
  }

  // Dictation/Upload Console
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Scribe Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-850 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
          <Clipboard className="h-7 w-7 text-blue-600" />
          <span>AI Clinical Scribe Console</span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 font-semibold">
          Record or upload patient consultations in Hinglish. AI will structure clear clinical SOAP notes.
        </p>
      </div>

      {/* Quick Dictation Templates */}
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl px-5 py-4 text-xs shadow-sm no-print">
        <div className="flex items-center gap-1.5 text-slate-400 shrink-0">
          <Sparkles className="h-4 w-4 text-blue-600 animate-pulse fill-current" />
          <span className="font-extrabold uppercase tracking-wider">Sample Consultations:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {SCRIBE_TEMPLATES.map((tmpl, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setLiveTranscript(tmpl.text);
                setScribeMode('live');
              }}
              className="bg-slate-50 dark:bg-slate-950 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 px-3.5 py-2 rounded-xl font-bold transition-all hover:text-blue-600 hover:border-blue-600/30"
            >
              {tmpl.name}
            </button>
          ))}
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50/50 border border-rose-100 text-rose-700 dark:text-rose-400 rounded-xl text-sm flex items-start gap-2 font-semibold shadow-sm">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-rose-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* STEP 1: Patient Details */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="font-bold text-sm tracking-wide text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <User className="h-4.5 w-4.5 text-blue-600" />
            <span>1. Patient Case Registration</span>
          </h3>
          
          <div className="flex bg-slate-50 dark:bg-slate-850 p-0.5 rounded-xl text-xs">
            <button
              onClick={() => setPatientMode('existing')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${patientMode === 'existing' ? 'bg-white dark:bg-slate-950 shadow-sm text-blue-600' : 'text-slate-500'}`}
              type="button"
            >
              Registered Patient
            </button>
            <button
              onClick={() => setPatientMode('new')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${patientMode === 'new' ? 'bg-white dark:bg-slate-950 shadow-sm text-blue-600' : 'text-slate-500'}`}
              type="button"
            >
              Add New
            </button>
          </div>
        </div>

        {patientMode === 'existing' ? (
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Select Patient File</label>
            {patientsList.length > 0 ? (
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border-none rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:bg-white transition-all font-semibold shadow-inner"
              >
                {patientsList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.age}y, {p.gender}) — Phone: {p.phone}
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-sm text-slate-400 py-2 font-semibold">
                No patients found in your registry. Please select "Add New" to register a patient.
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Patient Name</label>
              <input
                type="text"
                value={newPatientName}
                onChange={(e) => setNewPatientName(e.target.value)}
                placeholder="Ramesh Gupta"
                className="w-full bg-slate-50 dark:bg-slate-950 border-none rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:bg-white transition-all shadow-inner"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Age</label>
              <input
                type="number"
                value={newPatientAge}
                onChange={(e) => setNewPatientAge(e.target.value)}
                placeholder="45"
                className="w-full bg-slate-50 dark:bg-slate-950 border-none rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:bg-white transition-all shadow-inner"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Gender</label>
              <select
                value={newPatientGender}
                onChange={(e) => setNewPatientGender(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border-none rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:bg-white transition-all font-semibold shadow-inner"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Phone</label>
              <input
                type="tel"
                value={newPatientPhone}
                onChange={(e) => setNewPatientPhone(e.target.value)}
                placeholder="9876543210"
                className="w-full bg-slate-50 dark:bg-slate-950 border-none rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:bg-white transition-all shadow-inner"
              />
            </div>
          </div>
        )}
      </div>

      {/* STEP 2: Dictation Mode */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="font-bold text-sm tracking-wide text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Clipboard className="h-4.5 w-4.5 text-blue-600" />
            <span>2. Scribe Method Selection</span>
          </h3>

          <div className="flex bg-slate-50 dark:bg-slate-850 p-0.5 rounded-xl text-xs">
            <button
              onClick={() => setScribeMode('live')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${scribeMode === 'live' ? 'bg-white dark:bg-slate-950 shadow-sm text-blue-600' : 'text-slate-500'}`}
              type="button"
            >
              Live Dictation
            </button>
            <button
              onClick={() => setScribeMode('upload')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${scribeMode === 'upload' ? 'bg-white dark:bg-slate-950 shadow-sm text-blue-600' : 'text-slate-500'}`}
              type="button"
            >
              Upload File
            </button>
          </div>
        </div>

        {scribeMode === 'live' ? (
          <div className="space-y-4">
            <Recorder onTranscriptChange={setLiveTranscript} />
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Consultation Notes (Or Edit Live Transcription)</label>
              <textarea
                value={liveTranscript}
                onChange={(e) => setLiveTranscript(e.target.value)}
                placeholder="Patient details here, e.g. Patient complain of high fever since 3 days, body pain, prescribed paracetamol..."
                className="w-full bg-slate-50 dark:bg-slate-950/60 border-none rounded-2xl p-4 min-h-[140px] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:bg-white dark:focus:bg-slate-900 transition-all duration-200 leading-relaxed shadow-inner"
              />
            </div>
          </div>
        ) : (
          <AudioUploader onFileSelect={setAudioFile} />
        )}
      </div>

      {/* STEP 3: Summary translation details */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
        <LanguageSelector selectedLanguage={summaryLang} onChange={setSummaryLang} />
      </div>

      {/* Generate Trigger */}
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-700 text-white font-bold py-4 rounded-2xl transition-all shadow-md shadow-blue-500/20 hover:shadow-blue-500/35 text-base disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="animate-pulse">Analyzing Case & Building SOAP...</span>
          </>
        ) : (
          <>
            <Sparkles className="h-5 w-5 fill-current" />
            <span>Generate SOAP Note</span>
          </>
        )}
      </button>
    </div>
  );
}

export default function RecordPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm font-semibold text-slate-500">Loading scribe panel...</p>
        </div>
      </div>
    }>
      <RecordContent />
    </Suspense>
  );
}

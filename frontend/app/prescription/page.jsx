'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '../../utils/api';
import { cleanErrorMessage } from '../../utils/formatters';
import useAppStore from '../../store/useAppStore';
import PrescriptionVoiceInput from '../../components/PrescriptionVoiceInput';
import MedicineTable from '../../components/MedicineTable';
import PrescriptionPreview from '../../components/PrescriptionPreview';
import { 
  FileText, User, Calendar, Plus, Sparkles, AlertTriangle, Loader2, ArrowLeft, ClipboardList 
} from 'lucide-react';

function PrescriptionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const preselectedPatientId = searchParams.get('patientId');
  const soapNoteId = searchParams.get('soapNoteId');

  const { doctor } = useAppStore();

  // Patients list
  const [patients, setPatients] = useState([]);
  const [patientMode, setPatientMode] = useState('existing'); // 'existing' | 'new'
  const [selectedPatientId, setSelectedPatientId] = useState(preselectedPatientId || '');
  
  // New patient form fields
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientAge, setNewPatientAge] = useState('');
  const [newPatientGender, setNewPatientGender] = useState('Male');
  const [newPatientPhone, setNewPatientPhone] = useState('');

  // Mode & Input state
  const [inputMode, setInputMode] = useState('voice'); // 'voice' | 'manual'
  const [medicines, setMedicines] = useState([
    {
      name: '',
      dose: '',
      frequency: 'Once daily',
      duration: '5 days',
      instructions: 'After food',
      quantity: '5'
    }
  ]);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [voiceTranscript, setVoiceTranscript] = useState('');

  // Scribed results
  const [activePrescription, setActivePrescription] = useState(null);
  
  // Loaders
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Load patients list
  useEffect(() => {
    async function fetchPatients() {
      try {
        const list = await api.get('/patients');
        setPatients(list);
        if (list.length > 0 && !preselectedPatientId) {
          setSelectedPatientId(list[0].id);
        } else if (list.length === 0) {
          setPatientMode('new');
        }
      } catch (err) {
        console.error('Failed to load patients:', err);
      } finally {
        setInitialLoading(false);
      }
    }
    fetchPatients();
  }, [preselectedPatientId]);

  // Callback when voice is parsed successfully by Gemini
  const handleParsedPrescription = (parsedResult, transcriptText) => {
    setVoiceTranscript(transcriptText);
    
    if (parsedResult.medicines && parsedResult.medicines.length > 0) {
      const formattedMeds = parsedResult.medicines.map((med) => ({
        name: med.name || '',
        dose: med.dose || '',
        frequency: med.frequency || 'Once daily',
        duration: med.duration || '5 days',
        instructions: med.instructions || 'After food',
        quantity: med.quantity || '5'
      }));
      setMedicines(formattedMeds);
      setInputMode('manual'); // Switch to table mode so doctor can review/edit!
    }

    if (parsedResult.special_instructions && parsedResult.special_instructions !== 'null') {
      setSpecialInstructions(parsedResult.special_instructions);
    }

    if (parsedResult.diagnosis && parsedResult.diagnosis !== 'null') {
      setDiagnosis(parsedResult.diagnosis);
    }
  };

  const handleCreatePrescription = async () => {
    setErrorMsg('');
    setLoading(true);

    try {
      // 1. Compile Patient Profile
      const payload = {
        medicines: medicines.filter(m => m.name.trim().length > 0),
        specialInstructions,
        followUpDate,
        diagnosis,
        voiceTranscript,
        soapNoteId: soapNoteId || null
      };

      if (payload.medicines.length === 0) {
        throw new Error('Please add at least one medicine to the prescription.');
      }

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
          throw new Error('Please select a registered patient.');
        }
        payload.patient_id = selectedPatientId;
      }

      const res = await api.post('/prescriptions', payload);
      setActivePrescription(res);

    } catch (err) {
      console.error(err);
      setErrorMsg(cleanErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setActivePrescription(null);
    setMedicines([
      {
        name: '',
        dose: '',
        frequency: 'Once daily',
        duration: '5 days',
        instructions: 'After food',
        quantity: '5'
      }
    ]);
    setSpecialInstructions('');
    setDiagnosis('');
    setFollowUpDate('');
    setVoiceTranscript('');
    setErrorMsg('');
  };

  if (initialLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm font-semibold text-slate-500">Initializing registry databases...</p>
        </div>
      </div>
    );
  }

  // Displaying Generated Prescription Preview
  if (activePrescription) {
    return (
      <div className="space-y-6 print:p-0">
        <div className="no-print">
          <button
            onClick={resetForm}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-wider"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
            <span>Generate Another Prescription</span>
          </button>
        </div>

        <PrescriptionPreview
          doctor={activePrescription.doctor}
          patient={activePrescription.patient}
          medicines={activePrescription.medicines}
          specialInstructions={activePrescription.specialInstructions}
          followUpDate={activePrescription.followUpDate}
          createdAt={activePrescription.createdAt}
        />
      </div>
    );
  }

  // Editing Prescription Input form
  return (
    <div className="max-w-4xl mx-auto space-y-8 no-print">
      {/* Scribe Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-850 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
          <FileText className="h-7 w-7 text-blue-600" />
          <span>Clinical Prescription Generator</span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 font-semibold">
          Dictate or manually write patient prescriptions. Generates print-ready Rx slips with scan codes.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50/50 border border-rose-100 text-rose-700 dark:text-rose-400 rounded-xl text-sm flex items-start gap-2 font-semibold shadow-sm animate-pulse">
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
            {patients.length > 0 ? (
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border-none rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:bg-white transition-all font-semibold shadow-inner"
              >
                {patients.map((p) => (
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

      {/* STEP 2: Input Method */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="font-bold text-sm tracking-wide text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <ClipboardList className="h-4.5 w-4.5 text-blue-600" />
            <span>2. Prescription Method Selection</span>
          </h3>

          <div className="flex bg-slate-50 dark:bg-slate-850 p-0.5 rounded-xl text-xs">
            <button
              onClick={() => setInputMode('voice')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${inputMode === 'voice' ? 'bg-white dark:bg-slate-950 shadow-sm text-blue-600' : 'text-slate-500'}`}
              type="button"
            >
              Voice Dictation
            </button>
            <button
              onClick={() => setInputMode('manual')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${inputMode === 'manual' ? 'bg-white dark:bg-slate-950 shadow-sm text-blue-600' : 'text-slate-500'}`}
              type="button"
            >
              Written Table
            </button>
          </div>
        </div>

        {inputMode === 'voice' ? (
          <PrescriptionVoiceInput onParsedPrescription={handleParsedPrescription} />
        ) : (
          <MedicineTable medicines={medicines} onChange={setMedicines} />
        )}
      </div>

      {/* STEP 3: Diagnosis, Special instructions & follow up */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Side: Diagnosis and Follow-up */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Diagnosis / Patient Problem</label>
            <input
              type="text"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="E.g. Viral Fever, Acute Pharyngitis, Type-2 Diabetes..."
              className="w-full bg-slate-50 dark:bg-slate-950 border-none rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:bg-white transition-all font-semibold shadow-inner"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Calendar className="h-4.5 w-4.5 text-slate-400" />
              <span>Follow-up Date</span>
            </label>
            <input
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border-none rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:bg-white transition-all font-semibold shadow-inner"
            />
          </div>
        </div>

        {/* Right Side: Special Instructions */}
        <div className="space-y-1.5 flex flex-col">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Special Instructions / General Notes</label>
          <textarea
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            placeholder="E.g. Drink plenty of water, avoid cold foods, check sugar levels twice a week..."
            className="w-full bg-slate-50 dark:bg-slate-955/60 border-none rounded-2xl p-4 flex-1 min-h-[120px] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:bg-white dark:focus:bg-slate-900 transition-all duration-200 leading-relaxed shadow-inner"
          />
        </div>

      </div>

      {/* Submit Button */}
      <button
        onClick={handleCreatePrescription}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-700 text-white font-bold py-4 rounded-2xl transition-all shadow-md shadow-blue-500/20 hover:shadow-blue-500/35 text-base disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="animate-pulse">Generating Clinic Prescription Slip...</span>
          </>
        ) : (
          <>
            <Sparkles className="h-5 w-5 fill-current" />
            <span>Generate & Save Prescription</span>
          </>
        )}
      </button>
    </div>
  );
}

export default function PrescriptionPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm font-semibold text-slate-500">Loading prescription panel...</p>
        </div>
      </div>
    }>
      <PrescriptionContent />
    </Suspense>
  );
}

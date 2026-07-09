'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import jsPDF from 'jspdf';
import { api } from '../../utils/api';
import { cleanErrorMessage } from '../../utils/formatters';
import useAppStore from '../../store/useAppStore';

import CaseInputForm from '../../components/CaseInputForm';
import LoadingSteps from '../../components/LoadingSteps';
import DirectAnswerCard from '../../components/DirectAnswerCard';
import GuidelinesApplied from '../../components/GuidelinesApplied';
import WhatGuidelinesSuggest from '../../components/WhatGuidelinesSuggest';
import IndiaContextCard from '../../components/IndiaContextCard';
import RedFlagsCard from '../../components/RedFlagsCard';
import EvidenceStrengthBadge from '../../components/EvidenceStrengthBadge';

import { 
  ShieldAlert, Stethoscope, Save, FileDown, Copy, Check, Plus, Loader2, ArrowRight, User, FileText
} from 'lucide-react';

function SecondOpinionContent() {
  const searchParams = useSearchParams();
  const preselectedPatientId = searchParams.get('patientId');

  const { doctor } = useAppStore();

  // Patients registry
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(preselectedPatientId || '');
  const [patientTimeline, setPatientTimeline] = useState(null);

  // Form input details
  const [activeFormDetails, setActiveFormDetails] = useState(null);

  // States
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [result, setResult] = useState(null);
  
  // Save controls
  const [saveLoading, setSaveLoading] = useState(false);
  const [savedRecord, setSavedRecord] = useState(null);

  // SOAP link controls
  const [linkSoapLoading, setLinkSoapLoading] = useState(false);
  const [selectedSoapId, setSelectedSoapId] = useState('');

  // Copy success
  const [copied, setCopied] = useState(false);

  // Load patients list
  useEffect(() => {
    async function fetchPatients() {
      try {
        const list = await api.get('/patients');
        setPatients(list);
        if (list.length > 0 && !preselectedPatientId) {
          setSelectedPatientId(list[0].id);
        }
      } catch (err) {
        console.error('Failed to load patients:', err);
      }
    }
    fetchPatients();
  }, [preselectedPatientId]);

  // Load selected patient's SOAP notes when patientId changes
  useEffect(() => {
    if (!selectedPatientId) {
      setPatientTimeline(null);
      return;
    }
    async function fetchPatientDetails() {
      try {
        const details = await api.get(`/patients/${selectedPatientId}`);
        setPatientTimeline(details);
        if (details.soapNotes && details.soapNotes.length > 0) {
          setSelectedSoapId(details.soapNotes[0].id);
        }
      } catch (err) {
        console.error('Failed to load patient timeline:', err);
      }
    }
    fetchPatientDetails();
  }, [selectedPatientId]);

  const handleAnalyzeCase = async (formData) => {
    setLoading(true);
    setErrorMsg('');
    setResult(null);
    setSavedRecord(null);
    setSuccessMsg('');
    
    // Cache inputs for database saving later
    setActiveFormDetails(formData);

    try {
      const response = await api.post('/second-opinion/analyze', formData);
      setResult(response);
    } catch (err) {
      setErrorMsg(cleanErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToPatient = async () => {
    if (!result || !activeFormDetails) return;
    setSaveLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const payload = {
        patient_id: selectedPatientId || null,
        case_input: activeFormDetails.case_input,
        specific_question: activeFormDetails.specific_question,
        patient_age: activeFormDetails.patient_age,
        patient_gender: activeFormDetails.patient_gender,
        comorbidities: activeFormDetails.comorbidities,
        current_medications: activeFormDetails.current_medications,
        analysis_result: result
      };

      const saved = await api.post('/second-opinion/save-to-patient', payload);
      setSavedRecord(saved);
      setSuccessMsg('Consultation saved successfully to patient history!');
    } catch (err) {
      setErrorMsg(cleanErrorMessage(err));
    } finally {
      setSaveLoading(false);
    }
  };

  const handleAddToSoapNote = async () => {
    if (!result || !selectedSoapId) return;
    setLinkSoapLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // Find the selected SOAP note
      const soapNote = patientTimeline.soapNotes.find(n => n.id === selectedSoapId);
      if (!soapNote) throw new Error('Target SOAP Note not found.');

      // Append consult direct answer to assessment field
      const updatedAssessment = `${soapNote.assessment || ''}\n\n[Guideline Second Opinion - Dr. ${doctor.name}]: ${result.direct_answer}`;
      
      await api.put(`/soap/${selectedSoapId}`, {
        assessment: updatedAssessment
      });

      setSuccessMsg('Guidelines recommendation successfully appended to SOAP Note Assessment timeline!');
      
      // Refresh timeline
      const details = await api.get(`/patients/${selectedPatientId}`);
      setPatientTimeline(details);
    } catch (err) {
      setErrorMsg(cleanErrorMessage(err));
    } finally {
      setLinkSoapLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result?.direct_answer) return;
    navigator.clipboard.writeText(result.direct_answer).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownloadPdf = () => {
    if (!result || !activeFormDetails) return;

    const doc = new jsPDF('p', 'mm', 'a4');
    
    // Header Style
    doc.setFillColor(15, 23, 42); // slate-900 header
    doc.rect(0, 0, 210, 30, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('CLINICAL SECOND OPINION REPORT', 15, 18);
    doc.setFontSize(9);
    doc.setFont('Helvetica', 'normal');
    doc.text('Based on WHO, ICMR, AHA, ADA & PubMed Guideline groundings', 15, 24);

    // Doctor & Patient Info
    doc.setTextColor(15, 23, 42);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`Consulting Physician: Dr. ${doctor.name}`, 15, 42);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Specialization: ${doctor.specialization || 'Clinical Practitioner'}`, 15, 48);
    doc.text(`Date of Consult: ${new Date().toLocaleDateString('en-IN')}`, 15, 54);

    // Patient profile
    doc.setFillColor(248, 250, 252); // slate-50
    doc.rect(15, 62, 180, 20, 'F');
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.rect(15, 62, 180, 20, 'S');

    doc.setFont('Helvetica', 'bold');
    doc.text(`Patient Profile:`, 20, 70);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Age/Gender: ${activeFormDetails.patient_age || 'N/A'}y / ${activeFormDetails.patient_gender}`, 20, 76);
    doc.text(`Comorbidities: ${activeFormDetails.comorbidities.join(', ') || 'None'}`, 80, 76);

    // Specific Question
    doc.setFont('Helvetica', 'bold');
    doc.text(`Doctor's Specific Query:`, 15, 92);
    doc.setFont('Helvetica', 'normal');
    doc.text(`"${activeFormDetails.specific_question}"`, 15, 98);

    // Direct Answer
    doc.setFillColor(236, 253, 245); // emerald-50
    doc.rect(15, 106, 180, 24, 'F');
    doc.setDrawColor(209, 250, 229); // emerald-200
    doc.rect(15, 106, 180, 24, 'S');

    doc.setTextColor(5, 150, 105); // emerald-600
    doc.setFont('Helvetica', 'bold');
    doc.text(`DIRECT RECOMMENDATION:`, 20, 113);
    doc.setTextColor(15, 23, 42);
    doc.setFont('Helvetica', 'normal');
    
    // Split text for formatting lines
    const lines = doc.splitTextToSize(result.direct_answer, 170);
    doc.text(lines, 20, 120);

    // Guidelines applied
    doc.setFont('Helvetica', 'bold');
    doc.text('Key Guidelines Applied:', 15, 142);
    doc.setFont('Helvetica', 'normal');
    
    let y = 148;
    result.guidelines_applied?.slice(0, 3).forEach((g, idx) => {
      doc.setFont('Helvetica', 'bold');
      doc.text(`${idx + 1}. ${g.source} (${g.year}): ${g.guideline_name}`, 15, y);
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`   Rec: ${g.recommendation.slice(0, 80)}...`, 15, y + 5);
      doc.setTextColor(15, 23, 42);
      y += 12;
    });

    // Medical disclaimer
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text('Disclaimer: Clinical reference only. recommendations must be evaluated by a physician.', 15, 280);

    doc.save(`clinical_second_opinion_${activeFormDetails.patient_age || 'case'}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Page Title & Hero Description */}
      <div className="mb-6 no-print">
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
          <Stethoscope className="h-8 w-8 text-blue-600 shrink-0" />
          <span>Clinical Guidelines Assistant</span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed font-semibold">
          High-precision clinical reference querying PubMed XML registries, WHO databases, and live Google Search Grounding to construct patient-specific recommendations.
        </p>
      </div>

      {/* 1. Mandatory Medical Disclaimer */}
      <div className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl p-4 flex gap-3 items-start no-print shadow-sm">
        <ShieldAlert className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <strong className="text-xs uppercase font-extrabold tracking-wider text-rose-700 dark:text-rose-455">Clinical Reference Disclaimer</strong>
          <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
            Second Opinion Mode provides clinical reference based on published guidelines. All recommendations must be interpreted by a qualified physician. This does not replace clinical judgment or direct patient examination.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50/50 border border-emerald-100 text-emerald-700 dark:text-emerald-400 rounded-2xl text-sm font-semibold no-print shadow-sm">
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50/50 border border-rose-100 text-rose-700 dark:text-rose-400 rounded-2xl text-sm font-semibold no-print shadow-sm">
          {errorMsg}
        </div>
      )}

      {/* 2. Main Workspace split dual-panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Panel: Case Input Form (Span 5 columns) */}
        <div className="lg:col-span-5 space-y-6 no-print">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-2 border-b border-slate-100/80 dark:border-slate-800/80 pb-3 mb-6">
              <FileText className="h-5 w-5 text-blue-600" />
              <h3 className="font-bold text-sm uppercase tracking-wider text-slate-400">Clinical Case Notepad</h3>
            </div>
            
            <CaseInputForm onSubmit={handleAnalyzeCase} loading={loading} />
          </div>
        </div>

        {/* Right Panel: Results (Span 7 columns) */}
        <div className="lg:col-span-7 space-y-6 print:col-span-12">
          
          {loading ? (
            <LoadingSteps active={loading} />
          ) : result ? (
            <div className="space-y-6">
              
              {/* Action Toolbar */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 flex flex-wrap gap-3 items-center justify-between no-print shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse"></div>
                  <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest">Opinion Report Compiled</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-200 font-bold py-1.5 px-3 rounded-lg transition-all text-xs hover:bg-slate-100"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-blue-600" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    onClick={handleDownloadPdf}
                    className="inline-flex items-center gap-1 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-200 font-bold py-1.5 px-3 rounded-lg transition-all text-xs hover:bg-slate-100"
                  >
                    <FileDown className="h-3.5 w-3.5" />
                    <span>PDF</span>
                  </button>

                  <button
                    onClick={handlePrint}
                    className="inline-flex items-center gap-1 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-200 font-bold py-1.5 px-3 rounded-lg transition-all text-xs hover:bg-slate-100"
                  >
                    <span>Print</span>
                  </button>
                </div>
              </div>

              {/* CARD 1: Direct Answer */}
              <DirectAnswerCard 
                answer={result.direct_answer} 
                caveat={result.important_caveat} 
              />

              {/* CARD 2: Guidelines Applied */}
              <GuidelinesApplied 
                guidelines={result.guidelines_applied} 
              />

              {/* CARD 3: What Guidelines Suggest */}
              <WhatGuidelinesSuggest 
                suggest={result.what_guidelines_suggest} 
              />

              {/* CARD 4: India Context */}
              <IndiaContextCard 
                context={result.india_context} 
              />

              {/* CARD 5: Red Flags */}
              <RedFlagsCard 
                redFlags={result.red_flags} 
                whenToRefer={result.when_to_refer} 
              />

              {/* CARD 6: Evidence Strength & Conflicts */}
              <EvidenceStrengthBadge 
                strength={result.evidence_strength} 
                confidence={result.confidence}
                conflictingGuidelines={result.conflicting_guidelines}
              />

              {/* Patient Save Registry controls */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 space-y-5 no-print shadow-sm hover:shadow-md transition-all duration-300">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h4 className="font-extrabold text-sm uppercase tracking-wide text-slate-800 dark:text-slate-100">Save Consultation Record</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Link and save this clinical consultation to a patient profile.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
                  <div className="space-y-1.5 flex-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      <span>Select Target Patient</span>
                    </label>
                    
                    {patients.length > 0 ? (
                      <select
                        value={selectedPatientId}
                        onChange={(e) => setSelectedPatientId(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value="">-- Do not link (Anonymous save) --</option>
                        {patients.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.age}y, {p.gender}) — Phone: {p.phone}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="text-xs text-slate-400">No patients registered. Add patients first on the dashboard.</div>
                    )}
                  </div>

                  <button
                    onClick={handleSaveToPatient}
                    disabled={saveLoading || !!savedRecord}
                    className="inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:dark:bg-slate-800 disabled:text-slate-400 text-white font-bold py-2.5 px-4 rounded-xl transition-all text-xs shrink-0 shadow-md shadow-blue-500/10"
                  >
                    {saveLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    <span>{savedRecord ? 'Saved' : 'Save to Record'}</span>
                  </button>
                </div>

                {/* SOAP Note Appending */}
                {selectedPatientId && patientTimeline && patientTimeline.soapNotes && patientTimeline.soapNotes.length > 0 && (
                  <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 space-y-4">
                    <div className="space-y-1">
                      <strong className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Link to active SOAP note</strong>
                      <p className="text-[10px] text-slate-450 leading-relaxed">Append this second opinion directly into an existing SOAP Note assessment.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
                      <div className="space-y-1.5 flex-1">
                        <label className="text-[9px] font-extrabold uppercase tracking-widest text-slate-450">Select consultation SOAP Note</label>
                        <select
                          value={selectedSoapId}
                          onChange={(e) => setSelectedSoapId(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                          {patientTimeline.soapNotes.map(n => (
                            <option key={n.id} value={n.id}>
                              Note date: {new Date(n.createdAt).toLocaleDateString()} — Diagnosis: {n.icdCode || 'Clinical case'}
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        onClick={handleAddToSoapNote}
                        disabled={linkSoapLoading}
                        className="inline-flex items-center justify-center gap-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-700 text-white font-bold py-2.5 px-4 rounded-xl transition-all text-xs shrink-0 shadow-md shadow-blue-500/10"
                      >
                        {linkSoapLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                        <span>Append to SOAP Note</span>
                      </button>
                    </div>
                  </div>
                )}

              </div>

            </div>
          ) : (
            <div className="h-full bg-white dark:bg-slate-900 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center p-12 text-slate-400 select-none min-h-[400px] hover:shadow-md transition-all duration-300">
              <div className="h-16 w-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-350 dark:text-slate-600 mb-4 shadow-sm animate-pulse">
                <Stethoscope className="h-8 w-8 text-slate-350 dark:text-slate-500" />
              </div>
              <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-500">No Patient Case Selected</h4>
              <p className="text-xs max-w-sm mt-2 leading-relaxed text-slate-500 font-semibold">
                Enter a clinical case to generate guideline-backed patient protocols.
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}

export default function SecondOpinionPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          <p className="text-sm font-semibold text-slate-500">Loading consultation assistant...</p>
        </div>
      </div>
    }>
      <SecondOpinionContent />
    </Suspense>
  );
}

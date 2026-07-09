'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '../../utils/api';
import { formatDate, getSeverityStyles } from '../../utils/formatters';
import { 
  FileText, Search, Calendar, ChevronRight, Stethoscope, AlertTriangle, ArrowLeft, Clock, RefreshCw, UserPlus, Loader2,
  ChevronDown, ChevronUp, Pill, FileSpreadsheet
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';

function extractVitals(objectiveText) {
  if (!objectiveText || typeof objectiveText !== 'string') return null;

  const vitals = {};

  // 1. Blood Pressure: e.g. "120/80" or "BP: 130/85" or "BP 120/80"
  const bpRegex = /(?:bp|blood\s+pressure)[\s:=-]*(\d{2,3})\s*[/]\s*(\d{2,3})/i;
  const bpRegexNoLabel = /\b(\d{2,3})\s*[/]\s*(\d{2,3})\b/;
  
  let bpMatch = objectiveText.match(bpRegex) || objectiveText.match(bpRegexNoLabel);
  if (bpMatch) {
    vitals.bpSystolic = parseInt(bpMatch[1], 10);
    vitals.bpDiastolic = parseInt(bpMatch[2], 10);
  }

  // 2. Heart Rate / Pulse: e.g. "HR: 72" or "Pulse: 80" or "72 bpm"
  const hrRegex = /(?:hr|heart\s+rate|pulse)[\s:=-]*(\d{2,3})\b/i;
  const hrMatch = objectiveText.match(hrRegex);
  if (hrMatch) {
    vitals.heartRate = parseInt(hrMatch[1], 10);
  }

  // 3. Weight: e.g. "Weight: 70kg" or "70 kg"
  const weightRegex = /(?:weight|wt)[\s:=-]*(\d+(?:\.\d+)?)[\s]*kg/i;
  const weightMatch = objectiveText.match(weightRegex);
  if (weightMatch) {
    vitals.weight = parseFloat(weightMatch[1]);
  }

  // 4. Blood Sugar: e.g. "Sugar: 110" or "Sugar 120 mg/dL" or "Sugar 110"
  const sugarRegex = /(?:sugar|glucose|blood\s+sugar|fbs|ppbs|rbs)[\s:=-]*(\d{2,3})\b/i;
  const sugarMatch = objectiveText.match(sugarRegex);
  if (sugarMatch) {
    vitals.bloodSugar = parseInt(sugarMatch[1], 10);
  }

  // 5. Temperature: e.g. "Temp: 98.6" or "Temperature: 101"
  const tempRegex = /(?:temp|temperature)[\s:=-]*(\d{2,3}(?:\.\d+)?)[\s]*(?:f|c)?\b/i;
  const tempMatch = objectiveText.match(tempRegex);
  if (tempMatch) {
    vitals.temperature = parseFloat(tempMatch[1]);
  }

  return Object.keys(vitals).length > 0 ? vitals : null;
}

function HistoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientIdParam = searchParams.get('patientId');

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // Selected Patient Details for Timeline
  const [selectedPatientId, setSelectedPatientId] = useState(patientIdParam || '');
  const [patientDetails, setPatientDetails] = useState(null);
  const [patientLoading, setPatientLoading] = useState(false);
  const [expandedEvents, setExpandedEvents] = useState({});
  const [mounted, setMounted] = useState(false);
  const [selectedVital, setSelectedVital] = useState('bp');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load history records
  const loadHistory = async () => {
    setLoading(true);
    setError('');
    try {
      let url = '/history';
      const params = [];
      if (searchQuery) params.push(`search=${encodeURIComponent(searchQuery)}`);
      if (filterDate) params.push(`date=${filterDate}`);
      
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }
      
      const data = await api.get(url);
      setNotes(data);
    } catch (err) {
      console.error(err);
      setError('Could not retrieve clinical history records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [searchQuery, filterDate]);

  // Load patient details & timeline when selectedPatientId changes
  useEffect(() => {
    if (selectedPatientId) {
      async function loadPatientTimeline() {
        setPatientLoading(true);
        try {
          const data = await api.get(`/patients/${selectedPatientId}`);
          setPatientDetails(data);
        } catch (err) {
          console.error(err);
        } finally {
          setPatientLoading(false);
        }
      }
      loadPatientTimeline();
    } else {
      setPatientDetails(null);
    }
  }, [selectedPatientId]);

  const timelineEvents = [];
  if (patientDetails) {
    if (patientDetails.soapNotes) {
      patientDetails.soapNotes.forEach(note => {
        timelineEvents.push({
          id: note.id,
          type: 'soap',
          date: new Date(note.createdAt),
          data: note
        });
      });
    }
    if (patientDetails.prescriptions) {
      patientDetails.prescriptions.forEach(prescription => {
        timelineEvents.push({
          id: prescription.id,
          type: 'prescription',
          date: new Date(prescription.createdAt),
          data: prescription
        });
      });
    }
    timelineEvents.sort((a, b) => b.date - a.date);
  }

  const vitalsData = [];
  if (patientDetails?.soapNotes) {
    const sortedNotes = [...patientDetails.soapNotes].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    sortedNotes.forEach(note => {
      const vitals = extractVitals(note.objective);
      if (vitals) {
        vitalsData.push({
          date: new Date(note.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          ...vitals
        });
      }
    });
  }

  const toggleEventExpand = (eventId) => {
    setExpandedEvents(prev => ({
      ...prev,
      [eventId]: !prev[eventId]
    }));
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Patient Records & Timeline</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Historical timeline of patient clinical notes and diagnosis archives
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-2xl text-sm">
          {error}
        </div>
      )}

      {/* Search & Filter Row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl shadow-sm">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search className="h-4.5 w-4.5" />
          </span>
          <input
            type="text"
            placeholder="Search patient by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Calendar className="h-4 w-4" />
            </span>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-semibold"
            />
          </div>
          {(searchQuery || filterDate) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterDate('');
              }}
              className="p-2 text-xs font-semibold text-rose-500 hover:underline"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Main Grid split: Left lists SOAP logs, Right lists patient timeline details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Log of notes */}
        <div className={`lg:col-span-1 space-y-4 ${selectedPatientId ? 'hidden lg:block' : 'block'}`}>
          <h2 className="text-xl font-bold tracking-tight">Clinical SOAP Logs</h2>
          
          {loading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl" />
              ))}
            </div>
          ) : notes.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center text-slate-400">
              <Stethoscope className="h-10 w-10 mx-auto stroke-[1.2] mb-3 text-slate-400" />
              <p className="font-semibold text-sm">No records found</p>
              <p className="text-xs mt-1">Try tweaking filters or search query.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              {notes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => {
                    setSelectedPatientId(note.patientId);
                  }}
                  className={`p-4 rounded-3xl border text-left cursor-pointer transition-all ${
                    selectedPatientId === note.patientId
                      ? 'bg-emerald-500/10 border-emerald-500/50'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <span className="font-extrabold text-sm">{note.patient?.name}</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${getSeverityStyles(note.severity)}`}>
                      {note.severity}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {formatDate(note.createdAt)}
                  </div>
                  <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <span className="text-[10px] font-bold text-slate-400">Diagnosis Summary</span>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Timeline details */}
        <div className={`lg:col-span-2 space-y-4 ${selectedPatientId ? 'block' : 'hidden lg:block'}`}>
          {selectedPatientId && (
            <button
              onClick={() => setSelectedPatientId('')}
              className="lg:hidden flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-emerald-500 transition-colors uppercase tracking-wider mb-2"
              type="button"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to SOAP Logs</span>
            </button>
          )}
          <h2 className="text-xl font-bold tracking-tight">Patient Timeline Profile</h2>

          {patientLoading ? (
            <div className="flex h-64 items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl animate-pulse">
              <RefreshCw className="h-6 w-6 animate-spin text-emerald-500" />
            </div>
          ) : patientDetails ? (
            <div className="space-y-6">
              {/* Patient header card */}
              <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-sm border border-slate-800">
                <h3 className="text-xl font-extrabold">{patientDetails.name}</h3>
                <div className="flex gap-4 text-xs font-semibold text-slate-300 mt-2">
                  <span>Age: {patientDetails.age} Years</span>
                  <span>•</span>
                  <span>Gender: {patientDetails.gender}</span>
                  <span>•</span>
                  <span>Phone: {patientDetails.phone}</span>
                </div>
              </div>

              {/* Vitals Trend Visualization */}
              {vitalsData.length > 0 && mounted ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 uppercase tracking-wider">Vitals Trend Charts</h4>
                    
                    {/* Tabs */}
                    <div className="flex flex-wrap gap-1">
                      {[
                        { id: 'bp', label: 'BP' },
                        { id: 'hr', label: 'Heart Rate' },
                        { id: 'weight', label: 'Weight' },
                        { id: 'sugar', label: 'Blood Sugar' },
                        { id: 'temp', label: 'Temp' }
                      ].map(tab => {
                        const hasPoints = vitalsData.some(d => {
                          if (tab.id === 'bp') return d.bpSystolic !== undefined || d.bpDiastolic !== undefined;
                          if (tab.id === 'hr') return d.heartRate !== undefined;
                          if (tab.id === 'weight') return d.weight !== undefined;
                          if (tab.id === 'sugar') return d.bloodSugar !== undefined;
                          if (tab.id === 'temp') return d.temperature !== undefined;
                          return false;
                        });
                        
                        if (!hasPoints) return null;

                        return (
                          <button
                            key={tab.id}
                            onClick={() => setSelectedVital(tab.id)}
                            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                              selectedVital === tab.id
                                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                          >
                            {tab.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={vitalsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:hidden" />
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" className="hidden dark:block" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                        <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" domain={['auto', 'auto']} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '1rem',
                            fontSize: '11px',
                            fontWeight: '600'
                          }}
                        />
                        {selectedVital === 'bp' && (
                          <>
                            <Line type="monotone" dataKey="bpSystolic" name="Systolic (mmHg)" stroke="#f43f5e" strokeWidth={3} activeDot={{ r: 6 }} connectNulls />
                            <Line type="monotone" dataKey="bpDiastolic" name="Diastolic (mmHg)" stroke="#fb7185" strokeWidth={2} activeDot={{ r: 4 }} connectNulls />
                          </>
                        )}
                        {selectedVital === 'hr' && (
                          <Line type="monotone" dataKey="heartRate" name="Heart Rate (bpm)" stroke="#3b82f6" strokeWidth={3} activeDot={{ r: 6 }} connectNulls />
                        )}
                        {selectedVital === 'weight' && (
                          <Line type="monotone" dataKey="weight" name="Weight (kg)" stroke="#10b981" strokeWidth={3} activeDot={{ r: 6 }} connectNulls />
                        )}
                        {selectedVital === 'sugar' && (
                          <Line type="monotone" dataKey="bloodSugar" name="Sugar (mg/dL)" stroke="#8b5cf6" strokeWidth={3} activeDot={{ r: 6 }} connectNulls />
                        )}
                        {selectedVital === 'temp' && (
                          <Line type="monotone" dataKey="temperature" name="Temp (°F)" stroke="#eab308" strokeWidth={3} activeDot={{ r: 6 }} connectNulls />
                        )}
                        <Legend wrapperStyle={{ fontSize: '10px', pt: 10 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                mounted && vitalsData.length === 0 && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm text-center text-xs text-slate-400 font-semibold leading-relaxed">
                    No vitals trends recorded. Add vitals to the Objective section of SOAP notes (e.g. "BP 120/80, HR 72, Weight 70kg") to display charts.
                  </div>
                )
              )}

              {/* Timeline list */}
              <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 pl-6 space-y-8 py-2">
                {timelineEvents.length > 0 ? (
                  timelineEvents.map((event) => {
                    const isExpanded = !!expandedEvents[event.id];
                    if (event.type === 'soap') {
                      const item = event.data;
                      return (
                        <div key={event.id} className="relative group">
                          {/* Timeline node circle */}
                          <span className="absolute -left-[31px] top-1.5 h-4 w-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-950 flex items-center justify-center"></span>
                          
                          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 hover-card space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                <Stethoscope className="h-3.5 w-3.5 text-emerald-500" />
                                <span>Clinical SOAP Note</span>
                              </div>
                              <span className="text-[10px] text-slate-500 font-medium">
                                {formatDate(item.createdAt)}
                              </span>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">Assessment & Symptoms</h4>
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getSeverityStyles(item.severity)}`}>
                                  {item.severity}
                                </span>
                              </div>
                              
                              <p className={`text-xs text-slate-500 dark:text-slate-400 leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
                                {item.assessment !== 'Not documented' ? item.assessment : 'No detailed diagnostic assessment logged.'}
                              </p>
                            </div>

                            {/* Collapsible Details */}
                            {isExpanded && (
                              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-3 animate-fadeIn text-xs">
                                {item.subjective && item.subjective !== 'Not documented' && (
                                  <div>
                                    <h5 className="font-bold text-slate-700 dark:text-slate-350">Subjective</h5>
                                    <p className="text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{item.subjective}</p>
                                  </div>
                                )}
                                {item.objective && item.objective !== 'Not documented' && (
                                  <div>
                                    <h5 className="font-bold text-slate-700 dark:text-slate-350">Objective</h5>
                                    <p className="text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{item.objective}</p>
                                  </div>
                                )}
                                {item.plan && item.plan !== 'Not documented' && (
                                  <div>
                                    <h5 className="font-bold text-slate-700 dark:text-slate-350">Plan</h5>
                                    <p className="text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{item.plan}</p>
                                  </div>
                                )}
                                {item.patientSummaryEnglish && (
                                  <div>
                                    <h5 className="font-bold text-slate-700 dark:text-slate-350">Patient Summary (English)</h5>
                                    <p className="text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{item.patientSummaryEnglish}</p>
                                  </div>
                                )}
                                {item.patientSummaryHindi && (
                                  <div>
                                    <h5 className="font-bold text-slate-700 dark:text-slate-350">Patient Summary (Hindi)</h5>
                                    <p className="text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{item.patientSummaryHindi}</p>
                                  </div>
                                )}
                                {item.flags && item.flags.length > 0 && (
                                  <div>
                                    <h5 className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                                      <AlertTriangle className="h-3.5 w-3.5" /> Clinical Red Flags
                                    </h5>
                                    <ul className="list-disc pl-4 mt-0.5 space-y-0.5 text-slate-500 dark:text-slate-400">
                                      {item.flags.map((f, fIdx) => <li key={fIdx}>{f}</li>)}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            )}

                            {item.medications && item.medications.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {item.medications.map((m, mIdx) => (
                                  <span key={mIdx} className="text-[9px] font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-lg text-slate-600 dark:text-slate-300">
                                    {m}
                                  </span>
                                ))}
                              </div>
                            )}

                            <div className="flex justify-between items-center pt-2 border-t border-slate-50 dark:border-slate-800/40">
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => router.push(`/record?noteId=${item.id}`)}
                                  className="text-xs font-semibold text-emerald-500 hover:underline flex items-center gap-0.5"
                                >
                                  <span>Open Details</span>
                                  <ChevronRight className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => toggleEventExpand(item.id)}
                                  className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center gap-0.5"
                                >
                                  {isExpanded ? (
                                    <>
                                      <span>Collapse</span>
                                      <ChevronUp className="h-3.5 w-3.5" />
                                    </>
                                  ) : (
                                    <>
                                      <span>Quick Expand</span>
                                      <ChevronDown className="h-3.5 w-3.5" />
                                    </>
                                  )}
                                </button>
                              </div>
                              
                              {item.icdCode && (
                                <span className="text-[9px] font-bold text-slate-400">ICD-10: {item.icdCode}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    } else {
                      const item = event.data;
                      return (
                        <div key={event.id} className="relative group">
                          {/* Timeline node circle */}
                          <span className="absolute -left-[31px] top-1.5 h-4 w-4 rounded-full bg-blue-500 border-2 border-white dark:border-slate-950 flex items-center justify-center"></span>
                          
                          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 hover-card space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                <Pill className="h-3.5 w-3.5 text-blue-500" />
                                <span>Prescription</span>
                              </div>
                              <span className="text-[10px] text-slate-500 font-medium">
                                {formatDate(item.createdAt)}
                              </span>
                            </div>

                            <div className="space-y-2">
                              {item.diagnosis && (
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-slate-400 font-bold uppercase">Diagnosis:</span>
                                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.diagnosis}</span>
                                </div>
                              )}

                              {/* At-a-glance medicines list (Directly visible, fulfills the 2-second scan rule) */}
                              <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-4 border border-slate-100 dark:border-slate-850 space-y-1">
                                <span className="text-[10px] text-slate-400 font-bold uppercase">Prescribed Medicines</span>
                                {item.medicines && item.medicines.length > 0 ? (
                                  <ul className="space-y-1.5 mt-1.5 text-xs font-semibold text-slate-700 dark:text-slate-355">
                                    {item.medicines.map((m, mIdx) => (
                                      <li key={mIdx} className="flex justify-between border-b border-slate-100 dark:border-slate-800/60 pb-1 last:border-0 last:pb-0">
                                        <span>{m.name} {m.dose ? `(${m.dose})` : ''}</span>
                                        <span className="text-slate-400 text-[10px]">{m.frequency} {m.duration ? `• ${m.duration}` : ''}</span>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-xs text-slate-400">No medicines prescribed</p>
                                )}
                              </div>
                            </div>

                            {/* Collapsible Details */}
                            {isExpanded && (
                              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-3 animate-fadeIn text-xs">
                                {item.specialInstructions && (
                                  <div>
                                    <h5 className="font-bold text-slate-700 dark:text-slate-300">Special Instructions</h5>
                                    <p className="text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{item.specialInstructions}</p>
                                  </div>
                                )}
                                {item.followUpDate && (
                                  <div>
                                    <h5 className="font-bold text-slate-700 dark:text-slate-300">Follow Up Date</h5>
                                    <p className="text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{new Date(item.followUpDate).toLocaleDateString()}</p>
                                  </div>
                                )}
                                {item.voiceInputText && (
                                  <div>
                                    <h5 className="font-bold text-slate-700 dark:text-slate-300">Raw Dictation Transcription</h5>
                                    <p className="text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed italic">"{item.voiceInputText}"</p>
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="flex justify-between items-center pt-2 border-t border-slate-50 dark:border-slate-800/40">
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => router.push(`/prescription?prescriptionId=${item.id}`)}
                                  className="text-xs font-semibold text-blue-500 hover:underline flex items-center gap-0.5"
                                >
                                  <span>Print / View Rx</span>
                                  <ChevronRight className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => toggleEventExpand(item.id)}
                                  className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center gap-0.5"
                                >
                                  {isExpanded ? (
                                    <>
                                      <span>Collapse</span>
                                      <ChevronUp className="h-3.5 w-3.5" />
                                    </>
                                  ) : (
                                    <>
                                      <span>Quick Expand</span>
                                      <ChevronDown className="h-3.5 w-3.5" />
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  })
                ) : (
                  <div className="text-sm text-slate-400 py-4">
                    No medical records linked to this patient.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center text-slate-400">
              <UserPlus className="h-10 w-10 mx-auto stroke-[1.2] mb-3 text-slate-400" />
              <p className="font-semibold text-sm">Select Patient File</p>
              <p className="text-xs mt-1">Tap a SOAP card on the left panel to review patient chronological timelines.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function HistoryPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm font-semibold text-slate-500">Loading history records...</p>
        </div>
      </div>
    }>
      <HistoryContent />
    </Suspense>
  );
}

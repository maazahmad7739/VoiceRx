'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../utils/api';
import { formatDate, getSeverityStyles } from '../../utils/formatters';
import { Activity, Plus, Search, Calendar, FileText, UserPlus, Users, Sparkles, CheckCircle2 } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    patientsSeenTodayCount: 0,
    weeklySoapNotesCount: 0,
    recentNotes: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [patients, setPatients] = useState([]);
  const [searchingPatients, setSearchingPatients] = useState(false);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const data = await api.get('/soap/stats/dashboard');
        setStats(data);
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
        setError('Could not retrieve clinical dashboard metrics.');
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (!query) {
      setPatients([]);
      return;
    }
    
    setSearchingPatients(true);
    try {
      const data = await api.get(`/patients?search=${encodeURIComponent(query)}`);
      setPatients(data);
    } catch (err) {
      console.error(err);
    } finally {
      setSearchingPatients(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Clinical Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 font-semibold">
            Voice-to-clinical scribe console and patient records repository
          </p>
        </div>

        <Link
          href="/record"
          className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-xl transition-all shadow-md shadow-blue-500/20"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>New Consultation</span>
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-rose-50/50 border border-rose-100 text-rose-700 dark:text-rose-450 rounded-xl text-sm font-semibold shadow-sm">
          {error}
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Today's Patients */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm flex items-center justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Patients Seen Today</span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-slate-800 dark:text-slate-100">{loading ? '...' : stats.patientsSeenTodayCount}</span>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-405 flex items-center gap-0.5">
                <CheckCircle2 className="h-3.5 w-3.5" /> Today
              </span>
            </div>
          </div>
          <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-inner">
            <Users className="h-5.5 w-5.5" />
          </div>
        </div>

        {/* Weekly SOAP Notes */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm flex items-center justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">SOAP Notes This Week</span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-slate-800 dark:text-slate-100">{loading ? '...' : stats.weeklySoapNotesCount}</span>
              <span className="text-xs font-bold text-blue-650 dark:text-blue-405 flex items-center gap-0.5">
                <Sparkles className="h-3.5 w-3.5" /> 7 Days
              </span>
            </div>
          </div>
          <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-inner">
            <FileText className="h-5.5 w-5.5" />
          </div>
        </div>
      </div>

      {/* Main Section Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Recent Notes */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight pl-1">Recent Consultations</h2>
          
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-white dark:bg-slate-900 rounded-2xl animate-pulse shadow-sm" />
              ))}
            </div>
          ) : stats.recentNotes.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center text-slate-400 shadow-sm">
              <Activity className="h-12 w-12 mx-auto stroke-[1.5] text-slate-300 mb-4 animate-pulse" />
              <p className="font-bold text-sm text-slate-500">No consultations recorded yet</p>
              <p className="text-xs mt-1">Tap the button above to scribe your first case.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {stats.recentNotes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => router.push(`/record?noteId=${note.id}`)}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-800 dark:text-slate-100">{note.patient?.name}</span>
                      <span className="text-xs text-slate-400 font-semibold">{note.patient?.age}y ({note.patient?.gender})</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getSeverityStyles(note.severity)}`}>
                        {note.severity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 max-w-lg leading-relaxed font-semibold">
                      {note.transcript}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-right self-end sm:self-center shrink-0">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 font-bold">
                        <Calendar className="h-3 w-3" /> {formatDate(note.createdAt)}
                      </span>
                      {note.icdCode && (
                        <span className="text-[9px] font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded-md mt-1.5 uppercase tracking-wide self-end">
                          ICD-10: {note.icdCode}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Quick Patient Lookup & Actions */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm space-y-6 hover:shadow-md transition-all duration-300">
            <h3 className="font-bold text-base text-slate-850 dark:text-slate-100 tracking-tight">Patient Registry</h3>
            
            {/* Search Input */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Search className="h-4.5 w-4.5" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearch}
                placeholder="Search patient by name / phone..."
                className="w-full bg-slate-50 dark:bg-slate-950 border-none rounded-xl pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:bg-white transition-all shadow-inner"
              />
            </div>

            {/* Search Results */}
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {searchingPatients ? (
                <div className="text-xs text-center text-slate-400 py-4 animate-pulse">Searching registry...</div>
              ) : searchQuery && patients.length === 0 ? (
                <div className="text-xs text-center text-slate-400 py-4">No patient matched "{searchQuery}"</div>
              ) : patients.length > 0 ? (
                patients.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => router.push(`/history?patientId=${p.id}`)}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/20 cursor-pointer transition-all shadow-sm"
                  >
                    <div className="flex flex-col">
                      <span className="font-bold text-sm">{p.name}</span>
                      <span className="text-[10px] text-slate-400 font-semibold">{p.phone}</span>
                    </div>
                    <span className="text-[10px] bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-md font-bold">
                      {p.gender}, {p.age}y
                    </span>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-slate-400 text-center">
                  <UserPlus className="h-8 w-8 mb-2 stroke-[1.2]" />
                  <p className="text-xs font-semibold">Search for patients to view timelines and history records.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

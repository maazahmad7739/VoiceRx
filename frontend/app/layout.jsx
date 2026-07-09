'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import useAppStore from '../store/useAppStore';
import '../app/globals.css';
import { Activity, LogOut, FileText, Clipboard, Home, Moon, Sun, ClipboardList, Stethoscope } from 'lucide-react';
import Link from 'next/link';

const SEO_MAP = {
  '/dashboard': {
    title: 'Clinical Dashboard | VoiceRx - AI Medical Scribe',
    description: 'Overview of patients seen, weekly clinical SOAP note statistics, and recent consultation records.'
  },
  '/record': {
    title: 'Clinical Scribe & SOAP Note Generator | VoiceRx',
    description: 'Dictate doctor-patient consultation audio and generate structured medical SOAP notes instantly using Gemini AI.'
  },
  '/prescription': {
    title: 'AI Voice Prescriptions & Medication Parser | VoiceRx',
    description: 'Speak prescriptions in English or Hinglish to generate structured Rx slips, check drug-drug interactions, and save patient records.'
  },
  '/second-opinion': {
    title: 'Clinical Second Opinion & Medical Guidelines Search | VoiceRx',
    description: 'Analyze complex clinical cases, search PubMed and WHO guidelines, and get patient-specific clinical recommendations.'
  },
  '/history': {
    title: 'Patient Timelines & Consultation History | VoiceRx',
    description: 'Lookup patient clinical history, track longitudinal timelines, and view previous SOAP notes and prescriptions.'
  },
  '/login': {
    title: 'Doctor Portal Sign-In | VoiceRx - AI Medical Scribe',
    description: 'Log in to your secure VoiceRx account to transcribe patient consultations and manage clinical SOAP notes.'
  },
  '/signup': {
    title: 'Register Doctor Account | VoiceRx - AI Clinical Assistant',
    description: 'Create a free, secure account on VoiceRx to streamline clinical documentation and voice prescriptions.'
  }
};

const getSEOData = (pathname) => {
  const matched = Object.keys(SEO_MAP).find(path => pathname === path || pathname.startsWith(path + '/'));
  return SEO_MAP[matched] || {
    title: 'VoiceRx - AI Clinical Voice Assistant & Medical Scribe',
    description: 'AI medical scribe for Indian doctors. Transcribe consultations, format structured SOAP notes, and retrieve clinical guidelines.'
  };
};

export default function RootLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { token, doctor, logout, darkMode, toggleDarkMode, initializeTheme } = useAppStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    initializeTheme();
  }, [initializeTheme]);

  // Protect client side routes
  useEffect(() => {
    if (mounted) {
      const isAuthRoute = pathname.includes('/login') || pathname.includes('/signup');
      if (!token && !isAuthRoute) {
        router.push('/login');
      } else if (token && isAuthRoute) {
        router.push('/dashboard');
      }
    }
  }, [token, pathname, mounted, router]);

  const seo = getSEOData(pathname);
  const isPrivate = pathname !== '/login' && pathname !== '/signup';

  if (!mounted) {
    return (
      <html lang="en">
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>{seo.title}</title>
          <meta name="description" content={seo.description} />
          {isPrivate ? (
            <meta name="robots" content="noindex, nofollow" />
          ) : (
            <meta name="robots" content="index, follow" />
          )}
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        </head>
        <body className="bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
          <div className="flex h-screen w-screen items-center justify-center bg-slate-900 text-white">
            <div className="flex flex-col items-center gap-3">
              <Activity className="h-10 w-10 animate-pulse text-emerald-500" />
              <p className="text-sm font-medium tracking-wide">Initializing VoiceRx...</p>
            </div>
          </div>
        </body>
      </html>
    );
  }

  const isAuthPage = pathname.includes('/login') || pathname.includes('/signup');

  return (
    <html lang="en" className={darkMode ? 'dark' : ''}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
        
        {/* Robots Directives */}
        {isPrivate ? (
          <meta name="robots" content="noindex, nofollow" />
        ) : (
          <meta name="robots" content="index, follow" />
        )}
        
        {/* Open Graph Tags */}
        <meta property="og:title" content={seo.title} />
        <meta property="og:description" content={seo.description} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="VoiceRx" />
        <meta property="og:url" content={`https://voicerx.in${pathname}`} />
        
        {/* Twitter Cards */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seo.title} />
        <meta name="twitter:description" content={seo.description} />

        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />

        {/* Structured Schema Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              'name': 'VoiceRx',
              'url': 'https://voicerx.in',
              'description': 'AI clinical voice assistant and medical scribe for Indian doctors.',
              'applicationCategory': 'MedicalBusinessApplication',
              'operatingSystem': 'All'
            })
          }}
        />
      </head>
      <body className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300">
        {!isAuthPage && token ? (
          <div className="flex min-h-screen">
            {/* 1. Mac-style Left Sidebar (Fixed, w-64) */}
            <aside className="hidden md:flex flex-col w-64 fixed top-0 bottom-0 left-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-r border-slate-200/50 dark:border-slate-800/50 z-30 justify-between p-6 no-print">
              
              <div className="space-y-8">
                {/* Logo Area: VoiceRx in Cobalt Blue */}
                <Link href="/dashboard" className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-extrabold text-2xl tracking-tight pl-2">
                  <Activity className="h-6 w-6 stroke-[2.5]" />
                  <span>VoiceRx</span>
                </Link>

                {/* Navigation Menu stacked pills */}
                <nav className="flex flex-col gap-1.5">
                  
                  <Link 
                    href="/dashboard" 
                    className={`flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
                      pathname === '/dashboard' 
                        ? 'bg-blue-50/80 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-l-4 border-blue-600' 
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800'
                    }`}
                  >
                    <Home className="h-4.5 w-4.5" />
                    <span>Dashboard</span>
                  </Link>

                  <Link 
                    href="/record" 
                    className={`flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
                      pathname === '/record' 
                        ? 'bg-blue-50/80 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-l-4 border-blue-600' 
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800'
                    }`}
                  >
                    <Clipboard className="h-4.5 w-4.5" />
                    <span>Clinical Scribe</span>
                  </Link>

                  <Link 
                    href="/prescription" 
                    className={`flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
                      pathname === '/prescription' 
                        ? 'bg-blue-50/80 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-l-4 border-blue-600' 
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800'
                    }`}
                  >
                    <ClipboardList className="h-4.5 w-4.5" />
                    <span>Prescriptions</span>
                  </Link>

                  <Link 
                    href="/second-opinion" 
                    className={`flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
                      pathname?.startsWith('/second-opinion') 
                        ? 'bg-blue-50/80 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-l-4 border-blue-600' 
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800'
                    }`}
                  >
                    <Stethoscope className="h-4.5 w-4.5" />
                    <span>Second Opinion</span>
                  </Link>

                  <Link 
                    href="/history" 
                    className={`flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
                      pathname === '/history' 
                        ? 'bg-blue-50/80 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-l-4 border-blue-600' 
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800'
                    }`}
                  >
                    <FileText className="h-4.5 w-4.5" />
                    <span>Patient History</span>
                  </Link>

                </nav>
              </div>

              {/* Sidebar Bottom Profile Card */}
              <div className="border-t border-slate-200/60 dark:border-slate-800/80 pt-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                    {doctor?.name ? doctor.name[0].toUpperCase() : 'D'}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">Dr. {doctor?.name}</span>
                    <span className="text-[10px] text-slate-400 truncate">{doctor?.specialization || 'Clinical'}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    logout();
                    router.push('/login');
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 transition-colors shrink-0"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>

            </aside>

            {/* 2. Main Content Canvas */}
            <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
              
              {/* Header: Breadcrumbs & Time Info */}
              <header className="h-16 border-b border-slate-100 dark:border-slate-900/80 bg-white/40 dark:bg-slate-950/40 backdrop-blur-sm flex items-center justify-between px-4 md:px-8 no-print">
                
                {/* Breadcrumbs */}
                <div className="text-xs text-slate-400 font-semibold flex items-center gap-1 overflow-hidden truncate max-w-[120px] sm:max-w-none">
                  <span>Home</span>
                  <span>/</span>
                  <span className="text-slate-600 dark:text-slate-300 capitalize truncate">
                    {pathname === '/dashboard' ? 'Overview' : pathname?.replace('/', '')?.replace('-', ' ')}
                  </span>
                </div>

                {/* Right widgets */}
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest hidden lg:inline">
                    {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </span>

                  {/* Dark Mode toggle */}
                  <button
                    onClick={toggleDarkMode}
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </button>

                  {/* Mobile-only logout */}
                  <button
                    onClick={() => {
                      logout();
                      router.push('/login');
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 transition-colors md:hidden"
                    title="Logout"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>

                  <Link
                    href="/record"
                    className="hidden sm:inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1.5 px-3 rounded-lg transition-all shadow-md shadow-blue-500/20"
                  >
                    <span>New Consultation</span>
                  </Link>
                </div>

              </header>

              {/* Main application page content scroll area */}
              <main className="flex-1 bg-[#F8FAFC] dark:bg-slate-950 px-4 md:px-8 py-6 md:py-8 pb-24 md:pb-8">
                {children}
              </main>

            </div>

            {/* Mobile Bottom Navigation footer */}
            <nav className="md:hidden fixed bottom-0 left-0 z-40 w-full h-16 border-t border-slate-200/60 dark:border-slate-800/85 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md flex items-center justify-around px-2 no-print">
              <Link href="/dashboard" className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 text-[9px] font-bold transition-colors ${pathname === '/dashboard' ? 'text-blue-600' : 'text-slate-400'}`}>
                <Home className="h-4.5 w-4.5" />
                <span>Home</span>
              </Link>
              <Link href="/record" className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 text-[9px] font-bold transition-colors ${pathname === '/record' ? 'text-blue-600' : 'text-slate-400'}`}>
                <Clipboard className="h-4.5 w-4.5" />
                <span>Scribe</span>
              </Link>
              <Link href="/prescription" className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 text-[9px] font-bold transition-colors ${pathname === '/prescription' ? 'text-blue-600' : 'text-slate-400'}`}>
                <ClipboardList className="h-4.5 w-4.5" />
                <span>Rx Slip</span>
              </Link>
              <Link href="/second-opinion" className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 text-[9px] font-bold transition-colors ${pathname?.startsWith('/second-opinion') ? 'text-blue-600' : 'text-slate-400'}`}>
                <Stethoscope className="h-4.5 w-4.5" />
                <span>Opinion</span>
              </Link>
              <Link href="/history" className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 text-[9px] font-bold transition-colors ${pathname === '/history' ? 'text-blue-600' : 'text-slate-400'}`}>
                <FileText className="h-4.5 w-4.5" />
                <span>History</span>
              </Link>
            </nav>
          </div>
        ) : (
          <main className="flex-1 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
            {children}
          </main>
        )}
      </body>
    </html>
  );
}

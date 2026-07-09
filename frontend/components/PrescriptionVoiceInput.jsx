'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';
import { Mic, MicOff, Globe, Sparkles, Loader2, AlertCircle } from 'lucide-react';

export default function PrescriptionVoiceInput({ onParsedPrescription }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [speechLanguage, setSpeechLanguage] = useState('hi-IN'); // Hinglish by default
  const [micError, setMicError] = useState('');
  const [parsingLoading, setParsingLoading] = useState(false);
  
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
    if (!SpeechRecognition) {
      setMicError('Web Speech API is not supported in this browser. Please use Chrome or fill details in the table below.');
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = speechLanguage;

    rec.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        }
      }
      if (finalTranscript) {
        setTranscript((prev) => prev + finalTranscript);
      }
    };

    rec.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setMicError('Microphone access denied. Please grant permissions.');
        setIsListening(false);
      }
    };

    rec.onend = () => {
      if (isListening) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.warn('Speech restarted.');
        }
      }
    };

    recognitionRef.current = rec;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [speechLanguage, isListening]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setMicError('');
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Failed to start recognition:', err);
      }
    }
  };

  const parsePrescriptionText = async () => {
    if (!transcript.trim()) return;
    setParsingLoading(true);
    setMicError('');
    try {
      const result = await api.post('/prescriptions/parse', { voice_text: transcript });
      onParsedPrescription(result, transcript);
    } catch (err) {
      setMicError(err.message || 'Failed to parse voice prescription. Try editing or re-recording.');
    } finally {
      setParsingLoading(false);
    }
  };

  const clearTranscript = () => {
    setTranscript('');
    setMicError('');
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <h4 className="font-bold text-sm">Mode 1: Dictate Prescription</h4>
          <p className="text-[11px] text-slate-400">Speak medicine names, dosages, durations, and instructions in Hinglish/English.</p>
        </div>
        
        {/* Language selector */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1 text-xs">
          <Globe className="h-3.5 w-3.5 text-slate-400" />
          <select
            value={speechLanguage}
            onChange={(e) => {
              setSpeechLanguage(e.target.value);
              if (isListening) {
                recognitionRef.current.stop();
                setIsListening(false);
              }
            }}
            className="bg-transparent font-semibold border-none focus:outline-none cursor-pointer"
          >
            <option value="hi-IN">Hinglish / Hindi (hi-IN)</option>
            <option value="en-IN">Indian English (en-IN)</option>
            <option value="en-US">US English (en-US)</option>
          </select>
        </div>
      </div>

      {micError && (
        <div className="flex items-start gap-2.5 p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-xs">
          <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
          <span>{micError}</span>
        </div>
      )}

      <div className="flex flex-col items-center justify-center py-6 gap-4">
        <button
          type="button"
          onClick={toggleListening}
          className={`h-16 w-16 rounded-full flex items-center justify-center border transition-all ${
            isListening
              ? 'bg-red-500 text-white border-red-600 pulse-glow scale-105'
              : 'bg-blue-600 text-white border-blue-700 hover:scale-105 shadow-md shadow-blue-500/20'
          }`}
        >
          {isListening ? <MicOff className="h-7 w-7" /> : <Mic className="h-7 w-7" />}
        </button>
        
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">
          {isListening ? 'Listening (Speak medications)...' : 'Click to start recording'}
        </span>
      </div>

      {transcript && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Transcribed Spoken Text</span>
            <button
              onClick={clearTranscript}
              className="text-[10px] font-semibold text-rose-500 hover:underline"
              type="button"
            >
              Clear
            </button>
          </div>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 min-h-[100px] text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all leading-relaxed"
          />

          <button
            type="button"
            onClick={parsePrescriptionText}
            disabled={parsingLoading || isListening}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold py-2.5 rounded-xl transition-all text-sm disabled:opacity-50"
          >
            {parsingLoading ? (
              <>
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
                <span>AI Parsing Prescription...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4.5 w-4.5 fill-current" />
                <span>Convert to Table & Fill Checklist</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

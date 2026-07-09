'use client';

import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Globe } from 'lucide-react';

export default function Recorder({ onTranscriptChange }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [speechLanguage, setSpeechLanguage] = useState('hi-IN'); // Default to Hinglish
  const [errorMsg, setErrorMsg] = useState('');
  
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
    // Check if Web Speech API is supported
    const SpeechRecognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SpeechRecognition) {
      setErrorMsg('Web Speech API is not supported in this browser. Please use Chrome or upload pre-recorded audio files instead.');
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
        setTranscript((prev) => {
          const updated = prev + finalTranscript;
          onTranscriptChange(updated);
          return updated;
        });
      }
    };

    rec.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setErrorMsg('Microphone access denied. Please grant permissions.');
        setIsListening(false);
      }
    };

    rec.onend = () => {
      // If user didn't stop it explicitly, restart it to keep listening (continuous mode)
      if (isListening) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.warn('Speech restarted automatically.');
        }
      }
    };

    recognitionRef.current = rec;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [speechLanguage, isListening, onTranscriptChange]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setErrorMsg('');
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Failed to start recognition:', err);
      }
    }
  };

  const clearTranscript = () => {
    setTranscript('');
    onTranscriptChange('');
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 space-y-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Volume2 className="h-5 w-5 text-blue-600" />
          <h4 className="font-bold text-sm">Mode 1: Live Consultation Dictation</h4>
        </div>
        
        {/* Language select */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs shadow-sm">
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

      {errorMsg ? (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-medium">
          {errorMsg}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-6 gap-4">
          <button
            type="button"
            onClick={toggleListening}
            className={`h-16 w-16 rounded-full flex items-center justify-center border transition-all ${
              isListening
                ? 'bg-red-500 text-white border-red-650 pulse-glow scale-105 shadow-lg shadow-red-500/20'
                : 'bg-blue-600 text-white border-blue-700 hover:scale-105 shadow-md shadow-blue-500/20 hover:bg-blue-700'
            }`}
          >
            {isListening ? <MicOff className="h-7 w-7" /> : <Mic className="h-7 w-7" />}
          </button>
          
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">
            {isListening ? 'Listening (Speak now)...' : 'Click to start live recording'}
          </span>
        </div>
      )}

      {transcript && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Live Dictation Stream</span>
            <button
              onClick={clearTranscript}
              className="text-[10px] font-semibold text-rose-500 hover:underline"
              type="button"
            >
              Clear
            </button>
          </div>
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-h-48 overflow-y-auto text-sm leading-relaxed whitespace-pre-wrap">
            {transcript}
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { QrCode, Loader2 } from 'lucide-react';

export default function QRCodeGenerator({ patient, date, medicines, doctor }) {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!patient || !medicines || !doctor) return;

    setLoading(true);
    setError(false);

    // Format medicines list into readable text string
    const medsText = medicines
      .map((med, idx) => `${idx + 1}. ${med.name} ${med.dose} (${med.frequency} for ${med.duration})`)
      .join('\n');

    const qrPayload = `VoiceRx Digital Prescription
---------------------------
Date: ${new Date(date || Date.now()).toLocaleDateString('en-IN')}
Doctor: Dr. ${doctor.name}
Clinic: ${doctor.clinic_name || doctor.clinicName || 'VoiceRx Clinic'}

Patient Name: ${patient.name}
Age/Gender: ${patient.age}y / ${patient.gender}

Rx Medications:
${medsText}
---------------------------
This digital prescription is valid for 30 days.`;

    QRCode.toDataURL(
      qrPayload,
      {
        width: 160,
        margin: 2,
        color: {
          dark: '#0f172a', // deep slate
          light: '#ffffff', // white
        },
      },
      (err, url) => {
        setLoading(false);
        if (err) {
          console.error('Failed to generate QR Code:', err);
          setError(true);
        } else {
          setQrCodeUrl(url);
        }
      }
    );
  }, [patient, date, medicines, doctor]);

  if (error) {
    return (
      <div className="text-xs text-rose-500 flex items-center gap-1">
        <QrCode className="h-4 w-4" />
        <span>Failed to generate scan code.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl text-center max-w-[200px]">
      {loading ? (
        <div className="h-40 w-40 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
        </div>
      ) : (
        qrCodeUrl && (
          <>
            <img src={qrCodeUrl} alt="Prescription QR Code" className="h-36 w-36 rounded-lg shadow-sm" />
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2">
              Scan for Digital Copy
            </span>
          </>
        )
      )}
    </div>
  );
}

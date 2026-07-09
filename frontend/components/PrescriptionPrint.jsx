'use client';

import QRCodeGenerator from './QRCodeGenerator';
import { formatFollowUpDate } from '../utils/formatters';

export default function PrescriptionPrint({ doctor, patient, medicines, diagnosis, specialInstructions, followUpDate, createdAt, signature }) {
  if (!doctor || !patient || !medicines) return null;

  const dateStr = new Date(createdAt || Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div 
      id="printable-prescription" 
      className="hidden print:block print:p-8 bg-white text-black font-serif text-sm max-w-[800px] mx-auto border border-slate-300 p-8 rounded-lg shadow-sm"
      style={{ pageBreakAfter: 'always' }}
    >
      {/* 1. Clinic & Doctor Header */}
      <div className="flex justify-between items-start border-b-2 border-black pb-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold uppercase tracking-tight text-slate-900">Dr. {doctor.name}</h2>
          <p className="text-xs font-semibold text-slate-600">{doctor.specialization || 'Clinical Practitioner'}</p>
          <p className="text-[11px] text-slate-500">Reg No: SMC-{doctor.phone?.slice(-5) || '12345'}</p>
        </div>
        <div className="text-right space-y-1">
          <h3 className="text-sm font-bold">{doctor.clinic_name || doctor.clinicName || 'VoiceRx Health Clinic'}</h3>
          <p className="text-[10px] text-slate-500">123, Health Avenue, Medical Zone, India</p>
          <p className="text-[10px] text-slate-500">Ph: {doctor.phone || '9876543210'}</p>
          <p className="text-[10px] text-slate-500 font-mono">Date: {dateStr}</p>
        </div>
      </div>

      {/* 2. Patient Demographics */}
      <div className="border-b border-black py-3 text-xs space-y-1.5">
        <div className="grid grid-cols-3 gap-4">
          <div><strong>Patient Name:</strong> {patient.name}</div>
          <div><strong>Age / Gender:</strong> {patient.age}y / {patient.gender}</div>
          <div className="text-right"><strong>Phone:</strong> {patient.phone}</div>
        </div>
        {diagnosis && (
          <div className="border-t border-dotted border-slate-350 pt-1.5">
            <strong>Diagnosis / Indication:</strong> <span className="font-semibold">{diagnosis}</span>
          </div>
        )}
      </div>

      {/* 3. RX Symbol & Medicines list */}
      <div className="py-6 min-h-[300px] flex gap-8">
        
        {/* Prescription details */}
        <div className="flex-1 space-y-4">
          <div className="text-lg font-bold italic tracking-wider font-sans select-none text-slate-700">Rₓ</div>
          
          <ol className="space-y-4 list-decimal pl-5">
            {medicines.map((med, idx) => (
              <li key={idx} className="pl-2 border-b border-dotted border-slate-300 pb-2">
                <div className="flex justify-between font-bold">
                  <span>{med.name}</span>
                  <span className="font-mono text-xs">{med.dose || ''}</span>
                </div>
                <div className="text-xs text-slate-600 italic mt-1 flex gap-4">
                  <span>Frequency: {med.frequency}</span>
                  <span>Duration: {med.duration}</span>
                  <span>Instructions: {med.instructions}</span>
                </div>
              </li>
            ))}
          </ol>

          {specialInstructions && (
            <div className="mt-8 pt-4 border-t border-slate-200">
              <strong className="text-xs uppercase text-slate-500">Special Instructions:</strong>
              <p className="text-xs mt-1 italic text-slate-700 leading-relaxed">{specialInstructions}</p>
            </div>
          )}

          {followUpDate && (
            <div className="mt-4 text-xs font-semibold text-slate-700">
              Follow up: {formatFollowUpDate(followUpDate)}
            </div>
          )}
        </div>

        {/* Sidebar QR Code for scan */}
        <div className="w-40 flex flex-col items-center border-l border-slate-200 pl-6 select-none shrink-0 self-start">
          <QRCodeGenerator 
            patient={patient} 
            date={createdAt || Date.now()} 
            medicines={medicines} 
            doctor={doctor} 
          />
        </div>
      </div>

      {/* 4. Footer */}
      <div className="border-t-2 border-black pt-8 mt-12 flex justify-between items-end text-[10px] text-slate-400">
        <div>
          <p>This prescription is valid for 30 days from issue.</p>
          <p className="mt-0.5">Powered by VoiceRx Scribe Assistant</p>
        </div>
        
        <div className="flex gap-8 items-center">
          <div className="text-center">
            <div className="h-10 w-24 border border-dashed border-slate-300 rounded mb-1 flex items-center justify-center text-[8px] text-slate-300 uppercase">Stamp Area</div>
            <span>Clinic Seal</span>
          </div>

          <div className="text-center pr-2 relative">
            {signature && (
              <img 
                src={signature} 
                alt="Signature" 
                className="absolute bottom-6 left-1/2 -translate-x-1/2 h-8 object-contain" 
              />
            )}
            <div className="h-10 w-28 border-b border-black mb-1"></div>
            <strong>Dr. {doctor.name}</strong>
            <p>(Authorized Signature)</p>
          </div>
        </div>
      </div>
    </div>
  );
}

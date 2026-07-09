'use client';

import { useState } from 'react';
import jsPDF from 'jspdf';
import QRCodeGenerator from './QRCodeGenerator';
import PrescriptionPrint from './PrescriptionPrint';
import { 
  Printer, Download, Copy, Check, MessageSquareShare, FileText, Calendar, CheckCircle2, User, Sparkles 
} from 'lucide-react';
import { formatFollowUpDate } from '../utils/formatters';

export default function PrescriptionPreview({ doctor, patient, medicines, diagnosis, specialInstructions, followUpDate, createdAt }) {
  const [copied, setCopied] = useState(false);

  if (!doctor || !patient || !medicines) return null;

  const dateStr = new Date(createdAt || Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    let text = `PRESCRIPTION - Dr. ${doctor.name}\n`;
    text += `Clinic: ${doctor.clinic_name || doctor.clinicName || 'VoiceRx Clinic'}\n`;
    text += `Date: ${dateStr}\n`;
    text += `------------------------------------\n`;
    text += `Patient: ${patient.name} (${patient.age}y, ${patient.gender})\n`;
    if (diagnosis) {
      text += `Diagnosis: ${diagnosis}\n`;
    }
    text += `------------------------------------\n`;
    medicines.forEach((med, idx) => {
      text += `${idx + 1}. ${med.name} - ${med.dose || 'N/A'}\n`;
      text += `   Take: ${med.frequency} for ${med.duration} (${med.instructions})\n`;
    });
    if (specialInstructions) {
      text += `Special Instructions: ${specialInstructions}\n`;
    }
    if (followUpDate) {
      text += `Follow up: ${formatFollowUpDate(followUpDate)}\n`;
    }

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleWhatsApp = () => {
    let msg = `*Medicines from Dr. ${doctor.name}* — ${dateStr}\n\n`;
    medicines.forEach((med, idx) => {
      msg += `*${idx + 1}. ${med.name}* - ${med.dose || ''} - ${med.frequency} - ${med.duration}\n`;
      msg += `   Take: _${med.instructions}_\n\n`;
    });

    if (followUpDate) {
      msg += `*Follow up:* ${formatFollowUpDate(followUpDate)}\n\n`;
    }

    msg += `*${doctor.clinic_name || doctor.clinicName || 'Clinic'}* | Ph: ${doctor.phone || '9876543210'}`;

    let phoneNum = '';
    if (patient.phone) {
      const cleanPhone = patient.phone.replace(/\D/g, '');
      if (cleanPhone.length === 10) {
        phoneNum = `91${cleanPhone}`;
      } else {
        phoneNum = cleanPhone;
      }
    }

    window.open(`https://wa.me/${phoneNum}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleDownloadPdf = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    
    // Header Style
    doc.setFillColor(15, 118, 110); // Teal header background
    doc.rect(0, 0, 210, 30, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('CLINICAL PRESCRIPTION', 15, 20);

    // Doctor & Clinic Info
    doc.setTextColor(15, 23, 42); // slate-900
    doc.setFontSize(13);
    doc.text(`Dr. ${doctor.name}`, 15, 45);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text(`${doctor.specialization || 'Clinical Practitioner'}`, 15, 51);
    doc.text(`Reg No: SMC-${doctor.phone?.slice(-5) || '12345'}`, 15, 57);

    doc.text(`${doctor.clinic_name || doctor.clinicName || 'VoiceRx Health Clinic'}`, 130, 45);
    doc.text(`Ph: ${doctor.phone || '9876543210'}`, 130, 51);
    doc.text(`Date: ${dateStr}`, 130, 57);

    // Separator line
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.line(15, 65, 195, 65);

    // Patient Details Card
    const hasDiagnosis = !!diagnosis;
    const cardHeight = hasDiagnosis ? 27 : 20;
    doc.setFillColor(248, 250, 252); // slate-50
    doc.rect(15, 70, 180, cardHeight, 'F');
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.rect(15, 70, 180, cardHeight, 'S');

    doc.setTextColor(15, 23, 42);
    doc.setFont('Helvetica', 'bold');
    doc.text(`Patient: ${patient.name}`, 20, 77);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Age/Gender: ${patient.age}y / ${patient.gender}`, 20, 83);
    doc.text(`Phone: ${patient.phone}`, 135, 80);

    if (hasDiagnosis) {
      doc.setFont('Helvetica', 'bold');
      doc.text(`Dx / Indication:`, 20, 91);
      doc.setFont('Helvetica', 'normal');
      doc.text(`${diagnosis}`, 48, 91);
    }

    // RX
    const rxY = hasDiagnosis ? 112 : 105;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(13, 148, 136); // Teal
    doc.text('Rx', 15, rxY);

    // Medications list
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    
    let y = rxY + 10;
    medicines.forEach((med, idx) => {
      // Check for page overflow
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      doc.setFont('Helvetica', 'bold');
      doc.text(`${idx + 1}. ${med.name}`, 18, y);
      
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`${med.dose || ''}`, 130, y);
      
      y += 6;
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`Take: ${med.frequency} for ${med.duration} | Instructions: ${med.instructions}`, 20, y);
      
      doc.setDrawColor(241, 245, 249);
      doc.line(15, y + 4, 195, y + 4);
      
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);
      y += 12;
    });

    if (specialInstructions) {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Special Instructions:', 15, y + 2);
      doc.setFont('Helvetica', 'normal');
      doc.text(specialInstructions, 15, y + 8);
      y += 18;
    }

    if (followUpDate) {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFont('Helvetica', 'bold');
      doc.text(`Follow up Date: ${formatFollowUpDate(followUpDate)}`, 15, y + 2);
    }

    // Footer signature line
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text('This prescription is valid for 30 days.', 15, 275);
    doc.setTextColor(71, 85, 105);
    doc.text(`Dr. ${doctor.name} (Authorized Signature)`, 120, 275);
    doc.line(120, 270, 190, 270);

    doc.save(`Prescription_${patient.name.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="space-y-6 print:p-0">
      
      {/* 1. Review action controls bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5 no-print">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Prescription Active Preview</span>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold py-2 px-3.5 rounded-xl transition-all text-xs"
            type="button"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold py-2 px-3.5 rounded-xl transition-all text-xs"
            type="button"
          >
            <Download className="h-4 w-4" />
            <span>Download PDF</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold py-2 px-3.5 rounded-xl transition-all text-xs"
            type="button"
          >
            <Printer className="h-4 w-4" />
            <span>Print Slip</span>
          </button>

          <button
            onClick={handleWhatsApp}
            className="inline-flex items-center gap-1.5 bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold py-2 px-3.5 rounded-xl transition-all text-xs"
            type="button"
          >
            <MessageSquareShare className="h-4 w-4 fill-current" />
            <span>Send WhatsApp</span>
          </button>
        </div>
      </div>

      {/* 2. On-screen graphical preview card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-md hover-card relative overflow-hidden no-print">
        
        {/* Prescription header band */}
        <div className="border-b border-slate-100 dark:border-slate-800 pb-5 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-extrabold tracking-widest text-emerald-500">Authorized prescription</span>
            <h3 className="text-xl font-extrabold tracking-tight">Dr. {doctor.name}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{doctor.specialization || 'Clinical Practitioner'}</p>
          </div>
          <div className="text-right text-xs text-slate-400 space-y-1">
            <p className="font-bold text-slate-800 dark:text-slate-200">{doctor.clinic_name || doctor.clinicName || 'Clinic'}</p>
            <p>Ph: {doctor.phone}</p>
            <p>Date: {dateStr}</p>
          </div>
        </div>

        {/* Patient card details */}
        <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-center gap-2 text-xs">
              <User className="h-4 w-4 text-emerald-500" />
              <span><strong>Patient:</strong> {patient.name}</span>
            </div>
            <div className="text-xs">
              <strong>Age/Gender:</strong> {patient.age}y / {patient.gender}
            </div>
            <div className="text-xs sm:text-right">
              <strong>Phone:</strong> {patient.phone}
            </div>
          </div>
          {diagnosis && (
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <strong>Diagnosis / Indication:</strong> <span className="text-slate-600 dark:text-slate-300 font-semibold">{diagnosis}</span>
            </div>
          )}
        </div>

        {/* Medicines numbered list */}
        <div className="space-y-5 py-2">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
            <Sparkles className="h-4 w-4 text-emerald-500" />
            <h4 className="font-bold text-sm tracking-tight uppercase text-slate-400">Rx Medicines Checklist</h4>
          </div>

          <div className="space-y-3">
            {medicines.map((med, idx) => (
              <div 
                key={idx}
                className="p-4 bg-slate-50/50 dark:bg-slate-955/20 border border-slate-150 dark:border-slate-800/60 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
              >
                <div className="space-y-1.5 w-full">
                  <div className="flex items-center gap-2">
                    <span className="h-5 w-5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center font-bold text-xs shrink-0">{idx + 1}</span>
                    <strong className="text-sm">{med.name}</strong>
                  </div>
                  <p className="text-xs text-slate-400 font-medium pl-0 sm:pl-7 flex flex-wrap gap-x-3 gap-y-1 items-center">
                    <span>Frequency: {med.frequency}</span>
                    <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
                    <span>Duration: {med.duration}</span>
                    <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
                    <span>Instructions: {med.instructions}</span>
                  </p>
                </div>
                <div className="text-left sm:text-right shrink-0 pl-0 sm:pl-4 border-t sm:border-t-0 border-slate-100 dark:border-slate-850/60 pt-2 sm:pt-0 w-full sm:w-auto flex sm:flex-col justify-between items-center sm:items-end">
                  <span className="text-xs font-bold text-emerald-500">{med.dose || ''}</span>
                  <p className="text-[10px] text-slate-400 font-semibold">Qty: {med.quantity}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Special Instructions & Follow up grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
          
          {/* Instructions */}
          {specialInstructions && (
            <div className="space-y-1.5">
              <strong className="text-xs uppercase text-slate-400">Special Instructions</strong>
              <div className="p-3 bg-yellow-500/5 border border-yellow-500/15 rounded-2xl text-xs leading-relaxed italic">
                {specialInstructions}
              </div>
            </div>
          )}

          {/* Follow up date */}
          {followUpDate && (
            <div className="space-y-2 self-start">
              <strong className="text-xs uppercase text-slate-400 block">Follow-up Schedule</strong>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-500">
                <Calendar className="h-4.5 w-4.5" />
                <span>{formatFollowUpDate(followUpDate)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Printable Prescription Element */}
      <PrescriptionPrint 
        doctor={doctor} 
        patient={patient} 
        medicines={medicines} 
        diagnosis={diagnosis}
        specialInstructions={specialInstructions} 
        followUpDate={followUpDate} 
        createdAt={createdAt || Date.now()} 
      />
    </div>
  );
}

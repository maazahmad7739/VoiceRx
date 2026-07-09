'use client';

import { MessageSquareShare } from 'lucide-react';
import { formatWhatsAppMessage } from '../utils/formatters';

export default function WhatsAppShare({ doctor, patient, soapNote }) {
  const handleShare = () => {
    if (!doctor || !soapNote) return;

    const message = formatWhatsAppMessage(doctor, patient, soapNote);
    
    // Clean patient phone (often 10 digits). In India, prefix is 91
    let phoneNum = '';
    if (patient && patient.phone) {
      // Remove any spaces or special characters
      const cleanPhone = patient.phone.replace(/\D/g, '');
      if (cleanPhone.length === 10) {
        phoneNum = `91${cleanPhone}`;
      } else {
        phoneNum = cleanPhone;
      }
    }

    const waUrl = `https://wa.me/${phoneNum}?text=${message}`;
    window.open(waUrl, '_blank');
  };

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold py-2.5 px-4 rounded-xl transition-all shadow-md shadow-emerald-600/10 no-print"
      type="button"
    >
      <MessageSquareShare className="h-5 w-5 fill-current" />
      <span>Share Summary via WhatsApp</span>
    </button>
  );
}

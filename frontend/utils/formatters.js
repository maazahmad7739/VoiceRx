/**
 * Format timestamp into clean date string
 */
export function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'N/A';
  
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Format follow-up date only
 */
export function formatFollowUpDate(dateString) {
  if (!dateString) return 'None';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'None';
  
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Clean severity tags for badge classes
 */
export function getSeverityStyles(severity) {
  const norm = (severity || 'mild').toLowerCase();
  switch (norm) {
    case 'critical':
      return 'bg-red-500/20 text-red-700 border-red-500/30 dark:text-red-400';
    case 'severe':
      return 'bg-orange-500/20 text-orange-700 border-orange-500/30 dark:text-orange-400';
    case 'moderate':
      return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30 dark:text-yellow-400';
    case 'mild':
    default:
      return 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30 dark:text-emerald-400';
  }
}

/**
 * Format WhatsApp sharing message text
 */
export function formatWhatsAppMessage(doctor, patient, soapNote) {
  if (!doctor || !soapNote) return '';

  const summary = soapNote.patientSummaryEnglish !== 'Not requested'
    ? soapNote.patientSummaryEnglish
    : soapNote.patientSummaryHindi;

  const followUpStr = soapNote.followUpDate
    ? formatFollowUpDate(soapNote.followUpDate)
    : 'As needed';

  let msg = `*Clinical Update from ${doctor.name}*\n`;
  msg += `*Clinic:* ${doctor.clinic_name || doctor.clinicName || 'Clinic'}\n`;
  msg += `------------------------------------\n`;
  if (patient) {
    msg += `*Patient:* ${patient.name} (${patient.age}y, ${patient.gender})\n`;
  }
  msg += `*Patient Summary:* ${summary}\n\n`;
  
  if (soapNote.medications && soapNote.medications.length > 0) {
    msg += `*Prescribed Medications:*\n`;
    soapNote.medications.forEach((med, idx) => {
      msg += `${idx + 1}. ${med}\n`;
    });
    msg += `\n`;
  }
  
  msg += `*Follow-up Date:* ${followUpStr}\n\n`;
  msg += `_Note: This is an automated medical summary. Please follow the detailed prescription schedule provided by the clinic._`;

  return encodeURIComponent(msg);
}

/**
 * Translates technical error messages into clear, actionable notifications for clinical use.
 */
export function cleanErrorMessage(error) {
  if (!error) return 'An unexpected error occurred.';
  const message = typeof error === 'string' ? error : (error.message || '');
  const lower = message.toLowerCase();

  if (lower.includes('failed to fetch') || lower.includes('networkerror') || lower.includes('econnrefused')) {
    return 'Connection to the clinical server failed. Please verify that your internet connection is active and that the backend server is running.';
  }

  if (lower.includes('gemini_api_key') || lower.includes('api key is missing') || lower.includes('key is not configured')) {
    return 'Clinical AI Services are offline. The Google Gemini API Key is not configured on the server. Please insert your API key in the server settings.';
  }

  if (lower.includes('rate limit') || lower.includes('429') || lower.includes('quota exceeded') || lower.includes('too many requests')) {
    return 'AI request limit reached. We have received too many requests in a short period. Please wait 1 minute before submitting again.';
  }

  if (lower.includes('recitation') || lower.includes('copyright') || lower.includes('citation check failed')) {
    return 'The clinical AI consultant restricted this response due to citation check policies. Please rephrase the question or simplify the query case.';
  }

  if (lower.includes('all fields are required')) {
    return 'All registration fields are required. Please ensure name, specialization, clinic name, phone, email, and password are complete.';
  }
  
  if (lower.includes('already exists')) {
    return 'This email address is already registered. Please sign in or register with a different email.';
  }

  if (lower.includes('invalid credentials')) {
    return 'Authentication failed. Please verify your email and password.';
  }

  if (lower.includes('token expired') || lower.includes('invalid token') || lower.includes('access denied')) {
    return 'Your security session has expired. Please sign out and sign back in to continue.';
  }

  if (lower.includes('medicines list is required') || lower.includes('add at least one medicine')) {
    return 'Prescription cannot be saved empty. Please add or dictate at least one medication.';
  }

  if (lower.includes('missing fields in patient_details')) {
    return 'Patient profile requires a valid name, age, gender, and phone number.';
  }

  return message || 'An unexpected clinical database error occurred. Please try again.';
}

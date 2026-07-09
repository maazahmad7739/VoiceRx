'use client';

import { Sparkles } from 'lucide-react';

const CLINICAL_TEMPLATES = [
  {
    name: 'Resistant Hypertension in Diabetic Patient',
    data: {
      case_input: 'Patient is a 58-year-old male presenting with persistently elevated blood pressure readings (155/96 mmHg on average) over the last 3 months, despite being adherent to a dual therapy of Telmisartan 40mg daily and Amlodipine 5mg daily. He has a 6-year history of Type-2 Diabetes Mellitus with HbA1c currently at 7.4%. Serum creatinine is 1.1 mg/dL, and eGFR is 78 mL/min/1.73m².',
      specific_question: 'What is the recommended third-line antihypertensive agent or strategy for this diabetic patient according to international and ICMR guidelines?',
      patient_age: 58,
      patient_gender: 'Male',
      comorbidities: ['Diabetes Mellitus', 'Hypertension'],
      current_medications: ['Telmisartan 40mg', 'Amlodipine 5mg']
    }
  },
  {
    name: 'Fever with Thrombocytopenia (Suspected Dengue)',
    data: {
      case_input: 'A 28-year-old female presents with acute onset of high-grade fever (103°F) for 4 days, accompanied by retro-orbital pain, severe myalgia, and generalized headache. Platelet count has dropped from 150,000/µL yesterday to 72,000/µL today. Hematocrit is stable at 38%. Tourniquet test is positive, but there is no active mucosal bleeding or plasma leakage signs.',
      specific_question: 'What do guidelines recommend regarding hospitalization criteria, platelet transfusion thresholds, and monitoring frequency for this patient?',
      patient_age: 28,
      patient_gender: 'Female',
      comorbidities: [],
      current_medications: ['Paracetamol 650mg']
    }
  },
  {
    name: 'Uncontrolled Type-2 Diabetes with Mild Nephropathy',
    data: {
      case_input: 'A 64-year-old male with a 10-year history of Type-2 Diabetes presents with HbA1c of 8.6%. He is currently on Metformin 1000mg twice daily. Urinalysis shows microalbuminuria (UACR is 120 mg/g). eGFR is 52 mL/min/1.73m². He has a history of mild coronary artery disease.',
      specific_question: 'Which second-line antidiabetic class is strongly recommended by ADA/KDIGO guidelines for cardiorenal protection in this patient?',
      patient_age: 64,
      patient_gender: 'Male',
      comorbidities: ['Diabetes Mellitus', 'Chronic Kidney Disease', 'Coronary Artery Disease'],
      current_medications: ['Metformin 1000mg']
    }
  }
];

export default function QuickTemplates({ onSelect }) {
  return (
    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl px-4 py-2.5 text-xs shadow-inner">
      <Sparkles className="h-3.5 w-3.5 text-blue-600 fill-current" />
      <span className="font-bold text-slate-400 uppercase tracking-wider">Quick Case Templates:</span>
      <select
        onChange={(e) => {
          const idx = parseInt(e.target.value, 10);
          if (!isNaN(idx)) {
            onSelect(CLINICAL_TEMPLATES[idx].data);
          }
        }}
        defaultValue=""
        className="bg-transparent font-semibold border-none focus:outline-none cursor-pointer text-slate-700 dark:text-slate-200"
      >
        <option value="">-- Choose a template --</option>
        {CLINICAL_TEMPLATES.map((tmpl, idx) => (
          <option key={idx} value={idx}>{tmpl.name}</option>
        ))}
      </select>
    </div>
  );
}

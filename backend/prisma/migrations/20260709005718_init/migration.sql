-- CreateTable
CREATE TABLE "doctors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "specialization" TEXT NOT NULL,
    "clinic_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "doctors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patients" (
    "id" TEXT NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "gender" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "soap_notes" (
    "id" TEXT NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "transcript" TEXT NOT NULL,
    "subjective" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "assessment" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "patient_summary_english" TEXT NOT NULL,
    "patient_summary_hindi" TEXT NOT NULL,
    "icd_code" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'mild',
    "medications" TEXT NOT NULL DEFAULT '[]',
    "flags" TEXT NOT NULL DEFAULT '[]',
    "audio_url" TEXT,
    "follow_up_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "soap_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescriptions" (
    "id" TEXT NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "soap_note_id" TEXT,
    "medicines" TEXT NOT NULL DEFAULT '[]',
    "diagnosis" TEXT,
    "special_instructions" TEXT,
    "follow_up_date" TIMESTAMP(3),
    "voice_input_text" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "second_opinions" (
    "id" TEXT NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "patient_id" TEXT,
    "case_input" TEXT NOT NULL,
    "specific_question" TEXT NOT NULL,
    "patient_age" INTEGER,
    "patient_gender" TEXT,
    "comorbidities" TEXT NOT NULL DEFAULT '[]',
    "currentMedications" TEXT NOT NULL DEFAULT '[]',
    "direct_answer" TEXT NOT NULL,
    "guidelinesApplied" TEXT NOT NULL DEFAULT '[]',
    "whatGuidelinesSuggest" TEXT NOT NULL DEFAULT '{}',
    "indiaContext" TEXT NOT NULL DEFAULT '{}',
    "evidence_strength" TEXT NOT NULL,
    "gemini_full_response" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "second_opinions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "doctors_email_key" ON "doctors"("email");

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "soap_notes" ADD CONSTRAINT "soap_notes_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "soap_notes" ADD CONSTRAINT "soap_notes_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_soap_note_id_fkey" FOREIGN KEY ("soap_note_id") REFERENCES "soap_notes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "second_opinions" ADD CONSTRAINT "second_opinions_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "second_opinions" ADD CONSTRAINT "second_opinions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

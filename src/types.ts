/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// 1. Staff Members (9 Accounts)
export type Role = 'PROJECT_MANAGER' | 'ADMIN' | 'GUIDE' | 'MEDICAL_CONSULTANT' | 'JURIST' | 'WILLS_EXPERT';

export interface StaffMember {
  id: string;
  name: string;
  role: Role;
  gender: 'M' | 'F';
  hospital?: string; // For consultants
  title: string;
}

// 2. Patient Profile
export type Gender = 'M' | 'F';
export type HospitalName = 
  | 'مستشفى الملك فيصل التخصصي'
  | 'مدينة الملك سعود الطبية'
  | 'مستشفى الملك فهد'
  | 'مستشفى الحرس الوطني';

export interface Patient {
  id: string;
  name: string;
  gender: Gender;
  phone: string;
  hospital: HospitalName;
  doctorName: string;
  assignedGuideId: string | null;
  registrationDate: string;
  status: 'نشط' | 'مكتمل' | 'مغلق'; // Patient state
  manuallyApprovedMaleGuide?: boolean; // For Gender constraint override (female patient + male guide)
}

// 3. The 7 Spiritual Dimensions Evaluation
export interface SpiritualDimensions {
  spiritualHistory: string;     // التاريخ الروحي
  spiritualEvaluation: string;  // التقييم الروحي
  spiritualDistress: string;    // الاعتلالات الروحية
  triggers: string;             // المثيرات
  symptoms: string;             // الأعراض
  spiritualReinforcement: string; // التعزيز الروحي
  spiritualStrength: string;    // القوة الروحية
  evaluatedAt: string;
  aiRecommendation?: string;    // AI Generated Recommendation
}

// 4. Treatment Plan Config and Assigned Plans
export interface TreatmentPlan {
  code: string; // e.g., "1PL" to "5PL" or "CUSTOM"
  title: string;
  description: string;
  dailyMessages: string[]; // List of messages sent daily
  isCustomProposed?: boolean; // Guides can propose custom plans
  isApproved?: boolean; // Admin can approve custom plans
}

// 5. Session and Schedule Progress
export interface SessionRecord {
  id: string;
  patientId: string;
  guideId: string;
  sessionNumber: number;
  date: string;
  summary: string;
  isFirstSession: boolean;
  attendanceConfirmed: boolean;
  status: 'مستمرة' | 'مغلقة';
  assignedPlanCode: string;
  nextSessionDate?: string;
  isContemplative?: boolean; // جلسة تدبرية
  zoomLink?: string;
}

// 6. Absence Alert
export interface AbsenceAlert {
  id: string;
  patientId: string;
  daysAbsent: number; // e.g. 2 days (48 hours)
  startedAt: string;
  status: 'معلق' | 'تم التواصل' | 'تم الانتظار' | 'تم التحويل لاستشارة';
  actionTakenBy?: string; // staff ID
  actionDate?: string;
}

// 7, 8, 9. Specialist Consultations
export type SpecialistType = 'medical' | 'jurist' | 'wills';

export interface Consultation {
  id: string;
  patientId: string;
  guideId: string;
  specialistId: string | null; // Configured once picked up or assigned
  type: SpecialistType;
  question: string;
  submittedAt: string;
  answer?: string;
  answeredAt?: string;
}

// 10. WhatsApp Logs and Emulated Messages
export interface WhatsAppLog {
  id: string;
  patientId: string;
  phone: string;
  sender: 'SYSTEM' | 'PATIENT' | 'EXPERT_FORWARD';
  content: string;
  timestamp: string;
  isRead: boolean;
}

// Global Jurisprudential File
export interface JurisprudentialFile {
  content: string;
  updatedAt: string;
  updatedBy: string;
}

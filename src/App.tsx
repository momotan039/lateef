/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Users, UserCheck, Shield, HeartPulse, Sparkles, Phone, FileText, BarChart3, 
  BookOpen, PlusCircle, AlertCircle, CheckCircle, Clock, Calendar, HelpCircle, 
  Send, ExternalLink, RotateCcw, AlertTriangle, UserMinus, ToggleLeft
} from 'lucide-react';

import { 
  StaffMember, Patient, SpiritualDimensions, TreatmentPlan, 
  SessionRecord, AbsenceAlert, Consultation, WhatsAppLog, JurisprudentialFile 
} from './types';

import { 
  initialStaff, initialPlans, initialCustomPlans, 
  initialPatients, initialSpiritualScores, 
  initialSessions, initialAlerts, initialConsultations, 
  initialJurisprudentialFile, initialWhatsAppLogs 
} from './data/mockData';

import PhoneSimulator from './components/PhoneSimulator';
import ReportCharts from './components/ReportCharts';

export default function App() {
  // --- 10 Tables Operational State ---
  const [staff, setStaff] = useState<StaffMember[]>(initialStaff);
  const [patients, setPatients] = useState<Patient[]>(initialPatients);
  const [spiritualScores, setSpiritualScores] = useState<Record<string, SpiritualDimensions>>(initialSpiritualScores);
  const [sessions, setSessions] = useState<SessionRecord[]>(initialSessions);
  const [alerts, setAlerts] = useState<AbsenceAlert[]>(initialAlerts);
  const [consultations, setConsultations] = useState<Consultation[]>(initialConsultations);
  const [plans, setPlans] = useState<TreatmentPlan[]>([...initialPlans, ...initialCustomPlans]);
  const [jurisprudentialFile, setJurisprudentialFile] = useState<JurisprudentialFile>(initialJurisprudentialFile);
  const [whatsAppLogs, setWhatsAppLogs] = useState<WhatsAppLog[]>(initialWhatsAppLogs);

  // --- Current Switched Account Selector state (Default to standard Male Guide عبدالرحمن) ---
  const [activeStaffId, setActiveStaffId] = useState<string>('staff-guide-1');
  const loggedInStaff = staff.find(s => s.id === activeStaffId) || staff[0];

  // --- New Patient Form State ---
  const [newPatientName, setNewPatientName] = useState<string>('');
  const [newPatientGender, setNewPatientGender] = useState<AdminPatientGender>('M');
  const typeOfGender: AdminPatientGender[] = ['M', 'F'];
  type AdminPatientGender = 'M' | 'F';
  const [newPatientPhone, setNewPatientPhone] = useState<string>('');
  const [newPatientHospital, setNewPatientHospital] = useState<'مستشفى الملك فيصل التخصصي' | 'مدينة الملك سعود الطبية' | 'مستشفى الملك فهد' | 'مستشفى الحرس الوطني'>('مستشفى الملك فيصل التخصصي');
  const [newPatientDoctor, setNewPatientDoctor] = useState<string>('');
  const [assignedGuideId, setAssignedGuideId] = useState<string>('');
  const [manuallyApprovedMaleGuide, setManuallyApprovedMaleGuide] = useState<boolean>(false);
  const [registrationError, setRegistrationError] = useState<string>('');
  const [registrationSuccess, setRegistrationSuccess] = useState<string>('');

  // --- 7 Dimensions Form State for Active Evaluator ---
  const [evalPatientId, setEvalPatientId] = useState<string>('pat-1');
  const [dimHistory, setDimHistory] = useState<string>('');
  const [dimEval, setDimEval] = useState<string>('');
  const [dimDistress, setDimDistress] = useState<string>('');
  const [dimTriggers, setDimTriggers] = useState<string>('');
  const [dimSymptoms, setDimSymptoms] = useState<string>('');
  const [dimReinforce, setDimReinforce] = useState<string>('');
  const [dimStrength, setDimStrength] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiRecommendation, setAiRecommendation] = useState<string>('');

  // --- Session Closing & Followup Form State ---
  const [closePatientId, setClosePatientId] = useState<string>('pat-1');
  const [sessionSummary, setSessionSummary] = useState<string>('');
  const [decision, setDecision] = useState<'مستمرة' | 'مغلقة'>('مستمرة');
  const [selectedPlanCode, setSelectedPlanCode] = useState<string>('1PL');
  const [isContemplative, setIsContemplative] = useState<boolean>(false); // جلسة تدبرية
  const [isFirstSession, setIsFirstSession] = useState<boolean>(true);
  const [closingMessage, setClosingMessage] = useState<string>('');

  // --- Proposed Custom Plan State (Guides can propose) ---
  const [propPlanCode, setPropPlanCode] = useState<string>('CUSTOM-' + Date.now().toString().slice(-4));
  const [propPlanTitle, setPropPlanTitle] = useState<string>('');
  const [propPlanDesc, setPropPlanDesc] = useState<string>('');
  const [propPlanMsg, setPropPlanMsg] = useState<string>('');

  // --- Specialist Reply state ---
  const [specialistReplies, setSpecialistReplies] = useState<Record<string, string>>({});

  // --- Active Tab for Current Role view ---
  const [guideSubTab, setGuideSubTab] = useState<'register' | 'evaluate' | 'close' | 'list'>('register');
  const [adminSubTab, setAdminSubTab] = useState<'alerts' | 'content' | 'matchmaking'>('alerts');
  const [pmSubTab, setPmSubTab] = useState<'metrics' | 'tables'>('metrics');
  const [selectedTableIdx, setSelectedTableIdx] = useState<number>(0);

  // --- Matchmaking validations during UI render ---
  const availableGuides = staff.filter(s => s.role === 'GUIDE');

  // --- Event Handlers ---

  // Register New Patient with Phone verification & strict gender matcher
  const handleRegisterPatient = (e: React.FormEvent) => {
    e.preventDefault();
    setRegistrationError('');
    setRegistrationSuccess('');

    if (!newPatientName.trim() || !newPatientPhone.trim() || !newPatientDoctor.trim() || !assignedGuideId) {
      setRegistrationError('جميع الحقول إلزامية، يرجى اختيار المرشد كذلك.');
      return;
    }

    // Phone duplication check to prevent overlap
    const duplicate = patients.find(p => p.phone === newPatientPhone);
    if (duplicate) {
      setRegistrationError(`رقم الجوال مسجل مسبقاً لمريض آخر باسم: (${duplicate.name}) لتفادي الازدواجية.`);
      return;
    }

    // Capture Matchmaker Guide Object
    const targetGuide = staff.find(s => s.id === assignedGuideId);
    if (!targetGuide) {
      setRegistrationError('المرشد المختار غير صالح.');
      return;
    }

    // Strict Matchmaking Gates:
    // Rule A: Male Patient + Female Guide = Prohibited
    if (newPatientGender === 'M' && targetGuide.gender === 'F') {
      setRegistrationError('⚠️ خطأ في مطابقة الجنسين: يمنع منعيً صرامة تعيين مرشدة أنثى لمريض ذكر بموجب السياسة التوطينية للمنصة.');
      return;
    }

    // Rule B: Female Patient + Male Guide = Needs Explicit Consent checkbox Checked
    if (newPatientGender === 'F' && targetGuide.gender === 'M' && !manuallyApprovedMaleGuide) {
      setRegistrationError('⚠️ يتطلب النظام إقرار موافقة إلزامي ونصّه: (مريضة مع مرشد ذكر؟ = نعم) للاستمرار وتفعيل الملف.');
      return;
    }

    // Everything is validated, insert patient
    const newPat: Patient = {
      id: `pat-${Date.now()}`,
      name: newPatientName,
      gender: newPatientGender,
      phone: newPatientPhone,
      hospital: newPatientHospital,
      doctorName: newPatientDoctor,
      assignedGuideId: assignedGuideId,
      registrationDate: new Date().toISOString().split('T')[0],
      status: 'نشط',
      manuallyApprovedMaleGuide: newPatientGender === 'F' && targetGuide.gender === 'M' ? true : undefined
    };

    setPatients(prev => [newPat, ...prev]);
    setRegistrationSuccess(`تم تسجيل المريض (${newPatientName}) والتعيين للمرشد (${targetGuide.name}) بنجاح!`);
    
    // Reset Form
    setNewPatientName('');
    setNewPatientPhone('');
    setNewPatientDoctor('');
    setManuallyApprovedMaleGuide(false);
  };

  // 7 Dimensions AI summary Generator from Server API
  const handleGenerateAISummary = async () => {
    const targetPat = patients.find(p => p.id === evalPatientId);
    if (!targetPat) return;

    setAiLoading(true);
    try {
      const dimensions = {
        spiritualHistory: dimHistory,
        spiritualEvaluation: dimEval,
        spiritualDistress: dimDistress,
        triggers: dimTriggers,
        symptoms: dimSymptoms,
        spiritualReinforcement: dimReinforce,
        spiritualStrength: dimStrength
      };

      const res = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dimensions,
          patientName: targetPat.name,
          gender: targetPat.gender
        })
      });

      const data = await res.json();
      setAiRecommendation(data.result);
      
      // Update spiritual scores database with AI summary
      const updatedScores = {
        ...dimensions,
        evaluatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        aiRecommendation: data.result
      };
      
      setSpiritualScores(prev => ({
        ...prev,
        [evalPatientId]: updatedScores
      }));

    } catch (e) {
      console.error("AI summarization failed", e);
    } finally {
      setAiLoading(false);
    }
  };

  // Load selected patient evaluation fields
  const loadPatientScores = (patientId: string) => {
    setEvalPatientId(patientId);
    const existing = spiritualScores[patientId];
    if (existing) {
      setDimHistory(existing.spiritualHistory);
      setDimEval(existing.spiritualEvaluation);
      setDimDistress(existing.spiritualDistress);
      setDimTriggers(existing.triggers);
      setDimSymptoms(existing.symptoms);
      setDimReinforce(existing.spiritualReinforcement);
      setDimStrength(existing.spiritualStrength);
      setAiRecommendation(existing.aiRecommendation || '');
    } else {
      setDimHistory('');
      setDimEval('');
      setDimDistress('');
      setDimTriggers('');
      setDimSymptoms('');
      setDimReinforce('');
      setDimStrength('');
      setAiRecommendation('');
    }
  };

  // Close Session & Auto-schedule Next
  const handleCloseSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionSummary.trim()) {
      alert('الرجاء كتابة ملخص الجلسة.');
      return;
    }

    const targetPat = patients.find(p => p.id === closePatientId);
    if (!targetPat) return;

    // Automatic 7 Days date calculator
    const today = new Date();
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + 7);
    const nextDateFormatted = nextDate.toISOString().split('T')[0];

    const newSession: SessionRecord = {
      id: `sess-${Date.now()}`,
      patientId: closePatientId,
      guideId: loggedInStaff.id,
      sessionNumber: isFirstSession ? 1 : 2,
      date: today.toISOString().split('T')[0],
      summary: sessionSummary,
      isFirstSession,
      attendanceConfirmed: true,
      status: decision,
      assignedPlanCode: selectedPlanCode,
      nextSessionDate: decision === 'مستمرة' ? nextDateFormatted : undefined,
      isContemplative,
      zoomLink: decision === 'مستمرة' ? `https://zoom.us/j/999${Math.floor(100 + Math.random() * 900)}${Math.floor(100 + Math.random() * 900)}` : undefined
    };

    setSessions(prev => [newSession, ...prev]);

    // Update patient general status in database
    setPatients(prev => prev.map(p => {
      if (p.id === closePatientId) {
        return { ...p, status: decision === 'مغلقة' ? 'مغلق' : 'نشط' };
      }
      return p;
    }));

    // Trigger Magic Magic button outcome if saved
    triggerMagicWhatsApp(targetPat, selectedPlanCode, decision);

    setClosingMessage(`تم حفظ الجلسة الإرشادية وجدولة الجلسة التالية تلقائياً بتاريخ ${nextDateFormatted} عبر زووم.`);
    setSessionSummary('');
  };

  // Magic WhatsApp Button Implementation
  const triggerMagicWhatsApp = (patient: Patient, planCode: string, sessionDecision: 'مستمرة' | 'مغلقة') => {
    const selectedPlan = plans.find(p => p.code === planCode) || plans[0];
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);

    if (sessionDecision === 'مغلقة') {
      // Farewell msg
      const farewellLog: WhatsAppLog = {
        id: `wa-farewell-${Date.now()}`,
        patientId: patient.id,
        phone: patient.phone,
        sender: 'SYSTEM',
        content: `الحمد لله على سلامتكم وأتم الله شفاءكم وطهوركم. نبلغكم بانتهاء خطتكم العضوية المقررة لدى منصة "لطيف للدعم الروحي الرقمي" بنجاح. رعاكم الله وتذكروا دائماً عهد اليقين والصبر وصحابة اللطيف. في أمان الله ورعايته. 👋`,
        timestamp,
        isRead: false
      };
      setWhatsAppLogs(prev => [...prev, farewellLog]);

      // Stop alerts if any
      setAlerts(prev => prev.filter(a => a.patientId !== patient.id));
      return;
    }

    // Welcome Message
    const welcomeLog: WhatsAppLog = {
      id: `wa-welcome-${Date.now()}`,
      patientId: patient.id,
      phone: patient.phone,
      sender: 'SYSTEM',
      content: `مرحباً بك يا ${patient.name} في منصة "لطيف للدعم الروحي الرقمي". 👋
بناءً على طلب وإحالة الطبيب المعالج والجمعية الخيرية الشريكة، تم مرافقتك وتعيين خطتك المعتمدة:
🏷️ [${selectedPlan.title}]

آلية المتابعة: سنرسل لك ورد يومي يقوي ثباتك وجوارح عافيتك من اليوم التالي. نحن بجانبك خطوة بخطوة بالدعاء والسكينة واليقين الإلهي. بإمكانك الرد علينا أو طرح أي استفسار شرعي أو نفسي في أي وقت!`,
      timestamp,
      isRead: false
    };

    setWhatsAppLogs(prev => [...prev, welcomeLog]);

    // Send Day 1 Message after short delay simulating tomorrow
    setTimeout(() => {
      const day1Message = selectedPlan.dailyMessages[0] || "استعن بالشافي ولا تعجز.";
      const day1Log: WhatsAppLog = {
        id: `wa-day1-${Date.now()}`,
        patientId: patient.id,
        phone: patient.phone,
        sender: 'SYSTEM',
        content: `﴿اليوم الأول من خطتك المستمرة 🗓️﴾:
${day1Message}

لا تتردد في كتابة أي استفسار، وسيقوم البوت بالرد عليك فوراً بالرجوع لملفنا الفقهي الشرعي المعتمد أو تحويلها للمستشارين.`,
        timestamp: new Date(Date.now() + 10000).toISOString().replace('T', ' ').substring(0, 16),
        isRead: false
      };
      setWhatsAppLogs(prev => [...prev, day1Log]);
    }, 1500);
  };

  // Propose custom plan from fields guides
  const handleProposePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!propPlanTitle.trim() || !propPlanDesc.trim() || !propPlanMsg.trim()) {
      alert('الرجاء توفير كافة التفاصيل للمقترح.');
      return;
    }

    const proposedPlan: TreatmentPlan = {
      code: propPlanCode,
      title: `خطة ${propPlanTitle}`,
      description: propPlanDesc,
      dailyMessages: propPlanMsg.split('\n').filter(l => l.trim() !== ''),
      isCustomProposed: true,
      isApproved: false // Requires Admin approval
    };

    setPlans(prev => [...prev, proposedPlan]);
    alert('تم رفع الخطة العلاجية المقترحة للأدمن بنجاح وفي انتظار الاعتماد والنشر!');
    setPropPlanTitle('');
    setPropPlanDesc('');
    setPropPlanMsg('');
    setPropPlanCode('CUSTOM-' + Math.floor(1000 + Math.random() * 9000));
  };

  // Admin approves custom proposed plans
  const handleApprovePlan = (code: string) => {
    setPlans(prev => prev.map(p => {
      if (p.code === code) return { ...p, isApproved: true };
      return p;
    }));
  };

  // Specialist posts instant response to patient
  const handleSendSpecialistReply = (consultationId: string) => {
    const replyText = specialistReplies[consultationId];
    if (!replyText || !replyText.trim()) return;

    // Load consultation
    const cons = consultations.find(c => c.id === consultationId);
    if (!cons) return;

    const patient = patients.find(p => p.id === cons.patientId);
    if (!patient) return;

    // 1. Update Consultation database with answer
    setConsultations(prev => prev.map(c => {
      if (c.id === consultationId) {
        return {
          ...c,
          answer: replyText,
          specialistId: loggedInStaff.id,
          answeredAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
        };
      }
      return c;
    }));

    // 2. Push direct message to WhatsApp simulator logs with Privacy Shield Rule
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const logText = `📩 [رد فضيلة/سعادة المستشار المعتمد بالمنصة]:
${replyText}

(تنويه: تم إخفاء الاسم المباشر للمستشار حماية تامة لسرية الطواقم الطبية والشرعية، روابط المنصة وزوم تصلك قبل الموعد بـ 15 دقيقة تلقائياً.)`;

    const newLog: WhatsAppLog = {
      id: `wa-spec-${Date.now()}`,
      patientId: patient.id,
      phone: patient.phone,
      sender: 'EXPERT_FORWARD',
      content: logText,
      timestamp,
      isRead: false
    };

    setWhatsAppLogs(prev => [...prev, newLog]);

    // Clear reply draft input
    setSpecialistReplies(prev => ({ ...prev, [consultationId]: '' }));
  };

  // Add Consultation directly from Phone (AI Automatic Escalation)
  const handleEscalateConsultation = (patientId: string, question: string, type: 'medical' | 'jurist' | 'wills') => {
    const newCons: Consultation = {
      id: `cons-${Date.now()}`,
      patientId,
      guideId: 'staff-guide-1', // Default
      specialistId: null,
      type,
      question,
      submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };
    setConsultations(prev => [...prev, newCons]);
  };

  // Admin Absence Alerts Resolution decisions
  const handleResolveAlert = (alertId: string, decision: 'تواصل' | 'انتظار' | 'استشارة') => {
    setAlerts(prev => prev.map(a => {
      if (a.id === alertId) {
        const statuses = {
          'تواصل': 'تم التواصل وبث الاطمئنان وبدء معالجة قلق المريض الهادئ' as const,
          'انتظار': 'تم الانتظار والترقب الحذر لمؤشرات البوت' as const,
          'استشارة': 'تم التحويل لاستشارة الخبير المعني على الفور وبدقة' as const
        };
        const statusText = statuses[decision] || 'معلق';
        return {
          ...a,
          status: decision === 'تواصل' ? 'تم التواصل' : decision === 'انتظار' ? 'تم الانتظار' : 'تم التحويل لاستشارة',
          actionTakenBy: loggedInStaff.name,
          actionDate: new Date().toISOString().replace('T', ' ').substring(0, 16)
        };
      }
      return a;
    }));
  };

  // Trigger simulated 48 hours inactivity alert from Phone Simulator
  const triggerAbsenceAlert = (patientId: string) => {
    // Check if alert already exists for patient to prevent spam
    const exists = alerts.find(a => a.patientId === patientId && a.status === 'معلق');
    if (exists) return;

    const newAlert: AbsenceAlert = {
      id: `alert-${Date.now()}`,
      patientId,
      daysAbsent: 2,
      startedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'معلق'
    };

    setAlerts(prev => [newAlert, ...prev]);
  };

  return (
    <div className="min-h-screen text-[#E0E2E6] font-sans p-3 lg:p-6 pb-20 select-none bg-[#0A0C10] bg-[radial-gradient(circle_at_50%_0%,_#1C2128_0%,_#0A0C10_100%)]">
      
      {/* 1. Global Core Platform Header & Account Switcher */}
      <header className="max-w-7xl mx-auto bg-[#111419] border border-[#30363D] rounded-3xl p-5 mb-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#238636]/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#3ACADF]/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 relative z-10 text-right">
          
          {/* Logo Brand */}
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="bg-[#238636] p-2.5 rounded-2xl shadow-lg shadow-[#052e16]/40">
              <HeartPulse size={26} className="text-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-black text-white tracking-tight">
                لطيف للدعم الروحي الرقمي
              </h1>
              <p className="text-xs text-[#8B949E] mt-1 font-mono">
                مساحتك المضيئة للطمأنينة والصحة الروحية المعتمدة المستوحاة من الشافي المعافى
              </p>
            </div>
          </div>

          {/* Account Selector Role Gates */}
          <div className="bg-[#0D1117] border border-[#30363D] rounded-2xl p-3 flex flex-col sm:flex-row items-center sm:space-x-4 sm:space-x-reverse space-y-2 sm:space-y-0 w-full md:w-auto">
            <div className="text-right sm:ml-2">
              <span className="block text-[10px] text-[#3ACADF] font-mono font-bold">❖ نظام البوابة الموحدة (9 حسابات)</span>
              <span className="block text-xs text-[#8B949E] truncate max-w-[180px]">اختر الموظف النشط لمشاهدة الصلاحيات</span>
            </div>
            <select
              value={activeStaffId}
              onChange={(e) => setActiveStaffId(e.target.value)}
              className="bg-[#111419] border border-[#30363D] text-xs text-[#E0E2E6] rounded-xl py-1.5 px-3 file_selector font-sans focus:outline-none focus:border-[#3ACADF] focus:ring-1 focus:ring-[#3ACADF] w-full sm:w-auto text-right cursor-pointer"
            >
              {staff.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} - [{s.title}]
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Logged User Bar */}
        <div className="mt-4 pt-4 border-t border-[#30363D] flex flex-wrap gap-2 items-center justify-between">
          <div className="flex items-center space-x-2 space-x-reverse bg-[#238636]/10 border border-[#238636]/30 px-3.5 py-1.5 rounded-full text-xs">
            <UserCheck size={14} className="text-[#3FB950]" />
            <span className="text-[#3FB950] font-medium font-bold">المستخدم الحالي:</span>
            <span className="text-white font-bold">{loggedInStaff.name}</span>
            <span className="bg-[#238636] text-[#E0E2E6] font-mono font-extrabold px-2 py-0.5 rounded text-[9px] uppercase">
              {loggedInStaff.role}
            </span>
          </div>

          <div className="text-[11px] text-[#57606A]">
            الدعم الروحي السريري المتكامل لمرضى المنشآت الطبية بالمملكة العربية السعودية 🇸🇦
          </div>
        </div>

      </header>

      {/* 2. Main Split Grid (Main Panel Dashboard + Patient WhatsApp Mobile emulator) */}
      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Col (Always Synchronous WhatsApp Device Emulator) - 4 Span */}
        <section className="lg:col-span-4 lg:sticky lg:top-6 w-full">
          <PhoneSimulator 
            patients={patients}
            whatsAppLogs={whatsAppLogs}
            jurisprudentialFile={jurisprudentialFile}
            onNewLog={(log) => setWhatsAppLogs(prev => [...prev, log])}
            onTriggerAbsenceAlert={triggerAbsenceAlert}
            onAddConsultation={handleEscalateConsultation}
          />
        </section>

        {/* Right Col (Main Interactive Work Spaces) - 8 Span */}
        <section className="lg:col-span-8 space-y-6 w-full">

                  {/* DYNAMIC VIEW FOR ROLE: GUIDE (المرشد الروحي) */}
          {loggedInStaff.role === 'GUIDE' && (
            <div className="bg-[#111419] border border-[#30363D] rounded-3xl p-6 shadow-xl relative">
              <div className="flex justify-between items-center border-b border-[#30363D] pb-4 mb-5">
                <span className="bg-[#238636]/10 text-[#3FB950] border border-[#238636]/30 text-xs px-3 py-1 rounded-full font-bold">
                  بوابة وتطبيقات المرشد الروحي
                </span>
                <div className="flex space-x-1.5 space-x-reverse">
                  <button 
                    onClick={() => setGuideSubTab('register')}
                    className={`text-xs px-3 py-1.5 rounded-xl transition-all font-sans font-bold cursor-pointer ${guideSubTab === 'register' ? 'bg-[#238636] text-white shadow-md' : 'bg-[#0D1117] border border-[#30363D] text-[#8B949E] hover:text-[#E0E2E6]'}`}
                  >
                    تسجيل مريض جديد
                  </button>
                  <button 
                    onClick={() => setGuideSubTab('evaluate')}
                    className={`text-xs px-3 py-1.5 rounded-xl transition-all font-sans font-bold cursor-pointer ${guideSubTab === 'evaluate' ? 'bg-[#238636] text-white shadow-md' : 'bg-[#0D1117] border border-[#30363D] text-[#8B949E] hover:text-[#E0E2E6]'}`}
                  >
                    تقييم الأبعاد السبعة
                  </button>
                  <button 
                    onClick={() => setGuideSubTab('close')}
                    className={`text-xs px-3 py-1.5 rounded-xl transition-all font-sans font-bold cursor-pointer ${guideSubTab === 'close' ? 'bg-[#238636] text-white shadow-md' : 'bg-[#0D1117] border border-[#30363D] text-[#8B949E] hover:text-[#E0E2E6]'}`}
                  >
                    جلسة الإغلاق والجدولة
                  </button>
                  <button 
                    onClick={() => setGuideSubTab('list')}
                    className={`text-xs px-3 py-1.5 rounded-xl transition-all font-sans font-bold cursor-pointer ${guideSubTab === 'list' ? 'bg-[#238636] text-white shadow-md' : 'bg-[#0D1117] border border-[#30363D] text-[#8B949E] hover:text-[#E0E2E6]'}`}
                  >
                    الحالات والمقترحات
                  </button>
                </div>
              </div>

              {/* Sub Tab: Register Patient */}
              {guideSubTab === 'register' && (
                <div className="space-y-4 text-right" style={{ direction: 'rtl' }}>
                  <div className="bg-[#0D1117] p-4 rounded-2xl border border-[#30363D] mb-4">
                    <h3 className="text-white text-sm font-bold flex items-center pr-2 border-r-4 border-[#3ACADF] mb-2">
                       تعليمات هامة لتسجيل الحالات الجديدة
                    </h3>
                    <p className="text-xs text-[#8B949E] leading-relaxed pr-2">
                      يتم تشخيص وإحالة الحالات كلياً قبل البدء في النظام التقني من خلال الطبيب المعالج والجمعيات المسؤولة. ويتطلب تسجيل المريض إكمال الخمس حقول الإلزامية بدقة، مع تفعيل خاصية التحقق من تكرار الجوال.
                    </p>
                  </div>

                  <form onSubmit={handleRegisterPatient} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      <div>
                        <label className="block text-xs text-slate-400 mb-1.5 font-bold">اسم المريض الكامل (ثلاثي) *</label>
                        <input 
                          type="text" 
                          required
                          value={newPatientName}
                          onChange={(e) => setNewPatientName(e.target.value)}
                          placeholder="مثال: صالح بن محمد الحربي"
                          className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl py-2 px-3.5 text-xs text-right focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-slate-400 mb-1.5 font-bold">رقم الجوال الشخصي *</label>
                        <input 
                          type="text" 
                          required
                          value={newPatientPhone}
                          onChange={(e) => setNewPatientPhone(e.target.value)}
                          placeholder="مثال: 050XXXXXXX"
                          className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl py-2 px-3.5 text-xs text-right focus:outline-none focus:border-emerald-500 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-slate-400 mb-1.5 font-bold">جنس المستفيد *</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setNewPatientGender('M')}
                            className={`py-2 text-xs rounded-xl border text-center font-bold ${newPatientGender === 'M' ? 'bg-slate-800 text-white border-emerald-500' : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'}`}
                          >
                            ذكر (مواطن)
                          </button>
                          <button
                            type="button"
                            onClick={() => setNewPatientGender('F')}
                            className={`py-2 text-xs rounded-xl border text-center font-bold ${newPatientGender === 'F' ? 'bg-slate-800 text-white border-emerald-500' : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'}`}
                          >
                            أنثى (مواطنة)
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs text-slate-400 mb-1.5 font-bold">المستشفى المحال منه المريض *</label>
                        <select 
                          value={newPatientHospital}
                          onChange={(e: any) => setNewPatientHospital(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl py-2 px-3 text-xs text-right focus:outline-none"
                        >
                          <option value="مستشفى الملك فيصل التخصصي">مستشفى الملك فيصل التخصصي</option>
                          <option value="مدينة الملك سعود الطبية">مدينة الملك سعود الطبية</option>
                          <option value="مستشفى الملك فهد">مستشفى الملك فهد</option>
                          <option value="مستشفى الحرس الوطني">مستشفى الحرس الوطني</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs text-slate-400 mb-1.5 font-bold">اسم الطبيب المعالج المشرف *</label>
                        <input 
                          type="text" 
                          required
                          value={newPatientDoctor}
                          onChange={(e) => setNewPatientDoctor(e.target.value)}
                          placeholder="مثال: د. مازن عبد العزيز"
                          className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl py-2 px-3.5 text-xs text-right focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-slate-400 mb-1.5 font-bold">اختيار المرشد الروحي للتعيين والمسؤولية *</label>
                        <select 
                          value={assignedGuideId}
                          onChange={(e) => setAssignedGuideId(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl py-2 px-3 text-xs text-right focus:outline-none"
                        >
                          <option value="">-- اختر المرشد --</option>
                          {availableGuides.map(g => (
                            <option key={g.id} value={g.id}>
                              {g.name} ({g.gender === 'M' ? 'مرشد ذكر' : 'مرشدة أنثى'})
                            </option>
                          ))}
                        </select>
                      </div>

                    </div>

                    {/* Strict Matchmaking Conditional UI Gate */}
                    {newPatientGender === 'F' && assignedGuideId && staff.find(s => s.id === assignedGuideId)?.gender === 'M' && (
                      <div className="bg-amber-950/50 border border-amber-900 rounded-2xl p-4 flex flex-col space-y-2 text-right">
                        <div className="flex items-center justify-end space-x-1.5 text-amber-400">
                          <span className="font-bold text-xs">تنبيه قاعدة الجنس الصارمة للتعيين!</span>
                          <AlertTriangle size={14} />
                        </div>
                        <p className="text-[11px] text-amber-200 leading-relaxed">
                          لقد اخترت تعيين مريضة أنثى لمرشد روحي ذكر. يشرع النظام تصفية وموافقة إقرارية صريحة كأحد الشروط الإلزامية لإكمال التسجيل.
                        </p>
                        <label className="flex items-center justify-end space-x-2 cursor-pointer pt-1">
                          <span className="text-xs text-slate-200 font-bold font-sans">
                            نعم، أقر بموافقة عائلة المريضة بمرافقة المرشد الروحي الذكر بعد التنسيق
                          </span>
                          <input 
                            type="checkbox"
                            checked={manuallyApprovedMaleGuide}
                            onChange={(e) => setManuallyApprovedMaleGuide(e.target.checked)}
                            className="bg-slate-950 rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                          />
                        </label>
                      </div>
                    )}

                    {/* Feedback messages */}
                    {registrationError && (
                      <div className="bg-red-950/80 border border-red-900 rounded-2xl p-3 text-xs text-red-300 font-bold flex items-center justify-end">
                        <span className="text-right leading-relaxed">{registrationError}</span>
                        <AlertCircle size={15} className="ml-2 w-5 flex-shrink-0" />
                      </div>
                    )}

                    {registrationSuccess && (
                      <div className="bg-emerald-950/80 border border-emerald-950 rounded-2xl p-3 text-xs text-emerald-300 font-bold flex items-center justify-end">
                        <span>{registrationSuccess}</span>
                        <CheckCircle size={15} className="ml-2" />
                      </div>
                    )}

                    <div className="text-left pt-2">
                      <button 
                        type="submit"
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-6 rounded-2xl text-xs transition-all flex items-center space-x-2 space-x-reverse ml-auto cursor-pointer"
                      >
                        <span>حفظ وتسجيل المريض 💾</span>
                        <PlusCircle size={14} />
                      </button>
                    </div>

                  </form>
                </div>
              )}

              {/* Sub Tab: 7 Dimensions Evaluator */}
              {guideSubTab === 'evaluate' && (
                <div className="space-y-4 text-right" style={{ direction: 'rtl' }}>
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0 mb-3">
                      <span className="text-xs text-emerald-400 font-bold">
                        طرح الأسئلة السبعة بالتوالي أثناء الجلسة التمهيدية
                      </span>
                      <div className="flex items-center space-x-2 space-x-reverse w-full sm:w-auto">
                        <span className="text-xs text-slate-400 w-24">المريض المستهدف:</span>
                        <select 
                          value={evalPatientId}
                          onChange={(e) => loadPatientScores(e.target.value)}
                          className="bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl py-1 px-2.5 text-right w-full sm:w-48"
                        >
                          {patients.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1 font-bold">1. التاريخ الروحي (Spiritual History)</label>
                      <textarea
                        value={dimHistory}
                        onChange={(e) => setDimHistory(e.target.value)}
                        placeholder="ما هي العبادات، الصلوات والتوازن الروحي اليومي المعتاد للمريض قبل داء الجسد؟"
                        className="w-full h-16 bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-2.5 text-xs focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1 font-bold">2. التقييم الروحي (Spiritual Evaluation)</label>
                      <textarea
                        value={dimEval}
                        onChange={(e) => setDimEval(e.target.value)}
                        placeholder="الاضطرابات الحالية في رؤية المريض الروحية لمرضه أو إحباطه العقدوي الراهن."
                        className="w-full h-16 bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-2.5 text-xs focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1 font-bold">3. الاعتلالات الروحية (Spiritual Distress)</label>
                      <textarea
                        value={dimDistress}
                        onChange={(e) => setDimDistress(e.target.value)}
                        placeholder="الخلافات النفسية، الشعور بالذنب، أو الغضب الذاتي المكبوت."
                        className="w-full h-16 bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-2.5 text-xs focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1 font-bold">4. المثيرات والمنبهات (Triggers)</label>
                      <textarea
                        value={dimTriggers}
                        onChange={(e) => setDimTriggers(e.target.value)}
                        placeholder="مشاهدة جرعات الكيميائي، الغرف الضيقة، أو الوحدة الصامتة بالمشفى."
                        className="w-full h-16 bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-2.5 text-xs focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1 font-bold">5. الأعراض والشكوى (Symptoms)</label>
                      <textarea
                        value={dimSymptoms}
                        onChange={(e) => setDimSymptoms(e.target.value)}
                        placeholder="الأرق، التنهد الدائم، رفض الحوار، وسرعة البكاء والحساسية الشديدة."
                        className="w-full h-16 bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-2.5 text-xs focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1 font-bold">6. التعزيز الروحي (Spiritual Reinforcement)</label>
                      <textarea
                        value={dimReinforce}
                        onChange={(e) => setDimReinforce(e.target.value)}
                        placeholder="الروابط الشرعية لربط البلاء بقصص الأنبياء وتكفير السيئات والرحمة الشافية."
                        className="w-full h-16 bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-2.5 text-xs focus:outline-none"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[11px] text-slate-400 mb-1 font-bold">7. القوة الروحية وإمكانات الصبر (Spiritual Strength)</label>
                      <textarea
                        value={dimStrength}
                        onChange={(e) => setDimStrength(e.target.value)}
                        placeholder="الإيمان الكامن بالصالحات، الاستجابة السريعة للقرآن الكريم، وقدرة الصلاة واليقين الداخلي."
                        className="w-full h-16 bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-2.5 text-xs focus:outline-none"
                      />
                    </div>

                  </div>

                  {/* AI Recommendation Engine integration */}
                  <div className="bg-slate-950 p-4 border border-slate-800 rounded-2xl flex flex-col space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-500">تم التنشيط عبر Gemini-3.5-Flash</span>
                      <button
                        onClick={handleGenerateAISummary}
                        disabled={aiLoading}
                        className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-bold py-1.5 px-4 rounded-xl text-xs flex items-center space-x-1.5 space-x-reverse transition-all ml-0 cursor-pointer"
                      >
                        <Sparkles size={13} className="text-yellow-300" />
                        <span>{aiLoading ? 'جاري قراءة الأبعاد للتوليد...' : 'تشغيل محرك الملخص الآلي بالذكاء الاصطناعي ✨'}</span>
                      </button>
                    </div>

                    {aiRecommendation && (
                      <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-3.5 text-xs text-slate-200 leading-relaxed text-right font-sans border-dashed">
                        <div className="flex items-center justify-end space-x-1 text-emerald-400 font-bold mb-2">
                          <span>التوصية العلاجية الفقهية لـ الذكاء الاصطناعي (AI)</span>
                          <Sparkles size={12} />
                        </div>
                        <div className="whitespace-pre-line text-emerald-100 bg-[#064e3b]/20 p-3 rounded-lg border border-emerald-900">
                          {aiRecommendation}
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* Sub Tab: Document First Session & System Closure */}
              {guideSubTab === 'close' && (
                <div className="space-y-4 text-right" style={{ direction: 'rtl' }}>
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    <h3 className="text-white text-sm font-bold flex items-center mb-1">
                      نموذج إغلاق الجلسة العلاجية والجدولة اللاحقة
                    </h3>
                    <p className="text-xs text-slate-400">
                      يعبأ فور انتهاء الحوار الإنساني الميداني لتوثيق حضور أولى الجلسات وتأكيد الإغلاق للبرنامج أو الجدولة الرقمية عبر زوم.
                    </p>
                  </div>

                  <form onSubmit={handleCloseSession} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      <div>
                        <label className="block text-xs text-slate-400 mb-1.5 font-bold">المريض المستهدف في محضر الجلسة *</label>
                        <select
                          value={closePatientId}
                          onChange={(e) => setClosePatientId(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl py-2 px-3 text-xs text-right focus:outline-none"
                        >
                          {patients.map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.phone})</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs text-slate-400 mb-1.5 font-bold">تصنيف الجلسة الإرشادية *</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setIsFirstSession(true)}
                            className={`py-2 text-xs rounded-xl border text-center font-bold ${isFirstSession ? 'bg-slate-800 text-white border-emerald-500' : 'bg-slate-950 text-slate-400 border-slate-800'}`}
                          >
                            الجلسة الأولى التمهيدية (حواري فقط)
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsFirstSession(false)}
                            className={`py-2 text-xs rounded-xl border text-center font-bold ${!isFirstSession ? 'bg-slate-800 text-white border-emerald-500' : 'bg-slate-950 text-slate-400 border-slate-800'}`}
                          >
                            جلسة متابعة لاحقة (مكثفة)
                          </button>
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs text-slate-400 mb-1.5 font-bold">ملخص وقائع الجلسة الحواري الميداني *</label>
                        <textarea
                          required
                          value={sessionSummary}
                          onChange={(e) => setSessionSummary(e.target.value)}
                          placeholder="اكتب التقييم الحضوري، ورضا المستفيد، والاتفاق الروحي الذي ركزت عليه في الحوار الإنساني..."
                          className="w-full h-24 bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-3 text-xs focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-slate-400 mb-1.5 font-bold">تحديد قرار الحالة والعلاج الحالي *</label>
                        <select
                          value={decision}
                          onChange={(e: any) => setDecision(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl py-2 px-3 text-xs text-right focus:outline-none"
                        >
                          <option value="مستمرة">مستمرة (جدولة اللقاء القادم خلال 7 أيام)</option>
                          <option value="مغلقة">مغلقة (التعافي والتحسن وإرسال رسالة الوداع) 🔒</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs text-slate-400 mb-1.5 font-bold">تخصيص السلوك والبرنامج (رمز الخطة) *</label>
                        <select
                          value={selectedPlanCode}
                          onChange={(e) => setSelectedPlanCode(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl py-2 px-3 text-xs text-right focus:outline-none"
                        >
                          {plans.filter(p => !p.isCustomProposed || p.isApproved).map(p => (
                            <option key={p.code} value={p.code}>
                              {p.code} - {p.title}
                            </option>
                          ))}
                        </select>
                      </div>

                    </div>

                    {decision === 'مستمرة' && (
                      <div className="bg-slate-950 p-4 border border-slate-800 rounded-2xl space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-emerald-400 font-bold">جدولة الخطة الرقمية الممنهجة</span>
                          <span className="text-[10px] text-slate-500 font-mono">Zoom Integration Dynamic API</span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          بموجب قوانين المنصة، تتم الجدولة آلياً كل 7 أيام من تاريخ اليوم وتوليد رابط زوم وتوثيق حضور المريض، مع حجب اسم مرشد الحالة التزاماً بسرية الطواقم العلاجية وضمان الخصوصية.
                        </p>
                        
                        <div className="flex items-center space-x-4 space-x-reverse pt-2">
                          <label className="flex items-center space-x-1.5 cursor-pointer">
                            <input 
                              type="checkbox"
                              checked={isContemplative}
                              onChange={(e) => setIsContemplative(e.target.checked)}
                              className="bg-slate-900 rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                            />
                            <span className="text-xs text-slate-200 font-bold mr-1.5">الحصة القادمة "جلسة تدبرية للمصحف الشريف" 📖</span>
                          </label>
                        </div>
                      </div>
                    )}

                    {closingMessage && (
                      <div className="bg-emerald-950/80 border border-emerald-900 rounded-2xl p-3 text-xs text-emerald-300 font-bold text-right">
                        {closingMessage}
                      </div>
                    )}

                    <div className="text-left pt-2 flex justify-between items-center">
                      <span className="text-[10px] text-amber-400 font-bold font-mono">
                        🪄 الزر السحري ينطلق فور الاستكمال والحمد!
                      </span>
                      <button 
                        type="submit"
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-6 rounded-2xl text-xs transition-all flex items-center space-x-2 space-x-reverse"
                      >
                        <span>حفظ الجلسة وإرسال الخطة للتفعيل والمتابعة 🪄</span>
                      </button>
                    </div>

                  </form>
                </div>
              )}

              {/* Sub Tab: Case Guide Proposed & Current List */}
              {guideSubTab === 'list' && (
                <div className="space-y-6 text-right" style={{ direction: 'rtl' }}>
                  
                  {/* Proposed Plan form */}
                  <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                    <h3 className="text-white text-sm font-bold flex items-center border-r-4 border-emerald-500 pr-2">
                       صياغة خطة دعم روحي مقترحة (للمرشدين)
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed pr-2">
                      يمكنك كمرشد ميداني اقتراح خطة مخصصة وفقاً لالتقاطات الحوار الميداني. سترتفع الخطة تلقائياً للأدمن لاعتمادها ونشرها لكافة الطاقم.
                    </p>

                    <form onSubmit={handleProposePlan} className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">اسم الخطة الروحية المقترحة *</label>
                          <input 
                            type="text"
                            required
                            value={propPlanTitle}
                            onChange={(e) => setPropPlanTitle(e.target.value)}
                            placeholder="مثال: خطة اليقين والطهور التلطيفية"
                            className="w-full bg-slate-900 border border-slate-850 text-xs text-slate-200 rounded-xl py-2 px-3 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-slate-400 mb-1">رمز الكود المقترح (تلقائي) *</label>
                          <input 
                            type="text"
                            disabled
                            value={propPlanCode}
                            className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-500 rounded-xl py-2 px-3 font-mono text-left focus:outline-none"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-xs text-slate-400 mb-1 font-bold">وصف وجدوى البرنامج المقترح علمياً وشرعياً *</label>
                          <input 
                            type="text"
                            required
                            value={propPlanDesc}
                            onChange={(e) => setPropPlanDesc(e.target.value)}
                            placeholder="ما الفئة الطبية الملائمة وكيف تفيد اليقين الروحي للمريض؟"
                            className="w-full bg-slate-900 border border-slate-850 text-xs text-slate-200 rounded-xl py-2 px-3 focus:outline-none"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-xs text-slate-400 mb-1 font-bold">الورد اليومي للرسائل (اكتب كل رسالة في سطر مستقل لجدولة الأيام) *</label>
                          <textarea
                            required
                            value={propPlanMsg}
                            onChange={(e) => setPropPlanMsg(e.target.value)}
                            placeholder="الرسالة الأولى لليوم الأول&#10;الرسالة الثانية لليوم الثاني&#10;الرسالة الثالثة لليوم الثالث"
                            className="w-full h-20 bg-slate-900 border border-slate-850 text-xs text-slate-200 rounded-xl p-2.5 focus:outline-none leading-relaxed"
                          />
                        </div>
                      </div>

                      <button 
                        type="submit"
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 px-4 rounded-xl text-xs flex items-center space-x-1.5 space-x-reverse cursor-pointer ml-auto"
                      >
                        <span>رفع المقترح للاعتماد 📤</span>
                      </button>
                    </form>
                  </div>

                  {/* Guide Active assignments cases tables */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 mb-2 font-mono">❖ المرضى المسجلين والمحالين تحت توجيهك المباشر</h4>
                    <div className="overflow-x-auto rounded-2xl border border-slate-800">
                      <table className="w-full text-right text-xs bg-slate-950">
                        <thead className="bg-[#0f172a] text-slate-400 font-bold border-b border-slate-800">
                          <tr>
                            <th className="p-3">اسم المريض</th>
                            <th className="p-3">الجنس</th>
                            <th className="p-3">رقم الجوال</th>
                            <th className="p-3">المستشفى والأخصائي</th>
                            <th className="p-3">تاريخ الإحالة</th>
                            <th className="p-3">حالة المتابعة</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850 text-slate-300">
                          {patients.filter(p => p.assignedGuideId === loggedInStaff.id).map(p => (
                            <tr key={p.id} className="hover:bg-slate-900/40">
                              <td className="p-3 font-bold text-white">{p.name}</td>
                              <td className="p-3">{p.gender === 'M' ? 'ذكر' : 'أنثى'}</td>
                              <td className="p-3 font-mono">{p.phone}</td>
                              <td className="p-3">
                                <div>{p.hospital}</div>
                                <div className="text-[10px] text-slate-500">الطبيب المعالج: {p.doctorName}</div>
                              </td>
                              <td className="p-3 font-mono text-[10px]">{p.registrationDate}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${p.status === 'نشط' ? 'bg-emerald-950 text-emerald-300' : p.status === 'مكتمل' ? 'bg-blue-950 text-blue-300' : 'bg-slate-900 text-slate-400'}`}>
                                  {p.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}

            </div>
          )}

          {/* DYNAMIC VIEW FOR ROLE: ADMIN (الأدمن والمشرف) */}
          {loggedInStaff.role === 'ADMIN' && (
            <div className="bg-[#111419] border border-[#30363D] rounded-3xl p-6 shadow-xl relative">
              <div className="flex justify-between items-center border-b border-[#30363D] pb-4 mb-5">
                <span className="bg-[#3ACADF]/10 text-[#3ACADF] border border-[#3ACADF]/30 text-xs px-3 py-1 rounded-full font-bold shadow-[0_0_10px_rgba(58,202,223,0.05)]">
                  بوابة وتطبيقات الإدارة والتحكم (Admin)
                </span>
                <div className="flex space-x-1.5 space-x-reverse">
                  <button 
                    onClick={() => setAdminSubTab('alerts')}
                    className={`text-xs px-3 py-1.5 rounded-xl transition-all font-sans font-bold cursor-pointer ${adminSubTab === 'alerts' ? 'bg-[#3ACADF] text-[#0A0C10] shadow-[0_0_15px_rgba(58,202,223,0.3)]' : 'bg-[#0D1117] border border-[#30363D] text-[#8B949E] hover:text-[#E0E2E6]'}`}
                  >
                    تنبيهات الغياب الآلية ⚠️
                  </button>
                  <button 
                    onClick={() => setAdminSubTab('content')}
                    className={`text-xs px-3 py-1.5 rounded-xl transition-all font-sans font-bold cursor-pointer ${adminSubTab === 'content' ? 'bg-[#3ACADF] text-[#0A0C10] shadow-[0_0_15px_rgba(58,202,223,0.3)]' : 'bg-[#0D1117] border border-[#30363D] text-[#8B949E] hover:text-[#E0E2E6]'}`}
                  >
                    إدارة المحتوى والخطط والملف الشرعي
                  </button>
                  <button 
                    onClick={() => setAdminSubTab('matchmaking')}
                    className={`text-xs px-3 py-1.5 rounded-xl transition-all font-sans font-bold cursor-pointer ${adminSubTab === 'matchmaking' ? 'bg-[#3ACADF] text-[#0A0C10] shadow-[0_0_15px_rgba(58,202,223,0.3)]' : 'bg-[#0D1117] border border-[#30363D] text-[#8B949E] hover:text-[#E0E2E6]'}`}
                  >
                    تفويض حسابات الطاقم الـ 9
                  </button>
                </div>
              </div>

              {/* Sub Tab: Absence Alerts */}
              {adminSubTab === 'alerts' && (
                <div className="space-y-4 text-right" style={{ direction: 'rtl' }}>
                  
                  <div className="bg-[#0D1117] p-4 border border-[#30363D] rounded-2xl flex items-start space-x-3 space-x-reverse">
                    <div className="bg-[#F85149]/10 p-2.5 rounded-xl text-[#F85149]">
                      <AlertCircle size={20} className="animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-white hover:text-red-300 font-bold text-sm">
                        نظام تنبيه الغياب والاحتراز الرقمي الممنهج (48 ساعة)
                      </h4>
                      <p className="text-xs text-[#8B949E] leading-relaxed mt-1">
                        يقوم الروبوت بإطلاق إشعار أحمر فوراً في حال تخلف الحالة عن الإجابة على رسالة المتابعة اليومية لواتساب طيلة (48 ساعة متواصلة). يملك الأدمن حصرية اتخاذ الإجراء السليم لتصحيح قلق المستفيد.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {alerts.length === 0 ? (
                      <div className="text-center py-6 text-slate-500 text-xs italic bg-slate-950 rounded-2xl border border-slate-855">
                        لا توجد تنبيهات غياب معلقة حالياً. جميع المرضى يتواصلون مع البوت بنجاح!
                      </div>
                    ) : (
                      alerts.map((alert) => {
                        const pat = patients.find(p => p.id === alert.patientId);
                        return (
                          <div 
                            key={alert.id}
                            className={`p-4 rounded-2xl border transition-all text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0 ${alert.status === 'معلق' ? 'bg-[#451a03]/50 border-amber-900 text-slate-200' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center space-x-1.5 space-x-reverse">
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                                <span className="font-extrabold text-white text-sm">{pat?.name || 'مستفيد غير معرف'}</span>
                                <span className="bg-red-950 text-red-400 border border-red-900 font-mono px-2 py-0.5 rounded text-[8px]">تجاوز 48 ساعة</span>
                              </div>
                              <div className="text-[11px] leading-relaxed text-slate-450">
                                رقم جوال المستفيد: <span className="font-mono">{pat?.phone}</span> | المستشفى: {pat?.hospital}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                تاريخ بدء التنبيه: {alert.startedAt}
                              </div>
                              {alert.actionTakenBy && (
                                <div className="text-[10px] text-blue-400 font-bold bg-blue-950/50 p-1 rounded-md inline-block border border-blue-900 mt-1">
                                  الإجراء المتخذ: {alert.status} بواسطة ({alert.actionTakenBy}) بتاريخ {alert.actionDate}
                                </div>
                              )}
                            </div>

                            {alert.status === 'معلق' && (
                              <div className="flex space-x-1.5 space-x-reverse w-full sm:w-auto justify-end">
                                <button
                                  onClick={() => handleResolveAlert(alert.id, 'تواصل')}
                                  className="bg-emerald-700 hover:bg-emerald-600 font-bold text-white py-1 px-2.5 rounded-lg text-[10px] transition-all cursor-pointer"
                                >
                                  تواصل مباشر 📱
                                </button>
                                <button
                                  onClick={() => handleResolveAlert(alert.id, 'انتظار')}
                                  className="bg-slate-800 hover:bg-slate-700 font-bold text-white py-1 px-2.5 rounded-lg text-[10px] transition-all cursor-pointer"
                                >
                                  الانتظار والترقب
                                </button>
                                <button
                                  onClick={() => handleResolveAlert(alert.id, 'استشارة')}
                                  className="bg-amber-700 hover:bg-amber-600 font-bold text-white py-1 px-2.5 rounded-lg text-[10px] transition-all cursor-pointer"
                                >
                                  تحويل لاستشارة 🩺
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                </div>
              )}

              {/* Sub Tab: Content & Jurisprudential Updates */}
              {adminSubTab === 'content' && (
                <div className="space-y-6 text-right" style={{ direction: 'rtl' }}>
                  
                  {/* Jurisprudential file updater */}
                  <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                      <span className="text-xs text-blue-400 font-bold">تحديث الملف الفقهي المرجعي المعتمد</span>
                      <span className="text-[10px] font-mono text-slate-500">منع الاجتهاد الشرعي خارج الاختصاص</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      المرجع الفقهي الرئيسي الذي يستنبط وينسخ منه الذكاء الاصطناعي إجاباته للمرضى على واتساب. لا يخرج البوت مطلقاً عن هذه النصوص تلافياً للوقوع في الفتاوى الشائكة.
                    </p>
                    <textarea
                      value={jurisprudentialFile.content}
                      onChange={(e) => setJurisprudentialFile(prev => ({ 
                        ...prev, 
                        content: e.target.value,
                        updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
                        updatedBy: loggedInStaff.name
                      }))}
                      className="w-full h-48 bg-slate-900 border border-slate-850 text-slate-200 rounded-xl p-3 text-xs leading-relaxed font-sans focus:outline-none focus:border-blue-500"
                    />
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-[10px] text-slate-500">
                        آخر تحديث: {jurisprudentialFile.updatedAt} بواسطة {jurisprudentialFile.updatedBy}
                      </span>
                      <button 
                        onClick={() => alert('تم تحديث وحفظ الملف الفقهي المعتمد للمنصة وتطبيقه بنجاح على روبوتات الذكاء الاصطناعي!')}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-1 px-5 rounded-lg text-xs cursor-pointer"
                      >
                        حفظ ونشر التعديل الفقهي 💾
                      </button>
                    </div>
                  </div>

                  {/* Propose plans approvals list */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 mb-2 font-mono">❖ طلبات اعتماد الخطط الروحية المقترحة من المرشدين الميدانيين</h4>
                    <div className="space-y-2.5">
                      {plans.filter(p => p.isCustomProposed && !p.isApproved).length === 0 ? (
                        <div className="text-center py-4 text-slate-500 text-xs italic bg-slate-950 rounded-xl border border-slate-850">
                          لا توجد مقترحات خطط علاجية بانتظار المراجعة والاعتماد.
                        </div>
                      ) : (
                        plans.filter(p => p.isCustomProposed && !p.isApproved).map((p) => (
                          <div key={p.code} className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex justify-between items-center text-xs">
                            <div>
                              <div className="font-bold text-white text-sm mb-1">{p.title}</div>
                              <p className="text-slate-400 leading-relaxed">{p.description}</p>
                              <div className="text-[10px] text-slate-500 font-mono mt-1">الرمز الإحالي: {p.code}</div>
                            </div>
                            <button
                              onClick={() => handleApprovePlan(p.code)}
                              className="bg-blue-600 hover:bg-blue-500 font-bold text-white py-1 px-3 rounded-lg text-xs"
                            >
                              اعتماد ونشر الخطة ✓
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>
              )}

              {/* Sub Tab: Matchmaking Explanation and Profiles */}
              {adminSubTab === 'matchmaking' && (
                <div className="space-y-4 text-right" style={{ direction: 'rtl' }}>
                  
                  <div className="bg-slate-950 p-4 border border-slate-800 rounded-2xl">
                    <h3 className="text-white text-sm font-bold flex items-center pr-2 border-r-4 border-blue-500 mb-2">
                       صلاحيات حسابات الطاقم الطبي والشرعي الـ 9
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed mb-4">
                      النظام مهيأ كلياً لخدمة تسعة مستخدمين يمثلون الهيكل الوظيفي والإشرافي للمشروع متكاملة لضمان جودة الأداء وعدم تداخل الصلاحيات.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {staff.map(st => (
                        <div key={st.id} className="bg-slate-900 border border-slate-850 rounded-xl p-3 flex flex-col justify-between text-right">
                          <div>
                            <span className="block font-bold text-white text-xs">{st.name}</span>
                            <span className="block text-[10px] text-slate-400 mt-1 font-sans">{st.title}</span>
                          </div>
                          <div className="mt-2 pt-2 border-t border-slate-850 flex items-center justify-between text-[9px] text-slate-500">
                            <span>الجنس: {st.gender === 'M' ? 'ذكر' : 'أنثى'}</span>
                            <span className="bg-slate-950 px-1.5 py-0.5 rounded font-mono text-emerald-400 text-[8px]">{st.id}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

            </div>
          )}

          {/* DYNAMIC VIEW FOR ROLE: SPECIALISTS (الأطباء، الفقهاء، وخبراء الوصايا) */}
          {(loggedInStaff.role === 'MEDICAL_CONSULTANT' || loggedInStaff.role === 'JURIST' || loggedInStaff.role === 'WILLS_EXPERT') && (
            <div className="bg-[#111419] border border-[#30363D] rounded-3xl p-6 shadow-xl relative text-right" style={{ direction: 'rtl' }}>
              
              {/* Header specialized */}
              <div className="flex items-center space-x-3 space-x-reverse border-b border-[#30363D] pb-4 mb-5">
                <div className="bg-[#3ACADF]/10 p-2 rounded-xl text-[#3ACADF]">
                  <HeartPulse size={22} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">مركز الخبراء الاستشاري واستقبال الطلبات الموجهة</h3>
                  <p className="text-xs text-[#8B949E]">
                    أهلاً بك يا {loggedInStaff.name}. تظهر لك الطلبات الموجهة لاختصاص رعاية المرضى المسجلين لديك بخصوصية تامة وحجب للمرشدين.
                  </p>
                </div>
              </div>

              {/* Show only corresponding Inbox */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 mb-3 font-mono">
                  📨 صندوق الوارد الحالي لـ {
                    loggedInStaff.role === 'MEDICAL_CONSULTANT' ? 'استشارات الطاقم الطبي' : 
                    loggedInStaff.role === 'JURIST' ? 'الشيخ د. صالح اليوسف (فقيه المنصة)' : 
                    'المستشار عبد الله الدوسري (خبير الوصايا والمسائل العدلية)'
                  }
                </h4>

                {/* Filter consultations by loggedInStaff role type */}
                {(() => {
                  const targetType = 
                    loggedInStaff.role === 'MEDICAL_CONSULTANT' ? 'medical' : 
                    loggedInStaff.role === 'JURIST' ? 'jurist' : 'wills';
                  
                  const filteredCons = consultations.filter(c => c.type === targetType);

                  if (filteredCons.length === 0) {
                    return (
                      <div className="text-center py-8 text-slate-500 text-xs italic bg-slate-950 rounded-2xl border border-slate-850">
                        صندوق الاستشارات فارغ تماماً حالياً. لا توجد قضايا معلقة بانتظار مجهوداتك.
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      {filteredCons.map((cons) => {
                        const pat = patients.find(p => p.id === cons.patientId);
                        return (
                          <div key={cons.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                            <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                              <div className="flex items-center space-x-2 space-x-reverse">
                                <span className="font-bold text-white text-sm">{pat?.name || 'مريض غير مسجل'}</span>
                                <span className="text-[10px] text-slate-500 font-mono">تاريخ التوجيه: {cons.submittedAt}</span>
                              </div>
                              <span className="bg-slate-900 text-slate-300 font-mono px-2 py-0.5 rounded text-[8px] uppercase">
                                {cons.type === 'medical' ? 'طب أورام وتلطيفي' : cons.type === 'jurist' ? 'فقه الطهارة والصلاة' : 'وصايا ونموذج عدلي'}
                              </span>
                            </div>

                            {/* Question details */}
                            <div className="bg-slate-900 border border-slate-850 p-3 rounded-xl border-r-4 border-amber-500">
                              <p className="text-xs text-slate-200 leading-relaxed font-sans">{cons.question}</p>
                            </div>

                            {/* Answer Details if answered or input if pending */}
                            {cons.answer ? (
                              <div className="bg-slate-900 border border-slate-850 p-3 rounded-xl border-r-4 border-emerald-500 text-xs text-right space-y-1">
                                <div className="font-extrabold text-emerald-400 flex items-center justify-end mb-1">
                                  <span>تم الرد والإرسال المباشر للمريض بالواتساب ✓</span>
                                  <CheckCircle size={12} className="ml-1" />
                                </div>
                                <p className="text-emerald-100 font-sans leading-relaxed">{cons.answer}</p>
                                <div className="text-[9px] text-slate-500 mt-1 font-mono">تاريخ وتوقيت الرد: {cons.answeredAt}</div>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <label className="block text-xs text-slate-400 font-bold mb-1">صياغة الإجابة والرد الفوري المرسل للمريض على الهاتف *</label>
                                <textarea
                                  value={specialistReplies[cons.id] || ''}
                                  onChange={(e) => setSpecialistReplies(prev => ({ ...prev, [cons.id]: e.target.value }))}
                                  placeholder={
                                    cons.type === 'wills' 
                                      ? "اكتب الرد الموجه للمريض مع تدريبه على صياغة الوصية بثلث ماله ومطابقتها للائحة العدلية لوزارة العدل السعودية تلافياً لبطلانها..."
                                      : "اكتب الجواب الفقهي أو الطبي التيسيري بوضوح ودعاية مستشفية..."
                                  }
                                  className="w-full h-20 bg-slate-900 border border-slate-850 text-slate-250 rounded-xl p-2.5 text-xs focus:outline-none"
                                />
                                <div className="text-left">
                                  <button
                                    onClick={() => handleSendSpecialistReply(cons.id)}
                                    className="bg-emerald-600 hover:bg-emerald-500 font-bold text-white py-1 px-4 rounded-xl text-xs flex items-center space-x-1.5 space-x-reverse ml-auto cursor-pointer"
                                  >
                                    <span>إرسال وتوجيه مباشر للواتساب 🪄</span>
                                    <Send size={12} className="transform rotate-180" />
                                  </button>
                                </div>
                              </div>
                            )}

                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

            </div>
          )}

          {/* DYNAMIC VIEW FOR ROLE: PROJECT_MANAGER (مدير المشروع) */}
          {loggedInStaff.role === 'PROJECT_MANAGER' && (
            <div className="bg-[#111419] border border-[#30363D] rounded-3xl p-6 shadow-xl relative text-right" style={{ direction: 'rtl' }}>
              <div className="flex justify-between items-center border-b border-[#30363D] pb-4 mb-5">
                <span className="bg-[#238636]/10 text-[#3FB950] border border-[#238636]/30 text-xs px-3 py-1 rounded-full font-bold">
                  بوابة تقارير الإشراف العام لمدير المشروع
                </span>
                <div className="flex space-x-1.5 space-x-reverse">
                  <button 
                    onClick={() => setPmSubTab('metrics')}
                    className={`text-xs px-3 py-1.5 rounded-xl transition-all font-sans font-bold cursor-pointer ${pmSubTab === 'metrics' ? 'bg-[#238636] text-white shadow-md' : 'bg-[#0D1117] border border-[#30363D] text-[#8B949E] hover:text-[#E0E2E6]'}`}
                  >
                    لوحة تحليلات الأداء والنسب
                  </button>
                  <button 
                    onClick={() => setPmSubTab('tables')}
                    className={`text-xs px-3 py-1.5 rounded-xl transition-all font-sans font-bold cursor-pointer ${pmSubTab === 'tables' ? 'bg-[#238636] text-white shadow-md' : 'bg-[#0D1117] border border-[#30363D] text-[#8B949E] hover:text-[#E0E2E6]'}`}
                  >
                     تصفح الجداول التشغيلية العشرة (Read-only) 🗃️
                  </button>
                </div>
              </div>

              {/* View Sub PM Tab: Metrics Performance charts */}
              {pmSubTab === 'metrics' && (
                <div className="space-y-4">
                  <div className="bg-[#0D1117] p-4 border border-[#30363D] rounded-2xl flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-bold text-sm">مستويات الإنجاز والنشاط العام للبرنامج</h4>
                      <p className="text-xs text-[#8B949E] leading-relaxed mt-1">
                        إحصائيات إتمام الخطط ونسب الأهداف المرصودة لخدمة (50 مريض نشط) بالمستشفيات الأربعة الشريكة في المنصة.
                      </p>
                    </div>
                    <span className="text-xs bg-[#238636]/10 border border-[#238636]/30 text-[#3FB950] px-3 py-1 rounded-full font-mono font-bold">
                      ReadOnly Live Feed
                    </span>
                  </div>

                  {/* Render Visual Recharts Graphs component we created */}
                  <ReportCharts patients={patients} />
                </div>
              )}

              {/* View Sub PM Tab: Protected 10 tables view */}
              {pmSubTab === 'tables' && (
                <div className="space-y-4">
                  <div className="bg-slate-950 p-4 border border-slate-800 rounded-2xl">
                    <label className="block text-xs text-lime-400 font-mono mb-2">
                       اختر الجدول التشغيلي للمعاينة التامة (حماية مطلقة من التعديل اليدوي)
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        '1. جدول المرضى',
                        '2. مرشدي الطاقم',
                        '3. تقييمات الأبعاد الـ 7',
                        '4. برامج الخطط',
                        '5. لقاءات وجلسات زوم',
                        '6. تنبيهات غياب المتاعبة',
                        '7. استشارات طبيب الأورام',
                        '8. استشارات الشيخ المفتي',
                        '9. خبير الوصايا والعدل',
                        '11. باث السجل للواتساب'
                      ].map((tName, idx) => (
                        <button
                          key={tName}
                          onClick={() => setSelectedTableIdx(idx)}
                          className={`text-[10px] sm:text-xs py-1.5 px-3 rounded-lg transition-all font-bold ${selectedTableIdx === idx ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'}`}
                        >
                          {tName}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Render Table contents depending on selectedTableIdx */}
                  <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden text-right">
                    
                    {selectedTableIdx === 0 && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-right">
                          <thead className="bg-[#0f172a] text-slate-400 border-b border-slate-800 font-bold">
                            <tr>
                              <th className="p-3">معرف المريض</th>
                              <th className="p-3">اسم المريض</th>
                              <th className="p-3">الجنس</th>
                              <th className="p-3">الهاتف الجوال</th>
                              <th className="p-3">المستشفى والأخصائي المعالج</th>
                              <th className="p-3 text-left">الحالة</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-850 text-slate-300">
                            {patients.slice(0, 10).map((p) => (
                              <tr key={p.id}>
                                <td className="p-3 font-mono text-slate-500">{p.id}</td>
                                <td className="p-3 font-bold text-white">{p.name}</td>
                                <td className="p-3">{p.gender === 'M' ? 'ذكر' : 'أنثى'}</td>
                                <td className="p-3 font-mono">{p.phone}</td>
                                <td className="p-3">{p.hospital} / {p.doctorName}</td>
                                <td className="p-3 text-left">
                                  <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400">{p.status}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {selectedTableIdx === 1 && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-right">
                          <thead className="bg-[#0f172a] text-slate-400 border-b border-slate-800 font-bold">
                            <tr>
                              <th className="p-3">المعرف</th>
                              <th className="p-3">اسم الموظف</th>
                              <th className="p-3">الدور واللقب</th>
                              <th className="p-3">الجنس</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-850 text-slate-300">
                            {staff.map((s) => (
                              <tr key={s.id}>
                                <td className="p-3 font-mono text-slate-500">{s.id}</td>
                                <td className="p-3 font-bold text-white">{s.name}</td>
                                <td className="p-3">{s.title}</td>
                                <td className="p-3">{s.gender === 'M' ? 'ذكر' : 'أنثى'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {selectedTableIdx === 2 && (
                      <div className="p-4 space-y-3">
                        <span className="text-[10px] text-emerald-400 font-bold block mb-1">عينات السبعة تقييمات التاريخية المسجلة</span>
                        {Object.entries(spiritualScores).map(([pId, scores]) => {
                          const pat = patients.find(p => p.id === pId);
                          const sc = scores as SpiritualDimensions;
                          return (
                            <div key={pId} className="bg-slate-900 p-3 rounded-xl border border-slate-805 space-y-1">
                              <div className="font-bold text-white text-xs">{pat?.name || 'مريض'}</div>
                              <div className="text-[10px] text-slate-400 leading-relaxed">التاريخ الروحي: {sc.spiritualHistory}</div>
                              <div className="text-[10px] text-slate-400 leading-relaxed font-sans">الاعتلالات الحالية: {sc.spiritualDistress}</div>
                              <div className="text-[10px] text-slate-400 leading-relaxed">التعزيز والرقية المقررة: {sc.spiritualReinforcement}</div>
                              <div className="text-[9px] text-slate-500 font-mono">تاريخ التقييم: {sc.evaluatedAt}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {selectedTableIdx === 3 && (
                      <div className="p-4 space-y-3">
                        {plans.map((p) => (
                          <div key={p.code} className="bg-slate-900 border border-slate-800 p-3 rounded-xl text-xs space-y-1">
                            <div className="flex justify-between items-center text-white font-bold">
                              <span>{p.title}</span>
                              <span className="bg-slate-850 px-1.5 py-0.5 rounded text-[9px] text-slate-400 font-mono">{p.code}</span>
                            </div>
                            <p className="text-slate-400 text-[11px] leading-relaxed">{p.description}</p>
                            <div className="pt-1.5 border-t border-slate-800 space-y-1.5">
                              {p.dailyMessages.map((msg, dIdx) => (
                                <div key={dIdx} className="text-[10px] text-slate-300 font-sans flex items-center justify-end">
                                  <span>{msg}</span>
                                  <span className="bg-slate-950 text-slate-500 font-mono px-1 py-0.5 rounded text-[8px] mr-2 ml-1">يوم {dIdx+1}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedTableIdx === 4 && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-right">
                          <thead className="bg-[#0f172a] text-slate-400 border-b border-slate-800 font-bold">
                            <tr>
                              <th className="p-3">معرف اللقاء</th>
                              <th className="p-3">المستفيد</th>
                              <th className="p-3">الخطة المعنية</th>
                              <th className="p-3">تاريخ الجلسة</th>
                              <th className="p-3">رابط زووم الرقمي</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-850 text-slate-300">
                            {sessions.map((s) => {
                              const pat = patients.find(p => p.id === s.patientId);
                              return (
                                <tr key={s.id}>
                                  <td className="p-3 font-mono text-slate-500">{s.id}</td>
                                  <td className="p-3 font-bold text-white">{pat?.name || 'مستفيد'}</td>
                                  <td className="p-3 font-mono">{s.assignedPlanCode}</td>
                                  <td className="p-3 font-mono">{s.date}</td>
                                  <td className="p-3 font-sans">
                                    {s.zoomLink ? (
                                      <a href={s.zoomLink} target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline flex items-center space-x-1 justify-end">
                                        <ExternalLink size={11} className="mr-1" />
                                        <span>طلب حضور اللقاء</span>
                                      </a>
                                    ) : 'انتهى ومغلق'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {selectedTableIdx === 5 && (
                      <div className="p-4 space-y-3">
                        {alerts.map((al) => {
                          const pat = patients.find(p => p.id === al.patientId);
                          return (
                            <div key={al.id} className="bg-slate-900 border border-slate-850 p-3 rounded-xl flex justify-between items-center text-xs">
                              <div>
                                <span className="font-bold text-white text-sm">{pat?.name}</span>
                                <p className="text-[11px] text-slate-500 mt-0.5">بدأ التنبيه: {al.startedAt}</p>
                              </div>
                              <span className="bg-red-950 text-red-400 font-bold px-3 py-1 rounded-lg border border-red-900 text-[10px]">
                                {al.status}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {selectedTableIdx === 6 && (
                      <div className="p-4 space-y-4">
                        {consultations.filter(c => c.type === 'medical').map((c) => {
                          const pat = patients.find(p => p.id === c.patientId);
                          return (
                            <div key={c.id} className="bg-slate-900 rounded-xl p-3 border border-slate-800 space-y-2">
                              <div className="flex justify-between items-center border-b border-slate-800 pb-1 text-[11px]">
                                <span className="font-bold text-white">{pat?.name || 'مريض'}</span>
                                <span className="text-slate-500 font-mono">{c.submittedAt}</span>
                              </div>
                              <p className="text-slate-200 text-xs">{c.question}</p>
                              {c.answer && <div className="p-2 rounded bg-emerald-950/40 text-emerald-300 text-[11px]">الرد: {c.answer}</div>}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {selectedTableIdx === 7 && (
                      <div className="p-4 space-y-4">
                        {consultations.filter(c => c.type === 'jurist').map((c) => {
                          const pat = patients.find(p => p.id === c.patientId);
                          return (
                            <div key={c.id} className="bg-slate-900 rounded-xl p-3 border border-slate-800 space-y-2">
                              <div className="flex justify-between items-center border-b border-slate-800 pb-1 text-[11px]">
                                <span className="font-bold text-white">{pat?.name || 'مريض'}</span>
                                <span className="text-slate-500 font-mono">{c.submittedAt}</span>
                              </div>
                              <p className="text-slate-200 text-xs">{c.question}</p>
                              {c.answer && <div className="p-2 rounded bg-emerald-950/40 text-emerald-300 text-[11px]">الرد الفقهي: {c.answer}</div>}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {selectedTableIdx === 8 && (
                      <div className="p-4 space-y-4">
                        {consultations.filter(c => c.type === 'wills').map((c) => {
                          const pat = patients.find(p => p.id === c.patientId);
                          return (
                            <div key={c.id} className="bg-slate-900 rounded-xl p-3 border border-slate-800 space-y-2">
                              <div className="flex justify-between items-center border-b border-slate-800 pb-1 text-[11px]">
                                <span className="font-bold text-white">{pat?.name || 'مريض'}</span>
                                <span className="text-slate-500 font-mono">{c.submittedAt}</span>
                              </div>
                              <p className="text-slate-200 text-xs">{c.question}</p>
                              {c.answer && <div className="p-2 rounded bg-emerald-950/40 text-emerald-300 text-[11px]">الرد العدلي: {c.answer}</div>}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {selectedTableIdx === 9 && (
                      <div className="p-4 max-h-[300px] overflow-y-auto space-y-2">
                        {whatsAppLogs.slice(-15).map((log) => {
                          const pat = patients.find(p => p.id === log.patientId);
                          return (
                            <div key={log.id} className="bg-slate-900 p-2.5 rounded-lg text-[10px] space-y-1">
                              <div className="flex justify-between items-center border-b border-slate-850 pb-1">
                                <span className="text-slate-300 font-bold mb-0.5">{pat?.name} [{log.sender}]</span>
                                <span className="text-slate-500 font-mono">{log.timestamp}</span>
                              </div>
                              <p className="text-slate-400 text-right leading-relaxed font-sans">{log.content}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}

                  </div>
                </div>
              )}

            </div>
          )}

        </section>

      </main>

      {/* Dynamic footer copyright */}
      <footer className="mt-12 py-6 border-t border-slate-850 max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-xs text-slate-500 space-y-4 md:space-y-0 text-right">
        <div>
          توتيق كامل لـ 10 جداول إحصائية تشغيلية حماية تامة للحقوق الفقهية والطبية بالتعاضد مع المشافي السعودية 🛡️
        </div>
        <div>
          حقوق الطبع محفوظة © {new Date().getFullYear()} منصة لطيف للدعم الروحي الرقمي التأسيس الإرشادي
        </div>
      </footer>

    </div>
  );
}

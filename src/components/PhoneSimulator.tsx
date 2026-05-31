/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Send, CheckCheck, Landmark, ShieldCheck, Phone, Video, MoreVertical, Smartphone, Info, AlertTriangle } from 'lucide-react';
import { Patient, WhatsAppLog, JurisprudentialFile } from '../types';

interface PhoneSimulatorProps {
  patients: Patient[];
  whatsAppLogs: WhatsAppLog[];
  jurisprudentialFile: JurisprudentialFile;
  onNewLog: (log: WhatsAppLog) => void;
  onTriggerAbsenceAlert: (patientId: string) => void;
  onAddConsultation: (patientId: string, question: string, type: 'medical' | 'jurist' | 'wills') => void;
}

export default function PhoneSimulator({
  patients,
  whatsAppLogs,
  jurisprudentialFile,
  onNewLog,
  onTriggerAbsenceAlert,
  onAddConsultation
}: PhoneSimulatorProps) {
  const [selectedPatientId, setSelectedPatientId] = useState<string>('pat-1');
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Active patient object
  const activePatient = patients.find(p => p.id === selectedPatientId) || patients[0];

  // Filter logs for selected patient
  const filteredLogs = whatsAppLogs.filter(log => log.patientId === (activePatient?.id || ''));

  // Auto-scroll to bottom of chats
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [filteredLogs]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activePatient) return;

    const userMsg = inputText.trim();
    setInputText('');

    // 1. Add Patient's Sent Message
    const patientLog: WhatsAppLog = {
      id: `wa-user-${Date.now()}`,
      patientId: activePatient.id,
      phone: activePatient.phone,
      sender: 'PATIENT',
      content: userMsg,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      isRead: true
    };
    onNewLog(patientLog);

    setIsLoading(true);

    try {
      // 2. Call backend route
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          jurisprudentialFile: jurisprudentialFile.content
        })
      });

      const data = await response.json();

      if (data.escalate) {
        // AI detected it as a complex jurisprudence/medical/wills question
        // 3. Add system explanation reply
        const botExplainLog: WhatsAppLog = {
          id: `wa-bot-${Date.now()}`,
          patientId: activePatient.id,
          phone: activePatient.phone,
          sender: 'SYSTEM',
          content: data.answer,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
          isRead: true
        };
        onNewLog(botExplainLog);

        // 4. Create proper specialist consultation
        const type: 'medical' | 'jurist' | 'wills' = determineSpecialistType(userMsg);
        onAddConsultation(activePatient.id, userMsg, type);
      } else {
        // Standard AI answer from approved file
        const botReplyLog: WhatsAppLog = {
          id: `wa-bot-${Date.now()}`,
          patientId: activePatient.id,
          phone: activePatient.phone,
          sender: 'SYSTEM',
          content: data.answer,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
          isRead: true
        };
        onNewLog(botReplyLog);
      }
    } catch (err) {
      console.error("AI chatbot error, generating intelligent mock answer", err);
      // Fallback
      simulateFallbackResponse(userMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const determineSpecialistType = (msg: string): 'medical' | 'jurist' | 'wills' => {
    const text = msg.toLowerCase();
    if (text.includes('طبيب') || text.includes('دكتور') || text.includes('ألم') || text.includes('وجع') || text.includes('غثيان') || text.includes('علاج')) {
      return 'medical';
    }
    if (text.includes('وصية') || text.includes('وقف') || text.includes('عدل') || text.includes('ميراث') || text.includes('أسهم') || text.includes('تركة')) {
      return 'wills';
    }
    return 'jurist'; // Default to jurist
  };

  const simulateFallbackResponse = (userMsg: string) => {
    setTimeout(() => {
      let reply = "أهلاً بك يا أخي الكريم. تم استرجاع تفاصيل تيسير الطهارة والصلاة للمريض من ملفنا الشرعي المعتمد: يجوز لك التيمم بالصخر أو التراب الطاهر المتاح بغرفتك بالمستشفى طالما شق عليك الوضوء بالماء.";
      if (userMsg.includes('جبيرة') || userMsg.includes('مسح')) {
        reply = "يرخص لك المسح على الجبيرة طوال الأيام العلاجية ولا يلزمك نزعها للوضوء طالما قرر الأطباء خطورتها على سلامتك البدنية.";
      } else if (userMsg.includes('جمع') || userMsg.includes('قصر')) {
        reply = "تيسيراً على مرضانا، يجوز لك جمع الظهر مع العصر والمغرب مع العشاء لرفع مشقة الحركة عن كاهلك بسبب العلاج الكثيف.";
      } else if (userMsg.includes('وصية') || userMsg.includes('وقف') || userMsg.includes('ميراث')) {
        reply = "هذه مسألة وصايا واستحقاق مالي دقيق. تم توجيه استشارتك فوراً للمستشار عبد الله الدوسري (خبير الوصايا والمسائل العدلية) لدراستها وموافاتك بالنموذج العدلي الصياغي المعتمد بالمملكة.";
        onAddConsultation(activePatient.id, userMsg, 'wills');
      } else if (userMsg.includes('طبيب') || userMsg.includes('دكتور')) {
        reply = "تم تمييز استشارتك كمسألة طبية حرجة، وجاري إرسالها للأطباء الاستشاريين المشرفين على المنصة لمراجعتها بدقة والرد السريع عليك.";
        onAddConsultation(activePatient.id, userMsg, 'medical');
      }

      onNewLog({
        id: `wa-bot-fall-${Date.now()}`,
        patientId: activePatient.id,
        phone: activePatient.phone,
        sender: 'SYSTEM',
        content: reply,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        isRead: true
      });
    }, 1000);
  };

  const triggerAbsence = () => {
    if (activePatient) {
      onTriggerAbsenceAlert(activePatient.id);
    }
  };

  return (
    <div className="bg-[#111419] border border-[#30363D] rounded-3xl p-4 shadow-2xl text-[#E0E2E6] flex flex-col h-[650px] relative">
      {/* Selector of Patient Context */}
      <div className="mb-3 px-1">
        <label className="block text-xs text-[#3ACADF] font-mono mb-1 text-right font-bold">
          ❖ تفاعلات المريض بالواتساب (اختر المريض للعرض)
        </label>
        <select
          value={selectedPatientId}
          onChange={(e) => setSelectedPatientId(e.target.value)}
          className="w-full bg-[#0D1117] border border-[#30363D] text-sm text-[#E0E2E6] rounded-lg py-1.5 px-3 text-right focus:outline-none focus:border-[#3ACADF]"
        >
          {patients.map(p => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.gender === 'M' ? 'ذكر' : 'أنثى'} - {p.phone})
            </option>
          ))}
        </select>
      </div>

      {/* Styled Smartphone Container */}
      <div className="flex-1 bg-[#0D1117] rounded-2xl border-4 border-[#30363D] overflow-hidden flex flex-col relative">
        {/* Phone Header Indicator */}
        <div className="bg-[#161B22] px-3 py-2 text-right text-xs flex justify-between items-center border-b border-[#22272E]">
          <div className="flex space-x-2 text-[#8B949E]">
            <Phone size={12} className="cursor-pointer hover:text-white" />
            <Video size={12} className="cursor-pointer hover:text-white" />
            <MoreVertical size={12} className="cursor-pointer hover:text-white" />
          </div>
          <div className="text-right">
            <div className="font-bold text-white text-[11px] truncate max-w-[150px]">
              {/* Privacy Rule: Hide actual guide name from patient, only system representative 'لطيف للدعم الروحي' */}
              لطيف للدعم الروحي الرقمي
            </div>
            <div className="text-[9px] text-[#3ACADF] font-mono font-bold">متصل الآن • آمن ومشفر</div>
          </div>
        </div>

        {/* WhatsApp Chat Body */}
        <div className="flex-1 p-3 overflow-y-auto space-y-2.5 flex flex-col bg-[#0A0C10] bg-[radial-gradient(#1C2128_1px,transparent_1px)] [background-size:16px_16px]">
          {filteredLogs.length === 0 ? (
            <div className="text-center text-[#8B949E] text-xs my-auto italic flex flex-col items-center justify-center p-4">
              <Smartphone size={32} className="text-[#30363D] mb-2" />
              لا رسائل متبادلة بعد.
              <br />
              (قم بتفعيل الخطة للمريض عبر واجهة المرشد لإرسال رسالة الترحيب الأولى!)
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isPatient = log.sender === 'PATIENT';
              return (
                <div
                  key={log.id}
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                    isPatient
                      ? 'bg-[#1C2128] text-[#E0E2E6] self-start text-left rounded-tl-none border border-[#30363D]'
                      : 'bg-[#15231c] text-[#3FB950] self-end text-right rounded-tr-none border border-[#238636]/60'
                  }`}
                  style={{ direction: isPatient ? 'ltr' : 'rtl' }}
                >
                  {/* Sender title if system/expert */}
                  {!isPatient && (
                    <div className="text-[9px] text-[#3ACADF] font-bold mb-0.5 flex items-center justify-end font-mono">
                      <span>البوت الآلي الشرعي</span>
                      <ShieldCheck size={11} className="ml-1 text-[#3ACADF]" />
                    </div>
                  )}
                  {isPatient && (
                    <div className="text-[9px] text-[#8B949E] font-bold mb-0.5 flex items-center">
                      <span>{activePatient?.name}</span>
                    </div>
                  )}

                  {/* Message Content */}
                  <div className="whitespace-pre-line text-right text-[#E0E2E6]" style={{ direction: 'rtl' }}>
                    {log.content}
                  </div>

                  {/* Timestamp and Double Check */}
                  <div className="text-[8px] text-[#57606A] mt-1 flex items-center justify-end space-x-1 font-mono">
                    <span>{log.timestamp.split(' ')[1] || log.timestamp}</span>
                    {!isPatient && <CheckCheck size={10} className="text-[#3ACADF] ml-1" />}
                  </div>
                </div>
              );
            })
          )}
          {isLoading && (
            <div className="bg-[#15231c]/50 text-[#3FB950] rounded-xl px-3 py-2 text-xs self-end text-right rounded-tr-none border border-[#238636] border-dashed animate-pulse w-[100px]">
              جاري صياغة الرد...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-2 bg-[#111419] border-t border-[#30363D] flex items-center space-x-1.5">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={activePatient ? `اكتب رسالة من ${activePatient.name}...` : "اختر مريضاً أولاً"}
            disabled={!activePatient}
            className="flex-1 bg-[#0D1117] border border-[#30363D] text-xs text-[#E0E2E6] rounded-xl px-3 py-2 text-right focus:outline-none focus:border-[#3ACADF]"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading || !activePatient}
            className="bg-[#238636] hover:bg-[#2EA043] disabled:bg-[#1C2128] disabled:text-[#57606A] p-2 rounded-xl text-white transition-all focus:outline-none cursor-pointer"
          >
            <Send size={13} className="transform rotate-180" />
          </button>
        </form>
      </div>

      {/* Interactive Helper / Absence Simulator Box */}
      <div className="mt-3 bg-[#F85149]/5 border border-[#F85149]/20 rounded-xl p-2.5 text-xs text-[#E0E2E6] flex flex-col space-y-1 text-right">
        <div className="flex items-center justify-end text-[#F85149] font-bold">
          <span>محاكاة نظام تنبيهات الغياب (48 ساعة)</span>
          <AlertTriangle size={13} className="ml-1" />
        </div>
        <p className="text-[11px] leading-relaxed text-[#8B949E]">
          اضغط لمحاكاة غياب المريض عن الرد ليومين متتاليين. سيطلق الأدمن إنذاراً باللون الأحمر لحث الطاقم على اتخاذ القرار.
        </p>
        <button
          onClick={triggerAbsence}
          disabled={!activePatient}
          className="mt-1 bg-[#F85149] hover:bg-[#F85149]/85 disabled:bg-[#1C2128] disabled:text-[#57606A] text-white font-bold py-1 px-3.5 rounded-lg transition-all text-[11px] cursor-pointer"
        >
          إطلاق تنبيه غياب لـ {activePatient?.name || "المريض"} 🔴
        </button>
      </div>
    </div>
  );
}

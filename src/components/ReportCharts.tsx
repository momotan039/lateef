/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Patient } from '../types';

interface ReportChartsProps {
  patients: Patient[];
}

export default function ReportCharts({ patients }: ReportChartsProps) {
  // 1. Calculate general numbers
  const total = patients.length;
  const active = patients.filter(p => p.status === 'نشط').length;
  const completed = patients.filter(p => p.status === 'مكتمل').length;
  const closed = patients.filter(p => p.status === 'مغلق').length;

  const targetPatients = 50;
  const progressPercent = Math.min(Math.round((active / targetPatients) * 100), 100);

  // 2. Group by Hospital
  const hospitalCounts = patients.reduce((acc, p) => {
    acc[p.hospital] = (acc[p.hospital] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const hospitalColors = ['#238636', '#3ACADF', '#f59e0b', '#ec4899'];
  const hospitalData = [
    { name: 'التخصصي', count: hospitalCounts['مستشفى الملك فيصل التخصصي'] || 0, fill: hospitalColors[0] },
    { name: 'المدنية الطبية', count: hospitalCounts['مدينة الملك سعود الطبية'] || 0, fill: hospitalColors[1] },
    { name: 'مستشفى فهد', count: hospitalCounts['مستشفى الملك فهد'] || 0, fill: hospitalColors[2] },
    { name: 'الحرس الوطني', count: hospitalCounts['مستشفى الحرس الوطني'] || 0, fill: hospitalColors[3] }
  ];

  // 3. Group by Status
  const statusData = [
    { name: 'نشط', value: active, color: '#3ACADF' },
    { name: 'مكتمل', value: completed, color: '#238636' },
    { name: 'مغلق', value: closed, color: '#8B949E' }
  ];

  return (
    <div className="space-y-6 text-right" style={{ direction: 'rtl' }}>
      
      {/* 4 Cards Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-[#111419] border border-[#30363D] p-4 rounded-2xl flex flex-col items-center justify-center shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-[#3ACADF]/5 blur-xl"></div>
          <span className="text-xs text-[#8B949E] font-medium">العدد الإجمالي للمسجلين</span>
          <span className="text-3xl font-extrabold text-[#E0E2E6] mt-1 font-mono">{total}</span>
          <span className="text-[10px] text-[#238636] mt-1">✓ سجل تاريخي تراكمي</span>
        </div>

        <div className="bg-[#111419] border border-[#30363D] p-4 rounded-2xl flex flex-col items-center justify-center shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-[#238636]/5 blur-xl"></div>
          <span className="text-xs text-[#3ACADF] font-medium font-bold">المرضى النشطين حالياً</span>
          <div className="flex items-baseline space-x-1 mt-1">
            <span className="text-xs text-[#57606A] font-mono">/ {targetPatients}</span>
            <span className="text-3xl font-extrabold text-[#3ACADF] font-mono shadow-[0_0_15px_rgba(58,202,223,0.1)]">{active}</span>
          </div>
          <div className="w-full bg-[#1C2128] h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-[#3ACADF] h-full transition-all shadow-[0_0_8px_rgba(58,202,223,0.5)]" style={{ width: `${progressPercent}%` }}></div>
          </div>
          <span className="text-[9px] text-[#8B949E] mt-1">{progressPercent}% من الهدف (50 مريض)</span>
        </div>

        <div className="bg-[#111419] border border-[#30363D] p-4 rounded-2xl flex flex-col items-center justify-center shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-[#238636]/5 blur-xl"></div>
          <span className="text-xs text-[#238636] font-medium font-sans">خطط علاجية مكتملة</span>
          <span className="text-3xl font-extrabold text-[#3FB950] mt-1 font-mono">{completed}</span>
          <span className="text-[10px] text-[#3FB950] mt-1">📦 إيجابية عالية ونقاهة</span>
        </div>

        <div className="bg-[#111419] border border-[#30363D] p-4 rounded-2xl flex flex-col items-center justify-center shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-[#F85149]/5 blur-xl"></div>
          <span className="text-xs text-[#8B949E] font-medium font-sans">ملفات علاجية مغلقة</span>
          <span className="text-3xl font-extrabold text-[#E0E2E6] mt-1 font-mono">{closed}</span>
          <span className="text-[10px] text-[#8B949E] mt-1">🔒 استقرار أو مغادرة تامة</span>
        </div>

      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Hospital Distribution */}
        <div className="bg-[#111419] border border-[#30363D] p-4 rounded-2xl shadow-xl flex flex-col">
          <h4 className="text-sm font-bold text-[#E0E2E6] mb-4 border-r-4 border-[#3ACADF] pr-2">
            توزيع المستفيدين حسب المستشفيات الشريكة
          </h4>
          <div className="h-[220px] w-full mt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hospitalData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#22272E" />
                <XAxis dataKey="name" stroke="#8B949E" fontSize={11} tickLine={false} />
                <YAxis stroke="#8B949E" fontSize={11} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111419', border: '1px solid #30363D', borderRadius: '8px' }}
                  labelStyle={{ color: '#E0E2E6', fontSize: '11px', textAlign: 'right' }}
                  itemStyle={{ color: '#3ACADF', fontSize: '11px', textAlign: 'right' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {hospitalData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-[#111419] border border-[#30363D] p-4 rounded-2xl shadow-xl flex flex-col">
          <h4 className="text-sm font-bold text-[#E0E2E6] mb-4 border-r-4 border-emerald-500 pr-2">
            نسب حالات المتابعة التشغيلية الراهنة
          </h4>
          <div className="h-[220px] w-full flex flex-col sm:flex-row items-center justify-between">
            <div className="h-full w-full sm:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111419', border: '1px solid #30363D', borderRadius: '8px' }}
                    itemStyle={{ fontSize: '11px', color: '#E0E2E6' }}
                  />
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Status Legend */}
            <div className="w-full sm:w-1/2 p-2 space-y-2 text-right">
              {statusData.map((st) => (
                <div key={st.name} className="flex justify-between items-center bg-[#0D1117] px-2.5 py-1.5 rounded-lg border border-[#22272E]">
                  <div className="flex items-center space-x-1.5" style={{ direction: 'ltr' }}>
                    <span className="text-[#E0E2E6] font-mono font-bold text-xs">{st.value}</span>
                    <span className="text-[10px] text-[#57606A] font-sans">({Math.round((st.value / (total || 1)) * 100)}%)</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs text-[#8B949E] font-sans font-medium mr-2">{st.name}</span>
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: st.color }}></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

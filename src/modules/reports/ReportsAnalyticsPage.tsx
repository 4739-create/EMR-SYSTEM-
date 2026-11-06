import React from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  Users,
  Activity,
  DollarSign,
  HeartPulse,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useEMR } from '../../hooks/useEMR';
import { formatCurrency } from '../../utils';

const ADMISSIONS_DATA = [
  { month: 'Jun', outpatients: 420, inpatients: 80, emergency: 45 },
  { month: 'Jul', outpatients: 460, inpatients: 95, emergency: 50 },
  { month: 'Aug', outpatients: 510, inpatients: 110, emergency: 60 },
  { month: 'Sep', outpatients: 490, inpatients: 105, emergency: 55 },
  { month: 'Oct', outpatients: 530, inpatients: 120, emergency: 65 },
  { month: 'Nov (MTD)', outpatients: 580, inpatients: 135, emergency: 70 },
];

const REVENUE_BY_DEPT = [
  { name: 'Cardiology', value: 34000, color: '#0284c7' },
  { name: 'Surgery', value: 28000, color: '#0f172a' },
  { name: 'Emergency', value: 22000, color: '#e11d48' },
  { name: 'Laboratory', value: 18000, color: '#8b5cf6' },
  { name: 'Pharmacy', value: 16000, color: '#10b981' },
];

export const ReportsAnalyticsPage: React.FC = () => {
  const { patients, appointments, invoices, departments } = useEMR();

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Metric,Value\n' +
      `Total Registered Patients,${patients.length}\n` +
      `Active Appointments,${appointments.length}\n` +
      `Total Invoiced,${invoices.reduce((s, i) => s + i.totalAmount, 0)}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'hospital_clinical_analytics.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-sky-50 text-sky-600 rounded-lg">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Hospital Executive Analytics & BI
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Clinical volume trends, departmental resource utilization & revenue analytics
            </p>
          </div>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs"
        >
          <Download className="h-4 w-4" />
          <span>Export Analytics Report (CSV)</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Avg Inpatient Length of Stay</span>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">3.8 Days</h3>
          <p className="text-[10px] text-emerald-600 mt-1">↓ 0.4 days vs regional benchmark</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Stat Lab Turnaround Time</span>
          <h3 className="text-2xl font-bold text-sky-600 mt-1">42 Minutes</h3>
          <p className="text-[10px] text-emerald-600 mt-1">Target: &lt; 60 minutes (Compliant)</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Bed Occupancy Rate</span>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">78.4%</h3>
          <p className="text-[10px] text-slate-400 mt-1">168 of 225 licensed beds occupied</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Patient Satisfaction Score</span>
          <h3 className="text-2xl font-bold text-emerald-600 mt-1">94.8%</h3>
          <p className="text-[10px] text-slate-400 mt-1">Based on HCAHPS clinical survey</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Admission Volume Area Chart */}
        <div className="lg:col-span-8 bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Monthly Patient Volume by Encounter Stream</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ADMISSIONS_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="outpatients" stackId="1" stroke="#0284c7" fill="#0284c7" fillOpacity={0.6} />
                <Area type="monotone" dataKey="inpatients" stackId="1" stroke="#0f172a" fill="#0f172a" fillOpacity={0.6} />
                <Area type="monotone" dataKey="emergency" stackId="1" stroke="#e11d48" fill="#e11d48" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div className="lg:col-span-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Departmental Revenue Share</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={REVENUE_BY_DEPT}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {REVENUE_BY_DEPT.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            {REVENUE_BY_DEPT.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600">{item.name}</span>
                </div>
                <span className="font-bold font-mono text-slate-800">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

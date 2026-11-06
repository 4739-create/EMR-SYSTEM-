import React, { useState, useMemo } from 'react';
import {
  Users,
  Calendar,
  Stethoscope,
  HeartPulse,
  Bed,
  FlaskConical,
  Pill,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  Clock,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  PlusCircle,
  QrCode,
  FileText,
  Activity,
  Building2,
  Search,
  Copy,
  Check,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useEMR } from '../../hooks/useEMR';
import { Badge } from '../../components/ui/Badge';
import { formatCurrency } from '../../utils';

export const DashboardPage: React.FC = () => {
  const {
    patients,
    appointments,
    staff,
    labTests,
    medications,
    invoices,
    departments,
    auditLogs,
    currentUser,
    refresh,
  } = useEMR();
  const navigate = useNavigate();

  const [timeRange, setTimeRange] = useState<'today' | '7days' | '30days'>('7days');
  const [appointmentFilter, setAppointmentFilter] = useState<'All' | 'In Consultation' | 'Checked In' | 'Scheduled'>('All');
  const [queueSearch, setQueueSearch] = useState('');
  const [copiedMRN, setCopiedMRN] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Computed statistics
  const totalPatients = patients.length;
  const activeInpatients = patients.filter((p) => p.status === 'Inpatient' || p.status === 'Emergency').length;
  const outpatientsCount = totalPatients - activeInpatients;
  const doctorsCount = staff.filter((s) => s.role === 'Doctor').length;
  const nursesCount = staff.filter((s) => s.role === 'Nurse').length;
  
  const todayAppointments = appointments; // mock demonstration
  const pendingLabs = labTests.filter((t) => t.status !== 'Completed').length;
  const statUrgentLabs = labTests.filter((t) => t.urgency === 'Stat (Immediate)' && t.status !== 'Completed').length;
  const lowStockMeds = medications.filter((m) => m.currentStock <= m.minimumStock).length;

  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
  const outstandingRevenue = invoices.reduce((sum, inv) => sum + inv.balanceDue, 0);
  const totalBilled = totalRevenue + outstandingRevenue;
  const collectionPercentage = totalBilled > 0 ? Math.round((totalRevenue / totalBilled) * 100) : 100;

  // Bed capacity
  const totalBeds = departments.reduce((sum, d) => sum + d.bedCapacity, 0);
  const occupiedBeds = departments.reduce((sum, d) => sum + d.currentOccupancy, 0);
  const availableBeds = Math.max(0, totalBeds - occupiedBeds);
  const bedOccupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  // Consultation breakdown
  const inConsultationCount = todayAppointments.filter((a) => a.status === 'In Consultation').length;
  const waitingCount = todayAppointments.filter((a) => a.status === 'Checked In').length;
  const completedCount = todayAppointments.filter((a) => a.status === 'Completed').length;

  // Chart datasets
  const chartDatasets: Record<'today' | '7days' | '30days', Array<{ label: string; admissions: number; discharges: number; emergency: number }>> = {
    today: [
      { label: '08:00', admissions: 3, discharges: 1, emergency: 2 },
      { label: '10:00', admissions: 6, discharges: 4, emergency: 5 },
      { label: '12:00', admissions: 8, discharges: 7, emergency: 4 },
      { label: '14:00', admissions: 11, discharges: 9, emergency: 6 },
      { label: '16:00', admissions: 7, discharges: 12, emergency: 8 },
      { label: '18:00', admissions: 5, discharges: 6, emergency: 7 },
      { label: '20:00', admissions: 3, discharges: 2, emergency: 4 },
    ],
    '7days': [
      { label: 'Mon', admissions: 12, discharges: 9, emergency: 6 },
      { label: 'Tue', admissions: 18, discharges: 14, emergency: 10 },
      { label: 'Wed', admissions: 15, discharges: 12, emergency: 8 },
      { label: 'Thu', admissions: 22, discharges: 16, emergency: 12 },
      { label: 'Fri', admissions: 20, discharges: 19, emergency: 9 },
      { label: 'Sat', admissions: 14, discharges: 11, emergency: 14 },
      { label: 'Sun', admissions: 11, discharges: 8, emergency: 7 },
    ],
    '30days': [
      { label: 'Week 1', admissions: 95, discharges: 84, emergency: 52 },
      { label: 'Week 2', admissions: 112, discharges: 104, emergency: 61 },
      { label: 'Week 3', admissions: 128, discharges: 115, emergency: 74 },
      { label: 'Week 4', admissions: 106, discharges: 98, emergency: 58 },
    ],
  };

  const currentChartData = chartDatasets[timeRange];

  // Filtered Appointments
  const filteredAppointments = useMemo(() => {
    return todayAppointments.filter((apt) => {
      const matchesTab = appointmentFilter === 'All' || apt.status === appointmentFilter;
      const matchesSearch =
        queueSearch.trim() === '' ||
        apt.patientName.toLowerCase().includes(queueSearch.toLowerCase()) ||
        apt.patientMrn.toLowerCase().includes(queueSearch.toLowerCase()) ||
        apt.doctorName.toLowerCase().includes(queueSearch.toLowerCase()) ||
        apt.department.toLowerCase().includes(queueSearch.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [todayAppointments, appointmentFilter, queueSearch]);

  const handleCopyMRN = (mrn: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(mrn);
    setCopiedMRN(mrn);
    setTimeout(() => setCopiedMRN(null), 2000);
  };

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    refresh();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* 1. Executive Clinical Command Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 text-white p-6 shadow-xl shadow-slate-950/20">
        {/* Subtle decorative background glow */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Left Title & System Status */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30 font-semibold tracking-wide uppercase text-[11px]">
                <Building2 className="h-3.5 w-3.5 text-sky-400" />
                Apex Metropolitan Medical Center
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-semibold text-[11px]">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Clinical Node • HL7 Active
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[11px] font-mono border border-slate-700/60">
                <ShieldCheck className="h-3 w-3 text-emerald-400" />
                Level 1 Trauma Verified
              </span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                Hospital Clinical Overview
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Real-time clinical census, ward bed capacity, outpatient triage queue, and hospital operational metrics.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-300">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-sky-400" />
                <span>Morning Shift (07:00 – 15:30)</span>
              </div>
              <span className="text-slate-600">•</span>
              <div className="flex items-center gap-1.5">
                <Stethoscope className="h-3.5 w-3.5 text-teal-400" />
                <span>On-Duty Lead: <strong className="text-slate-200">{currentUser.name.split(',')[0]}</strong></span>
              </div>
              <span className="text-slate-600">•</span>
              <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <Activity className="h-3.5 w-3.5" />
                <span>Code Status: Normal Flow</span>
              </div>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
            <button
              onClick={() => navigate('/patients/register')}
              className="flex items-center gap-2 px-4 py-2.5 bg-linear-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Admit / Register Patient</span>
            </button>

            <button
              onClick={() => navigate('/appointments')}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Calendar className="h-4 w-4 text-sky-400" />
              <span>Schedule Visit</span>
            </button>

            <button
              onClick={() => navigate('/qr-module')}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-850 hover:bg-slate-800 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-slate-700/80 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <QrCode className="h-4 w-4 text-amber-400" />
              <span>Scan Wristband</span>
            </button>

            <button
              onClick={handleManualRefresh}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700/80 transition"
              title="Refresh telemetry"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-sky-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Critical Alert & Emergency Department Triage Bar */}
      {statUrgentLabs > 0 && (
        <div className="rounded-xl border border-amber-300/80 bg-linear-to-r from-amber-50 via-amber-50/70 to-orange-50 p-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0 border border-amber-300">
                <AlertTriangle className="h-5 w-5 text-amber-600 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded">
                    Stat Lab Alert
                  </span>
                  <span className="text-xs font-semibold text-slate-800">
                    {statUrgentLabs} Critical diagnostic assay{statUrgentLabs > 1 ? 's' : ''} awaiting immediate physician review
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Troponin-I serial draw for patient Eleanor Vanderbilt (Ward 3B, Bed 302) requires sign-off.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => navigate('/laboratory')}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
              >
                <FlaskConical className="h-3.5 w-3.5" />
                <span>Open Pathology Orders</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Primary KPI Metric Cards (Modern 4-Column Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Registered Patients */}
        <div
          onClick={() => navigate('/patients')}
          className="group relative bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-lg hover:border-sky-300/80 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Patient Census
              </span>
              <div className="h-10 w-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:bg-sky-600 group-hover:text-white transition-all shadow-xs">
                <Users className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-3 flex items-baseline justify-between">
              <div className="text-3xl font-black text-slate-900 tracking-tight">
                {totalPatients}
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <TrendingUp className="h-3.5 w-3.5" />
                +12.4%
              </span>
            </div>

            {/* Inpatient vs Outpatient census ratio bar */}
            <div className="mt-3.5">
              <div className="flex justify-between text-[11px] font-medium text-slate-500 mb-1.5">
                <span>Inpatients: <strong className="text-slate-800">{activeInpatients}</strong></span>
                <span>Outpatients: <strong className="text-slate-800">{outpatientsCount}</strong></span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                <div
                  className="bg-sky-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(activeInpatients / Math.max(1, totalPatients)) * 100}%` }}
                  title={`Inpatients: ${activeInpatients}`}
                />
                <div
                  className="bg-indigo-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(outpatientsCount / Math.max(1, totalPatients)) * 100}%` }}
                  title={`Outpatients: ${outpatientsCount}`}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 group-hover:text-sky-600 transition">
            <span>Avg Length of Stay: 3.4 days</span>
            <ArrowUpRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </div>

        {/* Card 2: Today's Consultations */}
        <div
          onClick={() => navigate('/appointments')}
          className="group relative bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-lg hover:border-indigo-300/80 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Today’s Consultations
              </span>
              <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-xs">
                <Calendar className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-3 flex items-baseline justify-between">
              <div className="text-3xl font-black text-slate-900 tracking-tight">
                {todayAppointments.length}
              </div>
              <span className="text-xs font-medium text-slate-500">
                Scheduled for today
              </span>
            </div>

            {/* Consultation status chips */}
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse" />
                {inConsultationCount} Active
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                {waitingCount} In Queue
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {completedCount} Done
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 group-hover:text-indigo-600 transition">
            <span>Avg Wait Time: <strong>14 min</strong></span>
            <ArrowUpRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </div>

        {/* Card 3: Ward Bed Occupancy */}
        <div
          onClick={() => navigate('/admin')}
          className="group relative bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-lg hover:border-rose-300/80 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Ward Bed Occupancy
              </span>
              <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-all shadow-xs">
                <Bed className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-3 flex items-baseline justify-between">
              <div className="text-3xl font-black text-slate-900 tracking-tight">
                {bedOccupancyRate}%
              </div>
              <span className="text-xs font-semibold text-slate-600">
                {occupiedBeds} / {totalBeds} Beds
              </span>
            </div>

            {/* Bed capacity progress bar */}
            <div className="mt-3.5">
              <div className="flex justify-between text-[11px] font-medium text-slate-500 mb-1.5">
                <span>Occupied: <strong>{occupiedBeds}</strong></span>
                <span className="text-emerald-600 font-semibold">{availableBeds} Available</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    bedOccupancyRate > 85
                      ? 'bg-rose-500'
                      : bedOccupancyRate > 70
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${bedOccupancyRate}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 group-hover:text-rose-600 transition">
            <span>8 Active Hospital Wards</span>
            <ArrowUpRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </div>

        {/* Card 4: Revenue & Collections */}
        <div
          onClick={() => navigate('/billing')}
          className="group relative bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-lg hover:border-emerald-300/80 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Revenue Collected
              </span>
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-xs">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-3 flex items-baseline justify-between">
              <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {formatCurrency(totalRevenue)}
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {collectionPercentage}% Paid
              </span>
            </div>

            {/* Collection progress bar */}
            <div className="mt-3.5">
              <div className="flex justify-between text-[11px] font-medium text-slate-500 mb-1.5">
                <span>Outstanding: <strong className="text-amber-600">{formatCurrency(outstandingRevenue)}</strong></span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${collectionPercentage}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 group-hover:text-emerald-600 transition">
            <span>Insurance Claims Cleared</span>
            <ArrowUpRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </div>
      </div>

      {/* 4. Secondary Operational Counters (Department Quick-Access) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Doctors on Duty */}
        <div
          onClick={() => navigate('/doctor')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-sky-300 hover:shadow-md transition cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <div className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition">
                {doctorsCount} Active
              </div>
              <div className="text-xs text-slate-500 font-medium">Physicians On Duty</div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
        </div>

        {/* Nurses on Shift */}
        <div
          onClick={() => navigate('/nursing')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-teal-300 hover:shadow-md transition cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-50 text-teal-600 rounded-xl group-hover:bg-teal-600 group-hover:text-white transition">
              <HeartPulse className="h-5 w-5" />
            </div>
            <div>
              <div className="text-lg font-bold text-slate-900 group-hover:text-teal-600 transition">
                {nursesCount} On Shift
              </div>
              <div className="text-xs text-slate-500 font-medium">Floor Nursing Staff</div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition" />
        </div>

        {/* Pending Laboratory Assays */}
        <div
          onClick={() => navigate('/laboratory')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-amber-300 hover:shadow-md transition cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition">
              <FlaskConical className="h-5 w-5" />
            </div>
            <div>
              <div className="text-lg font-bold text-amber-700 flex items-center gap-1.5">
                <span>{pendingLabs} Pending</span>
                {statUrgentLabs > 0 && (
                  <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" title="Stat test in queue" />
                )}
              </div>
              <div className="text-xs text-slate-500 font-medium">Laboratory Assays</div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition" />
        </div>

        {/* Pharmacy Formulary Lines */}
        <div
          onClick={() => navigate('/pharmacy')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-purple-300 hover:shadow-md transition cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition">
              <Pill className="h-5 w-5" />
            </div>
            <div>
              <div className="text-lg font-bold text-purple-700 flex items-center gap-1.5">
                <span>{medications.length} Lines</span>
                {lowStockMeds > 0 && (
                  <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded font-semibold">
                    {lowStockMeds} Low
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500 font-medium">Formulary Stock</div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition" />
        </div>
      </div>

      {/* 5. Charts & Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Inflow / Discharges / Emergency Trend (Area Chart) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Patient Census Dynamics & Emergency Inflow
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-sky-50 text-sky-700 px-2 py-0.5 rounded border border-sky-200">
                    Telemetry Trend
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Comparative analysis of Inpatient Admissions vs Discharges vs Emergency Department volume
                </p>
              </div>

              {/* Time Range Pills */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto border border-slate-200/60">
                <button
                  onClick={() => setTimeRange('today')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    timeRange === 'today'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => setTimeRange('7days')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    timeRange === '7days'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  7 Days
                </button>
                <button
                  onClick={() => setTimeRange('30days')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    timeRange === '30days'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  30 Days
                </button>
              </div>
            </div>

            {/* Recharts Area Chart */}
            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={currentChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="admissionGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284c7" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="dischargesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="emergencyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="label"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                  />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                    }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
                  <Area
                    type="monotone"
                    dataKey="admissions"
                    name="Inpatient Admissions"
                    stroke="#0284c7"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#admissionGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="discharges"
                    name="Discharges"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#dischargesGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="emergency"
                    name="ER Arrivals"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    fillOpacity={1}
                    fill="url(#emergencyGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
            <div className="flex items-center gap-4">
              <span>Peak Admissions: <strong className="text-slate-800">Thursday (22)</strong></span>
              <span>Discharge Rate: <strong className="text-emerald-700">86.4%</strong></span>
            </div>
            <span className="text-[11px] text-slate-400">Continuous telemetry feed updated</span>
          </div>
        </div>

        {/* Clinical Ward & Department Capacity */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Department Capacity</h3>
                <p className="text-xs text-slate-500 mt-0.5">Real-time ward census & bed availability</p>
              </div>
              <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                8 Wards
              </span>
            </div>

            {/* Department occupancy list */}
            <div className="space-y-3.5 pt-1">
              {departments.filter((d) => d.bedCapacity > 0).map((dept) => {
                const occupancyRate = Math.round((dept.currentOccupancy / dept.bedCapacity) * 100);
                const isCritical = occupancyRate >= 85;
                const isHigh = occupancyRate >= 75 && occupancyRate < 85;

                return (
                  <div key={dept.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{dept.name.split('&')[0].trim()}</span>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1 py-0.2 rounded">
                          {dept.code}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 font-medium">
                        <span className="text-slate-900 font-bold">{dept.currentOccupancy}</span>
                        <span className="text-slate-400">/{dept.bedCapacity}</span>
                        <span
                          className={`text-[11px] font-bold px-1.5 py-0.2 rounded ml-1 ${
                            isCritical
                              ? 'bg-rose-50 text-rose-700'
                              : isHigh
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {occupancyRate}%
                        </span>
                      </div>
                    </div>

                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCritical
                            ? 'bg-rose-500'
                            : isHigh
                            ? 'bg-amber-500'
                            : 'bg-sky-500'
                        }`}
                        style={{ width: `${occupancyRate}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs">
            <span className="text-slate-500">Overall: <strong>{bedOccupancyRate}% Occupied</strong></span>
            <button
              onClick={() => navigate('/admin')}
              className="text-sky-600 hover:text-sky-700 font-bold flex items-center gap-1 hover:underline"
            >
              <span>Manage Ward Capacity</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 6. Today's Consultations Queue & Live System Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Outpatient & Consultation Live Queue (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            {/* Table Header with Search & Filter Tabs */}
            <div className="p-5 border-b border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">
                      Today’s Consultation & Triage Queue
                    </h3>
                    <p className="text-xs text-slate-500">
                      Live patient queue with triage urgency, assigned clinician, and instant chart access
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/appointments')}
                  className="text-xs font-bold text-sky-700 hover:text-sky-800 flex items-center gap-1 self-start sm:self-auto hover:underline"
                >
                  <span>Full Clinic Schedule</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Tabs & Search Filter Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold border border-slate-200/60 overflow-x-auto">
                  {(['All', 'In Consultation', 'Checked In', 'Scheduled'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setAppointmentFilter(tab)}
                      className={`px-3 py-1 rounded-lg transition-all whitespace-nowrap ${
                        appointmentFilter === tab
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={queueSearch}
                    onChange={(e) => setQueueSearch(e.target.value)}
                    placeholder="Filter patient, MRN, doctor..."
                    className="w-full sm:w-56 pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
                  />
                </div>
              </div>
            </div>

            {/* Queue Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200/80 uppercase text-[10px] font-bold tracking-wider">
                    <th className="py-3 px-4">Time</th>
                    <th className="py-3 px-4">Patient / MRN</th>
                    <th className="py-3 px-4">Reason / Complaint</th>
                    <th className="py-3 px-4">Clinician</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                        No appointments match current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredAppointments.map((apt) => (
                      <tr
                        key={apt.id}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                        onClick={() => navigate(`/doctor/consultation/${apt.patientId}`)}
                      >
                        <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs">{apt.appointmentTime}</span>
                            {apt.priority === 'Emergency' && (
                              <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" title="Emergency Priority" />
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 group-hover:text-sky-600 transition">
                            {apt.patientName}
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="font-mono text-[10px] text-slate-500">{apt.patientMrn}</span>
                            <button
                              onClick={(e) => handleCopyMRN(apt.patientMrn, e)}
                              className="text-slate-400 hover:text-sky-600 p-0.5 rounded transition"
                              title="Copy MRN"
                            >
                              {copiedMRN === apt.patientMrn ? (
                                <Check className="h-3 w-3 text-emerald-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-slate-600 max-w-xs">
                          <p className="truncate text-xs">{apt.reasonForVisit}</p>
                          <span
                            className={`inline-block mt-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded ${
                              apt.priority === 'Emergency'
                                ? 'bg-rose-100 text-rose-800'
                                : apt.priority === 'Urgent'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {apt.priority}
                          </span>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-medium text-slate-800">{apt.doctorName}</div>
                          <div className="text-[10px] text-slate-400">{apt.department}</div>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <Badge
                            size="sm"
                            variant={
                              apt.status === 'In Consultation'
                                ? 'primary'
                                : apt.status === 'Checked In'
                                ? 'warning'
                                : apt.status === 'Completed'
                                ? 'success'
                                : 'secondary'
                            }
                            dot={apt.status === 'In Consultation'}
                          >
                            {apt.status}
                          </Badge>
                        </td>

                        <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => navigate(`/doctor/consultation/${apt.patientId}`)}
                            className="px-3 py-1 bg-sky-50 hover:bg-sky-600 text-sky-700 hover:text-white rounded-lg text-xs font-bold border border-sky-200 hover:border-sky-600 transition"
                          >
                            Open Chart
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Showing {filteredAppointments.length} consultation entries</span>
            <span className="text-[11px] text-slate-400">Next auto-refresh in 45s</span>
          </div>
        </div>

        {/* System Activity & Clinical Audit Trail (1 col) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between overflow-hidden">
          <div>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Clinical Audit Feed</h3>
                  <p className="text-xs text-slate-500">Live immutable system transactions</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/admin')}
                className="text-xs font-bold text-sky-700 hover:text-sky-800 flex items-center gap-1 hover:underline"
              >
                <span>Full Trail</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="p-4 divide-y divide-slate-100 max-h-[360px] overflow-y-auto space-y-3">
              {auditLogs.slice(0, 6).map((log) => (
                <div key={log.id} className="pt-2 first:pt-0">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-xs text-slate-800">{log.action}</span>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      {log.timestamp.split(' ')[1] || log.timestamp}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                    {log.details}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                    <span className="font-medium text-slate-700">{log.userName}</span>
                    <span>•</span>
                    <span className="font-mono text-slate-400 uppercase bg-slate-100 px-1 py-0.2 rounded">
                      {log.module}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-linear-to-b from-white to-slate-50 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-center gap-2 text-xs font-medium text-slate-600">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>HIPAA Compliant & 256-Bit Encrypted</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center text-[11px] font-semibold">
              <button
                onClick={() => navigate('/qr-module')}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
              >
                Print Wristband
              </button>
              <button
                onClick={() => navigate('/reports')}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
              >
                Daily Analytics
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  Stethoscope,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  Play,
  Search,
  FileText,
  Calendar,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEMR } from '../../hooks/useEMR';
import { Badge } from '../../components/ui/Badge';
import { calculateAge } from '../../utils';

export const DoctorDashboardPage: React.FC = () => {
  const { appointments, patients, consultations, currentUser } = useEMR();
  const navigate = useNavigate();
  const [filterQueue, setFilterQueue] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Queue of patients waiting or scheduled
  const queuePatients = appointments.filter((apt) => {
    const matchesFilter =
      filterQueue === 'ALL' ||
      (filterQueue === 'WAITING' && (apt.status === 'Checked In' || apt.status === 'In Consultation')) ||
      (filterQueue === 'SCHEDULED' && apt.status === 'Scheduled') ||
      (filterQueue === 'COMPLETED' && apt.status === 'Completed');

    const matchesSearch =
      !searchTerm ||
      apt.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.patientMrn.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const waitingCount = appointments.filter((a) => a.status === 'Checked In').length;
  const inConsultCount = appointments.filter((a) => a.status === 'In Consultation').length;
  const completedCount = appointments.filter((a) => a.status === 'Completed').length;

  return (
    <div className="space-y-6">
      {/* Workbench Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-sky-50 text-sky-700 rounded-lg">
              <Stethoscope className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Physician Clinical Workstation</h1>
              <p className="text-xs text-slate-500">
                Logged in as <strong>{currentUser.name}</strong> • Department of {currentUser.department}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/appointments')}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
          >
            <Calendar className="h-4 w-4 text-sky-600" />
            <span>Master Schedule</span>
          </button>
          <button
            onClick={() => navigate('/patients')}
            className="flex items-center gap-1.5 px-3 py-2 bg-sky-700 hover:bg-sky-800 text-white rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <Users className="h-4 w-4" />
            <span>Patient Charts</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase">Waiting in Clinic</span>
            <div className="text-2xl font-black text-amber-600 mt-1">{waitingCount}</div>
            <p className="text-[11px] text-slate-400">Checked-in & ready</p>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
            <Clock className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase">In Consultation</span>
            <div className="text-2xl font-black text-sky-700 mt-1">{inConsultCount}</div>
            <p className="text-[11px] text-slate-400">Active examination</p>
          </div>
          <div className="p-3 bg-sky-50 rounded-xl text-sky-700">
            <Play className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase">Completed Today</span>
            <div className="text-2xl font-black text-emerald-600 mt-1">{completedCount}</div>
            <p className="text-[11px] text-slate-400">Encounters finished</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <CheckCircle className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase">Emergency Alerts</span>
            <div className="text-2xl font-black text-rose-600 mt-1">
              {patients.filter((p) => p.status === 'Emergency').length}
            </div>
            <p className="text-[11px] text-slate-400">Trauma / critical bays</p>
          </div>
          <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Main Clinical Patient Queue */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Consultation Patient Queue</h3>
            <p className="text-xs text-slate-500">Select any patient to review history and open the clinical encounter workspace.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter queue..."
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs">
              <button
                onClick={() => setFilterQueue('ALL')}
                className={`px-2.5 py-1 rounded font-medium ${
                  filterQueue === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                All ({appointments.length})
              </button>
              <button
                onClick={() => setFilterQueue('WAITING')}
                className={`px-2.5 py-1 rounded font-medium ${
                  filterQueue === 'WAITING' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Waiting ({waitingCount})
              </button>
              <button
                onClick={() => setFilterQueue('COMPLETED')}
                className={`px-2.5 py-1 rounded font-medium ${
                  filterQueue === 'COMPLETED' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Completed ({completedCount})
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 uppercase text-[10px] text-slate-500 tracking-wider">
                <th className="py-3 px-4 font-semibold">Time / Slot</th>
                <th className="py-3 px-4 font-semibold">Patient Information</th>
                <th className="py-3 px-4 font-semibold">Reason for Visit / Triage</th>
                <th className="py-3 px-4 font-semibold">Assigned Physician</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Consultation Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {queuePatients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    No patients currently matching this queue filter.
                  </td>
                </tr>
              ) : (
                queuePatients.map((apt) => {
                  const patient = patients.find((p) => p.id === apt.patientId);
                  return (
                    <tr key={apt.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {apt.appointmentTime}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-xs">
                          {apt.patientName}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2">
                          <span className="font-mono text-sky-800">{apt.patientMrn}</span>
                          {patient && (
                            <>
                              <span>•</span>
                              <span>{calculateAge(patient.dateOfBirth)}y</span>
                              <span>•</span>
                              <span className="text-rose-600 font-semibold">{patient.bloodGroup}</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="text-slate-700 truncate font-medium">{apt.reasonForVisit}</div>
                        <span className="text-[10px] text-slate-400">{apt.type}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{apt.doctorName}</td>
                      <td className="py-3 px-4">
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
                        >
                          {apt.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => navigate(`/doctor/consultation/${apt.patientId}`)}
                          className="px-3 py-1.5 bg-sky-700 hover:bg-sky-800 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs transition"
                        >
                          <span>{apt.status === 'Completed' ? 'Review Encounter' : 'Launch Consult'}</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historical Encounter Feed */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-sky-600" />
            <h3 className="font-bold text-slate-900 text-sm">Recent Clinical Documentations & Diagnoses</h3>
          </div>
          <span className="text-xs text-slate-400">{consultations.length} Encounters</span>
        </div>

        <div className="divide-y divide-slate-100">
          {consultations.map((c) => (
            <div key={c.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-xs">{c.diagnosis}</span>
                  <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                    {c.icd10Code}
                  </span>
                </div>
                <p className="text-slate-600 text-xs mt-0.5 line-clamp-1">{c.treatmentPlan}</p>
                <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                  <span>Encounter Date: {c.consultationDate}</span>
                  <span>•</span>
                  <span>{c.doctorName}</span>
                </div>
              </div>
              <button
                onClick={() => navigate(`/doctor/consultation/${c.patientId}`)}
                className="px-2.5 py-1 bg-slate-100 hover:bg-sky-50 text-sky-800 border border-slate-200 rounded text-xs font-semibold self-start sm:self-center"
              >
                View Full Note
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

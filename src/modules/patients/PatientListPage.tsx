import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  PlusCircle,
  Filter,
  Eye,
  Edit,
  Printer,
  HeartPulse,
  Stethoscope,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEMR } from '../../hooks/useEMR';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { PatientPrintableCard } from './PatientPrintableCard';
import { calculateAge } from '../../utils';
import { Patient, PatientStatus } from '../../types';

export const PatientListPage: React.FC = () => {
  const { patients } = useEMR();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [genderFilter, setGenderFilter] = useState<string>('ALL');
  const [selectedPatientForPrint, setSelectedPatientForPrint] = useState<Patient | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Filtered patients
  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        p.firstName.toLowerCase().includes(q) ||
        p.lastName.toLowerCase().includes(q) ||
        p.mrn.toLowerCase().includes(q) ||
        p.nationalId.toLowerCase().includes(q) ||
        p.phone.includes(q);

      const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
      const matchesGender = genderFilter === 'ALL' || p.gender === genderFilter;

      return matchesSearch && matchesStatus && matchesGender;
    });
  }, [patients, searchQuery, statusFilter, genderFilter]);

  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage) || 1;
  const paginatedPatients = filteredPatients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Master Patient Index</h1>
            <Badge variant="primary" size="sm">
              {filteredPatients.length} Records
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Search, filter, edit demographic charts, and issue verified clinical patient credentials.
          </p>
        </div>

        <button
          onClick={() => navigate('/patients/register')}
          className="flex items-center gap-2 px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white rounded-lg text-xs font-semibold shadow-xs transition"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Register New Patient</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="md:col-span-6 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by Patient Name, MRN, National ID, Phone..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
            />
          </div>

          {/* Status Filter */}
          <div className="md:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            >
              <option value="ALL">All Care Statuses</option>
              <option value="Inpatient">Inpatient</option>
              <option value="Outpatient">Outpatient</option>
              <option value="Emergency">Emergency</option>
              <option value="Discharged">Discharged</option>
            </select>
          </div>

          {/* Gender Filter */}
          <div className="md:col-span-3">
            <select
              value={genderFilter}
              onChange={(e) => {
                setGenderFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            >
              <option value="ALL">All Genders</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Patient Listing Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase text-[10px] tracking-wider">
                <th className="py-3.5 px-4 font-semibold">Patient Name & Demographics</th>
                <th className="py-3.5 px-4 font-semibold">MRN / ID</th>
                <th className="py-3.5 px-4 font-semibold">Contact / Phone</th>
                <th className="py-3.5 px-4 font-semibold">Blood Group</th>
                <th className="py-3.5 px-4 font-semibold">Clinical Status</th>
                <th className="py-3.5 px-4 font-semibold">Allergies</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedPatients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    <Users className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-medium text-sm">No patients match the specified criteria</p>
                    <p className="text-xs text-slate-400 mt-0.5">Try clearing your filters or add a new patient.</p>
                  </td>
                </tr>
              ) : (
                paginatedPatients.map((patient) => {
                  const age = calculateAge(patient.dateOfBirth);
                  return (
                    <tr key={patient.id} className="hover:bg-slate-50/80 transition group">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-sky-100 text-sky-800 flex items-center justify-center font-bold text-xs shrink-0 border border-sky-200">
                            {patient.firstName[0]}
                            {patient.lastName[0]}
                          </div>
                          <div>
                            <span
                              onClick={() => navigate(`/patients/${patient.id}`)}
                              className="font-bold text-slate-900 hover:text-sky-700 cursor-pointer text-xs"
                            >
                              {patient.firstName} {patient.lastName}
                            </span>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                              <span>{patient.gender}</span>
                              <span>•</span>
                              <span>{age} yrs</span>
                              <span>•</span>
                              <span>DOB: {patient.dateOfBirth}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-mono font-semibold text-slate-900 text-xs">
                          {patient.mrn}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {patient.nationalId}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        <div>{patient.phone}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[140px]">
                          {patient.email || patient.city}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 text-xs">
                          {patient.bloodGroup}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <Badge
                          size="sm"
                          variant={
                            patient.status === 'Emergency'
                              ? 'danger'
                              : patient.status === 'Inpatient'
                              ? 'primary'
                              : patient.status === 'Outpatient'
                              ? 'success'
                              : 'neutral'
                          }
                        >
                          {patient.status}
                        </Badge>
                        {patient.admittedWard && (
                          <div className="text-[10px] text-slate-500 mt-1 truncate max-w-[120px]">
                            {patient.bedNumber || patient.admittedWard}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {patient.allergies.length > 0 ? (
                          <div className="flex items-center gap-1 text-rose-700 font-medium">
                            <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                            <span>{patient.allergies.length} Recorded</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">NKDA</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => navigate(`/doctor/consultation/${patient.id}`)}
                            title="Start Doctor Consultation"
                            className="p-1.5 text-slate-500 hover:text-sky-700 hover:bg-sky-50 rounded transition"
                          >
                            <Stethoscope className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/nursing?patientId=${patient.id}`)}
                            title="Record Nursing Vitals"
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded transition"
                          >
                            <HeartPulse className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setSelectedPatientForPrint(patient)}
                            title="Print Patient Identity Card"
                            className="p-1.5 text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 rounded transition"
                          >
                            <Printer className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/patients/${patient.id}`)}
                            title="View Full Patient Chart"
                            className="px-2.5 py-1.5 bg-slate-900 hover:bg-sky-700 text-white rounded text-[11px] font-semibold transition"
                          >
                            Chart
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <strong className="text-slate-800">{paginatedPatients.length}</strong> of{' '}
            <strong className="text-slate-800">{filteredPatients.length}</strong> patients
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-medium text-slate-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Printable ID Card Modal */}
      {selectedPatientForPrint && (
        <Modal
          isOpen={!!selectedPatientForPrint}
          onClose={() => setSelectedPatientForPrint(null)}
          title="Patient Identity Card"
          subtitle={`Verified credential for ${selectedPatientForPrint.firstName} ${selectedPatientForPrint.lastName}`}
          maxWidth="lg"
          icon={<Printer className="h-5 w-5" />}
        >
          <PatientPrintableCard
            patient={selectedPatientForPrint}
            onClose={() => setSelectedPatientForPrint(null)}
          />
        </Modal>
      )}
    </div>
  );
};

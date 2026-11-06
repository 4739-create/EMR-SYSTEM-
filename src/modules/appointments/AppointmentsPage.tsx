import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  PlusCircle,
  Search,
  Filter,
  Clock,
  User,
  Stethoscope,
  CheckCircle,
  XCircle,
  AlertCircle,
  Building,
  ArrowRight,
  Eye,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEMR } from '../../hooks/useEMR';
import { StorageService } from '../../services/storageService';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Appointment, AppointmentStatus } from '../../types';
import { formatDate } from '../../utils';

export const AppointmentsPage: React.FC = () => {
  const { appointments, patients, staff } = useEMR();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // New appointment form state
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [appointmentTime, setAppointmentTime] = useState('10:00');
  const [appointmentType, setAppointmentType] = useState<Appointment['type']>('General Checkup');
  const [priority, setPriority] = useState<Appointment['priority']>('Routine');
  const [department, setDepartment] = useState('Internal Medicine');
  const [reasonForVisit, setReasonForVisit] = useState('');

  const doctors = useMemo(() => staff.filter((s) => s.role === 'Doctor'), [staff]);

  // Filtered appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        apt.patientName.toLowerCase().includes(q) ||
        apt.patientMrn.toLowerCase().includes(q) ||
        apt.doctorName.toLowerCase().includes(q) ||
        apt.department.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'ALL' || apt.status === statusFilter;
      const matchesPriority = priorityFilter === 'ALL' || apt.priority === priorityFilter;
      const matchesDate = !dateFilter || apt.appointmentDate === dateFilter;

      return matchesSearch && matchesStatus && matchesPriority && matchesDate;
    });
  }, [appointments, searchQuery, statusFilter, priorityFilter, dateFilter]);

  const handleStatusChange = (apt: Appointment, newStatus: AppointmentStatus) => {
    const updated: Appointment = {
      ...apt,
      status: newStatus,
    };
    StorageService.saveAppointment(updated);
  };

  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    const patient = patients.find((p) => p.id === selectedPatientId);
    const doctor = doctors.find((d) => d.id === selectedDoctorId);

    if (!patient || !doctor) {
      alert('Please select both a patient and an assigned doctor.');
      return;
    }

    const newApt: Appointment = {
      id: 'apt-' + Math.random().toString(36).substring(2, 9),
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      patientMrn: patient.mrn,
      doctorId: doctor.id,
      doctorName: doctor.name,
      department: department || doctor.department,
      appointmentDate,
      appointmentTime,
      type: appointmentType,
      status: 'Scheduled',
      reasonForVisit: reasonForVisit || 'Scheduled clinical consultation',
      priority,
    };

    StorageService.saveAppointment(newApt);
    setIsNewModalOpen(false);
    // Reset form
    setSelectedPatientId('');
    setSelectedDoctorId('');
    setReasonForVisit('');
  };

  // Status badge styling helper
  const getStatusVariant = (status: AppointmentStatus) => {
    switch (status) {
      case 'Scheduled':
        return 'primary';
      case 'Checked In':
        return 'warning';
      case 'In Consultation':
        return 'purple';
      case 'Completed':
        return 'success';
      case 'Cancelled':
      case 'No Show':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-50 text-sky-600 rounded-lg">
              <CalendarIcon className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Appointments & Scheduling</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Centralized hospital booking, outpatient flow management & patient check-in
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow-xs transition"
        >
          <PlusCircle className="h-4 w-4" />
          <span>New Appointment</span>
        </button>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs font-medium text-slate-500">Total Bookings</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{appointments.length}</h3>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs font-medium text-slate-500">Checked In (Waiting)</p>
          <h3 className="text-2xl font-bold text-amber-600 mt-1">
            {appointments.filter((a) => a.status === 'Checked In').length}
          </h3>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs font-medium text-slate-500">In Consultation</p>
          <h3 className="text-2xl font-bold text-purple-600 mt-1">
            {appointments.filter((a) => a.status === 'In Consultation').length}
          </h3>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs font-medium text-slate-500">Completed Today</p>
          <h3 className="text-2xl font-bold text-emerald-600 mt-1">
            {appointments.filter((a) => a.status === 'Completed').length}
          </h3>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by patient, MRN, doctor, or department..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white"
            />
          </div>

          <div className="md:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Checked In">Checked In</option>
              <option value="In Consultation">In Consultation</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            >
              <option value="ALL">All Priorities</option>
              <option value="Routine">Routine</option>
              <option value="Urgent">Urgent</option>
              <option value="Emergency">Emergency</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4 font-semibold">Time & Date</th>
                <th className="py-3 px-4 font-semibold">Patient Information</th>
                <th className="py-3 px-4 font-semibold">Attending Doctor</th>
                <th className="py-3 px-4 font-semibold">Type & Priority</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Reason for Visit</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No appointments found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-sky-500" />
                        <span>{apt.appointmentTime}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{formatDate(apt.appointmentDate)}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div
                        onClick={() => navigate(`/patients/${apt.patientId}`)}
                        className="font-semibold text-slate-900 hover:text-sky-600 cursor-pointer"
                      >
                        {apt.patientName}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">{apt.patientMrn}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{apt.doctorName}</div>
                      <div className="text-[10px] text-slate-500">{apt.department}</div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-700">{apt.type}</div>
                      <Badge
                        size="sm"
                        variant={
                          apt.priority === 'Emergency'
                            ? 'danger'
                            : apt.priority === 'Urgent'
                            ? 'warning'
                            : 'neutral'
                        }
                        className="mt-1"
                      >
                        {apt.priority}
                      </Badge>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <Badge variant={getStatusVariant(apt.status)} dot>
                        {apt.status}
                      </Badge>
                    </td>

                    <td className="py-3 px-4 max-w-xs truncate text-slate-600" title={apt.reasonForVisit}>
                      {apt.reasonForVisit}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {apt.status === 'Scheduled' && (
                          <button
                            onClick={() => handleStatusChange(apt, 'Checked In')}
                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded font-semibold text-[11px] border border-amber-200 transition"
                          >
                            Check In
                          </button>
                        )}

                        {apt.status === 'Checked In' && (
                          <button
                            onClick={() => {
                              handleStatusChange(apt, 'In Consultation');
                              navigate(`/doctor/consultation/${apt.patientId}`);
                            }}
                            className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded font-semibold text-[11px] transition"
                          >
                            Start Consult
                          </button>
                        )}

                        {apt.status === 'In Consultation' && (
                          <button
                            onClick={() => handleStatusChange(apt, 'Completed')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-semibold text-[11px] transition"
                          >
                            Complete
                          </button>
                        )}

                        {apt.status !== 'Completed' && apt.status !== 'Cancelled' && (
                          <button
                            onClick={() => handleStatusChange(apt, 'Cancelled')}
                            title="Cancel Appointment"
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}

                        <button
                          onClick={() => navigate(`/patients/${apt.patientId}`)}
                          title="View Patient Chart"
                          className="p-1 text-slate-400 hover:text-sky-600 rounded"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Appointment Modal */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Schedule New Outpatient Appointment"
        subtitle="Book patient consultation with hospital clinical department"
        icon={<CalendarIcon className="h-5 w-5" />}
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateAppointment} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Patient Select */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Patient *</label>
              <select
                required
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-sky-500"
              >
                <option value="">-- Choose Patient --</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName} ({p.mrn})
                  </option>
                ))}
              </select>
            </div>

            {/* Doctor Select */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Attending Physician *</label>
              <select
                required
                value={selectedDoctorId}
                onChange={(e) => {
                  setSelectedDoctorId(e.target.value);
                  const doc = doctors.find((d) => d.id === e.target.value);
                  if (doc) setDepartment(doc.department);
                }}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-sky-500"
              >
                <option value="">-- Choose Doctor --</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.department})
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Appointment Date *</label>
              <input
                type="date"
                required
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Time */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Appointment Time *</label>
              <input
                type="time"
                required
                value={appointmentTime}
                onChange={(e) => setAppointmentTime(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Encounter Type</label>
              <select
                value={appointmentType}
                onChange={(e) => setAppointmentType(e.target.value as Appointment['type'])}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-sky-500"
              >
                <option value="General Checkup">General Checkup</option>
                <option value="Follow-up">Follow-up</option>
                <option value="Specialist Consultation">Specialist Consultation</option>
                <option value="Routine Screening">Routine Screening</option>
                <option value="Emergency">Emergency</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Appointment['priority'])}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-sky-500"
              >
                <option value="Routine">Routine</option>
                <option value="Urgent">Urgent</option>
                <option value="Emergency">Emergency</option>
              </select>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Visit / Clinical Indication</label>
            <textarea
              rows={3}
              value={reasonForVisit}
              onChange={(e) => setReasonForVisit(e.target.value)}
              placeholder="e.g. Chronic cough evaluation, hypertension checkup, post-discharge review..."
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsNewModalOpen(false)}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg shadow-xs"
            >
              Confirm Appointment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

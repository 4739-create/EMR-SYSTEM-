import React from 'react';
import { Bell, AlertTriangle, AlertCircle, Package, FlaskConical, CheckCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEMR } from '../../hooks/useEMR';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const { labTests, medications, patients, appointments } = useEMR();
  const navigate = useNavigate();

  // Find critical items dynamically from state
  const criticalLabs = labTests.filter(
    (t) => t.results?.some((r) => r.flag === 'Critical') || t.urgency === 'Stat (Immediate)'
  );

  const lowStockMeds = medications.filter((m) => m.currentStock <= m.minimumStock);

  const emergencyPatients = patients.filter((p) => p.status === 'Emergency');

  const pendingAppointments = appointments.filter((a) => a.status === 'Checked In');

  const handleAction = (path: string) => {
    onClose();
    navigate(path);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Clinical Alerts & Notifications Center"
      subtitle="Real-time monitoring of urgent hospital orders, critical laboratory values, and stock warnings"
      icon={<Bell className="h-5 w-5" />}
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {/* Critical Lab Alert */}
        {criticalLabs.length > 0 && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
                <span className="font-semibold text-rose-900 text-sm">
                  Critical Laboratory Values / Stat Orders ({criticalLabs.length})
                </span>
              </div>
              <Badge variant="danger" size="sm">Urgent Review</Badge>
            </div>
            <div className="space-y-2 text-xs text-rose-800">
              {criticalLabs.map((l) => (
                <div
                  key={l.id}
                  className="flex items-center justify-between bg-white/80 p-2 rounded border border-rose-100 hover:bg-white cursor-pointer transition"
                  onClick={() => handleAction(`/laboratory?testId=${l.id}`)}
                >
                  <div>
                    <span className="font-semibold text-slate-900">{l.testName}</span>
                    <span className="text-slate-500 ml-2">({l.patientName} - {l.patientMrn})</span>
                    <div className="text-rose-600 mt-0.5">
                      Status: {l.status} • Urgency: {l.urgency}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-rose-600" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Emergency Triage Queue */}
        {emergencyPatients.length > 0 && (
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                <span className="font-semibold text-amber-900 text-sm">
                  Emergency Bay Intake Waiting ({emergencyPatients.length})
                </span>
              </div>
              <Badge variant="warning" size="sm">Triage Red</Badge>
            </div>
            <div className="space-y-2 text-xs">
              {emergencyPatients.map((ep) => (
                <div
                  key={ep.id}
                  className="flex items-center justify-between bg-white/80 p-2 rounded border border-amber-100 hover:bg-white cursor-pointer transition"
                  onClick={() => handleAction(`/doctor/consultation/${ep.id}`)}
                >
                  <div>
                    <span className="font-semibold text-slate-900">{ep.firstName} {ep.lastName}</span>
                    <span className="text-slate-500 ml-2">Location: {ep.admittedWard}</span>
                  </div>
                  <span className="text-sky-700 font-medium flex items-center gap-1">
                    Attend <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Low Stock Medication Alerts */}
        {lowStockMeds.length > 0 && (
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-indigo-600 shrink-0" />
                <span className="font-semibold text-slate-900 text-sm">
                  Pharmacy Low-Stock Alerts ({lowStockMeds.length})
                </span>
              </div>
              <Badge variant="purple" size="sm">Formulary Alert</Badge>
            </div>
            <div className="space-y-1.5 text-xs">
              {lowStockMeds.map((med) => (
                <div
                  key={med.id}
                  className="flex items-center justify-between bg-white p-2 rounded border border-slate-200"
                >
                  <div>
                    <span className="font-semibold text-slate-800">{med.name}</span>
                    <span className="text-slate-500 ml-2">({med.strength})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-rose-600 font-bold">Only {med.currentStock} units</span>
                    <span className="text-slate-400">(Min: {med.minimumStock})</span>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => handleAction('/pharmacy')}
              className="mt-2.5 text-xs text-sky-700 font-medium hover:underline flex items-center gap-1"
            >
              Open Pharmacy Stock Manager <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Pending Checked-In Patients */}
        {pendingAppointments.length > 0 && (
          <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-sky-600 shrink-0" />
                <span className="font-semibold text-sky-900 text-sm">
                  Waiting in Consultation Room ({pendingAppointments.length})
                </span>
              </div>
              <Badge variant="primary" size="sm">In Clinic</Badge>
            </div>
            <div className="space-y-1 text-xs text-sky-800">
              {pendingAppointments.map((ap) => (
                <div key={ap.id} className="flex justify-between py-1">
                  <span>{ap.patientName} — {ap.doctorName}</span>
                  <span className="font-medium text-slate-600">{ap.appointmentTime}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

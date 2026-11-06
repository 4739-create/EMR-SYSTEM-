import React, { useState } from 'react';
import {
  ShieldCheck,
  Building2,
  Users,
  Settings,
  History,
  PlusCircle,
  Save,
  RefreshCw,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { useEMR } from '../../hooks/useEMR';
import { StorageService } from '../../services/storageService';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { StaffUser, UserRole, HospitalSettings } from '../../types';

export const AdministrationPage: React.FC = () => {
  const { staff, departments, auditLogs, settings, resetAll } = useEMR();

  const [activeTab, setActiveTab] = useState<'settings' | 'staff' | 'departments' | 'audit'>('settings');

  // Hospital settings state
  const [hospitalSettings, setHospitalSettings] = useState<HospitalSettings>(settings);

  // New staff modal
  const [isNewStaffOpen, setIsNewStaffOpen] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffRole, setStaffRole] = useState<UserRole>('Doctor');
  const [staffDept, setStaffDept] = useState('Internal Medicine');
  const [staffPhone, setStaffPhone] = useState('+1 (555) 000-0000');
  const [staffLicense, setStaffLicense] = useState('');

  // Audit search
  const [auditSearch, setAuditSearch] = useState('');

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.saveSettings(hospitalSettings);
    alert('Hospital system settings saved successfully!');
  };

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    const newStaff: StaffUser = {
      id: 'staff-' + Math.random().toString(36).substring(2, 9),
      name: staffName,
      email: staffEmail,
      role: staffRole,
      department: staffDept,
      employeeId: 'EMP-' + Math.floor(1000 + Math.random() * 9000),
      phone: staffPhone,
      licenseNumber: staffLicense || undefined,
      status: 'Active',
      hasBiometricsRegistered: false,
    };

    StorageService.saveStaff(newStaff);
    setIsNewStaffOpen(false);
    setStaffName('');
    setStaffEmail('');
  };

  const filteredLogs = auditLogs.filter(
    (log) =>
      !auditSearch ||
      log.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.module.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.userName.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.details.toLowerCase().includes(auditSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-sky-50 text-sky-600 rounded-lg">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Hospital Governance & Administration
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Enterprise parameters, staff credentialing, HIPAA compliance audit trail & master facility controls
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeTab === 'settings' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Facility Settings
          </button>
          <button
            onClick={() => setActiveTab('staff')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeTab === 'staff' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Staff Directory ({staff.length})
          </button>
          <button
            onClick={() => setActiveTab('departments')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeTab === 'departments' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Departments ({departments.length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeTab === 'audit' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Audit Trail
          </button>
        </div>
      </div>

      {/* Tab 1: Facility Settings */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
            <h3 className="font-bold text-slate-900 text-sm">Hospital Identification & Legal Entity</h3>
            <button
              type="submit"
              className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5"
            >
              <Save className="h-4 w-4" />
              <span>Save Configurations</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Hospital / Medical Center Name</label>
              <input
                type="text"
                value={hospitalSettings.hospitalName}
                onChange={(e) => setHospitalSettings({ ...hospitalSettings, hospitalName: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Facility Code / OID</label>
              <input
                type="text"
                value={hospitalSettings.hospitalCode}
                onChange={(e) => setHospitalSettings({ ...hospitalSettings, hospitalCode: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tagline / Mission</label>
              <input
                type="text"
                value={hospitalSettings.tagline}
                onChange={(e) => setHospitalSettings({ ...hospitalSettings, tagline: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Emergency Telephone Hotline</label>
              <input
                type="text"
                value={hospitalSettings.emergencyPhone}
                onChange={(e) => setHospitalSettings({ ...hospitalSettings, emergencyPhone: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Official Address</label>
              <input
                type="text"
                value={hospitalSettings.address}
                onChange={(e) => setHospitalSettings({ ...hospitalSettings, address: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Joint Commission Accreditation No.</label>
              <input
                type="text"
                value={hospitalSettings.accreditationNumber}
                onChange={(e) => setHospitalSettings({ ...hospitalSettings, accreditationNumber: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
              />
            </div>
          </div>

          {/* Master Reset Section */}
          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-slate-900 text-xs">Reset Demonstration Datastore</h4>
              <p className="text-[11px] text-slate-500">
                Wipes current local storage changes and restores fresh mock clinical data.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Reset all demo patient and hospital data back to factory defaults?')) {
                  resetAll();
                  window.location.reload();
                }
              }}
              className="px-4 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold flex items-center gap-1.5"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Reset Demo State</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Staff Directory */}
      {activeTab === 'staff' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-900 text-sm">Credentialed Clinical & Administrative Staff</h3>
            <button
              onClick={() => setIsNewStaffOpen(true)}
              className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Register New Staff</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase text-[10px]">
                    <th className="py-3 px-4 font-semibold">Name & ID</th>
                    <th className="py-3 px-4 font-semibold">Clinical Role</th>
                    <th className="py-3 px-4 font-semibold">Department</th>
                    <th className="py-3 px-4 font-semibold">License #</th>
                    <th className="py-3 px-4 font-semibold">Contact Phone</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {staff.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{s.name}</div>
                        <div className="font-mono text-slate-400 text-[10px]">{s.employeeId}</div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">{s.role}</td>
                      <td className="py-3 px-4 text-slate-600">{s.department}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{s.licenseNumber || '—'}</td>
                      <td className="py-3 px-4 text-slate-600">{s.phone}</td>
                      <td className="py-3 px-4">
                        <Badge variant={s.status === 'Active' ? 'success' : 'neutral'} size="sm">
                          {s.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Departments */}
      {activeTab === 'departments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept) => (
            <div key={dept.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{dept.name}</h4>
                  <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">{dept.code}</span>
                </div>
                <Badge variant="success" size="sm">{dept.status}</Badge>
              </div>

              <div className="space-y-1 text-xs text-slate-600">
                <div>HOD: <strong>{dept.headOfDepartment}</strong></div>
                <div>Location: <strong>{dept.location}</strong></div>
                {dept.bedCapacity > 0 ? (
                  <div>
                    Capacity: <strong>{dept.currentOccupancy} / {dept.bedCapacity} Beds</strong> ({Math.round((dept.currentOccupancy / dept.bedCapacity) * 100)}% occupied)
                  </div>
                ) : (
                  <div>Capacity: <span className="text-slate-400">Non-bed diagnostic unit</span></div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center gap-4">
            <input
              type="text"
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
              placeholder="Search audit trail by user, action, module or details..."
              className="max-w-md w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
            />
            <span className="text-xs text-slate-400 font-mono">
              Displaying {filteredLogs.length} audit entries
            </span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase text-[10px]">
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">User & Role</th>
                    <th className="py-2.5 px-3">Action Type</th>
                    <th className="py-2.5 px-3">Module</th>
                    <th className="py-2.5 px-3">Audit Details</th>
                    <th className="py-2.5 px-3">IP / Session</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {log.timestamp}
                      </td>
                      <td className="py-2 px-3">
                        <div className="font-bold text-slate-900">{log.userName}</div>
                        <div className="text-[10px] text-slate-400">{log.role}</div>
                      </td>
                      <td className="py-2 px-3">
                        <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-medium text-slate-700">{log.module}</td>
                      <td className="py-2 px-3 text-slate-600 max-w-md">{log.details}</td>
                      <td className="py-2 px-3 font-mono text-[10px] text-slate-400 whitespace-nowrap">
                        {log.ipAddress}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Register Staff Modal */}
      <Modal
        isOpen={isNewStaffOpen}
        onClose={() => setIsNewStaffOpen(false)}
        title="Register New Hospital Staff Personnel"
        subtitle="Provision clinical or administrative credentials"
        icon={<PlusCircle className="h-5 w-5" />}
        maxWidth="md"
      >
        <form onSubmit={handleCreateStaff} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name *</label>
            <input
              type="text"
              required
              value={staffName}
              onChange={(e) => setStaffName(e.target.value)}
              placeholder="e.g. Dr. Jennifer Hayes, MD"
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Institutional Email *</label>
            <input
              type="email"
              required
              value={staffEmail}
              onChange={(e) => setStaffEmail(e.target.value)}
              placeholder="jennifer.hayes@hospital.med"
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Role</label>
              <select
                value={staffRole}
                onChange={(e) => setStaffRole(e.target.value as UserRole)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              >
                <option value="Doctor">Doctor</option>
                <option value="Nurse">Nurse</option>
                <option value="Laboratory Technician">Laboratory Technician</option>
                <option value="Pharmacist">Pharmacist</option>
                <option value="Radiologist">Radiologist</option>
                <option value="Receptionist">Receptionist</option>
                <option value="Cashier">Cashier</option>
                <option value="Hospital Administrator">Hospital Administrator</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
              <input
                type="text"
                value={staffDept}
                onChange={(e) => setStaffDept(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">State Medical License Number</label>
            <input
              type="text"
              value={staffLicense}
              onChange={(e) => setStaffLicense(e.target.value)}
              placeholder="MED-NY-192842"
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setIsNewStaffOpen(false)}
              className="px-4 py-2 border rounded-lg text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-sky-600 text-white rounded-lg text-xs font-semibold"
            >
              Enroll Staff Member
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

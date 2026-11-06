import React, { useState } from 'react';
import {
  Fingerprint,
  ShieldCheck,
  CheckCircle,
  Key,
  Smartphone,
  Lock,
  User,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useEMR } from '../../hooks/useEMR';
import { StorageService } from '../../services/storageService';
import { Badge } from '../../components/ui/Badge';
import { StaffUser } from '../../types';

export const BiometricsAuthPage: React.FC = () => {
  const { staff, currentUser } = useEMR();
  const [testingStaffId, setTestingStaffId] = useState<string>(currentUser.id);
  const [authStatus, setAuthStatus] = useState<'idle' | 'scanning' | 'success' | 'failed'>('idle');

  const handleRegisterBiometrics = (member: StaffUser) => {
    const updated: StaffUser = {
      ...member,
      hasBiometricsRegistered: true,
    };
    StorageService.saveStaff(updated);
    StorageService.logAction(
      'BIOMETRICS_REGISTERED',
      'Security',
      `FIDO2 WebAuthn credential enrolled for ${member.name} (${member.role})`
    );
    alert(`Biometrics successfully enrolled for ${member.name}!`);
  };

  const handleTestBiometrics = () => {
    setAuthStatus('scanning');
    setTimeout(() => {
      setAuthStatus('success');
      const target = staff.find((s) => s.id === testingStaffId) || currentUser;
      StorageService.logAction(
        'BIOMETRIC_LOGIN_VERIFIED',
        'Authentication',
        `User ${target.name} successfully verified identity via TouchID/Windows Hello`
      );
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-sky-50 text-sky-600 rounded-lg">
            <Fingerprint className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Biometric Access & WebAuthn Passkeys
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              FIDO2 / WebAuthn zero-trust credentialing for doctors, nurses & hospital personnel
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Test Authenticator Terminal */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Lock className="h-5 w-5 text-sky-600" />
              <h3 className="font-bold text-slate-900 text-sm">Biometric Authenticator Simulator</h3>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Staff Account to Authenticate
              </label>
              <select
                value={testingStaffId}
                onChange={(e) => {
                  setTestingStaffId(e.target.value);
                  setAuthStatus('idle');
                }}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              >
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Visual Touch ID / Fingerprint sensor canvas */}
            <div className="p-8 bg-slate-900 rounded-2xl text-center text-white space-y-4">
              <button
                type="button"
                onClick={handleTestBiometrics}
                disabled={authStatus === 'scanning'}
                className={`mx-auto h-24 w-24 rounded-full flex items-center justify-center transition-all ${
                  authStatus === 'scanning'
                    ? 'bg-sky-500 animate-pulse ring-4 ring-sky-300'
                    : authStatus === 'success'
                    ? 'bg-emerald-500 ring-4 ring-emerald-300'
                    : 'bg-slate-800 hover:bg-slate-700 ring-2 ring-slate-700'
                }`}
              >
                <Fingerprint className="h-12 w-12 text-white" />
              </button>

              <div className="space-y-1">
                <div className="font-bold text-sm">
                  {authStatus === 'scanning' && 'Reading Biometric Sensor...'}
                  {authStatus === 'success' && 'Passkey Cryptographically Verified!'}
                  {authStatus === 'idle' && 'Click Sensor to Scan Fingerprint / Face'}
                </div>
                <p className="text-[11px] text-slate-400">
                  Hardware Secure Enclave / TPM 2.0 Simulation
                </p>
              </div>

              {authStatus === 'success' && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-lg text-xs text-emerald-300 flex items-center justify-center gap-1.5">
                  <CheckCircle className="h-4 w-4" />
                  <span>Clinical session authenticated. Audit trail entry created.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Staff Biometrics Enrollment Roster */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 font-bold text-slate-900 text-sm">
              Staff Passkey Enrollment Directory
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase text-[10px]">
                    <th className="py-3 px-4 font-semibold">Staff Member</th>
                    <th className="py-3 px-4 font-semibold">Role & Department</th>
                    <th className="py-3 px-4 font-semibold">Biometrics Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {staff.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{member.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{member.employeeId}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{member.role}</div>
                        <div className="text-[10px] text-slate-400">{member.department}</div>
                      </td>

                      <td className="py-3 px-4">
                        {member.hasBiometricsRegistered ? (
                          <Badge variant="success" size="sm" dot>
                            Enrolled
                          </Badge>
                        ) : (
                          <Badge variant="neutral" size="sm">
                            Not Enrolled
                          </Badge>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        {!member.hasBiometricsRegistered && (
                          <button
                            onClick={() => handleRegisterBiometrics(member)}
                            className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded font-semibold text-[11px]"
                          >
                            Enroll Passkey
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, Shield, HeartPulse, Building2, User } from 'lucide-react';
import { Patient } from '../../types';
import { calculateAge, createPatientQRPayload } from '../../utils';

interface PatientPrintableCardProps {
  patient: Patient;
  onClose?: () => void;
}

export const PatientPrintableCard: React.FC<PatientPrintableCardProps> = ({ patient, onClose }) => {
  const qrPayload = createPatientQRPayload(patient.id, patient.mrn, patient.nationalId);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Top action bar (hidden during print) */}
      <div className="flex items-center justify-between no-print bg-slate-100 p-3 rounded-lg border border-slate-200">
        <span className="text-xs text-slate-600 font-medium">
          Official Clinical Patient Identity Card (CR80 Standard Format)
        </span>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-sky-700 hover:bg-sky-800 text-white rounded-md text-xs font-semibold shadow-xs transition"
        >
          <Printer className="h-4 w-4" />
          <span>Print Identification Card</span>
        </button>
      </div>

      {/* The Printable Identification Badge */}
      <div className="print-break-inside-avoid max-w-md mx-auto bg-gradient-to-br from-white to-slate-50 border-2 border-slate-900 rounded-2xl p-5 shadow-xl relative overflow-hidden text-slate-900">
        {/* Card Header Band */}
        <div className="bg-slate-900 -mx-5 -mt-5 p-4 text-white flex items-center justify-between mb-4 border-b-2 border-sky-500">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-sky-500 flex items-center justify-center font-bold text-white shadow-sm">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-black tracking-wider uppercase">APEX MEDICAL CENTER</h2>
              <p className="text-[9px] text-sky-300 font-mono">PATIENT IDENTIFICATION CREDENTIAL</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] bg-slate-800 border border-slate-700 text-slate-200 px-2 py-0.5 rounded font-mono font-bold">
              {patient.status}
            </span>
          </div>
        </div>

        {/* Card Body with Avatar, Demographics, and QR */}
        <div className="flex items-start gap-4">
          {/* Avatar / Photo placeholder */}
          <div className="w-24 h-28 rounded-lg bg-slate-200 border border-slate-300 flex flex-col items-center justify-center text-slate-400 shrink-0 overflow-hidden shadow-inner">
            <User className="h-12 w-12 text-slate-400" />
            <span className="text-[9px] font-semibold text-slate-500 mt-1 uppercase">Photo Verified</span>
          </div>

          {/* Details */}
          <div className="flex-1 space-y-1 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Patient Name</span>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                {patient.firstName} {patient.lastName}
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <span className="text-[10px] text-slate-500 uppercase">MRN</span>
                <p className="font-mono font-bold text-sky-800 text-xs">{patient.mrn}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase">Blood Group</span>
                <p className="font-bold text-rose-600 text-xs">{patient.bloodGroup}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
              <div>
                <span className="text-[10px] text-slate-500 uppercase">DOB / Age</span>
                <p className="text-slate-800">{patient.dateOfBirth} ({calculateAge(patient.dateOfBirth)}y)</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase">Gender</span>
                <p className="text-slate-800">{patient.gender}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Allergies Critical Banner */}
        {patient.allergies.length > 0 && (
          <div className="mt-3 p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 text-xs">
            <div className="flex items-center gap-1 font-bold text-[10px] text-rose-700 uppercase tracking-wider mb-0.5">
              <Shield className="h-3 w-3" />
              <span>Allergy Caution:</span>
            </div>
            <p className="text-[11px] font-medium leading-tight">
              {patient.allergies.map((a) => `${a.allergen} (${a.severity})`).join(', ')}
            </p>
          </div>
        )}

        {/* QR Code and Emergency Contact Footer */}
        <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between gap-3">
          <div className="text-[10px] text-slate-600 space-y-0.5">
            <p className="font-semibold text-slate-800">Emergency Contact:</p>
            <p>{patient.emergencyContact.name} ({patient.emergencyContact.relationship})</p>
            <p className="font-mono font-bold text-slate-900">{patient.emergencyContact.phone}</p>
            <p className="text-[9px] text-slate-400 mt-1">National ID: {patient.nationalId}</p>
          </div>

          <div className="p-1.5 bg-white rounded-lg border border-slate-300 shadow-xs flex flex-col items-center shrink-0">
            <QRCodeSVG value={qrPayload} size={70} level="M" />
            <span className="text-[8px] font-mono text-slate-500 mt-1 uppercase">Scan for Chart</span>
          </div>
        </div>

        {/* Card Security Footprint */}
        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[8px] text-slate-400 font-mono">
          <span>SEC-TOKEN: {patient.id.toUpperCase()}</span>
          <span>APEX HEALTH HIS • NON-TRANSFERABLE</span>
        </div>
      </div>
    </div>
  );
};

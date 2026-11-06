import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  QrCode,
  Search,
  Scan,
  User,
  ShieldCheck,
  ArrowRight,
  Printer,
  Sparkles,
  CheckCircle,
} from 'lucide-react';
import { useEMR } from '../../hooks/useEMR';
import { PatientPrintableCard } from '../patients/PatientPrintableCard';
import { createPatientQRPayload, parsePatientQRPayload } from '../../utils';
import { Patient } from '../../types';

export const QRModulePage: React.FC = () => {
  const { patients } = useEMR();
  const navigate = useNavigate();

  const [scanInput, setScanInput] = useState('');
  const [scannedPatient, setScannedPatient] = useState<Patient | null>(null);
  const [selectedPatientForBadge, setSelectedPatientForBadge] = useState<Patient>(patients[0] || null);

  const handleSimulateScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanInput.trim()) return;

    const parsed = parsePatientQRPayload(scanInput.trim());
    let found: Patient | undefined;

    if (parsed.valid && parsed.mrn) {
      found = patients.find((p) => p.mrn.toUpperCase() === parsed.mrn?.toUpperCase());
    } else {
      // Fallback try match MRN or national ID directly
      found = patients.find(
        (p) =>
          p.mrn.toLowerCase() === scanInput.trim().toLowerCase() ||
          p.nationalId.toLowerCase() === scanInput.trim().toLowerCase()
      );
    }

    if (found) {
      setScannedPatient(found);
    } else {
      alert(`No active patient record matches identifier "${scanInput}".`);
    }
  };

  const handleQuickScanDemo = (p: Patient) => {
    const payload = createPatientQRPayload(p.id, p.mrn, p.nationalId);
    setScanInput(payload);
    setScannedPatient(p);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-sky-50 text-sky-600 rounded-lg">
            <QrCode className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Hospital QR Scanner & Patient Smart Badges
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Rapid patient admission verification, barcode check-in & encoded identity cards
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Scanner Simulation Card */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Scan className="h-5 w-5 text-sky-600" />
              <h3 className="font-bold text-slate-900 text-sm">Optical Barcode / QR Scanner Input</h3>
            </div>

            <form onSubmit={handleSimulateScan} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Scanner Payload / MRN Input
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={scanInput}
                    onChange={(e) => setScanInput(e.target.value)}
                    placeholder="Scan patient card barcode or type MRN (e.g. MRN-2026-104921)..."
                    className="w-full pl-3 pr-24 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:ring-2 focus:ring-sky-500"
                  />
                  <button
                    type="submit"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-semibold"
                  >
                    Resolve
                  </button>
                </div>
              </div>

              {/* Quick Click Demo Barcodes */}
              <div className="pt-2">
                <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                  Simulate Camera Scan of Inpatients:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {patients.slice(0, 4).map((p) => (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => handleQuickScanDemo(p)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-sky-100 text-slate-700 hover:text-sky-800 rounded text-[11px] font-mono transition"
                    >
                      Scan {p.firstName} ({p.mrn.slice(-6)})
                    </button>
                  ))}
                </div>
              </div>
            </form>

            {/* Resolved Scan Result Banner */}
            {scannedPatient && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                    <span>Patient Identity Verified: {scannedPatient.firstName} {scannedPatient.lastName}</span>
                  </div>
                  <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-emerald-300">
                    {scannedPatient.mrn}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-emerald-900">
                  <div>Status: <strong>{scannedPatient.status}</strong></div>
                  <div>Blood Group: <strong>{scannedPatient.bloodGroup}</strong></div>
                  <div>DOB: <strong>{scannedPatient.dateOfBirth}</strong></div>
                  <div>Phone: <strong>{scannedPatient.phone}</strong></div>
                </div>

                <button
                  onClick={() => navigate(`/patients/${scannedPatient.id}`)}
                  className="w-full py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <span>Open Full Clinical EMR Chart</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Printable Smart Badge Generator */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Generate Smart Patient Identity Card</h3>
              {selectedPatientForBadge && (
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1 bg-slate-900 text-white text-xs font-semibold rounded-lg flex items-center gap-1"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print Card</span>
                </button>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Patient for ID Card Preview
              </label>
              <select
                value={selectedPatientForBadge?.id || ''}
                onChange={(e) => {
                  const p = patients.find((pat) => pat.id === e.target.value);
                  if (p) setSelectedPatientForBadge(p);
                }}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName} ({p.mrn})
                  </option>
                ))}
              </select>
            </div>

            {selectedPatientForBadge && (
              <div className="flex justify-center p-4 bg-slate-50 rounded-xl border border-slate-200 overflow-x-auto">
                <PatientPrintableCard patient={selectedPatientForBadge} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

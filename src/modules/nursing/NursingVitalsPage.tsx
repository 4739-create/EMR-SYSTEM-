import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  HeartPulse,
  Activity,
  Bed,
  Users,
  AlertTriangle,
  PlusCircle,
  CheckCircle2,
  FileText,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { useEMR } from '../../hooks/useEMR';
import { StorageService } from '../../services/storageService';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { VitalSign, NursingNote, NursingHandover } from '../../types';
import { calculateBMI, evaluateVitals, formatDateTime } from '../../utils';

export const NursingVitalsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const preselectedPatientId = searchParams.get('patientId') || '';

  const { patients, currentUser, departments, nursingNotes, nursingHandovers } = useEMR();

  const [activeTab, setActiveTab] = useState<'vitals' | 'inpatients' | 'handover'>('vitals');
  const [selectedPatientId, setSelectedPatientId] = useState(preselectedPatientId);

  // Vitals form
  const [systolicBP, setSystolicBP] = useState(120);
  const [diastolicBP, setDiastolicBP] = useState(80);
  const [pulseRate, setPulseRate] = useState(72);
  const [respiratoryRate, setRespiratoryRate] = useState(16);
  const [temperature, setTemperature] = useState(36.8);
  const [oxygenSaturation, setOxygenSaturation] = useState(98);
  const [weightKg, setWeightKg] = useState(70);
  const [heightCm, setHeightCm] = useState(170);
  const [triageCategory, setTriageCategory] = useState<VitalSign['triageCategory']>('Standard (Green)');
  const [notes, setNotes] = useState('');

  // Shift handover form
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);
  const [shiftFrom, setShiftFrom] = useState<'Morning' | 'Afternoon' | 'Night'>('Morning');
  const [shiftTo, setShiftTo] = useState<'Morning' | 'Afternoon' | 'Night'>('Afternoon');
  const [wardName, setWardName] = useState('Cardiology Ward (Ward 3B)');
  const [criticalSummary, setCriticalSummary] = useState('');
  const [pendingOrders, setPendingOrders] = useState('');

  // Selected patient
  const patient = patients.find((p) => p.id === selectedPatientId);

  const currentBMI = useMemo(() => calculateBMI(weightKg, heightCm), [weightKg, heightCm]);

  const vitalsEval = useMemo(
    () =>
      evaluateVitals({
        systolicBP,
        diastolicBP,
        pulseRate,
        temperature,
        oxygenSaturation,
      }),
    [systolicBP, diastolicBP, pulseRate, temperature, oxygenSaturation]
  );

  const handleSaveVitals = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient) {
      alert('Please select a patient before recording vitals.');
      return;
    }

    const newVital: VitalSign = {
      id: 'vit-' + Math.random().toString(36).substring(2, 9),
      patientId: patient.id,
      systolicBP: Number(systolicBP),
      diastolicBP: Number(diastolicBP),
      pulseRate: Number(pulseRate),
      respiratoryRate: Number(respiratoryRate),
      temperature: Number(temperature),
      oxygenSaturation: Number(oxygenSaturation),
      weightKg: Number(weightKg),
      heightCm: Number(heightCm),
      bmi: currentBMI.bmi,
      triageCategory,
      notes: notes || undefined,
      recordedBy: currentUser.name,
      recordedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    const updatedPatient = {
      ...patient,
      vitalsHistory: [newVital, ...patient.vitalsHistory],
    };

    StorageService.savePatient(updatedPatient);

    // Also write a nursing note automatically
    const note: NursingNote = {
      id: 'nn-' + Math.random().toString(36).substring(2, 9),
      patientId: patient.id,
      timestamp: newVital.recordedAt,
      nurseName: currentUser.name,
      noteType: 'General',
      content: `Vitals recorded: BP ${systolicBP}/${diastolicBP}, HR ${pulseRate}, SpO2 ${oxygenSaturation}%, Temp ${temperature}°C. ${notes || ''}`,
      shift: 'Morning',
    };
    StorageService.saveNursingNote(note);

    alert(`Vitals successfully recorded for ${patient.firstName} ${patient.lastName}!`);
    setNotes('');
  };

  const handleSaveHandover = (e: React.FormEvent) => {
    e.preventDefault();
    const handover: NursingHandover = {
      id: 'hnd-' + Math.random().toString(36).substring(2, 9),
      date: new Date().toISOString().split('T')[0],
      shiftFrom,
      shiftTo,
      nurseOut: currentUser.name,
      nurseIn: 'Incoming Charge Nurse',
      wardName,
      totalWardPatients: patients.filter((p) => p.status === 'Inpatient').length,
      criticalPatientsSummary: criticalSummary || 'All ward patients stable without immediate resuscitation alerts.',
      pendingMedicationsOrders: pendingOrders || 'All scheduled IV infusions and oral medications up to date.',
      specialEquipmentNotes: 'Suction units, oxygen manifolds and crash carts inspected and operational.',
    };

    StorageService.saveNursingHandover(handover);
    setIsHandoverModalOpen(false);
    setCriticalSummary('');
    setPendingOrders('');
  };

  // Inpatients list
  const inpatients = patients.filter((p) => p.status === 'Inpatient' || p.status === 'Emergency');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <HeartPulse className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Nursing & Triage Station</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Rapid physiological intake, clinical warning alerts, ward census & shift handover
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('vitals')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeTab === 'vitals' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Record Vitals
          </button>
          <button
            onClick={() => setActiveTab('inpatients')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeTab === 'inpatients' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Ward Census ({inpatients.length})
          </button>
          <button
            onClick={() => setActiveTab('handover')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeTab === 'handover' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Shift Handovers
          </button>
        </div>
      </div>

      {/* Tab 1: Record Vitals */}
      {activeTab === 'vitals' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Patient Selector & Clinical Warning Strip */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 text-sm">Select Patient for Intake</h3>

              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-sky-500"
              >
                <option value="">-- Choose Patient --</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName} ({p.mrn}) - {p.status}
                  </option>
                ))}
              </select>

              {patient ? (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2">
                  <div className="font-bold text-slate-900">
                    {patient.firstName} {patient.lastName}
                  </div>
                  <div className="text-slate-500">MRN: {patient.mrn}</div>
                  <div className="text-slate-500">Status: <Badge variant="primary" size="sm">{patient.status}</Badge></div>
                  {patient.admittedWard && (
                    <div className="text-slate-500">Location: {patient.admittedWard} ({patient.bedNumber})</div>
                  )}

                  {patient.allergies.length > 0 && (
                    <div className="text-rose-600 font-semibold pt-1 border-t border-slate-200 flex items-center gap-1">
                      <ShieldAlert className="h-3.5 w-3.5" />
                      <span>Allergies: {patient.allergies.map((a) => a.allergen).join(', ')}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-sky-50 text-sky-800 rounded-lg text-xs">
                  Please select an outpatient or admitted patient from the list above.
                </div>
              )}
            </div>

            {/* Real-time Physiological Warnings */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-600" />
                <span>Physiological Alert Engine</span>
              </h4>

              {vitalsEval.hasAbnormal ? (
                <div className="space-y-2">
                  {vitalsEval.alerts.map((alert, i) => (
                    <div
                      key={i}
                      className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-medium flex items-center gap-2"
                    >
                      <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                      <span>{alert}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>All evaluated vital parameters fall within standard physiological ranges.</span>
                </div>
              )}
            </div>
          </div>

          {/* Vitals Input Form */}
          <div className="lg:col-span-8">
            <form onSubmit={handleSaveVitals} className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-base">Physiological Parameter Input</h3>
                <span className="text-xs text-slate-500">Nurse: {currentUser.name}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {/* BP Systolic */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Systolic BP (mmHg) *
                  </label>
                  <input
                    type="number"
                    required
                    value={systolicBP}
                    onChange={(e) => setSystolicBP(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900"
                  />
                  <span className="text-[10px] text-slate-400">Normal: 90 - 120</span>
                </div>

                {/* BP Diastolic */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Diastolic BP (mmHg) *
                  </label>
                  <input
                    type="number"
                    required
                    value={diastolicBP}
                    onChange={(e) => setDiastolicBP(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900"
                  />
                  <span className="text-[10px] text-slate-400">Normal: 60 - 80</span>
                </div>

                {/* Heart Rate */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pulse Rate (bpm) *
                  </label>
                  <input
                    type="number"
                    required
                    value={pulseRate}
                    onChange={(e) => setPulseRate(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900"
                  />
                  <span className="text-[10px] text-slate-400">Normal: 60 - 100</span>
                </div>

                {/* Respiratory Rate */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Respiratory Rate (/min) *
                  </label>
                  <input
                    type="number"
                    required
                    value={respiratoryRate}
                    onChange={(e) => setRespiratoryRate(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900"
                  />
                  <span className="text-[10px] text-slate-400">Normal: 12 - 20</span>
                </div>

                {/* Temperature */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Temperature (°C) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={temperature}
                    onChange={(e) => setTemperature(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900"
                  />
                  <span className="text-[10px] text-slate-400">Normal: 36.5 - 37.5</span>
                </div>

                {/* SpO2 */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Oxygen Saturation (% SpO2) *
                  </label>
                  <input
                    type="number"
                    required
                    value={oxygenSaturation}
                    onChange={(e) => setOxygenSaturation(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900"
                  />
                  <span className="text-[10px] text-slate-400">Normal: 95 - 100%</span>
                </div>

                {/* Weight */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={weightKg}
                    onChange={(e) => setWeightKg(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900"
                  />
                </div>

                {/* Height */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Height (cm)</label>
                  <input
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900"
                  />
                </div>

                {/* Computed BMI */}
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-semibold text-slate-500 block">Computed BMI</span>
                  <div className="text-base font-bold text-slate-900 font-mono mt-0.5">
                    {currentBMI.bmi} kg/m²
                  </div>
                  <span className="text-[10px] text-sky-600 font-medium">{currentBMI.classification}</span>
                </div>
              </div>

              {/* Triage Category Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Manchester Emergency Triage Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { val: 'Immediate (Red)', label: 'Immediate (Red)', color: 'border-rose-400 bg-rose-50 text-rose-800' },
                    { val: 'Urgent (Yellow)', label: 'Urgent (Yellow)', color: 'border-amber-400 bg-amber-50 text-amber-800' },
                    { val: 'Standard (Green)', label: 'Standard (Green)', color: 'border-emerald-400 bg-emerald-50 text-emerald-800' },
                    { val: 'Non-urgent (Blue)', label: 'Non-urgent (Blue)', color: 'border-sky-400 bg-sky-50 text-sky-800' },
                  ].map((t) => (
                    <button
                      type="button"
                      key={t.val}
                      onClick={() => setTriageCategory(t.val as VitalSign['triageCategory'])}
                      className={`p-2 rounded-lg border text-xs font-bold transition text-center ${
                        triageCategory === t.val ? `${t.color} ring-2 ring-slate-900` : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nursing Clinical Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nursing Observations & Intake Notes
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Patient demeanor, pain score (1-10), ambulation, immediate complaints or comfort measures taken..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!patient}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold shadow-xs transition"
                >
                  Record & Commit Vitals
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab 2: Inpatient Census & Bed Management */}
      {activeTab === 'inpatients' && (
        <div className="space-y-6">
          {/* Department capacity grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {departments
              .filter((d) => d.bedCapacity > 0)
              .map((d) => (
                <div key={d.id} className="bg-white p-4 rounded-xl border border-slate-200">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-slate-900 text-xs">{d.name}</span>
                    <Badge variant={d.currentOccupancy / d.bedCapacity > 0.85 ? 'danger' : 'success'} size="sm">
                      {Math.round((d.currentOccupancy / d.bedCapacity) * 100)}% Occ
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold text-slate-900">
                    {d.currentOccupancy} / {d.bedCapacity}
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-sky-500 h-full rounded-full"
                      style={{ width: `${(d.currentOccupancy / d.bedCapacity) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>

          {/* Admitted patients table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 font-bold text-slate-900 text-sm">
              Currently Admitted Inpatients & Emergency Bays
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase text-[10px]">
                    <th className="py-3 px-4">Patient Name & MRN</th>
                    <th className="py-3 px-4">Ward / Bed</th>
                    <th className="py-3 px-4">Admission Date</th>
                    <th className="py-3 px-4">Latest Vitals</th>
                    <th className="py-3 px-4">Allergies</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inpatients.map((pat) => {
                    const vit = pat.vitalsHistory[0];
                    return (
                      <tr key={pat.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{pat.firstName} {pat.lastName}</div>
                          <div className="font-mono text-slate-400 text-[10px]">{pat.mrn}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-800">{pat.admittedWard || 'Unassigned'}</div>
                          <div className="text-sky-600 font-bold text-[11px]">{pat.bedNumber}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {pat.admissionDate || pat.registeredDate}
                        </td>
                        <td className="py-3 px-4">
                          {vit ? (
                            <div className="text-[11px] space-y-0.5">
                              <div>BP: <strong>{vit.systolicBP}/{vit.diastolicBP}</strong></div>
                              <div>HR: <strong>{vit.pulseRate}</strong> | SpO2: <strong>{vit.oxygenSaturation}%</strong></div>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">No vitals on file</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {pat.allergies.length > 0 ? (
                            <span className="text-rose-600 font-semibold">{pat.allergies.length} Allergies</span>
                          ) : (
                            <span className="text-slate-400">None</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedPatientId(pat.id);
                              setActiveTab('vitals');
                            }}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-semibold text-[11px]"
                          >
                            Add Vitals
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Shift Handover */}
      {activeTab === 'handover' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-900 text-base">Nursing Shift Handover Reports</h3>
            <button
              onClick={() => setIsHandoverModalOpen(true)}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              + Create Shift Handover
            </button>
          </div>

          <div className="space-y-4">
            {nursingHandovers.map((h) => (
              <div key={h.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="purple" size="sm">{h.shiftFrom} → {h.shiftTo} Shift</Badge>
                    <span className="font-bold text-slate-900 text-sm">{h.wardName}</span>
                  </div>
                  <div className="text-xs text-slate-400">Date: {h.date}</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="font-bold text-slate-700 block mb-1">Critical Patients & Clinical Alerts:</span>
                    <p className="bg-slate-50 p-2.5 rounded border border-slate-200 text-slate-800 leading-relaxed">
                      {h.criticalPatientsSummary}
                    </p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700 block mb-1">Pending Orders & Equipment Status:</span>
                    <p className="bg-slate-50 p-2.5 rounded border border-slate-200 text-slate-800 leading-relaxed">
                      {h.pendingMedicationsOrders}
                    </p>
                  </div>
                </div>

                <div className="pt-2 text-[11px] text-slate-500 flex justify-between border-t border-slate-100">
                  <span>Outgoing Nurse: <strong>{h.nurseOut}</strong></span>
                  <span>Incoming Nurse: <strong>{h.nurseIn}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Handover Modal */}
      <Modal
        isOpen={isHandoverModalOpen}
        onClose={() => setIsHandoverModalOpen(false)}
        title="Record Nurse Shift Handover"
        subtitle="Transfer clinical responsibility between shifts"
        icon={<FileText className="h-5 w-5" />}
        maxWidth="xl"
      >
        <form onSubmit={handleSaveHandover} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Shift From</label>
              <select
                value={shiftFrom}
                onChange={(e) => setShiftFrom(e.target.value as any)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              >
                <option value="Morning">Morning</option>
                <option value="Afternoon">Afternoon</option>
                <option value="Night">Night</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Shift To</label>
              <select
                value={shiftTo}
                onChange={(e) => setShiftTo(e.target.value as any)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              >
                <option value="Afternoon">Afternoon</option>
                <option value="Night">Night</option>
                <option value="Morning">Morning</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Ward</label>
            <input
              type="text"
              value={wardName}
              onChange={(e) => setWardName(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Critical Patient Summary</label>
            <textarea
              rows={3}
              required
              value={criticalSummary}
              onChange={(e) => setCriticalSummary(e.target.value)}
              placeholder="Highlight unstable patients, rhythm changes, drainage volumes..."
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Pending Orders / Labs</label>
            <textarea
              rows={2}
              value={pendingOrders}
              onChange={(e) => setPendingOrders(e.target.value)}
              placeholder="Pending serial troponins, CT scan transports, blood transfusions..."
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setIsHandoverModalOpen(false)}
              className="px-4 py-2 border rounded-lg text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-sky-600 text-white font-semibold rounded-lg text-xs"
            >
              Save Handover
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

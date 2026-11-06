import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Stethoscope,
  User,
  HeartPulse,
  AlertTriangle,
  Pill,
  FlaskConical,
  FileScan,
  CheckCircle,
  ArrowLeft,
  PlusCircle,
  Trash2,
  Calendar,
  Save,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { useEMR } from '../../hooks/useEMR';
import { StorageService } from '../../services/storageService';
import { Badge } from '../../components/ui/Badge';
import { ConsultationRecord, PrescriptionItem, PhysicalExamination } from '../../types';
import { calculateAge, calculateBMI, formatDate } from '../../utils';

export const DoctorConsultationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { patients, currentUser, appointments } = useEMR();

  const patient = patients.find((p) => p.id === id);

  // Form states
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [historyOfPresentIllness, setHistoryOfPresentIllness] = useState('');
  const [icd10Code, setIcd10Code] = useState('R06.02 - Shortness of breath');
  const [diagnosis, setDiagnosis] = useState('');
  const [differentialDiagnosis, setDifferentialDiagnosis] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');

  // Physical Exam
  const [physicalExam, setPhysicalExam] = useState<PhysicalExamination>({
    generalAppearance: 'Alert and oriented x 3, in no acute distress.',
    cardiovascular: 'Regular rate and rhythm. S1 and S2 present. No murmurs or gallops.',
    respiratory: 'Lungs clear to auscultation bilaterally. No rales, rhonchi or wheezing.',
    abdominal: 'Soft, non-tender, non-distended. Normal active bowel sounds.',
    neurological: 'Grossly intact neurological examination.',
    extremities: 'No cyanosis, clubbing or peripheral edema.',
    skin: 'Warm, dry, intact without suspicious lesions.',
  });

  // Prescriptions list
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([]);
  const [rxDrugName, setRxDrugName] = useState('');
  const [rxDosage, setRxDosage] = useState('500 mg');
  const [rxFrequency, setRxFrequency] = useState('Twice Daily (BID)');
  const [rxDurationDays, setRxDurationDays] = useState(7);
  const [rxRoute, setRxRoute] = useState<PrescriptionItem['route']>('Oral');
  const [rxInstructions, setRxInstructions] = useState('Take with food and full glass of water.');

  // Lab and Radiology requests
  const [labRequests, setLabRequests] = useState<string[]>([]);
  const [newLabTest, setNewLabTest] = useState('Complete Blood Count (CBC)');
  const [radiologyRequests, setRadiologyRequests] = useState<string[]>([]);
  const [newRadTest, setNewRadTest] = useState('Digital Chest X-Ray');

  if (!patient) {
    return (
      <div className="bg-white p-8 rounded-xl border border-slate-200 text-center space-y-4">
        <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Patient Not Found</h2>
        <p className="text-xs text-slate-500">The requested patient record could not be loaded.</p>
        <button
          onClick={() => navigate('/doctor')}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold"
        >
          Return to Doctor Workstation
        </button>
      </div>
    );
  }

  const latestVitals = patient.vitalsHistory[0];

  const handleAddPrescription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rxDrugName.trim()) return;

    const item: PrescriptionItem = {
      id: 'rx-' + Math.random().toString(36).substring(2, 9),
      medicationName: rxDrugName,
      dosage: rxDosage,
      frequency: rxFrequency,
      durationDays: Number(rxDurationDays),
      route: rxRoute,
      instructions: rxInstructions,
      status: 'Pending',
      prescribedBy: currentUser.name,
      prescribedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    setPrescriptions([...prescriptions, item]);
    setRxDrugName('');
  };

  const handleRemovePrescription = (id: string) => {
    setPrescriptions(prescriptions.filter((p) => p.id !== id));
  };

  const handleAddLab = () => {
    if (!newLabTest || labRequests.includes(newLabTest)) return;
    setLabRequests([...labRequests, newLabTest]);
  };

  const handleAddRad = () => {
    if (!newRadTest || radiologyRequests.includes(newRadTest)) return;
    setRadiologyRequests([...radiologyRequests, newRadTest]);
  };

  const handleSubmitConsultation = () => {
    if (!diagnosis.trim()) {
      alert('Please enter a clinical primary diagnosis before finalizing.');
      return;
    }

    const consult: ConsultationRecord = {
      id: 'cns-' + Math.random().toString(36).substring(2, 9),
      patientId: patient.id,
      doctorId: currentUser.id,
      doctorName: currentUser.name,
      department: currentUser.department || 'Internal Medicine',
      consultationDate: new Date().toISOString().split('T')[0],
      chiefComplaint: chiefComplaint || 'Routine medical review',
      historyOfPresentIllness,
      physicalExam,
      icd10Code,
      diagnosis,
      differentialDiagnosis,
      treatmentPlan,
      clinicalNotes,
      prescriptions,
      labRequests,
      radiologyRequests,
      followUpDate: followUpDate || undefined,
      vitalSignSnapshot: latestVitals,
    };

    StorageService.saveConsultation(consult);

    // If an appointment exists for this patient today, mark it completed
    const matchingApt = appointments.find(
      (a) => a.patientId === patient.id && (a.status === 'Checked In' || a.status === 'In Consultation')
    );
    if (matchingApt) {
      StorageService.saveAppointment({
        ...matchingApt,
        status: 'Completed',
      });
    }

    alert('Clinical consultation saved successfully!');
    navigate(`/patients/${patient.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation & Patient Summary Banner */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/patients/${patient.id}`)}
            className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold"
          >
            View Patient History & Chart
          </button>
          <button
            onClick={handleSubmitConsultation}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs"
          >
            <Save className="h-4 w-4" />
            <span>Sign & Finalize Encounter</span>
          </button>
        </div>
      </div>

      {/* Patient Banner */}
      <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-sky-500 flex items-center justify-center text-white text-lg font-bold shrink-0">
              {patient.firstName[0]}
              {patient.lastName[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white">
                  {patient.firstName} {patient.lastName}
                </h1>
                <Badge variant="primary" size="sm">
                  {patient.status}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 mt-1">
                <span>MRN: <strong className="text-white font-mono">{patient.mrn}</strong></span>
                <span>DOB: <strong>{formatDate(patient.dateOfBirth)} ({calculateAge(patient.dateOfBirth)} yrs)</strong></span>
                <span>Sex: <strong>{patient.gender}</strong></span>
                <span>Blood: <strong className="text-rose-400">{patient.bloodGroup}</strong></span>
              </div>
            </div>
          </div>

          {/* Vitals Snapshot in Banner */}
          {latestVitals && (
            <div className="flex flex-wrap gap-2 text-xs bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
              <div className="px-2 border-r border-slate-700">
                <span className="text-slate-400 text-[10px] block">BP</span>
                <span className="font-bold text-white">{latestVitals.systolicBP}/{latestVitals.diastolicBP}</span>
              </div>
              <div className="px-2 border-r border-slate-700">
                <span className="text-slate-400 text-[10px] block">PULSE</span>
                <span className="font-bold text-white">{latestVitals.pulseRate} bpm</span>
              </div>
              <div className="px-2 border-r border-slate-700">
                <span className="text-slate-400 text-[10px] block">TEMP</span>
                <span className="font-bold text-white">{latestVitals.temperature}°C</span>
              </div>
              <div className="px-2">
                <span className="text-slate-400 text-[10px] block">SpO2</span>
                <span className="font-bold text-white">{latestVitals.oxygenSaturation}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Allergy Warning */}
        {patient.allergies.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-800 flex items-center gap-2 text-rose-300 text-xs">
            <ShieldAlert className="h-4 w-4 shrink-0 text-rose-400" />
            <span>
              <strong>Allergy Alerts: </strong>
              {patient.allergies.map((a) => `${a.allergen} (${a.severity})`).join(', ')}
            </span>
          </div>
        )}
      </div>

      {/* Main Clinical Note Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Subjective & Objective Documentation */}
        <div className="lg:col-span-7 space-y-6">
          {/* Chief Complaint & HPI */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Stethoscope className="h-4 w-4 text-sky-600" />
              <h3 className="font-bold text-slate-900 text-sm">Subjective: Chief Complaint & History</h3>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Chief Complaint *</label>
              <input
                type="text"
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                placeholder="e.g. Chest tightness with exertion, persistent cough x 3 weeks..."
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                History of Present Illness (HPI)
              </label>
              <textarea
                rows={4}
                value={historyOfPresentIllness}
                onChange={(e) => setHistoryOfPresentIllness(e.target.value)}
                placeholder="Detailed narrative: onset, duration, character, aggravating/relieving factors, associated symptoms..."
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Physical Examination */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <HeartPulse className="h-4 w-4 text-sky-600" />
              <h3 className="font-bold text-slate-900 text-sm">Objective: Physical Examination</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-0.5">Cardiovascular</label>
                <input
                  type="text"
                  value={physicalExam.cardiovascular}
                  onChange={(e) => setPhysicalExam({ ...physicalExam, cardiovascular: e.target.value })}
                  className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-0.5">Respiratory</label>
                <input
                  type="text"
                  value={physicalExam.respiratory}
                  onChange={(e) => setPhysicalExam({ ...physicalExam, respiratory: e.target.value })}
                  className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-0.5">Abdominal</label>
                <input
                  type="text"
                  value={physicalExam.abdominal}
                  onChange={(e) => setPhysicalExam({ ...physicalExam, abdominal: e.target.value })}
                  className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-0.5">Neurological</label>
                <input
                  type="text"
                  value={physicalExam.neurological}
                  onChange={(e) => setPhysicalExam({ ...physicalExam, neurological: e.target.value })}
                  className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-0.5">General Appearance</label>
                <input
                  type="text"
                  value={physicalExam.generalAppearance}
                  onChange={(e) => setPhysicalExam({ ...physicalExam, generalAppearance: e.target.value })}
                  className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-0.5">Extremities</label>
                <input
                  type="text"
                  value={physicalExam.extremities}
                  onChange={(e) => setPhysicalExam({ ...physicalExam, extremities: e.target.value })}
                  className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded text-xs"
                />
              </div>
            </div>
          </div>

          {/* Assessment & Diagnosis */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <CheckCircle className="h-4 w-4 text-sky-600" />
              <h3 className="font-bold text-slate-900 text-sm">Assessment & Clinical Diagnosis</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Diagnosis *</label>
                <input
                  type="text"
                  required
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="e.g. Essential Hypertension, Bronchial Asthma Exacerbation"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ICD-10 Code</label>
                <select
                  value={icd10Code}
                  onChange={(e) => setIcd10Code(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900"
                >
                  <option value="I10 - Essential (primary) hypertension">I10 - Essential hypertension</option>
                  <option value="J45.909 - Unspecified Asthma">J45.909 - Unspecified Asthma</option>
                  <option value="E11.9 - Type 2 Diabetes Mellitus">E11.9 - Type 2 Diabetes</option>
                  <option value="K35.80 - Acute Appendicitis">K35.80 - Acute Appendicitis</option>
                  <option value="I50.9 - Heart Failure, Unspecified">I50.9 - Heart Failure</option>
                  <option value="J06.9 - Acute Upper Respiratory Infection">J06.9 - Upper Resp Infection</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Differential Diagnosis</label>
              <input
                type="text"
                value={differentialDiagnosis}
                onChange={(e) => setDifferentialDiagnosis(e.target.value)}
                placeholder="e.g. GERD, Costochondritis, Pulmonary embolism"
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Treatment Plan</label>
              <textarea
                rows={3}
                value={treatmentPlan}
                onChange={(e) => setTreatmentPlan(e.target.value)}
                placeholder="Prescribe medications, dietary modifications, follow-up schedule..."
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Prescriptions & Diagnostic Orders */}
        <div className="lg:col-span-5 space-y-6">
          {/* E-Prescriptions */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Pill className="h-4 w-4 text-sky-600" />
              <h3 className="font-bold text-slate-900 text-sm">E-Prescription & Pharmacy Orders</h3>
            </div>

            {/* Added medications list */}
            {prescriptions.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No medications prescribed yet.</p>
            ) : (
              <div className="space-y-2">
                {prescriptions.map((rx) => (
                  <div
                    key={rx.id}
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-start justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{rx.medicationName} ({rx.dosage})</div>
                      <div className="text-slate-500 text-[11px] mt-0.5">
                        {rx.frequency} • {rx.route} • {rx.durationDays} days
                      </div>
                      <div className="text-slate-400 text-[10px] italic">{rx.instructions}</div>
                    </div>
                    <button
                      onClick={() => handleRemovePrescription(rx.id)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Quick add drug */}
            <form onSubmit={handleAddPrescription} className="pt-2 border-t border-slate-100 space-y-2">
              <div className="font-semibold text-slate-800 text-xs">Add Medication</div>
              <input
                type="text"
                value={rxDrugName}
                onChange={(e) => setRxDrugName(e.target.value)}
                placeholder="Medication name (e.g. Atorvastatin, Metformin)..."
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-slate-500">Dosage</label>
                  <input
                    type="text"
                    value={rxDosage}
                    onChange={(e) => setRxDosage(e.target.value)}
                    className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500">Frequency</label>
                  <input
                    type="text"
                    value={rxFrequency}
                    onChange={(e) => setRxFrequency(e.target.value)}
                    className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-slate-500">Duration (Days)</label>
                  <input
                    type="number"
                    value={rxDurationDays}
                    onChange={(e) => setRxDurationDays(Number(e.target.value))}
                    className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500">Route</label>
                  <select
                    value={rxRoute}
                    onChange={(e) => setRxRoute(e.target.value as PrescriptionItem['route'])}
                    className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded"
                  >
                    <option value="Oral">Oral</option>
                    <option value="Intravenous">Intravenous</option>
                    <option value="Inhalation">Inhalation</option>
                    <option value="Subcutaneous">Subcutaneous</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 font-semibold rounded text-xs border border-sky-200"
              >
                + Add Medication
              </button>
            </form>
          </div>

          {/* Diagnostic Lab & Imaging Orders */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <FlaskConical className="h-4 w-4 text-sky-600" />
              <h3 className="font-bold text-slate-900 text-sm">Laboratory & Radiology Orders</h3>
            </div>

            {/* Lab Orders */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-700">Lab Tests Requested ({labRequests.length})</div>
              {labRequests.map((l, i) => (
                <div key={i} className="text-xs bg-slate-50 p-2 rounded flex justify-between items-center">
                  <span>{l}</span>
                  <button onClick={() => setLabRequests(labRequests.filter((_, idx) => idx !== i))} className="text-slate-400 hover:text-rose-600">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <select
                  value={newLabTest}
                  onChange={(e) => setNewLabTest(e.target.value)}
                  className="flex-1 p-1.5 bg-slate-50 border border-slate-200 rounded text-xs"
                >
                  <option value="Complete Blood Count (CBC)">Complete Blood Count (CBC)</option>
                  <option value="Comprehensive Metabolic Panel (CMP)">Comprehensive Metabolic Panel</option>
                  <option value="Lipid Panel">Lipid Panel</option>
                  <option value="Cardiac Troponin I & NT-proBNP">Cardiac Troponin I & NT-proBNP</option>
                  <option value="HbA1c Glycated Hemoglobin">HbA1c Glycated Hemoglobin</option>
                  <option value="Urinalysis Complete">Urinalysis Complete</option>
                </select>
                <button
                  type="button"
                  onClick={handleAddLab}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded"
                >
                  Add Lab
                </button>
              </div>
            </div>

            {/* Radiology Orders */}
            <div className="space-y-2 pt-3 border-t border-slate-100">
              <div className="text-xs font-semibold text-slate-700">Radiology Imaging ({radiologyRequests.length})</div>
              {radiologyRequests.map((r, i) => (
                <div key={i} className="text-xs bg-slate-50 p-2 rounded flex justify-between items-center">
                  <span>{r}</span>
                  <button onClick={() => setRadiologyRequests(radiologyRequests.filter((_, idx) => idx !== i))} className="text-slate-400 hover:text-rose-600">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <select
                  value={newRadTest}
                  onChange={(e) => setNewRadTest(e.target.value)}
                  className="flex-1 p-1.5 bg-slate-50 border border-slate-200 rounded text-xs"
                >
                  <option value="Digital Chest X-Ray">Digital Chest X-Ray</option>
                  <option value="Abdominal Ultrasound">Abdominal Ultrasound</option>
                  <option value="CT Chest with Contrast">CT Chest with Contrast</option>
                  <option value="Brain MRI Non-Contrast">Brain MRI Non-Contrast</option>
                </select>
                <button
                  type="button"
                  onClick={handleAddRad}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded"
                >
                  Add Image
                </button>
              </div>
            </div>
          </div>

          {/* Follow-up & Finalize */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="text-xs font-semibold text-slate-700">Follow-up Consultation Date</div>
            <input
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
            />

            <button
              onClick={handleSubmitConsultation}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-xs transition"
            >
              Sign & Save Consultation Note
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

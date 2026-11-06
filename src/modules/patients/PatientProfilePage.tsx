import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  User,
  HeartPulse,
  Stethoscope,
  Calendar,
  ShieldAlert,
  FileText,
  Printer,
  Edit,
  ArrowLeft,
  Clock,
  PlusCircle,
  Activity,
  CheckCircle,
  Building,
  Phone,
  Mail,
  MapPin,
  AlertTriangle,
} from 'lucide-react';
import { useEMR } from '../../hooks/useEMR';
import { StorageService } from '../../services/storageService';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { PatientPrintableCard } from './PatientPrintableCard';
import { calculateAge, calculateBMI, createPatientQRPayload, formatDate, formatDateTime } from '../../utils';
import { Patient, PatientStatus, Allergy, MedicalHistoryItem } from '../../types';

export const PatientProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { patients, consultations, labTests, invoices } = useEMR();

  const [activeTab, setActiveTab] = useState<'clinical' | 'vitals' | 'allergies' | 'history' | 'billing'>('clinical');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isEditStatusModalOpen, setIsEditStatusModalOpen] = useState(false);
  const [isAddAllergyModalOpen, setIsAddAllergyModalOpen] = useState(false);
  const [isAddConditionModalOpen, setIsAddConditionModalOpen] = useState(false);

  // Form states for in-place modifications
  const [newStatus, setNewStatus] = useState<PatientStatus>('Outpatient');
  const [newWard, setNewWard] = useState('');
  const [newBed, setNewBed] = useState('');

  // Allergy form state
  const [allergenName, setAllergenName] = useState('');
  const [allergyCategory, setAllergyCategory] = useState<'Medication' | 'Food' | 'Environmental' | 'Other'>('Medication');
  const [allergySeverity, setAllergySeverity] = useState<'Mild' | 'Moderate' | 'Severe' | 'Life Threatening'>('Severe');
  const [allergyReaction, setAllergyReaction] = useState('');

  // Condition form state
  const [conditionName, setConditionName] = useState('');
  const [conditionDate, setConditionDate] = useState(new Date().toISOString().split('T')[0]);

  const patient = patients.find((p) => p.id === id);

  if (!patient) {
    return (
      <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
        <User className="h-12 w-12 text-slate-300 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-800">Patient Record Not Found</h2>
        <p className="text-xs text-slate-500 mt-1">
          The requested patient ID does not exist in the electronic records system.
        </p>
        <button
          onClick={() => navigate('/patients')}
          className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold"
        >
          Back to Directory
        </button>
      </div>
    );
  }

  const patientConsultations = consultations.filter((c) => c.patientId === patient.id);
  const patientLabTests = labTests.filter((l) => l.patientId === patient.id);
  const patientInvoices = invoices.filter((i) => i.patientId === patient.id);
  const qrPayload = createPatientQRPayload(patient.id, patient.mrn, patient.nationalId);

  const handleUpdateStatus = () => {
    const updated: Patient = {
      ...patient,
      status: newStatus,
      admittedWard: newStatus === 'Inpatient' || newStatus === 'Emergency' ? newWard || patient.admittedWard : undefined,
      bedNumber: newStatus === 'Inpatient' ? newBed || patient.bedNumber : undefined,
    };
    StorageService.savePatient(updated);
    setIsEditStatusModalOpen(false);
  };

  const handleAddAllergy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allergenName.trim()) return;

    const newAllergy: Allergy = {
      id: 'alg-' + Math.random().toString(36).substring(2, 6),
      allergen: allergenName,
      category: allergyCategory,
      severity: allergySeverity,
      reaction: allergyReaction || 'Anaphylactoid / Hyper-reactivity',
      diagnosedDate: new Date().toISOString().split('T')[0],
    };

    const updated: Patient = {
      ...patient,
      allergies: [...patient.allergies, newAllergy],
    };
    StorageService.savePatient(updated);
    setAllergenName('');
    setAllergyReaction('');
    setIsAddAllergyModalOpen(false);
  };

  const handleAddCondition = (e: React.FormEvent) => {
    e.preventDefault();
    if (!conditionName.trim()) return;

    const newCond: MedicalHistoryItem = {
      id: 'medh-' + Math.random().toString(36).substring(2, 6),
      condition: conditionName,
      diagnosisDate: conditionDate,
      status: 'Active',
    };

    const updated: Patient = {
      ...patient,
      medicalHistory: [...patient.medicalHistory, newCond],
    };
    StorageService.savePatient(updated);
    setConditionName('');
    setIsAddConditionModalOpen(false);
  };

  const latestVitals = patient.vitalsHistory[0];

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/patients')}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Patient Directory</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => navigate(`/doctor/consultation/${patient.id}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-700 hover:bg-sky-800 text-white rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <Stethoscope className="h-3.5 w-3.5" />
            <span>Consult Patient</span>
          </button>
          <button
            onClick={() => navigate(`/nursing?patientId=${patient.id}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <HeartPulse className="h-3.5 w-3.5" />
            <span>Record Vitals</span>
          </button>
          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>ID Card / Badge</span>
          </button>
        </div>
      </div>

      {/* Patient Master Demographics Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 overflow-hidden relative">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Avatar */}
            <div className="h-20 w-20 rounded-2xl bg-sky-100 text-sky-900 border-2 border-sky-300 flex items-center justify-center font-bold text-2xl shadow-inner shrink-0">
              {patient.firstName[0]}
              {patient.lastName[0]}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {patient.firstName} {patient.lastName}
                </h1>
                <span className="font-mono text-xs font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                  {patient.mrn}
                </span>
                <Badge
                  variant={
                    patient.status === 'Emergency'
                      ? 'danger'
                      : patient.status === 'Inpatient'
                      ? 'primary'
                      : 'success'
                  }
                  size="md"
                >
                  {patient.status}
                </Badge>
                <button
                  onClick={() => {
                    setNewStatus(patient.status);
                    setNewWard(patient.admittedWard || '');
                    setNewBed(patient.bedNumber || '');
                    setIsEditStatusModalOpen(true);
                  }}
                  className="text-[11px] text-sky-600 hover:text-sky-800 font-semibold underline"
                >
                  Change Status
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 pt-1">
                <span>{patient.gender}</span>
                <span>•</span>
                <span>{calculateAge(patient.dateOfBirth)} years old (DOB: {patient.dateOfBirth})</span>
                <span>•</span>
                <span>
                  Blood Group: <strong className="text-rose-600 font-bold">{patient.bloodGroup}</strong>
                </span>
                <span>•</span>
                <span>National ID: <strong className="font-mono">{patient.nationalId}</strong></span>
              </div>

              {/* Location info if inpatient */}
              {patient.admittedWard && (
                <div className="flex items-center gap-2 text-xs font-medium text-slate-700 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200 inline-flex mt-1">
                  <Building className="h-3.5 w-3.5 text-sky-600" />
                  <span>
                    Location: <strong>{patient.admittedWard}</strong> {patient.bedNumber && `• ${patient.bedNumber}`}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Quick QR code preview & contact snippet */}
          <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200 shrink-0">
            <div className="bg-white p-1 rounded-lg border border-slate-200 shadow-xs">
              <QRCodeSVG value={qrPayload} size={64} level="M" />
            </div>
            <div className="text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                <span>{patient.phone}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                <span className="truncate max-w-[160px]">{patient.email}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                <span>{patient.city}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Critical Allergies Ribbon */}
        {patient.allergies.length > 0 && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-xs text-rose-900 uppercase tracking-wider">
                  Documented Medical Allergies ({patient.allergies.length})
                </span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {patient.allergies.map((alg) => (
                    <span
                      key={alg.id}
                      className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-rose-200 text-xs font-semibold text-rose-800"
                    >
                      <span>{alg.allergen}</span>
                      <span className="text-[10px] text-rose-500 font-normal">({alg.severity})</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsAddAllergyModalOpen(true)}
              className="text-xs font-bold text-rose-700 hover:text-rose-900 hover:underline shrink-0"
            >
              + Add Allergy
            </button>
          </div>
        )}
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-200 bg-white px-4 rounded-t-xl">
        <button
          onClick={() => setActiveTab('clinical')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition ${
            activeTab === 'clinical'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Clinical Summary & Notes ({patientConsultations.length})
        </button>
        <button
          onClick={() => setActiveTab('vitals')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition ${
            activeTab === 'vitals'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Vital Signs ({patient.vitalsHistory.length})
        </button>
        <button
          onClick={() => setActiveTab('allergies')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition ${
            activeTab === 'allergies'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Allergies & Alerts ({patient.allergies.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition ${
            activeTab === 'history'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Medical & Surgical History ({patient.medicalHistory.length})
        </button>
        <button
          onClick={() => setActiveTab('billing')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition ${
            activeTab === 'billing'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Invoices & Payments ({patientInvoices.length})
        </button>
      </div>

      {/* Tab 1: Clinical Consultations */}
      {activeTab === 'clinical' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">Physician Consultations & Encounters</h3>
            <button
              onClick={() => navigate(`/doctor/consultation/${patient.id}`)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-700 hover:bg-sky-800 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Record New Consultation</span>
            </button>
          </div>

          {patientConsultations.length === 0 ? (
            <div className="bg-white p-8 text-center rounded-xl border border-slate-200">
              <Stethoscope className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-xs text-slate-700">No past clinical consultations recorded</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Click 'Record New Consultation' to document an encounter.</p>
            </div>
          ) : (
            patientConsultations.map((cns) => (
              <div key={cns.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                  <div>
                    <span className="text-xs font-bold text-slate-900">{cns.diagnosis}</span>
                    <p className="text-[11px] text-slate-500">
                      Encounter Date: {cns.consultationDate} • Department: {cns.department}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                      {cns.doctorName}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="font-bold text-slate-700 block mb-1">Chief Complaint</span>
                    <p className="text-slate-600">{cns.chiefComplaint}</p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="font-bold text-slate-700 block mb-1">History of Present Illness (HPI)</span>
                    <p className="text-slate-600">{cns.historyOfPresentIllness}</p>
                  </div>
                </div>

                <div className="text-xs bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                  <span className="font-bold text-slate-700 block mb-1">Treatment Plan & Directives</span>
                  <p className="text-slate-600 leading-relaxed">{cns.treatmentPlan}</p>
                </div>

                {/* E-Prescriptions */}
                {cns.prescriptions.length > 0 && (
                  <div className="border-t border-slate-100 pt-3">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                      Prescribed Electronic Medications ({cns.prescriptions.length})
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {cns.prescriptions.map((rx) => (
                        <div key={rx.id} className="p-2.5 bg-sky-50/70 border border-sky-100 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-900">{rx.medicationName}</span>
                            <Badge variant="primary" size="sm">{rx.status}</Badge>
                          </div>
                          <div className="text-[11px] text-slate-600 mt-1">
                            {rx.dosage} • {rx.frequency} • {rx.route} ({rx.durationDays} days)
                          </div>
                          <p className="text-[10px] text-slate-500 italic mt-0.5">{rx.instructions}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Vitals */}
      {activeTab === 'vitals' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">Recorded Vital Signs History</h3>
            <button
              onClick={() => navigate(`/nursing?patientId=${patient.id}`)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              <HeartPulse className="h-4 w-4" />
              <span>Record New Vitals</span>
            </button>
          </div>

          {patient.vitalsHistory.length === 0 ? (
            <div className="bg-white p-8 text-center rounded-xl border border-slate-200">
              <HeartPulse className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-xs text-slate-700">No vitals currently recorded</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {patient.vitalsHistory.map((vit) => (
                <div key={vit.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-slate-400" />
                      <span className="font-bold text-xs text-slate-800">{vit.recordedAt}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-xs text-slate-500">By: {vit.recordedBy}</span>
                    </div>
                    <Badge
                      variant={
                        vit.triageCategory.includes('Red')
                          ? 'danger'
                          : vit.triageCategory.includes('Yellow')
                          ? 'warning'
                          : 'success'
                      }
                      size="sm"
                    >
                      {vit.triageCategory}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-500">Blood Pressure</span>
                      <p className="text-base font-extrabold text-slate-900 mt-0.5">
                        {vit.systolicBP}/{vit.diastolicBP}
                      </p>
                      <span className="text-[10px] text-slate-400">mmHg</span>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-500">Pulse / HR</span>
                      <p className="text-base font-extrabold text-slate-900 mt-0.5">{vit.pulseRate}</p>
                      <span className="text-[10px] text-slate-400">bpm</span>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-500">Temp</span>
                      <p className="text-base font-extrabold text-slate-900 mt-0.5">{vit.temperature}</p>
                      <span className="text-[10px] text-slate-400">°C</span>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-500">Oxygen (SpO2)</span>
                      <p className="text-base font-extrabold text-slate-900 mt-0.5">{vit.oxygenSaturation}%</p>
                      <span className="text-[10px] text-slate-400">Pulse Oximetry</span>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-500">Resp Rate</span>
                      <p className="text-base font-extrabold text-slate-900 mt-0.5">{vit.respiratoryRate}</p>
                      <span className="text-[10px] text-slate-400">breaths/min</span>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-500">Weight & BMI</span>
                      <p className="text-base font-extrabold text-slate-900 mt-0.5">{vit.weightKg} kg</p>
                      <span className="text-[10px] text-slate-400">BMI: {vit.bmi}</span>
                    </div>
                  </div>

                  {vit.notes && (
                    <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                      <strong>Nursing Assessment:</strong> {vit.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Allergies */}
      {activeTab === 'allergies' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">Recorded Allergies & Adverse Reactions</h3>
            <button
              onClick={() => setIsAddAllergyModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Add Verified Allergy</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {patient.allergies.length === 0 ? (
              <div className="col-span-2 bg-white p-8 text-center rounded-xl border border-slate-200 text-slate-500 text-xs">
                No known drug or environmental allergies on file.
              </div>
            ) : (
              patient.allergies.map((alg) => (
                <div key={alg.id} className="bg-white p-4 rounded-xl border border-rose-200 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-900 text-sm">{alg.allergen}</span>
                    <Badge variant="danger" size="sm">{alg.severity}</Badge>
                  </div>
                  <div className="text-xs text-slate-600">
                    <span className="font-semibold text-slate-800">Category:</span> {alg.category}
                  </div>
                  <div className="text-xs text-slate-600">
                    <span className="font-semibold text-slate-800">Reaction:</span> {alg.reaction}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Medical History */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">Chronic Conditions & Surgical Interventions</h3>
            <button
              onClick={() => setIsAddConditionModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-700 hover:bg-sky-800 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Add Condition</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Past & Chronic Medical Conditions</h4>
            {patient.medicalHistory.length === 0 ? (
              <p className="text-xs text-slate-400">No previous conditions logged.</p>
            ) : (
              <div className="space-y-2">
                {patient.medicalHistory.map((item) => (
                  <div key={item.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-slate-900">{item.condition}</span>
                      <p className="text-slate-500 text-[11px]">Diagnosed: {item.diagnosisDate} {item.notes && `• ${item.notes}`}</p>
                    </div>
                    <Badge variant="secondary" size="sm">{item.status}</Badge>
                  </div>
                ))}
              </div>
            )}

            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 pt-4 border-t border-slate-100">
              Surgical Interventions
            </h4>
            {patient.surgicalHistory.length === 0 ? (
              <p className="text-xs text-slate-400">No surgical procedures recorded.</p>
            ) : (
              <div className="space-y-2">
                {patient.surgicalHistory.map((surg) => (
                  <div key={surg.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                    <span className="font-bold text-slate-900">{surg.procedure}</span>
                    <p className="text-slate-500 text-[11px]">
                      Date: {surg.date} • Hospital: {surg.hospital || 'Metro Health'} • Surgeon: {surg.surgeon || 'Staff'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Invoices */}
      {activeTab === 'billing' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">Patient Billing & Account Invoices</h3>
            <button
              onClick={() => navigate('/billing')}
              className="text-xs font-semibold text-sky-700 hover:underline"
            >
              Open Cashier Desk →
            </button>
          </div>

          {patientInvoices.length === 0 ? (
            <div className="bg-white p-8 text-center rounded-xl border border-slate-200 text-slate-500 text-xs">
              No outstanding or historical invoices generated for this patient.
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 uppercase text-[10px] text-slate-500">
                  <tr>
                    <th className="p-3">Invoice #</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Total Amount</th>
                    <th className="p-3">Insurance Paid</th>
                    <th className="p-3">Patient Balance Due</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {patientInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-semibold">{inv.invoiceNumber}</td>
                      <td className="p-3">{inv.date}</td>
                      <td className="p-3 font-semibold">${inv.totalAmount.toFixed(2)}</td>
                      <td className="p-3 text-emerald-700 font-medium">${inv.insuranceCoveredAmount.toFixed(2)}</td>
                      <td className="p-3 font-bold text-rose-700">${inv.balanceDue.toFixed(2)}</td>
                      <td className="p-3">
                        <Badge
                          variant={inv.status === 'Paid' ? 'success' : inv.status === 'Partially Paid' ? 'warning' : 'danger'}
                          size="sm"
                        >
                          {inv.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal: Printable Patient ID Card */}
      {isPrintModalOpen && (
        <Modal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          title="Patient Identification Card"
          subtitle={`Official credential for ${patient.firstName} ${patient.lastName}`}
          maxWidth="lg"
          icon={<Printer className="h-5 w-5" />}
        >
          <PatientPrintableCard patient={patient} onClose={() => setIsPrintModalOpen(false)} />
        </Modal>
      )}

      {/* Modal: Update Care Status */}
      {isEditStatusModalOpen && (
        <Modal
          isOpen={isEditStatusModalOpen}
          onClose={() => setIsEditStatusModalOpen(false)}
          title="Modify Patient Status & Ward Allocation"
          maxWidth="md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Care Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as PatientStatus)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold"
              >
                <option value="Outpatient">Outpatient</option>
                <option value="Inpatient">Inpatient (Admit to Ward)</option>
                <option value="Emergency">Emergency Trauma Bay</option>
                <option value="Discharged">Discharged</option>
              </select>
            </div>

            {newStatus === 'Inpatient' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ward Name</label>
                  <input
                    type="text"
                    value={newWard}
                    onChange={(e) => setNewWard(e.target.value)}
                    placeholder="e.g. Cardiology Ward (Ward 3B)"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Bed Number</label>
                  <input
                    type="text"
                    value={newBed}
                    onChange={(e) => setNewBed(e.target.value)}
                    placeholder="e.g. Bed 308"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </>
            )}

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => setIsEditStatusModalOpen(false)}
                className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStatus}
                className="px-4 py-1.5 bg-sky-700 text-white text-xs font-bold rounded-lg shadow-sm"
              >
                Save Care Status
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Add Allergy */}
      {isAddAllergyModalOpen && (
        <Modal
          isOpen={isAddAllergyModalOpen}
          onClose={() => setIsAddAllergyModalOpen(false)}
          title="Add Verified Patient Allergy"
          maxWidth="md"
          icon={<ShieldAlert className="h-5 w-5 text-rose-500" />}
        >
          <form onSubmit={handleAddAllergy} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Allergen Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={allergenName}
                onChange={(e) => setAllergenName(e.target.value)}
                placeholder="e.g. Penicillin, Codeine, Peanuts, Latex"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={allergyCategory}
                  onChange={(e) => setAllergyCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="Medication">Medication</option>
                  <option value="Food">Food</option>
                  <option value="Environmental">Environmental</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Severity</label>
                <select
                  value={allergySeverity}
                  onChange={(e) => setAllergySeverity(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold"
                >
                  <option value="Mild">Mild</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Severe">Severe</option>
                  <option value="Life Threatening">Life Threatening</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reaction Symptoms</label>
              <input
                type="text"
                value={allergyReaction}
                onChange={(e) => setAllergyReaction(e.target.value)}
                placeholder="e.g. Anaphylaxis, Bronchospasm, Urticaria"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddAllergyModalOpen(false)}
                className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded-lg shadow-sm"
              >
                Save Allergy Alert
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Add Condition */}
      {isAddConditionModalOpen && (
        <Modal
          isOpen={isAddConditionModalOpen}
          onClose={() => setIsAddConditionModalOpen(false)}
          title="Add Medical Condition to History"
          maxWidth="md"
        >
          <form onSubmit={handleAddCondition} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Condition Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={conditionName}
                onChange={(e) => setConditionName(e.target.value)}
                placeholder="e.g. Type 2 Diabetes, Hypertension"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Diagnosis Date</label>
              <input
                type="date"
                value={conditionDate}
                onChange={(e) => setConditionDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddConditionModalOpen(false)}
                className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold rounded-lg shadow-sm"
              >
                Add Condition
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

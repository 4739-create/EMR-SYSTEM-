// Hospital Electronic Medical Records (EMR) - Domain Types

export type UserRole =
  | 'Super Administrator'
  | 'Hospital Administrator'
  | 'Receptionist'
  | 'Doctor'
  | 'Nurse'
  | 'Laboratory Technician'
  | 'Pharmacist'
  | 'Radiologist'
  | 'Cashier';

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  employeeId: string;
  phone: string;
  licenseNumber?: string;
  avatar?: string;
  status: 'Active' | 'On Leave' | 'Inactive';
  hasBiometricsRegistered: boolean;
}

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'Unknown';

export type PatientStatus = 'Outpatient' | 'Inpatient' | 'Emergency' | 'Discharged';

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  alternatePhone?: string;
  address?: string;
}

export interface VitalSign {
  id: string;
  patientId: string;
  systolicBP: number; // mmHg
  diastolicBP: number; // mmHg
  pulseRate: number; // bpm
  respiratoryRate: number; // breaths/min
  temperature: number; // Celsius
  oxygenSaturation: number; // % SpO2
  weightKg: number;
  heightCm: number;
  bmi: number;
  triageCategory: 'Immediate (Red)' | 'Urgent (Yellow)' | 'Standard (Green)' | 'Non-urgent (Blue)';
  notes?: string;
  recordedBy: string;
  recordedAt: string;
}

export interface Allergy {
  id: string;
  allergen: string;
  category: 'Medication' | 'Food' | 'Environmental' | 'Other';
  severity: 'Mild' | 'Moderate' | 'Severe' | 'Life Threatening';
  reaction: string;
  diagnosedDate?: string;
}

export interface MedicalHistoryItem {
  id: string;
  condition: string;
  diagnosisDate: string;
  status: 'Active' | 'Resolved' | 'Chronic';
  notes?: string;
}

export interface SurgicalHistoryItem {
  id: string;
  procedure: string;
  date: string;
  surgeon?: string;
  hospital?: string;
  notes?: string;
}

export interface Patient {
  id: string;
  mrn: string; // Medical Record Number e.g. MRN-2026-0891
  nationalId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other';
  bloodGroup: BloodGroup;
  phone: string;
  email: string;
  address: string;
  city: string;
  maritalStatus: 'Single' | 'Married' | 'Divorced' | 'Widowed';
  occupation: string;
  status: PatientStatus;
  admittedWard?: string;
  bedNumber?: string;
  admissionDate?: string;
  registeredDate: string;
  emergencyContact: EmergencyContact;
  allergies: Allergy[];
  medicalHistory: MedicalHistoryItem[];
  surgicalHistory: SurgicalHistoryItem[];
  vitalsHistory: VitalSign[];
  assignedDoctorId?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
}

export type AppointmentStatus =
  | 'Scheduled'
  | 'Checked In'
  | 'In Consultation'
  | 'Completed'
  | 'Cancelled'
  | 'Rescheduled'
  | 'No Show';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientMrn: string;
  doctorId: string;
  doctorName: string;
  department: string;
  appointmentDate: string; // YYYY-MM-DD
  appointmentTime: string; // HH:mm
  type: 'General Checkup' | 'Follow-up' | 'Specialist Consultation' | 'Emergency' | 'Routine Screening';
  status: AppointmentStatus;
  reasonForVisit: string;
  notes?: string;
  priority: 'Routine' | 'Urgent' | 'Emergency';
}

export interface PhysicalExamination {
  generalAppearance: string;
  cardiovascular: string;
  respiratory: string;
  abdominal: string;
  neurological: string;
  extremities: string;
  skin: string;
}

export interface PrescriptionItem {
  id: string;
  medicationId?: string;
  medicationName: string;
  dosage: string; // e.g. 500mg
  frequency: string; // e.g. TID, Once Daily, BID
  durationDays: number;
  route: 'Oral' | 'Intravenous' | 'Intramuscular' | 'Subcutaneous' | 'Inhalation' | 'Topical';
  instructions: string;
  status: 'Pending' | 'Dispensed' | 'Partially Dispensed' | 'Cancelled';
  prescribedBy: string;
  prescribedAt: string;
  dispensedAt?: string;
  dispensedBy?: string;
}

export interface ConsultationRecord {
  id: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  department: string;
  consultationDate: string;
  chiefComplaint: string;
  historyOfPresentIllness: string;
  physicalExam: PhysicalExamination;
  icd10Code: string;
  diagnosis: string;
  differentialDiagnosis?: string;
  treatmentPlan: string;
  clinicalNotes: string;
  prescriptions: PrescriptionItem[];
  labRequests: string[]; // Lab test names or IDs
  radiologyRequests: string[]; // Radiology test names or IDs
  followUpDate?: string;
  vitalSignSnapshot?: VitalSign;
}

export interface LabParameterResult {
  parameter: string;
  value: string | number;
  unit: string;
  referenceRange: string;
  flag: 'Normal' | 'High' | 'Low' | 'Critical';
}

export interface LabTestRequest {
  id: string;
  patientId: string;
  patientName: string;
  patientMrn: string;
  doctorId: string;
  doctorName: string;
  testName: string;
  category: 'Hematology' | 'Biochemistry' | 'Microbiology' | 'Immunology' | 'Urinalysis' | 'Pathology';
  sampleType: 'Whole Blood' | 'Serum' | 'Plasma' | 'Urine' | 'Stool' | 'Sputum' | 'Swab';
  sampleBarcode: string;
  urgency: 'Routine' | 'Urgent' | 'Stat (Immediate)';
  status: 'Pending Sample' | 'Sample Collected' | 'Analyzing' | 'Completed' | 'Rejected';
  requestedAt: string;
  sampleCollectedAt?: string;
  collectedBy?: string;
  completedAt?: string;
  performedBy?: string;
  results?: LabParameterResult[];
  clinicalNotes?: string;
  interpretation?: string;
}

export interface Medication {
  id: string;
  code: string;
  name: string;
  genericName: string;
  category: 'Antibiotics' | 'Analgesics' | 'Cardiovascular' | 'Antidiabetic' | 'Respiratory' | 'Psychiatric' | 'Gastrointestinal' | 'Vitamins';
  dosageForm: 'Tablet' | 'Capsule' | 'Syrup' | 'Injection' | 'Inhaler' | 'Ointment';
  strength: string;
  currentStock: number;
  minimumStock: number;
  unitPrice: number;
  expiryDate: string;
  batchNumber: string;
  manufacturer: string;
  location: string; // Shelf / Rack
}

export interface PharmacyTransaction {
  id: string;
  timestamp: string;
  type: 'Dispense' | 'Restock' | 'Adjustment' | 'Disposal';
  medicationId: string;
  medicationName: string;
  quantity: number;
  patientName?: string;
  staffName: string;
  notes?: string;
}

export interface RadiologyRequest {
  id: string;
  patientId: string;
  patientName: string;
  patientMrn: string;
  doctorId: string;
  doctorName: string;
  modality: 'Digital X-Ray' | 'CT Scan' | 'MRI' | 'Ultrasound' | 'Mammography';
  bodyPart: string;
  clinicalIndication: string;
  urgency: 'Routine' | 'Urgent' | 'Emergency';
  status: 'Requested' | 'Scheduled' | 'In Progress' | 'Image Acquired' | 'Reported';
  requestedAt: string;
  scheduledTime?: string;
  imageThumbnailUrl?: string;
  radiologistName?: string;
  reportedAt?: string;
  findings?: string;
  impression?: string;
  recommendations?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  category: 'Consultation' | 'Laboratory' | 'Radiology' | 'Pharmacy' | 'Ward/Bed' | 'Nursing Care' | 'Procedure';
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  paymentMethod: 'Cash' | 'Credit Card' | 'Debit Card' | 'Health Insurance' | 'Bank Transfer' | 'Mobile Payment';
  referenceNumber: string;
  receivedBy: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  patientName: string;
  patientMrn: string;
  date: string;
  dueDate: string;
  status: 'Paid' | 'Partially Paid' | 'Unpaid' | 'Cancelled';
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  discount: number;
  insuranceCoveredAmount: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  payments: PaymentRecord[];
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  role: UserRole;
  action: string;
  module: string;
  details: string;
  ipAddress: string;
}

export interface NursingNote {
  id: string;
  patientId: string;
  timestamp: string;
  nurseName: string;
  noteType: 'General' | 'Medication Administration' | 'Shift Handover' | 'Doctor Order Execution' | 'Incident';
  content: string;
  shift: 'Morning' | 'Afternoon' | 'Night';
}

export interface NursingHandover {
  id: string;
  date: string;
  shiftFrom: 'Morning' | 'Afternoon' | 'Night';
  shiftTo: 'Morning' | 'Afternoon' | 'Night';
  nurseOut: string;
  nurseIn: string;
  wardName: string;
  totalWardPatients: number;
  criticalPatientsSummary: string;
  pendingMedicationsOrders: string;
  specialEquipmentNotes: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  headOfDepartment: string;
  location: string;
  bedCapacity: number;
  currentOccupancy: number;
  status: 'Active' | 'Under Maintenance';
}

export interface HospitalSettings {
  hospitalName: string;
  hospitalCode: string;
  tagline: string;
  phone: string;
  emergencyPhone: string;
  email: string;
  address: string;
  website: string;
  taxRegistrationNumber: string;
  accreditationNumber: string;
  currency: string;
  timezone: string;
  allowBiometricLogins: boolean;
  enableAuditLogging: boolean;
}

import {
  INITIAL_PATIENTS,
  INITIAL_STAFF,
  INITIAL_APPOINTMENTS,
  INITIAL_CONSULTATIONS,
  INITIAL_LAB_TESTS,
  INITIAL_MEDICATIONS,
  INITIAL_RADIOLOGY,
  INITIAL_INVOICES,
  INITIAL_DEPARTMENTS,
  INITIAL_NURSING_NOTES,
  INITIAL_NURSING_HANDOVERS,
  INITIAL_AUDIT_LOGS,
  INITIAL_HOSPITAL_SETTINGS,
} from '../data/mockData';

import {
  Patient,
  StaffUser,
  Appointment,
  ConsultationRecord,
  LabTestRequest,
  Medication,
  RadiologyRequest,
  Invoice,
  Department,
  NursingNote,
  NursingHandover,
  AuditLogEntry,
  HospitalSettings,
  UserRole,
} from '../types';

const STORAGE_KEYS = {
  PATIENTS: 'apex_emr_patients',
  STAFF: 'apex_emr_staff',
  APPOINTMENTS: 'apex_emr_appointments',
  CONSULTATIONS: 'apex_emr_consultations',
  LAB_TESTS: 'apex_emr_lab_tests',
  MEDICATIONS: 'apex_emr_medications',
  RADIOLOGY: 'apex_emr_radiology',
  INVOICES: 'apex_emr_invoices',
  DEPARTMENTS: 'apex_emr_departments',
  NURSING_NOTES: 'apex_emr_nursing_notes',
  NURSING_HANDOVERS: 'apex_emr_nursing_handovers',
  AUDIT_LOGS: 'apex_emr_audit_logs',
  SETTINGS: 'apex_emr_settings',
  CURRENT_USER: 'apex_emr_current_user',
};

function getFromStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage`, error);
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('emr_data_updated', { detail: { key } }));
  } catch (error) {
    console.error(`Error writing ${key} to localStorage`, error);
  }
}

export const StorageService = {
  // Initialize default stores
  init(): void {
    if (!localStorage.getItem(STORAGE_KEYS.PATIENTS)) {
      saveToStorage(STORAGE_KEYS.PATIENTS, INITIAL_PATIENTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.STAFF)) {
      saveToStorage(STORAGE_KEYS.STAFF, INITIAL_STAFF);
    }
    if (!localStorage.getItem(STORAGE_KEYS.APPOINTMENTS)) {
      saveToStorage(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.CONSULTATIONS)) {
      saveToStorage(STORAGE_KEYS.CONSULTATIONS, INITIAL_CONSULTATIONS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.LAB_TESTS)) {
      saveToStorage(STORAGE_KEYS.LAB_TESTS, INITIAL_LAB_TESTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.MEDICATIONS)) {
      saveToStorage(STORAGE_KEYS.MEDICATIONS, INITIAL_MEDICATIONS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.RADIOLOGY)) {
      saveToStorage(STORAGE_KEYS.RADIOLOGY, INITIAL_RADIOLOGY);
    }
    if (!localStorage.getItem(STORAGE_KEYS.INVOICES)) {
      saveToStorage(STORAGE_KEYS.INVOICES, INITIAL_INVOICES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.DEPARTMENTS)) {
      saveToStorage(STORAGE_KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.NURSING_NOTES)) {
      saveToStorage(STORAGE_KEYS.NURSING_NOTES, INITIAL_NURSING_NOTES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.NURSING_HANDOVERS)) {
      saveToStorage(STORAGE_KEYS.NURSING_HANDOVERS, INITIAL_NURSING_HANDOVERS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
      saveToStorage(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      saveToStorage(STORAGE_KEYS.SETTINGS, INITIAL_HOSPITAL_SETTINGS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
      saveToStorage(STORAGE_KEYS.CURRENT_USER, INITIAL_STAFF[0]); // Default to Dr. Sarah
    }
  },

  resetAll(): void {
    saveToStorage(STORAGE_KEYS.PATIENTS, INITIAL_PATIENTS);
    saveToStorage(STORAGE_KEYS.STAFF, INITIAL_STAFF);
    saveToStorage(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS);
    saveToStorage(STORAGE_KEYS.CONSULTATIONS, INITIAL_CONSULTATIONS);
    saveToStorage(STORAGE_KEYS.LAB_TESTS, INITIAL_LAB_TESTS);
    saveToStorage(STORAGE_KEYS.MEDICATIONS, INITIAL_MEDICATIONS);
    saveToStorage(STORAGE_KEYS.RADIOLOGY, INITIAL_RADIOLOGY);
    saveToStorage(STORAGE_KEYS.INVOICES, INITIAL_INVOICES);
    saveToStorage(STORAGE_KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
    saveToStorage(STORAGE_KEYS.NURSING_NOTES, INITIAL_NURSING_NOTES);
    saveToStorage(STORAGE_KEYS.NURSING_HANDOVERS, INITIAL_NURSING_HANDOVERS);
    saveToStorage(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
    saveToStorage(STORAGE_KEYS.SETTINGS, INITIAL_HOSPITAL_SETTINGS);
    saveToStorage(STORAGE_KEYS.CURRENT_USER, INITIAL_STAFF[0]);
  },

  // Auth / Current User
  getCurrentUser(): StaffUser {
    return getFromStorage(STORAGE_KEYS.CURRENT_USER, INITIAL_STAFF[0]);
  },

  setCurrentUser(user: StaffUser): void {
    saveToStorage(STORAGE_KEYS.CURRENT_USER, user);
  },

  switchRole(role: UserRole): StaffUser {
    const staffList = this.getStaff();
    const match = staffList.find((s) => s.role === role) || staffList[0];
    this.setCurrentUser(match);
    this.logAction('USER_SWITCH_ROLE', 'Authentication', `Switched active preview role to ${role}`);
    return match;
  },

  // Patients
  getPatients(): Patient[] {
    return getFromStorage(STORAGE_KEYS.PATIENTS, INITIAL_PATIENTS);
  },

  getPatientById(id: string): Patient | undefined {
    return this.getPatients().find((p) => p.id === id);
  },

  getPatientByMrn(mrn: string): Patient | undefined {
    const clean = mrn.trim().toUpperCase();
    return this.getPatients().find((p) => p.mrn.toUpperCase() === clean);
  },

  savePatient(patient: Patient): void {
    const list = this.getPatients();
    const index = list.findIndex((p) => p.id === patient.id);
    if (index >= 0) {
      list[index] = patient;
    } else {
      list.unshift(patient);
    }
    saveToStorage(STORAGE_KEYS.PATIENTS, list);
    this.logAction('PATIENT_SAVED', 'Patient Management', `Saved record for ${patient.firstName} ${patient.lastName} (${patient.mrn})`);
  },

  // Appointments
  getAppointments(): Appointment[] {
    return getFromStorage(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS);
  },

  saveAppointment(appointment: Appointment): void {
    const list = this.getAppointments();
    const index = list.findIndex((a) => a.id === appointment.id);
    if (index >= 0) {
      list[index] = appointment;
    } else {
      list.unshift(appointment);
    }
    saveToStorage(STORAGE_KEYS.APPOINTMENTS, list);
    this.logAction('APPOINTMENT_SAVED', 'Appointments', `Appointment updated for ${appointment.patientName} with ${appointment.doctorName}`);
  },

  // Consultations
  getConsultations(): ConsultationRecord[] {
    return getFromStorage(STORAGE_KEYS.CONSULTATIONS, INITIAL_CONSULTATIONS);
  },

  getConsultationsByPatientId(patientId: string): ConsultationRecord[] {
    return this.getConsultations().filter((c) => c.patientId === patientId);
  },

  saveConsultation(consultation: ConsultationRecord): void {
    const list = this.getConsultations();
    list.unshift(consultation);
    saveToStorage(STORAGE_KEYS.CONSULTATIONS, list);
    this.logAction('CONSULTATION_LOGGED', 'Doctor Module', `Clinical consultation logged for patient ID: ${consultation.patientId}`);
  },

  // Laboratory
  getLabTests(): LabTestRequest[] {
    return getFromStorage(STORAGE_KEYS.LAB_TESTS, INITIAL_LAB_TESTS);
  },

  saveLabTest(test: LabTestRequest): void {
    const list = this.getLabTests();
    const index = list.findIndex((t) => t.id === test.id);
    if (index >= 0) {
      list[index] = test;
    } else {
      list.unshift(test);
    }
    saveToStorage(STORAGE_KEYS.LAB_TESTS, list);
    this.logAction('LAB_TEST_UPDATED', 'Laboratory', `Lab request ${test.id} updated to status ${test.status}`);
  },

  // Pharmacy & Stock
  getMedications(): Medication[] {
    return getFromStorage(STORAGE_KEYS.MEDICATIONS, INITIAL_MEDICATIONS);
  },

  saveMedication(med: Medication): void {
    const list = this.getMedications();
    const idx = list.findIndex((m) => m.id === med.id);
    if (idx >= 0) {
      list[idx] = med;
    } else {
      list.unshift(med);
    }
    saveToStorage(STORAGE_KEYS.MEDICATIONS, list);
    this.logAction('MEDICATION_UPDATED', 'Pharmacy', `Medication stock updated for ${med.name}`);
  },

  // Radiology
  getRadiologyRequests(): RadiologyRequest[] {
    return getFromStorage(STORAGE_KEYS.RADIOLOGY, INITIAL_RADIOLOGY);
  },

  saveRadiologyRequest(req: RadiologyRequest): void {
    const list = this.getRadiologyRequests();
    const idx = list.findIndex((r) => r.id === req.id);
    if (idx >= 0) {
      list[idx] = req;
    } else {
      list.unshift(req);
    }
    saveToStorage(STORAGE_KEYS.RADIOLOGY, list);
    this.logAction('RADIOLOGY_UPDATED', 'Radiology', `Imaging request ${req.id} updated (${req.modality} - ${req.bodyPart})`);
  },

  // Billing
  getInvoices(): Invoice[] {
    return getFromStorage(STORAGE_KEYS.INVOICES, INITIAL_INVOICES);
  },

  saveInvoice(invoice: Invoice): void {
    const list = this.getInvoices();
    const idx = list.findIndex((i) => i.id === invoice.id);
    if (idx >= 0) {
      list[idx] = invoice;
    } else {
      list.unshift(invoice);
    }
    saveToStorage(STORAGE_KEYS.INVOICES, list);
    this.logAction('INVOICE_UPDATED', 'Billing', `Invoice ${invoice.invoiceNumber} updated for ${invoice.patientName}`);
  },

  // Staff & Administration
  getStaff(): StaffUser[] {
    return getFromStorage(STORAGE_KEYS.STAFF, INITIAL_STAFF);
  },

  saveStaff(staff: StaffUser): void {
    const list = this.getStaff();
    const idx = list.findIndex((s) => s.id === staff.id);
    if (idx >= 0) {
      list[idx] = staff;
    } else {
      list.unshift(staff);
    }
    saveToStorage(STORAGE_KEYS.STAFF, list);
    this.logAction('STAFF_SAVED', 'Administration', `Staff record updated for ${staff.name} (${staff.role})`);
  },

  getDepartments(): Department[] {
    return getFromStorage(STORAGE_KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
  },

  saveDepartment(dept: Department): void {
    const list = this.getDepartments();
    const idx = list.findIndex((d) => d.id === dept.id);
    if (idx >= 0) {
      list[idx] = dept;
    } else {
      list.unshift(dept);
    }
    saveToStorage(STORAGE_KEYS.DEPARTMENTS, list);
  },

  // Nursing Notes & Handovers
  getNursingNotes(): NursingNote[] {
    return getFromStorage(STORAGE_KEYS.NURSING_NOTES, INITIAL_NURSING_NOTES);
  },

  saveNursingNote(note: NursingNote): void {
    const list = this.getNursingNotes();
    list.unshift(note);
    saveToStorage(STORAGE_KEYS.NURSING_NOTES, list);
    this.logAction('NURSING_NOTE_ADDED', 'Nursing', `Nursing note recorded for patient ${note.patientId}`);
  },

  getNursingHandovers(): NursingHandover[] {
    return getFromStorage(STORAGE_KEYS.NURSING_HANDOVERS, INITIAL_NURSING_HANDOVERS);
  },

  saveNursingHandover(handover: NursingHandover): void {
    const list = this.getNursingHandovers();
    list.unshift(handover);
    saveToStorage(STORAGE_KEYS.NURSING_HANDOVERS, list);
    this.logAction('HANDOVER_SUBMITTED', 'Nursing', `Shift handover completed: ${handover.shiftFrom} -> ${handover.shiftTo}`);
  },

  // Audit Logs
  getAuditLogs(): AuditLogEntry[] {
    return getFromStorage(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  },

  logAction(action: string, module: string, details: string): void {
    const cur = this.getCurrentUser();
    const entry: AuditLogEntry = {
      id: 'aud-' + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      userId: cur?.id || 'sys-anon',
      userName: cur?.name || 'System Operator',
      role: cur?.role || 'Super Administrator',
      action,
      module,
      details,
      ipAddress: '192.168.10.25 (Client Session)',
    };
    const logs = this.getAuditLogs();
    logs.unshift(entry);
    saveToStorage(STORAGE_KEYS.AUDIT_LOGS, logs.slice(0, 150)); // retain latest 150
  },

  // Hospital Settings
  getSettings(): HospitalSettings {
    return getFromStorage(STORAGE_KEYS.SETTINGS, INITIAL_HOSPITAL_SETTINGS);
  },

  saveSettings(settings: HospitalSettings): void {
    saveToStorage(STORAGE_KEYS.SETTINGS, settings);
    this.logAction('SETTINGS_UPDATED', 'Administration', 'Hospital system settings and configurations updated');
  },
};

// Auto-initialize on module load
StorageService.init();

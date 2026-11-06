import { VitalSign } from '../types';

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

export function calculateAge(dateOfBirth: string): number {
  if (!dateOfBirth) return 0;
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return Math.max(0, age);
}

export function generateMRN(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `MRN-${year}-${rand}`;
}

export function generatePatientId(): string {
  return 'pat_' + Math.random().toString(36).substring(2, 9);
}

export function generateSampleBarcode(category: string): string {
  const prefix = category.substring(0, 3).toUpperCase();
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `${prefix}-${rand}`;
}

export function generateInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const seq = Math.floor(1000 + Math.random() * 9000);
  return `INV-${year}-${seq}`;
}

export function calculateBMI(weightKg: number, heightCm: number): { bmi: number; classification: string } {
  if (!weightKg || !heightCm || heightCm <= 0) return { bmi: 0, classification: 'Unknown' };
  const heightM = heightCm / 100;
  const bmi = parseFloat((weightKg / (heightM * heightM)).toFixed(1));

  let classification = 'Normal weight';
  if (bmi < 18.5) classification = 'Underweight';
  else if (bmi < 25) classification = 'Normal weight';
  else if (bmi < 30) classification = 'Overweight';
  else classification = 'Obese';

  return { bmi, classification };
}

export function evaluateVitals(vitals: Partial<VitalSign>): {
  hasAbnormal: boolean;
  alerts: string[];
} {
  const alerts: string[] = [];

  if (vitals.systolicBP && vitals.systolicBP >= 140) {
    alerts.push(`High Systolic BP (${vitals.systolicBP} mmHg - Stage 2 Hypertension)`);
  } else if (vitals.systolicBP && vitals.systolicBP < 90) {
    alerts.push(`Low Systolic BP (${vitals.systolicBP} mmHg - Hypotension)`);
  }

  if (vitals.diastolicBP && vitals.diastolicBP >= 90) {
    alerts.push(`High Diastolic BP (${vitals.diastolicBP} mmHg)`);
  }

  if (vitals.temperature && vitals.temperature >= 38.0) {
    alerts.push(`Elevated Temperature / Fever (${vitals.temperature}°C)`);
  } else if (vitals.temperature && vitals.temperature < 35.5) {
    alerts.push(`Low Body Temperature / Hypothermia (${vitals.temperature}°C)`);
  }

  if (vitals.oxygenSaturation && vitals.oxygenSaturation < 94) {
    alerts.push(`Low Oxygen Saturation (${vitals.oxygenSaturation}% SpO2 - Hypoxemia Alert)`);
  }

  if (vitals.pulseRate && vitals.pulseRate > 100) {
    alerts.push(`Tachycardia (${vitals.pulseRate} bpm)`);
  } else if (vitals.pulseRate && vitals.pulseRate < 55) {
    alerts.push(`Bradycardia (${vitals.pulseRate} bpm)`);
  }

  return {
    hasAbnormal: alerts.length > 0,
    alerts,
  };
}

// Generate secure patient QR payload (does NOT contain confidential diagnosis or PHI)
export function createPatientQRPayload(patientId: string, mrn: string, nationalId: string): string {
  return JSON.stringify({
    system: 'APEX_CLINICAL_HIS',
    version: '2.0',
    patId: patientId,
    mrn: mrn,
    nid: nationalId,
    generatedAt: new Date().toISOString(),
  });
}

export function parsePatientQRPayload(raw: string): { valid: boolean; mrn?: string; patId?: string } {
  try {
    const data = JSON.parse(raw);
    if (data.system === 'APEX_CLINICAL_HIS' && data.mrn) {
      return { valid: true, mrn: data.mrn, patId: data.patId };
    }
  } catch {
    // fallback if raw string is just the MRN
    if (raw.startsWith('MRN-')) {
      return { valid: true, mrn: raw };
    }
  }
  return { valid: false };
}

export function triggerPrint(): void {
  window.print();
}

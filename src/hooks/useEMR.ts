import { useState, useEffect, useCallback } from 'react';
import { StorageService } from '../services/storageService';
import { StaffUser } from '../types';

export function useEMR() {
  const [, setTick] = useState(0);

  const forceRefresh = useCallback(() => {
    setTick((t) => t + 1);
  }, []);

  useEffect(() => {
    const handleUpdate = () => {
      forceRefresh();
    };

    window.addEventListener('emr_data_updated', handleUpdate);
    return () => {
      window.removeEventListener('emr_data_updated', handleUpdate);
    };
  }, [forceRefresh]);

  return {
    currentUser: StorageService.getCurrentUser(),
    setCurrentUser: (user: StaffUser) => StorageService.setCurrentUser(user),
    switchRole: (role: any) => StorageService.switchRole(role),
    patients: StorageService.getPatients(),
    appointments: StorageService.getAppointments(),
    consultations: StorageService.getConsultations(),
    labTests: StorageService.getLabTests(),
    medications: StorageService.getMedications(),
    radiology: StorageService.getRadiologyRequests(),
    invoices: StorageService.getInvoices(),
    staff: StorageService.getStaff(),
    departments: StorageService.getDepartments(),
    nursingNotes: StorageService.getNursingNotes(),
    nursingHandovers: StorageService.getNursingHandovers(),
    auditLogs: StorageService.getAuditLogs(),
    settings: StorageService.getSettings(),
    resetAll: () => StorageService.resetAll(),
    refresh: forceRefresh,
  };
}

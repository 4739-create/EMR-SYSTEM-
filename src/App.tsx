import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layouts/AppLayout';
import { DashboardPage } from './modules/dashboard/DashboardPage';
import { PatientListPage } from './modules/patients/PatientListPage';
import { PatientRegistrationPage } from './modules/patients/PatientRegistrationPage';
import { PatientProfilePage } from './modules/patients/PatientProfilePage';
import { AppointmentsPage } from './modules/appointments/AppointmentsPage';
import { DoctorDashboardPage } from './modules/doctors/DoctorDashboardPage';
import { DoctorConsultationPage } from './modules/doctors/DoctorConsultationPage';
import { NursingVitalsPage } from './modules/nursing/NursingVitalsPage';
import { LaboratoryPage } from './modules/laboratory/LaboratoryPage';
import { PharmacyPage } from './modules/pharmacy/PharmacyPage';
import { RadiologyPage } from './modules/radiology/RadiologyPage';
import { BillingPage } from './modules/billing/BillingPage';
import { QRModulePage } from './modules/qr/QRModulePage';
import { BiometricsAuthPage } from './modules/auth/BiometricsAuthPage';
import { ReportsAnalyticsPage } from './modules/reports/ReportsAnalyticsPage';
import { AdministrationPage } from './modules/admin/AdministrationPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/patients" element={<PatientListPage />} />
          <Route path="/patients/register" element={<PatientRegistrationPage />} />
          <Route path="/patients/:id" element={<PatientProfilePage />} />
          <Route path="/appointments" element={<AppointmentsPage />} />
          <Route path="/doctor" element={<DoctorDashboardPage />} />
          <Route path="/doctor/consultation/:id" element={<DoctorConsultationPage />} />
          <Route path="/nursing" element={<NursingVitalsPage />} />
          <Route path="/laboratory" element={<LaboratoryPage />} />
          <Route path="/pharmacy" element={<PharmacyPage />} />
          <Route path="/radiology" element={<RadiologyPage />} />
          <Route path="/billing" element={<BillingPage />} />
          <Route path="/qr-module" element={<QRModulePage />} />
          <Route path="/auth/biometrics" element={<BiometricsAuthPage />} />
          <Route path="/reports" element={<ReportsAnalyticsPage />} />
          <Route path="/admin" element={<AdministrationPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

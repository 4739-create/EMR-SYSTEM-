import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus,
  Shield,
  HeartPulse,
  Phone,
  Building,
  CheckCircle,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { StorageService } from '../../services/storageService';
import { generateMRN, generatePatientId } from '../../utils';
import { BloodGroup, Patient, PatientStatus } from '../../types';

// Zod schema for patient registration
const patientSchema = z.object({
  firstName: z.string().min(2, 'First name is required (min 2 characters)'),
  lastName: z.string().min(2, 'Last name is required (min 2 characters)'),
  nationalId: z.string().min(5, 'National ID / SSN is required'),
  dateOfBirth: z.string().refine((val) => !isNaN(Date.parse(val)), 'Valid date of birth required'),
  gender: z.enum(['Male', 'Female', 'Other']),
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown']),
  phone: z.string().min(7, 'Valid contact phone number required'),
  email: z.string().email('Valid email address required').or(z.literal('')),
  address: z.string().min(5, 'Residential address required'),
  city: z.string().min(2, 'City required'),
  maritalStatus: z.enum(['Single', 'Married', 'Divorced', 'Widowed']),
  occupation: z.string().default(''),
  status: z.enum(['Outpatient', 'Inpatient', 'Emergency', 'Discharged']),
  admittedWard: z.string().optional(),
  bedNumber: z.string().optional(),
  insuranceProvider: z.string().optional(),
  insurancePolicyNumber: z.string().optional(),
  // Emergency contact
  emergencyName: z.string().min(2, 'Emergency contact name required'),
  emergencyRelationship: z.string().min(2, 'Relationship is required'),
  emergencyPhone: z.string().min(7, 'Emergency phone number is required'),
  // Allergies & Medical Notes
  knownAllergies: z.string().optional(),
  primaryCondition: z.string().optional(),
});

type PatientFormData = z.infer<typeof patientSchema>;

export const PatientRegistrationPage: React.FC = () => {
  const navigate = useNavigate();
  const [generatedMrn] = useState(generateMRN());
  const [newPatId] = useState(generatePatientId());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema) as any,
    defaultValues: {
      gender: 'Male',
      bloodGroup: 'O+',
      maritalStatus: 'Single',
      status: 'Outpatient',
      occupation: '',
      email: '',
      knownAllergies: '',
      primaryCondition: '',
    },
  });

  const selectedStatus = watch('status');

  const onSubmit = (data: PatientFormData) => {
    setIsSubmitting(true);

    const newPatient: Patient = {
      id: newPatId,
      mrn: generatedMrn,
      nationalId: data.nationalId,
      firstName: data.firstName,
      lastName: data.lastName,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender as any,
      bloodGroup: data.bloodGroup as BloodGroup,
      phone: data.phone,
      email: data.email || `${data.firstName.toLowerCase()}.${data.lastName.toLowerCase()}@example.com`,
      address: data.address,
      city: data.city,
      maritalStatus: data.maritalStatus as any,
      occupation: data.occupation || 'Not Specified',
      status: data.status as PatientStatus,
      admittedWard: data.status === 'Inpatient' || data.status === 'Emergency' ? data.admittedWard || 'General Ward' : undefined,
      bedNumber: data.status === 'Inpatient' ? data.bedNumber || 'Bed TBD' : undefined,
      admissionDate: data.status === 'Inpatient' || data.status === 'Emergency' ? new Date().toISOString().split('T')[0] : undefined,
      registeredDate: new Date().toISOString().split('T')[0],
      insuranceProvider: data.insuranceProvider || 'Self Pay',
      insurancePolicyNumber: data.insurancePolicyNumber || 'N/A',
      emergencyContact: {
        name: data.emergencyName,
        relationship: data.emergencyRelationship,
        phone: data.emergencyPhone,
      },
      allergies: data.knownAllergies
        ? [
            {
              id: 'alg-' + Math.random().toString(36).substring(2, 6),
              allergen: data.knownAllergies,
              category: 'Medication',
              severity: 'Moderate',
              reaction: 'Reported upon patient intake',
              diagnosedDate: new Date().toISOString().split('T')[0],
            },
          ]
        : [],
      medicalHistory: data.primaryCondition
        ? [
            {
              id: 'medh-' + Math.random().toString(36).substring(2, 6),
              condition: data.primaryCondition,
              diagnosisDate: new Date().toISOString().split('T')[0],
              status: 'Active',
            },
          ]
        : [],
      surgicalHistory: [],
      vitalsHistory: [],
    };

    StorageService.savePatient(newPatient);

    setTimeout(() => {
      setIsSubmitting(false);
      navigate(`/patients/${newPatient.id}`);
    }, 400);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/patients')}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Patient Directory</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Banner */}
        <div className="bg-slate-900 text-white p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <UserPlus className="h-6 w-6 text-sky-400" />
              <h1 className="text-xl font-bold tracking-tight">New Patient Intake & Registration</h1>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Enter demographic information, emergency points of contact, and clinical admission category.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-800/80 px-4 py-2.5 rounded-lg border border-slate-700">
            <Sparkles className="h-5 w-5 text-sky-400 shrink-0" />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Assigned Medical Record Number
              </span>
              <p className="font-mono font-bold text-sky-300 text-sm tracking-wide">{generatedMrn}</p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit as any)} className="p-6 md:p-8 space-y-8">
          {/* Section 1: Demographics */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-200 flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-sky-100 text-sky-800 flex items-center justify-center text-xs">
                1
              </span>
              <span>Demographic & Personal Information</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  First Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('firstName')}
                  placeholder="e.g. Eleanor"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-hidden"
                />
                {errors.firstName && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.firstName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Last Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('lastName')}
                  placeholder="e.g. Vance"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-hidden"
                />
                {errors.lastName && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.lastName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  National ID / SSN <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('nationalId')}
                  placeholder="e.g. NAT-491029-A"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-hidden"
                />
                {errors.nationalId && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.nationalId.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Date of Birth <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  {...register('dateOfBirth')}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-hidden"
                />
                {errors.dateOfBirth && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.dateOfBirth.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Biological Gender <span className="text-rose-500">*</span>
                </label>
                <select
                  {...register('gender')}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-sky-500"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Blood Group
                </label>
                <select
                  {...register('bloodGroup')}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-sky-500"
                >
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="Unknown">Unknown</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Primary Phone <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  {...register('phone')}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-hidden"
                />
                {errors.phone && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.phone.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  {...register('email')}
                  placeholder="patient@example.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Marital Status
                </label>
                <select
                  {...register('maritalStatus')}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-sky-500"
                >
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Residential Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('address')}
                  placeholder="Street name, apartment, building..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-hidden"
                />
                {errors.address && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.address.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  City / Region <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('city')}
                  placeholder="City"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-hidden"
                />
                {errors.city && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.city.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Clinical Admission Category */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-200 flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-sky-100 text-sky-800 flex items-center justify-center text-xs">
                2
              </span>
              <span>Hospital Admission & Care Status</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Care Classification <span className="text-rose-500">*</span>
                </label>
                <select
                  {...register('status')}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-sky-500"
                >
                  <option value="Outpatient">Outpatient (Ambulatory Clinic)</option>
                  <option value="Inpatient">Inpatient (Ward Admission)</option>
                  <option value="Emergency">Emergency (Trauma / Critical Bay)</option>
                  <option value="Discharged">Discharged</option>
                </select>
              </div>

              {selectedStatus === 'Inpatient' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Target Ward
                    </label>
                    <select
                      {...register('admittedWard')}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="Cardiology Ward (Ward 3B)">Cardiology Ward (Ward 3B)</option>
                      <option value="General Medical Ward (Ward 2A)">General Medical Ward (Ward 2A)</option>
                      <option value="Surgical Ward (Ward 4)">Surgical Ward (Ward 4)</option>
                      <option value="Pediatric Ward (Ward 1)">Pediatric Ward (Ward 1)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Assigned Bed Number
                    </label>
                    <input
                      type="text"
                      {...register('bedNumber')}
                      placeholder="e.g. Bed 305"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-hidden"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Section 3: Emergency Contact & Medical Alerts */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-200 flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-sky-100 text-sky-800 flex items-center justify-center text-xs">
                3
              </span>
              <span>Emergency Contact & Critical Alerts</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Person Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('emergencyName')}
                  placeholder="e.g. Robert Vance"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-hidden"
                />
                {errors.emergencyName && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.emergencyName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Relationship <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('emergencyRelationship')}
                  placeholder="e.g. Spouse / Parent / Sibling"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-hidden"
                />
                {errors.emergencyRelationship && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.emergencyRelationship.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Emergency Phone Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  {...register('emergencyPhone')}
                  placeholder="+1 (555) 999-9999"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-hidden"
                />
                {errors.emergencyPhone && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.emergencyPhone.message}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Known Allergies (Medications / Food / Latex)
                </label>
                <input
                  type="text"
                  {...register('knownAllergies')}
                  placeholder="e.g. Penicillin, Sulfa drugs, Peanuts (Leave blank if NKDA)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Primary Medical Condition
                </label>
                <input
                  type="text"
                  {...register('primaryCondition')}
                  placeholder="e.g. Hypertension, Asthma"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-sky-500 focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-6 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/patients')}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-sky-700 hover:bg-sky-800 text-white rounded-lg text-xs font-bold shadow-md transition disabled:opacity-50"
            >
              <CheckCircle className="h-4 w-4" />
              <span>{isSubmitting ? 'Registering Patient...' : 'Complete Registration & Open Chart'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

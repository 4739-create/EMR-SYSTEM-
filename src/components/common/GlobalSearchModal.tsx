import React, { useState, useMemo } from 'react';
import { Search, User, ArrowRight, HeartPulse, Stethoscope, QrCode } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEMR } from '../../hooks/useEMR';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { calculateAge } from '../../utils';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const { patients } = useEMR();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const filteredPatients = useMemo(() => {
    if (!query.trim()) return patients.slice(0, 5);
    const q = query.toLowerCase();
    return patients.filter(
      (p) =>
        p.firstName.toLowerCase().includes(q) ||
        p.lastName.toLowerCase().includes(q) ||
        p.mrn.toLowerCase().includes(q) ||
        p.nationalId.toLowerCase().includes(q) ||
        p.phone.includes(q)
    );
  }, [patients, query]);

  const handleSelect = (patientId: string, action?: 'profile' | 'consult' | 'vitals') => {
    onClose();
    if (action === 'consult') {
      navigate(`/doctor/consultation/${patientId}`);
    } else if (action === 'vitals') {
      navigate(`/nursing?patientId=${patientId}`);
    } else {
      navigate(`/patients/${patientId}`);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Global Hospital Patient Directory Search"
      subtitle="Search in real-time by Patient Name, MRN, National ID or Phone Number"
      icon={<Search className="h-5 w-5" />}
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search e.g. Eleanor, MRN-2026-104921, 555-432..."
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white text-base transition-all"
            autoFocus
          />
        </div>

        {/* Results List */}
        <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
          {filteredPatients.length === 0 ? (
            <div className="text-center py-10">
              <User className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-600 font-medium">No patient records found</p>
              <p className="text-slate-400 text-xs mt-1">Try adjusting your search criteria or register a new patient.</p>
            </div>
          ) : (
            filteredPatients.map((pat) => (
              <div
                key={pat.id}
                className="py-3 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 rounded-lg transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-sky-100 text-sky-800 flex items-center justify-center font-bold text-sm shrink-0 border border-sky-200">
                    {pat.firstName[0]}
                    {pat.lastName[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 text-sm">
                        {pat.firstName} {pat.lastName}
                      </span>
                      <span className="font-mono text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {pat.mrn}
                      </span>
                      <Badge
                        size="sm"
                        variant={
                          pat.status === 'Emergency'
                            ? 'danger'
                            : pat.status === 'Inpatient'
                            ? 'primary'
                            : 'neutral'
                        }
                      >
                        {pat.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>{pat.gender}</span>
                      <span>•</span>
                      <span>{calculateAge(pat.dateOfBirth)} yrs</span>
                      <span>•</span>
                      <span>Blood Group: <strong className="text-rose-600">{pat.bloodGroup}</strong></span>
                      {pat.allergies.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-amber-600 font-medium">
                            {pat.allergies.length} Allergies!
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                  <button
                    onClick={() => handleSelect(pat.id, 'vitals')}
                    title="Record / View Vitals"
                    className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition text-xs font-medium flex items-center gap-1"
                  >
                    <HeartPulse className="h-4 w-4 text-emerald-600" />
                    <span className="hidden md:inline">Vitals</span>
                  </button>
                  <button
                    onClick={() => handleSelect(pat.id, 'consult')}
                    title="Start Clinical Consultation"
                    className="p-1.5 text-slate-500 hover:text-sky-700 hover:bg-sky-50 rounded-md transition text-xs font-medium flex items-center gap-1"
                  >
                    <Stethoscope className="h-4 w-4 text-sky-600" />
                    <span className="hidden md:inline">Consult</span>
                  </button>
                  <button
                    onClick={() => handleSelect(pat.id, 'profile')}
                    className="px-2.5 py-1.5 bg-slate-900 hover:bg-sky-700 text-white rounded-md text-xs font-medium flex items-center gap-1 transition"
                  >
                    <span>View Chart</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <QrCode className="h-4 w-4 text-slate-400" />
            <span>Tip: You can also scan a patient QR badge directly from the QR scanner tab.</span>
          </div>
          <button
            onClick={() => {
              onClose();
              navigate('/patients/register');
            }}
            className="text-sky-600 hover:text-sky-800 font-medium hover:underline"
          >
            + Register New Patient
          </button>
        </div>
      </div>
    </Modal>
  );
};

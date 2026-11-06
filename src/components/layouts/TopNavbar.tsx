import React, { useState, useEffect } from 'react';
import {
  Search,
  Bell,
  Fingerprint,
  RefreshCw,
  PlusCircle,
  Menu,
  ChevronDown,
  Clock,
  Shield,
  Activity,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEMR } from '../../hooks/useEMR';
import { GlobalSearchModal } from '../common/GlobalSearchModal';
import { NotificationDrawer } from '../common/NotificationDrawer';
import { UserRole } from '../../types';

interface TopNavbarProps {
  onToggleSidebar: () => void;
  isSidebarOpen?: boolean;
}

const ROLES: UserRole[] = [
  'Super Administrator',
  'Hospital Administrator',
  'Doctor',
  'Nurse',
  'Laboratory Technician',
  'Pharmacist',
  'Radiologist',
  'Receptionist',
  'Cashier',
];

export const TopNavbar: React.FC<TopNavbarProps> = ({ onToggleSidebar, isSidebarOpen }) => {
  const { currentUser, switchRole, labTests, medications, patients, resetAll } = useEMR();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Global Ctrl+K shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Count unread critical alerts
  const criticalCount =
    labTests.filter((t) => t.urgency === 'Stat (Immediate)').length +
    medications.filter((m) => m.currentStock <= m.minimumStock).length +
    patients.filter((p) => p.status === 'Emergency').length;

  const handleRoleSelect = (role: UserRole) => {
    switchRole(role);
    setIsRoleDropdownOpen(false);
  };

  const handleResetData = () => {
    if (window.confirm('Reset all demonstration data back to fresh clinical defaults?')) {
      resetAll();
      window.location.reload();
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white shadow-md">
        <div className="px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          {/* Left section: Hamburger Menu + Hospital Logo */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Navigation dropdown toggle */}
            <button
              onClick={onToggleSidebar}
              className={`p-2 -ml-2 rounded-lg focus:outline-hidden transition cursor-pointer flex items-center gap-1.5 ${
                isSidebarOpen
                  ? 'bg-sky-500/20 text-sky-400 ring-1 ring-sky-500/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
              aria-label="Toggle navigation dropdown"
              title="Navigation Menu"
            >
              <Menu className="h-6 w-6" />
              <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform duration-200 hidden sm:block ${isSidebarOpen ? 'rotate-180 text-sky-400' : ''}`} />
            </button>

            <div
              onClick={() => navigate('/')}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="h-9 w-9 rounded-lg bg-sky-500 flex items-center justify-center text-white font-black shadow-lg shadow-sky-500/30 group-hover:bg-sky-400 transition">
                <Activity className="h-5 w-5" />
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold tracking-tight text-white text-base">APEX</span>
                  <span className="text-sky-400 font-semibold text-xs tracking-wider uppercase bg-sky-950/80 px-1.5 py-0.5 rounded border border-sky-800/60">
                    EMR 2.0
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-none">Metropolitan Medical HIS</p>
              </div>
            </div>
          </div>

          {/* Center: Search trigger & Clock */}
          <div className="flex-1 max-w-md mx-4 hidden md:block">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="w-full flex items-center justify-between px-3.5 py-2 bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 rounded-lg text-slate-300 text-xs transition-all shadow-inner group"
            >
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-sky-400 group-hover:text-sky-300" />
                <span>Search patient, MRN, phone, diagnosis...</span>
              </div>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-900 border border-slate-700 rounded">
                Ctrl K
              </kbd>
            </button>
          </div>

          {/* Right section: Quick actions, Role switcher, Notifications, Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Clock */}
            <div className="hidden xl:flex items-center gap-1.5 text-xs text-slate-400 border-r border-slate-800 pr-3">
              <Clock className="h-3.5 w-3.5 text-sky-400" />
              <span>
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>

            {/* Quick Register / Triage */}
            <button
              onClick={() => navigate('/patients/register')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg shadow-sm transition"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>New Patient</span>
            </button>

            {/* Role Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg text-xs font-medium text-slate-200 transition"
              >
                <Shield className="h-3.5 w-3.5 text-sky-400" />
                <span className="hidden md:inline max-w-[130px] truncate">{currentUser.role}</span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </button>

              {isRoleDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    Switch Role Preview
                  </div>
                  <div className="max-h-60 overflow-y-auto py-1">
                    {ROLES.map((role) => (
                      <button
                        key={role}
                        onClick={() => handleRoleSelect(role)}
                        className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-800 transition ${
                          currentUser.role === role ? 'text-sky-400 font-semibold bg-slate-800/60' : 'text-slate-300'
                        }`}
                      >
                        <span>{role}</span>
                        {currentUser.role === role && <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Notifications Button */}
            <button
              onClick={() => setIsNotificationsOpen(true)}
              className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
              title="Clinical Alerts"
            >
              <Bell className="h-5 w-5" />
              {criticalCount > 0 && (
                <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-rose-600 text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                  {criticalCount}
                </span>
              )}
            </button>

            {/* Reset Demonstration Data */}
            <button
              onClick={handleResetData}
              className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition"
              title="Reset All Local Synthetic Data"
            >
              <RefreshCw className="h-4 w-4" />
            </button>

            {/* Current Staff User Pill */}
            <div
              onClick={() => navigate('/auth/biometrics')}
              className="flex items-center gap-2 pl-2 border-l border-slate-800 cursor-pointer group"
              title="Staff Profile & Passkey Security"
            >
              <div className="relative">
                {currentUser.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="h-8 w-8 rounded-full object-cover ring-2 ring-sky-500/50"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-sky-700 text-white font-bold flex items-center justify-center text-xs">
                    {currentUser.name.charAt(0)}
                  </div>
                )}
                {currentUser.hasBiometricsRegistered && (
                  <span
                    className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 shadow-sm"
                    title="WebAuthn / Passkey Registered"
                  >
                    <Fingerprint className="h-2.5 w-2.5" />
                  </span>
                )}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-semibold text-slate-100 group-hover:text-sky-300 transition leading-tight">
                  {currentUser.name.split(',')[0]}
                </p>
                <p className="text-[10px] text-slate-400">{currentUser.department}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Global Modals */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <NotificationDrawer isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
    </>
  );
};

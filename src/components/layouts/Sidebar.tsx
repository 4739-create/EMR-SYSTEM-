import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  HeartPulse,
  Calendar,
  FlaskConical,
  Pill,
  FileScan,
  CreditCard,
  ShieldCheck,
  QrCode,
  Fingerprint,
  BarChart3,
  X,
  Activity,
  ChevronDown,
  ChevronsUpDown,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavSection {
  title: string;
  items: {
    label: string;
    path: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Core Operations',
    items: [
      { label: 'Hospital Overview', path: '/', icon: LayoutDashboard },
      { label: 'Patient Directory', path: '/patients', icon: Users },
      { label: 'Appointments', path: '/appointments', icon: Calendar },
    ],
  },
  {
    title: 'Clinical Care',
    items: [
      { label: 'Doctor Workstation', path: '/doctor', icon: Stethoscope },
      { label: 'Nursing & Vitals', path: '/nursing', icon: HeartPulse },
    ],
  },
  {
    title: 'Diagnostics & Pharmacy',
    items: [
      { label: 'Laboratory', path: '/laboratory', icon: FlaskConical },
      { label: 'Pharmacy & Stock', path: '/pharmacy', icon: Pill },
      { label: 'Radiology / PACS', path: '/radiology', icon: FileScan },
    ],
  },
  {
    title: 'Financial & Services',
    items: [
      { label: 'Billing & Cashier', path: '/billing', icon: CreditCard },
      { label: 'QR Scanner & Badges', path: '/qr-module', icon: QrCode },
      { label: 'Passkey & Biometrics', path: '/auth/biometrics', icon: Fingerprint },
    ],
  },
  {
    title: 'Governance & Insights',
    items: [
      { label: 'Reports & Analytics', path: '/reports', icon: BarChart3 },
      { label: 'Hospital Administration', path: '/admin', icon: ShieldCheck },
    ],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();

  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('apex_nav_sections_state');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback
    }

    const initial: Record<string, boolean> = {};
    const currentPath = window.location.pathname;
    let anyActive = false;
    NAV_SECTIONS.forEach((section) => {
      const isActive = section.items.some((item) =>
        item.path === '/' ? currentPath === '/' : currentPath.startsWith(item.path)
      );
      initial[section.title] = isActive;
      if (isActive) anyActive = true;
    });

    if (!anyActive && NAV_SECTIONS.length > 0) {
      initial[NAV_SECTIONS[0].title] = true;
    }
    return initial;
  });

  // Ensure active section is automatically open when navigating
  useEffect(() => {
    const activeSection = NAV_SECTIONS.find((sec) =>
      sec.items.some((item) =>
        item.path === '/'
          ? location.pathname === '/'
          : location.pathname.startsWith(item.path)
      )
    );
    if (activeSection && !openSections[activeSection.title]) {
      setOpenSections((prev) => {
        const updated = { ...prev, [activeSection.title]: true };
        try {
          localStorage.setItem('apex_nav_sections_state', JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });
    }
  }, [location.pathname]);

  const toggleSection = (title: string) => {
    setOpenSections((prev) => {
      const updated = { ...prev, [title]: !prev[title] };
      try {
        localStorage.setItem('apex_nav_sections_state', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const allOpen = NAV_SECTIONS.every((sec) => openSections[sec.title]);

  const toggleAllSections = () => {
    const targetState = !allOpen;
    const updated: Record<string, boolean> = {};
    NAV_SECTIONS.forEach((sec) => {
      updated[sec.title] = targetState;
    });
    setOpenSections(updated);
    try {
      localStorage.setItem('apex_nav_sections_state', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Invisible click-outside backdrop - NO dark dimming, NO blur, 100% transparent */}
      <div
        className="fixed inset-0 z-40 bg-transparent cursor-default"
        onClick={onClose}
      />

      {/* Navigation Dropdown List */}
      <div className="fixed top-16 left-3 sm:left-6 z-50 w-84 sm:w-96 max-w-[calc(100vw-1.5rem)] max-h-[calc(100vh-5rem)] bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl flex flex-col text-slate-300 select-none animate-in fade-in slide-in-from-top-2 duration-150">
        {/* Dropdown Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/70 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-sky-500 flex items-center justify-center text-white font-bold shadow-md shadow-sky-500/30">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <span className="font-bold text-white text-xs tracking-tight">Navigation Menu</span>
              <p className="text-[10px] text-slate-400 leading-none">Apex Metropolitan HIS</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleAllSections}
              className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title={allOpen ? 'Collapse all dropdown lists' : 'Expand all dropdown lists'}
            >
              <ChevronsUpDown className="h-3 w-3 text-sky-400" />
              <span>{allOpen ? 'Collapse all' : 'Expand all'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Close dropdown"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Collapsible Dropdown Categories List */}
        <div className="flex-1 py-2.5 px-3 overflow-y-auto space-y-2 max-h-[60vh]">
          {NAV_SECTIONS.map((section) => {
            const isOpenSection = openSections[section.title] ?? false;
            const hasActiveItem = section.items.some((item) =>
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path)
            );

            return (
              <div key={section.title} className="space-y-1">
                {/* Category Dropdown Header */}
                <button
                  type="button"
                  onClick={() => toggleSection(section.title)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition select-none group cursor-pointer ${
                    hasActiveItem
                      ? 'bg-slate-800/70 text-white font-medium'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                  aria-expanded={isOpenSection}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-1.5 w-1.5 rounded-full transition-colors ${
                        hasActiveItem ? 'bg-sky-400 shadow-sm shadow-sky-400' : 'bg-slate-600 group-hover:bg-slate-400'
                      }`}
                    />
                    <span
                      className={`text-[11px] font-bold uppercase tracking-wider ${
                        hasActiveItem ? 'text-sky-300' : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                    >
                      {section.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded border border-slate-700/50">
                      {section.items.length}
                    </span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 text-slate-400 group-hover:text-slate-200 transition-transform duration-200 ease-out ${
                        isOpenSection ? 'rotate-0' : '-rotate-90'
                      }`}
                    />
                  </div>
                </button>

                {/* Sub-items (collapsible dropdown list) */}
                <div
                  className={`space-y-0.5 pt-0.5 transition-all duration-200 ease-in-out ${
                    isOpenSection
                      ? 'max-h-96 opacity-100 overflow-visible'
                      : 'max-h-0 opacity-0 overflow-hidden pointer-events-none'
                  }`}
                >
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === '/'}
                        onClick={onClose}
                        className={({ isActive }) =>
                          `group flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                            isActive
                              ? 'bg-sky-500/15 text-sky-400 font-semibold border-l-3 border-sky-400 pl-2.5 shadow-xs'
                              : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border-l-3 border-transparent pl-2.5'
                          }`
                        }
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-105" />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="text-[10px] font-bold bg-sky-500/20 text-sky-300 px-1.5 py-0.5 rounded border border-sky-400/30">
                            {item.badge}
                          </span>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Dropdown Footer */}
        <div className="p-2.5 px-3.5 border-t border-slate-800 bg-slate-950/70 text-[11px] text-slate-400 flex items-center justify-between rounded-b-2xl">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-slate-200">Clinical Node #01</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
            v2.6.4 Active
          </span>
        </div>
      </div>
    </>
  );
};

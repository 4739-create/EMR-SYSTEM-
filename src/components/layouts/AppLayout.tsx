import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { TopNavbar } from './TopNavbar';
import { Sidebar } from './Sidebar';
import { ShieldCheck, X } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Keyboard navigation: Escape closes sidebar, Ctrl+B or Ctrl+M toggles it
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'b' || e.key.toLowerCase() === 'm')) {
        e.preventDefault();
        setSidebarOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col font-sans text-slate-900 selection:bg-sky-200 selection:text-sky-900">
      {/* Top Compliance & Synthetic Data Banner */}
      {!bannerDismissed && (
        <div className="bg-slate-950 text-slate-300 border-b border-slate-800 px-4 py-2 text-center text-xs font-medium flex items-center justify-between no-print transition-all">
          <div className="flex-1 flex items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-400/30">
              <ShieldCheck className="h-3 w-3 text-sky-400" />
              Demo Environment
            </span>
            <span className="text-slate-300 text-xs">
              <strong className="text-white font-semibold">CLINICAL DEMONSTRATION EMR:</strong> Synthetic patient data, lab assays, and clinical notes for software evaluation.
            </span>
          </div>
          <button
            onClick={() => setBannerDismissed(true)}
            className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition shrink-0 ml-2 cursor-pointer"
            title="Dismiss notice"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Top Navbar with Navigation Dropdown */}
      <TopNavbar
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        isSidebarOpen={sidebarOpen}
      />

      {/* Main Body - Full width without persistent sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Dropdown List */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Content Outlet - Always full width */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1536px] mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

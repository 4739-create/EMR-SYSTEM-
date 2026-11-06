import React, { useState, useMemo } from 'react';
import {
  FileScan,
  Search,
  Filter,
  Eye,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useEMR } from '../../hooks/useEMR';
import { StorageService } from '../../services/storageService';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { RadiologyRequest } from '../../types';
import { formatDate } from '../../utils';

export const RadiologyPage: React.FC = () => {
  const { radiology, currentUser } = useEMR();

  const [searchQuery, setSearchQuery] = useState('');
  const [modalityFilter, setModalityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Viewer / Report modal
  const [selectedStudy, setSelectedStudy] = useState<RadiologyRequest | null>(null);
  const [findings, setFindings] = useState('');
  const [impression, setImpression] = useState('');
  const [recommendations, setRecommendations] = useState('');

  const filteredStudies = useMemo(() => {
    return radiology.filter((study) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        study.patientName.toLowerCase().includes(q) ||
        study.patientMrn.toLowerCase().includes(q) ||
        study.bodyPart.toLowerCase().includes(q) ||
        study.modality.toLowerCase().includes(q);

      const matchesMod = modalityFilter === 'ALL' || study.modality === modalityFilter;
      const matchesStatus = statusFilter === 'ALL' || study.status === statusFilter;

      return matchesSearch && matchesMod && matchesStatus;
    });
  }, [radiology, searchQuery, modalityFilter, statusFilter]);

  const handleOpenStudy = (study: RadiologyRequest) => {
    setSelectedStudy(study);
    setFindings(study.findings || '');
    setImpression(study.impression || '');
    setRecommendations(study.recommendations || '');
  };

  const handleSaveReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudy) return;

    const updated: RadiologyRequest = {
      ...selectedStudy,
      status: 'Reported',
      radiologistName: currentUser.name,
      reportedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      findings,
      impression,
      recommendations,
    };

    StorageService.saveRadiologyRequest(updated);
    setSelectedStudy(null);
  };

  const getStatusBadge = (status: RadiologyRequest['status']) => {
    switch (status) {
      case 'Reported':
        return 'success';
      case 'Image Acquired':
      case 'In Progress':
        return 'purple';
      case 'Scheduled':
        return 'primary';
      case 'Requested':
        return 'warning';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-sky-50 text-sky-600 rounded-lg">
            <FileScan className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Diagnostic Radiology & PACS Imaging
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Digital radiography, high-resolution sonography, CT/MRI modalities & radiologist reporting
            </p>
          </div>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs font-medium text-slate-500">Total Imaging Orders</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{radiology.length}</h3>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs font-medium text-slate-500">Emergency & Stat</p>
          <h3 className="text-2xl font-bold text-rose-600 mt-1">
            {radiology.filter((r) => r.urgency === 'Emergency' || r.urgency === 'Urgent').length}
          </h3>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs font-medium text-slate-500">In Progress / Acquired</p>
          <h3 className="text-2xl font-bold text-purple-600 mt-1">
            {radiology.filter((r) => r.status === 'In Progress' || r.status === 'Image Acquired').length}
          </h3>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs font-medium text-slate-500">Verified & Reported</p>
          <h3 className="text-2xl font-bold text-emerald-600 mt-1">
            {radiology.filter((r) => r.status === 'Reported').length}
          </h3>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-6 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by patient, MRN, anatomical region or modality..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div className="md:col-span-3">
            <select
              value={modalityFilter}
              onChange={(e) => setModalityFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            >
              <option value="ALL">All Modalities</option>
              <option value="Digital X-Ray">Digital X-Ray</option>
              <option value="CT Scan">CT Scan</option>
              <option value="MRI">MRI</option>
              <option value="Ultrasound">Ultrasound</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            >
              <option value="ALL">All Workflow Statuses</option>
              <option value="Requested">Requested</option>
              <option value="Scheduled">Scheduled</option>
              <option value="In Progress">In Progress</option>
              <option value="Reported">Reported</option>
            </select>
          </div>
        </div>
      </div>

      {/* Studies Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase text-[10px]">
                <th className="py-3 px-4 font-semibold">Modality & Body Region</th>
                <th className="py-3 px-4 font-semibold">Patient Information</th>
                <th className="py-3 px-4 font-semibold">Clinical Indication</th>
                <th className="py-3 px-4 font-semibold">Urgency</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Radiologist</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudies.map((study) => (
                <tr key={study.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900 text-xs">{study.modality}</div>
                    <div className="text-sky-600 font-medium text-[11px]">{study.bodyPart}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{study.requestedAt}</div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{study.patientName}</div>
                    <div className="font-mono text-slate-400 text-[10px]">{study.patientMrn}</div>
                  </td>

                  <td className="py-3 px-4 max-w-xs truncate text-slate-600" title={study.clinicalIndication}>
                    {study.clinicalIndication}
                  </td>

                  <td className="py-3 px-4">
                    <Badge
                      variant={
                        study.urgency === 'Emergency'
                          ? 'danger'
                          : study.urgency === 'Urgent'
                          ? 'warning'
                          : 'neutral'
                      }
                      size="sm"
                    >
                      {study.urgency}
                    </Badge>
                  </td>

                  <td className="py-3 px-4">
                    <Badge variant={getStatusBadge(study.status)} dot>
                      {study.status}
                    </Badge>
                  </td>

                  <td className="py-3 px-4 text-slate-600">
                    <div>{study.radiologistName || 'Unassigned'}</div>
                    {study.reportedAt && (
                      <div className="text-[10px] text-slate-400">{study.reportedAt}</div>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => handleOpenStudy(study)}
                      className="px-3 py-1 bg-slate-900 hover:bg-sky-600 text-white rounded font-semibold text-[11px] inline-flex items-center gap-1"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>{study.status === 'Reported' ? 'View PACS & Report' : 'Dictate Report'}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PACS Viewer & Reporting Modal */}
      {selectedStudy && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedStudy(null)}
          title={`PACS Diagnostic Station: ${selectedStudy.modality} - ${selectedStudy.bodyPart}`}
          subtitle={`Patient: ${selectedStudy.patientName} (${selectedStudy.patientMrn}) • Urgency: ${selectedStudy.urgency}`}
          icon={<FileScan className="h-5 w-5" />}
          maxWidth="5xl"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Simulated DICOM viewport */}
            <div className="lg:col-span-5 bg-slate-950 rounded-xl p-4 flex flex-col justify-between text-slate-300 min-h-[350px] border border-slate-800">
              <div className="flex justify-between text-[11px] font-mono text-slate-400">
                <span>{selectedStudy.modality}</span>
                <span>WL: 40 / WW: 400</span>
              </div>

              {/* Center Viewer Canvas Simulation */}
              <div className="my-auto text-center space-y-3 py-8">
                <div className="h-28 w-28 mx-auto rounded-full border-2 border-dashed border-sky-500/40 flex items-center justify-center text-sky-400/60 bg-sky-950/20">
                  <Activity className="h-12 w-12 animate-pulse" />
                </div>
                <div className="text-xs font-mono text-slate-400">
                  Apex DICOM PACS Viewer (Mock Stream)
                </div>
                <div className="text-[10px] text-slate-500">
                  Resolution: 2048 x 2048 • Slice Thickness: 1.25mm
                </div>
              </div>

              <div className="flex justify-between text-[10px] font-mono text-slate-400 border-t border-slate-800 pt-2">
                <span>FOV: 350mm</span>
                <span>Zoom: 100%</span>
              </div>
            </div>

            {/* Right: Diagnostic Report Form */}
            <form onSubmit={handleSaveReport} className="lg:col-span-7 space-y-3">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <span className="font-bold text-slate-700">Clinical Indication: </span>
                <span className="text-slate-600">{selectedStudy.clinicalIndication}</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Radiological Findings
                </label>
                <textarea
                  rows={4}
                  required
                  value={findings}
                  onChange={(e) => setFindings(e.target.value)}
                  placeholder="Systematic anatomical review: parenchymal evaluation, osseous structures, soft tissue planes..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Impression / Conclusion
                </label>
                <textarea
                  rows={2}
                  required
                  value={impression}
                  onChange={(e) => setImpression(e.target.value)}
                  placeholder="Primary diagnostic impression..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Recommendations / Clinical Advice
                </label>
                <input
                  type="text"
                  value={recommendations}
                  onChange={(e) => setRecommendations(e.target.value)}
                  placeholder="e.g. Recommend surgical consultation, repeat CT in 3 months..."
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setSelectedStudy(null)}
                  className="px-4 py-2 border rounded-lg text-xs font-semibold"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  Sign & Verify Radiology Report
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
};

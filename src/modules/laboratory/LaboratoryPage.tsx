import React, { useState, useMemo } from 'react';
import {
  FlaskConical,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  Clock,
  Barcode,
  FileText,
  User,
  PlusCircle,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { useEMR } from '../../hooks/useEMR';
import { StorageService } from '../../services/storageService';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { LabTestRequest, LabParameterResult } from '../../types';
import { formatDate, generateSampleBarcode } from '../../utils';

export const LaboratoryPage: React.FC = () => {
  const { labTests, patients, staff, currentUser } = useEMR();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [urgencyFilter, setUrgencyFilter] = useState('ALL');

  // Modals
  const [selectedTestForResults, setSelectedTestForResults] = useState<LabTestRequest | null>(null);
  const [isNewRequestModalOpen, setIsNewRequestModalOpen] = useState(false);

  // Result entry form state
  const [resultRows, setResultRows] = useState<LabParameterResult[]>([]);
  const [interpretation, setInterpretation] = useState('');

  // New Request Form state
  const [newPatientId, setNewPatientId] = useState('');
  const [newTestName, setNewTestName] = useState('Complete Blood Count (CBC)');
  const [newCategory, setNewCategory] = useState<LabTestRequest['category']>('Hematology');
  const [newSampleType, setNewSampleType] = useState<LabTestRequest['sampleType']>('Whole Blood');
  const [newUrgency, setNewUrgency] = useState<LabTestRequest['urgency']>('Routine');
  const [newClinicalNotes, setNewClinicalNotes] = useState('');

  // Filtered Lab Tests
  const filteredTests = useMemo(() => {
    return labTests.filter((test) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        test.patientName.toLowerCase().includes(q) ||
        test.patientMrn.toLowerCase().includes(q) ||
        test.testName.toLowerCase().includes(q) ||
        test.sampleBarcode.toLowerCase().includes(q);

      const matchesCat = categoryFilter === 'ALL' || test.category === categoryFilter;
      const matchesStatus = statusFilter === 'ALL' || test.status === statusFilter;
      const matchesUrgency = urgencyFilter === 'ALL' || test.urgency === urgencyFilter;

      return matchesSearch && matchesCat && matchesStatus && matchesUrgency;
    });
  }, [labTests, searchQuery, categoryFilter, statusFilter, urgencyFilter]);

  // Handle sample collection
  const handleCollectSample = (test: LabTestRequest) => {
    const updated: LabTestRequest = {
      ...test,
      status: 'Sample Collected',
      sampleCollectedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      collectedBy: currentUser.name,
    };
    StorageService.saveLabTest(updated);
  };

  // Open Results Modal
  const handleOpenResults = (test: LabTestRequest) => {
    setSelectedTestForResults(test);
    if (test.results && test.results.length > 0) {
      setResultRows(test.results);
      setInterpretation(test.interpretation || '');
    } else {
      // Default sample parameters based on test
      if (test.testName.includes('CBC')) {
        setResultRows([
          { parameter: 'White Blood Cell (WBC)', value: '7.5', unit: 'x10^3/uL', referenceRange: '4.5 - 11.0', flag: 'Normal' },
          { parameter: 'Red Blood Cell (RBC)', value: '4.8', unit: 'x10^6/uL', referenceRange: '4.2 - 5.8', flag: 'Normal' },
          { parameter: 'Hemoglobin (Hgb)', value: '14.2', unit: 'g/dL', referenceRange: '12.0 - 16.0', flag: 'Normal' },
          { parameter: 'Platelets', value: '250', unit: 'x10^3/uL', referenceRange: '150 - 450', flag: 'Normal' },
        ]);
      } else if (test.testName.includes('Metabolic') || test.testName.includes('CMP')) {
        setResultRows([
          { parameter: 'Serum Glucose', value: '98', unit: 'mg/dL', referenceRange: '70 - 100', flag: 'Normal' },
          { parameter: 'Serum Creatinine', value: '1.0', unit: 'mg/dL', referenceRange: '0.6 - 1.2', flag: 'Normal' },
          { parameter: 'Blood Urea Nitrogen (BUN)', value: '15', unit: 'mg/dL', referenceRange: '7 - 20', flag: 'Normal' },
          { parameter: 'Potassium (K+)', value: '4.2', unit: 'mmol/L', referenceRange: '3.5 - 5.0', flag: 'Normal' },
        ]);
      } else {
        setResultRows([
          { parameter: 'Primary Assay Assay Result', value: 'Within Limits', unit: 'Index', referenceRange: '< 1.0', flag: 'Normal' },
        ]);
      }
      setInterpretation('Specimen processed according to standard laboratory protocol. Values within normative biological limits.');
    }
  };

  const handleSaveResults = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTestForResults) return;

    const updated: LabTestRequest = {
      ...selectedTestForResults,
      status: 'Completed',
      completedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      performedBy: currentUser.name,
      results: resultRows,
      interpretation,
    };

    StorageService.saveLabTest(updated);
    setSelectedTestForResults(null);
  };

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const pat = patients.find((p) => p.id === newPatientId);
    if (!pat) return;

    const newReq: LabTestRequest = {
      id: 'lab-req-' + Math.random().toString(36).substring(2, 9),
      patientId: pat.id,
      patientName: `${pat.firstName} ${pat.lastName}`,
      patientMrn: pat.mrn,
      doctorId: currentUser.id,
      doctorName: currentUser.name,
      testName: newTestName,
      category: newCategory,
      sampleType: newSampleType,
      sampleBarcode: generateSampleBarcode(newCategory),
      urgency: newUrgency,
      status: 'Pending Sample',
      requestedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      clinicalNotes: newClinicalNotes,
    };

    StorageService.saveLabTest(newReq);
    setIsNewRequestModalOpen(false);
    setNewClinicalNotes('');
  };

  const getStatusBadgeVariant = (status: LabTestRequest['status']) => {
    switch (status) {
      case 'Completed':
        return 'success';
      case 'Analyzing':
        return 'purple';
      case 'Sample Collected':
        return 'primary';
      case 'Pending Sample':
        return 'warning';
      case 'Rejected':
        return 'danger';
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
            <FlaskConical className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Clinical Pathology & Laboratory</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Specimen tracking, automated laboratory worklists & clinical diagnostic assays
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsNewRequestModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow-xs"
        >
          <PlusCircle className="h-4 w-4" />
          <span>New Lab Request</span>
        </button>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs font-medium text-slate-500">Total Worklist</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{labTests.length}</h3>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs font-medium text-slate-500">Pending Collection</p>
          <h3 className="text-2xl font-bold text-amber-600 mt-1">
            {labTests.filter((t) => t.status === 'Pending Sample').length}
          </h3>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs font-medium text-slate-500">In Analysis</p>
          <h3 className="text-2xl font-bold text-purple-600 mt-1">
            {labTests.filter((t) => t.status === 'Analyzing' || t.status === 'Sample Collected').length}
          </h3>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs font-medium text-slate-500">Critical / Stat Orders</p>
          <h3 className="text-2xl font-bold text-rose-600 mt-1">
            {labTests.filter((t) => t.urgency === 'Stat (Immediate)').length}
          </h3>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-6 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Patient, MRN, Test Name, Barcode..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div className="md:col-span-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            >
              <option value="ALL">All Categories</option>
              <option value="Hematology">Hematology</option>
              <option value="Biochemistry">Biochemistry</option>
              <option value="Microbiology">Microbiology</option>
              <option value="Urinalysis">Urinalysis</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            >
              <option value="ALL">All Statuses</option>
              <option value="Pending Sample">Pending Sample</option>
              <option value="Sample Collected">Sample Collected</option>
              <option value="Analyzing">Analyzing</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            >
              <option value="ALL">All Urgencies</option>
              <option value="Stat (Immediate)">Stat (Immediate)</option>
              <option value="Urgent">Urgent</option>
              <option value="Routine">Routine</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lab Tests Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase text-[10px]">
                <th className="py-3 px-4 font-semibold">Barcode & Test Name</th>
                <th className="py-3 px-4 font-semibold">Patient & MRN</th>
                <th className="py-3 px-4 font-semibold">Sample Type</th>
                <th className="py-3 px-4 font-semibold">Urgency</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Requested By</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTests.map((test) => (
                <tr key={test.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Barcode className="h-4 w-4 text-slate-400" />
                      <span className="font-mono font-bold text-slate-900 text-xs">{test.sampleBarcode}</span>
                    </div>
                    <div className="font-medium text-sky-700 mt-0.5">{test.testName}</div>
                    <div className="text-[10px] text-slate-400">{test.category}</div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{test.patientName}</div>
                    <div className="font-mono text-slate-400 text-[10px]">{test.patientMrn}</div>
                  </td>

                  <td className="py-3 px-4 text-slate-600">{test.sampleType}</td>

                  <td className="py-3 px-4">
                    <Badge
                      variant={
                        test.urgency === 'Stat (Immediate)'
                          ? 'danger'
                          : test.urgency === 'Urgent'
                          ? 'warning'
                          : 'neutral'
                      }
                      size="sm"
                    >
                      {test.urgency}
                    </Badge>
                  </td>

                  <td className="py-3 px-4">
                    <Badge variant={getStatusBadgeVariant(test.status)} dot>
                      {test.status}
                    </Badge>
                  </td>

                  <td className="py-3 px-4 text-slate-600">
                    <div>{test.doctorName}</div>
                    <div className="text-[10px] text-slate-400">{test.requestedAt}</div>
                  </td>

                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      {test.status === 'Pending Sample' && (
                        <button
                          onClick={() => handleCollectSample(test)}
                          className="px-2.5 py-1 bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 rounded font-semibold text-[11px]"
                        >
                          Collect Sample
                        </button>
                      )}

                      {test.status === 'Sample Collected' && (
                        <button
                          onClick={() => {
                            StorageService.saveLabTest({ ...test, status: 'Analyzing' });
                          }}
                          className="px-2.5 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded font-semibold text-[11px]"
                        >
                          Run Analyzer
                        </button>
                      )}

                      {(test.status === 'Analyzing' || test.status === 'Completed') && (
                        <button
                          onClick={() => handleOpenResults(test)}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-sky-600 text-white rounded font-semibold text-[11px]"
                        >
                          {test.status === 'Completed' ? 'View Results' : 'Enter Results'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enter / View Results Modal */}
      {selectedTestForResults && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedTestForResults(null)}
          title={`Diagnostic Assay Results: ${selectedTestForResults.testName}`}
          subtitle={`Patient: ${selectedTestForResults.patientName} (${selectedTestForResults.patientMrn}) • Barcode: ${selectedTestForResults.sampleBarcode}`}
          icon={<FlaskConical className="h-5 w-5" />}
          maxWidth="4xl"
        >
          <form onSubmit={handleSaveResults} className="space-y-4">
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase text-[10px]">
                    <th className="py-2.5 px-3">Parameter Analyzed</th>
                    <th className="py-2.5 px-3">Observed Value</th>
                    <th className="py-2.5 px-3">Units</th>
                    <th className="py-2.5 px-3">Reference Interval</th>
                    <th className="py-2.5 px-3">Flag / Alert</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {resultRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-semibold text-slate-800">{row.parameter}</td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={row.value}
                          onChange={(e) => {
                            const updated = [...resultRows];
                            updated[idx].value = e.target.value;
                            setResultRows(updated);
                          }}
                          className="p-1.5 bg-slate-50 border border-slate-300 rounded font-bold font-mono text-xs w-28"
                        />
                      </td>
                      <td className="py-2 px-3 text-slate-500 font-mono">{row.unit}</td>
                      <td className="py-2 px-3 text-slate-500 font-mono">{row.referenceRange}</td>
                      <td className="py-2 px-3">
                        <select
                          value={row.flag}
                          onChange={(e) => {
                            const updated = [...resultRows];
                            updated[idx].flag = e.target.value as any;
                            setResultRows(updated);
                          }}
                          className={`p-1 rounded text-xs font-semibold border ${
                            row.flag === 'Critical'
                              ? 'bg-rose-100 text-rose-800 border-rose-300'
                              : row.flag === 'High' || row.flag === 'Low'
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          }`}
                        >
                          <option value="Normal">Normal</option>
                          <option value="High">High</option>
                          <option value="Low">Low</option>
                          <option value="Critical">Critical</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Clinical Interpretation / Pathologist Remarks
              </label>
              <textarea
                rows={3}
                value={interpretation}
                onChange={(e) => setInterpretation(e.target.value)}
                placeholder="Interpretation of results, abnormal findings correlation..."
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setSelectedTestForResults(null)}
                className="px-4 py-2 border rounded-lg text-xs font-semibold"
              >
                Close
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                Verify & Publish Lab Results
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* New Lab Request Modal */}
      <Modal
        isOpen={isNewRequestModalOpen}
        onClose={() => setIsNewRequestModalOpen(false)}
        title="Order New Diagnostic Laboratory Test"
        subtitle="Submit sample request to clinical laboratory worklist"
        icon={<PlusCircle className="h-5 w-5" />}
        maxWidth="xl"
      >
        <form onSubmit={handleCreateRequest} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Patient *</label>
            <select
              required
              value={newPatientId}
              onChange={(e) => setNewPatientId(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
            >
              <option value="">-- Choose Patient --</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName} ({p.mrn})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              >
                <option value="Hematology">Hematology</option>
                <option value="Biochemistry">Biochemistry</option>
                <option value="Microbiology">Microbiology</option>
                <option value="Immunology">Immunology</option>
                <option value="Urinalysis">Urinalysis</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Sample Matrix</label>
              <select
                value={newSampleType}
                onChange={(e) => setNewSampleType(e.target.value as any)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              >
                <option value="Whole Blood">Whole Blood</option>
                <option value="Serum">Serum</option>
                <option value="Plasma">Plasma</option>
                <option value="Urine">Urine</option>
                <option value="Swab">Swab</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Test Name *</label>
            <input
              type="text"
              required
              value={newTestName}
              onChange={(e) => setNewTestName(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Urgency</label>
            <select
              value={newUrgency}
              onChange={(e) => setNewUrgency(e.target.value as any)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
            >
              <option value="Routine">Routine</option>
              <option value="Urgent">Urgent</option>
              <option value="Stat (Immediate)">Stat (Immediate)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Indication / Notes</label>
            <textarea
              rows={2}
              value={newClinicalNotes}
              onChange={(e) => setNewClinicalNotes(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setIsNewRequestModalOpen(false)}
              className="px-4 py-2 border rounded-lg text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-sky-600 text-white rounded-lg text-xs font-semibold"
            >
              Submit Lab Order
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

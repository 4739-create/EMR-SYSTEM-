import React, { useState, useMemo } from 'react';
import {
  Pill,
  Search,
  Filter,
  AlertTriangle,
  Package,
  PlusCircle,
  Clock,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useEMR } from '../../hooks/useEMR';
import { StorageService } from '../../services/storageService';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Medication, PrescriptionItem } from '../../types';
import { formatCurrency, formatDate } from '../../utils';

export const PharmacyPage: React.FC = () => {
  const { medications, consultations, currentUser } = useEMR();

  const [activeTab, setActiveTab] = useState<'inventory' | 'prescriptions'>('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [stockStatusFilter, setStockStatusFilter] = useState('ALL');

  // Modals
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [selectedMedForRestock, setSelectedMedForRestock] = useState<Medication | null>(null);
  const [restockQty, setRestockQty] = useState(100);

  // New medication modal
  const [isNewMedModalOpen, setIsNewMedModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newGeneric, setNewGeneric] = useState('');
  const [newCategory, setNewCategory] = useState<Medication['category']>('Antibiotics');
  const [newForm, setNewForm] = useState<Medication['dosageForm']>('Tablet');
  const [newStrength, setNewStrength] = useState('500 mg');
  const [newStock, setNewStock] = useState(200);
  const [newMinStock, setNewMinStock] = useState(50);
  const [newUnitPrice, setNewUnitPrice] = useState(15.0);
  const [newLocation, setNewLocation] = useState('Shelf A-01');

  // Collect all pending e-prescriptions across all consultations
  const allPrescriptions = useMemo(() => {
    const list: { consultationId: string; patientId: string; rx: PrescriptionItem }[] = [];
    consultations.forEach((c) => {
      c.prescriptions.forEach((rx) => {
        list.push({ consultationId: c.id, patientId: c.patientId, rx });
      });
    });
    return list;
  }, [consultations]);

  // Inventory filtering
  const filteredMeds = useMemo(() => {
    return medications.filter((m) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.genericName.toLowerCase().includes(q) ||
        m.code.toLowerCase().includes(q) ||
        m.batchNumber.toLowerCase().includes(q);

      const matchesCat = categoryFilter === 'ALL' || m.category === categoryFilter;

      let matchesStock = true;
      if (stockStatusFilter === 'LOW') {
        matchesStock = m.currentStock <= m.minimumStock;
      } else if (stockStatusFilter === 'NORMAL') {
        matchesStock = m.currentStock > m.minimumStock;
      }

      return matchesSearch && matchesCat && matchesStock;
    });
  }, [medications, searchQuery, categoryFilter, stockStatusFilter]);

  // Restock handler
  const handleRestock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMedForRestock) return;

    const updated: Medication = {
      ...selectedMedForRestock,
      currentStock: selectedMedForRestock.currentStock + Number(restockQty),
    };

    StorageService.saveMedication(updated);
    setIsRestockModalOpen(false);
    setSelectedMedForRestock(null);
  };

  // Add new med handler
  const handleAddNewMed = (e: React.FormEvent) => {
    e.preventDefault();
    const newMed: Medication = {
      id: 'med-' + Math.random().toString(36).substring(2, 9),
      code: 'MED-' + Math.floor(1000 + Math.random() * 9000),
      name: newName,
      genericName: newGeneric,
      category: newCategory,
      dosageForm: newForm,
      strength: newStrength,
      currentStock: Number(newStock),
      minimumStock: Number(newMinStock),
      unitPrice: Number(newUnitPrice),
      expiryDate: '2028-06-30',
      batchNumber: 'BT-' + Math.floor(10000 + Math.random() * 90000),
      manufacturer: 'Apex Pharmaceutical Industries',
      location: newLocation,
    };

    StorageService.saveMedication(newMed);
    setIsNewMedModalOpen(false);
    setNewName('');
    setNewGeneric('');
  };

  // Dispense prescription
  const handleDispenseRx = (consultationId: string, rxId: string) => {
    const consult = consultations.find((c) => c.id === consultationId);
    if (!consult) return;

    const updatedRx = consult.prescriptions.map((rx) => {
      if (rx.id === rxId) {
        return {
          ...rx,
          status: 'Dispensed' as const,
          dispensedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
          dispensedBy: currentUser.name,
        };
      }
      return rx;
    });

    StorageService.saveConsultation({
      ...consult,
      prescriptions: updatedRx,
    });
  };

  const lowStockCount = medications.filter((m) => m.currentStock <= m.minimumStock).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-sky-50 text-sky-600 rounded-lg">
            <Pill className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Inpatient & Clinical Pharmacy</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Stock control, formulation catalog, batch expiry tracking & e-prescription dispensing
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Tabs switch */}
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                activeTab === 'inventory' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Medication Stock
            </button>
            <button
              onClick={() => setActiveTab('prescriptions')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                activeTab === 'prescriptions' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Pending Prescriptions ({allPrescriptions.filter((p) => p.rx.status === 'Pending').length})
            </button>
          </div>

          <button
            onClick={() => setIsNewMedModalOpen(true)}
            className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Add Medication</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs font-medium text-slate-500">Formulation SKUs</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{medications.length}</h3>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs font-medium text-slate-500">Low Stock Reorders</p>
          <h3 className="text-2xl font-bold text-rose-600 mt-1">{lowStockCount}</h3>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs font-medium text-slate-500">Pending To Dispense</p>
          <h3 className="text-2xl font-bold text-amber-600 mt-1">
            {allPrescriptions.filter((p) => p.rx.status === 'Pending').length}
          </h3>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs font-medium text-slate-500">Dispensed Orders</p>
          <h3 className="text-2xl font-bold text-emerald-600 mt-1">
            {allPrescriptions.filter((p) => p.rx.status === 'Dispensed').length}
          </h3>
        </div>
      </div>

      {activeTab === 'inventory' ? (
        <>
          {/* Search & Filters */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-6 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by drug name, generic formulation, code or batch..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="md:col-span-3">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="ALL">All Therapeutic Categories</option>
                  <option value="Antibiotics">Antibiotics</option>
                  <option value="Analgesics">Analgesics</option>
                  <option value="Cardiovascular">Cardiovascular</option>
                  <option value="Antidiabetic">Antidiabetic</option>
                  <option value="Respiratory">Respiratory</option>
                </select>
              </div>

              <div className="md:col-span-3">
                <select
                  value={stockStatusFilter}
                  onChange={(e) => setStockStatusFilter(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="ALL">All Stock Levels</option>
                  <option value="LOW">Low Stock Alert (&lt; Minimum)</option>
                  <option value="NORMAL">Adequate Stock</option>
                </select>
              </div>
            </div>
          </div>

          {/* Medication Catalog Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase text-[10px]">
                    <th className="py-3 px-4 font-semibold">Medication & Formulation</th>
                    <th className="py-3 px-4 font-semibold">Category & Form</th>
                    <th className="py-3 px-4 font-semibold">Current Stock</th>
                    <th className="py-3 px-4 font-semibold">Unit Price</th>
                    <th className="py-3 px-4 font-semibold">Batch & Expiry</th>
                    <th className="py-3 px-4 font-semibold">Shelf Location</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMeds.map((med) => {
                    const isLow = med.currentStock <= med.minimumStock;
                    return (
                      <tr key={med.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 text-xs">{med.name}</div>
                          <div className="text-[11px] text-slate-500">{med.genericName} ({med.strength})</div>
                          <div className="text-[10px] font-mono text-slate-400">{med.code}</div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-700">{med.category}</div>
                          <div className="text-[10px] text-slate-400">{med.dosageForm}</div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-mono font-bold text-xs ${
                                isLow ? 'text-rose-600' : 'text-slate-900'
                              }`}
                            >
                              {med.currentStock} units
                            </span>
                            {isLow && (
                              <Badge variant="danger" size="sm">
                                Low (&lt;{med.minimumStock})
                              </Badge>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">Min Threshold: {med.minimumStock}</div>
                        </td>

                        <td className="py-3 px-4 font-semibold text-slate-800">
                          {formatCurrency(med.unitPrice)}
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-mono text-[11px] text-slate-800">{med.batchNumber}</div>
                          <div className="text-[10px] text-slate-500">Exp: {formatDate(med.expiryDate)}</div>
                        </td>

                        <td className="py-3 px-4 text-slate-600">{med.location}</td>

                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => {
                              setSelectedMedForRestock(med);
                              setIsRestockModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-[11px]"
                          >
                            Restock
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Prescriptions Tab */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-200 font-bold text-slate-900 text-sm">
            E-Prescription Dispensing Worklist
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase text-[10px]">
                  <th className="py-3 px-4 font-semibold">Medication Prescribed</th>
                  <th className="py-3 px-4 font-semibold">Dosage & Frequency</th>
                  <th className="py-3 px-4 font-semibold">Route & Duration</th>
                  <th className="py-3 px-4 font-semibold">Prescribing Doctor</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allPrescriptions.map(({ consultationId, rx }) => (
                  <tr key={rx.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{rx.medicationName}</div>
                      <div className="text-[10px] text-slate-400 italic">{rx.instructions}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{rx.dosage}</div>
                      <div className="text-[10px] text-slate-500">{rx.frequency}</div>
                    </td>

                    <td className="py-3 px-4 text-slate-600">
                      <div>{rx.route}</div>
                      <div className="text-[10px] text-slate-400">{rx.durationDays} days supply</div>
                    </td>

                    <td className="py-3 px-4 text-slate-600">
                      <div>{rx.prescribedBy}</div>
                      <div className="text-[10px] text-slate-400">{rx.prescribedAt}</div>
                    </td>

                    <td className="py-3 px-4">
                      <Badge variant={rx.status === 'Dispensed' ? 'success' : 'warning'} dot>
                        {rx.status}
                      </Badge>
                      {rx.dispensedBy && (
                        <div className="text-[10px] text-slate-400 mt-0.5">by {rx.dispensedBy}</div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {rx.status === 'Pending' ? (
                        <button
                          onClick={() => handleDispenseRx(consultationId, rx.id)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-semibold text-[11px]"
                        >
                          Dispense Drug
                        </button>
                      ) : (
                        <span className="text-emerald-700 font-semibold text-[11px] flex items-center justify-end gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Fulfilled</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {selectedMedForRestock && (
        <Modal
          isOpen={isRestockModalOpen}
          onClose={() => setIsRestockModalOpen(false)}
          title={`Restock Medication: ${selectedMedForRestock.name}`}
          subtitle={`Current stock: ${selectedMedForRestock.currentStock} units • Location: ${selectedMedForRestock.location}`}
          icon={<Package className="h-5 w-5" />}
          maxWidth="md"
        >
          <form onSubmit={handleRestock} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Quantity to Add to Inventory *
              </label>
              <input
                type="number"
                min="1"
                required
                value={restockQty}
                onChange={(e) => setRestockQty(Number(e.target.value))}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold font-mono text-slate-900"
              />
            </div>

            <div className="text-xs text-slate-500">
              New stock level will be:{' '}
              <strong className="text-emerald-600 font-mono">
                {selectedMedForRestock.currentStock + Number(restockQty)} units
              </strong>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setIsRestockModalOpen(false)}
                className="px-4 py-2 border rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-sky-600 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                Confirm Restock
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add New Formulation Modal */}
      <Modal
        isOpen={isNewMedModalOpen}
        onClose={() => setIsNewMedModalOpen(false)}
        title="Register New Medication / Stock SKU"
        subtitle="Add a new pharmaceutical product into hospital dispensary"
        icon={<PlusCircle className="h-5 w-5" />}
        maxWidth="lg"
      >
        <form onSubmit={handleAddNewMed} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Brand Name *</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Augmentin"
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Generic Name *</label>
              <input
                type="text"
                required
                value={newGeneric}
                onChange={(e) => setNewGeneric(e.target.value)}
                placeholder="e.g. Amoxicillin / Clavulanate"
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              >
                <option value="Antibiotics">Antibiotics</option>
                <option value="Analgesics">Analgesics</option>
                <option value="Cardiovascular">Cardiovascular</option>
                <option value="Antidiabetic">Antidiabetic</option>
                <option value="Respiratory">Respiratory</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Dosage Form</label>
              <select
                value={newForm}
                onChange={(e) => setNewForm(e.target.value as any)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              >
                <option value="Tablet">Tablet</option>
                <option value="Capsule">Capsule</option>
                <option value="Syrup">Syrup</option>
                <option value="Injection">Injection</option>
                <option value="Inhaler">Inhaler</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Strength</label>
              <input
                type="text"
                value={newStrength}
                onChange={(e) => setNewStrength(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Stock</label>
              <input
                type="number"
                value={newStock}
                onChange={(e) => setNewStock(Number(e.target.value))}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Minimum Alert Qty</label>
              <input
                type="number"
                value={newMinStock}
                onChange={(e) => setNewMinStock(Number(e.target.value))}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Price ($)</label>
              <input
                type="number"
                step="0.1"
                value={newUnitPrice}
                onChange={(e) => setNewUnitPrice(Number(e.target.value))}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setIsNewMedModalOpen(false)}
              className="px-4 py-2 border rounded-lg text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-sky-600 text-white rounded-lg text-xs font-semibold"
            >
              Save Medication
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

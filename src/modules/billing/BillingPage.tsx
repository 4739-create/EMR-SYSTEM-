import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  DollarSign,
  Search,
  Filter,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  FileText,
  Printer,
  ArrowRight,
  ShieldCheck,
  Receipt,
} from 'lucide-react';
import { useEMR } from '../../hooks/useEMR';
import { StorageService } from '../../services/storageService';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Invoice, PaymentRecord, InvoiceItem } from '../../types';
import { formatCurrency, formatDate, generateInvoiceNumber } from '../../utils';

export const BillingPage: React.FC = () => {
  const { invoices, patients, currentUser } = useEMR();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentRecord['paymentMethod']>('Credit Card');
  const [referenceNumber, setReferenceNumber] = useState('');

  // New Invoice Modal
  const [isNewInvoiceOpen, setIsNewInvoiceOpen] = useState(false);
  const [newPatientId, setNewPatientId] = useState('');
  const [newItems, setNewItems] = useState<InvoiceItem[]>([
    { id: 'item-1', description: 'Specialist Clinical Consultation', category: 'Consultation', quantity: 1, unitPrice: 150.0, total: 150.0 },
  ]);
  const [newInsuranceCovered, setNewInsuranceCovered] = useState(100);

  // Financial aggregates
  const totalBilled = invoices.reduce((s, i) => s + i.totalAmount, 0);
  const totalCollected = invoices.reduce((s, i) => s + i.amountPaid, 0);
  const totalBalanceDue = invoices.reduce((s, i) => s + i.balanceDue, 0);
  const totalInsurance = invoices.reduce((s, i) => s + i.insuranceCoveredAmount, 0);

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.patientName.toLowerCase().includes(q) ||
        inv.patientMrn.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchQuery, statusFilter]);

  const handleOpenPayment = (inv: Invoice) => {
    setSelectedInvoiceForPayment(inv);
    setPaymentAmount(inv.balanceDue);
    setReferenceNumber('PAY-' + Math.floor(10000 + Math.random() * 90000));
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceForPayment) return;

    const amt = Number(paymentAmount);
    const newPaid = selectedInvoiceForPayment.amountPaid + amt;
    const newBal = Math.max(0, selectedInvoiceForPayment.totalAmount - newPaid);

    const payment: PaymentRecord = {
      id: 'pay-' + Math.random().toString(36).substring(2, 9),
      date: new Date().toISOString().split('T')[0],
      amount: amt,
      paymentMethod,
      referenceNumber,
      receivedBy: currentUser.name,
    };

    const updated: Invoice = {
      ...selectedInvoiceForPayment,
      amountPaid: newPaid,
      balanceDue: newBal,
      status: newBal <= 0 ? 'Paid' : 'Partially Paid',
      payments: [...selectedInvoiceForPayment.payments, payment],
    };

    StorageService.saveInvoice(updated);
    setSelectedInvoiceForPayment(null);
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const pat = patients.find((p) => p.id === newPatientId);
    if (!pat) return;

    const subtotal = newItems.reduce((s, item) => s + item.total, 0);
    const tax = subtotal * 0.05;
    const totalAmount = subtotal + tax;
    const balanceDue = Math.max(0, totalAmount - Number(newInsuranceCovered));

    const invoice: Invoice = {
      id: 'inv-' + Math.random().toString(36).substring(2, 9),
      invoiceNumber: generateInvoiceNumber(),
      patientId: pat.id,
      patientName: `${pat.firstName} ${pat.lastName}`,
      patientMrn: pat.mrn,
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      status: balanceDue === 0 ? 'Paid' : 'Unpaid',
      items: newItems,
      subtotal,
      tax,
      discount: 0,
      insuranceCoveredAmount: Number(newInsuranceCovered),
      totalAmount,
      amountPaid: 0,
      balanceDue,
      payments: [],
    };

    StorageService.saveInvoice(invoice);
    setIsNewInvoiceOpen(false);
  };

  const getStatusBadge = (status: Invoice['status']) => {
    switch (status) {
      case 'Paid':
        return 'success';
      case 'Partially Paid':
        return 'warning';
      case 'Unpaid':
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
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Billing & Revenue Cycle Management</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Itemized patient invoicing, co-payments, insurance adjudications & cashier ledger
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsNewInvoiceOpen(true)}
          className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Generate Patient Invoice</span>
        </button>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Gross Billed (Charges)</span>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(totalBilled)}</h3>
          <p className="text-[10px] text-slate-400 mt-1">{invoices.length} Invoices generated</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Insurance Adjudicated</span>
          <h3 className="text-2xl font-bold text-sky-600 mt-1">{formatCurrency(totalInsurance)}</h3>
          <p className="text-[10px] text-slate-400 mt-1">Covered by health policies</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Cash / Copay Collected</span>
          <h3 className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(totalCollected)}</h3>
          <p className="text-[10px] text-slate-400 mt-1">Received at hospital cashier</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Outstanding Balance Due</span>
          <h3 className="text-2xl font-bold text-rose-600 mt-1">{formatCurrency(totalBalanceDue)}</h3>
          <p className="text-[10px] text-slate-400 mt-1">Pending patient payment</p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-8 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by invoice number, patient name or MRN..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div className="md:col-span-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            >
              <option value="ALL">All Payment Statuses</option>
              <option value="Paid">Fully Paid</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Unpaid">Unpaid</option>
            </select>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase text-[10px]">
                <th className="py-3 px-4 font-semibold">Invoice #</th>
                <th className="py-3 px-4 font-semibold">Patient Information</th>
                <th className="py-3 px-4 font-semibold">Date & Due Date</th>
                <th className="py-3 px-4 font-semibold">Total Amount</th>
                <th className="py-3 px-4 font-semibold">Insurance Share</th>
                <th className="py-3 px-4 font-semibold">Balance Due</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    {inv.invoiceNumber}
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{inv.patientName}</div>
                    <div className="font-mono text-slate-400 text-[10px]">{inv.patientMrn}</div>
                  </td>

                  <td className="py-3 px-4 text-slate-600">
                    <div>{formatDate(inv.date)}</div>
                    <div className="text-[10px] text-slate-400">Due: {formatDate(inv.dueDate)}</div>
                  </td>

                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    {formatCurrency(inv.totalAmount)}
                  </td>

                  <td className="py-3 px-4 font-mono text-sky-700">
                    {formatCurrency(inv.insuranceCoveredAmount)}
                  </td>

                  <td className="py-3 px-4 font-mono font-bold text-rose-600">
                    {formatCurrency(inv.balanceDue)}
                  </td>

                  <td className="py-3 px-4">
                    <Badge variant={getStatusBadge(inv.status)} dot>
                      {inv.status}
                    </Badge>
                  </td>

                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    {inv.balanceDue > 0 ? (
                      <button
                        onClick={() => handleOpenPayment(inv)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-semibold text-[11px]"
                      >
                        Receive Payment
                      </button>
                    ) : (
                      <span className="text-emerald-700 font-semibold text-[11px] inline-flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Settled</span>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {selectedInvoiceForPayment && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedInvoiceForPayment(null)}
          title={`Hospital Cashier Receipt: ${selectedInvoiceForPayment.invoiceNumber}`}
          subtitle={`Patient: ${selectedInvoiceForPayment.patientName} • Remaining Due: ${formatCurrency(selectedInvoiceForPayment.balanceDue)}`}
          icon={<Receipt className="h-5 w-5" />}
          maxWidth="md"
        >
          <form onSubmit={handleRecordPayment} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Amount ($) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={selectedInvoiceForPayment.balanceDue}
                required
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-base font-bold font-mono text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              >
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Health Insurance">Health Insurance Co-pay</option>
                <option value="Cash">Cash</option>
                <option value="Mobile Payment">Mobile Payment</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Transaction Reference / Authorization Code
              </label>
              <input
                type="text"
                required
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setSelectedInvoiceForPayment(null)}
                className="px-4 py-2 border rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                Process & Print Receipt
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Generate Invoice Modal */}
      <Modal
        isOpen={isNewInvoiceOpen}
        onClose={() => setIsNewInvoiceOpen(false)}
        title="Generate New Patient Invoice"
        subtitle="Create hospital billing statement"
        icon={<PlusCircle className="h-5 w-5" />}
        maxWidth="xl"
      >
        <form onSubmit={handleCreateInvoice} className="space-y-4">
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

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Insurance Covered ($)</label>
            <input
              type="number"
              value={newInsuranceCovered}
              onChange={(e) => setNewInsuranceCovered(Number(e.target.value))}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setIsNewInvoiceOpen(false)}
              className="px-4 py-2 border rounded-lg text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-sky-600 text-white rounded-lg text-xs font-semibold"
            >
              Generate Invoice
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

import { useEffect, useState } from 'react';
import { FileText, Download, Printer, ArrowLeft } from 'lucide-react';
import { api } from '../services/api';
import { PageLoader, SectionHeader, StatusBadge, Btn, Empty, fmt, fmtDate } from '../components/ui';

function InvoiceDocument({ invoice, onClose, onMarkPaid, onSendEmail, canManage }) {
  const cgst = (Number(invoice.tax_amount) || 0) / 2;
  const sgst = cgst;

  const dueDate = invoice.created_at
    ? new Date(new Date(invoice.created_at).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const handlePrint = () => window.print();

  return (
    <div className="space-y-4">
      {/* Top action bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft size={16} /> Back to Invoices
        </button>
        <div className="flex items-center gap-2 flex-wrap">
          {canManage && invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
            <Btn variant="primary" size="sm" onClick={onMarkPaid}>Mark as Paid</Btn>
          )}
          {canManage && (
            <Btn variant="secondary" size="sm" onClick={onSendEmail}>Send Email</Btn>
          )}
          <Btn variant="secondary" size="sm" onClick={handlePrint}>
            <Printer size={14} /> Print
          </Btn>
          <Btn variant="secondary" size="sm" onClick={handlePrint}>
            <Download size={14} /> Download PDF
          </Btn>
        </div>
      </div>

      {/* Document */}
      <div className="bg-slate-800 border border-slate-700/50 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-700/50">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
                  V
                </div>
                <span className="text-lg font-bold text-white">VendorBridge</span>
              </div>
              <p className="text-sm text-slate-400">Purchase Order &amp; Invoice</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-white mb-1">{invoice.invoice_number}</p>
              <StatusBadge status={invoice.status} />
            </div>
          </div>
        </div>

        {/* Bill To / Vendor */}
        <div className="grid grid-cols-2 gap-6 px-8 py-6 border-b border-slate-700/50">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">Bill To</p>
            <p className="text-sm font-semibold text-white">Your Organization</p>
            <p className="text-xs text-slate-400 mt-1">Procurement Department</p>
            <p className="text-xs text-slate-400">VendorBridge ERP Platform</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">Vendor</p>
            <p className="text-sm font-semibold text-white">{invoice.vendor_name}</p>
            {invoice.vendor_email && (
              <p className="text-xs text-slate-400 mt-1">{invoice.vendor_email}</p>
            )}
            {invoice.gst_number && (
              <p className="text-xs text-slate-400">GSTIN: {invoice.gst_number}</p>
            )}
            {(invoice.address || invoice.city) && (
              <p className="text-xs text-slate-400">
                {[invoice.address, invoice.city, invoice.state, invoice.pincode].filter(Boolean).join(', ')}
              </p>
            )}
          </div>
        </div>

        {/* PO Details row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-8 py-4 border-b border-slate-700/50 bg-slate-900/25">
          {[
            ['PO Number',    invoice.po_number],
            ['Invoice Date', fmtDate(invoice.created_at)],
            ['PO Date',      fmtDate(invoice.created_at)],
            ['Due Date',     dueDate ? fmtDate(dueDate) : '—'],
          ].map(([label, val]) => (
            <div key={label}>
              <p className="text-xs text-slate-500 mb-0.5">{label}</p>
              <p className="text-sm font-medium text-white">{val}</p>
            </div>
          ))}
        </div>

        {/* Line Items */}
        <div className="px-8 py-5 border-b border-slate-700/50">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Line Items</p>
          <div className="bg-slate-900/40 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-2.5 uppercase">Item</th>
                  <th className="text-right text-xs font-medium text-slate-500 px-4 py-2.5 uppercase">Qty</th>
                  <th className="text-right text-xs font-medium text-slate-500 px-4 py-2.5 uppercase">Unit Price</th>
                  <th className="text-right text-xs font-medium text-slate-500 px-4 py-2.5 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/20">
                {invoice.items?.length > 0 ? invoice.items.map((item, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 text-sm text-white">{item.product_name}</td>
                    <td className="px-4 py-3 text-sm text-right text-slate-300">
                      {item.quantity}{item.unit ? ` ${item.unit}` : ''}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-slate-300">{fmt(item.unit_price)}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-white">{fmt(item.total_price)}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-500">
                      No line item details available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className="px-8 py-6 flex justify-end">
          <div className="w-full max-w-xs space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Subtotal</span>
              <span className="text-white">{fmt(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">CGST (9%)</span>
              <span className="text-white">{fmt(cgst)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">SGST (9%)</span>
              <span className="text-white">{fmt(sgst)}</span>
            </div>
            <div className="border-t border-slate-600 pt-3 flex justify-between items-baseline">
              <span className="text-sm font-semibold text-white">Grand Total</span>
              <span className="text-xl font-bold text-indigo-400">{fmt(invoice.total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Invoices({ user, addToast }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [processing, setProcessing] = useState(false);

  const canManage = ['admin', 'procurement_officer'].includes(user?.role);

  const load = () => {
    setLoading(true);
    api.getInvoices()
      .then(setInvoices)
      .catch(e => addToast('Error', e.message, 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleView = async (inv) => {
    setLoadingDetail(true);
    try {
      const detail = await api.getInvoice(inv.id);
      setSelected(detail);
    } catch (e) {
      addToast('Error', e.message, 'error');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!selected) return;
    setProcessing(true);
    try {
      await api.updateInvoiceStatus(selected.id, 'paid');
      addToast('Marked as Paid', selected.invoice_number, 'success');
      setSelected(prev => ({ ...prev, status: 'paid' }));
      load();
    } catch (e) {
      addToast('Error', e.message, 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleSendEmail = async () => {
    if (!selected) return;
    setProcessing(true);
    try {
      await api.sendInvoiceEmail(selected.id);
      addToast('Email Sent', `Invoice sent to ${selected.vendor_name}`, 'success');
    } catch (e) {
      addToast('Error', e.message, 'error');
    } finally {
      setProcessing(false);
    }
  };

  if (loading || loadingDetail) return <PageLoader />;

  if (selected) {
    return (
      <InvoiceDocument
        invoice={selected}
        onClose={() => setSelected(null)}
        onMarkPaid={handleMarkPaid}
        onSendEmail={handleSendEmail}
        canManage={canManage}
      />
    );
  }

  return (
    <div className="space-y-5">
      <SectionHeader title="Invoices" subtitle="Purchase orders and payment records" />

      {invoices.length === 0 ? (
        <Empty icon={FileText} message="No invoices found" />
      ) : (
        <div className="bg-slate-800 border border-slate-700/50 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50 bg-slate-800/80">
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-3 uppercase tracking-wide">Invoice #</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-3 uppercase tracking-wide">PO #</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-3 uppercase tracking-wide">Vendor</th>
                  <th className="text-right text-xs font-medium text-slate-500 px-4 py-3 uppercase tracking-wide">Total</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-3 uppercase tracking-wide">Date</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-3 uppercase tracking-wide">Status</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-4 py-3 uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/20">
                {invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-700/10 transition-colors">
                    <td className="px-4 py-3 text-xs font-mono text-slate-400">{inv.invoice_number}</td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-400">{inv.po_number}</td>
                    <td className="px-4 py-3 text-sm text-white">{inv.vendor_name}</td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-white">{fmt(inv.total)}</td>
                    <td className="px-4 py-3 text-sm text-slate-400">{fmtDate(inv.created_at)}</td>
                    <td className="px-4 py-3"><StatusBadge status={inv.status} /></td>
                    <td className="px-4 py-3">
                      <Btn variant="secondary" size="sm" onClick={() => handleView(inv)}>View</Btn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

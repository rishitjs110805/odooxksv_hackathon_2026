import { useEffect, useState } from 'react';
import { Receipt, ChevronDown, ChevronUp, Printer, Mail } from 'lucide-react';
import { api } from '../services/api';
import { PageLoader, SectionHeader, StatusBadge, Btn, Modal, Input, Empty, fmt, fmtDate } from '../components/ui';

export default function Invoices({ user, addToast }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [expandedDetail, setExpandedDetail] = useState(null);
  const [printModal, setPrintModal] = useState(null);
  const [emailModal, setEmailModal] = useState(null);
  const [emailRecipient, setEmailRecipient] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  const canManage = ['admin', 'procurement_officer'].includes(user?.role);

  const load = () => {
    setLoading(true);
    api.getInvoices()
      .then(setInvoices)
      .catch(e => addToast('Error', e.message, 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const toggleExpand = async (inv) => {
    if (expanded === inv.id) { setExpanded(null); setExpandedDetail(null); return; }
    try {
      const detail = await api.getInvoice(inv.id);
      setExpandedDetail(detail);
      setExpanded(inv.id);
    } catch (e) {
      addToast('Error', e.message, 'error');
    }
  };

  const handleStatusChange = async (inv, status) => {
    try {
      await api.updateInvoiceStatus(inv.id, status);
      addToast('Updated', `Invoice ${status}`, 'success');
      load();
    } catch (e) {
      addToast('Error', e.message, 'error');
    }
  };

  const openPrint = async (inv) => {
    try {
      const detail = await api.getInvoice(inv.id);
      setPrintModal(detail);
    } catch (e) {
      addToast('Error', e.message, 'error');
    }
  };

  const handlePrint = () => {
    window.print();
    addToast('Print', 'Print dialog opened', 'info');
  };

  const openEmailModal = async (inv) => {
    try {
      const detail = await api.getInvoice(inv.id);
      setEmailRecipient(detail.vendor_email || '');
      setEmailModal(detail);
    } catch (e) {
      addToast('Error', e.message, 'error');
    }
  };

  const handleSendEmail = async () => {
    if (!emailRecipient) { addToast('Validation', 'Enter recipient email', 'error'); return; }
    setSendingEmail(true);
    try {
      const result = await api.sendInvoiceEmail(emailModal.id, emailRecipient);
      addToast(
        'Email Sent',
        result.simulated
          ? `Invoice ${result.invoice_number} marked as sent (configure SMTP in server/.env to enable actual email delivery)`
          : `Invoice ${result.invoice_number} sent to ${result.recipient}`,
        'success'
      );
      setEmailModal(null);
      load();
    } catch (e) {
      addToast('Error', e.message, 'error');
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div className="space-y-5">
      <SectionHeader title="Invoices" subtitle="Invoice management and tracking" />

      {loading ? <PageLoader /> : invoices.length === 0 ? (
        <Empty icon={Receipt} message="No invoices yet. Generate one from a Purchase Order." />
      ) : (
        <div className="space-y-2">
          {invoices.map(inv => (
            <div key={inv.id} className="bg-slate-800 border border-slate-700/50 rounded-xl overflow-hidden">
              <div
                className="px-5 py-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-700/20 transition-colors"
                onClick={() => toggleExpand(inv)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                    <Receipt size={15} className="text-purple-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">{inv.invoice_number}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{inv.vendor_name} · PO: {inv.po_number} · {fmtDate(inv.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-semibold text-white">{fmt(inv.total)}</span>
                  <StatusBadge status={inv.status} />
                  {expanded === inv.id ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                </div>
              </div>

              {expanded === inv.id && expandedDetail && (
                <div className="border-t border-slate-700/50 px-5 py-4 space-y-4">
                  {/* Invoice detail */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-slate-500">Vendor</p>
                      <p className="text-slate-200">{expandedDetail.vendor_name}</p>
                      {expandedDetail.vendor_email && <p className="text-xs text-slate-500">{expandedDetail.vendor_email}</p>}
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">RFQ</p>
                      <p className="text-slate-200 truncate">{expandedDetail.rfq_title || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">PO Number</p>
                      <p className="text-slate-200">{expandedDetail.po_number}</p>
                    </div>
                  </div>

                  {/* Amount breakdown */}
                  <div className="bg-slate-900 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Subtotal</span>
                      <span className="text-slate-200">{fmt(expandedDetail.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">GST ({expandedDetail.tax_rate}%)</span>
                      <span className="text-slate-200">{fmt(expandedDetail.tax_amount)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold pt-2 border-t border-slate-700">
                      <span className="text-white">Total</span>
                      <span className="text-white text-base">{fmt(expandedDetail.total)}</span>
                    </div>
                  </div>

                  {canManage && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <Btn variant="secondary" size="sm" onClick={() => openPrint(inv)}>
                        <Printer size={13} /> View / Print
                      </Btn>
                      {(inv.status === 'generated' || inv.status === 'sent') && (
                        <Btn variant="primary" size="sm" onClick={() => openEmailModal(inv)}>
                          <Mail size={13} /> Send Email
                        </Btn>
                      )}
                      {inv.status === 'sent' && (
                        <Btn variant="success" size="sm" onClick={() => handleStatusChange(inv, 'paid')}>
                          Mark as Paid
                        </Btn>
                      )}
                      {inv.status !== 'cancelled' && inv.status !== 'paid' && (
                        <Btn variant="danger" size="sm" onClick={() => handleStatusChange(inv, 'cancelled')}>
                          Cancel
                        </Btn>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Send Email Modal */}
      {emailModal && (
        <Modal
          title={`Send Invoice — ${emailModal.invoice_number}`}
          onClose={() => setEmailModal(null)}
          footer={<>
            <Btn variant="secondary" onClick={() => setEmailModal(null)}>Cancel</Btn>
            <Btn variant="primary" onClick={handleSendEmail} disabled={sendingEmail}>
              {sendingEmail ? 'Sending…' : <><Mail size={14} /> Send Invoice</>}
            </Btn>
          </>}
        >
          <div className="space-y-4">
            <div className="bg-slate-900 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Invoice</span>
                <span className="text-white font-medium">{emailModal.invoice_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Vendor</span>
                <span className="text-white">{emailModal.vendor_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total</span>
                <span className="text-emerald-400 font-semibold">{fmt(emailModal.total)}</span>
              </div>
            </div>
            <Input
              label="Recipient Email *"
              type="email"
              value={emailRecipient}
              onChange={e => setEmailRecipient(e.target.value)}
              placeholder="vendor@company.com"
            />
            {!process.env.SMTP_HOST && (
              <p className="text-xs text-amber-500/80 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                SMTP not configured — invoice will be marked as sent. Add SMTP_HOST, SMTP_USER, SMTP_PASSWORD to server/.env for actual email delivery.
              </p>
            )}
          </div>
        </Modal>
      )}

      {/* Print Modal */}
      {printModal && (
        <Modal
          title={`Invoice — ${printModal.invoice_number}`}
          onClose={() => setPrintModal(null)}
          footer={<>
            <Btn variant="secondary" onClick={() => setPrintModal(null)}>Close</Btn>
            <Btn variant="primary" onClick={handlePrint}><Printer size={14} /> Print</Btn>
          </>}
        >
          <div className="space-y-5 text-sm" id="invoice-print">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">V</div>
                  <span className="font-bold text-white text-base">VendorBridge</span>
                </div>
                <p className="text-xs text-slate-500">Procurement ERP Platform</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-white">{printModal.invoice_number}</p>
                <StatusBadge status={printModal.status} />
                <p className="text-xs text-slate-500 mt-1">{fmtDate(printModal.created_at)}</p>
              </div>
            </div>

            <div className="h-px bg-slate-700" />

            {/* Parties */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase mb-1">Vendor</p>
                <p className="text-slate-200 font-medium">{printModal.vendor_name}</p>
                {printModal.vendor_email && <p className="text-xs text-slate-400">{printModal.vendor_email}</p>}
                {printModal.gst_number && <p className="text-xs text-slate-500 font-mono mt-0.5">GST: {printModal.gst_number}</p>}
                {printModal.address && <p className="text-xs text-slate-500 mt-0.5">{[printModal.address, printModal.city, printModal.state].filter(Boolean).join(', ')}</p>}
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase mb-1">Reference</p>
                <p className="text-xs text-slate-400">PO: <span className="text-slate-200">{printModal.po_number}</span></p>
                {printModal.rfq_title && <p className="text-xs text-slate-400">RFQ: <span className="text-slate-200 truncate">{printModal.rfq_title}</span></p>}
                {printModal.delivery_date && <p className="text-xs text-slate-400">Delivery: <span className="text-slate-200">{fmtDate(printModal.delivery_date)}</span></p>}
              </div>
            </div>

            {/* Amount */}
            <div className="bg-slate-900 rounded-lg p-4 space-y-2">
              <div className="flex justify-between"><span className="text-slate-400">Subtotal</span><span className="text-slate-200">{fmt(printModal.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">GST ({printModal.tax_rate}%)</span><span className="text-slate-200">{fmt(printModal.tax_amount)}</span></div>
              <div className="flex justify-between font-bold pt-2 border-t border-slate-700">
                <span className="text-white">Total Payable</span>
                <span className="text-white text-base">{fmt(printModal.total)}</span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

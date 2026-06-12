import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  QrCode, Printer, RefreshCw, UserMinus, Plus, X, Users, Search
} from 'lucide-react';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import * as API from '../../../services/api';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

// Normalise the list response — the backend may return a bare array or a
// wrapped object depending on the endpoint version.
const toEnrolmentArray = (response) => {
  if (Array.isArray(response)) return response;
  return response?.enrolments || response?.projectBeneficiaries || response?.beneficiaries || response?.rows || [];
};

const maskToken = (token) => (token ? `…${String(token).slice(-4)}` : '—');

const statusPillClass = (status) => {
  const s = (status || '').toLowerCase();
  if (s === 'active' || s === 'enrolled') return 'bg-green-100 text-green-700';
  if (s === 'withdrawn') return 'bg-red-100 text-red-700';
  return 'bg-ink-100 text-ink-700';
};

// ============================================
// A4 QR sheet layout (mm). 3 columns x 4 rows = 12 cut-friendly tiles/page.
// ============================================
const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 12;
const HEADER_H = 20;
const COLS = 3;
const ROWS = 4;
const TILE_W = (PAGE_W - MARGIN * 2) / COLS; // 62mm
const TILE_H = (PAGE_H - MARGIN * 2 - HEADER_H) / ROWS; // ~63mm
const QR_SIZE = 36;

const drawSheetHeader = (doc, projectName, pageNum, totalPages) => {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(20, 20, 20);
  doc.text(`Project ${projectName} — Beneficiary QR Tokens`, MARGIN, MARGIN + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(110, 110, 110);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, MARGIN, MARGIN + 10.5);
  doc.text(`Page ${pageNum} of ${totalPages}`, PAGE_W - MARGIN, MARGIN + 10.5, { align: 'right' });
};

const drawTile = (doc, x, y, qrDataUrl, fullName, beneficiaryId) => {
  // Cut-friendly border
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.2);
  doc.rect(x, y, TILE_W, TILE_H);

  // QR code, centred horizontally
  const qrX = x + (TILE_W - QR_SIZE) / 2;
  doc.addImage(qrDataUrl, 'PNG', qrX, y + 4, QR_SIZE, QR_SIZE);

  // Name (up to 2 lines, centred)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(20, 20, 20);
  const nameLines = doc.splitTextToSize(fullName || 'Unknown', TILE_W - 8).slice(0, 2);
  doc.text(nameLines, x + TILE_W / 2, y + QR_SIZE + 9, { align: 'center' });

  // Beneficiary ID
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(90, 90, 90);
  doc.text(String(beneficiaryId || ''), x + TILE_W / 2, y + QR_SIZE + 9 + nameLines.length * 4 + 1.5, { align: 'center' });
};

const BeneficiaryQrPanel = ({ projectId, projectName, showToast }) => {
  const [enrolments, setEnrolments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [printing, setPrinting] = useState(false);

  const fetchEnrolments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await API.ProjectBeneficiaryAPI.list(projectId);
      setEnrolments(toEnrolmentArray(response));
    } catch (error) {
      console.error('Error fetching project beneficiaries:', error);
      showToast('Failed to load enrolled beneficiaries', 'error');
    } finally {
      setLoading(false);
    }
  }, [projectId, showToast]);

  useEffect(() => {
    fetchEnrolments();
  }, [fetchEnrolments]);

  const activeEnrolments = useMemo(
    () => enrolments.filter(e => (e.status || '').toLowerCase() !== 'withdrawn'),
    [enrolments]
  );

  const handleRegenerate = async (enrolment) => {
    const name = enrolment.beneficiary?.fullName || 'this beneficiary';
    if (!window.confirm(`Regenerate the QR token for ${name}? The old QR code will stop working.`)) return;
    try {
      setBusyId(enrolment.id);
      await API.ProjectBeneficiaryAPI.regenerateToken(enrolment.id);
      showToast('QR token regenerated');
      await fetchEnrolments();
    } catch (error) {
      console.error('Error regenerating token:', error);
      showToast('Failed to regenerate QR token', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleWithdraw = async (enrolment) => {
    const name = enrolment.beneficiary?.fullName || 'this beneficiary';
    if (!window.confirm(`Withdraw ${name} from this project's distribution list?`)) return;
    try {
      setBusyId(enrolment.id);
      await API.ProjectBeneficiaryAPI.withdraw(enrolment.id);
      showToast('Beneficiary withdrawn');
      await fetchEnrolments();
    } catch (error) {
      console.error('Error withdrawing beneficiary:', error);
      showToast('Failed to withdraw beneficiary', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handlePrintQrSheet = async () => {
    const printable = activeEnrolments.filter(e => e.qrToken);
    if (printable.length === 0) {
      showToast('No active beneficiaries with QR tokens to print', 'error');
      return;
    }
    try {
      setPrinting(true);
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      const perPage = COLS * ROWS;
      const totalPages = Math.ceil(printable.length / perPage);

      for (let i = 0; i < printable.length; i++) {
        const pageIndex = Math.floor(i / perPage);
        const slot = i % perPage;
        if (slot === 0) {
          if (pageIndex > 0) doc.addPage();
          drawSheetHeader(doc, projectName, pageIndex + 1, totalPages);
        }
        const col = slot % COLS;
        const row = Math.floor(slot / COLS);
        const x = MARGIN + col * TILE_W;
        const y = MARGIN + HEADER_H + row * TILE_H;

        const enrolment = printable[i];
        const qrDataUrl = await QRCode.toDataURL(String(enrolment.qrToken), {
          errorCorrectionLevel: 'M',
          margin: 1,
          width: 300,
        });
        drawTile(
          doc, x, y, qrDataUrl,
          enrolment.beneficiary?.fullName,
          enrolment.beneficiary?.beneficiaryId
        );
      }

      const safeName = (projectName || 'project').replace(/[^\w-]+/g, '-');
      doc.save(`${safeName}-qr-tokens.pdf`);
      showToast(`QR sheet generated (${printable.length} tokens)`);
    } catch (error) {
      console.error('Error generating QR sheet:', error);
      showToast('Failed to generate QR sheet', 'error');
    } finally {
      setPrinting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg2 shadow-card border border-ink-100">
      <div className="p-6 border-b border-ink-100 flex justify-between items-center flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-bold text-ink-900 flex items-center gap-2">
            <QrCode className="text-blue-600" size={22} />
            Beneficiaries &amp; QR Codes
          </h3>
          <p className="text-sm text-ink-600 mt-1">
            {activeEnrolments.length} beneficiar{activeEnrolments.length === 1 ? 'y' : 'ies'} enrolled for distribution
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrintQrSheet}
            disabled={printing || activeEnrolments.length === 0}
            className="px-4 py-2 bg-white border border-ink-200 text-ink-700 rounded-lg hover:bg-ink-50 transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Printer size={18} />
            <span className="font-semibold">{printing ? 'Generating…' : 'Print QR Sheet'}</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-navy-900 text-white rounded-lg transition-all shadow-md flex items-center gap-2"
          >
            <Plus size={18} />
            <span className="font-semibold">Add Beneficiaries</span>
          </button>
        </div>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : enrolments.length === 0 ? (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-ink-400 mb-4" />
            <p className="text-ink-600 mb-4">No beneficiaries enrolled yet</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Enrol your first beneficiaries
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-ink-50">
                  <th className="text-left py-3 px-4 text-sm font-bold text-ink-700">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-bold text-ink-700">Beneficiary ID</th>
                  <th className="text-left py-3 px-4 text-sm font-bold text-ink-700">QR Token</th>
                  <th className="text-center py-3 px-4 text-sm font-bold text-ink-700">Status</th>
                  <th className="text-right py-3 px-4 text-sm font-bold text-ink-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {enrolments.map((enrolment) => {
                  const withdrawn = (enrolment.status || '').toLowerCase() === 'withdrawn';
                  return (
                    <tr key={enrolment.id} className="border-b border-ink-100 hover:bg-blue-50 transition-colors">
                      <td className="py-3 px-4 text-sm font-semibold text-ink-900">
                        {enrolment.beneficiary?.fullName || '—'}
                      </td>
                      <td className="py-3 px-4 text-sm text-ink-600">
                        {enrolment.beneficiary?.beneficiaryId || '—'}
                      </td>
                      <td className="py-3 px-4 text-sm font-mono text-ink-600">
                        {maskToken(enrolment.qrToken)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusPillClass(enrolment.status)}`}>
                          {enrolment.status || 'Unknown'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleRegenerate(enrolment)}
                            disabled={busyId === enrolment.id || withdrawn}
                            className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Issue a new QR token (old one stops working)"
                          >
                            <RefreshCw size={14} />
                            Regenerate QR
                          </button>
                          <button
                            onClick={() => handleWithdraw(enrolment)}
                            disabled={busyId === enrolment.id || withdrawn}
                            className="flex items-center gap-1 px-3 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <UserMinus size={14} />
                            Withdraw
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddModal && (
        <AddBeneficiariesModal
          enrolledBeneficiaryIds={activeEnrolments.map(e => e.beneficiary?.id).filter(Boolean)}
          onClose={() => setShowAddModal(false)}
          onConfirm={async (beneficiaryIds) => {
            try {
              await API.ProjectBeneficiaryAPI.enrol(projectId, beneficiaryIds);
              setShowAddModal(false);
              showToast(`${beneficiaryIds.length} beneficiar${beneficiaryIds.length === 1 ? 'y' : 'ies'} enrolled`);
              await fetchEnrolments();
            } catch (error) {
              console.error('Error enrolling beneficiaries:', error);
              showToast('Failed to enrol beneficiaries', 'error');
            }
          }}
        />
      )}
    </div>
  );
};

// Multi-select picker over the org-wide beneficiary register.
const AddBeneficiariesModal = ({ enrolledBeneficiaryIds, onClose, onConfirm }) => {
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await API.BeneficiaryAPI.getAll({ limit: 500 });
        if (!cancelled) setBeneficiaries(response.beneficiaries || []);
      } catch (error) {
        console.error('Error fetching beneficiaries:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const candidates = useMemo(() => {
    const enrolled = new Set(enrolledBeneficiaryIds);
    const term = search.trim().toLowerCase();
    return beneficiaries
      .filter(b => !enrolled.has(b.id))
      .filter(b =>
        !term ||
        (b.fullName || '').toLowerCase().includes(term) ||
        (b.beneficiaryId || '').toLowerCase().includes(term)
      );
  }, [beneficiaries, enrolledBeneficiaryIds, search]);

  const toggle = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleConfirm = async () => {
    if (selectedIds.length === 0) return;
    setSubmitting(true);
    try {
      await onConfirm(selectedIds);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-ink-100 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-ink-900">Add Beneficiaries</h3>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-600">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 pb-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or beneficiary ID…"
              className="w-full pl-9 pr-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="px-6 flex-1 overflow-y-auto min-h-[200px]">
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : candidates.length === 0 ? (
            <div className="text-center py-8">
              <Users size={40} className="mx-auto text-ink-400 mb-3" />
              <p className="text-ink-600 text-sm">
                {search ? 'No matching beneficiaries' : 'All beneficiaries are already enrolled'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-ink-100 border border-ink-100 rounded-lg">
              {candidates.map(b => (
                <label
                  key={b.id}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(b.id)}
                    onChange={() => toggle(b.id)}
                    className="h-4 w-4 rounded border-ink-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink-900 truncate">{b.fullName}</p>
                    <p className="text-xs text-ink-500">{b.beneficiaryId}{b.district ? ` · ${b.district}` : ''}</p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 pt-4 border-t border-ink-100 flex justify-between items-center">
          <p className="text-sm text-ink-600">{selectedIds.length} selected</p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-ink-700 hover:bg-ink-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={submitting || selectedIds.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Enrolling…' : `Enrol ${selectedIds.length || ''}`.trim()}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BeneficiaryQrPanel;

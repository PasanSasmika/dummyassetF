// Assignments/ReturnModal.jsx
// SINGLE  →  onSubmit({ condition_in, actual_return_date, document_type, file })
// BULK    →  onSubmit({ conditionMap: { [id]: condition }, returnDate, file, document_type })

import { useState, useRef } from 'react';
import {
  FiX, FiPackage, FiCalendar, FiAlertCircle,
  FiUpload, FiFile, FiTrash2, FiCheckCircle, FiDownload,
} from 'react-icons/fi';
import { TbArrowBackUp, TbFileTypePdf, TbChecks, TbUser, TbCalendar } from 'react-icons/tb';
import { HiOutlineCube } from 'react-icons/hi';
import jsPDF    from 'jspdf';
import autoTable from 'jspdf-autotable';

const CONDITIONS = ['New', 'Good', 'Fair', 'Poor', 'Damaged'];
const COND_LEVEL     = { New: 5, Good: 4, Fair: 3, Poor: 2, Damaged: 1 };
const MAX_MB         = 20;

const CONDITION_COLORS = {
  New:     'bg-emerald-100 text-emerald-700',
  Good:    'bg-blue-100 text-blue-700',
  Fair:    'bg-amber-100 text-amber-700',
  Poor:    'bg-orange-100 text-orange-700',
  Damaged: 'bg-red-100 text-red-700',
};

const inputBase = `w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm
  text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500
  focus:border-transparent transition-all`;

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
const fmtSize = (b) =>
  b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / (1024 * 1024)).toFixed(2)} MB`;

// ─────────────────────────────────────────────────────────
// PDF generators
// ─────────────────────────────────────────────────────────
const GREEN = [5, 150, 105];
const BLUE  = [37, 99, 235];
const DARK  = [15, 23, 42];
const GRAY  = [100, 116, 139];
const LIGHT = [248, 250, 252];
const AMBER = [255, 251, 235];

function makePDFHeader(doc, { color, title, docId, dateStr, subtitle, W, M }) {
  doc.setFillColor(...color);
  doc.rect(0, 0, W, 34, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15); doc.setFont('helvetica', 'bold');
  doc.text(title, M, 14);
  doc.setFontSize(8); doc.setFont('helvetica', 'normal');
  doc.text(`Document No: ${docId}`, M, 22);
  doc.text(subtitle, W - M, 22, { align: 'right' });
  doc.text(`Printed: ${dateStr}`, W - M, 28, { align: 'right' });
}

function makePDFParties(doc, { left, right, y, half, W, M }) {
  const boxH = 30;
  doc.setTextColor(...GRAY); doc.setFontSize(7.5); doc.setFont('helvetica', 'bold');
  doc.text(left.label, M, y);
  doc.text(right.label, W / 2 + 8, y);
  y += 2;
  doc.setFillColor(...LIGHT); doc.setDrawColor(226, 232, 240);
  doc.roundedRect(M, y, half, boxH, 2, 2, 'FD');
  doc.roundedRect(W / 2 + 8, y, half, boxH, 2, 2, 'FD');

  // Left box
  doc.setTextColor(...DARK); doc.setFontSize(10.5); doc.setFont('helvetica', 'bold');
  doc.text(left.name || '—', M + 4, y + 9);
  doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(...GRAY);
  left.lines?.forEach((line, i) => doc.text(line, M + 4, y + 17 + i * 6, { maxWidth: half - 8 }));

  // Right box
  doc.setTextColor(...DARK); doc.setFontSize(10); doc.setFont('helvetica', 'bold');
  doc.text(right.name || '—', W / 2 + 12, y + 9);
  doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(...GRAY);
  right.lines?.forEach((line, i) => doc.text(line, W / 2 + 12, y + 17 + i * 6));

  return y + boxH + 10;
}

function makePDFSignatures(doc, { left, right, y, W, M, H }) {
  if (y > H - 48) { doc.addPage(); y = 20; }
  const sigW = W / 2 - M - 12;
  doc.setDrawColor(203, 213, 225); doc.setLineWidth(0.3);
  [[M, left], [W / 2 + 8, right]].forEach(([x, party]) => {
    doc.line(x, y + 12, x + sigW, y + 12);
    doc.setTextColor(...GRAY); doc.setFontSize(8.5); doc.setFont('helvetica', 'bold');
    doc.text(party.label, x, y + 18);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${party.name || ''}`, x, y + 24);
    doc.text('Date: _________________________', x, y + 30);
  });
}

// Single asset PDF
function generateSinglePDF(assignment, processedByName = 'Admin') {
  const doc = new jsPDF('p', 'mm', 'a4');
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 18;
  const docId   = `ARC-${Date.now().toString(36).toUpperCase().slice(-8)}`;
  const dateStr = fmtDate(new Date().toISOString());
  const half    = W / 2 - M - 6;

  makePDFHeader(doc, {
    color: GREEN, title: 'ASSET RETURN CERTIFICATE',
    docId, dateStr, subtitle: `Assignment #${assignment.id}`, W, M,
  });

  let y = makePDFParties(doc, {
    left: {
      label: 'RETURNED BY',
      name:  assignment.assigned_to_name || '—',
      lines: [
        assignment.assigned_to_email || '',
        `Condition (Out): ${assignment.condition_out || 'Not recorded'}`,
      ].filter(Boolean),
    },
    right: {
      label: 'RECEIVED BY',
      name:  processedByName,
      lines: [`Date: ${dateStr}`],
    },
    y: 44, half, W, M,
  });

  doc.setTextColor(...GRAY); doc.setFontSize(7.5); doc.setFont('helvetica', 'bold');
  doc.text('ASSET DETAILS', M, y); y += 2;

  autoTable(doc, {
    startY: y, margin: { left: M, right: M },
    head: [['Field', 'Details']],
    body: [
      ['Asset Name',         assignment.asset_name || '—'],
      ['Asset No.',          assignment.asset_no   || '—'],
      ['Category',           assignment.category   || '—'],
      ['Assignment Date',    fmtDate(assignment.assignment_date)],
      ['Expected Return',    fmtDate(assignment.expected_return_date)],
      ['Condition (Out)',    assignment.condition_out || 'Not recorded'],
      ['Condition (In)',     '_________________________ (fill on return)'],
      ['Actual Return Date', '_________________________ (fill on return)'],
    ],
    styles: { fontSize: 9, cellPadding: 3.5 },
    headStyles: { fillColor: GREEN, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: LIGHT },
    columnStyles: { 0: { cellWidth: 50, fontStyle: 'bold', textColor: DARK }, 1: { cellWidth: 'auto' } },
  });

  y = doc.lastAutoTable.finalY + 8;
  if (y > H - 80) { doc.addPage(); y = 20; }

  // CIA note
  doc.setFillColor(236, 253, 245); doc.setDrawColor(167, 243, 208);
  doc.roundedRect(M, y, W - M * 2, 14, 2, 2, 'FD');
  doc.setTextColor(6, 95, 70); doc.setFontSize(8); doc.setFont('helvetica', 'bold');
  doc.text('ℹ  CIA Levels Unchanged — Asset security classification is preserved as-is upon return.', M + 4, y + 9);
  y += 22;

  // Acknowledgment
  if (y > H - 70) { doc.addPage(); y = 20; }
  doc.setFillColor(...AMBER); doc.setDrawColor(217, 119, 6);
  doc.roundedRect(M, y, W - M * 2, 30, 2, 2, 'FD');
  doc.setTextColor(120, 53, 15); doc.setFontSize(7.5); doc.setFont('helvetica', 'bold');
  doc.text('ACKNOWLEDGMENT', M + 4, y + 7); doc.setFont('helvetica', 'normal');
  ['1. The above asset has been returned in the condition stated.',
   '2. The asset manager confirms receipt and inspection of the returned item.',
   '3. Any outstanding damage will be noted separately.',
   '4. This document requires physical signatures from both parties.',
  ].forEach((t, i) => doc.text(t, M + 4, y + 13 + i * 4.5, { maxWidth: W - M * 2 - 8 }));
  y += 38;

  makePDFSignatures(doc, {
    left:  { label: 'Returnee Signature', name: assignment.assigned_to_name || '' },
    right: { label: 'Received By',        name: processedByName },
    y, W, M, H,
  });

  const fY = H - 10;
  doc.setDrawColor(...GREEN); doc.setLineWidth(0.4); doc.line(M, fY - 5, W - M, fY - 5);
  doc.setTextColor(...GRAY); doc.setFontSize(7);
  doc.text(`Doc: ${docId}  ·  ${dateStr}  ·  Assignment #${assignment.id}`, M, fY);
  doc.text('CONFIDENTIAL — For official use only', W - M, fY, { align: 'right' });

  doc.save(`Return-Certificate-${docId}.pdf`);
  return docId;
}

// Bulk assets PDF
function generateBulkPDF({ assignments, processedByName = 'Admin', returnDate, conditionMap }) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 18;
  const docId   = `ARC-${Date.now().toString(36).toUpperCase().slice(-8)}`;
  const dateStr = fmtDate(new Date().toISOString());
  const half    = W / 2 - M - 6;

  // Group assignees for header display
  const uniqueAssignees = [...new Set(assignments.map(a => a.assigned_to_name).filter(Boolean))];
  const assigneeDisplay = uniqueAssignees.length === 1
    ? uniqueAssignees[0]
    : `${uniqueAssignees.slice(0, 2).join(', ')}${uniqueAssignees.length > 2 ? ` +${uniqueAssignees.length - 2} more` : ''}`;

  makePDFHeader(doc, {
    color: BLUE, title: 'BULK ASSET RETURN CERTIFICATE',
    docId, dateStr,
    subtitle: `${assignments.length} asset${assignments.length !== 1 ? 's' : ''} returned`,
    W, M,
  });

  let y = makePDFParties(doc, {
    left: {
      label: 'RETURNED BY',
      name:  assigneeDisplay || '—',
      lines: [
        `Assignment IDs: ${assignments.map(a => `#${a.id}`).join(', ')}`,
      ],
    },
    right: {
      label: 'PROCESSED BY',
      name:  processedByName,
      lines: [`Date: ${dateStr}`, `Return Date: ${fmtDate(returnDate)}`],
    },
    y: 44, half, W, M,
  });

  doc.setTextColor(...GRAY); doc.setFontSize(7.5); doc.setFont('helvetica', 'bold');
  doc.text('RETURNED ASSETS', M, y); y += 2;

  autoTable(doc, {
    startY: y, margin: { left: M, right: M },
    head: [['#', 'Asset No.', 'Asset Name', 'Assigned To', 'Category', 'Cond. Out', 'Cond. In', 'Return Date']],
    body: assignments.map((a, i) => [
      i + 1,
      a.asset_no   || `#${a.asset_id}`,
      a.asset_name || '—',
      a.assigned_to_name || '—',
      a.category   || '—',
      a.condition_out         || '—',
      conditionMap[a.id]      || '—',   // ← per-asset condition from form
      fmtDate(returnDate),
    ]),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: BLUE, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
    alternateRowStyles: { fillColor: LIGHT },
    columnStyles: {
      0: { cellWidth: 7,  halign: 'center' },
      1: { cellWidth: 22 },
      2: { cellWidth: 38 },
      3: { cellWidth: 30 },
      4: { cellWidth: 24 },
      5: { cellWidth: 18 },
      6: { cellWidth: 18 },
    },
  });

  y = doc.lastAutoTable.finalY + 8;
  if (y > H - 70) { doc.addPage(); y = 20; }

  // Verified banner
  doc.setFillColor(209, 250, 229); doc.setDrawColor(16, 185, 129);
  doc.roundedRect(M, y, W - M * 2, 20, 2, 2, 'FD');
  doc.setTextColor(4, 120, 87); doc.setFontSize(8); doc.setFont('helvetica', 'bold');
  doc.text('✓ All listed assets have been successfully returned and verified.', M + 4, y + 8);
  doc.setFont('helvetica', 'normal');
  doc.text('Asset statuses updated to Available. CIA levels remain unchanged.', M + 4, y + 15);
  y += 28;

  makePDFSignatures(doc, {
    left:  { label: 'Returned By', name: assigneeDisplay || '' },
    right: { label: 'Received By', name: processedByName },
    y, W, M, H,
  });

  const fY = H - 10;
  doc.setDrawColor(...BLUE); doc.setLineWidth(0.4); doc.line(M, fY - 5, W - M, fY - 5);
  doc.setTextColor(...GRAY); doc.setFontSize(7);
  doc.text(`Doc: ${docId}  ·  ${dateStr}  ·  ${assignments.length} asset(s) returned`, M, fY);
  doc.text('CONFIDENTIAL — For official use only', W - M, fY, { align: 'right' });

  doc.save(`Bulk-Return-${docId}.pdf`);
  return docId;
}

// ─────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────
export default function ReturnModal({
  assignment,           // single mode — one object
  assignments,          // bulk mode  — array 2+
  onClose,
  onSubmit,
  loading,
  processedByName = 'Admin',
}) {
  const isBulk = Array.isArray(assignments) && assignments.length >= 2;
  const items  = isBulk ? assignments : (assignment ? [assignment] : []);

  // ── Single state ──────────────────────────────────────────
  const [form, setForm] = useState({
    condition_in:       '',
    actual_return_date: new Date().toISOString().split('T')[0],
  });
  const [file,          setFile]          = useState(null);
  const [fileError,     setFileError]     = useState('');
  const [pdfDownloaded, setPdfDownloaded] = useState(false);
  const inputRef = useRef(null);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const conditionDegraded =
    !isBulk && form.condition_in && assignment?.condition_out &&
    (COND_LEVEL[form.condition_in] || 0) < (COND_LEVEL[assignment.condition_out] || 0);

  // ── Bulk state ────────────────────────────────────────────
  const [conditionMap,    setConditionMap]    = useState({});
  const [globalCondition, setGlobalCondition] = useState('');
  const [returnDate,      setReturnDate]      = useState(new Date().toISOString().split('T')[0]);
  const [bulkPdfDone,     setBulkPdfDone]     = useState(false);
  const [pdfError,        setPdfError]        = useState('');

  // Bulk upload state (separate from single upload)
  const [bulkFile,        setBulkFile]        = useState(null);
  const [bulkFileError,   setBulkFileError]   = useState('');
  const bulkInputRef = useRef(null);

  const pickBulkFile = (f) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowed.includes(f.type)) { setBulkFileError('Only PDF, JPG or PNG allowed.'); setBulkFile(null); return; }
    if (f.size > MAX_MB * 1024 * 1024) { setBulkFileError(`Max ${MAX_MB} MB.`); setBulkFile(null); return; }
    setBulkFileError(''); setBulkFile(f);
  };
  const clearBulkFile = () => {
    setBulkFile(null); setBulkFileError('');
    if (bulkInputRef.current) bulkInputRef.current.value = '';
  };

  const setAssetCondition = (id, val) => {
    setConditionMap(p => ({ ...p, [id]: val }));
    setGlobalCondition('');
  };
  const applyGlobal = (c) => {
    setGlobalCondition(c);
    const map = {};
    items.forEach(a => { map[a.id] = c; });
    setConditionMap(map);
  };
  const allConditionsSet = isBulk && items.every(a => conditionMap[a.id]);

  // ── File helpers ──────────────────────────────────────────
  const pickFile = (f) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowed.includes(f.type)) { setFileError('Only PDF, JPG or PNG allowed.'); setFile(null); return; }
    if (f.size > MAX_MB * 1024 * 1024) { setFileError(`Max ${MAX_MB} MB.`); setFile(null); return; }
    setFileError(''); setFile(f);
  };
  const clearFile = () => {
    setFile(null); setFileError('');
    if (inputRef.current) inputRef.current.value = '';
  };

  // ── PDF download handlers ─────────────────────────────────
  const handleDownloadSingle = () => {
    try {
      generateSinglePDF(assignment, processedByName);
      setPdfDownloaded(true);
    } catch (e) {
      console.error('PDF error:', e);
    }
  };

  const handleDownloadBulk = () => {
    setPdfError('');
    try {
      if (!allConditionsSet) {
        setPdfError('Set a condition for every asset first.');
        return;
      }
      generateBulkPDF({
        assignments: items,
        processedByName,
        returnDate,
        conditionMap: { ...conditionMap },   // pass snapshot
      });
      setBulkPdfDone(true);
    } catch (e) {
      console.error('Bulk PDF error:', e);
      setPdfError('Failed to generate PDF. Check console for details.');
    }
  };

  // ─────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl flex flex-col"
        style={{ width: '100%', maxWidth: isBulk ? 700 : 520, maxHeight: '92vh' }}>

        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100 shrink-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center
            ${isBulk ? 'bg-blue-100' : 'bg-emerald-100'}`}>
            {isBulk
              ? <TbChecks size={20} className="text-blue-600" />
              : <TbArrowBackUp size={20} className="text-emerald-600" />}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-slate-900">
              {isBulk ? `Bulk Return — ${items.length} Assets` : 'Process Return'}
            </h3>
            <p className="text-xs text-slate-400 truncate mt-0.5">
              {isBulk
                ? `${items.map(a => a.asset_name).join(' · ')}`
                : `${assignment?.asset_name} · ${assignment?.assigned_to_name}`}
            </p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition">
            <FiX size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* ══ SINGLE ══ */}
          {!isBulk && (<>

            {/* Asset + assignment details card */}
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0">
                  <HiOutlineCube size={18} className="text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800">{assignment?.asset_name || '—'}</p>
                  <p className="text-xs font-mono text-slate-400 mb-2">{assignment?.asset_no || ''}</p>

                  <div className="flex flex-wrap gap-3">
                    {assignment?.assigned_to_name && (
                      <div className="flex items-center gap-1.5">
                        <TbUser size={12} className="text-indigo-400 shrink-0" />
                        <span className="text-xs text-slate-600 font-semibold">{assignment.assigned_to_name}</span>
                      </div>
                    )}
                    {assignment?.assignment_date && (
                      <div className="flex items-center gap-1.5">
                        <TbCalendar size={12} className="text-blue-400 shrink-0" />
                        <span className="text-xs text-slate-500">Assigned {fmtDate(assignment.assignment_date)}</span>
                      </div>
                    )}
                    {assignment?.condition_out && (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold
                        ${CONDITION_COLORS[assignment.condition_out] || 'bg-slate-100 text-slate-500'}`}>
                        Out: {assignment.condition_out}
                      </span>
                    )}
                    {assignment?.expected_return_date && (
                      <span className="text-xs text-slate-400">
                        Due: {fmtDate(assignment.expected_return_date)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Step 1: Download PDF */}
            <div className="rounded-xl border-2 border-dashed border-slate-200 p-4">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Step 1 — Download &amp; Sign
              </p>
              <p className="text-xs text-slate-500 mb-3">
                Download the return certificate → print → get both signatures → scan it.
              </p>
              <button type="button" onClick={handleDownloadSingle}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                  text-sm font-semibold border-2 transition-all
                  ${pdfDownloaded
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    : 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'}`}>
                {pdfDownloaded
                  ? <><FiCheckCircle size={15} /> Downloaded — Download Again</>
                  : <><FiDownload size={15} /> Download Return Certificate PDF</>}
              </button>
            </div>

            {/* Step 2 */}
            <div className="space-y-4">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Step 2 — Fill Return Details
              </p>
              <div>
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  <FiCalendar size={11} /> Actual Return Date
                </label>
                <input type="date" value={form.actual_return_date}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={e => set('actual_return_date', e.target.value)}
                  className={inputBase} />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  <FiPackage size={11} /> Condition at Return
                </label>
                <div className="flex gap-2 flex-wrap">
                  {CONDITIONS.map(c => (
                    <button key={c} type="button" onClick={() => set('condition_in', c)}
                      className={`px-3 py-1.5 rounded-lg border-2 text-xs font-bold transition-all
                        ${form.condition_in === c
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              {conditionDegraded && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                  <FiAlertCircle size={13} className="text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-700">
                    Condition degraded: <strong>{assignment.condition_out}</strong> → <strong>{form.condition_in}</strong>. Will be flagged in history.
                  </p>
                </div>
              )}
            </div>

            {/* Step 3: Upload */}
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Step 3 — Upload Signed Document
                  <span className="ml-1.5 text-[10px] font-normal text-slate-400 normal-case tracking-normal">— optional</span>
                </p>
              </div>
              <div className="p-4 space-y-3">
                {!file ? (
                  <div onClick={() => inputRef.current?.click()}
                    onDrop={e => { e.preventDefault(); if (e.dataTransfer.files?.[0]) pickFile(e.dataTransfer.files[0]); }}
                    onDragOver={e => e.preventDefault()}
                    className="border-2 border-dashed border-slate-200 hover:border-blue-300
                      hover:bg-blue-50/30 rounded-xl p-5 text-center cursor-pointer transition-all">
                    <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                      onChange={e => { if (e.target.files?.[0]) pickFile(e.target.files[0]); }} />
                    <FiUpload size={20} className="mx-auto mb-1.5 text-slate-300" />
                    <p className="text-sm font-semibold text-slate-500">
                      Drop or <span className="text-blue-500 underline underline-offset-2">browse</span>
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">PDF, JPG, PNG · max {MAX_MB} MB</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0
                      ${file.type === 'application/pdf' ? 'bg-red-100' : 'bg-blue-100'}`}>
                      {file.type === 'application/pdf'
                        ? <TbFileTypePdf size={20} className="text-red-500" />
                        : <FiFile size={18} className="text-blue-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{file.name}</p>
                      <p className="text-[10px] text-slate-400">{fmtSize(file.size)}</p>
                    </div>
                    <button onClick={clearFile}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 transition shrink-0">
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                )}
                {fileError && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <FiAlertCircle size={11} /> {fileError}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
              <FiCheckCircle size={13} className="text-emerald-600 shrink-0" />
              <p className="text-xs text-emerald-700">
                Asset status will change to <strong>Available</strong> immediately on confirm.
              </p>
            </div>

          </>)}

          {/* ══ BULK ══ */}
          {isBulk && (<>

            {/* Return date */}
            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                <FiCalendar size={11} /> Return Date (applies to all)
              </label>
              <input type="date" value={returnDate}
                max={new Date().toISOString().split('T')[0]}
                onChange={e => setReturnDate(e.target.value)}
                className={inputBase} />
            </div>

            {/* Global condition */}
            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                <FiPackage size={11} /> Apply Same Condition to All
              </label>
              <div className="flex gap-2 flex-wrap">
                {CONDITIONS.map(c => (
                  <button key={c} type="button" onClick={() => applyGlobal(c)}
                    className={`px-3 py-1.5 rounded-lg border-2 text-xs font-bold transition-all
                      ${globalCondition === c
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                    {c}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5">Or set individually per asset below</p>
            </div>

            {/* Per-asset cards */}
            <div className="space-y-3">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                Assets to Return
              </p>
              {items.map(a => {
                const selected = conditionMap[a.id];
                const degraded = selected && a.condition_out &&
                  (COND_LEVEL[selected] || 0) < (COND_LEVEL[a.condition_out] || 0);

                return (
                  <div key={a.id}
                    className={`rounded-xl border p-4 transition-all
                      ${selected ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200 bg-white'}`}>

                    {/* Asset info row */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                        <HiOutlineCube size={16} className="text-slate-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">{a.asset_name}</p>
                        <p className="text-[10px] font-mono text-slate-400 mb-1.5">{a.asset_no || `#${a.asset_id}`}</p>

                        {/* Assignment details */}
                        <div className="flex flex-wrap gap-2">
                          {a.assigned_to_name && (
                            <div className="flex items-center gap-1">
                              <TbUser size={11} className="text-indigo-400 shrink-0" />
                              <span className="text-[11px] text-slate-600 font-semibold">{a.assigned_to_name}</span>
                            </div>
                          )}
                          {a.assignment_date && (
                            <div className="flex items-center gap-1">
                              <TbCalendar size={11} className="text-blue-400 shrink-0" />
                              <span className="text-[11px] text-slate-500">Assigned {fmtDate(a.assignment_date)}</span>
                            </div>
                          )}
                          {a.condition_out && (
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold
                              ${CONDITION_COLORS[a.condition_out] || 'bg-slate-100 text-slate-500'}`}>
                              Out: {a.condition_out}
                            </span>
                          )}
                        </div>
                      </div>
                      {selected && (
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg shrink-0
                          ${CONDITION_COLORS[selected] || 'bg-slate-100 text-slate-500'}`}>
                          In: {selected}
                        </span>
                      )}
                    </div>

                    {/* Condition picker */}
                    <div className="flex gap-1.5 flex-wrap">
                      {CONDITIONS.map(c => (
                        <button key={c} type="button" onClick={() => setAssetCondition(a.id, c)}
                          className={`px-2.5 py-1 rounded-lg border-2 text-[11px] font-bold transition-all
                            ${conditionMap[a.id] === c
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                              : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                          {c}
                        </button>
                      ))}
                    </div>

                    {degraded && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <FiAlertCircle size={11} className="text-amber-400 shrink-0" />
                        <p className="text-[10px] text-amber-600">
                          Degraded: <strong>{a.condition_out}</strong> → <strong>{selected}</strong>
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Download bulk PDF */}
            <div className="rounded-xl border-2 border-dashed border-slate-200 p-4">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Generate Return Certificate PDF
              </p>
              <p className="text-xs text-slate-500 mb-3">
                One PDF covering all {items.length} assets — print and get physical signatures.
                {!allConditionsSet && (
                  <span className="ml-1 text-amber-600 font-semibold">Set all conditions above first.</span>
                )}
              </p>
              <button type="button"
                disabled={!allConditionsSet}
                onClick={handleDownloadBulk}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                  text-sm font-semibold border-2 transition-all
                  ${!allConditionsSet
                    ? 'border-slate-200 bg-slate-50 text-slate-300 cursor-not-allowed'
                    : bulkPdfDone
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      : 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'}`}>
                {bulkPdfDone
                  ? <><FiCheckCircle size={15} /> Downloaded — Download Again</>
                  : <><FiDownload size={15} /> Download Bulk Return Certificate</>}
              </button>
              {pdfError && (
                <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
                  <FiAlertCircle size={11} /> {pdfError}
                </p>
              )}
            </div>

            {/* Upload signed bulk PDF */}
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Upload Signed Document
                  <span className="ml-1.5 text-[10px] font-normal text-slate-400 normal-case tracking-normal">— optional</span>
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Upload the scanned signed bulk return certificate.
                </p>
              </div>
              <div className="p-4 space-y-3">
                {!bulkFile ? (
                  <div onClick={() => bulkInputRef.current?.click()}
                    onDrop={e => { e.preventDefault(); if (e.dataTransfer.files?.[0]) pickBulkFile(e.dataTransfer.files[0]); }}
                    onDragOver={e => e.preventDefault()}
                    className="border-2 border-dashed border-slate-200 hover:border-blue-300
                      hover:bg-blue-50/30 rounded-xl p-5 text-center cursor-pointer transition-all">
                    <input ref={bulkInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                      onChange={e => { if (e.target.files?.[0]) pickBulkFile(e.target.files[0]); }} />
                    <FiUpload size={20} className="mx-auto mb-1.5 text-slate-300" />
                    <p className="text-sm font-semibold text-slate-500">
                      Drop or <span className="text-blue-500 underline underline-offset-2">browse</span>
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">PDF, JPG, PNG · max {MAX_MB} MB</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0
                      ${bulkFile.type === 'application/pdf' ? 'bg-red-100' : 'bg-blue-100'}`}>
                      {bulkFile.type === 'application/pdf'
                        ? <TbFileTypePdf size={20} className="text-red-500" />
                        : <FiFile size={18} className="text-blue-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{bulkFile.name}</p>
                      <p className="text-[10px] text-slate-400">{fmtSize(bulkFile.size)}</p>
                    </div>
                    <button onClick={clearBulkFile}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 transition shrink-0">
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                )}
                {bulkFileError && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <FiAlertCircle size={11} /> {bulkFileError}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
              <FiCheckCircle size={13} className="text-emerald-600 shrink-0" />
              <p className="text-xs text-emerald-700">
                All assets will be marked <strong>Available</strong>. CIA levels remain unchanged.
              </p>
            </div>

            {!allConditionsSet && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                <FiAlertCircle size={13} className="text-amber-500 shrink-0" />
                <p className="text-xs text-amber-700">Please set a return condition for every asset before confirming.</p>
              </div>
            )}

          </>)}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 shrink-0">
          <button onClick={onClose}
            className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">
            Cancel
          </button>
          <button
            onClick={isBulk
              ? () => onSubmit({ conditionMap: { ...conditionMap }, returnDate, file: bulkFile || null, document_type: 'Other' })
              : () => onSubmit({
                  condition_in:       form.condition_in || null,
                  actual_return_date: form.actual_return_date,
                  document_type:      'Other',
                  file:               file || null,
                })}
            disabled={loading || !!fileError || !!bulkFileError || (isBulk && !allConditionsSet)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl
              text-sm font-semibold text-white transition
              ${isBulk
                ? 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-200'
                : 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300'}
              disabled:cursor-not-allowed`}>
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Processing…
              </>
            ) : isBulk ? (
              <><TbChecks size={15} /> Return {items.length} Assets</>
            ) : (
              <><TbArrowBackUp size={15} /> Confirm Return</>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

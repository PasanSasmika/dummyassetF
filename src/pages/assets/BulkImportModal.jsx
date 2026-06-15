import { useState, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import {
  FiUploadCloud, FiDownload, FiCheckCircle, FiAlertCircle,
  FiX, FiArrowLeft, FiFileText, FiShield, FiTag, FiMapPin,
  FiDollarSign, FiInfo, FiAlertTriangle, FiPackage,
  FiList, FiCheck, FiSlash, FiRefreshCw, FiEye,
  FiMonitor, FiCalendar,
} from 'react-icons/fi';
import {
  HiOutlineDocumentDownload, HiOutlineTable, HiOutlineCloudUpload,
  HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineExclamation,
  HiOutlineDocumentText, HiOutlineBadgeCheck,
} from 'react-icons/hi';
import { MdOutlineFileUpload, MdOutlineFileDownload } from 'react-icons/md';
import { BsFiletypeXlsx, BsTable, BsLaptop } from 'react-icons/bs';
import { TbFileImport, TbCircleCheck, TbAlertHexagon, TbDeviceDesktop } from 'react-icons/tb';

// ── Constants ─────────────────────────────────────────────────────────────────
const CATEGORY        = 'End User';
const DEVICE_TYPES    = ['Laptop', 'Desktop', 'Printer', 'Mobile', 'Other'];
const STATUSES        = ['Available', 'In Use', 'In Maintenance', 'In Repair', 'Broken', 'Retired', 'Lost'];
const FINANCIAL_TYPES = ['None', 'CAPEX', 'OPEX'];

// Column definitions — order matches Excel template & preview table
const COLUMNS = [
  // ── Core asset fields ──────────────────────────────────────────────────────
  { key: 'name',             label: 'Name',              required: true,  group: 'asset',   icon: FiTag         },
  { key: 'asset_type',       label: 'Asset Type',         required: false, group: 'asset',   icon: FiPackage     },
  { key: 'asset_no',         label: 'Asset No',           required: false, group: 'asset',   icon: FiList        },
  { key: 'status',           label: 'Status',             required: false, group: 'asset',   icon: FiCheckCircle },
  { key: 'location',         label: 'Location',           required: false, group: 'asset',   icon: FiMapPin      },
  { key: 'asset_owner',      label: 'Asset Owner',        required: false, group: 'asset',   icon: FiShield      },
  { key: 'cost',             label: 'Cost',               required: false, group: 'asset',   icon: FiDollarSign  },
  { key: 'currency',         label: 'Currency',           required: false, group: 'asset',   icon: FiDollarSign  },
  { key: 'financial_type',   label: 'Financial Type',     required: false, group: 'asset',   icon: FiTag         },
  { key: 'po_number',        label: 'PO Number',          required: false, group: 'asset',   icon: FiFileText    },
  { key: 'description',      label: 'Description',        required: false, group: 'asset',   icon: FiFileText    },
  { key: 'remarks',          label: 'Remarks',            required: false, group: 'asset',   icon: FiFileText    },
  // ── End User specific fields ───────────────────────────────────────────────
  { key: 'device_type',      label: 'Device Type',        required: true,  group: 'enduser', icon: FiMonitor     },
  { key: 'manufacturer',     label: 'Manufacturer',       required: false, group: 'enduser', icon: FiPackage     },
  { key: 'model',            label: 'Model',              required: false, group: 'enduser', icon: FiTag         },
  { key: 'date_of_purchase', label: 'Date of Purchase',   required: false, group: 'enduser', icon: FiCalendar    },
];

// ── Row validator ─────────────────────────────────────────────────────────────
function validateRow(row) {
  const errors = [];

  if (!row.name || String(row.name).trim() === '')
    errors.push('Name is required');

  if (!row.device_type || String(row.device_type).trim() === '') {
    errors.push('Device Type is required');
  } else if (!DEVICE_TYPES.includes(String(row.device_type).trim())) {
    errors.push(`Invalid Device Type. Must be: ${DEVICE_TYPES.join(' | ')}`);
  }

  if (row.status && String(row.status).trim() !== '' && !STATUSES.includes(String(row.status).trim()))
    errors.push(`Invalid status. Must be: ${STATUSES.join(' | ')}`);

  if (row.financial_type && String(row.financial_type).trim() !== '' && !FINANCIAL_TYPES.includes(String(row.financial_type).trim()))
    errors.push(`Invalid Financial Type. Must be: ${FINANCIAL_TYPES.join(' | ')}`);

  if (row.cost && String(row.cost).trim() !== '' && isNaN(Number(row.cost)))
    errors.push('Cost must be a valid number');

  if (row.date_of_purchase && String(row.date_of_purchase).trim() !== '') {
    const d = new Date(row.date_of_purchase);
    if (isNaN(d.getTime()))
      errors.push('Date of Purchase must be a valid date (YYYY-MM-DD)');
  }

  return errors;
}

// ── Download Excel template ───────────────────────────────────────────────────
// Shows ALL columns with a fully filled sample row so users see exactly what to fill.
function downloadTemplate() {
  // Row 1 — headers (label names matching COLUMNS)
  const headers = COLUMNS.map(c => c.label);

  // Row 2 — fully filled sample row (one per column, in same order)
  const sample = [
    /* name             */ 'Dell Laptop XPS 15',
    /* asset_type       */ 'End User Device',
    /* asset_no         */ 'END-001',
    /* status           */ 'Available',
    /* location         */ 'IT Department, Floor 2',
    /* asset_owner      */ 'John Doe',
    /* cost             */ '150000',
    /* currency         */ 'USD',
    /* financial_type   */ 'CAPEX',
    /* po_number        */ 'PO-2024-001',
    /* description      */ 'Developer workstation for engineering team',
    /* remarks          */ 'Assigned to senior developer',
    /* device_type      */ 'Laptop',
    /* manufacturer     */ 'Dell',
    /* model            */ 'XPS 15 9500',
    /* date_of_purchase */ '2024-01-15',
  ];

  // Row 3 — hint / valid-values guide per column
  const hints = [
    /* name             */ 'Required. Device display name.',
    /* asset_type       */ 'e.g. End User Device, Laptop, Printer',
    /* asset_no         */ 'Leave blank to auto-generate (END-xxxxxx)',
    /* status           */ `One of: ${STATUSES.join(' | ')}`,
    /* location         */ 'Room / floor / building',
    /* asset_owner      */ 'Full name of the owner',
    /* cost             */ 'Numbers only, e.g. 150000',
    /* currency         */ 'USD, LKR, EUR …',
    /* financial_type   */ `One of: ${FINANCIAL_TYPES.join(' | ')}`,
    /* po_number        */ 'Purchase order reference',
    /* description      */ 'Brief description of the asset',
    /* remarks          */ 'Any additional notes',
    /* device_type      */ `Required. One of: ${DEVICE_TYPES.join(' | ')}`,
    /* manufacturer     */ 'Brand name, e.g. Dell, HP, Apple',
    /* model            */ 'Exact model name / number',
    /* date_of_purchase */ 'Format: YYYY-MM-DD, e.g. 2024-01-15',
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, sample, hints]);

  // Column widths
  ws['!cols'] = COLUMNS.map((_, i) => ({
    wch: i === 10 || i === 11 || i === 15 ? 36 : 24, // wider for description/remarks/hints
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'End User Assets');
  XLSX.writeFile(wb, 'end_user_asset_import_template.xlsx');
}

// ── Error PDF (print dialog) ──────────────────────────────────────────────────
function downloadErrorsPDF(errorRows) {
  const html = `
    <!DOCTYPE html><html>
    <head>
      <title>End User Asset Import — Error Report</title>
      <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:Arial,sans-serif;padding:28px;color:#1e293b;background:#fff}
        .header{margin-bottom:20px;padding-bottom:16px;border-bottom:2px solid #fee2e2}
        .header h1{font-size:18px;color:#dc2626}
        .header .meta{font-size:11px;color:#94a3b8;margin-top:4px}
        .summary{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px}
        .card{border:1px solid #fecaca;border-radius:10px;padding:12px;background:#fff5f5;text-align:center}
        .card-num{font-size:26px;font-weight:900;color:#dc2626}
        .card-label{font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;margin-top:4px}
        table{width:100%;border-collapse:collapse;font-size:11px}
        thead tr{background:#dc2626;color:white}
        th{padding:9px 10px;text-align:left;font-weight:700;font-size:10px;letter-spacing:.05em}
        td{padding:8px 10px;border-bottom:1px solid #fee2e2;vertical-align:top}
        tr:nth-child(even) td{background:#fff5f5}
        .err-list{color:#dc2626;font-size:10px;line-height:1.8}
        .err-list li{list-style:none;padding-left:10px;position:relative}
        .err-list li::before{content:"•";position:absolute;left:0}
        .row-num{font-family:monospace;background:#fee2e2;color:#dc2626;
                 padding:1px 5px;border-radius:4px;font-size:10px;font-weight:700}
        .footer{margin-top:20px;font-size:10px;color:#94a3b8;text-align:center;
                border-top:1px solid #f1f5f9;padding-top:12px}
        @media print{button{display:none!important}}
      </style>
    </head>
    <body>
      <div class="header">
        <h1>⚠ End User Asset Import — Error Report</h1>
        <div class="meta">
          Generated: ${new Date().toLocaleString()} &nbsp;|&nbsp;
          ${errorRows.length} row${errorRows.length !== 1 ? 's' : ''} failed validation
        </div>
      </div>
      <div class="summary">
        <div class="card">
          <div class="card-num">${errorRows.length}</div>
          <div class="card-label">Rows with errors</div>
        </div>
        <div class="card">
          <div class="card-num">${errorRows.reduce((a, r) => a + r.errors.length, 0)}</div>
          <div class="card-label">Total issues found</div>
        </div>
        <div class="card">
          <div class="card-num">${[...new Set(errorRows.flatMap(r => r.errors))].length}</div>
          <div class="card-label">Unique error types</div>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>ROW</th><th>NAME</th><th>DEVICE TYPE</th>
            <th>MANUFACTURER</th><th>MODEL</th>
            <th>STATUS</th><th>ERRORS FOUND</th>
          </tr>
        </thead>
        <tbody>
          ${errorRows.map(r => `
            <tr>
              <td><span class="row-num">#${r.rowNum}</span></td>
              <td>${r.data.name         || '<span style="color:#94a3b8;font-style:italic">empty</span>'}</td>
              <td>${r.data.device_type  || '—'}</td>
              <td>${r.data.manufacturer || '—'}</td>
              <td>${r.data.model        || '—'}</td>
              <td>${r.data.status       || '—'}</td>
              <td>
                <ul class="err-list">
                  ${r.errors.map(e => `<li>${e}</li>`).join('')}
                </ul>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="footer">Fix the above rows in your Excel file and re-import.</div>
    </body></html>
  `;
  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 500);
}

// ── Step bar ──────────────────────────────────────────────────────────────────
const STEPS = [
  { label: 'Upload',  icon: MdOutlineFileUpload },
  { label: 'Preview', icon: BsTable            },
  { label: 'Done',    icon: TbCircleCheck      },
];

const StepBar = ({ current }) => (
  <div className="flex items-center gap-1">
    {STEPS.map(({ label, icon: Icon }, i) => {
      const s      = i + 1;
      const done   = current > s;
      const active = current === s;
      return (
        <div key={s} className="flex items-center gap-1">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold
            transition-all duration-200
            ${done   ? 'bg-emerald-100 text-emerald-700'
            : active ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
            :          'bg-slate-100 text-slate-400'}`}>
            {done ? <FiCheck size={11} /> : <Icon size={11} />}
            <span className="hidden sm:inline">{label}</span>
          </div>
          {s < 3 && (
            <div className={`w-5 h-px mx-0.5 transition-all
              ${current > s ? 'bg-emerald-400' : 'bg-slate-200'}`} />
          )}
        </div>
      );
    })}
  </div>
);

const Pill = ({ value }) => (
  <span className="inline-block px-2 py-0.5 rounded-md bg-amber-100 text-amber-700
    text-[10px] font-semibold border border-amber-200 mr-1 mb-1">
    {value}
  </span>
);

// ── Main Modal ────────────────────────────────────────────────────────────────
export default function BulkImportEndUserModal({ onClose, onImport }) {
  const [step,      setStep]      = useState(1);
  const [rows,      setRows]      = useState([]);
  const [fileName,  setFileName]  = useState('');
  const [dragOver,  setDragOver]  = useState(false);
  const [importing, setImporting] = useState(false);
  const [result,    setResult]    = useState(null);
  const [filter,    setFilter]    = useState('all');
  const fileRef = useRef();

  // ── Parse uploaded file ───────────────────────────────────────────────────
  const processFile = useCallback((file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls'].includes(ext)) {
      alert('Please upload a .xlsx or .xls file');
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const wb  = XLSX.read(e.target.result, { type: 'array' });
      const ws  = wb.Sheets[wb.SheetNames[0]];
      // raw_dense skips empty rows; header: 1 uses first row as keys
      const raw = XLSX.utils.sheet_to_json(ws, { defval: '' });

      const validated = raw.map((row, i) => {
        // Normalise keys: "Date of Purchase" → "date_of_purchase"
        const data = {};
        Object.keys(row).forEach(k => {
          data[k.trim().toLowerCase().replace(/\s+/g, '_')] = row[k];
        });
        const errors = validateRow(data);
        return { rowNum: i + 2, data, errors, valid: errors.length === 0 };
      });

      setRows(validated);
      setStep(2);
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    processFile(e.dataTransfer.files[0]);
  }, [processFile]);

  // ── Run import ────────────────────────────────────────────────────────────
  // Sends array of { asset: {...}, endUser: {...} } — backend splits them
  // into assets table + asset_end_user table.
  const handleImport = async () => {
    const payload = rows
      .filter(r => r.valid)
      .map(r => ({
        asset: {
          name:                String(r.data.name           || '').trim(),
          category:            CATEGORY,
          asset_type:          String(r.data.asset_type     || 'End User Device').trim(),
          asset_no:            String(r.data.asset_no       || '').trim() || undefined,
          status:              String(r.data.status         || 'Available').trim(),
          location:            String(r.data.location       || '').trim() || null,
          asset_owner:         String(r.data.asset_owner    || '').trim() || null,
          cost:                r.data.cost ? Number(r.data.cost) : null,
          currency:            String(r.data.currency       || 'USD').trim(),
          financial_type:      String(r.data.financial_type || 'None').trim(),
          po_number:           String(r.data.po_number      || '').trim() || null,
          description:         String(r.data.description    || '').trim() || null,
          remarks:             String(r.data.remarks        || '').trim() || null,
          cia_confidentiality: 1,
          cia_integrity:       1,
          cia_availability:    1,
          asset_value:         1,
          classification:      'Low',
        },
        endUser: {
          device_type:      String(r.data.device_type      || '').trim()  || null,
          manufacturer:     String(r.data.manufacturer     || '').trim()  || null,
          model:            String(r.data.model            || '').trim()  || null,
          date_of_purchase: r.data.date_of_purchase
            ? String(r.data.date_of_purchase).trim() || null
            : null,
        },
      }));

    if (payload.length === 0) return;

    setImporting(true);
    try {
      // onImport calls assetService.bulkCreate(payload)
      // which posts { assets: payload } to POST /assets/bulk
      const res = await onImport(payload);
      setResult({ created: res?.created ?? payload.length, serverErrors: res?.errors ?? [] });
      setStep(3);
    } catch (err) {
      setResult({ created: 0, serverErrors: [err.message] });
      setStep(3);
    }
    setImporting(false);
  };

  const validCount  = rows.filter(r =>  r.valid).length;
  const errorCount  = rows.filter(r => !r.valid).length;
  const errorRows   = rows.filter(r => !r.valid);
  const displayRows =
    filter === 'valid' ? rows.filter(r =>  r.valid) :
    filter === 'error' ? rows.filter(r => !r.valid) : rows;

  const resetUpload = () => { setStep(1); setRows([]); setFileName(''); setFilter('all'); };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center
      justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col"
        style={{ maxHeight: '92vh' }}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4
          border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
                <TbDeviceDesktop size={18} className="text-red-600" />
              </div>
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-600
                flex items-center justify-center">
                <TbFileImport size={9} className="text-white" />
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Bulk Import — End User Assets
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                  bg-red-100 text-red-700 text-[10px] font-bold border border-red-200">
                  <TbDeviceDesktop size={9} /> End User Only
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {step === 1 && 'Upload Excel — category is fixed to "End User". Fields save to both tables.'}
                {step === 2 && (
                  <span className="flex items-center gap-1.5">
                    <BsFiletypeXlsx size={11} className="text-emerald-500" />
                    {fileName} — {rows.length} row{rows.length !== 1 ? 's' : ''} detected
                  </span>
                )}
                {step === 3 && 'Import finished — review the results below'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <StepBar current={step} />
            <button onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg
                text-slate-400 hover:bg-slate-100 transition ml-2">
              <FiX size={16} />
            </button>
          </div>
        </div>

        {/* ── Scrollable body ─────────────────────────────────────────────── */}
        <div className="overflow-y-auto flex-1 p-6">

          {/* ════════════════ STEP 1 — Upload ════════════════ */}
          {step === 1 && (
            <div className="space-y-6">

              {/* Fixed category notice */}
              <div className="flex items-center gap-3 px-4 py-3 bg-red-50
                border border-red-100 rounded-xl">
                <TbDeviceDesktop size={18} className="text-red-500 shrink-0" />
                <p className="text-sm text-red-700">
                  <strong>Category is locked to "End User"</strong> for all rows.
                  Asset fields save to <code className="bg-red-100 px-1 rounded">assets</code> table
                  and device fields save to{' '}
                  <code className="bg-red-100 px-1 rounded">asset_end_user</code> table automatically.
                </p>
              </div>

              {/* Template banner */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4
                flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center
                    justify-center shrink-0 mt-0.5">
                    <HiOutlineDocumentText size={16} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-blue-800">Download the template first</p>
                    <p className="text-xs text-blue-500 mt-0.5">
                      All 16 columns included — asset fields + End User-specific fields — with a
                      filled sample row and valid-values hints.
                    </p>
                  </div>
                </div>
                <button onClick={downloadTemplate}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700
                    text-white text-sm font-semibold rounded-lg transition shrink-0">
                  <MdOutlineFileDownload size={16} /> Download Template
                </button>
              </div>

              {/* Drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current.click()}
                className={`border-2 border-dashed rounded-2xl py-16 text-center
                  cursor-pointer transition-all duration-200 select-none
                  ${dragOver
                    ? 'border-red-400 bg-red-50 scale-[1.015]'
                    : 'border-slate-200 hover:border-red-300 hover:bg-slate-50'}`}>

                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center
                  mx-auto mb-4 transition-all
                  ${dragOver ? 'bg-red-100' : 'bg-slate-100'}`}>
                  <HiOutlineCloudUpload size={32}
                    className={dragOver ? 'text-red-500' : 'text-slate-400'} />
                </div>
                <p className="text-base font-bold text-slate-600 mb-1">
                  {dragOver ? 'Release to upload' : 'Drag & drop your Excel file here'}
                </p>
                <p className="text-sm text-slate-400 mb-4">or click to browse files</p>
                <div className="flex items-center justify-center gap-2">
                  {['.xlsx', '.xls'].map(ext => (
                    <span key={ext} className="inline-flex items-center gap-1.5 px-3 py-1.5
                      bg-emerald-50 border border-emerald-200 rounded-full
                      text-xs font-semibold text-emerald-700">
                      <BsFiletypeXlsx size={12} /> {ext}
                    </span>
                  ))}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={e => processFile(e.target.files[0])}
                />
              </div>

              {/* Column guide — two groups */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <BsTable size={13} className="text-slate-400" />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Expected Columns (16 total)
                  </p>
                </div>

                {/* Asset columns */}
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 ml-0.5">
                    Asset Fields → saved to <code>assets</code> table
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {COLUMNS.filter(c => c.group === 'asset').map(col => (
                      <div key={col.key}
                        className={`px-3 py-2 rounded-lg text-xs font-semibold border
                          flex items-center justify-between gap-1
                          ${col.required
                            ? 'bg-red-50 border-red-100 text-red-700'
                            : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                        <span className="flex items-center gap-1.5">
                          <col.icon size={10} /> {col.label}
                        </span>
                        {col.required && (
                          <span className="text-[9px] font-black text-red-400 shrink-0">REQ</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* End User-specific columns */}
                <div>
                  <div className="flex items-center gap-2 mb-2 ml-0.5">
                    <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">
                      End User Fields → saved to <code>asset_end_user</code> table
                    </p>
                    <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-600
                      text-[9px] font-bold">
                      End User Table
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {COLUMNS.filter(c => c.group === 'enduser').map(col => (
                      <div key={col.key}
                        className={`px-3 py-2 rounded-lg text-xs font-semibold border
                          flex items-center justify-between gap-1
                          ${col.required
                            ? 'bg-red-50 border-red-200 text-red-700 ring-1 ring-red-200'
                            : 'bg-red-50/50 border-red-100 text-red-600'}`}>
                        <span className="flex items-center gap-1.5">
                          <col.icon size={10} /> {col.label}
                        </span>
                        {col.required && (
                          <span className="text-[9px] font-black text-red-400 shrink-0">REQ</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Valid values reference */}
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FiAlertTriangle size={13} className="text-amber-600" />
                  <p className="text-xs font-bold text-amber-700 uppercase tracking-widest">
                    Valid Values Reference
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1.5">
                      Device Type <span className="text-red-500 ml-1">Required</span>
                    </p>
                    <div className="flex flex-wrap">
                      {DEVICE_TYPES.map(d => <Pill key={d} value={d} />)}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1.5">
                      Status
                    </p>
                    <div className="flex flex-wrap">
                      {STATUSES.map(s => <Pill key={s} value={s} />)}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1.5">
                      Financial Type
                    </p>
                    <div className="flex flex-wrap">
                      {FINANCIAL_TYPES.map(f => <Pill key={f} value={f} />)}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1.5">
                      Date of Purchase Format
                    </p>
                    <Pill value="YYYY-MM-DD" />
                    <p className="text-[10px] text-amber-600 mt-1">e.g. 2024-01-15</p>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ════════════════ STEP 2 — Preview ════════════════ */}
          {step === 2 && (
            <div className="space-y-4">

              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Total',  count: rows.length,  f: 'all',   icon: HiOutlineTable,       color: 'slate'   },
                  { label: 'Valid',  count: validCount,    f: 'valid', icon: HiOutlineCheckCircle, color: 'emerald' },
                  { label: 'Errors', count: errorCount,    f: 'error', icon: HiOutlineXCircle,     color: 'red'     },
                ].map(({ label, count, f, icon: Icon, color }) => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`rounded-xl p-4 border text-center transition-all
                      ${filter === f
                        ? `border-${color}-400 bg-${color}-50 ring-2 ring-${color}-200`
                        : `border-${color}-100 bg-${color}-50 hover:bg-${color}-100`}`}>
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Icon size={16} className={`text-${color}-500`} />
                      <p className={`text-xs font-bold text-${color}-400 uppercase tracking-wider`}>
                        {label}
                      </p>
                    </div>
                    <p className={`text-3xl font-black text-${color}-${color === 'slate' ? '700' : '600'}`}>
                      {count}
                    </p>
                    <p className={`text-xs text-${color}-400 mt-1`}>
                      {f === 'all' ? 'rows detected' : f === 'valid' ? 'ready to import' : 'will be skipped'}
                    </p>
                  </button>
                ))}
              </div>

              {validCount > 0 && errorCount > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50
                  border border-blue-100 rounded-lg">
                  <FiEye size={12} className="text-blue-500 shrink-0" />
                  <p className="text-xs text-blue-600">
                    Click cards above to filter ·{' '}
                    <span className="font-semibold">
                      Showing: {filter === 'all' ? 'All rows' : filter === 'valid' ? 'Valid only' : 'Errors only'}
                    </span>
                  </p>
                </div>
              )}

              {/* Preview table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto max-h-80"
                  style={{ scrollbarWidth: 'none' }}>
                  <style>{`.preview-table-scroll::-webkit-scrollbar{display:none}`}</style>
                  <table className="w-full text-xs preview-table-scroll">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-slate-100 border-b border-slate-200">
                        <th className="px-3 py-3 text-left font-bold text-slate-500 w-14">Row</th>
                        <th className="px-3 py-3 text-left font-bold text-slate-500 min-w-[130px]">Name</th>
                        <th className="px-3 py-3 text-left font-bold text-slate-500 min-w-[90px]">Asset No</th>
                        <th className="px-3 py-3 text-left font-bold text-slate-500 min-w-[100px]">Asset Type</th>
                        <th className="px-3 py-3 text-left font-bold text-red-600 min-w-[105px]">
                          <span className="flex items-center gap-1">
                            <FiMonitor size={10} /> Device Type
                          </span>
                        </th>
                        <th className="px-3 py-3 text-left font-bold text-red-500 min-w-[110px]">Manufacturer</th>
                        <th className="px-3 py-3 text-left font-bold text-red-500 min-w-[110px]">Model</th>
                        <th className="px-3 py-3 text-left font-bold text-red-500 min-w-[110px]">
                          <span className="flex items-center gap-1">
                            <FiCalendar size={10} /> Purchase Date
                          </span>
                        </th>
                        <th className="px-3 py-3 text-left font-bold text-slate-500 min-w-[80px]">Status</th>
                        <th className="px-3 py-3 text-left font-bold text-slate-500 min-w-[80px]">Cost</th>
                        <th className="px-3 py-3 text-left font-bold text-slate-500 min-w-[90px]">Location</th>
                        <th className="px-3 py-3 text-left font-bold text-slate-500 min-w-[220px]">
                          <span className="flex items-center gap-1.5">
                            <FiShield size={10} /> Validation
                          </span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {displayRows.length === 0 ? (
                        <tr>
                          <td colSpan={12} className="px-4 py-10 text-center">
                            <FiSlash size={24} className="mx-auto mb-2 text-slate-300" />
                            <p className="text-slate-400 text-xs">No rows to display</p>
                          </td>
                        </tr>
                      ) : displayRows.map((row, i) => (
                        <tr key={i}
                          className={row.valid
                            ? 'hover:bg-slate-50 transition-colors'
                            : 'bg-red-50 hover:bg-red-100 transition-colors'}>

                          <td className="px-3 py-2.5">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px]
                              font-mono font-bold
                              ${row.valid ? 'bg-slate-100 text-slate-500' : 'bg-red-100 text-red-600'}`}>
                              #{row.rowNum}
                            </span>
                          </td>

                          <td className="px-3 py-2.5 font-semibold text-slate-800">
                            {row.data.name || (
                              <span className="italic text-red-400 text-[10px]">empty</span>
                            )}
                          </td>

                          <td className="px-3 py-2.5 font-mono text-[10px] text-slate-500">
                            {row.data.asset_no || <span className="text-slate-300">auto</span>}
                          </td>

                          <td className="px-3 py-2.5 text-slate-600 text-[11px]">
                            {row.data.asset_type || <span className="text-slate-300">End User Device</span>}
                          </td>

                          {/* Device Type — highlighted red (End User table) */}
                          <td className="px-3 py-2.5">
                            {row.data.device_type ? (
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5
                                rounded-md text-[10px] font-bold
                                ${DEVICE_TYPES.includes(String(row.data.device_type).trim())
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-orange-100 text-orange-600'}`}>
                                <FiMonitor size={9} />
                                {row.data.device_type}
                              </span>
                            ) : (
                              <span className="italic text-red-400 text-[10px]">missing</span>
                            )}
                          </td>

                          <td className="px-3 py-2.5 text-slate-600 text-[11px]">
                            {row.data.manufacturer || <span className="text-slate-300">—</span>}
                          </td>
                          <td className="px-3 py-2.5 text-slate-600 text-[11px]">
                            {row.data.model || <span className="text-slate-300">—</span>}
                          </td>
                          <td className="px-3 py-2.5 text-slate-600 font-mono text-[10px]">
                            {row.data.date_of_purchase || <span className="text-slate-300 font-sans">—</span>}
                          </td>
                          <td className="px-3 py-2.5 text-[11px]">
                            {row.data.status ? (
                              <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100
                                text-slate-600 text-[10px] font-semibold">
                                {row.data.status}
                              </span>
                            ) : (
                              <span className="text-slate-300 text-[10px]">Available</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-slate-600 text-[11px]">
                            {row.data.cost
                              ? `${row.data.currency || 'USD'} ${Number(row.data.cost).toLocaleString()}`
                              : <span className="text-slate-300">—</span>}
                          </td>
                          <td className="px-3 py-2.5 text-slate-600 text-[11px]">
                            {row.data.location || <span className="text-slate-300">—</span>}
                          </td>

                          <td className="px-3 py-2.5">
                            {row.valid ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1
                                rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                                <HiOutlineBadgeCheck size={11} /> Valid
                              </span>
                            ) : (
                              <div className="space-y-1">
                                {row.errors.map((err, j) => (
                                  <div key={j} className="flex items-start gap-1.5">
                                    <TbAlertHexagon size={11}
                                      className="text-red-500 mt-0.5 shrink-0" />
                                    <span className="text-[10px] text-red-600 font-medium leading-tight">
                                      {err}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>

                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {validCount === 0 && (
                <div className="flex items-center gap-3 p-4 bg-red-50
                  border border-red-100 rounded-xl">
                  <HiOutlineExclamation size={20} className="text-red-500 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-red-700">No valid rows found</p>
                    <p className="text-xs text-red-500 mt-0.5">
                      Every row must have a <strong>Name</strong> and a valid <strong>Device Type</strong>
                      {' '}(Laptop / Desktop / Printer / Mobile / Other).
                    </p>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ════════════════ STEP 3 — Done ════════════════ */}
          {step === 3 && result && (
            <div className="flex flex-col items-center justify-center py-10 space-y-6">

              <div className={`w-24 h-24 rounded-full flex items-center justify-center
                ${result.created > 0 ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                {result.created > 0
                  ? <TbCircleCheck size={48} className="text-emerald-500" />
                  : <TbAlertHexagon size={48} className="text-amber-500" />}
              </div>

              <div className="text-center">
                <h3 className="text-xl font-black text-slate-800">
                  {result.created > 0 ? 'Import Complete!' : 'Nothing Imported'}
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  {result.created > 0
                    ? `${result.created} End User asset${result.created !== 1 ? 's were' : ' was'} saved to both tables`
                    : 'No valid rows were found to import'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
                  <HiOutlineCheckCircle size={18} className="text-emerald-500 mx-auto mb-1" />
                  <p className="text-3xl font-black text-emerald-600">{result.created}</p>
                  <p className="text-[10px] font-bold text-emerald-500 mt-1 uppercase tracking-wider">
                    Imported
                  </p>
                </div>
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
                  <HiOutlineXCircle size={18} className="text-red-400 mx-auto mb-1" />
                  <p className="text-3xl font-black text-red-500">{errorCount}</p>
                  <p className="text-[10px] font-bold text-red-400 mt-1 uppercase tracking-wider">
                    Skipped
                  </p>
                </div>
              </div>

              {/* Table save confirmation */}
              {result.created > 0 && (
                <div className="flex items-center gap-4 px-5 py-3 bg-slate-50
                  border border-slate-200 rounded-xl text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <FiCheck size={12} className="text-emerald-500" />
                    <code>assets</code> table updated
                  </span>
                  <span className="text-slate-300">|</span>
                  <span className="flex items-center gap-1.5">
                    <FiCheck size={12} className="text-emerald-500" />
                    <code>asset_end_user</code> table updated
                  </span>
                </div>
              )}

              {errorCount > 0 && (
                <div className="w-full max-w-sm space-y-3">
                  <div className="flex items-start gap-2 p-3 bg-amber-50
                    border border-amber-100 rounded-xl">
                    <FiInfo size={14} className="text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700">
                      {errorCount} row{errorCount !== 1 ? 's were' : ' was'} skipped.
                      Download the error report, fix the issues, and re-import.
                    </p>
                  </div>
                  <button
                    onClick={() => downloadErrorsPDF(errorRows)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5
                      bg-red-600 hover:bg-red-700 text-white text-sm font-semibold
                      rounded-xl transition">
                    <HiOutlineDocumentDownload size={16} /> Download Error Report (PDF)
                  </button>
                </div>
              )}

              {result.serverErrors?.length > 0 && (
                <div className="w-full max-w-sm bg-red-50 border border-red-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TbAlertHexagon size={14} className="text-red-600" />
                    <p className="text-xs font-bold text-red-700">Server Errors</p>
                  </div>
                  {result.serverErrors.map((e, i) => (
                    <p key={i} className="text-xs text-red-600 mt-1">• {e.error || e}</p>
                  ))}
                </div>
              )}

            </div>
          )}

        </div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 shrink-0">

          {step === 1 && (
            <>
              <button onClick={onClose}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl
                  text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">
                Cancel
              </button>
              <button onClick={downloadTemplate}
                className="flex items-center justify-center gap-2 px-5 py-2.5
                  bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl
                  text-sm font-semibold transition">
                <MdOutlineFileDownload size={16} /> Template
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <button onClick={resetUpload}
                className="flex items-center gap-2 px-4 py-2.5 border border-slate-200
                  rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">
                <FiArrowLeft size={14} /> Back
              </button>

              {errorCount > 0 && (
                <button onClick={() => downloadErrorsPDF(errorRows)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-red-50
                    hover:bg-red-100 border border-red-100 text-red-600
                    rounded-xl text-sm font-semibold transition">
                  <HiOutlineDocumentDownload size={15} /> Errors PDF
                </button>
              )}

              <button
                onClick={handleImport}
                disabled={validCount === 0 || importing}
                className="flex-1 flex items-center justify-center gap-2 py-2.5
                  bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed
                  text-white rounded-xl text-sm font-semibold transition">
                {importing ? (
                  <>
                    <FiRefreshCw size={14} className="animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <TbFileImport size={15} />
                    Import {validCount} End User Asset{validCount !== 1 ? 's' : ''}
                  </>
                )}
              </button>
            </>
          )}

          {step === 3 && (
            <button onClick={onClose}
              className="flex-1 flex items-center justify-center gap-2 py-2.5
                bg-blue-600 hover:bg-blue-700 text-white rounded-xl
                text-sm font-semibold transition">
              <FiCheck size={15} /> Done
            </button>
          )}

        </div>
      </div>
    </div>
  );
}

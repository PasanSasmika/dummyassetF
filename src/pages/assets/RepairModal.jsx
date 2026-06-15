// src/pages/Assets/RepairModal.jsx
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  checkAssetWarranty,
  createRepair,
  clearRepairMessages,
} from '../../features/repairs/repairSlice';
import {
  TbTool, TbShieldCheck, TbAlertTriangle, TbArrowsRightLeft,
  TbCheck, TbUpload, TbX, TbFileDescription,
} from 'react-icons/tb';
import { FiAlertTriangle } from 'react-icons/fi';

// ─── Repair type options ───────────────────────────────────────────────────────
const REPAIR_TYPES = [
  { id: 'Service',     icon: TbTool,            color: 'blue',   label: 'Service / Maintenance' },
  { id: 'Damage',      icon: TbAlertTriangle,   color: 'amber',  label: 'Damage Repair'         },
  { id: 'Replacement', icon: TbArrowsRightLeft, color: 'purple', label: 'Part Replacement'      },
];

const C = {
  blue:   { pill: 'bg-blue-100 text-blue-700 border-blue-300',   active: 'bg-blue-600 text-white border-blue-600',   icon: 'text-blue-500'   },
  amber:  { pill: 'bg-amber-100 text-amber-700 border-amber-300', active: 'bg-amber-500 text-white border-amber-500', icon: 'text-amber-500'  },
  purple: { pill: 'bg-purple-100 text-purple-700 border-purple-300', active: 'bg-purple-600 text-white border-purple-600', icon: 'text-purple-500' },
};

const inputCls =
  `w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white
   focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder:text-slate-300
   disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed`;

// ─── Allowed MIME types for warranty document ──────────────────────────────────
const ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

export default function RepairModal({ asset, onClose, onSuccess }) {
  const dispatch  = useDispatch();
  const { warranty, saving, error, success } = useSelector(s => s.repairs);

  const fileInputRef = useRef(null);

  const [repairType,       setRepairType]       = useState('Service');
  const [checkingWarranty, setCheckingWarranty] = useState(false);
  const [localError,       setLocalError]       = useState('');
  const [docFile,          setDocFile]          = useState(null);  // File object
  const [docError,         setDocError]         = useState('');

  const [form, setForm] = useState({
    vendor_name:        '',
    repair_cost:        '',
    description:        '',
    start_date:         new Date().toISOString().split('T')[0],
    completion_date:    '',
    part_warranty_start:'',
    part_warranty_end:  '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // ── Warranty check whenever type (Service/Damage) or start_date changes ──────
  useEffect(() => {
    if (repairType !== 'Replacement' && form.start_date) {
      setCheckingWarranty(true);
      dispatch(checkAssetWarranty({ assetId: asset.id, date: form.start_date }))
        .finally(() => setCheckingWarranty(false));
    }
  }, [repairType, form.start_date]);

  // ── Auto-set cost to 0 when warranty covered ─────────────────────────────────
  useEffect(() => {
    if (repairType === 'Replacement') return;
    if (warranty?.warranty_covered) {
      set('repair_cost', '0');
    } else if (warranty && !warranty.warranty_covered) {
      set('repair_cost', '');
    }
  }, [warranty, repairType]);

  // ── On success, close after brief delay ──────────────────────────────────────
  useEffect(() => {
    if (success) {
      const t = setTimeout(() => { dispatch(clearRepairMessages()); onSuccess(); }, 1200);
      return () => clearTimeout(t);
    }
  }, [success]);

  const isWarrantyCovered = warranty?.warranty_covered && repairType !== 'Replacement';

  // ── File pick handler ─────────────────────────────────────────────────────────
  const handleFilePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_MIME.includes(file.type)) {
      setDocError('Only PDF, JPG, or PNG files are allowed.');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setDocError('File must be under 20 MB.');
      return;
    }
    setDocError('');
    setDocFile(file);
    e.target.value = '';
  };

  // ── Submit ────────────────────────────────────────────────────────────────────
  const handleSubmit = () => {
    setLocalError('');

    if (!form.description.trim()) {
      setLocalError('Description is required.');
      return;
    }
    if (repairType !== 'Replacement' && !isWarrantyCovered && form.repair_cost === '') {
      setLocalError('Please enter the repair cost.');
      return;
    }
    if (repairType === 'Replacement' && form.repair_cost === '') {
      setLocalError('Please enter the replacement cost.');
      return;
    }

    // Build FormData so we can attach the warranty document file
    const fd = new FormData();
    fd.append('repair_type',  repairType);
    fd.append('description',  form.description);
    fd.append('start_date',   form.start_date);
    if (form.vendor_name)     fd.append('vendor_name',     form.vendor_name);
    if (form.repair_cost !== '') fd.append('repair_cost',  form.repair_cost);
    if (form.completion_date) fd.append('completion_date', form.completion_date);

    if (repairType === 'Replacement') {
      if (form.part_warranty_start) fd.append('part_warranty_start', form.part_warranty_start);
      if (form.part_warranty_end)   fd.append('part_warranty_end',   form.part_warranty_end);
    }

    // Attach warranty doc file (field name must match multer: 'warranty_document')
    if (docFile) fd.append('warranty_document', docFile);

    dispatch(createRepair({ assetId: asset.id, data: fd }));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.6)' }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
            <TbTool size={20} className="text-orange-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-black text-slate-900">Send for Repair</h2>
            <p className="text-xs text-slate-400 mt-0.5 truncate">
              {asset.name}
              <span className="font-mono ml-2 text-slate-300">{asset.asset_no}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg
              hover:bg-slate-100 text-slate-400 text-lg font-bold transition"
          >
            ×
          </button>
        </div>

        {/* ── Scrollable body ─────────────────────────────────────────────── */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* Repair type selector */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Repair Type</label>
            <select
              value={repairType}
              onChange={e => setRepairType(e.target.value)}
              className={inputCls}
            >
              {REPAIR_TYPES.map(t => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Warranty status banner (Service / Damage only) */}
          {repairType !== 'Replacement' && (
            <div className="rounded-xl border overflow-hidden">
              {checkingWarranty ? (
                <div className="flex items-center gap-2.5 px-4 py-3 bg-slate-50 border-slate-200 text-sm text-slate-500">
                  <svg className="animate-spin w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Checking warranty for {form.start_date}…
                </div>
              ) : warranty?.warranty_covered ? (
                <div className="flex items-start gap-3 px-4 py-3 bg-emerald-50 border-emerald-200">
                  <TbShieldCheck size={17} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-black text-emerald-700">
                      ✅ Warranty Active — Repair is Free
                    </p>
                    <p className="text-xs text-emerald-600 mt-0.5">
                      Provider: <strong>{warranty.warranty?.provider_name}</strong> · Valid until:{' '}
                      <strong>
                        {new Date(warranty.warranty?.end_date).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </strong>
                    </p>
                  </div>
                </div>
              ) : warranty ? (
                <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border-amber-200">
                  <FiAlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">
                    <strong>No active warranty</strong> for {form.start_date}. Repair cost is required.
                  </p>
                </div>
              ) : null}
            </div>
          )}

          {/* Replacement notice */}
          {repairType === 'Replacement' && (
            <div className="flex items-start gap-3 px-4 py-3 bg-purple-50 border border-purple-200 rounded-xl">
              <TbArrowsRightLeft size={15} className="text-purple-500 shrink-0 mt-0.5" />
              <p className="text-xs text-purple-700">
                Warranty does not apply to part replacements.
                Enter the replacement cost and optionally record the new part's warranty below.
              </p>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">
              Description <span className="text-red-500">*</span>
              {repairType === 'Replacement' && (
                <span className="ml-1 text-slate-400 font-normal">— describe the part replaced</span>
              )}
            </label>
            <textarea
              rows={3}
              placeholder={
                repairType === 'Replacement'
                  ? 'e.g. Replaced battery (45Wh) — old battery had 12% health…'
                  : 'Describe the issue or work to be done…'
              }
              value={form.description}
              onChange={e => set('description', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm
                focus:outline-none focus:ring-2 focus:ring-orange-400
                placeholder:text-slate-300 resize-none"
            />
          </div>

          {/* Vendor + Cost */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                Vendor / Technician
              </label>
              <input
                type="text"
                placeholder="e.g. Dell Support"
                value={form.vendor_name}
                onChange={e => set('vendor_name', e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                Repair Cost{' '}
                {isWarrantyCovered
                  ? <span className="text-emerald-600 font-black">(Free — warranty)</span>
                  : <span className="text-red-500">*</span>}
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.repair_cost}
                disabled={isWarrantyCovered}
                onChange={e => set('repair_cost', e.target.value)}
                className={`${inputCls}
                  ${isWarrantyCovered
                    ? '!bg-emerald-50 !border-emerald-200 !text-emerald-700'
                    : ''}`}
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                Start Date
                {repairType !== 'Replacement' && (
                  <span className="ml-1 text-slate-400 font-normal">(warranty check)</span>
                )}
              </label>
              <input
                type="date"
                value={form.start_date}
                onChange={e => set('start_date', e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                Expected Completion
              </label>
              <input
                type="date"
                value={form.completion_date}
                onChange={e => set('completion_date', e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          {/* ── Warranty section (always visible) ───────────────────────── */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-1">
              <TbShieldCheck size={14} className="text-slate-400" />
              <p className="text-xs font-bold text-slate-600">
                {repairType === 'Replacement' ? 'New Part Warranty' : 'Warranty Document'}
                <span className="ml-1 font-normal text-slate-400">(optional)</span>
              </p>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              {repairType === 'Replacement'
                ? 'Record the warranty on the replacement part and attach the warranty document.'
                : 'Attach the warranty certificate or supporting document (PDF / JPG / PNG, max 20 MB).'}
            </p>

            {/* Part warranty dates — Replacement only */}
            {repairType === 'Replacement' && (
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">
                    Part Warranty Start
                  </label>
                  <input
                    type="date"
                    value={form.part_warranty_start}
                    onChange={e => set('part_warranty_start', e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">
                    Part Warranty End
                  </label>
                  <input
                    type="date"
                    value={form.part_warranty_end}
                    onChange={e => set('part_warranty_end', e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>
            )}

            {/* File upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={handleFilePick}
            />

            {docFile ? (
              /* File chosen — show chip */
              <div className="flex items-center gap-2.5 px-3 py-2.5 bg-slate-50
                border border-slate-200 rounded-xl">
                <TbFileDescription size={16} className="text-orange-500 shrink-0" />
                <span className="flex-1 text-xs text-slate-700 font-medium truncate">
                  {docFile.name}
                </span>
                <span className="text-[10px] text-slate-400 shrink-0">
                  {(docFile.size / 1024).toFixed(0)} KB
                </span>
                <button
                  type="button"
                  onClick={() => setDocFile(null)}
                  className="w-5 h-5 flex items-center justify-center rounded-full
                    hover:bg-red-100 text-slate-400 hover:text-red-500 transition shrink-0"
                >
                  <TbX size={12} />
                </button>
              </div>
            ) : (
              /* Upload button */
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5
                  border-2 border-dashed border-slate-200 rounded-xl text-xs font-semibold
                  text-slate-500 hover:border-orange-300 hover:text-orange-500
                  hover:bg-orange-50 transition"
              >
                <TbUpload size={15} />
                Click to upload warranty document
              </button>
            )}

            {docError && (
              <p className="mt-1.5 text-[11px] text-red-600 font-semibold">{docError}</p>
            )}
          </div>

          {/* Errors */}
          {(localError || error) && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl
              text-xs text-red-700 font-semibold flex items-center gap-2">
              <FiAlertTriangle size={13} className="shrink-0" />
              {localError || error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl
              text-xs text-emerald-700 font-semibold flex items-center gap-2">
              <TbCheck size={14} className="shrink-0" /> {success}
            </div>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200
              text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600
              text-white text-sm font-bold transition disabled:opacity-50
              flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Submitting…
              </>
            ) : (
              <><TbTool size={15} /> Submit Repair</>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}


// src/pages/Assets/RepairModal.jsx
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  checkAssetWarranty,
  createRepair,
  clearRepairMessages,
} from '../../features/repairs/repairSlice';
import {
  TbTool, TbShieldCheck, TbAlertTriangle, TbArrowRight,
  TbArrowLeft, TbCheck, TbRefresh, TbArrowsRightLeft,
} from 'react-icons/tb';
import { FiAlertTriangle } from 'react-icons/fi';
import { HiOutlineCube } from 'react-icons/hi';

const REPAIR_TYPES = [
  {
    id:    'Service',
    icon:  TbTool,
    color: 'blue',
    title: 'Service / Maintenance',
    desc:  'Routine servicing, cleaning, calibration or preventive maintenance.',
    note:  'Warranty check applies — if covered, no cost.',
  },
  {
    id:    'Damage',
    icon:  TbAlertTriangle,
    color: 'amber',
    title: 'Damage Repair',
    desc:  'Physical or functional damage that needs fixing by a technician or vendor.',
    note:  'Warranty check applies — accidental damage may not be covered.',
  },
  {
    id:    'Replacement',
    icon:  TbArrowsRightLeft,
    color: 'purple',
    title: 'Part Replacement',
    desc:  'Replace a specific damaged component. The asset itself stays active.',
    note:  'Warranty does not apply to replacements.',
  },
];

const COLOR_MAP = {
  blue:   { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   icon: 'text-blue-500',   sel: 'bg-blue-100 border-blue-400'   },
  amber:  { bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700',  icon: 'text-amber-500',  sel: 'bg-amber-100 border-amber-400'  },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', icon: 'text-purple-500', sel: 'bg-purple-100 border-purple-400' },
};

export default function RepairModal({ asset, onClose, onSuccess }) {
  const dispatch = useDispatch();
  const { warranty, saving, error, success } = useSelector(s => s.repairs);

  const [step,             setStep]             = useState(1);
  const [selectedType,     setSelectedType]     = useState(null);
  const [checkingWarranty, setCheckingWarranty] = useState(false);
  const [form, setForm] = useState({
    vendor_name:       '',
    repair_cost:       '',
    description:       '',
    start_date:        new Date().toISOString().split('T')[0],
    completion_date:   '',
    warranty_start:    '',
    warranty_end:      '',
    warranty_document: '',
  });
  const [localError, setLocalError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSelectType = async (type) => {
    setSelectedType(type);
    if (type !== 'Replacement') {
      setCheckingWarranty(true);
      await dispatch(checkAssetWarranty(asset.id));
      setCheckingWarranty(false);
    }
  };

  useEffect(() => {
    if (warranty?.warranty_covered && selectedType !== 'Replacement') {
      set('repair_cost', '0');
    }
  }, [warranty]);

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => { dispatch(clearRepairMessages()); onSuccess(); }, 1200);
      return () => clearTimeout(t);
    }
  }, [success]);

  const handleSubmit = () => {
    if (!form.description.trim()) { setLocalError('Description is required.'); return; }
    setLocalError('');
    dispatch(createRepair({
      assetId: asset.id,
      data: {
        repair_type:       selectedType,
        vendor_name:       form.vendor_name       || undefined,
        repair_cost:       form.repair_cost !== '' ? parseFloat(form.repair_cost) : undefined,
        description:       form.description,
        start_date:        form.start_date         || undefined,
        completion_date:   form.completion_date    || undefined,
        warranty_start:    form.warranty_start     || undefined,
        warranty_end:      form.warranty_end       || undefined,
        warranty_document: form.warranty_document  || undefined,
      },
    }));
  };

  const isWarrantyCovered = warranty?.warranty_covered && selectedType !== 'Replacement';

  // shared input class
  const inputCls = `w-full px-3 py-2.5 rounded-xl border border-brand-cream text-sm text-brand-dark
    focus:outline-none focus:ring-2 focus:ring-brand-green transition-colors duration-150
    placeholder:text-brand-dark/30`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.6)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* ── Header ── */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-brand-cream/60 sticky top-0 bg-white z-10">
          <div className="w-10 h-10 rounded-xl bg-brand-green/10 flex items-center justify-center shrink-0">
            <TbTool size={20} className="text-brand-green" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-black text-brand-dark">Send for Repair</h2>
            <p className="text-xs text-brand-dark/40 mt-0.5 truncate">
              {asset.name}
              <span className="font-mono ml-1.5 text-brand-dark/20">{asset.asset_no}</span>
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-1.5 mr-2">
            {[1, 2].map(s => (
              <div key={s}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black
                  ${step >= s
                    ? 'bg-brand-green text-brand-cream-light'
                    : 'bg-brand-cream/50 text-brand-dark/30'}`}>
                {s}
              </div>
            ))}
          </div>

          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg
              hover:bg-brand-cream/40 text-brand-dark/30 text-lg font-bold transition">
            ×
          </button>
        </div>

        {/* ════════ STEP 1 ════════ */}
        {step === 1 && (
          <div className="px-6 py-5">
            <p className="text-sm font-bold text-brand-dark mb-1">Select Repair Type</p>
            <p className="text-xs text-brand-dark/40 mb-5">
              The system will automatically check for active warranty coverage.
            </p>

            <div className="space-y-3">
              {REPAIR_TYPES.map(type => {
                const c      = COLOR_MAP[type.color];
                const Icon   = type.icon;
                const active = selectedType === type.id;
                return (
                  <button key={type.id} type="button"
                    onClick={() => handleSelectType(type.id)}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition
                      ${active ? c.sel : `${c.bg} ${c.border} hover:border-opacity-70`}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0
                        ${active ? 'bg-white/60' : 'bg-white'}`}>
                        <Icon size={18} className={c.icon} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-black ${active ? c.text : 'text-brand-dark'}`}>
                            {type.title}
                          </p>
                          {active && <TbCheck size={14} className={c.icon} />}
                        </div>
                        <p className="text-xs text-brand-dark/50 mt-0.5 leading-relaxed">{type.desc}</p>
                        <p className={`text-[10px] font-semibold mt-1.5 ${c.text}`}>ℹ️ {type.note}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Warranty check result */}
            {selectedType && selectedType !== 'Replacement' && (
              <div className="mt-4">
                {checkingWarranty ? (
                  <div className="flex items-center gap-2 p-3 bg-brand-offwhite rounded-xl
                    border border-brand-cream text-sm text-brand-dark/50">
                    <svg className="animate-spin w-4 h-4 text-brand-green" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Checking warranty coverage...
                  </div>
                ) : warranty ? (
                  warranty.warranty_covered ? (
                    <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <TbShieldCheck size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-black text-emerald-700">✅ Active Warranty Found — Repair is Free</p>
                        <p className="text-xs text-emerald-600 mt-0.5">
                          Provider: <strong>{warranty.warranty?.provider_name}</strong> ·
                          Expires: <strong>
                            {new Date(warranty.warranty?.end_date).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric', year: 'numeric',
                            })}
                          </strong>
                        </p>
                        <p className="text-xs text-emerald-500 mt-1">Repair cost will be set to $0.00 automatically.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                      <FiAlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-black text-amber-700">No Active Warranty — Cost Applies</p>
                        <p className="text-xs text-amber-600 mt-0.5">
                          No active warranty was found for this asset. You will need to enter the repair cost manually.
                        </p>
                      </div>
                    </div>
                  )
                ) : null}
              </div>
            )}

            {selectedType === 'Replacement' && (
              <div className="mt-4 flex items-start gap-3 p-4 bg-purple-50 border border-purple-200 rounded-xl">
                <TbArrowsRightLeft size={16} className="text-purple-600 shrink-0 mt-0.5" />
                <p className="text-xs text-purple-700 font-semibold">
                  Part replacement — warranty coverage does not apply. Enter the replacement part cost in the next step.
                </p>
              </div>
            )}

            {/* Footer */}
            <div className="flex gap-3 mt-6">
              <button onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-xl border border-brand-cream
                  text-sm font-semibold text-brand-dark/60 hover:bg-brand-cream/30 transition">
                Cancel
              </button>
              <button onClick={() => setStep(2)}
                disabled={!selectedType || checkingWarranty}
                className="flex-1 px-4 py-2.5 rounded-xl bg-brand-green hover:bg-brand-green-dark
                  text-brand-cream-light text-sm font-bold transition disabled:opacity-40
                  flex items-center justify-center gap-2">
                Next <TbArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* ════════ STEP 2 ════════ */}
        {step === 2 && (
          <div className="px-6 py-5 space-y-4">

            {/* Type recap */}
            <div className={`flex items-center gap-3 p-3 rounded-xl border
              ${isWarrantyCovered
                ? 'bg-emerald-50 border-emerald-200'
                : 'bg-brand-green/5 border-brand-green/20'}`}>
              <TbTool size={16} className={isWarrantyCovered ? 'text-emerald-600' : 'text-brand-green'} />
              <div className="flex-1">
                <p className={`text-xs font-black ${isWarrantyCovered ? 'text-emerald-700' : 'text-brand-green-dark'}`}>
                  {REPAIR_TYPES.find(t => t.id === selectedType)?.title}
                  {isWarrantyCovered && ' — Warranty Covered (Free)'}
                </p>
              </div>
              {isWarrantyCovered && (
                <span className="px-2 py-1 bg-emerald-200 text-emerald-800 text-[10px] font-black rounded-lg">FREE</span>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-brand-dark/60 mb-1.5">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea rows={3}
                placeholder="Describe what needs to be repaired..."
                value={form.description}
                onChange={e => set('description', e.target.value)}
                className={`${inputCls} resize-none`}
              />
            </div>

            {/* Vendor + Cost */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-brand-dark/60 mb-1.5">Vendor / Technician</label>
                <input type="text" placeholder="e.g. Dell Support"
                  value={form.vendor_name} onChange={e => set('vendor_name', e.target.value)}
                  className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-dark/60 mb-1.5">
                  Repair Cost
                  {isWarrantyCovered && <span className="ml-1 text-emerald-600 font-black">(Free)</span>}
                </label>
                <input type="number" min="0" step="0.01" placeholder="0.00"
                  value={form.repair_cost}
                  disabled={isWarrantyCovered}
                  onChange={e => set('repair_cost', e.target.value)}
                  className={`${inputCls} ${isWarrantyCovered ? 'bg-emerald-50 border-emerald-200 text-emerald-700 cursor-not-allowed' : ''}`}
                />
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-brand-dark/60 mb-1.5">Start Date</label>
                <input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)}
                  className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-dark/60 mb-1.5">Expected Completion</label>
                <input type="date" value={form.completion_date} onChange={e => set('completion_date', e.target.value)}
                  className={inputCls} />
              </div>
            </div>

            {/* Repair Warranty */}
            <div className="pt-2 border-t border-brand-cream/60">
              <p className="text-xs font-bold text-brand-dark/40 mb-3 flex items-center gap-1.5">
                <TbShieldCheck size={13} className="text-brand-dark/30" />
                Repair Warranty (optional)
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-brand-dark/60 mb-1.5">Warranty Start</label>
                  <input type="date" value={form.warranty_start} onChange={e => set('warranty_start', e.target.value)}
                    className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-dark/60 mb-1.5">Warranty End</label>
                  <input type="date" value={form.warranty_end} onChange={e => set('warranty_end', e.target.value)}
                    className={inputCls} />
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-xs font-bold text-brand-dark/60 mb-1.5">Warranty Document Ref</label>
                <input type="text" placeholder="e.g. WR-2024-0012"
                  value={form.warranty_document} onChange={e => set('warranty_document', e.target.value)}
                  className={inputCls} />
              </div>
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
              <div className="p-3 bg-brand-green/5 border border-brand-green/20 rounded-xl
                text-xs text-brand-green-dark font-semibold flex items-center gap-2">
                <TbCheck size={14} className="text-brand-green shrink-0" /> {success}
              </div>
            )}

            {/* Footer */}
            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep(1)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border
                  border-brand-cream text-sm font-semibold text-brand-dark/60
                  hover:bg-brand-cream/30 transition">
                <TbArrowLeft size={14} /> Back
              </button>
              <button onClick={handleSubmit} disabled={saving}
                className="flex-1 px-4 py-2.5 rounded-xl bg-brand-green hover:bg-brand-green-dark
                  text-brand-cream-light text-sm font-bold transition disabled:opacity-50
                  flex items-center justify-center gap-2">
                {saving ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  <><TbTool size={15} /> Submit Repair</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// pages/assetTypes/AssetTypeModal.jsx

import { useState } from 'react';
import {
  FiX, FiEdit2, FiPlus, FiCheck, FiAlertCircle, FiSave,
} from 'react-icons/fi';
import {
  TbServer, TbTool, TbShieldLock, TbFileText,
  TbDeviceDesktop, TbDoor, TbUserCheck, TbBox,
} from 'react-icons/tb';

export const CATEGORIES = [
  'Human', 'IT Infrastructure', 'Service',
  'Digital', 'Tangible Information', 'End User', 'Facility',
];

export const CAT_ICON = {
  'Human':                TbUserCheck,
  'IT Infrastructure':    TbServer,
  'Service':              TbTool,
  'Digital':              TbShieldLock,
  'Tangible Information': TbFileText,
  'End User':             TbDeviceDesktop,
  'Facility':             TbDoor,
};

export const CAT_COLOR = {
  'Human':                { pill: 'bg-indigo-100 text-indigo-700 ring-indigo-200',    icon: 'bg-indigo-100 text-indigo-600',    card: 'border-indigo-200 bg-indigo-50/60',   focusRing: 'focus:ring-indigo-400', selRing: 'ring-indigo-400', btn: 'bg-indigo-600 hover:bg-indigo-700' },
  'IT Infrastructure':    { pill: 'bg-sky-100 text-sky-700 ring-sky-200',             icon: 'bg-sky-100 text-sky-600',          card: 'border-sky-200 bg-sky-50/60',         focusRing: 'focus:ring-sky-400',    selRing: 'ring-sky-400',    btn: 'bg-sky-600 hover:bg-sky-700' },
  'Service':              { pill: 'bg-amber-100 text-amber-700 ring-amber-200',       icon: 'bg-amber-100 text-amber-600',      card: 'border-amber-200 bg-amber-50/60',     focusRing: 'focus:ring-amber-400',  selRing: 'ring-amber-400',  btn: 'bg-amber-500 hover:bg-amber-600' },
  'Digital':              { pill: 'bg-purple-100 text-purple-700 ring-purple-200',    icon: 'bg-purple-100 text-purple-600',    card: 'border-purple-200 bg-purple-50/60',   focusRing: 'focus:ring-purple-400', selRing: 'ring-purple-400', btn: 'bg-purple-600 hover:bg-purple-700' },
  'Tangible Information': { pill: 'bg-emerald-100 text-emerald-700 ring-emerald-200', icon: 'bg-emerald-100 text-emerald-600',  card: 'border-emerald-200 bg-emerald-50/60', focusRing: 'focus:ring-emerald-400',selRing: 'ring-emerald-400',btn: 'bg-emerald-600 hover:bg-emerald-700' },
  'End User':             { pill: 'bg-rose-100 text-rose-700 ring-rose-200',          icon: 'bg-rose-100 text-rose-600',        card: 'border-rose-200 bg-rose-50/60',       focusRing: 'focus:ring-rose-400',   selRing: 'ring-rose-400',   btn: 'bg-rose-500 hover:bg-rose-600' },
  'Facility':             { pill: 'bg-orange-100 text-orange-700 ring-orange-200',    icon: 'bg-orange-100 text-orange-600',    card: 'border-orange-200 bg-orange-50/60',   focusRing: 'focus:ring-orange-400', selRing: 'ring-orange-400', btn: 'bg-orange-500 hover:bg-orange-600' },
};

// Default falls back to brand green
const DEFAULT_COLORS = {
  pill:       'bg-brand-green/10 text-brand-green ring-brand-green/20',
  icon:       'bg-brand-green/10 text-brand-green',
  card:       'border-brand-green/20 bg-brand-green/5',
  focusRing:  'focus:ring-brand-green',
  selRing:    'ring-brand-green',
  btn:        'bg-brand-green hover:bg-brand-green-dark',
};

export default function AssetTypeModal({ mode, item, onClose, onSubmit, saving }) {
  const isEdit = mode === 'edit';

  const [name,     setName]     = useState(item?.name     || '');
  const [category, setCategory] = useState(item?.category || '');
  const [touched,  setTouched]  = useState(false);

  const colors  = CAT_COLOR[category] || DEFAULT_COLORS;
  const CatIcon = CAT_ICON[category]  || TbBox;

  const nameErr = touched && !name.trim()         ? 'Name is required'     : '';
  const catErr  = touched && !isEdit && !category ? 'Category is required' : '';

  const handleSubmit = () => {
    setTouched(true);
    if (!name.trim())         return;
    if (!isEdit && !category) return;
    onSubmit({ name: name.trim(), ...(isEdit ? {} : { category }) });
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col" style={{ maxHeight: '90vh' }}>

        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-brand-cream/60 shrink-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colors.icon}`}>
            {isEdit ? <FiEdit2 size={18} /> : <FiPlus size={18} />}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-brand-dark">
              {isEdit ? 'Edit Asset Type' : 'New Asset Type'}
            </h3>
            <p className="text-xs text-brand-dark/40 mt-0.5 truncate">
              {isEdit ? `Editing "${item?.name}" · ${item?.category}` : 'Add a new type under a category'}
            </p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-brand-dark/30 hover:bg-brand-cream/40 transition shrink-0">
            <FiX size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Live preview */}
          {(name.trim() || category) && (
            <div className={`rounded-xl border-2 p-4 transition-all ${colors.card}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colors.icon}`}>
                  <CatIcon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-brand-dark truncate">{name.trim() || '—'}</p>
                  {category && (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ring-1 mt-0.5 ${colors.pill}`}>
                      <CatIcon size={10} /> {category}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ring-1 shrink-0 ${colors.pill}`}>
                  Preview
                </span>
              </div>
            </div>
          )}

          {/* Category grid — create only */}
          {!isEdit && (
            <div>
              <label className="block text-[11px] font-bold text-brand-dark/50 uppercase tracking-wider mb-2">
                Category <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map(c => {
                  const Icon = CAT_ICON[c] || TbBox;
                  const col  = CAT_COLOR[c];
                  const sel  = category === c;
                  return (
                    <button key={c} type="button" onClick={() => setCategory(c)}
                      className={`flex items-center gap-2.5 px-3.5 py-3 rounded-xl border-2 text-left transition-all
                        ${sel
                          ? `${col.card} border-current ring-2 ${col.selRing}`
                          : 'border-brand-cream bg-white text-brand-dark/50 hover:border-brand-green/30 hover:bg-brand-green/5'}`}>
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0
                        ${sel ? col.icon : 'bg-brand-cream/50 text-brand-dark/30'}`}>
                        <Icon size={15} />
                      </div>
                      <span className={`truncate text-xs font-semibold ${sel ? 'text-brand-dark font-bold' : ''}`}>
                        {c}
                      </span>
                      {sel && <FiCheck size={13} className="ml-auto shrink-0 text-emerald-600" />}
                    </button>
                  );
                })}
              </div>
              {catErr && (
                <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                  <FiAlertCircle size={11} /> {catErr}
                </p>
              )}
            </div>
          )}

          {/* Locked category — edit only */}
          {isEdit && (
            <div>
              <label className="block text-[11px] font-bold text-brand-dark/50 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 ${colors.card} cursor-not-allowed`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${colors.icon}`}>
                  <CatIcon size={16} />
                </div>
                <span className="text-sm font-bold text-brand-dark">{category}</span>
                <span className="ml-auto text-[10px] font-bold text-brand-dark/40 bg-white/80 px-2 py-0.5 rounded-md uppercase tracking-wide border border-brand-cream">
                  Locked
                </span>
              </div>
              <p className="text-[11px] text-brand-dark/40 mt-1.5 flex items-center gap-1">
                <FiAlertCircle size={10} /> Category cannot be changed after creation.
              </p>
            </div>
          )}

          {/* Name field */}
          <div>
            <label className="block text-[11px] font-bold text-brand-dark/50 uppercase tracking-wider mb-1.5">
              Type Name <span className="text-red-400">*</span>
            </label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder={
                category === 'Human'             ? 'e.g. Contractor, Full-time Employee…'
                : category === 'IT Infrastructure' ? 'e.g. Firewall, Load Balancer…'
                : category === 'End User'          ? 'e.g. Laptop, Mobile Device…'
                : category === 'Digital'           ? 'e.g. SSL Certificate, Domain…'
                : category === 'Facility'          ? 'e.g. Server Room, Office Space…'
                : category === 'Service'           ? 'e.g. Cloud Subscription, SLA…'
                : 'Enter asset type name…'
              }
              className={`w-full px-4 py-3 rounded-xl border-2 text-sm text-brand-dark transition-all
                focus:outline-none focus:ring-2 placeholder:text-brand-dark/30
                ${nameErr
                  ? 'border-red-300 bg-red-50 focus:ring-red-200'
                  : `border-brand-cream bg-white ${colors.focusRing} focus:border-transparent`}`}
            />
            {nameErr && (
              <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                <FiAlertCircle size={11} /> {nameErr}
              </p>
            )}
            <p className="text-[11px] text-brand-dark/40 mt-1.5">Must be unique within the selected category.</p>
          </div>

          {/* Asset count notice — edit only */}
          {isEdit && item?.asset_count > 0 && (
            <div className="flex items-center gap-2.5 p-3 bg-brand-green/5 border border-brand-green/20 rounded-xl">
              <TbBox size={15} className="text-brand-green shrink-0" />
              <p className="text-xs text-brand-green-dark">
                <strong>{item.asset_count}</strong> asset{item.asset_count !== 1 ? 's' : ''} use
                this type — renaming takes effect immediately.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-brand-cream/60 shrink-0">
          <button onClick={onClose}
            className="flex-1 py-2.5 border border-brand-cream rounded-xl text-sm font-semibold text-brand-dark/60 hover:bg-brand-cream/30 transition">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition disabled:opacity-50 disabled:cursor-not-allowed ${colors.btn}`}>
            {saving ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving…
              </>
            ) : isEdit ? (
              <><FiSave size={14} /> Save Changes</>
            ) : (
              <><FiPlus size={14} /> Create Asset Type</>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

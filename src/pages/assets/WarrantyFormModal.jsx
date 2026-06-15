import { useState } from 'react';
import { HiOutlineShieldCheck } from 'react-icons/hi';

const inputCls = `w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500`;

export default function WarrantyFormModal({ onClose, onSubmit, loading, initial = null }) {
  const isEdit = !!initial;

  const [form, setForm] = useState({
    provider_name:          initial?.provider_name                    || '',
    warranty_period_months: initial?.warranty_period_months           || '',
    start_date:             initial?.start_date?.slice(0, 10)         || '',
    end_date:               initial?.end_date?.slice(0, 10)           || '',
    coverage_details:       initial?.coverage_details                 || '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleDateChange = (key, val) => {
    const updated = { ...form, [key]: val };
    if (updated.start_date && updated.end_date) {
      const start  = new Date(updated.start_date);
      const end    = new Date(updated.end_date);
      if (end > start) {
        const months = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24 * 30)));
        updated.warranty_period_months = months;
      }
    }
    setForm(updated);
  };

  const isExpired   = form.end_date && new Date(form.end_date) < new Date();
  const datesValid  = form.start_date && form.end_date;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">

        {/* ── Header ── */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
            <HiOutlineShieldCheck className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {isEdit ? 'Edit Warranty' : 'Add Warranty'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {isEdit ? 'Update warranty information' : 'Register a new warranty for this asset'}
            </p>
          </div>
          <button onClick={onClose}
            className="ml-auto w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition">
            ✕
          </button>
        </div>

        {/* ── Form ── */}
        <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="p-6 space-y-5">

          {/* Provider Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Provider Name *
            </label>
            <input
              required
              value={form.provider_name}
              onChange={e => set('provider_name', e.target.value)}
              placeholder="e.g. Dell Technologies, HP Support, Apple Care"
              className={inputCls}
            />
          </div>

          {/* Start + End Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Start Date *
              </label>
              <input
                required
                type="date"
                value={form.start_date}
                onChange={e => handleDateChange('start_date', e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                End Date *
              </label>
              <input
                required
                type="date"
                value={form.end_date}
                min={form.start_date || ''}
                onChange={e => handleDateChange('end_date', e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          {/* Warranty Period — auto calculated */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Warranty Period (months)
              <span className="ml-2 text-xs font-normal text-slate-400">(auto-calculated from dates)</span>
            </label>
            <input
              type="number"
              min="1"
              value={form.warranty_period_months}
              onChange={e => set('warranty_period_months', e.target.value)}
              placeholder="e.g. 12, 24, 36"
              className={inputCls}
            />
          </div>

          {/* Coverage Details */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Coverage Details
            </label>
            <textarea
              rows={3}
              value={form.coverage_details}
              onChange={e => set('coverage_details', e.target.value)}
              placeholder="e.g. Covers hardware defects, on-site support, parts and labour replacement..."
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Preview — only shown when dates are filled */}
          {datesValid && (
            <div className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-semibold
              ${isExpired
                ? 'bg-red-50 border-red-100 text-red-600'
                : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
              <span>{isExpired ? '⚠️ This warranty is already expired' : '✅ Warranty will be Active'}</span>
              {form.warranty_period_months && (
                <span className="text-xs font-medium opacity-75">
                  {form.warranty_period_months} month{form.warranty_period_months != 1 ? 's' : ''}
                </span>
              )}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold
                         text-slate-600 hover:bg-slate-50 transition">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300
                         text-white rounded-lg text-sm font-semibold transition">
              {loading
                ? (isEdit ? 'Saving...'    : 'Adding...')
                : (isEdit ? 'Save Changes' : 'Add Warranty')}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

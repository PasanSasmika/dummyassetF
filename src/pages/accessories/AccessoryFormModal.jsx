import { useState } from 'react';
import { FiX } from 'react-icons/fi';
import { TbTool } from 'react-icons/tb';

const AccessoryFormModal = ({ existing, onClose, onSubmit, loading }) => {
    const isEdit = !!existing;

    const [form, setForm] = useState({
        name:        existing?.name        || '',
        description: existing?.description || '',
        is_active:   existing?.is_active   ?? 1,
    });

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
    const canSubmit = form.name.trim().length > 0;

    const inputCls = `w-full px-3 py-2.5 rounded-xl border border-brand-cream bg-brand-offwhite
        text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-green
        focus:bg-white transition-all placeholder:text-brand-dark/30`;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">

                {/* Header */}
                <div className="flex items-center gap-3 px-6 py-5 border-b border-brand-cream/60">
                    <div className="w-10 h-10 rounded-xl bg-brand-green/10 flex items-center justify-center shrink-0">
                        <TbTool size={20} className="text-brand-green" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-brand-dark">
                            {isEdit ? 'Edit Accessory' : 'New Accessory'}
                        </h3>
                        <p className="text-xs text-brand-dark/40 mt-0.5">
                            {isEdit ? `Editing: ${existing.name}` : 'Add a new accessory to the catalog'}
                        </p>
                    </div>
                    <button onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-brand-dark/30 hover:bg-brand-cream/40 transition">
                        <FiX size={16} />
                    </button>
                </div>

                {/* Form Body */}
                <div className="px-6 py-5 space-y-5">

                    {/* Name */}
                    <div>
                        <label className="block text-xs font-bold text-brand-dark/50 uppercase tracking-wider mb-1.5">
                            Accessory Name <span className="text-red-400">*</span>
                        </label>
                        <input
                            value={form.name}
                            onChange={e => set('name', e.target.value)}
                            placeholder="e.g. USB-C Hub, HDMI Cable, Mouse..."
                            className={inputCls}
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-bold text-brand-dark/50 uppercase tracking-wider mb-1.5">
                            Description
                        </label>
                        <textarea
                            value={form.description}
                            onChange={e => set('description', e.target.value)}
                            rows={3}
                            placeholder="Optional — describe this accessory..."
                            className={`${inputCls} resize-none`}
                        />
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-xs font-bold text-brand-dark/50 uppercase tracking-wider mb-1.5">
                            Status
                        </label>
                        <div className="relative">
                            <select
                                value={form.is_active}
                                onChange={e => set('is_active', Number(e.target.value))}
                                className={`${inputCls} appearance-none cursor-pointer`}>
                                <option value={1}>Active</option>
                                <option value={0}>Inactive</option>
                            </select>
                            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                                <svg className="w-4 h-4 text-brand-dark/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                        <p className={`text-xs mt-1.5 font-medium ${form.is_active ? 'text-emerald-500' : 'text-red-400'}`}>
                            {form.is_active
                                ? '✓ Accessory is available for assignment'
                                : '✕ Inactive accessories cannot be assigned to assets'}
                        </p>
                    </div>

                    {/* Preview */}
                    {form.name.trim() && (
                        <div className="p-3 bg-brand-cream/30 rounded-xl border border-brand-cream">
                            <p className="text-[10px] font-bold text-brand-dark/40 uppercase tracking-wider mb-2">Preview</p>
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-white border border-brand-cream flex items-center justify-center shrink-0">
                                    <TbTool size={16} className="text-brand-green" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-brand-dark truncate">{form.name}</p>
                                    {form.description && (
                                        <p className="text-xs text-brand-dark/40 truncate">{form.description}</p>
                                    )}
                                </div>
                                <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-full
                                    ${form.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-brand-cream/60 text-brand-dark/40'}`}>
                                    {form.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex gap-3 px-6 py-4 border-t border-brand-cream/60">
                    <button onClick={onClose}
                        className="flex-1 py-2.5 border border-brand-cream rounded-xl text-sm font-semibold text-brand-dark/60 hover:bg-brand-cream/30 transition">
                        Cancel
                    </button>
                    <button
                        disabled={loading || !canSubmit}
                        onClick={() => onSubmit(form)}
                        className="flex-1 py-2.5 bg-brand-green hover:bg-brand-green-dark
                            disabled:opacity-40 disabled:cursor-not-allowed
                            text-brand-cream-light rounded-xl text-sm font-semibold transition">
                        {loading
                            ? (isEdit ? 'Updating...' : 'Creating...')
                            : (isEdit ? 'Update Accessory' : 'Create Accessory')}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default AccessoryFormModal;

import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    FiSearch, FiPlus, FiEdit2, FiTrash2, FiX,
    FiCalendar, FiToggleLeft, FiToggleRight,
} from 'react-icons/fi';
import {
    TbTool, TbTransfer, TbArrowBackUp,
    TbCircleDot, TbCircleCheck, TbClockExclamation,
} from 'react-icons/tb';
import { HiOutlineCube } from 'react-icons/hi';
import { MdOutlineAssignment } from 'react-icons/md';

import MainLayout    from '../../components/layout/MainLayout';
import Pagination    from '../../components/common/Pagination';
import StatsCard     from '../../components/common/StatsCard';
import usePagination from '../../hooks/usePagination';
import AccessoryForm from './AccessoryFormModal';

import {
    fetchAccessories,
    fetchAccessoryAssignments,
    createAccessory,
    updateAccessory,
    deleteAccessory,
    toggleAccessoryStatus,
    assignAccessory,
    returnAccessory,
    clearAccessoryMessages,
} from '../../features/accessories/accessorySlice';
import { fetchAssets } from '../../features/assets/assetSlice';

const safe = (v) => (Array.isArray(v) ? v : []);
const fmt  = (d) => d
    ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—';

const CONDITIONS = ['New', 'Good', 'Fair', 'Poor', 'Damaged'];

const CONDITION_COLORS = {
    New:     'bg-emerald-100 text-emerald-700',
    Good:    'bg-blue-100 text-blue-700',
    Fair:    'bg-amber-100 text-amber-700',
    Poor:    'bg-orange-100 text-orange-700',
    Damaged: 'bg-red-100 text-red-700',
};

const STATUS_COLORS = {
    Assigned: 'bg-blue-100 text-blue-700 ring-1 ring-blue-200',
    Returned: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
    Overdue:  'bg-red-100 text-red-700 ring-1 ring-red-200',
};

const STATUS_ICONS = {
    Assigned: TbCircleDot,
    Returned: TbCircleCheck,
    Overdue:  TbClockExclamation,
};

// shared classes
const inputCls = `w-full px-3 py-2.5 rounded-xl border border-brand-cream bg-brand-offwhite
    text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-green
    focus:bg-white transition-all placeholder:text-brand-dark/30`;

const selectCls = `px-3 py-2 rounded-lg border border-brand-cream bg-white text-sm
    text-brand-dark/70 focus:outline-none focus:ring-2 focus:ring-brand-green
    appearance-none transition-colors duration-150`;

const chevronDown = (
    <svg className="w-3.5 h-3.5 text-brand-dark/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
);

// ── Toast ─────────────────────────────────────────────────
const Toast = ({ message, type }) => (
    <div className={`fixed top-5 right-5 z-50 flex items-center gap-2
        px-4 py-3 rounded-xl shadow-lg text-sm font-medium
        ${type === 'success' ? 'bg-brand-green text-brand-cream-light' : 'bg-red-600 text-white'}`}>
        {type === 'success' ? '✅' : '❌'} {message}
    </div>
);

// ── Delete Confirm ────────────────────────────────────────
const DeleteConfirm = ({ accessory, onClose, onConfirm, loading }) => (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
                <FiTrash2 size={24} className="text-red-600" />
            </div>
            <h3 className="text-base font-bold text-brand-dark mb-1">Delete Accessory?</h3>
            <p className="text-sm text-brand-dark/50 mb-6">
                <strong>{accessory?.name}</strong> will be permanently deleted. This cannot be undone.
            </p>
            <div className="flex gap-3">
                <button onClick={onClose}
                    className="flex-1 py-2.5 border border-brand-cream rounded-xl
                        text-sm font-semibold text-brand-dark/60 hover:bg-brand-cream/30 transition">
                    Cancel
                </button>
                <button disabled={loading} onClick={onConfirm}
                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700
                        disabled:bg-red-300 text-white rounded-xl text-sm font-semibold transition">
                    {loading ? 'Deleting...' : 'Delete'}
                </button>
            </div>
        </div>
    </div>
);

// ── Assign Modal ──────────────────────────────────────────
const AssignModal = ({ accessories, assets, onClose, onSubmit, loading }) => {
    const [form, setForm] = useState({
        accessory_id:         '',
        asset_id:             '',
        quantity:             1,
        condition_out:        '',
        assigned_date:        new Date().toISOString().split('T')[0],
        expected_return_date: '',
        notes:                '',
    });
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const [assetSearch,   setAssetSearch]   = useState('');
    const [showAssetDrop, setShowAssetDrop] = useState(false);

    const activeAccessories = safe(accessories).filter(a => a.is_active);

    const filteredAssets = useMemo(() =>
        safe(assets).filter(a => {
            const q = assetSearch.toLowerCase();
            return (
                (a.name     || '').toLowerCase().includes(q) ||
                (a.asset_no || '').toLowerCase().includes(q)
            );
        }).slice(0, 50),
    [assets, assetSearch]);

    const selectedAsset = safe(assets).find(a => a.id === Number(form.asset_id));
    const canSubmit = form.accessory_id && form.asset_id;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col" style={{ maxHeight: '90vh' }}>

                <div className="flex items-center gap-3 px-6 py-5 border-b border-brand-cream/60 shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-brand-green/10 flex items-center justify-center shrink-0">
                        <TbTransfer size={20} className="text-brand-green" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-base font-bold text-brand-dark">Assign Accessory to Asset</h3>
                        <p className="text-xs text-brand-dark/40 mt-0.5">Link an accessory to an existing asset</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-brand-dark/30 hover:bg-brand-cream/40 transition">
                        <FiX size={16} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

                    {/* Accessory select */}
                    <div>
                        <label className="block text-xs font-bold text-brand-dark/50 uppercase tracking-wider mb-1.5">
                            Accessory <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                            <select value={form.accessory_id} onChange={e => set('accessory_id', e.target.value)}
                                className={`${inputCls} appearance-none`}>
                                <option value="">Select accessory...</option>
                                {activeAccessories.map(a => (
                                    <option key={a.id} value={a.id}>{a.name}</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">{chevronDown}</div>
                        </div>
                    </div>

                    {/* Asset searchable */}
                    <div>
                        <label className="block text-xs font-bold text-brand-dark/50 uppercase tracking-wider mb-1.5">
                            Asset <span className="text-red-400">*</span>
                        </label>
                        {selectedAsset ? (
                            <div className="flex items-center gap-3 p-3 bg-brand-green/5 border border-brand-green/20 rounded-xl">
                                <div className="w-8 h-8 rounded-lg bg-brand-green/10 flex items-center justify-center shrink-0">
                                    <HiOutlineCube size={16} className="text-brand-green" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-brand-dark truncate">{selectedAsset.name}</p>
                                    <p className="text-[10px] text-brand-dark/40 font-mono">
                                        {selectedAsset.asset_no}{selectedAsset.category && ` · ${selectedAsset.category}`}
                                    </p>
                                </div>
                                <button onClick={() => { set('asset_id', ''); setAssetSearch(''); }}
                                    className="text-brand-dark/20 hover:text-red-500 transition">
                                    <FiX size={14} />
                                </button>
                            </div>
                        ) : (
                            <div className="relative">
                                <FiSearch size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-dark/30" />
                                <input
                                    value={assetSearch}
                                    onChange={e => { setAssetSearch(e.target.value); setShowAssetDrop(true); set('asset_id', ''); }}
                                    onFocus={() => setShowAssetDrop(true)}
                                    placeholder="Search asset by name or asset no..."
                                    className={`${inputCls} pl-9`}
                                />
                                {showAssetDrop && assetSearch && (
                                    <div className="absolute top-full mt-1 left-0 w-full z-30 bg-white rounded-xl border border-brand-cream shadow-xl overflow-hidden">
                                        <div className="max-h-52 overflow-y-auto">
                                            {filteredAssets.length === 0 ? (
                                                <div className="py-6 text-center text-xs text-brand-dark/40">No assets found</div>
                                            ) : filteredAssets.map(a => (
                                                <button key={a.id}
                                                    onClick={() => { set('asset_id', a.id); setAssetSearch(''); setShowAssetDrop(false); }}
                                                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-brand-cream/20 transition">
                                                    <div className="w-8 h-8 rounded-lg bg-brand-cream/50 flex items-center justify-center shrink-0">
                                                        <HiOutlineCube size={14} className="text-brand-dark/40" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-semibold text-brand-dark truncate">{a.name}</p>
                                                        <p className="text-[10px] text-brand-dark/40 font-mono">{a.asset_no}{a.status && ` · ${a.status}`}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-brand-dark/50 uppercase tracking-wider mb-1.5">Assigned Date</label>
                            <input type="date" value={form.assigned_date} onChange={e => set('assigned_date', e.target.value)} className={inputCls} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-brand-dark/50 uppercase tracking-wider mb-1.5">Expected Return</label>
                            <input type="date" value={form.expected_return_date} min={new Date().toISOString().split('T')[0]} onChange={e => set('expected_return_date', e.target.value)} className={inputCls} />
                        </div>
                    </div>

                    {/* Condition + Quantity */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-brand-dark/50 uppercase tracking-wider mb-1.5">Condition Out</label>
                            <div className="relative">
                                <select value={form.condition_out} onChange={e => set('condition_out', e.target.value)} className={`${inputCls} appearance-none`}>
                                    <option value="">Not set</option>
                                    {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">{chevronDown}</div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-brand-dark/50 uppercase tracking-wider mb-1.5">Quantity</label>
                            <input type="number" min={1} value={form.quantity} onChange={e => set('quantity', Number(e.target.value))} className={inputCls} />
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-xs font-bold text-brand-dark/50 uppercase tracking-wider mb-1.5">Notes</label>
                        <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
                            placeholder="Optional notes..." className={`${inputCls} resize-none`} />
                    </div>
                </div>

                <div className="flex gap-3 px-6 py-4 border-t border-brand-cream/60 shrink-0">
                    <button onClick={onClose} className="flex-1 py-2.5 border border-brand-cream rounded-xl text-sm font-semibold text-brand-dark/60 hover:bg-brand-cream/30 transition">Cancel</button>
                    <button disabled={loading || !canSubmit}
                        onClick={() => onSubmit({
                            accessory_id:         Number(form.accessory_id),
                            asset_id:             Number(form.asset_id),
                            quantity:             form.quantity,
                            condition_out:        form.condition_out || null,
                            assigned_date:        form.assigned_date,
                            expected_return_date: form.expected_return_date || null,
                            notes:                form.notes || null,
                        })}
                        className="flex-1 py-2.5 bg-brand-green hover:bg-brand-green-dark
                            disabled:opacity-40 disabled:cursor-not-allowed
                            text-brand-cream-light rounded-xl text-sm font-semibold transition">
                        {loading ? 'Assigning...' : 'Confirm Assignment'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── Return Modal ──────────────────────────────────────────
const ReturnModal = ({ assignment, onClose, onSubmit, loading }) => {
    const [form, setForm] = useState({
        condition_in:       '',
        actual_return_date: new Date().toISOString().split('T')[0],
    });
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">

                <div className="flex items-center gap-3 px-6 py-5 border-b border-brand-cream/60">
                    <div className="w-10 h-10 rounded-xl bg-brand-green/10 flex items-center justify-center shrink-0">
                        <TbArrowBackUp size={20} className="text-brand-green" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-base font-bold text-brand-dark">Return Accessory</h3>
                        <p className="text-xs text-brand-dark/40 mt-0.5">#{assignment?.id} · {assignment?.accessory_name}</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-brand-dark/30 hover:bg-brand-cream/40 transition">
                        <FiX size={16} />
                    </button>
                </div>

                <div className="mx-6 mt-5 p-3 bg-brand-cream/30 border border-brand-cream rounded-xl">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-brand-cream flex items-center justify-center shrink-0">
                            <HiOutlineCube size={15} className="text-brand-dark/50" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-bold text-brand-dark">{assignment?.accessory_name}</p>
                            <p className="text-xs text-brand-dark/50">
                                On asset: <strong>{assignment?.asset_name}</strong>
                                {assignment?.asset_no && ` (${assignment.asset_no})`}
                                {assignment?.quantity > 1 && ` · Qty: ${assignment.quantity}`}
                                {assignment?.condition_out && ` · Out: ${assignment.condition_out}`}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-5 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-brand-dark/50 uppercase tracking-wider mb-1.5">Return Date</label>
                        <input type="date" value={form.actual_return_date}
                            max={new Date().toISOString().split('T')[0]}
                            onChange={e => set('actual_return_date', e.target.value)}
                            className={inputCls} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-brand-dark/50 uppercase tracking-wider mb-2">Condition at Return</label>
                        <div className="flex gap-2 flex-wrap">
                            {CONDITIONS.map(c => (
                                <button key={c} type="button" onClick={() => set('condition_in', c)}
                                    className={`px-3 py-1.5 rounded-lg border-2 text-xs font-bold transition-all
                                        ${form.condition_in === c
                                            ? 'border-brand-green bg-brand-green/10 text-brand-green-dark'
                                            : 'border-brand-cream text-brand-dark/50 hover:border-brand-green/30'}`}>
                                    {c}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 px-6 py-4 border-t border-brand-cream/60">
                    <button onClick={onClose} className="flex-1 py-2.5 border border-brand-cream rounded-xl text-sm font-semibold text-brand-dark/60 hover:bg-brand-cream/30 transition">Cancel</button>
                    <button disabled={loading} onClick={() => onSubmit(form)}
                        className="flex-1 py-2.5 bg-brand-green hover:bg-brand-green-dark
                            disabled:opacity-40 text-brand-cream-light rounded-xl text-sm font-semibold transition">
                        {loading ? 'Processing...' : 'Confirm Return'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── Main Page ─────────────────────────────────────────────
export default function AccessoriesPage() {
    const dispatch = useDispatch();

    const { list, assignments, loading, saving, error, success } = useSelector(s => s.accessories);
    const { list: rawAssets } = useSelector(s => s.assets);

    const accessories     = safe(list);
    const assets          = safe(rawAssets);
    const assignmentsList = safe(assignments);

    const [activeTab,    setActiveTab]    = useState('accessories');
    const [showForm,     setShowForm]     = useState(false);
    const [editItem,     setEditItem]     = useState(null);
    const [deleteItem,   setDeleteItem]   = useState(null);
    const [showAssign,   setShowAssign]   = useState(false);
    const [returnItem,   setReturnItem]   = useState(null);
    const [search,       setSearch]       = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [assignFilter, setAssignFilter] = useState('');

    useEffect(() => {
        dispatch(fetchAccessories());
        dispatch(fetchAccessoryAssignments());
        dispatch(fetchAssets());
    }, []);

    useEffect(() => {
        if (!success && !error) return;
        if (success) {
            setShowForm(false); setEditItem(null);
            setDeleteItem(null); setShowAssign(false); setReturnItem(null);
            dispatch(fetchAccessories());
            dispatch(fetchAccessoryAssignments());
        }
        const t = setTimeout(() => dispatch(clearAccessoryMessages()), 3500);
        return () => clearTimeout(t);
    }, [success, error]);

    const filteredAcc = useMemo(() =>
        accessories.filter(a => {
            const q = search.toLowerCase();
            const hit = (a.name || '').toLowerCase().includes(q) || (a.description || '').toLowerCase().includes(q);
            const matchStatus = !statusFilter ? true : statusFilter === 'active' ? a.is_active : !a.is_active;
            return hit && matchStatus;
        }), [accessories, search, statusFilter]);

    const filteredAssign = useMemo(() =>
        assignmentsList.filter(a => {
            const q = search.toLowerCase();
            const hit =
                (a.accessory_name    || '').toLowerCase().includes(q) ||
                (a.asset_name        || '').toLowerCase().includes(q) ||
                (a.asset_no          || '').toLowerCase().includes(q) ||
                (a.asset_holder_name || '').toLowerCase().includes(q) ||
                String(a.id).includes(q);
            const effectiveStatus = a.display_status || a.status;
            return hit && (!assignFilter || effectiveStatus === assignFilter);
        }), [assignmentsList, search, assignFilter]);

    const accPag = usePagination(filteredAcc,    10);
    const assPag = usePagination(filteredAssign, 10);

    const handleCreate = (data) => dispatch(createAccessory(data));
    const handleUpdate = (data) => dispatch(updateAccessory({ id: editItem.id, data }));
    const handleDelete = ()     => dispatch(deleteAccessory(deleteItem.id));
    const handleToggle = (id)   => dispatch(toggleAccessoryStatus(id));
    const handleAssign = (data) => dispatch(assignAccessory(data));
    const handleReturn = (data) => dispatch(returnAccessory({ assignmentId: returnItem.id, data }));

    const totalActive   = accessories.filter(a =>  a.is_active).length;
    const totalAssigned = assignmentsList.filter(a => ['Assigned', 'Overdue'].includes(a.display_status || a.status)).length;
    const totalOverdue  = assignmentsList.filter(a => (a.display_status || a.status) === 'Overdue').length;

    return (
        <MainLayout title="Accessories" subtitle="Manage accessories and asset assignments">

            {(success || error) && <Toast message={success || error} type={success ? 'success' : 'error'} />}

            {/* ── Stats ── */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <StatsCard label="Total"    value={accessories.length} icon="inventory" color="green"   sub="In catalog" />
                <StatsCard label="Active"   value={totalActive}        icon="active"    color="emerald" sub="Assignable" />
                <StatsCard label="Assigned" value={totalAssigned}      icon="ticket"    color="blue"    sub="Out with assets" />
                <StatsCard label="Overdue"  value={totalOverdue}       icon="warning"   color="red"     sub="Past return date" />
            </div>

            {/* ── Toolbar ── */}
            <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-dark/30" />
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder={activeTab === 'accessories' ? 'Search accessories...' : 'Search by accessory, asset, or holder...'}
                            className="pl-9 pr-4 py-2 rounded-lg border border-brand-cream bg-white text-sm w-64
                                focus:outline-none focus:ring-2 focus:ring-brand-green
                                placeholder:text-brand-dark/30 text-brand-dark transition-all" />
                    </div>

                    {activeTab === 'accessories' && (
                        <div className="relative">
                            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={`${selectCls} pr-8`}>
                                <option value="">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                            <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">{chevronDown}</div>
                        </div>
                    )}

                    {activeTab === 'assignments' && (
                        <div className="relative">
                            <select value={assignFilter} onChange={e => setAssignFilter(e.target.value)} className={`${selectCls} pr-8`}>
                                <option value="">All Status</option>
                                <option value="Assigned">Assigned</option>
                                <option value="Overdue">Overdue</option>
                                <option value="Returned">Returned</option>
                            </select>
                            <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">{chevronDown}</div>
                        </div>
                    )}
                </div>

                <div className="flex">
                    <button onClick={() => { setEditItem(null); setShowForm(true); }}
                        className="flex items-center gap-2 px-4 py-2 bg-brand-green hover:bg-brand-green-dark
                            text-brand-cream-light text-sm font-semibold rounded-lg transition-colors duration-150 shadow-sm">
                        <FiPlus size={15} /> Add Accessory
                    </button>
                </div>
            </div>

            {/* ── Tabs ── */}
            <div className="flex items-center gap-1 mb-4 bg-brand-cream/40 rounded-xl p-1 w-fit">
                {[
                    { key: 'accessories', label: 'Accessories', count: accessories.length     },
                    { key: 'assignments', label: 'Assignments', count: assignmentsList.length },
                ].map(tab => (
                    <button key={tab.key} onClick={() => { setActiveTab(tab.key); setSearch(''); }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all
                            ${activeTab === tab.key
                                ? 'bg-white text-brand-dark shadow-sm'
                                : 'text-brand-dark/50 hover:text-brand-dark'}`}>
                        {tab.label}
                        <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold
                            ${activeTab === tab.key ? 'bg-brand-cream/60 text-brand-dark' : 'bg-white/50 text-brand-dark/30'}`}>
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* ══ ACCESSORIES TABLE ══ */}
            {activeTab === 'accessories' && (
                <div className="bg-white rounded-2xl border border-brand-cream/60 shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-brand-cream/30 border-b border-brand-cream/60">
                                {['#', 'Name', 'Description', 'Status', 'Active / Total', 'Created', 'Actions'].map(h => (
                                    <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-brand-dark/40 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-cream/30">
                            {loading ? (
                                <tr><td colSpan={7} className="py-12 text-center">
                                    <svg className="animate-spin w-6 h-6 mx-auto mb-2 text-brand-green" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    <p className="text-sm text-brand-dark/40">Loading...</p>
                                </td></tr>
                            ) : accPag.paginated.length === 0 ? (
                                <tr><td colSpan={7} className="py-16 text-center">
                                    <div className="w-14 h-14 rounded-full bg-brand-cream/50 flex items-center justify-center mx-auto mb-3">
                                        <TbTool size={26} className="text-brand-dark/20" />
                                    </div>
                                    <p className="text-sm font-semibold text-brand-dark/50">No accessories found</p>
                                    <button onClick={() => { setEditItem(null); setShowForm(true); }}
                                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-brand-green hover:bg-brand-green-dark text-brand-cream-light text-sm font-semibold rounded-lg transition">
                                        <FiPlus size={14} /> Add First Accessory
                                    </button>
                                </td></tr>
                            ) : accPag.paginated.map(a => (
                                <tr key={a.id} className="hover:bg-brand-cream/20 transition-colors">
                                    <td className="px-4 py-4"><span className="text-xs font-mono text-brand-dark/30">#{a.id}</span></td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-9 h-9 rounded-xl bg-brand-green/10 flex items-center justify-center shrink-0">
                                                <TbTool size={16} className="text-brand-green" />
                                            </div>
                                            <p className="text-sm font-semibold text-brand-dark">{a.name}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <p className="text-sm text-brand-dark/50 truncate max-w-[200px]">{a.description || '—'}</p>
                                    </td>
                                    <td className="px-4 py-4">
                                        <button onClick={() => handleToggle(a.id)} title="Click to toggle"
                                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition cursor-pointer
                                                ${a.is_active
                                                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                                    : 'bg-brand-cream/60 text-brand-dark/40 hover:bg-brand-cream'}`}>
                                            {a.is_active
                                                ? <><FiToggleRight size={12} /> Active</>
                                                : <><FiToggleLeft  size={12} /> Inactive</>}
                                        </button>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-brand-green">{a.active_assignments || 0}</span>
                                            <span className="text-xs text-brand-dark/20">/</span>
                                            <span className="text-xs text-brand-dark/50">{a.total_assignments || 0}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4"><span className="text-xs text-brand-dark/40">{fmt(a.created_at)}</span></td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-1.5">
                                            <button onClick={() => { setEditItem(a); setShowForm(true); }}
                                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-brand-green/10 hover:bg-brand-green/20 text-brand-green transition-colors duration-150">
                                                <FiEdit2 size={13} />
                                            </button>
                                            <button onClick={() => setDeleteItem(a)}
                                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition-colors duration-150">
                                                <FiTrash2 size={13} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <Pagination currentPage={accPag.currentPage} totalPages={accPag.totalPages} onPageChange={accPag.setCurrentPage} />
                </div>
            )}

            {/* ══ ASSIGNMENTS TABLE ══ */}
            {activeTab === 'assignments' && (
                <div className="bg-white rounded-2xl border border-brand-cream/60 shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-brand-cream/30 border-b border-brand-cream/60">
                                {['#', 'Accessory', 'Asset', 'Held By', 'Qty', 'Assigned', 'Expected Return', 'Condition', 'Status', 'Action'].map(h => (
                                    <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-brand-dark/40 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-cream/30">
                            {loading ? (
                                <tr><td colSpan={10} className="py-12 text-center">
                                    <svg className="animate-spin w-6 h-6 mx-auto mb-2 text-brand-green" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    <p className="text-sm text-brand-dark/40">Loading...</p>
                                </td></tr>
                            ) : assPag.paginated.length === 0 ? (
                                <tr><td colSpan={10} className="py-16 text-center">
                                    <div className="w-14 h-14 rounded-full bg-brand-cream/50 flex items-center justify-center mx-auto mb-3">
                                        <MdOutlineAssignment size={26} className="text-brand-dark/20" />
                                    </div>
                                    <p className="text-sm font-semibold text-brand-dark/50">No assignments found</p>
                                </td></tr>
                            ) : assPag.paginated.map(a => {
                                const effectiveStatus = a.display_status || a.status;
                                const StatusIcon = STATUS_ICONS[effectiveStatus] || TbCircleDot;
                                const isActive  = ['Assigned', 'Overdue'].includes(effectiveStatus);
                                const isOverdue = effectiveStatus === 'Overdue';

                                return (
                                    <tr key={a.id} className={`transition-colors ${isOverdue ? 'bg-red-50/40 hover:bg-red-50' : 'hover:bg-brand-cream/20'}`}>
                                        <td className="px-4 py-4"><span className="text-xs font-mono text-brand-dark/30">#{a.id}</span></td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-xl bg-brand-green/10 flex items-center justify-center shrink-0">
                                                    <TbTool size={14} className="text-brand-green" />
                                                </div>
                                                <p className="text-sm font-semibold text-brand-dark truncate max-w-[110px]">{a.accessory_name}</p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-xl bg-brand-cream/50 flex items-center justify-center shrink-0">
                                                    <HiOutlineCube size={14} className="text-brand-dark/40" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-brand-dark/80 truncate max-w-[110px]">{a.asset_name || '—'}</p>
                                                    <p className="text-[10px] text-brand-dark/40 font-mono">{a.asset_no || ''}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            {a.asset_holder_name ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-full bg-brand-green/10 flex items-center justify-center shrink-0 text-[11px] font-black text-brand-green">
                                                        {a.asset_holder_name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-semibold text-brand-dark truncate max-w-[100px]">{a.asset_holder_name}</p>
                                                        {a.asset_holder_designation && <p className="text-[10px] text-brand-dark/40 truncate max-w-[100px]">{a.asset_holder_designation}</p>}
                                                    </div>
                                                </div>
                                            ) : <span className="text-xs text-brand-dark/20 italic">Unassigned</span>}
                                        </td>
                                        <td className="px-4 py-4"><span className="text-sm font-bold text-brand-dark">{a.quantity || 1}</span></td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-1.5 text-xs text-brand-dark/60">
                                                <FiCalendar size={11} className="text-brand-dark/30 shrink-0" />
                                                {fmt(a.assigned_date)}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            {a.expected_return_date ? (
                                                <div>
                                                    <p className={`text-sm font-medium ${isOverdue ? 'text-red-600' : 'text-brand-dark/60'}`}>{fmt(a.expected_return_date)}</p>
                                                    {a.days_until_due !== null && isActive && (
                                                        <p className={`text-[10px] font-bold mt-0.5
                                                            ${a.days_until_due < 0 ? 'text-red-500' : a.days_until_due <= 3 ? 'text-orange-500' : 'text-brand-dark/30'}`}>
                                                            {a.days_until_due < 0 ? `${Math.abs(a.days_until_due)}d overdue` : a.days_until_due === 0 ? '⚠ Due today' : `${a.days_until_due}d left`}
                                                        </p>
                                                    )}
                                                </div>
                                            ) : <span className="text-xs text-brand-dark/20">Open-ended</span>}
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="space-y-1">
                                                {a.condition_out && <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${CONDITION_COLORS[a.condition_out] || 'bg-slate-100 text-slate-500'}`}>Out: {a.condition_out}</span>}
                                                {a.condition_in  && <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${CONDITION_COLORS[a.condition_in]  || 'bg-slate-100 text-slate-500'}`}>In: {a.condition_in}</span>}
                                                {!a.condition_out && !a.condition_in && <span className="text-xs text-brand-dark/20">—</span>}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[effectiveStatus] || 'bg-slate-100 text-slate-500'}`}>
                                                <StatusIcon size={11} /> {effectiveStatus}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            {isActive ? (
                                                <button onClick={() => setReturnItem(a)}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors duration-150
                                                        ${isOverdue
                                                            ? 'bg-red-100 hover:bg-red-200 text-red-700'
                                                            : 'bg-brand-green/10 hover:bg-brand-green/20 text-brand-green'}`}>
                                                    <TbArrowBackUp size={13} /> Return
                                                </button>
                                            ) : <span className="text-xs text-brand-dark/20">—</span>}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    <Pagination currentPage={assPag.currentPage} totalPages={assPag.totalPages} onPageChange={assPag.setCurrentPage} />
                </div>
            )}

            {/* ── Modals ── */}
            {showForm && <AccessoryForm existing={editItem} onClose={() => { setShowForm(false); setEditItem(null); }} onSubmit={editItem ? handleUpdate : handleCreate} loading={saving} />}
            {deleteItem && <DeleteConfirm accessory={deleteItem} onClose={() => setDeleteItem(null)} onConfirm={handleDelete} loading={saving} />}
            {showAssign && <AssignModal accessories={accessories} assets={assets} onClose={() => setShowAssign(false)} onSubmit={handleAssign} loading={saving} />}
            {returnItem && <ReturnModal assignment={returnItem} onClose={() => setReturnItem(null)} onSubmit={handleReturn} loading={saving} />}

        </MainLayout>
    );
}

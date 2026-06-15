// src/pages/Repairs/index.jsx
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate }              from 'react-router-dom';
import {
  fetchAllRepairs, updateRepair, deleteRepair, clearRepairMessages,
} from '../../features/repairs/repairSlice';
import MainLayout    from '../../components/layout/MainLayout';
import Pagination    from '../../components/common/Pagination';
import StatsCard     from '../../components/common/StatsCard';
import usePagination from '../../hooks/usePagination';
import { FiSearch, FiTrash2, FiEdit2, FiAlertTriangle } from 'react-icons/fi';
import {
  TbTool, TbAlertTriangle, TbReplace, TbShieldCheck,
  TbCircleDot, TbCircleCheck, TbClockExclamation, TbX, TbCheck,
  TbPlus,
} from 'react-icons/tb';
import { HiOutlineCube, HiOutlineEye } from 'react-icons/hi';

const safeList = (v) => (Array.isArray(v) ? v : []);

const fmt = (d) => d
  ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  : '—';

const REPAIR_STATUS_STYLES = {
  'Pending':       { bg: 'bg-slate-100',   text: 'text-slate-600',   icon: TbCircleDot      },
  'In Progress':   { bg: 'bg-blue-100',    text: 'text-blue-700',    icon: TbTool           },
  'Completed':     { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: TbCircleCheck    },
  'Cannot Repair': { bg: 'bg-red-100',     text: 'text-red-700',     icon: TbX              },
  'Replaced':      { bg: 'bg-purple-100',  text: 'text-purple-700',  icon: TbReplace        },
};

const REPAIR_TYPE_STYLES = {
  Service:     { bg: 'bg-blue-100',   text: 'text-blue-700',   icon: TbTool          },
  Damage:      { bg: 'bg-amber-100',  text: 'text-amber-700',  icon: TbAlertTriangle },
  Replacement: { bg: 'bg-purple-100', text: 'text-purple-700', icon: TbReplace       },
};

// ── Toast ─────────────────────────────────────────────────
const Toast = ({ message, type }) => (
  <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3
    rounded-xl shadow-lg text-sm font-medium
    ${type === 'success' ? 'bg-brand-green text-brand-cream-light' : 'bg-red-600 text-white'}`}>
    {type === 'success' ? '✅' : '❌'} {message}
  </div>
);

// ── Update Status Modal ───────────────────────────────────
function UpdateStatusModal({ repair, onClose, onSubmit, saving }) {
  const [status,          setStatus]    = useState(repair.status);
  const [vendor_name,     setVendor]    = useState(repair.vendor_name || '');
  const [repair_cost,     setCost]      = useState(repair.repair_cost ?? '');
  const [completion_date, setCompDate]  = useState(repair.completion_date?.split('T')[0] || '');
  const [description,     setDesc]      = useState(repair.description || '');

  const STATUSES = ['Pending', 'In Progress', 'Completed', 'Cannot Repair', 'Replaced'];

  const inputCls = `w-full px-3 py-2.5 rounded-xl border border-brand-cream text-sm text-brand-dark
    focus:outline-none focus:ring-2 focus:ring-brand-green transition-colors duration-150`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.55)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">

        <div className="flex items-center gap-3 px-6 py-5 border-b border-brand-cream/60">
          <div className="w-9 h-9 rounded-xl bg-brand-green/10 flex items-center justify-center shrink-0">
            <TbTool size={17} className="text-brand-green" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-black text-brand-dark">Update Repair</h2>
            <p className="text-xs text-brand-dark/40 truncate">
              {repair.asset_name} · {repair.repair_type}
            </p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg
              hover:bg-brand-cream/40 text-brand-dark/30 text-lg font-bold transition">
            ×
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">

          {/* Status */}
          <div>
            <label className="block text-xs font-bold text-brand-dark/60 mb-2">Status</label>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map(s => {
                const st = REPAIR_STATUS_STYLES[s] || REPAIR_STATUS_STYLES['Pending'];
                return (
                  <button key={s} type="button" onClick={() => setStatus(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition
                      ${status === s
                        ? `${st.bg} ${st.text} border-transparent`
                        : 'bg-white text-brand-dark/40 border-brand-cream hover:border-brand-green/30'}`}>
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-brand-dark/60 mb-1.5">Vendor</label>
              <input type="text" value={vendor_name} onChange={e => setVendor(e.target.value)}
                className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-bold text-brand-dark/60 mb-1.5">
                Cost {repair.warranty_covered ? <span className="text-emerald-600 font-black">(Warranty)</span> : ''}
              </label>
              <input type="number" value={repair_cost}
                disabled={!!repair.warranty_covered}
                onChange={e => setCost(e.target.value)}
                className={`${inputCls} ${repair.warranty_covered ? 'bg-emerald-50 border-emerald-200 text-emerald-700 cursor-not-allowed' : ''}`}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-dark/60 mb-1.5">Completion Date</label>
            <input type="date" value={completion_date} onChange={e => setCompDate(e.target.value)}
              className={inputCls} />
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-dark/60 mb-1.5">Notes</label>
            <textarea rows={2} value={description} onChange={e => setDesc(e.target.value)}
              className={`${inputCls} resize-none`} />
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-5">
          <button onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-brand-cream
              text-sm font-semibold text-brand-dark/60 hover:bg-brand-cream/30 transition">
            Cancel
          </button>
          <button
            onClick={() => onSubmit({ status, vendor_name, repair_cost: repair_cost !== '' ? parseFloat(repair_cost) : undefined, completion_date: completion_date || undefined, description })}
            disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-xl bg-brand-green hover:bg-brand-green-dark
              text-brand-cream-light text-sm font-bold transition disabled:opacity-50
              flex items-center justify-center gap-2">
            {saving
              ? <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              : <TbCheck size={15} />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────
export default function Repairs() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list, total, loading, saving, error, success } = useSelector(s => s.repairs);
  const repairs = safeList(list);

  // Input states
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter,   setTypeFilter]   = useState('');

  // Applied states (trigger filtering only on submit)
  const [appliedSearch,       setAppliedSearch]       = useState('');
  const [appliedStatusFilter, setAppliedStatusFilter] = useState('');
  const [appliedTypeFilter,   setAppliedTypeFilter]   = useState('');

  const [editRepair,   setEditRepair]   = useState(null);
  const [deleteId,     setDeleteId]     = useState(null);

  useEffect(() => {
    dispatch(fetchAllRepairs({ page: 1, limit: 200 }));
  }, []);

  useEffect(() => {
    if (!success && !error) return;
    if (success) {
      dispatch(fetchAllRepairs({ page: 1, limit: 200 }));
      setEditRepair(null);
      setDeleteId(null);
    }
    const t = setTimeout(() => dispatch(clearRepairMessages()), 3500);
    return () => clearTimeout(t);
  }, [success, error]);

  // Handlers for Submit and Clear
  const handleApplyFilters = () => {
    setAppliedSearch(search);
    setAppliedStatusFilter(statusFilter);
    setAppliedTypeFilter(typeFilter);
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setTypeFilter('');
    setAppliedSearch('');
    setAppliedStatusFilter('');
    setAppliedTypeFilter('');
  };

  // ── Stats ──
  const pending    = repairs.filter(r => r.status === 'Pending').length;
  const inProgress = repairs.filter(r => r.status === 'In Progress').length;
  const completed  = repairs.filter(r => r.status === 'Completed').length;
  const covered    = repairs.filter(r => r.warranty_covered).length;

  // ── Filter (uses applied states) ──
  const filtered = repairs.filter(r => {
    const text = `${r.asset_name} ${r.asset_no} ${r.vendor_name || ''} ${r.description || ''}`.toLowerCase();
    return (
      text.includes(appliedSearch.toLowerCase()) &&
      (appliedStatusFilter ? r.status      === appliedStatusFilter : true) &&
      (appliedTypeFilter   ? r.repair_type === appliedTypeFilter   : true)
    );
  });

  const {
    paginated, currentPage, totalPages,
    setCurrentPage, reset, startIndex, endIndex, totalItems,
  } = usePagination(filtered, 12);

  // Reset pagination only when applied filters change
  useEffect(() => { reset(); }, [appliedSearch, appliedStatusFilter, appliedTypeFilter]);

  const handleUpdateSubmit = (repairId, data) => dispatch(updateRepair({ repairId, data }));
  const handleDelete       = (repairId)        => dispatch(deleteRepair(repairId));

  const selectCls = `px-3 py-2 rounded-lg border border-brand-cream bg-white text-sm
    focus:outline-none focus:ring-2 focus:ring-brand-green text-brand-dark/70
    transition-colors duration-150`;

  return (
    <MainLayout title="Asset Repairs" subtitle="Track and manage all repair records">

      {(success || error) && (
        <Toast message={success || error} type={success ? 'success' : 'error'} />
      )}

      {/* ── Stats ── */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatsCard label="Total"           value={repairs.length} icon="settings" color="green"   sub="All repair records" />
        <StatsCard label="Pending"         value={pending}        icon="warning"  color="amber"   sub="Awaiting action" />
        <StatsCard label="In Progress"     value={inProgress}     icon="settings" color="blue"    sub="Currently being repaired" />
        <StatsCard label="Warranty Covered" value={covered}       icon="shield"   color="emerald" sub="Repaired free of charge" />
      </div>

      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-dark/30" />
            <input
              placeholder="Search asset, vendor, description..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleApplyFilters()}
              className="pl-9 pr-4 py-2 rounded-lg border border-brand-cream bg-white text-sm
                w-64 focus:outline-none focus:ring-2 focus:ring-brand-green
                placeholder:text-brand-dark/30 text-brand-dark transition-colors duration-150"
            />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={selectCls}>
            <option value="">All Status</option>
            {['Pending','In Progress','Completed','Cannot Repair','Replaced'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className={selectCls}>
            <option value="">All Types</option>
            <option value="Service">Service</option>
            <option value="Damage">Damage</option>
            <option value="Replacement">Replacement</option>
          </select>

          {/* Submit and Clear Buttons */}
          <button 
            onClick={handleApplyFilters}
            className="px-4 py-2 bg-brand-green hover:bg-brand-green-dark text-white text-sm font-semibold rounded-lg transition-colors duration-150"
          >
            Submit
          </button>
          <button 
            onClick={handleClearFilters}
            className="px-4 py-2 bg-brand-cream/50 hover:bg-brand-cream text-brand-dark text-sm font-semibold rounded-lg transition-colors duration-150 border border-brand-cream"
          >
            Clear
          </button>

          {(appliedSearch || appliedStatusFilter || appliedTypeFilter) && (
            <span className="text-xs text-brand-dark/40">{totalItems} result{totalItems !== 1 ? 's' : ''}</span>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl border border-brand-cream/60 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-brand-cream/30 border-b border-brand-cream/60">
              {['Asset', 'Type', 'Status', 'Vendor', 'Cost', 'Start', 'Reported By', 'Actions'].map(h => (
                <th key={h}
                  className="px-4 py-3.5 text-left text-xs font-semibold text-brand-dark/40
                    uppercase tracking-wider whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-cream/30">
            {loading ? (
              <tr><td colSpan={8} className="py-12 text-center">
                <svg className="animate-spin w-5 h-5 mx-auto mb-2 text-brand-green"
                  fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                <p className="text-sm text-brand-dark/40">Loading repairs...</p>
              </td></tr>

            ) : paginated.length === 0 ? (
              <tr><td colSpan={8} className="py-14 text-center">
                <div className="w-14 h-14 rounded-full bg-brand-cream/50 flex items-center justify-center mx-auto mb-3">
                  <TbTool size={26} className="text-brand-dark/20" />
                </div>
                <p className="text-sm font-semibold text-brand-dark/50">No repairs found</p>
                <p className="text-xs text-brand-dark/30 mt-1">
                  {appliedSearch || appliedStatusFilter || appliedTypeFilter ? 'Try adjusting your filters' : 'No repair records yet'}
                </p>
              </td></tr>

            ) : paginated.map(r => {
              const ss = REPAIR_STATUS_STYLES[r.status]      || REPAIR_STATUS_STYLES['Pending'];
              const ts = REPAIR_TYPE_STYLES[r.repair_type]   || REPAIR_TYPE_STYLES['Service'];
              const SI = ss.icon;
              const TI = ts.icon;

              return (
                <tr key={r.id} className="hover:bg-brand-cream/20 transition-colors">

                  {/* Asset */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-brand-green/10 flex items-center justify-center shrink-0">
                        <TbTool size={14} className="text-brand-green" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-brand-dark truncate max-w-[110px]">{r.asset_name}</p>
                        <p className="text-[10px] font-mono text-brand-dark/40">{r.asset_no}</p>
                      </div>
                    </div>
                  </td>

                  {/* Type */}
                  <td className="px-4 py-4">
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold ${ts.bg} ${ts.text}`}>
                      <TI size={11} /> {r.repair_type}
                      {r.warranty_covered && (
                        <span className="ml-1 px-1.5 py-0.5 bg-emerald-200 text-emerald-800 text-[9px] font-black rounded">FREE</span>
                      )}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-4">
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold ${ss.bg} ${ss.text}`}>
                      <SI size={11} /> {r.status}
                    </div>
                  </td>

                  {/* Vendor */}
                  <td className="px-4 py-4">
                    <p className="text-sm text-brand-dark/60 max-w-[100px] truncate">
                      {r.vendor_name || <span className="text-brand-dark/20">—</span>}
                    </p>
                  </td>

                  {/* Cost */}
                  <td className="px-4 py-4">
                    {r.warranty_covered ? (
                      <span className="text-emerald-600 font-bold text-sm">Free</span>
                    ) : r.repair_cost != null ? (
                      <span className="text-sm font-semibold text-brand-dark">
                        ${parseFloat(r.repair_cost).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    ) : (
                      <span className="text-brand-dark/20 text-sm">—</span>
                    )}
                  </td>

                  {/* Start */}
                  <td className="px-4 py-4 text-sm text-brand-dark/60">{fmt(r.start_date)}</td>

                  {/* Reporter */}
                  <td className="px-4 py-4">
                    <p className="text-sm text-brand-dark/60 truncate max-w-[90px]">{r.reported_by_name}</p>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => navigate(`/assets/${r.asset_id}`)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg
                          bg-brand-cream/50 hover:bg-brand-cream text-brand-dark/50 transition-colors duration-150"
                        title="View Asset">
                        <HiOutlineEye size={13} />
                      </button>
                      <button onClick={() => setEditRepair(r)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg
                          bg-brand-green/10 hover:bg-brand-green/20 text-brand-green transition-colors duration-150"
                        title="Update Repair">
                        <FiEdit2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      {totalItems > 0 && (
        <p className="text-xs text-brand-dark/40 mt-3 px-1">
          Showing {startIndex}–{endIndex} of {totalItems} repairs
        </p>
      )}

      {/* ── Update Modal ── */}
      {editRepair && (
        <UpdateStatusModal
          repair={editRepair}
          onClose={() => setEditRepair(null)}
          onSubmit={(data) => handleUpdateSubmit(editRepair.id, data)}
          saving={saving}
        />
      )}

      {/* ── Delete Confirm ── */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(15,23,42,0.55)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <FiTrash2 size={22} className="text-red-600" />
            </div>
            <h3 className="text-base font-black text-brand-dark mb-1">Delete Repair Record?</h3>
            <p className="text-sm text-brand-dark/50 mb-6">
              The asset will be restored to <strong>Available</strong> if it was In Repair.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 border border-brand-cream rounded-xl text-sm
                  font-semibold text-brand-dark/60 hover:bg-brand-cream/30 transition">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteId)} disabled={saving}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white
                  rounded-xl text-sm font-bold transition disabled:opacity-50">
                {saving ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </MainLayout>
  );
}
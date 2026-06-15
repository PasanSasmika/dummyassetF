import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  fetchAllSalvaged,
  unsalvageAsset,
  clearSalvageMessages,
} from '../../features/salvage/salvageSlice';
import MainLayout    from '../../components/layout/MainLayout';
import Pagination    from '../../components/common/Pagination';
import StatsCard     from '../../components/common/StatsCard';
import usePagination from '../../hooks/usePagination';
import {
  TbTrash, TbTrashOff, TbSearch, TbCalendar,
  TbUserCheck, TbServer, TbTool, TbShieldLock,
  TbFileText, TbDeviceDesktop, TbDoor, TbRefresh,
} from 'react-icons/tb';
import {
  HiOutlineCube, HiOutlineEye,
} from 'react-icons/hi';
import { FiSearch, FiAlertTriangle } from 'react-icons/fi';

// ── Maps ──────────────────────────────────────────────────
const CATEGORY_ICONS = {
  'Human':                TbUserCheck,
  'IT Infrastructure':    TbServer,
  'Service':              TbTool,
  'Digital':              TbShieldLock,
  'Tangible Information': TbFileText,
  'End User':             TbDeviceDesktop,
  'Facility':             TbDoor,
};

const CATEGORY_COLORS = {
  'Human':                'bg-indigo-100 text-indigo-600',
  'IT Infrastructure':    'bg-sky-100 text-sky-600',
  'Service':              'bg-amber-100 text-amber-600',
  'Digital':              'bg-purple-100 text-purple-600',
  'Tangible Information': 'bg-emerald-100 text-emerald-600',
  'End User':             'bg-red-100 text-red-600',
  'Facility':             'bg-orange-100 text-orange-600',
};

const CONDITION_COLORS = {
  New:     'bg-emerald-100 text-emerald-700',
  Good:    'bg-blue-100 text-blue-700',
  Fair:    'bg-amber-100 text-amber-700',
  Poor:    'bg-orange-100 text-orange-700',
  Damaged: 'bg-red-100 text-red-700',
};

const fmt = (d) => d
  ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  : '—';

const safeList = (v) => (Array.isArray(v) ? v : []);

// ── Toast ─────────────────────────────────────────────────
const Toast = ({ message, type }) => (
  <div className={`fixed top-5 right-5 z-50 flex items-center gap-2
    px-4 py-3 rounded-xl shadow-lg text-sm font-medium
    ${type === 'success' ? 'bg-brand-green text-brand-cream-light' : 'bg-red-600 text-white'}`}>
    {type === 'success' ? '✅' : '❌'} {message}
  </div>
);

// ── Restore Confirm Modal ─────────────────────────────────
function RestoreModal({ record, onClose, onConfirm, saving }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.55)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">

        <div className="flex items-center gap-3 px-6 py-5 border-b border-brand-cream/60">
          <div className="w-10 h-10 rounded-xl bg-brand-green/10 flex items-center justify-center shrink-0">
            <TbRefresh size={20} className="text-brand-green" />
          </div>
          <div>
            <h2 className="text-base font-black text-brand-dark">Restore Asset</h2>
            <p className="text-xs text-brand-dark/40 mt-0.5">This will set the asset back to Available</p>
          </div>
          <button onClick={onClose}
            className="ml-auto w-8 h-8 flex items-center justify-center rounded-lg
              hover:bg-brand-cream/40 text-brand-dark/40 text-lg font-bold transition">
            ×
          </button>
        </div>

        <div className="px-6 py-5">
          <div className="p-3 bg-brand-cream/30 border border-brand-cream rounded-xl flex items-center gap-3 mb-4">
            <HiOutlineCube size={18} className="text-brand-dark/40 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-brand-dark truncate">{record.asset_name}</p>
              <p className="text-[11px] font-mono text-brand-dark/40">{record.asset_no}</p>
            </div>
          </div>
          <p className="text-sm text-brand-dark/70">
            Are you sure you want to restore this asset? It will be marked as
            <span className="font-bold text-brand-green"> Available</span> and can be assigned again.
          </p>
        </div>

        <div className="flex gap-3 px-6 pb-5">
          <button onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-brand-cream
              text-sm font-semibold text-brand-dark/60 hover:bg-brand-cream/30 transition">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-xl bg-brand-green hover:bg-brand-green-dark
              text-brand-cream-light text-sm font-bold transition disabled:opacity-50
              flex items-center justify-center gap-2">
            {saving ? (
              <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10"
                  stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg> Restoring...</>
            ) : (
              <><TbRefresh size={15} /> Restore Asset</>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────
export default function SalvagedAssets() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { list, total, loading, saving, error, success } = useSelector(s => s.salvage);
  const auth = useSelector(s => s.auth);
  const isAdmin = auth?.user?.roles?.includes('Admin');

  const salvaged = safeList(list);

  // Input states
  const [search,     setSearch]     = useState('');
  const [catFilter,  setCatFilter]  = useState('');

  // Applied states (trigger filtering only on submit)
  const [appliedSearch,    setAppliedSearch]    = useState('');
  const [appliedCatFilter, setAppliedCatFilter] = useState('');

  const [restoreRec, setRestoreRec] = useState(null);

  useEffect(() => {
    dispatch(fetchAllSalvaged({ page: 1, limit: 100 }));
  }, []);

  useEffect(() => {
    if (!success && !error) return;
    if (success) {
      dispatch(fetchAllSalvaged({ page: 1, limit: 100 }));
      setRestoreRec(null);
    }
    const t = setTimeout(() => dispatch(clearSalvageMessages()), 3500);
    return () => clearTimeout(t);
  }, [success, error]);

  // Handlers for Submit and Clear
  const handleApplyFilters = () => {
    setAppliedSearch(search);
    setAppliedCatFilter(catFilter);
  };

  const handleClearFilters = () => {
    setSearch('');
    setCatFilter('');
    setAppliedSearch('');
    setAppliedCatFilter('');
  };

  const totalValue = salvaged.reduce((sum, r) => sum + (Number(r.cost) || 0), 0);
  const categories = [...new Set(salvaged.map(r => r.category).filter(Boolean))];

  // Filter uses the applied states instead of live input states
  const filtered = salvaged.filter(r => {
    const text = `${r.asset_name} ${r.asset_no} ${r.category} ${r.salvage_reason}`.toLowerCase();
    return text.includes(appliedSearch.toLowerCase()) && (appliedCatFilter ? r.category === appliedCatFilter : true);
  });

  const {
    paginated, currentPage, totalPages,
    setCurrentPage, reset, startIndex, endIndex, totalItems,
  } = usePagination(filtered, 10);

  // Reset pagination only when applied filters change
  useEffect(() => { reset(); }, [appliedSearch, appliedCatFilter]);

  const handleRestore = async () => {
    if (!restoreRec) return;
    await dispatch(unsalvageAsset(restoreRec.asset_id));
  };

  return (
    <MainLayout
      title="Salvaged Assets"
      subtitle="Assets permanently marked as Broken / salvaged">

      {(success || error) && (
        <Toast message={success || error} type={success ? 'success' : 'error'} />
      )}

      {/* ── Stats ── */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatsCard
          label="Total Salvaged"
          value={salvaged.length}
          icon="inactive"
          color="red"
          sub="All time"
        />
        <StatsCard
          label="Categories"
          value={categories.length}
          icon="assets"
          color="green"
          sub="Unique categories"
        />
        <StatsCard
          label="This Month"
          value={salvaged.filter(r => {
            const d = new Date(r.salvaged_at);
            const now = new Date();
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
          }).length}
          icon="warning"
          color="amber"
          sub="Salvaged recently"
        />
        <StatsCard
          label="Total Value Lost"
          value={totalValue > 0 ? `${totalValue.toLocaleString()}` : '—'}
          icon="shield"
          color="purple"
          sub="Estimated asset cost"
        />
      </div>

      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">

          <div className="relative">
            <FiSearch size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-dark/30" />
            <input
              placeholder="Search asset, reason, category..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleApplyFilters()}
              className="pl-9 pr-4 py-2 rounded-lg border border-brand-cream bg-white
                text-sm w-64 focus:outline-none focus:ring-2 focus:ring-brand-green
                placeholder:text-brand-dark/30 text-brand-dark transition-colors duration-150"
            />
          </div>

          <select
            value={catFilter}
            onChange={e => setCatFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-brand-cream bg-white text-sm
              focus:outline-none focus:ring-2 focus:ring-brand-green text-brand-dark/70
              transition-colors duration-150">
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* New Submit and Clear Buttons */}
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

          {(appliedSearch || appliedCatFilter) && (
            <span className="text-xs text-brand-dark/40">
              {totalItems} result{totalItems !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-brand-dark/40">
          <TbTrash size={14} className="text-red-400" />
          <span>{total} total salvaged asset{total !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl border border-brand-cream/60 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-brand-cream/30 border-b border-brand-cream/60">
              {[
                'Asset', 'Category', 'Salvage Reason', 'Condition',
                'Salvage Date', 'Salvaged By', 'Actions',
              ].map(h => (
                <th key={h}
                  className="px-4 py-3.5 text-left text-xs font-semibold
                    text-brand-dark/40 uppercase tracking-wider whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-brand-cream/30">

            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <svg className="animate-spin w-6 h-6 mx-auto mb-2 text-brand-green"
                    fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10"
                      stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  <p className="text-sm text-brand-dark/40">Loading salvaged assets...</p>
                </td>
              </tr>

            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center">
                  <div className="w-14 h-14 rounded-full bg-red-50 flex items-center
                    justify-center mx-auto mb-3">
                    <TbTrash size={26} className="text-red-300" />
                  </div>
                  <p className="text-sm font-semibold text-brand-dark/50">
                    No salvaged assets found
                  </p>
                  <p className="text-xs text-brand-dark/30 mt-1">
                    {appliedSearch || appliedCatFilter
                      ? 'Try adjusting your search filters'
                      : 'No assets have been marked as salvaged yet'}
                  </p>
                </td>
              </tr>

            ) : paginated.map(r => {
              const CatIcon  = CATEGORY_ICONS[r.category] || HiOutlineCube;
              const catColor = CATEGORY_COLORS[r.category] || 'bg-slate-100 text-slate-500';

              return (
                <tr key={r.salvage_id}
                  className="hover:bg-brand-cream/20 transition-colors">

                  {/* Asset */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-brand-green/10 flex items-center justify-center shrink-0 text-brand-green">
                        <TbTrash size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-brand-dark truncate max-w-[130px]">
                          {r.asset_name}
                        </p>
                        <p className="text-[10px] font-mono text-brand-dark/40">
                          {r.asset_no}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-4 py-4">
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1
                      rounded-lg text-xs font-semibold ${catColor}`}>
                      <CatIcon size={12} />
                      {r.category || '—'}
                    </div>
                  </td>

                  {/* Salvage reason */}
                  <td className="px-4 py-4">
                    <p className="text-sm text-brand-dark/80 max-w-[160px] truncate"
                      title={r.salvage_reason}>
                      {r.salvage_reason}
                    </p>
                    {r.notes && (
                      <p className="text-[10px] text-brand-dark/40 mt-0.5 max-w-[160px] truncate"
                        title={r.notes}>
                        {r.notes}
                      </p>
                    )}
                  </td>

                  {/* Condition */}
                  <td className="px-4 py-4">
                    {r.condition_at_salvage ? (
                      <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold
                        ${CONDITION_COLORS[r.condition_at_salvage] || 'bg-slate-100 text-slate-500'}`}>
                        {r.condition_at_salvage}
                      </span>
                    ) : (
                      <span className="text-xs text-brand-dark/20">—</span>
                    )}
                  </td>

                  {/* Salvage date */}
                  <td className="px-4 py-4">
                    <p className="text-sm text-brand-dark/70">{fmt(r.salvage_date)}</p>
                    <p className="text-[10px] text-brand-dark/40">
                      Recorded {fmt(r.salvaged_at)}
                    </p>
                  </td>

                  {/* Salvaged by */}
                  <td className="px-4 py-4">
                    {r.salvaged_by_name ? (
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-brand-green/10 flex items-center justify-center shrink-0 text-[11px] font-black text-brand-green">
                          {r.salvaged_by_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm text-brand-dark/70 truncate max-w-[90px]">
                          {r.salvaged_by_name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-brand-dark/20">—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/assets/${r.asset_id}`)}
                        className="w-7 h-7 flex items-center justify-center
                          rounded-lg bg-brand-cream/50 hover:bg-brand-cream
                          text-brand-dark/50 transition-colors duration-150"
                        title="View Asset">
                        <HiOutlineEye size={14} />
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => setRestoreRec(r)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5
                            rounded-lg bg-brand-green/10 hover:bg-brand-green/20
                            text-brand-green text-xs font-semibold transition-colors duration-150"
                          title="Restore Asset">
                          <TbRefresh size={13} /> Restore
                        </button>
                      )}
                    </div>
                  </td>

                </tr>
              );
            })}

          </tbody>
        </table>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      {totalItems > 0 && (
        <p className="text-xs text-brand-dark/40 mt-3 px-1">
          Showing {startIndex}–{endIndex} of {totalItems} salvaged assets
        </p>
      )}

      {restoreRec && (
        <RestoreModal
          record={restoreRec}
          onClose={() => setRestoreRec(null)}
          onConfirm={handleRestore}
          saving={saving}
        />
      )}

    </MainLayout>
  );
}
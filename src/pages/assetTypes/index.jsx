// pages/assetTypes/index.jsx

import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiSearch, FiX, FiEdit2, FiPlus, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { TbTag, TbBox } from 'react-icons/tb';

import MainLayout    from '../../components/layout/MainLayout';
import Pagination    from '../../components/common/Pagination';
import StatsCard     from '../../components/common/StatsCard';
import usePagination from '../../hooks/usePagination';

import AssetTypeModal, { CATEGORIES, CAT_ICON, CAT_COLOR } from './AssetTypeModal';

import {
  fetchAllAssetTypes,
  createAssetType,
  updateAssetType,
  clearAssetTypeMessages,
} from '../../features/assetTypes/assetTypeSlice';

const safeList = (v) => (Array.isArray(v) ? v : []);

const Toast = ({ message, type }) => (
  <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
    ${type === 'success' ? 'bg-brand-green text-brand-cream-light' : 'bg-red-600 text-white'}`}>
    {type === 'success' ? <FiCheck size={15} /> : <FiAlertCircle size={15} />}
    {message}
  </div>
);

export default function AssetTypesIndex() {
  const dispatch = useDispatch();
  const { list, loading, saving, error, success } = useSelector(s => s.assetTypes);
  const types = safeList(list);

  const [modal,      setModal]      = useState(null);
  const [textSearch, setTextSearch] = useState('');
  const [filterCat,  setFilterCat]  = useState('all');

  useEffect(() => { dispatch(fetchAllAssetTypes()); }, []);

  useEffect(() => {
    if (!success && !error) return;
    if (success) { setModal(null); dispatch(fetchAllAssetTypes()); }
    const t = setTimeout(() => dispatch(clearAssetTypeMessages()), 3000);
    return () => clearTimeout(t);
  }, [success, error]);

  const filtered = useMemo(() =>
    types.filter(t => {
      if (filterCat !== 'all' && t.category !== filterCat) return false;
      if (textSearch) {
        const q = textSearch.toLowerCase();
        return (t.name || '').toLowerCase().includes(q) || (t.category || '').toLowerCase().includes(q);
      }
      return true;
    }), [types, textSearch, filterCat]);

  const { paginated, currentPage, totalPages, setCurrentPage, reset, startIndex, endIndex, totalItems } = usePagination(filtered, 12);
  useEffect(() => { reset(); }, [textSearch, filterCat]);

  const catCounts   = useMemo(() => { const m = {}; types.forEach(t => { m[t.category] = (m[t.category] || 0) + 1; }); return m; }, [types]);
  const topCategory = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
  const hasFilters  = !!(textSearch || filterCat !== 'all');

  const handleSubmit = (body) => {
    if (modal?.mode === 'edit') dispatch(updateAssetType({ id: modal.item.id, body }));
    else dispatch(createAssetType(body));
  };

  return (
    <MainLayout title="Asset Types" subtitle="Manage asset type classifications by category">

      {(success || error) && <Toast message={success || error} type={success ? 'success' : 'error'} />}

      {/* ── Stats ── */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatsCard label="Total Types"  value={types.length}      icon="category"  color="green"  sub="Across all categories" />
        <StatsCard label="Categories"   value={CATEGORIES.length} icon="group"     color="blue"   sub="Fixed taxonomy" />
        <StatsCard label="Most Types"   value={topCategory}       icon="chart"     color="amber"  sub={`${catCounts[topCategory] || 0} types`} />
        <StatsCard label="Filtered"     value={totalItems}        icon="inventory" color="slate"  sub={hasFilters ? 'Matching filters' : 'All types'} />
      </div>

      {/* ── Search + Category dropdown + Add ── */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-dark/30" />
            <input value={textSearch} onChange={e => setTextSearch(e.target.value)}
              placeholder="Search by name..."
              className="w-52 pl-9 pr-9 py-2.5 rounded-xl border border-brand-cream bg-white text-sm
                text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-green
                placeholder:text-brand-dark/30 transition-all" />
            {textSearch && (
              <button onClick={() => setTextSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-dark/30 hover:text-brand-dark">
                <FiX size={13} />
              </button>
            )}
          </div>

          <select
            value={filterCat}
            onChange={e => setFilterCat(e.target.value)}
            className="py-2.5 pl-3 pr-8 rounded-xl border border-brand-cream bg-white text-sm
              text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-green min-w-[180px]">
            <option value="all">All Categories ({types.length})</option>
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c} ({catCounts[c] || 0})</option>
            ))}
          </select>
        </div>

        <button onClick={() => setModal({ mode: 'create' })}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-green hover:bg-brand-green-dark
            text-brand-cream-light text-sm font-bold transition-colors duration-150 shadow-sm shrink-0">
          <FiPlus size={15} /> New Asset Type
        </button>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl border border-brand-cream/60 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-brand-cream/30 border-b border-brand-cream/60">
              {['#', 'Type Name', 'Category', 'Asset Count', 'Created', 'Action'].map(h => (
                <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-brand-dark/40 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-cream/30">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-14 text-center">
                  <svg className="animate-spin w-6 h-6 mx-auto mb-2 text-brand-green" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <p className="text-sm text-brand-dark/40">Loading…</p>
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center">
                  <div className="w-14 h-14 rounded-full bg-brand-cream/50 flex items-center justify-center mx-auto mb-3">
                    <TbTag size={26} className="text-brand-dark/20" />
                  </div>
                  <p className="text-sm font-semibold text-brand-dark/50">No asset types found</p>
                  <p className="text-xs text-brand-dark/30 mt-1">
                    {hasFilters ? 'Try adjusting your filters' : 'Create your first asset type'}
                  </p>
                  {hasFilters ? (
                    <button onClick={() => { setTextSearch(''); setFilterCat('all'); }}
                      className="mt-3 text-xs text-brand-green hover:underline font-semibold">
                      Clear filters
                    </button>
                  ) : (
                    <button onClick={() => setModal({ mode: 'create' })}
                      className="mt-3 text-xs text-brand-green hover:underline font-semibold">
                      Create one now
                    </button>
                  )}
                </td>
              </tr>
            ) : paginated.map((t, idx) => {
              const Icon   = CAT_ICON[t.category]  || TbBox;
              const colors = CAT_COLOR[t.category] || { pill: 'bg-slate-100 text-slate-600 ring-slate-200', icon: 'bg-slate-100 text-slate-500' };
              return (
                <tr key={t.id} className="hover:bg-brand-cream/20 transition-colors">
                  <td className="px-5 py-4">
                    <span className="text-xs font-mono text-brand-dark/30">{startIndex + idx}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${colors.icon}`}>
                        <Icon size={15} />
                      </div>
                      <span className="text-sm font-semibold text-brand-dark">{t.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ${colors.pill}`}>
                      <Icon size={11} /> {t.category}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center
                        ${t.asset_count > 0 ? 'bg-brand-green/10' : 'bg-brand-cream/50'}`}>
                        <TbBox size={12} className={t.asset_count > 0 ? 'text-brand-green' : 'text-brand-dark/20'} />
                      </div>
                      <span className={`text-sm font-bold ${t.asset_count > 0 ? 'text-brand-green-dark' : 'text-brand-dark/30'}`}>
                        {t.asset_count}
                      </span>
                      <span className="text-xs text-brand-dark/40">asset{t.asset_count !== 1 ? 's' : ''}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-xs text-brand-dark/40">
                      {t.created_at ? new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <button onClick={() => setModal({ mode: 'edit', item: t })}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                        bg-brand-green/10 hover:bg-brand-green/20 text-brand-green text-xs font-bold transition-colors duration-150">
                      <FiEdit2 size={12} /> Edit
                    </button>
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
          Showing {startIndex}–{endIndex} of {totalItems} type{totalItems !== 1 ? 's' : ''}
          {hasFilters && <span className="ml-1 text-brand-green font-semibold">· filtered</span>}
        </p>
      )}

      {modal && (
        <AssetTypeModal
          mode={modal.mode}
          item={modal.item}
          onClose={() => setModal(null)}
          onSubmit={handleSubmit}
          saving={saving}
        />
      )}

    </MainLayout>
  );
}

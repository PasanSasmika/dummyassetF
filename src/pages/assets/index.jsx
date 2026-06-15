import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { HiOutlineCube, HiOutlineEye } from 'react-icons/hi';
import { FiUploadCloud } from 'react-icons/fi';
import MainLayout        from '../../components/layout/MainLayout';
import Pagination        from '../../components/common/Pagination';
import StatsCard         from '../../components/common/StatsCard';
import usePagination     from '../../hooks/usePagination';
import {
  fetchAssets, createAsset, bulkImportAssets, clearAssetMessages,
} from '../../features/assets/assetSlice';
import { fetchDepartments }  from '../../features/departments/departmentSlice';
import { fetchDesignations } from '../../features/designations/designationSlice';
import AssetFormModal   from './AssetFormModal';
import BulkImportModal  from './BulkImportModal';

const STATUSES   = ['Available', 'In Use', 'In Maintenance', 'In Repair', 'Broken', 'Retired', 'Lost'];
const CATEGORIES = ['Human', 'IT Infrastructure', 'Service', 'Digital', 'Tangible Information', 'End User', 'Facility'];

const statusColors = {
  'Available':      'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
  'In Use':         'bg-blue-100 text-blue-700 ring-1 ring-blue-200',
  'In Maintenance': 'bg-amber-100 text-amber-700 ring-1 ring-amber-200',
  'In Repair':      'bg-orange-100 text-orange-700 ring-1 ring-orange-200',
  'Broken':         'bg-red-100 text-red-700 ring-1 ring-red-200',
  'Retired':        'bg-slate-100 text-slate-500 ring-1 ring-slate-200',
  'Lost':           'bg-rose-100 text-rose-700 ring-1 ring-rose-200',
};

const classColors = {
  High:   'bg-red-100 text-red-700 ring-1 ring-red-200',
  Medium: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200',
  Low:    'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
};

const categoryColors = {
  'End User':             'bg-blue-100 text-blue-700',
  'IT Infrastructure':    'bg-indigo-100 text-indigo-700',
  'Digital':              'bg-purple-100 text-purple-700',
  'Service':              'bg-cyan-100 text-cyan-700',
  'Facility':             'bg-orange-100 text-orange-700',
  'Human':                'bg-teal-100 text-teal-700',
  'Tangible Information': 'bg-rose-100 text-rose-700',
  'Other':                'bg-slate-100 text-slate-600',
};

const safeList = (val) => (Array.isArray(val) ? val : []);

const Toast = ({ message, type }) => (
  <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
    ${type === 'success' ? 'bg-brand-green text-brand-cream-light' : 'bg-red-600 text-white'}`}>
    {type === 'success' ? '✅' : '❌'} {message}
  </div>
);

export default function Assets() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user }            = useSelector(s => s.auth);
  const { list: rawList, loading, error, success, saving } = useSelector(s => s.assets);
  const { list: rawDepts }  = useSelector(s => s.departments);
  const { list: rawDesigs } = useSelector(s => s.designations);

  const canWrite = user?.is_super_admin === true || (user?.sidebar_access || []).includes('assets');

  const list         = safeList(rawList);
  const departments  = safeList(rawDepts);
  const designations = safeList(rawDesigs);

  const [showAdd,       setShowAdd]      = useState(false);
  const [showBulk,      setShowBulk]     = useState(false);
  
  // Input states (do not trigger filtering immediately)
  const [search,        setSearch]       = useState('');
  const [catFilter,     setCatFilter]    = useState('');
  const [statusFilter,  setStatusFilter] = useState('');
  const [classFilter,   setClassFilter]  = useState('');

  // Applied states (trigger filtering only on submit)
  const [appliedSearch,       setAppliedSearch]       = useState('');
  const [appliedCatFilter,    setAppliedCatFilter]    = useState('');
  const [appliedStatusFilter, setAppliedStatusFilter] = useState('');
  const [appliedClassFilter,  setAppliedClassFilter]  = useState('');

  useEffect(() => {
    dispatch(fetchAssets());
    dispatch(fetchDepartments());
    dispatch(fetchDesignations());
  }, []);

  useEffect(() => {
    if (success || error) {
      if (success) { dispatch(fetchAssets()); setShowAdd(false); }
      const t = setTimeout(() => dispatch(clearAssetMessages()), 3000);
      return () => clearTimeout(t);
    }
  }, [success, error]);

  // Handlers for Submit and Clear
  const handleApplyFilters = () => {
    setAppliedSearch(search);
    setAppliedCatFilter(catFilter);
    setAppliedStatusFilter(statusFilter);
    setAppliedClassFilter(classFilter);
  };

  const handleClearFilters = () => {
    setSearch('');
    setCatFilter('');
    setStatusFilter('');
    setClassFilter('');
    setAppliedSearch('');
    setAppliedCatFilter('');
    setAppliedStatusFilter('');
    setAppliedClassFilter('');
  };

  // Filter uses the applied states instead of live input states
  const filtered = list.filter(a => {
    const text = `${a.name || ''} ${a.asset_no || ''} ${a.category || ''} ${a.location_name || ''} ${a.asset_type_name || ''}`.toLowerCase();
    return (
      text.includes(appliedSearch.toLowerCase()) &&
      (appliedCatFilter    ? a.category       === appliedCatFilter    : true) &&
      (appliedStatusFilter ? a.status         === appliedStatusFilter : true) &&
      (appliedClassFilter  ? a.classification === appliedClassFilter  : true)
    );
  });

  const {
    paginated, currentPage, totalPages,
    setCurrentPage, reset, startIndex, endIndex, totalItems,
  } = usePagination(filtered);

  // Reset pagination only when applied filters change
  useEffect(() => { reset(); }, [appliedSearch, appliedCatFilter, appliedStatusFilter, appliedClassFilter]);

  const total       = list.length;
  const available   = list.filter(a => a.status === 'Available').length;
  const maintenance = list.filter(a => a.status === 'In Maintenance').length;
  const retired     = list.filter(a => a.status === 'Retired').length;

  const handleBulkImport = async (validRows) => {
    const res = await dispatch(bulkImportAssets(validRows)).unwrap();
    dispatch(fetchAssets());
    return res;
  };

  // shared select classes
  const selectCls = `px-3 py-2 rounded-lg border border-brand-cream bg-white text-sm
    focus:outline-none focus:ring-2 focus:ring-brand-green text-brand-dark/70
    transition-colors duration-150`;

  return (
    <MainLayout title="Assets" subtitle="Manage and track all organizational assets">

      {(success || error) && <Toast message={success || error} type={success ? 'success' : 'error'} />}

      {/* ── Stats ── */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatsCard label="Total Assets"   value={total}       icon="assets"   color="green"   sub={`${CATEGORIES.length} categories`} />
        <StatsCard label="Available"      value={available}   icon="active"   color="emerald" sub={total > 0 ? `${Math.round((available / total) * 100)}% of total` : '—'} />
        <StatsCard label="In Maintenance" value={maintenance} icon="warning"  color="amber"   sub="needs attention" />
        <StatsCard label="Retired"        value={retired}     icon="inactive" color="red"     sub="decommissioned" />
      </div>

      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <input
            placeholder="Search name, asset no, location..."
            value={search} onChange={e => setSearch(e.target.value)}
            // Optional: trigger submit on Enter key press
            onKeyDown={e => e.key === 'Enter' && handleApplyFilters()}
            className="px-4 py-2 rounded-lg border border-brand-cream bg-white text-sm w-72
              focus:outline-none focus:ring-2 focus:ring-brand-green placeholder:text-brand-dark/30
              text-brand-dark transition-colors duration-150"
          />
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className={selectCls}>
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={selectCls}>
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={classFilter} onChange={e => setClassFilter(e.target.value)} className={selectCls}>
            <option value="">All Classifications</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
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

          {(appliedSearch || appliedCatFilter || appliedStatusFilter || appliedClassFilter) && (
            <span className="text-xs text-brand-dark/40">
              {totalItems} result{totalItems !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {canWrite && (
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setShowBulk(true)}
              className="flex items-center gap-2 px-4 py-2 bg-brand-cream hover:bg-brand-cream-light
                text-brand-dark text-sm font-semibold rounded-lg transition-colors duration-150">
              <FiUploadCloud size={15} /> Bulk Import
            </button>
            <button onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 px-4 py-2 bg-brand-green hover:bg-brand-green-dark
                text-brand-cream-light text-sm font-semibold rounded-lg transition-colors duration-150 shadow-sm">
              <span className="text-lg leading-none">+</span> Add Asset
            </button>
          </div>
        )}
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl border border-brand-cream/60 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-brand-cream/30 border-b border-brand-cream/60">
              {['Asset', 'Asset No', 'Category', 'Type', 'Location', 'Classification', 'Status', 'Actions'].map(h => (
                <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-brand-dark/40 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-cream/30">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-sm text-brand-dark/40">
                  <svg className="animate-spin w-5 h-5 mx-auto mb-2 text-brand-green" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Loading...
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-sm text-brand-dark/40">
                  No assets found.
                </td>
              </tr>
            ) : paginated.map(asset => (
              <tr key={asset.id}
                className="hover:bg-brand-cream/20 transition-colors cursor-pointer"
                onClick={() => navigate(`/assets/${asset.id}`)}>

                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-brand-green/10 flex items-center justify-center shrink-0">
                      <HiOutlineCube className="w-4 h-4 text-brand-green" />
                    </div>
                    <p className="text-sm font-semibold text-brand-dark">{asset.name}</p>
                  </div>
                </td>

                <td className="px-5 py-4 text-xs font-mono text-brand-dark/50">
                  {asset.asset_no || `#${asset.id}`}
                </td>

                <td className="px-5 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold
                    ${categoryColors[asset.category] || 'bg-slate-100 text-slate-600'}`}>
                    {asset.category || '—'}
                  </span>
                </td>

                <td className="px-5 py-4 text-sm text-brand-dark/60">
                  {asset.asset_type_name || '—'}
                </td>

                <td className="px-5 py-4 text-sm text-brand-dark/60">
                  {asset.location_name
                    ? asset.sub_location_name
                      ? `${asset.location_name} › ${asset.sub_location_name}`
                      : asset.location_name
                    : '—'}
                </td>

                <td className="px-5 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold
                    ${classColors[asset.classification] || 'bg-slate-100 text-slate-500'}`}>
                    {asset.classification || '—'}
                  </span>
                </td>

                <td className="px-5 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold
                    ${statusColors[asset.status] || 'bg-slate-100 text-slate-500'}`}>
                    {asset.status || '—'}
                  </span>
                </td>

                <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                  <button onClick={() => navigate(`/assets/${asset.id}`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold
                      text-brand-green bg-brand-green/10 hover:bg-brand-green/20 rounded-lg transition-colors duration-150">
                    <HiOutlineEye className="w-3.5 h-3.5" /> View
                  </button>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      {totalItems > 0 && (
        <p className="text-xs text-brand-dark/40 mt-3 px-1">
          Showing {startIndex}–{endIndex} of {totalItems} assets
        </p>
      )}

      {/* ── Modals ── */}
      {showAdd && (
        <AssetFormModal
          onClose={() => setShowAdd(false)}
          onSubmit={(data) => dispatch(createAsset(data))}
          departments={departments}
          designations={designations}
          loading={saving}
        />
      )}

      {showBulk && (
        <BulkImportModal
          onClose={() => setShowBulk(false)}
          onImport={handleBulkImport}
        />
      )}

    </MainLayout>
  );
}
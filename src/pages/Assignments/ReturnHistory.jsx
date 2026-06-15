import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  FiSearch, FiCalendar, FiFileText, FiExternalLink,
} from 'react-icons/fi';
import {
  TbArrowBackUp, TbCircleCheck, TbFileOff,
  TbUserCheck, TbServer, TbTool, TbShieldLock,
  TbFileText, TbDeviceDesktop, TbDoor,
} from 'react-icons/tb';
import { HiOutlineCube, HiOutlineEye } from 'react-icons/hi';
import MainLayout from '../../components/layout/MainLayout';
import Pagination from '../../components/common/Pagination';
import StatsCard from '../../components/common/StatsCard';
import usePagination from '../../hooks/usePagination';
import { fetchAllAssignments } from '../../features/assignments/assignmentSlice';

// ── helpers ───────────────────────────────────────────────
const fmt = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

const CONDITION_COLORS = {
  New:     'bg-emerald-100 text-emerald-700',
  Good:    'bg-blue-100 text-blue-700',
  Fair:    'bg-amber-100 text-amber-700',
  Poor:    'bg-orange-100 text-orange-700',
  Damaged: 'bg-red-100 text-red-700',
};

const CATEGORY_ICONS = {
  'Human':                TbUserCheck,
  'IT Infrastructure':    TbServer,
  'Service':              TbTool,
  'Digital':              TbShieldLock,
  'Tangible Information': TbFileText,
  'End User':             TbDeviceDesktop,
  'Facility':             TbDoor,
};

export default function ReturnHistory() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list, loading } = useSelector((s) => s.assignments);

  const [search, setSearch]               = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [docFilter, setDocFilter]         = useState('');   // '' | 'with' | 'without'

  useEffect(() => {
    dispatch(fetchAllAssignments());
  }, [dispatch]);

  // Only returned assignments
  const returned = (Array.isArray(list) ? list : []).filter(
    (a) => a.status === 'Returned'
  );

  const withDoc    = returned.filter((a) => a.return_doc_id);
  const withoutDoc = returned.filter((a) => !a.return_doc_id);

  // Filtering
  const filtered = returned.filter((a) => {
    const text = `${a.asset_name || ''} ${a.asset_no || ''} ${a.assigned_to_name || ''} ${a.assigned_by_name || ''}`.toLowerCase();
    const matchText = text.includes(appliedSearch.toLowerCase());
    const matchDoc  =
      docFilter === 'with'    ? !!a.return_doc_id :
      docFilter === 'without' ? !a.return_doc_id  : true;
    return matchText && matchDoc;
  });

  const {
    paginated, currentPage, totalPages,
    setCurrentPage, reset, startIndex, endIndex, totalItems,
  } = usePagination(filtered, 12);

  useEffect(() => { reset(); }, [appliedSearch, docFilter]);

  const handleApply = () => setAppliedSearch(search);
  const handleClear = () => { setSearch(''); setAppliedSearch(''); setDocFilter(''); };

  const openDoc = (a) => {
    const filePath = a.return_doc_path;
    if (!filePath) return;
    const apiBase = import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'http://localhost:5000';
    const cleanPath = filePath.replace(/^\//, '').replace(/^src\//, '');
    const fileUrl = filePath.startsWith('http') ? filePath : `${apiBase}/${cleanPath}`;
    window.open(fileUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <MainLayout
      title="Return History"
      subtitle="All returned asset assignments and their return documents"
    >
      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatsCard label="Total Returned"  value={returned.length}    icon="active"  color="emerald" sub="All time returns" />
        <StatsCard label="With Document"   value={withDoc.length}     icon="ticket"  color="blue"    sub="Return doc uploaded" />
        <StatsCard label="Missing Document" value={withoutDoc.length} icon="warning" color="red"     sub="No return doc yet" />
      </div>

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative">
          <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-dark/30" />
          <input
            placeholder="Search asset, user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
            className="pl-9 pr-4 py-2 rounded-lg border border-brand-cream bg-white
              text-sm w-64 focus:outline-none focus:ring-2 focus:ring-brand-green
              placeholder:text-brand-dark/30 text-brand-dark"
          />
        </div>

        <select
          value={docFilter}
          onChange={(e) => setDocFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-brand-cream bg-white text-sm
            focus:outline-none focus:ring-2 focus:ring-brand-green text-brand-dark/70"
        >
          <option value="">All Returns</option>
          <option value="with">With Return Document</option>
          <option value="without">Missing Return Document</option>
        </select>

        <button
          onClick={handleApply}
          className="px-4 py-2 bg-brand-green hover:bg-brand-green-dark text-white text-sm font-semibold rounded-lg transition"
        >
          Search
        </button>
        <button
          onClick={handleClear}
          className="px-4 py-2 bg-brand-cream/50 hover:bg-brand-cream text-brand-dark text-sm font-semibold rounded-lg transition border border-brand-cream"
        >
          Clear
        </button>

        {(appliedSearch || docFilter) && (
          <span className="text-xs text-brand-dark/40">
            {totalItems} result{totalItems !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl border border-brand-cream/60 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-brand-cream/30 border-b border-brand-cream/60">
              {[
                'Asset', 'Assigned To', 'Assignment Date',
                'Returned On', 'Condition', 'Return Document', 'Actions',
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3.5 text-left text-xs font-semibold text-brand-dark/40 uppercase tracking-wider whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-brand-cream/30">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <svg className="animate-spin w-6 h-6 mx-auto mb-2 text-brand-green" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <p className="text-sm text-brand-dark/40">Loading return history...</p>
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center">
                  <div className="w-14 h-14 rounded-full bg-brand-cream/50 flex items-center justify-center mx-auto mb-3">
                    <TbArrowBackUp size={26} className="text-brand-dark/30" />
                  </div>
                  <p className="text-sm font-semibold text-brand-dark/50">No return records found</p>
                  <p className="text-xs text-brand-dark/30 mt-1">
                    {appliedSearch || docFilter
                      ? 'Try adjusting your search filters'
                      : 'Returned assets will appear here'}
                  </p>
                </td>
              </tr>
            ) : (
              paginated.map((a) => {
                const CatIcon = CATEGORY_ICONS[a.category] || HiOutlineCube;
                const hasDoc  = !!a.return_doc_id;

                return (
                  <tr key={a.id} className="hover:bg-brand-cream/20 transition-colors">

                    {/* Asset */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                          <CatIcon size={16} className="text-emerald-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-brand-dark truncate max-w-[130px]">
                            {a.asset_name || '—'}
                          </p>
                          <p className="text-[10px] font-mono text-brand-dark/40">{a.asset_no || `#${a.asset_id}`}</p>
                        </div>
                      </div>
                    </td>

                    {/* Assigned To */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-brand-green/10 flex items-center justify-center shrink-0 text-[11px] font-black text-brand-green">
                          {(a.assigned_to_name || '?').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-brand-dark font-semibold truncate max-w-[110px]">
                            {a.assigned_to_name || '—'}
                          </p>
                          {a.assigned_by_name && (
                            <p className="text-[10px] text-brand-dark/40 truncate max-w-[110px]">
                              by {a.assigned_by_name}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Assignment Date */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-brand-dark/60">
                        <FiCalendar size={12} className="text-brand-dark/30 shrink-0" />
                        {fmt(a.assignment_date)}
                      </div>
                    </td>

                    {/* Returned On */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5">
                        <TbCircleCheck size={14} className="text-emerald-500 shrink-0" />
                        <span className="text-sm text-brand-dark/70 font-medium">
                          {fmt(a.actual_return_date)}
                        </span>
                      </div>
                    </td>

                    {/* Condition */}
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        {a.condition_out && (
                          <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${CONDITION_COLORS[a.condition_out] || 'bg-slate-100 text-slate-500'}`}>
                            Out: {a.condition_out}
                          </span>
                        )}
                        {a.condition_in && (
                          <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${CONDITION_COLORS[a.condition_in] || 'bg-slate-100 text-slate-500'}`}>
                            In: {a.condition_in}
                          </span>
                        )}
                        {!a.condition_out && !a.condition_in && (
                          <span className="text-xs text-brand-dark/20">—</span>
                        )}
                      </div>
                    </td>

                    {/* Return Document */}
                    <td className="px-4 py-4">
                      {hasDoc ? (
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <FiFileText size={12} className="text-violet-500 shrink-0" />
                            <span className="text-xs font-semibold text-slate-700 truncate max-w-[140px]">
                              {a.return_doc_name || 'Return Document'}
                            </span>
                          </div>
                          {a.return_doc_uploaded_at && (
                            <p className="text-[10px] text-brand-dark/40 ml-4">
                              {fmt(a.return_doc_uploaded_at)}
                            </p>
                          )}
                          <button
                            onClick={() => openDoc(a)}
                            className="mt-1.5 ml-4 flex items-center gap-1 text-[11px] px-2.5 py-1
                              rounded-lg bg-violet-600 text-white font-semibold hover:bg-violet-700 transition"
                          >
                            <FiExternalLink size={10} /> View
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-brand-dark/30">
                          <TbFileOff size={14} />
                          Not uploaded
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4">
                      <button
                        onClick={() => navigate(`/assignments/${a.id}`)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg
                          bg-brand-cream/50 hover:bg-brand-cream text-brand-dark/50
                          transition-colors"
                        title="View Assignment Detail"
                      >
                        <HiOutlineEye size={15} />
                      </button>
                    </td>

                  </tr>
                );
              })
            )}
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
          Showing {startIndex}–{endIndex} of {totalItems} return records
        </p>
      )}
    </MainLayout>
  );
}

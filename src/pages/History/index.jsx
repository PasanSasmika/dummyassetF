import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiSearch, FiClock, FiActivity, FiUserCheck } from 'react-icons/fi';
import { TbCube, TbExchange } from 'react-icons/tb';
import MainLayout from '../../components/layout/MainLayout';
import Pagination from '../../components/common/Pagination';
import { fetchGlobalHistory } from '../../features/history/historySlice';

const fmtDate = (d) => d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const fmtDateOnly = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

export default function HistoryPage() {
  const dispatch = useDispatch();
  const { assets, assignments, loading } = useSelector(s => s.history);

  const [activeTab, setActiveTab] = useState('assets'); // 'assets' or 'assignments'
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');

  const currentData = activeTab === 'assets' ? assets : assignments;

  const loadData = (page = 1) => {
    dispatch(fetchGlobalHistory({ type: activeTab, search: appliedSearch, page, limit: 15 }));
  };

  useEffect(() => { loadData(1); }, [activeTab, appliedSearch]);

  const handleApplyFilters = () => setAppliedSearch(search);
  const handleClearFilters = () => { setSearch(''); setAppliedSearch(''); };

  return (
    <MainLayout title="System History" subtitle="Track asset lifecycle events and assignment logs">
      
      {/* ── Tabs & Search ── */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center bg-brand-cream/40 rounded-xl p-1 shrink-0">
          <button onClick={() => { setActiveTab('assets'); handleClearFilters(); }}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition ${activeTab === 'assets' ? 'bg-white text-brand-dark shadow-sm' : 'text-brand-dark/50 hover:text-brand-dark'}`}>
            <TbCube size={16} /> Asset Events
          </button>
          <button onClick={() => { setActiveTab('assignments'); handleClearFilters(); }}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition ${activeTab === 'assignments' ? 'bg-white text-brand-dark shadow-sm' : 'text-brand-dark/50 hover:text-brand-dark'}`}>
            <TbExchange size={16} /> Assignment Log
          </button>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-dark/30" />
            <input placeholder="Search records..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleApplyFilters()}
              className="pl-9 pr-4 py-2 rounded-lg border border-brand-cream bg-white text-sm w-64 focus:outline-none focus:ring-2 focus:ring-brand-green placeholder:text-brand-dark/30" />
          </div>
          <button onClick={handleApplyFilters} className="px-4 py-2 bg-brand-green hover:bg-brand-green-dark text-white text-sm font-semibold rounded-lg transition">Submit</button>
          <button onClick={handleClearFilters} className="px-4 py-2 bg-brand-cream/50 hover:bg-brand-cream text-brand-dark text-sm font-semibold rounded-lg transition border border-brand-cream">Clear</button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl border border-brand-cream/60 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-brand-cream/30 border-b border-brand-cream/60">
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-brand-dark/40 uppercase">Date & Time</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-brand-dark/40 uppercase">Asset</th>
              {activeTab === 'assets' ? (
                <>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-brand-dark/40 uppercase">Action</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-brand-dark/40 uppercase">Performed By</th>
                </>
              ) : (
                <>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-brand-dark/40 uppercase">Status</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-brand-dark/40 uppercase">Assigned To</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-brand-dark/40 uppercase">Dates</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-cream/30">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-brand-dark/40">Loading history...</td></tr>
            ) : !currentData || !Array.isArray(currentData?.list) || currentData.list.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-brand-dark/40">No records found.</td></tr>
            ) : currentData.list.map(row => (
              <tr key={row.id} className="hover:bg-brand-cream/20 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2 text-sm text-brand-dark/70 font-medium">
                    <FiClock className="text-brand-dark/30" />
                    {fmtDate(activeTab === 'assets' ? row.created_at : row.assignment_date)}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <p className="text-sm font-semibold text-brand-dark">{row.asset_name}</p>
                  <p className="text-[10px] font-mono text-brand-dark/40">{row.asset_no}</p>
                </td>

                {activeTab === 'assets' ? (
                  <>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-md text-[10px] font-bold uppercase text-slate-600">
                        <FiActivity size={10} /> {row.change_type}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-brand-dark/70">{row.changed_by_name || 'System'}</td>
                  </>
                ) : (
                  <>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${row.status === 'Returned' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-sm text-brand-dark/70 font-medium">
                        <FiUserCheck className="text-brand-dark/40" />
                        {row.assigned_to_name || '—'}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-[11px] text-brand-dark/60">
                      <p>Due: <span className="font-semibold text-brand-dark">{fmtDateOnly(row.expected_return_date)}</span></p>
                      {row.actual_return_date && <p>Returned: <span className="font-semibold text-brand-dark">{fmtDateOnly(row.actual_return_date)}</span></p>}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {currentData && (
          <Pagination 
            currentPage={currentData.currentPage || 1} 
            totalPages={currentData.totalPages || 1} 
            onPageChange={loadData} 
          />
        )}
      </div>
    </MainLayout>
  );
}
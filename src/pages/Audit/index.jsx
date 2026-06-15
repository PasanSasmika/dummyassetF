// src/pages/Audit/index.jsx
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiSearch, FiClock, FiActivity, FiCode } from 'react-icons/fi';
import { HiOutlineDocumentText } from 'react-icons/hi';
import MainLayout from '../../components/layout/MainLayout';
import Pagination from '../../components/common/Pagination';
import StatsCard  from '../../components/common/StatsCard';
import { fetchAuditLogs } from '../../features/audit/auditSlice';

// A mapping of the action types defined in your backend
const ACTION_TYPES = [
  'ASSIGNED', 
  'RETURNED', 
  'CIA_AUTO_UPDATE', 
  'Repair Created', 
  'Repair Status Updated', 
  'Salvaged', 
  'Unsalvaged', 
  'ASSIGN_DOC_UPLOADED', 
  'RETURN_DOC_UPLOADED'
];

const actionColors = {
  'ASSIGNED': 'bg-blue-100 text-blue-700',
  'RETURNED': 'bg-emerald-100 text-emerald-700',
  'CIA_AUTO_UPDATE': 'bg-purple-100 text-purple-700',
  'Repair Created': 'bg-orange-100 text-orange-700',
  'Repair Status Updated': 'bg-amber-100 text-amber-700',
  'Salvaged': 'bg-red-100 text-red-700',
  'Unsalvaged': 'bg-teal-100 text-teal-700',
  'ASSIGN_DOC_UPLOADED': 'bg-indigo-100 text-indigo-700',
  'RETURN_DOC_UPLOADED': 'bg-cyan-100 text-cyan-700',
};

// Helper to format Date
const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

// ─── Modal to view detailed JSON changes ──────────────────────────────
const DetailsModal = ({ log, onClose }) => {
  let parsedDetails = {};
  try {
    parsedDetails = JSON.parse(log.change_details);
  } catch (e) {
    parsedDetails = { raw: log.change_details };
  }

  return (
    <div className="fixed inset-0 bg-brand-dark/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-cream/50 flex items-center justify-center text-brand-dark/50">
              <FiCode size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-brand-dark">Audit Details</h3>
              <p className="text-xs text-brand-dark/40">Log ID: #{log.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-brand-dark/40 hover:bg-brand-cream/40 transition">
            ✕
          </button>
        </div>

        <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto max-h-[60vh] overflow-y-auto">
          <pre className="text-xs text-green-400 font-mono leading-relaxed">
            {JSON.stringify(parsedDetails, null, 2)}
          </pre>
        </div>

        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-brand-dark/60 bg-brand-cream/50 hover:bg-brand-cream rounded-lg transition">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default function AuditLog() {
  const dispatch = useDispatch();
  const { list, loading, total, currentPage, totalPages } = useSelector(s => s.audit);

  // Live Input States
  const [search, setSearch] = useState('');
  const [actionType, setActionType] = useState('');
  
  // Applied States (Only trigger API fetch when Submit is clicked)
  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedActionType, setAppliedActionType] = useState('');

  const [selectedLog, setSelectedLog] = useState(null);

  // Note: We use Server-Side pagination here because Audit Logs can grow to millions of rows
  const fetchLogs = (page = 1) => {
    dispatch(fetchAuditLogs({
      search: appliedSearch,
      action_type: appliedActionType,
      page,
      limit: 15
    }));
  };

  useEffect(() => {
    fetchLogs(1);
  }, [dispatch, appliedSearch, appliedActionType]);

  const handleApplyFilters = () => {
    setAppliedSearch(search);
    setAppliedActionType(actionType);
  };

  const handleClearFilters = () => {
    setSearch('');
    setActionType('');
    setAppliedSearch('');
    setAppliedActionType('');
  };

  const selectCls = `px-3 py-2 rounded-lg border border-brand-cream bg-white text-sm
        text-brand-dark/70 focus:outline-none focus:ring-2 focus:ring-brand-green
        transition-colors duration-150`;

  return (
    <MainLayout title="Audit Log" subtitle="Track and monitor all system events and asset history">

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatsCard label="Total Events Logged" value={total} icon="activity" color="blue" sub="All time records" />
        <StatsCard label="Tracking Actions" value={ACTION_TYPES.length} icon="settings" color="purple" sub="Distinct event categories" />
        <StatsCard label="System Health" value="Secure" icon="shield" color="emerald" sub="Logs actively recording" />
      </div>

      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-dark/30" />
            <input
              placeholder="Search user, asset no, name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleApplyFilters()}
              className="pl-9 pr-4 py-2 rounded-lg border border-brand-cream bg-white text-sm w-72
                  focus:outline-none focus:ring-2 focus:ring-brand-green
                  placeholder:text-brand-dark/30 text-brand-dark transition-colors duration-150"
            />
          </div>

          <select value={actionType} onChange={e => setActionType(e.target.value)} className={selectCls}>
            <option value="">All Actions</option>
            {ACTION_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
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

          {(appliedSearch || appliedActionType) && (
            <span className="text-xs text-brand-dark/40">
              {total} result{total !== 1 ? 's' : ''} found
            </span>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl border border-brand-cream/60 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-brand-cream/30 border-b border-brand-cream/60">
              {['Date & Time', 'Action', 'Asset Info', 'Performed By', 'Details'].map(h => (
                <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-brand-dark/40 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-brand-cream/30">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm text-brand-dark/40">
                  <svg className="animate-spin w-5 h-5 mx-auto mb-2 text-brand-green" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Loading Logs...
                </td>
              </tr>
            ) : list.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm text-brand-dark/40">
                  No audit logs found matching your criteria.
                </td>
              </tr>
            ) : list.map(log => (
              <tr key={log.id} className="hover:bg-brand-cream/20 transition-colors">
                
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2 text-sm text-brand-dark/70 font-medium">
                    <FiClock className="text-brand-dark/30" />
                    {fmtDate(log.created_at)}
                  </div>
                </td>

                <td className="px-5 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide
                    ${actionColors[log.change_type] || 'bg-slate-100 text-slate-600'}`}>
                    <FiActivity size={10} />
                    {log.change_type}
                  </span>
                </td>

                <td className="px-5 py-4">
                  {log.asset_name ? (
                    <div>
                      <p className="text-sm font-semibold text-brand-dark truncate max-w-[200px]">{log.asset_name}</p>
                      <p className="text-[10px] font-mono text-brand-dark/40">{log.asset_no}</p>
                    </div>
                  ) : (
                    <span className="text-brand-dark/30 text-xs italic">Asset Deleted/Unknown</span>
                  )}
                </td>

                <td className="px-5 py-4">
                  {log.changed_by_name ? (
                    <div>
                      <p className="text-sm font-medium text-brand-dark">{log.changed_by_name}</p>
                      <p className="text-[10px] text-brand-dark/40">{log.changed_by_email}</p>
                    </div>
                  ) : (
                    <span className="text-brand-dark/30 text-xs italic">System / Unknown</span>
                  )}
                </td>

                <td className="px-5 py-4">
                  <button 
                    onClick={() => setSelectedLog(log)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-dark/60 bg-brand-cream/50 hover:bg-brand-cream rounded-lg transition-colors"
                  >
                    <HiOutlineDocumentText size={14} />
                    View Payload
                  </button>
                </td>

              </tr>
            ))}
          </tbody>
        </table>

        {/* Note: Server-Side Pagination using totalPages passed from backend */}
        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          onPageChange={(page) => fetchLogs(page)} 
        />
      </div>

      {selectedLog && (
        <DetailsModal log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}

    </MainLayout>
  );
}
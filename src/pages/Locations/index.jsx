import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiSearch, FiMapPin } from 'react-icons/fi';
import { HiOutlineLocationMarker } from 'react-icons/hi';
import { TbMapPin, TbChevronRight } from 'react-icons/tb';

import MainLayout    from '../../components/layout/MainLayout';
import Pagination    from '../../components/common/Pagination';
import StatsCard     from '../../components/common/StatsCard';
import usePagination from '../../hooks/usePagination';
import {
  fetchLocations, createLocation, updateLocation, deleteLocation,
  clearLocationMessages,
} from '../../features/locations/locationSlice';

const safe = v => Array.isArray(v) ? v : [];
const fmt  = d => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

// ── Toast ─────────────────────────────────────────────────
const Toast = ({ message, type }) => (
  <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3
    rounded-xl shadow-lg text-sm font-medium
    ${type === 'success' ? 'bg-brand-green text-brand-cream-light' : 'bg-red-600 text-white'}`}>
    {type === 'success' ? '✅' : '❌'} {message}
  </div>
);

// ── Location Form Modal ───────────────────────────────────
const LocationForm = ({ existing, onClose, onSubmit, loading }) => {
  const isEdit = !!existing;
  const [form, setForm] = useState({
    location_name: existing?.location_name || '',
    address:       existing?.address       || '',
    details:       existing?.details       || '',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const inputCls = `w-full px-3 py-2.5 rounded-xl border border-brand-cream bg-brand-offwhite text-sm
    text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-green focus:bg-white
    transition-all placeholder:text-brand-dark/30`;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-brand-cream/60">
          <div className="w-10 h-10 rounded-xl bg-brand-green/10 flex items-center justify-center shrink-0">
            <TbMapPin size={20} className="text-brand-green" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-brand-dark">
              {isEdit ? 'Edit Location' : 'New Location'}
            </h3>
            <p className="text-xs text-brand-dark/40 mt-0.5">
              {isEdit ? `Editing: ${existing.location_name}` : 'Add a new location'}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-brand-dark/30 hover:bg-brand-cream/40 transition">
            <FiX size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-brand-dark/50 uppercase tracking-wider mb-1.5">
              Location Name <span className="text-red-400">*</span>
            </label>
            <input value={form.location_name} onChange={e => set('location_name', e.target.value)}
              placeholder="e.g. Head Office, Warehouse A..."
              className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-bold text-brand-dark/50 uppercase tracking-wider mb-1.5">Address</label>
            <input value={form.address} onChange={e => set('address', e.target.value)}
              placeholder="Street address..."
              className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-bold text-brand-dark/50 uppercase tracking-wider mb-1.5">Details</label>
            <textarea value={form.details} onChange={e => set('details', e.target.value)} rows={3}
              placeholder="Additional details..."
              className={`${inputCls} resize-none`} />
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-brand-cream/60">
          <button onClick={onClose}
            className="flex-1 py-2.5 border border-brand-cream rounded-xl text-sm font-semibold text-brand-dark/60 hover:bg-brand-cream/30 transition">
            Cancel
          </button>
          <button disabled={loading || !form.location_name.trim()} onClick={() => onSubmit(form)}
            className="flex-1 py-2.5 bg-brand-green hover:bg-brand-green-dark disabled:opacity-40
              disabled:cursor-not-allowed text-brand-cream-light rounded-xl text-sm font-semibold transition">
            {loading ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update' : 'Create')}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Delete Confirm Modal ──────────────────────────────────
const DeleteConfirm = ({ item, label, onClose, onConfirm, loading }) => (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
        <FiTrash2 size={24} className="text-red-600" />
      </div>
      <h3 className="text-base font-bold text-brand-dark mb-1">Delete {label}?</h3>
      <p className="text-sm text-brand-dark/50 mb-6">
        <strong>{item?.location_name}</strong> will be permanently deleted.
      </p>
      <div className="flex gap-3">
        <button onClick={onClose}
          className="flex-1 py-2.5 border border-brand-cream rounded-xl text-sm font-semibold text-brand-dark/60 hover:bg-brand-cream/30 transition">
          Cancel
        </button>
        <button disabled={loading} onClick={onConfirm}
          className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white rounded-xl text-sm font-semibold transition">
          {loading ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  </div>
);

// ── Main Page ─────────────────────────────────────────────
export default function LocationsPage() {
  const dispatch = useDispatch();
  const { list, loading, saving, error, success } = useSelector(s => s.locations);
  const locations = safe(list);

  const [search,     setSearch]     = useState('');
  const [showForm,   setShowForm]   = useState(false);
  const [editItem,   setEditItem]   = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);

  useEffect(() => { dispatch(fetchLocations()); }, []);

  useEffect(() => {
    if (!success && !error) return;
    if (success) { setShowForm(false); setEditItem(null); setDeleteItem(null); dispatch(fetchLocations()); }
    const t = setTimeout(() => dispatch(clearLocationMessages()), 3000);
    return () => clearTimeout(t);
  }, [success, error]);

  const filtered = useMemo(() =>
    locations.filter(l =>
      (l.location_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.address       || '').toLowerCase().includes(search.toLowerCase())
    ), [locations, search]);

  const { paginated, currentPage, totalPages, setCurrentPage, startIndex, endIndex, totalItems } = usePagination(filtered, 10);

  const totalSubs = locations.reduce((sum, l) => sum + (Number(l.sub_location_count) || 0), 0);
  const noSubs    = locations.filter(l => (Number(l.sub_location_count) || 0) === 0).length;

  return (
    <MainLayout title="Locations" subtitle="Manage physical locations">
      {(success || error) && <Toast message={success || error} type={success ? 'success' : 'error'} />}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatsCard label="Total Locations"       value={locations.length} icon="location" color="green"  sub="All registered locations" />
        <StatsCard label="Total Sub-Locations"   value={totalSubs}        icon="group"    color="blue"   sub="Across all locations" />
        <StatsCard label="Showing"               value={totalItems}       icon="chart"    color="slate"  sub="Matching current filter" />
        <StatsCard label="No Sub-Locations"      value={noSubs}           icon="warning"  color="amber"  sub="Locations without children" />
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        <div className="relative">
          <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-dark/30" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search locations..."
            className="pl-9 pr-4 py-2 rounded-lg border border-brand-cream bg-white text-sm w-60
              focus:outline-none focus:ring-2 focus:ring-brand-green placeholder:text-brand-dark/30
              text-brand-dark transition-colors duration-150" />
        </div>
        <button onClick={() => { setEditItem(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-brand-green hover:bg-brand-green-dark
            text-brand-cream-light text-sm font-semibold rounded-lg transition-colors duration-150 shadow-sm">
          <FiPlus size={15} /> Add Location
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-brand-cream/60 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-brand-cream/30 border-b border-brand-cream/60">
              {['#', 'Location Name', 'Address', 'Sub-Locations', 'Created', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-brand-dark/40 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-cream/30">
            {loading ? (
              <tr><td colSpan={6} className="py-12 text-center">
                <svg className="animate-spin w-6 h-6 mx-auto mb-2 text-brand-green" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                <p className="text-sm text-brand-dark/40">Loading...</p>
              </td></tr>
            ) : paginated.length === 0 ? (
              <tr><td colSpan={6} className="py-16 text-center">
                <div className="w-14 h-14 rounded-full bg-brand-cream/50 flex items-center justify-center mx-auto mb-3">
                  <HiOutlineLocationMarker size={26} className="text-brand-dark/20" />
                </div>
                <p className="text-sm font-semibold text-brand-dark/50">No locations found</p>
                <button onClick={() => { setEditItem(null); setShowForm(true); }}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-brand-green hover:bg-brand-green-dark
                    text-brand-cream-light text-sm font-semibold rounded-lg transition-colors duration-150">
                  <FiPlus size={14} /> Add First Location
                </button>
              </td></tr>
            ) : paginated.map(l => (
              <tr key={l.id} className="hover:bg-brand-cream/20 transition-colors">
                <td className="px-4 py-4">
                  <span className="text-xs font-mono text-brand-dark/30">#{l.id}</span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-brand-green/10 flex items-center justify-center shrink-0">
                      <TbMapPin size={16} className="text-brand-green" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-brand-dark">{l.location_name}</p>
                      {l.details && <p className="text-[10px] text-brand-dark/40 truncate max-w-[160px]">{l.details}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <p className="text-sm text-brand-dark/60 truncate max-w-[180px]">{l.address || '—'}</p>
                </td>
                <td className="px-4 py-4">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full
                    bg-brand-cream/60 text-brand-dark/60 text-xs font-bold">
                    <TbChevronRight size={11} /> {l.sub_location_count || 0}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className="text-xs text-brand-dark/40">{fmt(l.created_at)}</span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => { setEditItem(l); setShowForm(true); }}
                      className="w-7 h-7 flex items-center justify-center rounded-lg
                        bg-brand-green/10 hover:bg-brand-green/20 text-brand-green transition-colors duration-150">
                      <FiEdit2 size={13} />
                    </button>
                    <button onClick={() => setDeleteItem(l)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg
                        bg-red-50 hover:bg-red-100 text-red-500 transition-colors duration-150">
                      <FiTrash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      {totalItems > 0 && (
        <p className="text-xs text-brand-dark/40 mt-3 px-1">
          Showing {startIndex}–{endIndex} of {totalItems} locations
        </p>
      )}

      {showForm && (
        <LocationForm
          existing={editItem}
          onClose={() => { setShowForm(false); setEditItem(null); }}
          onSubmit={editItem
            ? d => dispatch(updateLocation({ id: editItem.id, data: d }))
            : d => dispatch(createLocation(d))}
          loading={saving}
        />
      )}
      {deleteItem && (
        <DeleteConfirm
          item={deleteItem} label="Location"
          onClose={() => setDeleteItem(null)}
          onConfirm={() => dispatch(deleteLocation(deleteItem.id))}
          loading={saving}
        />
      )}
    </MainLayout>
  );
}

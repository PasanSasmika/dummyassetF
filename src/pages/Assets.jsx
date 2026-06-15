import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  HiOutlineCube, HiOutlineEye, HiOutlinePencil
} from 'react-icons/hi';
import {
 HiOutlineExclamationTriangle
} from 'react-icons/hi2';
import MainLayout      from '../components/layout/MainLayout';
import Pagination      from '../components/common/Pagination';
import StatsCard       from '../components/common/StatsCard';
import usePagination   from '../hooks/usePagination';
import {
  fetchAssets, createAsset, updateAsset, clearAssetMessages,
} from '../features/assets/assetSlice';
import { fetchDepartments }  from '../features/departments/departmentSlice';
import { fetchDesignations } from '../features/designations/designationSlice';

// ─── Constants ────────────────────────────────────────────
const STATUSES   = ['Active', 'Inactive', 'Under Maintenance', 'Retired'];
const CATEGORIES = ['Hardware', 'Software', 'Network', 'Furniture', 'Vehicle', 'Other'];

const statusColors = {
  'Active':            'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
  'Inactive':          'bg-slate-100 text-slate-500 ring-1 ring-slate-200',
  'Under Maintenance': 'bg-amber-100 text-amber-700 ring-1 ring-amber-200',
  'Retired':           'bg-red-100 text-red-700 ring-1 ring-red-200',
};

const classColors = {
  High:   'bg-red-100 text-red-700 ring-1 ring-red-200',
  Medium: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200',
  Low:    'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
};

const categoryColors = {
  Hardware:  'bg-blue-100 text-blue-700',
  Software:  'bg-purple-100 text-purple-700',
  Network:   'bg-cyan-100 text-cyan-700',
  Furniture: 'bg-orange-100 text-orange-700',
  Vehicle:   'bg-teal-100 text-teal-700',
  Other:     'bg-slate-100 text-slate-600',
};

// ─── Helpers ──────────────────────────────────────────────
const safeList = (val) => (Array.isArray(val) ? val : []);

// ─── Toast ────────────────────────────────────────────────
const Toast = ({ message, type }) => (
  <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
    ${type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
    {type === 'success' ? '✅' : '❌'} {message}
  </div>
);

// ─── Modal Wrapper ────────────────────────────────────────
const Modal = ({ title, onClose, children, wide = false }) => (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className={`bg-white rounded-2xl shadow-2xl w-full ${wide ? 'max-w-2xl' : 'max-w-md'}`}>
      <div className="flex justify-between items-center p-6 pb-0">
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        <button onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition">
          ✕
        </button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

// ─── Asset View Modal ─────────────────────────────────────
const AssetViewModal = ({ asset, departments, onClose, onEdit }) => {
  if (!asset) return null;
  const deptName = safeList(departments).find(d => d.id === parseInt(asset.department_id))?.name
    || asset.department || '—';

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">

        {/* Header */}
        <div className="bg-slate-900 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center">
                <HiOutlineCube className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{asset.name}</h2>
                <p className="text-slate-400 text-sm mt-0.5">
                  {asset.category || '—'} · #{asset.id}
                </p>
              </div>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white transition">
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Status</p>
              <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold
                ${statusColors[asset.status] || 'bg-slate-100 text-slate-500'}`}>
                {asset.status || '—'}
              </span>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Classification</p>
              <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold
                ${classColors[asset.classification] || 'bg-slate-100 text-slate-500'}`}>
                {asset.classification || '—'}
              </span>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Serial Number</p>
            <p className="text-sm font-bold text-slate-800 font-mono">{asset.serial_number || '—'}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Department</p>
              <p className="text-sm font-bold text-slate-800">{deptName}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Category</p>
              <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold
                ${categoryColors[asset.category] || 'bg-slate-100 text-slate-600'}`}>
                {asset.category || '—'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Asset Value</p>
              <p className="text-sm font-bold text-slate-800">
                {asset.asset_value != null ? `$${asset.asset_value}` : '—'}
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Purchase Date</p>
              <p className="text-sm font-bold text-slate-800">
                {asset.purchase_date
                  ? new Date(asset.purchase_date).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'short', day: 'numeric',
                    })
                  : '—'}
              </p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Assigned To</p>
            <p className="text-sm font-bold text-slate-800">
              {asset.assigned_to || <span className="text-slate-400 italic font-normal">Unassigned</span>}
            </p>
          </div>

          {asset.description && (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Description</p>
              <p className="text-sm text-slate-700 leading-relaxed">{asset.description}</p>
            </div>
          )}

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Created At</p>
            <p className="text-sm font-bold text-slate-800">
              {asset.created_at
                ? new Date(asset.created_at).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'short', day: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })
                : '—'}
            </p>
          </div>

        </div>

        <div className="px-6 pb-6 pt-2 flex gap-3">
          <button onClick={() => onEdit(asset)}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold
                       transition flex items-center justify-center gap-2">
            <HiOutlinePencil className="w-4 h-4" /> Edit Asset
          </button>
          <button onClick={onClose}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition">
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

// ─── Asset Form Modal (Create / Edit) ─────────────────────
const AssetFormModal = ({ onClose, onSubmit, departments, designations, loading, initial = null }) => {
  const isEdit = !!initial;
  const [form, setForm] = useState({
    name:           initial?.name           || '',
    category:       initial?.category       || '',
    serial_number:  initial?.serial_number  || '',
    status:         initial?.status         || 'Active',
    classification: initial?.classification || 'Low',
    department_id:  initial?.department_id  || '',
    designation_id: initial?.designation_id || '',
    asset_value:    initial?.asset_value    || '',
    purchase_date:  initial?.purchase_date  || '',
    assigned_to:    initial?.assigned_to    || '',
    description:    initial?.description    || '',
  });

  const filteredDesignations = form.department_id
    ? safeList(designations).filter(d => d.department_id === parseInt(form.department_id))
    : safeList(designations);

  return (
    <Modal title={isEdit ? 'Edit Asset' : 'Add New Asset'} onClose={onClose} wide>
      <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">

        {/* Name */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Asset Name *</label>
          <input required value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Dell Laptop XPS 15"
            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Category *</label>
            <select required value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select...</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {/* Serial Number */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Serial Number</label>
            <input value={form.serial_number}
              onChange={e => setForm({ ...form, serial_number: e.target.value })}
              placeholder="e.g. SN-12345"
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Status */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Status</label>
            <select value={form.status}
              onChange={e => setForm({ ...form, status: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500">
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {/* Classification */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Classification</label>
            <select value={form.classification}
              onChange={e => setForm({ ...form, classification: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Department */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Department</label>
            <select value={form.department_id}
              onChange={e => setForm({ ...form, department_id: e.target.value, designation_id: '' })}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select...</option>
              {safeList(departments).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          {/* Designation */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Designation</label>
            <select value={form.designation_id}
              onChange={e => setForm({ ...form, designation_id: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select...</option>
              {filteredDesignations.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Asset Value */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Asset Value ($)</label>
            <input type="number" value={form.asset_value}
              onChange={e => setForm({ ...form, asset_value: e.target.value })}
              placeholder="e.g. 1500"
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {/* Purchase Date */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Purchase Date</label>
            <input type="date" value={form.purchase_date}
              onChange={e => setForm({ ...form, purchase_date: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Assigned To */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Assigned To</label>
          <input value={form.assigned_to}
            onChange={e => setForm({ ...form, assigned_to: e.target.value })}
            placeholder="Username or employee name"
            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
          <textarea rows={2} value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="Optional notes..."
            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold
                       text-slate-600 hover:bg-slate-50 transition">
            Cancel
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300
                       text-white rounded-lg text-sm font-semibold transition">
            {loading
              ? (isEdit ? 'Saving...' : 'Creating...')
              : (isEdit ? 'Save Changes' : 'Create Asset')}
          </button>
        </div>

      </form>
    </Modal>
  );
};

// ─── Main Assets Page ─────────────────────────────────────
export default function Assets() {
  const dispatch = useDispatch();
  const { list: rawList, loading, error, success } = useSelector(state => state.assets);
  const { list: rawDepts }  = useSelector(state => state.departments);
  const { list: rawDesigs } = useSelector(state => state.designations);

  // ✅ Always guarantee arrays — prevents .filter is not a function
  const list         = safeList(rawList);
  const departments  = safeList(rawDepts);
  const designations = safeList(rawDesigs);

  const [showAdd,      setShowAdd]      = useState(false);
  const [editAsset,    setEditAsset]    = useState(null);
  const [viewAsset,    setViewAsset]    = useState(null);
  const [search,       setSearch]       = useState('');
  const [catFilter,    setCatFilter]    = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [classFilter,  setClassFilter]  = useState('');

  useEffect(() => {
    dispatch(fetchAssets());
    dispatch(fetchDepartments());
    dispatch(fetchDesignations());
  }, []);

  useEffect(() => {
    if (success || error) {
      if (success) {
        dispatch(fetchAssets());
        setShowAdd(false);
        setEditAsset(null);
        setViewAsset(null);
      }
      const t = setTimeout(() => dispatch(clearAssetMessages()), 3000);
      return () => clearTimeout(t);
    }
  }, [success, error]);

  // ─── Filter ───────────────────────────────────────────
  const filtered = list.filter(a => {
    const text = `${a.name || ''} ${a.serial_number || ''} ${a.category || ''} ${a.assigned_to || ''}`.toLowerCase();
    const matchSearch = text.includes(search.toLowerCase());
    const matchCat    = catFilter    ? a.category       === catFilter    : true;
    const matchStatus = statusFilter ? a.status         === statusFilter : true;
    const matchClass  = classFilter  ? a.classification === classFilter  : true;
    return matchSearch && matchCat && matchStatus && matchClass;
  });

  const {
    paginated, currentPage, totalPages,
    setCurrentPage, reset, startIndex, endIndex, totalItems,
  } = usePagination(filtered);

  useEffect(() => { reset(); }, [search, catFilter, statusFilter, classFilter]);

  // ─── Stats ────────────────────────────────────────────
  const total       = list.length;
  const active      = list.filter(a => a.status === 'Active').length;
  const maintenance = list.filter(a => a.status === 'Under Maintenance').length;
  const retired     = list.filter(a => a.status === 'Retired').length;

  const handleCreate = (formData) => dispatch(createAsset(formData));
  const handleEdit   = (asset)    => { setViewAsset(null); setEditAsset(asset); };
  const handleUpdate = (formData) => dispatch(updateAsset({ id: editAsset.id, data: formData }));

  return (
    <MainLayout title="Assets" subtitle="Manage and track all organizational assets">

      {(success || error) && <Toast message={success || error} type={success ? 'success' : 'error'} />}

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <input
            placeholder="Search name, serial, category..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm w-72
                       focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
          />
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-600">
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-600">
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={classFilter} onChange={e => setClassFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-600">
            <option value="">All Classifications</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
          {(search || catFilter || statusFilter || classFilter) && (
            <span className="text-xs text-slate-400">{totalItems} result{totalItems !== 1 ? 's' : ''}</span>
          )}
        </div>

        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white
                     text-sm font-semibold rounded-lg transition shadow-sm shrink-0">
          <span className="text-lg leading-none">+</span> Add Asset
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatsCard
          label="Total Assets"
          value={total}
          icon="assets"
          color="blue"
          sub={`${CATEGORIES.length} categories`}
        />
        <StatsCard
          label="Active"
          value={active}
          icon="active"
          color="emerald"
          sub={total > 0 ? `${Math.round((active / total) * 100)}% of total` : '—'}
        />
        <StatsCard
          label="Under Maintenance"
          value={maintenance}
          icon="warning"
          color="amber"
          sub="needs attention"
        />
        <StatsCard
          label="Retired"
          value={retired}
          icon="inactive"
          color="red"
          sub="decommissioned"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {['Asset', 'Category', 'Serial No.', 'Department', 'Assigned To', 'Classification', 'Status', 'Actions'].map(h => (
                <th key={h}
                  className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-sm text-slate-400">
                  <svg className="animate-spin w-5 h-5 mx-auto mb-2 text-blue-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Loading...
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-sm text-slate-400">
                  No assets found.
                </td>
              </tr>
            ) : paginated.map(asset => (
              <tr key={asset.id} className="hover:bg-slate-50 transition-colors">

                {/* Asset Name */}
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                      <HiOutlineCube className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{asset.name}</p>
                      <p className="text-xs text-slate-400 font-mono">#{asset.id}</p>
                    </div>
                  </div>
                </td>

                {/* Category */}
                <td className="px-5 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold
                    ${categoryColors[asset.category] || 'bg-slate-100 text-slate-600'}`}>
                    {asset.category || '—'}
                  </span>
                </td>

                {/* Serial No */}
                <td className="px-5 py-4 text-xs font-mono text-slate-500">
                  {asset.serial_number || '—'}
                </td>

                {/* Department */}
                <td className="px-5 py-4 text-sm text-slate-600">
                  {departments.find(d => d.id === parseInt(asset.department_id))?.name
                    || asset.department || '—'}
                </td>

                {/* Assigned To */}
                <td className="px-5 py-4 text-sm text-slate-600">
                  {asset.assigned_to || <span className="text-slate-300">—</span>}
                </td>

                {/* Classification */}
                <td className="px-5 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold
                    ${classColors[asset.classification] || 'bg-slate-100 text-slate-500'}`}>
                    {asset.classification || '—'}
                  </span>
                </td>

                {/* Status */}
                <td className="px-5 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold
                    ${statusColors[asset.status] || 'bg-slate-100 text-slate-500'}`}>
                    {asset.status || '—'}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setViewAsset(asset)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold
                                 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                      <HiOutlineEye className="w-3.5 h-3.5" /> View
                    </button>
                    <button onClick={() => handleEdit(asset)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold
                                 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                      <HiOutlinePencil className="w-3.5 h-3.5" /> Edit
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
        <p className="text-xs text-slate-400 mt-3 px-1">
          Showing {startIndex}–{endIndex} of {totalItems} assets
        </p>
      )}

      {/* Modals */}
      {viewAsset && (
        <AssetViewModal
          asset={viewAsset}
          departments={departments}
          onClose={() => setViewAsset(null)}
          onEdit={handleEdit}
        />
      )}

      {(showAdd || editAsset) && (
        <AssetFormModal
          onClose={() => { setShowAdd(false); setEditAsset(null); }}
          onSubmit={editAsset ? handleUpdate : handleCreate}
          departments={departments}
          designations={designations}
          loading={loading}
          initial={editAsset}
        />
      )}

    </MainLayout>
  );
}

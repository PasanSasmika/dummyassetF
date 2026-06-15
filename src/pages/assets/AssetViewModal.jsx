import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  HiOutlineCube, HiOutlineArrowLeft, HiOutlinePencil,
  HiOutlineLocationMarker, HiOutlineUser, HiOutlineCalendar,
  HiOutlineCurrencyDollar, HiOutlineTag, HiOutlineClock,
  HiOutlineShieldCheck, HiOutlineExclamationCircle,
  HiOutlineTrash, HiOutlineChevronDown,
} from 'react-icons/hi';
import {
  TbTrash, TbTool, TbArrowsRightLeft,
  TbCheck, TbX, TbLock, TbAlertTriangle,
  TbServer, TbUser, TbDeviceLaptop, TbCloud,
  TbFileText, TbBuildingSkyscraper, TbShieldCheck,
  TbCurrencyDollar, TbMapPin, TbInfoCircle, TbDoor,
} from 'react-icons/tb';
import { FiAlertTriangle, FiLock, FiCheckCircle, FiZap, FiShield, FiSearch, FiCalendar, FiExternalLink } from 'react-icons/fi';
import MainLayout from '../../components/layout/MainLayout';
import {
  fetchAssetById, updateAsset,
  fetchAssetHistory, clearAssetMessages, clearCurrentAsset,
} from '../../features/assets/assetSlice';
import {
  fetchWarranties, createWarranty, updateWarranty,
  deleteWarranty, clearWarrantyMessages,
} from '../../features/assets/warrantySlice';
import {
  salvageAsset,
  clearSalvageMessages,
} from '../../features/salvage/salvageSlice';
import {
  fetchRepairsByAsset,
  updateRepair,
  clearRepairMessages,
  clearAssetRepairs,
} from '../../features/repairs/repairSlice';
import { fetchAssignmentHistory } from '../../features/assignments/assignmentSlice';
import { fetchDepartments }  from '../../features/departments/departmentSlice';
import { fetchDesignations } from '../../features/designations/designationSlice';
import { fetchUsers }        from '../../features/users/userSlice';
import AssetFormModal    from './AssetFormModal';
import WarrantyFormModal from './WarrantyFormModal';
import RepairModal       from './RepairModal';

// ─── Category Permission Rules (mirrors AssetFormModal exactly) ───────────────
const FINANCIAL_CATEGORIES   = ['IT Infrastructure', 'End User', 'Service', 'Digital'];
const WARRANTY_CATEGORIES    = ['IT Infrastructure', 'End User', 'Facility', 'Digital', 'Service'];
const SUPPORT_DOC_CATEGORIES = ['IT Infrastructure', 'End User', 'Service', 'Digital', 'Tangible Information', 'Facility'];
const STATUS_CATEGORIES      = ['IT Infrastructure', 'End User', 'Service', 'Digital', 'Facility'];
const LOCATION_CATEGORIES    = ['IT Infrastructure', 'End User', 'Service', 'Digital', 'Tangible Information', 'Facility'];
const REPAIR_CATEGORIES      = ['IT Infrastructure', 'End User', 'Service', 'Facility'];
const SALVAGE_CATEGORIES     = STATUS_CATEGORIES;

// ─── Color Maps ───────────────────────────────────────────
const statusColors = {
  'Available':         'bg-emerald-100 text-emerald-700',
  'In Use':            'bg-slate-200 text-slate-700',
  'In Repair':         'bg-amber-100 text-amber-700',
  'Under Maintenance': 'bg-amber-100 text-amber-700',
  'Retired':           'bg-slate-200 text-slate-500',
  'Broken':            'bg-red-100 text-red-700',
  'Inactive':          'bg-slate-100 text-slate-500',
  'Lost':              'bg-slate-200 text-slate-500',
};

const classColors = {
  High:   { badge: 'bg-red-50 text-red-600 ring-1 ring-red-200',        text: 'text-red-600'   },
  Medium: { badge: 'bg-amber-50 text-amber-600 ring-1 ring-amber-200',  text: 'text-amber-600' },
  Low:    { badge: 'bg-slate-100 text-slate-500 ring-1 ring-slate-200', text: 'text-slate-500' },
};

const warrantyStatusColors = {
  Active:  'bg-emerald-100 text-emerald-700',
  Expired: 'bg-slate-200 text-slate-500',
};

const REPAIR_STATUS_STYLES = {
  'Pending':       { bg: 'bg-slate-100',   text: 'text-slate-600'   },
  'In Progress':   { bg: 'bg-amber-100',   text: 'text-amber-700'   },
  'Completed':     { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  'Cannot Repair': { bg: 'bg-red-100',     text: 'text-red-700'     },
  'Replaced':      { bg: 'bg-slate-200',   text: 'text-slate-700'   },
};

const CONDITION_COLORS = {
  'Brand New': 'bg-emerald-100 text-emerald-700',
  'New':       'bg-emerald-100 text-emerald-700',
  'Good':      'bg-slate-100 text-slate-600',
  'Used':      'bg-amber-100 text-amber-700',
  'Fair':      'bg-amber-100 text-amber-700',
  'Poor':      'bg-amber-100 text-amber-700',
  'Damaged':   'bg-red-100 text-red-700',
};

const CONDITIONS = ['New', 'Good', 'Fair', 'Poor', 'Damaged'];

const CATEGORY_META = {
  'Human':               { Icon: TbUser,               color: '#6366f1', label: 'Human Asset'       },
  'IT Infrastructure':   { Icon: TbServer,             color: '#0ea5e9', label: 'IT Infrastructure' },
  'Service':             { Icon: TbTool,               color: '#f59e0b', label: 'Service'             },
  'Digital':             { Icon: TbCloud,              color: '#8b5cf6', label: 'Digital Asset'     },
  'Tangible Information':{ Icon: TbFileText,           color: '#10b981', label: 'Tangible Info'     },
  'End User':            { Icon: TbDeviceLaptop,       color: '#ef4444', label: 'End User Device'   },
  'Facility':            { Icon: TbBuildingSkyscraper, color: '#f97316', label: 'Facility'          },
};

const CIA_RESULT = {
  3: { classification: 'High',   color: '#ef4444', bg: '#fee2e2', text: '#991b1b' },
  2: { classification: 'Medium', color: '#f59e0b', bg: '#fef3c7', text: '#92400e' },
  1: { classification: 'Low',    color: '#22c55e', bg: '#dcfce7', text: '#166534' },
};

const safeList = (val) => (Array.isArray(val) ? val : []);
const fmt = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

// ─── Shared UI ────────────────────────────────────────────
const Section = ({ title, icon: Icon, children, accent }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
    <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2.5">
      {Icon && (
        <span className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
          style={{ background: accent ? accent + '18' : '#f1f5f9' }}>
          <Icon className="w-3.5 h-3.5" style={{ color: accent || '#94a3b8' }} />
        </span>
      )}
      <h3 className="text-sm font-bold text-slate-700">{title}</h3>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

const DetailRow = ({ label, value, mono = false, badge = null, highlight = false }) => (
  <div className={`flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0
    ${highlight ? 'bg-slate-50/50 -mx-2 px-2 rounded-lg' : ''}`}>
    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0 mr-4">{label}</p>
    {badge
      ? badge
      : <p className={`text-sm font-semibold text-slate-700 text-right max-w-[60%] truncate
          ${mono ? 'font-mono text-xs bg-slate-50 px-2 py-0.5 rounded border border-slate-100' : ''}`}>
          {value ?? <span className="text-slate-300 font-normal italic">—</span>}
        </p>}
  </div>
);

const Toast = ({ message, type }) => (
  <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
    ${type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
    {type === 'success' ? '✅' : '❌'} {message}
  </div>
);

const DeleteConfirm = ({ title, message, onConfirm, onCancel, loading }) => (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
      <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
        <HiOutlineTrash className="w-6 h-6 text-red-500" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 mb-6">{message}</p>
      <div className="flex gap-3">
        <button onClick={onCancel}
          className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">
          Cancel
        </button>
        <button onClick={onConfirm} disabled={loading}
          className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white rounded-lg text-sm font-semibold transition">
          {loading ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  </div>
);

// ─── Salvage Modal ────────────────────────────────────────
function SalvageModal({ asset, dispatch, onClose, onSuccess }) {
  const [form, setForm] = useState({
    salvage_reason: '', salvage_date: new Date().toISOString().split('T')[0],
    condition_at_salvage: '', notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.salvage_reason.trim()) { setError('Salvage reason is required.'); return; }
    if (!form.salvage_date)          { setError('Salvage date is required.');   return; }
    setError(''); setLoading(true);
    const result = await dispatch(salvageAsset({ assetId: asset.id, data: form }));
    setLoading(false);
    if (salvageAsset.fulfilled.match(result)) onSuccess();
    else setError(result.payload || 'Failed to salvage asset.');
  };

  const isActive = ['In Use'].includes(asset.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.55)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
            <TbTrash size={20} className="text-slate-600" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900">Mark as Salvaged</h2>
            <p className="text-xs text-slate-400 mt-0.5">Asset status will be set to <span className="font-bold text-slate-700">Broken</span></p>
          </div>
          <button onClick={onClose} className="ml-auto w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 text-lg font-bold transition">×</button>
        </div>
        <div className="mx-6 mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-200 flex items-center justify-center shrink-0">
            <HiOutlineCube className="w-5 h-5 text-slate-500" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-800 truncate">{asset.name}</p>
            <p className="text-[11px] font-mono text-slate-400">{asset.asset_no || `#${asset.id}`}</p>
          </div>
          <span className={`ml-auto shrink-0 px-2.5 py-1 rounded-full text-xs font-bold ${statusColors[asset.status] || 'bg-slate-100 text-slate-500'}`}>
            {asset.status}
          </span>
        </div>
        {isActive && (
          <div className="mx-6 mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
            <FiAlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 font-semibold">This asset is currently <strong>In Use</strong>. Return it before salvaging.</p>
          </div>
        )}
        <div className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Salvage Reason <span className="text-red-500">*</span></label>
            <input type="text" placeholder="e.g. Irreparable hardware damage"
              value={form.salvage_reason} onChange={e => set('salvage_reason', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 placeholder:text-slate-300" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Salvage Date <span className="text-red-500">*</span></label>
            <input type="date" value={form.salvage_date} onChange={e => set('salvage_date', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Condition at Salvage</label>
            <div className="flex gap-2 flex-wrap">
              {CONDITIONS.map(c => (
                <button key={c} type="button"
                  onClick={() => set('condition_at_salvage', form.condition_at_salvage === c ? '' : c)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition
                    ${form.condition_at_salvage === c
                      ? (CONDITION_COLORS[c] || 'bg-slate-100 text-slate-600') + ' border-transparent'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Notes</label>
            <textarea rows={3} placeholder="Additional details..." value={form.notes} onChange={e => set('notes', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 placeholder:text-slate-300 resize-none" />
          </div>
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-semibold flex items-center gap-2">
              <FiAlertTriangle size={13} className="shrink-0" /> {error}
            </div>
          )}
        </div>
        <div className="flex gap-3 px-6 pb-5">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">Cancel</button>
          <button onClick={handleSubmit} disabled={loading || isActive}
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {loading ? (<><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Salvaging...</>) : (<><TbTrash size={15} /> Confirm Salvage</>)}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Close Repair Modal ───────────────────────────────────
function CloseRepairModal({ asset, assetRepairs, dispatch, onClose, onSuccess, saving }) {
  const activeRepair = assetRepairs.find(r => r.status === 'Pending' || r.status === 'In Progress') || assetRepairs[0];
  const OUTCOMES = [
    { id: 'Completed',     icon: TbCheck,           title: 'Repair Completed',      desc: 'Asset has been fixed and is ready to use again.',               result: 'Asset → Available / In Use'                    },
    { id: 'Cannot Repair', icon: TbX,               title: 'Cannot Be Repaired',    desc: 'Asset is beyond repair. You may salvage or retire it next.',   result: 'Asset → Available (then salvage)'    },
    { id: 'Replaced',      icon: TbArrowsRightLeft, title: 'Part / Unit Replaced',  desc: 'The damaged component or unit was replaced entirely.',          result: 'Asset → Retired'                     },
  ];
  const [outcome, setOutcome]   = useState('Completed');
  const [notes, setNotes]       = useState('');
  const [cost, setCost]         = useState(activeRepair?.repair_cost ?? '');
  const [compDate, setCompDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError]       = useState('');

  const handleConfirm = async () => {
    if (!activeRepair) { setError('No active repair record found.'); return; }
    setError('');
    const data = { status: outcome, completion_date: compDate || undefined, description: notes || undefined };
    if (!activeRepair.warranty_covered && cost !== '') data.repair_cost = parseFloat(cost);
    const result = await dispatch(updateRepair({ repairId: activeRepair.id, data }));
    if (updateRepair.fulfilled.match(result)) onSuccess();
    else setError(result.payload || 'Failed to close repair.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.6)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
            <TbLock size={18} className="text-slate-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-black text-slate-900">Close Repair</h2>
            <p className="text-xs text-slate-400 mt-0.5 truncate">{asset.name} <span className="font-mono ml-1.5 text-slate-300">{asset.asset_no}</span></p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 text-lg font-bold transition">×</button>
        </div>
        <div className="px-6 py-5 space-y-5">
          {activeRepair && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
              <TbTool size={15} className="text-slate-500 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-600">
                <p className="font-black mb-0.5 text-slate-800">Active Repair #{activeRepair.id}</p>
                <p className="font-semibold opacity-80">{activeRepair.repair_type} · {activeRepair.vendor_name || 'No vendor'} · Status: <strong>{activeRepair.status}</strong></p>
                {activeRepair.warranty_covered && <p className="mt-1 font-bold text-emerald-700">✅ Warranty Covered (Free)</p>}
              </div>
            </div>
          )}
          <div>
            <p className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">Select Outcome</p>
            <div className="space-y-2">
              {OUTCOMES.map(opt => {
                const Icon = opt.icon; const active = outcome === opt.id;
                return (
                  <button key={opt.id} type="button" onClick={() => setOutcome(opt.id)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition ${active ? 'border-slate-800 bg-slate-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${active ? 'bg-slate-800' : 'bg-slate-100'}`}>
                        <Icon size={16} className={active ? 'text-white' : 'text-slate-500'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-slate-800">{opt.title}</p>
                          {active && <TbCheck size={13} className="text-slate-600" />}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{opt.desc}</p>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 shrink-0 text-right max-w-[100px]">{opt.result}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Completion Date</label>
              <input type="date" value={compDate} onChange={e => setCompDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">
                Final Cost {activeRepair?.warranty_covered && <span className="ml-1 text-emerald-600 font-bold">(Free)</span>}
              </label>
              <input type="number" min="0" step="0.01" value={cost} disabled={!!activeRepair?.warranty_covered}
                onChange={e => setCost(e.target.value)}
                className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-slate-400
                  ${activeRepair?.warranty_covered ? 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed' : 'border-slate-200'}`} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Closing Notes</label>
            <textarea rows={2} placeholder="Optional notes..." value={notes} onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 placeholder:text-slate-300 resize-none" />
          </div>
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-semibold flex items-center gap-2">
              <FiAlertTriangle size={13} className="shrink-0" /> {error}
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">Cancel</button>
            <button onClick={handleConfirm} disabled={saving || !activeRepair}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold transition disabled:opacity-40 flex items-center justify-center gap-2">
              {saving ? (<><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Closing...</>) : (<><TbLock size={15} /> Close Repair</>)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Category Detail Renderer ─────────────────────────────
const CATEGORY_FIELD_MAP = {
  'IT Infrastructure': [
    { label: 'Manufacturer',  key: 'manufacturer'  },
    { label: 'Model',         key: 'model'         },
    { label: 'Serial Number', key: 'serial_number', mono: true },
    { label: 'IP Address',    key: 'ip_address',    mono: true },
    { label: 'MAC Address',   key: 'mac_address',   mono: true },
  ],
  'Human': [
    { label: 'Designation ID',    key: 'designation_id'       },
    { label: 'Department ID',     key: 'department_id'        },
    { label: 'Assigned Employee', key: 'assigned_employee_id' },
  ],
  'Service': [
    { label: 'Provider Name',    key: 'provider_name'    },
    { label: 'Contact Person',   key: 'contact_person'   },
    { label: 'SLA Document Ref', key: 'sla_document_ref', mono: true },
    { label: 'Expiry Date',      key: 'expiry_date',      date: true },
  ],
  'Digital': [
    { label: 'Version Number', key: 'version_number'       },
    { label: 'Encryption',     key: 'encryption_algorithm' },
    { label: 'License Key',    key: 'license_key',          mono: true },
    { label: 'Storage Path',   key: 'digital_storage_path', mono: true },
  ],
  'Tangible Information': [
    { label: 'Document Type',    key: 'document_type'          },
    { label: 'Storage Location', key: 'storage_safes_location' },
    { label: 'Retention (days)', key: 'retention_period_days'  },
  ],
  'End User': [
    { label: 'Brand',            key: 'brand'            },
    { label: 'Model',            key: 'model'            },
    { label: 'Serial Number',    key: 'serial_number',    mono: true },
    { label: 'Condition',        key: 'condition',        badge: true },
    { label: 'Date of Purchase', key: 'date_of_purchase', date: true },
  ],
  'Facility': [
    { label: 'Facility Type', key: 'facility_type' },
    { label: 'Building Name', key: 'building_name' },
    { label: 'Floor Level',   key: 'floor_level'   },
    { label: 'Capacity',      key: 'capacity'      },
  ],
};

const CategoryDetails = ({ category, details, departments = [], designations = [], users = [] }) => {
  if (!details) return (
    <div className="flex flex-col items-center gap-2 py-6">
      <TbInfoCircle size={28} className="text-slate-300" />
      <p className="text-sm text-slate-400 italic">No category-specific details found.</p>
    </div>
  );

  // ── Human: resolve names from lookup lists ────────────────
  if (category === 'Human') {
    const dept  = safeList(departments).find(d => d.id === details.department_id   || d.id === Number(details.department_id));
    const desig = safeList(designations).find(d => d.id === details.designation_id || d.id === Number(details.designation_id));
    const emp   = details.assigned_employee_id
      ? safeList(users).find(u => u.id === details.assigned_employee_id || u.id === Number(details.assigned_employee_id))
      : null;

    return (
      <div className="space-y-0">
        <DetailRow label="Department"  value={dept?.name  || (details.department_id  ? `ID: ${details.department_id}`  : null)} />
        <DetailRow label="Designation" value={desig?.title || (details.designation_id ? `ID: ${details.designation_id}` : null)} />
        <DetailRow
          label="Assigned Employee"
          value={
            emp
              ? `${emp.first_name} ${emp.last_name}`
              : details.assigned_employee_id
                ? `ID: ${details.assigned_employee_id}`
                : 'Unassigned'
          }
        />
      </div>
    );
  }

  // ── All other categories: generic field map ───────────────
  const fields = CATEGORY_FIELD_MAP[category];
  if (!fields) return <p className="text-sm text-slate-400 italic">No details configured for this category.</p>;
  return (
    <div className="space-y-0">
      {fields.map(({ label, key, mono, date, badge }) => {
        let rawVal = details[key] ?? null;
        if (date && rawVal) rawVal = new Date(rawVal).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' });
        if (badge && rawVal) return (
          <DetailRow key={key} label={label} badge={
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${CONDITION_COLORS[rawVal] || 'bg-slate-100 text-slate-600'}`}>{rawVal}</span>
          } />
        );
        return <DetailRow key={key} label={label} value={rawVal} mono={mono} />;
      })}
    </div>
  );
};

// ─── CIA Rating Display ───────────────────────────────────
const CIADisplay = ({ asset }) => {
  const c = asset.cia_confidentiality ?? 1;
  const i = asset.cia_integrity       ?? 1;
  const a = asset.cia_availability    ?? 1;
  const maxVal = Math.max(c, i, a);
  const derived = CIA_RESULT[maxVal] || CIA_RESULT[1];
  const dims = [
    { label: 'Confidentiality', value: c, Icon: FiLock       },
    { label: 'Integrity',       value: i, Icon: FiCheckCircle },
    { label: 'Availability',    value: a, Icon: FiZap         },
  ];
  const levelMeta = {
    1: { bg: '#dcfce7', border: '#86efac', text: '#166534', label: 'Low'    },
    2: { bg: '#fef9c3', border: '#fde047', text: '#713f12', label: 'Medium' },
    3: { bg: '#fee2e2', border: '#fca5a5', text: '#991b1b', label: 'High'   },
  };
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {dims.map(({ label, value, Icon }) => {
          const lm = levelMeta[value] || levelMeta[1];
          return (
            <div key={label} className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 bg-white" style={{ borderColor: lm.border }}>
              <Icon size={14} className="text-slate-400" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
              <span className="text-xl font-black" style={{ color: lm.text }}>{value}</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: lm.bg, color: lm.text }}>{lm.label}</span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between px-4 py-3 rounded-xl border" style={{ background: derived.bg, borderColor: derived.color + '55' }}>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: derived.text }}>Asset Value (MAX)</p>
          <p className="text-xs text-slate-500">MAX(C={c}, I={i}, A={a}) = <strong style={{ color: derived.text }}>{maxVal}</strong></p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Value</p>
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-full text-lg font-black border-2" style={{ background: derived.bg, borderColor: derived.color, color: derived.text }}>{maxVal}</span>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Class</p>
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border-2" style={{ background: derived.bg, borderColor: derived.color, color: derived.text }}>
              <FiShield size={11} /> {derived.classification}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Ownership Display ────────────────────────────────────
const OwnershipDisplay = ({ asset }) => {
  const ownerName     = asset.owner_user_name?.trim()      !== 'null null' && asset.owner_user_name?.trim()      ? asset.owner_user_name     : null;
  const custodianName = asset.custodian_user_name?.trim() !== 'null null' && asset.custodian_user_name?.trim() ? asset.custodian_user_name : null;
  const OwnerBlock = ({ title, name, role }) => (
    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
      <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center shrink-0 text-sm font-black text-slate-500">
        {name ? name.split(' ').map(p => p[0]).join('').slice(0,2).toUpperCase() : <HiOutlineUser className="w-4 h-4" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">{title}</p>
        {name ? <p className="text-sm font-bold text-slate-800 truncate">{name}</p>
              : role ? <p className="text-sm font-bold text-slate-800 truncate">{role}</p>
              : <p className="text-sm text-slate-400 italic">Unassigned</p>}
        {name && asset.owner_designation_title && title === 'Asset Owner' && (
          <p className="text-xs text-slate-400 truncate">{asset.owner_designation_title}</p>
        )}
      </div>
    </div>
  );
  return (
    <div className="space-y-2.5">
      <OwnerBlock title="Asset Owner"     name={ownerName}     role={asset.owner_designation_title}     />
      {asset.category !== 'Human' && (
        <OwnerBlock title="Asset Custodian" name={custodianName} role={asset.custodian_designation_title} />
      )}
    </div>
  );
};

// ─── Location Display ─────────────────────────────────────
const LocationDisplay = ({ asset }) => (
  <div className="space-y-2.5">
    <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
      <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center shrink-0 mt-0.5">
        <TbMapPin size={15} className="text-slate-500" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Location</p>
        <p className="text-sm font-bold text-slate-800 truncate">
          {asset.location_name || <span className="italic text-slate-400 font-normal">Not assigned</span>}
        </p>
        {asset.location_address && <p className="text-xs text-slate-400 mt-0.5 truncate">{asset.location_address}</p>}
      </div>
    </div>
    {asset.sub_location_name && (
      <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
          <TbMapPin size={13} className="text-slate-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Sub-Location</p>
          <p className="text-sm font-bold text-slate-700 truncate">{asset.sub_location_name}</p>
          {asset.sub_location_address && <p className="text-xs text-slate-400 mt-0.5 truncate">{asset.sub_location_address}</p>}
        </div>
      </div>
    )}
  </div>
);

// ─── Support Document Display ─────────────────────────────
const SupportDocDisplay = ({ asset }) => {
  if (!asset.support_document_name) return null;
  return (
    <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
      <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
        <TbFileText size={16} className="text-indigo-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 mb-0.5">{asset.support_document_type || 'Support Document'}</p>
        <p className="text-sm font-bold text-indigo-800 truncate">{asset.support_document_name}</p>
      </div>
      {asset.support_document_path && (
        <a href={`${import.meta.env.VITE_BASE_PATH}/${asset.support_document_path}`} target="_blank" rel="noreferrer"
          className="shrink-0 px-3 py-1.5 bg-indigo-500 text-white text-xs font-bold rounded-lg hover:bg-indigo-600 transition">
          View
        </a>
      )}
    </div>
  );
};

// ─── Financial Display ────────────────────────────────────
const FinancialDisplay = ({ asset, safeRepairs }) => {
  const totalRepairCost = safeRepairs.filter(r => !r.warranty_covered && r.repair_cost != null)
    .reduce((sum, r) => sum + parseFloat(r.repair_cost), 0);
  const currency = asset.currency || 'LKR';
  return (
    <div className="space-y-3">
      {asset.financial_type && asset.financial_type !== 'None' && (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold">
          <TbCurrencyDollar size={12} /> {asset.financial_type}
        </div>
      )}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Asset Cost</p>
        <p className="text-2xl font-black text-slate-800">
          {asset.cost
            ? `${currency} ${parseFloat(asset.cost).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
            : <span className="text-slate-300 text-lg font-normal italic">Not recorded</span>}
        </p>
      </div>
      {asset.po_number && (
        <div className="border-t border-slate-100 pt-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">PO Number</p>
          <p className="text-sm font-mono font-bold text-slate-700">{asset.po_number}</p>
        </div>
      )}
      {totalRepairCost > 0 && (
        <div className="border-t border-slate-100 pt-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Repair Cost</p>
          <p className="text-xl font-black text-slate-700">{currency} {totalRepairCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
      )}
      {asset.net_value != null && parseFloat(asset.net_value) > 0 && (
        <div className="border-t border-slate-100 pt-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Net Value</p>
          <p className="text-sm font-bold text-slate-700">{currency} {parseFloat(asset.net_value).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
      )}
    </div>
  );
};

// ─── Warranty Card ────────────────────────────────────────
const WarrantyCard = ({ warranty, onEdit, onDelete }) => {
  const isActive = warranty.status === 'Active';
  const daysLeft = warranty.days_remaining;
  return (
    <div className={`rounded-xl border p-4 ${isActive ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50'}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-bold text-slate-800">{warranty.provider_name}</p>
          <p className="text-xs text-slate-400 mt-0.5">{warranty.warranty_period_months} month{warranty.warranty_period_months !== 1 ? 's' : ''} coverage</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${warrantyStatusColors[warranty.status]}`}>{warranty.status}</span>
          <button onClick={onEdit} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"><HiOutlinePencil className="w-3.5 h-3.5" /></button>
          <button onClick={onDelete} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition"><HiOutlineTrash className="w-3.5 h-3.5" /></button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div><p className="text-xs text-slate-400 mb-0.5">Start Date</p><p className="text-xs font-bold text-slate-700">{new Date(warranty.start_date).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' })}</p></div>
        <div><p className="text-xs text-slate-400 mb-0.5">End Date</p><p className="text-xs font-bold text-slate-700">{new Date(warranty.end_date).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' })}</p></div>
      </div>
      {isActive && daysLeft !== null && (
        <div className="mb-3">
          <div className="flex justify-between mb-1">
            <p className="text-xs text-slate-400">Time Remaining</p>
            <p className={`text-xs font-bold ${daysLeft <= 30 ? 'text-red-500' : daysLeft <= 90 ? 'text-amber-600' : 'text-slate-600'}`}>{daysLeft} days</p>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5">
            <div className={`h-1.5 rounded-full transition-all ${daysLeft <= 30 ? 'bg-red-400' : daysLeft <= 90 ? 'bg-amber-400' : 'bg-slate-500'}`}
              style={{ width: `${Math.min(100, Math.max(2, (daysLeft / (warranty.warranty_period_months * 30)) * 100))}%` }} />
          </div>
        </div>
      )}
      {warranty.coverage_details && (
        <p className="text-xs text-slate-500 leading-relaxed border-t border-slate-100 pt-2 mt-1">{warranty.coverage_details}</p>
      )}
    </div>
  );
};

// ─── Repair History Card ──────────────────────────────────
const RepairCard = ({ repair }) => {
  const ss = REPAIR_STATUS_STYLES[repair.status] || REPAIR_STATUS_STYLES['Pending'];
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold ${ss.bg} ${ss.text}`}>{repair.status}</span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-600"><TbTool size={10} /> {repair.repair_type}</span>
          {repair.warranty_covered && <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-black rounded">FREE</span>}
        </div>
        <p className="text-[10px] text-slate-400 shrink-0">#{repair.id}</p>
      </div>
      {repair.description && <p className="text-xs text-slate-500 mb-2.5 leading-relaxed">{repair.description}</p>}
      <div className="flex items-center justify-between text-[11px] text-slate-400 flex-wrap gap-1">
        <span>{repair.vendor_name || 'No vendor'}</span>
        <span>{repair.warranty_covered ? <span className="text-emerald-600 font-bold">Free</span> : repair.repair_cost != null ? `$${parseFloat(repair.repair_cost).toFixed(2)}` : '—'}</span>
        <span>{fmt(repair.start_date)}</span>
      </div>
    </div>
  );
};

// ─── Document History Helpers ─────────────────────────────
const ASSIGN_STATUS_COLORS = {
  Assigned: 'bg-slate-200 text-slate-700',
  Returned: 'bg-emerald-100 text-emerald-700',
  Overdue:  'bg-red-100 text-red-700',
};

const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'http://localhost:5000';
const fileUrl = (filePath) => {
  if (!filePath) return null;
  if (filePath.startsWith('http')) return filePath;
  return `${API_BASE}/${filePath.replace(/^\//, '').replace(/^src\//, '')}`;
};

const entryStatus = (entry) => {
  const isOverdue = entry.status === 'Assigned' && entry.expected_return_date
    && new Date(entry.expected_return_date) < new Date();
  return isOverdue ? 'Overdue' : entry.status;
};

// ─── DocAccordion ─────────────────────────────────────────
function DocAccordion({ title, icon: Icon, accent, count, open, onToggle, search, onSearch, placeholder, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition ${open ? 'border-b border-slate-100' : ''}`}
      >
        <div className="flex items-center gap-2.5">
          <span className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
            style={{ background: accent + '18' }}>
            <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
          </span>
          <h3 className="text-sm font-bold text-slate-700">{title}</h3>
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${count > 0 ? 'bg-slate-100 text-slate-600' : 'bg-slate-50 text-slate-300'}`}>
            {count}
          </span>
        </div>
        <HiOutlineChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="p-5">
          {count > 0 && (
            <div className="relative mb-4">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                value={search}
                onChange={e => onSearch(e.target.value)}
                placeholder={placeholder}
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl
                  focus:outline-none focus:ring-2 focus:ring-slate-300 placeholder:text-slate-300"
              />
            </div>
          )}
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Gate Pass Row ────────────────────────────────────────
const GatePassRow = ({ entry }) => {
  const status = entryStatus(entry);
  const ss = ASSIGN_STATUS_COLORS[status] || 'bg-slate-100 text-slate-500';
  return (
    <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <p className="text-xs font-black text-slate-600 font-mono truncate max-w-[180px]">
            {entry.gate_pass_doc_name || `GP-${entry.id}`}
          </p>
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${ss}`}>{status}</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
          {entry.assigned_to_name && (
            <span className="flex items-center gap-1"><TbUser size={10} />{entry.assigned_to_name}</span>
          )}
          <span className="flex items-center gap-1"><FiCalendar size={10} />{fmt(entry.assignment_date)}</span>
          {entry.gate_pass_doc_uploaded_at && (
            <span>Uploaded {fmt(entry.gate_pass_doc_uploaded_at)}</span>
          )}
        </div>
      </div>
      <a href={fileUrl(entry.gate_pass_doc_path)} target="_blank" rel="noreferrer"
        className="shrink-0 flex items-center gap-1 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-[11px] font-bold rounded-lg transition">
        <FiExternalLink size={10} /> View
      </a>
    </div>
  );
};

// ─── Assignment Note Row ──────────────────────────────────
const AssignNoteRow = ({ entry }) => {
  const status = entryStatus(entry);
  const ss = ASSIGN_STATUS_COLORS[status] || 'bg-slate-100 text-slate-500';
  return (
    <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <p className="text-xs font-black text-slate-600 font-mono truncate max-w-[180px]">
            {entry.assign_doc_name || `AN-${entry.id}`}
          </p>
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${ss}`}>{status}</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
          {entry.assigned_to_name && (
            <span className="flex items-center gap-1"><TbUser size={10} />{entry.assigned_to_name}</span>
          )}
          <span className="flex items-center gap-1"><FiCalendar size={10} />{fmt(entry.assignment_date)}</span>
          {entry.assign_doc_uploaded_at && (
            <span>Uploaded {fmt(entry.assign_doc_uploaded_at)}</span>
          )}
        </div>
      </div>
      {entry.assign_doc_path ? (
        <a href={fileUrl(entry.assign_doc_path)} target="_blank" rel="noreferrer"
          className="shrink-0 flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white text-[11px] font-bold rounded-lg transition">
          <FiExternalLink size={10} /> View
        </a>
      ) : (
        <span className="text-[11px] text-slate-300 shrink-0">No file</span>
      )}
    </div>
  );
};

// ─── Repair Document Row ─────────────────────────────────
const RepairDocRow = ({ repair }) => {
  const ss = REPAIR_STATUS_STYLES[repair.status] || REPAIR_STATUS_STYLES['Pending'];
  return (
    <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-amber-100 bg-amber-50/40 hover:bg-amber-50 transition">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <p className="text-xs font-black text-slate-700 truncate max-w-[180px]">
            {repair.repair_type} Repair — Doc #{repair.id}
          </p>
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${ss.bg} ${ss.text}`}>{repair.status}</span>
          {repair.warranty_covered
            ? <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-black rounded">WARRANTY</span>
            : null}
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
          {repair.vendor_name && <span className="flex items-center gap-1"><TbTool size={10} />{repair.vendor_name}</span>}
          <span className="flex items-center gap-1"><FiCalendar size={10} />{fmt(repair.start_date)}</span>
          {repair.description && <span className="truncate max-w-[140px]">{repair.description}</span>}
        </div>
      </div>
      <a href={fileUrl(repair.warranty_document)} target="_blank" rel="noreferrer"
        className="shrink-0 flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold rounded-lg transition">
        <FiExternalLink size={10} /> View
      </a>
    </div>
  );
};

// ─── Return Note Row ──────────────────────────────────────
const ReturnNoteRow = ({ entry }) => (
  <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition">
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2 flex-wrap mb-0.5">
        <p className="text-xs font-black text-slate-600 font-mono truncate max-w-[180px]">
          {entry.return_doc_name || `RN-${entry.id}`}
        </p>
        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-700">Returned</span>
      </div>
      <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
        {entry.assigned_to_name && (
          <span className="flex items-center gap-1"><TbUser size={10} />{entry.assigned_to_name}</span>
        )}
        <span className="flex items-center gap-1">
          <FiCalendar size={10} />Returned {fmt(entry.actual_return_date)}
        </span>
        {entry.return_doc_uploaded_at && (
          <span>Uploaded {fmt(entry.return_doc_uploaded_at)}</span>
        )}
        {entry.condition_in && (
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${CONDITION_COLORS[entry.condition_in] || 'bg-slate-100 text-slate-600'}`}>
            In: {entry.condition_in}
          </span>
        )}
      </div>
    </div>
    <a href={fileUrl(entry.return_doc_path)} target="_blank" rel="noreferrer"
      className="shrink-0 flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition">
      <FiExternalLink size={10} /> View
    </a>
  </div>
);

// ─── Main Page ────────────────────────────────────────────
export default function AssetDetail() {
  const { id }   = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { current: asset, history, loading, saving, error, success } = useSelector(s => s.assets);
  const { saving: salvageSaving, error: salvageError, success: salvageSuccess } = useSelector(s => s.salvage);
  const { assetRepairs, saving: repairSaving, error: repairError, success: repairSuccess } = useSelector(s => s.repairs);
  const { list: warranties, saving: wSaving, error: wError, success: wSuccess } = useSelector(s => s.warranties);
  const { history: assignmentHistory } = useSelector(s => s.assignments);
  const { list: rawDepts }  = useSelector(s => s.departments);
  const { list: rawDesigs } = useSelector(s => s.designations);
  const { list: rawUsers }  = useSelector(s => s.users);
  const departments  = safeList(rawDepts);
  const designations = safeList(rawDesigs);
  const users        = safeList(rawUsers);

  const [showEdit,          setShowEdit]          = useState(false);
  const [showSalvage,       setShowSalvage]       = useState(false);
  const [showRepair,        setShowRepair]        = useState(false);
  const [showCloseRepair,  setShowCloseRepair]  = useState(false);
  const [showAddWarranty,  setShowAddWarranty]  = useState(false);
  const [editWarranty,     setEditWarranty]     = useState(null);
  const [deleteWarrantyId, setDeleteWarrantyId] = useState(null);

  // Document accordion state
  const [openGP, setOpenGP] = useState(true);
  const [openAN, setOpenAN] = useState(false);
  const [openRN, setOpenRN] = useState(false);
  const [openRD, setOpenRD] = useState(true);
  const [gpSearch, setGpSearch] = useState('');
  const [anSearch, setAnSearch] = useState('');
  const [rnSearch, setRnSearch] = useState('');
  const [rdSearch, setRdSearch] = useState('');

  useEffect(() => {
    dispatch(fetchAssetById(id));
    dispatch(fetchWarranties(id));
    dispatch(fetchAssetHistory(id));
    dispatch(fetchRepairsByAsset(id));
    dispatch(fetchAssignmentHistory(id));
    dispatch(fetchDepartments());
    dispatch(fetchDesignations());
    dispatch(fetchUsers());
    return () => { dispatch(clearCurrentAsset()); dispatch(clearAssetRepairs()); };
  }, [id]);

  useEffect(() => {
    if (success || error) {
      if (success) { setShowEdit(false); dispatch(fetchAssetById(id)); }
      const t = setTimeout(() => dispatch(clearAssetMessages()), 3000);
      return () => clearTimeout(t);
    }
  }, [success, error]);

  useEffect(() => {
    if (salvageSuccess || salvageError) {
      if (salvageSuccess) { setShowSalvage(false); dispatch(fetchAssetById(id)); dispatch(fetchAssetHistory(id)); }
      const t = setTimeout(() => dispatch(clearSalvageMessages()), 3500);
      return () => clearTimeout(t);
    }
  }, [salvageSuccess, salvageError]);

  useEffect(() => {
    if (repairSuccess || repairError) {
      if (repairSuccess) { setShowRepair(false); setShowCloseRepair(false); dispatch(fetchAssetById(id)); dispatch(fetchRepairsByAsset(id)); dispatch(fetchAssetHistory(id)); }
      const t = setTimeout(() => dispatch(clearRepairMessages()), 3500);
      return () => clearTimeout(t);
    }
  }, [repairSuccess, repairError]);

  useEffect(() => {
    if (wSuccess || wError) {
      if (wSuccess) { setShowAddWarranty(false); setEditWarranty(null); setDeleteWarrantyId(null); dispatch(fetchWarranties(id)); }
      const t = setTimeout(() => dispatch(clearWarrantyMessages()), 3000);
      return () => clearTimeout(t);
    }
  }, [wSuccess, wError]);

  if (loading && !asset) return (
    <MainLayout title="Asset Detail" subtitle="">
      <div className="flex items-center justify-center py-32">
        <svg className="animate-spin w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      </div>
    </MainLayout>
  );

  if (!asset) return (
    <MainLayout title="Not Found" subtitle="">
      <div className="text-center py-32">
        <p className="text-slate-400 mb-4">Asset not found.</p>
        <button onClick={() => navigate('/assets')} className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-semibold">Back to Assets</button>
      </div>
    </MainLayout>
  );

  const cl             = classColors[asset.classification] || classColors.Low;
  const categoryDets   = asset.category_details || null;
  const categoryMeta   = CATEGORY_META[asset.category] || null;
  const safeWarranties = safeList(warranties);
  const activeWarranties  = safeWarranties.filter(w => w.status === 'Active');
  const expiredWarranties = safeWarranties.filter(w => w.status === 'Expired');
  const safeHistory    = safeList(history);
  const safeRepairs    = safeList(assetRepairs);
  const safeAssignmentHistory = safeList(assignmentHistory);

  // ── Document accordion data ──
  const gpEntries = safeAssignmentHistory.filter(a => !!a.gate_pass_doc_id);
  const anEntries = safeAssignmentHistory.filter(a => !!a.assign_doc_id);
  const rnEntries = safeAssignmentHistory.filter(a => !!a.return_doc_id);

  const docSearch = (list, q, fields) => {
    if (!q) return list;
    const lower = q.toLowerCase();
    return list.filter(e => fields.some(f => String(e[f] || '').toLowerCase().includes(lower)));
  };

  const rdEntries  = safeRepairs.filter(r => !!r.warranty_document);

  const filteredGP = docSearch(gpEntries, gpSearch, ['gate_pass_doc_name', 'assigned_to_name', 'assignment_date', 'gate_pass_doc_uploaded_at']);
  const filteredAN = docSearch(anEntries, anSearch, ['assign_doc_name', 'assigned_to_name', 'assignment_date', 'assign_doc_uploaded_at']);
  const filteredRN = docSearch(rnEntries, rnSearch, ['return_doc_name', 'assigned_to_name', 'actual_return_date', 'return_doc_uploaded_at']);
  const filteredRD = docSearch(rdEntries, rdSearch, ['repair_type', 'vendor_name', 'description']);

  // ── Category permission flags (mirrors AssetFormModal) ──
  const cat              = asset.category;
  const showFinancial    = FINANCIAL_CATEGORIES.includes(cat);
  const showWarranty     = WARRANTY_CATEGORIES.includes(cat);
  const showSupportDoc   = SUPPORT_DOC_CATEGORIES.includes(cat);
  const showStatus       = STATUS_CATEGORIES.includes(cat);
  const showLocation     = LOCATION_CATEGORIES.includes(cat);
  const showRepairOption = REPAIR_CATEGORIES.includes(cat);
  const showSalvageOption= SALVAGE_CATEGORIES.includes(cat);

  const isEditLocked      = ['In Maintenance', 'In Repair', 'Broken'].includes(asset.status);
  const isAlreadySalvaged = asset.status === 'Broken';
  const isInUse           = asset.status === 'In Use';
  const isInRepair        = asset.status === 'In Repair';

  return (
    <MainLayout
      title={asset.name}
      subtitle={`${asset.asset_no || `#${asset.id}`}${asset.asset_type_name ? ` · ${asset.asset_type_name}` : ''}`}
    >
      {/* Toasts */}
      {(success        || error)        && <Toast message={success        || error}        type={success        ? 'success' : 'error'} />}
      {(wSuccess       || wError)       && <Toast message={wSuccess       || wError}       type={wSuccess       ? 'success' : 'error'} />}
      {(salvageSuccess || salvageError) && <Toast message={salvageSuccess || salvageError} type={salvageSuccess ? 'success' : 'error'} />}
      {(repairSuccess  || repairError)  && <Toast message={repairSuccess  || repairError}  type={repairSuccess  ? 'success' : 'error'} />}

      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <button onClick={() => navigate('/assets')}
          className="flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-slate-700 transition">
          <HiOutlineArrowLeft className="w-4 h-4" /> Back to Assets
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => !isEditLocked && setShowEdit(true)}
            disabled={isEditLocked}
            title={isEditLocked ? `Cannot edit — asset is ${asset.status}` : 'Edit asset'}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition shadow-sm
              ${isEditLocked
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-slate-800 hover:bg-slate-900 text-white'}`}>
            <HiOutlinePencil className="w-4 h-4" /> Edit Asset
          </button>

          {/* Repair button — only for REPAIR_CATEGORIES */}
          {showRepairOption && !isAlreadySalvaged && (
            isInRepair ? (
              <button onClick={() => setShowCloseRepair(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100">
                <TbLock size={16} /> Close Repair
              </button>
            ) : (
              <button onClick={() => setShowRepair(true)}
                title="Send asset for repair"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition border bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50">
                <TbTool size={16} /> Repair Asset
              </button>
            )
          )}

          {/* Salvage button — only for SALVAGE_CATEGORIES */}
          {showSalvageOption && (
            isAlreadySalvaged ? (
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-500 text-sm font-semibold">
                <TbTrash size={16} /> Salvaged
              </div>
            ) : (
              <button onClick={() => !isInUse && setShowSalvage(true)}
                disabled={isInUse}
                title={isInUse ? 'Return asset before salvaging' : 'Mark as Salvaged'}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition border
                  ${isInUse ? 'bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed' : 'bg-white border-slate-200 text-slate-600 hover:border-red-200 hover:text-red-600 hover:bg-red-50'}`}>
                <TbTrash size={16} /> Mark as Salvaged
              </button>
            )
          )}
        </div>
      </div>

      {/* Status banners — only for applicable categories */}
      {showSalvageOption && isInUse && !isAlreadySalvaged && !isInRepair && (
        <div className="mb-5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
          <FiAlertTriangle size={15} className="text-amber-500 shrink-0" />
          <p className="text-sm text-amber-700">This asset is currently <strong>In Use</strong>. Return it before salvaging.</p>
        </div>
      )}
      {showRepairOption && isInRepair && (
        <div className="mb-5 p-3.5 bg-slate-100 border border-slate-200 rounded-xl flex items-center gap-3">
          <TbTool size={15} className="text-slate-500 shrink-0" />
          <p className="text-sm text-slate-600">This asset is currently <strong>In Repair</strong>. Use Close Repair when done.</p>
        </div>
      )}

      {/* ── Hero Card ── */}
      <div className="rounded-2xl p-8 mb-6 relative overflow-hidden bg-slate-900">
        <div className="absolute -top-10 -right-10 w-52 h-52 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-52 h-52 bg-white/3 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex items-center justify-between flex-wrap gap-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: categoryMeta ? categoryMeta.color + '22' : 'rgba(255,255,255,0.1)' }}>
              {categoryMeta ? <categoryMeta.Icon size={40} style={{ color: categoryMeta.color }} /> : <HiOutlineCube className="w-10 h-10 text-white/80" />}
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">{asset.name}</h1>
              <p className="text-slate-400 mt-1 text-sm font-mono">{asset.asset_no || `#${asset.id}`}</p>
              {asset.asset_type_name && <p className="text-slate-400 text-xs mt-0.5">{asset.asset_type_name}</p>}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {/* Status badge only for STATUS_CATEGORIES */}
                {showStatus && (
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColors[asset.status] || 'bg-slate-100 text-slate-500'}`}>
                    {asset.status}
                  </span>
                )}
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-white/80">{asset.category}</span>
                {asset.classification && (
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${cl.badge}`}>{asset.classification}</span>
                )}
                {showSalvageOption && isAlreadySalvaged && (
                  <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-white/60"><TbTrash size={11} /> Salvaged</span>
                )}
                {showRepairOption && isInRepair && (
                  <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300"><TbTool size={11} /> Under Repair</span>
                )}
                {showWarranty && !isAlreadySalvaged && activeWarranties.length > 0 && (
                  <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300">
                    <HiOutlineShieldCheck className="w-3 h-3" /> {activeWarranties.length} Warrant{activeWarranties.length === 1 ? 'y' : 'ies'}
                  </span>
                )}
              </div>
            </div>
          </div>
          {showFinancial && asset.cost && (
            <div className="bg-white/8 rounded-2xl px-6 py-4 text-right shrink-0">
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Asset Cost</p>
              <p className="text-3xl font-black text-white">{asset.currency || 'LKR'} {parseFloat(asset.cost).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              {asset.po_number && <p className="text-slate-400 text-xs mt-1 font-mono">PO: {asset.po_number}</p>}
            </div>
          )}
        </div>
        {asset.description && (
          <div className="relative mt-5 pt-5 border-t border-white/10">
            <p className="text-slate-400 text-sm leading-relaxed">{asset.description}</p>
          </div>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-3 gap-6">

        {/* ── Left / Main column ── */}
        <div className="col-span-2 space-y-6">

          {/* Quick info tiles — filtered by category */}
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                show: true,
                icon: HiOutlineLocationMarker, label: 'Location',
                value: showLocation ? (asset.location_name || '—') : null,
              },
              {
                show: true,
                icon: HiOutlineUser, label: 'Owner',
                value: (asset.owner_user_name?.trim() !== 'null null' && asset.owner_user_name)
                  || asset.owner_designation_title || '—',
              },
              {
                show: true,
                icon: HiOutlineTag, label: 'Asset Type',
                value: asset.asset_type_name || '—',
              },
              {
                // Cost — only FINANCIAL_CATEGORIES
                show: showFinancial,
                icon: HiOutlineCurrencyDollar, label: 'Cost',
                value: asset.cost
                  ? `${asset.currency || 'LKR'} ${parseFloat(asset.cost).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                  : '—',
              },
              {
                // Date of Purchase — only End User (lives in asset_end_user)
                show: cat === 'End User',
                icon: HiOutlineCalendar, label: 'Date of Purchase',
                value: (categoryDets?.date_of_purchase || asset.date_of_purchase)
                  ? new Date(categoryDets?.date_of_purchase || asset.date_of_purchase)
                      .toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' })
                  : '—',
              },
              {
                show: true,
                icon: HiOutlineClock, label: 'Created',
                value: asset.created_at
                  ? new Date(asset.created_at).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' })
                  : '—',
              },
            ].filter(t => t.show && t.value !== null).map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-3.5 h-3.5 text-slate-400" />
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
                </div>
                <p className="text-sm font-bold text-slate-700 truncate">{value || '—'}</p>
              </div>
            ))}
          </div>

          {/* Category-specific details */}
          <Section title={`${asset.category} Details`} icon={categoryMeta?.Icon || HiOutlineTag} accent={categoryMeta?.color}>
            <CategoryDetails
              category={asset.category}
              details={categoryDets}
              departments={departments}
              designations={designations}
              users={users}
            />
          </Section>

          {/* Location — only for LOCATION_CATEGORIES */}
          {showLocation && (
            <Section title="Location" icon={TbMapPin} accent="#6366f1">
              <LocationDisplay asset={asset} />
            </Section>
          )}

          {/* Ownership */}
          <Section title="Ownership" icon={HiOutlineUser} accent="#6366f1">
            <OwnershipDisplay asset={asset} />
          </Section>

          {/* CIA Security Rating */}
          <Section title="CIA Security Rating" icon={FiShield} accent="#6366f1">
            <CIADisplay asset={asset} />
          </Section>

          {/* Warranties — only for WARRANTY_CATEGORIES */}
          {showWarranty && (
            <Section title="Warranties" icon={HiOutlineShieldCheck} accent="#10b981">
              {(wSuccess || wError) && (
                <div className={`mb-4 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium
                  ${wSuccess ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                  {wSuccess ? '✅' : '❌'} {wSuccess || wError}
                </div>
              )}
              <div className="flex items-center justify-between mb-5">
                <p className="text-sm text-slate-400">
                  {safeWarranties.length === 0 ? 'No warranties registered' : `${safeWarranties.length} warrant${safeWarranties.length === 1 ? 'y' : 'ies'} · ${activeWarranties.length} active`}
                </p>
                <button onClick={() => setShowAddWarranty(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition">
                  + Add Warranty
                </button>
              </div>
              {safeWarranties.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl">
                  <HiOutlineShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-500 mb-1">No Warranties Registered</p>
                  <p className="text-xs text-slate-400 mb-4">Add a warranty to track coverage and expiry dates.</p>
                  <button onClick={() => setShowAddWarranty(true)} className="px-4 py-2 bg-slate-800 text-white text-xs font-semibold rounded-lg hover:bg-slate-900 transition">Add First Warranty</button>
                </div>
              ) : (
                <div className="space-y-5">
                  {activeWarranties.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Active ({activeWarranties.length})</p>
                      <div className="space-y-3">{activeWarranties.map(w => <WarrantyCard key={w.id} warranty={w} onEdit={() => setEditWarranty(w)} onDelete={() => setDeleteWarrantyId(w.id)} />)}</div>
                    </div>
                  )}
                  {expiredWarranties.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Expired ({expiredWarranties.length})</p>
                      <div className="space-y-3">{expiredWarranties.map(w => <WarrantyCard key={w.id} warranty={w} onEdit={() => setEditWarranty(w)} onDelete={() => setDeleteWarrantyId(w.id)} />)}</div>
                    </div>
                  )}
                </div>
              )}
            </Section>
          )}

          {/* Repair History — only for REPAIR_CATEGORIES */}
          {showRepairOption && (
            <Section title="Repair History" icon={TbTool} accent="#f59e0b">
              <div className="flex items-center justify-between mb-5">
                <p className="text-sm text-slate-400">
                  {safeRepairs.length === 0 ? 'No repair records' : `${safeRepairs.length} repair record${safeRepairs.length !== 1 ? 's' : ''}`}
                </p>
                {!isAlreadySalvaged && !isInRepair && (
                  <button onClick={() => setShowRepair(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition">
                    <TbTool size={12} /> + New Repair
                  </button>
                )}
                {isInRepair && (
                  <span className="px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg border border-amber-200">Currently Under Repair</span>
                )}
              </div>
              {safeRepairs.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl">
                  <TbTool size={36} className="text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-500 mb-1">No Repairs Yet</p>
                  <p className="text-xs text-slate-400 mb-4">Repair records will appear here once created.</p>
                  {!isAlreadySalvaged && !isInRepair && (
                    <button onClick={() => setShowRepair(true)} className="px-4 py-2 bg-slate-800 text-white text-xs font-semibold rounded-lg hover:bg-slate-900 transition">Create First Repair</button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">{safeRepairs.map(r => <RepairCard key={r.id} repair={r} />)}</div>
              )}
            </Section>
          )}

          {/* ── Document Accordions ── */}
          <div className="space-y-3">

            {/* Asset Document — uploaded during asset creation */}
            {showSupportDoc && asset.support_document_name && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                    style={{ background: '#64748b18' }}>
                    <TbFileText className="w-3.5 h-3.5" style={{ color: '#64748b' }} />
                  </span>
                  <h3 className="text-sm font-bold text-slate-700">Asset Document</h3>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">1</span>
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-100 bg-slate-50/50">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-black text-slate-600 font-mono truncate max-w-[200px]">
                        {asset.support_document_name}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {asset.support_document_type || 'Support Document'} · Uploaded during asset creation
                      </p>
                    </div>
                    <a
                      href={fileUrl(asset.support_document_path)} target="_blank" rel="noreferrer"
                      className="shrink-0 flex items-center gap-1 px-3 py-1.5 bg-slate-600 hover:bg-slate-700 text-white text-[11px] font-bold rounded-lg transition"
                    >
                      <FiExternalLink size={10} /> View
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Gate Passes */}
            <DocAccordion
              title="Gate Passes" icon={TbDoor} accent="#6366f1"
              count={gpEntries.length}
              open={openGP} onToggle={() => setOpenGP(o => !o)}
              search={gpSearch} onSearch={setGpSearch}
              placeholder="Search by name, user, date..."
            >
              {filteredGP.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">
                  <TbDoor size={32} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-500">
                    {gpEntries.length === 0 ? 'No gate passes uploaded' : 'No results'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredGP.map(a => <GatePassRow key={a.id} entry={a} />)}
                </div>
              )}
            </DocAccordion>

            {/* Repair Documents */}
            {showRepairOption && (
              <DocAccordion
                title="Repair Documents" icon={TbTool} accent="#d97706"
                count={rdEntries.length}
                open={openRD} onToggle={() => setOpenRD(o => !o)}
                search={rdSearch} onSearch={setRdSearch}
                placeholder="Search by type, vendor, description..."
              >
                {filteredRD.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-amber-100 rounded-xl">
                    <TbTool size={32} className="text-amber-200 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-500">
                      {rdEntries.length === 0 ? 'No repair documents uploaded' : 'No results'}
                    </p>
                    {rdEntries.length === 0 && (
                      <p className="text-xs text-slate-400 mt-1">Documents uploaded during repair creation appear here.</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredRD.map(r => <RepairDocRow key={r.id} repair={r} />)}
                  </div>
                )}
              </DocAccordion>
            )}

            {/* Assignment Notes */}
            <DocAccordion
              title="Assignment Notes" icon={TbFileText} accent="#0ea5e9"
              count={anEntries.length}
              open={openAN} onToggle={() => setOpenAN(o => !o)}
              search={anSearch} onSearch={setAnSearch}
              placeholder="Search by name, user, date..."
            >
              {filteredAN.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">
                  <TbFileText size={32} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-500">
                    {anEntries.length === 0 ? 'No assignment notes uploaded' : 'No results'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredAN.map(a => <AssignNoteRow key={a.id} entry={a} />)}
                </div>
              )}
            </DocAccordion>

            {/* Return Notes */}
            <DocAccordion
              title="Return Notes" icon={TbArrowsRightLeft} accent="#10b981"
              count={rnEntries.length}
              open={openRN} onToggle={() => setOpenRN(o => !o)}
              search={rnSearch} onSearch={setRnSearch}
              placeholder="Search by name, user, date..."
            >
              {filteredRN.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">
                  <TbArrowsRightLeft size={32} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-500">
                    {rnEntries.length === 0 ? 'No return notes uploaded' : 'No results'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredRN.map(a => <ReturnNoteRow key={a.id} entry={a} />)}
                </div>
              )}
            </DocAccordion>

          </div>

          {/* Asset History */}
          <Section title="Asset History" icon={HiOutlineClock} accent="#64748b">
            {safeHistory.length === 0 ? (
              <div className="text-center py-8">
                <HiOutlineClock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No history recorded yet.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {safeHistory.map((h, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="flex flex-col items-center shrink-0 mt-1">
                      <div className="w-2 h-2 rounded-full bg-slate-400" />
                      {i < safeHistory.length - 1 && <div className="w-px h-8 bg-slate-200 mt-1" />}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-700">{h.change_type || h.action || h.event || 'Update'}</p>
                      <p className="text-xs text-slate-400">
  {h.created_at 
    ? new Date(h.created_at).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }) 
    : '—'}
</p>
                      </div>
                      {h.description && <p className="text-xs text-slate-400 mt-0.5">{h.description}</p>}
                      {h.changed_by  && <p className="text-xs text-slate-400 mt-0.5">By: {h.changed_by}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>

        {/* ── Right / Sidebar column ── */}
        <div className="space-y-6">

          {/* Asset Info */}
          <Section title="Asset Info">
            <DetailRow label="Asset No" value={asset.asset_no} mono />
            <DetailRow label="Category" badge={<span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">{asset.category || '—'}</span>} />
            {asset.asset_type_name && <DetailRow label="Asset Type" value={asset.asset_type_name} />}
            {/* Status — only for STATUS_CATEGORIES */}
            {showStatus && (
              <DetailRow label="Status" badge={<span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusColors[asset.status] || 'bg-slate-100 text-slate-500'}`}>{asset.status || '—'}</span>} />
            )}
            <DetailRow label="Classification" badge={<span className={`px-2.5 py-1 rounded-full text-xs font-bold ${cl.badge}`}>{asset.classification || '—'}</span>} />
            {asset.remarks && (
              <div className="pt-2.5 mt-1 border-t border-slate-50">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Remarks</p>
                <p className="text-xs text-slate-500 leading-relaxed">{asset.remarks}</p>
              </div>
            )}
          </Section>

          {/* Repair Summary — only for REPAIR_CATEGORIES */}
          {showRepairOption && safeRepairs.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <TbTool size={14} className="text-slate-500" />
                <p className="text-sm font-bold text-slate-700">Repair Summary</p>
              </div>
              <div className="space-y-2">
                {[
                  { label: 'Total',           value: safeRepairs.length },
                  { label: 'In Progress',     value: safeRepairs.filter(r => r.status === 'In Progress').length },
                  { label: 'Completed',       value: safeRepairs.filter(r => r.status === 'Completed').length },
                  { label: 'Free (Warranty)', value: safeRepairs.filter(r => r.warranty_covered).length },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between">
                    <p className="text-xs text-slate-400">{label}</p>
                    <p className="text-sm font-black text-slate-700">{value}</p>
                  </div>
                ))}
              </div>
              {!isAlreadySalvaged && !isInRepair && (
                <button onClick={() => setShowRepair(true)}
                  className="w-full mt-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold transition border border-slate-200">
                  + New Repair
                </button>
              )}
            </div>
          )}

          {/* Salvaged notice — only for SALVAGE_CATEGORIES */}
          {showSalvageOption && isAlreadySalvaged && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <TbTrash size={14} className="text-slate-500" />
                <p className="text-sm font-bold text-slate-700">Salvaged Asset</p>
              </div>
              <p className="text-xs text-slate-500 mb-3">This asset is marked as <strong>Broken / Salvaged</strong> and cannot be assigned or repaired.</p>
              <button onClick={() => navigate(`/salvaged/${asset.id}`)}
                className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition">
                View Salvage Record →
              </button>
            </div>
          )}

          {/* Warranty Summary — only for WARRANTY_CATEGORIES */}
          {showWarranty && (
            <Section title="Warranty Summary" icon={HiOutlineShieldCheck} accent="#10b981">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2"><HiOutlineShieldCheck className="w-4 h-4 text-slate-400" /><p className="text-sm font-semibold text-slate-600">Active</p></div>
                  <p className="text-2xl font-black text-slate-800">{activeWarranties.length}</p>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2"><HiOutlineExclamationCircle className="w-4 h-4 text-slate-400" /><p className="text-sm font-semibold text-slate-500">Expired</p></div>
                  <p className="text-2xl font-black text-slate-500">{expiredWarranties.length}</p>
                </div>
                {activeWarranties[0] && (
                  <div className="pt-1 border-t border-slate-100">
                    <p className="text-xs text-slate-400 mb-1">Next expiry</p>
                    <p className="text-sm font-bold text-slate-700">{new Date(activeWarranties[0].end_date).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' })}</p>
                    <p className={`text-xs font-semibold mt-0.5 ${activeWarranties[0].days_remaining <= 30 ? 'text-red-500' : activeWarranties[0].days_remaining <= 90 ? 'text-amber-500' : 'text-slate-500'}`}>
                      {activeWarranties[0].days_remaining} days remaining
                    </p>
                  </div>
                )}
                <button onClick={() => setShowAddWarranty(true)}
                  className="w-full py-2 border border-dashed border-slate-200 rounded-xl text-xs font-semibold text-slate-400 hover:border-slate-400 hover:text-slate-600 hover:bg-slate-50 transition">
                  + Add Warranty
                </button>
              </div>
            </Section>
          )}

          {/* Financial — only for FINANCIAL_CATEGORIES */}
          {showFinancial && (
            <Section title="Financial" icon={TbCurrencyDollar} accent="#10b981">
              <FinancialDisplay asset={asset} safeRepairs={safeRepairs} />
            </Section>
          )}

          {/* Meta */}
          <Section title="Meta" icon={HiOutlineClock} accent="#94a3b8">
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Created At</p>
                <p className="font-bold text-slate-700">{asset.created_at ? new Date(asset.created_at).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }) : '—'}</p>
              </div>
              {asset.updated_at && (
                <div className="border-t border-slate-100 pt-3">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Updated At</p>
                  <p className="font-bold text-slate-700">{new Date(asset.updated_at).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })}</p>
                </div>
              )}
            </div>
          </Section>

          {/* ── Asset History (sidebar) ── */}
<Section title="Asset History" icon={HiOutlineClock} accent="#64748b">
  {safeHistory.length === 0 ? (
    <div className="text-center py-6">
      <HiOutlineClock className="w-7 h-7 text-slate-300 mx-auto mb-2" />
      <p className="text-xs text-slate-400">No history recorded yet.</p>
    </div>
  ) : (
    <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
      {safeHistory.map((h, i) => (
        <div key={h.id ?? i} className="flex items-start gap-3">
          {/* Timeline dot + line */}
          <div className="flex flex-col items-center shrink-0 mt-1.5">
            <div className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
            {i < safeHistory.length - 1 && (
              <div className="w-px flex-1 bg-slate-200 mt-1 min-h-[1.5rem]" />
            )}
          </div>

          <div className="flex-1 pb-3">
            {/* Change type badge */}
            <p className="text-xs font-bold text-slate-700 leading-tight">
              {h.change_type || h.action || h.event || 'Update'}
            </p>

            {/* Old → New value */}
            {(h.old_value || h.new_value) && (
              <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                {h.old_value && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 bg-red-50 text-red-500 rounded border border-red-100 line-through">
                    {h.old_value}
                  </span>
                )}
                {h.old_value && h.new_value && (
                  <span className="text-[10px] text-slate-400">→</span>
                )}
                {h.new_value && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-100">
                    {h.new_value}
                  </span>
                )}
              </div>
            )}

            {/* Description */}
            {h.description && (
              <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{h.description}</p>
            )}

            {/* Footer: who + when */}
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {(h.changed_by_name || h.changed_by) && (
                <span className="text-[10px] font-semibold text-slate-500">
                  {h.changed_by_name || `User #${h.changed_by}`}
                </span>
              )}
              <span className="text-[10px] text-slate-300">
  {h.created_at
    ? new Date(h.created_at).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      })
    : '—'}
</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )}
</Section>
        </div>
      </div>

      {/* Modals */}
      {showEdit && (
        <AssetFormModal onClose={() => setShowEdit(false)}
          onSubmit={(data) => dispatch(updateAsset({ id: asset.id, data }))}
          departments={departments} designations={designations} loading={saving} initial={asset} />
      )}
      {showSalvage && (
        <SalvageModal asset={asset} dispatch={dispatch} onClose={() => setShowSalvage(false)}
          onSuccess={() => { setShowSalvage(false); dispatch(fetchAssetById(id)); dispatch(fetchAssetHistory(id)); }} />
      )}
      {showRepair && (
        <RepairModal asset={asset} onClose={() => setShowRepair(false)}
          onSuccess={() => { setShowRepair(false); dispatch(fetchAssetById(id)); dispatch(fetchRepairsByAsset(id)); dispatch(fetchAssetHistory(id)); }} />
      )}
      {showCloseRepair && (
        <CloseRepairModal asset={asset} assetRepairs={safeRepairs} dispatch={dispatch} saving={repairSaving}
          onClose={() => setShowCloseRepair(false)}
          onSuccess={() => { setShowCloseRepair(false); dispatch(fetchAssetById(id)); dispatch(fetchRepairsByAsset(id)); dispatch(fetchAssetHistory(id)); }} />
      )}
      {showAddWarranty && (
        <WarrantyFormModal onClose={() => setShowAddWarranty(false)}
          onSubmit={(data) => dispatch(createWarranty({ assetId: id, data }))} loading={wSaving} />
      )}
      {editWarranty && (
        <WarrantyFormModal onClose={() => setEditWarranty(null)}
          onSubmit={(data) => dispatch(updateWarranty({ assetId: id, warrantyId: editWarranty.id, data }))}
          loading={wSaving} initial={editWarranty} />
      )}
      {deleteWarrantyId && (
        <DeleteConfirm title="Delete Warranty?" message="This warranty record will be permanently removed."
          onCancel={() => setDeleteWarrantyId(null)}
          onConfirm={() => dispatch(deleteWarranty({ assetId: id, warrantyId: deleteWarrantyId }))}
          loading={wSaving} />
      )}
    </MainLayout>
  );
}
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchSalvagedById,
  unsalvageAsset,
  updateSalvageRecord,
  clearCurrentSalvage,
  clearSalvageMessages,
} from '../../features/salvage/salvageSlice';
import MainLayout from '../../components/layout/MainLayout';
import {
  FiArrowLeft, FiDollarSign, FiAlertTriangle, FiEdit2, FiCheck, FiX,
} from 'react-icons/fi';
import {
  TbTrash, TbRefresh, TbShieldCheck, TbLock, TbBolt,
  TbShieldLock, TbCalendar, TbUser, TbBuilding,
} from 'react-icons/tb';
import { HiOutlineCube } from 'react-icons/hi';

// ── Helpers ───────────────────────────────────────────────
const fmt = (d) => d
  ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  : '—';

const CONDITIONS = ['New', 'Good', 'Fair', 'Poor', 'Damaged'];

const CONDITION_COLORS = {
  New:     'bg-emerald-100 text-emerald-700',
  Good:    'bg-blue-100 text-blue-700',
  Fair:    'bg-amber-100 text-amber-700',
  Poor:    'bg-orange-100 text-orange-700',
  Damaged: 'bg-red-100 text-red-700',
};

const CIA_COLORS = {
  1: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', label: 'Low'    },
  2: { bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-700',   label: 'Medium' },
  3: { bg: 'bg-red-50',     border: 'border-red-200',     text: 'text-red-700',     label: 'High'   },
};

const SectionTitle = ({ icon: Icon, label }) => (
  <div className="flex items-center gap-2 mb-4">
    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
      <Icon size={14} className="text-slate-500" />
    </div>
    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</p>
  </div>
);

const InfoRow = ({ label, value, mono }) => (
  <div className="flex items-start justify-between gap-4 py-2.5
    border-b border-slate-50 last:border-0">
    <span className="text-xs text-slate-400 shrink-0 w-40">{label}</span>
    <span className={`text-sm font-semibold text-slate-700 text-right
      ${mono ? 'font-mono text-xs' : ''}`}>
      {value || '—'}
    </span>
  </div>
);

const Toast = ({ message, type }) => (
  <div className={`fixed top-5 right-5 z-50 flex items-center gap-2
    px-4 py-3 rounded-xl shadow-lg text-sm font-medium
    ${type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
    {type === 'success' ? '✅' : '❌'} {message}
  </div>
);

// ── Edit Panel ────────────────────────────────────────────
function EditPanel({ record, onSave, onCancel, saving }) {
  const [form, setForm] = useState({
    salvage_reason:       record.salvage_reason       || '',
    salvage_date:         record.salvage_date?.split('T')[0] || '',
    condition_at_salvage: record.condition_at_salvage || '',
    notes:                record.notes                || '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <FiEdit2 size={14} className="text-amber-600" />
        <p className="text-sm font-bold text-amber-700">Edit Salvage Record</p>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-600 mb-1.5">Salvage Reason</label>
        <input
          type="text"
          value={form.salvage_reason}
          onChange={e => set('salvage_reason', e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl border border-slate-200
            text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-600 mb-1.5">Salvage Date</label>
        <input
          type="date"
          value={form.salvage_date}
          onChange={e => set('salvage_date', e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl border border-slate-200
            text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-600 mb-1.5">Condition at Salvage</label>
        <div className="flex gap-2 flex-wrap">
          {CONDITIONS.map(c => (
            <button key={c} type="button"
              onClick={() => set('condition_at_salvage', form.condition_at_salvage === c ? '' : c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition
                ${form.condition_at_salvage === c
                  ? CONDITION_COLORS[c] + ' border-transparent'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-600 mb-1.5">Notes</label>
        <textarea rows={3} value={form.notes}
          onChange={e => set('notes', e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl border border-slate-200
            text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
        />
      </div>

      <div className="flex gap-3 pt-1">
        <button onClick={onCancel}
          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200
            text-sm font-semibold text-slate-600 hover:bg-slate-50 transition
            flex items-center justify-center gap-2">
          <FiX size={14} /> Cancel
        </button>
        <button onClick={() => onSave(form)} disabled={saving}
          className="flex-1 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600
            text-white text-sm font-bold transition disabled:opacity-50
            flex items-center justify-center gap-2">
          {saving
            ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg> Saving...</>
            : <><FiCheck size={14} /> Save Changes</>}
        </button>
      </div>
    </div>
  );
}

// ── Restore Confirm ───────────────────────────────────────
function RestoreConfirm({ onClose, onConfirm, saving }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.55)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
            <TbRefresh size={20} className="text-emerald-600" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">Restore Asset</h3>
            <p className="text-xs text-slate-400">Asset will be set back to Available</p>
          </div>
        </div>
        <p className="text-sm text-slate-600 mb-5">
          This will remove the salvage record and restore the asset to
          <span className="font-bold text-emerald-700"> Available</span> status.
          This action is for Admin only.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200
              text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700
              text-white text-sm font-bold transition disabled:opacity-50
              flex items-center justify-center gap-2">
            {saving
              ? <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              : <><TbRefresh size={15} /> Confirm Restore</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────
export default function SalvagedAssetDetail() {
  const { assetId }  = useParams();
  const dispatch     = useDispatch();
  const navigate     = useNavigate();

  const { current: record, loading, saving, error, success } = useSelector(s => s.salvage);
  const auth    = useSelector(s => s.auth);
  const isAdmin = auth?.user?.roles?.includes('Admin');

  const [editing,       setEditing]       = useState(false);
  const [showRestore,   setShowRestore]   = useState(false);

  useEffect(() => {
    dispatch(fetchSalvagedById(assetId));
    return () => dispatch(clearCurrentSalvage());
  }, [assetId]);

  useEffect(() => {
    if (!success && !error) return;
    if (success) {
      // If restored, go back to list
      if (success.includes('Available')) {
        navigate('/salvaged');
        return;
      }
      setEditing(false);
      dispatch(fetchSalvagedById(assetId));
    }
    const t = setTimeout(() => dispatch(clearSalvageMessages()), 3500);
    return () => clearTimeout(t);
  }, [success, error]);

  const handleSave = (form) => {
    dispatch(updateSalvageRecord({ assetId, data: form }));
  };

  const handleRestore = () => {
    dispatch(unsalvageAsset(assetId));
  };

  // ── Loading ──
  if (loading) {
    return (
      <MainLayout title="Salvage Record">
        <div className="flex items-center justify-center h-64">
          <svg className="animate-spin w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        </div>
      </MainLayout>
    );
  }

  if (!record) {
    return (
      <MainLayout title="Salvage Record">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <TbTrash size={40} className="mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-semibold text-slate-500">Salvage record not found</p>
            <button onClick={() => navigate('/salvaged')}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2
                bg-red-600 hover:bg-red-700 text-white text-sm font-semibold
                rounded-lg transition">
              <FiArrowLeft size={14} /> Back to Salvaged Assets
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const ciaC   = Number(record.cia_confidentiality) || 1;
  const ciaI   = Number(record.cia_integrity)       || 1;
  const ciaA   = Number(record.cia_availability)    || 1;
  const ciaMax = Math.max(ciaC, ciaI, ciaA);
  const ciaClass = record.classification ||
    (ciaMax >= 3 ? 'High' : ciaMax === 2 ? 'Medium' : 'Low');
  const ciaCC  = ciaClass === 'High' ? CIA_COLORS[3] : ciaClass === 'Medium' ? CIA_COLORS[2] : CIA_COLORS[1];

  return (
    <MainLayout
      title="Salvage Record"
      subtitle={`${record.asset_name} · ${record.asset_no}`}>

      {(success || error) && (
        <Toast message={success || error} type={success ? 'success' : 'error'} />
      )}

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <button onClick={() => navigate('/salvaged')}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border
            border-slate-200 text-sm font-semibold text-slate-600
            hover:bg-slate-50 transition">
          <FiArrowLeft size={14} /> Back to Salvaged Assets
        </button>

        <div className="flex items-center gap-2">
          <button onClick={() => navigate(`/assets/${record.asset_id}`)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border
              border-slate-200 text-sm font-semibold text-slate-600
              hover:bg-slate-50 transition">
            <HiOutlineCube size={15} /> View Asset
          </button>

          <button onClick={() => setEditing(e => !e)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm
              font-semibold border transition
              ${editing
                ? 'bg-slate-100 border-slate-200 text-slate-600'
                : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'}`}>
            <FiEdit2 size={14} />
            {editing ? 'Cancel Edit' : 'Edit Record'}
          </button>

          {isAdmin && (
            <button onClick={() => setShowRestore(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg
                bg-emerald-50 border border-emerald-200 text-emerald-700
                text-sm font-semibold hover:bg-emerald-100 transition">
              <TbRefresh size={15} /> Restore Asset
            </button>
          )}
        </div>
      </div>

      {/* ── Hero card ── */}
      <div className="bg-red-50/70 border-2 border-red-200 rounded-2xl p-6 mb-6
        flex items-start gap-5 flex-wrap">
        <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center
          justify-center shrink-0">
          <TbTrash size={32} className="text-red-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap mb-1">
            <h2 className="text-xl font-black text-slate-900">{record.asset_name}</h2>
            <span className="inline-flex items-center gap-1.5 px-3 py-1
              rounded-full text-xs font-bold ring-1
              bg-red-100 text-red-700 ring-red-200">
              <TbTrash size={11} /> Salvaged (Broken)
            </span>
          </div>
          <div className="flex items-center gap-3 flex-wrap text-sm text-slate-500 mb-2">
            <span className="font-mono bg-white px-2 py-0.5 rounded border
              border-slate-200 text-xs font-bold text-slate-600">
              {record.asset_no}
            </span>
            <span>{record.category}</span>
            {record.asset_type && <span>· {record.asset_type}</span>}
          </div>
          <p className="text-sm text-red-700 font-semibold">
            Reason: {record.salvage_reason}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest">Salvage ID</p>
          <p className="text-2xl font-black text-slate-700">#{record.salvage_id}</p>
          <p className="text-xs text-slate-400 mt-0.5">{fmt(record.salvage_date)}</p>
        </div>
      </div>

      {/* ── 2-column grid ── */}
      <div className="grid grid-cols-2 gap-5">

        {/* Left col */}
        <div className="space-y-5">

          {/* Salvage Info */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <SectionTitle icon={TbTrash} label="Salvage Details" />
            <InfoRow label="Salvage Reason"   value={record.salvage_reason} />
            <InfoRow label="Salvage Date"     value={fmt(record.salvage_date)} />
            <InfoRow label="Recorded At"      value={fmt(record.salvaged_at)} />
            <InfoRow label="Salvaged By"      value={record.salvaged_by_name} />
            <div className="flex items-start justify-between gap-4 py-2.5">
              <span className="text-xs text-slate-400 shrink-0 w-40">Condition</span>
              {record.condition_at_salvage ? (
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg
                  ${CONDITION_COLORS[record.condition_at_salvage] || 'bg-slate-100 text-slate-500'}`}>
                  {record.condition_at_salvage}
                </span>
              ) : (
                <span className="text-sm text-slate-300">—</span>
              )}
            </div>
            {record.notes && (
              <div className="pt-3 mt-1 border-t border-slate-50">
                <p className="text-xs text-slate-400 mb-1">Notes</p>
                <p className="text-sm text-slate-600">{record.notes}</p>
              </div>
            )}
          </div>

          {/* Edit panel */}
          {editing && (
            <EditPanel
              record={record}
              onSave={handleSave}
              onCancel={() => setEditing(false)}
              saving={saving}
            />
          )}

          {/* CIA */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <SectionTitle icon={TbShieldCheck} label="CIA Classification" />
            <div className="grid grid-cols-4 gap-2 mb-3">
              {[
                { label: 'C', full: 'Confidentiality', val: ciaC, icon: TbLock        },
                { label: 'I', full: 'Integrity',        val: ciaI, icon: TbShieldCheck },
                { label: 'A', full: 'Availability',     val: ciaA, icon: TbBolt        },
              ].map(d => {
                const lc = CIA_COLORS[d.val] || CIA_COLORS[1];
                return (
                  <div key={d.label}
                    className={`flex flex-col items-center py-3 rounded-xl border ${lc.bg} ${lc.border}`}>
                    <d.icon size={13} className={`${lc.text} mb-1`} />
                    <span className={`text-2xl font-black ${lc.text}`}>{d.val}</span>
                    <span className="text-[9px] text-slate-400 mt-0.5">{d.full}</span>
                    <span className={`text-[9px] font-bold ${lc.text}`}>{lc.label}</span>
                  </div>
                );
              })}
              <div className={`flex flex-col items-center py-3 rounded-xl border ${ciaCC.bg} ${ciaCC.border}`}>
                <TbShieldLock size={13} className={`${ciaCC.text} mb-1`} />
                <span className={`text-2xl font-black ${ciaCC.text}`}>{ciaMax}</span>
                <span className="text-[9px] text-slate-400 mt-0.5">Overall</span>
                <span className={`text-[9px] font-bold ${ciaCC.text}`}>{ciaClass}</span>
              </div>
            </div>
            <div className={`py-2 rounded-xl text-center text-xs font-bold ${ciaCC.bg} ${ciaCC.text}`}>
              Classification: {ciaClass}
            </div>
          </div>
        </div>

        {/* Right col */}
        <div className="space-y-5">

          {/* Asset Details */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <SectionTitle icon={HiOutlineCube} label="Asset Details" />
            <InfoRow label="Asset Name"     value={record.asset_name} />
            <InfoRow label="Asset No."      value={record.asset_no} mono />
            <InfoRow label="Category"       value={record.category} />
            <InfoRow label="Asset Type"     value={record.asset_type} />
            <InfoRow label="Location"       value={record.asset_location} />
            <InfoRow label="Current Status" value={record.asset_status} />
            <InfoRow label="PO Number"      value={record.po_number} mono />
            {record.description && (
              <div className="pt-2.5 mt-1">
                <p className="text-xs text-slate-400 mb-1">Description</p>
                <p className="text-sm text-slate-600">{record.description}</p>
              </div>
            )}
          </div>

          {/* Financial */}
          {(record.cost || record.po_number) && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <SectionTitle icon={FiDollarSign} label="Financial" />
              <InfoRow label="Cost"
                value={record.cost
                  ? `${record.currency || ''} ${Number(record.cost).toLocaleString()}`
                  : null}
              />
              <InfoRow label="PO Number" value={record.po_number} mono />
            </div>
          )}

          {/* Salvaged by */}
          {record.salvaged_by_name && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <SectionTitle icon={TbUser} label="Salvaged By" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center
                  justify-center shrink-0 text-sm font-black text-red-500">
                  {record.salvaged_by_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    {record.salvaged_by_name}
                  </p>
                  <p className="text-xs text-slate-400">{record.salvaged_by_email || ''}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Restore Modal ── */}
      {showRestore && (
        <RestoreConfirm
          onClose={() => setShowRestore(false)}
          onConfirm={handleRestore}
          saving={saving}
        />
      )}

    </MainLayout>
  );
}

import { useState, useMemo, useEffect, useRef } from 'react';
import {
  FiX, FiSearch, FiCalendar, FiPackage, FiAlertCircle,
  FiChevronRight, FiCheck, FiShield, FiInfo, FiMapPin, FiChevronDown,
  FiUpload, FiFileText, FiCheckCircle,
} from 'react-icons/fi';
import {
  HiOutlineCube, HiOutlineOfficeBuilding,
  HiOutlineUser, HiOutlineChevronLeft,
} from 'react-icons/hi';
import {
  TbTransfer, TbBuilding, TbUserCheck, TbBriefcase,
  TbServer, TbDeviceDesktop, TbFileText, TbTool,
  TbShieldLock, TbDoor, TbLock, TbBolt, TbShieldCheck, TbCategory,
} from 'react-icons/tb';
import { MdOutlineAssignmentInd } from 'react-icons/md';

const sameId = (a, b) => a != null && b != null && String(a) === String(b);

const CATEGORIES = ['Human', 'IT Infrastructure', 'Service', 'Digital', 'Tangible Information', 'End User', 'Facility'];

const CATEGORY_OWNER_CONFIG = {
  'Human':               { icon: TbUserCheck,     color: '#6366f1', ownerType: 'Department', ownerLabel: 'Assign to Department',            note: 'Human assets are typically owned by a Department.'              },
  'IT Infrastructure':   { icon: TbServer,        color: '#0ea5e9', ownerType: 'User',       ownerLabel: 'Assign to Employee / Designation', note: 'IT assets are typically assigned to a Designation or Employee.' },
  'Service':             { icon: TbTool,          color: '#f59e0b', ownerType: 'Department', ownerLabel: 'Assign to Department',            note: 'Service assets are typically owned by a Department.'            },
  'Digital':             { icon: TbShieldLock,    color: '#8b5cf6', ownerType: 'Department', ownerLabel: 'Assign to Department',            note: 'Digital assets are typically owned by a Department.'            },
  'Tangible Information':{ icon: TbFileText,      color: '#10b981', ownerType: 'User',       ownerLabel: 'Assign to Designation / Employee', note: 'Tangible info assets are held by a Designation or Employee.'   },
  'End User':            { icon: TbDeviceDesktop, color: '#ef4444', ownerType: 'User',       ownerLabel: 'Assign to Employee',              note: 'End user assets are directly assigned to an Employee.'          },
  'Facility':            { icon: TbDoor,          color: '#f97316', ownerType: 'Department', ownerLabel: 'Assign to Department',            note: 'Facility assets are managed by a Department.'                  },
};
const DEFAULT_CONFIG   = { icon: HiOutlineCube, color: '#64748b', ownerType: 'User', ownerLabel: 'Assign to User / Department', note: 'Select who this asset should be assigned to.' };
const CONDITIONS       = ['New', 'Good', 'Fair', 'Poor', 'Damaged'];
const CATEGORY_ICONS   = { 'Human': TbUserCheck, 'IT Infrastructure': TbServer, 'Service': TbTool, 'Digital': TbShieldLock, 'Tangible Information': TbFileText, 'End User': TbDeviceDesktop, 'Facility': TbDoor };
const CATEGORY_COLORS  = { 'Human': 'bg-indigo-100 text-indigo-600', 'IT Infrastructure': 'bg-sky-100 text-sky-600', 'Service': 'bg-amber-100 text-amber-600', 'Digital': 'bg-purple-100 text-purple-600', 'Tangible Information': 'bg-emerald-100 text-emerald-600', 'End User': 'bg-red-100 text-red-600', 'Facility': 'bg-orange-100 text-orange-600' };
const CIA_LEVEL_COLORS = { 1: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', label: 'Low' }, 2: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', label: 'Medium' }, 3: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', label: 'High' } };

const safeList = v => Array.isArray(v) ? v : [];

// ─── Small shared components ──────────────────────────────────────────────────

const SelectableItem = ({ selected, onClick, icon: Icon, iconBg, title, subtitle, badge }) => (
  <button type="button" onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 transition-all duration-150 text-left
      ${selected
        ? 'border-brand-green bg-brand-green/5'
        : 'border-transparent hover:border-brand-cream hover:bg-brand-cream/20'}`}>
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
      {Icon && <Icon size={16} />}
    </div>
    <div className="flex-1 min-w-0">
      <p className={`text-sm font-semibold truncate ${selected ? 'text-brand-green-dark' : 'text-brand-dark'}`}>{title}</p>
      {subtitle && <p className="text-xs text-brand-dark/40 truncate">{subtitle}</p>}
    </div>
    {badge && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-cream/60 text-brand-dark/50 shrink-0">{badge}</span>}
    {selected
      ? <div className="w-5 h-5 rounded-full bg-brand-green flex items-center justify-center shrink-0"><FiCheck size={11} className="text-brand-cream-light" /></div>
      : <div className="w-5 h-5 rounded-full border-2 border-brand-cream shrink-0" />}
  </button>
);

const SearchInput = ({ value, onChange, placeholder, autoFocus }) => (
  <div className="relative">
    <FiSearch size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-dark/30" />
    <input autoFocus={autoFocus} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-brand-cream bg-brand-offwhite text-sm
        focus:outline-none focus:ring-2 focus:ring-brand-green focus:bg-white
        placeholder:text-brand-dark/30 text-brand-dark transition-all" />
  </div>
);

const Steps = ({ current }) => (
  <div className="flex items-center gap-1">
    {['Assets', 'Assignee', 'Accessories', 'Review', 'Gate Pass'].map((label, i) => {
      const s = i + 1; const done = current > s; const active = current === s;
      if (s === 5 && current < 5) return null;
      return (
        <div key={s} className="flex items-center gap-1">
          {s > 1 && <div className={`w-3 h-px ${current > s - 1 ? 'bg-brand-green/40' : 'bg-brand-cream'}`} />}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all
            ${done   ? 'bg-brand-green/15 text-brand-green'
            : active ? 'bg-brand-green text-brand-cream-light'
            :          'bg-brand-cream/50 text-brand-dark/40'}`}>
            {done ? <FiCheck size={10} /> : <span>{s}</span>}
            <span className="hidden sm:inline">{label}</span>
          </div>
        </div>
      );
    })}
  </div>
);

const CIAPreview = ({ selectedUser, selectedDesig, designations = [] }) => {
  let ciaC = null, ciaI = null, ciaA = null, ciaClass = null, designTitle = null;
  if (selectedDesig) {
    ciaC = selectedDesig.default_cia_confidentiality; ciaI = selectedDesig.default_cia_integrity;
    ciaA = selectedDesig.default_cia_availability;    ciaClass = selectedDesig.default_classification;
    designTitle = selectedDesig.title || selectedDesig.name;
  } else if (selectedUser) {
    const userDesig = safeList(designations).find(d => sameId(d.id, selectedUser.designation_id));
    if (userDesig) {
      ciaC = userDesig.default_cia_confidentiality; ciaI = userDesig.default_cia_integrity;
      ciaA = userDesig.default_cia_availability;    ciaClass = userDesig.default_classification;
      designTitle = userDesig.title || userDesig.name;
    }
  }
  if (ciaC == null) return (
    <div className="flex items-start gap-2 p-3 bg-brand-cream/30 border border-brand-cream rounded-xl mt-2">
      <FiInfo size={13} className="text-brand-dark/40 mt-0.5 shrink-0" />
      <p className="text-xs text-brand-dark/50">No designation found — <span className="font-semibold">CIA levels will not be changed</span>.</p>
    </div>
  );
  const val = Math.max(Number(ciaC), Number(ciaI), Number(ciaA));
  const cls = ciaClass || (val >= 3 ? 'High' : val === 2 ? 'Medium' : 'Low');
  const clsColor = cls === 'High' ? CIA_LEVEL_COLORS[3] : cls === 'Medium' ? CIA_LEVEL_COLORS[2] : CIA_LEVEL_COLORS[1];
  const dims = [
    { label: 'C', full: 'Confidentiality', val: Number(ciaC), icon: TbLock        },
    { label: 'I', full: 'Integrity',        val: Number(ciaI), icon: TbShieldCheck },
    { label: 'A', full: 'Availability',     val: Number(ciaA), icon: TbBolt        },
  ];
  return (
    <div className="mt-2 p-3 bg-brand-green/5 border border-brand-green/20 rounded-xl space-y-2.5">
      <div className="flex items-center gap-2">
        <TbShieldCheck size={14} className="text-brand-green shrink-0" />
        <p className="text-[11px] font-bold text-brand-green-dark uppercase tracking-wider">CIA Will Auto-Update</p>
        {designTitle && <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-brand-green/10 text-brand-green font-semibold border border-brand-green/20 shrink-0">from: {designTitle}</span>}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {dims.map(dim => {
          const lc = CIA_LEVEL_COLORS[dim.val] || CIA_LEVEL_COLORS[1];
          return (
            <div key={dim.label} className={`flex flex-col items-center py-2.5 rounded-xl border ${lc.bg} ${lc.border}`}>
              <dim.icon size={12} className={`${lc.text} mb-1`} />
              <span className={`text-xl font-black leading-tight ${lc.text}`}>{dim.val}</span>
              <span className="text-[9px] text-brand-dark/40 mt-0.5">{dim.full}</span>
              <span className={`text-[9px] font-bold ${lc.text}`}>{lc.label}</span>
            </div>
          );
        })}
        <div className={`flex flex-col items-center py-2.5 rounded-xl border ${clsColor.bg} ${clsColor.border}`}>
          <FiShield size={12} className={`${clsColor.text} mb-1`} />
          <span className={`text-xl font-black leading-tight ${clsColor.text}`}>{val}</span>
          <span className="text-[9px] text-brand-dark/40 mt-0.5">Overall</span>
          <span className={`text-[9px] font-bold ${clsColor.text}`}>{cls}</span>
        </div>
      </div>
    </div>
  );
};

// ─── Location Selector ────────────────────────────────────────────────────────
function LocationSelector({ locations = [], subLocations = [], selectedLocation, selectedSubLocation, onLocationChange, onSubLocationChange }) {
  const [locSearch, setLocSearch] = useState('');
  const [subSearch, setSubSearch] = useState('');
  const [locOpen,   setLocOpen]   = useState(false);
  const [subOpen,   setSubOpen]   = useState(false);

  const availableSubs = useMemo(() =>
    selectedLocation ? safeList(subLocations).filter(sl => sameId(sl.location_id, selectedLocation.id)) : [],
    [subLocations, selectedLocation]
  );
  const filteredLocs = useMemo(() =>
    safeList(locations).filter(l =>
      (l.location_name||'').toLowerCase().includes(locSearch.toLowerCase()) ||
      (l.address||'').toLowerCase().includes(locSearch.toLowerCase())
    ), [locations, locSearch]
  );
  const filteredSubs = useMemo(() =>
    availableSubs.filter(s =>
      (s.sub_location_name||'').toLowerCase().includes(subSearch.toLowerCase()) ||
      (s.address||'').toLowerCase().includes(subSearch.toLowerCase())
    ), [availableSubs, subSearch]
  );

  const selectLocation = (loc) => { onLocationChange(loc); onSubLocationChange(null); setLocSearch(''); setLocOpen(false); };
  const selectSub      = (sub) => { onSubLocationChange(sub); setSubSearch(''); setSubOpen(false); };

  return (
    <div className="space-y-3">
      <div>
        <label className="flex items-center gap-1.5 text-xs font-bold text-brand-dark/50 uppercase tracking-wider mb-1.5">
          <FiMapPin size={11} /> Location
          <span className="text-[9px] font-medium text-brand-dark/30 normal-case tracking-normal ml-1">optional</span>
        </label>
        {selectedLocation ? (
          <div className="flex items-center gap-2 px-3 py-2.5 bg-brand-green/5 border-2 border-brand-green/30 rounded-xl">
            <FiMapPin size={13} className="text-brand-green shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-brand-green-dark truncate">{selectedLocation.location_name}</p>
              {selectedLocation.address && <p className="text-[10px] text-brand-dark/40 truncate">{selectedLocation.address}</p>}
            </div>
            <button type="button" onClick={() => { onLocationChange(null); onSubLocationChange(null); setLocOpen(false); }}
              className="text-brand-dark/20 hover:text-red-400 transition shrink-0 ml-1"><FiX size={13} /></button>
          </div>
        ) : (
          <div className="relative">
            <FiSearch size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-dark/30 pointer-events-none" />
            <input value={locSearch} onChange={e => { setLocSearch(e.target.value); setLocOpen(true); }} onFocus={() => setLocOpen(true)}
              placeholder="Search locations..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-brand-cream bg-brand-offwhite text-sm
                focus:outline-none focus:ring-2 focus:ring-brand-green focus:bg-white
                placeholder:text-brand-dark/30 text-brand-dark transition-all" />
          </div>
        )}
        {!selectedLocation && locOpen && (
          <div className="mt-1 border border-brand-cream rounded-xl bg-white shadow-lg overflow-hidden">
            {safeList(locations).length === 0 ? (
              <div className="flex items-center gap-2 px-3 py-3"><FiInfo size={12} className="text-amber-500 shrink-0" /><p className="text-xs text-amber-700">No locations loaded.</p></div>
            ) : filteredLocs.length === 0 ? (
              <div className="px-3 py-3 text-center"><p className="text-xs text-brand-dark/40">No locations match "{locSearch}"</p></div>
            ) : (
              <div className="max-h-44 overflow-y-auto py-1">
                {filteredLocs.map(loc => (
                  <button key={loc.id} type="button" onClick={() => selectLocation(loc)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-brand-green/5 transition text-left">
                    <FiMapPin size={12} className="text-brand-dark/30 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-brand-dark truncate">{loc.location_name}</p>
                      {loc.address && <p className="text-[10px] text-brand-dark/40 truncate">{loc.address}</p>}
                    </div>
                  </button>
                ))}
              </div>
            )}
            <div className="border-t border-brand-cream px-3 py-2">
              <button type="button" onClick={() => setLocOpen(false)} className="text-xs text-brand-dark/40 hover:text-brand-dark transition">Close</button>
            </div>
          </div>
        )}
      </div>

      {selectedLocation && (
        <div>
          <label className="flex items-center gap-1.5 text-xs font-bold text-brand-dark/50 uppercase tracking-wider mb-1.5">
            <FiMapPin size={11} className="text-brand-dark/30" /> Sub-Location
            <span className="text-[9px] font-medium text-brand-dark/30 normal-case tracking-normal ml-1">optional</span>
            <span className="ml-auto text-[10px] text-brand-dark/30 normal-case tracking-normal font-medium">
              {availableSubs.length} under <span className="text-brand-green font-semibold">{selectedLocation.location_name}</span>
            </span>
          </label>
          {availableSubs.length === 0 ? (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-brand-cream bg-brand-offwhite">
              <FiInfo size={12} className="text-brand-dark/30 shrink-0" />
              <p className="text-xs text-brand-dark/50">No sub-locations for this location.</p>
            </div>
          ) : selectedSubLocation ? (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-brand-green/5 border-2 border-brand-green/30 rounded-xl">
              <FiMapPin size={13} className="text-brand-green shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-brand-green-dark truncate">{selectedSubLocation.sub_location_name}</p>
                {selectedSubLocation.details && <p className="text-[10px] text-brand-dark/40 truncate">{selectedSubLocation.details}</p>}
              </div>
              <button type="button" onClick={() => { onSubLocationChange(null); setSubOpen(false); }}
                className="text-brand-dark/20 hover:text-red-400 transition shrink-0 ml-1"><FiX size={13} /></button>
            </div>
          ) : (
            <div className="relative">
              <FiSearch size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-dark/30 pointer-events-none" />
              <input value={subSearch} onChange={e => { setSubSearch(e.target.value); setSubOpen(true); }} onFocus={() => setSubOpen(true)}
                placeholder="Search sub-locations..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-brand-cream bg-brand-offwhite text-sm
                  focus:outline-none focus:ring-2 focus:ring-brand-green focus:bg-white
                  placeholder:text-brand-dark/30 text-brand-dark transition-all" />
            </div>
          )}
          {!selectedSubLocation && subOpen && availableSubs.length > 0 && (
            <div className="mt-1 border border-brand-cream rounded-xl bg-white shadow-lg overflow-hidden">
              {filteredSubs.length === 0 ? (
                <div className="px-3 py-3 text-center"><p className="text-xs text-brand-dark/40">No sub-locations match "{subSearch}"</p></div>
              ) : (
                <div className="max-h-44 overflow-y-auto py-1">
                  {filteredSubs.map(sub => (
                    <button key={sub.id} type="button" onClick={() => selectSub(sub)}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-brand-green/5 transition text-left">
                      <FiMapPin size={12} className="text-brand-dark/20 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-brand-dark truncate">{sub.sub_location_name}</p>
                        {sub.address && <p className="text-[10px] text-brand-dark/40 truncate">{sub.address}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              <div className="border-t border-brand-cream px-3 py-2">
                <button type="button" onClick={() => setSubOpen(false)} className="text-xs text-brand-dark/40 hover:text-brand-dark transition">Close</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
export default function AssignModal({
  assets = [], departments = [], designations = [], users = [],
  accessories = [], locations = [], subLocations = [],
  onClose, onSubmit, loading,
  // Gate pass props (step 5)
  createdAssignmentIds = null,
  onGatePassUpload,
  gatePassUploading = false,
  gatePassSuccess = null,
  gatePassError = null,
}) {
  const [step, setStep] = useState(1);
  const [gatePassFile, setGatePassFile] = useState(null);
  const gatePassFileRef = useRef(null);

  // ── Step 1 state ──────────────────────────────────────
  const [categoryFilter,  setCategoryFilter]  = useState('');   // ← NEW
  const [assetSearch,     setAssetSearch]     = useState('');
  const [selectedAssets,  setSelectedAssets]  = useState([]);

  // ── Step 2 state ──────────────────────────────────────
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const [assigneeType,   setAssigneeType]   = useState('department');
  const [selectedDept,   setSelectedDept]   = useState(null);
  const [selectedUser,   setSelectedUser]   = useState(null);
  const [selectedDesig,  setSelectedDesig]  = useState(null);

  // ── Step 3 state ──────────────────────────────────────
  const [accSearch,           setAccSearch]           = useState('');
  const [selectedAccessories, setSelectedAccessories] = useState(new Set());

  // ── Step 4 state ──────────────────────────────────────
  const [form, setForm] = useState({ expected_return_date: '', condition_out: '' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const [selectedLocation,    setSelectedLocation]    = useState(null);
  const [selectedSubLocation, setSelectedSubLocation] = useState(null);

  // Auto-advance to gate pass step after assignment created
  useEffect(() => {
    if (createdAssignmentIds?.length > 0) setStep(5);
  }, [createdAssignmentIds]);

  const firstCategory  = selectedAssets[0]?.category;
  const config         = firstCategory ? (CATEGORY_OWNER_CONFIG[firstCategory] || DEFAULT_CONFIG) : DEFAULT_CONFIG;
  const ownerNeedsDept = config.ownerType === 'Department';
  const ownerNeedsUser = config.ownerType === 'User';

  const toggleAsset = (asset) =>
    setSelectedAssets(prev =>
      prev.some(a => sameId(a.id, asset.id))
        ? prev.filter(a => !sameId(a.id, asset.id))
        : [...prev, asset]
    );

  const availableAssets = safeList(assets).filter(a => a.status === 'Available');

  // Count per category for the dropdown labels
  const categoryCounts = useMemo(() => {
    const m = {};
    availableAssets.forEach(a => { m[a.category] = (m[a.category] || 0) + 1; });
    return m;
  }, [availableAssets]);

  // Filter by category first, then by search
  const filteredAssets = useMemo(() => {
    return availableAssets.filter(a => {
      if (categoryFilter && a.category !== categoryFilter) return false;
      if (!assetSearch) return true;
      const q = assetSearch.toLowerCase();
      return (
        (a.name    || '').toLowerCase().includes(q) ||
        (a.asset_no|| '').toLowerCase().includes(q) ||
        (a.category|| '').toLowerCase().includes(q)
      );
    });
  }, [availableAssets, categoryFilter, assetSearch]);

  const filteredDepts  = useMemo(() => safeList(departments).filter(d => (d.name||'').toLowerCase().includes(assigneeSearch.toLowerCase())), [departments, assigneeSearch]);
  const filteredUsers  = useMemo(() => safeList(users).filter(u => { const q = assigneeSearch.toLowerCase(); return (`${u.first_name} ${u.last_name}`).toLowerCase().includes(q) || (u.email||'').toLowerCase().includes(q); }), [users, assigneeSearch]);
  const filteredDesigs = useMemo(() => safeList(designations).filter(d => (d.title||d.name||'').toLowerCase().includes(assigneeSearch.toLowerCase())), [designations, assigneeSearch]);

  const activeAccessories   = useMemo(() => safeList(accessories).filter(a => a.is_active), [accessories]);
  const filteredAccessories = useMemo(() => activeAccessories.filter(a =>
    (a.name||'').toLowerCase().includes(accSearch.toLowerCase()) ||
    (a.description||'').toLowerCase().includes(accSearch.toLowerCase())
  ), [activeAccessories, accSearch]);

  const toggleAccessory = (acc) => {
    setSelectedAccessories(prev => { const n = new Set(prev); n.has(acc.id) ? n.delete(acc.id) : n.add(acc.id); return n; });
  };
  const selectedAccList = activeAccessories.filter(a => selectedAccessories.has(a.id));

  const handleNextFromStep1 = () => {
    if (!selectedAssets.length) return;
    const cfg = CATEGORY_OWNER_CONFIG[selectedAssets[0].category] || DEFAULT_CONFIG;
    setAssigneeType(cfg.ownerType === 'Department' ? 'department' : 'user');
    setSelectedDept(null); setSelectedUser(null); setSelectedDesig(null); setAssigneeSearch('');
    setStep(2);
  };

  const handleNextFromStep2 = () => {
    if (ownerNeedsDept && !selectedDept) return;
    if (ownerNeedsUser && !selectedUser && !selectedDesig) return;
    setAccSearch(''); setStep(3);
  };

  const handleGatePassFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setGatePassFile(file);
    e.target.value = '';
  };

  const handleGatePassUpload = () => {
    if (gatePassFile && onGatePassUpload) onGatePassUpload(gatePassFile);
  };

  const handleSubmit = () => {
    const payload = {
      asset_ids:            selectedAssets.map(a => a.id),
      expected_return_date: form.expected_return_date || null,
      condition_out:        form.condition_out        || null,
      location_id:          selectedLocation?.id      || null,
      sub_location_id:      selectedSubLocation?.id   || null,
    };
    if (selectedDept)  payload.assigned_to_department  = selectedDept.id;
    if (selectedUser)  payload.assigned_to             = selectedUser.id;
    if (selectedDesig) payload.assigned_to_designation = selectedDesig.id;
    payload.accessories = selectedAccList.map(acc => ({
      accessory_id:  acc.id,
      assigned_date: new Date().toISOString().split('T')[0],
    }));
    onSubmit(payload, { selectedAssets, selectedUser, selectedDept, selectedDesig, form });
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col" style={{ maxHeight: '90vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-cream/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-green/10 flex items-center justify-center">
              <TbTransfer size={18} className="text-brand-green" />
            </div>
            <div>
              <h3 className="text-base font-bold text-brand-dark">Assign Asset</h3>
              <p className="text-xs text-brand-dark/40 mt-0.5">
                {step === 1 && `${selectedAssets.length > 0 ? `${selectedAssets.length} selected — ` : ''}Select assets`}
                {step === 2 && `${selectedAssets.length} asset(s) → Select assignee`}
                {step === 3 && 'Add accessories (optional)'}
                {step === 4 && 'Review & confirm assignment'}
                {step === 5 && 'Upload gate pass document (optional)'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Steps current={step} />
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-brand-dark/30 hover:bg-brand-cream/40 transition ml-1">
              <FiX size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <div className="p-5 space-y-4">

              {/* ── Category + Search row ── */}
              <div className="flex items-center gap-2">
                {/* Category dropdown */}
                <div className="relative shrink-0">
                  <TbCategory size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-dark/30 pointer-events-none" />
                  <select
                    value={categoryFilter}
                    onChange={e => { setCategoryFilter(e.target.value); setSelectedAssets([]); }}
                    className="pl-8 pr-8 py-2.5 rounded-xl border border-brand-cream bg-brand-offwhite text-sm
                      text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-green
                      appearance-none cursor-pointer min-w-[160px]">
                    <option value="">All Categories ({availableAssets.length})</option>
                    {CATEGORIES.map(c => (
                      <option key={c} value={c} disabled={!categoryCounts[c]}>
                        {c} ({categoryCounts[c] || 0})
                      </option>
                    ))}
                  </select>
                  <FiChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-dark/30 pointer-events-none" />
                </div>

                {/* Search */}
                <div className="relative flex-1">
                  <FiSearch size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-dark/30" />
                  <input
                    value={assetSearch}
                    onChange={e => setAssetSearch(e.target.value)}
                    placeholder="Search by name or asset no..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-brand-cream bg-brand-offwhite text-sm
                      focus:outline-none focus:ring-2 focus:ring-brand-green focus:bg-white
                      placeholder:text-brand-dark/30 text-brand-dark transition-all" />
                </div>
              </div>

              {/* Results count + clear */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold text-brand-dark/40">
                    {filteredAssets.length} asset{filteredAssets.length !== 1 ? 's' : ''}
                    {categoryFilter && (
                      <span className="ml-1">
                        in <span className="font-bold text-brand-dark/60">{categoryFilter}</span>
                      </span>
                    )}
                    {selectedAssets.length > 0 && (
                      <> · <span className="text-brand-green font-bold">{selectedAssets.length} selected</span></>
                    )}
                  </p>
                  {/* Active category badge */}
                  {categoryFilter && (
                    <button
                      onClick={() => { setCategoryFilter(''); setSelectedAssets([]); }}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                        bg-brand-green/10 text-brand-green text-[10px] font-bold hover:bg-red-100 hover:text-red-500 transition">
                      {categoryFilter} <FiX size={9} />
                    </button>
                  )}
                </div>
                {selectedAssets.length > 0 && (
                  <button onClick={() => setSelectedAssets([])} className="text-xs text-red-400 hover:text-red-500">Clear</button>
                )}
              </div>

              <div className="flex items-center gap-2 px-3 py-2 bg-brand-green/5 border border-brand-green/20 rounded-xl">
                <FiInfo size={12} className="text-brand-green shrink-0" />
                <p className="text-xs text-brand-green-dark">You can select <strong>multiple assets</strong> from the same category for bulk assignment.</p>
              </div>

              {/* Asset list */}
              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                {filteredAssets.length === 0 ? (
                  <div className="py-12 text-center">
                    <HiOutlineCube size={32} className="mx-auto mb-2 text-brand-dark/20" />
                    <p className="text-sm text-brand-dark/40">
                      {categoryFilter && !assetSearch
                        ? `No available assets in ${categoryFilter}`
                        : assetSearch
                          ? 'No assets match your search'
                          : 'No available assets'}
                    </p>
                    {categoryFilter && (
                      <button onClick={() => setCategoryFilter('')} className="mt-2 text-xs text-brand-green hover:underline font-semibold">
                        Show all categories
                      </button>
                    )}
                  </div>
                ) : filteredAssets.map(asset => {
                  const CIcon  = CATEGORY_ICONS[asset.category]  || HiOutlineCube;
                  const cColor = CATEGORY_COLORS[asset.category] || 'bg-slate-100 text-slate-500';
                  return (
                    <SelectableItem key={asset.id}
                      selected={selectedAssets.some(a => sameId(a.id, asset.id))}
                      onClick={() => toggleAsset(asset)}
                      icon={CIcon} iconBg={cColor} title={asset.name}
                      subtitle={[asset.asset_no && `No: ${asset.asset_no}`, !categoryFilter && asset.category].filter(Boolean).join(' · ')}
                      badge={asset.asset_type_name || asset.asset_type || null} />
                  );
                })}
              </div>

              {/* Selected chips */}
              {selectedAssets.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-brand-cream/60">
                  {selectedAssets.map(a => (
                    <span key={a.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-green/10 text-brand-green text-xs font-semibold">
                      {a.name}
                      <button onClick={() => toggleAsset(a)} className="hover:text-red-500"><FiX size={11} /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl border border-brand-cream bg-brand-offwhite flex-wrap">
                <div className="flex -space-x-2">
                  {selectedAssets.slice(0, 4).map(a => {
                    const CIcon = CATEGORY_ICONS[a.category] || HiOutlineCube;
                    const cc    = CATEGORY_COLORS[a.category] || 'bg-slate-100 text-slate-500';
                    return (
                      <div key={a.id} className={`w-8 h-8 rounded-xl flex items-center justify-center border-2 border-white ${cc}`}>
                        <CIcon size={14} />
                      </div>
                    );
                  })}
                  {selectedAssets.length > 4 && (
                    <div className="w-8 h-8 rounded-xl bg-brand-cream flex items-center justify-center border-2 border-white text-xs font-bold text-brand-dark">
                      +{selectedAssets.length - 4}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-brand-dark">{selectedAssets.length} asset{selectedAssets.length !== 1 ? 's' : ''}</p>
                  <p className="text-xs text-brand-dark/40 truncate">{selectedAssets.map(a => a.name).join(', ')}</p>
                </div>
                <button onClick={() => setStep(1)} className="text-xs text-brand-green hover:underline shrink-0">Change</button>
              </div>

              <div className="flex items-start gap-2.5 p-3 bg-brand-green/5 border border-brand-green/20 rounded-xl">
                <FiAlertCircle size={14} className="text-brand-green mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-brand-green-dark">{config.ownerLabel}</p>
                  <p className="text-xs text-brand-dark/50 mt-0.5">{config.note}</p>
                </div>
              </div>

              {ownerNeedsUser && (
                <div className="flex items-center gap-1 bg-brand-cream/40 rounded-xl p-1">
                  {[{ key: 'user', label: 'Employee', icon: HiOutlineUser }, { key: 'designation', label: 'Designation', icon: TbBriefcase }].map(tab => (
                    <button key={tab.key}
                      onClick={() => { setAssigneeType(tab.key); setSelectedUser(null); setSelectedDesig(null); setAssigneeSearch(''); }}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all
                        ${assigneeType === tab.key ? 'bg-white text-brand-dark shadow-sm' : 'text-brand-dark/50 hover:text-brand-dark'}`}>
                      <tab.icon size={13} /> {tab.label}
                    </button>
                  ))}
                </div>
              )}

              <SearchInput value={assigneeSearch} onChange={setAssigneeSearch}
                placeholder={assigneeType === 'department' ? 'Search departments...' : assigneeType === 'designation' ? 'Search designations...' : 'Search employees...'} />

              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {assigneeType === 'department' && (
                  filteredDepts.length === 0
                    ? <div className="py-8 text-center"><HiOutlineOfficeBuilding size={28} className="mx-auto mb-2 text-brand-dark/20"/><p className="text-sm text-brand-dark/40">No departments found</p></div>
                    : filteredDepts.map(dept => (
                        <SelectableItem key={dept.id} selected={sameId(selectedDept?.id, dept.id)} onClick={() => setSelectedDept(dept)}
                          icon={TbBuilding} iconBg="bg-indigo-100 text-indigo-600" title={dept.name}
                          subtitle={dept.description||null} badge={dept.employee_count ? `${dept.employee_count} members` : null} />
                      ))
                )}
                {assigneeType === 'user' && (
                  filteredUsers.length === 0
                    ? <div className="py-8 text-center"><HiOutlineUser size={28} className="mx-auto mb-2 text-brand-dark/20"/><p className="text-sm text-brand-dark/40">No employees found</p></div>
                    : filteredUsers.map(u => (
                        <SelectableItem key={u.id} selected={sameId(selectedUser?.id, u.id)} onClick={() => setSelectedUser(u)}
                          icon={() => <span className="text-xs font-black text-brand-green">{(u.first_name?.[0]||'?').toUpperCase()}</span>}
                          iconBg="bg-brand-green/10" title={`${u.first_name} ${u.last_name}`}
                          subtitle={[u.designation_name, u.department_name, u.email].filter(Boolean).join(' · ')}
                          badge={u.role||null} />
                      ))
                )}
                {assigneeType === 'designation' && (
                  filteredDesigs.length === 0
                    ? <div className="py-8 text-center"><TbBriefcase size={28} className="mx-auto mb-2 text-brand-dark/20"/><p className="text-sm text-brand-dark/40">No designations found</p></div>
                    : filteredDesigs.map(d => (
                        <SelectableItem key={d.id} selected={sameId(selectedDesig?.id, d.id)} onClick={() => setSelectedDesig(d)}
                          icon={TbBriefcase} iconBg="bg-blue-100 text-blue-600" title={d.title||d.name}
                          subtitle={d.department_name||null} badge={d.level||null} />
                      ))
                )}
              </div>

              {(selectedDept || selectedUser || selectedDesig) && (
                <div className="flex items-center gap-2 p-2.5 bg-brand-green/5 border border-brand-green/20 rounded-xl">
                  <FiCheck size={13} className="text-brand-green shrink-0" />
                  <p className="text-xs font-semibold text-brand-green-dark">
                    Selected: {selectedDept?.name || (selectedUser && `${selectedUser.first_name} ${selectedUser.last_name}`) || selectedDesig?.title}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 3 ── */}
          {step === 3 && (
            <div className="p-5 space-y-4">
              <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                <TbTool size={15} className="text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-amber-700">Accessories are optional</p>
                  <p className="text-xs text-amber-600 mt-0.5">
                    Selected accessories will be assigned to all <strong>{selectedAssets.length} asset{selectedAssets.length !== 1 ? 's' : ''}</strong>. You can skip this step.
                  </p>
                </div>
              </div>
              <SearchInput value={accSearch} onChange={setAccSearch} placeholder="Search accessories..." />
              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                {filteredAccessories.length === 0 ? (
                  <div className="py-10 text-center">
                    <TbTool size={28} className="mx-auto mb-2 text-brand-dark/20" />
                    <p className="text-sm text-brand-dark/40">{accSearch ? 'No accessories match' : 'No active accessories found'}</p>
                  </div>
                ) : filteredAccessories.map(acc => {
                  const selected = selectedAccessories.has(acc.id);
                  return (
                    <button key={acc.id} type="button" onClick={() => toggleAccessory(acc)}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl border-2 transition-all duration-150 text-left
                        ${selected ? 'border-brand-green bg-brand-green/5' : 'border-brand-cream hover:border-brand-green/30 hover:bg-brand-green/5 bg-white'}`}>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${selected ? 'bg-brand-green/10' : 'bg-brand-cream/50'}`}>
                        <TbTool size={16} className={selected ? 'text-brand-green' : 'text-brand-dark/40'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${selected ? 'text-brand-green-dark' : 'text-brand-dark'}`}>{acc.name}</p>
                        {acc.description && <p className="text-xs text-brand-dark/40 truncate">{acc.description}</p>}
                      </div>
                      {selected
                        ? <div className="w-5 h-5 rounded-full bg-brand-green flex items-center justify-center shrink-0"><FiCheck size={11} className="text-brand-cream-light" /></div>
                        : <div className="w-5 h-5 rounded-full border-2 border-brand-cream shrink-0" />}
                    </button>
                  );
                })}
              </div>
              {selectedAccList.length > 0 ? (
                <div className="p-3 bg-brand-green/5 border border-brand-green/20 rounded-xl">
                  <p className="text-[10px] font-bold text-brand-green uppercase tracking-wider mb-2">
                    {selectedAccList.length} accessor{selectedAccList.length !== 1 ? 'ies' : 'y'} selected
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedAccList.map(acc => (
                      <span key={acc.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-brand-green/20 text-brand-green-dark text-xs font-semibold">
                        <TbTool size={10} /> {acc.name}
                        <button type="button" onClick={() => toggleAccessory(acc)} className="hover:text-red-500 ml-0.5"><FiX size={10} /></button>
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-2.5 bg-brand-offwhite border border-brand-cream rounded-xl">
                  <FiInfo size={13} className="text-brand-dark/30 shrink-0" />
                  <p className="text-xs text-brand-dark/50">No accessories selected — you can proceed without any.</p>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 5: Gate Pass ── */}
          {step === 5 && (
            <div className="p-5 space-y-5">
              {/* Success banner */}
              <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                  <FiCheckCircle size={20} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-800">
                    {(createdAssignmentIds?.length || selectedAssets.length)} asset{(createdAssignmentIds?.length || selectedAssets.length) !== 1 ? 's' : ''} assigned successfully!
                  </p>
                  <p className="text-xs text-emerald-600 mt-0.5">
                    Assignment certificate PDF has been generated and downloaded.
                  </p>
                </div>
              </div>

              {/* Gate pass upload */}
              <div className="rounded-2xl border-2 border-dashed border-brand-cream p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                    <FiFileText size={15} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-brand-dark">Gate Pass Document</p>
                    <p className="text-xs text-brand-dark/50">
                      Upload the physical gate pass for this assignment (PDF, JPG, or PNG)
                    </p>
                  </div>
                  <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-brand-cream/60 text-brand-dark/50 font-bold shrink-0">
                    Optional
                  </span>
                </div>

                {gatePassSuccess ? (
                  <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <FiCheckCircle size={14} className="text-emerald-600 shrink-0" />
                    <p className="text-xs font-semibold text-emerald-700">{gatePassSuccess}</p>
                  </div>
                ) : gatePassFile ? (
                  <div className="flex items-center gap-3 p-3 bg-brand-green/5 border border-brand-green/20 rounded-xl">
                    <FiFileText size={14} className="text-brand-green shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-brand-green-dark truncate">{gatePassFile.name}</p>
                      <p className="text-xs text-brand-dark/40">{(gatePassFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setGatePassFile(null)}
                      className="text-brand-dark/30 hover:text-red-400 transition shrink-0">
                      <FiX size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => gatePassFileRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
                      border border-brand-cream bg-brand-offwhite hover:bg-brand-cream/30
                      text-sm font-semibold text-brand-dark/60 transition">
                    <FiUpload size={14} />
                    Choose File
                  </button>
                )}

                <input
                  ref={gatePassFileRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={handleGatePassFileChange}
                />

                {gatePassError && (
                  <p className="text-xs text-red-500 font-medium">{gatePassError}</p>
                )}

                {createdAssignmentIds?.length > 1 && (
                  <p className="text-[11px] text-brand-dark/40 text-center">
                    Gate pass will be applied to all {createdAssignmentIds.length} assignments in this batch.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 4 ── */}
          {step === 4 && (
            <div className="p-5 space-y-4">
              <div className="bg-brand-offwhite border border-brand-cream rounded-xl p-4 space-y-3">
                <p className="text-[10px] font-bold text-brand-dark/40 uppercase tracking-widest">
                  Assignment Summary · {selectedAssets.length} Asset{selectedAssets.length !== 1 ? 's' : ''}
                </p>
                <div className="space-y-1.5 max-h-28 overflow-y-auto">
                  {selectedAssets.map((a, i) => {
                    const CIcon  = CATEGORY_ICONS[a.category]  || HiOutlineCube;
                    const cColor = CATEGORY_COLORS[a.category] || 'bg-slate-100 text-slate-500';
                    return (
                      <div key={a.id} className="flex items-center gap-2.5">
                        <span className="text-[10px] font-bold text-brand-dark/30 w-4 text-right">{i + 1}</span>
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${cColor}`}><CIcon size={13} /></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-brand-dark truncate">{a.name}</p>
                          <p className="text-[10px] text-brand-dark/40">{a.category}{a.asset_no && ` · ${a.asset_no}`}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-brand-cream/60">
                  <FiChevronRight size={14} className="text-brand-dark/20 shrink-0" />
                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedDept  && <><TbBuilding size={14} className="text-indigo-500"/><span className="text-sm font-semibold text-brand-dark">{selectedDept.name}</span><span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-600 font-bold">Department</span></>}
                    {selectedUser  && <><div className="w-6 h-6 rounded-full bg-brand-green/10 flex items-center justify-center text-[10px] font-black text-brand-green">{selectedUser.first_name?.[0]?.toUpperCase()}</div><span className="text-sm font-semibold text-brand-dark">{selectedUser.first_name} {selectedUser.last_name}</span><span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-600 font-bold">Employee</span></>}
                    {selectedDesig && <><TbBriefcase size={14} className="text-blue-500"/><span className="text-sm font-semibold text-brand-dark">{selectedDesig.title||selectedDesig.name}</span><span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-100 text-sky-600 font-bold">Designation</span></>}
                  </div>
                </div>
                <CIAPreview selectedUser={selectedUser} selectedDesig={selectedDesig} designations={designations} />
              </div>

              {selectedAccList.length > 0 && (
                <div className="bg-white border border-brand-cream rounded-xl p-3 space-y-2">
                  <p className="text-[10px] font-bold text-brand-dark/40 uppercase tracking-widest flex items-center gap-1.5">
                    <TbTool size={11} /> Accessories ({selectedAccList.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedAccList.map(acc => (
                      <span key={acc.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-cream/50 text-brand-dark text-xs font-semibold">
                        <TbTool size={10} className="text-brand-dark/40" /> {acc.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <LocationSelector
                locations={locations} subLocations={subLocations}
                selectedLocation={selectedLocation} selectedSubLocation={selectedSubLocation}
                onLocationChange={(loc) => { setSelectedLocation(loc); setSelectedSubLocation(null); }}
                onSubLocationChange={setSelectedSubLocation}
              />

              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-brand-dark/50 uppercase tracking-wider mb-1.5">
                  <FiCalendar size={11} /> Expected Return Date
                </label>
                <input type="date" value={form.expected_return_date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => set('expected_return_date', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-brand-cream bg-white text-sm text-brand-dark
                    focus:outline-none focus:ring-2 focus:ring-brand-green transition-all" />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-brand-dark/50 uppercase tracking-wider mb-2">
                  <FiPackage size={11} /> Condition at Checkout
                </label>
                <div className="flex gap-2 flex-wrap">
                  {CONDITIONS.map(c => (
                    <button key={c} type="button" onClick={() => set('condition_out', c)}
                      className={`px-3 py-1.5 rounded-lg border-2 text-xs font-bold transition-all
                        ${form.condition_out === c
                          ? 'border-brand-green bg-brand-green/10 text-brand-green-dark'
                          : 'border-brand-cream text-brand-dark/50 hover:border-brand-green/30'}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-violet-50 border border-violet-100 rounded-xl">
                <span className="text-base shrink-0">📄</span>
                <p className="text-xs text-violet-700">
                  An <strong>Assignment Certificate PDF</strong> will be generated automatically.
                  {selectedAccList.length > 0 && <> Accessories will be <strong>auto-saved</strong>.</>}
                </p>
              </div>

              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                <FiAlertCircle size={13} className="text-amber-600 shrink-0" />
                <p className="text-xs text-amber-700">
                  Asset status will change to <strong>In Use</strong> for all {selectedAssets.length} asset{selectedAssets.length !== 1 ? 's' : ''}.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 border-t border-brand-cream/60 shrink-0">
          {step === 1 && (
            <button onClick={onClose} className="flex-1 py-2.5 border border-brand-cream rounded-xl text-sm font-semibold text-brand-dark/60 hover:bg-brand-cream/30 transition">
              Cancel
            </button>
          )}
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)} className="flex items-center gap-2 px-4 py-2.5 border border-brand-cream rounded-xl text-sm font-semibold text-brand-dark/60 hover:bg-brand-cream/30 transition">
              <HiOutlineChevronLeft size={15} /> Back
            </button>
          )}
          {step === 1 && (
            <button disabled={selectedAssets.length === 0} onClick={handleNextFromStep1}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-brand-green hover:bg-brand-green-dark disabled:opacity-40 text-brand-cream-light rounded-xl text-sm font-semibold transition">
              Next — Select Assignee
              {selectedAssets.length > 0 && <span className="bg-brand-green-dark/30 px-1.5 py-0.5 rounded-md text-[11px] font-black">{selectedAssets.length}</span>}
              <FiChevronRight size={15} />
            </button>
          )}
          {step === 2 && (
            <button
              disabled={(ownerNeedsDept && !selectedDept) || (ownerNeedsUser && !selectedUser && !selectedDesig)}
              onClick={handleNextFromStep2}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-brand-green hover:bg-brand-green-dark disabled:opacity-40 text-brand-cream-light rounded-xl text-sm font-semibold transition">
              Next — Add Accessories <FiChevronRight size={15} />
            </button>
          )}
          {step === 3 && (
            <div className="flex-1 flex gap-2">
              <button onClick={() => setStep(4)} className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-brand-cream bg-brand-offwhite hover:bg-brand-cream/40 text-brand-dark rounded-xl text-sm font-semibold transition">
                Skip <FiChevronRight size={15} />
              </button>
              <button onClick={() => setStep(4)} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-brand-green hover:bg-brand-green-dark text-brand-cream-light rounded-xl text-sm font-semibold transition">
                {selectedAccList.length > 0
                  ? <><TbTool size={15} /> {selectedAccList.length} Selected — Review <FiChevronRight size={15} /></>
                  : <>Next — Review <FiChevronRight size={15} /></>}
              </button>
            </div>
          )}
          {step === 4 && (
            <button disabled={loading} onClick={handleSubmit}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-brand-green hover:bg-brand-green-dark disabled:opacity-40 text-brand-cream-light rounded-xl text-sm font-semibold transition">
              <MdOutlineAssignmentInd size={17} />
              {loading ? 'Assigning...' : 'Confirm & Generate PDF'}
            </button>
          )}
          {step === 5 && (
            <div className="flex-1 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 border border-brand-cream rounded-xl text-sm font-semibold text-brand-dark/60 hover:bg-brand-cream/30 transition">
                {gatePassSuccess ? 'Done' : 'Skip'}
              </button>
              {!gatePassSuccess && gatePassFile && (
                <button
                  disabled={gatePassUploading}
                  onClick={handleGatePassUpload}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition">
                  {gatePassUploading
                    ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Uploading...</>
                    : <><FiUpload size={14} /> Upload Gate Pass</>}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

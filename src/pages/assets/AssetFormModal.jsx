import { useState, useEffect, useRef } from 'react';
import {
  FiUser, FiServer, FiTool, FiHardDrive, FiFileText, FiMonitor, FiHome,
  FiX, FiLock, FiCheckCircle, FiZap, FiTag, FiMapPin, FiDollarSign,
  FiAlignLeft, FiShield, FiAlertCircle, FiLayers, FiSearch, FiChevronDown,
  FiLoader, FiUpload, FiFile, FiUsers, FiBriefcase
} from 'react-icons/fi';
import { MdOutlineLocationCity } from 'react-icons/md';
import { useDispatch, useSelector } from 'react-redux';
import { fetchLocations, fetchSubLocations } from '../../features/locations/locationSlice';
import { fetchUsers } from '../../features/users/userSlice';
import { fetchAllAssetTypes } from '../../features/assetTypes/assetTypeSlice';

// ── Enums ────────────────────────────────────────────────────────────────────
const CATEGORIES      = ['Human', 'IT Infrastructure', 'Service', 'Digital', 'Tangible Information', 'End User', 'Facility'];
const STATUSES        = ['Available', 'In Use', 'In Maintenance', 'In Repair', 'Broken', 'Retired', 'Lost'];
const FINANCIAL_TYPES = ['None', 'CAPEX', 'OPEX'];
const FACILITY_TYPES  = ['Meeting Room', 'Discussion Room', 'Building', 'Working Area'];
const CONDITIONS      = ['Brand New', 'Used'];
const DOC_TYPES       = ['PO', 'CAPEX', 'OPEX', 'Warranty', 'Custom', 'Other'];

// ── Category Permission Rules (mirrors backend) ───────────────────────────────
const FINANCIAL_CATEGORIES   = ['IT Infrastructure', 'End User', 'Service', 'Digital'];
const WARRANTY_CATEGORIES    = ['IT Infrastructure', 'End User', 'Facility', 'Digital', 'Service'];
const SUPPORT_DOC_CATEGORIES = ['IT Infrastructure', 'End User', 'Service', 'Digital', 'Tangible Information', 'Facility'];
const STATUS_CATEGORIES      = ['IT Infrastructure', 'End User', 'Service', 'Digital', 'Facility'];
const LOCATION_CATEGORIES    = ['IT Infrastructure', 'End User', 'Service', 'Digital', 'Tangible Information', 'Facility'];

// ── Category metadata ─────────────────────────────────────────────────────────
const CATEGORY_META = {
  'Human':               { icon: FiUser,                color: '#6366f1', label: 'Human Asset'       },
  'IT Infrastructure':   { icon: FiServer,              color: '#0ea5e9', label: 'IT Infrastructure'  },
  'Service':             { icon: FiTool,                color: '#f59e0b', label: 'Service'             },
  'Digital':             { icon: FiHardDrive,           color: '#8b5cf6', label: 'Digital Asset'      },
  'Tangible Information':{ icon: FiFileText,            color: '#10b981', label: 'Tangible Info'      },
  'End User':            { icon: FiMonitor,             color: '#ef4444', label: 'End User Device'    },
  'Facility':            { icon: MdOutlineLocationCity, color: '#f97316', label: 'Facility'           },
};

const safeList = (v) => (Array.isArray(v) ? v : []);

// ── Field atoms ───────────────────────────────────────────────────────────────
const Label = ({ children, required }) => (
  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
    {children}{required && <span className="text-rose-400 ml-0.5">*</span>}
  </label>
);

const inputBase = `w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-800
  placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent
  transition-all duration-150`;

const Input  = (props) => <input className={inputBase} {...props} />;
const Select = ({ children, ...props }) => (
  <select className={inputBase} {...props}>{children}</select>
);
const Field = ({ label, required, children, className = '' }) => (
  <div className={className}>
    <Label required={required}>{label}</Label>
    {children}
  </div>
);

// ── Restriction Notice Banner ─────────────────────────────────────────────────
const RestrictedBanner = ({ category, hiddenSections }) => {
  if (!hiddenSections.length) return null;
  const meta = CATEGORY_META[category];
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 flex items-start gap-2.5">
      <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: meta?.color + '22' }}>
        <meta.icon size={11} style={{ color: meta?.color }} />
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-600">
          {category} assets do not use:
          <span className="font-bold text-slate-700"> {hiddenSections.join(', ')}</span>
        </p>
        <p className="text-[10px] text-slate-400 mt-0.5">These sections are hidden for this category.</p>
      </div>
    </div>
  );
};

const SectionDivider = ({ title, color, Icon }) => (
  <div className="flex items-center gap-3 my-2">
    <div className="h-px flex-1 bg-slate-100" />
    <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest
      px-2.5 py-0.5 rounded-full text-white"
      style={{ backgroundColor: color, opacity: 0.9 }}>
      {Icon && <Icon size={11} />} {title}
    </span>
    <div className="h-px flex-1 bg-slate-100" />
  </div>
);

// ── Generic Searchable Dropdown ───────────────────────────────────────────────
const SearchDropdown = ({
  value, onChange, options = [], loading = false,
  placeholder = 'Search...', disabled = false,
  renderOption, renderSelected, icon: IconComp = FiTag,
  emptyText = 'No options available', emptyHint = '',
  color = '#6366f1',
}) => {
  const [open,   setOpen]   = useState(false);
  const [search, setSearch] = useState('');
  const wrapRef  = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const h = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 50); }, [open]);

  const filtered = options.filter(o =>
    !search || JSON.stringify(o).toLowerCase().includes(search.toLowerCase())
  );

  const handleClear = (e) => { e.stopPropagation(); onChange(null); setSearch(''); };

  return (
    <div ref={wrapRef} className="relative">
      <button type="button"
        onClick={() => !disabled && setOpen(o => !o)}
        disabled={disabled}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border
          text-sm transition-all duration-150 bg-white text-left
          ${disabled ? 'border-slate-200 bg-slate-50 cursor-not-allowed opacity-60'
            : open ? 'border-indigo-400 ring-2 ring-indigo-400'
            : 'border-slate-200 hover:border-slate-300 cursor-pointer'}
          ${!value ? 'text-slate-400' : 'text-slate-800'}`}>
        <span className="flex items-center gap-2 truncate">
          <IconComp size={13} style={{ color: value ? color : '#cbd5e1', flexShrink: 0 }} />
          <span className="truncate">{value ? (renderSelected ? renderSelected(value) : String(value)) : placeholder}</span>
        </span>
        <span className="flex items-center gap-1 shrink-0 ml-2">
          {value && (
            <span onClick={handleClear}
              className="w-4 h-4 rounded-full bg-slate-200 hover:bg-red-100 hover:text-red-500
                flex items-center justify-center text-slate-500 transition-colors cursor-pointer">
              <FiX size={9} />
            </span>
          )}
          {loading
            ? <FiLoader size={13} className="text-slate-400 animate-spin" />
            : <FiChevronDown size={13} className={`text-slate-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
          }
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full bg-white rounded-xl border border-slate-200
          shadow-xl shadow-slate-200/60 overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100 bg-slate-50">
            <FiSearch size={13} className="text-slate-400 shrink-0" />
            <input ref={inputRef} type="text" value={search}
              onChange={e => setSearch(e.target.value)} placeholder={placeholder}
              className="flex-1 text-sm bg-transparent outline-none text-slate-700 placeholder-slate-400" />
            {search && <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600"><FiX size={12} /></button>}
          </div>
          <div className="max-h-52 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-slate-400 text-sm">
                <FiLoader size={14} className="animate-spin" /> Loading...
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-slate-400">{search ? `No results for "${search}"` : emptyText}</p>
                {emptyHint && <p className="text-xs text-slate-300 mt-1">{emptyHint}</p>}
              </div>
            ) : filtered.map((opt, i) => renderOption(opt, i, { setOpen, setSearch }))}
          </div>
          <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100">
            <p className="text-[10px] text-slate-400">{filtered.length} result{filtered.length !== 1 ? 's' : ''}{search && ` for "${search}"`}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Asset Type Dropdown ────────────────────────────────────────────────────────
const AssetTypeSelect = ({ value, onChange, category, assetTypes = [], loading = false }) => {
  const filtered = safeList(assetTypes).filter(t => !category || t.category === category);
  const selected = safeList(assetTypes).find(t => t.id === value);
  const meta     = category ? CATEGORY_META[category] : null;

  useEffect(() => {
    if (value && category && selected && selected.category !== category) onChange(null);
  }, [category]);

  return (
    <SearchDropdown
      value={value} onChange={onChange} options={filtered} loading={loading}
      disabled={!category}
      placeholder={!category ? 'Select a category first...' : `Search ${category} types...`}
      icon={meta?.icon || FiTag} color={meta?.color || '#6366f1'}
      emptyText={`No types in ${category || 'this category'}`}
      emptyHint="Create types in the Asset Types page"
      renderSelected={() => selected?.name || ''}
      renderOption={(type, i, { setOpen, setSearch }) => {
        const isSel = type.id === value;
        return (
          <button key={type.id} type="button"
            onClick={() => { onChange(type.id); setOpen(false); setSearch(''); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left transition-colors
              ${isSel ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'}`}>
            <span className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
              style={{ backgroundColor: isSel ? (meta?.color || '#6366f1') + '22' : '#f1f5f9' }}>
              {meta
                ? <meta.icon size={11} style={{ color: isSel ? (meta?.color || '#6366f1') : '#94a3b8' }} />
                : <FiTag size={11} className="text-slate-400" />}
            </span>
            <span className="flex-1 truncate font-medium">{type.name}</span>
            {isSel && <FiCheckCircle size={13} className="shrink-0" style={{ color: meta?.color || '#6366f1' }} />}
          </button>
        );
      }}
    />
  );
};

// ── Location Dropdown ──────────────────────────────────────────────────────────
const LocationSelect = ({ value, onChange, locations = [], loading = false }) => {
  const selected = safeList(locations).find(l => l.id === value);
  return (
    <SearchDropdown
      value={value} onChange={onChange} options={safeList(locations)} loading={loading}
      placeholder="Search and select a location..."
      icon={FiMapPin} color="#6366f1"
      emptyText="No locations available"
      renderSelected={() => selected?.location_name || ''}
      renderOption={(loc, i, { setOpen, setSearch }) => {
        const isSel = loc.id === value;
        return (
          <button key={loc.id} type="button"
            onClick={() => { onChange(loc.id); setOpen(false); setSearch(''); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left transition-colors
              ${isSel ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'}`}>
            <span className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${isSel ? 'bg-indigo-100' : 'bg-slate-100'}`}>
              <FiMapPin size={11} className={isSel ? 'text-indigo-500' : 'text-slate-400'} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{loc.location_name}</p>
              {loc.address && <p className="text-[10px] text-slate-400 truncate">{loc.address}</p>}
            </div>
            {isSel && <FiCheckCircle size={13} className="text-indigo-500 shrink-0" />}
          </button>
        );
      }}
    />
  );
};

// ── Sub-Location Dropdown ──────────────────────────────────────────────────────
const SubLocationSelect = ({ value, onChange, subLocations = [], loading = false, disabled = false }) => {
  const selected = safeList(subLocations).find(s => s.id === value);
  return (
    <SearchDropdown
      value={value} onChange={onChange} options={safeList(subLocations)} loading={loading}
      disabled={disabled}
      placeholder={disabled ? 'Select a location first...' : 'Search sub-locations...'}
      icon={FiHome} color="#6366f1"
      emptyText="No sub-locations for this location"
      renderSelected={() => selected?.sub_location_name || ''}
      renderOption={(sl, i, { setOpen, setSearch }) => {
        const isSel = sl.id === value;
        return (
          <button key={sl.id} type="button"
            onClick={() => { onChange(sl.id); setOpen(false); setSearch(''); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left transition-colors
              ${isSel ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'}`}>
            <span className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${isSel ? 'bg-indigo-100' : 'bg-slate-100'}`}>
              <FiHome size={11} className={isSel ? 'text-indigo-500' : 'text-slate-400'} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{sl.sub_location_name}</p>
              {sl.address && <p className="text-[10px] text-slate-400 truncate">{sl.address}</p>}
            </div>
            {isSel && <FiCheckCircle size={13} className="text-indigo-500 shrink-0" />}
          </button>
        );
      }}
    />
  );
};

// ── Owner / Custodian Selector ─────────────────────────────────────────────────
const OwnerSelector = ({ label, userIdKey, designationIdKey, form, set, users = [], designations = [], usersLoading = false }) => {
  const [mode, setMode] = useState(() => form[designationIdKey] ? 'designation' : 'user');
  const selectedUser = safeList(users).find(u => u.id === form[userIdKey]);
  const selectedDes  = safeList(designations).find(d => d.id === form[designationIdKey]);

  const switchMode = (m) => { setMode(m); set(userIdKey, null); set(designationIdKey, null); };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <div className="flex rounded-lg border border-slate-200 overflow-hidden text-[10px] font-bold uppercase tracking-wider">
          <button type="button" onClick={() => switchMode('user')}
            className={`flex items-center gap-1 px-2.5 py-1 transition-colors
              ${mode === 'user' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:bg-slate-50'}`}>
            <FiUser size={9} /> User
          </button>
          <button type="button" onClick={() => switchMode('designation')}
            className={`flex items-center gap-1 px-2.5 py-1 transition-colors border-l border-slate-200
              ${mode === 'designation' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:bg-slate-50'}`}>
            <FiBriefcase size={9} /> Role
          </button>
        </div>
      </div>

      {mode === 'user' ? (
        <SearchDropdown
          value={form[userIdKey]}
          onChange={id => { set(userIdKey, id); set(designationIdKey, null); }}
          options={safeList(users)} loading={usersLoading}
          placeholder="Search users..." icon={FiUser} color="#6366f1"
          emptyText="No users found"
          renderSelected={() => selectedUser ? `${selectedUser.first_name} ${selectedUser.last_name}` : ''}
          renderOption={(u, i, { setOpen, setSearch }) => {
            const isSel = u.id === form[userIdKey];
            return (
              <button key={u.id} type="button"
                onClick={() => { set(userIdKey, u.id); set(designationIdKey, null); setOpen(false); setSearch(''); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left transition-colors
                  ${isSel ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold
                  ${isSel ? 'bg-indigo-200 text-indigo-700' : 'bg-slate-200 text-slate-500'}`}>
                  {u.first_name?.[0]}{u.last_name?.[0]}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{u.first_name} {u.last_name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
                </div>
                {isSel && <FiCheckCircle size={13} className="text-indigo-500 shrink-0" />}
              </button>
            );
          }}
        />
      ) : (
        <SearchDropdown
          value={form[designationIdKey]}
          onChange={id => { set(designationIdKey, id); set(userIdKey, null); }}
          options={safeList(designations)}
          placeholder="Search designations..." icon={FiBriefcase} color="#6366f1"
          emptyText="No designations found"
          renderSelected={() => selectedDes?.title || ''}
          renderOption={(d, i, { setOpen, setSearch }) => {
            const isSel = d.id === form[designationIdKey];
            return (
              <button key={d.id} type="button"
                onClick={() => { set(designationIdKey, d.id); set(userIdKey, null); setOpen(false); setSearch(''); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left transition-colors
                  ${isSel ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'}`}>
                <span className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0
                  ${isSel ? 'bg-indigo-100' : 'bg-slate-100'}`}>
                  <FiBriefcase size={11} className={isSel ? 'text-indigo-500' : 'text-slate-400'} />
                </span>
                <span className="flex-1 truncate font-medium">{d.title}</span>
                {isSel && <FiCheckCircle size={13} className="text-indigo-500 shrink-0" />}
              </button>
            );
          }}
        />
      )}
    </div>
  );
};

// ── Support Document Upload ────────────────────────────────────────────────────
const SupportDocumentUpload = ({ file, onFileChange, docType, onDocTypeChange }) => {
  const inputRef = useRef(null);
  const handleDrop = (e) => { e.preventDefault(); const d = e.dataTransfer.files[0]; if (d) onFileChange(d); };
  const formatSize = (b) => b < 1024*1024 ? `${(b/1024).toFixed(1)} KB` : `${(b/(1024*1024)).toFixed(1)} MB`;

  return (
    <div className="space-y-3">
      <Field label="Document Type">
        <Select value={docType} onChange={e => onDocTypeChange(e.target.value)}>
          {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </Select>
      </Field>
      <div onDragOver={e => e.preventDefault()} onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer
          ${file ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'}`}>
        <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
          onChange={e => e.target.files[0] && onFileChange(e.target.files[0])} />
        {file ? (
          <div className="flex items-center gap-3 px-4 py-3">
            <span className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
              <FiFile size={16} className="text-indigo-500" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{file.name}</p>
              <p className="text-xs text-slate-400">{formatSize(file.size)}</p>
            </div>
            <button type="button" onClick={e => { e.stopPropagation(); onFileChange(null); }}
              className="w-6 h-6 rounded-full bg-slate-200 hover:bg-red-100 hover:text-red-500
                flex items-center justify-center text-slate-500 transition-colors shrink-0">
              <FiX size={11} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-6">
            <span className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
              <FiUpload size={18} className="text-slate-400" />
            </span>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-600">Drop a file or <span className="text-indigo-500">browse</span></p>
              <p className="text-xs text-slate-400 mt-0.5">PDF, JPG, PNG — max 20MB</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Category-specific field panels ────────────────────────────────────────────
const ITInfraFields = ({ form, set }) => (
  <div className="grid grid-cols-2 gap-3">
    <Field label="Manufacturer"><Input value={form.manufacturer||''} onChange={e=>set('manufacturer',e.target.value)} placeholder="e.g. Cisco"/></Field>
    <Field label="Model"><Input value={form.model||''} onChange={e=>set('model',e.target.value)} placeholder="e.g. Catalyst 9300"/></Field>
    <Field label="Serial Number" className="col-span-2"><Input value={form.serial_number||''} onChange={e=>set('serial_number',e.target.value)} placeholder="e.g. SN-XXXXX"/></Field>
    <Field label="IP Address"><Input value={form.ip_address||''} onChange={e=>set('ip_address',e.target.value)} placeholder="192.168.1.1"/></Field>
    <Field label="MAC Address"><Input value={form.mac_address||''} onChange={e=>set('mac_address',e.target.value)} placeholder="AA:BB:CC:DD:EE:FF"/></Field>
  </div>
);

const HumanFields = ({ form, set, departments, designations }) => {
  const filtered = form.department_id
    ? safeList(designations).filter(d => d.department_id === parseInt(form.department_id))
    : safeList(designations);
  return (
    <div className="grid grid-cols-2 gap-3">
      <Field label="Department" required>
        <Select value={form.department_id||''} onChange={e=>{set('department_id',e.target.value);set('designation_id','');}}>
          <option value="">Select department...</option>
          {safeList(departments).map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
        </Select>
      </Field>
      <Field label="Designation" required>
        <Select value={form.designation_id||''} onChange={e=>set('designation_id',e.target.value)}>
          <option value="">Select designation...</option>
          {filtered.map(d=><option key={d.id} value={d.id}>{d.title}</option>)}
        </Select>
      </Field>
    </div>
  );
};

const ServiceFields = ({ form, set }) => (
  <div className="grid grid-cols-2 gap-3">
    <Field label="Provider Name"><Input value={form.provider_name||''} onChange={e=>set('provider_name',e.target.value)} placeholder="e.g. AWS"/></Field>
    <Field label="Contact Person"><Input value={form.contact_person||''} onChange={e=>set('contact_person',e.target.value)} placeholder="Full name"/></Field>
    <Field label="SLA Document Ref" className="col-span-2"><Input value={form.sla_document_ref||''} onChange={e=>set('sla_document_ref',e.target.value)} placeholder="e.g. SLA-2024-001"/></Field>
    <Field label="Expiry Date" className="col-span-2"><Input type="date" value={form.expiry_date||''} onChange={e=>set('expiry_date',e.target.value)}/></Field>
  </div>
);

const DigitalFields = ({ form, set }) => (
  <div className="grid grid-cols-2 gap-3">
    <Field label="Version Number"><Input value={form.version_number||''} onChange={e=>set('version_number',e.target.value)} placeholder="e.g. 3.1.2"/></Field>
    <Field label="Encryption Algorithm"><Input value={form.encryption_algorithm||''} onChange={e=>set('encryption_algorithm',e.target.value)} placeholder="e.g. AES-256"/></Field>
    <Field label="License Key" className="col-span-2"><Input value={form.license_key||''} onChange={e=>set('license_key',e.target.value)} placeholder="XXXX-XXXX-XXXX-XXXX"/></Field>
    <Field label="Digital Storage Path" className="col-span-2"><Input value={form.digital_storage_path||''} onChange={e=>set('digital_storage_path',e.target.value)} placeholder="/storage/path or s3://..."/></Field>
  </div>
);

const TangibleInfoFields = ({ form, set }) => (
  <div className="grid grid-cols-2 gap-3">
    <Field label="Document Type"><Input value={form.document_type||''} onChange={e=>set('document_type',e.target.value)} placeholder="e.g. Contract, Policy"/></Field>
    <Field label="Retention Period (days)"><Input type="number" value={form.retention_period_days||''} onChange={e=>set('retention_period_days',e.target.value)} placeholder="e.g. 365"/></Field>
    <Field label="Storage / Safe Location" className="col-span-2"><Input value={form.storage_safes_location||''} onChange={e=>set('storage_safes_location',e.target.value)} placeholder="e.g. Safe Room B, Cabinet 3"/></Field>
  </div>
);

const EndUserFields = ({ form, set }) => (
  <div className="grid grid-cols-2 gap-3">
    <Field label="Condition">
      <Select value={form.condition||''} onChange={e=>set('condition',e.target.value)}>
        <option value="">Select condition...</option>
        {CONDITIONS.map(c=><option key={c} value={c}>{c}</option>)}
      </Select>
    </Field>
    <Field label="Brand"><Input value={form.brand||''} onChange={e=>set('brand',e.target.value)} placeholder="e.g. Dell"/></Field>
    <Field label="Model"><Input value={form.model||''} onChange={e=>set('model',e.target.value)} placeholder="e.g. Latitude 5520"/></Field>
    <Field label="Serial Number" className="col-span-2"><Input value={form.serial_number||''} onChange={e=>set('serial_number',e.target.value)} placeholder="e.g. SN-XXXXX"/></Field>
    <Field label="Date of Purchase" className="col-span-2"><Input type="date" value={form.date_of_purchase||''} onChange={e=>set('date_of_purchase',e.target.value)}/></Field>
  </div>
);

const FacilityFields = ({ form, set }) => (
  <div className="grid grid-cols-2 gap-3">
    <Field label="Facility Type">
      <Select value={form.facility_type||''} onChange={e=>set('facility_type',e.target.value)}>
        <option value="">Select type...</option>
        {FACILITY_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
      </Select>
    </Field>
    <Field label="Capacity"><Input type="number" value={form.capacity||''} onChange={e=>set('capacity',e.target.value)} placeholder="e.g. 20"/></Field>
    <Field label="Building Name"><Input value={form.building_name||''} onChange={e=>set('building_name',e.target.value)} placeholder="e.g. HQ Tower A"/></Field>
    <Field label="Floor Level"><Input value={form.floor_level||''} onChange={e=>set('floor_level',e.target.value)} placeholder="e.g. 3rd Floor"/></Field>
  </div>
);

const CATEGORY_FIELDS = {
  'IT Infrastructure':    ITInfraFields,
  'Human':                HumanFields,
  'Service':              ServiceFields,
  'Digital':              DigitalFields,
  'Tangible Information': TangibleInfoFields,
  'End User':             EndUserFields,
  'Facility':             FacilityFields,
};

// ── CIA config ────────────────────────────────────────────────────────────────
const CIA_RESULT = {
  3: { classification: 'High',   color: '#ef4444', bg: '#fee2e2', text: '#991b1b', Icon: FiAlertCircle },
  2: { classification: 'Medium', color: '#f59e0b', bg: '#fef3c7', text: '#92400e', Icon: FiShield      },
  1: { classification: 'Low',    color: '#22c55e', bg: '#dcfce7', text: '#166534', Icon: FiCheckCircle },
};

const CIA_DIMS = [
  { field: 'cia_confidentiality', label: 'Confidentiality', Icon: FiLock,
    descriptions: { 1: 'Publicly available information', 2: 'Internal info shared across org', 3: 'Restricted; cannot share externally without approval' } },
  { field: 'cia_integrity', label: 'Integrity', Icon: FiCheckCircle,
    descriptions: { 1: 'Not critical if inaccurate', 2: 'Inaccuracy has medium business impact', 3: 'Business functions depend on accuracy' } },
  { field: 'cia_availability', label: 'Availability', Icon: FiZap,
    descriptions: { 1: 'Downtime acceptable > 1 day', 2: 'Downtime acceptable up to a few hours', 3: 'Must be available at all times; zero downtime' } },
];

const CIA_LEVELS = [
  { v: 1, label: '1 – Low',  bg: '#dcfce7', border: '#86efac', text: '#166534' },
  { v: 2, label: '2 – Med',  bg: '#fef9c3', border: '#fde047', text: '#713f12' },
  { v: 3, label: '3 – High', bg: '#fee2e2', border: '#fca5a5', text: '#991b1b' },
];

// ── Warranty Section ───────────────────────────────────────────────────────────
const WarrantySection = ({ form, set, warrantyFile, setWarrantyFile }) => {
  const fileRef = useRef(null);
  const formatSize = (b) => b < 1024*1024 ? `${(b/1024).toFixed(1)} KB` : `${(b/(1024*1024)).toFixed(1)} MB`;

  useEffect(() => {
    if (form.warranty_start_date && form.warranty_end_date) {
      const start  = new Date(form.warranty_start_date);
      const end    = new Date(form.warranty_end_date);
      const months = Math.round((end - start) / (1000*60*60*24*30));
      if (months > 0) set('warranty_period_months', months);
    }
  }, [form.warranty_start_date, form.warranty_end_date]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <Field label="Provider / Brand" required>
          <Input value={form.warranty_provider_name} onChange={e=>set('warranty_provider_name',e.target.value)} placeholder="e.g. Dell, Apple"/>
        </Field>
        <Field label="Start Date" required>
          <Input type="date" value={form.warranty_start_date} onChange={e=>set('warranty_start_date',e.target.value)}/>
        </Field>
        <Field label="End Date" required>
          <Input type="date" value={form.warranty_end_date} onChange={e=>set('warranty_end_date',e.target.value)}/>
        </Field>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Period (months)">
          <Input type="number" value={form.warranty_period_months} onChange={e=>set('warranty_period_months',e.target.value)} placeholder="Auto-calculated"/>
        </Field>
        <Field label="Coverage Details" className="col-span-2">
          <Input value={form.warranty_coverage_details} onChange={e=>set('warranty_coverage_details',e.target.value)} placeholder="e.g. Parts and labour, on-site support"/>
        </Field>
      </div>
      <div>
        <Label>Warranty Document <span className="normal-case text-slate-400 font-normal">(optional)</span></Label>
        <div onClick={() => fileRef.current?.click()} onDragOver={e=>e.preventDefault()}
          onDrop={e=>{e.preventDefault();e.dataTransfer.files[0]&&setWarrantyFile(e.dataTransfer.files[0]);}}
          className={`rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200
            ${warrantyFile ? 'border-amber-300 bg-amber-50' : 'border-slate-200 hover:border-amber-300 hover:bg-slate-50'}`}>
          <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
            onChange={e=>e.target.files[0]&&setWarrantyFile(e.target.files[0])}/>
          {warrantyFile ? (
            <div className="flex items-center gap-3 px-4 py-3">
              <span className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                <FiFile size={14} className="text-amber-500"/>
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{warrantyFile.name}</p>
                <p className="text-xs text-slate-400">{formatSize(warrantyFile.size)}</p>
              </div>
              <button type="button" onClick={e=>{e.stopPropagation();setWarrantyFile(null);}}
                className="w-6 h-6 rounded-full bg-slate-200 hover:bg-red-100 hover:text-red-500
                  flex items-center justify-center text-slate-500 transition-colors">
                <FiX size={11}/>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 px-4 py-3">
              <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                <FiUpload size={14} className="text-slate-400"/>
              </span>
              <div>
                <p className="text-sm text-slate-500">Drop warranty doc or <span className="text-amber-500 font-medium">browse</span></p>
                <p className="text-xs text-slate-400">PDF, JPG, PNG — max 20MB</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Locked Field Display (read-only badge) ────────────────────────────────────
const LockedField = ({ label, value, icon: Icon = FiLock }) => (
  <div>
    <Label>{label}</Label>
    <div className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm
      text-slate-500 flex items-center gap-2 select-none cursor-not-allowed">
      <FiLock size={11} className="text-slate-300 shrink-0"/>
      <span className="truncate">{value || <span className="italic text-slate-300">—</span>}</span>
    </div>
  </div>
);

// ── PIN Verification Modal ─────────────────────────────────────────────────────
const SECURITY_PIN = '12345678'; // 8-digit hardcoded PIN

const PinModal = ({ onSuccess, onClose, title = 'Sensitive Access', subtitle = 'Enter 8-digit security PIN' }) => {
  const [pin, setPin]     = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const inputRef          = useRef(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 80); }, []);

  const handleSubmit = () => {
    if (pin === SECURITY_PIN) {
      onSuccess();
    } else {
      setError('Incorrect PIN. Please try again.');
      setShake(true);
      setPin('');
      setTimeout(() => { setShake(false); inputRef.current?.focus(); }, 500);
    }
  };

  const digits = pin.split('').concat(Array(8 - pin.length).fill(''));

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <style>{`
        @keyframes pinShake {
          0%,100%{transform:translateX(0)}
          20%{transform:translateX(-8px)}
          40%{transform:translateX(8px)}
          60%{transform:translateX(-5px)}
          80%{transform:translateX(5px)}
        }
      `}</style>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5"
        style={{ animation: shake ? 'pinShake 0.4s ease' : 'none' }}>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
              <FiLock size={16} className="text-amber-500"/>
            </span>
            <div>
              <p className="text-sm font-bold text-slate-800">{title}</p>
              <p className="text-xs text-slate-400">{subtitle}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100">
            <FiX size={14}/>
          </button>
        </div>

        {/* Hidden real input — keyboard types into it */}
        <input
          ref={inputRef}
          type="password"
          inputMode="numeric"
          maxLength={8}
          value={pin}
          onChange={e => { setError(''); setPin(e.target.value.replace(/\D/g, '')); }}
          onKeyDown={e => e.key === 'Enter' && pin.length === 8 && handleSubmit()}
          className="sr-only"
        />

        {/* Dot display — click to focus input */}
        <div className="flex justify-center gap-2.5 cursor-text" onClick={() => inputRef.current?.focus()}>
          {digits.map((d, i) => (
            <div key={i}
              className={`w-9 h-10 rounded-lg border-2 flex items-center justify-center transition-all duration-100
                ${i === pin.length
                  ? 'border-amber-400 bg-amber-50 shadow-sm shadow-amber-100'
                  : d ? 'border-slate-300 bg-slate-50'
                  : 'border-slate-200 bg-white'}`}>
              {d ? <span className="w-2.5 h-2.5 rounded-full bg-slate-700 block"/> : null}
            </div>
          ))}
        </div>

        <p className="text-[10px] text-slate-400 text-center -mt-2">Click above then type digits · Enter to confirm</p>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200">
            <FiAlertCircle size={12} className="text-red-400 shrink-0"/>
            <p className="text-xs text-red-600 font-semibold">{error}</p>
          </div>
        )}

        <button type="button"
          disabled={pin.length !== 8}
          onClick={handleSubmit}
          className="w-full py-2.5 rounded-xl text-white text-sm font-bold transition-all
            disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: pin.length === 8 ? '#f59e0b' : '#d1d5db' }}>
          {pin.length === 8 ? '🔓 Unlock' : `${pin.length}/8 digits entered`}
        </button>
      </div>
    </div>
  );
};

// ── Main Modal ─────────────────────────────────────────────────────────────────
export default function AssetFormModal({
  onClose, onSubmit,
  departments = [], designations = [],
  loading = false, initial = null,
}) {
  const isEdit = !!initial;
  const dispatch = useDispatch();

  const { list: locations, subList: allSubLocations, loading: locLoading } = useSelector(s => s.locations);
  const { list: assetTypes, loading: typesLoading } = useSelector(s => s.assetTypes);
  const { list: users, loading: usersLoading } = useSelector(s => s.users);

  useEffect(() => {
    dispatch(fetchLocations());
    dispatch(fetchSubLocations());
    dispatch(fetchAllAssetTypes());
    dispatch(fetchUsers());
  }, [dispatch]);

  const [form, setForm] = useState({
    name: '', category: '',
    asset_type_id: null,
    description: '',
    asset_owner_user_id: null,
    asset_owner_designation_id: null,
    asset_custodian_user_id: null,
    asset_custodian_designation_id: null,
    status: 'Available',
    classification: 'Low',
    color_code: '',
    cia_confidentiality: 1, cia_integrity: 1, cia_availability: 1,
    financial_type: 'None', po_number: '', cost: '', currency: 'LKR',
    location_id: null, sub_location_id: null,
    remarks: '',
    support_document_type: 'Other',
    warranty_provider_name: '', warranty_period_months: '',
    warranty_start_date: '', warranty_end_date: '',
    warranty_coverage_details: '', warranty_document_type: 'Warranty',
    manufacturer: '', model: '', serial_number: '', ip_address: '', mac_address: '',
    designation_id: '', department_id: '', assigned_employee_id: '',
    provider_name: '', contact_person: '', sla_document_ref: '', expiry_date: '',
    version_number: '', license_key: '', digital_storage_path: '', encryption_algorithm: '',
    document_type: '', storage_safes_location: '', retention_period_days: '',
    device_type: '', brand: '', date_of_purchase: '', condition: '',
    facility_type: '', building_name: '', floor_level: '', capacity: '',
    ...initial,
  });

  const subLocations = safeList(allSubLocations).filter(
    sl => !form.location_id || sl.location_id === form.location_id
  );

  const [supportFile,  setSupportFile]  = useState(null);
  const [warrantyFile, setWarrantyFile] = useState(null);
  const [financialUnlocked, setFinancialUnlocked] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  useEffect(() => { set('sub_location_id', null); }, [form.location_id]);

  // ── Derived permission flags ───────────────────────────
  const cat = form.category;
  const showFinancial   = FINANCIAL_CATEGORIES.includes(cat);
  const showWarranty    = WARRANTY_CATEGORIES.includes(cat);
  const showSupportDoc  = SUPPORT_DOC_CATEGORIES.includes(cat);
  const showStatus      = STATUS_CATEGORIES.includes(cat);
  const showLocation    = LOCATION_CATEGORIES.includes(cat);

  // Build list of hidden sections for the banner
  const hiddenSections = [];
  if (cat && !showFinancial)  hiddenSections.push('Financial');
  if (cat && !showWarranty)   hiddenSections.push('Warranty');
  if (cat && !showSupportDoc) hiddenSections.push('Support Document');
  if (cat && !showStatus)     hiddenSections.push('Status');
  if (cat && !showLocation)   hiddenSections.push('Location');

  const meta           = cat ? CATEGORY_META[cat] : null;
  const SpecificFields = cat ? CATEGORY_FIELDS[cat] : null;
  const assetValue     = Math.max(form.cia_confidentiality, form.cia_integrity, form.cia_availability);
  const derived        = CIA_RESULT[assetValue];

  const handleCategoryChange = (e) => {
    set('category', e.target.value);
    set('asset_type_id', null);
  };

  const handleSubmit = () => {
    const payload = new FormData();
    Object.entries({
      ...form,
      asset_value:    assetValue,
      classification: derived.classification,
      color_code:     derived.color,
    }).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== '') payload.append(k, v);
    });
    if (supportFile)  payload.append('support_document',  supportFile);
    if (warrantyFile) payload.append('warranty_document', warrantyFile);
    onSubmit(payload);
  };

  const CIADimension = ({ dim }) => (
    <div className="space-y-1.5">
      <Label><span className="inline-flex items-center gap-1.5"><dim.Icon size={12}/> {dim.label}</span></Label>
      <div className="flex gap-1.5">
        {CIA_LEVELS.map(l => (
          <button key={l.v} type="button" onClick={() => set(dim.field, l.v)}
            className="flex-1 py-2 rounded-lg text-xs font-bold border-2 transition-all duration-150"
            style={{
              background:  form[dim.field] === l.v ? l.bg     : '#f8fafc',
              color:       form[dim.field] === l.v ? l.text   : '#94a3b8',
              borderColor: form[dim.field] === l.v ? l.border : '#e2e8f0',
            }}>
            {l.label}
          </button>
        ))}
      </div>
      <p className="text-[10px] text-slate-400 leading-tight min-h-[2em]">
        {dim.descriptions[form[dim.field]]}
      </p>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full flex flex-col" style={{ maxWidth: '960px', width: '95vw', maxHeight: '92vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            {meta && (
              <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: meta.color + '18', color: meta.color }}>
                <meta.icon size={18}/>
              </span>
            )}
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                {isEdit ? 'Edit Asset' : 'Add New Asset'}
              </h3>
              {meta && <p className="text-xs font-medium mt-0.5" style={{ color: meta.color }}>{meta.label}</p>}
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition">
            <FiX size={16}/>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5" style={{ scrollbarWidth: 'none' }}>

          {/* 1. Identity */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Identity</p>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Asset Name" required className="col-span-1">
                <Input required value={form.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. Dell Laptop XPS 15"/>
              </Field>
              {/* Category — locked in edit mode */}
              {isEdit ? (
                <LockedField label="Category" value={form.category}/>
              ) : (
                <Field label="Category" required>
                  <Select required value={form.category} onChange={handleCategoryChange}>
                    <option value="">Select...</option>
                    {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                  </Select>
                </Field>
              )}
              {/* Asset Type — locked in edit mode */}
              {isEdit ? (
                <LockedField label="Asset Type" value={
                  safeList(assetTypes).find(t => t.id === form.asset_type_id)?.name || form.asset_type_id || '—'
                }/>
              ) : (
                <Field label="Asset Type">
                  <AssetTypeSelect value={form.asset_type_id} onChange={id=>set('asset_type_id',id)}
                    category={form.category} assetTypes={assetTypes} loading={typesLoading}/>
                </Field>
              )}
            </div>
          </div>

          {/* Restriction banner — show after category is selected */}
          {cat && <RestrictedBanner category={cat} hiddenSections={hiddenSections}/>}

          {/* Edit mode — locked fields notice */}
          {isEdit && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                <FiLock size={10} className="text-slate-500"/>
              </span>
              <div>
                <p className="text-xs font-semibold text-slate-600">
                  Always locked: <span className="font-bold text-slate-700">Category, Asset Type, Status, CIA Rating, Support Document, Warranty</span>
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">Financial fields require an 8-digit PIN to unlock.</p>
              </div>
            </div>
          )}

          {/* 2. Category-specific */}
          {SpecificFields && (
            <>
              <SectionDivider title={`${meta.label} Details`} color={meta.color} Icon={meta.icon}/>
              <SpecificFields form={form} set={set} departments={departments} designations={designations}/>
            </>
          )}
          {!cat && (
            <div className="rounded-xl border-2 border-dashed border-slate-200 py-6 text-center flex flex-col items-center gap-2">
              <FiLayers size={24} className="text-slate-300"/>
              <p className="text-slate-400 text-sm">Select a category above to see additional fields</p>
            </div>
          )}

          {/* 3. Status + Location — hidden for Human */}
          {(showStatus || showLocation) && (
            <>
              <SectionDivider title="Status & Location" color="#64748b" Icon={FiMapPin}/>
              <div className={`grid gap-3 ${showStatus && showLocation ? 'grid-cols-3' : showStatus ? 'grid-cols-1' : 'grid-cols-2'}`}>
                {showStatus && (
                  /* Status — locked in edit mode (changed via workflow buttons only) */
                  isEdit ? (
                    <LockedField label="Status" value={form.status}/>
                  ) : (
                    <Field label="Status">
                      <Select value={form.status} onChange={e=>set('status',e.target.value)}>
                        {STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
                      </Select>
                    </Field>
                  )
                )}
                {showLocation && (
                  <>
                    <Field label="Location">
                      <LocationSelect value={form.location_id} onChange={id=>set('location_id',id)}
                        locations={locations} loading={locLoading}/>
                    </Field>
                    <Field label="Sub-Location">
                      <SubLocationSelect value={form.sub_location_id} onChange={id=>set('sub_location_id',id)}
                        subLocations={subLocations} loading={locLoading} disabled={!form.location_id}/>
                    </Field>
                  </>
                )}
              </div>
            </>
          )}

          {/* 4. CIA */}
          <SectionDivider title="CIA Security Rating" color="#6366f1" Icon={FiShield}/>
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            {/* Edit mode — CIA always locked, cannot change even with PIN */}
            {isEdit ? (
              <div className="p-4 bg-slate-50 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <FiLock size={12} className="text-slate-400"/>
                  <p className="text-xs text-slate-400">CIA rating is locked. Update via the CIA action on the asset detail page.</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {CIA_DIMS.map(dim => {
                    const val = form[dim.field] || 1;
                    const lvl = CIA_LEVELS.find(l => l.v === val) || CIA_LEVELS[0];
                    return (
                      <div key={dim.field} className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 bg-white cursor-not-allowed select-none"
                        style={{ borderColor: lvl.border }}>
                        <dim.Icon size={16} className="text-slate-400"/>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{dim.label}</p>
                        <span className="text-lg font-black" style={{ color: lvl.text }}>{val}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: lvl.bg, color: lvl.text }}>
                          {val === 1 ? 'Low' : val === 2 ? 'Medium' : 'High'}
                        </span>
                        <FiLock size={9} className="text-slate-300"/>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Create mode — CIA defaults to Low, locked at 1 */
              <div className="p-4 bg-slate-50 space-y-3">
                <div className="flex items-center gap-2">
                  <FiLock size={13} className="text-slate-400"/>
                  <p className="text-xs text-slate-400">
                    CIA levels default to <strong className="text-emerald-600">Low (1)</strong>. You can update them after creating the asset.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {CIA_DIMS.map(dim => (
                    <div key={dim.field} className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 bg-white" style={{ borderColor: '#86efac' }}>
                      <dim.Icon size={16} className="text-slate-400"/>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{dim.label}</p>
                      <span className="text-lg font-black text-emerald-600">1</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Low</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="px-4 py-3 flex items-center justify-between border-t border-slate-200" style={{ background: derived.bg }}>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: derived.text }}>Auto-computed Result</p>
                <p className="text-xs text-slate-500">Asset Value = MAX(C, I, A) = <strong style={{ color: derived.text }}>{assetValue}</strong></p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Asset Value</p>
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-full text-lg font-black border-2"
                    style={{ background: derived.bg, borderColor: derived.color, color: derived.text }}>{assetValue}</span>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Classification</p>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border-2"
                    style={{ background: derived.bg, borderColor: derived.color, color: derived.text }}>
                    <derived.Icon size={12}/> {derived.classification}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 5. Ownership */}
          <SectionDivider title="Ownership" color="#64748b" Icon={FiUsers}/>
          <OwnerSelector
            label="Asset Owner"
            userIdKey="asset_owner_user_id"
            designationIdKey="asset_owner_designation_id"
            form={form} set={set}
            users={users} designations={designations}
            usersLoading={usersLoading}
          />

          {/* 6. Financial — hidden for Human, Tangible Info, Facility */}
          {showFinancial && (
            <>
              <SectionDivider title="Financial" color="#64748b" Icon={FiDollarSign}/>

              {/* Edit mode: locked behind PIN */}
              {isEdit && !financialUnlocked ? (
                <div className="rounded-xl border-2 border-dashed border-slate-200 p-5 flex flex-col items-center gap-3 bg-slate-50">
                  <span className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                    <FiLock size={18} className="text-amber-500"/>
                  </span>
                  <div className="text-center">
                    <p className="text-sm font-bold text-slate-700">Financial Fields Locked</p>
                    <p className="text-xs text-slate-400 mt-1">Enter the 8-digit security PIN to edit cost, currency, PO number and financial type.</p>
                  </div>
                  {/* Read-only preview */}
                  <div className="w-full grid grid-cols-4 gap-2 mt-1">
                    {[
                      { label: 'Financial Type', value: form.financial_type },
                      { label: 'Cost',           value: form.cost || '—'   },
                      { label: 'Currency',       value: form.currency       },
                      { label: 'PO Number',      value: form.po_number || '—' },
                    ].map(f => (
                      <div key={f.label} className="bg-white rounded-lg border border-slate-200 px-3 py-2 text-center">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">{f.label}</p>
                        <p className="text-xs font-bold text-slate-600 truncate">{f.value}</p>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={() => setPinOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600
                      text-white text-xs font-bold transition mt-1">
                    <FiLock size={12}/> Unlock to Edit
                  </button>
                </div>
              ) : (
                /* Unlocked (create mode always, edit mode after PIN) */
                <div className={`space-y-0 ${isEdit && financialUnlocked ? 'rounded-xl border-2 border-amber-200 bg-amber-50/30 p-4' : ''}`}>
                  {isEdit && financialUnlocked && (
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center">
                        <FiCheckCircle size={11} className="text-amber-500"/>
                      </span>
                      <p className="text-xs font-bold text-amber-700">Financial fields unlocked — changes will be saved</p>
                    </div>
                  )}
                  <div className="grid grid-cols-4 gap-3">
                    <Field label="Financial Type">
                      <Select value={form.financial_type} onChange={e=>set('financial_type',e.target.value)}>
                        {FINANCIAL_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
                      </Select>
                    </Field>
                    <Field label="Cost">
                      <Input type="number" step="0.01" value={form.cost} onChange={e=>set('cost',e.target.value)} placeholder="0.00"/>
                    </Field>
                    <Field label="Currency">
                      <Input value={form.currency} onChange={e=>set('currency',e.target.value)} placeholder="LKR"/>
                    </Field>
                    <Field label="PO Number">
                      <Input value={form.po_number} onChange={e=>set('po_number',e.target.value)} placeholder="e.g. PO-2024-001"/>
                    </Field>
                  </div>
                </div>
              )}
            </>
          )}

          {/* 7. Support Document — hidden for Human AND hidden in edit mode */}
          {showSupportDoc && !isEdit && (
            <>
              <SectionDivider title="Support Document" color="#64748b" Icon={FiUpload}/>
              <SupportDocumentUpload
                file={supportFile} onFileChange={setSupportFile}
                docType={form.support_document_type}
                onDocTypeChange={v=>set('support_document_type',v)}
              />
            </>
          )}

          {/* 8. Warranty — only for applicable categories AND hidden in edit mode */}
          {showWarranty && !isEdit && (
            <>
              <SectionDivider title="Warranty" color="#f59e0b" Icon={FiShield}/>
              <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-4">
                <div className="flex items-start gap-2 mb-3">
                  <FiCheckCircle size={13} className="text-amber-500 mt-0.5 shrink-0"/>
                  <p className="text-xs text-amber-700">
                    Warranty is <strong>optional</strong>. Fill in provider and dates to register one with this asset.
                  </p>
                </div>
                <WarrantySection form={form} set={set} warrantyFile={warrantyFile} setWarrantyFile={setWarrantyFile}/>
              </div>
            </>
          )}

          {/* 9. Notes */}
          <SectionDivider title="Notes" color="#64748b" Icon={FiAlignLeft}/>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Description">
              <textarea rows={2} value={form.description} onChange={e=>set('description',e.target.value)}
                placeholder="Optional description..." className={`${inputBase} resize-none`}/>
            </Field>
            <Field label="Remarks">
              <textarea rows={2} value={form.remarks} onChange={e=>set('remarks',e.target.value)}
                placeholder="Internal remarks..." className={`${inputBase} resize-none`}/>
            </Field>
          </div>

        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 shrink-0">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">
            Cancel
          </button>
          <button type="button" disabled={loading} onClick={handleSubmit}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition disabled:opacity-50"
            style={{ background: meta?.color || '#6366f1' }}>
            {loading ? (isEdit ? 'Saving...' : 'Creating...') : (isEdit ? 'Save Changes' : 'Create Asset')}
          </button>
        </div>

      </div>

      {/* PIN Modal — rendered outside inner div so it overlays correctly */}
      {pinOpen && (
        <PinModal
          onSuccess={() => { setFinancialUnlocked(true); setPinOpen(false); }}
          onClose={() => setPinOpen(false)}
        />
      )}

    </div>
  );
}

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import MainLayout from '../components/layout/MainLayout';
import Pagination from '../components/common/Pagination';
import usePagination from '../hooks/usePagination';
import {
  fetchDepartments, createDepartment, clearDeptMessages
} from '../features/departments/departmentSlice';
import {
  fetchDesignations, createDesignation, clearDesigMessages
} from '../features/designations/designationSlice';

// ─── Toast ────────────────────────────────────────────────
const Toast = ({ message, type }) => (
  <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
    ${type === 'success' ? 'bg-brand-green text-brand-cream-light' : 'bg-red-600 text-white'}`}>
    {type === 'success' ? '✅' : '❌'} {message}
  </div>
);

// ─── Modal Wrapper ────────────────────────────────────────
const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-brand-dark">{title}</h3>
        <button onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-brand-dark/30 hover:bg-brand-cream/40 transition">
          ✕
        </button>
      </div>
      {children}
    </div>
  </div>
);

// ─── Shared Helpers ───────────────────────────────────────
const ciaLabel = (val) => {
  if (val === 3) return 'High';
  if (val === 2) return 'Medium';
  return 'Low';
};

const ciaColor = (val) => {
  if (val === 3) return 'bg-red-100 text-red-700 ring-1 ring-red-200';
  if (val === 2) return 'bg-amber-100 text-amber-700 ring-1 ring-amber-200';
  return 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200';
};

const classColors = {
  High:   'bg-red-100 text-red-700 ring-1 ring-red-200',
  Medium: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200',
  Low:    'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
};

const inputCls = `w-full px-4 py-2.5 rounded-lg border border-brand-cream bg-brand-offwhite text-sm
  text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-green focus:bg-white transition-all
  placeholder:text-brand-dark/30`;

// ─── Department View Modal ────────────────────────────────
const DepartmentViewModal = ({ dept, onClose }) => {
  if (!dept) return null;
  const InfoRow = ({ label, value }) => (
    <div className="bg-brand-cream/20 rounded-xl p-4 border border-brand-cream/60">
      <p className="text-xs font-semibold text-brand-dark/40 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm font-bold text-brand-dark">{value}</p>
    </div>
  );
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="bg-brand-green-dark px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                <span className="text-brand-cream-light font-bold text-xl">{dept.name?.[0]?.toUpperCase()}</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-brand-cream-light">{dept.name}</h2>
                <p className="text-brand-cream/50 text-sm mt-0.5">Department Details</p>
              </div>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-brand-cream-light transition">
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <InfoRow label="ID"         value={<span className="font-mono">#{dept.id}</span>} />
            <InfoRow label="Created At" value={dept.created_at ? new Date(dept.created_at).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' }) : '—'} />
          </div>
          <InfoRow label="Last Updated" value={dept.updated_at ? new Date(dept.updated_at).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }) : '—'} />
          <InfoRow label="Head of Department" value={dept.head_of_department ? `User #${dept.head_of_department}` : <span className="text-brand-dark/30 italic font-normal">Not assigned</span>} />
          <div className="bg-brand-cream/20 rounded-xl p-4 border border-brand-cream/60">
            <p className="text-xs font-semibold text-brand-dark/40 uppercase tracking-wider mb-2">Description</p>
            <p className="text-sm text-brand-dark/70 leading-relaxed">
              {dept.description || <span className="text-brand-dark/30 italic">No description provided.</span>}
            </p>
          </div>
        </div>

        <div className="px-6 pb-6 pt-2">
          <button onClick={onClose}
            className="w-full py-2.5 bg-brand-cream/60 hover:bg-brand-cream text-brand-dark rounded-xl text-sm font-semibold transition">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Designation View Modal ───────────────────────────────
const DesignationViewModal = ({ desig, departments = [], onClose }) => {
  if (!desig) return null;

  const getDeptName = (id) => {
    const dept = departments.find(d => d.id === parseInt(id));
    return dept?.name || `Department #${id}`;
  };

  const ciaStyle = (val) => {
    if (val === 3) return { card: 'bg-red-50 border-red-100',       text: 'text-red-700'     };
    if (val === 2) return { card: 'bg-amber-50 border-amber-100',   text: 'text-amber-700'   };
    return              { card: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-700' };
  };

  const ciaFields = [
    { label: 'Confidentiality', val: desig.default_cia_confidentiality },
    { label: 'Integrity',       val: desig.default_cia_integrity       },
    { label: 'Availability',    val: desig.default_cia_availability    },
  ];

  const InfoRow = ({ label, children }) => (
    <div className="bg-brand-cream/20 rounded-xl p-4 border border-brand-cream/60">
      <p className="text-xs font-semibold text-brand-dark/40 uppercase tracking-wider mb-1">{label}</p>
      {children}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="bg-brand-green-dark px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-brand-cream-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-brand-cream-light">{desig.title}</h2>
                <p className="text-brand-cream/50 text-sm mt-0.5">{desig.department || getDeptName(desig.department_id)}</p>
              </div>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-brand-cream-light transition">
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <InfoRow label="ID"><p className="text-sm font-bold text-brand-dark font-mono">#{desig.id}</p></InfoRow>
            <InfoRow label="Created At"><p className="text-sm font-bold text-brand-dark">{desig.created_at ? new Date(desig.created_at).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' }) : '—'}</p></InfoRow>
          </div>

          <InfoRow label="Department">
            <p className="text-sm font-bold text-brand-dark">
              {desig.department || getDeptName(desig.department_id)}
              <span className="ml-2 text-xs text-brand-dark/30 font-normal font-mono">(id: {desig.department_id})</span>
            </p>
          </InfoRow>

          <div className="grid grid-cols-2 gap-3">
            <InfoRow label="Classification">
              <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold ${classColors[desig.default_classification] || 'bg-brand-cream/60 text-brand-dark/50'}`}>
                {desig.default_classification || '—'}
              </span>
            </InfoRow>
            <InfoRow label="Color Code">
              {desig.default_color_code ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded border border-brand-cream shrink-0" style={{ background: desig.default_color_code }} />
                  <span className="text-sm font-mono text-brand-dark">{desig.default_color_code}</span>
                </div>
              ) : <span className="text-sm text-brand-dark/30 italic">Not set</span>}
            </InfoRow>
          </div>

          <InfoRow label="Default Asset Value">
            <p className="text-sm font-bold text-brand-dark">
              {desig.default_asset_value != null ? desig.default_asset_value : <span className="text-brand-dark/30 italic font-normal">Not set</span>}
            </p>
          </InfoRow>

          <div className="bg-brand-cream/20 rounded-xl p-4 border border-brand-cream/60">
            <p className="text-xs font-semibold text-brand-dark/40 uppercase tracking-wider mb-3">CIA Scores</p>
            <div className="grid grid-cols-3 gap-3">
              {ciaFields.map(({ label, val }) => {
                const s = ciaStyle(val);
                return (
                  <div key={label} className={`rounded-xl p-3 text-center border ${s.card}`}>
                    <p className={`text-xl font-black ${s.text}`}>{ciaLabel(val)}</p>
                    <p className={`text-xs font-semibold mt-1 ${s.text}`}>{label}</p>
                    <p className={`text-xs mt-0.5 opacity-60 ${s.text}`}>{val}/3</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 pt-2">
          <button onClick={onClose}
            className="w-full py-2.5 bg-brand-cream/60 hover:bg-brand-cream text-brand-dark rounded-xl text-sm font-semibold transition">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Departments Tab ──────────────────────────────────────
function DepartmentsTab() {
  const dispatch = useDispatch();
  const { list, loading, error, success } = useSelector(state => state.departments);

  const [showModal, setShowModal] = useState(false);
  const [viewDept,  setViewDept]  = useState(null);
  const [form,      setForm]      = useState({ name: '', description: '' });
  const [search,    setSearch]    = useState('');

  const filtered = list.filter(d => d.name?.toLowerCase().includes(search.toLowerCase()));
  const { paginated, currentPage, totalPages, setCurrentPage, reset, startIndex, endIndex, totalItems } = usePagination(filtered);

  useEffect(() => { dispatch(fetchDepartments()); }, []);
  useEffect(() => { reset(); }, [search]);
  useEffect(() => {
    if (success || error) {
      const t = setTimeout(() => dispatch(clearDeptMessages()), 3000);
      return () => clearTimeout(t);
    }
  }, [success, error]);

  const handleCreate = async (e) => {
    e.preventDefault();
    await dispatch(createDepartment(form));
    dispatch(fetchDepartments());
    setShowModal(false);
    setForm({ name: '', description: '' });
  };

  return (
    <>
      {(success || error) && <Toast message={success || error} type={success ? 'success' : 'error'} />}

      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <input placeholder="Search departments..." value={search} onChange={e => setSearch(e.target.value)}
            className="px-4 py-2 rounded-lg border border-brand-cream bg-white text-sm w-64
              focus:outline-none focus:ring-2 focus:ring-brand-green placeholder:text-brand-dark/30
              text-brand-dark transition-colors duration-150" />
          {search && <span className="text-xs text-brand-dark/40">{totalItems} result{totalItems !== 1 ? 's' : ''}</span>}
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-green hover:bg-brand-green-dark
            text-brand-cream-light text-sm font-semibold rounded-lg transition-colors duration-150 shadow-sm">
          <span className="text-lg leading-none">+</span> Add Department
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-brand-cream/60 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-brand-cream/30 border-b border-brand-cream/60">
              {['#', 'Department Name', 'Description', 'Action'].map(h => (
                <th key={h} className="px-6 py-3.5 text-left text-xs font-semibold text-brand-dark/40 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-cream/30">
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-sm text-brand-dark/40">
                <svg className="animate-spin w-5 h-5 mx-auto mb-2 text-brand-green" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>Loading...
              </td></tr>
            ) : paginated.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-sm text-brand-dark/40">No departments found.</td></tr>
            ) : paginated.map((dept, i) => (
              <tr key={dept.id} className="hover:bg-brand-cream/20 transition-colors">
                <td className="px-6 py-4 text-xs text-brand-dark/30 font-mono">{startIndex + i}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-green/10 flex items-center justify-center shrink-0">
                      <span className="text-brand-green font-bold text-xs">{dept.name?.[0]?.toUpperCase()}</span>
                    </div>
                    <span className="text-sm font-semibold text-brand-dark">{dept.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-brand-dark/50 max-w-xs truncate">
                  {dept.description || <span className="text-brand-dark/20">—</span>}
                </td>
                <td className="px-6 py-4">
                  <button onClick={() => setViewDept(dept)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold
                      text-brand-green bg-brand-green/10 hover:bg-brand-green/20 rounded-lg transition-colors duration-150">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      {totalItems > 0 && <p className="text-xs text-brand-dark/40 mt-3 px-1">Showing {startIndex}–{endIndex} of {totalItems} departments</p>}

      {viewDept && <DepartmentViewModal dept={viewDept} onClose={() => setViewDept(null)} />}

      {showModal && (
        <Modal title="Add Department" onClose={() => setShowModal(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-brand-dark/70 mb-1.5">Department Name *</label>
              <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Information Technology" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-dark/70 mb-1.5">Description</label>
              <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Optional description..." className={`${inputCls} resize-none`} />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 border border-brand-cream rounded-lg text-sm font-semibold text-brand-dark/60 hover:bg-brand-cream/30 transition">
                Cancel
              </button>
              <button type="submit"
                className="flex-1 py-2.5 bg-brand-green hover:bg-brand-green-dark text-brand-cream-light rounded-lg text-sm font-semibold transition">
                Create
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

// ─── Designations Tab ─────────────────────────────────────
function DesignationsTab() {
  const dispatch = useDispatch();
  const { list: designations, loading, error, success } = useSelector(state => state.designations);
  const { list: departments } = useSelector(state => state.departments);

  const [showModal, setShowModal] = useState(false);
  const [viewDesig, setViewDesig] = useState(null);
  const [search,    setSearch]    = useState('');
  const [form, setForm] = useState({
    title: '', department_id: '',
    default_cia_confidentiality: 1,
    default_cia_integrity: 1,
    default_cia_availability: 1,
    default_classification: 'Low',
  });

  const getDeptName = (id) => {
    const dept = departments.find(d => d.id === parseInt(id));
    return dept?.name || '—';
  };

  const filtered = designations.filter(d =>
    d.title?.toLowerCase().includes(search.toLowerCase()) ||
    getDeptName(d.department_id)?.toLowerCase().includes(search.toLowerCase())
  );

  const { paginated, currentPage, totalPages, setCurrentPage, reset, startIndex, endIndex, totalItems } = usePagination(filtered);

  useEffect(() => { dispatch(fetchDesignations()); dispatch(fetchDepartments()); }, []);
  useEffect(() => { reset(); }, [search]);
  useEffect(() => {
    if (success || error) {
      const t = setTimeout(() => dispatch(clearDesigMessages()), 3000);
      return () => clearTimeout(t);
    }
  }, [success, error]);

  const handleCreate = async (e) => {
    e.preventDefault();
    await dispatch(createDesignation(form));
    dispatch(fetchDesignations());
    setShowModal(false);
    setForm({ title: '', department_id: '', default_cia_confidentiality: 1, default_cia_integrity: 1, default_cia_availability: 1, default_classification: 'Low' });
  };

  const handleCIAChange = (key, value) => {
    const updated = { ...form, [key]: parseInt(value) };
    const vals = [updated.default_cia_confidentiality, updated.default_cia_integrity, updated.default_cia_availability];
    let classification = 'Low';
    if (vals.some(v => v === 3)) classification = 'High';
    else if (vals.some(v => v === 2)) classification = 'Medium';
    setForm({ ...updated, default_classification: classification });
  };

  return (
    <>
      {(success || error) && <Toast message={success || error} type={success ? 'success' : 'error'} />}

      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <input placeholder="Search designations..." value={search} onChange={e => setSearch(e.target.value)}
            className="px-4 py-2 rounded-lg border border-brand-cream bg-white text-sm w-64
              focus:outline-none focus:ring-2 focus:ring-brand-green placeholder:text-brand-dark/30
              text-brand-dark transition-colors duration-150" />
          {search && <span className="text-xs text-brand-dark/40">{totalItems} result{totalItems !== 1 ? 's' : ''}</span>}
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-green hover:bg-brand-green-dark
            text-brand-cream-light text-sm font-semibold rounded-lg transition-colors duration-150 shadow-sm">
          <span className="text-lg leading-none">+</span> Add Designation
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-brand-cream/60 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-brand-cream/30 border-b border-brand-cream/60">
              {['Title', 'Department', 'Confidentiality', 'Integrity', 'Availability', 'Classification', 'Action'].map(h => (
                <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-brand-dark/40 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-cream/30">
            {loading ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-sm text-brand-dark/40">
                <svg className="animate-spin w-5 h-5 mx-auto mb-2 text-brand-green" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>Loading...
              </td></tr>
            ) : paginated.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-sm text-brand-dark/40">No designations found.</td></tr>
            ) : paginated.map(desig => (
              <tr key={desig.id} className="hover:bg-brand-cream/20 transition-colors">
                <td className="px-5 py-4 text-sm font-semibold text-brand-dark">{desig.title}</td>
                <td className="px-5 py-4">
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-brand-green/10 text-brand-green">
                    {desig.department || getDeptName(desig.department_id)}
                  </span>
                </td>
                {[desig.default_cia_confidentiality, desig.default_cia_integrity, desig.default_cia_availability].map((val, i) => (
                  <td key={i} className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${ciaColor(val)}`}>
                      {ciaLabel(val)}
                    </span>
                  </td>
                ))}
                <td className="px-5 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${classColors[desig.default_classification] || 'bg-brand-cream/60 text-brand-dark/50'}`}>
                    {desig.default_classification || '—'}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <button onClick={() => setViewDesig(desig)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold
                      text-brand-green bg-brand-green/10 hover:bg-brand-green/20 rounded-lg transition-colors duration-150">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      {totalItems > 0 && <p className="text-xs text-brand-dark/40 mt-3 px-1">Showing {startIndex}–{endIndex} of {totalItems} designations</p>}

      {viewDesig && <DesignationViewModal desig={viewDesig} departments={departments} onClose={() => setViewDesig(null)} />}

      {showModal && (
        <Modal title="Add Designation" onClose={() => setShowModal(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-brand-dark/70 mb-1.5">Title *</label>
              <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Software Engineer" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-dark/70 mb-1.5">Department *</label>
              <select required value={form.department_id} onChange={e => setForm({ ...form, department_id: e.target.value })}
                className={`${inputCls} appearance-none`}>
                <option value="">Select department...</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                ['default_cia_confidentiality', 'Confidentiality'],
                ['default_cia_integrity',       'Integrity'],
                ['default_cia_availability',    'Availability'],
              ].map(([key, label]) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-brand-dark/60 mb-1.5">{label}</label>
                  <select value={form[key]} onChange={e => handleCIAChange(key, e.target.value)}
                    className={`${inputCls} appearance-none`}>
                    <option value={1}>Low</option>
                    <option value={2}>Medium</option>
                    <option value={3}>High</option>
                  </select>
                </div>
              ))}
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-dark/70 mb-1.5">
                Classification <span className="ml-2 text-xs font-normal text-brand-dark/30">(auto calculated)</span>
              </label>
              <div className={`w-full px-4 py-2.5 rounded-lg border text-sm font-semibold
                ${form.default_classification === 'High'   ? 'bg-red-100 text-red-700 border-red-200'
                : form.default_classification === 'Medium' ? 'bg-amber-100 text-amber-700 border-amber-200'
                :                                            'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
                {form.default_classification}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 border border-brand-cream rounded-lg text-sm font-semibold text-brand-dark/60 hover:bg-brand-cream/30 transition">
                Cancel
              </button>
              <button type="submit"
                className="flex-1 py-2.5 bg-brand-green hover:bg-brand-green-dark text-brand-cream-light rounded-lg text-sm font-semibold transition">
                Create
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────
export default function Departments() {
  const [activeTab, setActiveTab] = useState('departments');

  const deptCount  = useSelector(s => s.departments.list.length);
  const desigCount = useSelector(s => s.designations.list.length);

  const tabs = [
    { id: 'departments',  label: 'Departments',  count: deptCount  },
    { id: 'designations', label: 'Designations', count: desigCount },
  ];

  return (
    <MainLayout title="Departments & Designations" subtitle="Manage your organizational structure">
      <div className="flex items-center gap-1 bg-brand-cream/40 p-1 rounded-xl w-fit mb-6">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-150
              ${activeTab === tab.id
                ? 'bg-white text-brand-dark shadow-sm'
                : 'text-brand-dark/50 hover:text-brand-dark'}`}>
            {tab.label}
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold
              ${activeTab === tab.id ? 'bg-brand-green/10 text-brand-green' : 'bg-brand-cream/60 text-brand-dark/40'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {activeTab === 'departments'  && <DepartmentsTab />}
      {activeTab === 'designations' && <DesignationsTab />}
    </MainLayout>
  );
}

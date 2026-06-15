import { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAssignmentById,
  clearCurrentAssignment,
  uploadAssignDoc,
  uploadGatePassDoc,
  clearAssignDocMessages,
  clearGatePassDocMessages,
} from '../../features/assignments/assignmentSlice';
import MainLayout from '../../components/layout/MainLayout';
import {
  FiArrowLeft, FiCalendar, FiPackage,
  FiMail, FiMapPin, FiDollarSign, FiUpload,
  FiFileText, FiExternalLink, FiCheckCircle, FiAlertCircle,
} from 'react-icons/fi';
import {
  TbTransfer, TbArrowBackUp, TbClockExclamation,
  TbCircleCheck, TbCircleDot, TbUserCheck, TbServer,
  TbTool, TbShieldLock, TbFileText, TbDeviceDesktop,
  TbDoor, TbLock, TbBolt, TbShieldCheck, TbBuilding,
  TbBriefcase, TbUser, TbId, TbFileUpload, TbFileCertificate,
  TbNotes, TbFolderOpen,
} from 'react-icons/tb';
import { HiOutlineCube } from 'react-icons/hi';
import { MdOutlineAssignment } from 'react-icons/md';

// ── Maps ──────────────────────────────────────────────────
const CATEGORY_ICONS = {
  'Human':               TbUserCheck,
  'IT Infrastructure':   TbServer,
  'Service':             TbTool,
  'Digital':             TbShieldLock,
  'Tangible Information':TbFileText,
  'End User':            TbDeviceDesktop,
  'Facility':            TbDoor,
};
const CATEGORY_COLORS = {
  'Human':               'bg-indigo-100 text-indigo-600',
  'IT Infrastructure':   'bg-sky-100 text-sky-600',
  'Service':             'bg-amber-100 text-amber-600',
  'Digital':             'bg-purple-100 text-purple-600',
  'Tangible Information':'bg-emerald-100 text-emerald-600',
  'End User':            'bg-red-100 text-red-600',
  'Facility':            'bg-orange-100 text-orange-600',
};
const STATUS_STYLES = {
  Assigned: { bg: 'bg-blue-100',    text: 'text-blue-700',    ring: 'ring-blue-200',    icon: TbCircleDot        },
  Returned: { bg: 'bg-emerald-100', text: 'text-emerald-700', ring: 'ring-emerald-200', icon: TbCircleCheck      },
  Overdue:  { bg: 'bg-red-100',     text: 'text-red-700',     ring: 'ring-red-200',     icon: TbClockExclamation },
};
const CIA_COLORS = {
  1: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', label: 'Low'    },
  2: { bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-700',   label: 'Medium' },
  3: { bg: 'bg-red-50',     border: 'border-red-200',     text: 'text-red-700',     label: 'High'   },
};
const CONDITION_COLORS = {
  New:     'bg-emerald-100 text-emerald-700',
  Good:    'bg-blue-100 text-blue-700',
  Fair:    'bg-amber-100 text-amber-700',
  Poor:    'bg-orange-100 text-orange-700',
  Damaged: 'bg-red-100 text-red-700',
};

// ── Helpers ───────────────────────────────────────────────
const fmt = (d) => d
  ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  : '—';

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

const CIACard = ({ label, value, icon: Icon }) => {
  const lc = CIA_COLORS[value] || CIA_COLORS[1];
  return (
    <div className={`flex flex-col items-center py-3 rounded-xl border ${lc.bg} ${lc.border}`}>
      <Icon size={13} className={`${lc.text} mb-1`} />
      <span className={`text-2xl font-black ${lc.text}`}>{value}</span>
      <span className="text-[10px] text-slate-400 mt-0.5">{label}</span>
      <span className={`text-[9px] font-bold ${lc.text}`}>{lc.label}</span>
    </div>
  );
};

// ── Document Card ─────────────────────────────────────────
// Shows a doc with open button, or an upload prompt if missing.
function DocumentCard({
  title,
  icon: Icon,
  doc,               // { name, file_path, uploaded_at, uploaded_by } | null
  canUpload,         // show upload button only for assign doc when Assigned/Overdue
  uploading,
  uploadSuccess,
  uploadError,
  onUpload,          // (file) => void
  onOpen,            // (doc) => void
  accentColor = 'blue',
}) {
  const fileRef = useRef(null);

  const accent = {
    blue:   { card: 'border-blue-100 bg-blue-50/40',     icon: 'bg-blue-100 text-blue-600',     btn: 'bg-blue-600 hover:bg-blue-700',     tag: 'bg-blue-100 text-blue-700'     },
    violet: { card: 'border-violet-100 bg-violet-50/40', icon: 'bg-violet-100 text-violet-600', btn: 'bg-violet-600 hover:bg-violet-700', tag: 'bg-violet-100 text-violet-700' },
    amber:  { card: 'border-amber-100 bg-amber-50/40',   icon: 'bg-amber-100 text-amber-600',   btn: 'bg-amber-500 hover:bg-amber-600',   tag: 'bg-amber-100 text-amber-700'   },
  }[accentColor] || {};

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
    e.target.value = '';
  };

  return (
    <div className={`rounded-2xl border p-5 ${accent.card}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${accent.icon}`}>
          <Icon size={16} />
        </div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{title}</p>

        {doc && (
          <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${accent.tag}`}>
            Uploaded
          </span>
        )}
      </div>

      {/* ── Doc exists ── */}
      {doc ? (
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-100">
            <FiFileText size={16} className="text-slate-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{doc.name || doc.document_name}</p>
              {doc.uploaded_at && (
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Uploaded {fmt(doc.uploaded_at)}
                  {doc.uploaded_by && <> · by {doc.uploaded_by}</>}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onOpen(doc)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5
                text-white text-sm font-semibold rounded-xl transition ${accent.btn}`}>
              <FiExternalLink size={14} /> View Document
            </button>

            {/* Allow re-upload */}
            {canUpload && (
              <>
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="px-3 py-2.5 rounded-xl border-2 border-slate-200
                    text-slate-500 hover:border-slate-300 hover:bg-slate-50
                    text-xs font-bold transition disabled:opacity-50">
                  {uploading ? '…' : 'Replace'}
                </button>
                <input ref={fileRef} type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden" onChange={handleFileChange} />
              </>
            )}
          </div>
        </div>
      ) : (
        /* ── No doc yet ── */
        <div className="space-y-3">
          <div className="flex items-center gap-2 p-3 bg-white rounded-xl
            border border-dashed border-slate-300">
            <TbFileUpload size={16} className="text-slate-300 shrink-0" />
            <p className="text-xs text-slate-400">No document uploaded yet.</p>
          </div>

          {canUpload && (
            <>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className={`w-full flex items-center justify-center gap-2 py-2.5
                  text-white text-sm font-semibold rounded-xl transition
                  disabled:opacity-60 ${accent.btn}`}>
                {uploading
                  ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg> Uploading…</>
                  : <><FiUpload size={14} /> Upload Assignment Document</>}
              </button>
              <input ref={fileRef} type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden" onChange={handleFileChange} />
              <p className="text-[10px] text-slate-400 text-center">
                PDF, JPG or PNG · max 20 MB
              </p>
            </>
          )}
        </div>
      )}

      {/* Feedback messages */}
      {uploadSuccess && (
        <div className="flex items-center gap-2 mt-3 px-3 py-2 bg-emerald-50
          border border-emerald-200 rounded-xl">
          <FiCheckCircle size={13} className="text-emerald-600 shrink-0" />
          <p className="text-xs font-semibold text-emerald-700">{uploadSuccess}</p>
        </div>
      )}
      {uploadError && (
        <div className="flex items-center gap-2 mt-3 px-3 py-2 bg-red-50
          border border-red-200 rounded-xl">
          <FiAlertCircle size={13} className="text-red-500 shrink-0" />
          <p className="text-xs font-semibold text-red-600">{uploadError}</p>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────
export default function AssignmentDetail() {
  const { assignmentId } = useParams();
  const dispatch  = useDispatch();
  const navigate  = useNavigate();

  const {
    current: assignment,
    loading,
    error,
    uploadingAssign,
    assignDocSuccess,
    assignDocError,
    uploadingGatePass,
    gatePassDocSuccess,
    gatePassDocError,
    uploading: uploadingReturn,
    uploadSuccess: returnDocSuccess,
    uploadError:   returnDocError,
  } = useSelector(s => s.assignments);

  useEffect(() => {
    dispatch(fetchAssignmentById(assignmentId));
    return () => {
      dispatch(clearCurrentAssignment());
      dispatch(clearAssignDocMessages());
      dispatch(clearGatePassDocMessages());
    };
  }, [assignmentId]);

  useEffect(() => {
    if (!assignDocSuccess && !assignDocError) return;
    const t = setTimeout(() => dispatch(clearAssignDocMessages()), 4000);
    return () => clearTimeout(t);
  }, [assignDocSuccess, assignDocError]);

  useEffect(() => {
    if (!gatePassDocSuccess && !gatePassDocError) return;
    const t = setTimeout(() => dispatch(clearGatePassDocMessages()), 4000);
    return () => clearTimeout(t);
  }, [gatePassDocSuccess, gatePassDocError]);

  // Open document directly in a new tab — files are served by Express static
  // uploads folder lives at  src/uploads  on the server
 // stored path is e.g.  "uploads/assign-docs/13/assign-doc-13-xxx.pdf"
  const openDoc = (doc) => {
    const filePath = doc.file_path || doc.document_path || '';
    if (!filePath) return;
    
    // FIX: Changed VITE_API_BASE_URL to VITE_API_URL to match your .env file
    const apiBase = import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'http://localhost:5000';
    
    // Normalise: strip any leading slash or "src/" prefix the server may have stored
    const cleanPath = filePath.replace(/^\//, '').replace(/^src\//, '');
    const fileUrl   = filePath.startsWith('http') ? filePath : `${apiBase}/${cleanPath}`;
    
    window.open(fileUrl, '_blank', 'noopener,noreferrer');
  };

  const handleUploadAssignDoc = (file) => {
    dispatch(uploadAssignDoc({ assignmentId: assignment.id, file }));
  };

  const handleUploadGatePass = (file) => {
    dispatch(uploadGatePassDoc({ assignmentId: assignment.id, file }));
  };
  // ── Loading ──
  if (loading) {
    return (
      <MainLayout title="Assignment Detail">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <svg className="animate-spin w-8 h-8 mx-auto mb-3 text-blue-400"
              fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10"
                stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            <p className="text-sm text-slate-400">Loading assignment...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !assignment) {
    return (
      <MainLayout title="Assignment Detail">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <MdOutlineAssignment size={40} className="mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-semibold text-slate-500">Assignment not found</p>
            <button
              onClick={() => navigate('/assignments')}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2
                bg-blue-600 hover:bg-blue-700 text-white text-sm
                font-semibold rounded-lg transition">
              <FiArrowLeft size={14} /> Back to Assignments
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const effectiveStatus = assignment.display_status || assignment.status;
  const statusStyle     = STATUS_STYLES[effectiveStatus] || STATUS_STYLES.Assigned;
  const StatusIcon      = statusStyle.icon;
  const CatIcon         = CATEGORY_ICONS[assignment.category] || HiOutlineCube;
  const catColor        = CATEGORY_COLORS[assignment.category] || 'bg-slate-100 text-slate-500';
  const daysUntilDue    = assignment.days_until_due;
  const isActive        = ['Assigned', 'Overdue'].includes(effectiveStatus);

  const ciaC = Number(assignment.cia_confidentiality) || 1;
  const ciaI = Number(assignment.cia_integrity)       || 1;
  const ciaA = Number(assignment.cia_availability)    || 1;
  const ciaMax = Math.max(ciaC, ciaI, ciaA);
  const ciaClass = assignment.asset_classification ||
    (ciaMax >= 3 ? 'High' : ciaMax === 2 ? 'Medium' : 'Low');
  const ciaClassColor =
    ciaClass === 'High'   ? CIA_COLORS[3] :
    ciaClass === 'Medium' ? CIA_COLORS[2] :
                            CIA_COLORS[1];

  const hasUser  = !!assignment.user_id;
  const hasDesig = !!assignment.designation_id;
  const hasDept  = !!assignment.department_id;

  // Normalise document objects from the controller's nested shape
  const assignDoc = assignment.assign_document
    ? { ...assignment.assign_document, name: assignment.assign_document.name || assignment.assign_document.document_name }
    : null;

  const returnDoc = assignment.return_document
    ? { ...assignment.return_document, name: assignment.return_document.name || assignment.return_document.document_name }
    : null;

  const gatePassDoc = assignment.gate_pass_document
    ? { ...assignment.gate_pass_document, name: assignment.gate_pass_document.name || assignment.gate_pass_document.document_name }
    : null;

  // Location display
  const locationLine = [
    assignment.location_name,
    assignment.sub_location_name,
  ].filter(Boolean).join(' › ');

  return (
    <MainLayout
      title="Assignment Detail"
      subtitle={`Assignment #${assignment.id} · ${assignment.asset_name}`}>

      {/* ── Back + Action bar ── */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <button
          onClick={() => navigate('/assignments')}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border
            border-slate-200 text-sm font-semibold text-slate-600
            hover:bg-slate-50 transition">
          <FiArrowLeft size={14} /> Back to Assignments
        </button>

        <button
          onClick={() => navigate(`/assets/${assignment.asset_id}`)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border
            border-slate-200 text-sm font-semibold text-slate-600
            hover:bg-slate-50 transition">
          <HiOutlineCube size={15} /> View Asset
        </button>
      </div>

      {/* ── Hero card ── */}
      <div className={`rounded-2xl border-2 p-6 mb-6 flex items-start gap-5 flex-wrap
        ${effectiveStatus === 'Overdue'  ? 'bg-red-50/60 border-red-200'
        : effectiveStatus === 'Returned' ? 'bg-emerald-50/60 border-emerald-200'
        :                                  'bg-blue-50/60 border-blue-200'}`}>

        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${catColor}`}>
          <CatIcon size={30} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap mb-1">
            <h2 className="text-xl font-black text-slate-900">{assignment.asset_name}</h2>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1
              rounded-full text-xs font-bold ring-1
              ${statusStyle.bg} ${statusStyle.text} ${statusStyle.ring}`}>
              <StatusIcon size={12} />
              {effectiveStatus}
            </span>
          </div>

          <div className="flex items-center gap-3 flex-wrap text-sm text-slate-500 mb-3">
            {assignment.asset_no && (
              <span className="font-mono bg-white px-2 py-0.5 rounded border
                border-slate-200 text-xs font-bold text-slate-600">
                {assignment.asset_no}
              </span>
            )}
            <span>{assignment.category}</span>
            {assignment.asset_type && <span>· {assignment.asset_type}</span>}
            {locationLine && (
              <span className="flex items-center gap-1">
                <FiMapPin size={11} /> {locationLine}
              </span>
            )}
          </div>

          {isActive && assignment.expected_return_date && (
            <div className={`inline-flex items-center gap-2 px-3 py-1.5
              rounded-xl text-xs font-bold border
              ${daysUntilDue < 0    ? 'bg-red-100 text-red-700 border-red-200'
              : daysUntilDue <= 3   ? 'bg-orange-100 text-orange-700 border-orange-200'
              : daysUntilDue <= 7   ? 'bg-amber-100 text-amber-700 border-amber-200'
              :                       'bg-slate-100 text-slate-600 border-slate-200'}`}>
              <TbClockExclamation size={13} />
              {daysUntilDue < 0
                ? `${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) !== 1 ? 's' : ''} overdue`
                : daysUntilDue === 0 ? 'Due today'
                : `${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''} remaining`}
              · Return by {fmt(assignment.expected_return_date)}
            </div>
          )}
        </div>

        <div className="text-right shrink-0">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest">Assignment</p>
          <p className="text-2xl font-black text-slate-700">#{assignment.id}</p>
          <p className="text-xs text-slate-400 mt-0.5">{fmt(assignment.assignment_date)}</p>
        </div>
      </div>

      {/* ── 3-column grid ── */}
      <div className="grid grid-cols-3 gap-5">

        {/* ── COL 1: Asset + Financial + CIA ── */}
        <div className="col-span-1 space-y-5">

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <SectionTitle icon={HiOutlineCube} label="Asset Details" />
            <InfoRow label="Name"           value={assignment.asset_name} />
            <InfoRow label="Asset No."      value={assignment.asset_no} mono />
            <InfoRow label="Category"       value={assignment.category} />
            <InfoRow label="Asset Type"     value={assignment.asset_type} />
            <InfoRow label="Location"       value={locationLine || null} />
            <InfoRow label="Current Status" value={assignment.asset_status} />
            {assignment.asset_description && (
              <div className="pt-2.5 mt-1">
                <p className="text-xs text-slate-400 mb-1">Description</p>
                <p className="text-sm text-slate-600">{assignment.asset_description}</p>
              </div>
            )}
          </div>

          {(assignment.cost || assignment.po_number || assignment.financial_type) && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <SectionTitle icon={FiDollarSign} label="Financial" />
              <InfoRow label="Cost"
                value={assignment.cost
                  ? `${assignment.currency || ''} ${Number(assignment.cost).toLocaleString()}`
                  : null} />
              <InfoRow label="Financial Type" value={assignment.financial_type} />
              <InfoRow label="PO Number"       value={assignment.po_number} mono />
            </div>
          )}

          {/* ── Assignment Document ── */}
          <DocumentCard
            title="Assignment Certificate"
            icon={TbFileCertificate}
            doc={assignDoc}
            canUpload={isActive}
            uploading={uploadingAssign}
            uploadSuccess={assignDocSuccess}
            uploadError={assignDocError}
            onUpload={handleUploadAssignDoc}
            onOpen={openDoc}
            accentColor="blue"
          />

          {/* ── Gate Pass Document ── */}
          <DocumentCard
            title="Gate Pass"
            icon={TbNotes}
            doc={gatePassDoc}
            canUpload={isActive}
            uploading={uploadingGatePass}
            uploadSuccess={gatePassDocSuccess}
            uploadError={gatePassDocError}
            onUpload={handleUploadGatePass}
            onOpen={openDoc}
            accentColor="amber"
          />

        </div>

        {/* ── COL 2: Assignment + Conditions + Processed by + Designation CIA + Documents ── */}
        <div className="col-span-1 space-y-5">

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <SectionTitle icon={TbTransfer} label="Assignment Details" />
            <InfoRow label="Assignment ID"   value={`#${assignment.id}`} mono />
            <InfoRow label="Assignment Date" value={fmt(assignment.assignment_date)} />
            <InfoRow label="Expected Return" value={fmt(assignment.expected_return_date)} />
            <InfoRow label="Actual Return"   value={fmt(assignment.actual_return_date)} />
            <InfoRow label="Status"          value={effectiveStatus} />

            <div className="mt-3 pt-3 border-t border-slate-50 space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Condition</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">At Checkout</span>
                {assignment.condition_out ? (
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg
                    ${CONDITION_COLORS[assignment.condition_out] || 'bg-slate-100 text-slate-500'}`}>
                    {assignment.condition_out}
                  </span>
                ) : <span className="text-xs text-slate-300">Not recorded</span>}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">At Return</span>
                {assignment.condition_in ? (
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg
                    ${CONDITION_COLORS[assignment.condition_in] || 'bg-slate-100 text-slate-500'}`}>
                    {assignment.condition_in}
                  </span>
                ) : (
                  <span className="text-xs text-slate-300">
                    {effectiveStatus === 'Returned' ? 'Not recorded' : 'Pending return'}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <SectionTitle icon={TbId} label="Processed By" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center
                justify-center shrink-0 text-sm font-black text-slate-500">
                {assignment.assigned_by_first_name?.[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">{assignment.assigned_by_name || '—'}</p>
                <p className="text-xs text-slate-400">{assignment.assigned_by_email || ''}</p>
              </div>
            </div>
          </div>

          {hasDesig && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <SectionTitle icon={TbShieldCheck} label="Designation CIA Defaults" />
              <p className="text-xs text-slate-400 mb-3">
                CIA applied from: <span className="font-semibold text-slate-600">
                  {assignment.designation_title}
                </span>
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { full: 'Confidentiality', val: Number(assignment.default_cia_confidentiality) || 1, icon: TbLock        },
                  { full: 'Integrity',       val: Number(assignment.default_cia_integrity)       || 1, icon: TbShieldCheck },
                  { full: 'Availability',    val: Number(assignment.default_cia_availability)    || 1, icon: TbBolt        },
                ].map(dim => {
                  const lc = CIA_COLORS[dim.val] || CIA_COLORS[1];
                  return (
                    <div key={dim.full}
                      className={`flex flex-col items-center py-2.5 rounded-xl border ${lc.bg} ${lc.border}`}>
                      <dim.icon size={12} className={`${lc.text} mb-1`} />
                      <span className={`text-xl font-black ${lc.text}`}>{dim.val}</span>
                      <span className="text-[9px] text-slate-400 mt-0.5">{dim.full}</span>
                      <span className={`text-[9px] font-bold ${lc.text}`}>{lc.label}</span>
                    </div>
                  );
                })}
              </div>
              {assignment.default_classification && (
                <div className={`mt-2 py-1.5 rounded-lg text-center text-xs font-bold
                  ${ciaClassColor.bg} ${ciaClassColor.text}`}>
                  Default Classification: {assignment.default_classification}
                </div>
              )}
            </div>
          )}

        </div>

        {/* ── COL 3: Assignee (User / Designation / Department) ── */}
        <div className="col-span-1 space-y-5">

          {hasUser ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <SectionTitle icon={TbUser} label="Assigned Employee" />
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br
                  from-indigo-500 to-blue-600 flex items-center justify-center
                  shrink-0 text-white font-black text-lg">
                  {assignment.user_first_name?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="text-base font-bold text-slate-800">
                    {assignment.user_first_name} {assignment.user_last_name}
                  </p>
                  <p className="text-xs text-slate-400">@{assignment.user_username}</p>
                </div>
                <span className={`ml-auto text-[10px] px-2 py-1 rounded-full font-bold shrink-0
                  ${assignment.user_status === 'Active'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-500'}`}>
                  {assignment.user_status}
                </span>
              </div>
              <InfoRow label="Email"
                value={
                  <a href={`mailto:${assignment.user_email}`}
                    className="text-blue-500 hover:underline flex items-center gap-1">
                    <FiMail size={11} /> {assignment.user_email}
                  </a>
                }
              />
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <SectionTitle icon={TbUser} label="Assigned Employee" />
              <div className="py-6 text-center">
                <TbUser size={28} className="mx-auto mb-2 text-slate-300" />
                <p className="text-sm text-slate-400">No individual employee assigned</p>
              </div>
            </div>
          )}

          {hasDesig ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <SectionTitle icon={TbBriefcase} label="Designation" />
              <div className="flex items-center gap-3 p-3 bg-blue-50
                border border-blue-100 rounded-xl">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center
                  justify-center shrink-0">
                  <TbBriefcase size={18} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    {assignment.designation_title}
                  </p>
                  <p className="text-[10px] text-blue-500 font-semibold mt-0.5">
                    ID #{assignment.designation_id}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <SectionTitle icon={TbBriefcase} label="Designation" />
              <div className="py-4 text-center">
                <TbBriefcase size={24} className="mx-auto mb-2 text-slate-300" />
                <p className="text-sm text-slate-400">No designation linked</p>
              </div>
            </div>
          )}

          {hasDept ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <SectionTitle icon={TbBuilding} label="Department" />
              <div className="flex items-center gap-3 p-3 bg-indigo-50
                border border-indigo-100 rounded-xl mb-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center
                  justify-center shrink-0">
                  <TbBuilding size={18} className="text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    {assignment.department_name}
                  </p>
                  <p className="text-[10px] text-indigo-500 font-semibold mt-0.5">
                    ID #{assignment.department_id}
                  </p>
                </div>
              </div>
              {assignment.department_description && (
                <p className="text-xs text-slate-500">{assignment.department_description}</p>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <SectionTitle icon={TbBuilding} label="Department" />
              <div className="py-4 text-center">
                <TbBuilding size={24} className="mx-auto mb-2 text-slate-300" />
                <p className="text-sm text-slate-400">No department linked</p>
              </div>
            </div>
          )}

          {/* ── Return Document ── */}
          <DocumentCard
            title="Return Document"
            icon={TbArrowBackUp}
            doc={returnDoc}
            canUpload={false}
            uploading={false}
            onUpload={() => {}}
            onOpen={openDoc}
            accentColor="violet"
          />

        </div>
      </div>

      {/* ── All Documents — Categorical View ── */}
      <div className="mt-6 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
            <TbFolderOpen size={14} className="text-slate-500" />
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">All Documents</p>
          <span className="ml-auto text-xs text-slate-400">
            {[assignDoc, gatePassDoc, returnDoc].filter(Boolean).length} / 3 uploaded
          </span>
        </div>

        {/* Category: Assignment */}
        <div className="mb-5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
            Assignment Documents
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Assignment Certificate */}
            <div className={`flex items-center gap-3 p-3 rounded-xl border-2 transition
              ${assignDoc ? 'border-blue-100 bg-blue-50/40' : 'border-dashed border-slate-200 bg-slate-50'}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0
                ${assignDoc ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                <TbFileCertificate size={17} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-700">Assignment Certificate</p>
                {assignDoc
                  ? <p className="text-[10px] text-slate-400 truncate">{assignDoc.name} · {fmt(assignDoc.uploaded_at)}</p>
                  : <p className="text-[10px] text-slate-400">Not uploaded</p>}
              </div>
              {assignDoc
                ? <button onClick={() => openDoc(assignDoc)} className="text-[11px] px-2.5 py-1 rounded-lg bg-blue-600 text-white font-semibold shrink-0 hover:bg-blue-700 transition">View</button>
                : isActive
                  ? <span className="text-[10px] text-slate-400 shrink-0">Upload in panel above</span>
                  : null}
            </div>

            {/* Gate Pass */}
            <div className={`flex items-center gap-3 p-3 rounded-xl border-2 transition
              ${gatePassDoc ? 'border-amber-100 bg-amber-50/40' : 'border-dashed border-slate-200 bg-slate-50'}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0
                ${gatePassDoc ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
                <TbNotes size={17} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-700">Gate Pass</p>
                {gatePassDoc
                  ? <p className="text-[10px] text-slate-400 truncate">{gatePassDoc.name} · {fmt(gatePassDoc.uploaded_at)}</p>
                  : <p className="text-[10px] text-slate-400">Not uploaded</p>}
              </div>
              {gatePassDoc
                ? <button onClick={() => openDoc(gatePassDoc)} className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-500 text-white font-semibold shrink-0 hover:bg-amber-600 transition">View</button>
                : isActive
                  ? <span className="text-[10px] text-slate-400 shrink-0">Upload in panel above</span>
                  : null}
            </div>
          </div>
        </div>

        {/* Category: Return */}
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-violet-400 inline-block" />
            Return Documents
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className={`flex items-center gap-3 p-3 rounded-xl border-2 transition
              ${returnDoc ? 'border-violet-100 bg-violet-50/40' : 'border-dashed border-slate-200 bg-slate-50'}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0
                ${returnDoc ? 'bg-violet-100 text-violet-600' : 'bg-slate-100 text-slate-400'}`}>
                <TbArrowBackUp size={17} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-700">Return Document</p>
                {returnDoc
                  ? <p className="text-[10px] text-slate-400 truncate">{returnDoc.name} · {fmt(returnDoc.uploaded_at)}</p>
                  : <p className="text-[10px] text-slate-400">
                      {effectiveStatus === 'Returned' ? 'Not uploaded' : 'Available after return'}
                    </p>}
              </div>
              {returnDoc
                ? <button onClick={() => openDoc(returnDoc)} className="text-[11px] px-2.5 py-1 rounded-lg bg-violet-600 text-white font-semibold shrink-0 hover:bg-violet-700 transition">View</button>
                : null}
            </div>
          </div>
        </div>
      </div>

    </MainLayout>
  );
}

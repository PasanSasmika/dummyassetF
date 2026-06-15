import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    HiOutlineCube, HiOutlineEye,
} from 'react-icons/hi';
import {
    FiSearch, FiCalendar,
} from 'react-icons/fi';
import {
    TbTransfer, TbArrowBackUp, TbClockExclamation,
    TbCircleCheck, TbCircleDot, TbUserCheck, TbServer,
    TbTool, TbShieldLock, TbFileText, TbDeviceDesktop, TbDoor,
} from 'react-icons/tb';
import {
    MdOutlineAssignment,
} from 'react-icons/md';

import MainLayout    from '../../components/layout/MainLayout';
import Pagination    from '../../components/common/Pagination';
import StatsCard     from '../../components/common/StatsCard';
import usePagination from '../../hooks/usePagination';
import {
    fetchAllAssignments,
    bulkAssignAssets,
    returnAsset,
    uploadReturnDoc,
    uploadGatePassDoc,
    clearAssignmentMessages,
    clearGatePassDocMessages,
} from '../../features/assignments/assignmentSlice';
import { fetchAssets }        from '../../features/assets/assetSlice';
import { fetchUsers }         from '../../features/users/userSlice';
import { fetchDepartments }   from '../../features/departments/departmentSlice';
import { fetchDesignations }  from '../../features/designations/designationSlice';
import {
    fetchAccessories,
    assignAccessory,
} from '../../features/accessories/accessorySlice';
import { fetchLocations, fetchSubLocations } from '../../features/locations/locationSlice';
import { generateAssignmentPDF }             from '../../utils/assignmentPDF';
import { saveAssignmentDoc, downloadAssignmentDoc } from '../../utils/assignmentDocs';
import AssignModal from './AssignModal';
import ReturnModal from './ReturnModal';

// ── Color maps ────────────────────────────────────────────
const statusColors = {
    Assigned: 'bg-blue-100 text-blue-700 ring-1 ring-blue-200',
    Returned: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
    Overdue:  'bg-red-100 text-red-700 ring-1 ring-red-200',
};

const statusIcons = {
    Assigned: TbCircleDot,
    Returned: TbCircleCheck,
    Overdue:  TbClockExclamation,
};

const conditionColors = {
    New:     'bg-emerald-100 text-emerald-700',
    Good:    'bg-blue-100 text-blue-700',
    Fair:    'bg-amber-100 text-amber-700',
    Poor:    'bg-orange-100 text-orange-700',
    Damaged: 'bg-red-100 text-red-700',
};

const CATEGORY_ICONS = {
    'Human':                TbUserCheck,
    'IT Infrastructure':    TbServer,
    'Service':              TbTool,
    'Digital':              TbShieldLock,
    'Tangible Information': TbFileText,
    'End User':             TbDeviceDesktop,
    'Facility':             TbDoor,
};

const CATEGORY_COLORS = {
    'Human':                'bg-indigo-100 text-indigo-600',
    'IT Infrastructure':    'bg-sky-100 text-sky-600',
    'Service':              'bg-amber-100 text-amber-600',
    'Digital':              'bg-purple-100 text-purple-600',
    'Tangible Information': 'bg-emerald-100 text-emerald-600',
    'End User':             'bg-red-100 text-red-600',
    'Facility':             'bg-orange-100 text-orange-600',
};

const safeList = (v) => (Array.isArray(v) ? v : []);

// ── Toast ─────────────────────────────────────────────────
const Toast = ({ message, type }) => (
    <div className={`fixed top-5 right-5 z-50 flex items-center gap-2
        px-4 py-3 rounded-xl shadow-lg text-sm font-medium
        ${type === 'success' ? 'bg-brand-green text-brand-cream-light' : 'bg-red-600 text-white'}`}>
        {type === 'success' ? '✅' : '❌'} {message}
    </div>
);

export default function Assignments() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { list, loading, saving, error, success, lastCIA, lastAssignments,
            uploadingGatePass, gatePassDocSuccess, gatePassDocError } = useSelector(s => s.assignments);
    const auth                     = useSelector(s => s.auth);
    const { list: rawAssets }      = useSelector(s => s.assets);
    const { list: rawUsers }       = useSelector(s => s.users);
    const { list: rawDepts }       = useSelector(s => s.departments);
    const { list: rawDesigs }      = useSelector(s => s.designations);
    const { list: rawAccessories } = useSelector(s => s.accessories);
    const { list: locations, subList: subLocations } = useSelector(s => s.locations);

    const assignments     = safeList(list);
    const allAssets       = safeList(rawAssets);
    const users           = safeList(rawUsers);
    const departments     = safeList(rawDepts);
    const designations    = safeList(rawDesigs);
    const accessoriesList = safeList(rawAccessories).filter(a => a.is_active);

    const [showAssign,       setShowAssign]       = useState(false);
    const [showReturn,       setShowReturn]       = useState(false);
    const [selectedAssign,   setSelectedAssign]   = useState(null);
    const [pendingPDFData,    setPendingPDFData]    = useState(null);
    const [pendingReturnFile, setPendingReturnFile] = useState(null);
    const [createdAssignmentIds, setCreatedAssignmentIds] = useState(null);
    
    // Input states
    const [search,       setSearch]       = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [activeTab,    setActiveTab]    = useState('all');

    // Applied states (trigger filtering only on submit)
    const [appliedSearch,       setAppliedSearch]       = useState('');
    const [appliedStatusFilter, setAppliedStatusFilter] = useState('');

    const assignedByName = [auth?.user?.first_name, auth?.user?.last_name]
        .filter(Boolean).join(' ') || 'Admin';

    useEffect(() => {
        dispatch(fetchAllAssignments());
        dispatch(fetchAssets());
        dispatch(fetchUsers());
        dispatch(fetchDepartments());
        dispatch(fetchDesignations());
        dispatch(fetchAccessories());
        dispatch(fetchLocations());
        dispatch(fetchSubLocations());
    }, [dispatch]);

    useEffect(() => {
        if (!success && !error) return;

        if (success && pendingPDFData) {
            try {
                const { doc, docId } = generateAssignmentPDF({
                    selectedAssets: pendingPDFData.selectedAssets,
                    selectedUser:   pendingPDFData.selectedUser,
                    selectedDept:   pendingPDFData.selectedDept,
                    selectedDesig:  pendingPDFData.selectedDesig,
                    form:           pendingPDFData.form,
                    assignedByName,
                    newCIA:         lastCIA,
                });
                const dataUrl    = doc.output('datauristring');
                const assetNames = pendingPDFData.selectedAssets.map(a => a.name);
                const assigneeName =
                    pendingPDFData.selectedUser
                        ? `${pendingPDFData.selectedUser.first_name} ${pendingPDFData.selectedUser.last_name}`
                        : pendingPDFData.selectedDept?.name
                        || pendingPDFData.selectedDesig?.title
                        || 'Unknown';
                saveAssignmentDoc({ docId, assigneeName, assetCount: pendingPDFData.selectedAssets.length, assetNames, date: new Date().toISOString(), dataUrl });
                downloadAssignmentDoc(dataUrl, docId);
            } catch (err) {
                console.error('PDF generation failed:', err);
            }
            // Advance to gate pass step (step 5) instead of closing modal
            const ids = lastAssignments.map(a => a.assignmentId).filter(Boolean);
            setCreatedAssignmentIds(ids.length > 0 ? ids : [pendingPDFData.selectedAssets?.[0]?.id]);
            setPendingPDFData(null);
            dispatch(fetchAllAssignments());
            dispatch(fetchAssets());
        }

        if (success && !pendingPDFData) {
            if (pendingReturnFile && selectedAssign) {
                const { file, document_type } = pendingReturnFile;
                dispatch(uploadReturnDoc({
                    assignmentId: selectedAssign.id,
                    file,
                    meta: { document_type },
                }));
            }
            setPendingReturnFile(null);
            setShowReturn(false);
            setSelectedAssign(null);
            dispatch(fetchAllAssignments());
            dispatch(fetchAssets());
        }

        if (error) {
            setPendingPDFData(null);
            setPendingReturnFile(null);
        }

        const t = setTimeout(() => dispatch(clearAssignmentMessages()), 3000);
        return () => clearTimeout(t);
    }, [success, error]);

    // Handlers for Submit and Clear
    const handleApplyFilters = () => {
        setAppliedSearch(search);
        setAppliedStatusFilter(statusFilter);
    };

    const handleClearFilters = () => {
        setSearch('');
        setStatusFilter('');
        setAppliedSearch('');
        setAppliedStatusFilter('');
    };

    // ── Stats ──
    const totalActive   = assignments.filter(a => ['Assigned', 'Overdue'].includes(a.display_status || a.status)).length;
    const totalReturned = assignments.filter(a => a.status === 'Returned').length;
    const totalOverdue  = assignments.filter(a => a.display_status === 'Overdue').length;

    // ── Filtering ──
    const filtered = assignments.filter(a => {
        const effectiveStatus = a.display_status || a.status;
        const text = `${a.asset_name || ''} ${a.asset_no || ''} ${a.assigned_to_name || ''} ${a.category || ''}`.toLowerCase();
        
        // Filter against applied states
        const matchSearch = text.includes(appliedSearch.toLowerCase());
        const matchStatus = appliedStatusFilter ? effectiveStatus === appliedStatusFilter : true;
        
        const matchTab =
            activeTab === 'all'      ? true :
            activeTab === 'active'   ? ['Assigned', 'Overdue'].includes(effectiveStatus) :
            activeTab === 'returned' ? effectiveStatus === 'Returned' :
            activeTab === 'overdue'  ? effectiveStatus === 'Overdue' : true;
        
        return matchSearch && matchStatus && matchTab;
    });

    const {
        paginated, currentPage, totalPages,
        setCurrentPage, reset, startIndex, endIndex, totalItems,
    } = usePagination(filtered, 10);

    // Reset pagination based on applied filters and active tab
    useEffect(() => { reset(); }, [appliedSearch, appliedStatusFilter, activeTab]);

    // ── Handlers ──
    const handleAssign = async (payload, extraInfo) => {
        setPendingPDFData(extraInfo);
        const result = await dispatch(bulkAssignAssets(payload));
        const accessories = payload.accessories || [];
        const asset_ids   = payload.asset_ids   || [];
        if (result.meta?.requestStatus === 'fulfilled' && accessories.length > 0 && asset_ids.length > 0) {
            const today = new Date().toISOString().split('T')[0];
            const accPromises = [];
            for (const asset_id of asset_ids) {
                for (const acc of accessories) {
                    accPromises.push(dispatch(assignAccessory({ accessory_id: acc.accessory_id, asset_id, assigned_date: today })));
                }
            }
            const settled = await Promise.allSettled(accPromises);
            settled.forEach((res, i) => { if (res.status === 'rejected') console.error(`Accessory assignment #${i + 1} failed:`, res.reason); });
        }
    };

    const handleReturn = async ({ condition_in, actual_return_date, document_type, file }) => {
        if (file) setPendingReturnFile({ file, document_type });
        await dispatch(returnAsset({
            assignmentId: selectedAssign.id,
            data: { condition_in, actual_return_date },
        }));
    };

    // ── Tabs ──
    const TABS = [
        { key: 'all',      label: 'All',      count: assignments.length },
        { key: 'active',   label: 'Active',   count: totalActive,   dot: 'bg-blue-500' },
        { key: 'overdue',  label: 'Overdue',  count: totalOverdue,  dot: 'bg-red-500' },
        { key: 'returned', label: 'Returned', count: totalReturned, dot: 'bg-emerald-500' },
    ];

    return (
        <MainLayout
            title="Asset Assignments"
            subtitle="Track and manage asset assignments across the organization">

            {(success || error) && (
                <Toast message={success || error} type={success ? 'success' : 'error'} />
            )}

            {/* ── Stats Row ── */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <StatsCard label="Total"    value={assignments.length} icon="ticket"  color="green"   sub="All time assignments" />
                <StatsCard label="Active"   value={totalActive}        icon="chart"   color="blue"    sub="Currently assigned" />
                <StatsCard label="Overdue"  value={totalOverdue}       icon="warning" color="red"     sub="Past return date" />
                <StatsCard label="Returned" value={totalReturned}      icon="active"  color="emerald" sub="Successfully returned" />
            </div>

            {/* ── Toolbar ── */}
            <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative">
                        <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-dark/30" />
                        <input
                            placeholder="Search asset, user, category..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleApplyFilters()}
                            className="pl-9 pr-4 py-2 rounded-lg border border-brand-cream bg-white
                                text-sm w-64 focus:outline-none focus:ring-2 focus:ring-brand-green
                                placeholder:text-brand-dark/30 text-brand-dark transition-colors duration-150"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-brand-cream bg-white text-sm
                            focus:outline-none focus:ring-2 focus:ring-brand-green text-brand-dark/70
                            transition-colors duration-150">
                        <option value="">All Statuses</option>
                        <option value="Assigned">Assigned</option>
                        <option value="Returned">Returned</option>
                        <option value="Overdue">Overdue</option>
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

                    {(appliedSearch || appliedStatusFilter) && (
                        <span className="text-xs text-brand-dark/40">{totalItems} result{totalItems !== 1 ? 's' : ''}</span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setShowAssign(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-brand-green hover:bg-brand-green-dark
                            text-brand-cream-light text-sm font-semibold rounded-lg transition-colors duration-150 shadow-sm shrink-0">
                        <TbTransfer size={16} /> Assign Asset
                    </button>
                    <button onClick={() => navigate('/assignments/return')}
                        className="flex items-center gap-2 px-4 py-2 bg-brand-cream hover:bg-brand-cream-light
                            text-brand-dark text-sm font-semibold rounded-lg transition-colors duration-150 shadow-sm shrink-0">
                        <TbArrowBackUp size={16} /> Return Assets
                    </button>
                </div>
            </div>

            {/* ── Tabs ── */}
            <div className="flex items-center gap-1 mb-4 bg-brand-cream/40 rounded-xl p-1 w-fit">
                {TABS.map(tab => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm
                            font-semibold transition-all duration-150
                            ${activeTab === tab.key
                                ? 'bg-white text-brand-dark shadow-sm'
                                : 'text-brand-dark/50 hover:text-brand-dark'}`}>
                        {tab.dot && <span className={`w-1.5 h-1.5 rounded-full ${tab.dot}`} />}
                        {tab.label}
                        <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold
                            ${activeTab === tab.key
                                ? 'bg-brand-cream/60 text-brand-dark'
                                : 'bg-white/50 text-brand-dark/30'}`}>
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* ── Table ── */}
            <div className="bg-white rounded-2xl border border-brand-cream/60 shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="bg-brand-cream/30 border-b border-brand-cream/60">
                            {['Asset', 'Assigned To', 'Assigned By', 'Assignment Date', 'Expected Return', 'Condition', 'Status', 'Actions'].map(h => (
                                <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-brand-dark/40 uppercase tracking-wider whitespace-nowrap">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-brand-cream/30">
                        {loading ? (
                            <tr>
                                <td colSpan={8} className="px-6 py-12 text-center">
                                    <svg className="animate-spin w-6 h-6 mx-auto mb-2 text-brand-green" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    <p className="text-sm text-brand-dark/40">Loading assignments...</p>
                                </td>
                            </tr>

                        ) : paginated.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-6 py-16 text-center">
                                    <div className="w-14 h-14 rounded-full bg-brand-cream/50 flex items-center justify-center mx-auto mb-3">
                                        <MdOutlineAssignment size={26} className="text-brand-dark/30" />
                                    </div>
                                    <p className="text-sm font-semibold text-brand-dark/50">No assignments found</p>
                                    <p className="text-xs text-brand-dark/30 mt-1">
                                        {appliedSearch || appliedStatusFilter ? 'Try adjusting your search filters' : 'Start by assigning an asset to a user'}
                                    </p>
                                    {!appliedSearch && !appliedStatusFilter && (
                                        <button onClick={() => setShowAssign(true)}
                                            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-brand-green hover:bg-brand-green-dark text-brand-cream-light text-sm font-semibold rounded-lg transition-colors duration-150">
                                            <TbTransfer size={15} /> Assign Asset
                                        </button>
                                    )}
                                </td>
                            </tr>

                        ) : paginated.map(a => {
                            const effectiveStatus = a.display_status || a.status;
                            const StatusIcon  = statusIcons[effectiveStatus] || TbCircleDot;
                            const isActive    = ['Assigned', 'Overdue'].includes(effectiveStatus);
                            const daysUntilDue = a.days_until_due;
                            const CatIcon     = CATEGORY_ICONS[a.category] || HiOutlineCube;
                            const catColor    = CATEGORY_COLORS[a.category] || 'bg-slate-100 text-slate-500';

                            return (
                                <tr key={a.id}
                                    className={`transition-colors ${effectiveStatus === 'Overdue' ? 'bg-red-50/40 hover:bg-red-50' : 'hover:bg-brand-cream/20'}`}>

                                    {/* Asset */}
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-2.5">
                                            <div className={`w-9 h-9 rounded-xl bg-brand-green/10 flex items-center justify-center shrink-0 ${catColor}`}>
                                                 <HiOutlineCube className="w-4 h-4 text-brand-green" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-brand-dark truncate max-w-[130px]">{a.asset_name || '—'}</p>
                                                <p className="text-[10px] font-mono text-brand-dark/40">{a.asset_no || `#${a.asset_id}`}</p>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Assigned to */}
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-full bg-brand-green/10 flex items-center justify-center shrink-0 text-[11px] font-black text-brand-green">
                                                {(a.assigned_to_name || '?').charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm text-brand-dark font-semibold truncate max-w-[100px]">{a.assigned_to_name || '—'}</p>
                                                {a.category && <p className="text-[10px] text-brand-dark/40">{a.category}</p>}
                                            </div>
                                        </div>
                                    </td>

                                    {/* Assigned by */}
                                    <td className="px-4 py-4">
                                        <p className="text-sm text-brand-dark/60 truncate max-w-[100px]">{a.assigned_by_name || '—'}</p>
                                    </td>

                                    {/* Assignment date */}
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-1.5 text-sm text-brand-dark/60">
                                            <FiCalendar size={12} className="text-brand-dark/30 shrink-0" />
                                            {a.assignment_date ? new Date(a.assignment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                        </div>
                                    </td>

                                    {/* Expected return */}
                                    <td className="px-4 py-4">
                                        {a.expected_return_date ? (
                                            <div>
                                                <p className={`text-sm font-medium ${effectiveStatus === 'Overdue' ? 'text-red-600' : 'text-brand-dark/60'}`}>
                                                    {new Date(a.expected_return_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </p>
                                                {isActive && daysUntilDue !== null && (
                                                    <p className={`text-[10px] font-bold mt-0.5 ${daysUntilDue < 0 ? 'text-red-500' : daysUntilDue <= 3 ? 'text-orange-500' : daysUntilDue <= 7 ? 'text-amber-500' : 'text-brand-dark/30'}`}>
                                                        {daysUntilDue < 0 ? `${Math.abs(daysUntilDue)}d overdue` : daysUntilDue === 0 ? '⚠ Due today' : `${daysUntilDue}d left`}
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-brand-dark/20">No date set</span>
                                        )}
                                    </td>

                                    {/* Condition */}
                                    <td className="px-4 py-4">
                                        <div className="space-y-1">
                                            {a.condition_out && (
                                                <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${conditionColors[a.condition_out] || 'bg-slate-100 text-slate-500'}`}>
                                                    Out: {a.condition_out}
                                                </span>
                                            )}
                                            {a.condition_in && (
                                                <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${conditionColors[a.condition_in] || 'bg-slate-100 text-slate-500'}`}>
                                                    In: {a.condition_in}
                                                </span>
                                            )}
                                            {!a.condition_out && !a.condition_in && <span className="text-xs text-brand-dark/20">—</span>}
                                        </div>
                                    </td>

                                    {/* Status */}
                                    <td className="px-4 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${statusColors[effectiveStatus] || 'bg-slate-100 text-slate-500'}`}>
                                            <StatusIcon size={11} />
                                            {effectiveStatus}
                                        </span>
                                    </td>

                                    {/* Actions */}
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => navigate(`/assignments/${a.id}`)}
                                                className="w-7 h-7 flex items-center justify-center rounded-lg
                                                    bg-brand-cream/50 hover:bg-brand-cream text-brand-dark/50 transition-colors duration-150"
                                                title="View Assignment">
                                                <HiOutlineEye size={14} />
                                            </button>
                                            {isActive && (
                                                <button
                                                    onClick={() => { setSelectedAssign(a); setShowReturn(true); }}
                                                    className="flex items-center gap-1.5 px-2.5 py-1.5
                                                        rounded-lg bg-brand-green/10 hover:bg-brand-green/20
                                                        text-brand-green text-xs font-semibold transition-colors duration-150"
                                                    title="Process Return">
                                                    <TbArrowBackUp size={13} /> Return
                                                </button>
                                            )}
                                        </div>
                                    </td>

                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>

            {totalItems > 0 && (
                <p className="text-xs text-brand-dark/40 mt-3 px-1">
                    Showing {startIndex}–{endIndex} of {totalItems} assignments
                </p>
            )}

            {/* ── Assign Modal ── */}
            {showAssign && (
                <AssignModal
                    assets={allAssets}
                    departments={departments}
                    designations={designations}
                    users={users}
                    accessories={accessoriesList}
                    locations={locations}
                    subLocations={subLocations}
                    onClose={() => {
                        setShowAssign(false);
                        setCreatedAssignmentIds(null);
                        dispatch(clearGatePassDocMessages());
                    }}
                    onSubmit={handleAssign}
                    loading={saving}
                    createdAssignmentIds={createdAssignmentIds}
                    onGatePassUpload={async (file) => {
                        if (!createdAssignmentIds?.length) return;
                        for (const assignmentId of createdAssignmentIds) {
                            await dispatch(uploadGatePassDoc({ assignmentId, file }));
                        }
                    }}
                    gatePassUploading={uploadingGatePass}
                    gatePassSuccess={gatePassDocSuccess}
                    gatePassError={gatePassDocError}
                />
            )}

            {/* ── Return Modal ── */}
            {showReturn && selectedAssign && (
                <ReturnModal
                    assignment={selectedAssign}
                    onClose={() => {
                        setShowReturn(false);
                        setSelectedAssign(null);
                        setPendingReturnFile(null);
                    }}
                    onSubmit={handleReturn}
                    loading={saving}
                    assignedByName={assignedByName}
                />
            )}

        </MainLayout>
    );
}
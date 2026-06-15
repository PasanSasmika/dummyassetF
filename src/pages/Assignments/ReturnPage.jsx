import { useEffect, useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
    FiSearch, FiX, FiFilter,
    FiCalendar, FiCheck,
} from 'react-icons/fi';
import {
    TbArrowBackUp, TbCircleDot, TbClockExclamation,
    TbUserCheck, TbServer, TbTool, TbShieldLock,
    TbFileText, TbDeviceDesktop, TbDoor, TbBriefcase,
    TbUser, TbChecks,
} from 'react-icons/tb';
import { HiOutlineCube } from 'react-icons/hi';
import { MdOutlineAssignment } from 'react-icons/md';

import MainLayout    from '../../components/layout/MainLayout';
import Pagination    from '../../components/common/Pagination';
import usePagination from '../../hooks/usePagination';
import ReturnModal   from './ReturnModal';
import {
    fetchAllAssignments,
    returnAsset,
    clearAssignmentMessages,
} from '../../features/assignments/assignmentSlice';
import { fetchUsers }        from '../../features/users/userSlice';
import { fetchDesignations } from '../../features/designations/designationSlice';

// ── Maps ──────────────────────────────────────────────────
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

const STATUS_COLORS = {
    Assigned: 'bg-blue-100 text-blue-700 ring-1 ring-blue-200',
    Overdue:  'bg-red-100 text-red-700 ring-1 ring-red-200',
};

const STATUS_ICONS = {
    Assigned: TbCircleDot,
    Overdue:  TbClockExclamation,
};

const CONDITION_COLORS = {
    New:     'bg-emerald-100 text-emerald-700',
    Good:    'bg-blue-100 text-blue-700',
    Fair:    'bg-amber-100 text-amber-700',
    Poor:    'bg-orange-100 text-orange-700',
    Damaged: 'bg-red-100 text-red-700',
};

const safeList = (v) => (Array.isArray(v) ? v : []);

const fmt = (d) => d
    ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—';

// ── Toast ─────────────────────────────────────────────────
const Toast = ({ message, type }) => (
    <div className={`fixed top-5 right-5 z-50 flex items-center gap-2
        px-4 py-3 rounded-xl shadow-lg text-sm font-medium
        ${type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
        {type === 'success' ? '✅' : '❌'} {message}
    </div>
);

// ── Main Page ─────────────────────────────────────────────
export default function ReturnPage() {
    const dispatch = useDispatch();
    const location = useLocation();

    const { list, loading, saving, error, success } = useSelector(s => s.assignments);
    const auth          = useSelector(s => s.auth);
    const { list: rawUsers  } = useSelector(s => s.users);
    const { list: rawDesigs } = useSelector(s => s.designations);

    const assignments  = safeList(list);
    const users        = safeList(rawUsers);
    const designations = safeList(rawDesigs);

    // ── Modal state ───────────────────────────────────────
    // singleAssign  → open modal in single mode
    // showBulk      → open modal in bulk mode
    const [singleAssign,   setSingleAssign]   = useState(null);
    const [showBulk,       setShowBulk]       = useState(false);
    const [bulkProcessing, setBulkProcessing] = useState(false);
    const [selectedIds,    setSelectedIds]    = useState(new Set());

    // ── Filter state ──────────────────────────────────────
    const [textSearch,    setTextSearch]    = useState('');
    const [filterType,    setFilterType]    = useState('all');
    const [selectedUser,  setSelectedUser]  = useState(null);
    const [selectedDesig, setSelectedDesig] = useState(null);
    const [userSearch,    setUserSearch]    = useState('');
    const [desigSearch,   setDesigSearch]   = useState('');
    const [showUserDrop,  setShowUserDrop]  = useState(false);
    const [showDesigDrop, setShowDesigDrop] = useState(false);

    // ── Load ──
    useEffect(() => {
        dispatch(fetchAllAssignments());
        dispatch(fetchUsers());
        dispatch(fetchDesignations());
    }, []);

    // ── Pre-select user from navigation state ──
    useEffect(() => {
        const pre = location.state?.preselectedUser;
        if (!pre) return;
        setFilterType('employee');
        setSelectedUser({
            id:         pre.id,
            first_name: pre.first_name || '',
            last_name:  pre.last_name  || '',
            email:      pre.email      || '',
        });
        window.history.replaceState({}, '');
    }, [location.state]);

    // ── Toast + refresh ──
    useEffect(() => {
        if (!success && !error) return;
        if (success) {
            setSingleAssign(null);
            setSelectedIds(new Set());
            setShowBulk(false);
            dispatch(fetchAllAssignments());
        }
        if (error) setBulkProcessing(false);
        const t = setTimeout(() => dispatch(clearAssignmentMessages()), 3000);
        return () => clearTimeout(t);
    }, [success, error]);

    // ── Active assignments ────────────────────────────────
    const activeAssignments = useMemo(() =>
        assignments.filter(a => ['Assigned', 'Overdue'].includes(a.display_status || a.status)),
    [assignments]);

    const filtered = useMemo(() => {
        return activeAssignments.filter(a => {
            if (textSearch) {
                const q = textSearch.toLowerCase();
                const hit =
                    (a.asset_name       || '').toLowerCase().includes(q) ||
                    (a.asset_no         || '').toLowerCase().includes(q) ||
                    (a.assigned_to_name || '').toLowerCase().includes(q) ||
                    String(a.id).includes(q);
                if (!hit) return false;
            }
            if (filterType === 'employee'    && selectedUser  && a.assigned_to !== selectedUser.id) return false;
            if (filterType === 'designation' && selectedDesig) {
                const title = selectedDesig.title || selectedDesig.name;
                if (a.designation_title !== title) return false;
            }
            return true;
        });
    }, [activeAssignments, textSearch, filterType, selectedUser, selectedDesig]);

    const {
        paginated, currentPage, totalPages,
        setCurrentPage, reset, startIndex, endIndex, totalItems,
    } = usePagination(filtered, 10);

    useEffect(() => { reset(); }, [textSearch, filterType, selectedUser, selectedDesig]);

    // ── Dropdown filters ──────────────────────────────────
    const filteredUsers = useMemo(() =>
        users.filter(u => {
            const q = userSearch.toLowerCase();
            return `${u.first_name} ${u.last_name}`.toLowerCase().includes(q) ||
                   (u.email || '').toLowerCase().includes(q);
        }), [users, userSearch]);

    const filteredDesigs = useMemo(() =>
        designations.filter(d =>
            (d.title || d.name || '').toLowerCase().includes(desigSearch.toLowerCase())
        ), [designations, desigSearch]);

    // ── Selection ─────────────────────────────────────────
    const toggleSelect = (id) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };
    const toggleSelectAll = () => {
        if (paginated.every(a => selectedIds.has(a.id))) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(paginated.map(a => a.id)));
        }
    };

    const allPageSelected  = paginated.length > 0 && paginated.every(a => selectedIds.has(a.id));
    const somePageSelected = paginated.some(a => selectedIds.has(a.id)) && !allPageSelected;
    const selectedAssignments = filtered.filter(a => selectedIds.has(a.id));

    // 1 selected → show individual Return button still
    // 2+ selected → hide Return buttons, show Bulk bar
    const hasBulkSelection = selectedIds.size >= 2;

    // ── Processed-by name ─────────────────────────────────
    const processedByName = [auth?.user?.first_name, auth?.user?.last_name]
        .filter(Boolean).join(' ') || 'Admin';

    // ── Single return handler ─────────────────────────────
    const handleSingleReturn = ({ condition_in, actual_return_date }) => {
        dispatch(returnAsset({
            assignmentId: singleAssign.id,
            data: { condition_in, actual_return_date },
        }));
    };

    // ── Bulk return handler ───────────────────────────────
    const handleBulkReturn = async ({ conditionMap, returnDate }) => {
        setBulkProcessing(true);
        try {
            for (const a of selectedAssignments) {
                await dispatch(returnAsset({
                    assignmentId: a.id,
                    data: {
                        condition_in:       conditionMap[a.id] || null,
                        actual_return_date: returnDate,
                    },
                })).unwrap();
            }
            setSelectedIds(new Set());
            setShowBulk(false);
            dispatch(fetchAllAssignments());
        } catch (err) {
            console.error('Bulk return failed:', err);
        } finally {
            setBulkProcessing(false);
        }
    };

    const clearFilters = () => {
        setTextSearch(''); setFilterType('all');
        setSelectedUser(null); setSelectedDesig(null);
        setUserSearch(''); setDesigSearch('');
    };

    const hasFilters   = textSearch || selectedUser || selectedDesig || filterType !== 'all';
    const overdueCount = activeAssignments.filter(a => (a.display_status || a.status) === 'Overdue').length;

    // ─────────────────────────────────────────────────────
    return (
        <MainLayout title="Return Assets" subtitle="Process asset returns for active assignments">

            {(success || error) && (
                <Toast message={success || error} type={success ? 'success' : 'error'} />
            )}

            {/* ── Pre-selected user banner ── */}
            {filterType === 'employee' && selectedUser && (
                <div className="flex items-center gap-3 px-5 py-3 mb-5 bg-emerald-50
                    border border-emerald-200 rounded-2xl">
                    <div className="w-8 h-8 rounded-full bg-emerald-200 flex items-center
                        justify-center shrink-0 text-sm font-black text-emerald-700">
                        {(selectedUser.first_name?.[0] || '?').toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-emerald-800">
                            Showing assignments for {selectedUser.first_name} {selectedUser.last_name}
                        </p>
                        <p className="text-xs text-emerald-600">
                            {filtered.length} active assignment{filtered.length !== 1 ? 's' : ''} pending return
                        </p>
                    </div>
                    <button onClick={clearFilters}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                            border border-emerald-300 text-emerald-700 text-xs font-semibold
                            hover:bg-emerald-100 transition">
                        <FiX size={12} /> Clear filter
                    </button>
                </div>
            )}

            {/* ── Stats ── */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-5">
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Active Assignments</p>
                    <p className="text-3xl font-black text-blue-600">{activeAssignments.length}</p>
                    <p className="text-xs text-blue-400 mt-1">Pending return</p>
                </div>
                <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-5">
                    <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">Overdue</p>
                    <p className="text-3xl font-black text-red-500">{overdueCount}</p>
                    <p className="text-xs text-red-400 mt-1">Past return date</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Filtered Results</p>
                    <p className="text-3xl font-black text-slate-700">{totalItems}</p>
                    <p className="text-xs text-slate-400 mt-1">{hasFilters ? 'Matching filters' : 'All active'}</p>
                </div>
            </div>

            {/* ── Search & Filter Bar ── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-5">
                <div className="flex items-center gap-2 mb-4">
                    <FiFilter size={14} className="text-slate-400" />
                    <p className="text-sm font-bold text-slate-700">Search & Filter</p>
                    {hasFilters && (
                        <button onClick={clearFilters}
                            className="ml-auto flex items-center gap-1.5 text-xs text-red-400 hover:text-red-500 font-semibold transition">
                            <FiX size={12} /> Clear all
                        </button>
                    )}
                </div>

                <div className="flex items-start gap-4 flex-wrap">
                    <div className="relative flex-1 min-w-[220px]">
                        <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input value={textSearch} onChange={e => setTextSearch(e.target.value)}
                            placeholder="Search by asset name, ID, or assignee..."
                            className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-slate-200
                                bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                                focus:bg-white placeholder:text-slate-400 transition-all" />
                        {textSearch && (
                            <button onClick={() => setTextSearch('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                <FiX size={13} />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 shrink-0">
                        {[
                            { key: 'all',         label: 'All',         icon: MdOutlineAssignment },
                            { key: 'employee',    label: 'Employee',    icon: TbUser              },
                            { key: 'designation', label: 'Designation', icon: TbBriefcase         },
                        ].map(tab => (
                            <button key={tab.key}
                                onClick={() => {
                                    setFilterType(tab.key);
                                    setSelectedUser(null); setSelectedDesig(null);
                                    setUserSearch(''); setDesigSearch('');
                                    setShowUserDrop(false); setShowDesigDrop(false);
                                }}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all
                                    ${filterType === tab.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                                <tab.icon size={13} /> {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Employee picker */}
                    {filterType === 'employee' && (
                        <div className="relative min-w-[220px]">
                            <div onClick={() => { setShowUserDrop(v => !v); setShowDesigDrop(false); }}
                                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer text-sm transition-all
                                    ${selectedUser ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`}>
                                <TbUser size={15} className={selectedUser ? 'text-blue-500' : 'text-slate-400'} />
                                <span className={`flex-1 truncate font-semibold ${selectedUser ? 'text-blue-700' : 'text-slate-400'}`}>
                                    {selectedUser ? `${selectedUser.first_name} ${selectedUser.last_name}` : 'Select employee...'}
                                </span>
                                {selectedUser && (
                                    <button onClick={e => { e.stopPropagation(); setSelectedUser(null); }}
                                        className="text-blue-400 hover:text-red-400"><FiX size={13} /></button>
                                )}
                            </div>
                            {showUserDrop && (
                                <div className="absolute top-full mt-1 left-0 w-72 z-30 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
                                    <div className="p-2 border-b border-slate-100">
                                        <div className="relative">
                                            <FiSearch size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input autoFocus value={userSearch} onChange={e => setUserSearch(e.target.value)}
                                                placeholder="Search employee..."
                                                className="w-full pl-7 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-400" />
                                        </div>
                                    </div>
                                    <div className="max-h-52 overflow-y-auto">
                                        {filteredUsers.length === 0
                                            ? <div className="py-6 text-center text-xs text-slate-400">No employees found</div>
                                            : filteredUsers.map(u => (
                                                <button key={u.id}
                                                    onClick={() => { setSelectedUser(u); setShowUserDrop(false); setUserSearch(''); }}
                                                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-slate-50 transition ${selectedUser?.id === u.id ? 'bg-blue-50' : ''}`}>
                                                    <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 text-[11px] font-black text-indigo-600">
                                                        {(u.first_name?.[0] || '?').toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-semibold text-slate-800 truncate">{u.first_name} {u.last_name}</p>
                                                        <p className="text-[10px] text-slate-400 truncate">{u.designation_name || u.email || ''}</p>
                                                    </div>
                                                </button>
                                            ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Designation picker */}
                    {filterType === 'designation' && (
                        <div className="relative min-w-[220px]">
                            <div onClick={() => { setShowDesigDrop(v => !v); setShowUserDrop(false); }}
                                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer text-sm transition-all
                                    ${selectedDesig ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`}>
                                <TbBriefcase size={15} className={selectedDesig ? 'text-blue-500' : 'text-slate-400'} />
                                <span className={`flex-1 truncate font-semibold ${selectedDesig ? 'text-blue-700' : 'text-slate-400'}`}>
                                    {selectedDesig ? (selectedDesig.title || selectedDesig.name) : 'Select designation...'}
                                </span>
                                {selectedDesig && (
                                    <button onClick={e => { e.stopPropagation(); setSelectedDesig(null); }}
                                        className="text-blue-400 hover:text-red-400"><FiX size={13} /></button>
                                )}
                            </div>
                            {showDesigDrop && (
                                <div className="absolute top-full mt-1 left-0 w-72 z-30 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
                                    <div className="p-2 border-b border-slate-100">
                                        <div className="relative">
                                            <FiSearch size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input autoFocus value={desigSearch} onChange={e => setDesigSearch(e.target.value)}
                                                placeholder="Search designation..."
                                                className="w-full pl-7 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-400" />
                                        </div>
                                    </div>
                                    <div className="max-h-52 overflow-y-auto">
                                        {filteredDesigs.length === 0
                                            ? <div className="py-6 text-center text-xs text-slate-400">No designations found</div>
                                            : filteredDesigs.map(d => (
                                                <button key={d.id}
                                                    onClick={() => { setSelectedDesig(d); setShowDesigDrop(false); setDesigSearch(''); }}
                                                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-slate-50 transition ${selectedDesig?.id === d.id ? 'bg-blue-50' : ''}`}>
                                                    <div className="w-7 h-7 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                                                        <TbBriefcase size={14} className="text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-semibold text-slate-800">{d.title || d.name}</p>
                                                        {d.department_name && <p className="text-[10px] text-slate-400">{d.department_name}</p>}
                                                    </div>
                                                </button>
                                            ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {hasFilters && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 flex-wrap">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active filters:</span>
                        {textSearch && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                                "{textSearch}"
                                <button onClick={() => setTextSearch('')} className="hover:text-red-500"><FiX size={10} /></button>
                            </span>
                        )}
                        {selectedUser && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                                <TbUser size={11} /> {selectedUser.first_name} {selectedUser.last_name}
                                <button onClick={() => setSelectedUser(null)} className="hover:text-red-500"><FiX size={10} /></button>
                            </span>
                        )}
                        {selectedDesig && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                                <TbBriefcase size={11} /> {selectedDesig.title || selectedDesig.name}
                                <button onClick={() => setSelectedDesig(null)} className="hover:text-red-500"><FiX size={10} /></button>
                            </span>
                        )}
                        <span className="ml-auto text-xs text-slate-400">{totalItems} result{totalItems !== 1 ? 's' : ''}</span>
                    </div>
                )}
            </div>

            {/* ── Bulk action bar — 2+ selected only ── */}
            {hasBulkSelection && (
                <div className="flex items-center gap-4 px-5 py-3.5 mb-4 bg-blue-600 rounded-2xl shadow-lg">
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                            <FiCheck size={14} className="text-white" />
                        </div>
                        <span className="text-sm font-bold text-white">
                            {selectedIds.size} asset{selectedIds.size !== 1 ? 's' : ''} selected
                        </span>
                    </div>
                    <div className="flex items-center gap-2 ml-auto">
                        <button onClick={() => setSelectedIds(new Set())}
                            className="px-3 py-1.5 rounded-lg border border-white/30 text-white text-xs font-semibold hover:bg-white/10 transition">
                            Deselect All
                        </button>
                        <button onClick={() => setShowBulk(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-blue-700 text-sm font-bold hover:bg-blue-50 transition shadow-sm">
                            <TbChecks size={16} />
                            Bulk Return {selectedIds.size} Assets
                            <span className="text-[10px] ml-1 opacity-70">· 1 PDF</span>
                        </button>
                    </div>
                </div>
            )}

            {/* ── Table ── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="px-4 py-3.5 w-10">
                                <button onClick={toggleSelectAll}
                                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all
                                        ${allPageSelected ? 'bg-blue-600 border-blue-600'
                                          : somePageSelected ? 'bg-blue-200 border-blue-400'
                                          : 'border-slate-300 hover:border-blue-400'}`}>
                                    {(allPageSelected || somePageSelected) && <FiCheck size={11} className="text-white" />}
                                </button>
                            </th>
                            {['#', 'Asset', 'Assigned To', 'Designation', 'Assignment Date', 'Expected Return', 'Condition', 'Status', 'Action'].map(h => (
                                <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {loading ? (
                            <tr><td colSpan={10} className="px-6 py-12 text-center">
                                <svg className="animate-spin w-6 h-6 mx-auto mb-2 text-blue-400" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                <p className="text-sm text-slate-400">Loading...</p>
                            </td></tr>
                        ) : paginated.length === 0 ? (
                            <tr><td colSpan={10} className="px-6 py-16 text-center">
                                <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                                    <TbArrowBackUp size={26} className="text-slate-400" />
                                </div>
                                <p className="text-sm font-semibold text-slate-500">No active assignments found</p>
                                <p className="text-xs text-slate-400 mt-1">
                                    {hasFilters ? 'Try adjusting your search filters' : 'All assets have been returned'}
                                </p>
                                {hasFilters && (
                                    <button onClick={clearFilters} className="mt-3 text-xs text-blue-500 hover:underline font-semibold">
                                        Clear filters
                                    </button>
                                )}
                            </td></tr>
                        ) : paginated.map(a => {
                            const effectiveStatus = a.display_status || a.status;
                            const StatusIcon  = STATUS_ICONS[effectiveStatus]  || TbCircleDot;
                            const CatIcon     = CATEGORY_ICONS[a.category]     || HiOutlineCube;
                            const catColor    = CATEGORY_COLORS[a.category]    || 'bg-slate-100 text-slate-500';
                            const daysUntilDue = a.days_until_due;
                            const isOverdue   = effectiveStatus === 'Overdue';
                            const isSelected  = selectedIds.has(a.id);

                            return (
                                <tr key={a.id}
                                    className={`transition-colors ${isSelected ? 'bg-blue-50/70' : isOverdue ? 'bg-red-50/40 hover:bg-red-50' : 'hover:bg-slate-50'}`}>

                                    {/* Checkbox */}
                                    <td className="px-4 py-4">
                                        <button onClick={() => toggleSelect(a.id)}
                                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0
                                                ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300 hover:border-blue-400'}`}>
                                            {isSelected && <FiCheck size={11} className="text-white" />}
                                        </button>
                                    </td>

                                    {/* ID */}
                                    <td className="px-4 py-4">
                                        <span className="text-xs font-mono text-slate-400">#{a.id}</span>
                                    </td>

                                    {/* Asset */}
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-2.5">
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${catColor}`}>
                                                <CatIcon size={16} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-slate-800 truncate max-w-[130px]">{a.asset_name || '—'}</p>
                                                <p className="text-[10px] font-mono text-slate-400">{a.asset_no || `#${a.asset_id}`}</p>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Assigned To */}
                                    <td className="px-4 py-4">
                                        {a.assigned_to_name ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 text-[11px] font-black text-indigo-600">
                                                    {a.assigned_to_name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm text-slate-700 font-semibold truncate max-w-[110px]">{a.assigned_to_name}</p>
                                                    {a.assigned_to_email && (
                                                        <p className="text-[10px] text-slate-400 truncate max-w-[110px]">{a.assigned_to_email}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ) : <span className="text-xs text-slate-300">—</span>}
                                    </td>

                                    {/* Designation */}
                                    <td className="px-4 py-4">
                                        {a.designation_title ? (
                                            <div className="flex items-center gap-1.5">
                                                <TbBriefcase size={13} className="text-blue-400 shrink-0" />
                                                <span className="text-xs font-semibold text-slate-600 truncate max-w-[100px]">{a.designation_title}</span>
                                            </div>
                                        ) : <span className="text-xs text-slate-300">—</span>}
                                    </td>

                                    {/* Assignment Date */}
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                                            <FiCalendar size={12} className="text-slate-400 shrink-0" />
                                            {fmt(a.assignment_date)}
                                        </div>
                                    </td>

                                    {/* Expected Return */}
                                    <td className="px-4 py-4">
                                        {a.expected_return_date ? (
                                            <div>
                                                <p className={`text-sm font-medium ${isOverdue ? 'text-red-600' : 'text-slate-600'}`}>
                                                    {fmt(a.expected_return_date)}
                                                </p>
                                                {daysUntilDue !== null && (
                                                    <p className={`text-[10px] font-bold mt-0.5
                                                        ${daysUntilDue < 0 ? 'text-red-500'
                                                          : daysUntilDue <= 3 ? 'text-orange-500'
                                                          : daysUntilDue <= 7 ? 'text-amber-500'
                                                          : 'text-slate-400'}`}>
                                                        {daysUntilDue < 0 ? `${Math.abs(daysUntilDue)}d overdue`
                                                          : daysUntilDue === 0 ? '⚠ Due today'
                                                          : `${daysUntilDue}d left`}
                                                    </p>
                                                )}
                                            </div>
                                        ) : <span className="text-xs text-slate-300">Open-ended</span>}
                                    </td>

                                    {/* Condition */}
                                    <td className="px-4 py-4">
                                        {a.condition_out ? (
                                            <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold
                                                ${CONDITION_COLORS[a.condition_out] || 'bg-slate-100 text-slate-500'}`}>
                                                {a.condition_out}
                                            </span>
                                        ) : <span className="text-xs text-slate-300">—</span>}
                                    </td>

                                    {/* Status */}
                                    <td className="px-4 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold
                                            ${STATUS_COLORS[effectiveStatus] || 'bg-slate-100 text-slate-500'}`}>
                                            <StatusIcon size={11} /> {effectiveStatus}
                                        </span>
                                    </td>

                                    {/* Action — individual Return hidden when 2+ selected */}
                                    <td className="px-4 py-4">
                                        {!hasBulkSelection ? (
                                            <button onClick={() => setSingleAssign(a)}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition
                                                    ${isOverdue
                                                        ? 'bg-red-100 hover:bg-red-200 text-red-700'
                                                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'}`}>
                                                <TbArrowBackUp size={13} /> Return
                                            </button>
                                        ) : (
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold
                                                bg-slate-100 text-slate-300 cursor-default select-none"
                                                title="Use Bulk Return above">
                                                <TbArrowBackUp size={13} /> Return
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>

            {totalItems > 0 && (
                <p className="text-xs text-slate-400 mt-3 px-1">
                    Showing {startIndex}–{endIndex} of {totalItems} active assignments
                    {selectedIds.size > 0 && (
                        <span className="ml-2 text-blue-500 font-semibold">· {selectedIds.size} selected</span>
                    )}
                </p>
            )}

            {/* ── Single Return Modal ── */}
            {singleAssign && (
                <ReturnModal
                    assignment={singleAssign}
                    onClose={() => setSingleAssign(null)}
                    onSubmit={handleSingleReturn}
                    loading={saving}
                    processedByName={processedByName}
                />
            )}

            {/* ── Bulk Return Modal ── */}
            {showBulk && (
                <ReturnModal
                    assignments={selectedAssignments}
                    onClose={() => setShowBulk(false)}
                    onSubmit={handleBulkReturn}
                    loading={bulkProcessing}
                    processedByName={processedByName}
                />
            )}

        </MainLayout>
    );
}

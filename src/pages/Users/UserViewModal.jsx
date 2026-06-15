import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
    HiOutlineChevronLeft, HiOutlineCube,
} from 'react-icons/hi';
import {
    FiCalendar, FiUser, FiAlertTriangle, FiCheck, FiX,
} from 'react-icons/fi';
import {
    TbTransfer, TbArrowBackUp, TbClockExclamation,
    TbCircleCheck, TbCircleDot, TbUserCheck, TbServer,
    TbTool, TbShieldLock, TbFileText, TbDeviceDesktop,
    TbDoor, TbPower, TbLock,
} from 'react-icons/tb';
import { MdOutlineAssignment } from 'react-icons/md';

import MainLayout from '../../components/layout/MainLayout';
import { fetchUsers, updateUserStatus } from '../../features/users/userSlice';
import EditUserModal from './EditUserModal';
import { fetchAllAssignments } from '../../features/assignments/assignmentSlice';
import { fetchAccessoryAssignments } from '../../features/accessories/accessorySlice';
import { getRoles, roleColors, statusColors, ROLES } from './constants';

const safeList = v => Array.isArray(v) ? v : [];
const fmtDate  = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

const CATEGORY_ICONS = {
    'Human': TbUserCheck, 'IT Infrastructure': TbServer, 'Service': TbTool,
    'Digital': TbShieldLock, 'Tangible Information': TbFileText,
    'End User': TbDeviceDesktop, 'Facility': TbDoor,
};
const CATEGORY_COLORS = {
    'Human': 'bg-indigo-100 text-indigo-600', 'IT Infrastructure': 'bg-sky-100 text-sky-600',
    'Service': 'bg-amber-100 text-amber-600', 'Digital': 'bg-purple-100 text-purple-600',
    'Tangible Information': 'bg-emerald-100 text-emerald-600', 'End User': 'bg-red-100 text-red-600',
    'Facility': 'bg-orange-100 text-orange-600',
};
const assignmentStatusColors = {
    Assigned: 'bg-blue-100 text-blue-700 ring-1 ring-blue-200',
    Returned: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
    Overdue:  'bg-red-100 text-red-700 ring-1 ring-red-200',
};
const assignmentStatusIcons = {
    Assigned: TbCircleDot,
    Returned: TbCircleCheck,
    Overdue:  TbClockExclamation,
};
const conditionColors = {
    New: 'bg-emerald-100 text-emerald-700', Good: 'bg-blue-100 text-blue-700',
    Fair: 'bg-amber-100 text-amber-700', Poor: 'bg-orange-100 text-orange-700',
    Damaged: 'bg-red-100 text-red-700',
};

const InfoBlock = ({ label, value, mono = false }) => (
    <div className="bg-brand-cream/20 rounded-xl p-4 border border-brand-cream/60">
        <p className="text-[10px] font-bold text-brand-dark/40 uppercase tracking-wider mb-1">{label}</p>
        <p className={`text-sm font-semibold text-brand-dark ${mono ? 'font-mono' : ''}`}>{value || '—'}</p>
    </div>
);

const SectionHead = ({ icon: Icon, title, count }) => (
    <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-lg bg-brand-green/10 flex items-center justify-center">
            <Icon size={16} className="text-brand-green" />
        </div>
        <h2 className="text-base font-bold text-brand-dark">{title}</h2>
        {count !== undefined && (
            <span className="ml-auto text-xs font-bold px-2.5 py-1 rounded-full bg-brand-cream/60 text-brand-dark/50">{count}</span>
        )}
    </div>
);

const EmptyState = ({ icon: Icon, text }) => (
    <div className="py-10 text-center">
        <div className="w-12 h-12 rounded-full bg-brand-cream/50 flex items-center justify-center mx-auto mb-3">
            <Icon size={22} className="text-brand-dark/20" />
        </div>
        <p className="text-sm text-brand-dark/40">{text}</p>
    </div>
);

const DeactivateModal = ({ user, blockers, onConfirm, onClose }) => {
    const navigate    = useNavigate();
    const hasBlockers = blockers.assets.length > 0 || blockers.accessories.length > 0;
    const fullName    = user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user.username;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className={`px-6 py-5 ${hasBlockers ? 'bg-red-50' : 'bg-amber-50'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${hasBlockers ? 'bg-red-100' : 'bg-amber-100'}`}>
                            {hasBlockers ? <TbLock size={20} className="text-red-600" /> : <TbPower size={20} className="text-amber-600" />}
                        </div>
                        <div>
                            <h3 className={`text-base font-bold ${hasBlockers ? 'text-red-900' : 'text-amber-900'}`}>
                                {hasBlockers ? 'Cannot Deactivate User' : 'Deactivate User'}
                            </h3>
                            <p className={`text-xs mt-0.5 ${hasBlockers ? 'text-red-600' : 'text-amber-600'}`}>{fullName}</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    {hasBlockers && (
                        <>
                            <div className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-100 rounded-xl">
                                <FiAlertTriangle size={14} className="text-red-500 mt-0.5 shrink-0" />
                                <p className="text-sm text-red-700">This user has <strong>unreturned items</strong>. All assets and accessories must be returned before the account can be deactivated.</p>
                            </div>

                            {blockers.assets.length > 0 && (
                                <div>
                                    <p className="text-xs font-bold text-brand-dark/50 uppercase tracking-wider mb-2">Unreturned Assets ({blockers.assets.length})</p>
                                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                                        {blockers.assets.map(a => {
                                            const CatIcon  = CATEGORY_ICONS[a.category] || HiOutlineCube;
                                            const catColor = CATEGORY_COLORS[a.category] || 'bg-brand-cream/60 text-brand-dark/50';
                                            const effectiveStatus = a.display_status || a.status;
                                            return (
                                                <div key={a.id} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-brand-cream/20 border border-brand-cream/60">
                                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${catColor}`}><CatIcon size={13} /></div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-semibold text-brand-dark truncate">{a.asset_name || `Asset #${a.asset_id}`}</p>
                                                        {a.asset_no && <p className="text-[10px] font-mono text-brand-dark/40">{a.asset_no}</p>}
                                                    </div>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${effectiveStatus === 'Overdue' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{effectiveStatus}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {blockers.accessories.length > 0 && (
                                <div>
                                    <p className="text-xs font-bold text-brand-dark/50 uppercase tracking-wider mb-2">Unreturned Accessories ({blockers.accessories.length})</p>
                                    <div className="space-y-1.5 max-h-28 overflow-y-auto">
                                        {blockers.accessories.map(a => (
                                            <div key={a.id} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-brand-cream/20 border border-brand-cream/60">
                                                <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                                                    <TbTool size={13} className="text-amber-600" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-semibold text-brand-dark truncate">{a.accessory_name || `Accessory #${a.accessory_id}`}</p>
                                                    {a.asset_name && <p className="text-[10px] text-brand-dark/40 truncate">on: {a.asset_name}</p>}
                                                </div>
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{a.status || 'Assigned'}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button onClick={onClose} className="flex-1 py-2.5 bg-brand-cream/60 hover:bg-brand-cream text-brand-dark rounded-xl text-sm font-semibold transition">Understood</button>
                                <button onClick={() => navigate('/returns', { state: { preselectedUser: user } })}
                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-brand-green hover:bg-brand-green-dark text-brand-cream-light rounded-xl text-sm font-semibold transition">
                                    <TbArrowBackUp size={15} /> Check Returns
                                </button>
                            </div>
                        </>
                    )}

                    {!hasBlockers && (
                        <>
                            <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                                <FiAlertTriangle size={14} className="text-amber-500 mt-0.5 shrink-0" />
                                <p className="text-sm text-amber-700">All items have been returned. Deactivating this account will prevent the user from logging in. This can be reversed at any time.</p>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={onClose} className="flex-1 py-2.5 border border-brand-cream rounded-xl text-sm font-semibold text-brand-dark/60 hover:bg-brand-cream/30 transition">Cancel</button>
                                <button onClick={onConfirm} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition">
                                    <TbPower size={15} /> Deactivate
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default function UserViewModal() {
    const { id }   = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { list: users, saving }         = useSelector(s => s.users);
    const { list: allAssignments }        = useSelector(s => s.assignments);
    const { assignments: accAssignments } = useSelector(s => s.accessories);

    const [showDeactivate, setShowDeactivate] = useState(false);
    const [showEdit,       setShowEdit]       = useState(false);
    const [toast,          setToast]          = useState(null);

    useEffect(() => {
        dispatch(fetchUsers());
        dispatch(fetchAllAssignments());
        dispatch(fetchAccessoryAssignments());
    }, []);

    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 3500);
        return () => clearTimeout(t);
    }, [toast]);

    const user = safeList(users).find(u => String(u.id) === String(id));

    const userAssignments      = safeList(allAssignments).filter(a => String(a.assigned_to) === String(id));
    const activeAssignments    = userAssignments.filter(a => ['Assigned', 'Overdue'].includes(a.display_status || a.status));
    const activeAssetIds       = new Set(activeAssignments.map(a => a.asset_id));
    const userAccAssignments   = safeList(accAssignments).filter(a => activeAssetIds.has(a.asset_id) || String(a.assigned_to) === String(id));
    const activeAccAssignments = userAccAssignments.filter(a => !['Returned'].includes(a.status));

    const blockers    = { assets: activeAssignments, accessories: activeAccAssignments };

    const handleToggleStatus = () => {
        if (user.status === 'Active') {
            setShowDeactivate(true);
        } else {
            dispatch(updateUserStatus({ id: user.id, status: 'Active' }))
                .then(() => { dispatch(fetchUsers()); setToast({ message: 'User reactivated successfully.', type: 'success' }); });
        }
    };

    const handleConfirmDeactivate = async () => {
        await dispatch(updateUserStatus({ id: user.id, status: 'Inactive' }));
        dispatch(fetchUsers());
        setShowDeactivate(false);
        setToast({ message: 'User has been deactivated.', type: 'success' });
    };

    if (!user) return (
        <MainLayout title="User Details" subtitle="">
            <div className="py-20 text-center text-brand-dark/40">
                <FiUser size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">User not found.</p>
                <button onClick={() => navigate('/users')} className="mt-4 text-xs text-brand-green hover:underline">← Back to Users</button>
            </div>
        </MainLayout>
    );

    const fullName  = user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user.username;
    const userRoles = getRoles(user.roles);
    const isActive  = user.status === 'Active';

    return (
        <MainLayout title="User Details" subtitle={`Viewing profile for ${fullName}`}>

            {toast && (
                <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
                    ${toast.type === 'success' ? 'bg-brand-green text-brand-cream-light' : 'bg-red-600 text-white'}`}>
                    {toast.type === 'success' ? '✅' : '❌'} {toast.message}
                </div>
            )}

            <button onClick={() => navigate('/users')}
                className="flex items-center gap-1.5 text-sm text-brand-dark/40 hover:text-brand-dark mb-6 transition-colors group">
                <HiOutlineChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                Back to Users
            </button>

            {/* PROFILE CARD */}
            <div className="bg-white rounded-2xl border border-brand-cream/60 shadow-sm overflow-hidden mb-6">
                <div className={`px-8 py-6 flex items-center gap-5 ${isActive ? 'bg-brand-green-dark' : 'bg-brand-dark/80'}`}>
                    <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-brand-cream-light font-black text-3xl shrink-0">
                        {(user.first_name?.[0] || user.username?.[0] || '?').toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl font-bold text-brand-cream-light truncate">{fullName}</h1>
                        <p className="text-brand-cream/50 text-sm mt-0.5">@{user.username}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                {user.status || 'Active'}
                            </span>
                            {userRoles.map(r => (
                                <span key={r} className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${roleColors[r] || 'bg-white/10 text-brand-cream-light'}`}>{r}</span>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                            <p className="text-3xl font-black text-brand-cream-light">{activeAssignments.length}</p>
                            <p className="text-xs text-brand-cream/50 mt-0.5">Active assignments</p>
                        </div>
                        {Number(user.id) !== 999 && (
                            <button onClick={() => setShowEdit(true)}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition bg-white/10 hover:bg-white/20 text-brand-cream-light border border-white/20">
                                ✎ Edit
                            </button>
                        )}
                        <button onClick={handleToggleStatus} disabled={saving}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition disabled:opacity-50
                                ${isActive
                                    ? 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30'
                                    : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30'}`}>
                            <TbPower size={16} />
                            {isActive ? 'Deactivate' : 'Activate'}
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                        <InfoBlock label="User ID"     value={`#${user.id}`} mono />
                        <InfoBlock label="Employee ID" value={user.employee_id || '—'} mono />
                        <InfoBlock label="Email"       value={user.email} />
                        <InfoBlock label="Department"  value={user.department} />
                        <InfoBlock label="Designation" value={user.designation} />
                        <InfoBlock label="Created At"  value={fmtDate(user.created_at)} />
                    </div>
                    <div className="bg-brand-cream/20 rounded-xl p-4 border border-brand-cream/60 mb-4">
                        <p className="text-[10px] font-bold text-brand-dark/40 uppercase tracking-wider mb-2">Assigned Roles</p>
                        <div className="flex flex-wrap gap-2">
                            {userRoles.length > 0
                                ? userRoles.map(r => (
                                    <span key={r} className={`px-3 py-1.5 rounded-full text-sm font-semibold ${roleColors[r] || 'bg-brand-cream/60 text-brand-dark'}`}>{r}</span>
                                ))
                                : <span className="text-brand-dark/40 italic text-sm">No roles assigned</span>}
                        </div>
                    </div>
                </div>
            </div>

            {/* ASSET ASSIGNMENTS */}
            <div className="bg-white rounded-2xl border border-brand-cream/60 shadow-sm overflow-hidden mb-6">
                <div className="px-6 pt-6 pb-2">
                    <SectionHead icon={TbTransfer} title="Asset Assignments" count={userAssignments.length} />
                </div>
                {userAssignments.length === 0 ? (
                    <div className="pb-6"><EmptyState icon={MdOutlineAssignment} text="No asset assignments found for this user." /></div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-brand-cream/30 border-y border-brand-cream/60">
                                    {['Asset', 'Assigned Date', 'Expected Return', 'Condition', 'Status'].map(h => (
                                        <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-brand-dark/40 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-cream/30">
                                {userAssignments.map(a => {
                                    const effectiveStatus = a.display_status || a.status;
                                    const StatusIcon = assignmentStatusIcons[effectiveStatus] || TbCircleDot;
                                    const CatIcon    = CATEGORY_ICONS[a.category] || HiOutlineCube;
                                    const catColor   = CATEGORY_COLORS[a.category] || 'bg-brand-cream/60 text-brand-dark/50';
                                    return (
                                        <tr key={a.id} className={`transition-colors ${effectiveStatus === 'Overdue' ? 'bg-red-50/40 hover:bg-red-50' : 'hover:bg-brand-cream/20'}`}>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2.5">
                                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${catColor}`}><CatIcon size={14} /></div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-brand-dark truncate max-w-[130px]">{a.asset_name || '—'}</p>
                                                        <p className="text-[10px] font-mono text-brand-dark/40">{a.asset_no || `#${a.asset_id}`}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-1.5 text-sm text-brand-dark/60">
                                                    <FiCalendar size={11} className="text-brand-dark/30 shrink-0" />
                                                    {fmtDate(a.assignment_date)}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                {a.expected_return_date
                                                    ? <p className={`text-sm font-medium ${effectiveStatus === 'Overdue' ? 'text-red-600' : 'text-brand-dark/60'}`}>{fmtDate(a.expected_return_date)}</p>
                                                    : <span className="text-xs text-brand-dark/20">No date set</span>}
                                            </td>
                                            <td className="px-5 py-4">
                                                {a.condition_out
                                                    ? <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${conditionColors[a.condition_out] || 'bg-brand-cream/60 text-brand-dark/50'}`}>{a.condition_out}</span>
                                                    : <span className="text-xs text-brand-dark/20">—</span>}
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${assignmentStatusColors[effectiveStatus] || 'bg-brand-cream/60 text-brand-dark/50'}`}>
                                                    <StatusIcon size={11} /> {effectiveStatus}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ACCESSORY ASSIGNMENTS */}
            <div className="bg-white rounded-2xl border border-brand-cream/60 shadow-sm overflow-hidden mb-6">
                <div className="px-6 pt-6 pb-2">
                    <SectionHead icon={TbTool} title="Accessory Assignments" count={userAccAssignments.length} />
                </div>
                {userAccAssignments.length === 0 ? (
                    <div className="pb-6"><EmptyState icon={TbTool} text="No accessory assignments found for this user." /></div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-brand-cream/30 border-y border-brand-cream/60">
                                    {['Accessory', 'Assigned to Asset', 'Assigned Date', 'Status'].map(h => (
                                        <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-brand-dark/40 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-cream/30">
                                {userAccAssignments.map(a => (
                                    <tr key={a.id} className="hover:bg-brand-cream/20 transition-colors">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-xl bg-brand-green/10 flex items-center justify-center shrink-0">
                                                    <TbTool size={14} className="text-brand-green" />
                                                </div>
                                                <p className="text-sm font-semibold text-brand-dark truncate max-w-[130px]">{a.accessory_name || `#${a.accessory_id}`}</p>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <p className="text-sm text-brand-dark/60 truncate max-w-[130px]">{a.asset_name || '—'}</p>
                                            {a.asset_no && <p className="text-[10px] font-mono text-brand-dark/30">{a.asset_no}</p>}
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-1.5 text-sm text-brand-dark/60">
                                                <FiCalendar size={11} className="text-brand-dark/30 shrink-0" />
                                                {fmtDate(a.assigned_date)}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${assignmentStatusColors[a.status] || 'bg-brand-cream/60 text-brand-dark/50'}`}>
                                                {a.status || 'Assigned'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showDeactivate && (
                <DeactivateModal user={user} blockers={blockers} onConfirm={handleConfirmDeactivate} onClose={() => setShowDeactivate(false)} />
            )}

            {showEdit && (
                <EditUserModal
                    user={user}
                    onClose={() => setShowEdit(false)}
                    onSuccess={(msg) => setToast({ message: msg, type: 'success' })}
                />
            )}
        </MainLayout>
    );
}

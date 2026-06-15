import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx'; // Make sure to run: npm install xlsx

import MainLayout    from '../../components/layout/MainLayout';
import Pagination    from '../../components/common/Pagination';
import StatsCard     from '../../components/common/StatsCard';
import usePagination from '../../hooks/usePagination';

import {
    fetchUsers, registerUser, clearUserMessages,
} from '../../features/users/userSlice';
import { fetchDepartments }  from '../../features/departments/departmentSlice';
import { fetchDesignations } from '../../features/designations/designationSlice';

import { ROLES, getRoles, statusColors, roleColors } from './constants';
import Avatar        from './Avatar';
import RegisterModal from './RegisterModal';

// ── Toast ─────────────────────────────────────────────────
const Toast = ({ message, type }) => (
    <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3
        rounded-xl shadow-lg text-sm font-medium
        ${type === 'success' ? 'bg-brand-green text-brand-cream-light' : 'bg-red-600 text-white'}`}>
        {type === 'success' ? '✅' : '❌'} {message}
    </div>
);

// ── Bulk Import Modal ──────────────────────────────────────
const BulkImportModal = ({ onClose, onSuccess, departments, designations }) => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState([]);
    const [successCount, setSuccessCount] = useState(0);

    const handleUpload = async () => {
        if (!file) return;
        setLoading(true);
        setErrors([]);
        setSuccessCount(0);

        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const rawUsers = XLSX.utils.sheet_to_json(sheet);

            // Map string 'department' and 'designation' to their numeric IDs
            const mappedUsers = rawUsers.map(user => {
                let department_id = null;
                let designation_id = null;

                if (user.department) {
                    const dept = departments.find(d => d.name.toLowerCase().trim() === String(user.department).toLowerCase().trim());
                    if (dept) department_id = dept.id;
                }
                if (user.designation) {
                    const desig = designations.find(d => d.title.toLowerCase().trim() === String(user.designation).toLowerCase().trim());
                    if (desig) designation_id = desig.id;
                }

                return {
                    ...user,
                    department_id,
                    designation_id
                };
            });

            const token = localStorage.getItem('token'); 
            
            const res = await fetch(`${import.meta.env.VITE_API_URL}/users/bulk-upload`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ users: mappedUsers })
            });
            const result = await res.json();

            if (result.errors && result.errors.length > 0) {
                setErrors(result.errors);
            }
            if (result.successCount > 0) {
                setSuccessCount(result.successCount);
                onSuccess(); 
            }
        } catch (error) {
            console.error("Bulk upload failed:", error);
        }
        setLoading(false);
    };

    const handleDownloadErrors = () => {
        const worksheet = XLSX.utils.json_to_sheet(errors);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Errors");
        XLSX.writeFile(workbook, "User_Upload_Errors.xlsx");
    };

    return (
        <div className="fixed inset-0 bg-brand-dark/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-brand-dark">Bulk Import Users</h3>
                    <button onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-brand-dark/40 hover:bg-brand-cream/40 transition">
                        ✕
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="p-4 bg-brand-cream/20 border border-brand-cream rounded-lg">
                        <p className="text-sm text-brand-dark/70 mb-2">Upload an Excel file (.xlsx or .csv) containing the following columns:</p>
                        <p className="text-xs font-mono text-brand-dark/50 bg-white p-2 border border-brand-cream rounded">
                            username, email, employee_id, password, first_name, last_name, role, department, designation
                        </p>
                    </div>

                    <div>
                        <input 
                            type="file" 
                            accept=".xlsx, .xls, .csv"
                            onChange={e => setFile(e.target.files[0])}
                            className="w-full text-sm text-brand-dark/60 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-green/10 file:text-brand-green hover:file:bg-brand-green/20 cursor-pointer"
                        />
                    </div>

                    {successCount > 0 && (
                        <div className="p-3 bg-emerald-50 text-emerald-700 text-sm rounded-lg border border-emerald-200 font-semibold">
                            ✅ Successfully imported {successCount} users.
                        </div>
                    )}

                    {errors.length > 0 && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm font-semibold text-red-700 mb-2">Failed to import {errors.length} rows.</p>
                            <button 
                                onClick={handleDownloadErrors}
                                className="px-4 py-2 bg-white text-red-600 text-xs font-bold border border-red-200 rounded-md hover:bg-red-50 transition shadow-sm">
                                Download Error File
                            </button>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t border-brand-cream/40">
                        <button onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-brand-dark/60 bg-brand-cream/50 hover:bg-brand-cream rounded-lg transition">
                            Close
                        </button>
                        <button 
                            onClick={handleUpload} 
                            disabled={!file || loading}
                            className="px-5 py-2.5 text-sm font-semibold text-white bg-brand-green hover:bg-brand-green-dark disabled:opacity-50 rounded-lg transition shadow-sm flex items-center gap-2">
                            {loading ? 'Uploading...' : 'Upload'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ── Main Page ─────────────────────────────────────────────
export default function Users() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { list, loading, error, success } = useSelector(s => s.users);
    const { list: departments }             = useSelector(s => s.departments);
    const { list: designations }            = useSelector(s => s.designations);

    const [showRegister, setShowRegister] = useState(false);
    const [showBulkImport, setShowBulkImport] = useState(false);
    
    // Input states
    const [search,       setSearch]       = useState('');
    const [roleFilter,   setRoleFilter]   = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Applied states (trigger filtering only on submit)
    const [appliedSearch,       setAppliedSearch]       = useState('');
    const [appliedRoleFilter,   setAppliedRoleFilter]   = useState('');
    const [appliedStatusFilter, setAppliedStatusFilter] = useState('');

    useEffect(() => {
        dispatch(fetchUsers());
        dispatch(fetchDepartments());
        dispatch(fetchDesignations());
    }, []);

    useEffect(() => {
        if (!success && !error) return;
        if (success) { dispatch(fetchUsers()); setShowRegister(false); }
        const t = setTimeout(() => dispatch(clearUserMessages()), 3000);
        return () => clearTimeout(t);
    }, [success, error]);

    // Handlers for Submit and Clear
    const handleApplyFilters = () => {
        setAppliedSearch(search);
        setAppliedRoleFilter(roleFilter);
        setAppliedStatusFilter(statusFilter);
    };

    const handleClearFilters = () => {
        setSearch('');
        setRoleFilter('');
        setStatusFilter('');
        setAppliedSearch('');
        setAppliedRoleFilter('');
        setAppliedStatusFilter('');
    };

    const totalUsers    = list.length;
    const activeUsers   = list.filter(u => u.status === 'Active').length;
    const inactiveUsers = list.filter(u => u.status === 'Inactive').length;
    const adminUsers    = list.filter(u => getRoles(u.roles).includes('Admin')).length;

    // Filter uses the applied states instead of live input states
    const filtered = list.filter(u => {
        const name = `${u.first_name || ''} ${u.last_name || ''} ${u.username} ${u.email}`.toLowerCase();
        return (
            name.includes(appliedSearch.toLowerCase()) &&
            (appliedRoleFilter   ? getRoles(u.roles).includes(appliedRoleFilter) : true) &&
            (appliedStatusFilter ? u.status === appliedStatusFilter              : true)
        );
    });

    const {
        paginated, currentPage, totalPages,
        setCurrentPage, reset, startIndex, endIndex, totalItems,
    } = usePagination(filtered);

    // Reset pagination only when applied filters change
    useEffect(() => { reset(); }, [appliedSearch, appliedRoleFilter, appliedStatusFilter]);

    const selectCls = `px-3 py-2 rounded-lg border border-brand-cream bg-white text-sm
        text-brand-dark/70 focus:outline-none focus:ring-2 focus:ring-brand-green
        transition-colors duration-150`;

    return (
        <MainLayout title="Users" subtitle="Manage system users and roles">

            {(success || error) && (
                <Toast message={success || error} type={success ? 'success' : 'error'} />
            )}

            {/* ── Toolbar ── */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <div className="flex items-center gap-3 flex-wrap">
                    <input
                        placeholder="Search name, email, username..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleApplyFilters()}
                        className="px-4 py-2 rounded-lg border border-brand-cream bg-white text-sm w-72
                            focus:outline-none focus:ring-2 focus:ring-brand-green
                            placeholder:text-brand-dark/30 text-brand-dark transition-colors duration-150"
                    />
                    <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className={selectCls}>
                        <option value="">All Roles</option>
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={selectCls}>
                        <option value="">All Status</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
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

                    {(appliedSearch || appliedRoleFilter || appliedStatusFilter) && (
                        <span className="text-xs text-brand-dark/40">
                            {totalItems} result{totalItems !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => setShowBulkImport(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-brand-cream hover:bg-brand-cream-light text-brand-dark
                            text-sm font-semibold rounded-lg transition-colors duration-150 shadow-sm shrink-0">
                        Bulk Import
                    </button>
                    <button onClick={() => setShowRegister(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-brand-green hover:bg-brand-green-dark
                            text-brand-cream-light text-sm font-semibold rounded-lg transition-colors duration-150 shadow-sm shrink-0">
                        <span className="text-lg leading-none">+</span> Add User
                    </button>
                </div>
            </div>

            {/* ── Stats ── */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <StatsCard label="Total Users"    value={totalUsers}    icon="users"    color="green"
                    sub={`${departments.length} departments`} />
                <StatsCard label="Active Users"   value={activeUsers}   icon="active"   color="emerald"
                    sub={totalUsers > 0 ? `${Math.round((activeUsers / totalUsers) * 100)}% of total` : '—'} />
                <StatsCard label="Inactive Users" value={inactiveUsers} icon="inactive" color="red"
                    sub={totalUsers > 0 ? `${Math.round((inactiveUsers / totalUsers) * 100)}% of total` : '—'} />
                <StatsCard label="Admins"         value={adminUsers}    icon="admin"    color="purple"
                    sub="with Admin role" />
            </div>

            {/* ── Table ── */}
            <div className="bg-white rounded-2xl border border-brand-cream/60 shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="bg-brand-cream/30 border-b border-brand-cream/60">
                            {['User', 'Username', 'Email', 'Department', 'Designation', 'Role', 'Status', 'Action'].map(h => (
                                <th key={h}
                                    className="px-5 py-3.5 text-left text-xs font-semibold
                                        text-brand-dark/40 uppercase tracking-wider">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-brand-cream/30">
                        {loading ? (
                            <tr>
                                <td colSpan={8} className="px-6 py-12 text-center text-sm text-brand-dark/40">
                                    <svg className="animate-spin w-5 h-5 mx-auto mb-2 text-brand-green"
                                        fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10"
                                            stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Loading...
                                </td>
                            </tr>

                        ) : paginated.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-6 py-12 text-center text-sm text-brand-dark/40">
                                    No users found.
                                </td>
                            </tr>

                        ) : paginated.map(user => {
                            const fullName  = user.first_name
                                ? `${user.first_name} ${user.last_name || ''}`.trim()
                                : '—';
                            const userRoles = getRoles(user.roles);

                            return (
                                <tr key={user.id} className="hover:bg-brand-cream/20 transition-colors">

                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <Avatar name={user.first_name || user.username} />
                                            <span className="text-sm font-semibold text-brand-dark">{fullName}</span>
                                        </div>
                                    </td>

                                    <td className="px-5 py-4">
                                        <span className="text-xs font-mono text-brand-dark/50">@{user.username}</span>
                                    </td>

                                    <td className="px-5 py-4 text-sm text-brand-dark/60">{user.email}</td>

                                    <td className="px-5 py-4 text-sm text-brand-dark/60">{user.department || '—'}</td>

                                    <td className="px-5 py-4 text-sm text-brand-dark/60">{user.designation || '—'}</td>

                                    <td className="px-5 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {userRoles.length > 0
                                                ? userRoles.map(r => (
                                                    <span key={r}
                                                        className={`px-2 py-0.5 rounded-full text-xs font-semibold
                                                            ${roleColors[r] || 'bg-brand-cream/60 text-brand-dark/60'}`}>
                                                        {r}
                                                    </span>
                                                ))
                                                : <span className="text-brand-dark/30 text-xs">—</span>}
                                        </div>
                                    </td>

                                    <td className="px-5 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold
                                            ${statusColors[user.status] || 'bg-brand-cream/60 text-brand-dark/50'}`}>
                                            {user.status || 'Active'}
                                        </span>
                                    </td>

                                    <td className="px-5 py-4">
                                        <button
                                            onClick={() => navigate(`/users/${user.id}`)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold
                                                text-brand-green bg-brand-green/10 hover:bg-brand-green/20
                                                rounded-lg transition-colors duration-150">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                            View
                                        </button>
                                        <button
                                            onClick={async () => {
                                                if(window.confirm(`Reset password to 1234 for ${user.username}?`)) {
                                                    try {
                                                        const token = localStorage.getItem('token');
                                                        const res = await fetch(`${import.meta.env.VITE_API_URL}/users/${user.id}/reset-password`, {
                                                            method: 'POST',
                                                            headers: { 'Authorization': `Bearer ${token}` }
                                                        });
                                                        const data = await res.json();
                                                        if(data.success) alert('Password reset to 1234 successfully!');
                                                        else alert(data.message);
                                                    } catch(err) {
                                                        alert('Error resetting password');
                                                    }
                                                }
                                            }}
                                            className="flex items-center gap-1.5 mt-2 px-3 py-1.5 text-xs font-semibold
                                                text-orange-400 bg-red-50 hover:bg-red-100
                                                rounded-lg transition-colors duration-150">
                                            Reset Password
                                        </button>
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
                    Showing {startIndex}–{endIndex} of {totalItems} users
                </p>
            )}

            {showRegister && (
                <RegisterModal
                    onClose={() => setShowRegister(false)}
                    onSubmit={(formData) => dispatch(registerUser(formData))}
                    departments={departments}
                    designations={designations}
                    loading={loading}
                />
            )}

            {showBulkImport && (
                <BulkImportModal 
                    onClose={() => setShowBulkImport(false)}
                    onSuccess={() => dispatch(fetchUsers())}
                    departments={departments}
                    designations={designations}
                />
            )}

        </MainLayout>
    );
}
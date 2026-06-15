import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import MainLayout from '../components/layout/MainLayout';
import Pagination from '../components/common/Pagination';
import StatsCard  from '../components/common/StatsCard';
import usePagination from '../hooks/usePagination';
import {
  fetchUsers, registerUser, assignUserRole, clearUserMessages
} from '../features/users/userSlice';
import { fetchDepartments } from '../features/departments/departmentSlice';
import { fetchDesignations } from '../features/designations/designationSlice';

// ─── Helpers ──────────────────────────────────────────────
const ROLES = ['Admin', 'Manager', 'Engineer', 'Operator', 'Reporter', 'User'];

const getRoles = (roles) => {
  if (!roles) return [];
  if (Array.isArray(roles)) return roles;
  if (typeof roles === 'string') return roles.split(',').map(r => r.trim()).filter(Boolean);
  return [];
};

const statusColors = {
  Active:   'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
  Inactive: 'bg-red-100 text-red-700 ring-1 ring-red-200',
};

const roleColors = {
  Admin:    'bg-purple-100 text-purple-700',
  Manager:  'bg-blue-100 text-blue-700',
  Engineer: 'bg-cyan-100 text-cyan-700',
  Operator: 'bg-amber-100 text-amber-700',
  Reporter: 'bg-slate-100 text-slate-600',
  User:     'bg-slate-100 text-slate-600',
};

const Avatar = ({ name }) => (
  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center
                  text-blue-600 font-bold text-xs shrink-0">
    {(name?.[0] || '?').toUpperCase()}
  </div>
);

// ─── Toast ────────────────────────────────────────────────
const Toast = ({ message, type }) => (
  <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
    ${type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
    {type === 'success' ? '✅' : '❌'} {message}
  </div>
);

// ─── Modal Wrapper ────────────────────────────────────────
const Modal = ({ title, onClose, children, wide = false }) => (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
    <div className={`bg-white rounded-2xl shadow-2xl w-full p-8 ${wide ? 'max-w-2xl' : 'max-w-md'}`}>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        <button onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition">
          ✕
        </button>
      </div>
      {children}
    </div>
  </div>
);

// ─── User View Modal ──────────────────────────────────────
const UserViewModal = ({ user, onClose, onAssignRole }) => {
  if (!user) return null;

  const [selectedRole, setSelectedRole] = useState('');
  const userRoles = getRoles(user.roles);
  const fullName  = user.first_name
    ? `${user.first_name} ${user.last_name || ''}`.trim()
    : user.username;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">

        {/* Header */}
        <div className="bg-slate-900 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center
                              text-white font-bold text-2xl">
                {(user.first_name?.[0] || user.username?.[0] || '?').toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{fullName}</h2>
                <p className="text-slate-400 text-sm mt-0.5">@{user.username}</p>
              </div>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white transition">
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">User ID</p>
              <p className="text-sm font-bold text-slate-800 font-mono">#{user.id}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Status</p>
              <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold
                ${statusColors[user.status] || 'bg-slate-100 text-slate-500'}`}>
                {user.status || 'Active'}
              </span>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Email</p>
            <p className="text-sm font-bold text-slate-800">{user.email}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Department</p>
              <p className="text-sm font-bold text-slate-800">{user.department || '—'}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Designation</p>
              <p className="text-sm font-bold text-slate-800">{user.designation || '—'}</p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Roles</p>
            <div className="flex flex-wrap gap-2">
              {userRoles.length > 0
                ? userRoles.map(r => (
                    <span key={r} className={`px-2.5 py-1 rounded-full text-xs font-semibold
                      ${roleColors[r] || 'bg-slate-100 text-slate-600'}`}>
                      {r}
                    </span>
                  ))
                : <span className="text-slate-400 italic text-sm">No roles assigned</span>}
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Created At</p>
            <p className="text-sm font-bold text-slate-800">
              {user.created_at
                ? new Date(user.created_at).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'short', day: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })
                : '—'}
            </p>
          </div>

          {/* Assign Role */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Assign Role</p>
            <div className="flex gap-2">
              <select value={selectedRole}
                onChange={e => setSelectedRole(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select role...</option>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <button
                disabled={!selectedRole}
                onClick={() => { onAssignRole(user.id, selectedRole); setSelectedRole(''); }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300
                           text-white text-sm font-semibold rounded-lg transition disabled:cursor-not-allowed">
                Assign
              </button>
            </div>
          </div>

        </div>

        <div className="px-6 pb-6 pt-2">
          <button onClick={onClose}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Register Modal ───────────────────────────────────────
const RegisterModal = ({ onClose, onSubmit, departments, designations, loading }) => {
  const [form, setForm] = useState({
    username: '', email: '', password: '',
    first_name: '', last_name: '',
    department_id: '', designation_id: '',
    role: 'User',
  });

  const filteredDesignations = form.department_id
    ? designations.filter(d => d.department_id === parseInt(form.department_id))
    : designations;

  return (
    <Modal title="Register New User" onClose={onClose} wide>
      <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-4">

        <div className="grid grid-cols-2 gap-3">
          {[['first_name', 'First Name'], ['last_name', 'Last Name']].map(([k, l]) => (
            <div key={k}>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">{l}</label>
              <input value={form[k]}
                onChange={e => setForm({ ...form, [k]: e.target.value })}
                placeholder={l}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Username *</label>
          <input required value={form.username}
            onChange={e => setForm({ ...form, username: e.target.value })}
            placeholder="e.g. john_doe"
            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email *</label>
          <input required type="email" value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            placeholder="john@company.com"
            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password *</label>
          <input required type="password" value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            placeholder="••••••••"
            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Department</label>
            <select value={form.department_id}
              onChange={e => setForm({ ...form, department_id: e.target.value, designation_id: '' })}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select...</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Designation</label>
            <select value={form.designation_id}
              onChange={e => setForm({ ...form, designation_id: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select...</option>
              {filteredDesignations.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Role</label>
          <select value={form.role}
            onChange={e => setForm({ ...form, role: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500">
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold
                       text-slate-600 hover:bg-slate-50 transition">
            Cancel
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300
                       text-white rounded-lg text-sm font-semibold transition">
            {loading ? 'Creating...' : 'Create User'}
          </button>
        </div>

      </form>
    </Modal>
  );
};

// ─── Main Users Page ──────────────────────────────────────
export default function Users() {
  const dispatch = useDispatch();
  const { list, loading, error, success } = useSelector(state => state.users);
  const { list: departments }             = useSelector(state => state.departments);
  const { list: designations }            = useSelector(state => state.designations);

  const [showRegister, setShowRegister] = useState(false);
  const [viewUser,     setViewUser]     = useState(null);
  const [search,       setSearch]       = useState('');
  const [roleFilter,   setRoleFilter]   = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    dispatch(fetchUsers());
    dispatch(fetchDepartments());
    dispatch(fetchDesignations());
  }, []);

  useEffect(() => {
    if (success || error) {
      if (success) {
        dispatch(fetchUsers());
        setShowRegister(false);
        setViewUser(null);
      }
      const t = setTimeout(() => dispatch(clearUserMessages()), 3000);
      return () => clearTimeout(t);
    }
  }, [success, error]);

  const filtered = list.filter(u => {
    const name = `${u.first_name || ''} ${u.last_name || ''} ${u.username} ${u.email}`.toLowerCase();
    const matchSearch = name.includes(search.toLowerCase());
    const matchRole   = roleFilter   ? getRoles(u.roles).includes(roleFilter) : true;
    const matchStatus = statusFilter ? u.status === statusFilter               : true;
    return matchSearch && matchRole && matchStatus;
  });

  const {
    paginated, currentPage, totalPages,
    setCurrentPage, reset, startIndex, endIndex, totalItems
  } = usePagination(filtered);

  useEffect(() => { reset(); }, [search, roleFilter, statusFilter]);

  const handleAssignRole = async (id, role) => {
    await dispatch(assignUserRole({ id, role }));
    dispatch(fetchUsers());
  };

  // ✅ Stats calculations
  const totalUsers    = list.length;
  const activeUsers   = list.filter(u => u.status === 'Active').length;
  const inactiveUsers = list.filter(u => u.status === 'Inactive').length;
  const adminUsers    = list.filter(u => getRoles(u.roles).includes('Admin')).length;

  return (
    <MainLayout title="Users" subtitle="Manage system users and roles">

      {(success || error) && <Toast message={success || error} type={success ? 'success' : 'error'} />}

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <input
            placeholder="Search name, email, username..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm w-72
                       focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
          />
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-600">
            <option value="">All Roles</option>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-600">
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          {(search || roleFilter || statusFilter) && (
            <span className="text-xs text-slate-400">{totalItems} result{totalItems !== 1 ? 's' : ''}</span>
          )}
        </div>

        <button onClick={() => setShowRegister(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white
                     text-sm font-semibold rounded-lg transition shadow-sm">
          <span className="text-lg leading-none">+</span> Add User
        </button>
      </div>

      {/* ✅ StatsCard grid */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatsCard
          label="Total Users"
          value={totalUsers}
          icon="users"
          color="blue"
          sub={`${departments.length} departments`}
        />
        <StatsCard
          label="Active Users"
          value={activeUsers}
          icon="active"
          color="emerald"
          sub={totalUsers > 0 ? `${Math.round((activeUsers / totalUsers) * 100)}% of total` : '—'}
        />
        <StatsCard
          label="Inactive Users"
          value={inactiveUsers}
          icon="inactive"
          color="red"
          sub={totalUsers > 0 ? `${Math.round((inactiveUsers / totalUsers) * 100)}% of total` : '—'}
        />
        <StatsCard
          label="Admins"
          value={adminUsers}
          icon="admin"
          color="purple"
          sub="with Admin role"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {['User', 'Username', 'Email', 'Department', 'Designation', 'Role', 'Status', 'Action'].map(h => (
                <th key={h}
                  className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-sm text-slate-400">
                  <svg className="animate-spin w-5 h-5 mx-auto mb-2 text-blue-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Loading...
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-sm text-slate-400">
                  No users found.
                </td>
              </tr>
            ) : paginated.map(user => {
              const fullName  = user.first_name
                ? `${user.first_name} ${user.last_name || ''}`.trim()
                : '—';
              const userRoles = getRoles(user.roles);

              return (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">

                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={user.first_name || user.username} />
                      <span className="text-sm font-semibold text-slate-800">{fullName}</span>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <span className="text-xs font-mono text-slate-500">@{user.username}</span>
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-600">{user.email}</td>

                  <td className="px-5 py-4 text-sm text-slate-600">{user.department || '—'}</td>

                  <td className="px-5 py-4 text-sm text-slate-600">{user.designation || '—'}</td>

                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1">
                      {userRoles.length > 0
                        ? userRoles.map(r => (
                            <span key={r} className={`px-2 py-0.5 rounded-full text-xs font-semibold
                              ${roleColors[r] || 'bg-slate-100 text-slate-600'}`}>
                              {r}
                            </span>
                          ))
                        : <span className="text-slate-400 text-xs">—</span>}
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold
                      ${statusColors[user.status] || 'bg-slate-100 text-slate-500'}`}>
                      {user.status || 'Active'}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <button onClick={() => setViewUser(user)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold
                                 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View
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
        <p className="text-xs text-slate-400 mt-3 px-1">
          Showing {startIndex}–{endIndex} of {totalItems} users
        </p>
      )}

      {viewUser && (
        <UserViewModal
          user={viewUser}
          onClose={() => setViewUser(null)}
          onAssignRole={handleAssignRole}
        />
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

    </MainLayout>
  );
}

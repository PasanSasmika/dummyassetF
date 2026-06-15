import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateUser, assignUserRole, fetchUsers } from '../../features/users/userSlice';
import { fetchDepartments } from '../../features/departments/departmentSlice';
import { fetchDesignations } from '../../features/designations/designationSlice';
import { ROLES } from './constants';

export default function EditUserModal({ user, onClose, onSuccess }) {
    const dispatch = useDispatch();
    const { saving } = useSelector(s => s.users);
    const { list: departments } = useSelector(s => s.departments);
    const { list: designations } = useSelector(s => s.designations);

    const currentRole = user.roles ? user.roles.split(',')[0].trim() : 'User';

    const [form, setForm] = useState({
        first_name:     user.first_name || '',
        last_name:      user.last_name  || '',
        email:          user.email      || '',
        department_id:  user.department_id  || '',
        designation_id: user.designation_id || '',
        role:           currentRole,
    });
    const [error, setError] = useState('');

    useEffect(() => {
        if (!departments.length) dispatch(fetchDepartments());
        if (!designations.length) dispatch(fetchDesignations());
    }, []);

    const filteredDesignations = form.department_id
        ? designations.filter(d => String(d.department_id) === String(form.department_id))
        : designations;

    const field = (key, val) => setForm(f => ({ ...f, [key]: val }));

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        try {
            await dispatch(updateUser({
                id: user.id,
                data: {
                    first_name:     form.first_name,
                    last_name:      form.last_name,
                    email:          form.email,
                    department_id:  form.department_id  || null,
                    designation_id: form.designation_id || null,
                },
            })).unwrap();

            if (form.role !== currentRole) {
                await dispatch(assignUserRole({ id: user.id, role: form.role })).unwrap();
            }

            await dispatch(fetchUsers());
            onSuccess('User updated successfully.');
            onClose();
        } catch (err) {
            setError(err || 'Failed to update user.');
        }
    }

    const inputCls = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 bg-white';
    const labelCls = 'block text-xs font-semibold text-gray-600 mb-1';

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                    <div>
                        <h3 className="text-base font-bold text-gray-800">Edit User</h3>
                        <p className="text-xs text-gray-400 mt-0.5">@{user.username}</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition text-lg">
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Name row */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelCls}>First Name</label>
                            <input className={inputCls} value={form.first_name} onChange={e => field('first_name', e.target.value)} placeholder="First name" />
                        </div>
                        <div>
                            <label className={labelCls}>Last Name</label>
                            <input className={inputCls} value={form.last_name} onChange={e => field('last_name', e.target.value)} placeholder="Last name" />
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label className={labelCls}>Email</label>
                        <input type="email" className={inputCls} value={form.email} onChange={e => field('email', e.target.value)} placeholder="Email address" required />
                    </div>

                    {/* Department */}
                    <div>
                        <label className={labelCls}>Department</label>
                        <select className={inputCls} value={form.department_id} onChange={e => { field('department_id', e.target.value); field('designation_id', ''); }}>
                            <option value="">— Select department —</option>
                            {departments.map(d => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Designation */}
                    <div>
                        <label className={labelCls}>Designation</label>
                        <select className={inputCls} value={form.designation_id} onChange={e => field('designation_id', e.target.value)}>
                            <option value="">— Select designation —</option>
                            {filteredDesignations.map(d => (
                                <option key={d.id} value={d.id}>{d.title}</option>
                            ))}
                        </select>
                    </div>

                    {/* Role */}
                    <div>
                        <label className={labelCls}>Role</label>
                        <select className={inputCls} value={form.role} onChange={e => field('role', e.target.value)}>
                            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>

                    {error && (
                        <p className="text-xs text-red-500 font-medium bg-red-50 px-3 py-2 rounded-lg">{error}</p>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
                            Cancel
                        </button>
                        <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-green-700 hover:bg-green-800 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50">
                            {saving ? 'Saving…' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

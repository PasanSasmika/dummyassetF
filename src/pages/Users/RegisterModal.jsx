import { useState } from 'react';
import { ROLES } from './constants';

export default function RegisterModal({ onClose, onSubmit, departments, designations, loading }) {
    const [form, setForm] = useState({
        username:       '',
        email:          '',
        employee_id:    '',
        password:       '',
        first_name:     '',
        last_name:      '',
        department_id:  '',
        designation_id: '',
        role:           'User',
    });

    const filteredDesignations = form.department_id
        ? designations.filter(d => d.department_id === parseInt(form.department_id))
        : designations;

    const field = (key, value) => setForm(f => ({ ...f, [key]: value }));

    // Check if password should be shown
    const isAdmin = form.role === 'Admin';

    // Optional: clear password when switching away from Admin
    const handleRoleChange = (e) => {
        const newRole = e.target.value;
        field('role', newRole);
        if (newRole !== 'Admin') {
            field('password', ''); // reset password when hiding
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8">

                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-900">Register New User</h3>
                    <button 
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition"
                    >
                        ✕
                    </button>
                </div>

                <form 
                    onSubmit={e => {
                        e.preventDefault();
                        // Optional: prevent sending empty password for non-admin
                        if (!isAdmin) {
                            const { password, ...formWithoutPassword } = form;
                            onSubmit(formWithoutPassword);
                        } else {
                            onSubmit(form);
                        }
                    }} 
                    className="space-y-4"
                >

                    {/* Name row */}
                    <div className="grid grid-cols-2 gap-3">
                        {[['first_name', 'First Name'], ['last_name', 'Last Name']].map(([k, l]) => (
                            <div key={k}>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">{l}</label>
                                <input
                                    value={form[k]}
                                    onChange={e => field(k, e.target.value)}
                                    placeholder={l}
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        ))}
                    </div>

                    {/* Username */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Username *</label>
                        <input
                            required
                            value={form.username}
                            onChange={e => field('username', e.target.value)}
                            placeholder="e.g. john_doe"
                            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email *</label>
                        <input
                            required
                            type="email"
                            value={form.email}
                            onChange={e => field('email', e.target.value)}
                            placeholder="john@company.com"
                            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Employee ID */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                            Employee ID <span className="text-red-600">*</span>
                        </label>
                        <input
                            required
                            value={form.employee_id}
                            onChange={e => field('employee_id', e.target.value.trim())}
                            placeholder="e.g. SG2025001  or  EMP-78412"
                            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                                        {/* Role Selector – moved up as requested */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Role *</label>
                        <select
                            required
                            value={form.role}
                            onChange={handleRoleChange}
                            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {ROLES.map(r => (
                                <option key={r} value={r}>{r}</option>
                            ))}
                        </select>
                    </div>


                    {/* ── CONDITIONAL PASSWORD FIELD ── */}
                    {isAdmin && (
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password *</label>
                            <input
                                required={isAdmin}   // only required when visible
                                type="password"
                                value={form.password}
                                onChange={e => field('password', e.target.value)}
                                placeholder="••••••••"
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    )}

                    {/* Department + Designation */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Department</label>
                            <select
                                value={form.department_id}
                                onChange={e => {
                                    field('department_id', e.target.value);
                                    field('designation_id', '');
                                }}
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Select...</option>
                                {departments.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Designation</label>
                            <select
                                value={form.designation_id}
                                onChange={e => field('designation_id', e.target.value)}
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Select...</option>
                                {filteredDesignations.map(d => (
                                    <option key={d.id} value={d.id}>{d.title}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition"
                        >
                            {loading ? 'Creating...' : 'Create User'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}

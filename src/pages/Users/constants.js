export const ROLES = ['Admin'];

export const getRoles = (roles) => {
    if (!roles) return [];
    if (Array.isArray(roles)) return roles;
    if (typeof roles === 'string') return roles.split(',').map(r => r.trim()).filter(Boolean);
    return [];
};

export const statusColors = {
    Active:   'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
    Inactive: 'bg-red-100 text-red-700 ring-1 ring-red-200',
};

export const roleColors = {
    Admin:    'bg-purple-100 text-purple-700',
    Manager:  'bg-blue-100 text-blue-700',
    Engineer: 'bg-cyan-100 text-cyan-700',
    Operator: 'bg-amber-100 text-amber-700',
    Reporter: 'bg-slate-100 text-slate-600',
    User:     'bg-slate-100 text-slate-600',
};

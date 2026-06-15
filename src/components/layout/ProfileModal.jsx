// src/components/common/ProfileModal.jsx
import {
  HiOutlineX,
  HiOutlineUser,
  HiOutlineMail,
  HiOutlineOfficeBuilding,
  HiOutlineBriefcase,
  HiOutlineShieldCheck,
  HiOutlineCalendar,
  HiOutlineIdentification,
} from 'react-icons/hi';
import { TbCircleCheck, TbCircleX } from 'react-icons/tb';

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

const getUserRoles = (user) => {
  const v = user?.roles;
  if (!v) return [];
  if (Array.isArray(v)) return v.map(r => (typeof r === 'string' ? r.trim() : String(r || ''))).filter(Boolean);
  if (typeof v === 'string') return v.split(',').map(r => r.trim()).filter(Boolean);
  try {
    return String(v || '').split(',').map(r => r.trim()).filter(Boolean);
  } catch {
    return [];
  }
};

const ROLE_COLORS = {
  Admin: 'bg-red-100 text-red-800 border border-red-200',
  Manager: 'bg-amber-100 text-amber-800 border border-amber-200',
  User: 'bg-blue-100 text-blue-800 border border-blue-200',
  // You can add more roles or keep dynamic fallback
};

export default function ProfileModal({ user, isOpen, onClose }) {
  if (!isOpen || !user) return null;

  const userRoles = getUserRoles(user);
  const isActive = user.status === 'Active' || !user.status; // treat unset as active

  const initials = [user.first_name?.[0], user.last_name?.[0]]
    .filter(Boolean)
    .join('')
    .toUpperCase() || (user.username?.[0] || 'U').toUpperCase();

  const fullName = user.first_name && user.last_name
    ? `${user.first_name} ${user.last_name}`
    : user.username || 'User';

  const rows = [
    { icon: HiOutlineUser, label: 'Full Name', value: fullName },
    { icon: HiOutlineMail, label: 'Email', value: user.email, mono: false, breakAll: true },
    { icon: HiOutlineIdentification, label: 'Employee ID', value: user.employee_id, mono: true },
    { icon: HiOutlineOfficeBuilding, label: 'Department', value: user.department },
    { icon: HiOutlineBriefcase, label: 'Designation', value: user.designation },
    { icon: HiOutlineCalendar, label: 'Member Since', value: fmtDate(user.created_at) },
  ];

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        className={`
          bg-white rounded-2xl shadow-2xl w-full 
          max-w-xl sm:max-w-3xl md:max-w-4xl lg:max-w-5xl 
          overflow-hidden
        `}
        onClick={e => e.stopPropagation()}
      >
        {/* Header – using your brand-green-dark */}
        <div className="relative bg-brand-green-dark px-6 sm:px-8 pt-8 pb-6 overflow-hidden">
          {/* Decorative blobs – softer green tones */}
          <div className="absolute -top-6 -right-6 w-48 h-48 sm:w-64 sm:h-64 bg-brand-green/30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 sm:w-56 sm:h-56 bg-brand-cream/20 rounded-full blur-3xl pointer-events-none" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 sm:top-5 sm:right-6 w-9 h-9 flex items-center justify-center rounded-lg text-brand-cream-light/70 hover:text-brand-cream-light bg-black/20 transition"
          >
            <HiOutlineX size={20} />
          </button>

          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-brand-green/30 border border-brand-green/40 flex items-center justify-center text-3xl sm:text-4xl font-black text-brand-green">
                {initials}
              </div>
              <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-brand-green-dark ${isActive ? 'bg-emerald-400' : 'bg-gray-500'}`} />
            </div>

            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-black text-brand-cream-light truncate">{fullName}</h2>
              <p className="text-base sm:text-lg text-brand-cream-light/70 mt-1">@{user.username || '—'}</p>

              <div
                className={`inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full text-sm font-bold ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                    : 'bg-gray-600/30 text-gray-300 border border-gray-500/40'
                }`}
              >
                {isActive ? <TbCircleCheck size={14} /> : <TbCircleX size={14} />}
                {user.status || 'Active'}
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 sm:px-8 py-6 sm:py-7 space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
            {rows.map(({ icon: Icon, label, value, mono, breakAll }) => (
              <div key={label} className="flex items-center gap-4 py-3 border-b border-brand-cream/40 last:border-0 md:last:border-b">
                <div className="w-10 h-10 rounded-xl bg-brand-offwhite border border-brand-cream flex items-center justify-center shrink-0">
                  <Icon size={18} className="text-brand-green-dark/70" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-brand-dark/60 uppercase tracking-wide">{label}</p>
                  <p
                    className={`text-sm sm:text-base font-semibold text-brand-dark mt-1 ${
                      mono ? 'font-mono' : ''
                    } ${breakAll ? 'break-all' : 'truncate'}`}
                  >
                    {value || <span className="text-brand-dark/40 italic">Not set</span>}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Roles */}
          <div className="flex items-start gap-4 py-4 border-b border-brand-cream/40 md:border-0">
            <div className="w-10 h-10 rounded-xl bg-brand-offwhite border border-brand-cream flex items-center justify-center shrink-0 mt-0.5">
              <HiOutlineShieldCheck size={18} className="text-brand-green-dark/70" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-brand-dark/60 uppercase tracking-wide mb-2">Roles</p>
              <div className="flex flex-wrap gap-2">
                {userRoles.length > 0 ? (
                  userRoles.map(role => (
                    <span
                      key={role}
                      className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${
                        ROLE_COLORS[role] ||
                        'bg-brand-cream text-brand-green-dark border border-brand-cream-light'
                      }`}
                    >
                      {role}
                    </span>
                  ))
                ) : (
                  <span className="text-sm italic text-brand-dark/50">No roles assigned</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 sm:px-8 py-5 bg-brand-offwhite border-t border-brand-cream flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl border border-brand-cream bg-white hover:bg-brand-cream-light text-sm font-semibold text-brand-dark transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

import {
  HiOutlineUsers,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineShieldCheck,
  HiOutlineCube,
  HiOutlineOfficeBuilding,
  HiOutlineTicket,
  HiOutlineUserGroup,
  HiOutlineCog,
  HiOutlineChartBar,
  HiOutlineClipboardList,
  HiOutlineBell,
  HiOutlineKey,
} from 'react-icons/hi';
import { HiOutlineExclamationTriangle } from "react-icons/hi2";
import {
  MdOutlineCategory,
  MdOutlineInventory2,
} from 'react-icons/md';
import { BsShieldLock } from 'react-icons/bs';

// ─── Icon Map ─────────────────────────────────────────────
const icons = {
  users:       <HiOutlineUsers           className="w-5 h-5" />,
  active:      <HiOutlineCheckCircle     className="w-5 h-5" />,
  inactive:    <HiOutlineXCircle         className="w-5 h-5" />,
  admin:       <HiOutlineShieldCheck     className="w-5 h-5" />,
  assets:      <HiOutlineCube            className="w-5 h-5" />,
  departments: <HiOutlineOfficeBuilding  className="w-5 h-5" />,
  warning:     <HiOutlineExclamationTriangle className="w-5 h-5" />,
  ticket:      <HiOutlineClipboardList   className="w-5 h-5" />,
  group:       <HiOutlineUserGroup       className="w-5 h-5" />,
  settings:    <HiOutlineCog             className="w-5 h-5" />,
  chart:       <HiOutlineChartBar        className="w-5 h-5" />,
  bell:        <HiOutlineBell            className="w-5 h-5" />,
  key:         <HiOutlineKey             className="w-5 h-5" />,
  category:    <MdOutlineCategory        className="w-5 h-5" />,
  inventory:   <MdOutlineInventory2      className="w-5 h-5" />,
  shield:      <BsShieldLock             className="w-5 h-5" />,
};

// ─── Color Map ────────────────────────────────────────────
const colorMap = {
  // ── Brand colors ──────────────────────────────────────
  green: {
    card:  'bg-white border border-brand-green/20',
    icon:  'bg-brand-green/10 text-brand-green',
    value: 'text-brand-green-dark',
    label: 'text-brand-dark/60',
    trend: 'text-brand-green',
  },
  forest: {
    // deep green — great for "total assets", primary KPIs
    card:  'bg-brand-green-dark border border-brand-green-dark',
    icon:  'bg-white/10 text-brand-cream-light',
    value: 'text-brand-cream-light',
    label: 'text-brand-cream/60',
    trend: 'text-brand-cream',
  },
  cream: {
    // warm neutral — good for secondary/informational stats
    card:  'bg-brand-cream border border-brand-cream',
    icon:  'bg-brand-green/15 text-brand-green-dark',
    value: 'text-brand-dark',
    label: 'text-brand-dark/60',
    trend: 'text-brand-green',
  },

  // ── Standard colors (kept for backward compat) ────────
  blue: {
    card:  'bg-white border border-blue-100',
    icon:  'bg-blue-100 text-blue-600',
    value: 'text-blue-700',
    label: 'text-slate-500',
    trend: 'text-blue-500',
  },
  emerald: {
    card:  'bg-white border border-emerald-100',
    icon:  'bg-emerald-100 text-emerald-600',
    value: 'text-emerald-700',
    label: 'text-slate-500',
    trend: 'text-emerald-500',
  },
  red: {
    card:  'bg-white border border-red-100',
    icon:  'bg-red-100 text-red-600',
    value: 'text-red-700',
    label: 'text-slate-500',
    trend: 'text-red-500',
  },
  purple: {
    card:  'bg-white border border-purple-100',
    icon:  'bg-purple-100 text-purple-600',
    value: 'text-purple-700',
    label: 'text-slate-500',
    trend: 'text-purple-500',
  },
  amber: {
    card:  'bg-white border border-amber-100',
    icon:  'bg-amber-100 text-amber-600',
    value: 'text-amber-700',
    label: 'text-slate-500',
    trend: 'text-amber-500',
  },
  cyan: {
    card:  'bg-white border border-cyan-100',
    icon:  'bg-cyan-100 text-cyan-600',
    value: 'text-cyan-700',
    label: 'text-slate-500',
    trend: 'text-cyan-500',
  },
  slate: {
    card:  'bg-white border border-slate-200',
    icon:  'bg-slate-100 text-slate-600',
    value: 'text-slate-700',
    label: 'text-slate-500',
    trend: 'text-slate-500',
  },
};

// ─── Component ────────────────────────────────────────────
export default function StatsCard({
  label,
  value,
  icon  = 'users',
  color = 'green',
  trend = null,
  sub   = null,
}) {
  const c = colorMap[color] || colorMap.green;

  return (
    <div className={`rounded-2xl p-5 shadow-sm ${c.card}`}>

      {/* Top row — icon + label + trend */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.icon}`}>
            {icons[icon] || icons.users}
          </div>
          <p className={`text-sm font-medium ${c.label}`}>{label}</p>
        </div>

        {trend && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-lg bg-black/5 ${c.trend}`}>
            {trend}
          </span>
        )}
      </div>

      {/* Value */}
      <p className={`text-3xl font-black tracking-tight ${c.value}`}>{value}</p>

      {/* Sub */}
      {sub && (
        <p className={`text-xs mt-1 ${c.label}`}>{sub}</p>
      )}

    </div>
  );
}

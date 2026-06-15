import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useState } from 'react';

import {
  HiOutlineCube,
  HiOutlineUsers,
  HiOutlineOfficeBuilding,
  HiOutlineLogout,
  HiOutlineChevronRight,
  HiOutlineChevronDown,
  HiOutlineCollection,
  HiOutlineClipboardList,
  HiOutlineClock,
  HiOutlineCog,
  HiOutlineShieldCheck,
} from 'react-icons/hi';

import { MdOutlineAssignment } from 'react-icons/md';
import { TbShieldCheck, TbLayoutDashboard, TbArrowBackUp, TbDoor } from 'react-icons/tb';


/* ───────────── NAV GROUPS ───────────── */

const NAV_GROUPS = [
  {
    label: 'Main Menu',
    links: [
      { to: '/dashboard',   label: 'Dashboard',      end: true, icon: TbLayoutDashboard,      key: 'dashboard' },
      { to: '/assets',      label: 'Assets',                    icon: HiOutlineCube,           key: 'assets' },
      { to: '/salvaged',    label: 'Salvaged Assets',           icon: HiOutlineCollection,     key: 'salvaged' },
      { to: '/assignments',    label: 'Assignments',    icon: MdOutlineAssignment, key: 'assignments' },
      { to: '/return-history', label: 'Return History', icon: TbArrowBackUp,       key: 'return-history' },
      { to: '/gate-passes',   label: 'Gate Passes',   icon: TbDoor,              key: 'gate-passes' },
      { to: '/history',        label: 'History',        icon: HiOutlineClock,      key: 'history' },
      { to: '/repairs',     label: 'Repairs',                   icon: TbShieldCheck,           key: 'repairs' },
      {
        label: 'Components',
        icon: HiOutlineCollection,
        key: 'components',
        children: [
          { to: '/locations',     label: 'Locations' },
          { to: '/sub-locations', label: 'Sub Locations' },
          { to: '/asset-types',   label: 'Asset Types' },
          { to: '/accessories',   label: 'Accessories' },
        ],
      },
    ],
  },
  {
    label: 'Administration',
    links: [
      { to: '/users',          label: 'User Management', icon: HiOutlineUsers,          key: 'users' },
      { to: '/departments',    label: 'Teams & Roles',   icon: HiOutlineOfficeBuilding, key: 'departments' },
      { to: '/audit',          label: 'Audit Log',       icon: HiOutlineClipboardList,  key: 'audit' },
      { to: '/settings',       label: 'Settings',        icon: HiOutlineCog,            key: 'settings' },
      { to: '/sidebar-access', label: 'Panel Access',    icon: HiOutlineShieldCheck,    key: 'sidebar-access', superAdminOnly: true },
    ],
  },
];


/* ───────────── NAV ITEM ───────────── */

const NavItem = ({ link }) => {
  const Icon = link.icon;

  return (
    <NavLink to={link.to} end={link.end}>
      {({ isActive }) => (
        <span
          className={`flex items-center justify-between px-3 py-2.5 rounded-xl
          text-sm font-medium transition-all duration-150 cursor-pointer
          ${
            isActive
              ? 'bg-brand-cream text-brand-dark shadow-md shadow-black/25'
              : 'text-brand-cream-light hover:bg-white/10 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-3">
            <span
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-150
              ${isActive ? 'bg-brand-green/20 text-brand-dark' : 'bg-black/20 text-brand-cream-light'}`}
            >
              <Icon size={17} />
            </span>
            {link.label}
          </span>
        </span>
      )}
    </NavLink>
  );
};


/* ───────────── SUB MENU ───────────── */

const NavDropdown = ({ link }) => {
  const Icon = link.icon;
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl
        text-sm font-medium text-brand-cream-light hover:bg-white/10 hover:text-white
        transition-all duration-150"
      >
        <span className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-black/20 text-brand-cream-light">
            <Icon size={17} />
          </span>
          {link.label}
        </span>
        {open
          ? <HiOutlineChevronDown size={14} />
          : <HiOutlineChevronRight size={14} />
        }
      </button>

      {open && (
        <div className="ml-11 mt-1 space-y-1">
          {link.children.map((child) => (
            <NavLink
              key={child.to}
              to={child.to}
              className={({ isActive }) =>
                `block text-sm px-3 py-1.5 rounded-lg transition
                ${isActive
                  ? 'text-brand-cream-light font-semibold'
                  : 'text-brand-cream hover:text-white'
                }`
              }
            >
              {child.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
};


/* ───────────── SIDEBAR ───────────── */

export default function Sidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const isSuperAdmin = user?.is_super_admin === true;
  const sidebarAccess = user?.sidebar_access || [];

  const canAccess = (link) => {
    if (link.superAdminOnly) return isSuperAdmin;
    if (isSuperAdmin) return true;
    return sidebarAccess.includes(link.key);
  };

  return (
    <aside className="fixed top-0 left-0 bottom-0 w-60 bg-brand-green-dark flex flex-col z-40 border-r border-black/25">

      {/* LOGO SECTION */}
      <div className="flex items-center gap-3 px-4 h-20 border-b border-black/20 shrink-0">
        <div className="w-10 h-10 bg-brand-green-dark flex items-center justify-center overflow-hidden shrink-0">
        </div>
        <div className="min-w-0">
          <span className="block font-semibold text-brand-cream-light text-lg tracking-tight truncate">
            VogueStock
          </span>
          <p className="text-[8px] text-brand-cream/60 font-bold uppercase tracking-[0.2em] -mt-1">
            Management
          </p>
        </div>
      </div>

      {/* NAVIGATION */}
      <nav
        className="flex-1 px-3 py-4 space-y-5 overflow-y-auto"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {NAV_GROUPS.map((group) => {
          const visibleLinks = group.links.filter(canAccess);
          if (visibleLinks.length === 0) return null;
          return (
            <div key={group.label}>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-3 mb-2">
                {group.label}
              </p>
              <div className="space-y-1">
                {visibleLinks.map((link) =>
                  link.children
                    ? <NavDropdown key={link.label} link={link} />
                    : <NavItem key={link.to} link={link} />
                )}
              </div>
            </div>
          );
        })}
      </nav>

      {/* USER & FOOTER SECTION */}
      <div className="px-3 pb-4 border-t border-white/10 pt-3 shrink-0 bg-black/5">
        <div className="px-2 space-y-1">
          <p className="text-[8px] text-brand-cream/20 uppercase tracking-widest leading-tight text-center pt-1">
            Powered by Vogue Software Solutions<br/>
            <span className="text-brand-cream/30 gap-y-5">v 1.0.1</span>
          </p>
        </div>
      </div>

      <style>{`aside nav::-webkit-scrollbar { display: none; }`}</style>
    </aside>
  );
}

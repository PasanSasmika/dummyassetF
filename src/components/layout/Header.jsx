// src/components/layout/Header.jsx  (or wherever your Header is)
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { LuRefreshCcw } from "react-icons/lu";

import ProfileModal from './ProfileModal';  
import { useNavigate } from 'react-router-dom';
import { logout } from '../../features/auth/authSlice';
import { HiOutlineLogout } from 'react-icons/hi';

export default function Header({ title, subtitle }) {
  const { user } = useSelector(state => state.auth);
  const [showProfile, setShowProfile] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <>
      <header className="h-16 bg-brand-offwhite border-b border-brand-cream flex items-center justify-between px-8">
        <div>
          <h1 className="text-lg font-bold text-brand-dark tracking-tight">{title}</h1>
          {subtitle && <p className="text-xs text-brand-dark/40">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-4">
          {/* Icons */}
          <div className="flex items-center gap-10 text-brand-dark/40 text-lg mr-10">
            <LuRefreshCcw 
              onClick={() => window.location.reload()} 
              className="cursor-pointer hover:text-brand-green transition-colors duration-150" 
              title="Refresh System"
            />
            <HiOutlineLogout onClick={handleLogout} className="cursor-pointer text-red-700 hover:text-brand-green transition-colors duration-150" />
          </div>

          {/* Greeting */}
          <span className="text-sm text-brand-dark/50">
            {greeting()},{' '}
            <span className="font-semibold text-brand-dark">
              {user?.first_name || user?.username || 'User'}
            </span>
          </span>

          {/* Avatar – clickable */}
          <button
            onClick={() => setShowProfile(true)}
            className="w-8 h-8 rounded-full bg-brand-green-dark flex items-center justify-center text-brand-cream-light text-sm font-bold hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-brand-green focus:ring-offset-2"
            title="View Profile"
          >
            {(user?.first_name?.[0] || user?.username?.[0] || 'U').toUpperCase()}
          </button>
        </div>
      </header>

      {/* Profile Modal */}
      <ProfileModal
        user={user}
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
      />
    </>
  );
}

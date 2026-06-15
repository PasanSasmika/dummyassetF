import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { HiOutlineShieldCheck, HiOutlineUser, HiOutlineCheck } from 'react-icons/hi';
import MainLayout from '../../components/layout/MainLayout';
import API from '../../api/axios';

/* ── All controllable panel keys with labels ── */
const ALL_PANELS = [
  { key: 'dashboard',   label: 'Dashboard',       group: 'Main Menu' },
  { key: 'assets',      label: 'Assets',           group: 'Main Menu' },
  { key: 'salvaged',    label: 'Salvaged Assets',  group: 'Main Menu' },
  { key: 'assignments', label: 'Assignments',      group: 'Main Menu' },
  { key: 'history',     label: 'History',          group: 'Main Menu' },
  { key: 'repairs',     label: 'Repairs',          group: 'Main Menu' },
  { key: 'components',  label: 'Components',       group: 'Main Menu' },
  { key: 'users',       label: 'User Management',  group: 'Administration' },
  { key: 'departments', label: 'Teams & Roles',    group: 'Administration' },
  { key: 'audit',       label: 'Audit Log',        group: 'Administration' },
  { key: 'settings',    label: 'Settings',         group: 'Administration' },
];

const GROUPS = ['Main Menu', 'Administration'];

export default function SidebarAccessPage() {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [admins, setAdmins] = useState([]);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [checkedPanels, setCheckedPanels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  // Redirect non-super-admins
  useEffect(() => {
    if (user && !user.is_super_admin) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  // Fetch admin users list
  useEffect(() => {
    API.get('/sidebar-access/admins')
      .then(({ data }) => setAdmins(data.data))
      .catch(() => {});
  }, []);

  // When admin selected, load their current access
  const handleSelectAdmin = async (admin) => {
    setSelectedAdmin(admin);
    setSaveMsg('');
    setLoading(true);
    try {
      const { data } = await API.get(`/sidebar-access/${admin.id}`);
      setCheckedPanels(data.data);
    } catch {
      setCheckedPanels([]);
    } finally {
      setLoading(false);
    }
  };

  const togglePanel = (key) => {
    setCheckedPanels((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
    setSaveMsg('');
  };

  const toggleGroup = (group) => {
    const groupKeys = ALL_PANELS.filter(p => p.group === group).map(p => p.key);
    const allChecked = groupKeys.every(k => checkedPanels.includes(k));
    if (allChecked) {
      setCheckedPanels(prev => prev.filter(k => !groupKeys.includes(k)));
    } else {
      setCheckedPanels(prev => [...new Set([...prev, ...groupKeys])]);
    }
    setSaveMsg('');
  };

  const handleSave = async () => {
    if (!selectedAdmin) return;
    setSaving(true);
    setSaveMsg('');
    try {
      await API.put(`/sidebar-access/${selectedAdmin.id}`, { panels: checkedPanels });
      setSaveMsg('Access saved successfully.');
    } catch {
      setSaveMsg('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (admin) => {
    if (admin.first_name) return `${admin.first_name[0]}${admin.last_name?.[0] || ''}`.toUpperCase();
    return admin.username[0].toUpperCase();
  };

  const getDisplayName = (admin) => {
    if (admin.first_name) return `${admin.first_name} ${admin.last_name || ''}`.trim();
    return admin.username;
  };

  return (
    <MainLayout title="Panel Access Control" subtitle="Grant sidebar panel access to admin users">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left: Admin user list ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <HiOutlineUser size={16} className="text-gray-400" />
              <h2 className="text-xs font-bold text-gray-600 uppercase tracking-widest">
                Admin Users
              </h2>
            </div>

            {admins.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No admin users found.</p>
            ) : (
              <div className="space-y-2">
                {admins.map((admin) => (
                  <button
                    key={admin.id}
                    onClick={() => handleSelectAdmin(admin)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150
                      ${selectedAdmin?.id === admin.id
                        ? 'bg-brand-green-dark text-white shadow-md'
                        : 'hover:bg-gray-50 text-gray-700'
                      }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                      ${selectedAdmin?.id === admin.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>
                      {getInitials(admin)}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-medium truncate ${selectedAdmin?.id === admin.id ? 'text-white' : 'text-gray-800'}`}>
                        {getDisplayName(admin)}
                      </p>
                      <p className={`text-[11px] truncate ${selectedAdmin?.id === admin.id ? 'text-white/60' : 'text-gray-400'}`}>
                        {admin.email}
                      </p>
                    </div>
                    <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0
                      ${admin.status === 'Active'
                        ? selectedAdmin?.id === admin.id ? 'bg-green-400/20 text-green-200' : 'bg-green-50 text-green-600'
                        : selectedAdmin?.id === admin.id ? 'bg-red-400/20 text-red-200' : 'bg-red-50 text-red-500'
                      }`}>
                      {admin.status}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Right: Panel checkboxes ── */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <HiOutlineShieldCheck size={16} className="text-gray-400" />
              <h2 className="text-xs font-bold text-gray-600 uppercase tracking-widest">
                Sidebar Panel Access
              </h2>
            </div>

            {!selectedAdmin ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
                  <HiOutlineShieldCheck size={24} className="text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-400">Select an admin user</p>
                <p className="text-xs text-gray-300 mt-1">Choose a user from the left to manage their access</p>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 border-2 border-brand-green-dark border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                <div className="mb-4 p-3 rounded-xl bg-gray-50 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-brand-green-dark/10 flex items-center justify-center text-sm font-bold text-brand-green-dark shrink-0">
                    {getInitials(selectedAdmin)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{getDisplayName(selectedAdmin)}</p>
                    <p className="text-xs text-gray-400">{selectedAdmin.email}</p>
                  </div>
                  <p className="ml-auto text-xs text-gray-400">
                    {checkedPanels.length} / {ALL_PANELS.length} panels
                  </p>
                </div>

                <div className="space-y-5">
                  {GROUPS.map((group) => {
                    const groupPanels = ALL_PANELS.filter(p => p.group === group);
                    const allChecked = groupPanels.every(p => checkedPanels.includes(p.key));
                    const someChecked = groupPanels.some(p => checkedPanels.includes(p.key));

                    return (
                      <div key={group}>
                        {/* Group header with select-all toggle */}
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            {group}
                          </p>
                          <button
                            onClick={() => toggleGroup(group)}
                            className="text-[11px] text-brand-green-dark hover:underline font-medium"
                          >
                            {allChecked ? 'Deselect all' : 'Select all'}
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {groupPanels.map((panel) => {
                            const checked = checkedPanels.includes(panel.key);
                            return (
                              <button
                                key={panel.key}
                                onClick={() => togglePanel(panel.key)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all duration-150
                                  ${checked
                                    ? 'border-brand-green-dark bg-brand-green-dark/5'
                                    : 'border-gray-100 hover:border-gray-200 bg-gray-50/50'
                                  }`}
                              >
                                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors
                                  ${checked
                                    ? 'bg-brand-green-dark border-brand-green-dark'
                                    : 'border-gray-300 bg-white'
                                  }`}>
                                  {checked && <HiOutlineCheck size={12} className="text-white" strokeWidth={3} />}
                                </div>
                                <span className={`text-sm font-medium ${checked ? 'text-brand-green-dark' : 'text-gray-600'}`}>
                                  {panel.label}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 flex items-center gap-4">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2.5 rounded-xl bg-brand-green-dark text-white text-sm font-semibold
                      hover:opacity-90 transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : 'Save Access'}
                  </button>
                  {saveMsg && (
                    <p className={`text-sm font-medium ${saveMsg.includes('success') ? 'text-green-600' : 'text-red-500'}`}>
                      {saveMsg}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </MainLayout>
  );
}

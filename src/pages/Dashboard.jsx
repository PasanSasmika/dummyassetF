import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
} from 'recharts';
import {
  TbPackage, TbCircleCheck, TbClockExclamation, TbUsers,
  TbArrowUpRight, TbArrowBackUp, TbShieldLock, TbServer,
  TbTool, TbFileText, TbDeviceDesktop, TbDoor, TbUserCheck,
  TbBriefcase, TbAlertHexagon, TbChartBar, TbLayoutDashboard,
} from 'react-icons/tb';
import {
  FiArrowRight, FiCalendar, FiPackage,
  FiAlertCircle, FiChevronRight, FiDownload,
} from 'react-icons/fi';
import { HiOutlineCube } from 'react-icons/hi';

import MainLayout from '../components/layout/MainLayout';
import { fetchAssets } from '../features/assets/assetSlice';
import { fetchAllAssignments } from '../features/assignments/assignmentSlice';
import { fetchUsers } from '../features/users/userSlice';

// ── Palette ───────────────────────────────────────────────
const CAT_COLORS = {
  'Human':                '#a855f7',
  'IT Infrastructure':    '#3b82f6',
  'Service':              '#22c55e',
  'Digital':              '#6366f1',
  'Tangible Information': '#f43f5e',
  'End User':             '#06b6d4',
  'Facility':             '#f97316',
};

const CAT_ICONS = {
  'Human':                TbUserCheck,
  'IT Infrastructure':    TbServer,
  'Service':              TbTool,
  'Digital':              TbShieldLock,
  'Tangible Information': TbFileText,
  'End User':             TbDeviceDesktop,
  'Facility':             TbDoor,
};

const STATUS_COLOR = {
  'Available':      { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: '#10b981' },
  'In Use':         { bg: 'bg-blue-50',    text: 'text-blue-700',    dot: '#3b82f6' },
  'In Maintenance': { bg: 'bg-amber-50',   text: 'text-amber-700',   dot: '#f59e0b' },
  'In Repair':      { bg: 'bg-orange-50',  text: 'text-orange-700',  dot: '#f97316' },
  'Broken':         { bg: 'bg-red-50',     text: 'text-red-700',     dot: '#ef4444' },
  'Retired':        { bg: 'bg-slate-100',  text: 'text-slate-500',   dot: '#94a3b8' },
  'Lost':           { bg: 'bg-purple-50',  text: 'text-purple-700',  dot: '#a855f7' },
};

const fmt = (d) => d
  ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  : '—';

const safeList = (v) => (Array.isArray(v) ? v : []);

// ── KPI Card ──────────────────────────────────────────────
const KpiCard = ({ label, value, sub, Icon, accent, onClick }) => (
  <button
    onClick={onClick}
    className={`group bg-white rounded-2xl border border-slate-100 shadow-sm p-5
      flex items-start gap-4 hover:shadow-md hover:border-${accent}-200
      transition-all text-left w-full`}>
    <div className={`w-12 h-12 rounded-2xl bg-${accent}-50 flex items-center
      justify-center shrink-0 group-hover:scale-110 transition-transform`}>
      <Icon size={22} className={`text-${accent}-600`} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
        {label}
      </p>
      <p className={`text-3xl font-black text-${accent}-600 leading-none`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1.5">{sub}</p>}
    </div>
    <FiChevronRight size={15} className="text-slate-300 group-hover:text-slate-500
      group-hover:translate-x-1 transition-all mt-1 shrink-0" />
  </button>
);

// ── Section Header ────────────────────────────────────────
const SectionHeader = ({ title, sub, action, onAction }) => (
  <div className="flex items-center justify-between mb-4">
    <div>
      <h2 className="text-base font-bold text-slate-900">{title}</h2>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
    {action && (
      <button onClick={onAction}
        className="flex items-center gap-1.5 text-xs font-semibold text-blue-600
          hover:text-blue-700 transition">
        {action} <FiArrowRight size={12} />
      </button>
    )}
  </div>
);

// ── Status Badge ──────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const s = STATUS_COLOR[status] || { bg: 'bg-slate-100', text: 'text-slate-600' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
      text-[10px] font-bold ${s.bg} ${s.text}`}>
      <span className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: s.dot || '#94a3b8' }} />
      {status}
    </span>
  );
};

// ── Custom Tooltip ────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-100 px-3 py-2">
      {label && <p className="text-[10px] font-bold text-slate-400 mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="text-xs font-semibold" style={{ color: p.color || p.fill }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

// ── Monthly trend helper ──────────────────────────────────
function buildMonthlyTrend(assignments) {
  const map = {};
  const now  = new Date();
  for (let m = 5; m >= 0; m--) {
    const d   = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    map[key]  = { month: key, assigned: 0, returned: 0 };
  }
  assignments.forEach(a => {
    const d   = new Date(a.assignment_date || a.created_at);
    const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    if (map[key]) {
      map[key].assigned += 1;
      if (a.status === 'Returned') map[key].returned += 1;
    }
  });
  return Object.values(map);
}

// ─────────────────────────────────────────────────────────
export default function Dashboard() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  
  const [isExporting, setIsExporting] = useState(false);

  const { user }                                   = useSelector(s => s.auth);
  const { list: rawAssets,      loading: loadingA } = useSelector(s => s.assets);
  const { list: rawAssignments, loading: loadingM } = useSelector(s => s.assignments);
  const { list: rawUsers                          } = useSelector(s => s.users);

  const isSuperAdmin  = user?.is_super_admin === true;
  const sidebarAccess = user?.sidebar_access || [];
  const hasAccess     = (key) => isSuperAdmin || sidebarAccess.includes(key);

  const assets      = safeList(rawAssets);
  const assignments = safeList(rawAssignments);
  const users       = safeList(rawUsers);

  useEffect(() => {
    dispatch(fetchAssets());
    dispatch(fetchAllAssignments());
    dispatch(fetchUsers());
  }, []);

  const kpi = useMemo(() => ({
    total:     assets.length,
    available: assets.filter(a => a.status === 'Available').length,
    active:    assignments.filter(a => ['Assigned','Overdue'].includes(a.display_status || a.status)).length,
    overdue:   assignments.filter(a => (a.display_status || a.status) === 'Overdue').length,
    users:     users.filter(u => u.status !== 'Inactive').length,
    attention: assets.filter(a => ['In Repair','Broken','In Maintenance'].includes(a.status)).length,
  }), [assets, assignments, users]);

  const categoryData = useMemo(() => {
    const map = {};
    assets.forEach(a => { map[a.category] = (map[a.category] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [assets]);

  const statusData = useMemo(() => {
    const map = {};
    assets.forEach(a => { map[a.status] = (map[a.status] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value, fill: STATUS_COLOR[name]?.dot || '#94a3b8' })).sort((a, b) => b.value - a.value);
  }, [assets]);

  const trendData = useMemo(() => buildMonthlyTrend(assignments), [assignments]);

  const overdueList = useMemo(() => assignments.filter(a => (a.display_status || a.status) === 'Overdue'), [assignments]);
  const recentAssignments = useMemo(() => [...assignments].filter(a => ['Assigned','Overdue'].includes(a.display_status || a.status)).slice(0, 6), [assignments]);
  const recentAssets = useMemo(() => [...assets].slice(0, 5), [assets]);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  // ── ADVANCED ENTERPRISE HTML DOCUMENT EXPORT ─────────────────────────
  const handleDownloadReport = () => {
    setIsExporting(true);

    const activeAssignmentsAll = assignments.filter(a => ['Assigned','Overdue'].includes(a.display_status || a.status));

    // Data for Chart.js Injection
    const catLabels = JSON.stringify(categoryData.map(c => c.name));
    const catVals = JSON.stringify(categoryData.map(c => c.value));
    const catColors = JSON.stringify(categoryData.map(c => CAT_COLORS[c.name] || '#94a3b8'));

    const statLabels = JSON.stringify(statusData.map(s => s.name));
    const statVals = JSON.stringify(statusData.map(s => s.value));
    const statColors = JSON.stringify(statusData.map(s => s.fill));

    const trendLabels = JSON.stringify(trendData.map(t => t.month));
    const trendAssigned = JSON.stringify(trendData.map(t => t.assigned));
    const trendReturned = JSON.stringify(trendData.map(t => t.returned));

    const generateTable = (id, headers, rows, emptyMsg) => {
      if (rows.length === 0) return `<div class="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-100">${emptyMsg}</div>`;
      return `
        <div class="mb-4 no-print flex justify-between items-center bg-slate-50 p-3 rounded-t-xl border border-slate-200 border-b-0">
          <h3 class="font-bold text-slate-700 ml-2">Data Ledger</h3>
          <div class="relative">
            <i class='bx bx-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400'></i>
            <input type="text" id="searchInput-${id}" onkeyup="filterTable('${id}')" placeholder="Search records..." 
                   class="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm shadow-sm w-64 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
          </div>
        </div>
        <div class="overflow-x-auto rounded-xl rounded-t-none border border-slate-200 shadow-sm print:rounded-xl">
          <table id="table-${id}" class="w-full text-left text-sm">
            <thead class="bg-slate-100 border-b border-slate-200">
              <tr>${headers.map(h => `<th class="px-5 py-3.5 font-bold text-slate-600 uppercase tracking-wider text-[10px] whitespace-nowrap cursor-pointer hover:bg-slate-200 transition" onclick="sortTable('${id}', this)">${h} <i class='bx bx-sort text-slate-400 ml-1'></i></th>`).join('')}</tr>
            </thead>
            <tbody class="divide-y divide-slate-100 bg-white">
              ${rows.join('')}
            </tbody>
          </table>
        </div>
      `;
    };

    const assetsHTML = generateTable('assets', ['Asset No', 'Name', 'Category', 'Type', 'Location', 'Status'], assets.map(a => `
      <tr class="hover:bg-slate-50 transition-colors group">
        <td class="px-5 py-3 font-mono text-blue-600 font-semibold">${a.asset_no}</td>
        <td class="px-5 py-3 font-semibold text-slate-800">${a.name}</td>
        <td class="px-5 py-3 text-slate-600"><span class="bg-slate-100 px-2 py-1 rounded text-xs">${a.category}</span></td>
        <td class="px-5 py-3 text-slate-500">${a.asset_type_name || '—'}</td>
        <td class="px-5 py-3 text-slate-500">${a.location_name || '—'}</td>
        <td class="px-5 py-3 font-bold text-slate-600">${a.status}</td>
      </tr>
    `), 'No assets registered.');

    const assignmentsHTML = generateTable('assignments', ['Asset', 'Assigned To', 'Assigned By', 'Assigned Date', 'Expected Return', 'Status'], activeAssignmentsAll.map(a => `
      <tr class="hover:bg-slate-50 transition-colors">
        <td class="px-5 py-3 font-semibold text-slate-800">${a.asset_name || '—'} <br/><span class="text-slate-400 font-mono text-[10px]">${a.asset_no || ''}</span></td>
        <td class="px-5 py-3 text-slate-700">${a.assigned_to_name || '—'}</td>
        <td class="px-5 py-3 text-slate-500">${a.assigned_by_name || '—'}</td>
        <td class="px-5 py-3 text-slate-600">${fmt(a.assignment_date)}</td>
        <td class="px-5 py-3 text-slate-600">${a.expected_return_date ? fmt(a.expected_return_date) : 'Open-ended'}</td>
        <td class="px-5 py-3 font-bold text-slate-600"><span class="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs border border-blue-100">${a.display_status || a.status}</span></td>
      </tr>
    `), 'No active assignments.');

    const overdueHTML = generateTable('overdue', ['Asset', 'Assigned To', 'Department', 'Expected Return', 'Days Overdue'], overdueList.map(a => `
      <tr class="hover:bg-red-50/50 transition-colors">
        <td class="px-5 py-3 font-semibold text-slate-800">${a.asset_name || '—'} <br/><span class="text-slate-400 font-mono text-[10px]">${a.asset_no || ''}</span></td>
        <td class="px-5 py-3 text-slate-700">${a.assigned_to_name || '—'} <br/><span class="text-slate-400 text-[10px]">${a.assigned_to_email || ''}</span></td>
        <td class="px-5 py-3 text-slate-600">${a.assigned_to_department || '—'}</td>
        <td class="px-5 py-3 text-red-600 font-bold">${fmt(a.expected_return_date)}</td>
        <td class="px-5 py-3"><span class="bg-red-100 text-red-700 px-2.5 py-1 rounded shadow-sm border border-red-200 text-xs font-black">${Math.abs(a.days_until_due)} Days Overdue</span></td>
      </tr>
    `), '<div class="text-emerald-500 font-bold flex items-center justify-center gap-2"><i class="bx bx-check-circle text-xl"></i> All clear! No overdue assignments.</div>');

   const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>VogueStock | Hayleys Eco Solutions</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;900&display=swap" rel="stylesheet">
        <link href='https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css' rel='stylesheet'>
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <style>
          body { font-family: 'Inter', sans-serif; background-color: #f8fafc; }
          .tab-active { border-bottom: 2px solid #059669; color: #065f46; background: #ecfdf5; }
          .tab-inactive { color: #64748b; }
          .tab-inactive:hover { color: #334155; background: #f1f5f9; }
          .tab-content { display: none; animation: fadeIn 0.3s; }
          .tab-content.active { display: block; }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
          
          @media print {
            body { background-color: white !important; margin: 0; padding: 0; }
            .no-print { display: none !important; }
            .shadow-sm, .shadow-md, .shadow-lg { box-shadow: none !important; border: 1px solid #e2e8f0; }
            .tab-content { display: block !important; break-inside: avoid; margin-bottom: 2rem; }
            .print-page-break { page-break-before: always; }
            .chart-container { width: 100% !important; height: 300px !important; margin-bottom: 2rem; }
          }
        </style>
      </head>
      <body class="text-slate-800 antialiased min-h-screen flex flex-col">
        
        <nav class="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm no-print">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center p-1.5 shadow-sm">
              <img src="/vogue.png" alt="VogueStock" class="w-full h-full object-contain" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"/>
              <i class='bx bx-data text-slate-400 text-xl hidden'></i> </div>
            <div>
              <h1 class="text-xl font-black text-slate-900 tracking-tight leading-tight">VogueStock.</h1>
              <p class="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Hayleys Eco Solutions Sector</p>
            </div>
          </div>
          <div class="text-right">
             <p class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Asset Management Portal</p>
          </div>
        </nav>

        <div class="hidden print:block mb-8 pb-4 border-b-2 border-emerald-900">
          <div class="flex justify-between items-end">
            <div>
              <h1 class="text-3xl font-black text-slate-900 tracking-tight">VogueStock | Enterprise Report</h1>
              <p class="text-emerald-700 font-bold uppercase text-xs tracking-widest mt-1">Hayleys Eco Solutions Sector</p>
            </div>
            <p class="text-slate-500 font-medium text-sm">Generated: ${today}</p>
          </div>
        </div>

        <div class="max-w-7xl mx-auto px-4 sm:px-6 mt-8 flex-grow">
          
          <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div class="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-2xl shrink-0"><i class='bx bx-package'></i></div>
              <div><div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Assets</div><div class="text-2xl font-black text-slate-800">${kpi.total}</div></div>
            </div>
            <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div class="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-2xl shrink-0"><i class='bx bx-check-shield'></i></div>
              <div><div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Available</div><div class="text-2xl font-black text-slate-800">${kpi.available}</div></div>
            </div>
            <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div class="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-2xl shrink-0"><i class='bx bx-transfer'></i></div>
              <div><div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Assigns</div><div class="text-2xl font-black text-slate-800">${kpi.active}</div></div>
            </div>
            <div class="bg-white p-5 rounded-xl border border-red-200 shadow-sm flex items-center gap-4 ring-1 ring-red-100">
              <div class="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-2xl shrink-0"><i class='bx bx-error-circle'></i></div>
              <div><div class="text-[10px] font-bold text-red-500 uppercase tracking-wider">Overdue</div><div class="text-2xl font-black text-red-700">${kpi.overdue}</div></div>
            </div>
            <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div class="w-12 h-12 bg-violet-50 text-violet-600 rounded-full flex items-center justify-center text-2xl shrink-0"><i class='bx bx-user-pin'></i></div>
              <div><div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Users</div><div class="text-2xl font-black text-slate-800">${kpi.users}</div></div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-sm border border-slate-200 mb-8 overflow-hidden">
            <div class="flex border-b border-slate-200 bg-slate-50/50 no-print px-2 pt-2 gap-1 overflow-x-auto">
              <button onclick="switchTab('summary')" id="tab-summary" class="tab-active px-6 py-3 font-bold text-sm rounded-t-lg transition flex items-center gap-2"><i class='bx bx-pie-chart-alt-2'></i> Analytics Summary</button>
              <button onclick="switchTab('inventory')" id="tab-inventory" class="tab-inactive px-6 py-3 font-bold text-sm rounded-t-lg transition flex items-center gap-2"><i class='bx bx-list-ul'></i> Inventory Ledger</button>
              <button onclick="switchTab('assignments')" id="tab-assignments" class="tab-inactive px-6 py-3 font-bold text-sm rounded-t-lg transition flex items-center gap-2"><i class='bx bx-link'></i> Active Assignments</button>
              <button onclick="switchTab('overdue')" id="tab-overdue" class="tab-inactive px-6 py-3 font-bold text-sm rounded-t-lg transition flex items-center gap-2 ${kpi.overdue > 0 ? 'text-red-600' : ''}"><i class='bx bx-alarm-exclamation'></i> Overdue Returns <span class="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-[10px] ml-1">${kpi.overdue}</span></button>
            </div>

            <div class="p-6 md:p-8">
              <div id="content-summary" class="tab-content active">
                <h2 class="text-xl font-bold text-slate-800 mb-6 hidden print:block">Analytics Summary</h2>
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div class="border border-slate-200 rounded-xl p-5 shadow-sm chart-container">
                    <h3 class="font-bold text-slate-700 mb-4 flex items-center gap-2"><i class='bx bxs-doughnut-chart text-emerald-500'></i> Category Distribution</h3>
                    <div class="relative h-64 w-full"><canvas id="categoryChart"></canvas></div>
                  </div>
                  <div class="border border-slate-200 rounded-xl p-5 shadow-sm chart-container">
                    <h3 class="font-bold text-slate-700 mb-4 flex items-center gap-2"><i class='bx bx-bar-chart-alt text-blue-500'></i> Asset Status</h3>
                    <div class="relative h-64 w-full"><canvas id="statusChart"></canvas></div>
                  </div>
                  <div class="border border-slate-200 rounded-xl p-5 shadow-sm chart-container">
                    <h3 class="font-bold text-slate-700 mb-4 flex items-center gap-2"><i class='bx bx-line-chart text-indigo-500'></i> Assignment Trend (6 Mo)</h3>
                    <div class="relative h-64 w-full"><canvas id="trendChart"></canvas></div>
                  </div>
                </div>
              </div>

              <div id="content-inventory" class="tab-content print-page-break">
                <h2 class="text-xl font-bold text-slate-800 mb-6 hidden print:block">Inventory Ledger</h2>
                ${assetsHTML}
              </div>

              <div id="content-assignments" class="tab-content print-page-break">
                <h2 class="text-xl font-bold text-slate-800 mb-6 hidden print:block">Active Assignments Ledger</h2>
                ${assignmentsHTML}
              </div>

              <div id="content-overdue" class="tab-content print-page-break">
                <h2 class="text-xl font-bold text-red-700 mb-6 hidden print:block">Critical: Overdue Returns</h2>
                ${overdueHTML}
              </div>
            </div>
          </div>
        </div>

        <footer class="mt-auto py-8 bg-slate-900 text-white no-print">
          <div class="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <div class="flex items-center gap-4">
               <div class="w-10 h-10 bg-white/10 border border-white/20 rounded-lg flex items-center justify-center p-1.5">
                 <img src="/vogue.png" alt="VogueStock" class="w-full h-full object-contain filter brightness-200" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"/>
                 <i class='bx bx-data text-white text-xl hidden'></i>
               </div>
               <div>
                 <p class="text-base font-black tracking-tight">VogueStock.</p>
                 <p class="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mt-0.5">Hayleys Eco Solutions Sector</p>
               </div>
            </div>
            <div class="text-center md:text-right">
              <p class="text-[11px] text-slate-400 uppercase tracking-widest font-bold">Powered by</p>
              <p class="text-sm font-black text-emerald-400">Vogue Software Solutions</p>
            </div>
          </div>
        </footer>

        <div class="text-center text-slate-400 text-[10px] font-medium py-4 print:block hidden">
          Report securely generated by VogueStock for Hayleys Eco Solutions on ${today}
        </div>

        <script>
          // --- Tab Logic ---
          function switchTab(tabId) {
            document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('button[id^="tab-"]').forEach(el => {
              el.classList.remove('tab-active');
              el.classList.add('tab-inactive');
            });
            document.getElementById('content-' + tabId).classList.add('active');
            const btn = document.getElementById('tab-' + tabId);
            btn.classList.remove('tab-inactive');
            btn.classList.add('tab-active');
          }

          // --- Search & Sort Logic ---
          function filterTable(id) {
            const filter = document.getElementById('searchInput-' + id).value.toLowerCase();
            const rows = document.querySelectorAll('#table-' + id + ' tbody tr');
            rows.forEach(row => {
              row.style.display = row.innerText.toLowerCase().includes(filter) ? '' : 'none';
            });
          }

          function sortTable(tableId, headerCell) {
            const table = document.getElementById('table-' + tableId);
            const tbody = table.querySelector('tbody');
            const rows = Array.from(tbody.querySelectorAll('tr'));
            const index = Array.from(headerCell.parentNode.children).indexOf(headerCell);
            const isAsc = headerCell.classList.contains('asc');
            
            table.querySelectorAll('th i').forEach(i => i.className = 'bx bx-sort text-slate-400 ml-1');
            headerCell.classList.toggle('asc', !isAsc);
            headerCell.querySelector('i').className = isAsc ? 'bx bx-sort-down text-emerald-600 ml-1' : 'bx bx-sort-up text-emerald-600 ml-1';

            rows.sort((a, b) => {
              const aText = a.children[index].innerText.trim();
              const bText = b.children[index].innerText.trim();
              return isAsc ? bText.localeCompare(aText, undefined, {numeric: true}) : aText.localeCompare(bText, undefined, {numeric: true});
            });
            rows.forEach(row => tbody.appendChild(row));
          }

          // --- Chart.js Configuration ---
          Chart.defaults.font.family = "'Inter', sans-serif";
          Chart.defaults.color = '#64748b';

          new Chart(document.getElementById('categoryChart').getContext('2d'), {
            type: 'doughnut',
            data: {
              labels: ${catLabels},
              datasets: [{
                data: ${catVals},
                backgroundColor: ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0'],
                borderWidth: 0
              }]
            },
            options: { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, usePointStyle: true } } } }
          });

          new Chart(document.getElementById('statusChart').getContext('2d'), {
            type: 'bar',
            data: {
              labels: ${statLabels},
              datasets: [{
                label: 'Assets',
                data: ${statVals},
                backgroundColor: '#3b82f6',
                borderRadius: 4
              }]
            },
            options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false } } }
          });

          new Chart(document.getElementById('trendChart').getContext('2d'), {
            type: 'line',
            data: {
              labels: ${trendLabels},
              datasets: [
                { label: 'Assigned', data: ${trendAssigned}, borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', fill: true, tension: 0.4 },
                { label: 'Returned', data: ${trendReturned}, borderColor: '#64748b', backgroundColor: 'rgba(100, 116, 139, 0.1)', fill: true, tension: 0.4 }
              ]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, usePointStyle: true } } } }
          });
        </script>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `AssetFlow_Enterprise_Report_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setIsExporting(false);
  };

  return (
    <MainLayout title="Dashboard" subtitle={today}>

      {/* ── Action Bar ── */}
      <div className="flex justify-end mb-4">
        <button 
          onClick={handleDownloadReport} 
          disabled={isExporting}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 
                     text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 
                     shadow-sm transition-all disabled:opacity-50"
        >
          <FiDownload size={16} className={isExporting ? "animate-bounce text-blue-500" : "text-slate-400"} />
          {isExporting ? 'Generating...' : 'Download Advanced Report'}
        </button>
      </div>

      <div className="bg-slate-50 pb-4 rounded-2xl">
        
        {/* ══ KPI ROW ════════════════════════════════════════ */}
        <div className="grid grid-cols-5 gap-4 mb-7">
          <KpiCard label="Total Assets"   value={kpi.total}     sub="All registered"
            Icon={TbPackage}         accent="blue"    onClick={hasAccess('assets')       ? () => navigate('/assets')      : undefined} />
          <KpiCard label="Available"      value={kpi.available} sub="Ready to assign"
            Icon={TbCircleCheck}     accent="emerald" onClick={hasAccess('assets')       ? () => navigate('/assets')      : undefined} />
          <KpiCard label="Active Assigns" value={kpi.active}    sub="Currently out"
            Icon={TbArrowUpRight}    accent="indigo"  onClick={hasAccess('assignments')  ? () => navigate('/assignments') : undefined} />
          <KpiCard label="Overdue"        value={kpi.overdue}   sub="Past return date"
            Icon={TbClockExclamation}accent="red"     onClick={hasAccess('return-history') ? () => navigate('/returns')  : undefined} />
          <KpiCard label="Active Users"   value={kpi.users}     sub="Non-inactive accounts"
            Icon={TbUsers}           accent="violet"  onClick={hasAccess('users')        ? () => navigate('/users')       : undefined} />
        </div>

        {/* ══ CHARTS ROW ════════════════════════════════════ */}
        <div className="grid grid-cols-3 gap-5 mb-7">

          {/* ── Donut: Category Breakdown ── */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <SectionHeader
              title="Assets by Category"
              sub="Distribution across all categories"
            />
            {categoryData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-slate-300 text-sm">
                No data yet
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%"
                      innerRadius={50} outerRadius={78}
                      paddingAngle={3} dataKey="value" stroke="none">
                      {categoryData.map(({ name }) => (
                        <Cell key={name}
                          fill={CAT_COLORS[name] || '#94a3b8'} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>

                <div className="space-y-1.5 mt-2">
                  {categoryData.map(({ name, value }) => {
                    const Icon  = CAT_ICONS[name] || HiOutlineCube;
                    const color = CAT_COLORS[name] || '#94a3b8';
                    const pct   = kpi.total > 0 ? Math.round((value / kpi.total) * 100) : 0;
                    return (
                      <div key={name} className="flex items-center gap-2 text-xs">
                        <span className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: color }} />
                        <Icon size={11} style={{ color }} className="shrink-0" />
                        <span className="text-slate-600 font-medium flex-1 truncate">{name}</span>
                        <span className="text-slate-400 shrink-0">{value} · {pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* ── Bar: Asset Status ── */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <SectionHeader
              title="Asset Status"
              sub="Count per status"
            />
            {statusData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-slate-300 text-sm">
                No data yet
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={190}>
                  <BarChart data={statusData} layout="vertical" barSize={10}
                    margin={{ left: 4, right: 16, top: 4, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false}
                      stroke="#f1f5f9" />
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }}
                      width={90} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f8fafc' }} />
                    <Bar dataKey="value" name="Assets" radius={[0, 6, 6, 0]}>
                      {statusData.map(({ name, fill }) => (
                        <Cell key={name} fill={fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

                {/* Mini legend */}
                <div className="grid grid-cols-2 gap-1.5 mt-1">
                  {statusData.map(({ name, value, fill }) => (
                    <div key={name} className="flex items-center gap-1.5 text-[10px]">
                      <span className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: fill }} />
                      <span className="text-slate-500 truncate">{name}</span>
                      <span className="font-bold text-slate-700 ml-auto">{value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* ── Area: Assignment Trend ── */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <SectionHeader
              title="Assignment Trend"
              sub="Last 6 months"
            />
            <ResponsiveContainer width="100%" height={190}>
              <AreaChart data={trendData}
                margin={{ left: -20, right: 4, top: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradR" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#94a3b8' }}
                  axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                  allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="assigned" name="Assigned"
                  stroke="#3b82f6" strokeWidth={2} fill="url(#gradA)" dot={false}
                  activeDot={{ r: 4, fill: '#3b82f6' }} />
                <Area type="monotone" dataKey="returned" name="Returned"
                  stroke="#10b981" strokeWidth={2} fill="url(#gradR)" dot={false}
                  activeDot={{ r: 4, fill: '#10b981' }} />
              </AreaChart>
            </ResponsiveContainer>

            <div className="flex items-center gap-5 mt-2 justify-center">
              {[['#3b82f6','Assigned'],['#10b981','Returned']].map(([color, label]) => (
                <div key={label} className="flex items-center gap-1.5 text-[10px] text-slate-500">
                  <span className="w-5 h-1 rounded-full" style={{ backgroundColor: color }} />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ TABLES ROW ════════════════════════════════════ */}
        <div className="grid grid-cols-3 gap-5">

          {/* ── Overdue — full urgency ── */}
          <div className="col-span-1 bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 bg-red-50 border-b border-red-100">
              <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <TbClockExclamation size={16} className="text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-bold text-red-800">Overdue Returns</h2>
                <p className="text-[10px] text-red-400">Assets past expected return date</p>
              </div>
              {kpi.overdue > 0 && (
                <span className="px-2.5 py-1 rounded-full bg-red-600 text-white
                  text-xs font-black">
                  {kpi.overdue}
                </span>
              )}
            </div>

            {overdueList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <TbCircleCheck size={32} className="text-emerald-300 mb-2" />
                <p className="text-sm font-semibold text-slate-400">All clear!</p>
                <p className="text-xs text-slate-300 mt-0.5">No overdue assignments</p>
              </div>
            ) : (
              <div className="divide-y divide-red-50">
                {overdueList.map(a => {
                  const days = a.days_until_due != null ? Math.abs(a.days_until_due) : null;
                  return (
                    <div key={a.id}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-red-50/50 transition">
                      <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center
                        justify-center shrink-0 text-sm font-black text-red-600">
                        {(a.assigned_to_name?.[0] || '?').toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">
                          {a.asset_name || '—'}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {a.assigned_to_name || 'Unknown'}
                        </p>
                      </div>
                      {days !== null && (
                        <span className="text-[10px] font-black text-red-600
                          bg-red-100 px-2 py-1 rounded-lg shrink-0 whitespace-nowrap">
                          {days}d overdue
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {kpi.overdue > 0 && (
              <div className="px-5 py-3 border-t border-red-100">
                <button onClick={() => navigate('/returns')}
                  className="w-full flex items-center justify-center gap-1.5 text-xs
                  font-semibold text-red-600 hover:text-red-700 transition"
                >
                  Process all returns <FiArrowRight size={11} />
                </button>
              </div>
            )}
          </div>

          {/* ── Recent Assignments ── */}
          <div className="col-span-2 bg-white rounded-2xl border border-slate-100
            shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4
              border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Active Assignments</h2>
                <p className="text-[10px] text-slate-400 mt-0.5">Currently assigned assets</p>
              </div>
              {hasAccess('assignments') && (
                <button onClick={() => navigate('/assignments')}
                  className="flex items-center gap-1.5 text-xs font-semibold text-blue-600
                    hover:text-blue-700 transition"
                >
                  View all <FiArrowRight size={11} />
                </button>
              )}
            </div>

            {loadingM ? (
              <div className="flex items-center justify-center py-12 text-slate-300 text-sm gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10"
                    stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Loading...
              </div>
            ) : recentAssignments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <TbArrowUpRight size={28} className="text-slate-200 mb-2" />
                <p className="text-sm text-slate-400">No active assignments</p>
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {['Asset', 'Assigned To', 'Date', 'Expected Return', 'Status'].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-semibold text-slate-400
                        uppercase tracking-wider text-[10px] whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentAssignments.map(a => {
                    const isOverdue = (a.display_status || a.status) === 'Overdue';
                    return (
                      <tr key={a.id}
                        className={`transition-colors
                          ${isOverdue ? 'bg-red-50/40 hover:bg-red-50' : 'hover:bg-slate-50'}`}>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-800 truncate max-w-[110px]">
                            {a.asset_name || '—'}
                          </p>
                          <p className="font-mono text-[9px] text-slate-400">
                            {a.asset_no || `#${a.asset_id}`}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center
                              justify-center shrink-0 text-[10px] font-black text-indigo-600">
                              {(a.assigned_to_name?.[0] || '?').toUpperCase()}
                            </div>
                            <span className="text-slate-700 font-medium truncate max-w-[80px]">
                              {a.assigned_to_name || '—'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                          {fmt(a.assignment_date)}
                        </td>
                        <td className="px-4 py-3">
                          {a.expected_return_date ? (
                            <span className={isOverdue ? 'text-red-600 font-semibold' : 'text-slate-500'}>
                              {fmt(a.expected_return_date)}
                            </span>
                          ) : (
                            <span className="text-slate-300">Open-ended</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={a.display_status || a.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ══ BOTTOM ROW ════════════════════════════════════ */}
        <div className="grid grid-cols-3 gap-5 mt-7">

          {/* ── Recently Added Assets ── */}
          <div className="col-span-2 bg-white rounded-2xl border border-slate-100
            shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4
              border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Recently Added Assets</h2>
                <p className="text-[10px] text-slate-400 mt-0.5">Latest registered assets</p>
              </div>
              {hasAccess('assets') && (
                <button onClick={() => navigate('/assets')}
                  className="flex items-center gap-1.5 text-xs font-semibold text-blue-600
                    hover:text-blue-700 transition"
                >
                  View all <FiArrowRight size={11} />
                </button>
              )}
            </div>

            {loadingA ? (
              <div className="flex items-center justify-center py-12 text-slate-300 text-sm gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10"
                    stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Loading...
              </div>
            ) : recentAssets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <TbPackage size={28} className="text-slate-200 mb-2" />
                <p className="text-sm text-slate-400">No assets yet</p>
                {hasAccess('assets') && (
                  <button onClick={() => navigate('/assets')}
                    className="mt-2 text-xs text-blue-500 font-semibold hover:underline">
                    Add your first asset →
                  </button>
                )}
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {['Asset No', 'Name', 'Category', 'Type', 'Status'].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-semibold text-slate-400
                        uppercase tracking-wider text-[10px]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentAssets.map(a => {
                    const CatIcon = CAT_ICONS[a.category] || HiOutlineCube;
                    const color   = CAT_COLORS[a.category] || '#94a3b8';
                    return (
                      <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-mono text-blue-600 font-semibold">
                            {a.asset_no}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-800 max-w-[140px] truncate">
                          {a.name}
                        </td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1.5 text-slate-600">
                            <CatIcon size={12} style={{ color }} />
                            {a.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 max-w-[100px] truncate">
                         {a.asset_type_name || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={a.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* ── System Summary ── */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">System Summary</h2>
              <p className="text-[10px] text-slate-400 mt-0.5">Overall health at a glance</p>
            </div>

            {/* Asset utilisation bar */}
            <div>
              <div className="flex justify-between text-[10px] font-semibold mb-1.5">
                <span className="text-slate-500">Asset Utilisation</span>
                <span className="text-slate-700">
                  {kpi.total > 0 ? Math.round((kpi.active / kpi.total) * 100) : 0}%
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: kpi.total > 0 ? `${Math.round((kpi.active / kpi.total) * 100)}%` : '0%' }}
                />
              </div>
              <p className="text-[9px] text-slate-400 mt-1">
                {kpi.active} of {kpi.total} assets currently assigned
              </p>
            </div>

            {/* Availability bar */}
            <div>
              <div className="flex justify-between text-[10px] font-semibold mb-1.5">
                <span className="text-slate-500">Availability Rate</span>
                <span className="text-emerald-700">
                  {kpi.total > 0 ? Math.round((kpi.available / kpi.total) * 100) : 0}%
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: kpi.total > 0 ? `${Math.round((kpi.available / kpi.total) * 100)}%` : '0%' }}
                />
              </div>
              <p className="text-[9px] text-slate-400 mt-1">
                {kpi.available} assets available to assign
              </p>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-100" />

            {/* Quick stats grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Needs Attention', value: kpi.attention, color: 'bg-amber-50 text-amber-700 border-amber-100' },
                { label: 'Overdue',         value: kpi.overdue,   color: 'bg-red-50 text-red-700 border-red-100'    },
                { label: 'Active Users',    value: kpi.users,     color: 'bg-violet-50 text-violet-700 border-violet-100' },
                { label: 'Categories',      value: categoryData.length, color: 'bg-blue-50 text-blue-700 border-blue-100'  },
              ].map(({ label, value, color }) => (
                <div key={label}
                  className={`rounded-xl border p-3 text-center ${color}`}>
                  <p className="text-2xl font-black">{value}</p>
                  <p className="text-[9px] font-bold uppercase tracking-wider mt-0.5 opacity-70">
                    {label}
                  </p>
                </div>
              ))}
            </div>

            {/* Quick nav */}
            <div className="border-t border-slate-100 pt-3 space-y-1.5">
              {[
                { label: 'Manage Assets',    path: '/assets',      accessKey: 'assets'         },
                { label: 'View Assignments', path: '/assignments',  accessKey: 'assignments'    },
                { label: 'Process Returns',  path: '/returns',      accessKey: 'return-history' },
                { label: 'Manage Users',     path: '/users',        accessKey: 'users'          },
              ].filter(item => hasAccess(item.accessKey)).map(({ label, path }) => (
                <button key={path}
                  onClick={() => navigate(path)}
                  className="w-full flex items-center justify-between px-3 py-2
                    rounded-lg hover:bg-slate-50 text-xs font-semibold text-slate-600
                    hover:text-blue-600 transition group">
                  {label}
                  <FiChevronRight size={11} className="text-slate-300
                    group-hover:text-blue-400 transition" />
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </MainLayout>
  );
}
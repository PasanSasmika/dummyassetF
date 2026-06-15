import { useState } from 'react';
import API from '../../api/axios';
import {
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineRefresh,
  HiOutlinePlay,
  HiOutlineDatabase,
  HiOutlineLightningBolt,
} from 'react-icons/hi';

const MIGRATION_KEY = 'migration-admin-key-vogue';
const headers = { 'x-migration-key': MIGRATION_KEY };

const STEPS = [
  { num: 1, label: 'Test Connection' },
  { num: 2, label: 'Run Migrations' },
  { num: 3, label: 'Seed Data' },
];

export default function MigrationPanel() {
  // connection
  const [connLoading, setConnLoading]   = useState(false);
  const [connResult,  setConnResult]    = useState(null);

  // status
  const [status,        setStatus]        = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError,   setStatusError]   = useState('');

  // run migrations
  const [runLogs,    setRunLogs]    = useState([]);
  const [runLoading, setRunLoading] = useState(false);
  const [runSuccess, setRunSuccess] = useState(false);

  // seed
  const [seedLogs,    setSeedLogs]    = useState([]);
  const [seedLoading, setSeedLoading] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);

  // shared output (migrations + seed share the terminal)
  const [activeOutput, setActiveOutput] = useState(null); // 'run' | 'seed'

  async function testConnection() {
    setConnLoading(true);
    setConnResult(null);
    try {
      const { data } = await API.get('/migration/test-connection', { headers });
      setConnResult({ ok: true, ...data });
    } catch (err) {
      setConnResult({ ok: false, message: err.response?.data?.message || 'Connection failed.' });
    } finally {
      setConnLoading(false);
    }
  }

  async function fetchStatus() {
    setStatusLoading(true);
    setStatusError('');
    try {
      const { data } = await API.get('/migration/status', { headers });
      setStatus(data);
    } catch (err) {
      setStatusError(err.response?.data?.message || 'Failed to fetch migration status.');
    } finally {
      setStatusLoading(false);
    }
  }

  async function runMigrations() {
    setRunLoading(true);
    setRunLogs([]);
    setRunSuccess(false);
    setActiveOutput('run');
    try {
      const { data } = await API.post('/migration/run', {}, { headers });
      setRunLogs(data.logs || []);
      setRunSuccess(data.success);
      fetchStatus();
    } catch (err) {
      const logs = err.response?.data?.logs || [];
      const msg  = err.response?.data?.message || 'Migration run failed.';
      setRunLogs(logs.length ? logs : [msg]);
    } finally {
      setRunLoading(false);
    }
  }

  async function seedData() {
    setSeedLoading(true);
    setSeedLogs([]);
    setSeedSuccess(false);
    setActiveOutput('seed');
    try {
      const { data } = await API.post('/migration/seed', {}, { headers });
      setSeedLogs(data.logs || []);
      setSeedSuccess(data.success);
    } catch (err) {
      const logs = err.response?.data?.logs || [];
      const msg  = err.response?.data?.message || 'Seed failed.';
      setSeedLogs(logs.length ? logs : [msg]);
    } finally {
      setSeedLoading(false);
    }
  }

  const outputLogs    = activeOutput === 'seed' ? seedLogs    : runLogs;
  const outputSuccess = activeOutput === 'seed' ? seedSuccess : runSuccess;
  const outputTitle   = activeOutput === 'seed' ? 'Seed Output' : 'Migration Output';

  return (
    <div className="space-y-6">

      {/* Step guide */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s.num} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 text-[10px] font-black flex items-center justify-center shrink-0">
                {s.num}
              </span>
              <span className="text-xs font-semibold text-gray-500">{s.label}</span>
            </div>
            {i < STEPS.length - 1 && <span className="text-gray-300 text-xs">→</span>}
          </div>
        ))}
      </div>

      {/* Buttons row */}
      <div className="flex flex-wrap gap-3">

        {/* Test Connection */}
        <button
          onClick={testConnection}
          disabled={connLoading}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition disabled:opacity-50"
        >
          <HiOutlineLightningBolt size={15} className={connLoading ? 'animate-pulse text-yellow-500' : 'text-yellow-500'} />
          {connLoading ? 'Testing…' : 'Test Connection'}
        </button>

        {/* Check Status */}
        <button
          onClick={fetchStatus}
          disabled={statusLoading}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition disabled:opacity-50"
        >
          <HiOutlineRefresh size={15} className={statusLoading ? 'animate-spin' : ''} />
          {statusLoading ? 'Checking…' : 'Check Status'}
        </button>

        {/* Run Migrations */}
        <button
          onClick={runMigrations}
          disabled={runLoading}
          className="flex items-center gap-2 px-4 py-2.5 bg-green-700 hover:bg-green-800 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50"
        >
          <HiOutlinePlay size={15} />
          {runLoading ? 'Running…' : 'Run Migrations'}
        </button>

        {/* Seed Data */}
        <button
          onClick={seedData}
          disabled={seedLoading}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50"
        >
          <HiOutlineDatabase size={15} />
          {seedLoading ? 'Seeding…' : 'Seed Data'}
        </button>
      </div>

      {/* Connection result */}
      {connResult && (
        <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm ${
          connResult.ok
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          <span className="mt-0.5 shrink-0">{connResult.ok ? '✓' : '✗'}</span>
          <div>
            {connResult.ok ? (
              <>
                <p className="font-semibold">Connection successful</p>
                <p className="text-xs mt-0.5 text-green-600">
                  {connResult.details?.host} · {connResult.details?.user} · DB: <strong>{connResult.details?.database}</strong>
                  {' '}— {connResult.details?.db_exists ? 'database exists' : 'database not yet created'}
                </p>
              </>
            ) : (
              <p className="font-semibold">{connResult.message}</p>
            )}
          </div>
        </div>
      )}

      {/* Status error */}
      {statusError && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          {statusError}
        </div>
      )}

      {/* Migration status tables */}
      {status && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <HiOutlineCheckCircle className="text-green-600" size={16} />
              <span className="text-sm font-bold text-gray-700">Applied ({status.applied.length})</span>
            </div>
            {status.applied.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No migrations applied yet.</p>
            ) : (
              <ul className="space-y-1.5 max-h-64 overflow-y-auto">
                {status.applied.map(m => (
                  <li key={m.filename} className="flex items-start gap-2">
                    <span className="inline-block mt-0.5 w-2 h-2 rounded-full bg-green-400 shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-gray-700 leading-tight">{m.filename}</p>
                      <p className="text-[10px] text-gray-400">{new Date(m.applied_at).toLocaleString()}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <HiOutlineClock className="text-yellow-500" size={16} />
              <span className="text-sm font-bold text-gray-700">Pending ({status.pending.length})</span>
            </div>
            {status.pending.length === 0 ? (
              <p className="text-xs text-green-600 font-medium">All migrations are up to date.</p>
            ) : (
              <ul className="space-y-1.5 max-h-64 overflow-y-auto">
                {status.pending.map(m => (
                  <li key={m.filename} className="flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-yellow-400 shrink-0" />
                    <p className="text-xs font-medium text-gray-700">{m.filename}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Terminal output (shared for migrations + seed) */}
      {outputLogs.length > 0 && (
        <div className="bg-gray-900 rounded-2xl p-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{outputTitle}</p>
          <ul className="space-y-1">
            {outputLogs.map((log, i) => (
              <li key={i} className={`text-xs font-mono ${
                log.startsWith('✓')
                  ? 'text-green-400'
                  : log.startsWith('✗') || log.toLowerCase().includes('fail') || log.toLowerCase().includes('error')
                  ? 'text-red-400'
                  : log.startsWith('~')
                  ? 'text-yellow-400'
                  : 'text-gray-300'
              }`}>
                {log}
              </li>
            ))}
          </ul>
          <p className={`mt-3 text-xs font-semibold ${outputSuccess ? 'text-green-400' : 'text-red-400'}`}>
            {outputSuccess ? 'Completed successfully.' : 'Completed with errors. Check output above.'}
          </p>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { HiOutlineLockClosed } from 'react-icons/hi';

const ADMIN_EMAIL = 'admin@vogue.com';
const ADMIN_PASSWORD = 'admin123';

export default function MigrationGate({ onUnlock }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      onUnlock();
    } else {
      setError('Invalid credentials. Access denied.');
    }
  }

  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mb-3">
            <HiOutlineLockClosed className="text-green-700" size={24} />
          </div>
          <h2 className="text-lg font-bold text-gray-800">Migration Access</h2>
          <p className="text-sm text-gray-500 mt-1 text-center">
            Enter admin credentials to access migration controls.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
              placeholder="admin@vogue.com"
              autoComplete="off"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-xs text-red-500 font-medium">{error}</p>
          )}

          <button
            type="submit"
            className="w-full py-2.5 bg-green-700 hover:bg-green-800 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Unlock Migration
          </button>
        </form>
      </div>
    </div>
  );
}

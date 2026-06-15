import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ForceChangePassword() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 4) {
      return setError('Password must be at least 4 characters long.');
    }
    if (newPassword !== confirmPassword) {
      return setError('Passwords do not match!');
    }

    setLoading(true);
    try {
      // Get the token we saved during the 1234 login
      const token = localStorage.getItem('token'); 

     const response = await fetch(`${import.meta.env.VITE_API_URL}/users/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // We need the token to prove WHO is changing the password
        },
        body: JSON.stringify({ new_password: newPassword }),
      });

      const data = await response.json();

      if (data.success) {
        // Success! Now we can finally send them to the dashboard
        alert('Password updated successfully!');
        
        // Hard redirect to dashboard to reload user state properly
        window.location.href = '/vogueStock/v1/dashboard';
      } else {
        setError(data.message || 'Failed to update password');
      }
    } catch (err) {
      setError('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 border border-brand-cream/60">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-brand-dark mb-2">Update Required</h2>
          <p className="text-sm text-brand-dark/60">
            Your password was reset by an Admin. You must create a new, secure password before accessing the system.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-brand-dark mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-brand-cream bg-gray-50 
                         focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green transition-colors"
              placeholder="Enter new password"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-brand-dark mb-1">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-brand-cream bg-gray-50 
                         focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green transition-colors"
              placeholder="Confirm new password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-brand-green hover:bg-brand-green-dark text-white 
                       font-semibold rounded-lg shadow-sm transition-colors duration-150 disabled:opacity-70"
          >
            {loading ? 'Updating...' : 'Save & Continue to Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { loginUser, clearError } from '../features/auth/authSlice';

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, user  , error } = useSelector(state => state.auth);

  const [form, setForm] = useState({ email: '', password: '', rememberMe: false });
  const [showPass, setShowPass] = useState(false);
const [loginError, setLoginError] = useState('');
  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (user) navigate(from, { replace: true });
  }, [user, navigate, from]);

  useEffect(() => {
    return () => dispatch(clearError());
  }, [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const response = await dispatch(loginUser(form)).unwrap();
      if (response && response.requirePasswordChange) {
        localStorage.setItem('token', response.token);
        navigate('/change-password', { replace: true });
      }
    } catch (err) {
      setLoginError(err?.message || 'Invalid email or password. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white font-['DM_Sans',sans-serif]">
      <div className="w-full max-w-[400px] px-8 py-10 border border-[#e8e8e8]">

        {/* Title */}
        <div className="mb-8 text-center">
          <h1 className="font-['DM_Serif_Display',serif] text-[36px] text-[#111] tracking-[-0.02em]">
            Vogue<span className='text-[#377e1d]'>Stock</span>

          </h1>
          <p className="mt-2 text-sm text-[#777]">
            Please enter your credentials to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold text-[#444] uppercase tracking-[0.05em]">
              Work Email
            </label>
            <input
              type="email"
              value={form.email}
              required
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="e.g. jason.w@hayleys.com"
              className="w-full px-4 py-3.5 border-[1.5px] border-[#d0d0d0] rounded-none bg-white text-sm transition-all focus:bg-white focus:border-[#1a7a4a] focus:shadow-[0_0_0_3px_rgba(26,122,74,0.08)] outline-none"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold text-[#444] uppercase tracking-[0.05em]">
              Password
            </label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={form.password}
                required
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="w-full px-4 py-3.5 border-[1.5px] border-[#d0d0d0] rounded-none bg-white text-sm transition-all focus:bg-white focus:border-[#1a7a4a] focus:shadow-[0_0_0_3px_rgba(26,122,74,0.08)] outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-none border-none text-[#bbb] cursor-pointer text-[13px] hover:text-[#1a7a4a]"
              >
                {showPass ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {loginError && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-none text-[13px] text-red-600 flex items-center gap-2">
              <span>⚠</span>
              <span>{loginError}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-4 px-4 bg-[#377e1d] text-white border-none rounded-none text-sm font-semibold flex items-center justify-center gap-[10px] transition-all hover:bg-[#2d6b17] disabled:bg-[#d1d1d1] disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign in to Dashboard'}
          </button>

        </form>

        <div className="mt-8 p-4 bg-[#fafafa] border border-dashed border-[#e0e0e0] text-[12px] text-[#999] leading-[1.5] text-center">
          This is a secure internal system. Unauthorized access attempts are logged and monitored.
        </div>

        <div className="mt-6 pt-5 flex justify-between border-t border-[#eee]">
          <span className="text-[11px] text-[#bbb]">© 2026 Vogue Software</span>
          <span className="text-[11px] text-[#1a7a4a] font-bold">v1.0.1</span>
        </div>
      </div>
    </div>
  );
}
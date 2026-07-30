import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Lock, Mail, ShieldCheck } from 'lucide-react';
import { apiClient } from '../../api/apiClient';

export const AdminLoginPage: React.FC = () => {
  const [email, setEmail] = useState('admin@holidaycity.com');
  const [password, setPassword] = useState('Holiday@2026');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      const res = await apiClient.post('/auth/login', { email, password });
      
      const { accessToken, user } = res.data.data;
      localStorage.setItem('hc_access_token', accessToken);
      localStorage.setItem('hc_user', JSON.stringify(user));

      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="glass-card-dark w-full max-w-md rounded-3xl p-8 text-white shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#0A6FB5] to-[#57D0C9] flex items-center justify-center text-white mx-auto shadow-lg">
            <Compass className="w-8 h-8" />
          </div>
          <h1 className="font-['Outfit'] font-bold text-3xl">HolidayCity Admin</h1>
          <p className="text-xs text-slate-300">Enter staff credentials to access lead CRM & back-office hub.</p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/50 text-rose-300 text-xs font-semibold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm outline-none focus:border-[#57D0C9]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm outline-none focus:border-[#57D0C9]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#0A6FB5] to-[#57D0C9] text-white font-bold text-sm shadow-lg hover:opacity-90 transition-opacity"
          >
            {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
          </button>
        </form>

        <div className="p-3 rounded-xl bg-slate-800/50 text-[11px] text-slate-400 text-center space-y-1">
          <p className="font-semibold text-slate-300 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#57D0C9]" /> Default Admin Access
          </p>
          <p>Email: <code className="text-[#F6C65B]">admin@holidaycity.com</code></p>
          <p>Pass: <code className="text-[#F6C65B]">Holiday@2026</code></p>
        </div>
      </div>
    </div>
  );
};

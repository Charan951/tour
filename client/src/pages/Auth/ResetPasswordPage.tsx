import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, CheckCircle, XCircle } from 'lucide-react';

const API_BASE = (() => {
  const hosts = [
    `http://${window.location.hostname}:5000/api/v1`,
    'http://localhost:5000/api/v1',
  ];
  return hosts[0];
})();

export const ResetPasswordPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(token || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.trim().length !== 6 && !token) {
      setStatus('error');
      setMessage('Please enter a valid 6-digit OTP code.');
      return;
    }
    if (password.length < 6) {
      setStatus('error');
      setMessage('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setStatus('error');
      setMessage('Passwords do not match.');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const endpoint = token ? `${API_BASE}/auth/reset-password/${token}` : `${API_BASE}/auth/reset-password`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otp: otp.trim(), password }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus('success');
        setMessage(data.message || 'Password reset successfully!');
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setStatus('error');
        setMessage(data.message || 'Reset failed. The OTP code may be invalid or expired.');
      }
    } catch {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f1f5f9 0%, #e0f2fe 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 24,
          boxShadow: '0 20px 60px rgba(10,111,181,0.12)',
          border: '1px solid #e2e8f0',
          width: '100%',
          maxWidth: 440,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0A6FB5 0%, #063B6D 100%)',
            padding: '32px 28px 28px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              background: 'rgba(255,255,255,0.15)',
              borderRadius: '50%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
            }}
          >
            <Lock size={28} color="#fff" />
          </div>
          <h1 style={{ margin: 0, color: '#fff', fontSize: 22, fontWeight: 900 }}>
            Reset Password
          </h1>
          <p style={{ margin: '6px 0 0', color: '#bfdbfe', fontSize: 13, fontWeight: 500 }}>
            HolidayCity Tours — Set your new password
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: '32px 28px' }}>
          {status === 'success' ? (
            <div style={{ textAlign: 'center' }}>
              <CheckCircle size={56} color="#059669" style={{ marginBottom: 16 }} />
              <h2 style={{ margin: '0 0 8px', color: '#0f172a', fontSize: 18, fontWeight: 800 }}>
                Password Updated!
              </h2>
              <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6, margin: '0 0 24px' }}>
                {message}
                <br />Redirecting you to login…
              </p>
              <div
                style={{
                  height: 4,
                  background: '#e2e8f0',
                  borderRadius: 99,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    background: 'linear-gradient(90deg, #0A6FB5, #57D0C9)',
                    borderRadius: 99,
                    animation: 'progressFill 3s linear forwards',
                  }}
                />
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <p style={{ color: '#64748b', fontSize: 13.5, lineHeight: 1.6, margin: '0 0 24px' }}>
                Enter your new password below. It must be at least 6 characters.
              </p>

              {/* New Password */}
              <div style={{ marginBottom: 16 }}>
                <label
                  htmlFor="rp-password"
                  style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}
                >
                  New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="rp-password"
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                    style={{
                      width: '100%',
                      padding: '12px 44px 12px 16px',
                      borderRadius: 12,
                      border: '1.5px solid #e2e8f0',
                      fontSize: 14,
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#0A6FB5')}
                    onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#94a3b8',
                      padding: 0,
                      display: 'flex',
                    }}
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div style={{ marginBottom: 20 }}>
                <label
                  htmlFor="rp-confirm"
                  style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}
                >
                  Confirm New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="rp-confirm"
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    required
                    style={{
                      width: '100%',
                      padding: '12px 44px 12px 16px',
                      borderRadius: 12,
                      border: '1.5px solid #e2e8f0',
                      fontSize: 14,
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#0A6FB5')}
                    onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#94a3b8',
                      padding: 0,
                      display: 'flex',
                    }}
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Error Banner */}
              {status === 'error' && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: 10,
                    padding: '12px 14px',
                    marginBottom: 16,
                    fontSize: 13,
                    color: '#b91c1c',
                  }}
                >
                  <XCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>{message}</span>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={status === 'loading'}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: status === 'loading'
                    ? '#94a3b8'
                    : 'linear-gradient(135deg, #0A6FB5 0%, #063B6D 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 50,
                  fontSize: 14,
                  fontWeight: 900,
                  cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                  transition: 'opacity 0.2s',
                  letterSpacing: 0.3,
                }}
              >
                {status === 'loading' ? 'Updating Password…' : 'Reset My Password'}
              </button>
            </form>
          )}
        </div>
      </div>

      <style>{`
        @keyframes progressFill {
          from { width: 0% }
          to { width: 100% }
        }
      `}</style>
    </div>
  );
};

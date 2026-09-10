import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, ShieldAlert } from 'lucide-react';
import { SEO } from '../../components/common/SEO';
import { apiClient } from '../../api/apiClient';

/**
 * Public account-deletion page — the URL registered in Google Play Console
 * ("Data deletion"). Reachable without logging in so reviewers and users can
 * always find it. A signed-in user can delete from here directly; a signed-out
 * visitor is told how to proceed.
 *
 * Kept in sync with the Flutter app's Profile → "Delete account" flow and the
 * server route DELETE /api/v1/auth/me.
 */

const RETAINED_NOTE =
  'Booking and enquiry records are kept in anonymised form only where accounting or legal rules require it, then deleted.';

const isLoggedIn = () => {
  try {
    return !!localStorage.getItem('hc_token') && !!localStorage.getItem('hc_user');
  } catch {
    return false;
  }
};

const clearSession = () => {
  try {
    ['hc_user', 'hc_user_email', 'hc_token', 'hc_access_token', 'hc_guest_mode', 'hc_guest'].forEach((k) =>
      localStorage.removeItem(k),
    );
  } catch {
    /* ignore */
  }
};

export const DeleteAccountPage: React.FC = () => {
  const navigate = useNavigate();
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const sync = () => setLoggedIn(isLoggedIn());
    window.addEventListener('hc_user_updated', sync);
    return () => window.removeEventListener('hc_user_updated', sync);
  }, []);

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  const handleDelete = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await apiClient.delete('/auth/me');
      if (res.data?.success) {
        clearSession();
        window.dispatchEvent(new Event('hc_user_updated'));
        setDone(true);
      } else {
        setError(res.data?.message || 'Could not delete your account. Please try again.');
      }
    } catch (e: any) {
      setError(
        e?.response?.data?.message ||
          'Could not reach the server. Please try again, or contact support.',
      );
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas">
      <SEO
        title="Delete Your Account | HolidayCity"
        description="How to permanently delete your HolidayCity account and what happens to your data."
      />

      <div className="mx-auto max-w-3xl px-5 py-10 sm:py-14">
        <button
          type="button"
          onClick={goBack}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-ocean-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="mt-6 flex items-center gap-3">
          <span className="grid place-items-center w-11 h-11 rounded-2xl bg-red-50 text-red-600">
            <Trash2 className="w-5 h-5" />
          </span>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-slate-900 tracking-tight">
            Delete your account
          </h1>
        </div>

        <div className="mt-8 space-y-8">
          <section>
            <h2 className="font-display font-extrabold text-lg text-slate-900">What gets deleted</h2>
            <div className="mt-2 space-y-2.5 text-sm leading-relaxed text-slate-600">
              <p>
                Deleting your account permanently removes your login and personal profile data
                (name, email, phone, city and preferences) from HolidayCity.
              </p>
              <p>{RETAINED_NOTE}</p>
              <p>This action cannot be undone.</p>
            </div>
          </section>

          <section>
            <h2 className="font-display font-extrabold text-lg text-slate-900">How to delete</h2>
            <div className="mt-2 space-y-2.5 text-sm leading-relaxed text-slate-600">
              <p>
                <strong>In the mobile app:</strong> open <em>Profile → Delete account</em> and
                confirm.
              </p>
              <p>
                <strong>On the web:</strong> sign in, then use the button below.
              </p>
              <p>
                If you cannot sign in, send an account-deletion request from your registered
                email address through our{' '}
                <Link to="/contact" className="font-bold text-ocean-600 hover:underline">
                  contact page
                </Link>{' '}
                or the in-app support chat. We will delete the account within 30 days.
              </p>
            </div>
          </section>

          {done ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              Your account has been deleted. You have been signed out.{' '}
              <Link to="/" className="font-bold underline">
                Return home
              </Link>
              .
            </div>
          ) : loggedIn ? (
            <section className="rounded-2xl border border-red-200 bg-red-50/60 p-5">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-900">Delete this account now</p>
                  <p className="mt-1 text-sm text-slate-600">
                    You are signed in. This will immediately and permanently delete your account.
                  </p>

                  {error && (
                    <p className="mt-3 text-sm font-medium text-red-700" role="alert">
                      {error}
                    </p>
                  )}

                  {!confirming ? (
                    <button
                      type="button"
                      onClick={() => setConfirming(true)}
                      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" /> Delete my account
                    </button>
                  ) : (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={handleDelete}
                        className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
                      >
                        {busy ? 'Deleting…' : 'Yes, permanently delete'}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setConfirming(false)}
                        className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </section>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
              You are not signed in.{' '}
              <Link to="/login" className="font-bold text-ocean-600 hover:underline">
                Sign in
              </Link>{' '}
              to delete your account from the web, or email support as described above.
            </div>
          )}
        </div>

        <p className="mt-12 text-xs text-slate-400">
          See also{' '}
          <Link to="/privacy" className="font-bold text-ocean-600 hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
};

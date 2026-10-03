import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { X, Lock, Mail, User as UserIcon, KeyRound, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

const GMAIL_REGEX = /^[a-zA-Z0-9](\.?[a-zA-Z0-9_-])*@gmail\.com$/i;

export const AuthModal = ({ isOpen, onClose, initialMode = 'SIGN_IN', initialToken = '' }) => {
  const { login, register } = useAuth();
  
  // Modes: 'SIGN_IN' | 'SIGN_UP' | 'FORGOT_PASSWORD' | 'RESET_PASSWORD'
  const [mode, setMode] = useState(initialMode);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState(initialToken);
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (initialMode) setMode(initialMode);
    if (initialToken) setResetToken(initialToken);
  }, [initialMode, initialToken, isOpen]);

  if (!isOpen) return null;

  const validateInputs = () => {
    const trimmedEmail = email.trim();
    if (!GMAIL_REGEX.test(trimmedEmail)) {
      setError('Only valid Gmail addresses (e.g. yourname@gmail.com) are allowed.');
      return false;
    }

    if (mode === 'SIGN_UP' && (!name.trim() || name.trim().length < 2)) {
      setError('Please enter your name (at least 2 characters).');
      return false;
    }

    if ((mode === 'SIGN_IN' || mode === 'SIGN_UP' || mode === 'RESET_PASSWORD') && password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return false;
    }

    if ((mode === 'SIGN_UP' || mode === 'RESET_PASSWORD') && password !== confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }

    return true;
  };

  const handleSignInOrUp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!validateInputs()) return;

    setLoading(true);
    try {
      if (mode === 'SIGN_UP') {
        const res = await register(name.trim(), email.trim().toLowerCase(), password);
        if (res.success) {
          onClose();
        } else {
          setError(res.message || 'Registration failed');
        }
      } else {
        const res = await login(email.trim().toLowerCase(), password);
        if (res.success) {
          onClose();
        } else {
          setError(res.message || 'Invalid email or password.');
        }
      }
    } catch (err) {
      setError('A connection error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const trimmedEmail = email.trim();
    if (!GMAIL_REGEX.test(trimmedEmail)) {
      setError('Only valid Gmail addresses (e.g. yourname@gmail.com) are allowed.');
      return false;
    }

    setLoading(true);
    try {
      const res = await api.forgotPassword(trimmedEmail);
      if (res.success) {
        setSuccessMsg(res.message);
        if (res.metadata && res.metadata.devResetToken) {
          // Dev convenience: prefill reset token
          setResetToken(res.metadata.devResetToken);
        }
        setTimeout(() => {
          setMode('RESET_PASSWORD');
          setSuccessMsg('Enter your reset token and new password below.');
        }, 1500);
      } else {
        setError(res.message || 'Unable to process reset request.');
      }
    } catch (err) {
      setError('Error requesting password reset. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!resetToken.trim()) {
      setError('Reset token is required.');
      return;
    }

    if (password.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.resetPassword(resetToken.trim(), password);
      if (res.success) {
        setSuccessMsg(res.message);
        setTimeout(() => {
          setMode('SIGN_IN');
          setPassword('');
          setConfirmPassword('');
          setResetToken('');
        }, 2000);
      } else {
        setError(res.message || 'Failed to reset password. Token may be invalid or expired.');
      }
    } catch (err) {
      setError('Error resetting password. Please verify your token.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setError('');
    setSuccessMsg('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#FAF8F5] border border-[#E8E1D5] rounded-3xl w-full max-w-md p-6 sm:p-7 shadow-xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 transition"
        >
          <X size={20} />
        </button>

        {/* Brand & Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-700/10 text-amber-800 flex items-center justify-center mx-auto mb-2 text-2xl font-serif">
            🕉️
          </div>
          <h3 className="font-serif text-xl font-bold text-stone-800">
            {mode === 'SIGN_UP' && 'Create Your Sanctuary'}
            {mode === 'SIGN_IN' && 'Welcome Back to VedAI'}
            {mode === 'FORGOT_PASSWORD' && 'Reset Your Password'}
            {mode === 'RESET_PASSWORD' && 'Set New Password'}
          </h3>
          <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
            {mode === 'SIGN_UP' && 'Begin your self-reflection journey with your private Gmail account.'}
            {mode === 'SIGN_IN' && 'Sign in to access your private journal, notes, and journey.'}
            {mode === 'FORGOT_PASSWORD' && 'Enter your registered Gmail address to receive reset instructions.'}
            {mode === 'RESET_PASSWORD' && 'Enter your security token and choose a new password (min. 8 characters).'}
          </p>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="p-3 mb-4 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200 flex items-start gap-2">
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 mb-4 rounded-xl bg-emerald-50 text-emerald-800 text-xs border border-emerald-200 flex items-start gap-2">
            <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* FORM 1: SIGN IN & SIGN UP */}
        {(mode === 'SIGN_IN' || mode === 'SIGN_UP') && (
          <form onSubmit={handleSignInOrUp} className="space-y-3.5">
            {mode === 'SIGN_UP' && (
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Full Name</label>
                <div className="relative">
                  <UserIcon size={16} className="absolute left-3 top-3 text-stone-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Arjuna"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:border-amber-700 bg-white"
                  />
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-stone-700">Gmail Address</label>
                <span className="text-[10px] text-amber-900 font-medium">@gmail.com only</span>
              </div>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-3 text-stone-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:border-amber-700 bg-white"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-stone-700">Password</label>
                {mode === 'SIGN_IN' && (
                  <button
                    type="button"
                    onClick={() => switchMode('FORGOT_PASSWORD')}
                    className="text-[11px] text-amber-800 hover:underline font-medium"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-3 text-stone-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:border-amber-700 bg-white"
                />
              </div>
              <div className="text-[10px] text-stone-400 mt-1">Minimum 8 characters</div>
            </div>

            {mode === 'SIGN_UP' && (
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Confirm Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-3 text-stone-400" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:border-amber-700 bg-white"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-amber-700 text-white font-medium text-sm hover:bg-amber-800 transition shadow-sm mt-3 disabled:opacity-60"
            >
              {loading ? 'Please wait...' : mode === 'SIGN_UP' ? 'Create Account' : 'Sign In'}
            </button>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => switchMode(mode === 'SIGN_IN' ? 'SIGN_UP' : 'SIGN_IN')}
                className="text-xs text-amber-900 hover:underline font-medium"
              >
                {mode === 'SIGN_IN'
                  ? "Don't have an account? Sign Up"
                  : 'Already have an account? Sign In'}
              </button>
            </div>
          </form>
        )}

        {/* FORM 2: FORGOT PASSWORD */}
        {mode === 'FORGOT_PASSWORD' && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Registered Gmail Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-3 text-stone-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:border-amber-700 bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-amber-700 text-white font-medium text-sm hover:bg-amber-800 transition shadow-sm disabled:opacity-60"
            >
              {loading ? 'Sending Request...' : 'Send Reset Instructions'}
            </button>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => switchMode('SIGN_IN')}
                className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800"
              >
                <ArrowLeft size={13} /> Back to Sign In
              </button>
              <button
                type="button"
                onClick={() => switchMode('RESET_PASSWORD')}
                className="text-xs text-amber-900 hover:underline font-medium"
              >
                Already have a token?
              </button>
            </div>
          </form>
        )}

        {/* FORM 3: RESET PASSWORD */}
        {mode === 'RESET_PASSWORD' && (
          <form onSubmit={handleResetPassword} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Reset Security Token</label>
              <div className="relative">
                <KeyRound size={16} className="absolute left-3 top-3 text-stone-400" />
                <input
                  type="text"
                  required
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  placeholder="Paste your 64-character token"
                  className="w-full pl-9 pr-3 py-2 text-xs font-mono rounded-xl border border-stone-300 focus:outline-none focus:border-amber-700 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">New Password (Min 8 chars)</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-3 text-stone-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:border-amber-700 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Confirm New Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-3 text-stone-400" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:border-amber-700 bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-amber-700 text-white font-medium text-sm hover:bg-amber-800 transition shadow-sm mt-2 disabled:opacity-60"
            >
              {loading ? 'Resetting Password...' : 'Update Password'}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => switchMode('SIGN_IN')}
                className="text-xs text-stone-500 hover:text-stone-800"
              >
                Cancel and return to Sign In
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

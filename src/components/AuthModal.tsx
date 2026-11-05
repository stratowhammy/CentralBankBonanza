import React, { useState } from 'react';
import { User } from '../types';
import { api } from '../api';
import { X, UserCircle, Key, UserCheck, Shield } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (tab === 'register') {
        const res = await api.register(username, password, displayName);
        onSuccess(res.user);
        onClose();
      } else {
        const res = await api.login(username, password);
        onSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.guestLogin();
      onSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Guest login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center p-0 md:p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md max-h-[90vh] md:max-h-none overflow-y-auto bg-slate-900 border-t md:border border-slate-800 rounded-t-[7vw] md:rounded-2xl p-6 sm:p-8 shadow-2xl">
        
        {/* Android Drag Handle (Mobile Only) */}
        <div className="md:hidden w-[11vw] h-[0.55vh] min-h-[4px] rounded-full bg-slate-600/50 mx-auto mb-[1.5vh] flex-shrink-0" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center mb-3">
            <UserCircle className="w-6 h-6" />
          </div>
          <h2 className="font-prestige text-xl font-bold text-slate-100">
            {tab === 'login' ? 'Sign In' : 'Create an Account'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Registration required to run simulations and track career achievements across CBS & Statecraft.
          </p>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-950 rounded-xl mb-6 border border-slate-800">
          <button
            type="button"
            onClick={() => { setTab('login'); setError(null); }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              tab === 'login'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setTab('register'); setError(null); }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              tab === 'register'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {tab === 'register' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Display / Official Title
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Chair Helena Vance or Rep. Marcus Sterling"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. hvance"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-amber-950/30"
          >
            {loading ? 'Processing...' : (tab === 'login' ? 'Confirm Credentials' : 'Create Registered Account')}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-slate-800/80 text-center">
          <p className="text-[11px] text-slate-400">
            Account registration is required to start and advance simulations.
          </p>
        </div>

      </div>
    </div>
  );
};

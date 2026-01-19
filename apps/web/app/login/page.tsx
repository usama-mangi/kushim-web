'use client';

import { useState, useEffect, Suspense } from 'react';
import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Mail, Github, Chrome, ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'credentials' | 'mfa'>('credentials');
  const [tempToken, setTempToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      localStorage.setItem('token', token);
      router.push('/');
    }
  }, [router, searchParams]);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/login`, {
        email,
        password,
      });
      
      if (response.data.mfaRequired) {
        setTempToken(response.data.temp_token);
        setStep('mfa');
      } else {
        localStorage.setItem('token', response.data.access_token);
        router.push('/');
      }
    } catch (err) {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/mfa/login`,
        { token: otp },
        { headers: { Authorization: `Bearer ${tempToken}` } }
      );
      localStorage.setItem('token', response.data.access_token);
      router.push('/');
    } catch (err) {
      setError('Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/${provider}`;
  };

  return (
    <div className="flex h-screen bg-slate-950 items-center justify-center font-sans selection:bg-indigo-500/30">
      <div className="w-full max-w-md px-4">
        {/* Logo/Brand */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/20 mb-4 transform -rotate-6">
            <span className="text-white font-black text-3xl">K</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Kushim</h1>
          <p className="text-slate-500 text-sm font-medium uppercase tracking-widest mt-1">The Ambient Ledger</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl shadow-black/50">
          <h2 className="text-xl font-bold text-white mb-6">
            {step === 'credentials' ? 'Welcome back' : 'Security Verification'}
          </h2>
          
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-bold flex items-center animate-in fade-in slide-in-from-top-2">
              <ShieldCheck className="w-4 h-4 mr-2 shrink-0" />
              {error}
            </div>
          )}

          {step === 'credentials' ? (
            <form onSubmit={handleCredentialsSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-3.5 h-5 w-5 text-slate-600 group-focus-within:text-indigo-500 transition" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 pl-12 pr-4 py-3.5 rounded-xl text-white placeholder-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                    placeholder="you@kushim.io"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Password</label>
                  <Link href="/forgot-password" className="text-[10px] font-bold text-indigo-500 hover:text-indigo-400 uppercase tracking-widest transition">Forgot?</Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-600 group-focus-within:text-indigo-500 transition" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 pl-12 pr-4 py-3.5 rounded-xl text-white placeholder-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white py-4 rounded-xl font-bold transition shadow-lg shadow-indigo-500/20 flex items-center justify-center group"
              >
                {loading ? 'Authenticating...' : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleMfaSubmit} className="space-y-8">
              <div className="space-y-4 text-center">
                <p className="text-sm text-slate-400">
                  Enter the 6-digit verification code from your authenticator app.
                </p>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-center text-3xl font-mono tracking-[0.5em] py-5 rounded-2xl text-white placeholder-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                  placeholder="000000"
                  maxLength={6}
                  autoFocus
                  required
                />
              </div>
              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white py-4 rounded-xl font-bold transition shadow-lg shadow-indigo-500/20"
                >
                  {loading ? 'Verifying...' : 'Complete Login'}
                </button>
                <button
                  type="button"
                  onClick={() => setStep('credentials')}
                  className="w-full text-slate-500 text-xs font-bold uppercase tracking-widest hover:text-slate-300 transition py-2"
                >
                  Back to credentials
                </button>
              </div>
            </form>
          )}

          {step === 'credentials' && (
            <div className="mt-10">
              <div className="relative mb-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800"></div>
                </div>
                <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest">
                  <span className="px-4 bg-slate-900 text-slate-600">Enterprise SSO</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleSocialLogin('github')}
                  className="flex items-center justify-center px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800 hover:border-slate-700 transition shadow-inner"
                >
                  <Github className="h-4 w-4 mr-2" />
                  GitHub
                </button>
                <button
                  onClick={() => handleSocialLogin('google')}
                  className="flex items-center justify-center px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800 hover:border-slate-700 transition shadow-inner"
                >
                  <Chrome className="h-4 w-4 mr-2" />
                  Google
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="mt-8 text-center text-sm text-slate-500 font-medium">
          Don't have an account?{' '}
          <Link href="/signup" className="text-indigo-500 font-bold hover:text-indigo-400 transition underline-offset-4 hover:underline">
            Initialize access
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-slate-950 flex items-center justify-center text-slate-500 font-mono text-xs uppercase tracking-widest animate-pulse">Establishing secure link...</div>}>
      <LoginContent />
    </Suspense>
  );
}

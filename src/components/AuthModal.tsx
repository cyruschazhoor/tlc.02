/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, User as UserIcon, BookOpen, Sparkles } from 'lucide-react';
import { db } from '../lib/db';
import { User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User) => void;
  initialTab?: 'signin' | 'signup';
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess, initialTab = 'signin' }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'student' | 'tutor'>('student');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'microsoft' | 'icloud' | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSocialSignIn = async (provider: 'google' | 'microsoft' | 'icloud') => {
    setSocialLoading(provider);
    setLoading(true);
    setError(null);

    try {
      // Simulate real OAuth secure connection handshake latency
      await new Promise(resolve => setTimeout(resolve, 1200));

      let socialEmail = '';
      let socialName = '';
      const baseUsernames = ['alex.jones', 'taylor.swift', 'jordan.lee', 'casey.miller', 'morgan.chase', 'jamie.adams', 'sam.wilson'];
      const firstNames = ['Alex', 'Taylor', 'Jordan', 'Casey', 'Morgan', 'Jamie', 'Sam'];
      const lastNames = ['Jones', 'Swift', 'Lee', 'Miller', 'Chase', 'Adams', 'Wilson'];
      
      const randomIdx = Math.floor(Math.random() * baseUsernames.length);
      const chosenEmailBase = email.split('@')[0].trim() || baseUsernames[randomIdx];
      const chosenName = fullName.trim() || `${firstNames[randomIdx]} ${lastNames[randomIdx]}`;

      if (provider === 'google') {
        socialEmail = `${chosenEmailBase}@gmail.com`;
        socialName = `${chosenName} (Google)`;
      } else if (provider === 'microsoft') {
        socialEmail = `${chosenEmailBase}@outlook.com`;
        socialName = `${chosenName} (Microsoft)`;
      } else {
        socialEmail = `${chosenEmailBase}@icloud.com`;
        socialName = `${chosenName} (iCloud)`;
      }

      // Check if user already exists
      const localUsers = JSON.parse(localStorage.getItem('lt_users') || '[]');
      let existingUser = localUsers.find((u: any) => u.email === socialEmail);

      if (!existingUser) {
        // Create brand new social user
        existingUser = await db.signUp(socialEmail, 'social-oauth-pass-123', socialName, role);
      } else {
        // Sign in existing social user
        existingUser = await db.signIn(socialEmail, 'social-oauth-pass-123');
      }

      onAuthSuccess(existingUser);
      onClose();
    } catch (err: any) {
      setError(err.message || `An error occurred connecting to ${provider}.`);
    } finally {
      setSocialLoading(null);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (activeTab === 'signup') {
        if (!fullName.trim()) throw new Error('Please enter your full name.');
        if (password.length < 6) throw new Error('Password must be at least 6 characters long.');
        
        const user = await db.signUp(email, password, fullName, role);
        onAuthSuccess(user);
        onClose();
      } else {
        const user = await db.signIn(email, password);
        onAuthSuccess(user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'An authentication error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-sm">
      {/* Backdrop animation */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0"
        onClick={onClose}
      />

      <motion.div
        initial={{ scale: 0.92, y: 15, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.92, y: 15, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="relative w-full max-w-md bg-[#FDFCF8] dark:bg-[#1c1f1c] border border-[#E6E2D3] dark:border-stone-800 rounded-2xl shadow-lg p-6 overflow-hidden z-10"
      >
        {/* Playful background blobs & doodles */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-[#5F7161]/5 rounded-full blur-2xl opacity-60 -mr-6 -mt-6 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#E7AB79]/5 rounded-full blur-2xl opacity-60 -ml-6 -mb-6 pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#E6E2D3] dark:border-stone-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#E7AB79]/15 border border-[#E7AB79]/20 rounded-xl">
              <Sparkles className="w-5 h-5 text-[#8E613B] fill-[#E7AB79]/30" />
            </div>
            <h3 className="text-xl font-serif font-bold text-[#2D3A30] dark:text-stone-100 tracking-tight">
              {activeTab === 'signup' ? 'Join the Collective' : 'Welcome Back'}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-neutral-100 dark:hover:bg-stone-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-stone-100 rounded-full transition-colors border border-transparent hover:border-[#E6E2D3] dark:hover:border-stone-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 gap-2 mb-6 p-1.5 bg-[#F9F7F0] dark:bg-[#121513] border border-[#E6E2D3] dark:border-stone-800 rounded-2xl">
          <button
            onClick={() => { setActiveTab('signin'); setError(null); }}
            className={`py-2 text-sm font-bold rounded-xl border transition-all ${
              activeTab === 'signin'
                ? 'bg-white dark:bg-[#1c1f1c] border-[#E6E2D3] dark:border-stone-800 text-[#2D3A30] dark:text-stone-100 shadow-sm'
                : 'border-transparent text-[#9A9483] dark:text-stone-400 hover:text-[#5F7161] dark:hover:text-[#a5bca7]'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setActiveTab('signup'); setError(null); }}
            className={`py-2 text-sm font-bold rounded-xl border transition-all ${
              activeTab === 'signup'
                ? 'bg-white dark:bg-[#1c1f1c] border-[#E6E2D3] dark:border-stone-800 text-[#2D3A30] dark:text-stone-100 shadow-sm'
                : 'border-transparent text-[#9A9483] dark:text-stone-400 hover:text-[#5F7161] dark:hover:text-[#a5bca7]'
            }`}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="p-3 mb-4 text-sm font-semibold text-rose-700 bg-rose-50/50 border border-rose-200 rounded-xl flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {activeTab === 'signup' && (
            <>
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#6B6B6B] dark:text-stone-300 uppercase tracking-wider block">Full Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9A9483] dark:text-stone-400">
                    <UserIcon className="w-5 h-5" />
                  </span>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Sarah Jenkins"
                    className="w-full pl-11 pr-4 py-3 border border-[#E6E2D3] dark:border-stone-800 rounded-xl text-sm font-semibold bg-white dark:bg-[#121513] text-[#3D3D3D] dark:text-stone-200 focus:outline-none focus:border-[#5F7161] transition-colors"
                  />
                </div>
              </div>

              {/* Role Picker */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#6B6B6B] dark:text-stone-300 uppercase tracking-wider block">Are you a Student or Tutor?</label>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <label className={`flex items-center gap-2 p-3 border rounded-xl cursor-pointer transition-all ${
                    role === 'student' 
                      ? 'bg-[#5F7161]/10 dark:bg-[#5F7161]/25 border-[#5F7161] text-[#2D3A30] dark:text-stone-100 shadow-sm' 
                      : 'border-[#E6E2D3] dark:border-stone-800 bg-[#FDFCF8] dark:bg-[#121513] text-[#6B6B6B] dark:text-stone-300 hover:border-[#5F7161]/50'
                  }`}>
                    <input 
                      type="radio" 
                      name="role" 
                      value="student" 
                      checked={role === 'student'} 
                      onChange={() => setRole('student')}
                      className="sr-only"
                    />
                    <BookOpen className="w-4 h-4 text-[#5F7161]" />
                    <span className="text-xs font-bold">Student</span>
                  </label>
                  <label className={`flex items-center gap-2 p-3 border rounded-xl cursor-pointer transition-all ${
                    role === 'tutor' 
                      ? 'bg-[#5F7161]/10 dark:bg-[#5F7161]/25 border-[#5F7161] text-[#2D3A30] dark:text-stone-100 shadow-sm' 
                      : 'border-[#E6E2D3] dark:border-stone-800 bg-[#FDFCF8] dark:bg-[#121513] text-[#6B6B6B] dark:text-stone-300 hover:border-[#5F7161]/50'
                  }`}>
                    <input 
                      type="radio" 
                      name="role" 
                      value="tutor" 
                      checked={role === 'tutor'} 
                      onChange={() => setRole('tutor')}
                      className="sr-only"
                    />
                    <Sparkles className="w-4 h-4 text-[#E7AB79]" />
                    <span className="text-xs font-bold">Tutor</span>
                  </label>
                </div>
              </div>
            </>
          )}

          {/* Email */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#6B6B6B] dark:text-stone-300 uppercase tracking-wider block">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9A9483] dark:text-stone-400">
                <Mail className="w-5 h-5" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-11 pr-4 py-3 border border-[#E6E2D3] dark:border-stone-800 rounded-xl text-sm font-semibold bg-white dark:bg-[#121513] text-[#3D3D3D] dark:text-stone-200 focus:outline-none focus:border-[#5F7161] transition-colors"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#6B6B6B] dark:text-stone-300 uppercase tracking-wider block">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9A9483] dark:text-stone-400">
                <Lock className="w-5 h-5" />
              </span>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 border border-[#E6E2D3] dark:border-stone-800 rounded-xl text-sm font-semibold bg-white dark:bg-[#121513] text-[#3D3D3D] dark:text-stone-200 focus:outline-none focus:border-[#5F7161] transition-colors"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-2 bg-[#5F7161] hover:bg-[#4D5C4F] text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 border border-[#5F7161] cursor-pointer shadow-sm"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : activeTab === 'signup' ? (
              'Create My Account'
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#E6E2D3] dark:border-stone-800"></div>
          </div>
          <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-wider">
            <span className="px-2 bg-[#FDFCF8] dark:bg-[#1c1f1c] text-[#9A9483] dark:text-stone-400">Or continue with</span>
          </div>
        </div>

        {/* Social Logins */}
        <div className="grid grid-cols-1 gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={() => handleSocialSignIn('google')}
            className="w-full py-2.5 px-4 border border-[#E6E2D3] dark:border-stone-800 bg-white dark:bg-[#1c1f1c] hover:bg-[#FAF9F5] dark:hover:bg-stone-800 text-neutral-700 dark:text-stone-300 font-bold text-xs rounded-xl transition-all flex items-center justify-center cursor-pointer shadow-sm disabled:opacity-60"
          >
            {socialLoading === 'google' ? (
              <span className="w-4 h-4 border-2 border-slate-600 dark:border-slate-400 border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <svg className="w-4 h-4 mr-2 shrink-0" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
              </svg>
            )}
            {socialLoading === 'google' ? 'Connecting Securely...' : 'Continue with Google'}
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleSocialSignIn('microsoft')}
            className="w-full py-2.5 px-4 border border-[#E6E2D3] dark:border-stone-800 bg-white dark:bg-[#1c1f1c] hover:bg-[#FAF9F5] dark:hover:bg-stone-800 text-neutral-700 dark:text-stone-300 font-bold text-xs rounded-xl transition-all flex items-center justify-center cursor-pointer shadow-sm disabled:opacity-60"
          >
            {socialLoading === 'microsoft' ? (
              <span className="w-4 h-4 border-2 border-slate-600 dark:border-slate-400 border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <svg className="w-3.5 h-3.5 mr-2 shrink-0" viewBox="0 0 23 23" width="23" height="23" xmlns="http://www.w3.org/2000/svg">
                <path fill="#f35325" d="M1 1h10v10H1z" />
                <path fill="#81bc06" d="M12 1h10v10H12z" />
                <path fill="#05a6f0" d="M1 12h10v10H1z" />
                <path fill="#ffba08" d="M12 12h10v10H12z" />
              </svg>
            )}
            {socialLoading === 'microsoft' ? 'Verifying Profile...' : 'Continue with Microsoft'}
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleSocialSignIn('icloud')}
            className="w-full py-2.5 px-4 border border-[#E6E2D3] dark:border-stone-800 bg-white dark:bg-[#1c1f1c] hover:bg-[#FAF9F5] dark:hover:bg-stone-800 text-neutral-700 dark:text-stone-300 font-bold text-xs rounded-xl transition-all flex items-center justify-center cursor-pointer shadow-sm disabled:opacity-60"
          >
            {socialLoading === 'icloud' ? (
              <span className="w-4 h-4 border-2 border-slate-600 dark:border-slate-400 border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <svg className="w-4 h-4 mr-2 text-sky-500 fill-sky-50/20 shrink-0" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.5 19A3.5 3.5 0 0 0 21 15.5c0-2.79-2.54-4.5-5-4.5-.42 0-.83.07-1.22.2A6 6 0 0 0 5 13c0 2.18 1.43 4.15 3.5 4.7" />
              </svg>
            )}
            {socialLoading === 'icloud' ? 'iCloud Authorization...' : 'Continue with iCloud'}
          </button>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs font-bold text-[#9A9483] dark:text-stone-400 mt-6 leading-relaxed">
          {activeTab === 'signup' ? (
            <>
              By registering, you agree to join a vibrant community of lifelong learners and educators. 🌿
            </>
          ) : (
            <>
              Forgot your details? Email our learning coordinator at <span className="text-[#5F7161] dark:text-[#a5bca7] font-extrabold hover:underline cursor-pointer">hello@thelearningcollective.edu</span>.
            </>
          )}
        </p>
      </motion.div>
    </div>
  );
}

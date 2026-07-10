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
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

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
        className="relative w-full max-w-md bg-[#FDFCF8] border border-[#E6E2D3] rounded-2xl shadow-lg p-6 overflow-hidden z-10"
      >
        {/* Playful background blobs & doodles */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-[#5F7161]/5 rounded-full blur-2xl opacity-60 -mr-6 -mt-6 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#E7AB79]/5 rounded-full blur-2xl opacity-60 -ml-6 -mb-6 pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#E6E2D3]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#E7AB79]/15 border border-[#E7AB79]/20 rounded-xl">
              <Sparkles className="w-5 h-5 text-[#8E613B] fill-[#E7AB79]/30" />
            </div>
            <h3 className="text-xl font-serif font-bold text-[#2D3A30] tracking-tight">
              {activeTab === 'signup' ? 'Join the Collective' : 'Welcome Back'}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900 rounded-full transition-colors border border-transparent hover:border-[#E6E2D3]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 gap-2 mb-6 p-1.5 bg-[#F9F7F0] border border-[#E6E2D3] rounded-2xl">
          <button
            onClick={() => { setActiveTab('signin'); setError(null); }}
            className={`py-2 text-sm font-bold rounded-xl border transition-all ${
              activeTab === 'signin'
                ? 'bg-white border-[#E6E2D3] text-[#2D3A30] shadow-sm'
                : 'border-transparent text-[#9A9483] hover:text-[#5F7161]'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setActiveTab('signup'); setError(null); }}
            className={`py-2 text-sm font-bold rounded-xl border transition-all ${
              activeTab === 'signup'
                ? 'bg-white border-[#E6E2D3] text-[#2D3A30] shadow-sm'
                : 'border-transparent text-[#9A9483] hover:text-[#5F7161]'
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
                <label className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wider block">Full Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9A9483]">
                    <UserIcon className="w-5 h-5" />
                  </span>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Sarah Jenkins"
                    className="w-full pl-11 pr-4 py-3 border border-[#E6E2D3] rounded-xl text-sm font-semibold bg-white focus:outline-none focus:border-[#5F7161]/50 transition-colors"
                  />
                </div>
              </div>

              {/* Role Picker */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wider block">Are you a Student or Tutor?</label>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <label className={`flex items-center gap-2 p-3 border rounded-xl cursor-pointer transition-all ${
                    role === 'student' 
                      ? 'bg-[#5F7161]/10 border-[#5F7161] text-[#2D3A30] shadow-sm' 
                      : 'border-[#E6E2D3] bg-[#FDFCF8] text-[#6B6B6B] hover:border-[#5F7161]/50'
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
                      ? 'bg-[#5F7161]/10 border-[#5F7161] text-[#2D3A30] shadow-sm' 
                      : 'border-[#E6E2D3] bg-[#FDFCF8] text-[#6B6B6B] hover:border-[#5F7161]/50'
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
            <label className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wider block">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9A9483]">
                <Mail className="w-5 h-5" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-11 pr-4 py-3 border border-[#E6E2D3] rounded-xl text-sm font-semibold bg-white focus:outline-none focus:border-[#5F7161]/50 transition-colors"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wider block">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9A9483]">
                <Lock className="w-5 h-5" />
              </span>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 border border-[#E6E2D3] rounded-xl text-sm font-semibold bg-white focus:outline-none focus:border-[#5F7161]/50 transition-colors"
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

        {/* Footer info */}
        <p className="text-center text-xs font-bold text-[#9A9483] mt-6 leading-relaxed">
          {activeTab === 'signup' ? (
            <>
              By registering, you agree to join a vibrant community of lifelong learners and educators. 🌿
            </>
          ) : (
            <>
              Forgot your details? Email our learning coordinator at <span className="text-[#5F7161] font-extrabold hover:underline cursor-pointer">hello@thelearningcollective.edu</span>.
            </>
          )}
        </p>
      </motion.div>
    </div>
  );
}

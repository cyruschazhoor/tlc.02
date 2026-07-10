/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CreditCard, Calendar, ShieldCheck, CheckCircle2, Sparkles } from 'lucide-react';
import { Session } from '../types';

interface PaymentModalProps {
  session: Session | null;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (sessionId: string) => void;
}

export default function PaymentModal({ session, isOpen, onClose, onPaymentSuccess }: PaymentModalProps) {
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [name, setName] = useState('');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen || !session) return null;

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').substring(0, 16);
    const formatted = value.match(/.{1,4}/g)?.join(' ') || value;
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '').substring(0, 4);
    if (value.length > 2) {
      value = `${value.substring(0, 2)}/${value.substring(2)}`;
    }
    setExpiry(value);
  };

  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').substring(0, 3);
    setCvc(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);

    // Simulate secure network transaction processing
    setTimeout(() => {
      setProcessing(false);
      setSuccess(true);
      
      // Trigger short positive chime synth
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        oscillator.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
        oscillator.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2); // G5
        oscillator.frequency.setValueAtTime(1046.50, audioCtx.currentTime + 0.3); // C6
        
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.65);
        
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.7);
      } catch (err) {}

    }, 2500);
  };

  const handleCloseSuccess = () => {
    onPaymentSuccess(session.id);
    setSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-lg bg-[#FDFCF8] dark:bg-[#1c1f1c] border border-[#E6E2D3] dark:border-stone-800 rounded-2xl shadow-lg overflow-hidden z-10"
      >
        <AnimatePresence mode="wait">
          {!success ? (
            <motion.div
              key="payment-form"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-6"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#E6E2D3] dark:border-stone-800">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-[#5F7161]/15 border border-[#5F7161]/20 rounded-xl">
                    <CreditCard className="w-5 h-5 text-[#5F7161]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-serif font-bold text-[#2D3A30] dark:text-stone-100 leading-tight">Checkout</h3>
                    <p className="text-xs text-neutral-500 dark:text-stone-400 font-bold mt-0.5">Secure payment powered by Supabase Stripe demo</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 hover:bg-neutral-100 dark:hover:bg-stone-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-stone-100 rounded-full transition-colors border border-transparent hover:border-[#E6E2D3] dark:hover:border-stone-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Session Summary Panel */}
              <div className="bg-[#F9F7F0] dark:bg-[#121513] border border-[#E6E2D3] dark:border-stone-800 rounded-xl p-4 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={session.tutorAvatar}
                    alt={session.tutorName}
                    className="w-10 h-10 rounded-xl object-cover border border-[#E6E2D3] dark:border-stone-800 shadow-sm"
                  />
                  <div>
                    <p className="text-sm font-serif font-bold text-[#2D3A30] dark:text-stone-100">{session.tutorName}</p>
                    <p className="text-xs text-[#9A9483] dark:text-stone-400 font-bold flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-[#5F7161]" />
                      {session.date} • {session.timeSlot}
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right border-t sm:border-t-0 sm:border-l border-[#E6E2D3] dark:border-stone-800 pt-3 sm:pt-0 sm:pl-4 w-full sm:w-auto">
                  <p className="text-xs font-bold text-[#9A9483] dark:text-stone-400 uppercase tracking-wider">Total Charge</p>
                  <p className="text-xl font-serif font-bold text-[#2D3A30] dark:text-stone-100 mt-0.5">${session.amount}.00</p>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Cardholder Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#6B6B6B] dark:text-stone-300 uppercase tracking-wider">Cardholder Name</label>
                  <input
                    type="text"
                    required
                    disabled={processing}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Sarah Jenkins"
                    className="w-full px-4 py-3 border border-[#E6E2D3] dark:border-stone-800 rounded-xl text-sm font-semibold bg-white dark:bg-[#121513] text-[#3D3D3D] dark:text-stone-200 focus:outline-none focus:border-[#5F7161] transition-colors"
                  />
                </div>

                {/* Card Number */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#6B6B6B] dark:text-stone-300 uppercase tracking-wider">Card Number</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                      <CreditCard className="w-5 h-5" />
                    </span>
                    <input
                      type="text"
                      required
                      disabled={processing}
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      placeholder="4111 2222 3333 4444"
                      className="w-full pl-11 pr-4 py-3 border border-[#E6E2D3] dark:border-stone-800 rounded-xl text-sm font-semibold bg-white dark:bg-[#121513] text-[#3D3D3D] dark:text-stone-200 focus:outline-none focus:border-[#5F7161] transition-colors"
                    />
                  </div>
                </div>

                {/* Expiry & CVC */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#6B6B6B] dark:text-stone-300 uppercase tracking-wider">Expiration Date</label>
                    <input
                      type="text"
                      required
                      disabled={processing}
                      value={expiry}
                      onChange={handleExpiryChange}
                      placeholder="MM/YY"
                      className="w-full px-4 py-3 border border-[#E6E2D3] dark:border-stone-800 rounded-xl text-sm font-semibold bg-white dark:bg-[#121513] text-[#3D3D3D] dark:text-stone-200 focus:outline-none focus:border-[#5F7161] transition-colors text-center"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#6B6B6B] dark:text-stone-300 uppercase tracking-wider">CVC / CVV</label>
                    <input
                      type="password"
                      required
                      disabled={processing}
                      value={cvc}
                      onChange={handleCvcChange}
                      placeholder="•••"
                      className="w-full px-4 py-3 border border-[#E6E2D3] dark:border-stone-800 rounded-xl text-sm font-semibold bg-white dark:bg-[#121513] text-[#3D3D3D] dark:text-stone-200 focus:outline-none focus:border-[#5F7161] transition-colors text-center"
                    />
                  </div>
                </div>

                {/* Security Badge */}
                <div className="flex items-center justify-center gap-1.5 py-2.5 bg-[#F9F7F0] dark:bg-stone-800/10 rounded-xl border border-dashed border-[#E6E2D3] dark:border-stone-800">
                  <ShieldCheck className="w-4 h-4 text-[#5F7161]" />
                  <span className="text-[10px] font-bold text-[#9A9483] dark:text-stone-400 uppercase tracking-widest">
                    SSL Encrypted & HIPAA Compliant Session Processing
                  </span>
                </div>

                {/* Submit Payment button */}
                <button
                  type="submit"
                  disabled={processing}
                  className="w-full py-4 mt-2 bg-[#5F7161] hover:bg-[#4D5C4F] text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 border border-[#5F7161] cursor-pointer shadow-sm"
                >
                  {processing ? (
                    <>
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Authorizing transaction...</span>
                    </>
                  ) : (
                    <span>Authorize & Pay ${session.amount}.00</span>
                  )}
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="payment-success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 text-center flex flex-col items-center"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-[#5F7161]/5 rounded-full blur-xl scale-125 animate-pulse" />
                <div className="relative p-4 bg-[#5F7161]/10 border border-[#5F7161]/25 rounded-full text-[#5F7161] mb-6">
                  <CheckCircle2 className="w-16 h-16" />
                </div>
              </div>

              <div className="flex items-center gap-1.5 justify-center mb-2">
                <Sparkles className="w-5 h-5 text-amber-500 fill-amber-300" />
                <h3 className="text-2xl font-serif font-bold text-[#2D3A30] dark:text-stone-100 tracking-tight">Payment Successful!</h3>
              </div>
              <p className="text-sm text-neutral-600 dark:text-stone-300 max-w-sm font-semibold leading-relaxed mb-6">
                Excellent! Your payment for the tutoring session with <span className="text-neutral-900 dark:text-white font-extrabold">{session.tutorName}</span> has been processed successfully. Your session is now fully confirmed.
              </p>

              <div className="bg-[#F9F7F0] dark:bg-[#121513] border border-dashed border-[#E6E2D3] dark:border-stone-800 rounded-xl p-4 w-full max-w-sm mb-6 text-left space-y-2">
                <div className="flex justify-between text-xs font-bold text-neutral-500 dark:text-stone-400">
                  <span>Transaction ID</span>
                  <span className="text-neutral-800 dark:text-stone-200 font-extrabold font-mono">TXN-{Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-neutral-500 dark:text-stone-400">
                  <span>Subject</span>
                  <span className="text-neutral-800 dark:text-stone-200 font-extrabold">{session.subject}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-neutral-500 dark:text-stone-400">
                  <span>Date & Time</span>
                  <span className="text-neutral-800 dark:text-stone-200 font-extrabold">{session.date} • {session.timeSlot}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-neutral-500 dark:text-stone-400">
                  <span>Payment Status</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50/15 border border-emerald-500/35 text-emerald-400 text-[10px] font-bold">PAID & SECURED</span>
                </div>
              </div>

              <button
                onClick={handleCloseSuccess}
                className="w-full max-w-sm py-4 bg-[#5F7161] hover:bg-[#4D5C4F] text-white font-bold text-sm rounded-xl transition-all border border-[#5F7161] cursor-pointer shadow-sm"
              >
                Return to Dashboard
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

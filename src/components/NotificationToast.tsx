/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Bell, Calendar, CreditCard, MessageSquare, X } from 'lucide-react';
import { Notification } from '../types';

export default function NotificationToast() {
  const [toasts, setToasts] = useState<Notification[]>([]);

  useEffect(() => {
    const handleNewNotification = (e: Event) => {
      const customEvent = e as CustomEvent<Notification>;
      const newNotif = customEvent.detail;
      
      // Play a playful soft notification chime (using standard browser Audio Synthesis so no external asset required!)
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.type = 'sine';
        // Plink sound: High note fading fast
        oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1); // A5
        
        gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
        
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.4);
      } catch (err) {
        // AudioContext blocked or unsupported, fail silently
      }

      setToasts((prev) => [...prev, newNotif]);

      // Auto-remove toast after 5 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newNotif.id));
      }, 5000);
    };

    window.addEventListener('new_notification', handleNewNotification);
    return () => {
      window.removeEventListener('new_notification', handleNewNotification);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'booking':
        return <Calendar className="w-5 h-5 text-[#5F7161]" />;
      case 'payment':
        return <CreditCard className="w-5 h-5 text-[#E7AB79]" />;
      case 'question':
        return <MessageSquare className="w-5 h-5 text-[#8E613B]" />;
      default:
        return <Bell className="w-5 h-5 text-[#5F7161]" />;
    }
  };

  const getBorderColor = (type: Notification['type']) => {
    return 'border-[#E6E2D3] bg-[#FDFCF8]/95 shadow-md';
  };

  return (
    <div id="toast-container" className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
            className={`pointer-events-auto p-4 rounded-xl border shadow-lg backdrop-blur-md flex gap-3 items-start justify-between ${getBorderColor(
              toast.type
            )}`}
          >
            <div className="p-2 rounded-lg bg-white/85 shadow-sm border border-neutral-100">
              {getIcon(toast.type)}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-semibold text-neutral-800 tracking-wide uppercase">
                Notification
              </h4>
              <p className="text-sm font-bold text-neutral-900 mt-0.5 leading-tight">
                {toast.title}
              </p>
              <p className="text-xs text-neutral-600 mt-1 leading-snug font-medium">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-neutral-400 hover:text-neutral-600 transition-colors p-0.5 rounded-full hover:bg-neutral-100/50"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

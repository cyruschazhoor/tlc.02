/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { db } from '../lib/db';
import { 
  Camera, 
  Video, 
  VideoOff, 
  RefreshCw, 
  User as UserIcon, 
  Check, 
  X, 
  Smile, 
  Sparkles, 
  Image as ImageIcon,
  AlertCircle
} from 'lucide-react';

interface EditProfileProps {
  currentUser: User;
  onProfileUpdated: (updatedUser: User) => void;
  onAddNotification: (title: string, message: string, type: 'booking' | 'payment' | 'question' | 'system') => void;
  onClose: () => void;
}

const AVATAR_STYLES = [
  { id: 'fun-emoji', name: 'Fun Emojis' },
  { id: 'bottts', name: 'Cool Robots' },
  { id: 'adventurer', name: 'Adventurers' },
  { id: 'lorelei', name: 'Cute Avatars' }
];

export default function EditProfile({ 
  currentUser, 
  onProfileUpdated, 
  onAddNotification, 
  onClose 
}: EditProfileProps) {
  const [fullName, setFullName] = useState(currentUser.fullName);
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl || '');
  const [avatarStyle, setAvatarStyle] = useState('fun-emoji');
  const [seed, setSeed] = useState(currentUser.fullName.replace(/\s+/g, '-').toLowerCase() || 'learning');
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'presets' | 'camera'>('presets');
  
  // Camera variables
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Generate URL helper based on current seed & style
  const getGeneratedUrl = (style: string, customSeed: string) => {
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(customSeed)}`;
  };

  // Set initial generated avatar if none exists
  useEffect(() => {
    if (!currentUser.avatarUrl) {
      setAvatarUrl(getGeneratedUrl('fun-emoji', seed));
    }
  }, []);

  // Update dynamic preset when seed or style changes
  useEffect(() => {
    if (activeTab === 'presets') {
      setAvatarUrl(getGeneratedUrl(avatarStyle, seed));
    }
  }, [avatarStyle, seed, activeTab]);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // Camera Management
  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 400, height: 400, facingMode: 'user' },
        audio: false
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError('Could not access camera. Check permissions or try opening in a new tab.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 400;
      canvas.height = video.videoHeight || 400;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw centered frame snapshot
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setAvatarUrl(dataUrl);
        stopCamera();
        onAddNotification(
          'Photo Captured 📸',
          'Successfully grabbed a snapshot from your webcam as your new profile picture!',
          'system'
        );
      }
    }
  };

  // Randomize preset seed
  const handleRandomizeSeed = () => {
    const randomSeed = Math.random().toString(36).substring(2, 9);
    setSeed(randomSeed);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    setIsSaving(true);
    try {
      const updatedUser = await db.updateProfile(currentUser.id, {
        fullName: fullName.trim(),
        avatarUrl: avatarUrl
      });
      onProfileUpdated(updatedUser);
      onAddNotification(
        'Profile Updated! ✨',
        'Your profile name and avatar have been saved successfully.',
        'system'
      );
      onClose();
    } catch (err: any) {
      console.error('Error saving profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#1c1f1c] border border-[#E6E2D3] dark:border-stone-800 rounded-2xl p-6 shadow-sm space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center border-b border-[#E6E2D3] dark:border-stone-800 pb-4">
        <div className="flex items-center gap-2">
          <Smile className="w-5 h-5 text-[#5F7161]" />
          <h3 className="text-base font-serif font-bold text-neutral-800 dark:text-stone-100">Edit Profile Details</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-stone-800 rounded-lg text-neutral-400 hover:text-neutral-600 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-5 gap-6">
        
        {/* Avatar Preview & Selection column */}
        <div className="md:col-span-2 flex flex-col items-center text-center space-y-4">
          <div className="relative">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar Preview"
                className="w-32 h-32 rounded-2xl object-cover border-2 border-[#5F7161] shadow-md bg-stone-50 dark:bg-stone-900"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-32 h-32 rounded-2xl bg-[#FAF9F5] dark:bg-stone-800 border border-dashed border-[#E6E2D3] dark:border-stone-700 flex items-center justify-center text-neutral-400">
                <UserIcon className="w-10 h-10" />
              </div>
            )}
            <span className="absolute -bottom-1.5 -right-1.5 bg-[#5F7161] text-white p-1.5 rounded-xl shadow-md border border-white dark:border-stone-800">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="text-xs text-neutral-500 dark:text-stone-400 font-bold uppercase tracking-wider">
            Active Avatar Preview
          </div>

          {/* Tab Selector */}
          <div className="flex w-full bg-[#FAF9F0] dark:bg-stone-800/40 border border-[#E6E2D3] dark:border-stone-800 rounded-xl p-1 gap-1">
            <button
              type="button"
              onClick={() => { stopCamera(); setActiveTab('presets'); }}
              className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === 'presets'
                  ? 'bg-white dark:bg-[#121513] text-slate-800 dark:text-stone-200 shadow-sm border border-stone-200 dark:border-stone-700'
                  : 'text-[#9A9483] dark:text-stone-400 hover:text-[#2D3A30] dark:hover:text-stone-200'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              Presets Generator
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('camera'); }}
              className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === 'camera'
                  ? 'bg-white dark:bg-[#121513] text-slate-800 dark:text-stone-200 shadow-sm border border-stone-200 dark:border-stone-700'
                  : 'text-[#9A9483] dark:text-stone-400 hover:text-[#2D3A30] dark:hover:text-stone-200'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              Live Camera Capture
            </button>
          </div>
        </div>

        {/* Configurations Column */}
        <div className="md:col-span-3 space-y-4">
          
          {/* User Full Name Field */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[#6B6B6B] dark:text-stone-300 uppercase tracking-wider block">Your Full Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Alex Smith"
              className="w-full px-3 py-2 border border-[#E6E2D3] dark:border-stone-800 rounded-xl text-xs font-semibold bg-[#FDFCF8] dark:bg-[#121513] focus:bg-white focus:outline-none focus:border-[#5F7161] text-[#3D3D3D] dark:text-stone-200 transition-colors"
            />
          </div>

          {/* Presets Generator Tools */}
          {activeTab === 'presets' && (
            <div className="space-y-3 p-4 bg-[#FAF9F0] dark:bg-stone-800/20 border border-[#E6E2D3] dark:border-stone-800 rounded-xl">
              <div className="text-[11px] font-bold text-[#5F7161] dark:text-[#a5bca7] uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Dynamic Avatar Presets
              </div>

              <div className="grid grid-cols-2 gap-2">
                {AVATAR_STYLES.map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setAvatarStyle(style.id)}
                    className={`px-2.5 py-1.5 border text-[10px] font-bold rounded-lg transition-all text-left cursor-pointer flex items-center justify-between ${
                      avatarStyle === style.id
                        ? 'bg-[#5F7161] text-white border-[#5F7161] shadow-sm'
                        : 'bg-white dark:bg-[#1c1f1c] border-[#E6E2D3] dark:border-stone-800 text-[#6B6B6B] dark:text-stone-300 hover:bg-[#FAF9F5] dark:hover:bg-stone-800'
                    }`}
                  >
                    {style.name}
                    {avatarStyle === style.id && <Check className="w-3 h-3 text-white" />}
                  </button>
                ))}
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="text-[10px] font-bold text-neutral-500 dark:text-stone-400 uppercase tracking-wider block">Custom Generator Seed</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={seed}
                    onChange={(e) => setSeed(e.target.value.replace(/\s+/g, '-'))}
                    placeholder="Type anything to alter styles"
                    className="flex-1 px-2.5 py-1.5 border border-[#E6E2D3] dark:border-stone-800 rounded-lg text-[11px] font-semibold bg-white dark:bg-[#121513] text-[#3D3D3D] dark:text-stone-200 focus:outline-none focus:border-[#5F7161]"
                  />
                  <button
                    type="button"
                    onClick={handleRandomizeSeed}
                    className="p-2 border border-[#E6E2D3] dark:border-stone-800 bg-white dark:bg-[#1c1f1c] text-neutral-600 dark:text-stone-300 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors inline-flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Random
                  </button>
                </div>
                <p className="text-[9px] text-[#9A9483] dark:text-stone-400 font-medium leading-relaxed">
                  The random generator seed creates uniquely distinct characters on the fly based on what you type!
                </p>
              </div>
            </div>
          )}

          {/* Camera Capture Tools */}
          {activeTab === 'camera' && (
            <div className="space-y-3 p-4 bg-slate-50 dark:bg-stone-800/25 border border-slate-200 dark:border-stone-800 rounded-xl">
              <div className="text-[11px] font-bold text-slate-700 dark:text-stone-300 uppercase tracking-wider flex items-center gap-1">
                <Camera className="w-3.5 h-3.5" />
                Live Camera Capture
              </div>

              {cameraError && (
                <div className="p-2 bg-rose-50 border border-rose-100 rounded-lg text-rose-800 text-[10px] font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  {cameraError}
                </div>
              )}

              {!cameraStream ? (
                <div className="space-y-2">
                  <p className="text-[10px] text-slate-500 dark:text-stone-400 font-semibold leading-relaxed">
                    Click below to start your webcam. You will see a live video preview and can snap a photo directly to update your avatar.
                  </p>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-black text-white font-bold text-[10px] rounded-lg border border-slate-700 transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow"
                  >
                    <Video className="w-3.5 h-3.5" />
                    Turn On Camera
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="border-2 border-slate-300 dark:border-stone-700 rounded-xl overflow-hidden aspect-square max-w-[200px] mx-auto bg-black shadow-sm relative">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover scale-x-[-1]"
                    />
                    <span className="absolute bottom-2 left-2 bg-red-600 px-1.5 py-0.5 text-[8px] font-black uppercase text-white rounded animate-pulse">
                      Live
                    </span>
                  </div>

                  <div className="flex gap-2 justify-center">
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      Take Snapshot
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="px-3 py-1.5 bg-slate-500 hover:bg-slate-600 text-white font-bold text-[10px] rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      <VideoOff className="w-3.5 h-3.5" />
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-end gap-2 pt-2 border-t border-[#E6E2D3] dark:border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#E6E2D3] dark:border-stone-700 text-neutral-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-[#5F7161] hover:bg-[#4D5C4F] text-white font-bold text-xs rounded-xl transition-all border border-[#5F7161] cursor-pointer shadow-sm disabled:opacity-50"
            >
              {isSaving ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>

        </div>

      </form>
    </div>
  );
}

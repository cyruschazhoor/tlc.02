/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Tutor } from '../types';
import { Star, GraduationCap, Clock, ChevronRight } from 'lucide-react';

interface TutorCardProps {
  key?: string;
  tutor: Tutor;
  onBook: (tutor: Tutor) => void;
}

const SUBJECT_COLORS: { [key: string]: string } = {
  'Algebra': 'bg-[#5F7161]/10 text-[#5F7161] dark:bg-[#5F7161]/20 dark:text-[#a5bca7] border-[#5F7161]/20 dark:border-[#5F7161]/30',
  'Calculus': 'bg-[#5F7161]/10 text-[#5F7161] dark:bg-[#5F7161]/20 dark:text-[#a5bca7] border-[#5F7161]/20 dark:border-[#5F7161]/30',
  'Chemistry': 'bg-[#E7AB79]/10 text-[#8E613B] dark:bg-[#E7AB79]/15 dark:text-[#f3cdad] border-[#E7AB79]/20 dark:border-[#E7AB79]/10',
  'Biology': 'bg-[#5F7161]/10 text-[#5F7161] dark:bg-[#5F7161]/20 dark:text-[#a5bca7] border-[#5F7161]/20 dark:border-[#5F7161]/30',
  'Physics': 'bg-[#E7AB79]/10 text-[#8E613B] dark:bg-[#E7AB79]/15 dark:text-[#f3cdad] border-[#E7AB79]/20 dark:border-[#E7AB79]/10',
  'AP Physics': 'bg-[#E7AB79]/10 text-[#8E613B] dark:bg-[#E7AB79]/15 dark:text-[#f3cdad] border-[#E7AB79]/20 dark:border-[#E7AB79]/10',
  'Statistics': 'bg-[#E7AB79]/10 text-[#8E613B] dark:bg-[#E7AB79]/15 dark:text-[#f3cdad] border-[#E7AB79]/20 dark:border-[#E7AB79]/10',
  'Geometry': 'bg-[#5F7161]/10 text-[#5F7161] dark:bg-[#5F7161]/20 dark:text-[#a5bca7] border-[#5F7161]/20 dark:border-[#5F7161]/30',
  'English Literature': 'bg-[#E7AB79]/10 text-[#8E613B] dark:bg-[#E7AB79]/15 dark:text-[#f3cdad] border-[#E7AB79]/20 dark:border-[#E7AB79]/10',
  'College Essays': 'bg-[#5F7161]/10 text-[#5F7161] dark:bg-[#5F7161]/20 dark:text-[#a5bca7] border-[#5F7161]/20 dark:border-[#5F7161]/30',
  'SAT Prep': 'bg-[#E7AB79]/10 text-[#8E613B] dark:bg-[#E7AB79]/15 dark:text-[#f3cdad] border-[#E7AB79]/20 dark:border-[#E7AB79]/10',
  'History': 'bg-[#E7AB79]/10 text-[#8E613B] dark:bg-[#E7AB79]/15 dark:text-[#f3cdad] border-[#E7AB79]/20 dark:border-[#E7AB79]/10',
  'Python': 'bg-[#5F7161]/10 text-[#5F7161] dark:bg-[#5F7161]/20 dark:text-[#a5bca7] border-[#5F7161]/20 dark:border-[#5F7161]/30',
  'Java': 'bg-[#5F7161]/10 text-[#5F7161] dark:bg-[#5F7161]/20 dark:text-[#a5bca7] border-[#5F7161]/20 dark:border-[#5F7161]/30',
  'Web Development': 'bg-[#5F7161]/10 text-[#5F7161] dark:bg-[#5F7161]/20 dark:text-[#a5bca7] border-[#5F7161]/20 dark:border-[#5F7161]/30',
  'Computer Science': 'bg-[#5F7161]/10 text-[#5F7161] dark:bg-[#5F7161]/20 dark:text-[#a5bca7] border-[#5F7161]/20 dark:border-[#5F7161]/30',
};

export default function TutorCard({ tutor, onBook }: TutorCardProps) {
  return (
    <div className="bg-white dark:bg-[#1c1f1c] border border-[#E6E2D3] dark:border-stone-800 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-[#5F7161]/40 dark:hover:border-stone-700 transition-all flex flex-col justify-between group">
      <div>
        {/* Profile Header */}
        <div className="flex items-start gap-4">
          <div className="flex flex-col items-center shrink-0">
            <img
              src={tutor.avatar}
              alt={tutor.name}
              className="w-16 h-16 rounded-xl object-cover border border-[#E6E2D3] dark:border-stone-800"
            />
            <span className="mt-2 bg-[#E7AB79]/15 dark:bg-[#E7AB79]/20 text-[#8E613B] dark:text-[#f3cdad] font-bold text-[11px] px-2 py-0.5 rounded-lg border border-[#E7AB79]/20 dark:border-stone-800 flex items-center gap-1 shadow-sm w-full justify-center">
              <Star className="w-3.5 h-3.5 fill-[#E7AB79] text-[#E7AB79]" />
              {tutor.rating.toFixed(1)}
            </span>
          </div>
          <div>
            <h4 className="text-lg font-serif font-bold text-[#2D3A30] dark:text-stone-100 leading-tight group-hover:text-[#5F7161] dark:group-hover:text-[#a5bca7] transition-colors">
              {tutor.name}
            </h4>
            <div className="flex items-center gap-1.5 text-xs text-[#9A9483] dark:text-stone-400 font-semibold mt-1">
              <GraduationCap className="w-3.5 h-3.5 text-[#5F7161] dark:text-[#a5bca7]" />
              <span>{tutor.reviewsCount} verified reviews</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#9A9483] dark:text-stone-400 font-semibold mt-0.5">
              <Clock className="w-3.5 h-3.5 text-[#E7AB79]" />
              <span>Flexible hours weekly</span>
            </div>
          </div>
        </div>

        {/* Bio */}
        <p className="text-sm font-medium text-[#6B6B6B] dark:text-stone-300 mt-4 leading-relaxed line-clamp-3">
          {tutor.bio}
        </p>

        {/* Subjects */}
        <div className="mt-4">
          <h5 className="text-[10px] font-bold text-[#9A9483] dark:text-stone-400 uppercase tracking-widest mb-2">Specialties</h5>
          <div className="flex flex-wrap gap-1.5">
            {tutor.subjects.map((sub) => (
              <span
                key={sub}
                className={`text-xs font-bold px-2.5 py-1 rounded-xl border shadow-sm ${
                  SUBJECT_COLORS[sub] || 'bg-neutral-50 dark:bg-stone-800 text-neutral-700 dark:text-stone-300 border-neutral-200 dark:border-stone-700'
                }`}
              >
                {sub}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Footer / Booking Actions */}
      <div className="mt-6 pt-4 border-t border-[#E6E2D3] dark:border-stone-800 flex items-center justify-between">
        <div>
          <span className="text-2xl font-serif font-bold text-[#2D3A30] dark:text-stone-100">${tutor.ratePerHour}</span>
          <span className="text-xs font-semibold text-[#9A9483] dark:text-stone-400"> / hour</span>
        </div>

        <button
          onClick={() => onBook(tutor)}
          className="flex items-center gap-1 text-xs font-bold bg-[#5F7161] text-white hover:bg-[#4D5C4F] px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm"
        >
          Book Now
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

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
  'Algebra': 'bg-[#5F7161]/10 text-[#5F7161] border-[#5F7161]/20',
  'Calculus': 'bg-[#5F7161]/10 text-[#5F7161] border-[#5F7161]/20',
  'Chemistry': 'bg-[#E7AB79]/10 text-[#8E613B] border-[#E7AB79]/20',
  'Biology': 'bg-[#5F7161]/10 text-[#5F7161] border-[#5F7161]/20',
  'Physics': 'bg-[#E7AB79]/10 text-[#8E613B] border-[#E7AB79]/20',
  'AP Physics': 'bg-[#E7AB79]/10 text-[#8E613B] border-[#E7AB79]/20',
  'Statistics': 'bg-[#E7AB79]/10 text-[#8E613B] border-[#E7AB79]/20',
  'Geometry': 'bg-[#5F7161]/10 text-[#5F7161] border-[#5F7161]/20',
  'English Literature': 'bg-[#E7AB79]/10 text-[#8E613B] border-[#E7AB79]/20',
  'College Essays': 'bg-[#5F7161]/10 text-[#5F7161] border-[#5F7161]/20',
  'SAT Prep': 'bg-[#E7AB79]/10 text-[#8E613B] border-[#E7AB79]/20',
  'History': 'bg-[#E7AB79]/10 text-[#8E613B] border-[#E7AB79]/20',
  'Python': 'bg-[#5F7161]/10 text-[#5F7161] border-[#5F7161]/20',
  'Java': 'bg-[#5F7161]/10 text-[#5F7161] border-[#5F7161]/20',
  'Web Development': 'bg-[#5F7161]/10 text-[#5F7161] border-[#5F7161]/20',
  'Computer Science': 'bg-[#5F7161]/10 text-[#5F7161] border-[#5F7161]/20',
};

export default function TutorCard({ tutor, onBook }: TutorCardProps) {
  return (
    <div className="bg-white border border-[#E6E2D3] rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-[#5F7161]/40 transition-all flex flex-col justify-between group">
      <div>
        {/* Profile Header */}
        <div className="flex items-start gap-4">
          <div className="relative">
            <img
              src={tutor.avatar}
              alt={tutor.name}
              className="w-16 h-16 rounded-xl object-cover border border-[#E6E2D3]"
            />
            <span className="absolute -bottom-1.5 -right-1.5 bg-[#E7AB79] bg-opacity-15 text-[#8E613B] font-bold text-xs px-1.5 py-0.5 rounded-lg border border-[#E7AB79]/20 flex items-center gap-0.5 shadow-sm">
              <Star className="w-3 h-3 fill-[#E7AB79] text-[#E7AB79]" />
              {tutor.rating.toFixed(1)}
            </span>
          </div>
          <div>
            <h4 className="text-lg font-serif font-bold text-[#2D3A30] leading-tight group-hover:text-[#5F7161] transition-colors">
              {tutor.name}
            </h4>
            <div className="flex items-center gap-1.5 text-xs text-[#9A9483] font-semibold mt-1">
              <GraduationCap className="w-3.5 h-3.5 text-[#5F7161]" />
              <span>{tutor.reviewsCount} verified reviews</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#9A9483] font-semibold mt-0.5">
              <Clock className="w-3.5 h-3.5 text-[#E7AB79]" />
              <span>Flexible hours weekly</span>
            </div>
          </div>
        </div>

        {/* Bio */}
        <p className="text-sm font-medium text-[#6B6B6B] mt-4 leading-relaxed line-clamp-3">
          {tutor.bio}
        </p>

        {/* Subjects */}
        <div className="mt-4">
          <h5 className="text-[10px] font-bold text-[#9A9483] uppercase tracking-widest mb-2">Specialties</h5>
          <div className="flex flex-wrap gap-1.5">
            {tutor.subjects.map((sub) => (
              <span
                key={sub}
                className={`text-xs font-bold px-2.5 py-1 rounded-xl border shadow-sm ${
                  SUBJECT_COLORS[sub] || 'bg-neutral-50 text-neutral-700 border-neutral-200'
                }`}
              >
                {sub}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Footer / Booking Actions */}
      <div className="mt-6 pt-4 border-t border-[#E6E2D3] flex items-center justify-between">
        <div>
          <span className="text-2xl font-serif font-bold text-[#2D3A30]">${tutor.ratePerHour}</span>
          <span className="text-xs font-semibold text-[#9A9483]"> / hour</span>
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

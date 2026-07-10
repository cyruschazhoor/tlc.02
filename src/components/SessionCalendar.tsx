/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Tutor, Session, User } from '../types';
import { Calendar as CalendarIcon, Clock, BookOpen, AlertCircle, ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';

interface SessionCalendarProps {
  tutors: Tutor[];
  selectedTutor: Tutor | null;
  currentUser: User | null;
  onBookSuccess: (session: Session) => void;
  onTutorSelect: (tutor: Tutor | null) => void;
}

export default function SessionCalendar({
  tutors,
  selectedTutor,
  currentUser,
  onBookSuccess,
  onTutorSelect
}: SessionCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Generate 14 days starting from today
  const getRollingDays = () => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const day = new Date(today);
      day.setDate(today.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const rollingDays = getRollingDays();

  const getDayName = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatDateValue = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Get current tutor's availability for the selected day of the week
  const getAvailableSlots = () => {
    if (!selectedTutor) return [];
    const dayName = getDayName(selectedDate);
    return selectedTutor.availability[dayName] || [];
  };

  const availableSlots = getAvailableSlots();

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!currentUser) {
      setErrorMessage('Please register or log in to book a session!');
      return;
    }

    if (!selectedTutor) {
      setErrorMessage('Please select a tutor first.');
      return;
    }

    if (!selectedTimeSlot) {
      setErrorMessage('Please choose a time slot.');
      return;
    }

    if (!selectedSubject) {
      setErrorMessage('Please select a subject.');
      return;
    }

    const sessionData: Omit<Session, 'id' | 'createdAt' | 'status' | 'paymentStatus'> = {
      studentId: currentUser.id,
      studentName: currentUser.fullName,
      tutorId: selectedTutor.id,
      tutorName: selectedTutor.name,
      tutorAvatar: selectedTutor.avatar,
      date: formatDateValue(selectedDate),
      timeSlot: selectedTimeSlot,
      subject: selectedSubject,
      amount: selectedTutor.ratePerHour
    };

    onBookSuccess(sessionData as Session);
    
    // Reset form states
    setSelectedTimeSlot(null);
    setNotes('');
  };

  return (
    <div className="bg-white border border-[#E6E2D3] rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Left Side: Tutor Selector / Info */}
        <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-[#E6E2D3] pb-6 md:pb-0 md:pr-6">
          <h3 className="text-lg font-serif font-bold text-[#2D3A30] mb-4 flex items-center gap-2">
            <span className="p-1.5 bg-[#5F7161]/10 border border-[#5F7161]/25 rounded-xl">
              <CalendarIcon className="w-4 h-4 text-[#5F7161]" />
            </span>
            1. Choose Your Tutor
          </h3>

          <div className="space-y-3">
            {tutors.map((tutor) => (
              <button
                key={tutor.id}
                onClick={() => {
                  onTutorSelect(tutor);
                  setSelectedTimeSlot(null);
                  setSelectedSubject(tutor.subjects[0] || '');
                  setErrorMessage(null);
                }}
                className={`w-full p-3 border rounded-xl flex items-center gap-3 transition-all cursor-pointer ${
                  selectedTutor?.id === tutor.id
                    ? 'bg-[#5F7161]/10 border-[#5F7161] scale-[1.01]'
                    : 'bg-[#FDFCF8] border-[#E6E2D3] hover:border-[#5F7161]/50'
                }`}
              >
                <img
                  src={tutor.avatar}
                  alt={tutor.name}
                  className="w-10 h-10 rounded-xl object-cover border border-[#E6E2D3]"
                />
                <div className="text-left">
                  <p className="text-sm font-serif font-bold text-[#2D3A30] leading-tight">{tutor.name}</p>
                  <p className="text-xs text-[#9A9483] font-semibold mt-0.5">${tutor.ratePerHour}/hr • ⭐ {tutor.rating.toFixed(1)}</p>
                </div>
              </button>
            ))}
          </div>

          {selectedTutor && (
            <div className="mt-6 p-4 bg-[#E7AB79]/5 border border-dashed border-[#E7AB79]/40 rounded-xl">
              <h4 className="text-xs font-bold text-[#8E613B] uppercase tracking-wider mb-1">Meet {selectedTutor.name}</h4>
              <p className="text-xs text-neutral-600 leading-relaxed font-semibold line-clamp-3">
                {selectedTutor.bio}
              </p>
            </div>
          )}
        </div>

        {/* Right Side: Calendar Dates, Times & Options */}
        <div className="w-full md:w-2/3 flex-1">
          {selectedTutor ? (
            <form onSubmit={handleBookingSubmit} className="space-y-6">
              
              {/* Date Selection */}
              <div>
                <h3 className="text-sm font-bold text-[#2D3A30] mb-3 uppercase tracking-wider">
                  2. Select a Date
                </h3>
                
                <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-thin">
                  {rollingDays.map((day, idx) => {
                    const isSelected = selectedDate.toDateString() === day.toDateString();
                    const isToday = new Date().toDateString() === day.toDateString();
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSelectedDate(day);
                          setSelectedTimeSlot(null);
                          setErrorMessage(null);
                        }}
                        className={`flex-shrink-0 w-16 py-3 border rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#5F7161] border-[#5F7161] text-white shadow-sm'
                            : 'bg-[#FDFCF8] border-[#E6E2D3] hover:border-[#5F7161]/50 text-neutral-800'
                        }`}
                      >
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">
                          {getDayName(day).substring(0, 3)}
                        </span>
                        <span className="text-sm font-bold mt-1">
                          {day.getDate()}
                        </span>
                        {isToday && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#E7AB79] mt-1" />
                        )}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-[#9A9483] font-semibold mt-1">
                  Selected: <span className="text-[#2D3A30] font-bold">{getDayName(selectedDate)}, {formatDate(selectedDate)}</span>
                </p>
              </div>

              {/* Time Slots */}
              <div>
                <h3 className="text-sm font-bold text-[#2D3A30] mb-3 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#E7AB79]" />
                  3. Available Time Slots
                </h3>

                {availableSlots.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {availableSlots.map((slot) => {
                      const isSelected = selectedTimeSlot === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedTimeSlot(slot)}
                          className={`py-2 text-xs font-bold border rounded-xl transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#5F7161]/10 border-[#5F7161] text-[#2D3A30]'
                              : 'bg-[#FDFCF8] border-[#E6E2D3] hover:border-[#5F7161]/50 text-[#6B6B6B]'
                          }`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 bg-[#E7AB79]/5 border border-dashed border-[#E7AB79]/40 rounded-xl flex items-center gap-2.5 text-[#8E613B]">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-xs font-bold leading-relaxed">
                      {selectedTutor.name} has no availability listed for {getDayName(selectedDate)}s. Please try a different date!
                    </p>
                  </div>
                )}
              </div>

              {/* Subject Dropdown & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wider block flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-[#5F7161]" />
                    Subject
                  </label>
                  <select
                    required
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full px-4 py-3 border border-[#E6E2D3] rounded-xl text-sm font-semibold bg-white focus:outline-none focus:border-[#5F7161]/50 transition-colors cursor-pointer text-[#3D3D3D]"
                  >
                    <option value="" disabled>Select a subject...</option>
                    {selectedTutor.subjects.map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wider block flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-[#E7AB79]" />
                    Learning Goals (Optional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g., preparing for AP Quiz on Friday!"
                    className="w-full px-4 py-3 border border-[#E6E2D3] rounded-xl text-sm font-semibold bg-white focus:outline-none focus:border-[#5F7161]/50 transition-colors text-[#3D3D3D]"
                  />
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 text-xs font-semibold text-rose-700 bg-rose-50/50 border border-rose-200 rounded-xl">
                  {errorMessage}
                </div>
              )}

              {/* Submit Reservation */}
              <button
                type="submit"
                className="w-full py-4 bg-[#5F7161] hover:bg-[#4D5C4F] text-white font-bold text-sm rounded-xl transition-all border border-[#5F7161] cursor-pointer shadow-sm"
              >
                Request Session Booking (${selectedTutor.ratePerHour}/hr)
              </button>

            </form>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center border border-dashed border-[#E6E2D3] rounded-2xl bg-[#FDFCF8] p-6 text-center">
              <CalendarIcon className="w-12 h-12 text-neutral-300 stroke-1" />
              <h4 className="text-sm font-serif font-bold text-[#2D3A30] mt-3">Select a Tutor to Start</h4>
              <p className="text-xs text-neutral-500 max-w-xs mt-1 leading-relaxed font-semibold">
                Please pick one of our wonderful educators from the list on the left to view their calendar and reserve your session.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

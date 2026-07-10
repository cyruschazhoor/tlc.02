/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'student' | 'tutor' | 'admin';
  avatarUrl?: string;
  createdAt: string;
}

export interface Tutor {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  subjects: string[];
  rating: number;
  reviewsCount: number;
  ratePerHour: number;
  availability: {
    [day: string]: string[]; // e.g., "Monday": ["09:00", "11:00", "14:00"]
  };
}

export interface Session {
  id: string;
  studentId: string;
  studentName: string;
  tutorId: string;
  tutorName: string;
  tutorAvatar?: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // HH:MM
  subject: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus: 'unpaid' | 'paid';
  amount: number;
  createdAt: string;
}

export interface Reply {
  id: string;
  authorName: string;
  authorRole: 'student' | 'tutor' | 'admin';
  content: string;
  createdAt: string;
}

export interface Question {
  id: string;
  studentId: string;
  studentName: string;
  title: string;
  content: string;
  subject: string;
  replies: Reply[];
  likes: number;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'booking' | 'payment' | 'question' | 'system';
  read: boolean;
  createdAt: string;
}

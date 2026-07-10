/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, Tutor, Session, Question, Reply, Notification } from '../types';

export const isSupabaseConfigured = false;

// Helper to make API calls to Express backend
async function apiCall<T>(url: string, method = 'GET', body?: any): Promise<T> {
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  const response = await fetch(url, options);
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `HTTP error! status: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

// ============================================================================
// DURABLE API PERSISTENCE ENGINE (Proxying to Express/Postgres)
// ============================================================================

export const db = {
  // --- AUTHENTICATION ---
  async getCurrentUser(): Promise<User | null> {
    const currentSession = localStorage.getItem('lt_current_user');
    return currentSession ? JSON.parse(currentSession) : null;
  },

  async signUp(email: string, password: string, fullName: string, role: 'student' | 'tutor' | 'admin' = 'student'): Promise<User> {
    const user = await apiCall<User>('/api/auth/signup', 'POST', { email, fullName, role });
    localStorage.setItem('lt_current_user', JSON.stringify(user));
    return user;
  },

  async signIn(email: string, password: string): Promise<User> {
    const user = await apiCall<User>('/api/auth/signin', 'POST', { email });
    localStorage.setItem('lt_current_user', JSON.stringify(user));
    return user;
  },

  async signOut(): Promise<void> {
    localStorage.removeItem('lt_current_user');
  },

  async updateProfile(userId: string, updates: Partial<User>): Promise<User> {
    const user = await apiCall<User>('/api/users/profile', 'PUT', { id: userId, ...updates });
    localStorage.setItem('lt_current_user', JSON.stringify(user));
    return user;
  },

  // --- TUTORS ---
  async getTutors(): Promise<Tutor[]> {
    return apiCall<Tutor[]>('/api/tutors');
  },

  // --- SESSIONS & BOOKINGS ---
  async getSessions(userId: string): Promise<Session[]> {
    return apiCall<Session[]>(`/api/sessions/${userId}`);
  },

  async bookSession(sessionData: Omit<Session, 'id' | 'createdAt' | 'status' | 'paymentStatus'>): Promise<Session> {
    return apiCall<Session>('/api/sessions/book', 'POST', sessionData);
  },

  async completeSession(sessionId: string): Promise<Session> {
    return apiCall<Session>('/api/sessions/complete', 'POST', { sessionId });
  },

  async paySession(sessionId: string): Promise<Session> {
    return apiCall<Session>('/api/sessions/pay', 'POST', { sessionId });
  },

  async rateSession(sessionId: string, ratingGiven: number): Promise<Session> {
    return apiCall<Session>('/api/sessions/rate', 'POST', { sessionId, ratingGiven });
  },

  // --- QUESTIONS BOARD ---
  async getQuestions(): Promise<Question[]> {
    return apiCall<Question[]>('/api/questions');
  },

  async addQuestion(title: string, content: string, subject: string, studentId: string, studentName: string): Promise<Question> {
    const question = await apiCall<Question>('/api/questions', 'POST', {
      studentId,
      studentName,
      title,
      content,
      subject
    });

    // Simulate tutor reply after a brief timeout to replicate dynamic active behavior
    setTimeout(() => {
      this.simulateTutorReply(question.id, subject);
    }, 4000);

    return question;
  },

  async addReply(questionId: string, authorName: string, authorRole: 'student' | 'tutor' | 'admin', content: string): Promise<Reply> {
    return apiCall<Reply>(`/api/questions/${questionId}/reply`, 'POST', {
      authorName,
      authorRole,
      content
    });
  },

  async likeQuestion(questionId: string): Promise<number> {
    const result = await apiCall<{ likes: number }>(`/api/questions/${questionId}/like`, 'POST');
    return result.likes;
  },

  // --- NOTIFICATIONS ---
  async getNotifications(userId: string): Promise<Notification[]> {
    return apiCall<Notification[]>(`/api/notifications/${userId}`);
  },

  async markNotificationAsRead(notificationId: string): Promise<void> {
    await apiCall<void>('/api/notifications/mark-read', 'POST', { notificationId });
  },

  async markAllRead(userId: string): Promise<void> {
    await apiCall<void>('/api/notifications/mark-read', 'POST', { userId });
  },

  async addNotification(userId: string, title: string, message: string, type: 'booking' | 'payment' | 'question' | 'system'): Promise<Notification> {
    const notif = await apiCall<Notification>('/api/notifications/add', 'POST', {
      userId,
      title,
      message,
      type
    });

    // Dispatch a custom window event so App can play a chime/show toast instantly!
    window.dispatchEvent(new CustomEvent('new_notification', { detail: notif }));

    return notif;
  },

  // --- AUTOMATION SIMULATORS ---
  async simulateTutorReply(questionId: string, subject: string) {
    const tutors = await this.getTutors();
    // Try to find a tutor matching the subject
    const potentialTutors = tutors.filter((t: Tutor) => t.subjects.includes(subject));
    const tutor = potentialTutors.length > 0 ? potentialTutors[0] : tutors[0];

    const responsesBySubject: { [key: string]: string[] } = {
      'Algebra': [
        "Hey! This is a great Algebra question. To solve this, you first want to isolate the variable. Try grouping all terms containing x on the left-hand side, and all constants on the right. Let me know if that works out!",
        "Double-check your negative signs here! It is super common to miss distributing a negative sign inside parentheses, e.g., -2(x - 3) becomes -2x + 6."
      ],
      'Calculus': [
        "That is a classic integration question. When you see functions nested inside trigonometric or power functions, u-substitution is your best friend. Look for 'du' floating around in your differential!",
        "Remember, when using the Quotient Rule, the mnemonic 'low d-high minus high d-low over square of what\'s below' works wonders! Try setting it up step-by-step."
      ],
      'Chemistry': [
        "Be sure to balance your chemical equation before doing any stoichiometry calculations! Remember, the number of atoms of each element must remain conserved from reactants to products.",
        "For pH calculations, keep in mind that pH = -log[H+]. If you have pOH, you can easily find pH by subtracting pOH from 14. Excellent question!"
      ],
      'Physics': [
        "Remember that force is a vector! When you draw your Free Body Diagram, always resolve forces into horizontal and vertical components. This will make applying Newton's 2nd Law much easier.",
        "Since there are no external forces like friction acting on the system, mechanical energy is conserved! Try equating the potential energy at the top to the kinetic energy at the bottom: mgh = 0.5 * m * v^2."
      ]
    };

    const responses = responsesBySubject[subject] || [
      "Thanks for posting your doubt! That is an interesting problem. Let's start by breaking down the question into knowns and unknowns. What have you tried so far? Let's solve it together!",
      "An excellent conceptual question. In our sessions, we often draw diagrams to visualize this. Try sketching a simple diagram representing the problem statement and see if a relationship emerges."
    ];

    const content = responses[Math.floor(Math.random() * responses.length)];
    await this.addReply(questionId, tutor.name, 'tutor', content);
  }
};

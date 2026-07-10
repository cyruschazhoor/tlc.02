/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, Tutor, Session, Question, Reply, Notification } from '../types';

export const isSupabaseConfigured = false;

// ============================================================================
// INITIAL MOCK DATA (Seeded for local preview)
// ============================================================================

const INITIAL_TUTORS: Tutor[] = [
  {
    id: 'tutor-1',
    name: 'Maya Lin',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    bio: 'Hi, I am Maya! I specialize in high-school mathematics, chemistry, and biology. I love making complex concepts feel intuitive using sketches and real-world analogies. Let\'s succeed together!',
    subjects: ['Algebra', 'Calculus', 'Chemistry', 'Biology'],
    rating: 4.9,
    reviewsCount: 38,
    ratePerHour: 45,
    availability: {
      'Monday': ['09:00', '11:00', '14:00', '16:00'],
      'Wednesday': ['09:00', '11:00', '15:00', '17:00'],
      'Friday': ['10:00', '13:00', '14:00', '16:00'],
    }
  },
  {
    id: 'tutor-2',
    name: 'Dr. Alan Chen',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    bio: 'Ph.D. in Physics. I have over 8 years of experience tutoring AP Physics, College Mechanics, and advanced statistics. I focus on conceptual understanding and problem-solving strategies.',
    subjects: ['Physics', 'AP Physics', 'Statistics', 'Geometry'],
    rating: 5.0,
    reviewsCount: 52,
    ratePerHour: 60,
    availability: {
      'Tuesday': ['13:00', '14:00', '15:00', '18:00'],
      'Thursday': ['13:00', '15:00', '16:00', '19:00'],
      'Saturday': ['09:00', '10:00', '11:00', '14:00'],
    }
  },
  {
    id: 'tutor-3',
    name: 'Chloe Bennett',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    bio: 'Literature enthusiast and college admissions coach. I assist students with SAT/ACT English prep, creative writing, and drafting standout college application essays that tell your unique story.',
    subjects: ['English Literature', 'College Essays', 'SAT Prep', 'History'],
    rating: 4.8,
    reviewsCount: 29,
    ratePerHour: 40,
    availability: {
      'Monday': ['13:00', '14:00', '15:00', '16:00'],
      'Tuesday': ['10:00', '11:00', '14:00', '15:00'],
      'Thursday': ['10:00', '11:00', '15:00', '16:00'],
    }
  },
  {
    id: 'tutor-4',
    name: 'James Wilson',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    bio: 'Computer Science major and programming coach. I tutor introductory coding in Python, Java, and JavaScript/TypeScript. We will build real mini-projects to reinforce variables, loops, and OOP!',
    subjects: ['Python', 'Java', 'Web Development', 'Computer Science'],
    rating: 4.9,
    reviewsCount: 41,
    ratePerHour: 50,
    availability: {
      'Wednesday': ['14:00', '15:00', '16:00', '18:00'],
      'Friday': ['14:00', '15:00', '16:00', '17:00'],
      'Saturday': ['10:00', '12:00', '13:00', '15:00'],
    }
  }
];

const INITIAL_QUESTIONS: Question[] = [
  {
    id: 'q-1',
    studentId: 'student-mock-1',
    studentName: 'Sarah Jenkins',
    title: 'Stuck on integrating quotients in Calculus',
    content: 'Hi! I am working on some AP Calculus homework and I keep getting confused when integrating expressions like ∫(2x)/(x^2 + 1) dx. Is there a simple rule or substitution method I should always look for first?',
    subject: 'Calculus',
    likes: 8,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
    replies: [
      {
        id: 'r-1',
        authorName: 'Maya Lin',
        authorRole: 'tutor',
        content: 'Great question, Sarah! For this specific integral, look at the relation between the numerator and the denominator. The derivative of the denominator (x^2 + 1) is 2x, which is exactly the numerator! This is a classic setup for u-substitution. Let u = x^2 + 1, so du = 2x dx. The integral becomes ∫(1/u) du, which is ln|u| + C. So your answer is ln(x^2 + 1) + C! In general, always check if the numerator is a scalar multiple of the derivative of the denominator.',
        createdAt: new Date(Date.now() - 3600000 * 22).toISOString()
      }
    ]
  },
  {
    id: 'q-2',
    studentId: 'student-mock-2',
    studentName: 'Oliver Smith',
    title: 'Difference between mitosis and meiosis in biology?',
    content: 'Can someone summarize the core differences between Mitosis and Meiosis in terms of the final chromosome count and the types of cells produced? I have a quiz on Friday and the textbook diagrams are incredibly dense.',
    subject: 'Biology',
    likes: 5,
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(), // 2 days ago
    replies: [
      {
        id: 'r-2',
        authorName: 'Maya Lin',
        authorRole: 'tutor',
        content: 'I got you, Oliver! Think of it this way: Mitosis = "My-Toes" (somatic/body cells, like toes!). It produces 2 identical daughter cells, both diploid (same chromosome count, 46 in humans). Meiosis = "Me-O-My, make a baby" (germ/sex cells, sperm & egg!). It involves two rounds of division, resulting in 4 genetically distinct haploid cells (half chromosome count, 23 in humans). Hope this helps you ace the quiz!',
        createdAt: new Date(Date.now() - 3600000 * 40).toISOString()
      }
    ]
  }
];

// Initialize LocalStorage Database if empty
const initLocalDB = () => {
  if (!localStorage.getItem('lt_tutors')) {
    localStorage.setItem('lt_tutors', JSON.stringify(INITIAL_TUTORS));
  }
  if (!localStorage.getItem('lt_questions')) {
    localStorage.setItem('lt_questions', JSON.stringify(INITIAL_QUESTIONS));
  }
  if (!localStorage.getItem('lt_sessions')) {
    localStorage.setItem('lt_sessions', JSON.stringify([]));
  }
  if (!localStorage.getItem('lt_notifications')) {
    localStorage.setItem('lt_notifications', JSON.stringify([
      {
        id: 'notif-welcome',
        userId: 'any',
        title: 'Welcome to The Learning Collective! 🌟',
        message: 'Explore our tutor profiles, book a personalized session, or post a doubt on the Question Board! We are here to learn, grow, and succeed together.',
        type: 'system',
        read: false,
        createdAt: new Date().toISOString()
      }
    ]));
  }
};

initLocalDB();

// ============================================================================
// HELPER METHODS (Durable Local Persistence Engine)
// ============================================================================

export const db = {
  // --- AUTHENTICATION ---
  async getCurrentUser(): Promise<User | null> {
    const currentSession = localStorage.getItem('lt_current_user');
    return currentSession ? JSON.parse(currentSession) : null;
  },

  async signUp(email: string, password: string, fullName: string, role: 'student' | 'tutor' | 'admin' = 'student'): Promise<User> {
    const localUsers = JSON.parse(localStorage.getItem('lt_users') || '[]');
    if (localUsers.some((u: any) => u.email === email)) {
      throw new Error('An account with this email already exists.');
    }

    const newUser: User = {
      id: 'usr-' + Math.random().toString(36).substring(2, 11),
      email,
      fullName,
      role,
      createdAt: new Date().toISOString()
    };

    localUsers.push(newUser);
    localStorage.setItem('lt_users', JSON.stringify(localUsers));
    localStorage.setItem('lt_current_user', JSON.stringify(newUser));

    // Send Welcome Notification
    this.addNotification(
      newUser.id,
      'Welcome to the Collective!',
      `Hi ${fullName}! Your account has been created successfully. Browse tutors and book your first lesson!`,
      'system'
    );

    return newUser;
  },

  async signIn(email: string, password: string): Promise<User> {
    const localUsers = JSON.parse(localStorage.getItem('lt_users') || '[]');
    const user = localUsers.find((u: any) => u.email === email);
    if (!user) {
      // Create a student user on-the-fly for demo purposes if no users exist
      if (email && password) {
        return this.signUp(email, password, email.split('@')[0], 'student');
      }
      throw new Error('Invalid email or password.');
    }
    
    localStorage.setItem('lt_current_user', JSON.stringify(user));
    return user;
  },

  async signOut(): Promise<void> {
    localStorage.removeItem('lt_current_user');
  },

  async updateProfile(userId: string, updates: Partial<User>): Promise<User> {
    const localUsers = JSON.parse(localStorage.getItem('lt_users') || '[]');
    const userIndex = localUsers.findIndex((u: any) => u.id === userId);
    if (userIndex === -1) {
      // If user is logged in as on-the-fly demo student, register them in lt_users first
      const currentSession = localStorage.getItem('lt_current_user');
      if (currentSession) {
        const currentUser = JSON.parse(currentSession);
        if (currentUser.id === userId) {
          const newUser = { ...currentUser, ...updates };
          localUsers.push(newUser);
          localStorage.setItem('lt_users', JSON.stringify(localUsers));
          localStorage.setItem('lt_current_user', JSON.stringify(newUser));
          return newUser;
        }
      }
      throw new Error('User not found.');
    }

    const updatedUser = {
      ...localUsers[userIndex],
      ...updates
    };

    localUsers[userIndex] = updatedUser;
    localStorage.setItem('lt_users', JSON.stringify(localUsers));

    // Update current session
    const currentSession = localStorage.getItem('lt_current_user');
    if (currentSession) {
      const parsed = JSON.parse(currentSession);
      if (parsed.id === userId) {
        localStorage.setItem('lt_current_user', JSON.stringify(updatedUser));
      }
    }

    return updatedUser;
  },

  // --- TUTORS ---
  async getTutors(): Promise<Tutor[]> {
    return JSON.parse(localStorage.getItem('lt_tutors') || '[]');
  },

  // --- SESSIONS & BOOKINGS ---
  async getSessions(userId: string): Promise<Session[]> {
    const sessions = JSON.parse(localStorage.getItem('lt_sessions') || '[]');
    return sessions.filter((s: Session) => s.studentId === userId || s.tutorId === userId);
  },

  async bookSession(sessionData: Omit<Session, 'id' | 'createdAt' | 'status' | 'paymentStatus'>): Promise<Session> {
    const id = 'sess-' + Math.random().toString(36).substring(2, 11);
    const newSession: Session = {
      ...sessionData,
      id,
      status: 'confirmed',
      paymentStatus: 'paid',
      createdAt: new Date().toISOString()
    };

    const sessions = JSON.parse(localStorage.getItem('lt_sessions') || '[]');
    sessions.push(newSession);
    localStorage.setItem('lt_sessions', JSON.stringify(sessions));

    // Trigger Automated Notification (Student)
    this.addNotification(
      newSession.studentId,
      'Session Booked! 📅',
      `You successfully booked a session with ${newSession.tutorName} for ${newSession.subject} on ${newSession.date} at ${newSession.timeSlot}. Your lesson is fully scheduled and confirmed!`,
      'booking'
    );

    // Trigger Automated Notification (Tutor)
    this.addNotification(
      newSession.tutorId,
      'New Session Request 📝',
      `${newSession.studentName} has booked a session for ${newSession.subject} on ${newSession.date} at ${newSession.timeSlot}.`,
      'booking'
    );

    return newSession;
  },

  async paySession(sessionId: string): Promise<Session> {
    const sessions = JSON.parse(localStorage.getItem('lt_sessions') || '[]');
    const sessionIndex = sessions.findIndex((s: Session) => s.id === sessionId);
    if (sessionIndex === -1) throw new Error('Session not found.');

    sessions[sessionIndex].paymentStatus = 'paid';
    sessions[sessionIndex].status = 'confirmed';
    localStorage.setItem('lt_sessions', JSON.stringify(sessions));

    const updatedSession = sessions[sessionIndex];

    // Trigger Automated Notification (Payment Confirmation)
    this.addNotification(
      updatedSession.studentId,
      'Payment Confirmed 💳',
      `Thank you! Payment of $${updatedSession.amount} received for your tutoring session with ${updatedSession.tutorName} on ${updatedSession.date}. Your lesson is fully confirmed!`,
      'payment'
    );

    // Trigger Automated Notification for Tutor
    this.addNotification(
      updatedSession.tutorId,
      'Session Confirmed & Paid ✅',
      `The session with ${updatedSession.studentName} on ${updatedSession.date} is now confirmed and paid. Prepare for ${updatedSession.subject}!`,
      'booking'
    );

    return updatedSession;
  },

  // --- QUESTIONS BOARD ---
  async getQuestions(): Promise<Question[]> {
    return JSON.parse(localStorage.getItem('lt_questions') || '[]');
  },

  async addQuestion(title: string, content: string, subject: string, studentId: string, studentName: string): Promise<Question> {
    const id = 'q-' + Math.random().toString(36).substring(2, 11);
    const newQuestion: Question = {
      id,
      studentId,
      studentName,
      title,
      content,
      subject,
      likes: 0,
      createdAt: new Date().toISOString(),
      replies: []
    };

    const questions = JSON.parse(localStorage.getItem('lt_questions') || '[]');
    questions.unshift(newQuestion);
    localStorage.setItem('lt_questions', JSON.stringify(questions));

    // Automated tutor response after 4 seconds for a responsive mock feeling
    setTimeout(() => {
      this.simulateTutorReply(id, subject);
    }, 4000);

    return newQuestion;
  },

  async addReply(questionId: string, authorName: string, authorRole: 'student' | 'tutor' | 'admin', content: string): Promise<Reply> {
    const newReply: Reply = {
      id: 'rep-' + Math.random().toString(36).substring(2, 11),
      authorName,
      authorRole,
      content,
      createdAt: new Date().toISOString()
    };

    const questions = JSON.parse(localStorage.getItem('lt_questions') || '[]');
    const qIndex = questions.findIndex((q: Question) => q.id === questionId);
    if (qIndex !== -1) {
      questions[qIndex].replies.push(newReply);
      localStorage.setItem('lt_questions', JSON.stringify(questions));

      // Trigger Notification for the author of the question
      const question = questions[qIndex];
      if (question.studentId !== 'student-mock-1' && question.studentId !== 'student-mock-2') {
        this.addNotification(
          question.studentId,
          'New Reply on Your Question 💬',
          `${authorName} (${authorRole}) replied to your question: "${question.title.substring(0, 30)}..."`,
          'question'
        );
      }
    }

    return newReply;
  },

  async likeQuestion(questionId: string): Promise<number> {
    const questions = JSON.parse(localStorage.getItem('lt_questions') || '[]');
    const qIndex = questions.findIndex((q: Question) => q.id === questionId);
    if (qIndex !== -1) {
      questions[qIndex].likes += 1;
      localStorage.setItem('lt_questions', JSON.stringify(questions));
      return questions[qIndex].likes;
    }
    return 0;
  },

  // --- NOTIFICATIONS ---
  async getNotifications(userId: string): Promise<Notification[]> {
    const notifications = JSON.parse(localStorage.getItem('lt_notifications') || '[]');
    return notifications
      .filter((n: Notification) => n.userId === userId || n.userId === 'any')
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async markNotificationAsRead(notificationId: string): Promise<void> {
    const notifications = JSON.parse(localStorage.getItem('lt_notifications') || '[]');
    const nIndex = notifications.findIndex((n: Notification) => n.id === notificationId);
    if (nIndex !== -1) {
      notifications[nIndex].read = true;
      localStorage.setItem('lt_notifications', JSON.stringify(notifications));
    }
  },

  addNotification(userId: string, title: string, message: string, type: 'booking' | 'payment' | 'question' | 'system'): Notification {
    const newNotif: Notification = {
      id: 'notif-' + Math.random().toString(36).substring(2, 11),
      userId,
      title,
      message,
      type,
      read: false,
      createdAt: new Date().toISOString()
    };

    const notifications = JSON.parse(localStorage.getItem('lt_notifications') || '[]');
    notifications.unshift(newNotif);
    localStorage.setItem('lt_notifications', JSON.stringify(notifications));

    // Dispatch a custom window event so App can play a chime/show toast instantly!
    window.dispatchEvent(new CustomEvent('new_notification', { detail: newNotif }));

    return newNotif;
  },

  // --- AUTOMATION SIMULATORS ---
  simulateTutorReply(questionId: string, subject: string) {
    const tutors = JSON.parse(localStorage.getItem('lt_tutors') || '[]');
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
    this.addReply(questionId, tutor.name, 'tutor', content);
  }
};

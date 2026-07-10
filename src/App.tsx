/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { db } from './lib/db';
import { User, Tutor, Session, Question, Notification } from './types';
import { 
  Sparkles, 
  User as UserIcon, 
  LogOut, 
  Bell, 
  Compass, 
  Calendar, 
  MessageSquare, 
  Info, 
  PhoneCall, 
  LayoutDashboard,
  CheckCircle2,
  X,
  Send,
  Heart,
  ExternalLink,
  Code,
  Sun,
  Moon,
  ChevronDown,
  Grid,
  Star
} from 'lucide-react';
import TutorCard from './components/TutorCard';
import SessionCalendar from './components/SessionCalendar';
import QuestionsBoard from './components/QuestionsBoard';
import AuthModal from './components/AuthModal';
import PaymentModal from './components/PaymentModal';
import NotificationToast from './components/NotificationToast';
import MicroservicesHub from './components/MicroservicesHub';
import EditProfile from './components/EditProfile';

type Tab = 'dashboard' | 'tutors' | 'calendar' | 'questions' | 'about' | 'contact' | 'microservices';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('about');
  
  // Database States
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Modals / Interaction States
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'signin' | 'signup'>('signin');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [activePaymentSession, setActivePaymentSession] = useState<Session | null>(null);
  const [selectedTutorForBooking, setSelectedTutorForBooking] = useState<Tutor | null>(null);
  const [bellMenuOpen, setBellMenuOpen] = useState(false);
  const [servicesMenuOpen, setServicesMenuOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    return (saved === 'dark' || saved === 'light') ? saved : 'light';
  });

  // Sync theme with HTML document class
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  // Contact Form State
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSuccess, setContactSuccess] = useState(false);

  // Load Initial Database content
  const loadDatabase = async () => {
    try {
      const user = await db.getCurrentUser();
      setCurrentUser(user);
      
      const loadedTutors = await db.getTutors();
      setTutors(loadedTutors);
      
      const loadedQuestions = await db.getQuestions();
      setQuestions(loadedQuestions);

      if (user) {
        const loadedSessions = await db.getSessions(user.id);
        setSessions(loadedSessions);

        const loadedNotifs = await db.getNotifications(user.id);
        setNotifications(loadedNotifs);
      } else {
        // Load global notifications
        const loadedNotifs = await db.getNotifications('any');
        setNotifications(loadedNotifs);
      }
    } catch (err) {
      console.error('Error seeding/loading database:', err);
    }
  };

  useEffect(() => {
    loadDatabase();

    // Listen for custom notifications to update local bell menu count
    const handleNewNotif = () => {
      if (currentUser) {
        db.getNotifications(currentUser.id).then(setNotifications);
      } else {
        db.getNotifications('any').then(setNotifications);
      }
    };

    window.addEventListener('new_notification', handleNewNotif);
    return () => window.removeEventListener('new_notification', handleNewNotif);
  }, [currentUser?.id]);

  // Close notifications dropdown when switching tabs
  useEffect(() => {
    setBellMenuOpen(false);
  }, [activeTab]);

  // Handle Authentication Success
  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    loadDatabase();
    setActiveTab('dashboard');
  };

  // Handle Logout
  const handleSignOut = async () => {
    await db.signOut();
    setCurrentUser(null);
    setSessions([]);
    setNotifications([]);
    setActiveTab('about');
  };

  // Handle Session Booking Complete
  const handleBookSession = async (sessionData: Session) => {
    try {
      await db.bookSession(sessionData);
      
      // Refresh database sessions
      if (currentUser) {
        const updated = await db.getSessions(currentUser.id);
        setSessions(updated);
      }

      // Session is automatically booked and confirmed directly
      setActiveTab('dashboard');
    } catch (err) {
      console.error(err);
    }
  };

  // Handle successful payments
  const handlePaymentSuccess = async (sessionId: string) => {
    try {
      await db.paySession(sessionId);
      if (currentUser) {
        const updated = await db.getSessions(currentUser.id);
        setSessions(updated);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Completing a Session
  const handleCompleteSession = async (sessionId: string) => {
    try {
      await db.completeSession(sessionId);
      if (currentUser) {
        const updated = await db.getSessions(currentUser.id);
        setSessions(updated);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Rating a Session/Tutor
  const handleRateSession = async (sessionId: string, rating: number) => {
    try {
      await db.rateSession(sessionId, rating);
      if (currentUser) {
        const updated = await db.getSessions(currentUser.id);
        setSessions(updated);
        // Refresh tutors to update ratings in profiles list
        const updatedTutors = await db.getTutors();
        setTutors(updatedTutors);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Trigger payment drawer on click
  const triggerPaymentFlow = (session: Session) => {
    setActivePaymentSession(session);
    setPaymentModalOpen(true);
  };

  // Contact Form Submission (with automated notifications trigger)
  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSuccess(true);
    
    // Trigger Automated in-app notification confirming receipt
    db.addNotification(
      currentUser?.id || 'any',
      'Support Ticket Submitted! 📬',
      `Thanks ${contactName || 'there'}! We have received your query regarding "${contactSubject}". Our learning coordinator will reply shortly.`,
      'system'
    );

    // Reset contact form
    setContactName('');
    setContactEmail('');
    setContactSubject('');
    setContactMessage('');

    setTimeout(() => {
      setContactSuccess(false);
    }, 4500);
  };

  // Mark all notifications as read
  const handleMarkAllRead = async () => {
    for (const notif of notifications) {
      if (!notif.read) {
        await db.markNotificationAsRead(notif.id);
      }
    }
    if (currentUser) {
      const updated = await db.getNotifications(currentUser.id);
      setNotifications(updated);
    } else {
      const updated = await db.getNotifications('any');
      setNotifications(updated);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-[#faf9f6] text-neutral-900 dark:bg-[#121513] dark:text-stone-100 font-sans flex flex-col relative selection:bg-yellow-200 dark:selection:bg-emerald-900">
      
      {/* Top Banner: Azure status & guides */}
      <div className="hidden bg-[#1e293b] text-[#E6E2D3] py-2.5 px-4 text-xs font-semibold flex flex-wrap items-center justify-between gap-2 border-b border-[#E6E2D3]/10">
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1.5 text-sky-400">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse" />
            ☁️ Azure Cloud Deployment Ready
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-slate-400">Source code linked & continuously deployed via GitHub Actions</span>
          <a 
            href="https://portal.azure.com" 
            target="_blank" 
            rel="noreferrer" 
            className="hidden text-white font-bold hover:underline inline-flex items-center gap-1"
          >
            Azure Portal <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Visual Header Panel mimicking the playful multi-colored logo */}
      <header className="bg-white dark:bg-[#1a1e1b] border-b border-[#E6E2D3] dark:border-stone-800 py-8 px-4 md:px-8 text-center relative overflow-hidden">
        {/* Doodle Ornaments background decoration */}
        <div className="absolute top-4 left-6 hidden lg:block opacity-15 -rotate-12 pointer-events-none">
          <svg className="w-16 h-16 text-[#5F7161]" fill="currentColor" viewBox="0 0 24 24">
            {/* Paper Airplane doodle representation */}
            <path d="M1.97 11.96L21.43 2.1c.42-.21.91.07.94.54l1.32 18.23c.04.53-.51.91-.98.66l-5.6-3.03-2.61 4.83c-.27.5-1.01.42-1.15-.12l-1.92-7.46-8.8-3.04c-.54-.19-.51-.95.08-.78z"/>
          </svg>
        </div>
        <div className="absolute top-4 right-12 hidden lg:block opacity-15 rotate-12 pointer-events-none">
          <svg className="w-12 h-12 text-[#E7AB79]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            {/* Pencil icon representation */}
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </div>

        {/* Playful organization logo */}
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          <span className="text-sm font-bold italic tracking-wide text-[#9A9483] dark:text-stone-400 font-mono">the</span>
          
          {/* Hand-drawn multicolour typographic block */}
          <h1 className="text-3xl md:text-5xl font-serif font-bold tracking-tight mt-0.5 select-none flex items-center justify-center gap-0.5">
            <span className="text-[#5F7161]">L</span>
            <span className="text-[#E7AB79]">e</span>
            <span className="text-[#8E613B]">a</span>
            <span className="text-[#A25B5B]">r</span>
            <span className="text-[#5F7161]">n</span>
            <span className="text-[#E7AB79]">i</span>
            <span className="text-[#8E613B]">n</span>
            <span className="text-[#4D5C4F]">g</span>
            <span className="text-[#2D3A30] dark:text-[#a5bca7] ml-3 font-medium tracking-normal">collective</span>
          </h1>

          {/* Underline underline illustration */}
          <div className="w-48 h-[2px] bg-[#E6E2D3] dark:bg-stone-700 mt-2 relative">
            <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 bg-white dark:bg-[#1a1e1b] px-2">
              <Heart className="w-3.5 h-3.5 text-[#E7AB79] fill-[#E7AB79] animate-pulse" />
            </span>
          </div>

          <p className="text-[10px] md:text-xs font-bold tracking-[0.25em] text-[#9A9483] dark:text-stone-400 uppercase mt-4">
            LEARN. GROW. SUCCEED. TOGETHER.
          </p>
        </div>
      </header>

      {/* Main Navigation Row */}
      <nav className="bg-white dark:bg-[#1a1e1b] border-b border-[#E6E2D3] dark:border-stone-800 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14 relative">
          {/* Nav Tabs Dropdown */}
          <div className="flex-1 flex gap-4 h-full items-center mr-4">
            {/* Services Dropdown */}
            <div className="relative">
              <button
                onClick={() => setServicesMenuOpen(!servicesMenuOpen)}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-[#E6E2D3] dark:border-stone-800 bg-white dark:bg-[#1a1e1b] text-[#2D3A30] dark:text-[#a5bca7] hover:bg-[#5F7161]/5 dark:hover:bg-[#5F7161]/10 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Grid className="w-4 h-4 text-[#5F7161]" />
                <span>Explore Services</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform text-[#9A9483] ${servicesMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {servicesMenuOpen && (
                <>
                  {/* Backdrop overlay to handle outside clicks cleanly */}
                  <div 
                    className="fixed inset-0 z-30" 
                    onClick={() => setServicesMenuOpen(false)} 
                  />
                  <div className="absolute left-0 mt-2 w-72 md:w-80 bg-white dark:bg-[#1a1e1b] border border-[#E6E2D3] dark:border-stone-800 rounded-2xl shadow-xl z-40 overflow-hidden py-2 animate-fadeIn">
                    <div className="px-4 py-2 border-b border-[#E6E2D3] dark:border-stone-800 text-[10px] font-bold text-[#9A9483] dark:text-stone-400 uppercase tracking-wider">
                      School & Cloud Services
                    </div>
                    
                    <div className="divide-y divide-[#E6E2D3]/40 dark:divide-stone-800/40">
                      {/* Dashboard if logged in */}
                      {currentUser && (
                        <button
                          onClick={() => {
                            setActiveTab('dashboard');
                            setServicesMenuOpen(false);
                          }}
                          className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-[#5F7161]/5 dark:hover:bg-[#5F7161]/10 transition-colors cursor-pointer ${
                            activeTab === 'dashboard' ? 'bg-[#5F7161]/5 dark:bg-[#5F7161]/10' : ''
                          }`}
                        >
                          <LayoutDashboard className="w-4 h-4 mt-0.5 text-[#5F7161] shrink-0" />
                          <div>
                            <div className="text-xs font-bold text-[#2D3A30] dark:text-stone-200">Dashboard</div>
                            <div className="text-[10px] text-[#9A9483] dark:text-stone-400 font-medium leading-normal">Track lesson history, streaks, and view student status.</div>
                          </div>
                        </button>
                      )}

                      {/* Tutor Profiles */}
                      <button
                        onClick={() => {
                          setActiveTab('tutors');
                          setServicesMenuOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-[#5F7161]/5 dark:hover:bg-[#5F7161]/10 transition-colors cursor-pointer ${
                          activeTab === 'tutors' ? 'bg-[#5F7161]/5 dark:bg-[#5F7161]/10' : ''
                        }`}
                      >
                        <Compass className="w-4 h-4 mt-0.5 text-[#A25B5B] shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-[#2D3A30] dark:text-stone-200">Tutor Profiles</div>
                          <div className="text-[10px] text-[#9A9483] dark:text-stone-400 font-medium leading-normal">Meet professional mentors and schedule target subjects.</div>
                        </div>
                      </button>

                      {/* Session Calendar */}
                      <button
                        onClick={() => {
                          setActiveTab('calendar');
                          setServicesMenuOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-[#5F7161]/5 dark:hover:bg-[#5F7161]/10 transition-colors cursor-pointer ${
                          activeTab === 'calendar' ? 'bg-[#5F7161]/5 dark:bg-[#5F7161]/10' : ''
                        }`}
                      >
                        <Calendar className="w-4 h-4 mt-0.5 text-[#5F7161] shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-[#2D3A30] dark:text-stone-200">Session Calendar</div>
                          <div className="text-[10px] text-[#9A9483] dark:text-stone-400 font-medium leading-normal">Schedule upcoming slots or view reservation timestamps.</div>
                        </div>
                      </button>

                      {/* Questions Board */}
                      <button
                        onClick={() => {
                          setActiveTab('questions');
                          setServicesMenuOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-[#5F7161]/5 dark:hover:bg-[#5F7161]/10 transition-colors cursor-pointer ${
                          activeTab === 'questions' ? 'bg-[#5F7161]/5 dark:bg-[#5F7161]/10' : ''
                        }`}
                      >
                        <MessageSquare className="w-4 h-4 mt-0.5 text-[#8E613B] shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-[#2D3A30] dark:text-stone-200">Questions Board</div>
                          <div className="text-[10px] text-[#9A9483] dark:text-stone-400 font-medium leading-normal">Ask academic questions and receive verified answers.</div>
                        </div>
                      </button>

                      {/* Microservices Hub */}
                      <button
                        onClick={() => {
                          setActiveTab('microservices');
                          setServicesMenuOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-[#5F7161]/5 dark:hover:bg-[#5F7161]/10 transition-colors cursor-pointer ${
                          activeTab === 'microservices' ? 'bg-[#5F7161]/5 dark:bg-[#5F7161]/10' : ''
                        }`}
                      >
                        <Code className="w-4 h-4 mt-0.5 text-sky-500 shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-[#2D3A30] dark:text-stone-200">Microservices Hub</div>
                          <div className="text-[10px] text-[#9A9483] dark:text-stone-400 font-medium leading-normal">Interactive sandbox for Azure, Redis, Stripe, CI/CD.</div>
                        </div>
                      </button>

                      {/* About Us */}
                      <button
                        onClick={() => {
                          setActiveTab('about');
                          setServicesMenuOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-[#5F7161]/5 dark:hover:bg-[#5F7161]/10 transition-colors cursor-pointer ${
                          activeTab === 'about' ? 'bg-[#5F7161]/5 dark:bg-[#5F7161]/10' : ''
                        }`}
                      >
                        <Info className="w-4 h-4 mt-0.5 text-[#E7AB79] shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-[#2D3A30] dark:text-stone-200">About Us</div>
                          <div className="text-[10px] text-[#9A9483] dark:text-stone-400 font-medium leading-normal">Our vision of cooperative learning and collective education.</div>
                        </div>
                      </button>

                      {/* Contact Us */}
                      <button
                        onClick={() => {
                          setActiveTab('contact');
                          setServicesMenuOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-[#5F7161]/5 dark:hover:bg-[#5F7161]/10 transition-colors cursor-pointer ${
                          activeTab === 'contact' ? 'bg-[#5F7161]/5 dark:bg-[#5F7161]/10' : ''
                        }`}
                      >
                        <PhoneCall className="w-4 h-4 mt-0.5 text-[#5F7161] shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-[#2D3A30] dark:text-stone-200">Contact Us</div>
                          <div className="text-[10px] text-[#9A9483] dark:text-stone-400 font-medium leading-normal">Get in touch with administrators or tutor service reps.</div>
                        </div>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Active view badge */}
            <div className="hidden sm:flex items-center gap-2 text-xs text-[#9A9483] dark:text-stone-400 font-mono font-bold uppercase border-l border-[#E6E2D3] dark:border-stone-800 pl-4 h-6">
              <span>View:</span>
              <span className="px-2.5 py-0.5 bg-[#5F7161]/10 text-[#2D3A30] dark:text-[#a5bca7] rounded-lg border border-[#5F7161]/25">
                {activeTab === 'about' && 'About Us'}
                {activeTab === 'tutors' && 'Tutor Profiles'}
                {activeTab === 'calendar' && 'Session Calendar'}
                {activeTab === 'questions' && 'Questions Board'}
                {activeTab === 'contact' && 'Contact Us'}
                {activeTab === 'microservices' && 'Microservices Hub'}
                {activeTab === 'dashboard' && 'Dashboard'}
              </span>
            </div>
          </div>

          {/* Right Section: Auth & Notifications */}
          <div className="flex items-center gap-2 pl-4">

            {/* Theme Toggle Button */}
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="p-2 border border-[#E6E2D3] dark:border-stone-800 rounded-xl hover:bg-[#5F7161]/5 dark:hover:bg-[#5F7161]/10 transition-colors cursor-pointer bg-white dark:bg-[#1a1e1b] text-[#2D3A30] dark:text-stone-300 shadow-sm"
              title={theme === 'light' ? "Switch to Dark Theme" : "Switch to Light Theme"}
              id="theme-toggle-button"
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4 text-slate-700" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500 fill-amber-400" />
              )}
            </button>
            
            {/* Bell Notifications Dropdown Trigger */}
            <div className="relative">
              <button
                onClick={() => setBellMenuOpen(!bellMenuOpen)}
                className="p-2 border border-[#E6E2D3] dark:border-stone-800 rounded-xl hover:bg-[#5F7161]/5 dark:hover:bg-[#5F7161]/10 transition-colors relative cursor-pointer bg-white dark:bg-[#1a1e1b]"
              >
                <Bell className="w-4 h-4 text-[#2D3A30] dark:text-stone-300" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#E7AB79] text-white font-bold text-[9px] px-1.5 py-0.5 rounded-full border border-white animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Bell Menu */}
              {bellMenuOpen && (
                <>
                  {/* Backdrop overlay to handle outside clicks cleanly */}
                  <div 
                    className="fixed inset-0 z-30" 
                    onClick={() => setBellMenuOpen(false)} 
                  />
                  <div className="absolute right-0 mt-3 w-[calc(100vw-2rem)] sm:w-80 max-w-sm bg-white dark:bg-[#1a1e1b] border border-[#E6E2D3] dark:border-stone-800 rounded-xl shadow-lg overflow-hidden z-40 animate-fadeIn">
                    <div className="p-3 bg-[#5F7161] text-white flex justify-between items-center">
                      <span className="text-xs font-bold tracking-wider uppercase">Notifications</span>
                      {unreadCount > 0 && (
                        <button 
                          onClick={handleMarkAllRead}
                          className="text-[9px] font-bold bg-white/20 px-2 py-0.5 rounded-lg hover:bg-white/30 transition-colors cursor-pointer"
                        >
                          Mark All Read
                        </button>
                      )}
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-[#E6E2D3] dark:divide-stone-800">
                      {notifications.length > 0 ? (
                        notifications.map((notif) => (
                          <div key={notif.id} className={`p-3 text-left hover:bg-[#5F7161]/5 dark:hover:bg-[#5F7161]/10 transition-colors ${!notif.read ? 'bg-[#5F7161]/5 dark:bg-[#5F7161]/10' : ''}`}>
                            <div className="flex justify-between items-start">
                              <h5 className="text-xs font-bold text-[#2D3A30] dark:text-stone-200">{notif.title}</h5>
                              {!notif.read && <span className="w-2 h-2 rounded-full bg-[#E7AB79] flex-shrink-0 mt-1" />}
                            </div>
                            <p className="text-[11px] text-[#6B6B6B] dark:text-stone-300 mt-0.5 font-medium leading-relaxed">{notif.message}</p>
                            <span className="text-[9px] text-[#9A9483] dark:text-stone-400 font-semibold block mt-1">{new Date(notif.createdAt).toLocaleDateString()}</span>
                          </div>
                        ))
                      ) : (
                        <div className="p-6 text-center text-xs text-[#9A9483] dark:text-stone-400 font-bold">
                          No notifications yet. Play, book, or ask a question to see automated alarms!
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* User Session Profile controls */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                {currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.fullName}
                    className="w-8 h-8 rounded-lg object-cover border border-[#E6E2D3] dark:border-stone-800"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-[#FAF9F5] dark:bg-stone-800 border border-[#E6E2D3] dark:border-stone-700 flex items-center justify-center text-[#9A9483] dark:text-stone-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
                <div className="hidden sm:flex flex-col items-end text-right">
                  <span className="text-xs font-bold leading-tight text-neutral-800 dark:text-stone-200">{currentUser.fullName}</span>
                  <span className="text-[9px] font-semibold text-[#9A9483] dark:text-stone-400 uppercase tracking-widest leading-none">{currentUser.role}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-2 border border-[#E6E2D3] dark:border-stone-800 hover:bg-rose-50/50 dark:hover:bg-rose-950/45 text-[#9A9483] dark:text-stone-400 hover:text-rose-600 rounded-xl transition-colors cursor-pointer bg-white dark:bg-[#1a1e1b]"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex gap-1.5">
                <button
                  onClick={() => { setAuthModalTab('signin'); setAuthModalOpen(true); }}
                  className="px-3.5 py-2 text-xs font-bold border border-[#E6E2D3] dark:border-stone-800 rounded-xl hover:bg-[#5F7161]/5 dark:hover:bg-[#5F7161]/15 cursor-pointer bg-white dark:bg-[#1a1e1b] text-[#2D3A30] dark:text-[#a5bca7]"
                >
                  Login
                </button>
                <button
                  onClick={() => { setAuthModalTab('signup'); setAuthModalOpen(true); }}
                  className="px-3.5 py-2 text-xs font-bold bg-[#5F7161] text-white rounded-xl hover:bg-[#4D5C4F] transition-colors border border-[#5F7161] cursor-pointer shadow-sm"
                >
                  Register
                </button>
              </div>
            )}

          </div>
        </div>
      </nav>

      {/* Main Container Workspace */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-8">
        
        {/* About Us View */}
        {activeTab === 'about' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Mission Statement Row */}
            <div className="bg-white border border-[#E6E2D3] rounded-2xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex-1 space-y-4">
                <div className="inline-flex items-center gap-1.5 bg-[#E7AB79]/10 border border-[#E7AB79]/20 px-3 py-1 rounded-full text-xs font-bold text-[#8E613B]">
                  <Sparkles className="w-3.5 h-3.5 text-[#E7AB79] fill-[#E7AB79]/30" />
                  Educators At Heart
                </div>
                <h2 className="text-2xl md:text-3xl font-serif font-bold text-[#2D3A30] tracking-tight leading-tight">
                  Nurturing intellectual curiosities through personalized, peerless academic consultancy.
                </h2>
                <p className="text-sm text-neutral-600 leading-relaxed font-medium">
                  The Learning Collective was founded with a singular purpose: to bring fun, hand-drawn warmth, and stellar professional rigor back into mentoring. We believe that tutoring is not just about solving homework questions, but about learning how to discover patterns, grow through mistakes, and succeed together.
                </p>
                <button
                  onClick={() => setActiveTab('tutors')}
                  className="px-5 py-3.5 bg-[#5F7161] hover:bg-[#4D5C4F] text-white font-bold text-xs rounded-xl transition-all border border-[#5F7161] cursor-pointer shadow-sm"
                >
                  Meet Our Educators
                </button>
              </div>

              {/* Doodle Graphic Frame */}
              <div className="w-full md:w-80 h-64 bg-[#F9F7F0] border border-[#E6E2D3] rounded-2xl flex flex-col items-center justify-center p-6 text-center shadow-sm relative overflow-hidden">
                <div className="absolute top-2 right-2 p-1.5 rounded-full bg-white border border-[#E6E2D3] shadow-sm">
                  <Heart className="w-4 h-4 text-[#E7AB79] fill-[#E7AB79]" />
                </div>
                <div className="space-y-2 relative z-10">
                  <span className="text-4xl">🔬</span>
                  <h4 className="text-sm font-bold text-[#2D3A30] uppercase tracking-wider mt-1">Succeed Together</h4>
                  <p className="text-xs text-neutral-600 font-semibold max-w-[200px] leading-relaxed">
                    Custom-tailored curriculums for high schools, AP Exams, SATs, and computer sciences.
                  </p>
                </div>
              </div>
            </div>

            {/* Key Advantages Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="bg-white border border-[#E6E2D3] rounded-2xl p-6 shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#A25B5B]/10 border border-[#A25B5B]/20 flex items-center justify-center">
                  <span className="text-xl">🎓</span>
                </div>
                <h4 className="text-base font-serif font-bold text-[#2D3A30]">Certified Mentors</h4>
                <p className="text-xs text-neutral-500 font-medium leading-relaxed">
                  Every tutor undergoes meticulous evaluation, background screening, and classroom testing to ensure stellar, encouraging communication.
                </p>
              </div>

              <div className="bg-white border border-[#E6E2D3] rounded-2xl p-6 shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#E7AB79]/10 border border-[#E7AB79]/20 flex items-center justify-center">
                  <span className="text-xl">💳</span>
                </div>
                <h4 className="text-base font-serif font-bold text-[#2D3A30]">Frictionless Checkouts</h4>
                <p className="text-xs text-neutral-500 font-medium leading-relaxed">
                  Manage sessions and book/pay securely via our integrated database. Cancel or reschedule with absolute clarity in your dashboard.
                </p>
              </div>

              <div className="bg-white border border-[#E6E2D3] rounded-2xl p-6 shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#5F7161]/10 border border-[#5F7161]/20 flex items-center justify-center">
                  <span className="text-xl">💬</span>
                </div>
                <h4 className="text-base font-serif font-bold text-[#2D3A30]">Always Connected</h4>
                <p className="text-xs text-neutral-500 font-medium leading-relaxed">
                  Post question cards on our collaborative dudas board, and get helpful answers, notifications, and study reminders instantly.
                </p>
              </div>

            </div>

            {/* Testimonials */}
            <div className="bg-[#2D3A30] text-white border border-[#2D3A30] rounded-2xl p-6 md:p-8 shadow-sm">
              <h3 className="text-sm font-bold text-[#E7AB79] tracking-widest uppercase mb-4">What Our Community Says</h3>
              <blockquote className="text-base md:text-lg font-serif italic leading-relaxed text-[#F9F7F0]">
                "The Learning Collective transformed the way my son looks at Algebra. Maya Lin did not just show him formulas — she drew paper airplanes, sketches, and made him fall in love with coordinate math. Absolute gold standard of tutoring!"
              </blockquote>
              <div className="flex items-center gap-2 mt-4">
                <div className="w-1.5 h-1.5 rounded-full bg-[#E7AB79]" />
                <span className="text-xs font-bold text-white/80">Mr. Arthur Jenkins, Parent of Sarah Jenkins</span>
              </div>
            </div>
          </div>
        )}

        {/* Tutor Profiles View */}
        {activeTab === 'tutors' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h3 className="text-xl font-serif font-bold text-[#2D3A30] tracking-tight flex items-center gap-2">
                <span className="p-1.5 bg-[#A25B5B]/10 border border-[#A25B5B]/20 rounded-xl">
                  <Compass className="w-5 h-5 text-[#A25B5B]" />
                </span>
                Our Educational Consultants
              </h3>
              <p className="text-xs text-[#9A9483] font-semibold mt-1">
                Explore profiles of highly vetted, passionate tutors specializing in high-school, test prep, and university-level subjects.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tutors.map((tutor) => (
                <TutorCard
                  key={tutor.id}
                  tutor={tutor}
                  onBook={(t) => {
                    setSelectedTutorForBooking(t);
                    setActiveTab('calendar');
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Session Calendar View */}
        {activeTab === 'calendar' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h3 className="text-xl font-serif font-bold text-[#2D3A30] tracking-tight flex items-center gap-2">
                <span className="p-1.5 bg-[#5F7161]/10 border border-[#5F7161]/20 rounded-xl">
                  <Calendar className="w-5 h-5 text-[#5F7161]" />
                </span>
                Reserve a Tutoring Lesson
              </h3>
              <p className="text-xs text-[#9A9483] font-semibold mt-1">
                Choose a tutor, pick a convenient date, select an open time slot, and submit your reservation request instantly.
              </p>
            </div>

            <SessionCalendar
              tutors={tutors}
              selectedTutor={selectedTutorForBooking}
              currentUser={currentUser}
              onTutorSelect={setSelectedTutorForBooking}
              onBookSuccess={handleBookSession}
            />
          </div>
        )}

        {/* Questions Board View */}
        {activeTab === 'questions' && (
          <QuestionsBoard
            questions={questions}
            currentUser={currentUser}
            onQuestionAdded={setQuestions}
            onOpenAuth={() => { setAuthModalTab('signin'); setAuthModalOpen(true); }}
          />
        )}

        {/* Contact Us View */}
        {activeTab === 'contact' && (
          <div className="space-y-6 animate-fadeIn max-w-2xl mx-auto">
            <div>
              <h3 className="text-xl font-serif font-bold text-[#2D3A30] tracking-tight flex items-center gap-2">
                <span className="p-1.5 bg-[#5F7161]/10 border border-[#5F7161]/20 rounded-xl">
                  <PhoneCall className="w-5 h-5 text-[#5F7161]" />
                </span>
                Get In Touch
              </h3>
              <p className="text-xs text-[#9A9483] font-semibold mt-1">
                Have specific curricular questions, custom schedules, or feedback? Drop us a line and let's succeed together!
              </p>
            </div>

            {contactSuccess ? (
              <div className="bg-emerald-50/40 border border-emerald-200 rounded-2xl p-8 text-center flex flex-col items-center shadow-sm">
                <div className="p-3 bg-emerald-100 rounded-full text-emerald-600 mb-4 border border-emerald-300">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h4 className="text-lg font-serif font-bold text-[#2D3A30]">Message Transmitted!</h4>
                <p className="text-xs text-neutral-600 font-semibold max-w-sm mt-1.5 leading-relaxed">
                  Your communication has been processed. A customer support coordinator will reach out to you via your email shortly. Check your automated notifications! 🌟
                </p>
              </div>
            ) : (
              <div className="bg-white border border-[#E6E2D3] rounded-2xl p-6 shadow-sm">
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wider block">Your Name</label>
                      <input
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder=" Sarah Jenkins"
                        className="w-full px-4 py-3 border border-[#E6E2D3] rounded-xl text-sm font-semibold bg-[#FDFCF8] focus:bg-white focus:outline-none focus:border-[#5F7161]/50 transition-colors text-[#3D3D3D]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wider block">Email Address</label>
                      <input
                        type="email"
                        required
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full px-4 py-3 border border-[#E6E2D3] rounded-xl text-sm font-semibold bg-[#FDFCF8] focus:bg-white focus:outline-none focus:border-[#5F7161]/50 transition-colors text-[#3D3D3D]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wider block">Subject</label>
                    <input
                      type="text"
                      required
                      value={contactSubject}
                      onChange={(e) => setContactSubject(e.target.value)}
                      placeholder="e.g., Requesting sibling discount rate / Special curricular needs"
                      className="w-full px-4 py-3 border border-[#E6E2D3] rounded-xl text-sm font-semibold bg-[#FDFCF8] focus:bg-white focus:outline-none focus:border-[#5F7161]/50 transition-colors text-[#3D3D3D]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#6B6B6B] uppercase tracking-wider block">Your Message</label>
                    <textarea
                      required
                      rows={4}
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder="Write your details or specifications..."
                      className="w-full px-4 py-3 border border-[#E6E2D3] rounded-xl text-sm font-semibold bg-[#FDFCF8] focus:bg-white focus:outline-none focus:border-[#5F7161]/50 transition-colors resize-none leading-relaxed text-[#3D3D3D]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 mt-2 bg-[#5F7161] hover:bg-[#4D5C4F] text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 border border-[#5F7161] cursor-pointer shadow-sm"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send Message</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Microservices View */}
        {activeTab === 'microservices' && (
          <MicroservicesHub 
            currentUser={currentUser}
            onAddNotification={(title, message, type) => {
              db.addNotification(currentUser?.id || 'any', title, message, type);
            }}
          />
        )}

        {/* Dashboard View */}
        {activeTab === 'dashboard' && currentUser && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* User Intro Block */}
            <div className="bg-white border border-[#E6E2D3] rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                {currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.fullName}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-[#5F7161] shadow-sm bg-stone-50"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-[#FAF9F5] border border-[#E6E2D3] flex items-center justify-center text-[#9A9483] shrink-0">
                    <UserIcon className="w-6 h-6" />
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-serif font-bold text-[#2D3A30] tracking-tight">
                    Welcome to Your Control Center, {currentUser.fullName}!
                  </h3>
                  <p className="text-xs text-[#9A9483] font-semibold mt-1">
                    Role: <span className="text-[#2D3A30] font-bold uppercase tracking-wider">{currentUser.role}</span> • Member since {new Date(currentUser.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all border cursor-pointer shadow-sm ${
                    isEditingProfile
                      ? 'bg-stone-100 text-[#2D3A30] border-stone-300 hover:bg-stone-200'
                      : 'bg-white text-neutral-700 border-[#E6E2D3] hover:bg-[#FAF9F5]'
                  }`}
                >
                  {isEditingProfile ? 'Close Edit' : 'Edit Profile'}
                </button>
                <button
                  onClick={() => setActiveTab('tutors')}
                  className="px-4 py-2 text-xs font-bold bg-[#5F7161] text-white hover:bg-[#4D5C4F] border border-[#5F7161] rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  Book New Session
                </button>
              </div>
            </div>

            {/* Edit Profile Panel */}
            {isEditingProfile && (
              <EditProfile
                currentUser={currentUser}
                onProfileUpdated={(updatedUser) => {
                  setCurrentUser(updatedUser);
                }}
                onAddNotification={(title, message, type) => {
                  db.addNotification(currentUser?.id || 'any', title, message, type);
                }}
                onClose={() => setIsEditingProfile(false)}
              />
            )}

            {/* Quick Summary Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <div className="bg-white border border-[#E6E2D3] rounded-xl p-4 shadow-sm">
                <p className="text-[10px] font-bold text-[#9A9483] uppercase tracking-widest">Active Lessons</p>
                <p className="text-2xl font-bold text-[#2D3A30] mt-1">
                  {sessions.filter(s => s.status === 'confirmed').length}
                </p>
              </div>

              <div className="bg-white border border-[#E6E2D3] rounded-xl p-4 shadow-sm">
                <p className="text-[10px] font-bold text-[#9A9483] uppercase tracking-widest">Hours Scheduled</p>
                <p className="text-2xl font-bold text-[#5F7161] mt-1">
                  {sessions.length} hrs
                </p>
              </div>

              <div className="bg-white border border-[#E6E2D3] rounded-xl p-4 shadow-sm">
                <p className="text-[10px] font-bold text-[#9A9483] uppercase tracking-widest">Unread Messages</p>
                <p className="text-2xl font-bold text-[#E7AB79] mt-1">
                  {unreadCount}
                </p>
              </div>

            </div>

            {/* Active Bookings list */}
            <div className="bg-white border border-[#E6E2D3] rounded-2xl p-6 shadow-sm">
              <h4 className="text-sm font-bold text-[#2D3A30] uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#A25B5B]" />
                Active Tutoring Bookings
              </h4>

              {sessions.length > 0 ? (
                <div className="divide-y divide-[#E6E2D3]">
                  {sessions.map((session) => (
                    <div key={session.id} className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex items-center gap-3.5">
                        <img
                          src={session.tutorAvatar}
                          alt={session.tutorName}
                          className="w-12 h-12 rounded-xl object-cover border border-[#E6E2D3]"
                        />
                        <div>
                          <p className="text-sm font-serif font-bold text-[#2D3A30]">{session.tutorName}</p>
                          <p className="text-xs text-[#9A9483] font-semibold mt-0.5">{session.subject} • {session.date} at {session.timeSlot}</p>
                          <span className="text-[9px] font-semibold text-[#9A9483]">Created: {new Date(session.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        {session.status === 'confirmed' && (
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 rounded-full bg-[#5F7161]/10 border border-[#5F7161]/20 text-[#2D3A30] text-xs font-bold">
                              Scheduled & Confirmed ✅
                            </span>
                            <button
                              onClick={() => handleCompleteSession(session.id)}
                              className="px-3 py-1.5 bg-[#E7AB79] hover:bg-[#d69966] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm"
                            >
                              Mark Completed 🎓
                            </button>
                          </div>
                        )}
                        {session.status === 'completed' && (
                          <div className="flex flex-col sm:items-end gap-1.5">
                            <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-stone-800 border border-slate-200 dark:border-stone-700 text-[#2D3A30] dark:text-stone-300 text-xs font-bold">
                              Session Completed 🎓
                            </span>
                            {session.ratingGiven ? (
                              <div className="flex items-center gap-1 text-amber-500 font-bold text-xs bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                                <span>Rated:</span>
                                <div className="flex">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-3 h-3 ${
                                        i < (session.ratingGiven || 0)
                                          ? 'fill-amber-500 text-amber-500'
                                          : 'text-stone-300 dark:text-stone-600'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-bold text-[#9A9483] uppercase tracking-wider">Rate Tutor:</span>
                                <div className="flex items-center gap-0.5">
                                  {[1, 2, 3, 4, 5].map((starVal) => (
                                    <button
                                      key={starVal}
                                      onClick={() => handleRateSession(session.id, starVal)}
                                      className="text-stone-300 hover:text-amber-500 transition-colors cursor-pointer p-0.5"
                                      title={`Rate ${starVal} Stars`}
                                    >
                                      <Star className="w-4 h-4 hover:scale-110 active:scale-95 transition-transform hover:fill-amber-500" />
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 border border-dashed border-[#E6E2D3] rounded-xl bg-[#FDFCF8] text-center text-xs text-[#9A9483] font-semibold">
                  No active tutor bookings. Browse profiles and reserve your first session above! 📚
                </div>
              )}
            </div>

          </div>
        )}

      </main>

      {/* Decorative Hand-drawn Footer */}
      <footer className="bg-white border-t border-[#E6E2D3] py-8 px-4 md:px-8 text-center mt-auto">
        <div className="max-w-4xl mx-auto space-y-4">
          <p className="text-xs font-bold tracking-widest text-[#9A9483] uppercase">
            The Learning Collective • Tutoring Consultancy
          </p>
          <div className="flex justify-center gap-4 text-xs font-bold text-[#9A9483]">
            <span className="hover:text-[#5F7161] cursor-pointer">Terms of Service</span>
            <span>•</span>
            <span className="hover:text-[#E7AB79] cursor-pointer">Privacy & HIPAA Security</span>
            <span>•</span>
            <span className="hover:text-[#A25B5B] cursor-pointer">Coordinator Portal</span>
          </div>
          <p className="text-[10px] text-[#9A9483] font-semibold leading-relaxed">
            © 2026 The Learning Collective. Designed with a bright doodle learning aesthetic. Powered securely by Azure Cloud.
          </p>
        </div>
      </footer>

      {/* Auth Modal overlay */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        initialTab={authModalTab}
      />

      {/* Stripe mock payment gateway modal */}
      <PaymentModal
        session={activePaymentSession}
        isOpen={paymentModalOpen}
        onClose={() => { setPaymentModalOpen(false); setActivePaymentSession(null); }}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Notification Toast Handler */}
      <NotificationToast />

    </div>
  );
}

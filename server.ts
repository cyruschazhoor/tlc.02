import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// ============================================================================
// DATABASE CONNECTIVITY (PostgreSQL with Local JSON Fallback)
// ============================================================================

let pool: pg.Pool | null = null;
let usePostgres = false;

const pgConfig = process.env.DATABASE_URL || process.env.PGHOST;

if (pgConfig) {
  console.log('Database configuration found. Attempting to connect to PostgreSQL...');
  try {
    const config: pg.PoolConfig = process.env.DATABASE_URL
      ? { connectionString: process.env.DATABASE_URL }
      : {
          host: process.env.PGHOST,
          port: parseInt(process.env.PGPORT || '5432'),
          user: process.env.PGUSER,
          password: process.env.PGPASSWORD,
          database: process.env.PGDATABASE,
        };
    
    // For Azure/Cloud Database for PostgreSQL, enable SSL by default
    if (!config.ssl && (process.env.NODE_ENV === 'production' || process.env.DATABASE_URL?.includes('azure') || process.env.DATABASE_URL?.includes('cockroach') || process.env.DATABASE_URL?.includes('neon'))) {
      config.ssl = { rejectUnauthorized: false };
    }

    pool = new pg.Pool(config);
    usePostgres = true;
    console.log('PostgreSQL Pool initialized successfully.');
  } catch (err) {
    console.error('Failed to initialize PostgreSQL pool:', err);
    usePostgres = false;
  }
} else {
  console.log('No DATABASE_URL or PG environment variables found. Using Local JSON Database fallback.');
}

// Fallback JSON DB Store path
const FALLBACK_DB_PATH = path.join(process.cwd(), 'db_fallback.json');

// Initial seed data structures
const INITIAL_TUTORS = [
  {
    id: 'tutor-1',
    name: 'Maya Lin',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    bio: "Hi, I am Maya! I specialize in high-school mathematics, chemistry, and biology. I love making complex concepts feel intuitive using sketches and real-world analogies. Let's succeed together!",
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

const INITIAL_QUESTIONS = [
  {
    id: 'q-1',
    studentId: 'student-mock-1',
    studentName: 'Sarah Jenkins',
    title: 'Stuck on integrating quotients in Calculus',
    content: 'Hi! I am working on some AP Calculus homework and I keep getting confused when integrating expressions like ∫(2x)/(x^2 + 1) dx. Is there a simple rule or substitution method I should always look for first?',
    subject: 'Calculus',
    likes: 8,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
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
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
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

// Initialize JSON database
const readJsonDb = () => {
  if (!fs.existsSync(FALLBACK_DB_PATH)) {
    const data = {
      users: [],
      tutors: INITIAL_TUTORS,
      sessions: [],
      questions: INITIAL_QUESTIONS,
      notifications: [
        {
          id: 'notif-welcome',
          userId: 'any',
          title: 'Welcome to The Learning Collective! 🌟',
          message: 'Explore our tutor profiles, book a personalized session, or post a doubt on the Question Board! We are here to learn, grow, and succeed together.',
          type: 'system',
          read: false,
          createdAt: new Date().toISOString()
        }
      ]
    };
    fs.writeFileSync(FALLBACK_DB_PATH, JSON.stringify(data, null, 2));
    return data;
  }
  try {
    return JSON.parse(fs.readFileSync(FALLBACK_DB_PATH, 'utf-8'));
  } catch (err) {
    console.error('Error reading JSON fallback DB:', err);
    return { users: [], tutors: INITIAL_TUTORS, sessions: [], questions: INITIAL_QUESTIONS, notifications: [] };
  }
};

const writeJsonDb = (data: any) => {
  try {
    fs.writeFileSync(FALLBACK_DB_PATH, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing to JSON fallback DB:', err);
  }
};

// Initialize PostgreSQL Tables
const initPostgresDb = async () => {
  if (!pool) return;
  const client = await pool.connect();
  try {
    console.log('Initializing Postgres schema...');
    
    // Create Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(100) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        fullName VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'student',
        createdAt VARCHAR(100) NOT NULL
      )
    `);

    // Create Tutors table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tutors (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        avatar TEXT,
        bio TEXT,
        subjects JSONB NOT NULL,
        rating NUMERIC(3,2) DEFAULT 5.0,
        reviewsCount INTEGER DEFAULT 0,
        ratePerHour INTEGER DEFAULT 30,
        availability JSONB NOT NULL,
        createdAt VARCHAR(100)
      )
    `);

    // Create Sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(100) PRIMARY KEY,
        tutorId VARCHAR(100) NOT NULL,
        tutorName VARCHAR(255) NOT NULL,
        studentId VARCHAR(100) NOT NULL,
        studentName VARCHAR(255) NOT NULL,
        subject VARCHAR(100) NOT NULL,
        date VARCHAR(100) NOT NULL,
        timeSlot VARCHAR(100) NOT NULL,
        status VARCHAR(50) NOT NULL,
        paymentStatus VARCHAR(50) NOT NULL,
        amount NUMERIC(10,2) NOT NULL,
        ratingGiven INTEGER,
        createdAt VARCHAR(100) NOT NULL
      )
    `);

    // Create Questions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id VARCHAR(100) PRIMARY KEY,
        studentId VARCHAR(100) NOT NULL,
        studentName VARCHAR(255) NOT NULL,
        title VARCHAR(512) NOT NULL,
        content TEXT NOT NULL,
        subject VARCHAR(100) NOT NULL,
        likes INTEGER DEFAULT 0,
        replies JSONB DEFAULT '[]'::jsonb,
        createdAt VARCHAR(100) NOT NULL
      )
    `);

    // Create Notifications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(100) PRIMARY KEY,
        userId VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) NOT NULL,
        read BOOLEAN DEFAULT false,
        createdAt VARCHAR(100) NOT NULL
      )
    `);

    // Seed tutors if empty
    const tutorCheck = await client.query('SELECT count(*) FROM tutors');
    if (parseInt(tutorCheck.rows[0].count) === 0) {
      console.log('Seeding initial tutors...');
      for (const t of INITIAL_TUTORS) {
        await client.query(
          'INSERT INTO tutors (id, name, avatar, bio, subjects, rating, reviewsCount, ratePerHour, availability, createdAt) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
          [t.id, t.name, t.avatar, t.bio, JSON.stringify(t.subjects), t.rating, t.reviewsCount, t.ratePerHour, JSON.stringify(t.availability), new Date().toISOString()]
        );
      }
    }

    // Seed questions if empty
    const questionCheck = await client.query('SELECT count(*) FROM questions');
    if (parseInt(questionCheck.rows[0].count) === 0) {
      console.log('Seeding initial questions...');
      for (const q of INITIAL_QUESTIONS) {
        await client.query(
          'INSERT INTO questions (id, studentId, studentName, title, content, subject, likes, replies, createdAt) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
          [q.id, q.studentId, q.studentName, q.title, q.content, q.subject, q.likes, JSON.stringify(q.replies), q.createdAt]
        );
      }
    }

    // Seed welcome notification if empty
    const notifCheck = await client.query('SELECT count(*) FROM notifications');
    if (parseInt(notifCheck.rows[0].count) === 0) {
      await client.query(
        'INSERT INTO notifications (id, userId, title, message, type, read, createdAt) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [
          'notif-welcome',
          'any',
          'Welcome to The Learning Collective! 🌟',
          'Explore our tutor profiles, book a personalized session, or post a doubt on the Question Board! We are here to learn, grow, and succeed together.',
          'system',
          false,
          new Date().toISOString()
        ]
      );
    }

    console.log('PostgreSQL schema verification and seeding completed.');
  } catch (err) {
    console.error('Error verifying schema or seeding database:', err);
    usePostgres = false; // Fallback to Local JSON DB on schema failure
  } finally {
    client.release();
  }
};

if (usePostgres) {
  initPostgresDb();
} else {
  // Ensure JSON Database is initialized
  readJsonDb();
}

// ============================================================================
// API ENDPOINTS
// ============================================================================

// Utility to create a unique ID
const makeId = (prefix: string) => `${prefix}-${Math.random().toString(36).substring(2, 11)}`;

// 1. Users & Authentication
app.post('/api/auth/signup', async (req, res) => {
  const { email, fullName, role } = req.body;
  if (!email || !fullName) {
    return res.status(400).json({ error: 'Email and full name are required.' });
  }

  try {
    const id = makeId('usr');
    const createdAt = new Date().toISOString();

    if (usePostgres && pool) {
      // Check if email exists
      const existing = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      if (existing.rows.length > 0) {
        return res.status(400).json({ error: 'An account with this email already exists.' });
      }

      await pool.query(
        'INSERT INTO users (id, email, fullName, role, createdAt) VALUES ($1, $2, $3, $4, $5)',
        [id, email, fullName, role || 'student', createdAt]
      );

      // Create welcome notification
      const notifId = makeId('notif');
      await pool.query(
        'INSERT INTO notifications (id, userId, title, message, type, read, createdAt) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [notifId, id, 'Welcome to the Collective!', `Hi ${fullName}! Your account has been created successfully. Browse tutors and book your first lesson!`, 'system', false, createdAt]
      );

      return res.json({ id, email, fullName, role: role || 'student', createdAt });
    } else {
      const dbData = readJsonDb();
      if (dbData.users.some((u: any) => u.email === email)) {
        return res.status(400).json({ error: 'An account with this email already exists.' });
      }

      const newUser = { id, email, fullName, role: role || 'student', createdAt };
      dbData.users.push(newUser);
      
      dbData.notifications.push({
        id: makeId('notif'),
        userId: id,
        title: 'Welcome to the Collective!',
        message: `Hi ${fullName}! Your account has been created successfully. Browse tutors and book your first lesson!`,
        type: 'system',
        read: false,
        createdAt
      });

      writeJsonDb(dbData);
      return res.json(newUser);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

app.post('/api/auth/signin', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  try {
    if (usePostgres && pool) {
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      if (result.rows.length === 0) {
        // Create student automatically for demo convenience
        const id = makeId('usr');
        const createdAt = new Date().toISOString();
        const fullName = email.split('@')[0];
        await pool.query(
          'INSERT INTO users (id, email, fullName, role, createdAt) VALUES ($1, $2, $3, $4, $5)',
          [id, email, fullName, 'student', createdAt]
        );
        return res.json({ id, email, fullName, role: 'student', createdAt });
      }
      return res.json(result.rows[0]);
    } else {
      const dbData = readJsonDb();
      const user = dbData.users.find((u: any) => u.email === email);
      if (!user) {
        // Create on-the-fly demo user
        const id = makeId('usr');
        const createdAt = new Date().toISOString();
        const fullName = email.split('@')[0];
        const newUser = { id, email, fullName, role: 'student', createdAt };
        dbData.users.push(newUser);
        writeJsonDb(dbData);
        return res.json(newUser);
      }
      return res.json(user);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

app.put('/api/users/profile', async (req, res) => {
  const { id, fullName, email } = req.body;
  if (!id) return res.status(400).json({ error: 'User ID is required.' });

  try {
    if (usePostgres && pool) {
      await pool.query(
        'UPDATE users SET fullName = $1, email = $2 WHERE id = $3',
        [fullName, email, id]
      );
      const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
      return res.json(result.rows[0]);
    } else {
      const dbData = readJsonDb();
      const idx = dbData.users.findIndex((u: any) => u.id === id);
      if (idx === -1) {
        // Register demo user if needed
        const newUser = { id, fullName, email, role: 'student', createdAt: new Date().toISOString() };
        dbData.users.push(newUser);
        writeJsonDb(dbData);
        return res.json(newUser);
      }
      dbData.users[idx] = { ...dbData.users[idx], fullName, email };
      writeJsonDb(dbData);
      return res.json(dbData.users[idx]);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// 2. Tutors
app.get('/api/tutors', async (req, res) => {
  try {
    if (usePostgres && pool) {
      const result = await pool.query('SELECT * FROM tutors ORDER BY name ASC');
      // Parse JSON fields
      const tutors = result.rows.map(row => ({
        ...row,
        rating: parseFloat(row.rating),
        subjects: typeof row.subjects === 'string' ? JSON.parse(row.subjects) : row.subjects,
        availability: typeof row.availability === 'string' ? JSON.parse(row.availability) : row.availability
      }));
      return res.json(tutors);
    } else {
      const dbData = readJsonDb();
      return res.json(dbData.tutors);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// 3. Sessions & Bookings
app.get('/api/sessions/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    if (usePostgres && pool) {
      const result = await pool.query(
        'SELECT * FROM sessions WHERE studentId = $1 OR tutorId = $2 ORDER BY createdAt DESC',
        [userId, userId]
      );
      const sessions = result.rows.map(row => ({
        ...row,
        amount: parseFloat(row.amount),
        ratingGiven: row.ratinggiven // Node-postgres folds column names to lowercase by default
      }));
      return res.json(sessions);
    } else {
      const dbData = readJsonDb();
      const userSessions = dbData.sessions.filter(
        (s: any) => s.studentId === userId || s.tutorId === userId
      );
      return res.json(userSessions);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

app.post('/api/sessions/book', async (req, res) => {
  const { tutorId, tutorName, studentId, studentName, subject, date, timeSlot, amount } = req.body;
  if (!tutorId || !studentId || !subject || !date || !timeSlot) {
    return res.status(400).json({ error: 'Missing required session booking details.' });
  }

  try {
    const id = makeId('sess');
    const createdAt = new Date().toISOString();
    const session = {
      id,
      tutorId,
      tutorName,
      studentId,
      studentName,
      subject,
      date,
      timeSlot,
      status: 'confirmed',
      paymentStatus: 'paid',
      amount: amount || 40,
      createdAt
    };

    if (usePostgres && pool) {
      await pool.query(
        'INSERT INTO sessions (id, tutorId, tutorName, studentId, studentName, subject, date, timeSlot, status, paymentStatus, amount, createdAt) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)',
        [id, tutorId, tutorName, studentId, studentName, subject, date, timeSlot, 'confirmed', 'paid', amount || 40, createdAt]
      );

      // Student notification
      await pool.query(
        'INSERT INTO notifications (id, userId, title, message, type, read, createdAt) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [
          makeId('notif'),
          studentId,
          'Session Booked! 📅',
          `You successfully booked a session with ${tutorName} for ${subject} on ${date} at ${timeSlot}. Your lesson is fully scheduled and confirmed!`,
          'booking',
          false,
          createdAt
        ]
      );

      // Tutor notification
      await pool.query(
        'INSERT INTO notifications (id, userId, title, message, type, read, createdAt) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [
          makeId('notif'),
          tutorId,
          'New Session Request 📝',
          `${studentName} has booked a session with you for ${subject} on ${date} at ${timeSlot}. Check your calendar for details.`,
          'booking',
          false,
          createdAt
        ]
      );
    } else {
      const dbData = readJsonDb();
      dbData.sessions.push(session);

      dbData.notifications.push({
        id: makeId('notif'),
        userId: studentId,
        title: 'Session Booked! 📅',
        message: `You successfully booked a session with ${tutorName} for ${subject} on ${date} at ${timeSlot}. Your lesson is fully scheduled and confirmed!`,
        type: 'booking',
        read: false,
        createdAt
      });

      dbData.notifications.push({
        id: makeId('notif'),
        userId: tutorId,
        title: 'New Session Request 📝',
        message: `${studentName} has booked a session with you for ${subject} on ${date} at ${timeSlot}. Check your calendar for details.`,
        type: 'booking',
        read: false,
        createdAt
      });

      writeJsonDb(dbData);
    }

    return res.json(session);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

app.post('/api/sessions/pay', async (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId) return res.status(400).json({ error: 'Session ID is required.' });

  try {
    if (usePostgres && pool) {
      await pool.query("UPDATE sessions SET paymentStatus = 'paid' WHERE id = $1", [sessionId]);
      const sessionResult = await pool.query('SELECT * FROM sessions WHERE id = $1', [sessionId]);
      if (sessionResult.rows.length === 0) return res.status(404).json({ error: 'Session not found.' });

      const session = sessionResult.rows[0];

      // Add payment confirmation notification
      await pool.query(
        'INSERT INTO notifications (id, userId, title, message, type, read, createdAt) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [
          makeId('notif'),
          session.studentid,
          'Payment Successful! 💳',
          `Your payment of $${parseFloat(session.amount).toFixed(2)} for the lesson with ${session.tutorname} was processed successfully. Thank you!`,
          'payment',
          false,
          new Date().toISOString()
        ]
      );

      return res.json({ ...session, paymentStatus: 'paid' });
    } else {
      const dbData = readJsonDb();
      const idx = dbData.sessions.findIndex((s: any) => s.id === sessionId);
      if (idx === -1) return res.status(404).json({ error: 'Session not found.' });

      dbData.sessions[idx].paymentStatus = 'paid';
      const session = dbData.sessions[idx];

      dbData.notifications.push({
        id: makeId('notif'),
        userId: session.studentId,
        title: 'Payment Successful! 💳',
        message: `Your payment of $${parseFloat(session.amount).toFixed(2)} for the lesson with ${session.tutorName} was processed successfully. Thank you!`,
        type: 'payment',
        read: false,
        createdAt: new Date().toISOString()
      });

      writeJsonDb(dbData);
      return res.json(session);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

app.post('/api/sessions/complete', async (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId) return res.status(400).json({ error: 'Session ID is required.' });

  try {
    if (usePostgres && pool) {
      await pool.query("UPDATE sessions SET status = 'completed' WHERE id = $1", [sessionId]);
      const sessionResult = await pool.query('SELECT * FROM sessions WHERE id = $1', [sessionId]);
      if (sessionResult.rows.length === 0) return res.status(404).json({ error: 'Session not found.' });
      
      const session = sessionResult.rows[0];
      
      // Add notification for completion
      await pool.query(
        'INSERT INTO notifications (id, userId, title, message, type, read, createdAt) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [
          makeId('notif'),
          session.studentid,
          'Session Completed! 🎓',
          `Your session with ${session.tutorname} on ${session.date} is now complete. Please take a moment to leave a rating!`,
          'system',
          false,
          new Date().toISOString()
        ]
      );

      return res.json({ ...session, status: 'completed' });
    } else {
      const dbData = readJsonDb();
      const idx = dbData.sessions.findIndex((s: any) => s.id === sessionId);
      if (idx === -1) return res.status(404).json({ error: 'Session not found.' });

      dbData.sessions[idx].status = 'completed';
      const session = dbData.sessions[idx];

      dbData.notifications.push({
        id: makeId('notif'),
        userId: session.studentId,
        title: 'Session Completed! 🎓',
        message: `Your session with ${session.tutorName} on ${session.date} is now complete. Please take a moment to leave a rating!`,
        type: 'system',
        read: false,
        createdAt: new Date().toISOString()
      });

      writeJsonDb(dbData);
      return res.json(session);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

app.post('/api/sessions/rate', async (req, res) => {
  const { sessionId, ratingGiven } = req.body;
  if (!sessionId || !ratingGiven) {
    return res.status(400).json({ error: 'Session ID and rating are required.' });
  }

  try {
    if (usePostgres && pool) {
      // Update session rating
      await pool.query('UPDATE sessions SET ratingGiven = $1 WHERE id = $2', [ratingGiven, sessionId]);
      const sessionResult = await pool.query('SELECT * FROM sessions WHERE id = $1', [sessionId]);
      if (sessionResult.rows.length === 0) return res.status(404).json({ error: 'Session not found.' });

      const session = sessionResult.rows[0];
      const tutorId = session.tutorid;

      // Calculate new tutor rating
      const tutorResult = await pool.query('SELECT * FROM tutors WHERE id = $1', [tutorId]);
      if (tutorResult.rows.length > 0) {
        const tutor = tutorResult.rows[0];
        const oldRating = parseFloat(tutor.rating || '5.0');
        const oldCount = tutor.reviewscount || 0;
        const newCount = oldCount + 1;
        const newRating = parseFloat((((oldRating * oldCount) + ratingGiven) / newCount).toFixed(2));

        await pool.query(
          'UPDATE tutors SET rating = $1, reviewsCount = $2 WHERE id = $3',
          [newRating, newCount, tutorId]
        );
      }

      // Notification
      await pool.query(
        'INSERT INTO notifications (id, userId, title, message, type, read, createdAt) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [
          makeId('notif'),
          session.studentid,
          'Thank you for your rating! ⭐',
          `You rated your session with ${session.tutorname} as ${ratingGiven} stars. Your feedback helps our community grow!`,
          'system',
          false,
          new Date().toISOString()
        ]
      );

      return res.json({ ...session, ratingGiven });
    } else {
      const dbData = readJsonDb();
      const idx = dbData.sessions.findIndex((s: any) => s.id === sessionId);
      if (idx === -1) return res.status(404).json({ error: 'Session not found.' });

      dbData.sessions[idx].ratingGiven = ratingGiven;
      const session = dbData.sessions[idx];

      // Update tutor average rating
      const tIdx = dbData.tutors.findIndex((t: any) => t.id === session.tutorId);
      if (tIdx !== -1) {
        const tutor = dbData.tutors[tIdx];
        const oldRating = tutor.rating || 5.0;
        const oldReviewsCount = tutor.reviewsCount || 0;
        const newReviewsCount = oldReviewsCount + 1;
        const newRating = parseFloat((((oldRating * oldReviewsCount) + ratingGiven) / newReviewsCount).toFixed(2));

        dbData.tutors[tIdx].rating = newRating;
        dbData.tutors[tIdx].reviewsCount = newReviewsCount;
      }

      dbData.notifications.push({
        id: makeId('notif'),
        userId: session.studentId,
        title: 'Thank you for your rating! ⭐',
        message: `You rated your session with ${session.tutorName} as ${ratingGiven} stars. Your feedback helps our community grow!`,
        type: 'system',
        read: false,
        createdAt: new Date().toISOString()
      });

      writeJsonDb(dbData);
      return res.json(session);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// 4. Questions Board
app.get('/api/questions', async (req, res) => {
  try {
    if (usePostgres && pool) {
      const result = await pool.query('SELECT * FROM questions ORDER BY createdAt DESC');
      const questions = result.rows.map(row => ({
        ...row,
        replies: typeof row.replies === 'string' ? JSON.parse(row.replies) : row.replies
      }));
      return res.json(questions);
    } else {
      const dbData = readJsonDb();
      return res.json(dbData.questions);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

app.post('/api/questions', async (req, res) => {
  const { studentId, studentName, title, content, subject } = req.body;
  if (!studentId || !studentName || !title || !content || !subject) {
    return res.status(400).json({ error: 'Missing required question details.' });
  }

  try {
    const id = makeId('q');
    const createdAt = new Date().toISOString();
    const newQuestion = {
      id,
      studentId,
      studentName,
      title,
      content,
      subject,
      likes: 0,
      replies: [],
      createdAt
    };

    if (usePostgres && pool) {
      await pool.query(
        'INSERT INTO questions (id, studentId, studentName, title, content, subject, likes, replies, createdAt) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [id, studentId, studentName, title, content, subject, 0, '[]', createdAt]
      );
    } else {
      const dbData = readJsonDb();
      dbData.questions.unshift(newQuestion);
      writeJsonDb(dbData);
    }

    return res.json(newQuestion);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

app.post('/api/questions/:questionId/reply', async (req, res) => {
  const { questionId } = req.params;
  const { authorName, authorRole, content } = req.body;
  if (!authorName || !content) {
    return res.status(400).json({ error: 'Author name and content are required.' });
  }

  try {
    const reply = {
      id: makeId('r'),
      authorName,
      authorRole: authorRole || 'student',
      content,
      createdAt: new Date().toISOString()
    };

    if (usePostgres && pool) {
      const result = await pool.query('SELECT replies FROM questions WHERE id = $1', [questionId]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Question not found.' });

      const replies = typeof result.rows[0].replies === 'string'
        ? JSON.parse(result.rows[0].replies)
        : result.rows[0].replies;

      replies.push(reply);

      await pool.query('UPDATE questions SET replies = $1 WHERE id = $2', [JSON.stringify(replies), questionId]);
      return res.json(reply);
    } else {
      const dbData = readJsonDb();
      const idx = dbData.questions.findIndex((q: any) => q.id === questionId);
      if (idx === -1) return res.status(404).json({ error: 'Question not found.' });

      dbData.questions[idx].replies.push(reply);
      writeJsonDb(dbData);
      return res.json(reply);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

app.post('/api/questions/:questionId/like', async (req, res) => {
  const { questionId } = req.params;
  try {
    if (usePostgres && pool) {
      const result = await pool.query('UPDATE questions SET likes = likes + 1 WHERE id = $1 RETURNING likes', [questionId]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Question not found.' });
      return res.json({ likes: result.rows[0].likes });
    } else {
      const dbData = readJsonDb();
      const idx = dbData.questions.findIndex((q: any) => q.id === questionId);
      if (idx === -1) return res.status(404).json({ error: 'Question not found.' });

      dbData.questions[idx].likes += 1;
      writeJsonDb(dbData);
      return res.json({ likes: dbData.questions[idx].likes });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// 5. Notifications
app.get('/api/notifications/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    if (usePostgres && pool) {
      const result = await pool.query(
        'SELECT * FROM notifications WHERE userId = $1 OR userId = $2 ORDER BY createdAt DESC',
        [userId, 'any']
      );
      return res.json(result.rows);
    } else {
      const dbData = readJsonDb();
      const filtered = dbData.notifications.filter(
        (n: any) => n.userId === userId || n.userId === 'any'
      );
      return res.json(filtered);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

app.post('/api/notifications/mark-read', async (req, res) => {
  const { userId, notificationId } = req.body;
  if (!userId && !notificationId) {
    return res.status(400).json({ error: 'User ID or Notification ID is required.' });
  }

  try {
    if (usePostgres && pool) {
      if (notificationId) {
        await pool.query('UPDATE notifications SET read = true WHERE id = $1', [notificationId]);
      } else {
        await pool.query('UPDATE notifications SET read = true WHERE userId = $1 OR userId = $2', [userId, 'any']);
      }
      return res.json({ success: true });
    } else {
      const dbData = readJsonDb();
      dbData.notifications = dbData.notifications.map((n: any) => {
        if (notificationId && n.id === notificationId) {
          return { ...n, read: true };
        }
        if (!notificationId && userId && (n.userId === userId || n.userId === 'any')) {
          return { ...n, read: true };
        }
        return n;
      });
      writeJsonDb(dbData);
      return res.json({ success: true });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

app.post('/api/notifications/add', async (req, res) => {
  const { userId, title, message, type } = req.body;
  if (!userId || !title || !message) {
    return res.status(400).json({ error: 'Missing required notification attributes.' });
  }

  try {
    const id = makeId('notif');
    const createdAt = new Date().toISOString();
    const notif = { id, userId, title, message, type: type || 'system', read: false, createdAt };

    if (usePostgres && pool) {
      await pool.query(
        'INSERT INTO notifications (id, userId, title, message, type, read, createdAt) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [id, userId, title, message, type || 'system', false, createdAt]
      );
    } else {
      const dbData = readJsonDb();
      dbData.notifications.unshift(notif);
      writeJsonDb(dbData);
    }

    return res.json(notif);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// ============================================================================
// VITE OR STATIC ASSETS SERVING MIDDLEWARE
// ============================================================================

const startServer = async () => {
  // Vite Integration in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Express Full-Stack Server running on http://localhost:${PORT}`);
  });
};

startServer().catch(err => {
  console.error('Failed to start server:', err);
});

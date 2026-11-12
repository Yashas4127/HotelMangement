import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { rateLimit } from 'express-rate-limit';
import User from '../models/User.js';
import { requireUser } from '../middleware/auth.js';

const router = Router();
const authLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many sign-in attempts. Please try again later.' },
});
const safeUser = (user) => ({ id: user.id, name: user.name, email: user.email, phone: user.phone || '', role: user.role });
const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  path: '/',
};

function setSession(res, user) {
  const token = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.cookie('ks_session', token, {
    ...sessionCookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

router.post('/register', authLimit, async (req, res) => {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const phone = typeof req.body.phone === 'string' ? req.body.phone.trim() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  if (name.length < 2 || name.length > 100) return res.status(400).json({ message: 'Enter a name between 2 and 100 characters.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: 'Enter a valid email address.' });
  if (email.length > 254) return res.status(400).json({ message: 'Email address is too long.' });
  if (phone && !/^[+\d][\d\s()-]{6,24}$/.test(phone)) return res.status(400).json({ message: 'Enter a valid phone number or leave it blank.' });
  if (password.length < 10 || password.length > 128) return res.status(400).json({ message: 'Password must be between 10 and 128 characters.' });
  const exists = await User.exists({ email });
  if (exists) return res.status(409).json({ message: 'An account with that email already exists.' });
  const user = await User.create({ name, email, phone, passwordHash: await bcrypt.hash(password, 12), role: 'customer' });
  setSession(res, user);
  res.status(201).json({ user: safeUser(user) });
});

router.post('/login', authLimit, async (req, res) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ message: 'Email or password is incorrect.' });
  }
  setSession(res, user);
  res.json({ user: safeUser(user) });
});

router.post('/logout', (_req, res) => {
  res.clearCookie('ks_session', sessionCookieOptions);
  res.status(204).end();
});

router.get('/me', requireUser, (req, res) => res.json({ user: safeUser(req.user) }));

export default router;

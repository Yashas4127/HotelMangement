import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.js';
import hotelRoutes from './routes/hotels.js';
import enquiryRoutes from './routes/enquiries.js';
import bookingRoutes, { handleRazorpayWebhook } from './routes/bookings.js';
import adminRoutes from './routes/admin.js';
import dns from 'node:dns';
dns.setServers(["8.8.8.8", "8.8.4.4"]);
const app = express();
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map((origin) => origin.trim());

app.disable('x-powered-by');
if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({
  credentials: true,
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(Object.assign(new Error('This origin is not allowed.'), { status: 403 }));
  },
}));
app.post('/api/webhooks/razorpay', express.raw({ type: 'application/json', limit: '100kb' }), handleRazorpayWebhook);
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use((req, _res, next) => {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) req.body = {};
  next();
});

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.get('/api/config', (_req, res) => res.json({ razorpayKeyId: process.env.RAZORPAY_KEY_ID || '' }));
app.use('/api/auth', authRoutes);
app.use('/api', hotelRoutes);
app.use('/api', enquiryRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/*splat', (_req, res) => res.status(404).json({ message: 'API route not found.' }));
app.use((error, _req, res, _next) => {
  if (res.headersSent) return;
  if (error.code === 11000) return res.status(409).json({ message: 'A record with that email, hotel ID, or slug already exists.' });
  if (error.name === 'ValidationError') return res.status(400).json({ message: error.message });
  const status = Number.isInteger(error.status) ? error.status : 500;
  if (status >= 500) console.error(error);
  res.status(status).json({ message: status >= 500 ? 'The server could not complete the request.' : error.message });
});

export default app;

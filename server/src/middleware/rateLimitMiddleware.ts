import rateLimit from 'express-rate-limit';

// Global API Limiter: 150 requests per 1 minute
export const globalApiLimiter = rateLimit({
  windowMs: 60 * 1000, 
  max: process.env.NODE_ENV === 'test' ? 10000 : 150, 
  message: 'Too many requests from this IP, please try again after a minute',
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth Limiter: 10 requests per 1 minute (Login/Register)
export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 10000 : 10,
  message: 'Too many authentication attempts, please try again later',
});

// Action Limiter: 20 requests per 10 seconds (Hand Actions, Transfers)
export const actionLimiter = rateLimit({
  windowMs: 10 * 1000,
  max: process.env.NODE_ENV === 'test' ? 10000 : 20,
  message: 'You are performing actions too quickly',
});

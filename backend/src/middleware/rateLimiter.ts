// backend/src/middleware/rateLimiter.ts

import rateLimit from 'express-rate-limit';

// Strict limiter for login (prevents credential stuffing)
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many login attempts. Please try again after 15 minutes.',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfterMinutes: 15,
  },
  skipSuccessfulRequests: true, // Only count failed attempts
});

// Limiter for forgot-password (prevents email spam)
export const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 reset requests per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many password reset requests. Please try again after 1 hour.',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfterMinutes: 60,
  },
});

// Limiter for OTP verification (prevents brute-force OTP guessing)
export const verifyOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 OTP verification attempts per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many OTP verification attempts. Please request a new OTP after 15 minutes.',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfterMinutes: 15,
  },
});

// Limiter for password reset (prevents token brute-forcing)
export const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 reset attempts per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many password reset attempts. Please try again after 15 minutes.',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfterMinutes: 15,
  },
});
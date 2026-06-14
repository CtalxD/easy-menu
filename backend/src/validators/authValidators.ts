// backend/src/validators/authValidators.ts
import { z } from 'zod';

export const signupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  email: z.string().email('Invalid email format').max(255, 'Email must be 255 characters or less'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128, 'Password must be 128 characters or less'),
  restaurant: z.string().min(1, 'Restaurant name is required').max(200, 'Restaurant name must be 200 characters or less'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
});

export const googleSignInSchema = z.object({
  name: z.string().optional(),
  email: z.string().email('Invalid email format'),
  restaurant: z.string().optional(),
  rememberMe: z.boolean().optional().default(false),
  isSignUp: z.boolean().optional().default(false),
});

export const linkGoogleSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters').max(128, 'Password must be 128 characters or less'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less').optional(),
  email: z.string().email('Invalid email format').max(255, 'Email must be 255 characters or less').optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export const verifyOtpSchema = z.object({
  email: z.string().email('Invalid email format'),
  otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d{6}$/, 'OTP must contain only digits'),
});

export const resetPasswordSchema = z.object({
  resetToken: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters').max(128, 'Password must be 128 characters or less'),
});

export const validateResetTokenSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});
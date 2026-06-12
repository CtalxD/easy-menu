// backend/src/routes/authRoutes.ts
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { 
  signup, 
  login, 
  logout, 
  refreshToken, 
  verifyToken,
  googleSignIn,
  linkGoogleAccount,
  getCurrentUser,
  changePassword,
  updateProfile
} from '../controllers/authController';
import { 
  forgotPassword, 
  resetPassword, 
  validateResetToken, 
  verifyOTP 
} from '../controllers/passwordController';

const router = Router();

// ==================== AUTH ROUTES ====================

// Sign up with email/password
router.post('/signup', signup);

// Login with email/password
router.post('/login', login);

// Sign in/up with Google (Firebase)
router.post('/google-signin', googleSignIn);

// Logout
router.post('/logout', logout);

// Refresh access token
router.post('/refresh-token', refreshToken);

// Verify access token validity
router.get('/verify', verifyToken);

// ==================== PROTECTED ROUTES ====================

// Get current user profile
router.get('/me', authenticateToken, getCurrentUser);

// Update user profile (name, email)
router.put('/profile', authenticateToken, updateProfile);

// Change password (for email/password users)
router.post('/change-password', authenticateToken, changePassword);

// Link Google account to existing email/password account
router.post('/link-google', authenticateToken, linkGoogleAccount);

// ==================== PASSWORD RESET ROUTES ====================

// Forgot password - request OTP
router.post('/forgot-password', forgotPassword);

// Verify OTP
router.post('/verify-otp', verifyOTP);

// Reset password with token
router.post('/reset-password', resetPassword);

// Validate reset token
router.get('/validate-token', validateResetToken);

export default router;
// backend/src/controllers/passwordController.ts

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { Resend } from 'resend';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Initialize Resend only if API key exists
let resend: Resend | null = null;
if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
}

// Store OTPs temporarily (in production, use Redis with TTL)
const otpStore = new Map<string, { otp: string; email: string; expiresAt: number }>();

// Clean up expired OTPs every hour
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of otpStore.entries()) {
    if (value.expiresAt < now) {
      otpStore.delete(key);
    }
  }
}, 3600000);

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const otpEmailHtml = (otp: string, expiresInMinutes: number = 10): string => `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset OTP - EasyMenu</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #FAF7F2; font-family: Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FAF7F2; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background-color: #FFFFFF; border-radius: 12px; border: 1px solid #E8E0D5; overflow: hidden;">
              <tr>
                <td style="background-color: #1A1510; padding: 28px 32px; text-align: center;">
                  <span style="color: #FAF7F2; font-size: 20px; font-weight: 700; letter-spacing: -0.3px;">EasyMenu</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 40px 32px 32px;">
                  <h1 style="margin: 0 0 8px; font-size: 22px; font-weight: 700; color: #1A1510;">Password Reset OTP</h1>
                  <p style="margin: 0 0 24px; font-size: 15px; color: #6B6560; line-height: 1.6;">
                    We received a request to reset the password for your EasyMenu account. Use the OTP code below to verify your identity.
                  </p>
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FAF7F2; border-radius: 8px; margin-bottom: 24px;">
                    <tr>
                      <td align="center" style="padding: 24px;">
                        <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #C45E3A; font-family: monospace;">${otp}</span>
                      </td>
                    </tr>
                  </table>
                  <p style="margin: 0 0 8px; font-size: 13px; color: #9B9590;">This OTP expires in <strong>${expiresInMinutes} minutes</strong>.</p>
                  <p style="margin: 0; font-size: 13px; color: #9B9590;">If you didn't request this, you can safely ignore this email.</p>
                  <hr style="border: none; border-top: 1px solid #E8E0D5; margin: 24px 0 0;" />
                </td>
              </tr>
              <tr>
                <td style="background-color: #FAF7F2; padding: 20px 32px; border-top: 1px solid #E8E0D5; text-align: center;">
                  <p style="margin: 0; font-size: 12px; color: #9B9590;">&copy; ${new Date().getFullYear()} EasyMenu. All rights reserved.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
`;

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    console.log('Forgot password request received for:', email);
    console.log('Email service status - Resend configured:', !!resend);

    if (!email) {
      res.status(400).json({ message: 'Email is required' });
      return;
    }

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      res.status(404).json({ message: 'No account found with this email address' });
      return;
    }

    console.log('User found:', user.email, '| Has password:', !!user.password);

    // Check if Resend is configured
    if (!resend) {
      console.error('Resend API key is not configured. Email cannot be sent.');
      
      // Generate OTP anyway for development and log it
      const otp = generateOTP();
      const expiresAt = Date.now() + 10 * 60 * 1000;
      const otpKey = `${email}_${otp}`;
      otpStore.set(otpKey, { otp, email, expiresAt });

      console.log('------------------------------------------------------');
      console.log('DEVELOPMENT MODE - OTP generated but not sent via email');
      console.log('Email:', email);
      console.log('OTP:', otp);
      console.log('Expires at:', new Date(expiresAt).toISOString());
      console.log('------------------------------------------------------');
      
      res.status(500).json({ 
        message: 'Email service is not configured. Please contact support.',
      });
      return;
    }

    // Check if FROM email is configured
    if (!process.env.RESEND_FROM_EMAIL) {
      console.error('RESEND_FROM_EMAIL is not configured');
      res.status(500).json({ 
        message: 'Email service configuration error. Please contact support.',
      });
      return;
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000;
    
    // Store OTP with email
    const otpKey = `${email}_${otp}`;
    otpStore.set(otpKey, { otp, email, expiresAt });

    console.log('OTP generated and stored for:', email);

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: [email],
      subject: 'Password Reset OTP - EasyMenu',
      html: otpEmailHtml(otp, 10),
    });

    if (error) {
      console.error('Resend API error:', error.message);
      console.error('Full error details:', JSON.stringify(error, null, 2));
      
      // Remove OTP from store since email failed
      otpStore.delete(otpKey);
      
      res.status(500).json({ 
        message: 'Failed to send OTP email. Please try again later.',
      });
      return;
    }

    console.log('Password reset OTP sent successfully to:', email, '| Message ID:', data?.id);

    res.json({ 
      message: 'OTP sent successfully. Please check your email.',
      requiresOTP: true,
      email: email,
    });

  } catch (error) {
    console.error('Forgot password unexpected error:', error);
    res.status(500).json({ 
      message: 'An unexpected error occurred. Please try again later.',
    });
  }
};

export const verifyOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body;

    console.log('OTP verification request for:', email);

    if (!email || !otp) {
      res.status(400).json({ message: 'Email and OTP are required' });
      return;
    }

    // Find valid OTP
    let validOTPKey: string | null = null;
    let storedData: { otp: string; email: string; expiresAt: number } | null = null;

    for (const [key, value] of otpStore.entries()) {
      if (value.email === email && value.otp === otp && value.expiresAt > Date.now()) {
        validOTPKey = key;
        storedData = value;
        break;
      }
    }

    if (!validOTPKey || !storedData) {
      console.log('Invalid or expired OTP for:', email);
      res.status(400).json({ message: 'Invalid or expired OTP' });
      return;
    }

    // Generate a temporary reset token (valid for 15 minutes)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setMinutes(resetTokenExpiry.getMinutes() + 15);

    // Store the reset token in database
    await prisma.passwordResetToken.create({
      data: {
        token: resetToken,
        email: email,
        expiresAt: resetTokenExpiry,
        used: false,
      },
    });

    // Delete the used OTP
    otpStore.delete(validOTPKey);

    console.log('OTP verified successfully for:', email);

    res.json({
      message: 'OTP verified successfully',
      resetToken: resetToken,
      expiresIn: 900, // 15 minutes in seconds
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { resetToken, newPassword } = req.body;

    console.log('Password reset request received');

    if (!resetToken || !newPassword) {
      res.status(400).json({ message: 'Reset token and new password are required' });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({ message: 'Password must be at least 8 characters' });
      return;
    }

    const resetTokenRecord = await prisma.passwordResetToken.findFirst({
      where: { 
        token: resetToken, 
        used: false, 
        expiresAt: { gt: new Date() } 
      },
    });

    if (!resetTokenRecord) {
      console.log('Invalid or expired reset token');
      res.status(400).json({ message: 'Invalid or expired reset token' });
      return;
    }

    const user = await prisma.user.findUnique({ 
      where: { email: resetTokenRecord.email } 
    });

    if (!user) {
      console.log('User not found for email:', resetTokenRecord.email);
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Mark all reset tokens for this email as used
    await prisma.passwordResetToken.updateMany({
      where: { 
        email: resetTokenRecord.email, 
        used: false 
      },
      data: { used: true },
    });

    console.log('Password updated successfully for:', user.email);

    res.json({ message: 'Password reset successfully' });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const validateResetToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.query;

    if (!token) {
      res.status(400).json({ valid: false, message: 'Token is required' });
      return;
    }

    const resetToken = await prisma.passwordResetToken.findFirst({
      where: { 
        token: token as string, 
        used: false, 
        expiresAt: { gt: new Date() } 
      },
    });

    if (!resetToken) {
      res.json({ valid: false, message: 'Invalid or expired token' });
      return;
    }

    res.json({ valid: true, email: resetToken.email });

  } catch (error) {
    console.error('Token validation error:', error);
    res.status(500).json({ valid: false, message: 'Internal server error' });
  }
};
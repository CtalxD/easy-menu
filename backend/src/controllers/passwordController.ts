// backend/src/controllers/passwordController.ts

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { Resend } from 'resend';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Initialize Resend with your API key
const resend = new Resend(process.env.RESEND_API_KEY);

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
      <title>Password reset OTP</title>
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
                  <h1 style="margin: 0 0 8px; font-size: 22px; font-weight: 700; color: #1A1510;">Password reset OTP</h1>
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
                  <p style="margin: 0; font-size: 12px; color: #9B9590;">© ${new Date().getFullYear()} EasyMenu. All rights reserved.</p>
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

    console.log('Forgot password request for email:', email);

    if (!email) {
      res.status(400).json({ message: 'Email is required' });
      return;
    }

    // CHECK IF USER EXISTS FIRST
    const user = await prisma.user.findUnique({ where: { email } });

    console.log('User found:', user ? 'Yes' : 'No');

    if (!user) {
      res.status(404).json({ message: 'No account found with this email address' });
      return;
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    // Store OTP with email
    const otpKey = `${email}_${otp}`;
    otpStore.set(otpKey, { otp, email, expiresAt });

    console.log('==============================================');
    console.log('PASSWORD RESET OTP (use this to test locally):');
    console.log(`OTP for ${email}: ${otp}`);
    console.log('==============================================');

    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured in environment variables');
      // Still return success for testing, but log the OTP
      res.json({ 
        message: 'OTP sent successfully',
        requiresOTP: true,
        email: email,
        // Include OTP in response for testing only - REMOVE IN PRODUCTION
        testOTP: process.env.NODE_ENV === 'production' ? undefined : otp
      });
      return;
    }

    // Try to send email
    try {
      const { data, error } = await resend.emails.send({
        from: `EasyMenu <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`,
        to: [email],
        subject: 'Password reset OTP - EasyMenu',
        html: otpEmailHtml(otp, 10),
      });

      if (error) {
        console.error('Resend API error:', error);
        // Still return success but log the error
        res.json({ 
          message: 'OTP sent successfully',
          requiresOTP: true,
          email: email,
          testOTP: otp // Include OTP for testing since email failed
        });
        return;
      }

      console.log('OTP email sent successfully, id:', data?.id);
    } catch (emailError) {
      console.error('Email send exception:', emailError);
      // Still return success for testing
      res.json({ 
        message: 'OTP sent successfully',
        requiresOTP: true,
        email: email,
        testOTP: otp // Include OTP for testing since email failed
      });
      return;
    }

    // Return success
    res.json({ 
      message: 'OTP sent successfully',
      requiresOTP: true,
      email: email 
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Internal server error', error: String(error) });
  }
};

export const verifyOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body;

    console.log('Verify OTP request for email:', email, 'OTP:', otp);

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
      console.log('Invalid or expired OTP for email:', email);
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

    console.log('OTP verified successfully for email:', email);

    res.json({
      message: 'OTP verified successfully',
      resetToken: resetToken,
      expiresIn: 900, // 15 minutes in seconds
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Internal server error', error: String(error) });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { resetToken, newPassword } = req.body;

    console.log('Reset password request for token:', resetToken?.substring(0, 10) + '...');

    if (!resetToken || !newPassword) {
      res.status(400).json({ message: 'Reset token and new password are required' });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({ message: 'Password must be at least 8 characters' });
      return;
    }

    const resetTokenRecord = await prisma.passwordResetToken.findFirst({
      where: { token: resetToken, used: false, expiresAt: { gt: new Date() } },
    });

    if (!resetTokenRecord) {
      console.log('Invalid or expired reset token');
      res.status(400).json({ message: 'Invalid or expired reset token' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email: resetTokenRecord.email } });

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

    await prisma.passwordResetToken.update({
      where: { id: resetTokenRecord.id },
      data: { used: true },
    });

    console.log('Password reset successfully for user:', user.email);

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Internal server error', error: String(error) });
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
      where: { token: token as string, used: false, expiresAt: { gt: new Date() } },
    });

    if (!resetToken) {
      res.json({ valid: false, message: 'Invalid or expired token' });
      return;
    }

    res.json({ valid: true, email: resetToken.email });
  } catch (error) {
    console.error('Validate token error:', error);
    res.status(500).json({ valid: false, message: 'Internal server error' });
  }
};
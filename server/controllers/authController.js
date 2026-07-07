import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import User from '../models/User.js';

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { name, email, password, role, department } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email',
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'Team Member',
      department,
    });

    if (user) {
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          token: generateToken(user._id),
        },
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid user data',
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message,
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Check for user (include password for comparison)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is inactive. Please contact administrator',
      });
    }

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message,
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get all users (Manager only)
// @route   GET /api/auth/users
// @access  Private/Manager
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ isActive: true }).select('-password');
    res.json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// @desc    Forgot Password - Request OTP code
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide an email' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found with this email' });
    }

    // Generate 6-digit verification code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Save to user model
    user.resetPasswordOTP = otp;
    user.resetPasswordOTPExpires = Date.now() + 15 * 60 * 1000; // 15 mins
    await user.save();

    console.log(`🔑 PASSWORD RESET OTP FOR ${email}: ${otp}`);

    // Professional branded email template
    const mailOptions = {
      from: `"Weekly Reports" <${process.env.EMAIL_USER || 'noreply@weeklyreports.com'}>`,
      to: email,
      subject: '🔐 Password Reset Verification Code — Weekly Reports',
      text: `Your password reset verification code is: ${otp}. It will expire in 15 minutes. If you did not request this, please ignore this email.`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <!-- Main Card -->
                <table width="480" cellpadding="0" cellspacing="0" style="max-width: 480px; width: 100%; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);">
                  
                  <!-- Header Banner -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 32px 40px; text-align: center;">
                      <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                        <tr>
                          <td style="background-color: rgba(255,255,255,0.15); border-radius: 12px; padding: 8px 16px;">
                            <span style="color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: 0.5px;">📋 Weekly Reports</span>
                          </td>
                        </tr>
                      </table>
                      <h1 style="color: #ffffff; font-size: 22px; font-weight: 600; margin: 20px 0 0 0; letter-spacing: -0.3px;">
                        Password Reset Request
                      </h1>
                    </td>
                  </tr>

                  <!-- Body Content -->
                  <tr>
                    <td style="padding: 36px 40px 24px;">
                      <p style="color: #18181b; font-size: 15px; line-height: 1.6; margin: 0 0 8px 0;">
                        Hello <strong style="color: #4f46e5;">${user.name || 'there'}</strong>,
                      </p>
                      <p style="color: #52525b; font-size: 14px; line-height: 1.7; margin: 0 0 24px 0;">
                        We received a request to reset the password for your Weekly Reports account. 
                        Use the verification code below to complete the process. 
                        <strong style="color: #18181b;">This code expires in 15 minutes.</strong>
                      </p>

                      <!-- OTP Code Box -->
                      <table cellpadding="0" cellspacing="0" style="margin: 0 auto 28px;">
                        <tr>
                          <td style="background-color: #f4f4f5; border-radius: 12px; padding: 20px 36px; border: 1px solid #e4e4e7; text-align: center;">
                            <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #4f46e5; font-family: 'Courier New', monospace;">
                              ${otp.split('').join(' ')}
                            </span>
                          </td>
                        </tr>
                      </table>

                      <!-- Security Notice -->
                      <table cellpadding="0" cellspacing="0" style="background-color: #fefce8; border-radius: 10px; border: 1px solid #fde68a; margin-bottom: 24px;">
                        <tr>
                          <td style="padding: 14px 18px;">
                            <p style="color: #92400e; font-size: 12px; line-height: 1.5; margin: 0;">
                              🔒 <strong>Security Tip:</strong> Never share this code with anyone. 
                              Our team will never ask for your password or verification code.
                            </p>
                          </td>
                        </tr>
                      </table>

                      <p style="color: #a1a1aa; font-size: 12px; line-height: 1.6; margin: 0 0 8px 0;">
                        If you didn't request a password reset, you can safely ignore this email. 
                        Your account remains secure.
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #fafafa; border-top: 1px solid #f4f4f5; padding: 24px 40px; text-align: center;">
                      <p style="color: #a1a1aa; font-size: 11px; line-height: 1.6; margin: 0;">
                        Weekly Report Manager &bull; Team Dashboard<br>
                        © ${new Date().getFullYear()} Weekly Reports. All rights reserved.
                      </p>
                      <p style="color: #d4d4d8; font-size: 10px; line-height: 1.5; margin: 8px 0 0 0;">
                        This is an automated message. Please do not reply to this email.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      res.json({
        success: true,
        message: 'Verification code sent to your email',
      });
    } catch (mailError) {
      console.error('Nodemailer SendMail Error:', mailError);
      // Fallback for development if nodemailer is not configured
      res.json({
        success: true,
        message: 'Verification code generated (check server console in development)',
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Server error during password recovery request' });
  }
};

// @desc    Reset Password with OTP
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide email, OTP, and new password' });
    }

    const user = await User.findOne({
      email,
      resetPasswordOTP: otp,
      resetPasswordOTPExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification code' });
    }

    user.password = newPassword;
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successful. You can now login with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Server error during password reset' });
  }
};



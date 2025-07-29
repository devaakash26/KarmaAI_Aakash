'use server';

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongoose';
import { sendPasswordResetEmail } from '@/lib/email';

// Ensure the User model is defined (reuse existing schema if already compiled)
let User;
try {
  User = mongoose.model('User');
} catch {
  const UserSchema = new mongoose.Schema({
    name: String,
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: String,
    image: String,
    emailVerified: Date,
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
  });
  User = mongoose.model('User', UserSchema);
}

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findOne({ email });
    if (!user) {
      // For security, do not reveal that the email doesn’t exist
      return NextResponse.json({ message: 'If that email address is in our database, we will send you a password reset link.' });
    }

    // Generate a reset token (32 bytes -> 64 hex chars)
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    user.resetPasswordToken = tokenHash;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password/${token}`;

    // Send email (non-blocking)
    sendPasswordResetEmail({ to: user.email, name: user.name, resetUrl }).catch(console.error);

    return NextResponse.json({ message: 'If that email address is in our database, we will send you a password reset link.' });
  } catch (error) {
    console.error('Forgot-password error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
} 
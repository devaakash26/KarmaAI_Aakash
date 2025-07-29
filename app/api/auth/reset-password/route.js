'use server';

import { NextResponse } from 'next/server';
import { hash } from 'bcrypt';
import crypto from 'crypto';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongoose';

let User;
try {
  User = mongoose.model('User');
} catch {
  const UserSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true, required: true },
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
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ message: 'Token and new password are required' }, { status: 400 });
    }

    await dbConnect();

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: tokenHash,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return NextResponse.json({ message: 'Password reset token is invalid or has expired' }, { status: 400 });
    }

    user.password = await hash(password, 12);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return NextResponse.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Reset-password error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
} 
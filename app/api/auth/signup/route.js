import { hash } from 'bcrypt';
import { sendWelcomeEmail } from '@/lib/email';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import mongoose from 'mongoose';

// Define User Schema if it doesn't exist
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
    password: {
      type: String,
    },
    image: String,
    emailVerified: Date,
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
  });
  
  User = mongoose.model('User', UserSchema);
}

export async function POST(request) {
  try {
    const { name, email, password } = await request.json();
    
    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Connect to the database
    await dbConnect();
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: 'User already exists with this email' },
        { status: 409 }
      );
    }
    
    // Hash password
    const hashedPassword = await hash(password, 12);
    
    // Create new user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'user',
    });

    // Send welcome email (non-blocking)
    sendWelcomeEmail({ to: email, name }).catch(console.error);
    
    // Remove password from response
    const newUser = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
    };
    
    return NextResponse.json(
      { message: 'User created successfully', user: newUser },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { message: 'Error creating user' },
      { status: 500 }
    );
  }
} 
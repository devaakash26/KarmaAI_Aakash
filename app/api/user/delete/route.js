import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import dbConnect from '@/lib/mongoose';
import mongoose from 'mongoose';
import clientPromise from '@/lib/mongodb';

// Define User model if not already defined
let User;
try {
  User = mongoose.model('User');
} catch {
  const UserSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    image: String,
    emailVerified: Date,
  });
  User = mongoose.model('User', UserSchema);
}

// Define History model if not already defined
let History;
try {
  History = mongoose.model('History');
} catch {
  const HistorySchema = new mongoose.Schema({
    userId: String,
    history: Array,
    chatHistory: Array,
  });
  History = mongoose.model('History', HistorySchema);
}

export async function DELETE(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Connect to database
    await dbConnect();
    
    // Get user ID and email
    const userEmail = session.user.email;
    
    // Delete user data from various collections
    
    // 1. Delete user history
    await History.deleteMany({ userId: session.user.id });
    
    // 2. Delete user from Mongoose
    await User.deleteOne({ email: userEmail });
    
    // 3. Delete user from NextAuth.js accounts and sessions
    const client = await clientPromise;
    const db = client.db();
    
    // Delete from accounts
    await db.collection('accounts').deleteMany({ 
      userId: session.user.id 
    });
    
    // Delete from sessions
    await db.collection('sessions').deleteMany({ 
      userId: session.user.id 
    });
    
    // Delete from users
    await db.collection('users').deleteOne({ 
      email: userEmail 
    });
    
    return NextResponse.json({ 
      message: 'Account deleted successfully' 
    });
    
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
} 
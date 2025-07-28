import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import dbConnect from '@/lib/mongoose';
import mongoose from 'mongoose';

// Define History Schema if it doesn't exist
let History;
try {
  History = mongoose.model('History');
} catch {
  const HistorySchema = new mongoose.Schema({
    userId: {
      type: String,
      required: true,
      index: true
    },
    history: [{
      prompt: String,
      code: String,
      timestamp: Date
    }],
    chatHistory: [{
      role: String,
      content: String,
      code: String,
      timestamp: {
        type: Date,
        default: Date.now
      }
    }]
  });
  
  History = mongoose.model('History', HistorySchema);
}

// GET handler to retrieve user history
export async function GET(request) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Connect to the database
    await dbConnect();
    
    // Find user's history
    const userId = session.user.id;
    let userHistory = await History.findOne({ userId });
    
    if (!userHistory) {
      return NextResponse.json({
        history: [],
        chatHistory: []
      });
    }
    
    return NextResponse.json({
      history: userHistory.history || [],
      chatHistory: userHistory.chatHistory || []
    });
  } catch (error) {
    console.error('Error retrieving history:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve history' },
      { status: 500 }
    );
  }
}

// POST handler to save user history
export async function POST(request) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get data from request body
    const { historyItem, chatHistory } = await request.json();
    
    if (!historyItem) {
      return NextResponse.json(
        { error: 'History item is required' },
        { status: 400 }
      );
    }

    // Connect to the database
    await dbConnect();
    
    // Find or create user's history
    const userId = session.user.id;
    let userHistory = await History.findOne({ userId });
    
    if (!userHistory) {
      userHistory = new History({
        userId,
        history: [],
        chatHistory: []
      });
    }
    
    // Add new history item
    userHistory.history.unshift({
      prompt: historyItem.prompt,
      code: historyItem.code,
      timestamp: new Date(historyItem.timestamp)
    });
    
    // Limit history to 20 items
    if (userHistory.history.length > 20) {
      userHistory.history = userHistory.history.slice(0, 20);
    }
    
    // Update chat history if provided
    if (chatHistory && Array.isArray(chatHistory)) {
      userHistory.chatHistory = chatHistory.map(msg => ({
        role: msg.role,
        content: msg.content,
        code: msg.code,
        timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
      }));
      
      // Limit chat history to 50 messages
      if (userHistory.chatHistory.length > 50) {
        userHistory.chatHistory = userHistory.chatHistory.slice(0, 50);
      }
    }
    
    // Save to database
    await userHistory.save();
    
    return NextResponse.json({
      message: 'History saved successfully'
    });
  } catch (error) {
    console.error('Error saving history:', error);
    return NextResponse.json(
      { error: 'Failed to save history' },
      { status: 500 }
    );
  }
} 
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

export async function POST(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request body
    const { name, image } = await request.json();
    
    // Connect to database
    await dbConnect();
    
    // Find user by email
    const userEmail = session.user.email;
    const user = await User.findOne({ email: userEmail });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Update user in Mongoose model
    if (name) user.name = name;
    if (image) {
      // Strip any cache-busting parameters from the image URL
      user.image = image.split('?')[0];
      console.log(`Updating user image to: ${user.image}`);
    }
    
    await user.save();
    console.log(`User saved in Mongoose model: ${user._id}`);
    
    // Get the MongoDB client and connect to the database
    const client = await clientPromise;
    const db = client.db();
    
    // Get the clean image URL without cache-busting parameters
    const cleanImageUrl = image ? image.split('?')[0] : user.image;
    
    try {
      // Direct approach to update NextAuth users collection
      console.log("Updating NextAuth users collection...");
      
      // Update by email (most reliable)
      await db.collection('users').updateOne(
        { email: userEmail },
        { $set: { 
          ...(name && { name }),
          ...(image && { image: cleanImageUrl })
        }}
      );
      
      console.log("NextAuth users collection update attempted");
      
      // Simple approach to update sessions
      console.log("Updating sessions...");
      
      // Get all sessions
      const allSessions = await db.collection('sessions').find({}).toArray();
      console.log(`Found ${allSessions.length} total sessions`);
      
      let updatedCount = 0;
      
      // Process each session individually
      for (const sess of allSessions) {
        try {
          if (sess.session) {
            // Parse the session JSON
            const sessionObj = JSON.parse(sess.session);
            
            // Check if this session belongs to our user
            if (sessionObj?.user?.email === userEmail) {
              console.log(`Found matching session: ${sess._id}`);
              
              // Update the user data in the session
              if (name) sessionObj.user.name = name;
              if (cleanImageUrl) sessionObj.user.image = cleanImageUrl;
              
              // Save the updated session back to the database
              await db.collection('sessions').updateOne(
                { _id: sess._id },
                { $set: { session: JSON.stringify(sessionObj) }}
              );
              
              updatedCount++;
            }
          }
        } catch (e) {
          console.error(`Error processing session ${sess._id}:`, e.message);
        }
      }
      
      console.log(`Updated ${updatedCount} sessions`);
      
      // Also try to update the current user's session directly
      if (session?.user?.id) {
        try {
          // This is a more direct approach that might work in some cases
          await db.collection('sessions').updateMany(
            { "session": { $regex: userEmail } },
            { $set: { 
              "session": JSON.stringify({
                ...JSON.parse(allSessions[0]?.session || "{}"),
                user: {
                  ...JSON.parse(allSessions[0]?.session || "{}")?.user,
                  name: name || user.name,
                  image: cleanImageUrl
                }
              })
            }}
          );
        } catch (e) {
          console.error("Error with regex session update:", e.message);
        }
      }
      
    } catch (error) {
      console.error("Error updating NextAuth collections:", error.message);
    }
    
    return NextResponse.json({ 
      message: 'Profile updated successfully',
      user: {
        name: user.name,
        email: user.email,
        image: user.image
      }
    });
    
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
} 
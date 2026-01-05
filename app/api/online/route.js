import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

// MongoDB connection with connection pooling
const uri = process.env.MONGODB_URI;
let client;
let clientPromise;

// Initialize MongoDB client with connection pooling
if (!clientPromise) {
  client = new MongoClient(uri, {
    maxPoolSize: 10,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });
  clientPromise = client.connect();
}

async function getCollection() {
  const connectedClient = await clientPromise;
  const db = connectedClient.db("karmaai");
  return db.collection("online_users");
}

export async function GET() {
  try {
    const collection = await getCollection();

    // Get current count
    const count = await collection.countDocuments();
    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error getting online count:", error);
    return NextResponse.json({ count: 0 }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { userId, sessionId } = await request.json();
    const collection = await getCollection();

    // Add user to online list with timestamp
    await collection.updateOne(
      { sessionId },
      {
        $set: {
          userId: userId || null,
          sessionId,
          lastSeen: new Date(),
        },
      },
      { upsert: true }
    );

    // Clean up old entries (users inactive for more than 5 minutes)
    await collection.deleteMany({
      lastSeen: { $lt: new Date(Date.now() - 5 * 60 * 1000) },
    });

    const count = await collection.countDocuments();
    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error updating online count:", error);
    return NextResponse.json({ count: 0 }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { sessionId } = await request.json();
    const collection = await getCollection();

    // Remove user from online list
    await collection.deleteOne({ sessionId });

    const count = await collection.countDocuments();
    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error removing online user:", error);
    return NextResponse.json({ count: 0 }, { status: 500 });
  }
}

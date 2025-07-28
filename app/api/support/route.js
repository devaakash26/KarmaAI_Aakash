import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import dbConnect from '@/lib/mongoose';
import mongoose from 'mongoose';
import { sendSupportTicketEmail, sendSupportAckEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

// Define SupportTicket schema if not defined already
let SupportTicket;
try {
  SupportTicket = mongoose.model('SupportTicket');
} catch {
  const SupportTicketSchema = new mongoose.Schema(
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      subject: { type: String, required: true },
      level: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Low' },
      description: { type: String, required: true },
      status: { type: String, enum: ['Open', 'Closed'], default: 'Open' },
    },
    { timestamps: true }
  );
  SupportTicket = mongoose.model('SupportTicket', SupportTicketSchema);
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { subject, level, description } = await request.json();
  if (!subject || !description) {
    return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
  }

  await dbConnect();

  try {
    const ticket = await SupportTicket.create({
      userId: session.user.id,
      subject,
      level: level || 'Low',
      description,
    });

    // Email admin & user (fire-and-forget)
    const userInfo = { name: session.user.name || 'User', email: session.user.email };
    sendSupportTicketEmail({ subject, level: level || 'Low', description, user: userInfo }).catch(console.error);
    sendSupportAckEmail({ to: session.user.email, name: session.user.name }).catch(console.error);

    return NextResponse.json({ message: 'Query submitted successfully', ticketId: ticket._id }, { status: 201 });
  } catch (error) {
    console.error('Support ticket error:', error);
    return NextResponse.json({ message: 'Error creating support ticket' }, { status: 500 });
  }
} 
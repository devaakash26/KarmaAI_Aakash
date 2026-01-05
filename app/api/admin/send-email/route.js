import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import dbConnect from "@/lib/mongoose";
import mongoose from "mongoose";
import nodemailer from "nodemailer";

// Define User Schema
let User;
try {
  User = mongoose.model("User");
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
    role: { type: String, enum: ["user", "admin"], default: "user" },
    blocked: { type: Boolean, default: false },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    createdAt: { type: Date, default: Date.now },
  });

  User = mongoose.model("User", UserSchema);
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { userIds, subject, message } = await request.json();

    if (!userIds || !subject || !message) {
      return NextResponse.json(
        { error: "User IDs, subject, and message are required" },
        { status: 400 }
      );
    }

    // Check if email credentials are configured
    if (!process.env.EMAIL_SERVER_USER || !process.env.EMAIL_SERVER_PASSWORD) {
      return NextResponse.json(
        { 
          error: "Email service not configured. Please add EMAIL_SERVER_USER and EMAIL_SERVER_PASSWORD to your .env file." 
        },
        { status: 503 }
      );
    }

    await dbConnect();

    // Get users
    const users = await User.find({ _id: { $in: userIds } }).select("email name");

    if (users.length === 0) {
      return NextResponse.json({ error: "No users found" }, { status: 404 });
    }

    // Create email transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: parseInt(process.env.EMAIL_SERVER_PORT),
      secure: process.env.EMAIL_SERVER_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD.replace(/['"]/g, ''), // Remove quotes if present
      },
    });

    // Send emails
    const emailPromises = users.map((user) => {
      const mailOptions = {
        from: process.env.EMAIL_FROM || `"KarmaAI Admin" <${process.env.EMAIL_SERVER_USER}>`,
        to: user.email,
        subject: subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px;">
            <div style="background: white; padding: 30px; border-radius: 8px;">
              <h2 style="color: #667eea; margin-bottom: 20px;">Hello ${user.name || "User"},</h2>
              <div style="color: #333; line-height: 1.6; white-space: pre-wrap;">${message}</div>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
              <p style="color: #666; font-size: 12px; margin: 0;">
                This email was sent from KarmaAI Admin Portal.<br>
                © 2026 KarmaAI. All rights reserved.
              </p>
            </div>
          </div>
        `,
      };

      return transporter.sendMail(mailOptions);
    });

    await Promise.all(emailPromises);

    return NextResponse.json({
      success: true,
      message: `Emails sent successfully to ${users.length} user(s)`,
    });
  } catch (error) {
    console.error("Error sending emails:", error);
    return NextResponse.json(
      { error: "Failed to send emails" },
      { status: 500 }
    );
  }
}

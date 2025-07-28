import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import clientPromise from '@/lib/mongodb';
import dbConnect from '@/lib/mongoose';
import mongoose from 'mongoose';
import { compare } from 'bcrypt';
import { sendWelcomeEmail } from '@/lib/email';

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

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        await dbConnect();

        // Find user by email
        const user = await User.findOne({ email: credentials.email });
        
        // Check if user exists and password matches
        if (!user || !user.password) {
          throw new Error('No user found with this email');
        }
        
        const isPasswordMatch = await compare(credentials.password, user.password);
        
        if (!isPasswordMatch) {
          throw new Error('Invalid password');
        }
        
        // Return user object
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.image,
        };
      }
    })
  ],
  adapter: MongoDBAdapter(clientPromise),
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role || 'user';
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      // Send welcome email for OAuth sign-ups or credentials sign-ups handled by NextAuth
      await sendWelcomeEmail({ to: user.email, name: user.name });
    },
  },
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 
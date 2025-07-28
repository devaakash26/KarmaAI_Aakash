'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useRef } from 'react';
import { ArrowLeftIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { ChevronDown, LayoutGrid, Settings, HelpCircle, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { signOut } from 'next-auth/react';

// Reusable user menu component
const UserMenu = ({ user }) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = () => signOut({ callbackUrl: '/' });

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={() => setOpen(!open)} className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-700 transition-colors">
        <img src={user.image || '/default-avatar.png'} className="w-8 h-8 rounded-full border-2 border-amber-400" alt="avatar" />
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="absolute right-0 mt-2 w-56 bg-gray-800 bg-opacity-90 backdrop-blur-lg rounded-lg border border-gray-700 p-2 z-50 shadow-xl">
          <div className="p-3 border-b border-gray-700">
            <h4 className="font-semibold text-sm truncate">{user.name}</h4>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
          <div className="py-1">
            <Link href="/playground" className="flex items-center px-3 py-2 text-sm hover:bg-gray-700 rounded-md"><LayoutGrid className="w-4 h-4 mr-3"/>Playground</Link>
            <Link href="/settings" className="flex items-center px-3 py-2 text-sm hover:bg-gray-700 rounded-md"><Settings className="w-4 h-4 mr-3"/>Settings</Link>
            <Link href="/help" className="flex items-center px-3 py-2 text-sm hover:bg-gray-700 rounded-md"><HelpCircle className="w-4 h-4 mr-3"/>Help</Link>
          </div>
          <div className="border-t border-gray-700 my-1"></div>
          <button onClick={handleSignOut} className="flex items-center w-full px-3 py-2 text-sm text-red-400 hover:bg-red-900 hover:bg-opacity-30 rounded-md"><LogOut className="w-4 h-4 mr-3"/>Sign Out</button>
        </motion.div>
      )}
    </div>
  );
};

export default function Help() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Form state hooks MUST be declared before any conditional returns to keep hook order stable
  const [subject, setSubject] = useState('');
  const [level, setLevel] = useState('Low');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Safe early-return after all hooks
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const submitTicket = async () => {
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, level, description }),
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Failed');
      setSuccessMsg('Your query has been sent successfully! Our team will be in touch.');
      setSubject('');
      setLevel('Low');
      setDescription('');
    } catch (err) {
      setErrorMsg(err.message || 'Error sending query');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-3 group">
            <motion.div
              whileHover={{ rotate: 360, transition: { duration: 0.6 } }}
              className="w-8 h-8"
            >
              <Image
                src="/globe.svg"
                alt="KarmaAI logo"
                width={32}
                height={32}
                className="w-8 h-8 object-contain saturate-150 group-hover:scale-105 transition-transform"
                priority
              />
            </motion.div>
            <span className="text-xl font-bold text-gray-200">KarmaAI</span>
          </Link>
          {status === 'authenticated' ? (
            <UserMenu user={session.user} />
          ) : (
            <div className="flex items-center space-x-4">
              <Link href="/login" className="text-base hover:text-amber-400 transition-colors">Log In</Link>
              <Link href="/signup" className="px-4 py-1.5 text-base font-semibold bg-gradient-to-r from-amber-500 to-red-500 rounded-full hover:shadow-lg hover:shadow-amber-500/20 transform hover:-translate-y-0.5 transition-all">Sign Up</Link>
            </div>
          )}
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-6">
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Home
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Contact Support</h1>

          {successMsg && (
            <div className="mb-4 p-4 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              {successMsg}
            </div>
          )}
          {errorMsg && (
            <div className="mb-4 p-4 rounded-lg bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300">
              {errorMsg}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} type="text" className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white" placeholder="Brief summary of your query" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority Level</label>
              <select value={level} onChange={(e) => setLevel(e.target.value)} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white">
                {['Low', 'Medium', 'High', 'Critical'].map((lvl) => (
                  <option key={lvl} value={lvl}>{lvl}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows="6" className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white" placeholder="Describe your issue or question in detail"></textarea>
            </div>

            <button onClick={submitTicket} disabled={submitting || !subject || !description} className="inline-flex items-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:opacity-90 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              {submitting ? (
                <>
                  <PaperAirplaneIcon className="animate-spin h-5 w-5 mr-2" /> Sending...
                </>
              ) : (
                <>
                  <PaperAirplaneIcon className="h-5 w-5 mr-2" /> Send Query
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 
'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  ChevronDown,
  User,
  LogOut,
  Settings,
  HelpCircle,
  LayoutGrid
} from 'lucide-react';

const Mandala = ({ className }) => (
  <motion.svg
    className={className}
    viewBox="0 0 200 200"
    initial={{ rotate: 0, scale: 0.8, opacity: 0 }}
    animate={{ rotate: 360, scale: 1, opacity: 0.05 }}
    transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
  >
    <g stroke="#374151" strokeWidth="0.5" fill="none">
      {[...Array(18)].map((_, i) => (
        <g key={i} transform={`rotate(${i * 20}, 100, 100)`}>
          <circle cx="100" cy="50" r="45" />
          <path d="M100,5 L100,95" />
        </g>
      ))}
      <circle cx="100" cy="100" r="98" strokeDasharray="2, 8" />
    </g>
  </motion.svg>
);

const UserMenu = ({ user, onSignOut }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-700 transition-colors">
        <img src={user.image || '/default-avatar.png'} alt="User" className="w-8 h-8 rounded-full border-2 border-amber-400" />
        <ChevronDown className={`w-4 h-4 cursor-pointer transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <motion.div 
          className="absolute right-0 mt-2 w-56 bg-gray-800 bg-opacity-90 backdrop-blur-lg rounded-lg shadow-xl border border-gray-700 p-2 z-50"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="p-3 border-b border-gray-700">
            <h4 className="font-semibold text-sm truncate">{user.name}</h4>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
          <div className="py-1">
            <Link href="/playground" className="flex items-center w-full px-3 py-2 text-sm hover:bg-gray-700 rounded-md">
              <LayoutGrid className="w-4 h-4 mr-3" /> Playground
            </Link>
            <Link href="/settings" className="flex items-center w-full px-3 py-2 text-sm hover:bg-gray-700 rounded-md">
              <Settings className="w-4 h-4 mr-3" /> Settings
            </Link>
            <Link href="/help" className="flex items-center w-full px-3 py-2 text-sm hover:bg-gray-700 rounded-md">
              <HelpCircle className="w-4 h-4 mr-3" /> Help
            </Link>
          </div>
          <div className="border-t border-gray-700 my-1"></div>
          <button onClick={onSignOut} className="flex items-center w-full px-3 py-2 text-sm text-red-400 hover:bg-red-900 hover:bg-opacity-30 rounded-md">
            <LogOut className="w-4 h-4 mr-3" /> Sign Out
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default function Hero() {
  const { data: session, status } = useSession();

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };
  
  const navVariants = {
    hidden: { y: -100, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } },
  };

  return (
    <div className="min-h-screen bg-[#111827] text-gray-200 overflow-hidden relative">
      <Mandala className="absolute -top-1/4 -left-1/4 w-3/4 h-auto" />
      <Mandala className="absolute -bottom-1/4 -right-1/4 w-3/4 h-auto" />
      
      <motion.nav 
        className="fixed top-0 left-0 right-0 z-40 bg-gray-900 bg-opacity-50 backdrop-blur-md"
        variants={navVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="container mx-auto px-6 py-3 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-3">
            <motion.div
              whileHover={{ rotate: 360, transition: { duration: 0.6 } }}
              className="w-10 h-10"
            >
              <Image
                src="/globe.svg"
                alt="KarmaAI logo"
                width={40}
                height={40}
                className="w-10 h-10 object-contain saturate-150"
                priority
              />
            </motion.div>
            <span className="text-2xl font-bold text-gray-200">KarmaAI</span>
          </Link>
          
          <div className="flex items-center space-x-4">
            {status === 'authenticated' ? (
              <UserMenu user={session.user} onSignOut={handleSignOut} />
            ) : (
              <div className="flex items-center space-x-4">
                <Link href="/login" className="text-base hover:text-amber-400 transition-colors">Log In</Link>
                <Link href="/signup" className="px-6 py-2 text-base font-semibold bg-gradient-to-r from-amber-500 to-red-500 rounded-full hover:shadow-lg hover:shadow-amber-500/20 transform hover:-translate-y-0.5 transition-all">
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </motion.nav>

      <main className="container mx-auto px-6 relative z-10 pt-24">
        <div className="min-h-screen flex flex-col justify-center items-center text-center -mt-8 sm:-mt-12 md:-mt-24">
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.2, duration: 0.5 } }}
          >
            <h1 className="text-5xl md:text-7xl font-black leading-none tracking-tight">
              <span className="block text-gray-100">Craft UI with the</span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-500 via-orange-400 to-red-500">Essence of India</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto mt-6">
              Harness the power of AI to generate beautiful, production-ready UI components inspired by India's rich artistic traditions.
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.4, duration: 0.5 } }}
          >
            <Link href="/playground" className="inline-flex items-center space-x-3 px-8 py-4 text-lg font-bold bg-gradient-to-r from-amber-500 to-red-500 rounded-full hover:shadow-2xl hover:shadow-amber-500/30 transform hover:-translate-y-1 transition-all">
              <span>Start Creating Now</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
          
          <motion.div 
            className="mt-16 w-full max-w-3xl"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1, transition: { delay: 0.6, duration: 0.5 } }}
          >
            <div className="bg-gray-800 bg-opacity-50 backdrop-blur-lg rounded-xl shadow-2xl p-4 border border-gray-700">
              <div className="flex justify-between items-center mb-3 px-2">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <p className="text-xs text-gray-500">KarmaAI Playground</p>
              </div>
              <div className="bg-gray-900 rounded-md p-4 text-left">
                <p className="font-mono text-sm text-gray-300">
                  <span className="text-amber-400">&gt;</span> Create a "Login Form" with a modern, Indian-inspired design...
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-gray-500 text-sm">
        Made with <span className="text-red-500">❤</span> by Aakash
      </footer>
    </div>
  );
} 
import Link from 'next/link';
import Image from 'next/image';

export default function AuthNavbar({ variant = 'login' }) {
  // variant: 'login' shows Sign Up CTA, 'signup' shows Log In CTA
  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-white/70 dark:bg-gray-900/60 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center space-x-2">
          <Image src="/globe.svg" alt="KarmaAI logo" width={28} height={28} priority />
          <span className="font-bold text-lg text-gray-900 dark:text-gray-100">KarmaAI</span>
        </Link>

        {/* Auth CTA */}
        {variant === 'login' ? (
          <Link href="/signup" className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-md hover:opacity-90 transition-colors">
            Sign Up
          </Link>
        ) : (
          <Link href="/login" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
            Log In
          </Link>
        )}
      </div>
    </nav>
  );
} 
'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowLeftIcon, 
  CameraIcon, 
  ExclamationTriangleIcon, 
  XMarkIcon,
  ChevronDownIcon,
  UserIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  CommandLineIcon,
  ArrowLeftOnRectangleIcon
} from '@heroicons/react/24/outline';

export default function Settings() {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [name, setName] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [imageKey, setImageKey] = useState(Date.now()); // Add a key for forcing re-render
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteEmail, setDeleteEmail] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      setName(session?.user?.name || '');
      if (session?.user?.image) {
        // Add cache-busting parameter
        const timestamp = new Date().getTime();
        setProfileImage(`${session.user.image}?t=${timestamp}`);
      }
    }
  }, [status, router, session]);

  // Add this function to close the profile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (isProfileMenuOpen && !event.target.closest('.user-dropdown')) {
        setIsProfileMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileMenuOpen]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Update user profile in database
      const response = await fetch('/api/user/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          image: profileImage?.split('?')[0], // Remove any query parameters
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const data = await response.json();

      // Update session
      await updateSession({
        ...session,
        user: {
          ...session?.user,
          name,
          image: profileImage,
        },
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Please select a valid image file (JPEG, PNG, or GIF)');
      return;
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setUploadError('Image size should be less than 2MB');
      return;
    }
    
    setIsUploading(true);
    setUploadError('');
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload image');
      }
      
      const data = await response.json();
      
      // Use the timestamp for cache busting
      const timestamp = data.timestamp || Date.now();
      
      // Get the URL with cache busting
      const imageUrl = data.url;
      const cachedUrl = `${imageUrl}?t=${timestamp}`;
      
      console.log("Uploaded image URL with cache busting:", cachedUrl);
      
      // Update state with the cached URL
      setProfileImage(cachedUrl);
      
      // Save the original URL to the database
      await fetch('/api/user/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageUrl, // Save the original URL without cache busting
        }),
      });
      
      // Show success message
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
      // Force a page reload after a short delay
      // This is the most reliable way to ensure the image updates everywhere
      setTimeout(() => {
        window.location.reload();
      }, 500);
      
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };
  
  const handleDeleteAccount = async () => {
    if (deleteEmail !== session?.user?.email) {
      setDeleteError('Email address does not match your account email');
      return;
    }
    
    setIsDeleting(true);
    setDeleteError('');
    
    try {
      const response = await fetch('/api/user/delete', {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete account');
      }
      
      // Sign out and redirect to home page
      router.push('/api/auth/signout?callbackUrl=/');
    } catch (error) {
      console.error('Error deleting account:', error);
      setDeleteError('Failed to delete account. Please try again.');
      setIsDeleting(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0f172a]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // Generate a unique key for each image to force re-render
  const uniqueImageKey = Date.now();

  return (
    <div className="min-h-screen bg-[#1a1f2e] text-white">
      <header className="bg-[#1e2434] shadow-sm border-b border-gray-800">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 w-8 h-8 rounded-lg"></div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">KarmaAI</span>
          </Link>
          
          {/* Add profile dropdown */}
          <div className="flex items-center space-x-4">
            {session?.user && (
              <div className="relative user-dropdown">
                <button 
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center space-x-2 bg-[#2a3548] border border-gray-700 rounded-full pl-2 pr-4 py-1.5 hover:shadow-md transition"
                >
                  {profileImage ? (
                    <img 
                      key={`nav-${uniqueImageKey}`}
                      src={profileImage} 
                      alt={session.user.name || 'User'} 
                      className="w-8 h-8 rounded-full object-cover"
                      onError={(e) => {
                        console.error("Nav image failed to load:", profileImage);
                        e.target.onerror = null;
                        e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='1' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='8' r='5'/%3E%3Cpath d='M20 21a8 8 0 0 0-16 0'/%3E%3C/svg%3E";
                      }}
                    />
                  ) : (
                    <UserIcon className="w-8 h-8 text-gray-400" />
                  )}
                  <span className="text-sm font-medium text-gray-300 hidden sm:inline-block">
                    {session.user.name?.split(' ')[0] || 'User'}
                  </span>
                  <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-[#2a3548] rounded-lg shadow-lg border border-gray-700 py-2 z-50 animate-fadeIn">
                    <div className="px-4 py-2 border-b border-gray-700">
                      <p className="text-sm font-medium text-white">{session.user.name}</p>
                      <p className="text-xs text-gray-400 truncate">{session.user.email}</p>
                    </div>
                    
                    <Link href="/playground" className="flex items-center px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700">
                      <CommandLineIcon className="w-5 h-5 mr-3 text-gray-400" />
                      Playground
                    </Link>
                    
                    <Link href="/help" className="flex items-center px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700">
                      <QuestionMarkCircleIcon className="w-5 h-5 mr-3 text-gray-400" />
                      Help & Support
                    </Link>
                    
                    <Link href="/settings" className="flex items-center px-4 py-2.5 text-sm text-gray-300 bg-gray-700">
                      <Cog6ToothIcon className="w-5 h-5 mr-3 text-gray-400" />
                      Settings
                    </Link>
                    
                    <div className="border-t border-gray-700 mt-1"></div>
                    
                    <Link
                      href="/api/auth/signout"
                      className="flex w-full items-center px-4 py-2.5 text-sm text-red-400 hover:bg-gray-700"
                    >
                      <ArrowLeftOnRectangleIcon className="w-5 h-5 mr-3" />
                      Sign out
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Add animation keyframes for the dropdown */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
      `}</style>

      <div className="container mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center text-indigo-400 hover:text-indigo-300 mb-6 transition-colors">
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Home
        </Link>
        
        <div className="bg-[#1e2434] rounded-lg shadow-xl max-w-4xl mx-auto overflow-hidden">
          <div className="md:flex">
            {/* Sidebar */}
            <div className="md:w-64 bg-[#2e3546] border-r border-gray-800">
              <div className="p-6">
                <h2 className="text-xl font-bold text-white mb-6">Settings</h2>
                <nav className="space-y-1">
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`w-full text-left px-4 py-3 rounded-md text-sm font-medium text-white transition-colors cursor-pointer ${
                      activeTab === 'profile'
                        ? 'bg-purple-600 text-white'
                        : 'text-white hover:bg-gray-700'
                    }`}
                  >
                    Profile
                  </button>
                  <button
                    onClick={() => setActiveTab('account')}
                    className={`w-full text-left px-4 py-3 rounded-md text-sm font-medium text-white transition-colors cursor-pointer ${
                      activeTab === 'account'
                        ? 'bg-purple-600 text-white'
                        : 'text-white hover:bg-gray-700'
                    }`}
                  >
                    Account
                  </button>
                </nav>
              </div>
            </div>

            {/* Main content */}
            <div className="flex-1 p-8">
              {activeTab === 'profile' && (
                <div>
                  <h3 className="text-xl font-medium text-white mb-8">Profile Settings</h3>
                  
                  <div className="space-y-8">
                    {/* Profile picture */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3">
                        Profile Picture
                      </label>
                      <div className="flex items-center">
                        <div className="relative group">
                          {profileImage ? (
                            <div className="relative">
                              {/* Use img tag with key prop to force re-render */}
                              <img 
                                key={`profile-${uniqueImageKey}`}
                                src={profileImage} 
                                alt={name || 'User'} 
                                className="w-24 h-24 rounded-full object-cover border border-gray-700"
                                onLoad={() => console.log("Profile image loaded successfully")}
                                onError={(e) => {
                                  console.error("Profile image failed to load:", profileImage);
                                  e.target.onerror = null;
                                  e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='1' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='8' r='5'/%3E%3Cpath d='M20 21a8 8 0 0 0-16 0'/%3E%3C/svg%3E";
                                }}
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 rounded-full flex items-center justify-center transition-opacity cursor-pointer" onClick={triggerFileInput}>
                                <CameraIcon className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </div>
                          ) : (
                            <div 
                              className="w-24 h-24 rounded-full bg-black flex items-center justify-center cursor-pointer group-hover:bg-gray-900 transition-colors"
                              onClick={triggerFileInput}
                            >
                              <span className="text-2xl text-gray-500">
                                {name?.charAt(0) || 'U'}
                              </span>
                            </div>
                          )}
                          
                          {isUploading && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                            </div>
                          )}
                        </div>
                        
                        <input 
                          type="file" 
                          ref={fileInputRef}
                          className="hidden" 
                          accept="image/png, image/jpeg, image/gif"
                          onChange={handleFileChange}
                        />
                        
                        <button 
                          onClick={triggerFileInput}
                          disabled={isUploading}
                          className="ml-5 bg-[#2a3548] py-2 px-4 border border-gray-700 rounded-md text-sm font-medium text-gray-300 hover:bg-[#344058] flex items-center disabled:opacity-50 transition-colors cursor-pointer"
                        >
                          <CameraIcon className="h-5 w-5 mr-2" />
                          Change Photo
                        </button>
                      </div>
                      {uploadError && (
                        <p className="mt-2 text-sm text-red-400">{uploadError}</p>
                      )}
                    </div>

                    {/* Name */}
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-3">
                        Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        className="w-full px-4 py-3 border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-[#2a3548] text-white transition-colors"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-3">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        className="w-full px-4 py-3 border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 bg-[#2a3548] text-white"
                        value={session?.user?.email || ''}
                        disabled
                      />
                      <p className="mt-2 text-xs text-gray-400">
                        Email cannot be changed as it is linked to your authentication account.
                      </p>
                    </div>

                    {/* Save button */}
                    <div className="flex items-center justify-end space-x-3">
                      {saveSuccess && (
                        <span className="text-sm text-green-400 animate-pulse">
                          Profile updated successfully!
                        </span>
                      )}
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-purple-600 text-white py-3 px-8 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'account' && (
                <div>
                  <h3 className="text-xl font-medium text-white mb-6">Account Settings</h3>
                  <p className="text-gray-300 mb-8">
                    Manage your account settings and connected services.
                  </p>
                  
                  {/* Connected accounts */}
                  <div className="mb-8">
                    <h4 className="text-md font-medium text-white mb-4">Connected Accounts</h4>
                    <div className="bg-[#2a3548] p-4 rounded-md border border-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <svg className="h-6 w-6 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
                            </svg>
                          </div>
                          <span className="ml-3 text-white">Google</span>
                        </div>
                        <span className="text-sm text-green-400 bg-green-900/30 px-3 py-1 rounded-full font-medium">Connected</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Delete account */}
                  <div className="mt-8 border-t border-gray-700 pt-8">
                    <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-4">
                      <h4 className="text-md font-medium text-red-400 mb-3 flex items-center">
                        <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                        Danger Zone
                      </h4>
                      <p className="text-sm text-gray-300 mb-4">
                        Once you delete your account, there is no going back. All of your data will be permanently removed.
                      </p>
                      
                      {!showDeleteConfirm ? (
                        <button 
                          onClick={() => setShowDeleteConfirm(true)}
                          className="bg-[#2a3548] text-red-400 border border-red-500 py-2 px-4 rounded-md hover:bg-red-900/20 transition-colors cursor-pointer"
                        >
                          Delete Account
                        </button>
                      ) : (
                        <div className="bg-[#2a3548] border border-gray-700 rounded-md p-4 mt-4 relative">
                          <button 
                            onClick={() => setShowDeleteConfirm(false)} 
                            className="absolute top-2 right-2 text-gray-400 hover:text-gray-200 transition-colors"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                          
                          <h5 className="text-sm font-medium text-white mb-3">Confirm account deletion</h5>
                          <p className="text-xs text-gray-400 mb-3">
                            Please type your email address to confirm that you want to permanently delete your account.
                          </p>
                          
                          <input
                            type="email"
                            placeholder={session?.user?.email}
                            value={deleteEmail}
                            onChange={(e) => setDeleteEmail(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 bg-[#1e2536] text-white mb-3 text-sm"
                          />
                          
                          {deleteError && (
                            <p className="text-sm text-red-400 mb-3">{deleteError}</p>
                          )}
                          
                          <div className="flex justify-end space-x-3">
                            <button 
                              onClick={() => setShowDeleteConfirm(false)}
                              className="bg-[#2a3548] text-gray-300 py-2 px-4 rounded-md hover:bg-[#344058] text-sm transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button 
                              onClick={handleDeleteAccount}
                              disabled={isDeleting || deleteEmail !== session?.user?.email}
                              className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 text-sm transition-colors cursor-pointer"
                            >
                              {isDeleting ? 'Deleting...' : 'Permanently Delete Account'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
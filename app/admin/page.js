"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserGroupIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  MagnifyingGlassIcon,
  XCircleIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

export default function AdminPortal() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  // Success alert state
  const [successAlert, setSuccessAlert] = useState(null);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/login");
      return;
    }
    // Check if user is admin
    if (session.user.role !== "admin") {
      router.push("/");
      return;
    }
    fetchUsers();
  }, [session, status, router]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async (userId, currentStatus) => {
    try {
      setActionLoading(userId);
      const response = await fetch("/api/admin/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, blocked: !currentStatus }),
      });

      if (response.ok) {
        fetchUsers();
        showSuccessAlert(`User ${!currentStatus ? 'blocked' : 'unblocked'} successfully!`);
      }
    } catch (error) {
      console.error("Error blocking user:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      setActionLoading(userId);
      const response = await fetch("/api/admin/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (response.ok) {
        fetchUsers();
        showSuccessAlert(`User role updated to ${newRole} successfully!`);
      }
    } catch (error) {
      console.error("Error changing role:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const showSuccessAlert = (message) => {
    setSuccessAlert(message);
    setTimeout(() => setSuccessAlert(null), 5000); // Auto-hide after 5 seconds
  };

  const handleSendEmail = async () => {
    if (!emailSubject || !emailMessage || selectedUsers.length === 0) {
      alert("Please fill in all fields and select at least one user");
      return;
    }

    try {
      setSending(true);
      const response = await fetch("/api/admin/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userIds: selectedUsers,
          subject: emailSubject,
          message: emailMessage,
        }),
      });

      if (response.ok) {
        showSuccessAlert("Emails sent successfully!");
        setEmailSubject("");
        setEmailMessage("");
        setSelectedUsers([]);
      } else {
        const data = await response.json();
        alert(data.error || "Failed to send emails");
      }
    } catch (error) {
      console.error("Error sending emails:", error);
      alert("Failed to send emails. Please check your email configuration.");
    } finally {
      setSending(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleUserSelection = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-indigo-400/10 to-purple-400/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>
      {/* Success Alert */}
      <AnimatePresence>
        {successAlert && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            transition={{ duration: 0.4, type: "spring", stiffness: 300 }}
            className="fixed top-4 right-4 z-50 max-w-sm"
          >
            <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white p-4 rounded-2xl shadow-2xl border border-green-400/30 backdrop-blur-xl relative overflow-hidden">
              {/* Animated background gradient */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
              <div className="relative flex items-center space-x-3">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                >
                  <CheckCircleIcon className="w-6 h-6 text-white" />
                </motion.div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{successAlert}</p>
                </div>
                <button
                  onClick={() => setSuccessAlert(null)}
                  className="flex-shrink-0 p-1 rounded-lg hover:bg-white/20 transition-all duration-200 hover:scale-110"
                >
                  <XMarkIcon className="w-4 h-4 text-white" />
                </button>
              </div>
              {/* Enhanced progress bar */}
              <div className="mt-3 bg-white/20 rounded-full h-1.5 overflow-hidden">
                <motion.div
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: 5, ease: "easeInOut" }}
                  className="bg-gradient-to-r from-white to-white/80 h-full rounded-full shadow-sm"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-2xl border-b border-slate-200/50 dark:border-slate-700/50 sticky top-0 z-40 shadow-lg"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <motion.div
              className="flex items-center space-x-4"
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <motion.button
                onClick={() => router.push("/")}
                className="p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.3 }}
              >
                <ArrowLeftIcon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </motion.button>
              <div className="flex items-center space-x-4">
                <motion.div
                  className="relative p-3 bg-gradient-to-br from-purple-500 via-pink-500 to-indigo-500 rounded-2xl shadow-2xl"
                  animate={{
                    boxShadow: [
                      "0 0 20px rgba(147, 51, 234, 0.3)",
                      "0 0 40px rgba(219, 39, 119, 0.4)",
                      "0 0 20px rgba(147, 51, 234, 0.3)",
                    ],
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <ShieldCheckIcon className="w-8 h-8 text-white" />
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl opacity-50"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </motion.div>
                <div>
                  <motion.h1
                    className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent"
                    animate={{
                      backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                    }}
                    transition={{ duration: 5, repeat: Infinity }}
                  >
                    Admin Portal
                  </motion.h1>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                    Advanced system management & control
                  </p>
                </div>
              </div>
            </motion.div>
            <motion.div
              className="flex items-center space-x-4"
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {session?.user?.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center">
                  <motion.div
                    className="w-2 h-2 bg-green-500 rounded-full mr-2"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  Administrator
                </p>
              </div>
              <motion.div
                className="relative"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <img
                  src={session?.user?.image || "/default-avatar.png"}
                  alt="Admin"
                  className="w-12 h-12 rounded-2xl border-2 border-gradient-to-r from-purple-500 to-pink-500 shadow-lg"
                />
                <motion.div
                  className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-slate-800"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <motion.div
          className="flex space-x-2 mb-8 p-2 bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-700/20 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <motion.button
            onClick={() => setActiveTab("users")}
            className={`relative flex items-center space-x-3 px-8 py-4 rounded-xl font-semibold transition-all duration-300 overflow-hidden ${
              activeTab === "users"
                ? "text-white shadow-2xl"
                : "text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-700/80 hover:shadow-lg"
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {activeTab === "users" && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500"
                initial={{ x: "-100%" }}
                animate={{ x: "0%" }}
                transition={{ duration: 0.3 }}
              />
            )}
            <motion.div
              className="relative z-10 flex items-center space-x-3"
              animate={activeTab === "users" ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.5 }}
            >
              <UserGroupIcon className="w-5 h-5" />
              <span>Users</span>
            </motion.div>
          </motion.button>
          <motion.button
            onClick={() => setActiveTab("email")}
            className={`relative flex items-center space-x-3 px-8 py-4 rounded-xl font-semibold transition-all duration-300 overflow-hidden ${
              activeTab === "email"
                ? "text-white shadow-2xl"
                : "text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-700/80 hover:shadow-lg"
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {activeTab === "email" && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500"
                initial={{ x: "-100%" }}
                animate={{ x: "0%" }}
                transition={{ duration: 0.3 }}
              />
            )}
            <motion.div
              className="relative z-10 flex items-center space-x-3"
              animate={activeTab === "email" ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.5 }}
            >
              <EnvelopeIcon className="w-5 h-5" />
              <span>Send Email</span>
            </motion.div>
          </motion.button>
        </motion.div>

        {/* Users Tab */}
        {activeTab === "users" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Search Bar */}
            <motion.div
              className="mb-6"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="relative">
                <motion.div
                  className="absolute left-4 top-1/2 transform -translate-y-1/2"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <MagnifyingGlassIcon className="w-5 h-5 text-slate-400" />
                </motion.div>
                <motion.input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  whileFocus={{ scale: 1.01, boxShadow: "0 0 0 3px rgba(168, 85, 247, 0.1)" }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                />
                {searchQuery && (
                  <motion.button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </motion.button>
                )}
              </div>
            </motion.div>

            {/* Users Table */}
            <motion.div
              className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden"
              whileHover={{ boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}
              transition={{ duration: 0.3 }}
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                        Select
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {filteredUsers.map((user, index) => (
                      <motion.tr
                        key={user._id}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors duration-200"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.05 }}
                        whileHover={{ scale: 1.01 }}
                      >
                        <td className="px-6 py-4">
                          <motion.input
                            type="checkbox"
                            checked={selectedUsers.includes(user._id)}
                            onChange={() => toggleUserSelection(user._id)}
                            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <motion.img
                              src={user.image || "/default-avatar.png"}
                              alt={user.name}
                              className="w-10 h-10 rounded-full border-2 border-slate-200 dark:border-slate-600 shadow-lg"
                              whileHover={{ scale: 1.1, rotate: 5 }}
                              transition={{ duration: 0.2 }}
                            />
                            <div>
                              <p className="font-medium text-slate-800 dark:text-slate-200">
                                {user.name || "N/A"}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                ID: {user._id.slice(-8)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                          {user.email}
                        </td>
                        <td className="px-6 py-4">
                          <motion.select
                            value={user.role || "user"}
                            onChange={(e) =>
                              handleChangeRole(user._id, e.target.value)
                            }
                            disabled={actionLoading === user._id}
                            className="px-3 py-1 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
                            whileHover={{ scale: 1.05 }}
                            whileFocus={{ scale: 1.05 }}
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </motion.select>
                        </td>
                        <td className="px-6 py-4">
                          <motion.span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              user.blocked
                                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            }`}
                            animate={{
                              scale: user.blocked ? [1, 1.05, 1] : 1,
                            }}
                            transition={{ duration: 2, repeat: user.blocked ? Infinity : 0 }}
                          >
                            {user.blocked ? "Blocked" : "Active"}
                          </motion.span>
                        </td>
                        <td className="px-6 py-4">
                          <motion.button
                            onClick={() =>
                              handleBlockUser(user._id, user.blocked)
                            }
                            disabled={actionLoading === user._id}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                              user.blocked
                                ? "bg-green-500 hover:bg-green-600 text-white"
                                : "bg-red-500 hover:bg-red-600 text-white"
                            } disabled:opacity-50`}
                            whileHover={{ scale: 1.05, y: -1 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {actionLoading === user._id ? (
                              <motion.div
                                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity }}
                              />
                            ) : user.blocked ? (
                              "Unblock"
                            ) : (
                              "Block"
                            )}
                          </motion.button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <motion.div
                className="relative bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 backdrop-blur-xl rounded-2xl p-6 border border-blue-200/50 dark:border-blue-700/50 overflow-hidden group"
                whileHover={{ scale: 1.02, y: -5 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  animate={{
                    backgroundPosition: ["0% 0%", "100% 100%"],
                  }}
                  transition={{ duration: 20, repeat: Infinity }}
                />
                <div className="relative z-10">
                  <motion.div
                    className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mb-4 shadow-lg"
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  >
                    <UserGroupIcon className="w-6 h-6 text-white" />
                  </motion.div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                    Total Users
                  </p>
                  <motion.p
                    className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mt-2"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    {users.length}
                  </motion.p>
                </div>
              </motion.div>

              <motion.div
                className="relative bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 backdrop-blur-xl rounded-2xl p-6 border border-green-200/50 dark:border-green-700/50 overflow-hidden group"
                whileHover={{ scale: 1.02, y: -5 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-green-400/10 to-emerald-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  animate={{
                    backgroundPosition: ["0% 0%", "100% 100%"],
                  }}
                  transition={{ duration: 20, repeat: Infinity }}
                />
                <div className="relative z-10">
                  <motion.div
                    className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-4 shadow-lg"
                    animate={{ rotate: [0, -5, 5, 0] }}
                    transition={{ duration: 4, repeat: Infinity, delay: 1 }}
                  >
                    <CheckCircleIcon className="w-6 h-6 text-white" />
                  </motion.div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                    Active Users
                  </p>
                  <motion.p
                    className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mt-2"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                  >
                    {users.filter((u) => !u.blocked).length}
                  </motion.p>
                </div>
              </motion.div>

              <motion.div
                className="relative bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 backdrop-blur-xl rounded-2xl p-6 border border-red-200/50 dark:border-red-700/50 overflow-hidden group"
                whileHover={{ scale: 1.02, y: -5 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-red-400/10 to-rose-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  animate={{
                    backgroundPosition: ["0% 0%", "100% 100%"],
                  }}
                  transition={{ duration: 20, repeat: Infinity }}
                />
                <div className="relative z-10">
                  <motion.div
                    className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-500 rounded-xl flex items-center justify-center mb-4 shadow-lg"
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity, delay: 2 }}
                  >
                    <XCircleIcon className="w-6 h-6 text-white" />
                  </motion.div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                    Blocked Users
                  </p>
                  <motion.p
                    className="text-4xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent mt-2"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                  >
                    {users.filter((u) => u.blocked).length}
                  </motion.p>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}

        {/* Email Tab */}
        {activeTab === "email" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 p-8 overflow-hidden relative"
          >
            {/* Animated background for email tab */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-purple-400/5 to-pink-400/5 opacity-0"
              animate={{ opacity: [0, 0.3, 0] }}
              transition={{ duration: 8, repeat: Infinity }}
            />

            <div className="relative z-10">
              <motion.div
                className="mb-6"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <motion.h2
                  className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-200 dark:to-slate-400 bg-clip-text text-transparent mb-2"
                  animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                  transition={{ duration: 5, repeat: Infinity }}
                >
                  Send Email to Users
                </motion.h2>
                <motion.p
                  className="text-sm text-slate-500 dark:text-slate-400"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  Selected {selectedUsers.length} user(s). Go to Users tab to select recipients.
                </motion.p>
              </motion.div>

              <motion.div
                className="space-y-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Subject
                  </label>
                  <motion.input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Enter email subject..."
                    className="w-full px-4 py-3 bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm border border-slate-300 dark:border-slate-600 rounded-xl text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    whileFocus={{ scale: 1.01, boxShadow: "0 0 0 3px rgba(168, 85, 247, 0.1)" }}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Message
                  </label>
                  <motion.textarea
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    placeholder="Enter your message..."
                    rows={8}
                    className="w-full px-4 py-3 bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm border border-slate-300 dark:border-slate-600 rounded-xl text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none transition-all duration-200"
                    whileFocus={{ scale: 1.01, boxShadow: "0 0 0 3px rgba(168, 85, 247, 0.1)" }}
                  />
                </motion.div>

                <motion.button
                  onClick={handleSendEmail}
                  disabled={
                    sending ||
                    !emailSubject ||
                    !emailMessage ||
                    selectedUsers.length === 0
                  }
                  className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 text-white py-4 rounded-xl font-medium hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 relative overflow-hidden group"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    initial={false}
                  />
                  <div className="relative z-10 flex items-center space-x-2">
                    {sending ? (
                      <>
                        <motion.div
                          className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity }}
                        />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <motion.div
                          animate={{ x: [0, 3, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <EnvelopeIcon className="w-5 h-5" />
                        </motion.div>
                        <span>Send Email</span>
                      </>
                    )}
                  </div>
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

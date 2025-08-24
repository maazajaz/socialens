"use client";

import { motion } from "framer-motion";
import Loader from "@/components/shared/Loader";
import AdminManagement from "@/components/shared/AdminManagement";
import AdminUserManagement from "@/components/shared/AdminUserManagement";
import { useGetAdminStats, useCheckAdminAccess } from "@/lib/react-query/queriesAndMutations";

const AdminDashboard = () => {
  const { data: hasAdminAccess, isLoading: isCheckingAccess } = useCheckAdminAccess();
  const { data: stats, isLoading: isLoadingStats, isError } = useGetAdminStats();

  // Show loading while checking admin access
  if (isCheckingAccess) {
    return (
      <div className="flex-center w-full h-full">
        <Loader />
      </div>
    );
  }

  // Show access denied if not admin
  if (!hasAdminAccess) {
    return (
      <div className="common-container">
        <div className="flex-center w-full h-full">
          <div className="text-center">
            <img
              src="/assets/icons/filter.svg"
              width={48}
              height={48}
              alt="access denied"
              className="invert-white mx-auto mb-4 opacity-50"
            />
            <h2 className="h3-bold text-light-1 mb-2">Access Denied</h2>
            <p className="text-light-3">
              You don't have permission to access the admin dashboard.
              <br />
              Contact an administrator if you believe this is an error.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show loading while fetching stats
  if (isLoadingStats) {
    return (
      <div className="flex-center w-full h-full">
        <Loader />
      </div>
    );
  }

  // Show error if stats loading failed
  if (isError) {
    return (
      <div className="flex-center w-full h-full">
        <p className="text-light-4">Error loading admin statistics</p>
      </div>
    );
  }

  return (
    <div className="common-container">
      <div className="admin-container">
        <div className="flex gap-2 w-full max-w-5xl mb-8">
          <img
            src="/assets/icons/people.svg"
            width={36}
            height={36}
            alt="admin"
            className="invert-white"
          />
          <h2 className="h3-bold md:h2-bold text-left w-full">Admin Dashboard</h2>
        </div>

        {stats && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 w-full max-w-5xl">
            {/* Total Users */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="stat-card"
            >
              <div className="flex items-center gap-4">
                <div className="stat-icon-wrapper bg-primary-500/10">
                  <img
                    src="/assets/icons/people.svg"
                    alt="users"
                    width={24}
                    height={24}
                    className="invert-white"
                  />
                </div>
                <div>
                  <h3 className="stat-number">{stats.totalUsers.toLocaleString()}</h3>
                  <p className="stat-label">Total Users</p>
                </div>
              </div>
            </motion.div>

            {/* Total Posts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="stat-card"
            >
              <div className="flex items-center gap-4">
                <div className="stat-icon-wrapper bg-blue-500/10">
                  <img
                    src="/assets/icons/posts.svg"
                    alt="posts"
                    width={24}
                    height={24}
                    className="invert-white"
                  />
                </div>
                <div>
                  <h3 className="stat-number">{stats.totalPosts.toLocaleString()}</h3>
                  <p className="stat-label">Total Posts</p>
                </div>
              </div>
            </motion.div>

            {/* Active Today */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="stat-card"
            >
              <div className="flex items-center gap-4">
                <div className="stat-icon-wrapper bg-green-500/10">
                  <img
                    src="/assets/icons/home.svg"
                    alt="active"
                    width={24}
                    height={24}
                    className="invert-white"
                  />
                </div>
                <div>
                  <h3 className="stat-number">{stats.activeToday.toLocaleString()}</h3>
                  <p className="stat-label">Active Today</p>
                </div>
              </div>
            </motion.div>

            {/* Total Likes */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              className="stat-card"
            >
              <div className="flex items-center gap-4">
                <div className="stat-icon-wrapper bg-red-500/10">
                  <img
                    src="/assets/icons/like.svg"
                    alt="likes"
                    width={24}
                    height={24}
                    className="invert-white"
                  />
                </div>
                <div>
                  <h3 className="stat-number">{stats.totalLikes.toLocaleString()}</h3>
                  <p className="stat-label">Total Likes</p>
                </div>
              </div>
            </motion.div>

            {/* Total Comments */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
              className="stat-card"
            >
              <div className="flex items-center gap-4">
                <div className="stat-icon-wrapper bg-purple-500/10">
                  <img
                    src="/assets/icons/chat.svg"
                    alt="comments"
                    width={24}
                    height={24}
                    className="invert-white"
                  />
                </div>
                <div>
                  <h3 className="stat-number">{stats.totalComments.toLocaleString()}</h3>
                  <p className="stat-label">Total Comments</p>
                </div>
              </div>
            </motion.div>

            {/* New Users This Week */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.6 }}
              className="stat-card"
            >
              <div className="flex items-center gap-4">
                <div className="stat-icon-wrapper bg-orange-500/10">
                  <img
                    src="/assets/icons/add-post.svg"
                    alt="new users"
                    width={24}
                    height={24}
                    className="invert-white"
                  />
                </div>
                <div>
                  <h3 className="stat-number">{stats.newUsersThisWeek.toLocaleString()}</h3>
                  <p className="stat-label">New Users This Week</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.7 }}
          className="mt-10 w-full max-w-5xl"
        >
          <div className="glassmorphism border border-dark-4 rounded-xl p-6">
            <h3 className="h3-bold mb-4">Platform Overview</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="text-light-2">
                <p className="text-sm mb-2">
                  <span className="text-light-1 font-semibold">Engagement Rate:</span>{" "}
                  {stats && stats.totalPosts > 0
                    ? ((stats.totalLikes + stats.totalComments) / stats.totalPosts).toFixed(1)
                    : "0"}{" "}
                  interactions per post
                </p>
                <p className="text-sm mb-2">
                  <span className="text-light-1 font-semibold">User Activity:</span>{" "}
                  {stats && stats.totalUsers > 0
                    ? ((stats.activeToday / stats.totalUsers) * 100).toFixed(1)
                    : "0"}% daily active users
                </p>
              </div>
              <div className="text-light-2">
                <p className="text-sm mb-2">
                  <span className="text-light-1 font-semibold">Growth:</span>{" "}
                  {stats && stats.totalUsers > 0
                    ? ((stats.newUsersThisWeek / stats.totalUsers) * 100).toFixed(1)
                    : "0"}% new users this week
                </p>
                <p className="text-sm">
                  <span className="text-light-1 font-semibold">Content:</span>{" "}
                  {stats && stats.totalUsers > 0
                    ? (stats.totalPosts / stats.totalUsers).toFixed(1)
                    : "0"} posts per user
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Admin Management Section */}
        <AdminManagement />
        
        {/* User & Content Management Section */}
        <AdminUserManagement />
      </div>
    </div>
  );
};

export default AdminDashboard;

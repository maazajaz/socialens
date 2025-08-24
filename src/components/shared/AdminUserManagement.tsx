"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import Loader from "@/components/shared/Loader";
import { 
  useGetAdminAllUsers, 
  useToggleUserActivation,
  useGetAdminAllPosts,
  useAdminDeletePost
} from "@/lib/react-query/queriesAndMutations";

interface AdminUser {
  id: string;
  name: string;
  username: string;
  email: string;
  image_url: string;
  bio: string;
  is_admin: boolean;
  is_active: boolean;
  is_deactivated: boolean;
  last_active: string;
  created_at: string;
}

interface AdminPost {
  id: string;
  caption: string;
  image_url: string;
  location: string;
  tags: string;
  created_at: string;
  updated_at: string;
  creator: {
    id: string;
    name: string;
    username: string;
    image_url: string;
  };
}

const AdminUserManagement = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState<"users" | "posts">("users");
  const { toast } = useToast();

  const { 
    data: usersData, 
    isLoading: isLoadingUsers
  } = useGetAdminAllUsers(currentPage, 10, searchTerm, {
    enabled: selectedTab === "users" // Only fetch when users tab is selected
  });

  const { 
    data: postsData, 
    isLoading: isLoadingPosts
  } = useGetAdminAllPosts(currentPage, 10, searchTerm, {
    enabled: selectedTab === "posts" // Only fetch when posts tab is selected
  });

  const { mutate: toggleActivation, isPending: isToggling } = useToggleUserActivation();
  const { mutate: deletePost, isPending: isDeletingPost } = useAdminDeletePost();

  // Helper function to get user status with smart logic
  const getUserStatus = (user: AdminUser) => {
    if (user.is_deactivated) {
      return { color: 'bg-red-500', label: 'Deactivated', textColor: 'text-red-400' };
    }

    if (!user.last_active || user.last_active === null) {
      return { color: 'bg-gray-500', label: 'Never active', textColor: 'text-gray-400' };
    }

    const lastActive = new Date(user.last_active);
    const now = new Date();
    const timeDiff = now.getTime() - lastActive.getTime();
    const minutesDiff = timeDiff / (1000 * 60);

    // Online: Active within last 5 minutes AND is_active flag is true
    if (user.is_active && minutesDiff <= 5) {
      return { color: 'bg-green-500', label: 'Online', textColor: 'text-green-400' };
    } 
    // Recently active: Within last 15 minutes
    else if (minutesDiff <= 15) {
      return { color: 'bg-green-400', label: 'Just left', textColor: 'text-green-300' };
    }
    // Away: 15 minutes to 1 hour
    else if (minutesDiff <= 60) {
      const mins = Math.round(minutesDiff);
      return { color: 'bg-yellow-500', label: `${mins}m ago`, textColor: 'text-yellow-400' };
    } 
    // Hours: 1 hour to 24 hours
    else if (minutesDiff <= 1440) { // 24 hours
      const hoursAgo = Math.floor(minutesDiff / 60);
      return { color: 'bg-orange-500', label: `${hoursAgo}h ago`, textColor: 'text-orange-400' };
    } 
    // Days: More than 24 hours
    else if (minutesDiff <= 10080) { // 7 days
      const daysAgo = Math.floor(minutesDiff / 1440);
      return { color: 'bg-gray-400', label: `${daysAgo}d ago`, textColor: 'text-gray-400' };
    }
    // Long time inactive: More than 7 days
    else {
      const daysAgo = Math.floor(minutesDiff / 1440);
      return { color: 'bg-gray-600', label: `${daysAgo}d ago`, textColor: 'text-gray-500' };
    }
  };

  const handleToggleActivation = (userId: string, userName: string, isCurrentlyDeactivated: boolean) => {
    const action = isCurrentlyDeactivated ? "activate" : "deactivate";
    const confirmMessage = isCurrentlyDeactivated 
      ? `Are you sure you want to activate ${userName}? They will be able to access their account again.`
      : `Are you sure you want to deactivate ${userName}? They will not be able to log in until reactivated.`;
    
    if (confirm(confirmMessage)) {
      toggleActivation(userId, {
        onSuccess: (result) => {
          const resultAction = result.isDeactivated ? "deactivated" : "activated";
          toast({
            title: "Success",
            description: `${userName} has been ${resultAction}.`,
          });
        },
        onError: (error: any) => {
          toast({
            title: "Error",
            description: error.message || `Failed to ${action} user.`,
            variant: "destructive",
          });
        },
      });
    }
  };

  const handleDeletePost = (postId: string, postCaption: string) => {
    if (confirm(`Are you sure you want to delete this post: "${postCaption.slice(0, 50)}..."? This action cannot be undone.`)) {
      deletePost(postId, {
        onSuccess: () => {
          toast({
            title: "Success",
            description: "Post has been deleted.",
          });
        },
        onError: (error: any) => {
          toast({
            title: "Error",
            description: error.message || "Failed to delete post.",
            variant: "destructive",
          });
        },
      });
    }
  };

  const renderUsers = () => {
    if (isLoadingUsers) {
      return (
        <div className="flex-center w-full py-8">
          <Loader />
        </div>
      );
    }

    if (!usersData?.users || usersData.users.length === 0) {
      return (
        <div className="text-center py-8">
          <img
            src="/assets/icons/people.svg"
            width={48}
            height={48}
            alt="no users"
            className="invert-white mx-auto mb-4 opacity-50"
          />
          <p className="text-light-3">No users found</p>
        </div>
      );
    }

    return (
      <>
        <div className="grid gap-4">
          {usersData.users.map((user: AdminUser, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.1 }}
              className="p-4 bg-dark-3/30 rounded-lg border border-dark-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img
                    src={user.image_url || "/assets/icons/profile-placeholder.svg"}
                    alt={user.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-light-1">{user.name}</h3>
                      {user.is_admin && (
                        <span className="px-2 py-1 text-xs bg-primary-500/20 text-primary-500 rounded-full border border-primary-500/30">
                          Admin
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-light-3">@{user.username}</p>
                    <p className="text-xs text-light-4">{user.email}</p>
                    <div className="flex gap-4 mt-2 text-xs text-light-3">
                      <span>Joined: {new Date(user.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {!user.is_admin && (
                    <Button
                      onClick={() => handleToggleActivation(user.id, user.name, user.is_deactivated)}
                      disabled={isToggling}
                      variant={user.is_deactivated ? "default" : "destructive"}
                      size="sm"
                      className={
                        user.is_deactivated 
                          ? "text-green-500 hover:text-green-400 hover:bg-green-500/10 border-green-500/20" 
                          : "text-red-500 hover:text-red-400 hover:bg-red-500/10"
                      }
                    >
                      {isToggling ? (
                        <Loader />
                      ) : user.is_deactivated ? (
                        "Activate"
                      ) : (
                        "Deactivate"
                      )}
                    </Button>
                  )}
                  
                  {/* Show user status */}
                  <div className="flex items-center gap-1">
                    {(() => {
                      const status = getUserStatus(user);
                      return (
                        <>
                          <div className={`w-2 h-2 rounded-full ${status.color}`} />
                          <span className={`text-xs ${status.textColor}`}>
                            {status.label}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-dark-4">
          <div className="text-sm text-light-3">
            Page {usersData.pagination.page} of {usersData.pagination.totalPages} 
            ({usersData.pagination.total} total users)
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              variant="outline"
              size="sm"
            >
              Previous
            </Button>
            <Button
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={currentPage >= usersData.pagination.totalPages}
              variant="outline"
              size="sm"
            >
              Next
            </Button>
          </div>
        </div>
      </>
    );
  };

  const renderPosts = () => {
    if (isLoadingPosts) {
      return (
        <div className="flex-center w-full py-8">
          <Loader />
        </div>
      );
    }

    if (!postsData?.posts || postsData.posts.length === 0) {
      return (
        <div className="text-center py-8">
          <img
            src="/assets/icons/posts.svg"
            width={48}
            height={48}
            alt="no posts"
            className="invert-white mx-auto mb-4 opacity-50"
          />
          <p className="text-light-3">No posts found</p>
        </div>
      );
    }

    return (
      <>
        <div className="grid gap-4">
          {postsData.posts.map((post: any, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.1 }}
              className="p-4 bg-dark-3/30 rounded-lg border border-dark-4"
            >
              <div className="flex gap-4">
                {post.image_url && (
                  <img
                    src={post.image_url}
                    alt="Post image"
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                )}
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <img
                      src={post.creator.image_url || "/assets/icons/profile-placeholder.svg"}
                      alt={post.creator.name}
                      className="w-6 h-6 rounded-full"
                    />
                    <span className="text-sm text-light-2">{post.creator.name}</span>
                    <span className="text-xs text-light-4">@{post.creator.username}</span>
                  </div>
                  
                  <p className="text-light-1 mb-2 line-clamp-2">{post.caption}</p>
                  
                  <div className="flex gap-4 text-xs text-light-3">
                    <span>Posted: {new Date(post.created_at).toLocaleDateString()}</span>
                    {post.location && <span>📍 {post.location}</span>}
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Button
                    onClick={() => handleDeletePost(post.id, post.caption)}
                    disabled={isDeletingPost}
                    variant="destructive"
                    size="sm"
                    className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                  >
                    {isDeletingPost ? (
                      <Loader />
                    ) : (
                      <img 
                        src="/assets/icons/delete.svg" 
                        alt="delete" 
                        width={16} 
                        height={16}
                        className="filter invert-[.25] sepia-100 saturate-[1000%] hue-rotate-[315deg] brightness-125"
                      />
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-dark-4">
          <div className="text-sm text-light-3">
            Page {postsData.pagination.page} of {postsData.pagination.totalPages} 
            ({postsData.pagination.total} total posts)
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              variant="outline"
              size="sm"
            >
              Previous
            </Button>
            <Button
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={currentPage >= postsData.pagination.totalPages}
              variant="outline"
              size="sm"
            >
              Next
            </Button>
          </div>
        </div>
      </>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-6xl"
    >
      <div className="bg-dark-2/50 rounded-xl p-6 border border-dark-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-light-1">Content Management</h3>
          
          {/* Tab Switcher */}
          <div className="flex bg-dark-3/30 rounded-lg p-1">
            <Button
              onClick={() => {
                setSelectedTab("users");
                setCurrentPage(1);
                setSearchTerm("");
              }}
              className={`px-4 py-2 text-sm rounded-md transition-all ${
                selectedTab === "users"
                  ? "bg-primary-500 text-white"
                  : "text-light-3 hover:text-light-1 bg-transparent"
              }`}
            >
              Users
            </Button>
            <Button
              onClick={() => {
                setSelectedTab("posts");
                setCurrentPage(1);
                setSearchTerm("");
              }}
              className={`px-4 py-2 text-sm rounded-md transition-all ${
                selectedTab === "posts"
                  ? "bg-primary-500 text-white"
                  : "text-light-3 hover:text-light-1 bg-transparent"
              }`}
            >
              Posts
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <Input
            type="text"
            placeholder={selectedTab === "users" ? "Search users by name, username, or email..." : "Search posts by caption, location, or tags..."}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset to first page when searching
            }}
            className="w-full bg-dark-3/30 border-dark-4 focus:border-primary-500"
          />
        </div>

        {/* Content */}
        {selectedTab === "users" ? renderUsers() : renderPosts()}
      </div>
    </motion.div>
  );
};

export default AdminUserManagement;

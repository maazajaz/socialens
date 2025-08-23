"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import Loader from "@/components/shared/Loader";
import { useGetAdminUsers, useAddAdminUser, useRemoveAdminUser } from "@/lib/react-query/queriesAndMutations";
import { useUserContext } from "@/context/SupabaseAuthContext";

const AdminManagement = () => {
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const { toast } = useToast();
  const { user: currentUser } = useUserContext();

  const { data: adminUsers, isLoading: isLoadingAdmins } = useGetAdminUsers();
  const { mutate: addAdmin, isPending: isAddingAdminUser } = useAddAdminUser();
  const { mutate: removeAdmin, isPending: isRemovingAdmin } = useRemoveAdminUser();

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newAdminEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newAdminEmail.trim())) {
      toast({
        title: "Error",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    addAdmin(newAdminEmail.trim().toLowerCase(), {
      onSuccess: () => {
        toast({
          title: "Success",
          description: `${newAdminEmail} has been added as an admin.`,
        });
        setNewAdminEmail("");
        setIsAddingAdmin(false);
        // React Query will automatically invalidate and refetch
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: error.message || "Failed to add admin user.",
          variant: "destructive",
        });
      },
    });
  };

  const handleRemoveAdmin = (userId: string, userEmail: string) => {
    // Check if trying to remove own admin privileges
    if (currentUser?.id === userId) {
      toast({
        title: "Action Not Allowed",
        description: "You cannot remove admin privileges from yourself.",
        variant: "destructive",
      });
      return;
    }

    // Check if trying to remove initial admin
    const initialAdmins = ['admin@socialens.com', 'maazajaz1234@gmail.com', 'test@admin.com'];
    if (initialAdmins.includes(userEmail.toLowerCase())) {
      toast({
        title: "Action Not Allowed",
        description: "Cannot remove initial admin privileges.",
        variant: "destructive",
      });
      return;
    }

    if (window.confirm(`Are you sure you want to remove admin privileges from ${userEmail}?`)) {
      removeAdmin(userId, {
        onSuccess: () => {
          toast({
            title: "Success",
            description: `Admin privileges removed from ${userEmail}.`,
          });
          // React Query will automatically invalidate and refetch
        },
        onError: (error: any) => {
          console.error('Remove admin error:', error);
          toast({
            title: "Error", 
            description: error?.message || error?.error?.message || "Failed to remove admin user.",
            variant: "destructive",
          });
        },
      });
    }
  };

  if (isLoadingAdmins) {
    return (
      <div className="flex-center w-full h-32">
        <Loader />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.8 }}
      className="mt-10 w-full max-w-5xl"
    >
      <div className="glassmorphism border border-dark-4 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="h3-bold">Admin Management</h3>
          <Button
            onClick={() => setIsAddingAdmin(!isAddingAdmin)}
            className="shad-button_primary"
            disabled={isAddingAdminUser || isRemovingAdmin}
          >
            <img 
              src="/assets/icons/add-post.svg" 
              alt="add" 
              width={16} 
              height={16} 
              className="invert-white"
            />
            Add Admin
          </Button>
        </div>

        {/* Add Admin Form */}
        {isAddingAdmin && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-4 border border-dark-4 rounded-lg bg-dark-3/20"
          >
            <form onSubmit={handleAddAdmin} className="space-y-4">
              <div>
                <label htmlFor="adminEmail" className="text-sm font-medium text-light-2 mb-2 block">
                  Email Address
                </label>
                <Input
                  id="adminEmail"
                  type="email"
                  placeholder="Enter email address"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  className="shad-input"
                  disabled={isAddingAdminUser}
                />
                <p className="text-xs text-light-3 mt-1">
                  User must already have an account in the system
                </p>
              </div>
              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  onClick={() => {
                    setIsAddingAdmin(false);
                    setNewAdminEmail("");
                  }}
                  className="shad-button_dark_4 w-32 h-10"
                  disabled={isAddingAdminUser}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isAddingAdminUser || !newAdminEmail.trim()}
                  className="shad-button_primary w-32 h-10"
                >
                  {isAddingAdminUser ? (
                    <>
                      <Loader /> Adding...
                    </>
                  ) : (
                    "Add Admin"
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Admin Users List */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-light-1 mb-4">
            Current Admins ({adminUsers?.length || 0})
          </h4>
          
          {adminUsers && adminUsers.length > 0 ? (
            <div className="grid gap-3">
              {adminUsers.map((admin, index) => (
                <motion.div
                  key={admin.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-dark-3/30 rounded-lg border border-dark-4"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={admin.image_url || "/assets/icons/profile-placeholder.svg"}
                      alt={admin.name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <p className="font-semibold text-light-1">{admin.name}</p>
                      <p className="text-sm text-light-3">@{admin.username}</p>
                      <p className="text-xs text-light-4">{admin.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Show if initial admin */}
                    {['admin@socialens.com', 'maazajaz1234@gmail.com', 'test@admin.com'].includes(admin.email.toLowerCase()) && (
                      <span className="px-2 py-1 text-xs bg-primary-500/20 text-primary-500 rounded-full border border-primary-500/30">
                        Super Admin
                      </span>
                    )}
                    
                    {/* Remove button - disabled for initial admins and current user */}
                    <Button
                      onClick={() => handleRemoveAdmin(admin.id, admin.email)}
                      disabled={
                        isRemovingAdmin || 
                        ['admin@socialens.com', 'maazajaz1234@gmail.com', 'test@admin.com'].includes(admin.email.toLowerCase()) ||
                        currentUser?.id === admin.id
                      }
                      className="text-red-500 hover:text-red-400 hover:bg-red-500/10 p-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      size="sm"
                      title={
                        currentUser?.id === admin.id ? "Cannot remove yourself" :
                        ['admin@socialens.com', 'maazajaz1234@gmail.com', 'test@admin.com'].includes(admin.email.toLowerCase()) ? "Cannot remove super admin" :
                        "Remove admin privileges"
                      }
                    >
                      {isRemovingAdmin ? (
                        <Loader />
                      ) : (
                        <img 
                          src="/assets/icons/delete.svg" 
                          alt="remove" 
                          width={16} 
                          height={16}
                          className="filter invert-[.25] sepia-100 saturate-[1000%] hue-rotate-[315deg] brightness-125"
                        />
                      )}
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <img
                src="/assets/icons/people.svg"
                width={48}
                height={48}
                alt="no admins"
                className="invert-white mx-auto mb-4 opacity-50"
              />
              <p className="text-light-3">No admin users found</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default AdminManagement;

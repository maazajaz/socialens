"use client";

import { useEffect } from "react";
import Loader from "@/components/shared/Loader";
import UserCard from "@/components/shared/UserCard";
import { useToast } from "@/components/ui/use-toast";
import { useUserContext } from "@/context/SupabaseAuthContext";

import { useGetUsers } from "@/lib/react-query/queriesAndMutations";

const AllUsers = () => {
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading, isAuthenticated } = useUserContext();

  // Debug: Log authentication state for troubleshooting
  useEffect(() => {
    console.log('👥 ALL USERS AUTH DEBUG:', {
      user: user?.id || 'no-user',
      isLoading: isAuthLoading,
      isAuthenticated,
      timestamp: new Date().toISOString()
    });
  }, [user, isAuthLoading, isAuthenticated]);

  const { data: creators, isLoading, isError: isErrorCreators } = useGetUsers();

  // Filter out current user from the list
  const otherUsers = creators?.filter((creator) => creator.id !== user?.id) || [];

  if (isErrorCreators) {
    toast({ title: "Something went wrong." });
    
    return;
  }

  return (
    <div className="common-container">
      <div className="user-container">
        <h2 className="h3-bold md:h2-bold text-left w-full">All Users</h2>
        {isLoading && !creators ? (
          <Loader />
        ) : (
          <ul className="user-grid">
            {otherUsers?.map((creator) => (
              <li key={creator?.id} className="flex-1 min-w-[200px] w-full  ">
                <UserCard user={creator} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AllUsers;

"use client";

import { useState } from "react";
import Loader from "@/components/shared/Loader";
import UserCard from "@/components/shared/UserCard";
import { useToast } from "@/components/ui/use-toast";
import { useUserContext } from "@/context/SupabaseAuthContext";
import { Input } from "@/components/ui/input";
import useDebounce from "@/hooks/useDebounce";

import { useGetUsers, useSearchUsers } from "@/lib/react-query/queriesAndMutations";

const AllUsers = () => {
  const { toast } = useToast();
  const { user } = useUserContext();
  const [searchValue, setSearchValue] = useState("");
  
  // Debounce search input to avoid excessive API calls
  const debouncedSearch = useDebounce(searchValue, 300);

  const { data: allUsers, isLoading: isLoadingUsers, isError: isErrorUsers } = useGetUsers();
  const { data: searchResults, isLoading: isSearching, isError: isErrorSearch } = useSearchUsers(debouncedSearch, 50);

  // Determine which data to show
  const isSearchMode = debouncedSearch.trim().length > 0;
  const displayUsers = isSearchMode ? searchResults : allUsers;
  const isLoading = isSearchMode ? isSearching : isLoadingUsers;
  const isError = isSearchMode ? isErrorSearch : isErrorUsers;

  // Filter out current user from the list
  const otherUsers = displayUsers?.filter((creator) => creator.id !== user?.id) || [];

  if (isError) {
    toast({ title: "Something went wrong." });
    
    return;
  }

  return (
    <div className="common-container">
      <div className="user-container">
        <div className="flex flex-col gap-6 w-full">
          <h2 className="h3-bold md:h2-bold text-left w-full">All Users</h2>
          
          {/* Full Width Search Input */}
          <div className="w-full relative">
            <div className="flex items-center gap-3 w-full h-12 bg-dark-4 rounded-lg px-4 transition-all duration-200 focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-opacity-50">
              <img
                src="/assets/icons/search.svg"
                width={20}
                height={20}
                alt="search"
                className="opacity-50"
              />
              <Input
                type="text"
                placeholder="Search users by name or username..."
                className="flex-1 h-full bg-transparent border-none outline-none text-white placeholder:text-light-4 text-base focus-visible:ring-0 focus-visible:ring-offset-0"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
              {searchValue && (
                <button
                  onClick={() => setSearchValue("")}
                  className="text-light-4 hover:text-white transition-colors p-1"
                  type="button"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="w-full">
          {isLoading && !displayUsers ? (
            <div className="flex justify-center items-center py-20">
              <Loader />
            </div>
          ) : (
            <>
              {/* Search Results Info */}
              {isSearchMode && (
                <div className="mb-6 flex items-center gap-2 text-light-4 text-sm">
                  {isSearching ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-primary-500 border-t-transparent rounded-full"></div>
                      <span>Searching...</span>
                    </>
                  ) : (
                    <>
                      <span>Found {otherUsers.length} user{otherUsers.length !== 1 ? 's' : ''} matching</span>
                      <span className="text-primary-500 font-semibold">"{debouncedSearch}"</span>
                    </>
                  )}
                </div>
              )}
              
              <ul className="user-grid">
                {otherUsers?.length > 0 ? (
                  otherUsers.map((creator) => (
                    <li key={creator?.id} className="w-full">
                      <UserCard user={creator} />
                    </li>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <img
                      src="/assets/icons/people.svg"
                      width={80}
                      height={80}
                      alt="no users"
                      className="opacity-30 mb-4"
                    />
                    <p className="text-light-4 text-lg mb-2">
                      {isSearchMode 
                        ? "No users found" 
                        : "No users available"
                      }
                    </p>
                    <p className="text-light-4 text-sm max-w-md">
                      {isSearchMode 
                        ? `We couldn't find any users matching "${debouncedSearch}". Try searching with a different term.`
                        : "There are no other users to display at the moment."
                      }
                    </p>
                  </div>
                )}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AllUsers;

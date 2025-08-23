"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "../ui/button";
import { useUserContext } from "@/context/SupabaseAuthContext";
import { useSignOutAccount, useCheckAdminAccess } from "@/lib/react-query/queriesAndMutations";
import NotificationBell from "@/components/shared/NotificationBell";

const Topbar = () => {
  const router = useRouter();
  const { user } = useUserContext();
  const { mutate: signOut, isSuccess } = useSignOutAccount();
  const { data: isAdmin } = useCheckAdminAccess();

  useEffect(() => {
    if (isSuccess) router.push("/sign-in");
  }, [isSuccess, router]);

  return (
    <section className="topbar">
      <div className="flex-between py-4 px-5">
        <Link href="/" className="flex gap-3 items-center">
          <img
            src="/assets/images/logo.svg"
            alt="logo"
            width={130}
            height={325}
          />
        </Link>

        <div className="flex gap-2 items-center">
          <NotificationBell />
          
          {/* Admin Button - only show if user has admin access */}
          {isAdmin && (
            <Link href="/admin">
              <Button
                className="shad-button_ghost p-2"
                title="Admin Dashboard"
              >
                <img 
                  src="/assets/icons/filter.svg" 
                  alt="admin" 
                  width={18}
                  height={18}
                />
              </Button>
            </Link>
          )}
          
          <Button
            className="shad-button_ghost p-2"
            onClick={() => signOut()}>
            <img src="/assets/icons/logout.svg" alt="logout" width={18} height={18} />
          </Button>
          <Link href={`/profile/${user?.id}`} className="flex-center">
            <img
              src={user?.image_url || "/assets/icons/profile-placeholder.svg"}
              alt="profile"
              className="h-7 w-7 rounded-full"
            />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Topbar;

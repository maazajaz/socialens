"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";


import { useUserContext } from "@/context/SupabaseAuthContext";
import { useSignOutAccount } from "@/lib/react-query/queriesAndMutations";
import NotificationBell from "@/components/shared/NotificationBell";

const Topbar = () => {
  const router = useRouter();
  const { user } = useUserContext();
  const { mutate: signOut, isSuccess } = useSignOutAccount();

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

<<<<<<< HEAD
        <div className="flex gap-4 items-center">
          <NotificationBell />
          <Button
            variant="ghost"
=======
        <div className="flex gap-4">
          <button
>>>>>>> aac72d0c28f60d67fcffa29b2806f437ad428fd7
            className="shad-button_ghost"
            onClick={() => signOut()}>
            <img src="/assets/icons/logout.svg" alt="logout" />
          </button>
          <Link href={`/profile/${user?.id}`} className="flex-center gap-3">
            <img
              src={user?.image_url || "/assets/icons/profile-placeholder.svg"}
              alt="profile"
              className="h-8 w-8 rounded-full"
            />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Topbar;

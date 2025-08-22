"use client";

import Link from "next/link";
import { useUserContext } from "@/context/SupabaseAuthContext";

const SharedPostTopbar = () => {
  const { user } = useUserContext();

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
        <div className="flex gap-4">
          <Link href="/sign-in" className="flex-center gap-3">
            <img
              src={user?.image_url || "/assets/icons/profile-placeholder.svg"}
              alt="profile"
              className="h-8 w-8 rounded-full cursor-pointer"
            />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default SharedPostTopbar;

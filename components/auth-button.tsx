"use client";

import { LogIn, UserRound } from "lucide-react";
import { signIn, signOut, useSession } from "next-auth/react";

export function AuthButton({ label }: { label: string }) {
  const { data: session, status } = useSession();

  if (status === "authenticated") {
    return (
      <button className="btn" onClick={() => signOut()} type="button">
        <UserRound size={18} aria-hidden="true" />
        {session.user?.name ?? session.user?.email ?? "Account"}
      </button>
    );
  }

  return (
    <button className="btn btnPrimary" onClick={() => signIn("google")} type="button">
      <LogIn size={18} aria-hidden="true" />
      {label}
    </button>
  );
}

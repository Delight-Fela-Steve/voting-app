"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui";

type LogoutButtonProps = {
  className?: string;
};

export function LogoutButton({ className = "" }: LogoutButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={() => signOut({ callbackUrl: "/admin/login" })}
      className={className}
    >
      Log out
    </Button>
  );
}

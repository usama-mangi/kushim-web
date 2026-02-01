"use client";

import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const { logout } = useAuthStore();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => logout()}
      className="text-muted-foreground hover:text-foreground"
    >
      <LogOut className="h-4 w-4 mr-2" />
      Sign out
    </Button>
  );
}

"use client";

import { useAuthStore } from "@/store/auth";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { 
  User, 
  Settings, 
  Users, 
  HelpCircle, 
  FileText, 
  LogOut,
  ChevronDown,
  Keyboard
} from "lucide-react";

export function UserDropdown() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const openKeyboardShortcuts = () => {
    window.dispatchEvent(new CustomEvent("open-keyboard-shortcuts"));
  };

  if (!user) return null;

  const userInitials = `${user.firstName?.charAt(0) || ""}${user.lastName?.charAt(0) || ""}`.toUpperCase() || "U";
  const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 h-9 px-2 rounded-none">
          <div className="h-7 w-7 bg-foreground text-background flex items-center justify-center font-bold text-xs font-mono">
            {userInitials}
          </div>
          <div className="hidden sm:flex flex-col items-start">
            <span className="text-sm font-medium leading-none font-mono">{fullName}</span>
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-none">
        <DropdownMenuLabel className="font-mono">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{fullName}</p>
            <p className="text-xs leading-none text-muted-foreground font-normal">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/settings/profile")} className="cursor-pointer">
          <User className="mr-2 h-4 w-4" />
          Profile
          <DropdownMenuShortcut>⌘P</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/settings/company")} className="cursor-pointer">
          <Settings className="mr-2 h-4 w-4" />
          Settings
          <DropdownMenuShortcut>S</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/settings/team")} className="cursor-pointer">
          <Users className="mr-2 h-4 w-4" />
          Team
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer">
          <HelpCircle className="mr-2 h-4 w-4" />
          Help & Support
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer" asChild>
          <a href="https://docs.kushim.dev" target="_blank" rel="noopener noreferrer">
            <FileText className="mr-2 h-4 w-4" />
            API Documentation
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={openKeyboardShortcuts} className="cursor-pointer">
          <Keyboard className="mr-2 h-4 w-4" />
          Keyboard Shortcuts
          <DropdownMenuShortcut>?</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

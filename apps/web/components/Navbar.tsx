"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { UserDropdown } from "@/components/layout/UserDropdown";
import { MobileNav } from "@/components/layout/MobileNav";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  ShieldCheck, 
  FileText, 
  Shield,
  BookOpen,
  FileSearch,
  Settings as SettingsIcon,
  Command
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuthStore();

  // Public navbar for landing page
  if (!isAuthenticated && pathname === "/") {
    return (
      <nav className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg font-mono">
            <ShieldCheck className="h-5 w-5" />
            <span>Kushim</span>
          </Link>
          
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="rounded-none">
                Log In
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="rounded-none">
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </nav>
    );
  }

  if (!isAuthenticated) return null;

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Frameworks", href: "/frameworks", icon: Shield },
    { name: "Controls", href: "/controls", icon: ShieldCheck },
    { name: "Policies", href: "/policies", icon: BookOpen },
    { name: "Reports", href: "/reports", icon: FileText },
    { name: "Audit Logs", href: "/audit", icon: FileSearch },
    { name: "Integrations", href: "/integrations", icon: SettingsIcon },
  ];

  return (
    <nav className="border-b bg-card sticky top-0 z-50">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <MobileNav isAuthenticated={isAuthenticated} />
            <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg font-mono">
              <ShieldCheck className="h-5 w-5" />
              <span>Kushim</span>
            </Link>
          </div>
          
          <div className="hidden lg:flex items-center gap-0.5">
            {navItems.map((item) => (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors border-b-2 -mb-[1px]",
                  pathname === item.href 
                    ? "border-foreground text-foreground" 
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                )}
              >
                <item.icon className="h-3.5 w-3.5" />
                <span className="hidden xl:inline">{item.name}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Command palette hint */}
          <button 
            onClick={() => {
              const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true, ctrlKey: true });
              document.dispatchEvent(event);
            }}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground border hover:bg-muted transition-colors"
          >
            <Command className="h-3.5 w-3.5" />
            <span className="text-xs">Search</span>
            <kbd className="ml-2 text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded">⌘K</kbd>
          </button>
          <UserDropdown />
        </div>
      </div>
    </nav>
  );
}

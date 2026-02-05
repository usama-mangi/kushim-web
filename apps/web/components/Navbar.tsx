"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  ShieldCheck, 
  FileText, 
  Settings, 
  LogOut,
  User as UserIcon,
  Sparkles,
  Shield,
  BookOpen,
  FileSearch
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const { user, logout, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) return null;

  const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "AI Features", href: "/ai", icon: Sparkles },
    { name: "Frameworks", href: "/frameworks", icon: Shield },
    { name: "Controls", href: "/controls", icon: ShieldCheck },
    { name: "Policies", href: "/policies", icon: BookOpen },
    { name: "Reports", href: "/reports", icon: FileText },
    { name: "Audit Logs", href: "/audit", icon: FileSearch },
    { name: "Integrations", href: "/integrations", icon: Settings },
  ];

  return (
    <nav className="border-b bg-card sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary">
            <ShieldCheck className="h-6 w-6" />
            <span>Kushim</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  pathname === item.href 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/settings">
            <Button variant="ghost" size="icon" className="mr-2">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
          
          <div className="hidden sm:flex items-center gap-2 text-sm mr-4">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              {user?.firstName?.charAt(0) || "U"}
            </div>
            <span className="font-medium">{user?.firstName} {user?.lastName}</span>
          </div>
          
          <Button variant="ghost" size="icon" onClick={() => logout()}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </nav>
  );
}

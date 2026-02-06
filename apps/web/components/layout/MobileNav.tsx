"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { 
  Menu, 
  LayoutDashboard, 
  ShieldCheck, 
  FileText, 
  Settings, 
  Sparkles,
  Shield,
  BookOpen,
  FileSearch,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  isAuthenticated: boolean;
}

export function MobileNav({ isAuthenticated }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  if (!isAuthenticated) return null;

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "AI Features", href: "/ai", icon: Sparkles },
    { name: "Frameworks", href: "/frameworks", icon: Shield },
    { name: "Controls", href: "/controls", icon: ShieldCheck },
    { name: "Policies", href: "/policies", icon: BookOpen },
    { name: "Reports", href: "/reports", icon: FileText },
    { name: "Audit Logs", href: "/audit", icon: FileSearch },
    { name: "Integrations", href: "/integrations", icon: Settings },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild className="lg:hidden">
        <Button variant="ghost" size="icon" className="rounded-none">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0 rounded-none">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center gap-2 font-mono">
            <ShieldCheck className="h-5 w-5" />
            Kushim
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col p-4">
          <div className="text-xs uppercase tracking-widest text-muted-foreground font-mono mb-3">
            Navigation
          </div>
          {navItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-3 text-sm font-medium transition-colors border-l-2",
                pathname === item.href 
                  ? "border-l-foreground bg-muted/50 text-foreground" 
                  : "border-l-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          ))}
          
          <div className="border-t my-4" />
          
          <div className="text-xs uppercase tracking-widest text-muted-foreground font-mono mb-3">
            Quick Actions
          </div>
          <Link 
            href="/reports/generate"
            onClick={() => setOpen(false)}
            className="flex items-center justify-between px-3 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
          >
            <span>Generate Report</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          <Link 
            href="/settings"
            onClick={() => setOpen(false)}
            className="flex items-center justify-between px-3 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
          >
            <span>Settings</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </nav>
        
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-muted/30">
          <div className="text-xs text-muted-foreground">
            Press <kbd className="px-1.5 py-0.5 bg-background border font-mono text-[10px]">⌘K</kbd> for quick search
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Settings as SettingsIcon, 
  User, 
  Building2, 
  Users, 
  Bell, 
  Key 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const settingsNav = [
  { name: "Profile", href: "/settings/profile", icon: User },
  { name: "Company", href: "/settings/company", icon: Building2 },
  { name: "Team", href: "/settings/team", icon: Users },
  { name: "Notifications", href: "/settings/notifications", icon: Bell },
  { name: "API", href: "/settings/api", icon: Key },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const currentNav = settingsNav.find(item => pathname === item.href) || settingsNav[0];

  return (
    <div className="min-h-screen bg-background pb-12">
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <SettingsIcon className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-mono">Settings</h1>
            <p className="text-muted-foreground">Manage your account, team, and preferences</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Mobile: Dropdown selector */}
          <div className="lg:hidden">
            <Select 
              value={currentNav.href} 
              onValueChange={(value) => {
                window.location.href = value;
              }}
            >
              <SelectTrigger className="w-full rounded-none">
                <SelectValue>
                  <span className="flex items-center gap-2">
                    <currentNav.icon className="h-4 w-4" />
                    {currentNav.name}
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {settingsNav.map((item) => (
                  <SelectItem key={item.href} value={item.href}>
                    <span className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      {item.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Desktop: Sidebar navigation */}
          <aside className="hidden lg:block w-56 flex-shrink-0">
            <nav className="space-y-1">
              {settingsNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors border-l-2",
                    pathname === item.href
                      ? "border-l-foreground bg-muted/50 text-foreground"
                      : "border-l-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

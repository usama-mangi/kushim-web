"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  ShieldCheck,
  FileText,
  Settings,
  Sparkles,
  Shield,
  BookOpen,
  FileSearch,
  Cloud,
  Github,
  Slack,
  Users,
  Key,
  Bell,
  HelpCircle,
  Search,
  Zap,
  AlertCircle,
} from "lucide-react";
import { useAuthStore } from "@/store/auth";

interface CommandItem {
  id: string;
  name: string;
  icon: React.ElementType;
  href?: string;
  action?: () => void;
  keywords?: string[];
  group: string;
}

// Initialize from localStorage
function getInitialRecentPages(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem("kushim-recent-pages");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [recentPages, setRecentPages] = useState<string[]>(getInitialRecentPages);
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  // Keyboard shortcut to open
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const navigateTo = useCallback((href: string) => {
    // Track recent pages
    const updated = [href, ...recentPages.filter(p => p !== href)].slice(0, 5);
    setRecentPages(updated);
    localStorage.setItem("kushim-recent-pages", JSON.stringify(updated));
    
    router.push(href);
    setOpen(false);
  }, [router, recentPages]);

  const navigationItems: CommandItem[] = [
    { id: "dashboard", name: "Dashboard", icon: LayoutDashboard, href: "/dashboard", group: "Navigation", keywords: ["home", "overview"] },
    { id: "ai", name: "AI Features", icon: Sparkles, href: "/ai", group: "Navigation", keywords: ["copilot", "assistant"] },
    { id: "frameworks", name: "Frameworks", icon: Shield, href: "/frameworks", group: "Navigation", keywords: ["soc2", "iso", "hipaa"] },
    { id: "controls", name: "Controls", icon: ShieldCheck, href: "/controls", group: "Navigation", keywords: ["compliance", "check"] },
    { id: "policies", name: "Policies", icon: BookOpen, href: "/policies", group: "Navigation", keywords: ["document", "policy"] },
    { id: "evidence", name: "Evidence", icon: FileSearch, href: "/evidence", group: "Navigation", keywords: ["proof", "collection"] },
    { id: "reports", name: "Reports", icon: FileText, href: "/reports", group: "Navigation", keywords: ["audit", "export"] },
    { id: "audit", name: "Audit Logs", icon: FileSearch, href: "/audit", group: "Navigation", keywords: ["log", "history"] },
    { id: "integrations", name: "Integrations", icon: Settings, href: "/integrations", group: "Navigation", keywords: ["connect", "aws", "github"] },
  ];

  const integrationItems: CommandItem[] = [
    { id: "int-aws", name: "AWS Integration", icon: Cloud, href: "/integrations/aws", group: "Integrations", keywords: ["amazon", "cloud"] },
    { id: "int-github", name: "GitHub Integration", icon: Github, href: "/integrations/github", group: "Integrations", keywords: ["git", "code"] },
    { id: "int-slack", name: "Slack Integration", icon: Slack, href: "/integrations/slack", group: "Integrations", keywords: ["chat", "notifications"] },
  ];

  const actionItems: CommandItem[] = [
    { id: "generate-report", name: "Generate Report", icon: FileText, href: "/reports/generate", group: "Actions", keywords: ["create", "export"] },
    { id: "run-check", name: "Run Compliance Check", icon: Zap, href: "/controls", group: "Actions", keywords: ["scan", "verify"] },
    { id: "view-alerts", name: "View Active Alerts", icon: AlertCircle, href: "/dashboard", group: "Actions", keywords: ["warnings", "issues"] },
  ];

  const settingsItems: CommandItem[] = [
    { id: "profile", name: "Profile Settings", icon: Users, href: "/settings", group: "Settings", keywords: ["account", "user"] },
    { id: "api-keys", name: "API Keys", icon: Key, href: "/settings", group: "Settings", keywords: ["token", "credentials"] },
    { id: "notifications", name: "Notification Settings", icon: Bell, href: "/settings", group: "Settings", keywords: ["email", "alerts"] },
    { id: "help", name: "Help & Support", icon: HelpCircle, group: "Settings", keywords: ["docs", "support"], action: () => window.open("https://docs.kushim.dev", "_blank") },
  ];

  const allItems = [...navigationItems, ...integrationItems, ...actionItems, ...settingsItems];

  const recentItems = recentPages
    .map(href => allItems.find(item => item.href === href))
    .filter((item): item is CommandItem => !!item);

  if (!isAuthenticated) return null;

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <Command className="rounded-none border-0">
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <CommandInput 
            placeholder="Search pages, actions, settings..." 
            className="flex h-12 w-full rounded-none bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-0 focus:ring-0"
          />
          <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            ESC
          </kbd>
        </div>
        <CommandList className="max-h-[400px]">
          <CommandEmpty>No results found.</CommandEmpty>
          
          {recentItems.length > 0 && (
            <>
              <CommandGroup heading="Recent">
                {recentItems.map((item) => (
                  <CommandItem
                    key={`recent-${item.id}`}
                    value={item.name}
                    onSelect={() => item.href ? navigateTo(item.href) : item.action?.()}
                    className="cursor-pointer"
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    <span>{item.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          <CommandGroup heading="Navigation">
            {navigationItems.map((item) => (
              <CommandItem
                key={item.id}
                value={`${item.name} ${item.keywords?.join(" ") || ""}`}
                onSelect={() => item.href && navigateTo(item.href)}
                className="cursor-pointer"
              >
                <item.icon className="mr-2 h-4 w-4" />
                <span>{item.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          
          <CommandSeparator />
          
          <CommandGroup heading="Integrations">
            {integrationItems.map((item) => (
              <CommandItem
                key={item.id}
                value={`${item.name} ${item.keywords?.join(" ") || ""}`}
                onSelect={() => item.href && navigateTo(item.href)}
                className="cursor-pointer"
              >
                <item.icon className="mr-2 h-4 w-4" />
                <span>{item.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          
          <CommandSeparator />
          
          <CommandGroup heading="Quick Actions">
            {actionItems.map((item) => (
              <CommandItem
                key={item.id}
                value={`${item.name} ${item.keywords?.join(" ") || ""}`}
                onSelect={() => item.href ? navigateTo(item.href) : item.action?.()}
                className="cursor-pointer"
              >
                <item.icon className="mr-2 h-4 w-4" />
                <span>{item.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          
          <CommandSeparator />
          
          <CommandGroup heading="Settings">
            {settingsItems.map((item) => (
              <CommandItem
                key={item.id}
                value={`${item.name} ${item.keywords?.join(" ") || ""}`}
                onSelect={() => item.href ? navigateTo(item.href) : item.action?.()}
                className="cursor-pointer"
              >
                <item.icon className="mr-2 h-4 w-4" />
                <span>{item.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
        
        <div className="flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">↑↓</kbd>
            <span>Navigate</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">↵</kbd>
            <span>Select</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
            <span>Toggle</span>
          </div>
        </div>
      </Command>
    </CommandDialog>
  );
}
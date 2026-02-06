"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href: string;
}

const pathLabels: Record<string, string> = {
  "": "Dashboard",
  "ai": "AI Features",
  "frameworks": "Frameworks",
  "controls": "Controls",
  "policies": "Policies",
  "reports": "Reports",
  "generate": "Generate Report",
  "audit": "Audit Logs",
  "integrations": "Integrations",
  "settings": "Settings",
  "evidence": "Evidence",
};

export function Breadcrumbs() {
  const pathname = usePathname();
  
  // Don't show breadcrumbs on landing page or login/register
  if (pathname === "/" || pathname.startsWith("/login") || pathname.startsWith("/register") || pathname.startsWith("/(public)")) {
    return null;
  }
  
  const segments = pathname.split("/").filter(Boolean);
  
  const breadcrumbs: BreadcrumbItem[] = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    // Check if segment is a dynamic ID (UUID-like or simple ID)
    const isId = segment.length > 20 || /^[a-f0-9-]+$/i.test(segment);
    const label = isId ? "Details" : (pathLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1));
    
    return { label, href };
  });
  
  if (breadcrumbs.length === 0) return null;
  
  return (
    <nav 
      aria-label="Breadcrumb" 
      className="flex items-center gap-1 text-sm text-muted-foreground mb-6"
    >
      <Link 
        href="/dashboard" 
        className="flex items-center gap-1 hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
        <span className="sr-only">Home</span>
      </Link>
      
      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.href} className="flex items-center gap-1">
          <ChevronRight className="h-4 w-4" />
          {index === breadcrumbs.length - 1 ? (
            <span className="font-medium text-foreground font-mono text-xs uppercase tracking-wider">
              {crumb.label}
            </span>
          ) : (
            <Link 
              href={crumb.href}
              className="hover:text-foreground transition-colors font-mono text-xs uppercase tracking-wider"
            >
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}

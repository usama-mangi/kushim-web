import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Kushim - Automate SOC 2 Compliance with AI",
  description: "Automate your SOC 2 compliance journey with AI-powered monitoring, evidence collection, and audit preparation.",
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Public Header - Editorial Style */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl font-mono">
            <ShieldCheck className="h-6 w-6" />
            <span>Kushim</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link href="/integrations" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Integrations
            </Link>
            <Link href="#contact" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="rounded-none">Login</Button>
            </Link>
            <Link href="/register">
              <Button className="rounded-none">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {children}

      {/* Public Footer - Editorial Style */}
      <footer className="border-t bg-muted/30 mt-auto">
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-4">
              <div className="flex items-center gap-2 font-bold text-lg font-mono mb-4">
                <ShieldCheck className="h-5 w-5" />
                <span>Kushim</span>
              </div>
              <p className="text-sm text-muted-foreground mb-6 max-w-xs">
                Automate your compliance journey with AI-powered monitoring and evidence collection.
              </p>
              <div className="text-xs text-muted-foreground font-mono">
                © {new Date().getFullYear()} Kushim, Inc.
              </div>
            </div>
            
            <div className="md:col-span-2">
              <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider font-mono">Product</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="#features" className="hover:text-foreground transition-colors">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
                <li><Link href="/integrations" className="hover:text-foreground transition-colors">Integrations</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Changelog</Link></li>
              </ul>
            </div>
            
            <div className="md:col-span-2">
              <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider font-mono">Company</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">About</Link></li>
                <li><Link href="#contact" className="hover:text-foreground transition-colors">Contact</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Careers</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Blog</Link></li>
              </ul>
            </div>
            
            <div className="md:col-span-2">
              <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider font-mono">Resources</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">Documentation</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">API Reference</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Status</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Security</Link></li>
              </ul>
            </div>
            
            <div className="md:col-span-2">
              <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider font-mono">Legal</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Cookie Policy</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">GDPR</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

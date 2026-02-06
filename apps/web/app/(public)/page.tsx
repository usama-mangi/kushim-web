import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ShieldCheck, 
  Zap, 
  Brain, 
  CheckCircle2, 
  ArrowRight,
  Github,
  Cloud,
  Users,
  FileText,
  Bot,
  Check,
  Terminal,
  Clock,
  Scale
} from "lucide-react";

export default function LandingPage() {
  return (
    <main className="flex-1">
      {/* Hero Section - Editorial Article Style */}
      <section className="py-24 px-4 border-b">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Main Content - 8 columns */}
            <div className="lg:col-span-8">
              <div className="flex items-center gap-3 mb-6">
                <Badge variant="outline" className="rounded-none border-ink text-xs uppercase tracking-widest font-mono">
                  Compliance Automation
                </Badge>
                <span className="text-xs text-muted-foreground font-mono">Est. 2024</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter mb-8 leading-[0.95] font-mono">
                Automate SOC 2<br />
                Compliance.<br />
                <span className="text-muted-foreground">Ship Faster.</span>
              </h1>
              
              <p className="text-xl text-muted-foreground mb-8 max-w-xl leading-relaxed">
                Manual compliance is dead. Kushim continuously monitors your infrastructure, 
                collects evidence automatically, and keeps you audit-ready 24/7.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Link href="/register">
                  <Button size="lg" className="h-14 px-8 rounded-none text-base font-semibold">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="#features">
                  <Button size="lg" variant="outline" className="h-14 px-8 rounded-none text-base">
                    View Documentation
                  </Button>
                </Link>
              </div>

              {/* Social Proof Stats */}
              <div className="grid grid-cols-3 gap-8 pt-8 border-t">
                <div>
                  <div className="text-3xl font-bold font-mono">85%</div>
                  <div className="text-sm text-muted-foreground">Time Saved</div>
                </div>
                <div>
                  <div className="text-3xl font-bold font-mono">500+</div>
                  <div className="text-sm text-muted-foreground">Companies</div>
                </div>
                <div>
                  <div className="text-3xl font-bold font-mono">99.9%</div>
                  <div className="text-sm text-muted-foreground">Uptime SLA</div>
                </div>
              </div>
            </div>
            
            {/* Sidebar - 4 columns */}
            <aside className="lg:col-span-4 space-y-6">
              <div className="border-l-4 border-l-[var(--pass)] bg-card p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="h-5 w-5 text-[var(--pass)]" />
                  <span className="text-sm font-medium uppercase tracking-wider">Key Benefits</span>
                </div>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 mt-0.5 text-[var(--pass)]" />
                    <span>Automated evidence collection</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 mt-0.5 text-[var(--pass)]" />
                    <span>Real-time compliance monitoring</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 mt-0.5 text-[var(--pass)]" />
                    <span>AI-powered policy generation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 mt-0.5 text-[var(--pass)]" />
                    <span>One-click audit reports</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-muted/50 p-6">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-mono">Quick Start</div>
                <code className="text-sm font-mono block bg-ink text-paper p-3 overflow-x-auto">
                  npx kushim init --framework soc2
                </code>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Features Section - 4 Card Grid */}
      <section id="features" className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-16">
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-4 font-mono">Capabilities</div>
            <h2 className="text-4xl font-bold tracking-tight font-mono mb-4">
              Everything you need for compliance
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl">
              A comprehensive platform built for modern engineering teams
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                icon: Brain,
                title: "AI-Powered Automation",
                description: "Let AI handle evidence collection, control mapping, and policy drafting. Reduce manual work by 85%.",
                status: "pass"
              },
              {
                icon: Zap,
                title: "Real-time Monitoring",
                description: "Continuous compliance monitoring across AWS, GitHub, Okta, and 20+ integrations.",
                status: "info"
              },
              {
                icon: FileText,
                title: "Automated Evidence",
                description: "Immutable evidence collection with timestamps, screenshots, and complete audit trails.",
                status: "pass"
              },
              {
                icon: ShieldCheck,
                title: "Multi-Framework Support",
                description: "SOC 2, ISO 27001, HIPAA, PCI DSS - manage multiple frameworks in one place.",
                status: "info"
              },
            ].map((feature) => (
              <div 
                key={feature.title} 
                className={`border-l-4 ${feature.status === 'pass' ? 'border-l-[var(--pass)]' : 'border-l-[var(--info)]'} bg-card p-8 shadow-sm hover:shadow-md transition-shadow`}
              >
                <feature.icon className="h-8 w-8 mb-4" />
                <h3 className="text-xl font-semibold mb-2 font-mono">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations Section */}
      <section className="py-20 px-4 bg-muted/30 border-y">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-4">
              <div className="text-xs uppercase tracking-widest text-muted-foreground mb-4 font-mono">Integrations</div>
              <h2 className="text-3xl font-bold tracking-tight font-mono mb-4">
                Connects with your stack
              </h2>
              <p className="text-muted-foreground mb-6">
                One-click integrations with the tools your team already uses. No custom development required.
              </p>
              <Link href="/integrations">
                <Button variant="outline" className="rounded-none">
                  View All Integrations
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            
            <div className="lg:col-span-8">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { name: "AWS", icon: Cloud, color: "text-orange-500" },
                  { name: "GitHub", icon: Github, color: "" },
                  { name: "Okta", icon: Users, color: "text-blue-500" },
                  { name: "Jira", icon: FileText, color: "text-blue-600" },
                  { name: "Slack", icon: Bot, color: "text-purple-500" },
                  { name: "GCP", icon: Terminal, color: "text-red-500" },
                ].map((integration) => (
                  <div 
                    key={integration.name}
                    className="flex items-center gap-3 bg-card p-4 border hover:border-foreground/20 transition-colors"
                  >
                    <integration.icon className={`h-6 w-6 ${integration.color}`} />
                    <span className="font-medium font-mono">{integration.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-16">
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-4 font-mono">Pricing</div>
            <h2 className="text-4xl font-bold tracking-tight font-mono mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-muted-foreground">
              No hidden fees. Cancel anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Starter */}
            <div className="border bg-card p-8">
              <div className="mb-6">
                <h3 className="text-xl font-semibold font-mono mb-1">Starter</h3>
                <p className="text-sm text-muted-foreground">For small teams getting started</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold font-mono">$299</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-3 mb-8 text-sm">
                {[
                  "Up to 5 integrations",
                  "SOC 2 framework",
                  "AI evidence collection",
                  "Email support",
                  "7-day data retention"
                ].map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="h-4 w-4 mt-0.5 text-[var(--pass)]" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block">
                <Button className="w-full rounded-none" variant="outline">Get Started</Button>
              </Link>
            </div>

            {/* Professional */}
            <div className="border-2 border-foreground bg-card p-8 relative">
              <div className="absolute -top-3 left-6">
                <Badge className="rounded-none bg-foreground text-background">Most Popular</Badge>
              </div>
              <div className="mb-6">
                <h3 className="text-xl font-semibold font-mono mb-1">Professional</h3>
                <p className="text-sm text-muted-foreground">For growing companies</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold font-mono">$999</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-3 mb-8 text-sm">
                {[
                  "Unlimited integrations",
                  "All frameworks (SOC 2, ISO, HIPAA)",
                  "AI policy drafting",
                  "Priority support",
                  "Custom reports",
                  "90-day data retention"
                ].map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="h-4 w-4 mt-0.5 text-[var(--pass)]" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block">
                <Button className="w-full rounded-none">Get Started</Button>
              </Link>
            </div>

            {/* Enterprise */}
            <div className="border bg-card p-8">
              <div className="mb-6">
                <h3 className="text-xl font-semibold font-mono mb-1">Enterprise</h3>
                <p className="text-sm text-muted-foreground">For large organizations</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold font-mono">Custom</span>
              </div>
              <ul className="space-y-3 mb-8 text-sm">
                {[
                  "Everything in Professional",
                  "SSO & SAML",
                  "Custom integrations",
                  "Dedicated CSM",
                  "SLA guarantee",
                  "Unlimited data retention"
                ].map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="h-4 w-4 mt-0.5 text-[var(--pass)]" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href="#contact" className="block">
                <Button className="w-full rounded-none" variant="outline">Contact Sales</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="py-20 px-4 bg-foreground text-background">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight font-mono mb-4">
            Ready to automate your compliance?
          </h2>
          <p className="text-lg mb-8 opacity-80 max-w-xl mx-auto">
            Join 500+ companies that have eliminated manual compliance work with Kushim
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" variant="secondary" className="h-14 px-8 rounded-none text-base font-semibold">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="#contact">
              <Button size="lg" variant="outline" className="h-14 px-8 rounded-none text-base border-background/20 text-background hover:bg-background/10">
                Schedule Demo
              </Button>
            </Link>
          </div>
          
          <div className="mt-12 flex items-center justify-center gap-8 text-sm opacity-70">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4" />
              <span>No credit card required</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

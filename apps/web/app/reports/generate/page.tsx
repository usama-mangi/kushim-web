"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft,
  FileText,
  BarChart3,
  Shield,
  CheckCircle2,
  Calendar,
  Download,
  Loader2,
  FileCheck,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

interface ReportType {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  estimatedTime: string;
}

const reportTypes: ReportType[] = [
  {
    id: "compliance-status",
    name: "Compliance Status Report",
    description: "Current status of all controls across frameworks with pass/fail summary",
    icon: Shield,
    estimatedTime: "~2 min"
  },
  {
    id: "evidence-collection",
    name: "Evidence Collection Report",
    description: "Complete evidence log with timestamps, sources, and attachments",
    icon: FileCheck,
    estimatedTime: "~5 min"
  },
  {
    id: "control-effectiveness",
    name: "Control Effectiveness Report",
    description: "Analysis of control performance over time with trend data",
    icon: BarChart3,
    estimatedTime: "~3 min"
  },
  {
    id: "audit-readiness",
    name: "Audit Readiness Package",
    description: "Full audit package with all evidence, policies, and control mappings",
    icon: FileText,
    estimatedTime: "~10 min"
  },
];

const frameworks = [
  { id: "soc2", name: "SOC 2 Type II" },
  { id: "iso27001", name: "ISO 27001" },
  { id: "hipaa", name: "HIPAA" },
  { id: "pcidss", name: "PCI DSS" },
];

export default function ReportGeneratorPage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedFramework, setSelectedFramework] = useState("soc2");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [includeOptions, setIncludeOptions] = useState({
    evidence: true,
    controls: true,
    policies: true,
    remediations: false,
    screenshots: false,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewData, setPreviewData] = useState<{
    sections: number;
    pages: number;
    controls: number;
    evidence: number;
  } | null>(null);

  const handleTypeSelect = (typeId: string) => {
    setSelectedType(typeId);
    // Generate mock preview data
    setPreviewData({
      sections: Math.floor(Math.random() * 10) + 5,
      pages: Math.floor(Math.random() * 50) + 20,
      controls: Math.floor(Math.random() * 100) + 50,
      evidence: Math.floor(Math.random() * 200) + 100,
    });
  };

  const handleGenerate = async () => {
    if (!selectedType) {
      toast.error("Please select a report type");
      return;
    }
    
    setIsGenerating(true);
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 3000));
      toast.success("Report generated successfully!");
      router.push("/reports");
    } catch {
      toast.error("Failed to generate report");
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleOption = (key: keyof typeof includeOptions) => {
    setIncludeOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.push("/reports")}
            className="rounded-none"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-mono">Generate Report</h1>
            <p className="text-muted-foreground">Create compliance reports for audits and stakeholders</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content - 8 columns */}
          <div className="lg:col-span-8 space-y-6">
            {/* Report Type Selection */}
            <Card className="rounded-none shadow-sm">
              <CardHeader>
                <CardTitle className="font-mono text-lg flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 bg-foreground text-background text-sm font-bold rounded-full">1</span>
                  Select Report Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reportTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => handleTypeSelect(type.id)}
                      className={`text-left p-4 border transition-all ${
                        selectedType === type.id 
                          ? "border-foreground bg-muted" 
                          : "border-border hover:border-foreground/50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <type.icon className="h-5 w-5 mt-0.5" />
                        <div className="flex-1">
                          <div className="font-medium font-mono text-sm">{type.name}</div>
                          <div className="text-xs text-muted-foreground mt-1">{type.description}</div>
                          <Badge variant="secondary" className="mt-2 rounded-none text-xs">
                            {type.estimatedTime}
                          </Badge>
                        </div>
                        {selectedType === type.id && (
                          <CheckCircle2 className="h-5 w-5 text-[var(--pass)]" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Framework & Date Range */}
            <Card className="rounded-none shadow-sm">
              <CardHeader>
                <CardTitle className="font-mono text-lg flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 bg-foreground text-background text-sm font-bold rounded-full">2</span>
                  Configure Parameters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="font-mono text-sm">Framework</Label>
                    <Select value={selectedFramework} onValueChange={setSelectedFramework}>
                      <SelectTrigger className="rounded-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {frameworks.map((fw) => (
                          <SelectItem key={fw.id} value={fw.id}>{fw.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="font-mono text-sm">Date Range</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="date"
                          className="pl-10 rounded-none font-mono"
                          value={dateRange.start}
                          onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        />
                      </div>
                      <span className="flex items-center text-muted-foreground">to</span>
                      <div className="relative flex-1">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="date"
                          className="pl-10 rounded-none font-mono"
                          value={dateRange.end}
                          onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Include Options */}
            <Card className="rounded-none shadow-sm">
              <CardHeader>
                <CardTitle className="font-mono text-lg flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 bg-foreground text-background text-sm font-bold rounded-full">3</span>
                  Include Options
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: "evidence" as const, label: "Evidence attachments", desc: "Screenshots, logs, and documents" },
                    { key: "controls" as const, label: "Control details", desc: "Full control descriptions and mappings" },
                    { key: "policies" as const, label: "Policy references", desc: "Links to relevant policy documents" },
                    { key: "remediations" as const, label: "Remediation history", desc: "Past issues and resolutions" },
                    { key: "screenshots" as const, label: "Configuration screenshots", desc: "Visual evidence captures" },
                  ].map((option) => (
                    <div
                      key={option.key}
                      className="flex items-start space-x-3 p-3 border hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => toggleOption(option.key)}
                    >
                      <Checkbox 
                        id={option.key}
                        checked={includeOptions[option.key]}
                        onCheckedChange={() => toggleOption(option.key)}
                      />
                      <div className="flex-1">
                        <Label htmlFor={option.key} className="cursor-pointer font-medium">
                          {option.label}
                        </Label>
                        <p className="text-xs text-muted-foreground mt-0.5">{option.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - 4 columns */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Preview Panel */}
            <Card className="border-l-4 border-l-[var(--info)] rounded-none shadow-sm sticky top-24">
              <CardHeader>
                <CardTitle className="font-mono text-lg">Report Preview</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedType && previewData ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <FileText className="h-5 w-5" />
                      <span className="font-medium">
                        {reportTypes.find(t => t.id === selectedType)?.name}
                      </span>
                    </div>
                    
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Sections</span>
                        <span className="font-mono font-bold">{previewData.sections}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Est. Pages</span>
                        <span className="font-mono font-bold">{previewData.pages}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Controls Covered</span>
                        <span className="font-mono font-bold">{previewData.controls}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Evidence Items</span>
                        <span className="font-mono font-bold">{previewData.evidence}</span>
                      </div>
                    </div>
                    
                    <div className="border-t pt-4 mt-4">
                      <div className="text-xs text-muted-foreground mb-2 font-mono uppercase tracking-wider">
                        Export Format
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="rounded-none">PDF</Badge>
                        <Badge variant="outline" className="rounded-none">DOCX</Badge>
                        <Badge variant="outline" className="rounded-none">CSV</Badge>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full rounded-none mt-4"
                      onClick={handleGenerate}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Generate Report
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Select a report type to see preview
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Help */}
            <div className="bg-muted/50 p-6">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-mono">Tips</div>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Audit Readiness Package includes everything auditors need</li>
                <li>• Date range affects evidence and control history included</li>
                <li>• Reports are generated asynchronously and can take several minutes</li>
              </ul>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Download, Mail, Loader2, Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils";

export function ReportGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportType, setReportType] = useState("summary");
  const [dateRange, setDateRange] = useState("30d");

  const handleGenerate = async (format: "pdf" | "csv") => {
    setIsGenerating(true);
    // Simulate generation delay
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsGenerating(false);
    
    // In a real app, this would trigger a download
    alert(`Report generated: ${reportType}_report_${format}. The file would download now.`);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Generate Compliance Report
        </CardTitle>
        <CardDescription>
          Create detailed reports for auditors or internal review
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Report Type</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="summary">Executive Summary</SelectItem>
                <SelectItem value="detailed">Detailed Audit Log</SelectItem>
                <SelectItem value="failed">Failed Controls Only</SelectItem>
                <SelectItem value="evidence">Evidence Chain</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Time Period</Label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last Quarter</SelectItem>
                <SelectItem value="year">Year to Date</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          <Label>Include Sections</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2 border p-3 rounded-md">
              <Checkbox id="compliance-score" defaultChecked />
              <Label htmlFor="compliance-score" className="cursor-pointer">Compliance Score Trends</Label>
            </div>
            <div className="flex items-center space-x-2 border p-3 rounded-md">
              <Checkbox id="control-details" defaultChecked />
              <Label htmlFor="control-details" className="cursor-pointer">Control Details</Label>
            </div>
            <div className="flex items-center space-x-2 border p-3 rounded-md">
              <Checkbox id="evidence-hashes" defaultChecked />
              <Label htmlFor="evidence-hashes" className="cursor-pointer">Evidence Hash Verification</Label>
            </div>
            <div className="flex items-center space-x-2 border p-3 rounded-md">
              <Checkbox id="remediation-plan" />
              <Label htmlFor="remediation-plan" className="cursor-pointer">Remediation Plan</Label>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between bg-muted/20 pt-6">
        <Button variant="outline" onClick={() => handleGenerate("csv")} disabled={isGenerating}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
        <Button onClick={() => handleGenerate("pdf")} disabled={isGenerating}>
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4 mr-2" />
              Generate PDF Report
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

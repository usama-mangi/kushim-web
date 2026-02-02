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
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Download, Mail, Loader2, Calendar, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useDashboardStore } from "@/store/dashboard";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function ReportGenerator() {
  const { controls, complianceScore } = useDashboardStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportType, setReportType] = useState("summary");
  const [dateRange, setDateRange] = useState("30d");
  const [showSuccess, setShowSuccess] = useState(false);

  const handleGenerate = async (format: "pdf" | "csv") => {
    setIsGenerating(true);
    setShowSuccess(false);
    
    // Simulate generation delay
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    const filename = `${reportType}-report-${new Date().toISOString().split('T')[0]}.${format}`;

    // Prepare data based on report type
    const reportControls = reportType === 'failed' 
      ? controls.filter(c => c.status === 'FAIL')
      : controls;

    if (format === 'csv') {
      const headers = ["Control ID", "Name", "Category", "Status", "Integration", "Last Check"];
      const rows = reportControls.map(c => [
        c.id.substring(0, 8),
        `"${c.name}"`,
        c.category,
        c.status,
        c.integration,
        new Date(c.lastCheck).toLocaleDateString()
      ]);
      const content = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      
      const blob = new Blob([content], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      // PDF Generation with jsPDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Header
      doc.setFontSize(22);
      doc.setTextColor(41, 128, 185); // Professional Blue
      doc.text("KUSHIM COMPLIANCE", 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
      
      doc.setDrawColor(200);
      doc.line(14, 32, pageWidth - 14, 32);
      
      // Title
      doc.setFontSize(16);
      doc.setTextColor(33);
      doc.text(`${reportType.toUpperCase()} REPORT`, 14, 45);
      
      // Summary Box
      doc.setFillColor(248, 249, 250);
      doc.rect(14, 52, pageWidth - 28, 35, 'F');
      
      doc.setFontSize(11);
      doc.setTextColor(33);
      doc.text(`Overall Compliance:`, 20, 60);
      doc.setFont("helvetica", "bold");
      doc.text(`${(complianceScore?.overall ? complianceScore.overall * 100 : 0).toFixed(1)}%`, 60, 60);
      
      doc.setFont("helvetica", "normal");
      doc.text(`Total Controls:`, 20, 67);
      doc.text(`${complianceScore?.totalControls || 0}`, 60, 67);
      
      doc.text(`Passing:`, 110, 60);
      doc.setTextColor(40, 167, 69); // Green
      doc.text(`${complianceScore?.passingControls || 0}`, 135, 60);
      
      doc.setTextColor(33);
      doc.text(`Failing:`, 110, 67);
      doc.setTextColor(220, 53, 69); // Red
      doc.text(`${complianceScore?.failingControls || 0}`, 135, 67);
      
      doc.setTextColor(33);
      doc.text(`Warning:`, 110, 74);
      doc.setTextColor(255, 193, 7); // Yellow/Orange
      doc.text(`${complianceScore?.warningControls || 0}`, 135, 74);

      // Controls Table
      const tableHeaders = [["ID", "Control Name", "Category", "Integration", "Status"]];
      const tableData = reportControls.map(c => [
        c.id.substring(0, 8),
        c.name,
        c.category,
        c.integration,
        c.status
      ]);

      autoTable(doc, {
        head: tableHeaders,
        body: tableData,
        startY: 95,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 40 },
          3: { cellWidth: 30 },
          4: { cellWidth: 25 }
        },
        didParseCell: (data) => {
            if (data.section === 'body' && data.column.index === 4) {
                const status = data.cell.raw as string;
                if (status === 'PASS') data.cell.styles.textColor = [40, 167, 69];
                if (status === 'FAIL') data.cell.styles.textColor = [220, 53, 69];
                if (status === 'WARNING') data.cell.styles.textColor = [255, 193, 7];
            }
        }
      });
      
      // Footer
      const totalPages = (doc.internal as any).getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Kushim Compliance Automation - Confidential`, 14, doc.internal.pageSize.getHeight() - 10);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - 30, doc.internal.pageSize.getHeight() - 10);
      }

      doc.save(filename);
    }

    setIsGenerating(false);
    setShowSuccess(true);
    
    // Auto-hide success message after 5 seconds
    setTimeout(() => setShowSuccess(false), 5000);
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
        {showSuccess && (
          <Alert className="bg-success/10 text-success border-success/20">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>
              Your report has been generated and is ready for download.
            </AlertDescription>
          </Alert>
        )}
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

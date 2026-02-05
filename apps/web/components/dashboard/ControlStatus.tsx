"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useDashboardStore } from "@/store/dashboard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Search,
  Filter,
  Eye,
  RefreshCw,
  Loader2
} from "lucide-react";
import { formatDate, getStatusBgColor } from "@/lib/utils";
import { triggerComplianceScan } from "@/lib/api/endpoints";
import { toast } from "sonner";
import type { Control, IntegrationStatus } from "@/lib/api/types";

export function ControlStatus() {
  const { controls, isLoading, fetchDashboardData } = useDashboardStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<IntegrationStatus | "ALL">("ALL");
  const [isScanning, setIsScanning] = useState(false);

  const handleScan = async () => {
    setIsScanning(true);
    try {
      await triggerComplianceScan();
      toast.success("Compliance scan started");
      // Poll or wait a bit before refreshing
      setTimeout(() => {
        fetchDashboardData();
      }, 2000);
    } catch (error) {
      toast.error("Failed to start compliance scan");
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    if (controls.length === 0) {
      fetchDashboardData();
    }
  }, [controls.length, fetchDashboardData]);

  const filteredControls = controls.filter((control) => {
    const matchesSearch = control.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          control.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || control.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: IntegrationStatus) => {
    switch (status) {
      case "PASS":
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case "FAIL":
        return <XCircle className="h-4 w-4 text-error" />;
      case "WARNING":
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Card className="h-[500px] flex flex-col">
      <CardHeader>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <CardTitle>Control Status</CardTitle>
            <CardDescription>
              Monitor SOC 2 controls and their compliance status
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button 
                variant="outline" 
                size="sm" 
                onClick={handleScan} 
                disabled={isScanning || isLoading}
            >
                {isScanning ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Scan Now
            </Button>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search controls..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as IntegrationStatus | "ALL")}
            >
              <SelectTrigger className="w-fit">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="PASS">Passing</SelectItem>
                <SelectItem value="FAIL">Failing</SelectItem>
                <SelectItem value="WARNING">Warning</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto pr-2 custom-scrollbar">
        {isLoading && controls.length === 0 ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Control</TableHead>
                  <TableHead>Integration</TableHead>
                  <TableHead>Last Check</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredControls.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No controls found matching your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredControls.map((control) => (
                    <TableRow key={control.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{control.name}</span>
                          <span className="text-xs text-muted-foreground truncate max-w-[300px]">
                            {control.description}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{control.integration}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(control.lastCheck)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBgColor(control.status)}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(control.status)}
                            {control.status}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/controls/${control.id}`}>
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

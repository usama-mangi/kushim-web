"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, Search, Filter } from "lucide-react";

interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  entity: string;
  entityId: string;
  metadata: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("7d");

  useEffect(() => {
    loadAuditLogs();
  }, [actionFilter, dateRange]);

  const loadAuditLogs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (actionFilter !== "all") params.append("action", actionFilter);
      if (dateRange !== "all") params.append("dateRange", dateRange);
      
      const response = await fetch(`/api/audit?${params}`);
      const data = await response.json();
      setLogs(data);
    } catch (error) {
      console.error("Failed to load audit logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportLogs = async () => {
    try {
      const params = new URLSearchParams();
      if (actionFilter !== "all") params.append("action", actionFilter);
      if (dateRange !== "all") params.append("dateRange", dateRange);
      
      const response = await fetch(`/api/audit/export?${params}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to export logs:", error);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      log.userEmail.toLowerCase().includes(search) ||
      log.action.toLowerCase().includes(search) ||
      log.entity.toLowerCase().includes(search)
    );
  });

  const getActionBadge = (action: string) => {
    const actionType = action.split(".")[0];
    switch (actionType) {
      case "CREATE":
        return <Badge className="bg-green-500">Create</Badge>;
      case "UPDATE":
        return <Badge className="bg-blue-500">Update</Badge>;
      case "DELETE":
        return <Badge variant="destructive">Delete</Badge>;
      case "READ":
        return <Badge variant="outline">Read</Badge>;
      default:
        return <Badge variant="secondary">{actionType}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <FileText className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
            </div>
            <p className="text-muted-foreground">
              Track all system activities and user actions
            </p>
          </div>
          <Button className="gap-2" onClick={handleExportLogs}>
            <Download className="h-4 w-4" />
            Export Logs
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by user, action, or entity..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="CREATE">Create</SelectItem>
                  <SelectItem value="UPDATE">Update</SelectItem>
                  <SelectItem value="DELETE">Delete</SelectItem>
                  <SelectItem value="READ">Read</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">Last 24 hours</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                Loading audit logs...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>IP Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(log.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{log.userEmail}</div>
                        </TableCell>
                        <TableCell>{getActionBadge(log.action)}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{log.entity}</div>
                            <div className="text-muted-foreground text-xs font-mono">
                              {log.entityId}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs text-muted-foreground max-w-xs truncate">
                            {JSON.stringify(log.metadata)}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm font-mono text-muted-foreground">
                          {log.ipAddress}
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredLogs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                          {searchQuery ? "No matching audit logs found" : "No audit logs available"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{logs.length}</div>
              <p className="text-xs text-muted-foreground">Total Events</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {new Set(logs.map((l) => l.userId)).size}
              </div>
              <p className="text-xs text-muted-foreground">Active Users</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {logs.filter((l) => l.action.startsWith("DELETE")).length}
              </div>
              <p className="text-xs text-muted-foreground">Deletions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {logs.filter((l) => l.action.startsWith("CREATE")).length}
              </div>
              <p className="text-xs text-muted-foreground">Creations</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

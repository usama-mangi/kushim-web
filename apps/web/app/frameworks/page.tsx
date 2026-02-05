"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, CheckCircle2, AlertCircle, Layers } from "lucide-react";

interface Framework {
  id: string;
  name: string;
  displayName: string;
  description: string;
  controlCount: number;
  isActive: boolean;
}

interface Control {
  id: string;
  controlId: string;
  title: string;
  description: string;
  status: "PASSING" | "FAILING" | "NOT_TESTED";
  framework: string;
}

export default function FrameworksPage() {
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [selectedFramework, setSelectedFramework] = useState<string>("SOC2");
  const [controls, setControls] = useState<Control[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadFrameworks();
  }, []);

  useEffect(() => {
    if (selectedFramework) {
      loadControls(selectedFramework);
    }
  }, [selectedFramework]);

  const loadFrameworks = async () => {
    try {
      const response = await fetch("/api/frameworks");
      const data = await response.json();
      setFrameworks(data);
    } catch (error) {
      console.error("Failed to load frameworks:", error);
    }
  };

  const loadControls = async (framework: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/frameworks/${framework}/controls`);
      const data = await response.json();
      setControls(data);
    } catch (error) {
      console.error("Failed to load controls:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchFramework = async (frameworkId: string) => {
    try {
      await fetch(`/api/frameworks/${frameworkId}/activate`, {
        method: "POST",
      });
      loadFrameworks();
    } catch (error) {
      console.error("Failed to switch framework:", error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PASSING":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "FAILING":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PASSING":
        return <Badge className="bg-green-500">Passing</Badge>;
      case "FAILING":
        return <Badge variant="destructive">Failing</Badge>;
      default:
        return <Badge variant="outline">Not Tested</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold tracking-tight">Compliance Frameworks</h1>
            </div>
            <p className="text-muted-foreground">
              Manage multiple compliance frameworks and controls
            </p>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="controls">Controls</TabsTrigger>
            <TabsTrigger value="mapping">Cross-Framework Mapping</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {frameworks.map((framework) => (
                <Card key={framework.id} className={framework.isActive ? "border-primary" : ""}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{framework.displayName}</CardTitle>
                      {framework.isActive && (
                        <Badge variant="outline" className="bg-primary/10 text-primary">
                          Active
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {framework.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">{framework.controlCount}</span>
                      <span className="text-sm text-muted-foreground">Controls</span>
                    </div>
                    {!framework.isActive && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-4"
                        onClick={() => handleSwitchFramework(framework.id)}
                      >
                        Set as Active
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Controls Tab */}
          <TabsContent value="controls" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Framework Controls</CardTitle>
                  <Select value={selectedFramework} onValueChange={setSelectedFramework}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SOC2">SOC 2</SelectItem>
                      <SelectItem value="ISO27001">ISO 27001</SelectItem>
                      <SelectItem value="HIPAA">HIPAA</SelectItem>
                      <SelectItem value="PCIDSS">PCI DSS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Loading controls...
                  </div>
                ) : (
                  <div className="space-y-2">
                    {controls.map((control) => (
                      <div
                        key={control.id}
                        className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="mt-1">{getStatusIcon(control.status)}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-sm font-medium">
                              {control.controlId}
                            </span>
                            {getStatusBadge(control.status)}
                          </div>
                          <h4 className="font-medium mb-1">{control.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {control.description}
                          </p>
                        </div>
                      </div>
                    ))}
                    {controls.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground">
                        No controls found for this framework
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cross-Framework Mapping Tab */}
          <TabsContent value="mapping" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Cross-Framework Control Mapping
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  View how controls map across different compliance frameworks
                </p>
                <div className="text-center py-12 text-muted-foreground">
                  <Layers className="h-16 w-16 mx-auto mb-4 opacity-20" />
                  <p>Cross-framework mapping visualization coming soon</p>
                  <p className="text-xs mt-2">
                    This will show how SOC 2 controls map to ISO 27001, HIPAA, and PCI DSS
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

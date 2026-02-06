'use client';

import { useEffect, useState } from 'react';
import { useDashboardStore } from '@/store/dashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Activity, TrendingUp, TrendingDown, Minus, ArrowRight, RefreshCw, Loader2 } from 'lucide-react';
import { formatPercentage } from '@/lib/utils';
import Link from 'next/link';
import { triggerComplianceScan } from '@/lib/api/endpoints';
import { toast } from 'sonner';

export function ComplianceScore() {
  const { complianceScore, isLoading, fetchDashboardData, integrationHealth } = useDashboardStore();
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (!complianceScore) {
      fetchDashboardData();
    }
  }, [complianceScore, fetchDashboardData]);

  const handleScan = async () => {
    setIsScanning(true);
    try {
      const result = await triggerComplianceScan();
      console.log('Scan result:', result);
      toast.success('Compliance scan started');
      setTimeout(() => {
        fetchDashboardData();
        setIsScanning(false);
      }, 3000);
    } catch (error: any) {
      console.error('Scan error:', error);
      toast.error(error?.message || 'Failed to start compliance scan');
      setIsScanning(false);
    }
  };

  const hasIntegrations = Object.values(integrationHealth).some(health => health !== null);

  if (isLoading || !complianceScore) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Compliance Score</CardTitle>
          <CardDescription>Overall compliance health</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-32 w-32 rounded-full mx-auto" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = () => {
    switch (complianceScore.trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-success" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-error" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.9) return "text-success";
    if (score >= 0.7) return "text-warning";
    return "text-error";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Compliance Score
        </CardTitle>
        <CardDescription>Overall compliance health</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Large Score Display */}
        <div className="flex flex-col items-center justify-center">
          <div className="relative">
            <div className="flex items-center justify-center w-32 h-32 rounded-full border-8 border-muted">
              <span className={`text-4xl font-bold ${getScoreColor(complianceScore.overall)}`}>
                {formatPercentage(complianceScore.overall, 0)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            {getTrendIcon()}
            <span className="text-sm text-muted-foreground capitalize">
              {complianceScore.trend}
            </span>
          </div>
        </div>

        {/* Control Status Breakdown */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-success">
              {complianceScore.passingControls}
            </div>
            <div className="text-xs text-muted-foreground">Passing</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-warning">
              {complianceScore.warningControls}
            </div>
            <div className="text-xs text-muted-foreground">Warning</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-error">
              {complianceScore.failingControls}
            </div>
            <div className="text-xs text-muted-foreground">Failing</div>
          </div>
        </div>

        {/* Total Controls */}
        <div className="flex items-center justify-between pt-4 border-t">
          <span className="text-sm text-muted-foreground">Total Controls</span>
          <Badge variant="secondary">{complianceScore.totalControls}</Badge>
        </div>

        {/* Connect Integrations or Run Scan CTA */}
        {complianceScore.passingControls === 0 && 
         complianceScore.warningControls === 0 && 
         complianceScore.failingControls === 0 && (
          <div className="pt-4 border-t space-y-2">
            {!hasIntegrations ? (
              <Link href="/integrations" className="block w-full">
                <Button className="w-full group" variant="outline">
                  Connect Integrations
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            ) : (
              <>
                <p className="text-xs text-muted-foreground text-center">
                  Run a compliance scan to check your controls
                </p>
                <Button 
                  className="w-full" 
                  onClick={handleScan}
                  disabled={isScanning}
                >
                  {isScanning ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Run Compliance Scan
                </Button>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

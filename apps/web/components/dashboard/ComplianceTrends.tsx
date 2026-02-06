"use client";

import { useDashboardStore } from "@/store/dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

export function ComplianceTrends() {
  const { trends, isLoading } = useDashboardStore();

  const hasData = trends && trends.length > 0;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Compliance Trend</CardTitle>
        <CardDescription>Average health score over the last 7 days</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[280px] w-full flex items-center justify-center">
          {!hasData && !isLoading ? (
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">Not enough data to calculate trends.</p>
              <p className="text-xs text-muted-foreground">Connect integrations to start tracking compliance.</p>
            </div>
          ) : isLoading && !hasData ? (
             <Skeleton className="h-full w-full" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  domain={[0, 100]} 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    borderColor: "hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px"
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorScore)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

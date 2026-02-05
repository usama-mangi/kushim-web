'use client';

import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AIInsight } from '@/types/ai';
import { X, AlertCircle, Info, AlertTriangle } from 'lucide-react';

/**
 * Display smart AI-powered insights and suggestions
 * 
 * Shows actionable insights like:
 * - Control gaps
 * - Unmapped evidence
 * - Outdated policies
 * - Cost spikes
 */
export function AIInsightsBanner() {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [dismissedInsights, setDismissedInsights] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      const response = await fetch('/api/ai/insights');
      const data = await response.json();
      setInsights(data);
    } catch (error) {
      console.error('Failed to fetch insights:', error);
    }
  };

  const handleDismiss = (insight: AIInsight) => {
    setDismissedInsights(new Set([...dismissedInsights, insight.type]));
  };

  const visibleInsights = insights.filter(
    (insight) => !dismissedInsights.has(insight.type)
  );

  if (visibleInsights.length === 0) {
    return null;
  }

  const getIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <AlertCircle className="h-5 w-5" />;
      case 'medium':
        return <AlertTriangle className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getVariant = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-3 mb-6">
      {visibleInsights.map((insight, index) => (
        <Alert key={index} variant={getVariant(insight.severity)}>
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              {getIcon(insight.severity)}
              <div className="flex-1">
                <AlertTitle>{insight.title}</AlertTitle>
                <AlertDescription className="mt-1">
                  {insight.description}
                </AlertDescription>
                <div className="mt-2">
                  <Button size="sm" variant="outline">
                    {insight.actionRequired}
                  </Button>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDismiss(insight)}
              className="ml-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Alert>
      ))}
    </div>
  );
}

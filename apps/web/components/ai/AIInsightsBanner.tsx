'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AIInsight } from '@/types/ai';
import { X, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { useAIStore } from '@/store/ai';

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
  const router = useRouter();
  const { setEvidenceMappingOpen, setPolicyDraftingOpen, setCopilotOpen } = useAIStore();
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [dismissedInsights, setDismissedInsights] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      const data = await apiClient.get<AIInsight[]>('/ai/insights');
      setInsights(data);
    } catch (error) {
      console.error('Failed to fetch insights:', error);
      // Silently fail - insights are optional enhancement
    }
  };

  const handleDismiss = (insight: AIInsight) => {
    setDismissedInsights(new Set([...dismissedInsights, insight.type]));
  };

  const handleAction = (insight: AIInsight) => {
    switch (insight.type) {
      case 'unmapped_evidence':
        // Open evidence mapping dialog
        setEvidenceMappingOpen(true);
        break;
      case 'control_gaps':
        // Navigate to controls page to view failed controls
        router.push('/controls');
        break;
      case 'pending_policies':
        // Navigate to policies page
        router.push('/policies');
        break;
      case 'ai_cost_spike':
        // Open copilot to view AI analytics
        setCopilotOpen(true);
        break;
      default:
        console.warn('Unknown insight type:', insight.type);
    }
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
    <div className="space-y-3 mb-6 w-full">
      {visibleInsights.map((insight, index) => (
        <Alert key={index} variant={getVariant(insight.severity)} className="w-full relative">
          {getIcon(insight.severity)}
          <AlertTitle className="pr-8">{insight.title}</AlertTitle>
          <AlertDescription className="pr-8">
            {insight.description}
          </AlertDescription>
          <div className="col-start-2 mt-3">
            <Button size="sm" variant="outline" onClick={() => handleAction(insight)}>
              {insight.actionRequired}
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDismiss(insight)}
            className="absolute top-3 right-3 h-6 w-6"
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      ))}
    </div>
  );
}

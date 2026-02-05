'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EvidenceMapping } from '@/types/ai';

interface EvidenceMappingPanelProps {
  evidenceId: string;
  onMappingComplete?: (mapping: EvidenceMapping) => void;
}

/**
 * Display AI-generated evidence mappings with confidence scores
 * 
 * Features:
 * - Show suggested control mappings
 * - Display confidence scores
 * - Allow manual review and approval
 * - Show AI reasoning
 */
export function EvidenceMappingPanel({ evidenceId, onMappingComplete }: EvidenceMappingPanelProps) {
  const [mapping, setMapping] = useState<EvidenceMapping | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleMapEvidence = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/evidence-mapping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ evidenceId }),
      });
      const result = await response.json();
      setMapping(result);
      onMappingComplete?.(result);
    } catch (error) {
      console.error('Failed to map evidence:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveMapping = async () => {
    if (!mapping) return;
    
    await fetch(`/api/ai/evidence-mapping/${mapping.id}/approve`, {
      method: 'POST',
    });
    
    setMapping({ ...mapping, isManuallyReviewed: true });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Evidence Mapping</CardTitle>
      </CardHeader>
      <CardContent>
        {!mapping && (
          <Button onClick={handleMapEvidence} disabled={isLoading}>
            {isLoading ? 'Mapping...' : 'Map to Controls'}
          </Button>
        )}

        {mapping && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Control: {mapping.controlId}</span>
                <Badge variant={mapping.confidence > 0.8 ? 'default' : 'secondary'}>
                  {(mapping.confidence * 100).toFixed(0)}% Confidence
                </Badge>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">AI Reasoning</h4>
              <p className="text-sm text-gray-600">{mapping.reasoning}</p>
            </div>

            {!mapping.isManuallyReviewed && (
              <div className="flex gap-2">
                <Button onClick={handleApproveMapping} variant="default">
                  Approve Mapping
                </Button>
                <Button variant="outline">Reject</Button>
              </div>
            )}

            {mapping.isManuallyReviewed && (
              <Badge variant="default">Manually Reviewed</Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

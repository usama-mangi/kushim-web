'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Policy, PolicyReview } from '@/types/ai';

interface PolicyDraftingWizardProps {
  onPolicyCreated?: (policy: Policy) => void;
}

/**
 * Multi-step wizard for generating policies with AI
 * 
 * Steps:
 * 1. Select policy type
 * 2. Select controls to cover
 * 3. Generate policy
 * 4. Review and refine
 * 5. Approve and save
 */
export function PolicyDraftingWizard({ onPolicyCreated }: PolicyDraftingWizardProps) {
  const [step, setStep] = useState(1);
  const [policyType, setPolicyType] = useState('');
  const [selectedControls, setSelectedControls] = useState<string[]>([]);
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [review, setReview] = useState<PolicyReview | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const policyTypes = [
    { value: 'ACCESS_CONTROL', label: 'Access Control Policy' },
    { value: 'DATA_PROTECTION', label: 'Data Protection Policy' },
    { value: 'INCIDENT_RESPONSE', label: 'Incident Response Policy' },
    { value: 'CHANGE_MANAGEMENT', label: 'Change Management Policy' },
    { value: 'BACKUP_RECOVERY', label: 'Backup & Recovery Policy' },
  ];

  const handleGeneratePolicy = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/policy-drafting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          policyType,
          controlIds: selectedControls,
        }),
      });
      const result = await response.json();
      setPolicy(result);
      setStep(3);
    } catch (error) {
      console.error('Failed to generate policy:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReviewPolicy = async () => {
    if (!policy) return;

    const response = await fetch(`/api/ai/policy-drafting/${policy.id}/review`, {
      method: 'POST',
    });
    const result = await response.json();
    setReview(result);
    setStep(4);
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>AI Policy Drafting Wizard</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Step 1: Select Policy Type */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Policy Type</label>
              <Select value={policyType} onValueChange={setPolicyType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select policy type" />
                </SelectTrigger>
                <SelectContent>
                  {policyTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={() => setStep(2)} disabled={!policyType}>
              Next
            </Button>
          </div>
        )}

        {/* Step 2: Select Controls */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Controls to Cover</label>
              <p className="text-sm text-gray-600 mb-2">
                Select the SOC 2 controls this policy should address
              </p>
              {/* Control selection UI would go here */}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={handleGeneratePolicy} disabled={isGenerating}>
                {isGenerating ? 'Generating...' : 'Generate Policy'}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Review Policy */}
        {step === 3 && policy && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">{policy.title}</h3>
              <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm">{policy.content}</pre>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button onClick={handleReviewPolicy}>
                Review with AI
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: AI Review Results */}
        {step === 4 && review && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded">
                <div className="text-2xl font-bold">{(review.overallScore * 100).toFixed(0)}%</div>
                <div className="text-sm text-gray-600">Overall Score</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded">
                <div className="text-2xl font-bold">{(review.completeness * 100).toFixed(0)}%</div>
                <div className="text-sm text-gray-600">Completeness</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded">
                <div className="text-2xl font-bold">{(review.soc2Alignment * 100).toFixed(0)}%</div>
                <div className="text-sm text-gray-600">SOC 2 Alignment</div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Suggestions for Improvement</h4>
              <ul className="space-y-2">
                {review.suggestions.map((suggestion, index) => (
                  <li key={index} className="border-l-2 border-blue-500 pl-3">
                    <div className="font-medium text-sm">{suggestion.section}</div>
                    <div className="text-sm text-gray-600">{suggestion.suggestion}</div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => setStep(3)}>Edit Policy</Button>
              <Button variant="default" onClick={() => onPolicyCreated?.(policy!)}>
                Approve & Save
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

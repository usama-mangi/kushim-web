'use client';

import { useState } from 'react';
import { ThumbsUp, ThumbsDown, Check, X, Sparkles, Link2, Brain, TrendingUp } from 'lucide-react';
import axios from 'axios';

interface LinkExplanation {
  id: string;
  source: {
    id: string;
    externalId: string;
    title: string;
    sourcePlatform: string;
    artifactType: string;
  };
  target: {
    id: string;
    externalId: string;
    title: string;
    sourcePlatform: string;
    artifactType: string;
  };
  confidenceScore: number;
  relationshipType: string;
  discoveryMethod: string;
  explanation: {
    deterministicScore?: number;
    mlScore?: number;
    semanticScore?: number;
    structuralScore?: number;
    method?: string;
    reason?: string;
  };
  createdAt: string;
}

interface LinkExplanationPanelProps {
  sourceId: string;
  targetId: string;
  onClose: () => void;
}

export default function LinkExplanationPanel({ sourceId, targetId, onClose }: LinkExplanationPanelProps) {
  const [explanation, setExplanation] = useState<LinkExplanation | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  useState(() => {
    fetchExplanation();
  });

  const fetchExplanation = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/links/between/${sourceId}/${targetId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setExplanation(response.data);
    } catch (error) {
      console.error('Failed to fetch link explanation', error);
    } finally {
      setLoading(false);
    }
  };

  const submitFeedback = async (feedback: 'positive' | 'negative') => {
    if (!explanation) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/links/${explanation.id}/feedback`,
        { feedback },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFeedbackSubmitted(true);
      setTimeout(() => setFeedbackSubmitted(false), 2000);
    } catch (error) {
      console.error('Failed to submit feedback', error);
    }
  };

  if (loading) {
    return (
      <div className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-2xl p-6 overflow-y-auto">
        <div className="flex items-center justify-center h-full">
          <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!explanation) {
    return (
      <div className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-2xl p-6">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
          <X className="w-5 h-5" />
        </button>
        <div className="text-center text-gray-500 mt-20">No link found</div>
      </div>
    );
  }

  const isMLAssisted = explanation.discoveryMethod === 'ml_assisted';
  const scorePercent = Math.round(explanation.confidenceScore * 100);

  return (
    <div 
      className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-2xl overflow-y-auto"
      role="complementary"
      aria-label="Link explanation panel"
    >
      <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between z-10">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Link2 className="w-5 h-5" aria-hidden="true" />
          Link Explanation
        </h2>
        <button 
          onClick={onClose} 
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
          aria-label="Close link explanation panel"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Method Badge */}
        <div className="flex items-center gap-2">
          {isMLAssisted ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium" role="status">
              <Brain className="w-4 h-4" aria-hidden="true" />
              ML-Assisted
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium" role="status">
              <Check className="w-4 h-4" aria-hidden="true" />
              Deterministic
            </span>
          )}
          <span className="text-sm text-gray-500" aria-label={`Confidence: ${scorePercent} percent`}>
            {scorePercent}% confidence
          </span>
        </div>

        {/* Artifacts */}
        <div className="space-y-3">
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg" role="region" aria-label="Source artifact">
            <div className="text-xs text-gray-500 mb-1">Source</div>
            <div className="font-medium text-sm">{explanation.source.title}</div>
            <div className="text-xs text-gray-500 mt-1">
              {explanation.source.sourcePlatform} · {explanation.source.artifactType}
            </div>
          </div>

          <div className="flex justify-center">
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
          </div>

          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Target</div>
            <div className="font-medium text-sm">{explanation.target.title}</div>
            <div className="text-xs text-gray-500 mt-1">
              {explanation.target.sourcePlatform} · {explanation.target.artifactType}
            </div>
          </div>
        </div>

        {/* Reason */}
        {explanation.explanation.reason && (
          <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
            <div className="text-sm font-medium text-indigo-900 dark:text-indigo-100 mb-1">
              Why was this linked?
            </div>
            <div className="text-sm text-indigo-700 dark:text-indigo-300">
              {explanation.explanation.reason}
            </div>
          </div>
        )}

        {/* Score Breakdown */}
        <div className="space-y-3">
          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">Score Breakdown</div>

          {explanation.explanation.deterministicScore !== undefined && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">Deterministic Signals</span>
                <span className="font-medium" aria-label={`${Math.round(explanation.explanation.deterministicScore * 100)} percent`}>{Math.round(explanation.explanation.deterministicScore * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2" role="meter" aria-valuenow={Math.round(explanation.explanation.deterministicScore * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Deterministic signals score">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${explanation.explanation.deterministicScore * 100}%` }}
                  aria-hidden="true"
                />
              </div>
            </div>
          )}

          {explanation.explanation.semanticScore !== undefined && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                  Semantic Similarity
                </span>
                <span className="font-medium" aria-label={`${Math.round(explanation.explanation.semanticScore * 100)} percent`}>{Math.round(explanation.explanation.semanticScore * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2" role="meter" aria-valuenow={Math.round(explanation.explanation.semanticScore * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Semantic similarity score">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${explanation.explanation.semanticScore * 100}%` }}
                  aria-hidden="true"
                />
              </div>
            </div>
          )}

          {explanation.explanation.structuralScore !== undefined && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
                  Structural Features
                </span>
                <span className="font-medium" aria-label={`${Math.round(explanation.explanation.structuralScore * 100)} percent`}>{Math.round(explanation.explanation.structuralScore * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2" role="meter" aria-valuenow={Math.round(explanation.explanation.structuralScore * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Structural features score">
                <div
                  className="bg-purple-500 h-2 rounded-full transition-all"
                  style={{ width: `${explanation.explanation.structuralScore * 100}%` }}
                  aria-hidden="true"
                />
              </div>
            </div>
          )}

          {explanation.explanation.mlScore !== undefined && (
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-semibold text-gray-700 dark:text-gray-300">Combined ML Score</span>
                <span className="font-semibold" aria-label={`${Math.round(explanation.explanation.mlScore * 100)} percent`}>{Math.round(explanation.explanation.mlScore * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5" role="meter" aria-valuenow={Math.round(explanation.explanation.mlScore * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Combined ML score">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2.5 rounded-full transition-all"
                  style={{ width: `${explanation.explanation.mlScore * 100}%` }}
                  aria-hidden="true"
                />
              </div>
            </div>
          )}
        </div>

        {/* Feedback for ML Links */}
        {isMLAssisted && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Was this link helpful?
            </div>
            {feedbackSubmitted ? (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <Check className="w-4 h-4" />
                Thank you for your feedback!
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => submitFeedback('positive')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-700 dark:text-green-300 rounded-lg transition"
                >
                  <ThumbsUp className="w-4 h-4" />
                  Yes
                </button>
                <button
                  onClick={() => submitFeedback('negative')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg transition"
                >
                  <ThumbsDown className="w-4 h-4" />
                  No
                </button>
              </div>
            )}
          </div>
        )}

        {/* Metadata */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 space-y-1">
          <div>Type: {explanation.relationshipType}</div>
          <div>Created: {new Date(explanation.createdAt).toLocaleDateString()}</div>
        </div>
      </div>
    </div>
  );
}

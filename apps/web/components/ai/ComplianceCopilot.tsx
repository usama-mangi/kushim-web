'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CopilotMessage, CopilotConversation } from '@/types/ai';

interface ComplianceCopilotProps {
  conversationId?: string;
  onConversationStart?: (conversation: CopilotConversation) => void;
}

/**
 * Chat interface for Compliance Copilot
 * 
 * Features:
 * - Real-time chat with AI assistant
 * - Citation display for evidence-backed answers
 * - Conversation history
 * - Quick action buttons
 */
export function ComplianceCopilot({ conversationId, onConversationStart }: ComplianceCopilotProps) {
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: CopilotMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      createdAt: new Date(),
    };

    setMessages([...messages, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          conversationId,
        }),
      });

      const result = await response.json();

      const assistantMessage: CopilotMessage = {
        id: result.id,
        role: 'assistant',
        content: result.message,
        citations: result.citations,
        createdAt: new Date(result.createdAt),
      };

      setMessages([...messages, userMessage, assistantMessage]);

      if (!conversationId && result.conversationId) {
        onConversationStart?.(result);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const quickQuestions = [
    'What is our current compliance status?',
    'What controls are we missing?',
    'Show me recent evidence collected',
    'What policies need to be updated?',
  ];

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader>
        <CardTitle>Compliance Copilot</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-8">
              <p className="mb-4">Ask me anything about your compliance program</p>
              <div className="space-y-2">
                {quickQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setInput(question)}
                    className="block mx-auto"
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>

                {message.citations && message.citations.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <div className="text-xs font-medium mb-1">Sources:</div>
                    {message.citations.map((citation, index) => (
                      <div key={index} className="text-xs mt-1">
                        <a
                          href={`/evidence/${citation.evidenceId}`}
                          className="text-blue-600 hover:underline"
                        >
                          {citation.title}
                        </a>
                        {citation.controlId && (
                          <span className="ml-2 text-gray-600">({citation.controlId})</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-3">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask about compliance..."
            disabled={isLoading}
          />
          <Button onClick={handleSendMessage} disabled={isLoading || !input.trim()}>
            Send
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

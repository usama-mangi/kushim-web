# Copilot Frontend Integration Guide

## Quick Start

### 1. Install Dependencies (if needed)
```bash
npm install axios date-fns
```

### 2. API Client Setup

```typescript
// lib/api/copilot.ts
import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Conversation {
  id: string;
  customerId: string;
  userId: string;
  title: string;
  status: 'ACTIVE' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string | null;
  messageCount: number;
  messages?: Message[];
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  metadata?: {
    controls?: string[];
    policies?: string[];
    evidence?: string[];
    sources?: Array<{
      type: string;
      id: string;
      title: string;
    }>;
  };
  tokens?: number;
  cost?: number;
  createdAt: string;
}

export interface Suggestion {
  title: string;
  description: string;
  type: 'CONTROL' | 'INTEGRATION' | 'POLICY' | 'EVIDENCE' | 'GENERAL';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  action?: string;
  metadata?: Record<string, any>;
}

export const copilotApi = {
  // Create new conversation
  async createConversation(title?: string): Promise<Conversation> {
    const response = await axios.post(`${API_BASE}/api/copilot/conversations`, {
      title,
    });
    return response.data;
  },

  // List all conversations
  async listConversations(): Promise<Conversation[]> {
    const response = await axios.get(`${API_BASE}/api/copilot/conversations`);
    return response.data;
  },

  // Get conversation with messages
  async getConversation(id: string): Promise<Conversation> {
    const response = await axios.get(
      `${API_BASE}/api/copilot/conversations/${id}`,
    );
    return response.data;
  },

  // Send message
  async sendMessage(conversationId: string, message: string): Promise<Message> {
    const response = await axios.post(
      `${API_BASE}/api/copilot/conversations/${conversationId}/messages`,
      { message },
    );
    return response.data;
  },

  // Archive conversation
  async archiveConversation(id: string): Promise<void> {
    await axios.delete(`${API_BASE}/api/copilot/conversations/${id}`);
  },

  // Get smart suggestions
  async getSuggestions(): Promise<{
    suggestions: Suggestion[];
    healthScore: number;
    generatedAt: string;
  }> {
    const response = await axios.get(`${API_BASE}/api/copilot/suggestions`);
    return response.data;
  },
};
```

### 3. React Hook for Copilot

```typescript
// hooks/useCopilot.ts
import { useState, useCallback } from 'react';
import { copilotApi, Conversation, Message } from '@/lib/api/copilot';

export function useCopilot(conversationId?: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  const loadConversation = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const conv = await copilotApi.getConversation(id);
      setConversation(conv);
      setMessages(conv.messages || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const sendMessage = useCallback(
    async (message: string) => {
      if (!conversation) return;

      setLoading(true);
      setError(null);

      // Optimistically add user message
      const userMessage: Message = {
        id: 'temp-' + Date.now(),
        conversationId: conversation.id,
        role: 'USER',
        content: message,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);

      try {
        const assistantMessage = await copilotApi.sendMessage(
          conversation.id,
          message,
        );
        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err) {
        setError(err.message);
        // Remove optimistic message on error
        setMessages((prev) =>
          prev.filter((m) => m.id !== userMessage.id),
        );
      } finally {
        setLoading(false);
      }
    },
    [conversation],
  );

  const createNewConversation = useCallback(async (title?: string) => {
    setLoading(true);
    setError(null);
    try {
      const conv = await copilotApi.createConversation(title);
      setConversation(conv);
      setMessages([]);
      return conv;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    conversation,
    messages,
    loading,
    error,
    loadConversation,
    sendMessage,
    createNewConversation,
  };
}
```

### 4. Chat Component Example

```typescript
// components/copilot/CopilotChat.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useCopilot } from '@/hooks/useCopilot';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Loader2, Send, Bot, User } from 'lucide-react';

export function CopilotChat({ conversationId }: { conversationId?: string }) {
  const { messages, loading, error, loadConversation, sendMessage, createNewConversation } =
    useCopilot();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId);
    } else {
      createNewConversation('New Chat');
    }
  }, [conversationId, loadConversation, createNewConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const message = input.trim();
    setInput('');
    await sendMessage(message);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-200 text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t p-4">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about compliance..."
            disabled={loading}
            maxLength={4000}
            className="flex-1"
          />
          <Button type="submit" disabled={loading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Ask about controls, evidence, policies, or your compliance status
        </p>
      </form>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'USER';

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
          <Bot className="h-4 w-4 text-blue-600" />
        </div>
      )}
      <Card
        className={`max-w-[80%] p-3 ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-gray-50 text-gray-900'
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        {message.metadata?.sources && message.metadata.sources.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <p className="text-xs font-medium mb-1">Sources:</p>
            <div className="flex flex-wrap gap-1">
              {message.metadata.sources.map((source, idx) => (
                <span
                  key={idx}
                  className="text-xs bg-white/20 px-2 py-1 rounded"
                >
                  {source.title}
                </span>
              ))}
            </div>
          </div>
        )}
        {message.cost && (
          <p className="text-xs opacity-70 mt-2">
            Cost: ${message.cost.toFixed(4)}
          </p>
        )}
      </Card>
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
          <User className="h-4 w-4 text-gray-600" />
        </div>
      )}
    </div>
  );
}
```

### 5. Suggestions Widget

```typescript
// components/copilot/SuggestionsWidget.tsx
'use client';

import { useEffect, useState } from 'react';
import { copilotApi, Suggestion } from '@/lib/api/copilot';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, AlertTriangle, Lightbulb } from 'lucide-react';

export function SuggestionsWidget() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [healthScore, setHealthScore] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    try {
      const data = await copilotApi.getSuggestions();
      setSuggestions(data.suggestions);
      setHealthScore(data.healthScore);
    } catch (error) {
      console.error('Failed to load suggestions', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading suggestions...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Smart Suggestions</span>
          <Badge variant={healthScore >= 0.8 ? 'success' : 'warning'}>
            Health: {(healthScore * 100).toFixed(0)}%
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
            <p>All good! No urgent actions needed.</p>
          </div>
        ) : (
          suggestions.map((suggestion, idx) => (
            <SuggestionCard key={idx} suggestion={suggestion} />
          ))
        )}
      </CardContent>
    </Card>
  );
}

function SuggestionCard({ suggestion }: { suggestion: Suggestion }) {
  const priorityColors = {
    HIGH: 'bg-red-100 text-red-800 border-red-200',
    MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    LOW: 'bg-blue-100 text-blue-800 border-blue-200',
  };

  const icons = {
    HIGH: AlertCircle,
    MEDIUM: AlertTriangle,
    LOW: Lightbulb,
  };

  const Icon = icons[suggestion.priority];

  return (
    <div
      className={`p-3 border rounded-lg ${priorityColors[suggestion.priority]}`}
    >
      <div className="flex items-start gap-2">
        <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h4 className="font-medium">{suggestion.title}</h4>
          <p className="text-sm mt-1 opacity-90">{suggestion.description}</p>
          {suggestion.action && (
            <p className="text-sm mt-2 font-medium">→ {suggestion.action}</p>
          )}
        </div>
      </div>
    </div>
  );
}
```

## Example Conversation Flows

### Flow 1: First-time User
```
User: "How do I get started with SOC 2 compliance?"

Copilot: "Great question! Here's your roadmap to SOC 2 compliance:

1. **Understand Your Current Status** (Week 1-2)
   - Your compliance score: 45% (needs improvement)
   - You have 3 active integrations (AWS, GitHub, Okta)
   - 15 controls are passing, 25 need work

2. **Set Up Integrations** (Week 3-4)
   - ✓ AWS: Already connected
   - ✓ GitHub: Already connected
   - ⚠ Jira: Connect to auto-create remediation tasks
   - ⚠ Slack: Connect for notifications

3. **Address Failed Controls** (Week 5-8)
   - Start with high-priority controls (CC6.x - Access Control)
   - Gather missing evidence using our automated collectors
   - Review and approve draft policies

4. **Continuous Monitoring** (Ongoing)
   - Schedule weekly compliance reviews
   - Monitor this dashboard for suggestions
   - Keep integrations synced

Would you like me to walk you through any specific step?"
```

### Flow 2: Specific Control Question
```
User: "What is CC6.1?"

Copilot: "CC6.1 is about **Logical and Physical Access Controls**.

**What it requires:**
- Restrict access to IT resources to authorized users
- Implement authentication and authorization mechanisms
- Monitor and log access attempts
- Regularly review access permissions

**Your Status:** ⚠ WARNING
- Last checked: 2024-02-05
- Issue: 2 users have excessive permissions in AWS

**Evidence Found:**
- AWS IAM policies (collected today)
- Okta user access logs (collected yesterday)

**Next Steps:**
1. Review AWS users with AdministratorAccess
2. Implement least-privilege access
3. Document access control procedures

Want me to show you the specific users with excessive permissions?"
```

### Flow 3: Follow-up Question
```
User: "Yes, show me those users"

Copilot: "Based on your AWS IAM evidence collected today:

**Users with AdministratorAccess:**
1. john@example.com
   - Last login: 2024-02-04
   - MFA: ✓ Enabled
   
2. sarah@example.com
   - Last login: 2024-01-15 (30 days ago)
   - MFA: ✗ Not enabled

**Recommendation:**
- Remove AdministratorAccess from sarah@example.com (inactive)
- Consider creating role-based policies instead of admin access
- Enable MFA for all admin users

Would you like me to create a Jira task to track this remediation?"
```

## Error Handling

### Rate Limiting
```typescript
try {
  await copilotApi.sendMessage(conversationId, message);
} catch (error) {
  if (error.response?.status === 429) {
    showError('Too many messages. Please wait a minute and try again.');
  }
}
```

### Network Errors
```typescript
import axios from 'axios';

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      // Network error
      showError('Connection failed. Please check your internet.');
    } else if (error.response.status >= 500) {
      // Server error
      showError('Server error. Please try again later.');
    }
    return Promise.reject(error);
  }
);
```

## Performance Tips

1. **Debounce Typing:** Don't send on every keystroke
2. **Optimistic Updates:** Show user message immediately
3. **Pagination:** Load messages in batches for long conversations
4. **Caching:** Cache conversation list locally
5. **Lazy Loading:** Only load full conversation when opened

## Styling Guidelines

- Use Radix UI components (already in your design system)
- Keep message bubbles max 80% width
- Show loading states for better UX
- Display sources/citations inline
- Use color coding for priority (red=high, yellow=medium, blue=low)

## Testing

```typescript
// __tests__/copilot.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CopilotChat } from '@/components/copilot/CopilotChat';

test('sends message and displays response', async () => {
  render(<CopilotChat />);
  
  const input = screen.getByPlaceholderText('Ask about compliance...');
  const submit = screen.getByRole('button');
  
  await userEvent.type(input, 'What is CC1.2?');
  await userEvent.click(submit);
  
  await waitFor(() => {
    expect(screen.getByText(/CC1.2 is/)).toBeInTheDocument();
  });
});
```

---

**Questions?** Contact the backend team or check the full API docs at `/docs/ai/COMPLIANCE_COPILOT.md`

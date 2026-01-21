'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Command, MessageSquare, UserPlus, CheckCircle2, 
  LinkIcon, RefreshCw, Send, AlertCircle, ChevronRight, Loader2,
  Github, Slack, Hash, FileText, HelpCircle, Sparkles
} from 'lucide-react';
import Fuse from 'fuse.js';
import { toast } from 'sonner';
import { Artifact } from '@/store/useStore';

interface EnhancedCommandBarProps {
  isOpen: boolean;
  onClose: () => void;
  records: Artifact[];
  onSelectArtifact: (artifact: Artifact) => void;
  onExecuteAction: (command: string) => Promise<any>;
}

type CommandMode = 'search' | 'command';

interface ValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
  preview?: string;
}

const ACTION_VERBS = ['comment', 'assign', 'reply', 'close', 'link', 'react'];
const DESTRUCTIVE_VERBS = ['close', 'assign'];

export default function EnhancedCommandBar({
  isOpen,
  onClose,
  records,
  onSelectArtifact,
  onExecuteAction,
}: EnhancedCommandBarProps) {
  const [input, setInput] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mode, setMode] = useState<CommandMode>('search');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingCommand, setPendingCommand] = useState('');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load command history from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('kushim_command_history');
    if (stored) {
      try {
        setCommandHistory(JSON.parse(stored));
      } catch (e) {
        // Ignore parse errors
      }
    }

    // Check if first time user
    const hasSeenOnboarding = localStorage.getItem('kushim_command_onboarding');
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  // Save command history to localStorage
  const saveToHistory = useCallback((command: string) => {
    const newHistory = [command, ...commandHistory.filter(c => c !== command)].slice(0, 50);
    setCommandHistory(newHistory);
    localStorage.setItem('kushim_command_history', JSON.stringify(newHistory));
  }, [commandHistory]);

  // Fuzzy search using Fuse.js
  const fuse = useMemo(() => {
    return new Fuse(records, {
      keys: ['title', 'body', 'externalId', 'author'],
      threshold: 0.3,
      includeScore: true,
    });
  }, [records]);

  // Determine mode based on input
  useEffect(() => {
    const firstWord = input.trim().split(/\s+/)[0]?.toLowerCase();
    if (ACTION_VERBS.includes(firstWord)) {
      setMode('command');
    } else {
      setMode('search');
    }
  }, [input]);

  // Validate command syntax in real-time
  const validation = useMemo((): ValidationResult => {
    if (mode !== 'command') return { isValid: true };

    const trimmed = input.trim();
    if (!trimmed) return { isValid: true };

    const parts = trimmed.split(/\s+/);
    const verb = parts[0]?.toLowerCase();
    const target = parts[1];
    const payload = parts.slice(2).join(' ');

    if (!ACTION_VERBS.includes(verb)) {
      return { isValid: false, error: `Unknown action "${verb}"` };
    }

    if (!target) {
      return { isValid: false, error: `${verb} requires a target (e.g., GH-13)` };
    }

    if (verb === 'link') {
      const target2 = parts[2];
      if (!target2) {
        return { isValid: false, error: 'link requires two targets (e.g., link GH-13 PROJ-456)' };
      }
      return { 
        isValid: true, 
        preview: `Link ${target} ↔️ ${target2}` 
      };
    }

    if (['comment', 'reply', 'react'].includes(verb) && !payload) {
      return { 
        isValid: false, 
        error: `${verb} requires a message`
      };
    }

    if (verb === 'assign' && !payload) {
      return { 
        isValid: false, 
        error: 'assign requires a user (e.g., @username or user@email.com)' 
      };
    }

    // Check if target might exist
    const targetMatch = records.find(r => 
      r.externalId === target || 
      r.title.toLowerCase().includes(target.toLowerCase())
    );

    if (!targetMatch) {
      return {
        isValid: true,
        warning: `Target "${target}" not found in synced records`
      };
    }

    // Generate preview
    let preview = '';
    switch (verb) {
      case 'comment':
        preview = `💬 Comment on ${targetMatch.title.substring(0, 30)}...`;
        break;
      case 'assign':
        preview = `👤 Assign ${targetMatch.title.substring(0, 30)}... to ${payload}`;
        break;
      case 'close':
        preview = `✅ Close ${targetMatch.title.substring(0, 30)}...`;
        break;
      case 'reply':
        preview = `↩️ Reply to ${targetMatch.title.substring(0, 30)}...`;
        break;
      case 'react':
        preview = `${payload === 'thumbsup' ? '👍' : '❤️'} React to ${targetMatch.title.substring(0, 30)}...`;
        break;
    }

    return { isValid: true, preview };
  }, [input, mode, records]);

  // Get autocomplete suggestions
  const suggestions = useMemo(() => {
    if (mode !== 'command' || !input.trim()) return [];

    const parts = input.trim().split(/\s+/);
    const verb = parts[0]?.toLowerCase();
    
    if (parts.length === 2 && ACTION_VERBS.includes(verb)) {
      // Suggest artifact IDs
      const partial = parts[1].toUpperCase();
      return records
        .filter(r => r.externalId.toUpperCase().startsWith(partial) || r.title.toLowerCase().includes(partial.toLowerCase()))
        .slice(0, 5)
        .map(r => ({
          text: `${verb} ${r.externalId} `,
          label: r.title,
          platform: r.sourcePlatform,
        }));
    }

    return [];
  }, [input, mode, records]);

  // Fuzzy search results
  const searchResults = useMemo(() => {
    if (mode === 'command' || !input.trim()) return [];
    
    const results = fuse.search(input);
    return results.slice(0, 10).map(r => r.item);
  }, [input, mode, fuse]);

  // Combined results for keyboard navigation
  const displayItems = mode === 'search' ? searchResults : suggestions;

  // Reset state when closing
  useEffect(() => {
    if (!isOpen) {
      setInput('');
      setSelectedIndex(0);
      setHistoryIndex(-1);
      setShowConfirm(false);
      setPendingCommand('');
    } else {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      if (showConfirm) {
        setShowConfirm(false);
      } else {
        onClose();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, displayItems.length - 1));
      setHistoryIndex(-1);
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (input === '' && commandHistory.length > 0) {
        // Navigate command history
        const newIndex = historyIndex + 1;
        if (newIndex < commandHistory.length) {
          setHistoryIndex(newIndex);
          setInput(commandHistory[newIndex]);
        }
      } else {
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      }
    }

    if (e.key === 'Enter') {
      e.preventDefault();

      if (mode === 'search' && displayItems.length > 0) {
        const selected = searchResults[selectedIndex];
        if (selected) {
          onSelectArtifact(selected);
          onClose();
        }
      } else if (mode === 'command') {
        if (suggestions.length > 0 && selectedIndex < suggestions.length) {
          // Autocomplete selected
          setInput(suggestions[selectedIndex].text);
          setSelectedIndex(0);
        } else if (validation.isValid) {
          // Execute command
          const verb = input.trim().split(/\s+/)[0]?.toLowerCase();
          if (DESTRUCTIVE_VERBS.includes(verb) && !showConfirm) {
            setPendingCommand(input.trim());
            setShowConfirm(true);
          } else {
            executeCommand(input.trim());
          }
        }
      }
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      if (suggestions.length > 0) {
        setInput(suggestions[0].text);
      }
    }
  }, [displayItems, mode, selectedIndex, validation, searchResults, suggestions, input, commandHistory, historyIndex, showConfirm, onSelectArtifact, onClose]);

  const executeCommand = async (command: string) => {
    setIsExecuting(true);
    try {
      const result = await onExecuteAction(command);
      saveToHistory(command);
      toast.success('Command executed successfully', {
        description: result?.message || validation.preview || command,
      });
      onClose();
    } catch (error: any) {
      // Extract error message from axios error response
      const errorMessage = error?.response?.data?.message || error?.message || 'Unknown error occurred';
      toast.error('Command failed', {
        description: errorMessage,
      });
    } finally {
      setIsExecuting(false);
      setShowConfirm(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform?.toLowerCase()) {
      case 'github': return <Github className="w-4 h-4" />;
      case 'slack': return <Slack className="w-4 h-4" />;
      case 'jira': return <Hash className="w-4 h-4 text-blue-500" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const dismissOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('kushim_command_onboarding', 'true');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="bg-slate-900 w-full max-w-2xl rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden relative z-10 border border-slate-800 transform animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center px-6 py-4 border-b border-slate-800 bg-slate-900">
          <div className="flex items-center space-x-3 flex-1">
            <Command className="w-5 h-5 text-indigo-500" />
            
            <input 
              ref={inputRef}
              autoFocus
              placeholder="Type a command or search..."
              className="flex-1 bg-transparent border-none outline-none text-lg text-white placeholder-slate-600 font-medium"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isExecuting}
            />

            {isExecuting && <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />}
          </div>

          <div className="flex items-center space-x-2">
            {/* Mode indicator */}
            <div className={`text-[10px] font-bold px-2 py-1 rounded ${mode === 'command' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-500'}`}>
              {mode === 'command' ? '⚡ COMMAND' : '🔍 SEARCH'}
            </div>
            <kbd className="text-[10px] bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded border border-slate-700 uppercase">Esc</kbd>
          </div>
        </div>

        {/* Validation feedback */}
        {mode === 'command' && input && (
          <div className={`px-6 py-2 text-sm border-b ${validation.isValid ? validation.warning ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' : 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
            {validation.error && `❌ ${validation.error}`}
            {validation.warning && `⚠️ ${validation.warning}`}
            {validation.preview && !validation.error && !validation.warning && `${validation.preview}`}
          </div>
        )}

        {/* Onboarding tooltip */}
        {showOnboarding && !input && (
          <div className="px-6 py-3 bg-indigo-500/10 border-b border-indigo-500/20 flex items-start space-x-3">
            <Sparkles className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-indigo-200 font-medium">Welcome to the Command Bar!</p>
              <p className="text-xs text-indigo-300/70 mt-1">Type actions like "comment GH-13 LGTM!" or search for artifacts. Use ↑↓ to navigate, Tab to autocomplete.</p>
            </div>
            <button onClick={dismissOnboarding} className="text-indigo-400 hover:text-indigo-300 text-xs">Got it</button>
          </div>
        )}

        {/* Confirmation dialog */}
        {showConfirm && (
          <div className="px-6 py-4 bg-orange-500/10 border-b border-orange-500/20">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-orange-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-orange-200">Confirm Destructive Action</p>
                <p className="text-xs text-orange-300/70 mt-1">{validation.preview}</p>
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={() => executeCommand(pendingCommand)}
                  className="px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded text-sm font-medium"
                >
                  Confirm
                </button>
                <button 
                  onClick={() => setShowConfirm(false)}
                  className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto scrollbar-hide py-2">
          {mode === 'search' && searchResults.length > 0 ? (
            <div className="px-2">
              {searchResults.map((record, idx) => (
                <div 
                  key={record.id}
                  onClick={() => { onSelectArtifact(record); onClose(); }}
                  className={`p-3 hover:bg-slate-800 rounded-xl cursor-pointer transition group flex items-center space-x-4 mx-2 ${idx === selectedIndex ? 'bg-slate-800' : ''}`}
                >
                  <div className={`p-2 rounded-lg bg-slate-950 border border-slate-800 transition ${idx === selectedIndex ? 'text-indigo-400 border-indigo-500/30' : 'text-slate-500'}`}>
                    {getPlatformIcon(record.sourcePlatform)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-200 group-hover:text-white transition truncate">{record.title}</p>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{record.sourcePlatform} • {record.author}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-slate-400 transition" />
                </div>
              ))}
            </div>
          ) : mode === 'command' && suggestions.length > 0 ? (
            <div className="px-2">
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2 px-4">Suggestions (Tab to autocomplete)</p>
              {suggestions.map((suggestion, idx) => (
                <div
                  key={idx}
                  onClick={() => setInput(suggestion.text)}
                  className={`p-3 hover:bg-slate-800 rounded-xl cursor-pointer transition group flex items-center space-x-4 mx-2 ${idx === selectedIndex ? 'bg-slate-800' : ''}`}
                >
                  <div className={`p-2 rounded-lg bg-slate-950 border border-slate-800 transition ${idx === selectedIndex ? 'text-indigo-400 border-indigo-500/30' : 'text-slate-500'}`}>
                    {getPlatformIcon(suggestion.platform)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono text-indigo-300">{suggestion.text}</p>
                    <p className="text-xs text-slate-500 truncate">{suggestion.label}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : input && searchResults.length === 0 && mode === 'search' ? (
            <div className="py-12 text-center">
              <AlertCircle className="w-8 h-8 text-slate-800 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No artifacts matching "{input}"</p>
            </div>
          ) : (
            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-slate-950/50 border border-slate-800 rounded-lg">
                  <p className="text-slate-400 font-mono">comment GH-13 LGTM!</p>
                </div>
                <div className="p-2 bg-slate-950/50 border border-slate-800 rounded-lg">
                  <p className="text-slate-400 font-mono">assign PROJ-456 @alice</p>
                </div>
                <div className="p-2 bg-slate-950/50 border border-slate-800 rounded-lg">
                  <p className="text-slate-400 font-mono">link GH-13 PROJ-456</p>
                </div>
                <div className="p-2 bg-slate-950/50 border border-slate-800 rounded-lg">
                  <p className="text-slate-400 font-mono">close GH-99</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex justify-between items-center text-[10px]">
          <div className="flex items-center space-x-4 text-slate-600 uppercase tracking-widest font-bold">
            <span className="flex items-center"><kbd className="bg-slate-900 px-1.5 py-0.5 rounded mr-1.5 border border-slate-800">↑↓</kbd> Navigate</span>
            <span className="flex items-center"><kbd className="bg-slate-900 px-1.5 py-0.5 rounded mr-1.5 border border-slate-800">Tab</kbd> Autocomplete</span>
            <span className="flex items-center"><kbd className="bg-slate-900 px-1.5 py-0.5 rounded mr-1.5 border border-slate-800">↵</kbd> {mode === 'command' ? 'Execute' : 'Select'}</span>
          </div>
          <button 
            onClick={() => toast.info('Command syntax help', { description: 'Use format: verb TARGET payload. Examples: comment GH-13 message, assign PROJ-123 @user' })}
            className="flex items-center text-indigo-500 hover:text-indigo-400"
          >
            <HelpCircle className="w-3 h-3 mr-1" />
            Help
          </button>
        </div>
      </div>
    </div>
  );
}

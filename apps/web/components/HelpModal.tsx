'use client';

import { useState, useEffect } from 'react';
import { useFocusTrap } from '@/hooks/useA11y';
import { 
  X, Search, HelpCircle, Keyboard, Terminal, Network, 
  ChevronRight, Command as CommandIcon, Sparkles
} from 'lucide-react';
import { useTour } from '@/hooks/useTour';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabId = 'shortcuts' | 'commands' | 'graph' | 'faq';

const KEYBOARD_SHORTCUTS = [
  { keys: ['⌘', 'K'], action: 'Open command bar', mac: '⌘K', windows: 'Ctrl+K' },
  { keys: ['⌘', '?'], action: 'Open help modal', mac: '⌘?', windows: 'Ctrl+?' },
  { keys: ['Esc'], action: 'Close panels/modals', mac: 'Esc', windows: 'Esc' },
  { keys: ['↑'], action: 'Recall previous command', mac: '↑', windows: '↑' },
  { keys: ['↓'], action: 'Navigate command history', mac: '↓', windows: '↓' },
  { keys: ['Tab'], action: 'Autocomplete artifact ID', mac: 'Tab', windows: 'Tab' },
  { keys: ['Enter'], action: 'Execute command/search', mac: 'Enter', windows: 'Enter' },
];

const COMMAND_EXAMPLES = [
  {
    syntax: 'comment <artifact-id> <message>',
    example: 'comment PR-123 Looks good!',
    description: 'Add a comment to a pull request or issue',
  },
  {
    syntax: 'assign <artifact-id> @<username>',
    example: 'assign ISSUE-456 @johndoe',
    description: 'Assign an artifact to a team member',
  },
  {
    syntax: 'reply <artifact-id> <message>',
    example: 'reply THREAD-789 Thanks for the update',
    description: 'Reply to a Slack thread or discussion',
  },
  {
    syntax: 'close <artifact-id>',
    example: 'close PR-123',
    description: 'Close a pull request or issue',
  },
  {
    syntax: 'link <artifact-1> <artifact-2>',
    example: 'link PR-123 ISSUE-456',
    description: 'Manually link two related artifacts',
  },
  {
    syntax: 'react <artifact-id> <emoji>',
    example: 'react PR-123 👍',
    description: 'Add a reaction to an artifact',
  },
];

const GRAPH_CONTROLS = [
  { action: 'Click node', result: 'View artifact details' },
  { action: 'Right-click node', result: 'Quick actions menu' },
  { action: 'Click & drag background', result: 'Pan graph view' },
  { action: 'Scroll wheel', result: 'Zoom in/out' },
  { action: 'Double-click node', result: 'Expand connected nodes' },
  { action: 'Hover over link', result: 'View link explanation' },
];

const FAQ_ITEMS = [
  {
    question: 'What is deterministic linking?',
    answer: 'Deterministic linking uses explicit signals like artifact IDs, shared URLs, and participant overlap to create guaranteed connections between related work items. No guessing - only proven relationships.',
  },
  {
    question: 'How does ML shadow scoring work?',
    answer: 'ML models run in parallel with deterministic linking, suggesting potential connections based on semantic similarity and temporal patterns. They never override manual or deterministic links - they only suggest.',
  },
  {
    question: 'What does the ML-Assisted badge mean?',
    answer: 'It indicates a link was suggested by machine learning with high confidence. You can click the badge to see the full score breakdown and provide feedback to improve the model.',
  },
  {
    question: 'How do I manually link two artifacts?',
    answer: 'Use the command: "link <artifact-1> <artifact-2>". For example: "link PR-123 ISSUE-456". This creates a manual link that ML will learn from.',
  },
  {
    question: 'Can I undo an action?',
    answer: 'Currently, undo functionality is in development (Phase 4). For now, you can manually reverse actions through the platform\'s native UI.',
  },
  {
    question: 'How often does Kushim sync data?',
    answer: 'Kushim uses real-time WebSocket updates for instant notifications. You can manually trigger a full sync using the "Sync" button in the header.',
  },
];

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>('shortcuts');
  const [searchQuery, setSearchQuery] = useState('');
  const trapRef = useFocusTrap(isOpen);
  const { restartTour } = useTour();

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Reset search when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredFaq = FAQ_ITEMS.filter(
    item =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-modal-title"
    >
      <div
        ref={trapRef as React.RefObject<HTMLDivElement>}
        className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-600/20 rounded-lg">
              <HelpCircle className="w-6 h-6 text-indigo-400" aria-hidden="true" />
            </div>
            <h2 id="help-modal-title" className="text-xl font-bold text-white">
              Help & Documentation
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-white"
            aria-label="Close help modal"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-6 pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" aria-hidden="true" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search help articles..."
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              aria-label="Search help articles"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4 border-b border-slate-800">
          <div className="flex space-x-1" role="tablist" aria-label="Help topics">
            <button
              role="tab"
              aria-selected={activeTab === 'shortcuts'}
              aria-controls="shortcuts-panel"
              onClick={() => setActiveTab('shortcuts')}
              className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition ${
                activeTab === 'shortcuts'
                  ? 'bg-slate-800 text-white border-t border-x border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Keyboard className="w-4 h-4 inline-block mr-2" aria-hidden="true" />
              Shortcuts
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'commands'}
              aria-controls="commands-panel"
              onClick={() => setActiveTab('commands')}
              className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition ${
                activeTab === 'commands'
                  ? 'bg-slate-800 text-white border-t border-x border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal className="w-4 h-4 inline-block mr-2" aria-hidden="true" />
              Commands
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'graph'}
              aria-controls="graph-panel"
              onClick={() => setActiveTab('graph')}
              className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition ${
                activeTab === 'graph'
                  ? 'bg-slate-800 text-white border-t border-x border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Network className="w-4 h-4 inline-block mr-2" aria-hidden="true" />
              Graph Controls
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'faq'}
              aria-controls="faq-panel"
              onClick={() => setActiveTab('faq')}
              className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition ${
                activeTab === 'faq'
                  ? 'bg-slate-800 text-white border-t border-x border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <HelpCircle className="w-4 h-4 inline-block mr-2" aria-hidden="true" />
              FAQ
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Keyboard Shortcuts Tab */}
          {activeTab === 'shortcuts' && (
            <div id="shortcuts-panel" role="tabpanel" aria-labelledby="shortcuts-tab">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Action</th>
                    <th className="text-right py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Shortcut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {KEYBOARD_SHORTCUTS.map((shortcut, index) => (
                    <tr key={index} className="hover:bg-slate-800/50 transition">
                      <td className="py-3 px-4 text-sm text-slate-300">{shortcut.action}</td>
                      <td className="py-3 px-4 text-right">
                        <kbd className="px-2 py-1 bg-slate-950 border border-slate-700 rounded text-xs font-mono text-slate-300">
                          {shortcut.mac}
                        </kbd>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Command Syntax Tab */}
          {activeTab === 'commands' && (
            <div id="commands-panel" role="tabpanel" aria-labelledby="commands-tab" className="space-y-4">
              {COMMAND_EXAMPLES.map((cmd, index) => (
                <div key={index} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <code className="text-sm font-mono text-indigo-400">{cmd.syntax}</code>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">{cmd.description}</p>
                  <div className="bg-slate-950 border border-slate-700 rounded-lg p-3">
                    <div className="flex items-center space-x-2 text-xs">
                      <CommandIcon className="w-3 h-3 text-slate-600" aria-hidden="true" />
                      <span className="text-slate-500">Example:</span>
                      <code className="text-slate-300 font-mono">{cmd.example}</code>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Graph Controls Tab */}
          {activeTab === 'graph' && (
            <div id="graph-panel" role="tabpanel" aria-labelledby="graph-tab">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Action</th>
                    <th className="text-right py-3 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {GRAPH_CONTROLS.map((control, index) => (
                    <tr key={index} className="hover:bg-slate-800/50 transition">
                      <td className="py-3 px-4 text-sm text-slate-300">{control.action}</td>
                      <td className="py-3 px-4 text-right text-sm text-slate-400">{control.result}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* FAQ Tab */}
          {activeTab === 'faq' && (
            <div id="faq-panel" role="tabpanel" aria-labelledby="faq-tab" className="space-y-4">
              {filteredFaq.length > 0 ? (
                filteredFaq.map((item, index) => (
                  <details key={index} className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden group">
                    <summary className="px-4 py-3 cursor-pointer hover:bg-slate-800 transition flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-200">{item.question}</span>
                      <ChevronRight className="w-4 h-4 text-slate-500 group-open:rotate-90 transition" aria-hidden="true" />
                    </summary>
                    <div className="px-4 py-3 border-t border-slate-700 text-sm text-slate-400 leading-relaxed">
                      {item.answer}
                    </div>
                  </details>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500">
                  No results found for "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/50">
          <button
            onClick={() => {
              onClose();
              restartTour();
            }}
            className="w-full px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 rounded-lg text-sm font-semibold transition flex items-center justify-center"
          >
            <Sparkles className="w-4 h-4 mr-2" aria-hidden="true" />
            Show Product Tour Again
          </button>
        </div>
      </div>
    </div>
  );
}

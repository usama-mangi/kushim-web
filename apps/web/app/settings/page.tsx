'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useDashboardStore } from '@/store/useStore';
import { exportArtifactsAsJSON, exportArtifactsAsCSV, exportContextGroupsAsJSON, copyToClipboard } from '@/lib/export';
import { useA11yAnnounce } from '@/hooks/useA11y';
import {
  Settings as SettingsIcon, Palette, Bell, Download, Brain, 
  ChevronLeft, Sun, Moon, Monitor, Check, Copy, FileJson, 
  FileSpreadsheet, Network, Zap, Eye, Volume2, VolumeX,
  BarChart3, RefreshCw, Type, Contrast
} from 'lucide-react';
import { toast } from 'sonner';

type TabId = 'appearance' | 'behavior' | 'ml' | 'notifications' | 'export' | 'privacy';

export default function SettingsPage() {
  const router = useRouter();
  const announce = useA11yAnnounce();
  const [activeTab, setActiveTab] = useState<TabId>('appearance');
  const { records, contextGroups } = useDashboardStore();
  
  const {
    theme, setTheme,
    reducedMotion, setReducedMotion,
    highContrast, setHighContrast,
    fontSize, setFontSize,
    defaultView, setDefaultView,
    autoSyncInterval, setAutoSyncInterval,
    commandHistorySize, setCommandHistorySize,
    mlEnabled, setMLEnabled,
    mlThreshold, setMLThreshold,
    showMLExplanations, setShowMLExplanations,
    notificationLevel, setNotificationLevel,
    soundEnabled, setSoundEnabled,
    analyticsEnabled, setAnalyticsEnabled,
    resetToDefaults,
  } = useSettingsStore();

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  const handleExportJSON = () => {
    exportArtifactsAsJSON(records);
    announce('Artifacts exported as JSON', 'polite');
    toast.success('Exported', { description: `${records.length} artifacts exported as JSON` });
  };

  const handleExportCSV = () => {
    exportArtifactsAsCSV(records);
    announce('Artifacts exported as CSV', 'polite');
    toast.success('Exported', { description: `${records.length} artifacts exported as CSV` });
  };

  const handleExportGroups = () => {
    exportContextGroupsAsJSON(contextGroups);
    announce('Context groups exported', 'polite');
    toast.success('Exported', { description: `${contextGroups.length} context groups exported` });
  };

  const handleCopyJSON = async () => {
    const success = await copyToClipboard(records, 'json');
    if (success) {
      announce('Copied to clipboard', 'polite');
      toast.success('Copied', { description: 'JSON data copied to clipboard' });
    } else {
      toast.error('Failed', { description: 'Could not copy to clipboard' });
    }
  };

  const handleResetSettings = () => {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      resetToDefaults();
      announce('Settings reset to defaults', 'polite');
      toast.success('Reset', { description: 'All settings restored to defaults' });
    }
  };

  const SettingRow = ({ 
    label, 
    description, 
    children 
  }: { 
    label: string; 
    description?: string; 
    children: React.ReactNode;
  }) => (
    <div className="flex items-center justify-between py-4 border-b border-slate-800 last:border-0">
      <div className="flex-1 mr-8">
        <label className="text-sm font-semibold text-slate-200">{label}</label>
        {description && (
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{description}</p>
        )}
      </div>
      <div className="flex-shrink-0">
        {children}
      </div>
    </div>
  );

  const tabs = [
    { id: 'appearance' as TabId, label: 'Appearance', icon: Palette },
    { id: 'behavior' as TabId, label: 'Behavior', icon: Zap },
    { id: 'ml' as TabId, label: 'ML Settings', icon: Brain },
    { id: 'notifications' as TabId, label: 'Notifications', icon: Bell },
    { id: 'export' as TabId, label: 'Export Data', icon: Download },
    { id: 'privacy' as TabId, label: 'Privacy', icon: Eye },
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-20 border-b border-slate-800 flex items-center justify-between px-10 bg-slate-950/50 backdrop-blur-xl">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/')}
              className="p-2 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-white"
              aria-label="Back to dashboard"
            >
              <ChevronLeft className="w-5 h-5" aria-hidden="true" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Settings</h1>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-0.5">
                Customize your Kushim experience
              </p>
            </div>
          </div>
          <button
            onClick={handleResetSettings}
            className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            aria-label="Reset all settings to defaults"
          >
            <RefreshCw className="w-4 h-4 inline-block mr-2" aria-hidden="true" />
            Reset to Defaults
          </button>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar Tabs */}
          <aside className="w-64 border-r border-slate-800 bg-slate-900/50 p-6">
            <nav className="space-y-2" role="tablist" aria-label="Settings categories">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls={`${tab.id}-panel`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-semibold transition ${
                    activeTab === tab.id
                      ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <tab.icon className="w-5 h-5" aria-hidden="true" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </aside>

          {/* Content Area */}
          <main className="flex-1 overflow-y-auto p-10" role="main" aria-label="Settings content">
            <div className="max-w-3xl">
              
              {/* Appearance Tab */}
              {activeTab === 'appearance' && (
                <div id="appearance-panel" role="tabpanel" className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Appearance</h2>
                    <p className="text-sm text-slate-400">Customize the visual appearance of Kushim</p>
                  </div>

                  <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-4">
                    <SettingRow
                      label="Theme"
                      description="Choose your preferred color scheme"
                    >
                      <div className="flex items-center space-x-2">
                        {(['dark', 'light', 'system'] as const).map((t) => (
                          <button
                            key={t}
                            onClick={() => setTheme(t)}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center space-x-2 ${
                              theme === t
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                            aria-label={`Set theme to ${t}`}
                            aria-pressed={theme === t}
                          >
                            {t === 'dark' && <Moon className="w-4 h-4" aria-hidden="true" />}
                            {t === 'light' && <Sun className="w-4 h-4" aria-hidden="true" />}
                            {t === 'system' && <Monitor className="w-4 h-4" aria-hidden="true" />}
                            <span className="capitalize">{t}</span>
                          </button>
                        ))}
                      </div>
                    </SettingRow>

                    <SettingRow
                      label="Font Size"
                      description="Adjust text size for better readability"
                    >
                      <div className="flex items-center space-x-2">
                        {(['small', 'medium', 'large'] as const).map((size) => (
                          <button
                            key={size}
                            onClick={() => setFontSize(size)}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                              fontSize === size
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                            aria-label={`Set font size to ${size}`}
                            aria-pressed={fontSize === size}
                          >
                            <Type 
                              className={`${
                                size === 'small' ? 'w-3 h-3' : size === 'medium' ? 'w-4 h-4' : 'w-5 h-5'
                              }`} 
                              aria-hidden="true" 
                            />
                          </button>
                        ))}
                      </div>
                    </SettingRow>

                    <SettingRow
                      label="Reduce Motion"
                      description="Minimize animations for reduced motion preference"
                    >
                      <button
                        onClick={() => setReducedMotion(!reducedMotion)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                          reducedMotion ? 'bg-indigo-600' : 'bg-slate-700'
                        }`}
                        role="switch"
                        aria-checked={reducedMotion}
                        aria-label="Toggle reduced motion"
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                            reducedMotion ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </SettingRow>

                    <SettingRow
                      label="High Contrast"
                      description="Increase contrast for better visibility"
                    >
                      <button
                        onClick={() => setHighContrast(!highContrast)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                          highContrast ? 'bg-indigo-600' : 'bg-slate-700'
                        }`}
                        role="switch"
                        aria-checked={highContrast}
                        aria-label="Toggle high contrast mode"
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                            highContrast ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </SettingRow>
                  </div>
                </div>
              )}

              {/* Behavior Tab */}
              {activeTab === 'behavior' && (
                <div id="behavior-panel" role="tabpanel" className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Behavior</h2>
                    <p className="text-sm text-slate-400">Configure application behavior and defaults</p>
                  </div>

                  <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-4">
                    <SettingRow
                      label="Default View"
                      description="Choose the default view when opening Kushim"
                    >
                      <div className="flex items-center space-x-2">
                        {(['feed', 'graph'] as const).map((view) => (
                          <button
                            key={view}
                            onClick={() => setDefaultView(view)}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                              defaultView === view
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                            aria-label={`Set default view to ${view}`}
                            aria-pressed={defaultView === view}
                          >
                            <span className="capitalize">{view}</span>
                          </button>
                        ))}
                      </div>
                    </SettingRow>

                    <SettingRow
                      label="Auto-Sync Interval"
                      description={`Automatically sync data every ${autoSyncInterval} minutes (0 to disable)`}
                    >
                      <div className="flex items-center">
                        <input
                          type="range"
                          min="0"
                          max="60"
                          step="5"
                          value={autoSyncInterval}
                          onChange={(e) => setAutoSyncInterval(Number(e.target.value))}
                          className="w-32 accent-indigo-600"
                          aria-label="Auto-sync interval in minutes"
                        />
                        <span className="ml-3 text-sm font-mono text-slate-400 w-12 inline-block">
                          {autoSyncInterval}m
                        </span>
                      </div>
                    </SettingRow>

                    <SettingRow
                      label="Command History Size"
                      description={`Remember last ${commandHistorySize} commands`}
                    >
                      <div className="flex items-center">
                        <input
                          type="range"
                          min="10"
                          max="100"
                          step="10"
                          value={commandHistorySize}
                          onChange={(e) => setCommandHistorySize(Number(e.target.value))}
                          className="w-32 accent-indigo-600"
                          aria-label="Command history size"
                        />
                        <span className="ml-3 text-sm font-mono text-slate-400 w-12 inline-block">
                          {commandHistorySize}
                        </span>
                      </div>
                    </SettingRow>
                  </div>
                </div>
              )}

              {/* ML Settings Tab */}
              {activeTab === 'ml' && (
                <div id="ml-panel" role="tabpanel" className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">ML Settings</h2>
                    <p className="text-sm text-slate-400">Configure machine learning features</p>
                  </div>

                  <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-4">
                    <SettingRow
                      label="Enable ML Scoring"
                      description="Allow machine learning to suggest links based on semantic similarity"
                    >
                      <button
                        onClick={() => setMLEnabled(!mlEnabled)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                          mlEnabled ? 'bg-indigo-600' : 'bg-slate-700'
                        }`}
                        role="switch"
                        aria-checked={mlEnabled}
                        aria-label="Toggle ML scoring"
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                            mlEnabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </SettingRow>

                    <SettingRow
                      label="ML Confidence Threshold"
                      description={`Only show ML suggestions with ${Math.round(mlThreshold * 100)}% or higher confidence`}
                    >
                      <div className="flex items-center">
                        <input
                          type="range"
                          min="0.5"
                          max="0.95"
                          step="0.05"
                          value={mlThreshold}
                          onChange={(e) => setMLThreshold(Number(e.target.value))}
                          disabled={!mlEnabled}
                          className="w-32 accent-indigo-600 disabled:opacity-50"
                          aria-label="ML confidence threshold"
                        />
                        <span className="ml-3 text-sm font-mono text-slate-400 w-12 inline-block">
                          {Math.round(mlThreshold * 100)}%
                        </span>
                      </div>
                    </SettingRow>

                    <SettingRow
                      label="Show ML Explanations"
                      description="Display detailed score breakdowns for ML-assisted links"
                    >
                      <button
                        onClick={() => setShowMLExplanations(!showMLExplanations)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                          showMLExplanations ? 'bg-indigo-600' : 'bg-slate-700'
                        }`}
                        role="switch"
                        aria-checked={showMLExplanations}
                        aria-label="Toggle ML explanations"
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                            showMLExplanations ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </SettingRow>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div id="notifications-panel" role="tabpanel" className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Notifications</h2>
                    <p className="text-sm text-slate-400">Manage notification preferences</p>
                  </div>

                  <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-4">
                    <SettingRow
                      label="Notification Level"
                      description="Choose which notifications to receive"
                    >
                      <select
                        value={notificationLevel}
                        onChange={(e) => setNotificationLevel(e.target.value as any)}
                        className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        aria-label="Notification level"
                      >
                        <option value="all">All Notifications</option>
                        <option value="important">Important Only</option>
                        <option value="none">None</option>
                      </select>
                    </SettingRow>

                    <SettingRow
                      label="Sound Notifications"
                      description="Play sounds for notifications"
                    >
                      <button
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                          soundEnabled ? 'bg-indigo-600' : 'bg-slate-700'
                        }`}
                        role="switch"
                        aria-checked={soundEnabled}
                        aria-label="Toggle sound notifications"
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                            soundEnabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </SettingRow>
                  </div>
                </div>
              )}

              {/* Export Tab */}
              {activeTab === 'export' && (
                <div id="export-panel" role="tabpanel" className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Export Data</h2>
                    <p className="text-sm text-slate-400">Download your data in various formats</p>
                  </div>

                  <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-6">
                    <div>
                      <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center">
                        <BarChart3 className="w-4 h-4 mr-2" aria-hidden="true" />
                        Artifacts ({records.length} total)
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={handleExportJSON}
                          disabled={records.length === 0}
                          className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg text-sm font-semibold transition"
                          aria-label="Export artifacts as JSON"
                        >
                          <FileJson className="w-4 h-4 mr-2" aria-hidden="true" />
                          Export as JSON
                        </button>
                        <button
                          onClick={handleExportCSV}
                          disabled={records.length === 0}
                          className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg text-sm font-semibold transition"
                          aria-label="Export artifacts as CSV"
                        >
                          <FileSpreadsheet className="w-4 h-4 mr-2" aria-hidden="true" />
                          Export as CSV
                        </button>
                        <button
                          onClick={handleCopyJSON}
                          disabled={records.length === 0}
                          className="flex items-center px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-600 text-slate-200 rounded-lg text-sm font-semibold transition"
                          aria-label="Copy JSON to clipboard"
                        >
                          <Copy className="w-4 h-4 mr-2" aria-hidden="true" />
                          Copy to Clipboard
                        </button>
                      </div>
                    </div>

                    <div className="border-t border-slate-800 pt-6">
                      <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center">
                        <Network className="w-4 h-4 mr-2" aria-hidden="true" />
                        Context Groups ({contextGroups.length} total)
                      </h3>
                      <button
                        onClick={handleExportGroups}
                        disabled={contextGroups.length === 0}
                        className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg text-sm font-semibold transition"
                        aria-label="Export context groups as JSON"
                      >
                        <FileJson className="w-4 h-4 mr-2" aria-hidden="true" />
                        Export Groups as JSON
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Privacy Tab */}
              {activeTab === 'privacy' && (
                <div id="privacy-panel" role="tabpanel" className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Privacy</h2>
                    <p className="text-sm text-slate-400">Control data collection and analytics</p>
                  </div>

                  <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-4">
                    <SettingRow
                      label="Anonymous Analytics"
                      description="Help improve Kushim by sharing anonymous usage data"
                    >
                      <button
                        onClick={() => setAnalyticsEnabled(!analyticsEnabled)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                          analyticsEnabled ? 'bg-indigo-600' : 'bg-slate-700'
                        }`}
                        role="switch"
                        aria-checked={analyticsEnabled}
                        aria-label="Toggle anonymous analytics"
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                            analyticsEnabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </SettingRow>

                    <div className="pt-4 border-t border-slate-800">
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Kushim stores your data locally and in your connected platforms. 
                        We never sell your data or use it for advertising. All OAuth tokens 
                        are encrypted at rest. For more information, see our{' '}
                        <a href="#" className="text-indigo-400 hover:text-indigo-300 underline">
                          Privacy Policy
                        </a>.
                      </p>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

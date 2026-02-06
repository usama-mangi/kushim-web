'use client';

import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Sparkles, X } from 'lucide-react';
import { ComplianceCopilot } from './ComplianceCopilot';

interface CopilotSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Fixed sidebar for Compliance Copilot chat
 * 
 * Features:
 * - Slides in from right side
 * - Toggle with button or keyboard shortcut
 * - Persists state in localStorage
 * - Full chat interface
 */
export function CopilotSidebar({ open, onOpenChange }: CopilotSidebarProps) {
  // Handle keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle with `/` key (when not in an input field)
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as Element)?.tagName)) {
        e.preventDefault();
        onOpenChange(!open);
      }
      // Close with Escape
      if (e.key === 'Escape' && open) {
        onOpenChange(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  // Persist state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('copilot-sidebar-open', JSON.stringify(open));
    }
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-full sm:w-[440px] sm:max-w-[440px] p-0 flex flex-col"
        showCloseButton={false}
      >
        <SheetHeader className="px-4 py-3 border-b flex flex-row items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <SheetTitle className="text-base font-mono">Compliance Copilot</SheetTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-none"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </SheetHeader>
        <SheetDescription className="sr-only">
          AI-powered compliance assistant. Ask questions about your compliance program.
        </SheetDescription>
        <div className="flex-1 overflow-hidden">
          <ComplianceCopilot minimal />
        </div>
        <div className="px-4 py-2 border-t text-xs text-muted-foreground bg-muted/30 shrink-0">
          Press <kbd className="px-1.5 py-0.5 bg-background border font-mono text-[10px] rounded">/</kbd> to toggle • <kbd className="px-1.5 py-0.5 bg-background border font-mono text-[10px] rounded">Esc</kbd> to close
        </div>
      </SheetContent>
    </Sheet>
  );
}

/**
 * Fixed toggle button for the Copilot sidebar
 * Place this in the main layout
 */
export function CopilotToggleButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      onClick={onClick}
      className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
      size="icon"
      aria-label="Open Compliance Copilot"
    >
      <Sparkles className="h-6 w-6" />
    </Button>
  );
}

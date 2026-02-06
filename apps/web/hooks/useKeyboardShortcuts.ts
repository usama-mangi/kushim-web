"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Ignore if user is typing in an input
    const target = event.target as HTMLElement;
    if (
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.isContentEditable
    ) {
      return;
    }

    for (const shortcut of shortcuts) {
      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : !event.ctrlKey;
      const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
      const altMatch = shortcut.alt ? event.altKey : !event.altKey;

      if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
        event.preventDefault();
        shortcut.action();
        return;
      }
    }
  }, [shortcuts]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

// Default app shortcuts hook
export function useAppShortcuts() {
  const router = useRouter();

  const shortcuts: ShortcutConfig[] = [
    {
      key: "g",
      action: () => router.push("/"),
      description: "Go to Dashboard",
    },
    {
      key: "i",
      action: () => router.push("/integrations"),
      description: "Go to Integrations",
    },
    {
      key: "c",
      action: () => router.push("/controls"),
      description: "Go to Controls",
    },
    {
      key: "r",
      action: () => router.push("/reports"),
      description: "Go to Reports",
    },
    {
      key: "s",
      action: () => router.push("/settings"),
      description: "Go to Settings",
    },
    {
      key: "?",
      shift: true,
      action: () => {
        // Dispatch custom event to open keyboard shortcuts modal
        window.dispatchEvent(new CustomEvent("open-keyboard-shortcuts"));
      },
      description: "Show keyboard shortcuts",
    },
  ];

  useKeyboardShortcuts(shortcuts);

  return shortcuts;
}

// Export all available shortcuts for the modal
export const allShortcuts = [
  { category: "Navigation", shortcuts: [
    { keys: ["g"], description: "Go to Dashboard" },
    { keys: ["i"], description: "Go to Integrations" },
    { keys: ["c"], description: "Go to Controls" },
    { keys: ["r"], description: "Go to Reports" },
    { keys: ["s"], description: "Go to Settings" },
  ]},
  { category: "Global", shortcuts: [
    { keys: ["⌘", "k"], description: "Open Command Palette" },
    { keys: ["?"], description: "Show Keyboard Shortcuts" },
    { keys: ["Esc"], description: "Close Modal/Dialog" },
  ]},
  { category: "Actions", shortcuts: [
    { keys: ["⌘", "s"], description: "Save Current Form" },
    { keys: ["⌘", "Enter"], description: "Submit Form" },
  ]},
];

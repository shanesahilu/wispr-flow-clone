import { useEffect, useCallback, useState } from "react";

/**
 * Interface: UseGlobalShortcutReturn
 * Defines the public API for global shortcut handling.
 */
interface UseGlobalShortcutReturn {
  currentShortcut: string;
  isListeningForShortcut: boolean;
  startListeningForShortcut: () => void;
  stopListeningForShortcut: () => void;
}

/**
 * Hook: useGlobalShortcut
 * Responsibility: Listens for a keyboard shortcut and triggers callback.
 * Also supports recording a new shortcut with multiple modifiers.
 */
export function useGlobalShortcut(
  shortcut: string,
  onShortcutPressed: () => void,
  enabled: boolean,
  onShortcutChanged?: (newShortcut: string) => void
): UseGlobalShortcutReturn {
  const [isListeningForShortcut, setIsListeningForShortcut] = useState(false);
  const [currentShortcut, setCurrentShortcut] = useState(shortcut);

  // Sync with prop changes
  useEffect(() => {
    setCurrentShortcut(shortcut);
  }, [shortcut]);

  /**
   * Helper: parseShortcut
   * Converts shortcut string to key components.
   */
  const parseShortcut = useCallback((shortcutStr: string) => {
    const parts = shortcutStr.toLowerCase().split("+");
    return {
      ctrl: parts.includes("ctrl"),
      shift: parts.includes("shift"),
      alt: parts.includes("alt"),
      key: parts.find((p) => !["ctrl", "shift", "alt"].includes(p)) || "",
    };
  }, []);

  /**
   * Effect: Listen for shortcut or record new one
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If recording new shortcut
      if (isListeningForShortcut) {
        // Wait for a non-modifier key to complete the shortcut
        if (["Control", "Shift", "Alt", "Meta"].includes(e.key)) {
          return; // Keep waiting for the main key
        }

        e.preventDefault();
        e.stopPropagation();

        // Build the shortcut string
        const parts: string[] = [];
        if (e.ctrlKey) parts.push("Ctrl");
        if (e.shiftKey) parts.push("Shift");
        if (e.altKey) parts.push("Alt");
        parts.push(e.key.length === 1 ? e.key.toUpperCase() : e.key);

        const newShortcut = parts.join("+");
        setCurrentShortcut(newShortcut);
        setIsListeningForShortcut(false);
        onShortcutChanged?.(newShortcut);
        return;
      }

      // Normal shortcut detection
      if (!enabled) return;

      const parsed = parseShortcut(currentShortcut);
      const ctrlMatch = e.ctrlKey === parsed.ctrl;
      const shiftMatch = e.shiftKey === parsed.shift;
      const altMatch = e.altKey === parsed.alt;
      const keyMatch = e.key.toLowerCase() === parsed.key.toLowerCase();

      if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
        e.preventDefault();
        onShortcutPressed();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    enabled,
    currentShortcut,
    isListeningForShortcut,
    parseShortcut,
    onShortcutPressed,
    onShortcutChanged,
  ]);

  const startListeningForShortcut = useCallback(() => {
    setIsListeningForShortcut(true);
  }, []);

  const stopListeningForShortcut = useCallback(() => {
    setIsListeningForShortcut(false);
  }, []);

  return {
    currentShortcut,
    isListeningForShortcut,
    startListeningForShortcut,
    stopListeningForShortcut,
  };
}

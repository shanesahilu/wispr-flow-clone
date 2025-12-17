import { useState, useCallback } from "react";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";

interface UseClipboardReturn {
  copyToClipboard: (text: string) => Promise<boolean>;
  isCopied: boolean;
  error: string | null;
}

/**
 * Hook: useClipboard
 * Responsibility: Abstracts the Tauri clipboard plugin.
 * Handles writing text and managing the temporary "Copied!" success state.
 */
export function useClipboard(resetDuration = 2000): UseClipboardReturn {
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      if (!text) return false;
      
      await writeText(text);
      
      setIsCopied(true);
      setError(null);

      // Reset the "Copied" state after a short delay
      setTimeout(() => {
        setIsCopied(false);
      }, resetDuration);

      return true;
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
      setError("Failed to copy text.");
      setIsCopied(false);
      return false;
    }
  }, [resetDuration]);

  return { copyToClipboard, isCopied, error };
}
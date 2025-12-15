import { useEffect, useRef } from "react";
import { clsx } from "clsx";

interface TranscriptionViewProps {
  text: string;
  isRecording: boolean;
}

/**
 * Component: TranscriptionView
 * Responsibility: Displays the real-time transcription log for the user.
 * Features: 
 * - Auto-scrolls to the newest text.
 * - Shows a visual "pulsing" indicator when recording is active to let the user know.
 */

export function TranscriptionView({ text, isRecording }: TranscriptionViewProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  // For the auto-scroll functionality.
  // Triggers whenever the text updates or the rec state changes.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [text, isRecording]);

  return (
    <div className="flex-1 w-full max-w-2xl overflow-y-auto p-4 space-y-4">
      {text ? (
        <p className="text-lg leading-relaxed text-slate-700 whitespace-pre-wrap">
          {text}
        </p>
      ) : (
        // This is the empty state
        <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
          <p className="text-xl font-medium">Ready to transcribe</p>
          <p className="text-sm">Press the button below to start</p>
        </div>
      )}
      
      {/* This is the visual feedback to indicate the active mic */}
      {isRecording && (
        <div className="flex items-center space-x-2 text-blue-600 animate-pulse">
          <div className="w-2 h-2 rounded-full bg-blue-600"></div>
          <span className="text-sm font-semibold">Listening...</span>
        </div>
      )}
      {/* Anchor for auto-scrolling */}
      <div ref={bottomRef} />
    </div>
  );
}
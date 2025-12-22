import { useRef, useEffect } from "react";
import { FaMicrophone, FaStop, FaCopy, FaCheck, FaTimes, FaGripVertical, FaCog } from "react-icons/fa";
import { clsx } from "clsx";
import { useClipboard } from "../hooks/useClipboard";
import { invoke } from "@tauri-apps/api/core";

/**
 * Interface: FloatingWidgetProps
 * Defines the props for the main floating widget component.
 */
interface FloatingWidgetProps {
  transcription: string;
  isRecording: boolean;
  connectionState: "closed" | "connecting" | "connected" | "error";
  error: string | null;
  onToggleRecording: () => void;
  onClearTranscription: () => void;
  onOpenSettings: () => void;
  autoCopyEnabled: boolean;
  showCopiedNotification: boolean;
}

/**
 * Component: FloatingWidget
 * Responsibility: Renders the minimal floating UI with mic button,
 * transcription bubble, and copy functionality.
 */
export function FloatingWidget({
  transcription,
  isRecording,
  connectionState,
  error,
  onToggleRecording,
  onClearTranscription,
  onOpenSettings,
  autoCopyEnabled,
  showCopiedNotification,
}: FloatingWidgetProps) {
  const { copyToClipboard, isCopied } = useClipboard();
  const textRef = useRef<HTMLDivElement>(null);

  /**
   * Effect: Auto-scroll transcription
   * Keeps the latest text visible as it streams in.
   */
  useEffect(() => {
    if (textRef.current) {
      textRef.current.scrollTop = textRef.current.scrollHeight;
    }
  }, [transcription]);

  /**
   * Handler: handleDragStart
   * Initiates window drag from the drag handle.
   */
  const handleDragStart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await invoke("start_drag");
    } catch (err) {
      console.error("Failed to start drag:", err);
    }
  };

  /**
   * Handler: handleCopy
   * Copies transcription to clipboard.
   */
  const handleCopy = async () => {
    await copyToClipboard(transcription);
  };

  /**
   * Handler: handleDismiss
   * Clears the transcription bubble.
   */
  const handleDismiss = () => {
    onClearTranscription();
  };

  // Determine if we should show the transcription bubble
  const showBubble = transcription || isRecording;
  // Show action buttons only when there's text and not recording
  const showActions = transcription && !isRecording;
  // Show copy button only if auto-copy is disabled
  const showCopyButton = showActions && !autoCopyEnabled;

  return (
    <div className="floating-container">
      {/* Auto-copied notification */}
      {showCopiedNotification && (
        <div className="copied-notification">
          <FaCheck size={12} />
          <span>Copied to clipboard</span>
        </div>
      )}

      {/* Transcription Bubble - appears above the mic button */}
      {showBubble && (
        <div className="transcription-bubble">
          {/* Dismiss button */}
          {showActions && (
            <button
              onClick={handleDismiss}
              className="dismiss-btn"
              title="Dismiss"
            >
              <FaTimes size={10} />
            </button>
          )}

          {/* Text content area */}
          <div ref={textRef} className="transcription-content">
            {transcription ? (
              <p className="transcription-text">{transcription}</p>
            ) : (
              <p className="transcription-placeholder">
                {connectionState === "connecting"
                  ? "Connecting..."
                  : "Listening..."}
              </p>
            )}
          </div>

          {/* Recording indicator pulse */}
          {isRecording && (
            <div className="recording-indicator">
              <span className="pulse-dot" />
            </div>
          )}
        </div>
      )}

      {/* Error tooltip */}
      {error && <div className="error-tooltip">{error}</div>}

      {/* Control bar with drag handle, mic and copy buttons */}
      <div className="control-bar">
        {/* Drag handle */}
        <div
          className="drag-handle"
          onMouseDown={handleDragStart}
          title="Drag to move"
        >
          <FaGripVertical size={10} />
        </div>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className="action-btn settings-btn"
          title="Settings"
        >
          <FaCog size={11} />
        </button>

        {/* Copy button - only shown if auto-copy is disabled */}
        {showCopyButton && (
          <button
            onClick={handleCopy}
            className={clsx("action-btn copy-btn", isCopied && "copied")}
            title={isCopied ? "Copied!" : "Copy to clipboard"}
          >
            {isCopied ? <FaCheck size={11} /> : <FaCopy size={11} />}
          </button>
        )}

        {/* Main mic button */}
        <button
          onClick={onToggleRecording}
          className={clsx(
            "mic-btn",
            isRecording && "recording",
            connectionState === "connecting" && "connecting"
          )}
          disabled={connectionState === "connecting"}
          title={isRecording ? "Click to stop" : "Click to record"}
        >
          {isRecording ? <FaStop size={14} /> : <FaMicrophone size={14} />}
        </button>
      </div>
    </div>
  );
}

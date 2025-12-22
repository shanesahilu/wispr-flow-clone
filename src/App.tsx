import { useState, useCallback, useEffect, useRef } from "react";
import { FloatingWidget } from "./components/FloatingWidget";
import { Settings } from "./components/Settings";
import { useAudioRecorder } from "./hooks/useAudioRecorder";
import { useDeepgram } from "./hooks/useDeepgram";
import { useSettings } from "./hooks/useSettings";
import { useGlobalShortcut } from "./hooks/useGlobalShortcut";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";

function App() {
  /**
   * State: transcription
   * Holds the final text to be displayed in the floating bubble.
   */
  const [transcription, setTranscription] = useState("");

  /**
   * State: showSettings
   * Controls visibility of the settings panel.
   */
  const [showSettings, setShowSettings] = useState(false);

  /**
   * State: showCopiedNotification
   * Shows a brief notification when auto-copy completes.
   */
  const [showCopiedNotification, setShowCopiedNotification] = useState(false);

  /**
   * Refs for silence detection
   */
  const silenceTimerRef = useRef<number | null>(null);
  const lastTranscriptRef = useRef("");
  const isRecordingRef = useRef(false);

  /**
   * Hook: useSettings
   * Manages app configuration with persistence.
   */
  const { settings, updateSettings } = useSettings();

  /**
   * Hook Initialization: useDeepgram
   * Passes the API key from environment variables.
   */
  const {
    connectToDeepgram,
    disconnectFromDeepgram,
    resetTranscript,
    connectionState,
    realtimeTranscript,
    sendAudio,
    error: deepgramError,
  } = useDeepgram(import.meta.env.VITE_DEEPGRAM_API_KEY || "");

  /**
   * Callback: handleAudioData
   * Receives raw audio chunks from the microphone.
   */
  const handleAudioData = useCallback(
    (data: Blob) => {
      sendAudio(data);
    },
    [sendAudio]
  );

  /**
   * Hook Initialization: useAudioRecorder
   * Manages the actual microphone hardware.
   */
  const {
    startRecording,
    stopRecording,
    isRecording,
    error: recorderError,
  } = useAudioRecorder(handleAudioData);

  /**
   * Function: clearSilenceTimer
   */
  const clearSilenceTimer = () => {
    if (silenceTimerRef.current) {
      window.clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };

  /**
   * Function: stopRecordingAndCopy
   * Stops recording and handles auto copy.
   */
  const stopRecordingAndCopy = useCallback(async () => {
    if (!isRecordingRef.current) return;
    
    clearSilenceTimer();
    isRecordingRef.current = false;
    
    const finalTranscript = lastTranscriptRef.current;
    
    stopRecording();
    disconnectFromDeepgram();

    // Auto copy if enabled and there's text
    if (settings.autoCopyPaste && finalTranscript) {
      try {
        await writeText(finalTranscript);
        // Show notification
        setShowCopiedNotification(true);
        setTimeout(() => setShowCopiedNotification(false), 2000);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    }
  }, [settings.autoCopyPaste, stopRecording, disconnectFromDeepgram]);

  /**
   * Effect: Sync Transcription and handle silence detection
   */
  useEffect(() => {
    setTranscription(realtimeTranscript);
    lastTranscriptRef.current = realtimeTranscript;

    if (!isRecordingRef.current || settings.silenceTimeout <= 0) return;

    clearSilenceTimer();

    silenceTimerRef.current = window.setTimeout(() => {
      if (isRecordingRef.current && lastTranscriptRef.current) {
        stopRecordingAndCopy();
      }
    }, settings.silenceTimeout * 1000);

  }, [realtimeTranscript, settings.silenceTimeout, stopRecordingAndCopy]);

  /**
   * Handler: toggleRecording
   * Orchestrates the start/stop workflow.
   */
  const toggleRecording = async () => {
    if (isRecording) {
      await stopRecordingAndCopy();
    } else {
      setShowSettings(false);
      resetTranscript();
      setTranscription("");
      lastTranscriptRef.current = "";
      
      isRecordingRef.current = true;
      await connectToDeepgram();
      await startRecording();
    }
  };

  /**
   * Handler: clearTranscription
   * Resets the transcription state.
   */
  const clearTranscription = () => {
    setTranscription("");
    resetTranscript();
    lastTranscriptRef.current = "";
  };

  /**
   * Hook: useGlobalShortcut
   * Listens for keyboard shortcut to toggle recording.
   */
  const {
    currentShortcut,
    isListeningForShortcut,
    startListeningForShortcut,
    stopListeningForShortcut,
  } = useGlobalShortcut(
    settings.shortcut,
    toggleRecording,
    settings.shortcutEnabled && !showSettings,
    (newShortcut) => updateSettings({ shortcut: newShortcut })
  );

  /**
   * Effect: Cleanup on unmount
   */
  useEffect(() => {
    return () => clearSilenceTimer();
  }, []);

  const activeError = recorderError || deepgramError;

  return (
    <>
      <FloatingWidget
        transcription={transcription}
        isRecording={isRecording}
        connectionState={connectionState}
        error={activeError}
        onToggleRecording={toggleRecording}
        onClearTranscription={clearTranscription}
        onOpenSettings={() => setShowSettings(true)}
        autoCopyEnabled={settings.autoCopyPaste}
        showCopiedNotification={showCopiedNotification}
      />

      {showSettings && (
        <Settings
          settings={settings}
          onUpdateSettings={updateSettings}
          onClose={() => {
            stopListeningForShortcut();
            setShowSettings(false);
          }}
          isRecordingShortcut={isListeningForShortcut}
          onStartRecordingShortcut={startListeningForShortcut}
          currentShortcut={currentShortcut}
        />
      )}
    </>
  );
}

export default App;

import { useState, useRef, useCallback } from "react";

//This defines the public api that our component will interact with.
interface UseAudioRecorderReturn {
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  isRecording: boolean;
  hasPermission: boolean;
  error: string | null;
}

/**
 * Helper: getMimeType
 * Responsibility: Detects the best supported audio format for the current browser/OS.
 */
const getMimeType = () => {
  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
  ];
  return types.find((type) => MediaRecorder.isTypeSupported(type)) || "";
};

/**
 * Hook: useAudioRecorder
 * Responsibility: Manages microphone access and the MediaRecorder lifecycle.
 * @param onAudioData - Callback function that receives the raw audio blobs (chunks).
 */
export function useAudioRecorder(onAudioData: (data: Blob) => void): UseAudioRecorderReturn {
  // State to track UI status
  const [isRecording, setIsRecording] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Refs are used to store mutable objects that don't trigger re-renders
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  /**
   * Function: startRecording
   * Flow:
   * 1. Resets errors.
   * 2. Requests microphone permission from the OS.
   * 3. Initializes the MediaRecorder with the best MIME type.
   * 4. Sets up event listeners for data availability.
   * 5. Starts recording in 250ms chunks (suitable for real-time streaming).
   */
  const startRecording = useCallback(async () => {
    setError(null);
    
    try {
      // 1. Request Microphone Access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasPermission(true);
      streamRef.current = stream;

      // 2. Configure MediaRecorder
      const mimeType = getMimeType();
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      // 3. Handle incoming audio data chunks
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          onAudioData(event.data);
        }
      };
      recorder.start(250);
      setIsRecording(true);
      
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setError("Microphone access denied or not available.");
      setHasPermission(false);
    }
  }, [onAudioData]);

  /**
   * Function: stopRecording
   * Responsibility: Cleanly shuts down the recorder.
   */
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      // Stop the recording logic
      mediaRecorderRef.current.stop();
      
      // Stop all audio tracks to release the hardware lock on the microphone
      streamRef.current?.getTracks().forEach((track) => track.stop());
      
      mediaRecorderRef.current = null;
      streamRef.current = null;
      setIsRecording(false);
    }
  }, [isRecording]);

  return {
    startRecording,
    stopRecording,
    isRecording,
    hasPermission,
    error,
  };
}
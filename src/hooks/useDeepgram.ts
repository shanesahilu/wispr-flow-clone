import { useState, useCallback, useRef } from "react";

/**
 * Type: DeepgramConnectionState
 * Represents the current status of the WebSocket connection.
 */
type DeepgramConnectionState = "closed" | "connecting" | "connected" | "error";

/**
 * Interface: UseDeepgramReturn
 * Defines the public API exposed by the useDeepgram hook.
 */
interface UseDeepgramReturn {
  connectToDeepgram: () => Promise<void>;
  disconnectFromDeepgram: () => void;
  resetTranscript: () => void;
  connectionState: DeepgramConnectionState;
  realtimeTranscript: string;
  sendAudio: (data: Blob) => void;
  error: string | null;
  lastSpeechTime: number;
}

/**
 * Hook: useDeepgram
 * Responsibility: Manages the WebSocket connection to Deepgram's streaming API.
 * It handles connection lifecycle, buffering audio during connection, and receiving transcripts.
 * @param apiKey - The Deepgram API key used for authentication.
 */
export function useDeepgram(apiKey: string): UseDeepgramReturn {
  /**
   * State: connectionState
   * Tracks whether the socket is open, closed, connecting, or in error.
   */
  const [connectionState, setConnectionState] = useState<DeepgramConnectionState>("closed");

  /**
   * State: realtimeTranscript
   * Accumulates the finalized transcripts received from Deepgram.
   */
  const [realtimeTranscript, setRealtimeTranscript] = useState("");

  /**
   * State: error
   * Stores any error messages related to the WebSocket connection.
   */
  const [error, setError] = useState<string | null>(null);

  /**
   * State: lastSpeechTime
   * Tracks when we last received any speech (interim or final).
   * Used for accurate silence detection.
   */
  const [lastSpeechTime, setLastSpeechTime] = useState<number>(Date.now());

  /**
   * Ref: socketRef
   * Holds the persistent WebSocket instance across renders.
   */
  const socketRef = useRef<WebSocket | null>(null);

  /**
   * Ref: audioQueue
   * Buffers audio chunks that are generated while the socket is still connecting.
   * This ensures we don't lose the first few milliseconds of speech.
   */
  const audioQueue = useRef<Blob[]>([]);

  /**
   * Function: connectToDeepgram
   * Flow:
   * 1. Checks if a connection already exists.
   * 2. Sets state to 'connecting'.
   * 3. Initializes WebSocket with the Nova-2 model and smart formatting.
   * 4. Sets up event listeners (onopen, onmessage, onclose, onerror).
   */
  const connectToDeepgram = useCallback(async () => {
    try {
      if (socketRef.current) return;

      setConnectionState("connecting");
      setError(null);

      const url = "wss://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&interim_results=true";
      const socket = new WebSocket(url, ["token", apiKey]);
      socketRef.current = socket;

      // Event: Connection Opened
      socket.onopen = () => {
        setConnectionState("connected");
        // Flush any buffered audio chunks waiting in the queue
        if (audioQueue.current.length > 0) {
          audioQueue.current.forEach((blob) => socket.send(blob));
          audioQueue.current = [];
        }
      };

      // Event: Message Received (Transcript)
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Check if the message contains a valid transcript
          if (data.channel?.alternatives?.[0]?.transcript) {
            const transcript = data.channel.alternatives[0].transcript;
            
            // Update last speech time on ANY transcript (interim or final)
            // This is key for accurate silence detection
            if (transcript.trim()) {
              setLastSpeechTime(Date.now());
            }
            
            // Only append if it's a "final" result (not interim/partial)
            if (data.is_final) {
              setRealtimeTranscript((prev) => prev + (prev ? " " : "") + transcript);
            }
          }
        } catch (err) {
          console.error("Error parsing Deepgram message", err);
        }
      };

      // Event: Connection Closed
      socket.onclose = () => {
        setConnectionState("closed");
        socketRef.current = null;
      };

      // Event: Error Occurred
      socket.onerror = (event) => {
        console.error("Deepgram WebSocket error:", event);
        setError("Connection to transcription service failed.");
        setConnectionState("error");
      };

    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown connection error");
      setConnectionState("error");
    }
  }, [apiKey]);

  /**
   * Function: disconnectFromDeepgram
   * Responsibility: Gracefully closes the WebSocket connection.
   * Sends a "CloseStream" message first to tell the server we are done.
   */
  const disconnectFromDeepgram = useCallback(() => {
    if (socketRef.current) {
      if (socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: "CloseStream" }));
      }
      socketRef.current.close();
      socketRef.current = null;
    }
    setConnectionState("closed");
  }, []);

  /**
   * Function: sendAudio
   * Responsibility: Sends raw audio blobs to the WebSocket.
   * Logic:
   * - If OPEN: Send immediately.
   * - If CONNECTING: Buffer in queue.
   * - Otherwise: Ignore (or log warning).
   */
  const sendAudio = useCallback((data: Blob) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(data);
    } else if (socketRef.current?.readyState === WebSocket.CONNECTING) {
      audioQueue.current.push(data);
    }
  }, []);

  /**
   * Function: resetTranscript
   * Responsibility: Clears the accumulated transcript.
   * Called when starting a new recording session.
   */
  const resetTranscript = useCallback(() => {
    setRealtimeTranscript("");
    setLastSpeechTime(Date.now());
  }, []);

  return {
    connectToDeepgram,
    disconnectFromDeepgram,
    resetTranscript,
    connectionState,
    realtimeTranscript,
    sendAudio,
    error,
    lastSpeechTime,
  };
}
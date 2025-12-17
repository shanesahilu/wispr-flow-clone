import { useState, useCallback, useEffect } from "react";
import { TranscriptionView } from "./components/TranscriptionView";
import { Controls } from "./components/Controls";
import { useAudioRecorder } from "./hooks/useAudioRecorder";
import { useDeepgram } from "./hooks/useDeepgram";

function App() {
  /**
   * State: transcription
   * Holds the final text to be displayed in the UI.
   * It syncs with the data coming from useDeepgram.
   */
  const [transcription, setTranscription] = useState("");
  
  /**
   * Hook Initialization: useDeepgram
   * We pass the API key from environment variables.
   * Destructures methods to manage connection and data flow.
   */
  const { 
    connectToDeepgram, 
    disconnectFromDeepgram, 
    connectionState, 
    realtimeTranscript, 
    sendAudio,
    error: deepgramError 
  } = useDeepgram(import.meta.env.VITE_DEEPGRAM_API_KEY || "");

  /**
   * Effect: Sync Transcription
   * Updates the local state whenever the Deepgram hook provides new text.
   */
  useEffect(() => {
    setTranscription(realtimeTranscript);
  }, [realtimeTranscript]);

  /**
   * Callback: handleAudioData
   * Responsibility: Receives raw audio chunks from the microphone.
   * Action: Forwards the data immediately to the Deepgram WebSocket.
   */
  const handleAudioData = useCallback((data: Blob) => {
    sendAudio(data);
  }, [sendAudio]);

  /**
   * Hook Initialization: useAudioRecorder
   * Manages the actual microphone hardware.
   * We pass 'handleAudioData' so it knows where to send the chunks.
   */
  const { startRecording, stopRecording, isRecording, error: recorderError } = useAudioRecorder(handleAudioData);

  /**
   * Handler: toggleRecording
   * Responsibility: Orchestrates the start/stop workflow.
   * Flow:
   * - If Recording: Stop microphone -> Disconnect WebSocket.
   * - If Stopped: Connect WebSocket -> Start microphone -> Clear old text.
   */
  const toggleRecording = async () => {
    if (isRecording) {
      stopRecording();
      disconnectFromDeepgram();
    } else {
      await connectToDeepgram();
      await startRecording();
      // Clear previous text when starting a new session.
      setTranscription(""); 
    }
  };

  /**
   * Helper: getIndicatorColor
   * Returns Tailwind class names for the status dot based on connection state.
   */
  const getIndicatorColor = () => {
    switch (connectionState) {
      case "connected": return "bg-green-500";
      case "connecting": return "bg-yellow-500";
      case "error": return "bg-red-500";
      default: return "bg-slate-300";
    }
  };

  // Combine errors from both hooks to show a unified error banner
  const activeError = recorderError || deepgramError;

  return (
    <div className="h-screen w-screen bg-slate-50 flex flex-col items-center text-slate-900">
      {/* Header*/}
      <header className="w-full p-4 border-b border-slate-200 bg-white/50 backdrop-blur-sm fixed top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Wispr Flow
          </h1>
          <div className="flex items-center gap-3">
            {/* Connection Status Badge*/}
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded">
              <div className={`w-2 h-2 rounded-full ${getIndicatorColor()}`} />
              {connectionState === "closed" ? "Ready" : connectionState}
            </div>
            <div className="text-xs font-mono text-slate-400">v0.1.0</div>
          </div>
        </div>
      </header>

      {/* Error Banner*/}
      {activeError && (
        <div className="absolute top-20 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded z-50">
          {activeError}
        </div>
      )}

      {/* Main View*/}
      <main className="flex-1 w-full flex flex-col items-center pt-16 pb-0">
        <TranscriptionView 
          text={transcription} 
          isRecording={isRecording} 
        />
      </main>

      <Controls 
        isRecording={isRecording} 
        onToggleRecording={toggleRecording} 
      />
    </div>
  );
}

export default App;
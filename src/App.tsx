import { useState, useCallback } from "react";
import { TranscriptionView } from "./components/TranscriptionView";
import { Controls } from "./components/Controls";
import { useAudioRecorder } from "./hooks/useAudioRecorder"; // Import our new hook

function App() {
  /**
   * State: transcription
   * Holds the converted text. For now, we just clear it on restart.
   */
  const [transcription, setTranscription] = useState("");

  /**
   * Callback: handleAudioData
   * Responsibility: Receives the raw audio chunks from the hook.
   * Current Behavior: Logs the size of the chunk to the console for verification.
   * Future Behavior: Will send this data to Deepgram via WebSocket.
   */
  const handleAudioData = useCallback((data: Blob) => {
    console.log(`Received audio chunk: ${data.size} bytes`);
  }, []);

  /**
   * Hook Initialization
   * We pass the 'handleAudioData' callback into the hook.
   */
  const { startRecording, stopRecording, isRecording, error } = useAudioRecorder(handleAudioData);

  /**
   * Handler: toggleRecording
   * Switches between start and stop modes based on current state.
   */
  const toggleRecording = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      await startRecording();
      // Clear previous text when starting a new session to keep it clean.
      setTranscription(""); 
    }
  };

  return (
    <div className="h-screen w-screen bg-slate-50 flex flex-col items-center text-slate-900">
      {/* Header */}
      <header className="w-full p-4 border-b border-slate-200 bg-white/50 backdrop-blur-sm fixed top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Wispr Flow
          </h1>
          <div className="text-xs font-mono text-slate-400">v0.1.0</div>
        </div>
      </header>

      {/* Error Banner: Only renders if the hook reports an error */}
      {error && (
        <div className="absolute top-20 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded z-50">
          {error}
        </div>
      )}

      {/* Main View */}
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
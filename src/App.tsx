import { useState } from "react";
import { TranscriptionView } from "./components/TranscriptionView";
import { Controls } from "./components/Controls";


function App() {
  /**
   * State Management
   * ----------------
   * isRecording: Tracks whether the microphone is currently active.
   * transcription: Stores the accumulated text from the speech-to-text engine.
   */
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState("");

  /**
   * Handler: toggleRecording
   * Responsibility: Manages the start/stop logic for the recording session.
   * Still didn't connect it to the audio hook. 
   */

  const toggleRecording = async () => {
    if (isRecording) {
      setIsRecording(false);
    } else {
      setIsRecording(true);
      //temp for testing purposes
      setTranscription((prev) => prev + " (Simulated audio start...)");
    }
  };

  return (
    <div className="h-screen w-screen bg-slate-50 flex flex-col items-center text-slate-900">
      {/*header */}
      <header className="w-full p-4 border-b border-slate-200 bg-white/50 backdrop-blur-sm fixed top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Wispr Flow
          </h1>
          <div className="text-xs font-mono text-slate-400">v0.1.0</div>
        </div>
      </header>

      {/*Main content area */}

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
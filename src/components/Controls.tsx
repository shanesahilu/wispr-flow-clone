import { FaMicrophone, FaStop } from "react-icons/fa";
import { clsx } from "clsx";

interface ControlsProps {
  isRecording: boolean;
  onToggleRecording: () => void;
}

export function Controls({ isRecording, onToggleRecording }: ControlsProps) {
  return (
    <div className="w-full bg-white border-t border-slate-200 p-6 flex flex-col items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <button
        onClick={onToggleRecording}
        className={clsx(
          "h-16 w-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:scale-105 active:scale-95",
          isRecording
            ? "bg-red-500 text-white shadow-red-200"
            : "bg-blue-600 text-white shadow-blue-200"
        )}
      >
        {isRecording ? <FaStop size={24} /> : <FaMicrophone size={24} />}
      </button>
      
      <p className="mt-4 text-sm font-medium text-slate-500">
        {isRecording ? "Recording... Click to stop" : "Click to start recording"}
      </p>
    </div>
  );
}
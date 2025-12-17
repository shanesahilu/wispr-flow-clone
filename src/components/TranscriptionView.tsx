import { useEffect, useRef } from "react";
import { useClipboard } from "../hooks/useClipboard";
import { FaCopy, FaCheck } from "react-icons/fa"; // Assuming react-icons is installed, or use text if not

interface TranscriptionViewProps {
  text: string;
  isRecording: boolean;
}

export function TranscriptionView({ text, isRecording }: TranscriptionViewProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const { copyToClipboard, isCopied } = useClipboard();

  // Auto-scroll to bottom whenever text updates
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [text]);

  return (
    <div className="w-full max-w-2xl px-4 flex flex-col gap-4 h-[60vh]">
      {/* Text Display Area */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 p-6 overflow-y-auto relative">
        {text ? (
          <div className="prose prose-slate max-w-none">
            <p className="text-lg leading-relaxed text-slate-800 whitespace-pre-wrap">
              {text}
            </p>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-400 italic">
            {isRecording ? "Listening..." : "Ready to record..."}
          </div>
        )}
        {/* Invisible element to anchor scrolling */}
        <div ref={bottomRef} />
      </div>

      {/* Action Bar */}
      <div className="flex justify-end h-12">
        {text && !isRecording && (
          <button
            onClick={() => copyToClipboard(text)}
            className={`
              flex items-center gap-2 px-6 py-2 rounded-full font-medium transition-all duration-200
              ${isCopied 
                ? "bg-green-100 text-green-700 border border-green-200" 
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm"
              }
            `}
          >
            {isCopied ? (
              <>
                <FaCheck className="text-sm" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <FaCopy className="text-sm" />
                <span>Copy Text</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
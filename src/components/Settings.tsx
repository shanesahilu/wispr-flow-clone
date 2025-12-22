import { FaTimes, FaKeyboard, FaCopy, FaClock } from "react-icons/fa";
import { AppSettings } from "../hooks/useSettings";

/**
 * Interface: SettingsProps
 * Defines props for the Settings panel component.
 */
interface SettingsProps {
  settings: AppSettings;
  onUpdateSettings: (updates: Partial<AppSettings>) => void;
  onClose: () => void;
  isRecordingShortcut: boolean;
  onStartRecordingShortcut: () => void;
  currentShortcut: string;
}

/**
 * Component: Settings
 * Responsibility: Renders the settings panel for configuring app behavior.
 */
export function Settings({
  settings,
  onUpdateSettings,
  onClose,
  isRecordingShortcut,
  onStartRecordingShortcut,
  currentShortcut,
}: SettingsProps) {
  return (
    <div className="settings-panel">
      {/* Header */}
      <div className="settings-header">
        <h2 className="settings-title">Settings</h2>
        <button onClick={onClose} className="settings-close-btn" title="Close">
          <FaTimes size={14} />
        </button>
      </div>

      {/* Settings Content */}
      <div className="settings-content">
        {/* Keyboard Shortcut Section */}
        <div className="settings-section">
          <div className="settings-row">
            <div className="settings-label">
              <FaKeyboard className="settings-icon" />
              <span>Keyboard Shortcut</span>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={settings.shortcutEnabled}
                onChange={(e) =>
                  onUpdateSettings({ shortcutEnabled: e.target.checked })
                }
              />
              <span className="toggle-slider" />
            </label>
          </div>
          {settings.shortcutEnabled && (
            <div className="settings-sub">
              <button
                onClick={onStartRecordingShortcut}
                className={`shortcut-btn ${isRecordingShortcut ? "recording" : ""}`}
              >
                {isRecordingShortcut ? "Press keys..." : currentShortcut}
              </button>
              <p className="settings-hint">
                Click to change, then press your desired key combination
              </p>
            </div>
          )}
        </div>

        {/* Auto Copy Section */}
        <div className="settings-section">
          <div className="settings-row">
            <div className="settings-label">
              <FaCopy className="settings-icon" />
              <span>Auto Copy</span>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={settings.autoCopyPaste}
                onChange={(e) =>
                  onUpdateSettings({ autoCopyPaste: e.target.checked })
                }
              />
              <span className="toggle-slider" />
            </label>
          </div>
          <p className="settings-hint settings-sub">
            Automatically copies transcription when recording stops
          </p>
        </div>

        {/* Silence Timeout Section */}
        <div className="settings-section">
          <div className="settings-row">
            <div className="settings-label">
              <FaClock className="settings-icon" />
              <span>Auto-stop after silence</span>
            </div>
            <select
              value={settings.silenceTimeout}
              onChange={(e) =>
                onUpdateSettings({ silenceTimeout: Number(e.target.value) })
              }
              className="settings-select"
            >
              <option value={0}>Disabled</option>
              <option value={1}>1 second</option>
              <option value={2}>2 seconds</option>
              <option value={3}>3 seconds</option>
              <option value={5}>5 seconds</option>
            </select>
          </div>
          <p className="settings-hint settings-sub">
            Stops recording after you stop speaking
          </p>
        </div>
      </div>
    </div>
  );
}

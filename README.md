# Wispr Flow Clone

A lightweight, floating desktop application that provides real-time speech-to-text transcription using Deepgram's Nova-2 model. Built for speed and minimalism, it sits unobtrusively at the bottom of your screen, transcribes as you speak, and automatically copies the result to your clipboard.

![Tauri](https://img.shields.io/badge/Tauri-2.0-blue?logo=tauri)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)
![Deepgram](https://img.shields.io/badge/Deepgram-Nova--2-13EF93)

---

## Table of Contents

- [Features](#features)
- [Architecture & Design Choices](#architecture--design-choices)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Usage](#usage)
- [Configuration Options](#configuration-options)
- [Project Structure](#project-structure)
- [Assumptions](#assumptions)
- [Known Limitations](#known-limitations)
- [Future Roadmap](#future-roadmap)
- [License](#license)

---

## Features

- **Real-Time Transcription**: Live speech-to-text with near-zero latency using WebSocket streaming
- **Floating Widget**: Minimal, always-on-top window that stays out of your way
- **Draggable Interface**: Reposition the widget anywhere on screen via drag handle
- **Auto-Copy to Clipboard**: Automatically copies transcription when recording stops (configurable)
- **Silence Detection**: Auto-stops recording after configurable silence period (1-5 seconds)
- **Keyboard Shortcuts**: Customizable global hotkey to toggle recording (default: `Ctrl+Shift+R`)
- **Transparent Click-Through**: Transparent areas allow clicking through to underlying windows
- **Settings Panel**: In-app configuration for all features

---

## Architecture & Design Choices

### 1. Hybrid Core: Tauri (Rust) + React

I chose **Tauri over Electron** to prioritize performance and binary size. The result is a ~10MB application versus Electron's typical 150MB+.

| Layer | Technology | Responsibility |
|-------|------------|----------------|
| **Backend (Rust)** | Tauri 2.0 | Window management, system positioning, clipboard operations, window dragging |
| **Frontend (React)** | React 19 + TypeScript | Application state, WebSocket lifecycle, UI rendering, settings management |

**Why this split?**
- Rust handles system-level operations requiring high efficiency and safety
- React manages the reactive UI and complex state orchestration
- Clean separation allows each layer to do what it does best

### 2. Real-Time Transcription Pipeline

Instead of the traditional "record → upload → wait" REST API approach, I implemented a **WebSocket stream directly to Deepgram**.

```
┌─────────────┐    250ms chunks    ┌──────────────┐    WebSocket    ┌──────────────┐
│ Microphone  │ ─────────────────► │ MediaRecorder│ ──────────────► │   Deepgram   │
└─────────────┘                    └──────────────┘                 │   Nova-2     │
                                                                    └──────┬───────┘
                                                                           │
┌─────────────┐    setState()      ┌──────────────┐    JSON msgs           │
│     UI      │ ◄───────────────── │  useDeepgram │ ◄───────────────────────
└─────────────┘                    └──────────────┘
```

**Key Design Decisions:**

- **Streaming over REST**: Reduces latency to near-zero. Audio chunks are sent as they're recorded, and partial transcripts return immediately, creating a "live typing" effect.
- **Audio Buffering**: Chunks generated while the WebSocket is still connecting are queued and flushed once connected, ensuring no audio is lost.
- **Model Selection**: Uses `nova-2` with `smart_format=true` for Deepgram's fastest and most accurate transcription with automatic punctuation.

### 3. Dynamic UI/UX

The window is designed to be **unobtrusive yet functional**:

| State | Behavior |
|-------|----------|
| **Idle** | Small control bar at bottom-center with mic button, settings, and drag handle |
| **Recording** | Transcription bubble expands above controls with pulsing indicator |
| **Complete** | Shows final text with dismiss button; auto-copies if enabled |

**Click-Through Transparency**: The transparent areas of the window allow mouse events to pass through to underlying applications—you can interact with other windows without moving the widget.

### 4. State Management Architecture

The application uses a **custom hooks pattern** for clean separation of concerns:

```
App.tsx (Orchestrator)
    ├── useSettings()      → Persistent configuration (localStorage)
    ├── useDeepgram()      → WebSocket connection & transcript state
    ├── useAudioRecorder() → MediaRecorder & microphone access
    ├── useGlobalShortcut()→ Keyboard shortcut detection & recording
    └── useClipboard()     → Tauri clipboard plugin abstraction
```

Each hook is self-contained with its own state, effects, and cleanup logic.

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | [Tauri 2.0](https://tauri.app/) |
| Frontend | [React 19](https://react.dev/) + [TypeScript 5.8](https://www.typescriptlang.org/) |
| Styling | [Tailwind CSS 3.4](https://tailwindcss.com/) |
| Build Tool | [Vite 7](https://vitejs.dev/) |
| Speech-to-Text | [Deepgram Nova-2](https://deepgram.com/) |
| Icons | [React Icons](https://react-icons.github.io/react-icons/) |

---

## Prerequisites

Before you begin, ensure you have the following installed:

1. **Rust & Cargo** (latest stable)
   ```bash
   # Install via rustup
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

2. **Node.js** (v18+ recommended)
   ```bash
   # Verify installation
   node --version
   npm --version
   ```

3. **Deepgram API Key**
   - Sign up at [console.deepgram.com](https://console.deepgram.com)
   - Create a new API key with "Usage" permissions

4. **Platform-Specific Dependencies**
   - **Windows**: Microsoft Visual Studio C++ Build Tools
   - **macOS**: Xcode Command Line Tools (`xcode-select --install`)
   - **Linux**: `webkit2gtk`, `libappindicator`, `librsvg` (see [Tauri prerequisites](https://tauri.app/v1/guides/getting-started/prerequisites))

---

## Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/wispr-flow-clone.git
   cd wispr-flow-clone
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   I have intentionally given my api key for your ease of use to evaluate the project. You may replace it if you would like.
   

4. **Run in development mode**
   ```bash
   npm run tauri dev
   ```

5. **Build for production**
   ```bash
   npm run tauri build
   ```
   
   The compiled binary will be in `src-tauri/target/release/`.

---

## Usage

### Basic Workflow

1. **Start Recording**: Click the microphone button or press `Ctrl+Shift+R`
2. **Speak**: The transcription appears in real-time in the bubble above
3. **Stop Recording**: Click the stop button, press the shortcut again, or wait for silence timeout
4. **Copy Result**: Text is auto-copied (if enabled) or click the copy button

### Controls

| Control | Action |
|---------|--------|
| 🎤 Mic Button | Toggle recording on/off |
| ⚙️ Settings | Open configuration panel |
| ⋮ Drag Handle | Click and drag to reposition widget |
| ✕ Dismiss | Clear transcription bubble |
| 📋 Copy | Manual copy (when auto-copy disabled) |

---

## Configuration Options

Access settings via the gear icon (⚙️):

| Setting | Description | Default |
|---------|-------------|---------|
| **Keyboard Shortcut** | Global hotkey to toggle recording | `Ctrl+Shift+R` |
| **Shortcut Enabled** | Enable/disable the keyboard shortcut | `true` |
| **Auto Copy** | Automatically copy transcription when recording stops | `false` |
| **Silence Timeout** | Auto-stop after N seconds of silence (0 = disabled) | `2 seconds` |

Settings are persisted to `localStorage` and restored on app restart.

---

## Project Structure

```
wispr-flow-clone/
├── src/                          # React frontend
│   ├── components/
│   │   ├── FloatingWidget.tsx    # Main UI widget
│   │   └── Settings.tsx          # Settings panel
│   ├── hooks/
│   │   ├── useAudioRecorder.ts   # MediaRecorder management
│   │   ├── useClipboard.ts       # Clipboard operations
│   │   ├── useDeepgram.ts        # WebSocket & transcription
│   │   ├── useGlobalShortcut.ts  # Keyboard shortcut handling
│   │   └── useSettings.ts        # Persistent settings
│   ├── App.tsx                   # Main orchestrator
│   ├── index.css                 # Tailwind + custom styles
│   └── main.tsx                  # React entry point
├── src-tauri/                    # Rust backend
│   ├── src/
│   │   └── lib.rs                # Tauri commands & setup
│   ├── capabilities/
│   │   └── default.json          # Permission declarations
│   ├── Cargo.toml                # Rust dependencies
│   └── tauri.conf.json           # Tauri configuration
├── .env                          # Environment variables (create this)
├── package.json                  # Node dependencies
├── tailwind.config.js            # Tailwind configuration
└── vite.config.ts                # Vite configuration
```

---

## Assumptions

The following assumptions were made during development:

| Assumption | Rationale |
|------------|-----------|
| **Stable Internet Connection** | Deepgram is a cloud-based API; no offline fallback is implemented |
| **Microphone Access Granted** | User has granted OS-level microphone permissions |
| **Primary Monitor Usage** | Window positioning is optimized for the primary display |
| **English Language (en-US)** | Model is hardcoded to English; no language selection UI |
| **Modern Browser APIs** | Relies on `MediaRecorder` and `WebSocket` APIs available in Chromium |

---

## Known Limitations

### System Permissions
- **macOS**: App must be added to "Accessibility" and "Microphone" in System Preferences → Privacy & Security
- **Windows**: May require running as administrator or adding to Windows Security exceptions
- **Silent Failures**: Permission denials may not always surface clear error messages

### WebSocket Behavior
- **Timeout**: Deepgram may close the connection after extended silence (~30s of no audio)
- **Reconnection**: No automatic reconnection logic; user must restart recording

### Clipboard Edge Cases
- **Race Conditions**: On very long transcriptions, clipboard write may trigger before final WebSocket message is processed (mitigated with debounce)
- **Clipboard Managers**: Third-party clipboard managers may interfere with auto-copy

### UI Constraints
- **Fixed Window Size**: Window dimensions are fixed at 400×280px
- **Single Language**: No runtime language switching for transcription

---

## Future Roadmap

- [ ] **Multi-Language Support**: Dropdown to select from Deepgram's supported languages
- [ ] **Offline Mode**: Local Whisper model fallback when internet unavailable
- [ ] **Custom Positioning**: Remember and restore widget position across sessions
- [ ] **Audio Visualization**: Waveform or volume indicator during recording
- [ ] **History Panel**: View and re-copy recent transcriptions
- [ ] **System Tray Integration**: Minimize to tray with quick-access menu
- [ ] **Auto-Paste**: Option to automatically paste transcription into active window
- [ ] **Wake Word Detection**: "Hey Wispr" voice activation

---

## Troubleshooting

### "Microphone access denied"
1. Check OS-level microphone permissions
2. Ensure no other application has exclusive microphone access
3. Restart the application after granting permissions

### "Connection to transcription service failed"
1. Verify your Deepgram API key is correct in `.env`
2. Check internet connectivity
3. Ensure the API key has "Usage" permissions enabled

### Widget not appearing
1. Check if the window spawned off-screen (resize your display)
2. Look for the app in the taskbar/dock
3. Try restarting the application


## Acknowledgments

- [Deepgram](https://deepgram.com/) for their excellent real-time transcription API
- [Tauri](https://tauri.app/) for making lightweight desktop apps possible
- [Wispr Flow](https://wispr.ai/) for the inspiration behind this project

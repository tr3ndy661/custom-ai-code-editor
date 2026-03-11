# Software Requirements Specification
## AI-Powered Code Editor with Ollama

**Version:** 1.0  
**Date:** March 2026  
**Status:** Draft — Internal Use Only

---

Tauri + React + TypeScript

## Table of Contents

1. [Introduction](#1-introduction)
2. [System Overview](#2-system-overview)
3. [Stakeholders](#3-stakeholders)
4. [Functional Requirements](#4-functional-requirements)
5. [Use Cases](#5-use-cases)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [Technical Constraints & Assumptions](#7-technical-constraints--assumptions)
8. [System Interfaces](#8-system-interfaces)
9. [Data Requirements](#9-data-requirements)
10. [Development Milestones](#10-development-milestones)
11. [Risks & Mitigations](#11-risks--mitigations)
12. [Appendix](#12-appendix)

---

## 1. Introduction

### 1.1 Purpose

This Software Requirements Specification (SRS) defines the complete functional and non-functional requirements for an AI-powered code editor that integrates with Ollama, a local large-language-model (LLM) runtime. The document serves as the primary reference for development, QA, and stakeholder alignment.

### 1.2 Project Overview

The project is a desktop code editor application designed to run entirely offline on mid-range hardware (Intel i5 8th-gen U, 16 GB RAM). It augments traditional editing capabilities with AI features powered by locally hosted models served through Ollama — specifically the `qwen2.5-coder` model family. No data leaves the user's machine.

### 1.3 Scope

**In scope for v1.0:**
- Full-featured source code editing with syntax highlighting and multi-language support
- AI inline autocomplete powered by `qwen2.5-coder:1.5b` (low-latency)
- AI chat panel powered by `qwen2.5-coder:7b` (code explanation, refactoring, Q&A)
- Local Ollama process lifecycle management (start, stop, health-check)
- File and project management (open, save, multi-tab)
- Integrated terminal

**Out of scope for v1.0:**
- Cloud sync or remote LLM endpoints
- Git GUI (planned for v1.1)
- Plugin marketplace

### 1.4 Definitions and Acronyms

| Term | Definition |
|------|-----------|
| **Ollama** | Open-source tool that runs LLMs locally via a REST API on `localhost:11434` |
| **LLM** | Large Language Model — a neural network trained on text, used for code generation |
| **Autocomplete** | Inline ghost-text suggestion that completes the current line or block |
| **Chat Panel** | Side panel UI for free-form conversation with the 7B model |
| **Token** | Atomic unit of text processed by an LLM; roughly 0.75 words on average |
| **TPS** | Tokens per second — measure of LLM inference throughput |
| **LSP** | Language Server Protocol — standard for editor ↔ language server communication |
| **SRS** | Software Requirements Specification (this document) |

### 1.5 References

- Ollama official documentation: https://ollama.com/docs
- Qwen2.5-Coder model card: https://huggingface.co/Qwen/Qwen2.5-Coder-7B
- Language Server Protocol spec: https://microsoft.github.io/language-server-protocol/
- IEEE 830-1998 — Recommended Practice for SRS

---

## 2. System Overview

### 2.1 System Context

The editor runs as a desktop application (Electron or Tauri) on Windows, macOS, and Linux. It communicates with a locally running Ollama process over HTTP on localhost. No network connectivity is required for any AI feature after initial model download.

### 2.2 Target Hardware

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | i5 8th-gen U (4C/8T) | i7 10th-gen+ or Ryzen 5 |
| RAM | 16 GB DDR4 | 32 GB DDR4 |
| Storage | 10 GB free (SSD preferred) | 20 GB SSD |
| GPU | Integrated (Intel UHD 620) | Discrete GPU with 4 GB VRAM |
| OS | Windows 10 / Ubuntu 22 / macOS 12 | Latest stable release |

### 2.3 AI Model Strategy

Two Ollama models serve distinct roles, optimized for the target hardware:

| Model | Role | RAM Usage | Expected Speed (CPU-only) |
|-------|------|-----------|--------------------------|
| `qwen2.5-coder:1.5b` | Autocomplete | ~2 GB | 12–20 TPS |
| `qwen2.5-coder:7b` | Chat / Refactor | ~5 GB | 3–6 TPS |

Both models run simultaneously within the 14 GB RAM budget (combined ~7 GB), leaving headroom for the OS and editor process.

### 2.4 High-Level Architecture

The system is composed of five primary layers:

1. **UI Layer** — React/TypeScript frontend rendered in an Electron/Tauri webview
2. **Editor Core** — Monaco Editor (VSCode engine) for text editing and LSP integration
3. **AI Bridge** — Local Node.js/Rust service managing Ollama REST API calls and streaming
4. **Ollama Runtime** — Managed child process running on `localhost:11434`
5. **File System** — Native OS file access via the desktop shell

```
┌─────────────────────────────────────────────┐
│              Editor UI (React)              │
│  ┌──────────────┐  ┌────────────────────┐  │
│  │ Monaco Editor│  │    Chat Panel      │  │
│  └──────┬───────┘  └────────┬───────────┘  │
│         └──────────┬─────────┘             │
│              AI Bridge                      │
└──────────────────┬──────────────────────────┘
                   │ HTTP (localhost:11434)
           ┌───────┴────────┐
           │  Ollama Runtime │
           │  qwen2.5-coder  │
           │  :1.5b  │  :7b  │
           └────────────────┘
```

---

## 3. Stakeholders

| Stakeholder | Role | Key Interests |
|-------------|------|---------------|
| Developer (You) | Owner, primary engineer | Fast iteration, working AI features, stability on target hardware |
| End User | Solo developer / student | Responsive editor, accurate AI suggestions, privacy |
| Ollama Project | Upstream dependency | Correct API usage, version compatibility |

---

## 4. Functional Requirements

### 4.1 Ollama Lifecycle Management

The application must manage the Ollama process without requiring the user to interact with the command line.

| ID | Requirement | Priority | Description |
|----|-------------|----------|-------------|
| OLM-01 | Ollama Auto-Start | Must Have | Application automatically starts the Ollama process on launch if not already running. |
| OLM-02 | Health Check | Must Have | Application polls `localhost:11434/api/tags` on startup; displays a status indicator in the status bar (green/red). |
| OLM-03 | Model Pull on First Run | Must Have | If `qwen2.5-coder:1.5b` or `:7b` are not found, the app shows a one-time download dialog with a progress bar. |
| OLM-04 | Graceful Shutdown | Must Have | Application terminates the Ollama child process cleanly when the editor closes. |
| OLM-05 | Manual Restart | Should Have | User can restart the Ollama process from **Settings > AI > Restart Ollama Engine**. |
| OLM-06 | Env Variable Config | Should Have | App sets `OLLAMA_NUM_PARALLEL=1` and `OLLAMA_FLASH_ATTENTION=1` before spawning Ollama to optimise CPU usage. |

### 4.2 Core Editor

| ID | Requirement | Priority | Description |
|----|-------------|----------|-------------|
| ED-01 | Syntax Highlighting | Must Have | Support Python, JavaScript, TypeScript, Rust, Go, C/C++, Java, HTML, CSS, JSON, YAML, Markdown via Monaco. |
| ED-02 | Multi-tab Editing | Must Have | Allow opening multiple files simultaneously as tabs; each tab maintains independent undo history. |
| ED-03 | File Open/Save | Must Have | Native OS file dialogs for open, save, and save-as. Auto-save every 60 seconds when there are unsaved changes. |
| ED-04 | Project Folder | Must Have | Open a folder as a project; display file tree in a left sidebar with expand/collapse. |
| ED-05 | Find & Replace | Must Have | In-file find and replace with regex support and match count display. |
| ED-06 | Line Numbers & Minimap | Should Have | Display line numbers; optional minimap (off by default on small screens). |
| ED-07 | Theme Support | Should Have | Ship with Dark (default) and Light themes; user can switch in Settings. |
| ED-08 | Keyboard Shortcuts | Must Have | Standard keybindings: `Ctrl+S` save, `Ctrl+Z` undo, `Ctrl+Shift+P` command palette, etc. |
| ED-09 | Bracket Matching | Must Have | Highlight matching brackets and auto-close them on open. |
| ED-10 | Integrated Terminal | Should Have | Embedded terminal panel (xterm.js) running the OS shell. |

### 4.3 AI Autocomplete

| ID | Requirement | Priority | Description |
|----|-------------|----------|-------------|
| AC-01 | Ghost-text Completion | Must Have | After a configurable idle delay (default 600 ms), send current file context to `qwen2.5-coder:1.5b` and display suggestion as ghost text. |
| AC-02 | Accept Suggestion | Must Have | User accepts suggestion with `Tab`. `Escape` dismisses it. |
| AC-03 | Streaming Response | Must Have | Use Ollama streaming API (`/api/generate` with `stream: true`); display tokens as they arrive. |
| AC-04 | Context Window | Must Have | Send at most 2048 tokens immediately preceding the cursor to avoid latency spikes on the i5 CPU. |
| AC-05 | Cancel In-Flight Request | Must Have | If the user types while a completion is in-flight, cancel the HTTP request immediately to free CPU. |
| AC-06 | Enable/Disable Toggle | Must Have | Status bar button to toggle autocomplete on/off without restarting the app. |
| AC-07 | Idle Delay Setting | Should Have | User can configure the idle delay (200–2000 ms) in **Settings > AI > Autocomplete Delay**. |
| AC-08 | Multi-line Completion | Should Have | Autocomplete can suggest up to 10 lines; display is truncated with a scrollable preview if longer. |

### 4.4 AI Chat Panel

| ID | Requirement | Priority | Description |
|----|-------------|----------|-------------|
| CP-01 | Chat Sidebar | Must Have | Collapsible right sidebar with a chat interface (message history + input box). |
| CP-02 | Code-aware Context | Must Have | User can select code in the editor and click "Send to Chat"; selected code is prepended as a fenced code block in the message. |
| CP-03 | Streaming Replies | Must Have | AI reply streams token-by-token using the 7B model's `/api/chat` endpoint. |
| CP-04 | Conversation History | Must Have | Maintain session conversation history so follow-up questions have context (up to 4096 token window). |
| CP-05 | Clear Conversation | Must Have | Button to clear chat history and reset the context window. |
| CP-06 | Inline Actions | Should Have | Chat messages containing code blocks show **Copy** and **Insert at Cursor** action buttons. |
| CP-07 | Prompt Templates | Should Have | Preset prompt buttons: **Explain**, **Refactor**, **Write Tests**, **Fix Bug** — each prefills the input with a structured prompt. |
| CP-08 | Stop Generation | Must Have | Red stop button to abort ongoing generation and display the partial response. |

### 4.5 Settings

| ID | Requirement | Priority | Description |
|----|-------------|----------|-------------|
| ST-01 | Settings UI | Must Have | Dedicated Settings page accessible from menu bar and `Ctrl+,`. |
| ST-02 | Ollama Path | Must Have | Configurable path to the Ollama binary (defaults to system PATH). |
| ST-03 | Model Selection | Must Have | Dropdown to select which installed Ollama model to use for autocomplete and chat independently. |
| ST-04 | Font & Font Size | Should Have | Editor font family and size settings, defaulting to JetBrains Mono 14pt. |
| ST-05 | Settings Persistence | Must Have | All settings stored in a local config file (JSON); survive app restarts. |

---

## 5. Use Cases

### UC-01: AI Autocomplete While Typing

| Field | Detail |
|-------|--------|
| **Use Case ID** | UC-01 |
| **Primary Actor** | Developer |
| **Description** | Developer types code and receives an inline ghost-text suggestion from the 1.5B model. |
| **Preconditions** | Ollama is running. Autocomplete is enabled. A file is open in the editor. |
| **Postconditions** | Suggestion is displayed or dismissed. File content is unchanged unless Tab is pressed. |
| **Main Flow** | 1. Developer types code and pauses for 600 ms. 2. System sends ≤2048 token context to `qwen2.5-coder:1.5b`. 3. Ghost text appears character-by-character as tokens stream in. 4. Developer presses `Tab` to accept or `Escape` to dismiss. 5. On accept, ghost text is inserted as real text. |
| **Alternative Flow** | If user types before completion finishes, the in-flight HTTP request is cancelled immediately. |

### UC-02: Explain Selected Code

| Field | Detail |
|-------|--------|
| **Use Case ID** | UC-02 |
| **Primary Actor** | Developer |
| **Description** | Developer highlights a confusing code block and asks the AI to explain it. |
| **Preconditions** | Chat panel is open. A file with code is open in the editor. |
| **Postconditions** | Chat panel shows a streamed explanation of the selected code. |
| **Main Flow** | 1. Developer selects lines 12–34 in the editor. 2. Developer clicks "Send to Chat" or presses `Ctrl+Shift+E`. 3. System appends the selection as a code block to the chat input. 4. Developer submits with "Explain this code". 5. `qwen2.5-coder:7b` streams an explanation into the chat panel. |

### UC-03: First-time Model Download

| Field | Detail |
|-------|--------|
| **Use Case ID** | UC-03 |
| **Primary Actor** | Developer |
| **Description** | On first launch, required models are not installed; the app guides the user through downloading them. |
| **Preconditions** | Ollama binary is installed on the system. No models are present. |
| **Postconditions** | Models are downloaded and the app is fully operational. |
| **Main Flow** | 1. App launches and health-checks Ollama. 2. App queries `/api/tags`; neither model is listed. 3. App shows modal: "Two models need to be downloaded (~6 GB total). Continue?" 4. User clicks Download. 5. App calls `ollama pull` for each model and shows a progress bar. 6. On completion, modal closes and editor is ready. |
| **Alternative Flow** | If download fails, app retries automatically up to 3 times before prompting user to retry manually. |

---

## 6. Non-Functional Requirements

### 6.1 Performance

| ID | Requirement | Priority | Description |
|----|-------------|----------|-------------|
| PF-01 | Editor Startup Time | Must Have | Editor UI must be ready for input within 3 seconds on target hardware (excluding model loading). |
| PF-02 | Autocomplete Latency | Must Have | First token of autocomplete must appear within 800 ms of the idle delay expiring on target hardware. |
| PF-03 | Editor Responsiveness | Must Have | Keystroke-to-render latency must remain below 16 ms (60 fps) at all times, even during AI inference. |
| PF-04 | Memory Ceiling | Must Have | Total RAM usage (editor process + Ollama) must not exceed 14 GB, leaving 2 GB for the OS. |
| PF-05 | CPU Throttle | Should Have | AI inference must run on background threads; no inference task should consume >75% CPU for over 2 consecutive seconds. |

### 6.2 Reliability

| ID | Requirement | Priority | Description |
|----|-------------|----------|-------------|
| RL-01 | Ollama Crash Recovery | Must Have | If Ollama crashes, the editor detects it within 5 seconds, shows a warning, and offers an auto-restart button. |
| RL-02 | Timeout Handling | Must Have | Any Ollama API request that does not respond within 30 seconds is cancelled and an error toast is shown. |
| RL-03 | Unsaved File Protection | Must Have | If the app crashes, unsaved content must be recoverable from a temp file on next launch. |
| RL-04 | Graceful Degradation | Must Have | If AI features fail, the editor continues to function as a normal code editor with zero data loss. |

### 6.3 Usability

| ID | Requirement | Priority | Description |
|----|-------------|----------|-------------|
| UX-01 | Onboarding Flow | Must Have | First-time users see a welcome screen with a checklist: Ollama status, model status, and a "Try autocomplete" quickstart. |
| UX-02 | Status Bar Indicators | Must Have | Status bar permanently shows Ollama status (dot), active model names, and autocomplete toggle. |
| UX-03 | Error Messages | Must Have | All errors are shown as non-blocking toast notifications with a human-readable message and a suggested action. |
| UX-04 | Accessibility | Should Have | Editor and all panels must be keyboard-navigable. UI must meet WCAG 2.1 AA contrast ratios. |

### 6.4 Security & Privacy

| ID | Requirement | Priority | Description |
|----|-------------|----------|-------------|
| SEC-01 | Offline-Only AI | Must Have | No code or prompt data is ever transmitted to an external server. All AI runs locally. |
| SEC-02 | No Telemetry | Must Have | The application must not collect usage analytics or crash reports without explicit user opt-in. |
| SEC-03 | Config File Permissions | Should Have | Settings file is stored with user-only read/write permissions (`chmod 600` or OS equivalent). |

### 6.5 Maintainability

| ID | Requirement | Priority | Description |
|----|-------------|----------|-------------|
| MT-01 | Modular AI Bridge | Must Have | The Ollama integration layer must be a self-contained module so that switching to a different LLM backend requires changes only to that module. |
| MT-02 | Configuration Schema | Should Have | Settings schema must be versioned; migrations must run automatically on upgrade. |
| MT-03 | Logging | Should Have | All Ollama API calls and errors are logged to a rotating log file (max 10 MB) accessible from **Help > View Logs**. |

---

## 7. Technical Constraints & Assumptions

### 7.1 Recommended Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Desktop Shell | Electron or Tauri | Cross-platform; Tauri preferred for lower memory footprint |
| Editor Component | Monaco Editor | Industry-standard; built-in LSP support |
| UI Framework | React + TypeScript | Component reuse; strong typing reduces bugs |
| AI Bridge | Node.js (fetch) or Rust (reqwest) | Streaming HTTP support; non-blocking I/O |
| LLM Runtime | Ollama v0.3+ | Runs quantized models efficiently on CPU |
| Terminal | xterm.js + node-pty | Mature embedded terminal solution |

### 7.2 Constraints

- The application must not require an internet connection after initial model download.
- Ollama version must be **0.3 or higher** (streaming chat API introduced in 0.3).
- The 7B and 1.5B models must run simultaneously within the 14 GB RAM budget; combined quantized size is approximately 7 GB.
- Monaco Editor must be bundled (not fetched from CDN) to support offline use.

### 7.3 Assumptions

- User has already installed Ollama on their system before first launch.
- The i5 8th-gen U has at least 4 physical CPU cores available for inference.
- Disk I/O speed is at least 100 MB/s (SATA SSD or better) to avoid model load bottlenecks.
- The OS scheduler allows Ollama to use background threads without priority inversion.

---

## 8. System Interfaces

### 8.1 Ollama REST API

All AI communication happens over HTTP on `localhost:11434`. No external network calls are ever made.

| Endpoint | Method | Usage |
|----------|--------|-------|
| `/api/tags` | GET | List installed models; used for health-check and model validation |
| `/api/generate` | POST | Autocomplete — streaming single-turn completion with `qwen2.5-coder:1.5b` |
| `/api/chat` | POST | Chat panel — streaming multi-turn conversation with `qwen2.5-coder:7b` |
| `/api/pull` | POST | First-run model download with progress streaming |
| `/api/delete` | DELETE | (Future v1.1) Remove a model from disk via Settings |

**Example autocomplete request:**
```json
{
  "model": "qwen2.5-coder:1.5b",
  "prompt": "<cursor context here>",
  "stream": true,
  "options": {
    "num_predict": 128,
    "temperature": 0.2,
    "stop": ["\n\n", "```"]
  }
}
```

**Example chat request:**
```json
{
  "model": "qwen2.5-coder:7b",
  "messages": [
    { "role": "system", "content": "You are an expert programming assistant." },
    { "role": "user", "content": "Explain this function: ..." }
  ],
  "stream": true
}
```

### 8.2 File System Interface

- Read/write arbitrary files via Node.js `fs` module or Tauri `fs` plugin.
- Config stored at `{userData}/config.json` (Electron) or `{app_data}/config.json` (Tauri).
- Crash-recovery buffer stored at `{userData}/recovery/{filename}.tmp`.

### 8.3 Language Server Protocol (LSP)

For languages with available LSP servers (e.g., `pyright` for Python, `typescript-language-server` for TypeScript), the editor spawns and communicates with them via stdin/stdout using the LSP protocol to provide diagnostics, hover documentation, and go-to-definition. LSP integration is optional and gracefully disabled if the server binary is not found on `PATH`.

---

## 9. Data Requirements

### 9.1 Configuration Schema

All user settings are persisted as a single JSON file. Schema:

| Field | Type / Default | Description |
|-------|---------------|-------------|
| `schema_version` | `number` / `1` | For migration; increment on breaking changes |
| `ollama.path` | `string` / `"ollama"` | Path to Ollama binary |
| `ollama.host` | `string` / `"localhost"` | Ollama server host |
| `ollama.port` | `number` / `11434` | Ollama server port |
| `ai.autocomplete.model` | `string` / `"qwen2.5-coder:1.5b"` | Model used for inline completion |
| `ai.autocomplete.enabled` | `boolean` / `true` | Toggle autocomplete globally |
| `ai.autocomplete.delay_ms` | `number` / `600` | Idle delay before triggering completion (ms) |
| `ai.autocomplete.context_tokens` | `number` / `2048` | Max tokens of context sent per completion request |
| `ai.chat.model` | `string` / `"qwen2.5-coder:7b"` | Model used for chat panel |
| `ai.chat.context_tokens` | `number` / `4096` | Max conversation history size in tokens |
| `editor.theme` | `string` / `"dark"` | `"dark"` or `"light"` |
| `editor.font_family` | `string` / `"JetBrains Mono"` | Editor font family |
| `editor.font_size` | `number` / `14` | Font size in pixels |
| `editor.auto_save_interval_s` | `number` / `60` | Seconds between auto-saves (`0` = disabled) |

**Example `config.json`:**
```json
{
  "schema_version": 1,
  "ollama": {
    "path": "ollama",
    "host": "localhost",
    "port": 11434
  },
  "ai": {
    "autocomplete": {
      "model": "qwen2.5-coder:1.5b",
      "enabled": true,
      "delay_ms": 600,
      "context_tokens": 2048
    },
    "chat": {
      "model": "qwen2.5-coder:7b",
      "context_tokens": 4096
    }
  },
  "editor": {
    "theme": "dark",
    "font_family": "JetBrains Mono",
    "font_size": 14,
    "auto_save_interval_s": 60
  }
}
```

---

## 10. Development Milestones

| Phase | Target | Deliverables |
|-------|--------|-------------|
| M1 | Week 2 | Electron/Tauri scaffold + Monaco Editor rendering + file open/save working |
| M2 | Week 4 | Ollama process management + health-check + model pull UI |
| M3 | Week 7 | Autocomplete with streaming ghost text + cancel on keystroke |
| M4 | Week 10 | Chat panel + streaming + prompt templates + Insert at Cursor |
| M5 | Week 12 | Settings UI + integrated terminal + themes + keyboard shortcuts |
| M6 | Week 14 | Performance profiling on i5 8th-gen U + bug fixes + packaging |
| v1.0 | Week 16 | Public release: signed installers for Windows, macOS, Linux |

---

## 11. Risks & Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|-----------|
| Autocomplete latency >800 ms on target CPU | High | Use 1.5B model; reduce context to 1024 tokens as fallback; allow user to tune delay |
| Ollama API breaking changes between versions | Medium | Pin Ollama version in docs; wrap API in versioned adapter module |
| RAM pressure causing OS to swap | Medium | Monitor usage; warn user when combined usage >12 GB; offer to unload 7B model |
| Model download fails midway | Low | Ollama pull is resumable; retry automatically up to 3 times before prompting user |
| Monaco Editor bundle size too large (>50 MB) | Low | Use tree-shaking and lazy language loading; only load grammars on demand |

---

## 12. Appendix

### 12.1 Ollama Environment Variables

Set the following before launching Ollama to optimise performance on the target CPU:

```bash
export OLLAMA_NUM_PARALLEL=1        # Prevents concurrent inference tasks from contending for CPU
export OLLAMA_FLASH_ATTENTION=1     # Enables Flash Attention; reduces memory bandwidth usage
export OLLAMA_MAX_LOADED_MODELS=2   # Allows both models to stay warm in RAM simultaneously
```

### 12.2 Model Pull Commands

Run once before starting the editor (or let the app handle it on first launch):

```bash
ollama pull qwen2.5-coder:1.5b   # Autocomplete model (~1 GB)
ollama pull qwen2.5-coder:7b     # Chat model (~5 GB)
```

### 12.3 Requirement Priority Legend

| Priority | Meaning |
|----------|---------|
| **Must Have** | Core requirements; v1.0 is not shippable without these |
| **Should Have** | High value; include if schedule permits; targeted for v1.0 |
| **Nice to Have** | Deferred to v1.1 unless implementation is trivial |

### 12.4 Requirement Count Summary

| Area | Must Have | Should Have | Total |
|------|-----------|-------------|-------|
| Ollama Lifecycle | 4 | 2 | 6 |
| Core Editor | 6 | 4 | 10 |
| AI Autocomplete | 6 | 2 | 8 |
| AI Chat Panel | 6 | 2 | 8 |
| Settings | 3 | 2 | 5 |
| Performance | 4 | 1 | 5 |
| Reliability | 4 | 0 | 4 |
| Usability | 3 | 1 | 4 |
| Security | 2 | 1 | 3 |
| Maintainability | 1 | 2 | 3 |
| **Total** | **39** | **17** | **56** |

---

*End of Document — SRS v1.0 | AI-Powered Code Editor with Ollama*
# AI Code Editor

An AI-powered code editor built with Tauri, React, and TypeScript, featuring local AI integration via Ollama.

## Features

- **Monaco Editor Integration**: Full-featured code editor with syntax highlighting
- **AI Autocomplete**: Real-time code suggestions powered by Qwen2.5-Coder (1.5B)
- **AI Chat Assistant**: Interactive chat panel with Qwen2.5-Coder (7B) for coding help
- **File Explorer**: Browse and manage project files
- **Ollama Integration**: Automatic lifecycle management of local AI models
- **Multi-language Support**: Syntax highlighting for JavaScript, TypeScript, Python, Rust, Go, Java, C/C++, and more

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Rust** (latest stable version)
3. **Ollama** - Install from [ollama.ai](https://ollama.ai)

## Installation

1. Clone the repository:
```bash
cd "e:\development\custom ai code editor\ai-code-editor"
```

2. Install dependencies:
```bash
npm install
```

3. Install Ollama models (will auto-download on first run, but you can pre-install):
```bash
ollama pull qwen2.5-coder:1.5b
ollama pull qwen2.5-coder:7b
```

## Development

Run the development server:
```bash
npm run tauri dev
```

## Build

Build the production application:
```bash
npm run tauri build
```

## Usage

### Opening Files
- Click "Open" in the menu bar to open a single file
- Click "Show Explorer" to browse and open files from a folder

### AI Autocomplete
- Start typing code in the editor
- Wait ~600ms for AI suggestions to appear as ghost text
- Press `Tab` to accept the suggestion
- Press `Escape` to dismiss the suggestion

### AI Chat Assistant
- Click "Show Chat" to open the chat panel
- Ask questions about code, debugging, or programming concepts
- The AI has context awareness and can help with your code

### Keyboard Shortcuts
- `Tab`: Accept AI autocomplete suggestion
- `Escape`: Dismiss AI suggestion
- `Enter`: Send chat message (in chat input)
- `Shift+Enter`: New line in chat input

## Project Structure

```
ai-code-editor/
├── src/                      # React frontend
│   ├── components/           # React components
│   │   ├── MonacoEditor.tsx  # Code editor with AI
│   │   ├── ChatPanel.tsx     # AI chat interface
│   │   ├── FileExplorer.tsx  # File browser
│   │   └── StatusBar.tsx     # Status indicator
│   ├── services/             # Services
│   │   └── OllamaService.tsx # Ollama API integration
│   ├── App.tsx               # Main application
│   ├── main.tsx              # React entry point
│   └── styles.css            # Global styles
├── src-tauri/                # Tauri backend
│   ├── src/
│   │   └── main.rs           # Rust backend with Ollama lifecycle
│   ├── Cargo.toml            # Rust dependencies
│   └── tauri.conf.json       # Tauri configuration
├── package.json              # Node dependencies
└── vite.config.ts            # Vite configuration
```

## Configuration

### Ollama Settings
The application uses:
- **qwen2.5-coder:1.5b** for fast autocomplete (low latency)
- **qwen2.5-coder:7b** for chat responses (better quality)

You can modify the models in:
- `src/services/OllamaService.tsx` - Change model names
- `src-tauri/src/main.rs` - Update model pulling logic

### Editor Settings
Customize Monaco Editor in `src/components/MonacoEditor.tsx`:
- Font size
- Theme (vs-dark, vs-light)
- Tab size
- Word wrap
- Minimap

## Troubleshooting

### Ollama Not Starting
- Ensure Ollama is installed: `ollama --version`
- Check if Ollama is already running: `curl http://localhost:11434`
- Manually start Ollama: `ollama serve`

### Models Not Downloading
- Check internet connection
- Manually pull models: `ollama pull qwen2.5-coder:1.5b`
- Check disk space (models are ~1-4GB each)

### AI Suggestions Not Appearing
- Wait for Ollama to fully start (check status bar)
- Ensure models are downloaded (check status bar)
- Type at least 10 characters before expecting suggestions
- Wait ~600ms after typing

## Performance Tips

1. **First Run**: Initial model download takes time (1-4GB per model)
2. **Memory**: Ollama uses ~2-4GB RAM when running
3. **CPU**: AI inference is CPU-intensive; suggestions may be slower on older hardware
4. **SSD**: Recommended for faster model loading

## License

MIT

## Contributing

Contributions welcome! Please open an issue or submit a pull request.

## Acknowledgments

- Built with [Tauri](https://tauri.app/)
- Editor powered by [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- AI powered by [Ollama](https://ollama.ai) and [Qwen2.5-Coder](https://github.com/QwenLM/Qwen2.5-Coder)
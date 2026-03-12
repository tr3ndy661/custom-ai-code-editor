import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { open, save } from '@tauri-apps/api/dialog';
import { readTextFile, writeTextFile } from '@tauri-apps/api/fs';
import MonacoEditor from './components/MonacoEditor';
import ChatPanel from './components/ChatPanel';
import FileExplorer from './components/FileExplorer';
import StatusBar from './components/StatusBar';
import Terminal from './components/Terminal';
import SettingsPanel from './components/SettingsPanel';
import WelcomeScreen from './components/WelcomeScreen';
import NotificationSystem, { useNotifications } from './components/NotificationSystem';
import { OllamaService } from './services/OllamaService';

interface OllamaStatus {
  running: boolean;
  models: string[];
}

function App() {
  const [currentFile, setCurrentFile] = useState<string>('');
  const [fileContent, setFileContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('untitled.txt');
  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus>({ running: false, models: [] });
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isFileExplorerOpen, setIsFileExplorerOpen] = useState(true);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const { notifications, dismissNotification, success, error, info } = useNotifications();

  useEffect(() => {
    initializeOllama();
    setupKeyboardShortcuts();
  }, []);

  const initializeOllama = async () => {
    try {
      await invoke('start_ollama');
      info('Starting Ollama...');
      setTimeout(checkOllamaStatus, 2000);
    } catch (error) {
      console.error('Failed to start Ollama:', error);
      error('Failed to start Ollama');
    }
  };

  const checkOllamaStatus = async () => {
    try {
      const status = await invoke<OllamaStatus>('check_ollama_status');
      setOllamaStatus(status);
      
      if (status.running && !status.models.includes('qwen2.5-coder:1.5b')) {
        await invoke('pull_model', { modelName: 'qwen2.5-coder:1.5b' });
      }
      if (status.running && !status.models.includes('qwen2.5-coder:7b')) {
        await invoke('pull_model', { modelName: 'qwen2.5-coder:7b' });
      }
    } catch (error) {
      console.error('Failed to check Ollama status:', error);
    }
  };

  const setupKeyboardShortcuts = () => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+O: Open file
      if (e.ctrlKey && e.key === 'o') {
        e.preventDefault();
        handleOpenFile();
      }
      // Ctrl+S: Save file
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handleSaveFile();
      }
      // Ctrl+`: Toggle terminal
      if (e.ctrlKey && e.key === '`') {
        e.preventDefault();
        setIsTerminalOpen(prev => !prev);
      }
      // Ctrl+B: Toggle file explorer
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        setIsFileExplorerOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  };

  const handleOpenFile = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{
          name: 'All Files',
          extensions: ['*']
        }]
      });
      
      if (selected && typeof selected === 'string') {
        const content = await readTextFile(selected);
        setCurrentFile(selected);
        setFileContent(content);
        setFileName(selected.split(/[\\/]/).pop() || 'untitled.txt');
        success('File opened successfully');
      }
    } catch (err) {
      console.error('Failed to open file:', err);
      error('Failed to open file');
    }
  };

  const handleSaveFile = async () => {
    try {
      if (currentFile) {
        await writeTextFile(currentFile, fileContent);
        success('File saved successfully');
      } else {
        const selected = await save({
          filters: [{
            name: 'All Files',
            extensions: ['*']
          }]
        });
        
        if (selected && typeof selected === 'string') {
          await writeTextFile(selected, fileContent);
          setCurrentFile(selected);
          setFileName(selected.split(/[\\/]/).pop() || 'untitled.txt');
          success('File saved successfully');
        }
      }
    } catch (err) {
      console.error('Failed to save file:', err);
      error('Failed to save file');
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    setFileContent(value || '');
  };

  return (
    <div className="app">
      {showWelcome && (
        <WelcomeScreen
          onOpenFile={() => {
            setShowWelcome(false);
            handleOpenFile();
          }}
          onOpenFolder={() => {
            setShowWelcome(false);
            setIsFileExplorerOpen(true);
          }}
          onDismiss={() => setShowWelcome(false)}
        />
      )}
      
      <div className="menu-bar">
        <button onClick={handleOpenFile} title="Open File (Ctrl+O)">Open</button>
        <button onClick={handleSaveFile} title="Save File (Ctrl+S)">Save</button>
        <button onClick={() => setIsChatOpen(!isChatOpen)} title="Toggle Chat">
          {isChatOpen ? 'Hide Chat' : 'Show Chat'}
        </button>
        <button onClick={() => setIsFileExplorerOpen(!isFileExplorerOpen)} title="Toggle Explorer (Ctrl+B)">
          {isFileExplorerOpen ? 'Hide Explorer' : 'Show Explorer'}
        </button>
        <button onClick={() => setIsTerminalOpen(!isTerminalOpen)} title="Toggle Terminal (Ctrl+`)">
          {isTerminalOpen ? 'Hide Terminal' : 'Show Terminal'}
        </button>
        <button onClick={() => setIsSettingsOpen(true)} title="Settings">
          ⚙️ Settings
        </button>
      </div>
      
      <div className="main-content">
        {isFileExplorerOpen && (
          <div className="file-explorer">
            <FileExplorer onFileSelect={(path, content) => {
              setCurrentFile(path);
              setFileContent(content);
              setFileName(path.split(/[\\/]/).pop() || 'untitled.txt');
            }} />
          </div>
        )}
        
        <div className="editor-container">
          <div className="tab-bar">
            <div className="tab active">{fileName}</div>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: isTerminalOpen ? 1 : 'auto', minHeight: isTerminalOpen ? '300px' : 'auto' }}>
              <MonacoEditor
                value={fileContent}
                onChange={handleEditorChange}
                language={getLanguageFromFileName(fileName)}
                ollamaStatus={ollamaStatus}
              />
            </div>
            {isTerminalOpen && <Terminal workingDirectory={currentFile ? currentFile.split(/[\\/]/).slice(0, -1).join('\\') : ''} />}
          </div>
        </div>
        
        {isChatOpen && (
          <div className="chat-panel">
            <ChatPanel ollamaStatus={ollamaStatus} />
          </div>
        )}
      </div>
      
      <StatusBar ollamaStatus={ollamaStatus} />
      
      {isSettingsOpen && (
        <SettingsPanel 
          ollamaStatus={ollamaStatus} 
          onClose={() => setIsSettingsOpen(false)} 
        />
      )}
      
      <NotificationSystem 
        notifications={notifications}
        onDismiss={dismissNotification}
      />
    </div>
  );
}

function getLanguageFromFileName(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const languageMap: { [key: string]: string } = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'py': 'python',
    'rs': 'rust',
    'go': 'go',
    'java': 'java',
    'c': 'c',
    'cpp': 'cpp',
    'h': 'c',
    'hpp': 'cpp',
    'html': 'html',
    'css': 'css',
    'json': 'json',
    'yaml': 'yaml',
    'yml': 'yaml',
    'md': 'markdown',
    'txt': 'plaintext'
  };
  return languageMap[ext || ''] || 'plaintext';
}

export default App;
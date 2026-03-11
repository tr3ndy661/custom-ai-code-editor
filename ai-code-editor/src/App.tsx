import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { open } from '@tauri-apps/api/dialog';
import { readTextFile, writeTextFile } from '@tauri-apps/api/fs';
import MonacoEditor from './components/MonacoEditor';
import ChatPanel from './components/ChatPanel';
import FileExplorer from './components/FileExplorer';
import StatusBar from './components/StatusBar';
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

  useEffect(() => {
    initializeOllama();
  }, []);

  const initializeOllama = async () => {
    try {
      await invoke('start_ollama');
      setTimeout(checkOllamaStatus, 2000);
    } catch (error) {
      console.error('Failed to start Ollama:', error);
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
      }
    } catch (error) {
      console.error('Failed to open file:', error);
    }
  };

  const handleSaveFile = async () => {
    try {
      if (currentFile) {
        await writeTextFile(currentFile, fileContent);
      } else {
        const selected = await open({
          multiple: false,
          filters: [{
            name: 'All Files',
            extensions: ['*']
          }]
        });
        
        if (selected && typeof selected === 'string') {
          await writeTextFile(selected, fileContent);
          setCurrentFile(selected);
          setFileName(selected.split(/[\\/]/).pop() || 'untitled.txt');
        }
      }
    } catch (error) {
      console.error('Failed to save file:', error);
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    setFileContent(value || '');
  };

  return (
    <div className="app">
      <div className="menu-bar">
        <button onClick={handleOpenFile}>Open</button>
        <button onClick={handleSaveFile}>Save</button>
        <button onClick={() => setIsChatOpen(!isChatOpen)}>
          {isChatOpen ? 'Hide Chat' : 'Show Chat'}
        </button>
        <button onClick={() => setIsFileExplorerOpen(!isFileExplorerOpen)}>
          {isFileExplorerOpen ? 'Hide Explorer' : 'Show Explorer'}
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
          <MonacoEditor
            value={fileContent}
            onChange={handleEditorChange}
            language={getLanguageFromFileName(fileName)}
            ollamaStatus={ollamaStatus}
          />
        </div>
        
        {isChatOpen && (
          <div className="chat-panel">
            <ChatPanel ollamaStatus={ollamaStatus} />
          </div>
        )}
      </div>
      
      <StatusBar ollamaStatus={ollamaStatus} />
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
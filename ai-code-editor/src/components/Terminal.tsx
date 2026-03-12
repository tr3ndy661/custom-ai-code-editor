import React, { useState, useRef, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

interface TerminalProps {
  workingDirectory?: string;
}

interface TerminalLine {
  id: string;
  type: 'command' | 'output' | 'error';
  content: string;
}

const Terminal: React.FC<TerminalProps> = ({ workingDirectory = '' }) => {
  const [lines, setLines] = useState<TerminalLine[]>([
    { id: '0', type: 'output', content: 'AI Code Editor Terminal v1.0' },
    { id: '1', type: 'output', content: 'Type commands below...' }
  ]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  const executeCommand = async (command: string) => {
    if (!command.trim()) return;

    // Add command to display
    const commandLine: TerminalLine = {
      id: Date.now().toString(),
      type: 'command',
      content: `$ ${command}`
    };
    setLines(prev => [...prev, commandLine]);

    // Add to history
    setHistory(prev => [...prev, command]);
    setHistoryIndex(-1);

    // Handle built-in commands
    if (command === 'clear') {
      setLines([]);
      setInput('');
      return;
    }

    if (command === 'help') {
      const helpLine: TerminalLine = {
        id: (Date.now() + 1).toString(),
        type: 'output',
        content: 'Available commands:\n  clear - Clear terminal\n  help - Show this help\n  Any other command will be executed in the system shell'
      };
      setLines(prev => [...prev, helpLine]);
      setInput('');
      return;
    }

    // Execute system command (placeholder - would need Tauri command)
    try {
      const outputLine: TerminalLine = {
        id: (Date.now() + 1).toString(),
        type: 'output',
        content: `Command execution not yet implemented: ${command}`
      };
      setLines(prev => [...prev, outputLine]);
    } catch (error) {
      const errorLine: TerminalLine = {
        id: (Date.now() + 1).toString(),
        type: 'error',
        content: `Error: ${error}`
      };
      setLines(prev => [...prev, errorLine]);
    }

    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeCommand(input);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const newIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setInput(history[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= history.length) {
          setHistoryIndex(-1);
          setInput('');
        } else {
          setHistoryIndex(newIndex);
          setInput(history[newIndex]);
        }
      }
    }
  };

  return (
    <div className="terminal">
      <div className="terminal-header">
        <span>Terminal</span>
        <button onClick={() => setLines([])} className="terminal-clear-btn">Clear</button>
      </div>
      <div className="terminal-content">
        {lines.map(line => (
          <div key={line.id} className={`terminal-line terminal-${line.type}`}>
            {line.content}
          </div>
        ))}
        <div className="terminal-input-line">
          <span className="terminal-prompt">$</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="terminal-input"
            placeholder="Type command..."
            autoFocus
          />
        </div>
        <div ref={terminalEndRef} />
      </div>
    </div>
  );
};

export default Terminal;
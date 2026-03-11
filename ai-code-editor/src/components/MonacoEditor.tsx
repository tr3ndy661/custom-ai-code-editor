import React, { useRef, useEffect, useState } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { OllamaService } from '../services/OllamaService';

interface MonacoEditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
  language: string;
  ollamaStatus: { running: boolean; models: string[] };
}

const MonacoEditor: React.FC<MonacoEditorProps> = ({ 
  value, 
  onChange, 
  language, 
  ollamaStatus 
}) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [isAutoCompleting, setIsAutoCompleting] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    
    // Configure editor options
    editor.updateOptions({
      fontSize: 14,
      lineNumbers: 'on',
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 2,
      insertSpaces: true,
      wordWrap: 'on',
      bracketPairColorization: { enabled: true },
    });

    // Set up AI autocomplete
    setupAutoComplete(editor, monaco);
  };

  const setupAutoComplete = (editor: monaco.editor.IStandaloneCodeEditor, monaco: any) => {
    let ghostTextWidget: any = null;

    const showGhostText = (text: string, position: monaco.Position) => {
      if (ghostTextWidget) {
        ghostTextWidget.dispose();
      }

      ghostTextWidget = {
        getId: () => 'ghost-text-widget',
        getDomNode: () => {
          const node = document.createElement('div');
          node.style.color = '#666';
          node.style.fontStyle = 'italic';
          node.style.opacity = '0.6';
          node.textContent = text;
          return node;
        },
        getPosition: () => ({
          position: position,
          preference: [monaco.editor.ContentWidgetPositionPreference.EXACT]
        })
      };

      editor.addContentWidget(ghostTextWidget);
    };

    const hideGhostText = () => {
      if (ghostTextWidget) {
        editor.removeContentWidget(ghostTextWidget);
        ghostTextWidget = null;
      }
    };

    // Listen for content changes
    editor.onDidChangeModelContent(() => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      hideGhostText();

      if (!ollamaStatus.running || !ollamaStatus.models.includes('qwen2.5-coder:1.5b')) {
        return;
      }

      timeoutRef.current = setTimeout(async () => {
        const position = editor.getPosition();
        if (!position) return;

        const model = editor.getModel();
        if (!model) return;

        const textBeforeCursor = model.getValueInRange({
          startLineNumber: Math.max(1, position.lineNumber - 20),
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column
        });

        if (textBeforeCursor.trim().length < 10) return;

        setIsAutoCompleting(true);
        
        try {
          const suggestion = await OllamaService.getCompletion(textBeforeCursor, language);
          if (suggestion && suggestion.trim()) {
            showGhostText(suggestion, position);
          }
        } catch (error) {
          console.error('Autocomplete error:', error);
        } finally {
          setIsAutoCompleting(false);
        }
      }, 600);
    });

    // Accept suggestion with Tab
    editor.addCommand(monaco.KeyCode.Tab, () => {
      if (ghostTextWidget) {
        const suggestion = ghostTextWidget.getDomNode().textContent;
        const position = editor.getPosition();
        if (position && suggestion) {
          editor.executeEdits('ghost-text', [{
            range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
            text: suggestion
          }]);
          hideGhostText();
        }
      }
    });

    // Dismiss suggestion with Escape
    editor.addCommand(monaco.KeyCode.Escape, () => {
      hideGhostText();
    });
  };

  return (
    <div style={{ height: '100%', position: 'relative' }}>
      <Editor
        height="100%"
        language={language}
        value={value}
        onChange={onChange}
        onMount={handleEditorDidMount}
        theme="vs-dark"
        options={{
          selectOnLineNumbers: true,
          roundedSelection: false,
          readOnly: false,
          cursorStyle: 'line',
          automaticLayout: true,
        }}
      />
      {isAutoCompleting && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '5px 10px',
          borderRadius: '3px',
          fontSize: '12px'
        }}>
          AI thinking...
        </div>
      )}
    </div>
  );
};

export default MonacoEditor;
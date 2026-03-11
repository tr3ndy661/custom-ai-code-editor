import React, { useState, useRef, useEffect } from 'react';
import { OllamaService } from '../services/OllamaService';

interface ChatPanelProps {
  ollamaStatus: { running: boolean; models: string[] };
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ ollamaStatus }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
    if (!ollamaStatus.running || !ollamaStatus.models.includes('qwen2.5-coder:7b')) {
      alert('AI model not available. Please wait for Ollama to start and models to download.');
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, assistantMessage]);

    try {
      await OllamaService.streamChatResponse(
        userMessage.content,
        undefined,
        (token: string) => {
          setMessages(prev => {
            const updated = [...prev];
            const lastMessage = updated[updated.length - 1];
            if (lastMessage.role === 'assistant') {
              lastMessage.content += token;
            }
            return updated;
          });
        }
      );
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => {
        const updated = [...prev];
        const lastMessage = updated[updated.length - 1];
        if (lastMessage.role === 'assistant') {
          lastMessage.content = 'Error: Could not get response from AI.';
        }
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <h3>AI Assistant</h3>
        <button onClick={clearChat} className="clear-btn">Clear</button>
      </div>
      
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="welcome-message">
            <p>👋 Hi! I'm your AI coding assistant.</p>
            <p>Ask me about code, debugging, or programming concepts!</p>
          </div>
        )}
        
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.role}`}>
            <div className="message-content">
              <pre>{message.content}</pre>
            </div>
            <div className="message-time">
              {message.timestamp.toLocaleTimeString()}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <div className="chat-input">
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask me anything about code..."
          disabled={isLoading || !ollamaStatus.running}
          rows={3}
        />
        <button 
          onClick={handleSendMessage}
          disabled={isLoading || !inputValue.trim() || !ollamaStatus.running}
          className="send-btn"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatPanel;
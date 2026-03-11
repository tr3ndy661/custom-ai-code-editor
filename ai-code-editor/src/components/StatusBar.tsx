import React from 'react';

interface StatusBarProps {
  ollamaStatus: { running: boolean; models: string[] };
}

const StatusBar: React.FC<StatusBarProps> = ({ ollamaStatus }) => {
  const getStatusColor = () => {
    if (!ollamaStatus.running) return '#ff4444';
    if (ollamaStatus.models.length === 0) return '#ffaa00';
    return '#44ff44';
  };

  const getStatusText = () => {
    if (!ollamaStatus.running) return 'Ollama: Offline';
    if (ollamaStatus.models.length === 0) return 'Ollama: Starting...';
    return `Ollama: Online (${ollamaStatus.models.length} models)`;
  };

  return (
    <div className="status-bar">
      <div className="status-left">
        <div 
          className="status-indicator"
          style={{ backgroundColor: getStatusColor() }}
        />
        <span className="status-text">{getStatusText()}</span>
      </div>
      
      <div className="status-right">
        <span className="status-info">AI Code Editor v1.0</span>
      </div>
    </div>
  );
};

export default StatusBar;
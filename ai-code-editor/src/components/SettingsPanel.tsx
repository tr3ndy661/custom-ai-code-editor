import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

interface SettingsPanelProps {
  ollamaStatus: { running: boolean; models: string[] };
  onClose: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ ollamaStatus, onClose }) => {
  const [selectedModel, setSelectedModel] = useState('qwen2.5-coder:1.5b');
  const [customModel, setCustomModel] = useState('');
  const [isPulling, setIsPulling] = useState(false);
  const [pullStatus, setPullStatus] = useState('');

  const availableModels = [
    { name: 'qwen2.5-coder:1.5b', description: 'Fast autocomplete (900MB)', recommended: true },
    { name: 'qwen2.5-coder:7b', description: 'Better chat responses (4GB)', recommended: true },
    { name: 'codellama:7b', description: 'Code Llama 7B (3.8GB)' },
    { name: 'deepseek-coder:6.7b', description: 'DeepSeek Coder (3.8GB)' },
    { name: 'starcoder2:7b', description: 'StarCoder2 7B (4GB)' },
  ];

  const handlePullModel = async (modelName: string) => {
    setIsPulling(true);
    setPullStatus(`Pulling ${modelName}...`);
    
    try {
      await invoke('pull_model', { modelName });
      setPullStatus(`Successfully pulled ${modelName}`);
      setTimeout(() => setPullStatus(''), 3000);
    } catch (error) {
      setPullStatus(`Error: ${error}`);
    } finally {
      setIsPulling(false);
    }
  };

  const handlePullCustomModel = async () => {
    if (!customModel.trim()) return;
    await handlePullModel(customModel.trim());
    setCustomModel('');
  };

  const handleStartOllama = async () => {
    try {
      await invoke('start_ollama');
      setPullStatus('Ollama started successfully');
      setTimeout(() => setPullStatus(''), 3000);
    } catch (error) {
      setPullStatus(`Error: ${error}`);
    }
  };

  const handleStopOllama = async () => {
    try {
      await invoke('stop_ollama');
      setPullStatus('Ollama stopped');
      setTimeout(() => setPullStatus(''), 3000);
    } catch (error) {
      setPullStatus(`Error: ${error}`);
    }
  };

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>Settings</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        <div className="settings-content">
          {/* Ollama Status */}
          <section className="settings-section">
            <h3>Ollama Status</h3>
            <div className="status-info-box">
              <div className="status-row">
                <span>Status:</span>
                <span className={ollamaStatus.running ? 'status-online' : 'status-offline'}>
                  {ollamaStatus.running ? '● Online' : '● Offline'}
                </span>
              </div>
              <div className="status-row">
                <span>Models Installed:</span>
                <span>{ollamaStatus.models.length}</span>
              </div>
            </div>
            <div className="button-group">
              <button onClick={handleStartOllama} disabled={ollamaStatus.running}>
                Start Ollama
              </button>
              <button onClick={handleStopOllama} disabled={!ollamaStatus.running}>
                Stop Ollama
              </button>
            </div>
          </section>

          {/* Installed Models */}
          <section className="settings-section">
            <h3>Installed Models</h3>
            <div className="models-list">
              {ollamaStatus.models.length === 0 ? (
                <p className="no-models">No models installed</p>
              ) : (
                ollamaStatus.models.map(model => (
                  <div key={model} className="model-item installed">
                    <span className="model-icon">✓</span>
                    <span className="model-name">{model}</span>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Available Models */}
          <section className="settings-section">
            <h3>Available Models</h3>
            <div className="models-list">
              {availableModels.map(model => {
                const isInstalled = ollamaStatus.models.includes(model.name);
                return (
                  <div key={model.name} className={`model-item ${isInstalled ? 'installed' : ''}`}>
                    <div className="model-info">
                      <div className="model-name-row">
                        <span className="model-name">{model.name}</span>
                        {model.recommended && <span className="recommended-badge">Recommended</span>}
                      </div>
                      <span className="model-description">{model.description}</span>
                    </div>
                    <button
                      onClick={() => handlePullModel(model.name)}
                      disabled={isPulling || isInstalled || !ollamaStatus.running}
                      className="pull-btn"
                    >
                      {isInstalled ? 'Installed' : 'Pull'}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Custom Model */}
          <section className="settings-section">
            <h3>Pull Custom Model</h3>
            <div className="custom-model-input">
              <input
                type="text"
                value={customModel}
                onChange={(e) => setCustomModel(e.target.value)}
                placeholder="e.g., llama2:7b"
                disabled={!ollamaStatus.running}
              />
              <button
                onClick={handlePullCustomModel}
                disabled={isPulling || !customModel.trim() || !ollamaStatus.running}
              >
                Pull
              </button>
            </div>
          </section>

          {/* Status Message */}
          {pullStatus && (
            <div className={`status-message ${pullStatus.includes('Error') ? 'error' : 'success'}`}>
              {pullStatus}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
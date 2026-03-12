import React from 'react';

interface WelcomeScreenProps {
  onOpenFile: () => void;
  onOpenFolder: () => void;
  onDismiss: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onOpenFile, onOpenFolder, onDismiss }) => {
  return (
    <div className="welcome-screen">
      <div className="welcome-content">
        <div className="welcome-header">
          <h1>🤖 AI Code Editor</h1>
          <p className="welcome-subtitle">Your intelligent coding companion</p>
        </div>

        <div className="welcome-features">
          <div className="feature-card">
            <div className="feature-icon">✨</div>
            <h3>AI Autocomplete</h3>
            <p>Get intelligent code suggestions as you type. Press Tab to accept.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">💬</div>
            <h3>AI Chat Assistant</h3>
            <p>Ask questions about code, debugging, or programming concepts.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>100% Local</h3>
            <p>All AI processing happens on your machine. No cloud, no tracking.</p>
          </div>
        </div>

        <div className="welcome-actions">
          <h2>Get Started</h2>
          <div className="action-buttons">
            <button className="action-btn primary" onClick={onOpenFile}>
              <span className="btn-icon">📄</span>
              <div className="btn-content">
                <div className="btn-title">Open File</div>
                <div className="btn-subtitle">Start editing a single file</div>
              </div>
            </button>

            <button className="action-btn primary" onClick={onOpenFolder}>
              <span className="btn-icon">📁</span>
              <div className="btn-content">
                <div className="btn-title">Open Folder</div>
                <div className="btn-subtitle">Browse and edit project files</div>
              </div>
            </button>
          </div>

          <button className="dismiss-btn" onClick={onDismiss}>
            Skip and start with empty file
          </button>
        </div>

        <div className="welcome-shortcuts">
          <h3>Keyboard Shortcuts</h3>
          <div className="shortcuts-grid">
            <div className="shortcut-item">
              <kbd>Ctrl+O</kbd>
              <span>Open File</span>
            </div>
            <div className="shortcut-item">
              <kbd>Ctrl+S</kbd>
              <span>Save File</span>
            </div>
            <div className="shortcut-item">
              <kbd>Ctrl+B</kbd>
              <span>Toggle Explorer</span>
            </div>
            <div className="shortcut-item">
              <kbd>Ctrl+`</kbd>
              <span>Toggle Terminal</span>
            </div>
            <div className="shortcut-item">
              <kbd>Tab</kbd>
              <span>Accept AI Suggestion</span>
            </div>
            <div className="shortcut-item">
              <kbd>Esc</kbd>
              <span>Dismiss Suggestion</span>
            </div>
          </div>
        </div>

        <div className="welcome-footer">
          <p>💡 Tip: Check the Settings panel to manage AI models</p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
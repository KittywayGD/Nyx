import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import './App.css';
import FeedbackPopup from './components/FeedbackPopup';

function App() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [modules, setModules] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  
  // Sidebar states
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarView, setSidebarView] = useState('dashboard'); // 'dashboard' or 'settings'
  
  // Settings
  const [theme, setTheme] = useState(localStorage.getItem('nyx-theme') || 'dark');
  const [autoLaunch, setAutoLaunch] = useState(localStorage.getItem('nyx-autolaunch') === 'true');
  const [notifications, setNotifications] = useState(localStorage.getItem('nyx-notifications') !== 'false');
  const [soundEffects, setSoundEffects] = useState(localStorage.getItem('nyx-sounds') !== 'false');
  
  // Stats
  const [stats, setStats] = useState({
    totalCommands: parseInt(localStorage.getItem('nyx-total-commands') || '0'),
    sessionCommands: 0,
    mostUsedModule: 'system',
    uptime: 0
  });
  
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const recognitionRef = useRef(null);
  const uptimeInterval = useRef(null);

  const suggestions = [
    "Open Spotify",
    "What's the weather?",
    "System status",
    "Check calendar",
    "Read messages",
    "Tell me a joke"
  ];

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('nyx-theme', theme);
  }, [theme]);

  // Track uptime
  useEffect(() => {
    const startTime = Date.now();
    uptimeInterval.current = setInterval(() => {
      setStats(prev => ({
        ...prev,
        uptime: Math.floor((Date.now() - startTime) / 1000)
      }));
    }, 1000);
    
    return () => clearInterval(uptimeInterval.current);
  }, []);

  useEffect(() => {
    // Connect to Nyx Core
    socketRef.current = io('http://localhost:3001');

    socketRef.current.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to Nyx Core');
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from Nyx Core');
    });

    socketRef.current.on('modules-list', (modulesList) => {
      setModules(modulesList);
    });

    socketRef.current.on('response', (response) => {
      setIsTyping(false);
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage && lastMessage.streaming && lastMessage.module === response.module) {
          return prev.slice(0, -1).concat([{
            role: 'assistant',
            content: response.text,
            type: response.type,
            module: response.module,
            timestamp: response.timestamp,
            streaming: false
          }]);
        }
        return [...prev, {
          role: 'assistant',
          content: response.text,
          type: response.type,
          module: response.module,
          timestamp: response.timestamp
        }];
      });
      
      // Update stats
      setStats(prev => {
        const newStats = {
          ...prev,
          mostUsedModule: response.module
        };
        return newStats;
      });
    });

    socketRef.current.on('ai-stream', (data) => {
      setIsTyping(false);
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage && lastMessage.module === 'ai' && lastMessage.streaming) {
          return prev.slice(0, -1).concat([{
            ...lastMessage,
            content: data.text,
            streaming: !data.done
          }]);
        }
        return [...prev, {
          role: 'assistant',
          content: data.text,
          type: 'ai',
          module: data.module,
          timestamp: Date.now(),
          streaming: !data.done
        }];
      });
    });

    socketRef.current.on('module-reloaded', (data) => {
      console.log('Module reloaded:', data.module);
      if (notifications) {
        showNotification('Module Reloaded', `${data.module} has been updated`);
      }
    });

    initSpeechRecognition();

    return () => {
      socketRef.current.disconnect();
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'fr-FR';

      recognitionRef.current.onresult = (event) => {
        const last = event.results.length - 1;
        const transcript = event.results[last][0].transcript.trim().toLowerCase();
        
        console.log('Heard:', transcript);
        
        const wakeWords = [
          'hey nyx', 'dis nyx', 'nyx',
          'hey nix', 'dis nix', 'nix',
          'hey nicks', 'dis nicks', 'nicks',
          'onyx', 'hey onyx', 'dis onyx',
          'nick', 'hey nick', 'dis nick',
          'nixe', 'nyxe', 'nix ça va',
          'ok nyx', 'ok nix'
        ];
        
        const hasWakeWord = wakeWords.some(word => 
          transcript.includes(word) || transcript.startsWith(word.replace('hey ', '').replace('dis ', ''))
        );
        
        if (hasWakeWord) {
          let command = transcript;
          wakeWords.forEach(word => {
            command = command.replace(new RegExp(word, 'g'), '');
          });
          command = command.trim();
          
          if (command) {
            handleVoiceCommand(command);
          }
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech' && voiceEnabled) {
          setTimeout(() => {
            try {
              recognitionRef.current.start();
            } catch (e) {}
          }, 100);
        }
      };

      recognitionRef.current.onend = () => {
        if (voiceEnabled) {
          try {
            recognitionRef.current.start();
          } catch (e) {}
        }
      };
    }
  };

  const toggleVoice = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition not supported in this browser');
      return;
    }

    if (voiceEnabled) {
      recognitionRef.current.stop();
      setVoiceEnabled(false);
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setVoiceEnabled(true);
        setIsListening(true);
      } catch (error) {
        console.error('Could not start recognition:', error);
      }
    }
  };

  const handleVoiceCommand = (command) => {
    console.log('Voice command:', command);
    sendCommand(command);
  };

  const sendCommand = (message) => {
    if (!message.trim() || !isConnected) return;

    const userMessage = {
      role: 'user',
      content: message,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    socketRef.current.emit('command', { message: message });
    setInputValue('');
    
    // Update stats
    setStats(prev => {
      const newTotal = prev.totalCommands + 1;
      localStorage.setItem('nyx-total-commands', newTotal.toString());
      return {
        ...prev,
        totalCommands: newTotal,
        sessionCommands: prev.sessionCommands + 1
      };
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = () => {
    sendCommand(inputValue);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestion = (suggestion) => {
    sendCommand(suggestion);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatUptime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  const getMessageIcon = (role) => {
    return role === 'user' ? '👤' : '🌙';
  };

  const getModuleEmoji = (module) => {
    const emojis = {
      system: '💻',
      notes: '📝',
      weather: '🌤️',
      time: '⏰',
      automation: '⚙️',
      calculator: '🔢',
      ai: '🤖',
      chat: '💬',
      music: '🎵',
      fun: '😄',
      web: '🌐',
      monitor: '📊',
      imessage: '💬',
      calendar: '📅',
      email: '📧',
      files: '📁',
      'math-advanced': '🧮'
    };
    return emojis[module] || '✨';
  };

  const showNotification = (title, body) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/nyx-icon.png' });
    }
  };

  const toggleSidebar = (view) => {
    if (sidebarOpen && sidebarView === view) {
      setSidebarOpen(false);
    } else {
      setSidebarView(view);
      setSidebarOpen(true);
    }
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    if (soundEffects) playSound('click');
  };

  const playSound = (type) => {
    // Placeholder for sound effects
    console.log(`Playing sound: ${type}`);
  };

  const themes = [
    { id: 'dark', name: 'Dark', colors: ['#0a0a0a', '#a78bfa', '#ec4899'] },
    { id: 'light', name: 'Light', colors: ['#ffffff', '#8b5cf6', '#ec4899'] },
    { id: 'cyberpunk', name: 'Cyberpunk', colors: ['#0d0221', '#00ffff', '#ff00ff'] },
    { id: 'minimal', name: 'Minimal', colors: ['#fafafa', '#2a2a2a', '#6a6a6a'] }
  ];

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-title">
          <span className="moon-icon">🌙</span>
          <h1>Nyx</h1>
        </div>
        <div className="header-controls">
          <button 
            className={`voice-button ${voiceEnabled ? 'active' : ''}`}
            onClick={toggleVoice}
            title={voiceEnabled ? 'Stop listening' : 'Start voice commands'}
          >
            {isListening ? '🎤' : '🎙️'}
          </button>
          {voiceEnabled && <span className="listening-text">Listening for "Hey Nyx"...</span>}
          
          <button 
            className={`header-btn ${sidebarOpen && sidebarView === 'dashboard' ? 'active' : ''}`}
            onClick={() => toggleSidebar('dashboard')}
            title="Dashboard"
          >
            📊
          </button>
          
          <button 
            className={`header-btn ${sidebarOpen && sidebarView === 'settings' ? 'active' : ''}`}
            onClick={() => toggleSidebar('settings')}
            title="Settings"
          >
            ⚙️
          </button>
          
          <div className="status">
            <div className={`status-dot ${isConnected ? '' : 'offline'}`} />
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
      </header>

      {modules.length > 0 && (
        <div className="modules-indicator">
          <span className="module-count">{modules.length}</span>
          modules loaded
        </div>
      )}

      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-title">
            {sidebarView === 'dashboard' ? '📊 Dashboard' : '⚙️ Settings'}
          </h2>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>
            ✕
          </button>
        </div>
        
        <div className="sidebar-content">
          {sidebarView === 'dashboard' ? (
            <>
              {/* Stats */}
              <div className="settings-section">
                <h3 className="settings-section-title">Statistics</h3>
                <div className="dashboard-stats">
                  <div className="stat-card">
                    <div className="stat-value">{stats.totalCommands}</div>
                    <div className="stat-label">Total Commands</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{stats.sessionCommands}</div>
                    <div className="stat-label">This Session</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{modules.length}</div>
                    <div className="stat-label">Active Modules</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{formatUptime(stats.uptime)}</div>
                    <div className="stat-label">Uptime</div>
                  </div>
                </div>
              </div>

              {/* Most Used Module */}
              <div className="settings-section">
                <h3 className="settings-section-title">Most Used Module</h3>
                <div className="setting-item">
                  <div className="setting-info">
                    <div className="setting-label">
                      {getModuleEmoji(stats.mostUsedModule)} {stats.mostUsedModule}
                    </div>
                    <div className="setting-description">Currently most active</div>
                  </div>
                </div>
              </div>

              {/* Modules List */}
              <div className="settings-section">
                <h3 className="settings-section-title">Loaded Modules ({modules.length})</h3>
                <div className="module-list">
                  {modules.map((module) => (
                    <div key={module} className="module-item">
                      <div className="module-info-item">
                        <span className="module-emoji">{getModuleEmoji(module)}</span>
                        <span className="module-name">{module}</span>
                      </div>
                      <div className="module-status" />
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Theme Settings */}
              <div className="settings-section">
                <h3 className="settings-section-title">Appearance</h3>
                <div className="theme-selector">
                  {themes.map((t) => (
                    <div
                      key={t.id}
                      className={`theme-option ${theme === t.id ? 'active' : ''}`}
                      onClick={() => handleThemeChange(t.id)}
                    >
                      <div className="theme-preview">
                        {t.colors.map((color, i) => (
                          <div
                            key={i}
                            className="theme-preview-color"
                            style={{ background: color }}
                          />
                        ))}
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: '500' }}>{t.name}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* General Settings */}
              <div className="settings-section">
                <h3 className="settings-section-title">General</h3>
                
                <div className="setting-item">
                  <div className="setting-info">
                    <div className="setting-label">Launch at Login</div>
                    <div className="setting-description">Start Nyx automatically</div>
                  </div>
                  <div 
                    className={`toggle-switch ${autoLaunch ? 'active' : ''}`}
                    onClick={() => {
                      const newValue = !autoLaunch;
                      setAutoLaunch(newValue);
                      localStorage.setItem('nyx-autolaunch', newValue.toString());
                    }}
                  >
                    <div className="toggle-slider" />
                  </div>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <div className="setting-label">Notifications</div>
                    <div className="setting-description">Show system notifications</div>
                  </div>
                  <div 
                    className={`toggle-switch ${notifications ? 'active' : ''}`}
                    onClick={() => {
                      const newValue = !notifications;
                      setNotifications(newValue);
                      localStorage.setItem('nyx-notifications', newValue.toString());
                      
                      if (newValue && Notification.permission === 'default') {
                        Notification.requestPermission();
                      }
                    }}
                  >
                    <div className="toggle-slider" />
                  </div>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <div className="setting-label">Sound Effects</div>
                    <div className="setting-description">Play UI sounds</div>
                  </div>
                  <div 
                    className={`toggle-switch ${soundEffects ? 'active' : ''}`}
                    onClick={() => {
                      const newValue = !soundEffects;
                      setSoundEffects(newValue);
                      localStorage.setItem('nyx-sounds', newValue.toString());
                    }}
                  >
                    <div className="toggle-slider" />
                  </div>
                </div>
              </div>

              {/* About */}
              <div className="settings-section">
                <h3 className="settings-section-title">About</h3>
                <div className="setting-item">
                  <div className="setting-info">
                    <div className="setting-label">Nyx v2.0.0</div>
                    <div className="setting-description">Your intelligent AI assistant</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className={`chat-container ${sidebarOpen ? 'sidebar-open' : ''}`}>
        {messages.length === 0 ? (
          <div className="welcome">
            <div className="welcome-icon">🌙</div>
            <h2>Welcome to Nyx</h2>
            <p>
              Your intelligent AI assistant for macOS. Control your system,
              manage notes, check weather, and more. Click the microphone to enable voice commands!
            </p>
          </div>
        ) : (
          <div className="messages">
            {messages.map((message, index) => (
              <div key={index} className={`message ${message.role} ${message.type || ''}`}>
                <div className="message-avatar">
                  {getMessageIcon(message.role)}
                </div>
                <div className="message-content">
                  <div className="message-text">
                    {message.content}
                    {message.streaming && <span className="streaming-cursor">▊</span>}
                  </div>
                  <div className="message-meta">
                    {message.module && (
                      <span className="message-module">
                        {getModuleEmoji(message.module)} {message.module}
                      </span>
                    )}
                    <span className="message-time">{formatTime(message.timestamp)}</span>
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="message assistant">
                <div className="message-avatar">🌙</div>
                <div className="message-content">
                  <div className="typing-indicator">
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {messages.length === 0 && (
          <div className="suggestions">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="suggestion-chip"
                onClick={() => handleSuggestion(suggestion)}
              >
                {suggestion}
              </div>
            ))}
          </div>
        )}

        <div className="input-container">
          <input
            type="text"
            className="message-input"
            placeholder={voiceEnabled ? "Say 'Hey Nyx' or type..." : "Ask Nyx anything..."}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={!isConnected}
          />
          <button
            className="send-button"
            onClick={handleSend}
            disabled={!inputValue.trim() || !isConnected}
          >
            ➤
          </button>
        </div>
      </div>
      
      {/* 🆕 Feedback Popup for Q-Learning */}
      <FeedbackPopup socket={socketRef.current} />
    </div>
  );
}

export default App;

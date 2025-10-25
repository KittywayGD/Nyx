import React, { useState, useEffect } from 'react';
import './FeedbackPopup.css';

/**
 * FEEDBACK POPUP COMPONENT
 * 
 * Shows interactive popups when Nyx needs user confirmation
 * Handles 3 types:
 * 1. Intent confirmation (confidence < 70%)
 * 2. Ollama suggestions (unknown intent)
 * 3. Post-execution feedback (confidence 70-80%)
 */

const FeedbackPopup = ({ socket }) => {
  const [feedbackRequest, setFeedbackRequest] = useState(null);
  const [ollamaLoading, setOllamaLoading] = useState(false);

  useEffect(() => {
    if (!socket) return;

    // Listen for feedback requests
    socket.on('request-feedback', (data) => {
      console.log('📥 Feedback request received:', data);
      setFeedbackRequest(data);
      setOllamaLoading(false);
    });

    // Listen for Ollama analysis states
    socket.on('ollama-analysis-start', () => {
      setOllamaLoading(true);
    });

    socket.on('ollama-analysis-unknown', (data) => {
      setOllamaLoading(false);
      setFeedbackRequest({
        type: 'ollama-unknown',
        message: data.message,
        suggestion: data.suggestion
      });
    });

    socket.on('ollama-analysis-error', () => {
      setOllamaLoading(false);
    });

    // Listen for feedback confirmation
    socket.on('feedback-received', (data) => {
      console.log('✅ Feedback confirmed:', data);
      setFeedbackRequest(null);
      
      // Show brief success message
      if (data.message) {
        setTimeout(() => {
          // Could show a toast notification here
        }, 100);
      }
    });

    return () => {
      socket.off('request-feedback');
      socket.off('ollama-analysis-start');
      socket.off('ollama-analysis-unknown');
      socket.off('ollama-analysis-error');
      socket.off('feedback-received');
    };
  }, [socket]);

  const handleConfirm = () => {
    if (!feedbackRequest) return;
    
    socket.emit('feedback-response', {
      feedbackId: feedbackRequest.id,
      action: 'confirm'
    });
    
    setFeedbackRequest(null);
  };

  const handleReject = () => {
    if (!feedbackRequest) return;
    
    socket.emit('feedback-response', {
      feedbackId: feedbackRequest.id,
      action: 'reject'
    });
    
    setFeedbackRequest(null);
  };

  const handleCorrect = (correctIntent) => {
    if (!feedbackRequest) return;
    
    socket.emit('feedback-response', {
      feedbackId: feedbackRequest.id,
      action: 'correct',
      correctIntent: correctIntent
    });
    
    setFeedbackRequest(null);
  };

  if (ollamaLoading) {
    return (
      <div className="feedback-popup">
        <div className="feedback-content loading">
          <div className="spinner"></div>
          <p>🤔 Je réfléchis avec Ollama...</p>
        </div>
      </div>
    );
  }

  if (!feedbackRequest) return null;

  // Intent confirmation popup
  if (feedbackRequest.type === 'intent-confirmation') {
    return (
      <div className="feedback-popup">
        <div className="feedback-content">
          <div className="feedback-header">
            <span className="icon">❓</span>
            <h3>Confirmation</h3>
          </div>
          
          <div className="feedback-body">
            <p className="message">Tu as dit:</p>
            <p className="user-message">"{feedbackRequest.message}"</p>
            
            <p className="suggestion-label">Je pense que tu veux:</p>
            <div className="suggestion">
              <strong>{feedbackRequest.suggestion.description}</strong>
              <span className="confidence">{feedbackRequest.suggestion.confidence}% sûr</span>
            </div>
          </div>
          
          <div className="feedback-actions">
            <button className="btn-confirm" onClick={handleConfirm}>
              ✅ Oui, c'est ça
            </button>
            <button className="btn-reject" onClick={handleReject}>
              ❌ Non
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Ollama suggestion popup
  if (feedbackRequest.type === 'ollama-suggestion') {
    return (
      <div className="feedback-popup">
        <div className="feedback-content ollama">
          <div className="feedback-header">
            <span className="icon">🤖</span>
            <h3>Suggestion IA</h3>
          </div>
          
          <div className="feedback-body">
            <p className="message">Tu as dit:</p>
            <p className="user-message">"{feedbackRequest.message}"</p>
            
            <p className="suggestion-label">Ollama suggère:</p>
            <div className="suggestion ollama-suggestion">
              <strong>{feedbackRequest.suggestion.description}</strong>
              <span className="confidence">{feedbackRequest.suggestion.confidence}% sûr</span>
              {feedbackRequest.suggestion.reasoning && (
                <p className="reasoning">💭 {feedbackRequest.suggestion.reasoning}</p>
              )}
            </div>
            
            {feedbackRequest.suggestion.alternatives && feedbackRequest.suggestion.alternatives.length > 0 && (
              <div className="alternatives">
                <p>Ou peut-être:</p>
                {feedbackRequest.suggestion.alternatives.map((alt, i) => (
                  <button 
                    key={i} 
                    className="btn-alternative"
                    onClick={() => handleCorrect(alt)}
                  >
                    {alt}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="feedback-actions">
            <button className="btn-confirm" onClick={handleConfirm}>
              ✅ Oui
            </button>
            <button className="btn-reject" onClick={handleReject}>
              ❌ Non
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Unknown fallback
  if (feedbackRequest.type === 'ollama-unknown') {
    return (
      <div className="feedback-popup">
        <div className="feedback-content unknown">
          <div className="feedback-header">
            <span className="icon">🤷</span>
            <h3>Je ne comprends pas</h3>
          </div>
          
          <div className="feedback-body">
            <p className="user-message">"{feedbackRequest.message}"</p>
            <p className="suggestion">{feedbackRequest.suggestion}</p>
          </div>
          
          <div className="feedback-actions">
            <button className="btn-close" onClick={() => setFeedbackRequest(null)}>
              OK
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default FeedbackPopup;

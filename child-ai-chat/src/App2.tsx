import React, { useEffect, useState, useCallback, useRef } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { useSpeechSynthesis, useTimer, formatTime } from './hooks/useSpeech';
import { generateAIResponse, getConversationStarter, getConversationCloser, getFollowUpQuestion } from './services/aiService';
import './App.css';

interface MessageType {
  speaker: 'user' | 'ai';
  text: string;
  timestamp: number;
}

const CONVERSATION_DURATION = 60; // 1 minute in seconds
const AVAILABLE_ANIMALS = ['elephant.jpg', 'lion.jpg', 'monkey.jpg', 'giraffe.jpg'];

const App: React.FC = () => {
  const [currentImage, setCurrentImage] = useState('elephant.jpg');
  const [conversationHistory, setConversationHistory] = useState<MessageType[]>([]);
  const [isConversationActive, setIsConversationActive] = useState(false);
  const [conversationComplete, setConversationComplete] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [turnCount, setTurnCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Speech hooks
  const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } =
    useSpeechRecognition();
  const { speak, stop: stopSpeech, isSpeaking } = useSpeechSynthesis();
  const { start: startTimer, stop: stopTimer, getElapsed, getRemaining } = useTimer(
    CONVERSATION_DURATION,
    handleTimeUp
  );

  const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTranscriptRef = useRef('');
  const speechSupportedRef = useRef(browserSupportsSpeechRecognition);

  // Initialize speech recognition
  useEffect(() => {
    speechSupportedRef.current = browserSupportsSpeechRecognition;
  }, [browserSupportsSpeechRecognition]);

  // Start conversation on mount
  useEffect(() => {
    if (!speechSupportedRef.current) {
      setErrorMessage('Speech recognition not supported. Please use Chrome, Edge, or Safari.');
      return;
    }

    startInitialConversation();

    return () => {
      if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
      SpeechRecognition.stopListening();
      stopSpeech();
      stopTimer();
    };
  }, []);

  // Handle speech recognition transcript updates
  useEffect(() => {
    if (!transcript || transcript === lastTranscriptRef.current || isProcessing) return;

    lastTranscriptRef.current = transcript;

    // Clear existing timeout
    if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);

    // Wait for user to stop speaking
    speechTimeoutRef.current = setTimeout(() => {
      if (!isConversationActive || isSpeaking()) return;

      processUserSpeech(transcript);
      resetTranscript();
    }, 800);

    return () => {
      if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
    };
  }, [transcript, isConversationActive, isSpeaking, isProcessing, resetTranscript]);

  function startInitialConversation() {
    setIsConversationActive(true);
    setConversationComplete(false);
    setConversationHistory([]);
    setTurnCount(0);
    setErrorMessage('');
    resetTranscript();

    const starter = getConversationStarter(currentImage);
    const message: MessageType = {
      speaker: 'ai',
      text: starter,
      timestamp: Date.now()
    };

    setConversationHistory([message]);
    speak(starter, () => {}, () => {
      SpeechRecognition.startListening({ continuous: true, language: 'en-US' });
      startTimer();
    });
  }

  function handleTimeUp() {
    SpeechRecognition.stopListening();
    stopSpeech();
    setIsConversationActive(false);
    setConversationComplete(true);

    const closer = getConversationCloser();
    const message: MessageType = {
      speaker: 'ai',
      text: closer,
      timestamp: Date.now()
    };

    setConversationHistory(prev => [...prev, message]);
    speak(closer);
  }

  function processUserSpeech(userText: string) {
    if (!userText.trim() || isProcessing) return;

    setIsProcessing(true);

    // Add user message to history
    const userMessage: MessageType = {
      speaker: 'user',
      text: userText,
      timestamp: Date.now()
    };

    setConversationHistory(prev => [...prev, userMessage]);

    // Generate AI response
    const result = generateAIResponse(userText, conversationHistory.map(m => m.text), currentImage, turnCount + 1);

    // TOOL CALL: Update image if AI suggests it
    if (result.imageToUse && result.imageToUse !== currentImage) {
      setCurrentImage(result.imageToUse);
    }

    // Add AI response to history
    const aiMessage: MessageType = {
      speaker: 'ai',
      text: result.aiResponse,
      timestamp: Date.now()
    };

    setConversationHistory(prev => [...prev, aiMessage]);
    setTurnCount(prev => prev + 1);

    // Speak the response
    speak(result.aiResponse, () => {}, () => {
      setIsProcessing(false);
      // Resume listening
      if (getRemaining() > 0) {
        resetTranscript();
        SpeechRecognition.startListening({ continuous: true, language: 'en-US' });
      }
    });
  }

  const handleStartConversation = () => {
    setConversationHistory([]);
    setConversationComplete(false);
    startInitialConversation();
  };

  const handleStopConversation = () => {
    SpeechRecognition.stopListening();
    stopSpeech();
    setIsConversationActive(false);
    stopTimer();
  };

  const handleSkipToEnd = () => {
    SpeechRecognition.stopListening();
    stopSpeech();
    stopTimer();
    handleTimeUp();
  };

  if (!speechSupportedRef.current) {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>AI Animal Friend 🐘</h1>
        <p style={styles.error}>
          ❌ Speech recognition is not supported in your browser.<br />
          Please use Chrome, Edge, Safari, or Firefox to run this application.
        </p>
      </div>
    );
  }

  const remaining = getRemaining();
  const imageName = currentImage.replace('.jpg', '').charAt(0).toUpperCase() + currentImage.replace('.jpg', '').slice(1);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>🎉 AI Animal Friend Chat 🎉</h1>
        <p style={styles.subtitle}>Have a fun 1-minute conversation with AI about animals!</p>
      </div>

      {/* Timer */}
      {isConversationActive && (
        <div style={styles.timerContainer}>
          <div style={styles.timer}>
            ⏱️ Time Remaining: <span style={styles.timerText}>{formatTime(remaining)}</span>
          </div>
          <div style={styles.progressBar}>
            <div
              style={{
                ...styles.progressFill,
                width: `${((CONVERSATION_DURATION - remaining) / CONVERSATION_DURATION) * 100}%`
              }}
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div style={styles.errorBox}>
          <p>⚠️ {errorMessage}</p>
        </div>
      )}

      {/* Image Display */}
      <div style={styles.imageContainer}>
        <img
          src={`/images/${currentImage}`}
          alt={imageName}
          style={styles.image}
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/images/elephant.jpg';
            setErrorMessage('Image not found, using default');
          }}
        />
        <p style={styles.animalName}>{imageName}</p>
      </div>

      {/* Conversation History */}
      <div style={styles.chatBox}>
        <h3 style={styles.chatTitle}>💬 Our Conversation</h3>
        <div style={styles.messagesContainer}>
          {conversationHistory.length === 0 ? (
            <p style={styles.emptyChat}>Click "Start Conversation" to begin!</p>
          ) : (
            conversationHistory.map((msg, idx) => (
              <div key={idx} style={{
                ...styles.message,
                ...(msg.speaker === 'ai' ? styles.aiMessage : styles.userMessage)
              }}>
                <span style={styles.speaker}>
                  {msg.speaker === 'ai' ? '🤖 AI' : '👧 You'}:
                </span>
                <span style={styles.messageText}>{msg.text}</span>
              </div>
            ))
          )}

          {/* Status Indicators */}
          {isConversationActive && listening && (
            <p style={styles.listeningStatus}>🎤 Listening... Please speak!</p>
          )}
          {isProcessing && (
            <p style={styles.processingStatus}>⏳ Processing your message...</p>
          )}
          {isSpeaking() && (
            <p style={styles.speakingStatus}>🗣️ AI is speaking...</p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={styles.buttonContainer}>
        {!isConversationActive && !conversationComplete && (
          <button onClick={handleStartConversation} style={styles.buttonStart}>
            ▶️ Start Conversation
          </button>
        )}

        {isConversationActive && (
          <>
            <button onClick={handleStopConversation} style={styles.buttonStop}>
              ⏹️ Stop
            </button>
            <button onClick={handleSkipToEnd} style={styles.buttonSkip}>
              ⏭️ Skip to End
            </button>
          </>
        )}

        {conversationComplete && (
          <>
            <button onClick={handleStartConversation} style={styles.buttonStart}>
              🔄 Start Again
            </button>
            <button
              onClick={() => {
                const randomImage = AVAILABLE_ANIMALS[Math.floor(Math.random() * AVAILABLE_ANIMALS.length)];
                setCurrentImage(randomImage);
              }}
              style={styles.buttonSwitch}
            >
              🎪 Random Animal
            </button>
          </>
        )}
      </div>

      {/* Footer Info */}
      <div style={styles.footer}>
        <p style={styles.infoText}>
          💡 <strong>Tip:</strong> Try saying "lion", "monkey", or "giraffe" to see different animals!
        </p>
        <p style={styles.infoText}>
          🎯 Speak naturally and the AI will respond to you. Have fun! 🎊
        </p>
      </div>
    </div>
  );
};

// Styling
const styles = {
  container: {
    padding: '20px',
    maxWidth: '800px',
    margin: '0 auto',
    fontFamily: 'Segoe UI, Arial, sans-serif',
    backgroundColor: '#f5f5f5',
    minHeight: '100vh',
    borderRadius: '10px'
  } as React.CSSProperties,

  header: {
    textAlign: 'center',
    marginBottom: '20px',
    backgroundColor: '#ffffff',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  } as React.CSSProperties,

  title: {
    fontSize: '32px',
    color: '#ff6b6b',
    margin: '0 0 10px 0'
  } as React.CSSProperties,

  subtitle: {
    fontSize: '14px',
    color: '#666',
    margin: '0'
  } as React.CSSProperties,

  timerContainer: {
    marginBottom: '20px',
    backgroundColor: '#fff3cd',
    padding: '15px',
    borderRadius: '8px',
    textAlign: 'center'
  } as React.CSSProperties,

  timer: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: '10px'
  } as React.CSSProperties,

  timerText: {
    fontSize: '24px',
    color: '#d32f2f'
  } as React.CSSProperties,

  progressBar: {
    width: '100%',
    height: '8px',
    backgroundColor: '#e0e0e0',
    borderRadius: '4px',
    overflow: 'hidden'
  } as React.CSSProperties,

  progressFill: {
    height: '100%',
    backgroundColor: '#4caf50',
    transition: 'width 0.3s ease'
  } as React.CSSProperties,

  errorBox: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '15px',
    textAlign: 'center'
  } as React.CSSProperties,

  error: {
    color: '#d32f2f',
    textAlign: 'center',
    fontSize: '16px'
  } as React.CSSProperties,

  imageContainer: {
    textAlign: 'center',
    marginBottom: '20px',
    backgroundColor: '#ffffff',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  } as React.CSSProperties,

  image: {
    width: '100%',
    maxWidth: '500px',
    height: 'auto',
    borderRadius: '15px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    marginBottom: '10px'
  } as React.CSSProperties,

  animalName: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#4a90e2',
    margin: '0'
  } as React.CSSProperties,

  chatBox: {
    backgroundColor: '#ffffff',
    padding: '15px',
    borderRadius: '10px',
    marginBottom: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    minHeight: '200px'
  } as React.CSSProperties,

  chatTitle: {
    marginTop: '0',
    marginBottom: '15px',
    color: '#333',
    fontSize: '16px'
  } as React.CSSProperties,

  messagesContainer: {
    maxHeight: '300px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px'
  } as React.CSSProperties,

  message: {
    padding: '10px',
    borderRadius: '8px',
    fontSize: '14px',
    lineHeight: '1.4'
  } as React.CSSProperties,

  aiMessage: {
    backgroundColor: '#e3f2fd',
    borderLeft: '4px solid #4a90e2',
    marginRight: '30px'
  } as React.CSSProperties,

  userMessage: {
    backgroundColor: '#e8f5e9',
    borderLeft: '4px solid #50c878',
    marginLeft: '30px'
  } as React.CSSProperties,

  speaker: {
    fontWeight: 'bold',
    marginRight: '8px'
  } as React.CSSProperties,

  messageText: {
    color: '#333'
  } as React.CSSProperties,

  emptyChat: {
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    margin: '40px 0'
  } as React.CSSProperties,

  listeningStatus: {
    color: '#ff9800',
    fontWeight: 'bold',
    textAlign: 'center',
    margin: '10px 0'
  } as React.CSSProperties,

  processingStatus: {
    color: '#2196f3',
    fontStyle: 'italic',
    textAlign: 'center',
    margin: '10px 0'
  } as React.CSSProperties,

  speakingStatus: {
    color: '#9c27b0',
    fontWeight: 'bold',
    textAlign: 'center',
    margin: '10px 0'
  } as React.CSSProperties,

  buttonContainer: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
    flexWrap: 'wrap' as const,
    marginBottom: '20px'
  } as React.CSSProperties,

  buttonStart: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: 'bold',
    backgroundColor: '#4caf50',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
  } as React.CSSProperties,

  buttonStop: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: 'bold',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
  } as React.CSSProperties,

  buttonSkip: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: 'bold',
    backgroundColor: '#ff9800',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
  } as React.CSSProperties,

  buttonSwitch: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: 'bold',
    backgroundColor: '#2196f3',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
  } as React.CSSProperties,

  footer: {
    backgroundColor: '#f0f0f0',
    padding: '15px',
    borderRadius: '10px',
    textAlign: 'center'
  } as React.CSSProperties,

  infoText: {
    fontSize: '13px',
    color: '#666',
    margin: '8px 0'
  } as React.CSSProperties
};

export default App;

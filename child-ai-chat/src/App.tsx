import React, { useEffect, useState, useCallback, useRef } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

const App: React.FC = () => {
  const [currentImage, setCurrentImage] = useState('elephant.jpg');
  const [conversationHistory, setConversationHistory] = useState<string[]>([]);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [promptIndex, setPromptIndex] = useState(0);
  const initializedRef = useRef(false);

  const aiPrompts = [
    "Hi little friend! Look at this big elephant. He has long tusks and huge ears! What's your favorite animal?",
    "Elephants are gentle giants. They love water and splash it with their trunks. Can you make an elephant sound?",
    "Great sound! Elephants live in groups called herds. What do you think they like to eat?",
    "Yes, they love plants, grass and leaves. If you could meet this elephant, what would you name him?",
    "That’s a lovely name! Animals are amazing. Say 'lion' if you want to see a lion picture!"
  ];

  const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } =
    useSpeechRecognition();

  // DO NOT early-return before hooks; handle support in render instead
  const [speechSupported] = useState(browserSupportsSpeechRecognition);

  const speak = useCallback(
    (text: string) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = 1.2;
      utterance.volume = 0.9;

      utterance.onstart = () => setIsAiSpeaking(true);
      utterance.onend = () => setIsAiSpeaking(false);

      window.speechSynthesis.speak(utterance);
    },
    []
  );

  const handleUserSpeech = useCallback(() => {
    const cleaned = transcript.trim();
    if (!cleaned) return;

    setConversationHistory(prev => [...prev, `You: ${cleaned}`]);
    resetTranscript();

    let aiResponse =
      "That's very interesting! Tell me something else about animals.";

    const lower = cleaned.toLowerCase();

    if (lower.includes('lion')) {
      // TOOL CALL: change UI image
      setCurrentImage('lion.jpg');
      aiResponse =
        "Wow, look! Now we have a lion. He is called the king of the jungle. What sound does a lion make?";
    } else if (lower.includes('yes')) {
      aiResponse =
        "Awesome! Let's keep talking. What other animal do you like?";
    }

    setConversationHistory(prev => [...prev, `AI: ${aiResponse}`]);
    setTimeout(() => speak(aiResponse), 400);
  }, [transcript, resetTranscript, speak]);

  useEffect(() => {
    // Initialize only once on first mount
    if (initializedRef.current) return;
    initializedRef.current = true;

    SpeechRecognition.startListening({ continuous: true, language: 'en-US' });

    const firstPrompt = aiPrompts[0];
    setConversationHistory([`AI: ${firstPrompt}`]);
    speak(firstPrompt);
    setPromptIndex(1);

    return () => {
      SpeechRecognition.stopListening();
      window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    // Whenever transcript changes and user stopped speaking for a bit
    if (!transcript) return;

    const debounce = setTimeout(() => {
      if (!isAiSpeaking) {
        handleUserSpeech();
      }
    }, 1200);

    return () => clearTimeout(debounce);
  }, [transcript, handleUserSpeech, isAiSpeaking]);

  const handleNextAiPrompt = () => {
    if (promptIndex >= aiPrompts.length) return;
    const next = aiPrompts[promptIndex];
    setConversationHistory(prev => [...prev, `AI: ${next}`]);
    speak(next);
    setPromptIndex(prev => prev + 1);
  };

  return (
    <div style={{ padding: 20, maxWidth: 700, margin: '0 auto', fontFamily: 'Arial' }}>
      <h1 style={{ textAlign: 'center', color: '#ff6b6b' }}>
        AI Animal Friend 🐘
      </h1>

      {!speechSupported && (
        <p style={{ color: 'red', textAlign: 'center' }}>
          Your browser does not support speech recognition. Please open in Chrome.
        </p>
      )}

      <img
        src={`/images/${currentImage}`}
        alt="Animal"
        style={{
          width: '100%',
          maxWidth: 500,
          height: 'auto',
          borderRadius: 20,
          display: 'block',
          margin: '0 auto 20px'
        }}
      />

      <div
        style={{
          background: '#f0f8ff',
          padding: 15,
          borderRadius: 10,
          minHeight: 120,
          marginBottom: 10
        }}
      >
        {conversationHistory.slice(-6).map((m, idx) => (
          <p
            key={idx}
            style={{
              margin: '4px 0',
              color: m.startsWith('AI') ? '#4a90e2' : '#50c878',
              fontWeight: 'bold'
            }}
          >
            {m}
          </p>
        ))}
        {listening && (
          <p style={{ color: 'orange', marginTop: 8 }}>🎤 I am listening...</p>
        )}
        {isAiSpeaking && (
          <p style={{ color: '#ff9500', marginTop: 4 }}>🗣️ AI is talking...</p>
        )}
      </div>

      <div style={{ textAlign: 'center', marginTop: 10 }}>
        <button
          onClick={() => SpeechRecognition.startListening({ continuous: true })}
          style={{
            padding: '8px 16px',
            marginRight: 8,
            borderRadius: 20,
            border: 'none',
            background: '#50c878',
            color: 'white'
          }}
        >
          Start Listening
        </button>
        <button
          onClick={() => SpeechRecognition.stopListening()}
          style={{
            padding: '8px 16px',
            marginRight: 8,
            borderRadius: 20,
            border: 'none',
            background: '#ff6b6b',
            color: 'white'
          }}
        >
          Stop Listening
        </button>
        <button
          onClick={handleNextAiPrompt}
          style={{
            padding: '8px 16px',
            borderRadius: 20,
            border: 'none',
            background: '#4a90e2',
            color: 'white'
          }}
        >
          Next Question
        </button>
      </div>

      <p style={{ fontSize: 12, color: '#666', marginTop: 16, textAlign: 'center' }}>
        Talk about the elephant! Say "lion" to change the picture. This runs for about a minute of fun chat.
      </p>
    </div>
  );
};

export default App;

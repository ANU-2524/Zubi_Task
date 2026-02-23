import React, { useEffect, useState, useCallback, useRef } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import './App.css';

/* ── types ── */
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}
type Theme = 'light' | 'dark';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';
const SESSION_SECONDS = 60;

/* ── component ── */
const App: React.FC = () => {
  /* state */
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem('zubi-theme') as Theme) || 'light',
  );
  const [started, setStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(SESSION_SECONDS);
  const [sessionDone, setSessionDone] = useState(false);

  /* UI effects driven by tool calls */
  const [imageHighlight, setImageHighlight] = useState(false);
  const [bgMood, setBgMood] = useState<string | null>(null);
  const [starBurst, setStarBurst] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  /* refs */
  const messagesRef = useRef<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const processingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { transcript, resetTranscript, browserSupportsSpeechRecognition } =
    useSpeechRecognition();

  /* keep ref in sync */
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  /* theme */
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('zubi-theme', theme);
  }, [theme]);

  /* auto-scroll */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ── speech helpers ── */
  const speak = useCallback((text: string) => {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = 0.92;
    u.pitch = 1.1;
    u.onstart = () => setIsSpeaking(true);
    u.onend = () => setIsSpeaking(false);
    u.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(u);
  }, []);

  /* ── handle tool call actions from backend ── */
  const handleToolAction = useCallback(
    (action: string, payload?: any) => {
      switch (action) {
        case 'highlight':
          setImageHighlight(true);
          setTimeout(() => setImageHighlight(false), 2000);
          break;
        case 'stars':
          setStarBurst(true);
          setTimeout(() => setStarBurst(false), 2200);
          break;
        case 'confetti':
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);
          break;
        case 'background':
          if (payload?.color) {
            setBgMood(payload.color);
            setTimeout(() => setBgMood(null), 4000);
          }
          break;
        default:
          break;
      }
    },
    [],
  );

  /* ── send message (SSE stream) ── */
  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || processingRef.current || sessionDone) return;
      processingRef.current = true;
      window.speechSynthesis.cancel();
      setIsSpeaking(false);

      const userMsg: Message = {
        id: `u-${Date.now()}`,
        role: 'user',
        content: trimmed,
      };

      const history = [...messagesRef.current, userMsg];
      setMessages(history);
      setIsStreaming(true);

      const aId = `a-${Date.now()}`;
      let full = '';

      try {
        const res = await fetch(`${API_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: history.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        setMessages((prev) => [
          ...prev,
          { id: aId, role: 'assistant', content: '' },
        ]);

        const reader = res.body?.getReader();
        const decoder = new TextDecoder();

        if (reader) {
          let buf = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += decoder.decode(value, { stream: true });
            const lines = buf.split('\n');
            buf = lines.pop() || '';

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              try {
                const d = JSON.parse(line.slice(6));
                if (d.type === 'text' && d.delta) {
                  full += d.delta;
                  const snap = full;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === aId ? { ...m, content: snap } : m,
                    ),
                  );
                }
                if (d.type === 'tool') {
                  handleToolAction(d.action, d.payload);
                }
              } catch {
                /* skip */
              }
            }
          }
        }

        if (full) speak(full);
      } catch (err) {
        console.error('Chat error:', err);
        const fallback =
          'Oops! I had a little hiccup. Can you try talking to me again?';
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === aId);
          if (exists)
            return prev.map((m) =>
              m.id === aId ? { ...m, content: fallback } : m,
            );
          return [...prev, { id: aId, role: 'assistant', content: fallback }];
        });
      } finally {
        setIsStreaming(false);
        processingRef.current = false;
      }
    },
    [speak, sessionDone, handleToolAction],
  );

  /* ── 1-minute timer ── */
  useEffect(() => {
    if (!started || sessionDone) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setSessionDone(true);
          SpeechRecognition.stopListening();
          setIsListening(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [started, sessionDone]);

  /* ── session end ── */
  useEffect(() => {
    if (!sessionDone) return;
    const bye =
      "That was so much fun! You're an amazing animal explorer! See you next time! \uD83C\uDF1F";
    const id = `a-end-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id, role: 'assistant', content: bye },
    ]);
    speak(bye);
    handleToolAction('confetti');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionDone]);

  /* ── AI initiates conversation ── */
  const startSession = useCallback(() => {
    setStarted(true);
    setTimeLeft(SESSION_SECONDS);
    setSessionDone(false);
    setMessages([]);
    processingRef.current = false;

    const initMsg: Message = { id: 'init', role: 'assistant', content: '' };
    setMessages([initMsg]);
    setIsStreaming(true);

    (async () => {
      let full = '';
      try {
        const res = await fetch(`${API_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [
              {
                role: 'user',
                content:
                  'The child just arrived and can see the elephant image on the screen. Greet them and start the conversation about the image.',
              },
            ],
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        if (reader) {
          let buf = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += decoder.decode(value, { stream: true });
            const lines = buf.split('\n');
            buf = lines.pop() || '';
            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              try {
                const d = JSON.parse(line.slice(6));
                if (d.type === 'text' && d.delta) {
                  full += d.delta;
                  const snap = full;
                  setMessages([
                    { id: 'init', role: 'assistant', content: snap },
                  ]);
                }
                if (d.type === 'tool') {
                  handleToolAction(d.action, d.payload);
                }
              } catch {
                /* skip */
              }
            }
          }
        }
        if (full) speak(full);
        messagesRef.current = [
          { id: 'init', role: 'assistant', content: full },
        ];
      } catch (err) {
        console.error('Init error:', err);
        const fb =
          'Hello! Look at this cute elephant! What do you see in the picture?';
        setMessages([{ id: 'init', role: 'assistant', content: fb }]);
        messagesRef.current = [
          { id: 'init', role: 'assistant', content: fb },
        ];
        speak(fb);
      } finally {
        setIsStreaming(false);
        processingRef.current = false;
      }
    })();
  }, [speak, handleToolAction]);

  /* ── controls ── */
  const toggleTheme = () =>
    setTheme((p) => (p === 'light' ? 'dark' : 'light'));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && !isStreaming && !sessionDone) {
      sendMessage(inputText);
      setInputText('');
    }
  };

  const toggleListening = useCallback(() => {
    if (sessionDone) return;
    if (isListening) {
      SpeechRecognition.stopListening();
      setIsListening(false);
      if (transcript.trim()) {
        sendMessage(transcript);
        resetTranscript();
      }
    } else {
      resetTranscript();
      SpeechRecognition.startListening({ continuous: true, language: 'en-US' });
      setIsListening(true);
    }
  }, [isListening, transcript, sendMessage, resetTranscript, sessionDone]);

  /* auto-send after silence */
  useEffect(() => {
    if (!transcript || !isListening || processingRef.current || sessionDone)
      return;
    const t = setTimeout(() => {
      if (transcript.trim()) {
        SpeechRecognition.stopListening();
        setIsListening(false);
        sendMessage(transcript);
        resetTranscript();
      }
    }, 2500);
    return () => clearTimeout(t);
  }, [transcript, isListening, sendMessage, resetTranscript, sessionDone]);

  /* timer display */
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timerStr = `${mins}:${secs.toString().padStart(2, '0')}`;
  const timerPct = ((SESSION_SECONDS - timeLeft) / SESSION_SECONDS) * 100;

  /* ── render ── */
  return (
    <div
      className={`app${bgMood === 'warm' ? ' bg-warm' : ''}${bgMood === 'cool' ? ' bg-cool' : ''}`}
    >
      {/* confetti overlay */}
      {showConfetti && (
        <div className="confetti-container" aria-hidden="true">
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="confetti-piece"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 0.5}s`,
                backgroundColor: [
                  '#6366F1',
                  '#F59E0B',
                  '#10B981',
                  '#EF4444',
                  '#EC4899',
                ][i % 5],
              }}
            />
          ))}
        </div>
      )}

      {/* star burst */}
      {starBurst && (
        <div className="stars-container" aria-hidden="true">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="star"
              style={{
                left: `${20 + Math.random() * 60}%`,
                top: `${10 + Math.random() * 40}%`,
                animationDelay: `${Math.random() * 0.4}s`,
              }}
            >
              {'\u2B50'}
            </div>
          ))}
        </div>
      )}

      {/* ── header ── */}
      <header className="header">
        <div className="header-inner">
          <div className="brand">
            <span className="brand-icon" aria-hidden="true">
              {'\uD83D\uDC18'}
            </span>
            <div>
              <h1 className="brand-name">Zubi</h1>
              <p className="brand-tag">AI Animal Friend</p>
            </div>
          </div>
          <div className="header-right">
            {started && !sessionDone && (
              <div className="timer">
                <div className="timer-bar">
                  <div
                    className="timer-fill"
                    style={{ width: `${100 - timerPct}%` }}
                  />
                </div>
                <span className="timer-text">{timerStr}</span>
              </div>
            )}
            {sessionDone && (
              <span className="timer-text done-label">Done!</span>
            )}
            <button
              className="theme-btn"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── main ── */}
      <main className="main">
        {/* image section */}
        <div className="image-section">
          <div
            className={`image-frame${imageHighlight ? ' image-highlight' : ''}`}
          >
            <img
              src="/images/elephant.jpg"
              alt="A cute baby elephant in a green meadow"
              className="scene-image"
            />
          </div>
        </div>

        {/* before start */}
        {!started && (
          <div className="start-section">
            <p className="start-desc">
              Talk to Zubi about this amazing elephant! A fun 1-minute voice
              conversation awaits.
            </p>
            <button className="btn-start" onClick={startSession}>
              Start Conversation
            </button>
            {!browserSupportsSpeechRecognition && (
              <p className="notice-inline">
                Voice input requires Chrome. You can still type messages.
              </p>
            )}
          </div>
        )}

        {/* chat */}
        {started && (
          <div className="chat">
            <div className="messages">
              {messages.map((msg) => (
                <div key={msg.id} className={`msg msg--${msg.role}`}>
                  <div className="msg__avatar">
                    {msg.role === 'assistant' ? '\uD83E\uDD16' : '\uD83E\uDDD2'}
                  </div>
                  <div className="msg__bubble">
                    {msg.content || (
                      <span className="typing">
                        <span className="dot" />
                        <span className="dot" />
                        <span className="dot" />
                      </span>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {isListening && (
              <div className="status-bar status-bar--listening">
                <span className="pulse-dot" />
                <span>{transcript || 'Listening...'}</span>
              </div>
            )}

            {isSpeaking && (
              <div className="status-bar status-bar--speaking">
                <div className="wave">
                  <span /><span /><span /><span />
                </div>
                <span>Zubi is speaking...</span>
              </div>
            )}

            {!sessionDone && (
              <div className="input-bar">
                <form className="input-form" onSubmit={handleSubmit}>
                  <input
                    ref={inputRef}
                    className="input-field"
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type a message..."
                    disabled={isStreaming}
                  />
                  <button
                    type="submit"
                    className="btn btn--send"
                    disabled={isStreaming || !inputText.trim()}
                    aria-label="Send"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  </button>
                </form>

                {browserSupportsSpeechRecognition && (
                  <button
                    className={`btn btn--mic ${isListening ? 'btn--mic-active' : ''}`}
                    onClick={toggleListening}
                    disabled={isStreaming}
                    aria-label={isListening ? 'Stop listening' : 'Start listening'}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                  </button>
                )}
              </div>
            )}

            {sessionDone && (
              <div className="restart-bar">
                <button className="btn-start" onClick={startSession}>
                  Start Again
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;

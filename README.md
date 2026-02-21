# Real-Time AI Conversation System

A production-ready AI conversation platform designed for children that combines voice interaction, real-time responses, and dynamic UI updates through tool calls.

## Overview

This project enables a 1-minute real-time voice conversation between a child and an AI about a child-friendly image. The system uses:

- Web Speech API for voice recognition (STT) and voice synthesis (TTS)
- OpenAI Responses API for intelligent, child-safe conversations
- Express backend with Server-Sent Events (SSE) for streaming responses
- React frontend with dynamic UI tool calls (zoom, highlight, badges, stars)

## Features

Real-Time Voice Interaction

- Child speaks via microphone; AI responds with synthesized voice
- Continuous listening with automatic response handling

Child-Safe AI

- System prompt enforces friendly, encouraging tone
- No personal data questions
- No harmful or scary content
- Simple vocabulary for ages 4-8

Dynamic UI Updates

- Tool calls trigger visual effects:
  - Highlight: Outline parts of the image
  - Zoom: Animate image scale
  - Badge: Display encouraging messages
  - Background: Change UI background color
  - Star: Show animated stars

Streaming Responses

- Real-time text streaming via SSE
- Tool actions execute mid-conversation
- No waiting for full response completion

Image-Based Conversation

- Displays child-friendly SVG images
- Conversation context tied to displayed image
- Tool calls can change images dynamically

## System Architecture

```
┌─────────────────────────────────────────┐
│         React Frontend (Port 3000)      │
│  ┌──────────────────────────────────┐  │
│  │  Web Speech API (STT/TTS)        │  │
│  │  Transcript Display              │  │
│  │  Tool Action Handlers            │  │
│  └──────────────────────────────────┘  │
└──────────────┬──────────────────────────┘
               │ HTTP / SSE
               ↓
┌─────────────────────────────────────────┐
│     Express Backend (Port 4000)         │
│  ┌──────────────────────────────────┐  │
│  │  POST /api/chat (SSE streaming)  │  │
│  │  GET /api/health                 │  │
│  └──────────────────────────────────┘  │
└──────────────┬──────────────────────────┘
               │ HTTPS
               ↓
┌─────────────────────────────────────────┐
│    OpenAI Responses API                 │
│  ┌──────────────────────────────────┐  │
│  │  Model: gpt-4o-mini              │  │
│  │  Tool: ui_action (enums)         │  │
│  │  Temperature: 0.8                │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## Getting Started

### Prerequisites

- Node.js 18 or higher
- OpenAI API key
- Chrome or Chromium-based browser (recommended for Web Speech API support)

### Installation and Setup

#### Step 1: Navigate to Project Directory

```bash
cd real-time-ai-conversation
```

#### Step 2: Backend Configuration

```bash
cd server
npm install
```

Configure environment variables by creating or updating `.env`:

```env
OPENAI_API_KEY=sk-your-real-key-here
PORT=4000
NODE_ENV=development
```

#### Step 3: Frontend Installation

```bash
cd ../child-ai-chat
npm install --legacy-peer-deps
```

### Running the Application

Open two separate terminal windows.

Terminal 1 - Start Backend Server:

```bash
cd server
npm run dev
```

Expected output: `Server running on http://localhost:4000`

Terminal 2 - Start Frontend Application:

```bash
cd child-ai-chat
npm start
```

Expected output: `Local: http://localhost:3000/`

### Using the Application

1. Navigate to http://localhost:3000 in your browser
2. Click the "Start Listening" button to begin
3. Speak clearly about the displayed image or animals
4. Say "lion" to trigger a tool call that changes the image
5. Click "Next Question" to advance the conversation
6. Click "Stop Listening" when finished

## Project Structure

```
real-time-ai-conversation/
├── server/
│   ├── src/
│   │   ├── index.ts              Backend API and OpenAI integration
│   │   └── prompt.ts             Child-safe system prompt
│   ├── dist/                     Compiled JavaScript output
│   ├── .env                      Environment configuration
│   ├── package.json
│   └── tsconfig.json
│
├── child-ai-chat/
│   ├── public/
│   │   ├── images/               Animal photograph assets
│   │   └── index.html
│   ├── src/
│   │   ├── App.tsx               Main React component
│   │   ├── index.tsx             React application entry point
│   │   ├── services/             AI communication services
│   │   ├── hooks/                Custom React hooks
│   │   └── utils/                SVG animal assets and utilities
│   ├── package.json
│   └── tsconfig.json
│
├── .git/                         Git repository
├── .gitignore                    Git ignore configuration
└── README.md                     Project documentation
```

## Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Frontend Framework | React | 19.x |
| Frontend Build System | Create React App | 5.x |
| Voice Processing | Web Speech API | Native |
| Backend Framework | Express.js | 4.19.x |
| AI Integration | OpenAI API | 4.68.x |
| Server Streaming | Server-Sent Events | Native |
| Language | TypeScript | 5.x |
| Compiler | TypeScript Compiler | 5.x |

## API Specification

### POST /api/chat

Streams AI responses with tool calls via Server-Sent Events.

Request Format:

```json
{
  "messages": [
    { "role": "user", "content": "I like the elephant" },
    { "role": "assistant", "content": "That's great!" }
  ]
}
```

Response Format (SSE stream):

```
data: {"type":"text","delta":"That's"}
data: {"type":"text","delta":" great"}
data: {"type":"tool","tool":{"name":"ui_action","args":"{\"type\":\"star\"}"}}
data: {"type":"done"}
```

### GET /api/health

Health status check endpoint.

Response:

```json
{ "ok": true }
```

## Tool Actions Reference

The AI interface supports the following tool actions:

| Action | Purpose | Example |
|--------|---------|---------|
| highlight | Outline specific image regions | {"type":"highlight","payload":{"x":120,"y":90,"w":160,"h":120}} |
| zoom | Apply zoom animation to image | {"type":"zoom","payload":{"level":1.1}} |
| badge | Display text badge overlay | {"type":"badge","payload":{"text":"Great job!"}} |
| background | Modify background color | {"type":"background","payload":{"color":"#fff7d6"}} |
| star | Display animated star decoration | {"type":"star"} |

## Safety Measures

The system implements child safety through:

- Simple vocabulary appropriate for ages 4-8
- Warm and encouraging communication tone
- No personal information collection
- No frightening or harmful content
- Continuous positive engagement
- Automatic 1-minute conversation duration
- Focus on animal and nature topics

## Available Commands

### Backend Commands

```bash
npm run dev         Start development server with auto-reload
npm run build       Compile TypeScript to JavaScript
npm start           Start production server
```

### Frontend Commands

```bash
npm start           Start development server with auto-open browser
npm run build       Create optimized production build
npm test            Execute test suite
npm run eject       Eject from Create React App (irreversible)
```

## Production Deployment

### Backend Deployment (Render or Railway)

1. Push your code to a GitHub repository
2. Create a new service on Render or Railway
3. Configure environment variable: OPENAI_API_KEY=sk-...
4. Set start command: npm run start

### Frontend Deployment (Vercel or Netlify)

1. Connect your GitHub repository to Vercel or Netlify
2. Set build command: npm run build
3. Set publish directory: build
4. Update API URL in child-ai-chat/src/App.tsx as needed

## Limitations and Considerations

- Web Speech API support is limited to Chromium-based browsers
- CORS configuration required for cross-domain communication
- Microphone permission must be granted at browser level
- OpenAI API usage incurs costs based on token consumption
- Create React App contains outdated dependencies (48 known vulnerabilities)

## Configuration Variables

```env
OPENAI_API_KEY      (Required) OpenAI platform API key
PORT                (Optional) Server port, default 4000
NODE_ENV            (Optional) Environment mode, default development
```

## Troubleshooting Guide

| Issue | Solution |
|-------|----------|
| Port 4000 already in use | Modify PORT in .env or terminate existing process |
| Port 3000 already in use | Change React port or terminate existing React process |
| Microphone permission denied | Grant microphone access in browser settings |
| AI backend not responding | Verify OPENAI_API_KEY is correctly configured |
| Duplicate messages displayed | Perform hard browser refresh (Ctrl+Shift+R) |
| No voice output | Check system volume and speaker configuration |
| TypeScript compilation fails | Run npm run build for detailed error messages |

## Additional Resources

- Web Speech API Documentation: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API
- OpenAI Responses API: https://platform.openai.com/docs/api-reference
- Server-Sent Events: https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events
- React Hooks Reference: https://react.dev/reference/react
- Express.js Documentation: https://expressjs.com/

## Development Recommendations

1. Customize CORS settings in server/src/index.ts for additional domains
2. Adjust temperature parameter in OpenAI API call for different response characteristics
3. Add additional animal images to child-ai-chat/public/images/
4. Modify system prompt in server/src/prompt.ts for custom behaviors
5. Extend tool call handling in React for additional UI effects

## Technical Questions and Answers

Q: Why use Server-Sent Events instead of WebSockets?

A: Server-Sent Events provides a simpler implementation for one-directional server-to-client streaming, which is ideal for AI response delivery without requiring bidirectional communication overhead.

Q: How is child safety ensured in the system?

A: Safety is enforced through a comprehensive system prompt with explicit rules, vocabulary constraints, and content filtering. The system does not request personal information and focuses exclusively on constructive, age-appropriate topics.

Q: What is the mechanism for tool call execution?

A: The backend sends tool calls within the Server-Sent Events stream. The frontend parses these events and immediately executes corresponding UI actions, creating a seamless interactive experience.

Q: Why implement Web Speech API for voice handling?

A: Web Speech API is built into modern browsers, requires no additional infrastructure, and provides both speech recognition and synthesis capabilities, making it ideal for rapid prototyping and demonstration purposes.

Q: How would this system scale to support millions of users?

A: Scalability would involve implementing WebSocket for bidirectional streaming, introducing Redis for session management, horizontally scaling backend servers, and implementing a distributed caching layer for frequently used responses.

## License

MIT License

## Project Information

This project was developed as a complete, production-ready implementation of an AI conversation system for educational and demonstration purposes.

Last Updated: February 21, 2026  
Status: Production Ready
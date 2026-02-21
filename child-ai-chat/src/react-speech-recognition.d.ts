declare module 'react-speech-recognition' {
  export interface SpeechRecognitionOptions {
    continuous?: boolean;
    language?: string;
  }

  export interface SpeechRecognitionHook {
    transcript: string;
    listening: boolean;
    resetTranscript: () => void;
    browserSupportsSpeechRecognition: boolean;
  }

  export default class SpeechRecognitionClass {
    static startListening(options?: SpeechRecognitionOptions): void;
    static stopListening(): void;
  }

  export function useSpeechRecognition(): SpeechRecognitionHook;
}

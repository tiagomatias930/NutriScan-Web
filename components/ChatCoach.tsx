import React, { useState, useRef, useEffect } from 'react';
import { geminiService } from '../services/geminiService';
import { useAppStore } from '../store';
import { useTranslation } from '../utils/i18n';
import { openInExternalBrowser, isAppGyser } from '../utils/externalBrowser';
import LanguageSwitcher from './LanguageSwitcher';

export const ChatCoach: React.FC = () => {
  const { user, chatHistory, addMessage } = useAppStore();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { t, locale } = useTranslation();

 // const scrollToBottom = () => {
   // messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  //};

// Simple markdown-like parser to render bold (**text**), italic (*text*),
// inline code (`code`), code blocks (```code```), and links [text](url).
// This is intentionally small to avoid adding dependencies. It returns
// React nodes and keeps plain text safe (no HTML injection).
function parseInline(txt: string): React.ReactNode[] {
    const nodes: React.ReactNode[] = [];
    const inlineRegex = /(`([^`]+)`)|\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\(([^)]+)\)/g;
    let lastIndex = 0;
    let m: RegExpExecArray | null;
    let key = 0;

    while ((m = inlineRegex.exec(txt)) !== null) {
        if (m.index > lastIndex) nodes.push(txt.slice(lastIndex, m.index));

        if (m[2]) {
            nodes.push(
                <code key={`ic-${key}`} className="bg-gray-200 dark:bg-gray-800 px-1 rounded font-mono text-sm text-gray-900 dark:text-gray-100">{m[2]}</code>
            );
        } else if (m[3]) {
            nodes.push(<strong key={`ib-${key}`}>{m[3]}</strong>);
        } else if (m[4]) {
            nodes.push(<em key={`ii-${key}`}>{m[4]}</em>);
        } else if (m[5] && m[6]) {
            const textPart = m[5];
            const href = m[6];
            const safeHref = /^\s*(https?:|mailto:|tel:|\/|#)/i.test(href) ? href : `https://${href}`;
            nodes.push(
                <a key={`il-${key}`} href={safeHref} target="_blank" rel="noreferrer" className="underline text-primary"
                    onClick={(e) => {
                        if (isAppGyser()) {
                            e.preventDefault();
                            openInExternalBrowser(safeHref);
                        }
                    }}
                >
                    {textPart}
                </a>
            );
        }

        lastIndex = m.index + m[0].length;
        key++;
    }

    if (lastIndex < txt.length) nodes.push(txt.slice(lastIndex));
    return nodes;
}

function renderFormattedText(text?: string): React.ReactNode {
    if (!text) return null;

    const nodes: React.ReactNode[] = [];
    const codeBlockRegex = /```([\s\S]*?)```/g;
    let lastIndex = 0;
    let m: RegExpExecArray | null;
    let key = 0;

    while ((m = codeBlockRegex.exec(text)) !== null) {
        if (m.index > lastIndex) {
            const before = text.slice(lastIndex, m.index);
            nodes.push(...parseInline(before));
        }

        nodes.push(
            <pre key={`cb-${key}`} className="bg-gray-200 dark:bg-gray-800 p-3 rounded text-sm overflow-x-auto font-mono text-gray-900 dark:text-gray-100">
                <code>{m[1]}</code>
            </pre>
        );

        lastIndex = m.index + m[0].length;
        key++;
    }

    if (lastIndex < text.length) {
        const rest = text.slice(lastIndex);
        nodes.push(...parseInline(rest));
    }

    return nodes;
}

  //useEffect(() => {
   // scrollToBottom();
  //}, [chatHistory, loading]);

  const handleSend = async () => {
    if (!input.trim() || !user) return;

    const userMsg = { 
        id: Date.now().toString(), 
        role: 'user' as const, 
        text: input, 
        timestamp: Date.now() 
    };
    addMessage(userMsg);
    setInput('');
    setLoading(true);

    const userContext = `${user.age}yo ${user.gender}, ${user.somatotype} body type, goal: ${user.goal}.`;
    const apiHistory = chatHistory.slice(-10).map(m => ({ role: m.role, text: m.text }));
    
    const response = await geminiService.chatWithCoach(apiHistory, userMsg.text, userContext, locale);
    
    const modelMsg = {
        id: (Date.now() + 1).toString(),
        role: 'model' as const,
        text: response.text,
        timestamp: Date.now(),
        sources: response.groundingChunks?.map((chunk: any) => {
            const web = chunk.web;
            if (web) return { title: web.title, uri: web.uri };
            return null;
        }).filter(Boolean) as any
    };
    addMessage(modelMsg);
    setLoading(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        await processVoiceInput(audioBlob);
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      recorder.start(100);
      setMediaRecorder(recorder);
      setIsRecording(true);
      setAudioChunks(chunks);
    } catch (error) {
      console.error("Failed to start recording:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const processVoiceInput = async (audioBlob: Blob) => {
    if (!user) return;
    
    setLoading(true);
    
    const userContext = `${user.age}yo ${user.gender}, ${user.somatotype} body type, goal: ${user.goal}.`;
    const apiHistory = chatHistory.slice(-10).map(m => ({ role: m.role, text: m.text }));
    
    try {
      const response = await geminiService.voiceChatWithCoach(
        audioBlob,
        apiHistory,
        userContext,
        locale
      );
      
      // Add user message (we don't have the transcribed text, so use a placeholder)
      const userMsg = {
        id: Date.now().toString(),
        role: 'user' as const,
        text: t('chat.voiceMessage'),
        timestamp: Date.now()
      };
      addMessage(userMsg);
      
      // Add AI response
      const modelMsg = {
        id: (Date.now() + 1).toString(),
        role: 'model' as const,
        text: response.text,
        timestamp: Date.now()
      };
      addMessage(modelMsg);
      
      // Play audio response if available
      if (response.audioBuffer) {
        setIsPlaying(true);
        try {
          await geminiService.playAudio(response.audioBuffer);
        } catch (e) {
          console.warn("Failed to play audio response:", e);
        }
        setIsPlaying(false);
      }
    } catch (error) {
      console.error("Voice chat error:", error);
    }
    
    setLoading(false);
  };

    return (
        <div className="flex flex-col min-h-screen h-full bg-transparent relative font-sans">
        {/* Header */}
        <div className="px-3 py-4 bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 shadow-sm sticky top-0 z-20 flex items-center justify-between gap-3 transition-colors duration-300">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="material-icons text-white"><img className="w-12 h-12" src="/running.png" alt="" /></span>
                </div>
                <div>
                    <h2 className="text-lg font-bold text-textLight dark:text-gray-100 leading-tight">{t('chat.headerTitle')}</h2>
                    <p className="text-xs text-primary font-medium flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span> {t('chat.status')}
                    </p>
                </div>
            </div>
            <LanguageSwitcher />
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 break-words pt-12 sm:pt-6 pb-24 sm:pb-6" style={{ paddingBottom: 'calc(6rem + env(safe-area-inset-bottom) + 0.5rem)' }}>
            {chatHistory.length === 0 && (
                <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in px-4">
                    <div className="w-20 h-20 rounded-3xl bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-center mb-6">
                        <span className="material-icons text-primary text-4xl">forum</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">{t('chat.greeting', { name: user?.name ?? '' })}</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-center text-sm mb-8 max-w-xs">{t('chat.intro')}</p>
                    
                    <div className="w-full max-w-sm space-y-3">
                        <SuggestionButton text={t('chat.emptySuggestions.breakfast')} onClick={setInput} />
                        <SuggestionButton text={t('chat.emptySuggestions.protein')} onClick={setInput} />
                        <SuggestionButton text={t('chat.emptySuggestions.carbCycling')} onClick={setInput} />
                    </div>
                </div>
            )}
            
            {chatHistory.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up px-2`}>
                    <div className={`max-w-full sm:max-w-[85%] break-words rounded-2xl p-4 shadow-sm transition-colors duration-300 ${
                        msg.role === 'user' 
                        ? 'bg-primary text-white rounded-tr-sm' 
                        : 'bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-sm'
                    }`}>
                        <div className="whitespace-pre-wrap text-sm sm:text-[15px] leading-relaxed">{renderFormattedText(msg.text)}</div>
                        {msg.sources && msg.sources.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-black/10 flex flex-col gap-1">
                                <p className="text-[10px] font-bold uppercase opacity-60 mb-1">{t('chat.sources')}</p>
                                {msg.sources.map((src, i) => (
                                    <a key={i} href={src.uri} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs opacity-80 hover:opacity-100 truncate"
                                        onClick={(e) => {
                                            if (isAppGyser()) {
                                                e.preventDefault();
                                                openInExternalBrowser(src.uri);
                                            }
                                        }}
                                    >
                                        <span className="material-icons text-[10px]">link</span>
                                        <span className="truncate">{src.title}</span>
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ))}
            
            {loading && (
                <div className="flex justify-start px-2">
                    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl rounded-tl-sm p-4 flex items-center gap-2 shadow-sm transition-colors duration-300">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-75"></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-150"></div>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 sticky bottom-20 sm:bottom-[150px] z-30 transition-colors duration-300" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.5rem)' }}>
            <div className="bg-gray-100 dark:bg-gray-900 rounded-full p-2 sm:p-1.5 flex flex-row items-center gap-2 transition-all w-full border border-gray-200 dark:border-gray-800">
                {/* Voice Input Button */}
                <button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={loading}
                    aria-label={isRecording ? "Stop recording" : "Start voice input"}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                        isRecording 
                        ? 'bg-red-500 text-white animate-pulse shadow-md' 
                        : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-primary shadow-sm'
                    }`}
                >
                    {isRecording ? (
                        <span className="material-icons text-xl">stop</span>
                    ) : (
                        <span className="material-icons text-xl">mic</span>
                    )}
                </button>
                
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        // Enter sends, Shift+Enter inserts newline
                        
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                    placeholder={t('chat.placeholder')}
                    rows={1}
                    className="flex-1 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none text-base py-2 px-4 resize-none max-h-32 overflow-auto"
                    aria-label={t('chat.placeholder')}
                />

                {/* Circular icon button on all screen sizes */}
                <div className="flex-shrink-0">
                    <button
                        onClick={handleSend}
                        disabled={loading || !input.trim()}
                        aria-label="Send message"
                        className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-50 transition-all focus:outline-none focus:ring-2 focus:ring-primary shadow-md disabled:shadow-none hover:bg-primaryDark"
                    >
                        <span className="material-icons text-xl">arrow_upward</span>
                    </button>
                </div>
            </div>
            
            {/* Recording indicator */}
            {isRecording && (
                <div className="flex items-center justify-center gap-2 mt-2 text-red-400 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    <span className="text-xs font-medium">A gravar...</span>
                </div>
            )}
            
            {/* Playing indicator */}
            {isPlaying && (
                <div className="flex items-center justify-center gap-2 mt-2 text-primary animate-pulse">
                    <span className="material-icons text-sm">volume_up</span>
                    <span className="text-xs font-medium">A reproduzir áudio...</span>
                </div>
            )}
        </div>
    </div>
  );
};

const SuggestionButton = ({ 
    text, onClick }: { text: string, onClick: (t: string) => void }) => (
    <button 
        onClick={() => onClick(text)} 
        className="w-full p-3 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-xl text-sm text-gray-700 dark:text-gray-300 text-left flex items-center justify-between group transition-colors shadow-sm"
    >
        {text}
        <span className="material-icons text-gray-400 dark:text-gray-500 text-sm group-hover:text-primary transition-colors">arrow_forward</span>
    </button>
)

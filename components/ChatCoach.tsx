import React, { useState, useRef, useEffect } from 'react';
import { geminiService } from '../services/geminiService';
import { useAppStore } from '../store';
import { useTranslation } from '../utils/i18n';
import LanguageSwitcher from './LanguageSwitcher';

export const ChatCoach: React.FC = () => {
  const { user, chatHistory, addMessage } = useAppStore();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
    const { t } = useTranslation();

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
                <code key={`ic-${key}`} className="bg-gray-200 px-1 rounded font-mono text-sm text-gray-900">{m[2]}</code>
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
                <a key={`il-${key}`} href={safeHref} target="_blank" rel="noreferrer" className="underline text-primary">
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
            <pre key={`cb-${key}`} className="bg-gray-200 p-3 rounded text-sm overflow-x-auto font-mono text-gray-900">
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
    
    const response = await geminiService.chatWithCoach(apiHistory, userMsg.text, userContext);
    
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

    return (
        <div className="flex flex-col min-h-screen h-full bg-dark relative font-sans">
        {/* Header */}
        <div className="px-3 py-4 glass glass-lg border-b border-glassDark shadow-sm sticky top-0 z-20 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center glow-cyan">
                    <span className="material-icons text-white"><img className="w-12 h-12" src="/running.png" alt="" /></span>
                </div>
                <div>
                    <h2 className="text-lg font-bold text-textLight leading-tight">{t('chat.headerTitle')}</h2>
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
                    <div className="w-20 h-20 rounded-3xl glass-lg flex items-center justify-center mb-6">
                        <span className="material-icons text-primary text-4xl">forum</span>
                    </div>
                    <h3 className="text-xl font-bold text-textLight mb-2">{t('chat.greeting', { name: user?.name ?? '' })}</h3>
                    <p className="text-textMuted text-center text-sm mb-8 max-w-xs">{t('chat.intro')}</p>
                    
                    <div className="w-full max-w-sm space-y-3">
                        <SuggestionButton text={t('chat.emptySuggestions.breakfast')} onClick={setInput} />
                        <SuggestionButton text={t('chat.emptySuggestions.protein')} onClick={setInput} />
                        <SuggestionButton text={t('chat.emptySuggestions.carbCycling')} onClick={setInput} />
                    </div>
                </div>
            )}
            
            {chatHistory.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up px-2`}>
                    <div className={`max-w-full sm:max-w-[85%] break-words rounded-2xl p-4 shadow-sm ${
                        msg.role === 'user' 
                        ? 'bg-gradient-to-r from-primary to-secondary text-dark rounded-tr-sm glow-cyan' 
                        : 'glass-lg text-textLight rounded-tl-sm'
                    }`}>
                        <div className="whitespace-pre-wrap text-sm sm:text-[15px] leading-relaxed">{renderFormattedText(msg.text)}</div>
                        {msg.sources && msg.sources.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-black/10 flex flex-col gap-1">
                                <p className="text-[10px] font-bold uppercase opacity-60 mb-1">{t('chat.sources')}</p>
                                {msg.sources.map((src, i) => (
                                    <a key={i} href={src.uri} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs opacity-80 hover:opacity-100 truncate">
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
                <div className="flex justify-start">
                    <div className="bg-card border border-gray-300 rounded-2xl rounded-tl-sm p-4 flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-75"></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-150"></div>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-dark/50 border-t border-glassDark sticky bottom-9 sm:bottom-[80px] z-30" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.5rem)' }}>
            <div className="glass glass-lg p-2 sm:p-1.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 transition-all w-full">
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
                    className="flex-1 bg-transparent text-textLight placeholder-textMuted focus:outline-none text-base py-2 px-4 rounded-xl resize-none max-h-32 overflow-auto"
                    aria-label={t('chat.placeholder')}
                />

                {/* Desktop/large: circular icon button; Mobile: full-width send button below/input-stacked */}
                <div className="flex-shrink-0 w-full sm:w-auto flex sm:block">
                    <button
                        onClick={handleSend}
                        disabled={loading || !input.trim()}
                        aria-label="Send message"
                        className="w-full sm:w-10 h-10 rounded-xl sm:rounded-full bg-gradient-to-r from-primary to-secondary text-dark flex items-center justify-center disabled:opacity-50 transition-all glow-cyan disabled:glow-none border border-glassDark focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        <span className="material-icons text-xl">arrow_upward</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};

const SuggestionButton = ({ 
    text, onClick }: { text: string, onClick: (t: string) => void }) => (
    <button 
        onClick={() => onClick(text)} 
        className="w-full p-3 bg-card hover:bg-gray-800 border border-gray-800 rounded-xl text-sm text-gray-300 text-left flex items-center justify-between group transition-colors"
    >
        {text}
        <span className="material-icons text-gray-600 text-sm group-hover:text-primary transition-colors">arrow_forward</span>
    </button>
)

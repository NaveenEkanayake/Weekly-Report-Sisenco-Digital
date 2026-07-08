import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import api from '../../services/api';

const ChatAssistant = ({ theme = 'dark' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'ai',              text: '👋 Hi! I am the AI Assistant. I can summarize team reports, highlight blocker patterns, and analyze workloads. How can I help you today?',
      time: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const isDark = theme === 'dark';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputValue;
    if (!text.trim()) return;

    if (!textToSend) setInputValue('');

    // Append user message
    const userMessage = {
      sender: 'user',
      text,
      time: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await api.post('/ai/chat', { message: text });
      
      const aiMessage = {
        sender: 'ai',
        text: response.data.data,
        time: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI chat failed:', error);
      const errorMessage = {
        sender: 'ai',
        text: '❌ Apologies, I encountered an error connecting to the intelligence server. Please ensure the backend is running and try again.',
        time: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const suggestions = [
    "Summarize team activity",
    "Show active blockers",
    "What did the team work on?",
    "Show project workloads",
    "What's the compliance rate?",
    "Give me recommendations",
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-650/40 hover:shadow-indigo-550/50 cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95 border border-indigo-550/20"
        >
          <MessageSquare className="w-6 h-6 animate-pulse" />
        </button>
      )}

      {/* Expanded Widget */}
      {isOpen && (
        <div className={`w-[calc(100vw-2rem)] sm:w-[360px] md:w-[380px] max-w-[420px] h-[460px] sm:h-[520px] rounded-2xl border shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
          isDark 
            ? 'bg-zinc-900 border-zinc-800 text-zinc-100 shadow-indigo-950/20' 
            : 'bg-white border-zinc-200 text-zinc-800 shadow-zinc-350/30'
        }`}>
          {/* Header */}
          <div className="p-4 border-b flex justify-between items-center bg-indigo-600 text-white">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
                <Sparkles size={15} />
              </div>
              <div>
                <h4 className="text-xs font-bold leading-tight">AI Assistant</h4>
                <span className="text-[9px] opacity-75">Team Intelligence Engine</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full hover:bg-white/10 text-white cursor-pointer transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages area */}
          <div className={`flex-1 p-4 overflow-y-auto space-y-3.5 ${
            isDark ? 'bg-zinc-950/40' : 'bg-zinc-50/50'
          }`}>
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex flex-col max-w-[80%] ${
                  msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                }`}
              >
                <div className={`px-3 py-2 rounded-xl text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-none whitespace-pre-line'
                    : isDark 
                      ? 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-none' 
                      : 'bg-white border border-zinc-200 text-zinc-800 rounded-tl-none'
                }`}>
                  {msg.sender === 'ai' ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ul:pl-4 prose-li:my-0.5">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  ) : (
                    msg.text
                  )}
                </div>
                <span className={`text-[8px] mt-1 opacity-55 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex items-center gap-1.5 mr-auto pl-2">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick action chips */}
          <div className={`px-3 py-2 border-t flex flex-wrap gap-1.5 ${
            isDark ? 'border-zinc-800 bg-zinc-900/40' : 'border-zinc-150 bg-white'
          }`}>
            {suggestions.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(chip)}
                disabled={isLoading}
                className={`text-[10px] px-2.5 py-1 rounded-full border cursor-pointer transition-colors ${
                  isDark
                    ? 'border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 disabled:opacity-50'
                    : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-650 disabled:opacity-50'
                }`}
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input Panel */}
          <div className={`p-3 border-t flex gap-2 items-center ${
            isDark ? 'border-zinc-800 bg-zinc-900' : 'border-zinc-200 bg-white'
          }`}>
            <input
              type="text"
              placeholder="Ask a question about weekly reports..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isLoading}
              className={`flex-1 text-xs px-3 py-2 border rounded-lg focus:outline-none transition-all ${
                isDark
                  ? 'bg-zinc-950 border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-zinc-100 placeholder-zinc-500'
                  : 'bg-zinc-50 border-zinc-200 focus:border-indigo-650 focus:ring-1 focus:ring-indigo-650 text-zinc-800 placeholder-zinc-400'
              }`}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isLoading || !inputValue.trim()}
              className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 cursor-pointer transition-colors shadow-sm"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatAssistant;

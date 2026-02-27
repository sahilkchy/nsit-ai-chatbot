/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  User, 
  GraduationCap, 
  BookOpen, 
  CreditCard, 
  Building2, 
  Phone, 
  Trash2,
  ChevronRight,
  School,
  Map
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { chatWithNSITStream, Message } from './services/geminiService';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const QUICK_QUESTIONS = [
  { label: 'Admission', icon: <GraduationCap size={14} className="text-orange-500" />, query: 'Tell me about the admission process at NSIT Bihta.' },
  { label: 'Courses', icon: <BookOpen size={14} className="text-blue-500" />, query: 'What courses are offered at NSIT Bihta?' },
  { label: 'Fees', icon: <CreditCard size={14} className="text-yellow-600" />, query: 'What is the fee structure for B.Tech?' },
  { label: 'Facilities', icon: <Building2 size={14} className="text-red-500" />, query: 'What facilities are available on campus?' },
  { label: 'Contact', icon: <Phone size={14} className="text-gray-600" />, query: 'How can I contact NSIT Bihta?' },
  { label: 'Student Login', icon: <User size={14} className="text-indigo-500" />, query: 'Where is the student login page?' },
  { label: 'Virtual Tour', icon: <Map size={14} className="text-green-500" />, query: 'Lets take a virtual tour' },
];

const NSITLogo = () => (
  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center overflow-hidden border-2 border-white/50 shadow-sm">
    <img 
      src="https://imgs.search.brave.com/QSaFN3XKI8joRhCYlNhBGcdiBWu3cHkR2L9iQGuTGIk/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pbWcu/amFncmFuam9zaC5j/b20vaW1hZ2VzLzIw/MjIvSnVuZS85NjIw/MjIvMjczMjA3Mzc0/XzM2MDI0ODY3OTQz/ODI3OV81MzE5ODI3/Mjk1MzM2MTg4NjEx/X24uanBn" 
      alt="NSIT Bihta Logo" 
      className="w-full h-full object-cover"
      referrerPolicy="no-referrer"
      onError={(e) => {
        (e.target as HTMLImageElement).src = "https://www.nsit.in/images/logo.png";
      }}
    />
  </div>
);

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "Hello! 👋 I'm your NSIT Bihta Assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text: string = input) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Add an empty model message to fill with stream
    setMessages(prev => [...prev, { role: 'model', text: '' }]);

    let fullText = '';
    try {
      const stream = chatWithNSITStream(messages, text);
      for await (const chunk of stream) {
        fullText += chunk;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { role: 'model', text: fullText };
          return newMessages;
        });
      }
    } catch (error) {
      console.error("Streaming error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([{ role: 'model', text: "Hello! 👋 I'm your NSIT Bihta Assistant. How can I help you today?" }]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-600 to-blue-400 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[85vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-500 p-6 text-white flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center">
              <NSITLogo />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight">NSIT Support Assistant</h1>
              <div className="flex items-center gap-2 text-xs opacity-90">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                <span>Online • Ready to help</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <a 
              href="mailto:sahilkchy@gmail.com,raunakkchy@gmail.com?subject=NSIT%20Assistant%20Help"
              className="p-2 hover:bg-white/10 rounded-full transition-colors flex items-center justify-center"
              title="Help & Feedback"
            >
              <span className="text-[10px] font-bold bg-white/20 px-1.5 py-0.5 rounded mr-1">HELP</span>
            </a>
            <button 
              onClick={clearChat}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              title="Clear Chat"
            >
              <Trash2 size={20} className="opacity-80" />
            </button>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
          <AnimatePresence initial={false}>
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={cn(
                  "flex w-full",
                  m.role === 'user' ? "justify-end" : "justify-start"
                )}
              >
                <div className={cn(
                  "max-w-[85%] p-4 rounded-2xl shadow-sm text-sm leading-relaxed",
                  m.role === 'user' 
                    ? "bg-blue-600 text-white rounded-tr-none" 
                    : "bg-white text-slate-800 rounded-tl-none border border-slate-100"
                )}>
                  {m.role === 'model' && m.text === '' ? (
                    <div className="flex gap-1 py-1">
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    </div>
                  ) : (
                    <div className="markdown-body">
                      <Markdown>{m.text}</Markdown>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Questions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-white">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-3">Quick Questions:</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_QUESTIONS.map((q) => (
              <button
                key={q.label}
                onClick={() => handleSend(q.query)}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-full text-xs font-medium text-slate-600 hover:text-blue-600 transition-all active:scale-95"
              >
                {q.icon}
                {q.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className="p-6 pt-2 bg-white">
          <div className="relative flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about admissions, course..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all pr-12"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="absolute right-2 w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl flex items-center justify-center transition-colors shadow-lg shadow-blue-500/30"
            >
              <Send size={18} />
            </button>
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-[10px] text-slate-500 font-medium">
              Developed by Sahil & Raunak
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

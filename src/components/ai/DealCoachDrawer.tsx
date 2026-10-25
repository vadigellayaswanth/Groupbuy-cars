'use client';

import React, { useState } from 'react';
import { CarCampaign, DealershipOffer } from '@/lib/types';
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  ShieldAlert,
  HelpCircle,
  MessageSquare,
  ChevronRight,
  Cpu,
  Info,
} from 'lucide-react';

interface DealCoachDrawerProps {
  campaign: CarCampaign;
  offers: DealershipOffer[];
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function DealCoachDrawer({ campaign, offers }: DealCoachDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hello! I'm your **AI Deal Coach** for the **${campaign.brand} ${campaign.model}** cluster in ${campaign.city}.

I evaluate all submitted dealership quotes, calculate exact price differences against the original **₹${campaign.estimatedOnRoadPrice.toLocaleString('en-IN')}** on-road price, and highlight hidden dealer conditions.

Tap one of the suggested prompts below or ask any question!`,
    },
  ]);

  const quickPrompts = [
    'Which offer has the highest real cash savings?',
    'Calculate price difference between Dealer A and Dealer B',
    'Why are Dealer C accessories considered a gimmick?',
    'What insurance and loan conditions should I verify?',
  ];

  const handleSend = async (questionText?: string) => {
    const textToSend = questionText || input;
    if (!textToSend.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: textToSend };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: textToSend,
          campaign,
          offers,
          chatHistory: messages,
        }),
      });

      const data = await res.json();
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.answer || 'I could not process that question. Please try again.',
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error connecting to the AI Coach engine.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 px-4.5 py-3 rounded-full bg-gradient-to-r from-amber-100 via-amber-200 to-amber-300 text-slate-900 font-semibold text-xs shadow-2xl shadow-black/80 hover:scale-105 transition-all duration-200 border border-amber-200/50 group"
        >
          <div className="w-2 h-2 rounded-full bg-slate-900 animate-pulse"></div>
          <Sparkles className="w-4 h-4 text-slate-900" />
          <span>Ask AI Deal Coach</span>
          <span className="hidden sm:inline bg-black/15 px-2 py-0.5 rounded-full text-[10px] font-mono text-slate-800">
            {offers.length} Quotes Analyzed
          </span>
        </button>
      </div>

      {/* Slide-over Drawer Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md h-full glass-panel border-l border-white/[0.1] flex flex-col justify-between shadow-2xl animate-slideLeft bg-[#070b12]/95">
            {/* Drawer Header */}
            <div className="p-4 sm:p-5 border-b border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-200 via-slate-400 to-amber-200/40 p-[1px]">
                  <div className="w-full h-full bg-[#070b12] rounded-[10px] flex items-center justify-center">
                    <Bot className="w-5 h-5 text-amber-300" />
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span>AI Deal Coach</span>
                    <span className="text-[10px] bg-white/[0.04] text-amber-200 px-2 py-0.5 rounded-full font-mono border border-white/[0.08]">
                      Grounded
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Evaluating {offers.length} verified quotes for {campaign.model}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Honest Demo Mode Status Banner */}
            <div className="px-4 py-2 bg-white/[0.02] border-b border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <div className="flex items-center gap-1.5 text-amber-200">
                <Cpu className="w-3.5 h-3.5 text-amber-300" />
                <span>Deterministic Demo Rules Engine</span>
              </div>
              <span className="text-[10px] text-slate-500">
                Grounded Truth
              </span>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, index) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={index}
                    className={`flex items-start gap-2.5 ${
                      isUser ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center ${
                        isUser
                          ? 'bg-amber-200 text-slate-900 font-bold'
                          : 'bg-white/[0.05] text-amber-300 border border-white/[0.08]'
                      }`}
                    >
                      {isUser ? <User className="w-4 h-4 text-slate-900" /> : <Bot className="w-4 h-4" />}
                    </div>

                    <div
                      className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                        isUser
                          ? 'bg-amber-100 text-slate-900 font-medium rounded-tr-none shadow-sm'
                          : 'bg-white/[0.04] text-slate-200 border border-white/[0.08] rounded-tl-none whitespace-pre-wrap'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                );
              })}

              {loading && (
                <div className="flex items-center gap-2 text-xs text-amber-200 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                  <Bot className="w-4 h-4 animate-spin text-amber-300" />
                  <span>AI Coach is computing verified price differences & terms...</span>
                </div>
              )}
            </div>

            {/* Quick Prompt Chips */}
            <div className="px-4 py-2.5 border-t border-white/[0.06] space-y-1.5 bg-[#060910]">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1 font-mono">
                <HelpCircle className="w-3 h-3 text-amber-300" />
                <span>Suggested Queries</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSend(prompt)}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-white/[0.03] hover:bg-white/[0.08] text-slate-300 hover:text-amber-200 border border-white/[0.08] transition-all text-left truncate max-w-full"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Bar */}
            <div className="p-4 border-t border-white/[0.08] bg-[#060910]">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about real cash vs accessories, price differences..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/[0.08] text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-300/40 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="p-2.5 rounded-xl bg-gradient-to-r from-amber-100 to-amber-200 text-slate-900 hover:from-white hover:to-amber-100 disabled:opacity-40 transition-all shadow-md shadow-amber-500/10"
                >
                  <Send className="w-4 h-4 text-slate-900" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

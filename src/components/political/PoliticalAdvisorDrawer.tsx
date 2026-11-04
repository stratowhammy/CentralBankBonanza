import React, { useState, useRef, useEffect } from 'react';
import { PoliticalSession, PoliticalAdvisorMessage } from '../../types';
import { api } from '../../api';
import { X, Send, Brain, ChevronDown, ChevronUp, Sparkles, FileText, Vote, Megaphone, Users, Award } from 'lucide-react';
import { AudioPlayButton } from '../AudioPlayButton';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  session: PoliticalSession;
  onRefreshSession: () => void;
}

export const PoliticalAdvisorDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  session,
  onRefreshSession
}) => {
  const [messages, setMessages] = useState<PoliticalAdvisorMessage[]>(session.messages || []);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedThinks, setExpandedThinks] = useState<Record<number, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (session.messages) {
      setMessages(session.messages);
    }
  }, [session.messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: PoliticalAdvisorMessage = {
      id: 'temp_' + Date.now(),
      session_id: session.id,
      sender: 'user',
      content: textToSend.trim(),
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await api.sendPoliticalAdvisorChat(session.id, textToSend.trim());
      const advisorMsg: PoliticalAdvisorMessage = {
        id: 'temp_adv_' + Date.now(),
        session_id: session.id,
        sender: 'advisor',
        content: res.response,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, advisorMsg]);
      onRefreshSession();
    } catch (err: any) {
      alert(err.message || 'Error communicating with Chief of Staff');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleThink = (idx: number) => {
    setExpandedThinks(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Render message content with <think>...</think> block parsed
  const renderMessageContent = (content: string, msgIdx: number) => {
    const thinkMatch = content.match(/<think>([\s\S]*?)<\/think>/);
    let reasoning = thinkMatch ? thinkMatch[1].trim() : null;
    let mainBody = content.replace(/<think>[\s\S]*?<\/think>/, '').trim();

    const isExpanded = !!expandedThinks[msgIdx];

    return (
      <div className="space-y-3">
        {mainBody && (
          <div className="flex items-center justify-between pb-1.5 border-b border-stone-800/80">
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
              Chief of Staff Briefing
            </span>
            <AudioPlayButton
              text={mainBody}
              role="political_advisor"
              label="Listen"
              className="text-[10px] py-0.5 px-2 bg-stone-900 hover:bg-stone-800 border-amber-800/40 text-amber-300"
            />
          </div>
        )}

        {reasoning && (
          <div className="rounded-xl border border-amber-800/40 bg-stone-950/80 overflow-hidden shadow-inner text-xs font-mono">
            <button
              onClick={() => toggleThink(msgIdx)}
              className="w-full px-3.5 py-2.5 flex items-center justify-between bg-amber-950/30 hover:bg-amber-950/50 text-amber-300 border-b border-amber-900/30 transition-colors text-left"
            >
              <div className="flex items-center space-x-2">
                <Brain className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span className="font-bold tracking-wide uppercase text-[11px] font-sans">
                  Chief of Staff Thought Process (v4-pro)
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-900/40 border border-amber-700/40 text-amber-300">
                  Tactical Calculus
                </span>
              </div>
              <div className="flex items-center space-x-1 text-stone-400 text-[10px] font-sans">
                <span>{isExpanded ? 'Hide' : 'Inspect'}</span>
                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </div>
            </button>

            {isExpanded && (
              <div className="p-3.5 text-stone-300 leading-relaxed max-h-72 overflow-y-auto whitespace-pre-wrap selection:bg-amber-800 selection:text-amber-100">
                {reasoning}
              </div>
            )}
          </div>
        )}

        <div className="text-stone-100 font-sans text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
          {mainBody}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-stone-900 border-l border-stone-800 shadow-2xl flex flex-col font-sans">
      
      {/* Header */}
      <div className="px-5 py-4 border-b border-stone-800 bg-stone-950 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-amber-950 border border-amber-600/40 flex items-center justify-center text-amber-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-stone-100 font-serif">Office Chief of Staff</h3>
            <p className="text-[11px] text-amber-400">Statutory Drafting • Whip Counts • Political Counsel</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={msg.id || idx}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[88%] rounded-2xl p-4 ${
                msg.sender === 'user'
                  ? 'bg-amber-600 text-stone-950 font-medium rounded-tr-none'
                  : 'bg-stone-950 border border-stone-800 text-stone-100 rounded-tl-none shadow-md'
              }`}
            >
              <div className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-75">
                {msg.sender === 'user' ? session.politician_name : 'Chief of Staff'}
              </div>
              {msg.sender === 'user' ? (
                <div className="text-xs sm:text-sm whitespace-pre-wrap">{msg.content}</div>
              ) : (
                renderMessageContent(msg.content, idx)
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-stone-950 border border-amber-800/40 rounded-2xl rounded-tl-none p-4 max-w-[85%] text-xs text-amber-300 flex items-center space-x-3">
              <Brain className="w-4 h-4 animate-spin text-amber-400" />
              <span>Chief of Staff is drafting tactical calculus & vote counts...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Action Suggestion Chips */}
      <div className="px-5 py-2.5 bg-stone-950/60 border-t border-stone-800 flex items-center space-x-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => handleSendMessage("Please draft an Affordable Prescription Drugs & Hospital Nurse Staffing Bill")}
          className="shrink-0 px-3 py-1.5 rounded-full bg-stone-800 hover:bg-amber-950/40 hover:border-amber-700/50 border border-stone-700 text-stone-300 hover:text-amber-200 text-[11px] flex items-center space-x-1.5 transition-all"
        >
          <FileText className="w-3 h-3 text-amber-400" />
          <span>Draft Healthcare Bill</span>
        </button>

        <button
          onClick={() => handleSendMessage("Please draft a Clean Energy Grid Modernization & Strategic Export Act")}
          className="shrink-0 px-3 py-1.5 rounded-full bg-stone-800 hover:bg-amber-950/40 hover:border-amber-700/50 border border-stone-700 text-stone-300 hover:text-amber-200 text-[11px] flex items-center space-x-1.5 transition-all"
        >
          <Sparkles className="w-3 h-3 text-emerald-400" />
          <span>Draft Clean Grid Bill</span>
        </button>

        <button
          onClick={() => handleSendMessage("Get a floor whip vote count on our active bills")}
          className="shrink-0 px-3 py-1.5 rounded-full bg-stone-800 hover:bg-amber-950/40 hover:border-amber-700/50 border border-stone-700 text-stone-300 hover:text-amber-200 text-[11px] flex items-center space-x-1.5 transition-all"
        >
          <Vote className="w-3 h-3 text-cyan-400" />
          <span>Run Whip Count</span>
        </button>

        <button
          onClick={() => handleSendMessage("What is our current re-election standing and how do economic indicators affect our margin?")}
          className="shrink-0 px-3 py-1.5 rounded-full bg-stone-800 hover:bg-amber-950/40 hover:border-amber-700/50 border border-stone-700 text-stone-300 hover:text-amber-200 text-[11px] flex items-center space-x-1.5 transition-all"
        >
          <Award className="w-3 h-3 text-amber-400" />
          <span>Electoral Analysis</span>
        </button>
      </div>

      {/* Input Form */}
      <div className="p-4 border-t border-stone-800 bg-stone-950">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="Instruct your Chief of Staff (e.g. 'Draft a housing bill' or 'Check whip count')..."
            className="flex-1 px-4 py-2.5 bg-stone-900 border border-stone-800 rounded-xl text-stone-100 text-xs sm:text-sm focus:outline-none focus:border-amber-500 placeholder:text-stone-500"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-stone-950 font-bold rounded-xl transition-colors flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

    </div>
  );
};

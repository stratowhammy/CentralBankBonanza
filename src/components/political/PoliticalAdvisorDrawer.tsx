import React, { useState, useRef, useEffect } from 'react';
import { PoliticalSession, PoliticalAdvisorMessage, PoliticalCaucus, CaucusDirectMessage } from '../../types';
import { api } from '../../api';
import { 
  X, Send, Brain, ChevronDown, ChevronUp, Sparkles, FileText, Vote, 
  Megaphone, Users, Award, Handshake, DollarSign, MessageSquare, 
  ShieldAlert, Bot, ArrowRight, UserCheck, AlertCircle, CheckCircle2
} from 'lucide-react';
import { AudioPlayButton } from '../AudioPlayButton';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  session: PoliticalSession;
  onRefreshSession: () => void;
  initialTab?: 'advisor' | 'dms';
  initialCaucusId?: string | null;
}

export const PoliticalAdvisorDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  session,
  onRefreshSession,
  initialTab = 'advisor',
  initialCaucusId = null
}) => {
  const [activeTab, setActiveTab] = useState<'advisor' | 'dms'>(initialTab);
  
  // Chief of Staff state
  const [messages, setMessages] = useState<PoliticalAdvisorMessage[]>(session.messages || []);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedThinks, setExpandedThinks] = useState<Record<string | number, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Cloakroom DMs state
  const otherCaucuses = session.caucuses?.filter(c => !c.is_player_led) || [];
  const [selectedCaucusId, setSelectedCaucusId] = useState<string>(
    initialCaucusId || (otherCaucuses.length > 0 ? otherCaucuses[0].id : '')
  );
  const [dmInputText, setDmInputText] = useState('');
  const [isDmLoading, setIsDmLoading] = useState(false);
  const dmEndRef = useRef<HTMLDivElement>(null);

  // Sync state on session updates
  useEffect(() => {
    if (session.messages) {
      setMessages(session.messages);
    }
  }, [session.messages]);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
    if (initialCaucusId) setSelectedCaucusId(initialCaucusId);
  }, [initialTab, initialCaucusId]);

  useEffect(() => {
    if (activeTab === 'advisor') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else {
      dmEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, session.caucus_dms, isLoading, isDmLoading, activeTab, selectedCaucusId]);

  if (!isOpen) return null;

  const selectedCaucus = otherCaucuses.find(c => c.id === selectedCaucusId) || otherCaucuses[0];
  const caucusDms = (session.caucus_dms || []).filter(d => d.caucus_id === selectedCaucusId);

  // Check if active caucus leader has demanded to "speak to you personally"
  const lastLeaderMsg = [...caucusDms].reverse().find(d => d.sender === 'caucus_leader');
  const isPersonalAudienceRequired = Boolean(
    lastLeaderMsg && 
    (lastLeaderMsg.requires_personal_response === 1 || lastLeaderMsg.requires_personal_response === true) && 
    !lastLeaderMsg.personal_response_submitted
  );
  const activePersonalPrompt = isPersonalAudienceRequired ? lastLeaderMsg?.personal_prompt : null;

  // Send message to Chief of Staff (can include directives to reach out to caucus leaders)
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

  // Send Direct Message or Personal Prompt Response to AI Caucus Leader
  const handleSendCaucusDm = async (customText?: string) => {
    const textToSend = customText || dmInputText;
    if (!textToSend.trim() || isDmLoading || !selectedCaucus) return;

    setIsDmLoading(true);
    setDmInputText('');

    try {
      const res = await api.sendCaucusDm(
        session.id,
        selectedCaucus.id,
        textToSend.trim(),
        isPersonalAudienceRequired,
        activePersonalPrompt
      );

      if (res.deal_notification) {
        alert(res.deal_notification);
      }
      onRefreshSession();
    } catch (err: any) {
      alert(err.message || 'Failed to send direct message to caucus leader');
    } finally {
      setIsDmLoading(false);
    }
  };

  const toggleThink = (key: string | number) => {
    setExpandedThinks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Render message content with <think>...</think> accordion
  const renderMessageContent = (content: string, keyId: string | number, speakerTitle: string) => {
    const thinkMatch = content.match(/<think>([\s\S]*?)<\/think>/);
    let reasoning = thinkMatch ? thinkMatch[1].trim() : null;
    let mainBody = content.replace(/<think>[\s\S]*?<\/think>/, '').trim();

    const isExpanded = !!expandedThinks[keyId];

    return (
      <div className="space-y-3">
        {mainBody && (
          <div className="flex items-center justify-between pb-1.5 border-b border-stone-800/80">
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
              {speakerTitle}
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
              onClick={() => toggleThink(keyId)}
              className="w-full px-3.5 py-2.5 flex items-center justify-between bg-amber-950/30 hover:bg-amber-950/50 text-amber-300 border-b border-amber-900/30 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center space-x-2">
                <Brain className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span className="font-bold tracking-wide uppercase text-[11px] font-sans">
                  Tactical Calculus & Thinking (v4-pro)
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-900/40 border border-amber-700/40 text-amber-300">
                  Autonomous AI
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
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-stone-900 border-l border-stone-800 shadow-2xl flex flex-col font-sans">
      
      {/* Drawer Header with Dual Navigation Tabs */}
      <div className="border-b border-stone-800 bg-stone-950">
        <div className="px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-950 border border-amber-600/40 flex items-center justify-center text-amber-400">
              {activeTab === 'advisor' ? <Users className="w-5 h-5" /> : <MessageSquare className="w-5 h-5 text-cyan-400" />}
            </div>
            <div>
              <h3 className="font-bold text-sm text-stone-100 font-serif">
                {activeTab === 'advisor' ? 'Office Chief of Staff' : 'Cloakroom DMs: AI Caucus Leaders'}
              </h3>
              <p className="text-[11px] text-amber-400/90 font-mono">
                {activeTab === 'advisor' 
                  ? 'Statutory Drafting • Whip Counts • Aide Diplomatic Outreach' 
                  : 'Direct 1-on-1 Negotiations with Autonomous AI Leaders'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-t border-stone-800/80 px-5 pt-1 bg-stone-950">
          <button
            onClick={() => setActiveTab('advisor')}
            className={`px-4 py-2.5 text-xs font-bold font-sans uppercase tracking-wider border-b-2 transition-all flex items-center space-x-2 ${
              activeTab === 'advisor'
                ? 'border-amber-500 text-amber-300 bg-amber-950/20'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Chief of Staff Desk</span>
          </button>

          <button
            onClick={() => setActiveTab('dms')}
            className={`px-4 py-2.5 text-xs font-bold font-sans uppercase tracking-wider border-b-2 transition-all flex items-center space-x-2 ${
              activeTab === 'dms'
                ? 'border-cyan-500 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Cloakroom DMs</span>
            {otherCaucuses.some(c => c.pending_personal_demand) && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            )}
          </button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* TAB 1: CHIEF OF STAFF DESK (Advisor & Facilitated Outreach)         */}
      {/* =================================================================== */}
      {activeTab === 'advisor' && (
        <div className="flex-1 flex flex-col overflow-hidden">
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
                    renderMessageContent(msg.content, idx, 'Chief of Staff Briefing')
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
            {otherCaucuses.slice(0, 2).map(c => (
              <button
                key={c.id}
                onClick={() => handleSendMessage(`Reach out to ${c.leader} on behalf of our office and ask if they will support our priority legislation`)}
                className="shrink-0 px-3 py-1.5 rounded-full bg-stone-800 hover:bg-cyan-950/40 hover:border-cyan-700/50 border border-stone-700 text-stone-300 hover:text-cyan-200 text-[11px] flex items-center space-x-1.5 transition-all"
              >
                <Handshake className="w-3 h-3 text-cyan-400" />
                <span>Contact {c.leader.split(' ').slice(-1)[0]}</span>
              </button>
            ))}

            <button
              onClick={() => handleSendMessage("Please draft an Affordable Prescription Drugs & Hospital Nurse Staffing Bill")}
              className="shrink-0 px-3 py-1.5 rounded-full bg-stone-800 hover:bg-amber-950/40 hover:border-amber-700/50 border border-stone-700 text-stone-300 hover:text-amber-200 text-[11px] flex items-center space-x-1.5 transition-all"
            >
              <FileText className="w-3 h-3 text-amber-400" />
              <span>Draft Healthcare Bill</span>
            </button>

            <button
              onClick={() => handleSendMessage("Get a floor whip vote count on our active bills")}
              className="shrink-0 px-3 py-1.5 rounded-full bg-stone-800 hover:bg-amber-950/40 hover:border-amber-700/50 border border-stone-700 text-stone-300 hover:text-amber-200 text-[11px] flex items-center space-x-1.5 transition-all"
            >
              <Vote className="w-3 h-3 text-cyan-400" />
              <span>Run Whip Count</span>
            </button>
          </div>

          {/* Advisor Input Form */}
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
                placeholder="Instruct Chief of Staff (e.g. 'Reach out to Arthur Pendelton on our behalf' or 'Draft a bill')..."
                className="flex-1 px-4 py-2.5 bg-stone-900 border border-stone-800 rounded-xl text-stone-100 text-xs sm:text-sm focus:outline-none focus:border-amber-500 placeholder:text-stone-500"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isLoading}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-stone-950 font-bold rounded-xl transition-colors flex items-center justify-center cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: CLOAKROOM DMS (Direct Message with AI Caucus Leaders)        */}
      {/* =================================================================== */}
      {activeTab === 'dms' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          
          {/* Caucus Leader Horizontal Carousel Selector */}
          <div className="px-4 py-3 bg-stone-950 border-b border-stone-800 flex items-center space-x-2.5 overflow-x-auto no-scrollbar">
            {otherCaucuses.map(c => {
              const isSelected = c.id === selectedCaucusId;
              const hasDemand = !!c.pending_personal_demand;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCaucusId(c.id)}
                  className={`shrink-0 px-3 py-2 rounded-xl border text-left transition-all flex items-center space-x-2.5 cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-950/60 border-cyan-500 text-stone-100 ring-1 ring-cyan-500/50'
                      : 'bg-stone-900/80 border-stone-800 text-stone-400 hover:border-stone-700'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-stone-800 border border-stone-700 flex items-center justify-center text-xs font-bold text-amber-400 shrink-0">
                    {c.leader.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="text-left">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-xs text-stone-200 line-clamp-1">{c.leader}</span>
                      {hasDemand && (
                        <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" title="Requires direct personal response" />
                      )}
                    </div>
                    <div className="text-[10px] text-stone-400 line-clamp-1">
                      {c.name} • {c.member_count} seats
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Caucus Leader Profile Bar */}
          {selectedCaucus && (
            <div className="px-5 py-3 bg-stone-950/70 border-b border-stone-800/80 flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="font-bold text-sm text-stone-100 font-serif leading-none">
                    {selectedCaucus.leader}
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-cyan-950 border border-cyan-700/50 text-cyan-300 flex items-center space-x-1">
                    <Bot className="w-3 h-3 text-cyan-400" />
                    <span>Autonomous AI (v4-pro)</span>
                  </span>
                </div>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Leader of the <strong className="text-stone-300">{selectedCaucus.name}</strong> • Commands <strong className="text-amber-400 font-mono">{selectedCaucus.member_count} locked votes</strong>
                </p>
              </div>

              <div className="text-right text-[10px] font-mono text-stone-400">
                <span className="block capitalize">Ideology: {selectedCaucus.ideology}</span>
              </div>
            </div>
          )}

          {/* Direct Message Thread Scroll Area */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            {caucusDms.length > 0 ? (
              caucusDms.map((dm, idx) => {
                const isUser = dm.sender === 'user';
                const isAide = dm.sender === 'advisor';
                const isLeader = dm.sender === 'caucus_leader';

                return (
                  <div
                    key={dm.id || idx}
                    className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl p-4 ${
                        isUser
                          ? 'bg-amber-600 text-stone-950 font-medium rounded-tr-none'
                          : isAide
                          ? 'bg-stone-900 border border-stone-700 text-stone-300 rounded-tl-none'
                          : 'bg-stone-950 border border-stone-800 text-stone-100 rounded-tl-none shadow-md'
                      }`}
                    >
                      <div className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-75 flex items-center justify-between gap-2">
                        <span>
                          {isUser 
                            ? `${session.politician_name} (Direct Personal)` 
                            : isAide 
                            ? 'Chief of Staff (Aide Dispatch)' 
                            : `${selectedCaucus?.leader} (Autonomous AI)`}
                        </span>
                        <span className="text-[9px] font-mono opacity-60">Month {dm.created_month || 1}</span>
                      </div>

                      {isUser || isAide ? (
                        <div className="text-xs sm:text-sm whitespace-pre-wrap">{dm.content}</div>
                      ) : (
                        renderMessageContent(dm.content, `dm_${idx}`, `${selectedCaucus?.leader} Caucus Reaction`)
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 text-stone-500 text-xs space-y-2">
                <p>No messages exchanged with {selectedCaucus?.leader} yet.</p>
                <p className="text-[11px] text-stone-600 font-mono">
                  Send a direct message or have your Chief of Staff make an inquiry.
                </p>
              </div>
            )}

            {isDmLoading && (
              <div className="flex justify-start">
                <div className="bg-stone-950 border border-cyan-800/40 rounded-2xl rounded-tl-none p-4 max-w-[85%] text-xs text-cyan-300 flex items-center space-x-3">
                  <Brain className="w-4 h-4 animate-spin text-cyan-400" />
                  <span>{selectedCaucus?.leader} is calculating caucus math & formulating reply...</span>
                </div>
              </div>
            )}

            <div ref={dmEndRef} />
          </div>

          {/* Highlighted Banner: Leader Demands Personal Response */}
          {isPersonalAudienceRequired && (
            <div className="px-5 py-3.5 bg-amber-950/70 border-t-2 border-b border-amber-500 shadow-xl space-y-2">
              <div className="flex items-center space-x-2 text-amber-300 font-bold text-xs uppercase tracking-wider font-mono">
                <ShieldAlert className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
                <span>Personal Cloakroom Audience Demanded</span>
              </div>
              <p className="text-xs text-stone-200 font-serif italic border-l-2 border-amber-500 pl-3 py-1">
                "{activePersonalPrompt}"
              </p>
              <div className="text-[10px] text-amber-400/90 font-sans">
                ⚠️ {selectedCaucus?.leader} has refused staff intermediaries. You must respond using <strong>only your own words</strong> as if speaking directly to the leader.
              </div>
            </div>
          )}

          {/* DM Input Form */}
          <div className="p-4 border-t border-stone-800 bg-stone-950">
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSendCaucusDm();
              }}
              className="flex items-center space-x-2"
            >
              <input
                type="text"
                value={dmInputText}
                onChange={e => setDmInputText(e.target.value)}
                placeholder={
                  isPersonalAudienceRequired
                    ? `Respond directly to ${selectedCaucus?.leader} (Your own words only)...`
                    : `Direct message ${selectedCaucus?.leader}...`
                }
                className={`flex-1 px-4 py-2.5 bg-stone-900 border rounded-xl text-stone-100 text-xs sm:text-sm focus:outline-none placeholder:text-stone-500 ${
                  isPersonalAudienceRequired 
                    ? 'border-amber-500 focus:border-amber-400 ring-1 ring-amber-500/50' 
                    : 'border-stone-800 focus:border-cyan-500'
                }`}
              />
              <button
                type="submit"
                disabled={!dmInputText.trim() || isDmLoading}
                className={`px-4 py-2.5 font-bold rounded-xl transition-colors flex items-center justify-center cursor-pointer ${
                  isPersonalAudienceRequired
                    ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-lg'
                    : 'bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-stone-950'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>
      )}

    </div>
  );
};

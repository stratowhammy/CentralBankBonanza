import React, { useState, useEffect, useRef } from 'react';
import { GameSession, AdvisorMessage, PolicyProposal, MediaBlitz } from '../../types';
import { api } from '../../api';
import { 
  X, 
  MessageSquare, 
  Send, 
  FileText, 
  Megaphone, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  Vote, 
  Building2, 
  Sparkles,
  Bot
} from 'lucide-react';

interface AdvisorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  session: GameSession;
  onStateUpdated: (newState: any) => void;
}

export const AdvisorDrawer: React.FC<AdvisorDrawerProps> = ({
  isOpen,
  onClose,
  session,
  onStateUpdated
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'policy' | 'media'>('chat');

  // Chat state
  const [messages, setMessages] = useState<AdvisorMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Policy submission state
  const [rawIdea, setRawIdea] = useState('');
  const [targetSector, setTargetSector] = useState('banking');
  const [submittingPolicy, setSubmittingPolicy] = useState(false);
  const [recentPolicyResult, setRecentPolicyResult] = useState<any | null>(null);

  // Media Blitz state
  const [targetAudience, setTargetAudience] = useState<'wall_street' | 'main_street' | 'parliament' | 'foreign_fx'>('main_street');
  const [strategicMessage, setStrategicMessage] = useState('Reassure on Long-Term Price Discipline and Purchasing Power Stability');
  const [launchingBlitz, setLaunchingBlitz] = useState(false);
  const [recentBlitzResult, setRecentBlitzResult] = useState<any | null>(null);

  // Load chat messages when opening
  useEffect(() => {
    if (isOpen) {
      api.getAdvisorMessages(session.id)
        .then(res => setMessages(res.messages || []))
        .catch(() => {});
    }
  }, [isOpen, session.id]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  const handleSendChat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || sendingChat) return;

    const userText = inputMessage.trim();
    setInputMessage('');
    setSendingChat(true);

    const newMsgs = [...messages, { sender: 'user' as const, content: userText }];
    setMessages(newMsgs);

    try {
      const res = await api.sendAdvisorChat(session.id, userText);
      setMessages([...newMsgs, { sender: 'advisor', content: res.reply }]);
    } catch (err: any) {
      setMessages([...newMsgs, { sender: 'advisor', content: 'Apologies, Governor. My secure line experienced static. Let us reconsider the issue.' }]);
    } finally {
      setSendingChat(false);
    }
  };

  const handleQuickPrompt = (promptText: string) => {
    setInputMessage(promptText);
  };

  const handleSubmitPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawIdea.trim() || submittingPolicy) return;

    setSubmittingPolicy(true);
    setRecentPolicyResult(null);

    try {
      const res = await api.submitPolicyIdea(session.id, rawIdea.trim(), targetSector);
      setRecentPolicyResult(res.policy);
      if (res.updated_state) {
        onStateUpdated(res.updated_state);
      }
      setRawIdea('');
    } catch (err: any) {
      alert(err.message || 'Policy submission failed');
    } finally {
      setSubmittingPolicy(false);
    }
  };

  const handleLaunchBlitz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (launchingBlitz) return;

    setLaunchingBlitz(true);
    setRecentBlitzResult(null);

    try {
      const res = await api.launchMediaBlitz(session.id, targetAudience, strategicMessage);
      setRecentBlitzResult(res.media_blitz);
      if (res.updated_state) {
        onStateUpdated(res.updated_state);
      }
    } catch (err: any) {
      alert(err.message || 'Media blitz failed');
    } finally {
      setLaunchingBlitz(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm">
      <div className="w-full max-w-xl h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-prestige font-bold text-sm text-slate-100">
                  Chief of Staff & Economic Advisor
                </h3>
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              </div>
              <p className="text-xs text-slate-400">
                Special Counsel on Markets, Global Finance & Parliament
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 gap-1 p-2 bg-slate-950 border-b border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('chat')}
            className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'chat'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Advisory Chat</span>
          </button>

          <button
            onClick={() => setActiveTab('policy')}
            className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'policy'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Vote className="w-3.5 h-3.5" />
            <span>Parliament Reform</span>
          </button>

          <button
            onClick={() => setActiveTab('media')}
            className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'media'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>Media Blitz</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          
          {/* =========================================
              TAB 1: ADVISORY CHAT
             ========================================= */}
          {activeTab === 'chat' && (
            <div className="flex flex-col h-full justify-between">
              
              {/* Message Feed */}
              <div className="space-y-3.5 overflow-y-auto mb-4 pr-1">
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs space-y-2">
                    <p className="font-editorial text-sm italic text-slate-300">
                      "I am at your service, Governor. Inquire about interest rate calibration, inflation expectations, market fragility, or parliamentary mood."
                    </p>
                  </div>
                ) : (
                  messages.map((m, idx) => (
                    <div
                      key={idx}
                      className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                        m.sender === 'user'
                          ? 'bg-amber-500/20 text-amber-100 border border-amber-500/30 rounded-tr-none'
                          : 'bg-slate-950/80 text-slate-200 border border-slate-800 rounded-tl-none font-editorial text-sm'
                      }`}>
                        {m.content}
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1 px-1">
                        {m.sender === 'user' ? 'Governor' : 'Chief of Staff'}
                      </span>
                    </div>
                  ))
                )}
                {sendingChat && (
                  <div className="flex items-center gap-2 text-xs text-slate-400 italic">
                    <div className="w-2 h-2 rounded-full bg-indigo-400 animate-ping"></div>
                    <span>Chief of Staff analyzing economic telemetry...</span>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Quick Prompt Suggestions */}
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'What does the Taylor Rule indicate?',
                    'Are we risking a wage-price spiral?',
                    'How vulnerable is the banking sector?',
                    'How can we improve Parliamentary confidence?'
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => handleQuickPrompt(chip)}
                      className="text-[10px] px-2 py-1 rounded-full bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors cursor-pointer"
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                {/* Input Bar */}
                <form onSubmit={handleSendChat} className="flex gap-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask your advisor for counsel or scenario analysis..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-400"
                  />
                  <button
                    type="submit"
                    disabled={sendingChat || !inputMessage.trim()}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>

            </div>
          )}

          {/* =========================================
              TAB 2: SUBMIT POLICY TO PARLIAMENT
             ========================================= */}
          {activeTab === 'policy' && (
            <div className="space-y-6">
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 text-xs space-y-1.5 text-slate-300">
                <h4 className="font-bold text-slate-100 flex items-center gap-1.5">
                  <Vote className="w-4 h-4 text-purple-400" />
                  <span>Legislative Proposal to Parliament</span>
                </h4>
                <p>
                  As Central Bank Chair, you cannot legislate directly, but you can send formal statutory policy proposals to Parliament. Your advisor will draft the statutory language and lobby lawmakers for a roll-call vote.
                </p>
                <div className="text-[11px] text-slate-400 font-mono mt-1">
                  Current Parliamentary Confidence: <strong className="text-purple-300">{session.economic_state.parliamentary_approval}%</strong> (Needs 51 votes to pass)
                </div>
              </div>

              {/* Recent Result Banner */}
              {recentPolicyResult && (
                <div className={`p-4 rounded-xl border ${
                  recentPolicyResult.status === 'passed'
                    ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-200'
                    : 'bg-rose-950/30 border-rose-500/50 text-rose-200'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs uppercase tracking-wider">
                      {recentPolicyResult.status === 'passed' ? 'Legislation Enacted by Parliament!' : 'Bill Defeated in Parliamentary Division'}
                    </span>
                    <span className="font-mono text-xs font-bold">
                      {recentPolicyResult.parliament_vote_for} Ayes / {recentPolicyResult.parliament_vote_against} Noes
                    </span>
                  </div>
                  <h5 className="font-bold text-sm text-slate-100 mt-1">{recentPolicyResult.title}</h5>
                  <p className="text-xs text-slate-300 font-editorial mt-1 italic">
                    "{recentPolicyResult.refined_legislation}"
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmitPolicy} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Target Policy Sector
                  </label>
                  <select
                    value={targetSector}
                    onChange={(e) => setTargetSector(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-400"
                  >
                    <option value="banking">Commercial Banking & Credit Liquidity</option>
                    <option value="housing">Shelter, Mortgages & Housing Affordability</option>
                    <option value="green_transition">Green Transition & Energy Independence</option>
                    <option value="general">Consumer Welfare & Digital Inclusion</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Your Policy Idea (Raw Concept)
                  </label>
                  <textarea
                    value={rawIdea}
                    onChange={(e) => setRawIdea(e.target.value)}
                    rows={3}
                    placeholder="e.g. 'Mandate a 2.5% counter-cyclical capital buffer surcharge on tier-1 banks to cool excessive lending' or 'Cap second-home mortgage deductions to lower home prices'..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-400 placeholder:text-slate-600"
                    required
                  />
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Counter-Cyclical Bank Reserve Surcharge',
                    'Emergency Subsidized Mortgage Refinancing Window',
                    'Sovereign Green Bond Purchasing Facility',
                    'Cap Commercial Bank Interbank Surcharges'
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setRawIdea(preset)}
                      className="text-[10px] px-2 py-1 rounded bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 cursor-pointer"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={submittingPolicy || !rawIdea.trim()}
                  className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-purple-950/40"
                >
                  {submittingPolicy ? 'Lobbying Parliament...' : 'Refine & Submit Bill to Parliament'}
                </button>
              </form>
            </div>
          )}

          {/* =========================================
              TAB 3: STRATEGIC MEDIA BLITZ
             ========================================= */}
          {activeTab === 'media' && (
            <div className="space-y-6">
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 text-xs space-y-1.5 text-slate-300">
                <h4 className="font-bold text-slate-100 flex items-center gap-1.5">
                  <Megaphone className="w-4 h-4 text-amber-400" />
                  <span>Strategic Communications Offensive</span>
                </h4>
                <p>
                  Deploy your press bureau and economic surrogates on a high-intensity media blitz. Tailor your message to an exact audience to anchor expectations or calm market panics.
                </p>
              </div>

              {recentBlitzResult && (
                <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/40 text-xs space-y-2">
                  <span className="font-bold uppercase tracking-wider text-amber-300 text-[10px]">
                    Media Blitz Completed
                  </span>
                  <p className="text-slate-200 font-editorial italic">
                    "{recentBlitzResult.public_response}"
                  </p>
                  <p className="text-amber-300 font-medium font-mono text-[11px]">
                    Impact: {recentBlitzResult.impact_summary}
                  </p>
                </div>
              )}

              <form onSubmit={handleLaunchBlitz} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Target Strategic Audience
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { id: 'wall_street', label: 'Wall Street Desks', desc: 'Soothes stock multiples & 2Y yields' },
                      { id: 'main_street', label: 'Main Street Consumers', desc: 'Boosts consumer confidence' },
                      { id: 'parliament', label: 'Parliament Select Committee', desc: 'Restores lawmaker approval' },
                      { id: 'foreign_fx', label: 'Overseas FX Traders', desc: 'Strengthens currency & 10Y yield' }
                    ].map((aud) => (
                      <div
                        key={aud.id}
                        onClick={() => setTargetAudience(aud.id as any)}
                        className={`cursor-pointer rounded-xl p-3 border transition-all ${
                          targetAudience === aud.id
                            ? 'bg-amber-500/15 border-amber-500/60 text-amber-300'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <span className="font-bold block text-slate-200">{aud.label}</span>
                        <span className="text-[10px] text-slate-400">{aud.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Strategic Message Directive
                  </label>
                  <select
                    value={strategicMessage}
                    onChange={(e) => setStrategicMessage(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                  >
                    <option value="Reassure on Long-Term Price Discipline and Purchasing Power Stability">
                      Reassure on Price Discipline & Purchasing Power
                    </option>
                    <option value="Project Decisive Hawkish Strength Against Emerging Inflation Expectations">
                      Project Decisive Hawkish Strength
                    </option>
                    <option value="Highlight Labor Market Resilience and Sound Banking Liquidity Buffers">
                      Highlight Real Economy Resilience & Banking Strength
                    </option>
                    <option value="Call for Parliamentary Fiscal Budget Restraint and Structural Supply Investment">
                      Call on Parliament for Fiscal Budget Restraint
                    </option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={launchingBlitz}
                  className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-amber-950/40"
                >
                  {launchingBlitz ? 'Mobilizing Press Bureaus...' : 'Authorize Nationwide Media Blitz'}
                </button>
              </form>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

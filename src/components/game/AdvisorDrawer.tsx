import React, { useState, useEffect, useRef } from 'react';
import { GameSession, AdvisorMessage, PolicyProposal, MediaBlitz } from '../../types';
import { api } from '../../api';
import { FormattedAdvisorMessage } from './FormattedAdvisorMessage';
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

const sectorLabelMap: Record<string, string> = {
  banking: 'Commercial Banking & Credit Liquidity',
  housing: 'Shelter, Mortgages & Housing Affordability',
  pensions: 'Pensions, Retirement & Demographic Solvency',
  fiscal: 'Fiscal Discipline & Sovereign Debt Stabilization',
  green_transition: 'Green Transition & Energy Independence',
  labor: 'Labor Market Productivity & Real Purchasing Power',
  trade: 'Strategic Trade & Supply Chain Resilience',
  infrastructure: 'Critical Infrastructure & Tech Modernization',
  general: 'Consumer Welfare & Structural Reform'
};

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
  const inputRef = useRef<HTMLInputElement>(null);

  // Mobile virtual keyboard & visual viewport height tracking
  const [visualHeight, setVisualHeight] = useState<number | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState<number>(0);

  useEffect(() => {
    if (!isOpen) return;

    const handleViewport = () => {
      if (window.visualViewport) {
        const vv = window.visualViewport;
        setVisualHeight(vv.height);
        const kbHeight = Math.max(0, window.innerHeight - (vv.height + vv.offsetTop));
        setKeyboardHeight(kbHeight);
      }
    };

    handleViewport();

    window.visualViewport?.addEventListener('resize', handleViewport);
    window.visualViewport?.addEventListener('scroll', handleViewport);
    window.addEventListener('resize', handleViewport);

    return () => {
      window.visualViewport?.removeEventListener('resize', handleViewport);
      window.visualViewport?.removeEventListener('scroll', handleViewport);
      window.removeEventListener('resize', handleViewport);
    };
  }, [isOpen]);

  const handleInputFocus = () => {
    // Delay slightly to allow the virtual keyboard animation to complete
    setTimeout(() => {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.scrollIntoView({ block: 'nearest' });
    }, 250);
  };

  // Policy submission state
  const [rawIdea, setRawIdea] = useState('');
  const [targetSector, setTargetSector] = useState('banking');
  const [submittingPolicy, setSubmittingPolicy] = useState(false);

  // Media Blitz state
  const [targetAudience, setTargetAudience] = useState<'wall_street' | 'main_street' | 'parliament' | 'foreign_fx'>('main_street');
  const [strategicMessage, setStrategicMessage] = useState('Reassure on Long-Term Price Discipline and Purchasing Power Stability');
  const [launchingBlitz, setLaunchingBlitz] = useState(false);

  // Historical records for Parliament Reform and Media Blitz
  const [policies, setPolicies] = useState<PolicyProposal[]>([]);
  const [mediaBlitzes, setMediaBlitzes] = useState<MediaBlitz[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchActionsHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await api.getAdvisorActionsHistory(session.id);
      setPolicies(res.policies || []);
      setMediaBlitzes(res.media_blitzes || []);
    } catch {
      if (session.policies) setPolicies(session.policies);
      if (session.media_blitzes) setMediaBlitzes(session.media_blitzes);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Load chat messages and action histories when opening
  useEffect(() => {
    if (isOpen) {
      api.getAdvisorMessages(session.id)
        .then(res => setMessages(res.messages || []))
        .catch(() => {});
      fetchActionsHistory();
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
      const res = await api.sendAdvisorChat(session.id, userText, session.economic_state.interest_rate);
      setMessages([...newMsgs, { sender: 'advisor', content: res.reply }]);
      if (res.updated_state) {
        onStateUpdated(res.updated_state);
      }
      if (res.policy) {
        setPolicies(prev => [res.policy, ...prev.filter(p => p.id !== res.policy.id)]);
      }
      if (res.media_blitz) {
        setMediaBlitzes(prev => [res.media_blitz, ...prev.filter(b => b.id !== res.media_blitz.id)]);
      }
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

    try {
      const res = await api.submitPolicyIdea(session.id, rawIdea.trim(), targetSector);
      setPolicies(prev => [res.policy, ...prev.filter(p => p.id !== res.policy.id)]);
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

    try {
      const res = await api.launchMediaBlitz(session.id, targetAudience, strategicMessage);
      setMediaBlitzes(prev => [res.media_blitz, ...prev.filter(b => b.id !== res.media_blitz.id)]);
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
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-stretch md:justify-end bg-slate-950/75 backdrop-blur-sm">
      <div 
        style={{
          maxHeight: visualHeight ? `${visualHeight}px` : undefined,
          height: visualHeight ? `${visualHeight}px` : undefined,
          transform: keyboardHeight > 0 ? `translateY(-${keyboardHeight}px)` : undefined
        }}
        className="w-full max-w-xl h-[88vh] md:h-full bg-slate-900 border-t md:border-t-0 md:border-l border-slate-800 rounded-t-[7vw] md:rounded-none shadow-2xl flex flex-col overflow-hidden transition-all duration-150"
      >
        
        {/* Android Native Drag Handle (mobile only) */}
        <div className="md:hidden w-[11vw] h-[0.55vh] min-h-[4px] rounded-full bg-slate-600/50 mx-auto my-[1.2vh] flex-shrink-0" />

        {/* Header */}
        <div className="px-5 py-3 md:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
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

        {/* =========================================
            TAB 1: ADVISORY CHAT (Pinned Real-Time Input)
           ========================================= */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-slate-900">
            
            {/* Live Mandate Telemetry Briefing Strip */}
            <div className="px-4 pt-3 pb-1 flex-shrink-0">
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs flex items-center justify-between shadow-sm">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                      Live Telemetry (Year {session.current_year}, Month {session.current_month})
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-300 font-medium">
                    {session.month_in_quarter === 3 ? 'MPC Meeting Month' : `Quarter ${session.current_quarter}, Month ${session.month_in_quarter} of 3`}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase block">Policy Rate</span>
                    <span className="font-mono text-amber-300 font-bold">{session.economic_state.interest_rate.toFixed(2)}%</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase block">Headline CPI</span>
                    <span className="font-mono text-emerald-400 font-bold">{session.economic_state.inflation_cpi.toFixed(2)}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Message Feed (Scrollable) */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3.5 min-h-0">
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
                    <div className={`max-w-[92%] md:max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                      m.sender === 'user'
                        ? 'bg-amber-500/20 text-amber-100 border border-amber-500/30 rounded-tr-none'
                        : 'bg-slate-950/90 text-slate-200 border border-slate-800/90 rounded-tl-none shadow-md'
                    }`}>
                      <FormattedAdvisorMessage content={m.content} isUser={m.sender === 'user'} />
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

            {/* Pinned Bottom Bar: Quick Chips & Real-Time Input Form */}
            <div className={`px-4 pt-2.5 bg-slate-950 border-t border-slate-800/90 flex-shrink-0 transition-all ${
              keyboardHeight > 0 ? 'pb-2' : 'pb-[calc(var(--android-system-bar-inset,24px)+1vh)] md:pb-3'
            }`}>
              {/* Quick Prompt Suggestions */}
              <div className="flex flex-wrap gap-1.5 mb-2">
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
                    className="text-[10px] px-2 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors cursor-pointer"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Input Bar Form */}
              <form onSubmit={handleSendChat} className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onFocus={handleInputFocus}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask your advisor for counsel or scenario analysis..."
                  className="flex-1 bg-slate-900 border border-slate-700 focus:border-indigo-400 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={sendingChat || !inputMessage.trim()}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-indigo-950/50 flex-shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>

          </div>
        )}

        {/* Content Area for Policy and Media tabs */}
        {(activeTab === 'policy' || activeTab === 'media') && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 min-h-0">
          
          {/* =========================================
              TAB 2: SUBMIT POLICY TO PARLIAMENT
             ========================================= */}
          {activeTab === 'policy' && (
            <div className="space-y-6 pb-[calc(var(--android-system-bar-inset)+12vh)] md:pb-0">
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 text-xs space-y-1.5 text-slate-300">
                <h4 className="font-bold text-slate-100 flex items-center gap-1.5">
                  <Vote className="w-4 h-4 text-purple-400" />
                  <span>Statutory Legislative Authority & Parliament Reform</span>
                </h4>
                <p>
                  As Central Bank Chair, you can instruct your Advisor directly in Advisory Chat to draft and submit statutory bills to Parliament (e.g. <em>"Propose the bank capital buffer bill"</em>), or submit a concept below. Your advisor drafts the statutory text and lobbies lawmakers for a division vote.
                </p>
                <div className="text-[11px] text-slate-400 font-mono mt-1">
                  Current Parliamentary Confidence: <strong className="text-purple-300">{session.economic_state.parliamentary_approval}%</strong> (Threshold to pass: 51 votes)
                </div>
              </div>

              {/* Voting Record for Each Bill Proposed */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-xs uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                    <Vote className="w-3.5 h-3.5 text-purple-400" />
                    <span>Parliamentary Voting Record ({policies.length})</span>
                  </h5>
                  <span className="text-[10px] text-slate-500 font-mono">51 Ayes Required to Enact</span>
                </div>

                {policies.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-dashed border-slate-800 text-center text-xs text-slate-500 space-y-1">
                    <p className="font-editorial italic text-slate-400">
                      "No statutory bills have been introduced to Parliament yet."
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Direct your Advisor in Advisory Chat to propose legislation, or draft a bill concept below.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[38vh] overflow-y-auto pr-1">
                    {policies.map((p) => {
                      const isPassed = p.status === 'passed';
                      return (
                        <div
                          key={p.id}
                          className={`p-3.5 rounded-xl border text-xs space-y-2 transition-all ${
                            isPassed
                              ? 'bg-emerald-950/20 border-emerald-500/40 text-slate-200 shadow-sm'
                              : 'bg-rose-950/20 border-rose-500/40 text-slate-300 shadow-sm'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              isPassed
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            }`}>
                              {isPassed ? 'Enacted into Law' : 'Defeated in Division'}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-slate-200">
                                {p.parliament_vote_for} Ayes / {p.parliament_vote_against} Noes
                              </span>
                              {(p.year || p.month) && (
                                <span className="text-[10px] text-slate-400 font-mono">
                                  (Year {p.year}, Month {p.month})
                                </span>
                              )}
                            </div>
                          </div>

                          <div>
                            <h6 className="font-bold text-xs text-slate-100">{p.title}</h6>
                            <span className="text-[10px] text-purple-300 uppercase font-semibold">
                              Sector: {sectorLabelMap[p.target_sector] || p.target_sector.replace('_', ' ')}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-300 font-editorial italic bg-slate-950/60 p-2.5 rounded-lg border border-slate-900 leading-relaxed">
                            "{p.refined_legislation}"
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Manual Draft Form */}
              <div className="pt-2 border-t border-slate-800">
                <h5 className="font-bold text-xs uppercase tracking-wider text-slate-300 mb-3">
                  Draft New Statutory Bill Concept
                </h5>
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
                      <option value="pensions">Pensions, Retirement & Demographic Solvency</option>
                      <option value="fiscal">Fiscal Discipline & Sovereign Debt Stabilization</option>
                      <option value="green_transition">Green Transition & Energy Independence</option>
                      <option value="labor">Labor Market Productivity & Real Purchasing Power</option>
                      <option value="trade">Strategic Trade & Supply Chain Resilience</option>
                      <option value="infrastructure">Critical Infrastructure & Tech Modernization</option>
                      <option value="general">Consumer Welfare & Structural Reform</option>
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
                      placeholder="e.g. 'Incrementally adjust retirement age over 15 years and expand pension reserve' or 'Mandate a 2.5% counter-cyclical capital buffer surcharge on tier-1 banks'..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-400 placeholder:text-slate-600"
                      required
                    />
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Extend Retirement Age & Expand Sovereign Pension Reserve',
                      'Counter-Cyclical Bank Reserve Surcharge',
                      'Emergency Subsidized Mortgage Refinancing Window',
                      'Sovereign Debt Discipline & Deficit Ceiling Accord',
                      'Sovereign Green Bond Purchasing Facility',
                      'Labor Market Productivity & Vocational Training Accord'
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
            </div>
          )}

          {/* =========================================
              TAB 3: STRATEGIC MEDIA BLITZ
             ========================================= */}
          {activeTab === 'media' && (
            <div className="space-y-6 pb-[calc(var(--android-system-bar-inset)+12vh)] md:pb-0">
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 text-xs space-y-1.5 text-slate-300">
                <h4 className="font-bold text-slate-100 flex items-center gap-1.5">
                  <Megaphone className="w-4 h-4 text-amber-400" />
                  <span>Strategic Communications Offensive</span>
                </h4>
                <p>
                  Deploy your press bureau and economic surrogates on a high-intensity media blitz. You can instruct your Advisor directly in Advisory Chat (e.g. <em>"Launch a media blitz to Wall Street reassuring them on price stability"</em>), or authorize a campaign below.
                </p>
              </div>

              {/* Previous Media Campaigns */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-xs uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                    <Megaphone className="w-3.5 h-3.5 text-amber-400" />
                    <span>Previous Media Campaigns ({mediaBlitzes.length})</span>
                  </h5>
                  <span className="text-[10px] text-slate-500 font-mono">Press Bureau Deployments</span>
                </div>

                {mediaBlitzes.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-dashed border-slate-800 text-center text-xs text-slate-500 space-y-1">
                    <p className="font-editorial italic text-slate-400">
                      "No media campaigns have been authorized yet."
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Direct your Advisor in chat or configure a communications campaign below.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[38vh] overflow-y-auto pr-1">
                    {mediaBlitzes.map((b) => {
                      const audienceLabelMap: Record<string, string> = {
                        wall_street: 'Wall Street Desks',
                        main_street: 'Main Street Consumers',
                        parliament: 'Parliament Select Committee',
                        foreign_fx: 'Overseas FX Traders'
                      };
                      return (
                        <div
                          key={b.id}
                          className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-950/15 text-xs space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              {audienceLabelMap[b.target_audience] || b.target_audience}
                            </span>
                            {(b.year || b.month) && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                Year {b.year}, Month {b.month}
                              </span>
                            )}
                          </div>

                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Directive:</span>
                            <p className="text-xs font-semibold text-slate-200">
                              "{b.strategic_message}"
                            </p>
                          </div>

                          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 space-y-1">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Press & Public Reception:</span>
                            <p className="text-xs text-amber-200/90 font-editorial italic">
                              "{b.public_response}"
                            </p>
                            <p className="text-[11px] text-amber-300 font-mono pt-1">
                              Impact: {b.impact_summary}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Manual Blitz Form */}
              <div className="pt-2 border-t border-slate-800">
                <h5 className="font-bold text-xs uppercase tracking-wider text-slate-300 mb-3">
                  Authorize New Strategic Media Blitz
                </h5>
                <form onSubmit={handleLaunchBlitz} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Target Strategic Audience
                    </label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[
                        { id: 'wall_street', label: 'Wall Street Desks', desc: 'Institutional trading desks, bond dealers & equity analysts' },
                        { id: 'main_street', label: 'Main Street Consumers', desc: 'Working families, mortgage holders & consumer sentiment' },
                        { id: 'parliament', label: 'Parliament Select Committee', desc: 'Cross-party lawmakers & legislative committees' },
                        { id: 'foreign_fx', label: 'Overseas FX Traders', desc: 'International sovereign funds & currency markets' }
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
            </div>
          )}

          </div>
        )}

      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Smartphone, Hand, CheckCircle2, AlertTriangle, ArrowDown, ArrowUp, Sparkles, X } from 'lucide-react';

interface MobileScrollTutorialOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileScrollTutorialOverlay: React.FC<MobileScrollTutorialOverlayProps> = ({
  isOpen,
  onClose
}) => {
  const [dontShowAgain, setDontShowAgain] = useState(true);

  useEffect(() => {
    if (isOpen) {
      // Scroll the guidance button zone into view so the user sees it in the background
      setTimeout(() => {
        const el = document.getElementById('mobile-guidance-scroll-zone');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 250);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDismiss = () => {
    if (dontShowAgain) {
      try {
        localStorage.setItem('cbb_mobile_scroll_guide_seen', 'true');
      } catch (e) {}
    }
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="scroll-guide-title"
    >
      <div className="w-full max-w-sm bg-slate-900 border border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Android drag handle */}
        <div className="w-12 h-1 rounded-full bg-slate-700/60 mx-auto mt-3 mb-1" />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/20 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner flex-shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  Mobile Navigation
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              </div>
              <h3 id="scroll-guide-title" className="text-base font-bold text-slate-100 font-prestige">
                Touch & Scrolling Guide
              </h3>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Close guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto max-h-[72vh] text-xs leading-relaxed">
          
          {/* Note on Interactive Indicators */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 text-amber-200 space-y-1.5 shadow-sm">
            <div className="flex items-center gap-2 font-bold text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>Each Indicator is Interactive!</span>
            </div>
            <p className="text-[11px] text-amber-100/90">
              Every single card on your dashboard (Policy Rate, Inflation, Yields, GDP, Housing, Equities, etc.) responds to touch. Tapping any card opens live graphs or policy tools.
            </p>
            <p className="text-[11px] text-amber-200/80 italic">
              Because almost every card is clickable, dragging your finger directly over the cards can accidentally trigger them instead of scrolling.
            </p>
          </div>

          {/* Solution: Safe Guidance Scroll Zone */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center gap-2 font-bold text-slate-100">
              <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>Where to Place Your Finger to Scroll</span>
            </div>
            <p className="text-[11px] text-slate-300">
              We have expanded the safe padding space around the glowing <strong className="text-amber-300">"Issue Guidance"</strong> button at the top of your dashboard.
            </p>

            {/* Visual Touch Diagram Preview */}
            <div className="bg-slate-900 border border-amber-500/40 rounded-xl p-3 text-center space-y-2 ring-2 ring-amber-400/30">
              <div className="flex items-center justify-between text-[10px] text-amber-400/90 font-mono font-semibold">
                <span>↕️ SAFE TOUCH GUTTER</span>
                <span>FINGER SCROLL ZONE</span>
              </div>
              <div className="py-2 px-3 bg-gradient-to-r from-amber-500/20 via-amber-400/30 to-amber-500/20 border border-amber-400/60 rounded-xl text-amber-200 font-bold text-xs flex items-center justify-center gap-2 shadow-inner">
                <Hand className="w-4 h-4 text-amber-300 animate-bounce" />
                <span>Swipe Up / Down Here</span>
              </div>
              <p className="text-[10px] text-slate-400">
                Touch down on this neutral padding area to scroll the page smoothly without triggering interactive cards.
              </p>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 flex flex-col gap-3">
          <label className="flex items-center gap-2 text-[11px] text-slate-400 select-none cursor-pointer">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-amber-400 w-3.5 h-3.5"
            />
            <span>Don't show this guide on future simulation entries</span>
          </label>

          <button
            onClick={handleDismiss}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-950/40 transition-all active:scale-98 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Got It — Enter Simulation</span>
          </button>
        </div>

      </div>
    </div>
  );
};

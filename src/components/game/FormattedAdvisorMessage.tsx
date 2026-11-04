import React, { useState } from 'react';
import { Brain, ChevronDown, ChevronUp } from 'lucide-react';

interface FormattedAdvisorMessageProps {
  content: string;
  isUser?: boolean;
}

// Tokenizes inline text for **bold**, *italic*, and `code`
function renderInlineText(text: string): React.ReactNode {
  // Regex to match **bold**, *italic*, or `code`
  const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
  const parts = text.split(regex);

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={i} className="font-semibold text-slate-100">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      return (
        <em key={i} className="italic text-slate-300">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code
          key={i}
          className="font-mono text-[11px] bg-slate-800/90 text-indigo-300 px-1.5 py-0.5 rounded border border-slate-700/60"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

export const FormattedAdvisorMessage: React.FC<FormattedAdvisorMessageProps> = ({
  content,
  isUser = false
}) => {
  const [showThinking, setShowThinking] = useState(true);

  if (isUser) {
    return <div className="whitespace-pre-wrap">{content}</div>;
  }

  // Normalize line endings
  const normalized = content.replace(/\r\n/g, '\n');

  // Extract <think>...</think> tag if present
  let thinkingContent: string | null = null;
  let cleanContent = normalized;

  const thinkMatch = normalized.match(/<think>([\s\S]*?)<\/think>/i);
  if (thinkMatch) {
    thinkingContent = thinkMatch[1].trim();
    cleanContent = normalized.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  } else if (normalized.includes('<think>') && !normalized.includes('</think>')) {
    const parts = normalized.split('<think>');
    cleanContent = parts[0].trim();
    thinkingContent = parts.slice(1).join('<think>').trim();
  }

  // Split remaining content into paragraphs / blocks by double newlines
  const rawBlocks = cleanContent ? cleanContent.split(/\n{2,}/) : [];

  return (
    <div className="space-y-3 font-sans text-xs text-slate-200 leading-relaxed">
      {thinkingContent && (
        <div className="mb-3 rounded-xl border border-indigo-500/30 bg-slate-950/80 overflow-hidden shadow-sm transition-all">
          <button
            type="button"
            onClick={() => setShowThinking(!showThinking)}
            className="w-full px-3 py-2 text-left font-mono text-[11px] font-semibold text-indigo-300 hover:text-indigo-200 bg-indigo-950/30 hover:bg-indigo-950/50 border-b border-indigo-500/20 flex items-center justify-between transition-colors cursor-pointer select-none"
          >
            <div className="flex items-center gap-2">
              <Brain className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0 animate-pulse" />
              <span className="tracking-wide">Chief of Staff Thought Process (v4-pro)</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
              <span>{showThinking ? 'Hide Thinking' : 'Show Thinking'}</span>
              {showThinking ? (
                <ChevronUp className="w-3.5 h-3.5 text-indigo-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              )}
            </div>
          </button>
          {showThinking && (
            <div className="p-3 text-[11px] font-mono text-slate-400 bg-slate-950/90 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto border-t border-slate-900/60 selection:bg-indigo-500/30">
              {thinkingContent}
            </div>
          )}
        </div>
      )}

      {rawBlocks.map((block, blockIdx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        const lines = trimmed.split('\n').map(l => l.trim()).filter(Boolean);

        // Check if all or most lines are bullet list items (-, *, •)
        const isBulletList = lines.length > 0 && lines.every(l => /^[-*•]\s+/.test(l));

        if (isBulletList) {
          return (
            <ul key={blockIdx} className="my-2 space-y-1.5 list-none pl-1">
              {lines.map((line, lineIdx) => {
                const itemText = line.replace(/^[-*•]\s+/, '');
                return (
                  <li key={lineIdx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                    <span className="flex-1">{renderInlineText(itemText)}</span>
                  </li>
                );
              })}
            </ul>
          );
        }

        // Check if all lines are numbered list items (1. , 2. )
        const isNumberedList = lines.length > 0 && lines.every(l => /^\d+\.\s+/.test(l));

        if (isNumberedList) {
          return (
            <ol key={blockIdx} className="my-2 space-y-2 list-none pl-0.5">
              {lines.map((line, lineIdx) => {
                const match = line.match(/^(\d+)\.\s+(.*)/);
                const num = match ? match[1] : `${lineIdx + 1}`;
                const itemText = match ? match[2] : line;
                return (
                  <li key={lineIdx} className="flex items-start gap-2">
                    <span className="min-w-[1.25rem] text-[11px] font-mono font-bold text-indigo-400 mt-0.5 flex-shrink-0">
                      {num}.
                    </span>
                    <span className="flex-1">{renderInlineText(itemText)}</span>
                  </li>
                );
              })}
            </ol>
          );
        }

        // Check if block is a blockquote
        if (lines.length > 0 && lines.every(l => l.startsWith('>'))) {
          return (
            <blockquote
              key={blockIdx}
              className="border-l-2 border-indigo-400/70 bg-indigo-950/20 px-3 py-1.5 my-2 rounded-r italic text-slate-300"
            >
              {lines.map((l, i) => (
                <p key={i}>{renderInlineText(l.replace(/^>\s*/, ''))}</p>
              ))}
            </blockquote>
          );
        }

        // Check if block is a heading (### or ## or #)
        if (lines.length === 1 && /^#{1,4}\s+/.test(lines[0])) {
          const headingText = lines[0].replace(/^#{1,4}\s+/, '');
          return (
            <h4
              key={blockIdx}
              className="font-bold text-slate-100 text-xs tracking-wider uppercase text-indigo-300 mt-3 mb-1"
            >
              {renderInlineText(headingText)}
            </h4>
          );
        }

        // Check if single line is bold section title like **Current Summary (Year 4, Month 4):**
        if (lines.length === 1 && lines[0].startsWith('**') && (lines[0].endsWith('**') || lines[0].endsWith('**:'))) {
          return (
            <div
              key={blockIdx}
              className="font-bold text-slate-100 text-xs tracking-wide text-indigo-200 mt-2.5 mb-1 flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-sm bg-indigo-400 inline-block" />
              <span>{renderInlineText(lines[0])}</span>
            </div>
          );
        }

        // Mixed block: contains some regular lines and some bullet points or line breaks
        return (
          <div key={blockIdx} className="space-y-1.5">
            {lines.map((line, lineIdx) => {
              if (/^[-*•]\s+/.test(line)) {
                const itemText = line.replace(/^[-*•]\s+/, '');
                return (
                  <div key={lineIdx} className="flex items-start gap-2 pl-1 my-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                    <span className="flex-1">{renderInlineText(itemText)}</span>
                  </div>
                );
              }
              if (/^\d+\.\s+/.test(line)) {
                const match = line.match(/^(\d+)\.\s+(.*)/);
                const num = match ? match[1] : `${lineIdx + 1}`;
                const itemText = match ? match[2] : line;
                return (
                  <div key={lineIdx} className="flex items-start gap-2 pl-0.5 my-1">
                    <span className="min-w-[1.25rem] text-[11px] font-mono font-bold text-indigo-400 mt-0.5 flex-shrink-0">
                      {num}.
                    </span>
                    <span className="flex-1">{renderInlineText(itemText)}</span>
                  </div>
                );
              }
              return (
                <p key={lineIdx} className="leading-relaxed">
                  {renderInlineText(line)}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

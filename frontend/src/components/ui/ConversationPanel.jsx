import React, { useState } from 'react';
import { Sparkles, HelpCircle, Send, Loader2, Bot, User, Copy, Check } from 'lucide-react';

const inline = (text) =>
  (text || '')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-text-primary">$1</strong>')
    .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-surface-2 text-accent font-data text-[0.85em]">$1</code>');

const isTableRow = (line) => {
  const t = line.trim();
  return t.startsWith('|') && t.endsWith('|') && t.length > 1;
};

const isTableSeparator = (line) =>
  /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(line);

const splitRow = (line) =>
  line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());

const renderMarkdown = (text) => {
  if (!text) return null;
  const lines = text.split('\n');
  const out = [];

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];

    // Comparison table: header row + separator + body rows
    if (isTableRow(line) && idx + 1 < lines.length && isTableSeparator(lines[idx + 1])) {
      const header = splitRow(line);
      const rows = [];
      let j = idx + 2;
      while (j < lines.length && isTableRow(lines[j])) {
        rows.push(splitRow(lines[j]));
        j++;
      }
      out.push(
        <div key={`tbl-${idx}`} className="my-5 overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-surface-2">
                {header.map((h, hi) => (
                  <th key={hi} className="text-left font-bold text-text-primary px-4 py-2.5 border-b border-border"
                      dangerouslySetInnerHTML={{ __html: inline(h) }} />
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri} className={ri % 2 ? 'bg-surface/40' : ''}>
                  {row.map((cell, ci) => (
                    <td key={ci} className="align-top text-text-secondary px-4 py-2.5 border-b border-border/40"
                        dangerouslySetInnerHTML={{ __html: inline(cell) }} />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      idx = j - 1;
      continue;
    }

    const content = inline(line);
    const trimmed = line.trim();

    if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      out.push(
        <li key={idx} className="ml-6 list-disc text-text-secondary mb-2"
            dangerouslySetInnerHTML={{ __html: inline(line.replace(/^[\s]*[*-]\s+/, '')) }} />
      );
    } else if (/^\d+\.\s+/.test(trimmed)) {
      out.push(
        <li key={idx} className="ml-6 list-decimal text-text-secondary mb-2"
            dangerouslySetInnerHTML={{ __html: inline(line.replace(/^\s*\d+\.\s+/, '')) }} />
      );
    } else if (trimmed.startsWith('### ')) {
      out.push(<h4 key={idx} className="text-base font-bold text-text-primary mt-5 mb-2" dangerouslySetInnerHTML={{ __html: inline(trimmed.replace(/^###\s+/, '')) }} />);
    } else if (trimmed.startsWith('## ')) {
      out.push(<h3 key={idx} className="text-lg font-bold text-text-primary mt-6 mb-3 border-b border-border pb-1" dangerouslySetInnerHTML={{ __html: inline(trimmed.replace(/^##\s+/, '')) }} />);
    } else if (trimmed.startsWith('# ')) {
      out.push(<h2 key={idx} className="text-xl font-display font-bold text-text-primary mt-6 mb-3" dangerouslySetInnerHTML={{ __html: inline(trimmed.replace(/^#\s+/, '')) }} />);
    } else if (trimmed === '') {
      out.push(<div key={idx} className="h-2" />);
    } else {
      out.push(<p key={idx} className="text-text-secondary leading-relaxed mb-4" dangerouslySetInnerHTML={{ __html: content }} />);
    }
  }

  return out;
};

function TypingIndicator() {
  return (
    <div className="flex gap-4 items-start">
      <div className="flex items-center justify-center w-10 h-10 rounded-full shrink-0 bg-accent">
        <Bot className="w-5 h-5 text-accent-contrast" />
      </div>
      <div className="flex-1">
        <div className="text-xs font-bold uppercase tracking-wider mb-2 text-accent flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5" />
          AI Analysis
        </div>
        <div className="pv-card p-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConversationPanel({
  conversation,
  query,
  setQuery,
  loading,
  onSend,
  suggestedFollowUps = [],
  onSuggestedFollowUp,
  placeholder = "Ask a follow-up question...",
  title = "Continue Analysis",
  children
}) {
  const [copiedIndex, setCopiedIndex] = useState(null);
  const messagesEndRef = React.useRef(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation, loading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSend) onSend();
  };

  const handleCopy = async (text, idx) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(idx);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Memoize rendered messages so typing in the follow-up input does not
  // re-parse markdown for the entire conversation on every keystroke.
  const renderedMessages = React.useMemo(
    () =>
      conversation.map((msg, idx) => (
        <div key={idx} className="flex gap-4 items-start">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full shrink-0 ${msg.role === 'user' ? 'bg-surface-3' : 'bg-accent'}`}>
            {msg.role === 'user' ? <User className="w-5 h-5 text-text-primary" /> : <Bot className="w-5 h-5 text-accent-contrast" />}
          </div>
          <div className="flex-1">
            <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${msg.role === 'user' ? 'text-text-muted' : 'text-accent'} flex items-center gap-2`}>
              {msg.role === 'assistant' && <Sparkles className="w-3.5 h-3.5" />}
              {msg.role === 'user' ? 'You' : 'AI Analysis'}
              {msg.role === 'assistant' && (
                <button
                  onClick={() => handleCopy(msg.content, idx)}
                  className="ml-auto flex items-center gap-1 text-xs font-medium text-text-muted hover:text-accent transition-colors"
                >
                  {copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedIndex === idx ? 'Copied' : 'Copy'}
                </button>
              )}
            </div>
            <div className="pv-card p-6">
              {renderMarkdown(msg.content)}
            </div>
          </div>
        </div>
      )),
    [conversation, copiedIndex]
  );

  return (
    <div className="space-y-6">
      {children}

      {/* Conversation Flow */}
      <div className="space-y-6">
        {renderedMessages}
        {loading && <TypingIndicator />}
      </div>

      {/* Follow-up Section */}
      <div className="pv-card p-8 border-accent/20 bg-surface/30">
        <h3 className="text-xl font-display font-bold text-text-primary mb-6 flex items-center gap-2">
          <HelpCircle className="text-accent w-6 h-6" />
          {title}
        </h3>

        {/* Suggested Follow-up Chips */}
        {suggestedFollowUps.length > 0 && (
          <div className="mb-6">
            <div className="text-xs font-bold uppercase text-text-muted tracking-widest mb-3">Suggested</div>
            <div className="flex flex-wrap gap-2">
              {suggestedFollowUps.map((followUp, i) => {
                const label = typeof followUp === 'string' ? followUp : followUp.label;
                const prompt = typeof followUp === 'string' ? followUp : followUp.prompt;
                return (
                  <button
                    key={i}
                    onClick={() => onSuggestedFollowUp && onSuggestedFollowUp(prompt)}
                    className="px-4 py-2 border border-border rounded-lg bg-surface hover:border-accent/40 hover:bg-surface-2 transition-colors text-sm font-medium"
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Follow-up Input */}
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="text"
            placeholder={placeholder}
            className="flex-1 pv-field"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            aria-label="Send message"
            aria-busy={loading}
            className="pv-btn-primary disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      </div>

      <div ref={messagesEndRef} />
    </div>
  );
}

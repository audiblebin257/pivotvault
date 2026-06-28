import React from 'react';
import { Sparkles, HelpCircle, Send, Loader2, Bot, User } from 'lucide-react';

const renderMarkdown = (text) => {
  if (!text) return null;
  return text.split('\n').map((line, idx) => {
    let content = line;
    content = content.replace(/\*\*(.*?)\*\*/g, '<strong class="text-text-primary">$1</strong>');
    content = content.replace(/`(.*?)`/g, '<code class="bg-surface-3 border border-border px-1.5 py-0.5 rounded font-mono text-xs text-accent">$1</code>');
    
    if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
      return (
        <li key={idx} className="ml-6 list-disc text-text-secondary mb-2" 
            dangerouslySetInnerHTML={{ __html: content.replace(/^[*-\s]+/, '') }} />
      );
    }
    if (line.trim().startsWith('1. ') || line.trim().startsWith('2. ') || line.trim().startsWith('3. ')) {
      return (
        <li key={idx} className="ml-6 list-decimal text-text-secondary mb-2" 
            dangerouslySetInnerHTML={{ __html: content.replace(/^\d+\.\s+/, '') }} />
      );
    }
    if (line.trim().startsWith('### ')) {
      return <h4 key={idx} className="text-base font-bold text-text-primary mt-5 mb-2" dangerouslySetInnerHTML={{ __html: content.replace(/^###\s+/, '') }} />;
    }
    if (line.trim().startsWith('## ')) {
      return <h3 key={idx} className="text-lg font-bold text-text-primary mt-6 mb-3 border-b border-border pb-1" dangerouslySetInnerHTML={{ __html: content.replace(/^##\s+/, '') }} />;
    }
    return <p key={idx} className="text-text-secondary leading-relaxed mb-4" dangerouslySetInnerHTML={{ __html: content }} />;
  });
};

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
  const messagesEndRef = React.useRef(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSend) onSend();
  };

  return (
    <div className="space-y-6">
      {children}

      {/* Conversation Flow */}
      <div className="space-y-6">
        {conversation.map((msg, idx) => (
          <div key={idx} className="flex gap-4 items-start">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full shrink-0 ${msg.role === 'user' ? 'bg-surface-3' : 'bg-accent'}`}>
              {msg.role === 'user' ? <User className="w-5 h-5 text-text-primary" /> : <Bot className="w-5 h-5 text-accent-contrast" />}
            </div>
            <div className="flex-1">
              <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${msg.role === 'user' ? 'text-text-muted' : 'text-accent'} flex items-center gap-2`}>
                {msg.role === 'assistant' && <Sparkles className="w-3.5 h-3.5" />}
                {msg.role === 'user' ? 'You' : 'AI Analysis'}
              </div>
              <div className="pv-card p-6">
                {renderMarkdown(msg.content)}
              </div>
            </div>
          </div>
        ))}
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
              {suggestedFollowUps.map((followUp, i) => (
                <button
                  key={i}
                  onClick={() => onSuggestedFollowUp && onSuggestedFollowUp(followUp)}
                  className="px-4 py-2 border border-border rounded-lg bg-surface hover:border-accent/40 hover:bg-surface-2 transition-colors text-sm font-medium"
                >
                  {followUp}
                </button>
              ))}
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

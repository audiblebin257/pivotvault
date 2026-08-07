import React from 'react';
import { Send, Loader2, Bot, User, Sparkles, FileSearch } from 'lucide-react';
import { clsx } from 'clsx';
import api from '../../lib/api';

const SUGGESTED_QUESTIONS = [
  'Why did this happen?',
  'Could it have been avoided?',
  'What mistakes were made?',
  'How did investors react?',
  'Explain in simple terms.',
];

const renderLiteMarkdown = (text = '') => {
  // Very light rendering: bold + line breaks (full markdown tables are heavy
  // for an embedded panel; keep responses punchy).
  const parts = text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={i} className="font-semibold text-text-primary">{part.slice(2, -2)}</strong>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    )
  );
  return <p className="whitespace-pre-line text-sm leading-relaxed text-text-secondary">{parts}</p>;
};

const EventChatPanel = ({ event, startupSlug, startupName }) => {
  const [messages, setMessages] = React.useState([]);
  const [input, setInput] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [ragUsed, setRagUsed] = React.useState(false);
  const endRef = React.useRef(null);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Reset the conversation when the selected event changes.
  React.useEffect(() => {
    setMessages([]);
    setRagUsed(false);
    setInput('');
  }, [event?.id]);

  const send = async (text) => {
    const question = (text ?? input).trim();
    if (!question || loading || !event) return;
    setLoading(true);
    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    setInput('');
    try {
      const { data } = await api.post('/ai/event-chat', {
        slug: startupSlug,
        event: {
          id: event.id,
          date: event.date,
          title: event.title,
          description: event.description,
          stage: event.stage,
        },
        message: question,
        history: messages.map((m) => ({ role: m.role, content: m.content })),
      });
      setRagUsed(Boolean(data?.ragUsed));
      setMessages((prev) => [...prev, { role: 'assistant', content: data?.content || 'The timeline analyst could not answer that.' }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'The timeline analyst is unavailable right now. Try rephrasing your question.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-start gap-2.5">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent">
          <Bot className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-accent">Timeline Analyst</p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-text-muted">
            Scoped strictly to <span className="font-semibold text-text-primary">“{event?.title}”</span> — grounded in the
            company timeline and, when available, its own documents (RAG).
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto pr-1">
        {messages.length === 0 && (
          <div className="rounded-xl border border-border/60 bg-surface-2/30 p-4 text-xs leading-relaxed text-text-muted">
            Ask anything about this specific event — why it happened, what was missed, how it compares to other
            failures, or what the financial impact was.
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={clsx('flex gap-2.5', m.role === 'user' && 'flex-row-reverse')}>
            <div
              className={clsx(
                'grid h-7 w-7 shrink-0 place-items-center rounded-full',
                m.role === 'user' ? 'bg-surface-3 text-text-primary' : 'bg-accent text-accent-contrast'
              )}
            >
              {m.role === 'user' ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
            </div>
            <div
              className={clsx(
                'max-w-[85%] rounded-xl px-3.5 py-2.5',
                m.role === 'user' ? 'bg-accent text-accent-contrast' : 'bg-surface-2/60 border border-border/50'
              )}
            >
              {m.role === 'user' ? (
                <p className="text-sm text-accent-contrast">{m.content}</p>
              ) : (
                renderLiteMarkdown(m.content)
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2.5">
            <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent text-accent-contrast">
              <Bot className="h-3.5 w-3.5" />
            </div>
            <div className="flex items-center gap-1.5 rounded-xl bg-surface-2/60 px-3.5 py-2.5 border border-border/50">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
              <span className="text-xs text-text-muted">Analyzing event…</span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* RAG indicator */}
      {ragUsed && (
        <div className="mt-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-success">
          <FileSearch className="h-3.5 w-3.5" />
          Answered with document evidence
        </div>
      )}

      {/* Suggested questions */}
      <div className="mt-4 flex flex-wrap gap-2">
        {SUGGESTED_QUESTIONS.map((q) => (
          <button
            key={q}
            type="button"
            disabled={loading}
            onClick={() => send(q)}
            className="rounded-full border border-border bg-surface-2/60 px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-accent/40 hover:text-accent disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="mt-4 flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          placeholder={`Ask about “${event?.title?.slice(0, 40) || 'this event'}”…`}
          className="pv-field min-h-0 flex-1 !py-2.5 text-sm"
          aria-label="Ask the timeline analyst about this event"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          aria-label="Send question"
          className="pv-btn-primary !h-11 w-11 !px-0 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </form>
    </div>
  );
};
export default EventChatPanel;

import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Search, BookOpen, AlertCircle, ArrowRight, ShieldAlert, HelpCircle, Bot, User, RefreshCw } from 'lucide-react';
import StartupCard from '../components/StartupCard';
import api from '../lib/api';

const AiAssistant = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [conversation, setConversation] = React.useState([]);
  const [error, setError] = React.useState(null);

  const urlQuery = searchParams.get('q') || '';
  const messagesEndRef = React.useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  const executeResearch = async (searchQuery, isFollowUp = false) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError(null);

    const newHistory = isFollowUp
      ? conversation.map(msg => ({ role: msg.role, content: msg.content }))
      : [];

    try {
      const response = await api.post('/ai/research', {
        query: searchQuery,
        history: newHistory
      });

      setConversation(prev => [
        ...prev,
        { role: 'user', content: searchQuery },
        { role: 'assistant', content: response.data.aiSummary, fullResult: response.data }
      ]);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch research analytics. Check backend status.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (urlQuery && conversation.length === 0) {
      setQuery(urlQuery);
      executeResearch(urlQuery);
    }
  }, [urlQuery]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearchParams({ q: query });
    executeResearch(query, conversation.length > 0);
    setQuery('');
  };

  const handleFollowUp = (followUpQuery) => {
    setQuery(followUpQuery);
    executeResearch(followUpQuery, true);
  };

  const resetConversation = () => {
    setConversation([]);
    setQuery('');
    setSearchParams({});
    setError(null);
  };

  const sampleQuestions = [
    "Compare Byju's and Quibi.",
    "Show startups that failed because of poor PMF.",
    "What patterns exist among food delivery startups?",
    "Find startups with broken unit economics."
  ];

  const suggestedFollowUps = [
    "Explain deeper",
    "Show examples",
    "Compare startups",
    "Give recommendations",
    "Generate action plan"
  ];

  // Helper function to render markdown
  const renderMarkdown = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, idx) => {
      let content = line;
      content = content.replace(/\*\*(.*?)\*\*/g, '<strong class="text-text-primary">$1</strong>');
      
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

  return (
    <div className="min-h-screen bg-bg">
      <div className="pv-content-container py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/20 bg-accent/5 text-accent text-[10px] font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            AI Research Assistant
          </div>
          <div className="flex items-center justify-center gap-4 mb-3">
            <h1 className="text-4xl font-display font-bold text-text-primary">AI Research Assistant</h1>
            {conversation.length > 0 && (
              <button
                onClick={resetConversation}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:border-accent/40 hover:bg-surface-2 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="text-sm font-medium">New Chat</span>
              </button>
            )}
          </div>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">Query our failure database, extract insights, and compare strategies semantically.</p>
        </div>

        {/* Search Section */}
        <div className="max-w-3xl mx-auto mb-10">
          <form onSubmit={handleSubmit} className="relative pv-card p-3 flex items-center gap-3">
            <Search className="w-5 h-5 text-text-muted shrink-0 ml-2" />
            <input
              type="text"
              placeholder="Ask anything about startup failures..."
              className="flex-1 bg-transparent border-0 min-h-control px-2 py-2 text-text-primary placeholder:text-text-muted focus:ring-0 text-base"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="pv-btn-primary disabled:opacity-50 shrink-0"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-accent-contrast/30 border-t-accent-contrast rounded-full animate-spin" />
              ) : (
                <>
                  Send
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          </form>

          {/* Example Suggestions */}
          {conversation.length === 0 && !loading && (
            <div className="mt-8">
              <h3 className="text-xs font-bold uppercase text-text-muted tracking-widest mb-4 flex items-center justify-center gap-2">
                <HelpCircle className="w-4 h-4 text-accent" />
                Suggested Research Directions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {sampleQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setQuery(q);
                      setSearchParams({ q });
                      executeResearch(q);
                    }}
                    className="text-left p-5 pv-card-interactive"
                  >
                    <div className="text-xs font-bold uppercase text-accent mb-1">Topic {idx + 1}</div>
                    <div className="text-text-primary font-medium">{q}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="max-w-4xl mx-auto py-16 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-surface-3 border-t-accent rounded-full animate-spin" />
              <div className="text-lg font-data text-accent">Researching...</div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="max-w-md mx-auto pv-card p-6 border-danger/30 bg-danger/5 mt-12">
            <AlertCircle className="w-8 h-8 text-danger mx-auto mb-4" />
            <p className="text-center text-text-primary font-semibold mb-3">{error}</p>
            <div className="flex justify-center">
              <button 
                onClick={() => executeResearch(query)}
                className="pv-btn-secondary"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Result Presentation */}
        {conversation.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-5xl mx-auto"
          >
            {/* Conversation Flow */}
            <div className="space-y-6 mb-10">
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

                    {/* Show additional data only for the last assistant message */}
                    {msg.role === 'assistant' && idx === conversation.length - 1 && msg.fullResult && (
                      <div className="mt-6 space-y-6">
                        {/* Timeline Comparison */}
                        {msg.fullResult.timeline && msg.fullResult.timeline.length > 0 && (
                          <div className="pv-card p-8">
                            <h3 className="text-xl font-display font-bold text-text-primary mb-6 flex items-center gap-2">
                              <span className="w-1 h-6 bg-accent rounded-full" />
                              Comparative Timeline
                            </h3>
                            <div className="relative pl-8 border-l border-border space-y-6 ml-2">
                              {msg.fullResult.timeline.map((evt, evtIdx) => (
                                <div key={evtIdx} className="relative">
                                  <span className="absolute -left-10 top-1.5 w-4 h-4 rounded-full bg-accent border-4 border-bg" />
                                  <div>
                                    <span className="text-xs font-data font-bold text-accent uppercase tracking-widest">{evt.year} — {evt.startup}</span>
                                    <h4 className="text-base font-semibold text-text-primary mt-1">{evt.event}</h4>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Key Insights and Sources */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                          {/* Key Lessons */}
                          {msg.fullResult.keyLessons && msg.fullResult.keyLessons.length > 0 && (
                            <div className="lg:col-span-1">
                              <div className="pv-card p-6 border-accent/20 bg-surface/20 h-full">
                                <h3 className="text-sm font-display font-bold text-text-primary mb-5 flex items-center gap-2">
                                  <ShieldAlert className="w-4 h-4 text-accent" />
                                  Key Lessons
                                </h3>
                                <div className="space-y-4">
                                  {msg.fullResult.keyLessons.map((les, lesIdx) => (
                                    <div key={lesIdx} className="text-sm">
                                      <div className="font-semibold text-text-primary mb-1 border-b border-border/40 pb-1 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                                        {les.lesson}
                                      </div>
                                      <p className="text-text-secondary leading-relaxed pl-3">{les.details}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Cited References */}
                          {msg.fullResult.sources && msg.fullResult.sources.length > 0 && (
                            <div className="lg:col-span-2">
                              <div className="pv-card p-6 h-full">
                                <h3 className="text-xs font-bold uppercase text-text-muted tracking-widest mb-5">
                                  Cited References
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {msg.fullResult.sources.map((src, srcIdx) => (
                                    <Link
                                      key={srcIdx}
                                      to={`/startup/${src}`}
                                      className="p-4 border border-border rounded-lg bg-surface hover:border-accent/40 hover:bg-surface-2 transition-colors"
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="font-semibold text-text-primary capitalize">{src.replace(/-/g, ' ')}</span>
                                        <ArrowRight className="w-4 h-4 text-accent" />
                                      </div>
                                    </Link>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Related Startups */}
                        {msg.fullResult.relatedStartups && msg.fullResult.relatedStartups.length > 0 && (
                          <div>
                            <h3 className="text-xl font-display font-bold text-text-primary mb-6 flex items-center gap-2">
                              <span className="w-1 h-6 bg-accent rounded-full" />
                              Related Failures
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                              {msg.fullResult.relatedStartups.map((rs, rsIdx) => (
                                <StartupCard key={rsIdx} {...rs} topFailureReason={null} />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Suggested Follow Ups */}
                        <div className="pt-6">
                          <h3 className="text-xs font-bold uppercase text-text-muted tracking-widest mb-4 flex items-center gap-2">
                            <HelpCircle className="w-4 h-4 text-accent" />
                            Suggested Follow-Ups
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {suggestedFollowUps.map((followUp, fuIdx) => (
                              <button
                                key={fuIdx}
                                onClick={() => handleFollowUp(followUp)}
                                className="px-4 py-2 border border-border rounded-lg bg-surface hover:border-accent/40 hover:bg-surface-2 transition-colors text-sm font-medium"
                              >
                                {followUp}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default AiAssistant;

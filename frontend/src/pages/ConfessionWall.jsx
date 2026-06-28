import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Heart, Send, Ghost } from 'lucide-react';
import { clsx } from 'clsx';
import api from '../lib/api';

const ConfessionWall = () => {
  const [confessions, setConfessions] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [text, setText] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const fetchConfessions = async () => {
    try {
      const response = await api.get('/confessions');
      setConfessions(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchConfessions();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await api.post('/confessions', { text });
      setText('');
      fetchConfessions();
    } catch (err) {
      alert(err.response?.data?.error || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpvote = async (id) => {
    // Optimistic UI
    setConfessions(prev => prev.map(c => 
      c.id === id ? { ...c, upvotes: c.upvotes + 1 } : c
    ));
    try {
      await api.post(`/confessions/${id}/upvote`);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="pv-content-container py-12">
      <div className="text-center mb-16">
        <Ghost className="w-12 h-12 text-accent mx-auto mb-4" />
        <h1 className="text-5xl font-display font-bold mb-4">Founder Confession Wall</h1>
        <p className="text-text-secondary text-lg max-w-2xl mx-auto">
          Anonymous single-sentence regrets and lessons from those who lived to tell the tale.
          No accounts, no judgment, just failure.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        {/* Sticky Input Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 pv-card p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-accent" />
              Confess Your Failure
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <textarea
                required
                placeholder="What's the one thing you regret most? (max 280 chars)"
                className="w-full bg-surface-2 border border-border rounded-lg p-3 text-sm focus:outline-none focus:border-accent min-h-[120px] resize-none"
                maxLength={280}
                value={text}
                onChange={e => setText(e.target.value)}
              />
              <div className="flex items-center justify-between">
                <span className={clsx(
                  "text-[10px] font-bold uppercase",
                  text.length > 250 ? "text-red" : "text-text-muted"
                )}>
                  {text.length} / 280
                </span>
                <button
                  disabled={isSubmitting || text.length < 10}
                  className="bg-accent hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all"
                >
                  {isSubmitting ? 'Posting...' : 'Post Anonymously'}
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Wall */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="h-32 pv-card animate-pulse bg-surface-2/50" />
              ))}
            </div>
          ) : (
            <div className="columns-1 md:columns-2 gap-6 space-y-6">
              <AnimatePresence initial={false}>
                {confessions.map((c) => (
                  <motion.div
                    key={c.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="break-inside-avoid bg-surface border border-border rounded-card p-6 relative group hover:border-accent/50 transition-colors"
                  >
                    <p className="text-text-primary leading-relaxed text-lg mb-6 font-medium italic">
                      "{c.text}"
                    </p>
                    <div className="flex items-center justify-between border-t border-border/50 pt-4">
                      <div className="text-[10px] text-text-muted font-bold uppercase tracking-widest">
                        {new Date(c.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <button 
                        onClick={() => handleUpvote(c.id)}
                        className="flex items-center gap-2 text-text-secondary hover:text-red transition-colors group/btn"
                      >
                        <Heart className="w-4 h-4 group-hover/btn:fill-red" />
                        <span className="font-data text-xs">{c.upvotes}</span>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfessionWall;
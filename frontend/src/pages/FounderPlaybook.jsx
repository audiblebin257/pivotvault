import React from 'react';
import { ClipboardCheck, Loader2, Sparkles } from 'lucide-react';
import api from '../lib/api';

const FounderPlaybook = () => {
  const [form, setForm] = React.useState({ idea: '', industry: 'SaaS', stage: 'idea' });
  const [result, setResult] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post('/ai/playbook', form);

    console.log("PLAYBOOK RESPONSE:", data);

    setResult(data);
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not generate playbook.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/20 bg-accent/5 text-accent text-xs font-semibold uppercase tracking-wider mb-3">
          <ClipboardCheck className="w-4 h-4" />
          Founder Operating System
        </div>
        <h1 className="text-4xl font-display font-extrabold">Founder Playbook</h1>
        <p className="text-text-secondary mt-2 max-w-xl mx-auto">Turn historical failure patterns into a practical validation checklist for your idea.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        <form onSubmit={submit} className="lg:col-span-2 glass-card p-6 space-y-5">
          <div>
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Startup idea</label>
            <textarea
              required
              rows={5}
              value={form.idea}
              onChange={(e) => setForm({ ...form, idea: e.target.value })}
              className="mt-2 w-full bg-surface-2 border border-border rounded-lg p-4 focus:outline-none focus:border-accent"
              placeholder="Describe the product, customer, and painful problem..."
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Industry</label>
              <input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} className="mt-2 w-full bg-surface-2 border border-border rounded-lg p-3 focus:outline-none focus:border-accent" />
            </div>
            <div>
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Stage</label>
              <select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })} className="mt-2 w-full bg-surface-2 border border-border rounded-lg p-3 focus:outline-none focus:border-accent">
                <option value="idea">Idea</option>
                <option value="prototype">Prototype</option>
                <option value="launch">Launch</option>
                <option value="growth">Growth</option>
              </select>
            </div>
          </div>
          {error && <div className="text-sm text-danger bg-danger/10 border border-danger/30 p-3 rounded-lg">{error}</div>}
          <button disabled={loading} className="w-full bg-accent text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            Generate playbook
          </button>
        </form>

        <div className="lg:col-span-3">
          {result ? (
            <div className="space-y-6">
              <section className="glass-card p-7">
                <div className="text-xs text-accent font-bold uppercase tracking-widest mb-2">Compared against {result.comparedAgainst ?? 0} cases</div>
                <h2 className="text-2xl font-display font-bold mb-3">{result.title}</h2>
                <p className="text-text-secondary leading-relaxed">{result.overview}</p>
              </section>
              <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(result.checklist || []).map((group) => (
                  <div key={group.phase} className="glass-card p-5">
                    <h3 className="font-display font-bold text-accent mb-4">{group.phase}</h3>
                    <ul className="space-y-3">
                      {(group.items || []).map((item) => (
                        <li key={item} className="text-sm text-text-secondary flex gap-2">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </section>
              <section className="glass-card p-7">
                <h3 className="text-lg font-display font-bold mb-4">Pitfalls to avoid</h3>
                <div className="space-y-4">
                  {(result.pitfalls || []).map((pitfall, i) => (
                    <div key={i} className="border border-border/60 rounded-xl p-4 bg-bg/30">
                      <div className="font-bold text-danger mb-1">{pitfall.mistake}</div>
                      <div className="text-sm text-text-secondary">{pitfall.avoidance}</div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          ) : (
            <div className="glass-card p-10 text-center h-full flex flex-col items-center justify-center min-h-[420px]">
              <ClipboardCheck className="w-14 h-14 text-accent mb-4" />
              <h2 className="text-xl font-display font-bold mb-2">Generate an evidence-based checklist</h2>
              <p className="text-text-secondary max-w-md">The playbook uses your startup details plus PivotVault failure records to produce validation, build, and scale actions.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FounderPlaybook;

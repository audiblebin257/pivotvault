import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Search, ShieldAlert, Target, Activity, Loader2, Sparkles, AlertTriangle, Upload, FileUp } from 'lucide-react';
import api from '../lib/api';
import clsx from 'clsx';
import JSZip from 'jszip';

const PitchDeckAutopsy = () => {
  const [deckContent, setDeckContent] = React.useState('');
  const [industry, setIndustry] = React.useState('SaaS');
  const [loading, setLoading] = React.useState(false);
  const [parsing, setParsing] = React.useState(false);
  const [result, setResult] = React.useState(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.name.endsWith('.pptx')) {
      setParsing(true);
      try {
        const zip = await JSZip.loadAsync(file);
        const slideFiles = Object.keys(zip.files).filter(name => name.startsWith('ppt/slides/slide') && name.endsWith('.xml'));
        
        let fullText = '';
        for (const slideFile of slideFiles) {
          const content = await zip.files[slideFile].async('string');
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(content, 'text/xml');
          const textNodes = xmlDoc.getElementsByTagName('a:t');
          
          for (let i = 0; i < textNodes.length; i++) {
            fullText += textNodes[i].textContent + ' ';
          }
          fullText += '\n\n';
        }
        setDeckContent(fullText.trim());
      } catch (err) {
        console.error('Error parsing PPTX:', err);
        alert('Failed to parse PPTX file. Please try pasting the text manually.');
      } finally {
        setParsing(false);
      }
    } else {
      alert('Please upload a .pptx file.');
    }
  };

  const handleAutopsy = async (e) => {
    e.preventDefault();
    if (!deckContent.trim()) return;

    setLoading(true);
    try {
      const response = await api.post('/ai/autopsy', { deckContent, industry });
      setResult(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-20">
      <div className="text-center mb-12">
        <Activity className="w-16 h-16 text-accent mx-auto mb-4" />
        <h1 className="text-5xl font-display font-bold mb-4">Pitch Deck Autopsy</h1>
        <p className="text-text-secondary text-lg max-w-2xl mx-auto">
          Our AI "Pathologist" scans your deck content for lethal weaknesses and cross-references them with historical failure patterns.
        </p>
      </div>

      {!result ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-10"
        >
          <form onSubmit={handleAutopsy} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-sm font-bold text-text-secondary uppercase tracking-widest">Startup Industry</label>
                <select
                  className="w-full bg-surface-2 border border-border rounded-lg p-3 focus:outline-none focus:border-accent"
                  value={industry}
                  onChange={e => setIndustry(e.target.value)}
                >
                  <option value="SaaS">SaaS</option>
                  <option value="FinTech">FinTech</option>
                  <option value="EdTech">EdTech</option>
                  <option value="E-commerce">E-commerce</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Web3">Web3/Crypto</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-bold text-text-secondary uppercase tracking-widest block">Upload Pitch Deck (.pptx)</label>
              <div className="relative group">
                <input
                  type="file"
                  accept=".pptx"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className={clsx(
                  "border-2 border-dashed rounded-xl p-8 text-center transition-all",
                  parsing ? "border-accent bg-accent/5 animate-pulse" : "border-border group-hover:border-accent/50 group-hover:bg-surface-2"
                )}>
                  {parsing ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-10 h-10 text-accent animate-spin" />
                      <div className="text-accent font-bold uppercase tracking-widest text-xs">Extracting Text from Slides...</div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-surface-2 flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                        <FileUp className="w-6 h-6 text-text-secondary group-hover:text-accent" />
                      </div>
                      <div className="text-sm text-text-secondary">
                        <span className="text-accent font-bold">Click to upload</span> or drag and drop
                      </div>
                      <div className="text-[10px] text-text-muted uppercase tracking-wider font-bold">PowerPoint (.pptx) only</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-text-secondary uppercase tracking-widest">Deck Content / Problem Statement</label>
              <textarea
                required
                placeholder="Paste the text from your pitch deck here. Include your Problem, Solution, Market Size, and Monetization slides..."
                rows={10}
                className="w-full bg-surface-2 border border-border rounded-lg p-4 focus:outline-none focus:border-accent font-mono text-sm leading-relaxed"
                value={deckContent}
                onChange={e => setDeckContent(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red hover:bg-red-700 text-white font-bold py-5 rounded-lg text-xl transition-all shadow-lg flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  PERFORMING AUTOPSY...
                </>
              ) : (
                <>
                  <Search className="w-6 h-6" />
                  Begin Autopsy
                </>
              )}
            </button>
          </form>
        </motion.div>
      ) : (
        <div className="space-y-10">
          {/* Risk Level Header */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={clsx(
              "md:col-span-1 glass-card p-8 flex flex-col items-center justify-center text-center border-l-8",
              result.overallRisk === 'Lethal' ? "border-l-red bg-red/5" : "border-l-warning bg-warning/5"
            )}>
              <div className="text-sm font-bold text-text-muted uppercase tracking-[0.2em] mb-4">Overall Risk</div>
              <div className={clsx(
                "text-5xl font-data font-bold mb-2",
                result.overallRisk === 'Lethal' ? "text-red" : "text-warning"
              )}>{result.overallRisk}</div>
              <div className="flex items-center gap-2 text-text-secondary text-xs uppercase font-bold tracking-widest">
                <ShieldAlert className="w-4 h-4" />
                Diagnostic Grade
              </div>
            </div>

            <div className="md:col-span-2 glass-card p-8 bg-accent/5 border-accent/20">
              <div className="text-sm font-bold text-accent uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Pathologist's Verdict
              </div>
              <p className="text-lg text-text-primary leading-relaxed italic">
                "{result.pathologistVerdict}"
              </p>
            </div>
          </div>

          {/* Lethal Weaknesses */}
          <div className="glass-card p-10">
            <h3 className="text-2xl font-display font-bold mb-8 flex items-center gap-3 text-red">
              <AlertTriangle className="w-8 h-8" />
              Lethal Weaknesses Identified
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {result.lethalWeaknesses.map((weakness, i) => (
                <div key={i} className="p-6 rounded-xl bg-surface-2 border border-border/50 hover:border-red/30 transition-all group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-xs font-bold text-red uppercase tracking-widest px-2 py-1 bg-red/10 rounded">{weakness.slide} Slide</div>
                  </div>
                  <div className="font-bold text-lg mb-3 text-text-primary group-hover:text-red transition-colors">{weakness.issue}</div>
                  <div className="text-sm text-text-secondary leading-relaxed border-t border-border/20 pt-4">
                    <span className="font-bold text-text-muted uppercase text-[10px] block mb-1">Historical Precedent</span>
                    {weakness.historicalPrecedent}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Structural Red Flags */}
          <div className="glass-card p-10 bg-surface/30">
            <h3 className="text-2xl font-display font-bold mb-8 flex items-center gap-3">
              <Target className="text-accent w-8 h-8" />
              Structural Red Flags
            </h3>
            <div className="flex flex-wrap gap-4">
              {result.structuralRedFlags.map((flag, i) => (
                <div key={i} className="px-6 py-3 rounded-full bg-surface-2 border border-border text-text-secondary text-sm font-medium flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-accent" />
                  {flag}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center">
            <button 
              onClick={() => setResult(null)}
              className="text-text-muted hover:text-white transition-colors flex items-center gap-2"
            >
              ← Autopsy another deck
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PitchDeckAutopsy;

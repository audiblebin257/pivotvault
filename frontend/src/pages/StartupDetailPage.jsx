import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../lib/api';
import { Calendar, Tag, Sparkles, BookOpen, Target, TrendingUp, DollarSign, AlertTriangle, Skull, Lightbulb, CheckCircle } from 'lucide-react';

export default function StartupDetailPage() {
  const { slug } = useParams();
  const [startup, setStartup] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/startups/${slug}`)
      .then(({ data }) => setStartup(data))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400 text-lg">Loading intelligence report...</p>
        </div>
      </div>
    );
  }

  if (!startup) {
    return <div className="p-8 text-red-500">Startup not found</div>;
  }

  const hasCaseStudy = startup.caseStudy;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-4">
            <h1 className="text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
              {startup.name}
            </h1>
            {startup.isAiGenerated && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-700 dark:text-purple-300 text-xs font-bold rounded-full border border-purple-500/30">
                <Sparkles size={14} />
                AI Generated
              </span>
            )}
          </div>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            {startup.summary}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-slate-700">
            <div className="text-3xl font-bold text-slate-800 dark:text-white mb-1">
              {startup.foundingYear}
            </div>
            <div className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Founded
            </div>
          </div>
          {startup.shutdownYear && (
            <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 rounded-2xl p-6 shadow-lg border border-red-100 dark:border-red-700/30">
              <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-1">
                {startup.shutdownYear}
              </div>
              <div className="text-sm font-medium text-red-600/80 dark:text-red-300 uppercase tracking-wider">
                Shutdown
              </div>
            </div>
          )}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-slate-700">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
              {startup.lifetimeMonths}
            </div>
            <div className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Months Active
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-slate-700">
            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">
              ${(startup.fundingInr / 1000000000).toFixed(1)}B
            </div>
            <div className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Funding
            </div>
          </div>
        </div>

        {/* Tags */}
        {startup.tags && startup.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-12 justify-center">
            {startup.tags.map((tag, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-full text-sm font-medium">
                <Tag size={14} />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Timeline */}
        {startup.timelineEvents?.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-8 flex items-center gap-3">
              <Calendar className="text-blue-600 dark:text-blue-400" />
              Timeline
            </h2>
            <div className="relative border-l-4 border-blue-200 dark:border-blue-700 ml-3 pl-8 space-y-8">
              {startup.timelineEvents.map((ev, i) => (
                <div key={i} className="relative">
                  <div className="absolute -left-10 -top-1 w-6 h-6 bg-blue-500 rounded-full border-4 border-white dark:border-slate-900 shadow-md" />
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border border-slate-100 dark:border-slate-700">
                    <div className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-2">{ev.year}</div>
                    <div className="text-slate-700 dark:text-slate-300 font-medium text-lg">{ev.title}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Failure Reasons */}
        {startup.failureReasons?.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-8 flex items-center gap-3">
              <AlertTriangle className="text-amber-500" />
              Why They Failed
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {startup.failureReasons.map((fr, i) => (
                <div key={i} className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-6 rounded-xl border border-amber-100 dark:border-amber-800/30">
                  <div className="font-bold text-amber-700 dark:text-amber-400 mb-3">{fr.category}</div>
                  <div className="text-slate-700 dark:text-slate-300">{fr.description}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Case Study */}
        {hasCaseStudy && (
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-8 flex items-center gap-3">
              <BookOpen className="text-indigo-600 dark:text-indigo-400" />
              Full Case Study
            </h2>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
              {/* Case Study Content */}
              <div className="p-8 space-y-10">
                {/* Origin Story */}
                {startup.caseStudy.originStory && (
                  <div>
                    <div className="flex items-center gap-3 mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
                      <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                      <h3 className="text-xl font-bold text-slate-800 dark:text-white">Origin Story</h3>
                    </div>
                    <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                      {startup.caseStudy.originStory}
                    </p>
                  </div>
                )}

                {/* Market Problem */}
                {startup.caseStudy.marketProblem && (
                  <div>
                    <div className="flex items-center gap-3 mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
                      <AlertTriangle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                      <h3 className="text-xl font-bold text-slate-800 dark:text-white">The Market Problem</h3>
                    </div>
                    <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                      {startup.caseStudy.marketProblem}
                    </p>
                  </div>
                )}

                {/* Business Model */}
                {startup.caseStudy.businessModel && (
                  <div>
                    <div className="flex items-center gap-3 mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
                      <DollarSign className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                      <h3 className="text-xl font-bold text-slate-800 dark:text-white">Business Model</h3>
                    </div>
                    <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                      {startup.caseStudy.businessModel}
                    </p>
                  </div>
                )}

                {/* Early Growth */}
                {startup.caseStudy.earlyGrowth && (
                  <div>
                    <div className="flex items-center gap-3 mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
                      <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      <h3 className="text-xl font-bold text-slate-800 dark:text-white">Early Growth</h3>
                    </div>
                    <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                      {startup.caseStudy.earlyGrowth}
                    </p>
                  </div>
                )}

                {/* Funding History */}
                {startup.caseStudy.fundingHistory && (
                  <div>
                    <div className="flex items-center gap-3 mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
                      <DollarSign className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                      <h3 className="text-xl font-bold text-slate-800 dark:text-white">Funding History</h3>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-700">
                      <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line font-mono text-sm">
                        {startup.caseStudy.fundingHistory}
                      </p>
                    </div>
                  </div>
                )}

                {/* Scaling Phase */}
                {startup.caseStudy.scalingPhase && (
                  <div>
                    <div className="flex items-center gap-3 mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
                      <TrendingUp className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                      <h3 className="text-xl font-bold text-slate-800 dark:text-white">The Scaling Phase</h3>
                    </div>
                    <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                      {startup.caseStudy.scalingPhase}
                    </p>
                  </div>
                )}

                {/* Warning Signs */}
                {startup.caseStudy.warningSigns && (
                  <div>
                    <div className="flex items-center gap-3 mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
                      <AlertTriangle className="w-6 h-6 text-orange-500" />
                      <h3 className="text-xl font-bold text-slate-800 dark:text-white">The Warning Signs</h3>
                    </div>
                    <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                      {startup.caseStudy.warningSigns}
                    </p>
                  </div>
                )}

                {/* Strategic Mistakes */}
                {startup.caseStudy.strategicMistakes && (
                  <div>
                    <div className="flex items-center gap-3 mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
                      <Skull className="w-6 h-6 text-red-600 dark:text-red-400" />
                      <h3 className="text-xl font-bold text-slate-800 dark:text-white">Strategic Mistakes</h3>
                    </div>
                    <div className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                      {startup.caseStudy.strategicMistakes}
                    </div>
                  </div>
                )}

                {/* Collapse Sequence */}
                {startup.caseStudy.collapseSequence && (
                  <div>
                    <div className="flex items-center gap-3 mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
                      <Skull className="w-6 h-6 text-red-600 dark:text-red-400" />
                      <h3 className="text-xl font-bold text-slate-800 dark:text-white">The Collapse</h3>
                    </div>
                    <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                      {startup.caseStudy.collapseSequence}
                    </p>
                  </div>
                )}

                {/* Why They Failed */}
                {startup.caseStudy.whyFailed && (
                  <div>
                    <div className="flex items-center gap-3 mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
                      <Skull className="w-6 h-6 text-red-600 dark:text-red-400" />
                      <h3 className="text-xl font-bold text-slate-800 dark:text-white">Why They Really Failed</h3>
                    </div>
                    <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 p-8 rounded-xl border border-red-100 dark:border-red-800/30">
                      <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line font-medium">
                        {startup.caseStudy.whyFailed}
                      </p>
                    </div>
                  </div>
                )}

                {/* Founder Lessons */}
                {startup.caseStudy.founderLessons && (
                  <div>
                    <div className="flex items-center gap-3 mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
                      <Lightbulb className="w-6 h-6 text-amber-500" />
                      <h3 className="text-xl font-bold text-slate-800 dark:text-white">Founder Lessons</h3>
                    </div>
                    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 p-8 rounded-xl border border-amber-100 dark:border-amber-800/30">
                      <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                        {startup.caseStudy.founderLessons}
                      </p>
                    </div>
                  </div>
                )}

                {/* Key Takeaways */}
                {startup.caseStudy.keyTakeaways && (
                  <div>
                    <div className="flex items-center gap-3 mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
                      <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                      <h3 className="text-xl font-bold text-slate-800 dark:text-white">Key Takeaways</h3>
                    </div>
                    <ul className="space-y-4">
                      {startup.caseStudy.keyTakeaways.map((takeaway, i) => (
                        <li key={i} className="flex items-start gap-4">
                          <CheckCircle className="w-6 h-6 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <span className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
                            {takeaway}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Footer */}
        <div className="text-center text-slate-500 dark:text-slate-400 text-sm mt-16 pb-8">
          <p>Data compiled from multiple public sources • Case studies are for educational purposes only</p>
        </div>
      </div>
    </div>
  );
}

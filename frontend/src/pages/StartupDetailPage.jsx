import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../lib/api';
import { 
  Calendar, 
  Tag, 
  Sparkles, 
  BookOpen, 
  Target, 
  TrendingUp, 
  DollarSign, 
  AlertTriangle, 
  Skull, 
  Lightbulb, 
  CheckCircle,
  ExternalLink,
  Search,
  Clock,
  Trophy,
  Building2
} from 'lucide-react';
import Logo from '../components/Logo';

export default function StartupDetailPage() {
  const { slug } = useParams();
  const [startup, setStartup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [externalSources, setExternalSources] = useState([]);
  const [sourcesLoading, setSourcesLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const startupRes = await api.get(`/startups/${slug}`);
        setStartup(startupRes.data);

        // Fetch external research after getting startup data
        setSourcesLoading(true);
        try {
          const researchRes = await api.get(`/startups/${slug}/external-research`);
          setExternalSources(researchRes.data.sources || []);
        } catch (err) {
          console.warn('Failed to fetch external research:', err);
          setExternalSources([]);
        } finally {
          setSourcesLoading(false);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center" role="status" aria-live="polite">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary text-lg">Loading intelligence report…</p>
        </div>
      </div>
    );
  }

  if (!startup) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-8">
        <div className="pv-card p-10 text-center max-w-md">
          <AlertTriangle className="w-10 h-10 text-danger mx-auto mb-4" />
          <p className="text-text-primary font-semibold">Startup not found</p>
        </div>
      </div>
    );
  }

  const hasCaseStudy = startup.caseStudy;

  const caseStudySections = [
    { key: 'originStory', title: 'Origin Story', icon: Building2, iconClass: 'text-accent' },
    { key: 'marketProblem', title: 'The Market Problem', icon: AlertTriangle, iconClass: 'text-danger' },
    { key: 'businessModel', title: 'Business Model', icon: Target, iconClass: 'text-success' },
    { key: 'earlyGrowth', title: 'Early Growth', icon: TrendingUp, iconClass: 'text-accent' },
    { key: 'scalingPhase', title: 'The Scaling Phase', icon: TrendingUp, iconClass: 'text-info' },
    { key: 'warningSigns', title: 'The Warning Signs', icon: AlertTriangle, iconClass: 'text-warning' },
    { key: 'collapseSequence', title: 'The Collapse', icon: Skull, iconClass: 'text-danger' },
  ];

  return (
    <div className="min-h-screen bg-bg py-12">
      <div className="max-w-5xl mx-auto px-4">
        {/* Hero Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <Logo 
              name={startup.name} 
              domain={startup.domain} 
              size="xl" 
              className="rounded-2xl shadow-elevated"
            />
          </div>
          <div className="inline-flex items-center gap-2 mb-4">
            <h1 className="text-5xl md:text-6xl font-display font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-accent to-accent-2">
              {startup.name}
            </h1>
            {startup.isAiGenerated && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-accent/10 text-accent text-xs font-bold rounded-full border border-accent/30">
                <Sparkles size={14} />
                AI Generated
              </span>
            )}
          </div>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
            {startup.summary}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="pv-card p-6">
            <div className="flex items-center gap-2 mb-2 text-text-muted">
              <Calendar className="w-5 h-5" />
              <span className="text-xs uppercase font-bold tracking-wider">Founded</span>
            </div>
            <div className="text-2xl font-data font-bold text-text-primary">
              {startup.foundingYear}
            </div>
          </div>
          {startup.shutdownYear && (
            <div className="pv-card p-6 border-danger/30 bg-danger/5">
              <div className="flex items-center gap-2 mb-2 text-danger">
                <Skull className="w-5 h-5" />
                <span className="text-xs uppercase font-bold tracking-wider">Shutdown</span>
              </div>
              <div className="text-2xl font-data font-bold text-danger">
                {startup.shutdownYear}
              </div>
            </div>
          )}
          <div className="pv-card p-6">
            <div className="flex items-center gap-2 mb-2 text-text-muted">
              <Clock className="w-5 h-5" />
              <span className="text-xs uppercase font-bold tracking-wider">Lifespan</span>
            </div>
            <div className="text-2xl font-data font-bold text-accent">
              {startup.lifetimeMonths} months
            </div>
          </div>
          <div className="pv-card p-6">
            <div className="flex items-center gap-2 mb-2 text-text-muted">
              <DollarSign className="w-5 h-5" />
              <span className="text-xs uppercase font-bold tracking-wider">Total Funding</span>
            </div>
            <div className="text-2xl font-data font-bold text-success">
              ${(Number(startup.fundingInr) / 1000000000).toFixed(1)}B
            </div>
          </div>
        </div>

        {/* Tags */}
        {startup.tags && startup.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-12 justify-center">
            {startup.tags.map((tag, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-4 py-2 bg-surface-2 text-text-secondary border border-border rounded-full text-sm font-medium">
                <Tag size={14} />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Timeline */}
        {startup.timelineEvents?.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-8 pb-2 border-b border-border">
              <Calendar className="w-7 h-7 text-accent" />
              <h2 className="text-2xl font-display font-bold text-text-primary">Growth Timeline</h2>
            </div>
            <div className="relative border-l-4 border-accent/30 ml-3 pl-8 space-y-8">
              {startup.timelineEvents.map((ev, i) => (
                <div key={i} className="relative">
                  <div className="absolute -left-10 -top-1 w-6 h-6 bg-accent rounded-full border-4 border-bg shadow-sm" />
                  <div className="pv-card p-6">
                    <div className="text-sm font-data font-bold text-accent mb-2">{ev.year}</div>
                    <div className="text-text-primary font-medium text-lg">{ev.title}</div>
                    {ev.description && (
                      <div className="text-text-secondary mt-2">{ev.description}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Case Study Sections */}
        {hasCaseStudy && (
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-8 pb-2 border-b border-border">
              <BookOpen className="w-7 h-7 text-accent" />
              <h2 className="text-2xl font-display font-bold text-text-primary">Full Case Study</h2>
            </div>

            <div className="pv-card overflow-hidden">
              <div className="p-8 space-y-12">
                {/* Narrative sections rendered from config */}
                {caseStudySections.map(({ key, title, icon: Icon, iconClass }) =>
                  startup.caseStudy[key] ? (
                    <div key={key}>
                      <div className="flex items-center gap-3 mb-4 pb-2 border-b border-border">
                        <Icon className={`w-6 h-6 ${iconClass}`} />
                        <h3 className="text-xl font-display font-bold text-text-primary">{title}</h3>
                      </div>
                      <p className="text-lg text-text-secondary leading-relaxed whitespace-pre-line">
                        {startup.caseStudy[key]}
                      </p>
                    </div>
                  ) : null
                )}

                {/* Funding Journey (mono block) */}
                {startup.caseStudy.fundingHistory && (
                  <div>
                    <div className="flex items-center gap-3 mb-4 pb-2 border-b border-border">
                      <DollarSign className="w-6 h-6 text-success" />
                      <h3 className="text-xl font-display font-bold text-text-primary">Funding Journey</h3>
                    </div>
                    <div className="bg-surface-2 p-6 rounded-card border border-border">
                      <p className="text-text-secondary leading-relaxed whitespace-pre-line font-data text-sm">
                        {startup.caseStudy.fundingHistory}
                      </p>
                    </div>
                  </div>
                )}

                {/* Critical Decisions (highlight) */}
                {startup.caseStudy.criticalDecisions && (
                  <div>
                    <div className="flex items-center gap-3 mb-4 pb-2 border-b border-border">
                      <Trophy className="w-6 h-6 text-warning" />
                      <h3 className="text-xl font-display font-bold text-text-primary">Critical Decisions</h3>
                    </div>
                    <div className="bg-warning/5 p-6 rounded-card border border-warning/30">
                      <p className="text-lg text-text-secondary leading-relaxed whitespace-pre-line">
                        {startup.caseStudy.criticalDecisions}
                      </p>
                    </div>
                  </div>
                )}

                {/* Failure Analysis (highlight) */}
                {startup.caseStudy.whyFailed && (
                  <div>
                    <div className="flex items-center gap-3 mb-4 pb-2 border-b border-border">
                      <AlertTriangle className="w-6 h-6 text-danger" />
                      <h3 className="text-xl font-display font-bold text-text-primary">Failure Analysis</h3>
                    </div>
                    <div className="bg-danger/5 p-8 rounded-card border border-danger/30">
                      <p className="text-lg text-text-secondary leading-relaxed whitespace-pre-line font-medium">
                        {startup.caseStudy.whyFailed}
                      </p>
                    </div>
                  </div>
                )}

                {/* Founder Lessons (highlight) */}
                {startup.caseStudy.founderLessons && (
                  <div>
                    <div className="flex items-center gap-3 mb-4 pb-2 border-b border-border">
                      <Lightbulb className="w-6 h-6 text-warning" />
                      <h3 className="text-xl font-display font-bold text-text-primary">Founder Lessons</h3>
                    </div>
                    <div className="bg-accent/5 p-8 rounded-card border border-accent/30">
                      <p className="text-lg text-text-secondary leading-relaxed whitespace-pre-line">
                        {startup.caseStudy.founderLessons}
                      </p>
                    </div>
                  </div>
                )}

                {/* Key Takeaways */}
                {startup.caseStudy.keyTakeaways && (
                  <div>
                    <div className="flex items-center gap-3 mb-4 pb-2 border-b border-border">
                      <CheckCircle className="w-6 h-6 text-success" />
                      <h3 className="text-xl font-display font-bold text-text-primary">Lessons Learned</h3>
                    </div>
                    <ul className="space-y-4">
                      {startup.caseStudy.keyTakeaways.map((takeaway, i) => (
                        <li key={i} className="flex items-start gap-4">
                          <CheckCircle className="w-6 h-6 text-success mt-0.5 flex-shrink-0" />
                          <span className="text-lg text-text-secondary leading-relaxed">
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

        {/* Failure Reasons */}
        {startup.failureReasons?.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-8 pb-2 border-b border-border">
              <AlertTriangle className="w-7 h-7 text-warning" />
              <h2 className="text-2xl font-display font-bold text-text-primary">Why They Failed</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {startup.failureReasons.map((fr, i) => (
                <div key={i} className="bg-warning/5 p-6 rounded-card border border-warning/30">
                  <div className="font-bold text-warning mb-3 capitalize">{fr.category}</div>
                  <div className="text-text-secondary">{fr.description}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* External Research & Sources */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8 pb-2 border-b border-border">
            <Search className="w-7 h-7 text-accent" />
            <h2 className="text-2xl font-display font-bold text-text-primary">External Research &amp; Sources</h2>
          </div>

          {sourcesLoading ? (
            <div className="pv-card p-8" role="status" aria-live="polite">
              <div className="text-center">
                <div className="w-10 h-10 border-4 border-accent/20 border-t-accent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-text-secondary">Searching web sources…</p>
              </div>
            </div>
          ) : externalSources.length > 0 ? (
            <div className="space-y-4">
              {externalSources.map((source, index) => (
                <div key={index} className="pv-card-interactive p-6">
                  <a href={source.url} target="_blank" rel="noopener noreferrer" className="block">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-text-primary mb-2 flex items-center gap-2">
                          {source.title}
                          <ExternalLink className="w-4 h-4 text-accent" />
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-text-muted mb-3">
                          <span className="font-medium text-accent">{source.publisher}</span>
                          {source.date && <span>• {new Date(source.date).toLocaleDateString()}</span>}
                        </div>
                        <p className="text-text-secondary leading-relaxed">
                          {source.summary}
                        </p>
                      </div>
                    </div>
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="pv-card p-8 text-center">
              <Search className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <p className="text-text-secondary">No external sources found for this startup.</p>
            </div>
          )}
        </section>

        {/* Footer */}
        <div className="text-center text-text-muted text-sm pb-8">
          <p>Data compiled from multiple public sources • Case studies are for educational purposes only</p>
        </div>
      </div>
    </div>
  );
}

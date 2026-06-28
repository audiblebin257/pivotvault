import React from 'react';
import { motion } from 'framer-motion';
import { Ghost, MessageSquare, Terminal, Filter, Sparkles, AlertCircle } from 'lucide-react';
import GhostChat from '../components/GhostChat';
import Logo from '../components/Logo';
import SearchInput from '../components/ui/SearchInput';
import api from '../lib/api';

const HallOfGhosts = () => {
  const [startups, setStartups] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedGhost, setSelectedGhost] = React.useState(null);
  const [searchTerm, setSearchTerm] = React.useState('');

  React.useEffect(() => {
    const fetchStartups = async () => {
      try {
        const response = await api.get('/startups?limit=50');
        setStartups(response.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStartups();
  }, []);

  const filteredStartups = startups.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.industry.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="pv-content-container py-12">
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-red/20 bg-red/5 text-red text-xs font-semibold uppercase tracking-wider mb-3">
          <Ghost className="w-3.5 h-3.5" />
          The Afterlife
        </div>
        <h1 className="text-4xl md:text-5xl font-display font-extrabold text-text-primary">Hall of Ghosts</h1>
        <p className="text-text-secondary text-lg mt-4 max-w-2xl mx-auto">
          Converse with the digital shadows of failed founders. Ask the questions they never answered in their PR statements.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 mb-12">
        <SearchInput
          placeholder="Search for a specific founder or industry..."
          className="flex-1"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-64 pv-card animate-pulse bg-surface-2/40" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredStartups.map((startup) => (
            <motion.div
              key={startup.id}
              whileHover={{ y: -5 }}
              className="pv-card p-8 bg-surface/40 group hover:border-accent/40 transition-all cursor-pointer relative overflow-hidden"
              onClick={() => setSelectedGhost(startup)}
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
                <Ghost className="w-20 h-20 text-accent" />
              </div>

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <Logo 
                    name={startup.name} 
                    domain={startup.domain}
                    size="md"
                    className="rounded-2xl"
                  />
                  <div>
                    <h3 className="font-display font-bold text-xl text-text-primary">{startup.name}</h3>
                    <div className="text-xs text-text-muted uppercase tracking-widest font-bold">{startup.industry}</div>
                  </div>
                </div>

                <p className="text-sm text-text-secondary leading-relaxed mb-8 line-clamp-3 italic">
                  "{startup.summary}"
                </p>

                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-red uppercase tracking-widest">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Failed {startup.shutdownYear}
                  </div>
                  <button className="flex items-center gap-2 text-xs font-bold text-accent group-hover:underline">
                    Initiate Seance
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {selectedGhost && (
        <GhostChat 
          startupSlug={selectedGhost.slug} 
          startupName={selectedGhost.name} 
          autoOpen={true}
        />
      )}

      {!loading && filteredStartups.length === 0 && (
        <div className="text-center py-20">
          <Ghost className="w-16 h-16 text-text-muted mx-auto mb-4 opacity-20" />
          <p className="text-text-muted font-bold">No ghosts found matching your search.</p>
        </div>
      )}
    </div>
  );
};

export default HallOfGhosts;

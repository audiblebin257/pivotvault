import React from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Skull, Search, Zap, BarChart2, MessageSquare, Share2, Menu, X, Sparkles,
  Bookmark, Brain, GitCompare, ClipboardCheck, Sun, Moon, LogOut, User,
  FileText, LayoutGrid, ChevronRight, Activity, Database
} from 'lucide-react';
import { clsx } from 'clsx';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const SidebarItem = ({ item, onClick }) => {
  const Icon = item.icon;
  
  return (
    <NavLink
      to={item.path}
      onClick={onClick}
      className={({ isActive }) => clsx(
        "relative flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group group",
        isActive 
          ? "text-accent bg-accent/10 font-bold" 
          : "text-text-secondary hover:text-text-primary hover:bg-surface-2"
      )}
    >
      {({ isActive }) => (
        <>
          <Icon className={clsx("w-5 h-5 shrink-0 transition-colors", isActive ? "text-accent" : "text-text-muted group-hover:text-text-primary")} />
          <span className="text-sm tracking-tight">{item.name}</span>
          
          {isActive && (
            <motion.div
              layoutId="sidebar-active-indicator"
              className="absolute left-0 w-1 h-5 bg-accent rounded-r-full"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
        </>
      )}
    </NavLink>
  );
};

const SidebarSection = ({ title, items, onItemClick }) => (
  <div className="mb-6">
    <div className="px-4 mb-2 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">
      {title}
    </div>
    <div className="space-y-0.5">
      {items.map((item) => (
        <SidebarItem key={item.path} item={item} onClick={onItemClick} />
      ))}
    </div>
  </div>
);

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { theme, toggleTheme } = useTheme();
  const { isAuthed, user, logout } = useAuth();

  const coreNav = [
    { name: 'Explore', path: '/explore', icon: Search },
    { name: 'AI Assistant', path: '/assistant', icon: Sparkles },
    { name: 'Risk Scanner', path: '/scan', icon: Zap },
    { name: 'Founder Playbook', path: '/playbook', icon: ClipboardCheck },
  ];

  const analysisNav = [
    { name: 'Pitch Deck Autopsy', path: '/autopsy', icon: FileText },
    { name: 'Competitor Compare', path: '/compare', icon: GitCompare },
    { name: 'Insights Dashboard', path: '/insights', icon: BarChart2 },
    { name: 'Startup Graph', path: '/graph', icon: Share2 },
  ];

  const learnNav = [
    { name: 'Failure Quiz', path: '/quiz', icon: Brain },
    { name: 'Founder Confessions', path: '/confessions', icon: MessageSquare },
  ];

  const personalNav = [
    { name: 'Bookmarks', path: '/bookmarks', icon: Bookmark },
    { name: theme === 'blue' ? 'Light Mode' : 'Dark Mode', path: '#', icon: theme === 'blue' ? Sun : Moon, isToggle: true },
    { name: 'Profile', path: '/history', icon: User },
  ];

  const handlePersonalAction = (item, e) => {
    if (item.isToggle) {
      e.preventDefault();
      toggleTheme();
    }
    if (window.innerWidth < 1024) setIsOpen(false);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full py-6">
      {/* Logo */}
      <div className="px-6 mb-10 shrink-0">
        <Link to="/" onClick={() => setIsOpen(false)} className="flex items-center gap-3 group">
          <div className="relative">
            <Skull className="w-8 h-8 text-accent animate-pulse group-hover:scale-110 transition-transform" />
            <div className="absolute inset-0 bg-accent/20 blur-lg rounded-full" />
          </div>
          <div>
            <div className="font-display font-black text-lg tracking-tight text-text-primary leading-none">PIVOTVAULT</div>
            <div className="text-[10px] text-text-muted font-medium mt-1">Intelligence Engine</div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 scrollbar-thin scrollbar-thumb-border/40 hover:scrollbar-thumb-accent/20">
        <SidebarSection title="Core" items={coreNav} onItemClick={() => setIsOpen(false)} />
        <SidebarSection title="Analysis" items={analysisNav} onItemClick={() => setIsOpen(false)} />
        <SidebarSection title="Learn" items={learnNav} onItemClick={() => setIsOpen(false)} />
        
        <div className="mb-6">
          <div className="px-4 mb-2 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Personal</div>
          <div className="space-y-0.5">
            <SidebarItem item={personalNav[0]} onClick={() => setIsOpen(false)} />
            
            {/* Theme Toggle Custom Item */}
            <button
              onClick={toggleTheme}
              className="w-full relative flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-text-secondary hover:text-text-primary hover:bg-surface-2 group"
            >
              {theme === 'blue' ? <Sun className="w-5 h-5 text-text-muted group-hover:text-text-primary" /> : <Moon className="w-5 h-5 text-text-muted group-hover:text-text-primary" />}
              <span className="text-sm tracking-tight">{theme === 'blue' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>

            <SidebarItem item={personalNav[2]} onClick={() => setIsOpen(false)} />
            
            {isAuthed && (
              <button
                onClick={() => { logout(); setIsOpen(false); }}
                className="w-full relative flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-text-secondary hover:text-red hover:bg-red/5 group"
              >
                <LogOut className="w-5 h-5 text-text-muted group-hover:text-red" />
                <span className="text-sm tracking-tight">Sign Out</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* User Footer */}
      {isAuthed ? (
        <div className="mt-auto px-3 pt-6 border-t border-border/40">
          <div className="flex items-center gap-3 px-3 py-3 bg-surface-2/50 rounded-xl border border-border/50">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center border border-accent/20">
              <User className="w-4 h-4 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-text-primary truncate">{user?.name}</div>
              <div className="text-[10px] text-text-muted truncate uppercase tracking-tighter">Certified Founder</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-auto px-6">
          <Link 
            to="/login" 
            onClick={() => setIsOpen(false)}
            className="block w-full bg-accent hover:bg-orange-600 text-white py-3 rounded-xl text-center text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-accent/20"
          >
            Access Vault
          </Link>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile Top Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 px-6 bg-bg/80 backdrop-blur-xl border-b border-border/40 z-[50] flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Skull className="w-7 h-7 text-accent" />
          <span className="font-display font-black text-sm tracking-tighter">PIVOTVAULT</span>
        </Link>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg bg-surface-2 border border-border/50"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed top-0 left-0 bottom-0 w-[260px] bg-bg/70 backdrop-blur-2xl border-r border-border/40 z-[40]">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[280px] bg-bg z-[70] lg:hidden shadow-2xl"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;

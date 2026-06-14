import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Skull, Search, Zap, BarChart2, MessageSquare, Share2, Menu, X, Sparkles,
  Bookmark, Brain, GitCompare, ClipboardCheck, Sun, Moon, LogOut, User
} from 'lucide-react';
import { clsx } from 'clsx';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { isAuthed, user, logout } = useAuth();

  const navLinks = [
    { name: 'Explore', path: '/explore', icon: Search },
    { name: 'Autopsy', path: '/autopsy', icon: ClipboardCheck },
    { name: 'Compare', path: '/compare', icon: GitCompare },
    { name: 'AI Assistant', path: '/assistant', icon: Sparkles },
    { name: 'Risk Scanner', path: '/scan', icon: Zap },
    { name: 'Playbook', path: '/playbook', icon: Search },
    { name: 'Quiz', path: '/quiz', icon: Brain },
    { name: 'Insights', path: '/insights', icon: BarChart2 },
    { name: 'Graph', path: '/graph', icon: Share2 },
    { name: 'Confessions', path: '/confessions', icon: MessageSquare },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-bg/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-start h-16 gap-12">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <Skull className="w-8 h-8 text-accent animate-pulse" />
            <span className="font-display font-bold text-xl tracking-tight">PIVOTVAULT</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-5 flex-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={clsx(
                  'flex items-center gap-2 text-sm font-medium transition-colors hover:text-accent whitespace-nowrap',
                  location.pathname === link.path ? 'text-accent' : 'text-text-secondary'
                )}
              >
                <link.icon className="w-4 h-4" />
                {link.name}
              </Link>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-2 shrink-0 ml-auto">
            <button
              onClick={toggleTheme}
              title={`Switch to ${theme === 'blue' ? 'beige' : 'blue'} theme`}
              className="p-2 rounded-lg border border-border bg-surface-2 text-text-secondary hover:text-accent"
            >
              {theme === 'blue' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            {isAuthed ? (
              <>
                <Link to="/bookmarks" className="p-2 rounded-lg border border-border bg-surface-2 text-text-secondary hover:text-accent" title="Saved failures">
                  <Bookmark className="w-4 h-4" />
                </Link>
                <Link to="/history" className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-surface-2 text-sm text-text-secondary hover:text-accent">
                  <User className="w-4 h-4" />
                  {user?.name?.split(' ')[0] || 'Account'}
                </Link>
                <button onClick={logout} className="p-2 rounded-lg border border-border bg-surface-2 text-text-secondary hover:text-danger" title="Sign out">
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <Link to="/login" className="bg-accent text-white px-4 py-2 rounded-lg text-sm font-bold">
                Sign in
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden ml-auto">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-text-secondary hover:text-text-primary p-2"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="lg:hidden border-b border-border bg-surface px-4 pt-2 pb-6 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setIsOpen(false)}
              className={clsx(
                'flex items-center gap-3 px-3 py-3 rounded-md text-base font-medium',
                location.pathname === link.path ? 'bg-surface-2 text-accent' : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
              )}
            >
              <link.icon className="w-5 h-5" />
              {link.name}
            </Link>
          ))}
          <div className="pt-3 mt-3 border-t border-border space-y-2">
            {isAuthed && (
              <>
                <Link to="/bookmarks" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-md text-base font-medium text-text-secondary hover:bg-surface-2 hover:text-text-primary">
                  <Bookmark className="w-5 h-5" /> Saved Failures
                </Link>
                <Link to="/history" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-md text-base font-medium text-text-secondary hover:bg-surface-2 hover:text-text-primary">
                  <User className="w-5 h-5" /> Search History
                </Link>
              </>
            )}
            <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-3 py-3 rounded-md text-base font-medium text-text-secondary hover:bg-surface-2 hover:text-text-primary">
              {theme === 'blue' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              Switch to {theme === 'blue' ? 'beige' : 'blue'}
            </button>
            {isAuthed ? (
              <button onClick={() => { logout(); setIsOpen(false); }} className="w-full flex items-center gap-3 px-3 py-3 rounded-md text-base font-medium text-danger hover:bg-surface-2">
                <LogOut className="w-5 h-5" /> Sign out
              </button>
            ) : (
              <Link to="/login" onClick={() => setIsOpen(false)} className="block bg-accent text-white px-3 py-3 rounded-md text-base font-bold text-center">
                Sign in
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

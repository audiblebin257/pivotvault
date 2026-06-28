import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  Search, Sun, Moon, User, Bookmark, Clock, LogOut, 
  ChevronDown, Sparkles, ShieldAlert 
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import SearchInput from './ui/SearchInput';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

const Header = () => {
  const { theme, toggleTheme } = useTheme();
  const { isAuthed, user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchVal, setSearchVal] = React.useState('');
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef(null);

  // Close dropdown on outside click
  React.useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchVal.trim()) return;
    navigate(`/explore?q=${encodeURIComponent(searchVal)}`);
    setSearchVal('');
  };

  // Map route path to human-readable breadcrumb
  const getBreadcrumb = () => {
    const path = location.pathname;
    if (path === '/') return 'Home';
    if (path === '/explore') return 'Failure Explorer';
    if (path.startsWith('/startup/')) return 'Postmortem Detail';
    if (path === '/scan') return 'Risk Scanner';
    if (path === '/graph') return 'Startup Graph';
    if (path === '/confessions') return 'Confessions Wall';
    if (path === '/insights') return 'Insights Dashboard';
    if (path === '/assistant') return 'AI Assistant';
    if (path === '/bookmarks') return 'Bookmarks';
    if (path === '/history') return 'Search Trail';
    if (path === '/playbook') return 'Founder Playbook';
    if (path === '/quiz') return 'Failure Quiz';
    if (path === '/compare') return 'Competitor Compare';
    if (path === '/ghosts') return 'Hall of Ghosts';
    if (path === '/autopsy') return 'Pitch Deck Autopsy';
    if (path === '/login') return 'Login';
    if (path === '/signup') return 'Sign Up';
    if (path === '/pricing') return 'Pricing Plans';
    return 'PivotVault';
  };

  return (
    <header className="hidden lg:flex items-center justify-between px-8 py-4 border-b border-border bg-bg/85 backdrop-blur-md sticky top-0 z-40 h-20">
      
      {/* Breadcrumb / Title */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">PivotVault</span>
        <span className="text-text-muted">/</span>
        <span className="text-sm font-semibold text-text-primary">{getBreadcrumb()}</span>
      </div>

      {/* Center Search Bar */}
      <div className="w-96 max-w-lg">
        {location.pathname !== '/' && (
          <form onSubmit={handleSearchSubmit}>
            <SearchInput
              placeholder="Search a startup, industry, or lesson..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
            />
          </form>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title="Toggle Theme"
          className="w-10 h-10 rounded-xl bg-surface-2 border border-border flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-border-strong transition-all"
        >
          {theme === 'blue' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* User Auth Profile Dropdown */}
        {isAuthed ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-2 hover:bg-surface-3 border border-border hover:border-border-strong transition-all cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center border border-accent/20">
                <User className="w-4 h-4 text-accent" />
              </div>
              <span className="text-xs font-semibold text-text-primary max-w-[100px] truncate">{user?.name}</span>
              <ChevronDown className={clsx("w-3 h-3 text-text-muted transition-transform", dropdownOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-48 rounded-xl bg-surface border border-border shadow-elevated p-2 space-y-1"
                >
                  <div className="px-3 py-2 border-b border-border/50 mb-1">
                    <p className="text-xs font-bold text-text-primary truncate">{user?.name}</p>
                    <p className="text-[10px] text-text-muted truncate">{user?.email}</p>
                  </div>

                  <Link
                    to="/bookmarks"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-all"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    Bookmarks
                  </Link>

                  <Link
                    to="/history"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-all"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    Search History
                  </Link>

                  <button
                    onClick={() => {
                      logout();
                      setDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-danger hover:bg-danger/10 transition-all text-left"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <Link
            to="/login"
            className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 hover:bg-accent/20 flex items-center justify-center text-accent transition-all"
            title="Profile"
          >
            <User className="w-5 h-5" />
          </Link>
        )}

      </div>

    </header>
  );
};

export default Header;

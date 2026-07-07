import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Search, Sparkles, X } from 'lucide-react';

const Navbar = ({ theme = 'dark', toggleTheme, onSearch }) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const inputRef = useRef(null);
  const isDark = theme === 'dark';

  // Keyboard shortcut: Ctrl+K to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setSearchQuery('');
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    if (onSearch) {
      onSearch('');
    }
    inputRef.current?.focus();
  };

  return (
    <nav className={`sticky top-0 z-50 backdrop-blur-md transition-colors duration-300 border-b ${
      isDark 
        ? 'bg-zinc-950/80 border-zinc-800 text-zinc-100' 
        : 'bg-white/80 border-zinc-200 text-zinc-800'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2.5">
              <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 bg-clip-text text-transparent">
                Weekly Reports
              </span>
            </Link>
          </div>

          {/* Functional Search Bar */}
          {user && (
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className={`relative w-full flex items-center rounded-lg border px-3 py-1.5 transition-all ${
                searchFocused
                  ? isDark 
                    ? 'border-indigo-500 ring-1 ring-indigo-500' 
                    : 'border-indigo-500 ring-1 ring-indigo-500'
                  : isDark 
                    ? 'bg-zinc-900/60 border-zinc-800 text-zinc-400 focus-within:border-zinc-700' 
                    : 'bg-zinc-100/80 border-zinc-200 text-zinc-500 focus-within:border-zinc-300'
              }`}>
                <Search className="w-4 h-4 mr-2 opacity-65 flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  placeholder="Search reports by project, tasks, keywords..."
                  className="bg-transparent border-none text-xs focus:outline-none w-full placeholder-zinc-500"
                />
                {searchQuery ? (
                  <button onClick={clearSearch} className="flex-shrink-0 p-0.5 hover:opacity-70 cursor-pointer">
                    <X size={14} className="opacity-65" />
                  </button>
                ) : (
                  <div className={`text-[10px] px-1.5 py-0.5 rounded border font-sans flex items-center gap-0.5 ${
                    isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-500' : 'bg-white border-zinc-300 text-zinc-400'
                  }`}>
                    <span>Ctrl</span><span>K</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Right side - Theme toggle only (user moved to sidebar) */}
          {user && toggleTheme && (
            <button
              onClick={toggleTheme}
              className={`rounded-full p-2 transition-colors cursor-pointer ${
                isDark
                  ? 'bg-zinc-900 text-yellow-400 hover:bg-zinc-800'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
              aria-label="Toggle theme"
            >
              {isDark ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

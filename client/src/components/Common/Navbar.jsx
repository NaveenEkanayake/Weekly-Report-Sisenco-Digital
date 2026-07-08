import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Search, Sparkles, X, Bell, CheckCheck } from 'lucide-react';
import reportService from '../../services/reportService';

const Navbar = ({ theme = 'dark', toggleTheme, onSearch }) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const inputRef = useRef(null);
  const notifRef = useRef(null);
  const isDark = theme === 'dark';

  // Fetch notifications with polling
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await reportService.getNotifications(true);
      setNotifications(res.data || []);
      setUnreadCount(res.unreadCount || 0);
    } catch (err) {
      // Silent fail
    }
  }, []);

  // Initial fetch + polling every 10 seconds
  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [user, fetchNotifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut: Ctrl+K to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setSearchQuery('');
        setSearchVisible(false);
        setShowNotifications(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (onSearch) onSearch(value);
  };

  const clearSearch = () => {
    setSearchQuery('');
    if (onSearch) onSearch('');
    inputRef.current?.focus();
  };

  const handleMarkAllRead = async () => {
    try {
      await reportService.markAllNotificationsRead();
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await reportService.markNotificationRead(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case 'project_assigned': return '📋';
      case 'project_removed': return '🚫';
      case 'report_reviewed': return '✅';
      case 'report_late': return '⚠️';
      case 'report_submitted': return '📤';
      default: return '🔔';
    }
  };

  const getTimeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
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

          {/* Desktop Search Bar */}
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

          {/* Mobile Search Toggle */}
          {user && (
            <button
              onClick={() => {
                setSearchVisible(!searchVisible);
                if (!searchVisible) setTimeout(() => inputRef.current?.focus(), 100);
              }}
              className={`md:hidden p-2 rounded-full transition-colors cursor-pointer ${
                isDark ? 'text-zinc-400 hover:bg-zinc-800' : 'text-zinc-500 hover:bg-zinc-100'
              }`}
              aria-label="Toggle search"
            >
              <Search size={18} />
            </button>
          )}

          {/* Right side - Notifications + Theme */}
          <div className="flex items-center gap-2">
            {/* Notification Bell */}
            {user && (
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`relative p-2 rounded-full transition-colors cursor-pointer ${
                    isDark
                      ? 'text-zinc-400 hover:bg-zinc-800'
                      : 'text-zinc-500 hover:bg-zinc-100'
                  }`}
                  aria-label="Notifications"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-sm animate-pulse">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {showNotifications && (
                  <div className={`absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border shadow-2xl overflow-hidden z-50 ${
                    isDark
                      ? 'bg-zinc-900 border-zinc-800 text-zinc-100'
                      : 'bg-white border-zinc-200 text-zinc-800'
                  }`}>
                    <div className={`px-4 py-3 border-b flex justify-between items-center ${
                      isDark ? 'border-zinc-800' : 'border-zinc-200'
                    }`}>
                      <h3 className="text-xs font-bold">Notifications</h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="flex items-center gap-1 text-[10px] text-indigo-500 hover:text-indigo-400 font-semibold cursor-pointer"
                        >
                          <CheckCheck size={12} />
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className={`p-6 text-center text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                          <Bell size={24} className="mx-auto mb-2 opacity-40" />
                          <p>No new notifications</p>
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif._id}
                            className={`px-4 py-3 border-b flex gap-3 items-start cursor-pointer transition-colors ${
                              isDark
                                ? 'border-zinc-800/50 hover:bg-zinc-800/50'
                                : 'border-zinc-100 hover:bg-zinc-50'
                            }`}
                            onClick={() => handleMarkRead(notif._id)}
                          >
                            <span className="text-base flex-shrink-0 mt-0.5">{getNotifIcon(notif.type)}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-semibold">{notif.title}</p>
                              <p className={`text-[10px] mt-0.5 line-clamp-2 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                                {notif.message}
                              </p>
                              <p className={`text-[9px] mt-1 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                                {getTimeAgo(notif.createdAt)}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Theme Toggle */}
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
      </div>

      {/* Mobile Search Overlay */}
      {user && searchVisible && (
        <div className={`md:hidden px-4 pb-4 ${isDark ? 'bg-zinc-950/95' : 'bg-white/95'}`}>
          <div className={`flex items-center rounded-lg border px-3 py-2 transition-all ${
            isDark 
              ? 'bg-zinc-900 border-zinc-700' 
              : 'bg-zinc-100 border-zinc-300'
          }`}>
            <Search className="w-4 h-4 mr-2 opacity-65 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search reports..."
              className="bg-transparent border-none text-sm focus:outline-none w-full placeholder-zinc-500"
            />
            <button onClick={() => { clearSearch(); setSearchVisible(false); }} className="flex-shrink-0 p-0.5 hover:opacity-70 cursor-pointer">
              <X size={16} className="opacity-65" />
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

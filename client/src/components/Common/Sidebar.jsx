import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, LogOut } from 'lucide-react';

const Sidebar = ({ theme = 'dark' }) => {
  const { user, isManager, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // For both roles, only show Dashboard link since everything is on the dashboard
  const links = [
    {
      name: 'Dashboard',
      path: isManager() ? '/manager/dashboard' : '/member/dashboard',
      icon: <LayoutDashboard size={18} />,
    },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex md:flex-col w-64 min-h-[calc(100vh-4rem)] transition-colors duration-300 border-r ${
        isDark 
          ? 'bg-zinc-950/80 border-zinc-800 text-zinc-100' 
          : 'bg-white border-zinc-200 text-zinc-800'
      }`}>
        {/* User Profile Section */}
        {user && (
          <div className={`px-5 py-6 border-b ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm ${
                isDark ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700'
              }`}>
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{user.name}</p>
                <p className={`text-[10px] truncate ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  {user.role} {user.department ? `• ${user.department}` : ''}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex-1 px-4 py-6">
          <p className={`text-[10px] font-semibold uppercase tracking-wider mb-4 px-3 ${
            isDark ? 'text-zinc-500' : 'text-zinc-400'
          }`}>
            Navigation
          </p>
          <nav className="space-y-1.5">
            {links.map((link) => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                    active
                      ? isDark
                        ? 'bg-zinc-900 text-indigo-400 border-l-2 border-indigo-500 rounded-l-none'
                        : 'bg-indigo-50 text-indigo-700 border-l-2 border-indigo-600 rounded-l-none'
                      : isDark
                        ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
                  }`}
                >
                  <div className={`transition-colors ${
                    active 
                      ? 'text-indigo-500' 
                      : isDark ? 'text-zinc-500 group-hover:text-zinc-300' : 'text-zinc-400 group-hover:text-zinc-600'
                  }`}>
                    {link.icon}
                  </div>
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Logout at Bottom */}
        <div className={`px-4 py-4 border-t ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              isDark 
                ? 'text-zinc-500 hover:text-red-400 hover:bg-zinc-900/50' 
                : 'text-zinc-500 hover:text-red-600 hover:bg-zinc-50'
            }`}
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 z-40 flex justify-around items-center h-16 border-t backdrop-blur-md transition-colors duration-300 ${
        isDark 
          ? 'bg-zinc-950/95 border-zinc-800 text-zinc-100' 
          : 'bg-white/95 border-zinc-200 text-zinc-800'
      }`}>
        {links.map((link) => {
          const active = isActive(link.path);
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`flex flex-col items-center justify-center gap-1 w-full h-full text-[10px] font-medium transition-colors ${
                active 
                  ? 'text-indigo-500 font-bold' 
                  : isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              <div className={active ? 'text-indigo-500' : 'text-zinc-500'}>
                {link.icon}
              </div>
              <span>{link.name}</span>
            </Link>
          );
        })}
        {/* Mobile Logout */}
        <button
          onClick={handleLogout}
          className={`flex flex-col items-center justify-center gap-1 w-full h-full text-[10px] font-medium transition-colors cursor-pointer ${
            isDark ? 'text-zinc-500 hover:text-red-400' : 'text-zinc-400 hover:text-red-600'
          }`}
        >
          <LogOut size={16} className={isDark ? 'text-zinc-500' : 'text-zinc-400'} />
          <span>Logout</span>
        </button>
      </nav>
    </>
  );
};

export default Sidebar;

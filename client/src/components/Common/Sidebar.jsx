import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, FileText, FolderKanban } from 'lucide-react';

const Sidebar = ({ theme = 'dark' }) => {
  const { isManager } = useAuth();
  const location = useLocation();
  const isDark = theme === 'dark';

  const managerLinks = [
    {
      name: 'Dashboard',
      path: '/manager/dashboard',
      icon: <LayoutDashboard size={18} />,
    },
    {
      name: 'All Reports',
      path: '/manager/reports',
      icon: <FileText size={18} />,
    },
    {
      name: 'Projects',
      path: '/manager/projects',
      icon: <FolderKanban size={18} />,
    },
  ];

  const memberLinks = [
    {
      name: 'Dashboard',
      path: '/member/dashboard',
      icon: <LayoutDashboard size={18} />,
    },
    {
      name: 'Reports History',
      path: '/member/reports',
      icon: <FileText size={18} />,
    },
  ];

  const links = isManager() ? managerLinks : memberLinks;

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`hidden md:block w-64 min-h-[calc(100vh-4rem)] transition-colors duration-300 border-r ${
        isDark 
          ? 'bg-zinc-950/80 border-zinc-800 text-zinc-100' 
          : 'bg-white border-zinc-200 text-zinc-800'
      }`}>
        <div className="px-4 py-8">
          <p className={`text-[10px] font-semibold uppercase tracking-wider mb-4 px-3 ${
            isDark ? 'text-zinc-500' : 'text-zinc-400'
          }`}>
            Categories
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
                        : 'text-zinc-650 hover:text-zinc-900 hover:bg-zinc-50'
                  }`}
                >
                  <div className={`transition-colors ${
                    active 
                      ? 'text-indigo-500' 
                      : isDark ? 'text-zinc-500 group-hover:text-zinc-350' : 'text-zinc-400 group-hover:text-zinc-600'
                  }`}>
                    {link.icon}
                  </div>
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>
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
              className={`flex flex-col items-center justify-center gap-1.5 w-full h-full text-[10px] font-medium transition-colors ${
                active 
                  ? 'text-indigo-500 font-bold' 
                  : isDark ? 'text-zinc-500 hover:text-zinc-305' : 'text-zinc-400 hover:text-zinc-605'
              }`}
            >
              <div className={active ? 'text-indigo-500' : 'text-zinc-500'}>
                {link.icon}
              </div>
              <span>{link.name}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
};

export default Sidebar;

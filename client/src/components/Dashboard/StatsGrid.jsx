import React from 'react';
import { FileText, FileCheck, Clock, AlertTriangle, Activity, Ban } from 'lucide-react';

const StatsGrid = ({ 
  totalReports, 
  submittedCount, 
  draftsCount, 
  lateCount = null, 
  openBlockersCount = null, 
  complianceRate = null, 
  isDark 
}) => {
  const cards = [
    { 
      label: 'Total Reports', 
      count: totalReports, 
      icon: FileText, 
      color: 'text-indigo-500', 
      bg: 'bg-indigo-500/10' 
    },
    { 
      label: 'Submitted Reports', 
      count: submittedCount, 
      icon: FileCheck, 
      color: 'text-emerald-500', 
      bg: 'bg-emerald-500/10' 
    },
    { 
      label: 'Draft Reports', 
      count: draftsCount, 
      icon: Clock, 
      color: 'text-amber-500', 
      bg: 'bg-amber-500/10' 
    }
  ];

  if (lateCount !== null) {
    cards.push({
      label: 'Late Reports',
      count: lateCount,
      icon: Ban,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10'
    });
  }

  if (openBlockersCount !== null) {
    cards.push({
      label: 'Open Blockers',
      count: openBlockersCount,
      icon: AlertTriangle,
      color: 'text-red-500',
      bg: 'bg-red-500/10'
    });
  }

  if (complianceRate !== null) {
    cards.push({
      label: 'Compliance Rate',
      count: `${complianceRate}%`,
      icon: Activity,
      color: 'text-sky-500',
      bg: 'bg-sky-500/10'
    });
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 ${
        cards.length > 4 ? 'lg:grid-cols-3 xl:grid-cols-4' :
        cards.length > 3 ? 'lg:grid-cols-3' :
        'lg:grid-cols-2'
      } gap-6`}>
      {cards.map((stat, idx) => (
        <div key={idx} className={`p-6 rounded-xl border flex items-center gap-4 transition-all duration-300 hover:shadow-md ${
          isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200'
        }`}>
          <div className={`p-3 rounded-lg ${stat.color} ${stat.bg}`}>
            <stat.icon size={20} />
          </div>
          <div>
            <p className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
              {stat.label}
            </p>
            <p className="text-2xl font-bold mt-0.5">{stat.count}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsGrid;

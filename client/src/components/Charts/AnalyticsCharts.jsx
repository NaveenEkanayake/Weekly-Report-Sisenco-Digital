import React from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

const AnalyticsCharts = ({ data, theme = 'dark' }) => {
  const { reportsByProject = [], weeklyTrend = [] } = data || {};
  const isDark = theme === 'dark';

  // Format trend data for display
  const formattedTrend = weeklyTrend.map(item => {
    const date = new Date(item._id);
    return {
      name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      submissions: item.count
    };
  });

  // Project colors for custom bar coloring
  const colors = ['#6366f1', '#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Weekly Submission Trend */}
      <div className={`p-6 rounded-xl border transition-all duration-300 ${
        isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200'
      }`}>
        <h3 className={`text-sm font-semibold mb-6 flex items-center gap-2 ${
          isDark ? 'text-zinc-200' : 'text-zinc-800'
        }`}>
          📈 Weekly Submission Trend
        </h3>
        <div className="h-[260px] w-full">
          {formattedTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={formattedTrend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSubmissions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#27272a' : '#f4f4f5'} />
                <XAxis 
                  dataKey="name" 
                  stroke={isDark ? '#71717a' : '#a1a1aa'} 
                  fontSize={10} 
                  tickLine={false} 
                />
                <YAxis 
                  stroke={isDark ? '#71717a' : '#a1a1aa'} 
                  fontSize={10} 
                  tickLine={false} 
                  allowDecimals={false}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: isDark ? '#18181b' : '#ffffff',
                    borderColor: isDark ? '#27272a' : '#e4e4e7',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: isDark ? '#f4f4f5' : '#18181b'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="submissions" 
                  stroke="#6366f1" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorSubmissions)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-zinc-500">
              No trend data available
            </div>
          )}
        </div>
      </div>

      {/* Reports by Project */}
      <div className={`p-6 rounded-xl border transition-all duration-300 ${
        isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200'
      }`}>
        <h3 className={`text-sm font-semibold mb-6 flex items-center gap-2 ${
          isDark ? 'text-zinc-200' : 'text-zinc-800'
        }`}>
          📊 Workload by Project (Hours Worked)
        </h3>
        <div className="h-[260px] w-full">
          {reportsByProject.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportsByProject} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#27272a' : '#f4f4f5'} />
                <XAxis 
                  dataKey="projectName" 
                  stroke={isDark ? '#71717a' : '#a1a1aa'} 
                  fontSize={10} 
                  tickLine={false}
                />
                <YAxis 
                  stroke={isDark ? '#71717a' : '#a1a1aa'} 
                  fontSize={10} 
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: isDark ? '#18181b' : '#ffffff',
                    borderColor: isDark ? '#27272a' : '#e4e4e7',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: isDark ? '#f4f4f5' : '#18181b'
                  }}
                  formatter={(value, name) => [value, name === 'totalHours' ? 'Hours Worked' : 'Reports count']}
                />
                <Bar dataKey="totalHours" radius={[4, 4, 0, 0]}>
                  {reportsByProject.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-zinc-500">
              No project analytics data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsCharts;
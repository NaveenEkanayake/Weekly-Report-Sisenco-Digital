import React from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#a855f7', '#3b82f6', '#ec4899', '#14b8a6'];

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
  const radius = outerRadius + 25;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="currentColor" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={10} className="font-medium">
      {name} ({(percent * 100).toFixed(0)}%)
    </text>
  );
};

const CustomTooltip = ({ active, payload, isDark, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className={`px-3 py-2 rounded-lg border text-xs shadow-lg ${
        isDark ? 'bg-zinc-900 border-zinc-700 text-zinc-200' : 'bg-white border-zinc-200 text-zinc-800'
      }`}>
        <p className="font-semibold mb-1">{label || payload[0].name}</p>
        {payload.map((entry, idx) => (
          <p key={idx} style={{ color: entry.color }}>
            {entry.name}: <span className="font-bold">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const AnalyticsCharts = ({ data, theme = 'dark' }) => {
  const { reportsByProject = [], weeklyTrend = [], summary = {} } = data || {};
  const isDark = theme === 'dark';

  // Format trend data for display
  const formattedTrend = weeklyTrend.map(item => {
    const [year, month, day] = item._id.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return {
      name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      submissions: item.count
    };
  });

  // Compute submission status breakdown from summary
  const statusData = [
    { name: 'Submitted', value: summary.submittedCount || 0, color: '#10b981' },
    { name: 'Draft', value: summary.draftCount || 0, color: '#f59e0b' },
    { name: 'Reviewed', value: summary.reviewedCount || 0, color: '#6366f1' },
  ].filter(item => item.value > 0);

  // Fallback status data if summary doesn't have reviewedCount
  const fallbackStatusData = statusData.length === 0
    ? [
        { name: 'Submitted', value: summary.submittedCount || 1, color: '#10b981' },
        { name: 'Draft', value: summary.draftCount || 1, color: '#f59e0b' },
      ].filter(item => item.value > 0)
    : statusData;

  // Hours by project (pie chart data from reportsByProject)
  const hoursData = reportsByProject
    .filter(item => item.totalHours > 0)
    .map((item, idx) => ({
      name: item.projectName || 'Unknown',
      value: item.totalHours,
      color: COLORS[idx % COLORS.length]
    }));

  const textColor = isDark ? '#f4f4f5' : '#18181b';
  const mutedColor = isDark ? '#71717a' : '#a1a1aa';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Weekly Submission Trend - Gantt-Style Chart */}
      <div className={`p-6 rounded-xl border transition-all duration-300 lg:col-span-2 ${
        isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200'
      }`}>
        <h3 className={`text-sm font-semibold mb-6 flex items-center gap-2 ${
          isDark ? 'text-zinc-200' : 'text-zinc-800'
        }`}>
          📊 Weekly Submission Timeline (Gantt View)
        </h3>
        <div className="h-[300px] w-full">
          {formattedTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={formattedTrend}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 50, bottom: 0 }}
                barSize={28}
                barGap={4}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDark ? '#27272a' : '#f4f4f5'} />
                <XAxis type="number" stroke={mutedColor} fontSize={10} tickLine={false} allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke={mutedColor}
                  fontSize={10}
                  tickLine={false}
                  width={80}
                />
                <Tooltip content={<CustomTooltip isDark={isDark} />} />
                <Bar
                  dataKey="submissions"
                  radius={[0, 6, 6, 0]}
                  background={{ fill: isDark ? '#27272a' : '#f4f4f5', radius: [0, 6, 6, 0] }}
                >
                  {formattedTrend.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.submissions > 0 ? '#6366f1' : isDark ? '#3f3f46' : '#d4d4d8'}
                      opacity={Math.min(0.4 + (entry.submissions / Math.max(...formattedTrend.map(d => d.submissions), 1)) * 0.6, 1)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-zinc-500">No trend data available</div>
          )}
        </div>
      </div>

      {/* Submission Status Breakdown (Pie Chart) */}
      <div className={`p-6 rounded-xl border transition-all duration-300 ${
        isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200'
      }`}>
        <h3 className={`text-sm font-semibold mb-6 flex items-center gap-2 ${
          isDark ? 'text-zinc-200' : 'text-zinc-800'
        }`}>
          🥧 Submission Status Breakdown
        </h3>
        <div className="h-[260px] w-full">
          {fallbackStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={fallbackStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  label={renderCustomizedLabel}
                >
                  {fallbackStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke={isDark ? '#18181b' : '#fff'} strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip isDark={isDark} />} />
                <Legend
                  verticalAlign="bottom"
                  height={30}
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => <span className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-zinc-500">No submission data available</div>
          )}
        </div>
      </div>

      {/* Workload by Project (Pie Chart - Hours) */}
      <div className={`p-6 rounded-xl border transition-all duration-300 ${
        isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200'
      }`}>
        <h3 className={`text-sm font-semibold mb-6 flex items-center gap-2 ${
          isDark ? 'text-zinc-200' : 'text-zinc-800'
        }`}>
          🕐 Hours Worked by Project
        </h3>
        <div className="h-[260px] w-full">
          {hoursData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={hoursData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={renderCustomizedLabel}
                >
                  {hoursData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke={isDark ? '#18181b' : '#fff'} strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip isDark={isDark} />} />
                <Legend
                  verticalAlign="bottom"
                  height={30}
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => <span className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-zinc-500">No hours data available</div>
          )}
        </div>
      </div>

      {/* Reports by Project (Bar Chart) */}
      <div className={`p-6 rounded-xl border transition-all duration-300 lg:col-span-2 ${
        isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200'
      }`}>
        <h3 className={`text-sm font-semibold mb-6 flex items-center gap-2 ${
          isDark ? 'text-zinc-200' : 'text-zinc-800'
        }`}>
          📊 Reports Count by Project
        </h3>
        <div className="h-[260px] w-full">
          {reportsByProject.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportsByProject} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#27272a' : '#f4f4f5'} />
                <XAxis dataKey="projectName" stroke={mutedColor} fontSize={10} tickLine={false} />
                <YAxis stroke={mutedColor} fontSize={10} tickLine={false} />
                <Tooltip content={<CustomTooltip isDark={isDark} />} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {reportsByProject.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-zinc-500">No project data available</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsCharts;

import React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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
  const { reportsByProject = [], weeklyTrend = [], summary = {}, charts } = data || {};
  const isDark = theme === 'dark';

  // Detect data source: new metrics-charts format vs old analytics format
  const useNewFormat = charts && charts.submissionStatus;

  // ── New format data ──
  const submissionStatusData = useNewFormat
    ? charts.submissionStatus
    : [
        { status: 'Submitted', value: summary.submittedCount || 0, color: '#10b981' },
        { status: 'Draft', value: summary.draftCount || 0, color: '#f59e0b' },
        { status: 'Reviewed', value: summary.reviewedCount || 0, color: '#6366f1' },
      ].filter(d => d.value > 0);

  const workloadData = useNewFormat
    ? charts.workloadDistribution
    : reportsByProject
        .filter(item => item.totalHours > 0)
        .map((item, idx) => ({
          projectName: item.projectName || 'Unknown',
          hours: item.totalHours,
          taskCount: item.count,
          color: COLORS[idx % COLORS.length]
        }));

  const trendData = useNewFormat
    ? charts.tasksCompletedTrend
    : weeklyTrend.map(item => {
        const [year, month, day] = item._id.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        return {
          week: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          completedCount: item.count
        };
      });

  // Fallback for old format status data
  const fallbackSubmissionStatus = submissionStatusData.length === 0 && !useNewFormat
    ? [
        { status: 'Submitted', value: summary.submittedCount || 1, color: '#10b981' },
        { status: 'Draft', value: summary.draftCount || 1, color: '#f59e0b' },
      ].filter(d => d.value > 0)
    : submissionStatusData;

  // Workload chart data (with taskCount for bar chart)
  const workloadChartData = workloadData.map((item, idx) => ({
    name: item.projectName || item.name || 'Unknown',
    hours: item.hours || item.value || 0,
    tasks: item.taskCount || 0,
    color: item.color || COLORS[idx % COLORS.length]
  }));

  // Trend chart data
  const trendChartData = trendData.map(item => ({
    name: item.week || item.name,
    count: item.completedCount || item.submissions || 0
  }));

  // Donut chart data (new format uses status + value, old uses name + value)
  const donutData = fallbackSubmissionStatus.map(d => ({
    name: d.status || d.name,
    value: d.value,
    color: d.color
  }));

  const textColor = isDark ? '#f4f4f5' : '#18181b';
  const mutedColor = isDark ? '#71717a' : '#a1a1aa';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Layer 2: Left — Submission Status Donut Chart */}
      <div className={`p-6 rounded-xl border transition-all duration-300 ${
        isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200'
      }`}>
        <h3 className={`text-sm font-semibold mb-6 flex items-center gap-2 ${
          isDark ? 'text-zinc-200' : 'text-zinc-800'
        }`}>
          🥧 Submission Status Breakdown
        </h3>
        <div className="h-[260px] w-full">
          {donutData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  label={renderCustomizedLabel}
                >
                  {donutData.map((entry, index) => (
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

      {/* Layer 2: Right — Workload Distribution Bar Chart */}
      <div className={`p-6 rounded-xl border transition-all duration-300 ${
        isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200'
      }`}>
        <h3 className={`text-sm font-semibold mb-6 flex items-center gap-2 ${
          isDark ? 'text-zinc-200' : 'text-zinc-800'
        }`}>
          📊 Workload Distribution by Project
        </h3>
        <div className="h-[260px] w-full">
          {workloadChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workloadChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#27272a' : '#f4f4f5'} />
                <XAxis dataKey="name" stroke={mutedColor} fontSize={10} tickLine={false} />
                <YAxis stroke={mutedColor} fontSize={10} tickLine={false} />
                <Tooltip content={<CustomTooltip isDark={isDark} />} />
                <Bar dataKey="hours" name="Hours Worked" radius={[4, 4, 0, 0]}>
                  {workloadChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-zinc-500">No workload data available</div>
          )}
        </div>
      </div>

      {/* Layer 2: Bottom — Tasks Completed Trend Line Chart */}
      <div className={`p-6 rounded-xl border transition-all duration-300 lg:col-span-2 ${
        isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200'
      }`}>
        <h3 className={`text-sm font-semibold mb-6 flex items-center gap-2 ${
          isDark ? 'text-zinc-200' : 'text-zinc-800'
        }`}>
          📈 Tasks Completed Trend
        </h3>
        <div className="h-[280px] w-full">
          {trendChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#27272a' : '#f4f4f5'} />
                <XAxis dataKey="name" stroke={mutedColor} fontSize={10} tickLine={false} />
                <YAxis stroke={mutedColor} fontSize={10} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip isDark={isDark} />} />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Tasks Completed"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#818cf8' }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-zinc-500">No trend data available</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsCharts;

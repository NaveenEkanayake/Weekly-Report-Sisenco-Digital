import React, { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, Clock, User, Folder, Calendar, Filter, ChevronDown, ChevronUp, UserCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import adminService from '../../services/adminService';
import { getReportStatusStyle } from '../../utils/statusStyles';

const LateSubmissionsAuditLog = ({ isDark }) => {
  const [lateData, setLateData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortField, setSortField] = useState('submittedAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filterPeriod, setFilterPeriod] = useState('30');
  const [selectedMember, setSelectedMember] = useState('');
  const [expandedMember, setExpandedMember] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchLateSubmissions();
  }, [filterPeriod]);

  // Compute trend data: group late submissions by week and member
  const trendData = useMemo(() => {
    if (!lateData?.lateSubmissions?.length) return [];
    const weekMap = {};
    for (const sub of lateData.lateSubmissions) {
      const d = new Date(sub.weekStartDate);
      const weekLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!weekMap[weekLabel]) weekMap[weekLabel] = { week: weekLabel, date: d };
      const memberName = sub.user?.name || 'Unknown';
      if (!weekMap[weekLabel][memberName]) weekMap[weekLabel][memberName] = 0;
      weekMap[weekLabel][memberName]++;
    }
    return Object.values(weekMap).sort((a, b) => a.date - b.date).map(({ date, ...rest }) => rest);
  }, [lateData]);

  // Get top 5 members by late count for the chart legend
  const topMembers = useMemo(() => {
    const counts = {};
    for (const sub of lateData?.lateSubmissions || []) {
      const name = sub.user?.name || 'Unknown';
      counts[name] = (counts[name] || 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);
  }, [lateData]);


  const fetchLateSubmissions = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(filterPeriod));

      const response = await adminService.getLateSubmissions({
        startDate: startDate.toISOString().split('T')[0],
        endDate: now.toISOString().split('T')[0],
      });
      setLateData(response.data);
    } catch (error) {
      console.error('Error fetching late submissions:', error);
      setError('Failed to load late submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Filter submissions by selected member
  const filteredSubmissions = lateData?.lateSubmissions
    ? (selectedMember
        ? lateData.lateSubmissions.filter(sub => sub.user?._id === selectedMember)
        : lateData.lateSubmissions)
    : [];

  // Get unique members for filter dropdown
  const uniqueMembers = lateData?.lateSubmissions
    ? [...new Map(lateData.lateSubmissions.map(sub => [sub.user?._id, sub.user])).values()]
        .filter(Boolean)
        .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    : [];

  const sortedSubmissions = filteredSubmissions ? [...filteredSubmissions].sort((a, b) => {
    let aVal, bVal;
    switch (sortField) {
      case 'member':
        aVal = a.user?.name || '';
        bVal = b.user?.name || '';
        break;
      case 'project':
        aVal = a.project?.name || '';
        bVal = b.project?.name || '';
        break;
      case 'submittedAt':
        aVal = new Date(a.submittedAt);
        bVal = new Date(b.submittedAt);
        break;
      case 'weekStartDate':
        aVal = new Date(a.weekStartDate);
        bVal = new Date(b.weekStartDate);
        break;
      default:
        aVal = new Date(a.submittedAt);
        bVal = new Date(b.submittedAt);
    }
    if (sortDirection === 'asc') {
      return aVal > bVal ? 1 : -1;
    }
    return aVal < bVal ? 1 : -1;
  }) : [];

  const renderSortIcon = (field) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateTime = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className={`rounded-xl border p-6 ${isDark ? 'bg-zinc-900/20 border-zinc-800' : 'bg-white border-zinc-200'}`}>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={16} className="text-amber-500" />
          <h2 className="text-sm font-semibold">Late Submissions Audit Log</h2>
        </div>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className={`h-12 rounded ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'}`} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-xl border p-6 ${isDark ? 'bg-zinc-900/20 border-zinc-800' : 'bg-white border-zinc-200'}`}>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={16} className="text-amber-500" />
          <h2 className="text-sm font-semibold">Late Submissions Audit Log</h2>
        </div>
        <div className="p-4 text-center">
          <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>{error}</p>
          <button onClick={fetchLateSubmissions} className="mt-2 text-xs text-indigo-500 hover:text-indigo-400">Retry</button>
        </div>
      </div>
    );
  }

  // Group late submissions by member
  const memberGroups = {};
  for (const sub of sortedSubmissions) {
    const memberId = sub.user?._id || 'unknown';
    if (!memberGroups[memberId]) {
      memberGroups[memberId] = {
        user: sub.user,
        submissions: [],
        totalLate: 0,
      };
    }
    memberGroups[memberId].submissions.push(sub);
    memberGroups[memberId].totalLate++;
  }
  const memberList = Object.values(memberGroups).sort((a, b) => b.totalLate - a.totalLate);


  const MEMBER_COLORS = ['#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6', '#10b981'];

  return (
    <div className={`rounded-xl border ${isDark ? 'bg-zinc-900/20 border-zinc-800' : 'bg-white border-zinc-200'}`}>
      {/* Header */}
      <div className={`px-6 py-4 border-b ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${isDark ? 'bg-amber-950/30' : 'bg-amber-50'}`}>
              <AlertTriangle size={16} className="text-amber-500" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Late Submissions Audit Log</h2>
              <p className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                Reports submitted after project deadlines
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={14} className={isDark ? 'text-zinc-400' : 'text-zinc-500'} />
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
              className={`text-xs px-2 py-1 rounded border cursor-pointer ${
                isDark 
                  ? 'bg-zinc-800 border-zinc-700 text-zinc-300' 
                  : 'bg-white border-zinc-200 text-zinc-700'
              }`}
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
            {uniqueMembers.length > 0 && (
              <select
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value)}
                className={`text-xs px-2 py-1 rounded border cursor-pointer ${
                  isDark 
                    ? 'bg-zinc-800 border-zinc-700 text-zinc-300' 
                    : 'bg-white border-zinc-200 text-zinc-700'
                }`}
              >
                <option value="">All Members</option>
                {uniqueMembers.map((member) => (
                  <option key={member._id} value={member._id}>
                    {member.name || 'Unknown'}
                  </option>
                ))}
              </select>
            )}
            {selectedMember && (
              <button
                onClick={() => setSelectedMember('')}
                className={`text-[10px] px-2 py-0.5 rounded-full cursor-pointer transition-colors ${
                  isDark
                    ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                    : 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300'
                }`}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Per-Member Summary Cards */}
        {memberList.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {memberList.map((member) => (
              <button
                key={member.user?._id}
                onClick={() => { setExpandedMember(member.user); setShowModal(true); }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                  expandedMember === member.user?._id
                    ? isDark
                      ? 'bg-amber-950/40 text-amber-400 border-amber-900/60'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                    : isDark
                      ? 'bg-zinc-800/50 text-zinc-300 border-zinc-700/50 hover:bg-zinc-800'
                      : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                }`}
              >
                <UserCircle size={14} className="text-zinc-400" />
                <span>{member.user?.name || 'Unknown'}</span>
                <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                  isDark ? 'bg-amber-950/40 text-amber-400' : 'bg-amber-100 text-amber-700'
                }`}>
                  {member.totalLate}
                </span>
                {expandedMember === member.user?._id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {lateData?.summary && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
            <div className={`p-3 rounded-lg ${isDark ? 'bg-zinc-800/50' : 'bg-zinc-50'}`}>
              <p className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                Total Late
              </p>
              <p className="text-lg font-bold text-amber-500">{lateData.summary.totalLate}</p>
            </div>
            <div className={`p-3 rounded-lg ${isDark ? 'bg-zinc-800/50' : 'bg-zinc-50'}`}>
              <p className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                Members Affected
              </p>
              <p className="text-lg font-bold">{lateData.summary.uniqueMembers}</p>
            </div>
            {lateData.summary.lateByProject?.slice(0, 1).map((proj, i) => (
              <div key={i} className={`p-3 rounded-lg ${isDark ? 'bg-zinc-800/50' : 'bg-zinc-50'}`}>
                <p className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  Most Affected Project
                </p>
                <p className="text-sm font-semibold truncate">{proj.name}</p>
                <p className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>{proj.count} late</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Trend Chart */}
      {trendData.length > 0 && (
        <div className={`px-6 py-4 border-b ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
          <h3 className={`text-xs font-semibold mb-3 ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
            📈 Late Submissions Over Time
          </h3>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#27272a' : '#f4f4f5'} />
                <XAxis dataKey="week" stroke={isDark ? '#71717a' : '#a1a1aa'} fontSize={10} tickLine={false} />
                <YAxis stroke={isDark ? '#71717a' : '#a1a1aa'} fontSize={10} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#18181b' : '#ffffff',
                    border: `1px solid ${isDark ? '#3f3f46' : '#e5e7eb'}`,
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                  labelStyle={{ color: isDark ? '#e4e4e7' : '#18181b', fontWeight: 600 }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={30}
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => <span className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>{value}</span>}
                />
                {topMembers.map((name, idx) => (
                  <Line
                    key={name}
                    type="monotone"
                    dataKey={name}
                    stroke={MEMBER_COLORS[idx % MEMBER_COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Member History Modal */}
      {showModal && expandedMember && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border shadow-2xl ${
            isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-800'
          }`}>
            <div className={`p-6 border-b flex justify-between items-center ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
              <div className="flex items-center gap-3">
                <UserCircle size={24} className="text-amber-500" />
                <div>
                  <h2 className="text-sm font-bold">{expandedMember.name || 'Unknown'}</h2>
                  <p className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    {expandedMember.department || 'N/A'} &bull; Late submission history
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setShowModal(false); setExpandedMember(null); }}
                className="text-zinc-500 hover:text-zinc-300 cursor-pointer text-xl leading-none"
              >
                &times;
              </button>
            </div>
            <div className="p-6 space-y-3">
              {memberGroups[expandedMember._id]?.submissions.map((sub) => (
                <div
                  key={sub._id}
                  className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-4 rounded-lg border ${
                    isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                  }`}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <Folder size={14} className="text-indigo-400 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold">{sub.project?.name || 'Unknown'}</p>
                      <p className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                        Deadline: {formatDate(sub.project?.endDate)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={12} className={isDark ? 'text-zinc-500' : 'text-zinc-400'} />
                    <span className="text-[10px]">
                      Week: {formatDate(sub.weekStartDate)} → {formatDate(sub.weekEndDate)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={12} className="text-amber-500" />
                    <span className="text-[10px] font-medium text-amber-500">
                      Submitted: {formatDateTime(sub.submittedAt)}
                    </span>
                  </div>
                  <div>
                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full border ${getReportStatusStyle('Late', isDark)}`}>
                      {sub.wasAutoDetected ? 'Auto-detected' : 'Manual'}
                    </span>
                  </div>
                </div>
              ))}
              {!memberGroups[expandedMember._id] && (
                <p className={`text-center py-8 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  No submissions found for this member.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        {sortedSubmissions.length === 0 ? (
          <div className="p-8 text-center">
            <Clock size={32} className={`mx-auto mb-3 ${isDark ? 'text-zinc-600' : 'text-zinc-300'}`} />
            <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
              No late submissions found for this period
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className={`border-b ${isDark ? 'border-zinc-800 text-zinc-400' : 'border-zinc-200 text-zinc-500'}`}>
                <th 
                  className="p-4 cursor-pointer hover:text-amber-500 select-none"
                  onClick={() => handleSort('member')}
                >
                  <span className="flex items-center gap-1">Member {renderSortIcon('member')}</span>
                </th>
                <th 
                  className="p-4 cursor-pointer hover:text-amber-500 select-none"
                  onClick={() => handleSort('project')}
                >
                  <span className="flex items-center gap-1">Project {renderSortIcon('project')}</span>
                </th>
                <th 
                  className="p-4 cursor-pointer hover:text-amber-500 select-none"
                  onClick={() => handleSort('weekStartDate')}
                >
                  <span className="flex items-center gap-1">Week {renderSortIcon('weekStartDate')}</span>
                </th>
                <th 
                  className="p-4 cursor-pointer hover:text-amber-500 select-none"
                  onClick={() => handleSort('submittedAt')}
                >
                  <span className="flex items-center gap-1">Submitted At {renderSortIcon('submittedAt')}</span>
                </th>
                <th className="p-4">Project Deadline</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-zinc-800/80' : 'divide-zinc-200'}`}>
              {sortedSubmissions.map((submission) => (
                <tr 
                  key={submission._id} 
                  className={`transition-colors ${isDark ? 'hover:bg-zinc-800/30' : 'hover:bg-zinc-50'}`}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <User size={14} className={isDark ? 'text-zinc-500' : 'text-zinc-400'} />
                      <div>
                        <p className="font-medium">{submission.user?.name || 'Unknown'}</p>
                        <p className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                          {submission.user?.department || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Folder size={14} className={isDark ? 'text-zinc-500' : 'text-zinc-400'} />
                      <span>{submission.project?.name || 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className={isDark ? 'text-zinc-500' : 'text-zinc-400'} />
                      <div>
                        <p>{formatDate(submission.weekStartDate)}</p>
                        <p className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                          to {formatDate(submission.weekEndDate)}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-amber-500" />
                      <span className="font-medium text-amber-500">
                        {formatDateTime(submission.submittedAt)}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={isDark ? 'text-zinc-400' : 'text-zinc-500'}>
                      {formatDate(submission.project?.endDate)}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getReportStatusStyle('Late', isDark)}`}>
                      {submission.wasAutoDetected ? 'Auto-detected Late' : 'Late (Manual)'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default LateSubmissionsAuditLog;

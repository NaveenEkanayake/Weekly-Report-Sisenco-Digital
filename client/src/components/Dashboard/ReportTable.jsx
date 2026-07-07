import React, { useState } from 'react';
import { Edit, Trash2, Calendar, Folder, Clock, CheckCircle, ChevronUp, ChevronDown, Eye } from 'lucide-react';

const ReportTable = ({ 
  reports, 
  role, 
  onEdit, 
  onDelete, 
  onReview = null,
  isDark 
}) => {
  const [sortField, setSortField] = useState('weekStartDate');
  const [sortDirection, setSortDirection] = useState('desc');

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getStatusStyle = (status) => {
    const styles = {
      Draft: isDark 
        ? 'bg-zinc-800/80 text-zinc-400 border border-zinc-700/60' 
        : 'bg-zinc-105 text-zinc-600 border border-zinc-200',
      Submitted: isDark 
        ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/60' 
        : 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      Reviewed: isDark 
        ? 'bg-indigo-950/40 text-indigo-400 border border-indigo-900/60' 
        : 'bg-indigo-50 text-indigo-700 border border-indigo-200',
    };
    return styles[status] || styles.Draft;
  };

  // Sorting logic
  const sortedReports = [...reports].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    // Handle nested fields
    if (sortField === 'user') {
      aVal = a.user?.name || '';
      bVal = b.user?.name || '';
    } else if (sortField === 'project') {
      aVal = a.project?.name || '';
      bVal = b.project?.name || '';
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const renderSortIcon = (field) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp size={14} className="inline ml-1" /> : <ChevronDown size={14} className="inline ml-1" />;
  };

  return (
    <div className="overflow-x-auto w-full">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className={`border-b font-semibold ${isDark ? 'border-zinc-800 text-zinc-400 bg-zinc-900/20' : 'border-zinc-200 text-zinc-500 bg-zinc-50'}`}>
            {role === 'Manager' && (
              <th onClick={() => handleSort('user')} className="p-4 cursor-pointer hover:text-indigo-500 select-none">
                Member {renderSortIcon('user')}
              </th>
            )}
            <th onClick={() => handleSort('weekStartDate')} className="p-4 cursor-pointer hover:text-indigo-500 select-none">
              Week {renderSortIcon('weekStartDate')}
            </th>
            <th onClick={() => handleSort('project')} className="p-4 cursor-pointer hover:text-indigo-500 select-none">
              Project {renderSortIcon('project')}
            </th>
            <th className="p-4">Completed Tasks</th>
            <th className="p-4">Planned Tasks</th>
            <th onClick={() => handleSort('hoursWorked')} className="p-4 cursor-pointer hover:text-indigo-500 select-none">
              Hours {renderSortIcon('hoursWorked')}
            </th>
            <th onClick={() => handleSort('status')} className="p-4 cursor-pointer hover:text-indigo-500 select-none">
              Status {renderSortIcon('status')}
            </th>
            <th className="p-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className={`divide-y ${isDark ? 'divide-zinc-800/80 text-zinc-300' : 'divide-zinc-200 text-zinc-700'}`}>
          {sortedReports.length === 0 ? (
            <tr>
              <td colSpan={role === 'Manager' ? 8 : 7} className="p-8 text-center text-zinc-500 font-medium">
                No reports found matching criteria.
              </td>
            </tr>
          ) : (
            sortedReports.map((report) => (
              <tr key={report._id} className={`transition-colors ${isDark ? 'hover:bg-zinc-900/10' : 'hover:bg-zinc-50/50'}`}>
                {role === 'Manager' && (
                  <td className="p-4">
                    <div className="font-medium text-zinc-100">{report.user?.name || 'Unknown'}</div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">{report.user?.department || 'N/A'}</div>
                  </td>
                )}
                <td className="p-4 whitespace-nowrap">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Calendar size={13} className="text-zinc-500" />
                    <span>
                      {new Date(report.weekStartDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                    <span className="text-zinc-500">&rarr;</span>
                    <span>
                      {new Date(report.weekEndDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </td>
                <td className="p-4">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${
                    isDark ? 'bg-zinc-850 border-zinc-750 text-indigo-300' : 'bg-indigo-50 border-indigo-100 text-indigo-700'
                  }`}>
                    <Folder size={10} />
                    {report.project?.name || report.project || 'General'}
                  </span>
                </td>
                <td className="p-4 max-w-[200px] truncate" title={report.tasksCompleted}>
                  {report.tasksCompleted}
                </td>
                <td className="p-4 max-w-[200px] truncate" title={report.tasksPlanned}>
                  {report.tasksPlanned}
                </td>
                <td className="p-4 font-semibold">
                  {report.hoursWorked !== undefined && report.hoursWorked !== null ? `${report.hoursWorked} hrs` : '-'}
                </td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getStatusStyle(report.status)}`}>
                    {report.status}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-1">
                    {role === 'Manager' ? (
                      <>
                        {report.status === 'Submitted' && onReview && (
                          <button
                            onClick={() => onReview(report._id)}
                            className="p-1.5 rounded hover:bg-emerald-500/10 text-emerald-400 cursor-pointer transition-colors"
                            title="Mark Reviewed"
                          >
                            <CheckCircle size={15} />
                          </button>
                        )}
                        <button
                          onClick={() => onEdit(report)}
                          className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 cursor-pointer transition-colors"
                          title="View Details"
                        >
                          <Eye size={15} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => onEdit(report)}
                          className="p-1.5 rounded hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 cursor-pointer transition-colors"
                          title="Edit Report"
                          disabled={report.status === 'Reviewed'}
                          style={{ opacity: report.status === 'Reviewed' ? 0.3 : 1 }}
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          onClick={() => onDelete(report._id)}
                          className="p-1.5 rounded hover:bg-red-500/10 text-red-400 cursor-pointer transition-colors"
                          title="Delete Report"
                          disabled={report.status === 'Reviewed'}
                          style={{ opacity: report.status === 'Reviewed' ? 0.3 : 1 }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ReportTable;

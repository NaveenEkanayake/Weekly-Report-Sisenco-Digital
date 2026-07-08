import React, { useState } from 'react';
import { Edit, Trash2, Calendar, Folder, CheckCircle, ChevronUp, ChevronDown, Eye, ChevronRight, AlertTriangle } from 'lucide-react';
import { getReportStatusStyle } from '../../utils/statusStyles';

const MobileReportCard = ({ report, role, onEdit, onDelete, onReview, isDark }) => {
  return (
    <div className={`p-4 rounded-xl border ${
      isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200'
    }`}>
      {/* Top row - Member + Status */}
      <div className="flex justify-between items-start mb-3">
        {role === 'Manager' && (
          <div>
            <p className="text-sm font-semibold">{report.user?.name || 'Unknown'}</p>
            <p className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>{report.user?.department || 'N/A'}</p>
          </div>
        )}
        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getReportStatusStyle(report.status, isDark)}`}>
          {report.status}
        </span>
      </div>

      {/* Late Warning Banner */}
      {report.status === 'Late' && (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg mb-3 text-[10px] font-semibold ${
          isDark ? 'bg-amber-950/30 text-amber-400 border border-amber-900/40' : 'bg-amber-50 text-amber-700 border border-amber-200'
        }`}>
          <AlertTriangle size={13} className="shrink-0" />
          <span>This report was submitted after the project deadline.</span>
        </div>
      )}

      {/* Week + Project */}
      <div className="flex flex-wrap gap-3 mb-3">
        <div className="flex items-center gap-1.5">
          <Calendar size={12} className={isDark ? 'text-zinc-500' : 'text-zinc-400'} />
          <span className={`text-xs ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>
            {new Date(report.weekStartDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            {' — '}
            {new Date(report.weekEndDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Folder size={12} className={isDark ? 'text-zinc-500' : 'text-zinc-400'} />
          <span className={`text-xs ${isDark ? 'text-indigo-300' : 'text-indigo-600'}`}>
            {report.project?.name || report.project || 'General'}
          </span>
        </div>
      </div>

      {/* Tasks preview */}
      <div className="space-y-1.5 mb-3">
        <div>
          <p className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Completed</p>
          <p className={`text-xs line-clamp-1 ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>{report.tasksCompleted}</p>
        </div>
        <div>
          <p className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Hours</p>
          <p className={`text-xs font-semibold ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>
            {report.hoursWorked !== undefined && report.hoursWorked !== null ? `${report.hoursWorked} hrs` : '-'}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className={`flex justify-end gap-2 pt-2 border-t ${isDark ? 'border-zinc-800/50' : 'border-zinc-200'}`}>
        {role === 'Manager' ? (
          <>
            {report.status === 'Submitted' && onReview && (
              <button
                onClick={() => onReview(report._id)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-semibold bg-emerald-950/40 text-emerald-400 border border-emerald-900/60 hover:bg-emerald-950/60 cursor-pointer transition-all"
              >
                <CheckCircle size={12} />
                Review
              </button>
            )}
            <button
              onClick={() => onEdit(report)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-semibold bg-indigo-950/40 text-indigo-400 border border-indigo-900/60 hover:bg-indigo-950/60 cursor-pointer transition-all"
            >
              <Eye size={12} />
              Details
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => onEdit(report)}
              disabled={report.status === 'Reviewed'}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-semibold cursor-pointer transition-all ${
                isDark
                  ? 'bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700'
                  : 'bg-zinc-100 text-zinc-600 border border-zinc-200 hover:bg-zinc-200'
              } ${report.status === 'Reviewed' ? 'opacity-30 cursor-not-allowed' : ''}`}
            >
              <Edit size={12} />
              Edit
            </button>
            <button
              onClick={() => onDelete(report._id)}
              disabled={report.status === 'Reviewed'}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-semibold cursor-pointer transition-all ${
                report.status === 'Reviewed' ? 'opacity-30 cursor-not-allowed' : ''
              } bg-red-950/30 text-red-400 border border-red-900/50 hover:bg-red-950/50`}
            >
              <Trash2 size={12} />
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
};

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
    <>
      {/* Desktop Table — hidden on small screens */}
      <div className="hidden sm:block overflow-x-auto w-full">
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
              <tr key={report._id} className={`transition-colors ${report.status === 'Late' ? (isDark ? 'bg-amber-950/10' : 'bg-amber-50/30') : ''} ${isDark ? 'hover:bg-zinc-900/10' : 'hover:bg-zinc-50/50'}`}>
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
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getReportStatusStyle(report.status, isDark)}`}>
                      {report.status}
                    </span>
                    {report.status === 'Late' && (
                      <AlertTriangle size={13} className="text-amber-400 shrink-0" title="Submitted after project deadline" />
                    )}
                  </div>
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

      {/* Mobile Card Layout — shown on small screens */}
      <div className="sm:hidden space-y-3 p-4">
        {sortedReports.length === 0 ? (
          <p className="text-center text-zinc-500 text-xs font-medium py-8">
            No reports found matching criteria.
          </p>
        ) : (
          sortedReports.map((report) => (
            <MobileReportCard
              key={report._id}
              report={report}
              role={role}
              onEdit={onEdit}
              onDelete={onDelete}
              onReview={onReview}
              isDark={isDark}
            />
          ))
        )}
      </div>
    </>
  );
};

export default ReportTable;

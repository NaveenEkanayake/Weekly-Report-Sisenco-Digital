import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { getReportStatusStyle } from '../../utils/statusStyles';

const ReportDetailModal = ({ report, onClose, isDark }) => {
  if (!report) return null;

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className={`rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border shadow-2xl ${
        isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-800'
      }`}>
        <div className={`p-6 border-b flex justify-between items-center ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
          <h2 className="text-base font-bold">Report Details</h2>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 cursor-pointer text-xl leading-none"
          >
            &times;
          </button>
        </div>
        <div className="p-6 space-y-6 text-xs">
          {/* User & Status Header */}
          <div className={`flex justify-between items-start pb-4 ${isDark ? 'border-b border-zinc-800/80' : 'border-b border-zinc-200'}`}>
            <div>
              <h3 className="text-sm font-bold">{report.user?.name || 'Unknown User'}</h3>
              <p className={`text-[10px] mt-1 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                {report.user?.email || 'N/A'} &bull; {report.user?.department || 'N/A'}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end">
                <span className={`px-2 py-0.5 font-bold rounded-full border ${getReportStatusStyle(report.status, isDark)}`}>
                  {report.status}
                </span>
                {report.status === 'Late' && (
                  <AlertTriangle size={14} className="text-amber-400" title="Submitted after project deadline" />
                )}
              </div>
              <p className={`text-[10px] mt-1.5 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                Hours: {report.hoursWorked || 'N/A'}
              </p>
            </div>
          </div>

          {/* Late Warning Banner */}
          {report.status === 'Late' && (
            <div className={`flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold ${
              isDark ? 'bg-amber-950/30 text-amber-400 border border-amber-900/40' : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              <AlertTriangle size={16} className="shrink-0" />
              <div>
                <p className="font-bold">Late Submission</p>
                <p className="text-[10px] font-normal opacity-80 mt-0.5">This report was submitted after the project deadline.</p>
              </div>
            </div>
          )}

          {/* Week & Project Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-zinc-400'} mb-1`}>
                Week Duration
              </h4>
              <p className="font-semibold">
                {formatDate(report.weekStartDate)} &rarr; {formatDate(report.weekEndDate)}
              </p>
            </div>
            <div>
              <h4 className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-zinc-400'} mb-1`}>
                Project Category
              </h4>
              <p className="font-semibold">{report.project?.name || report.project || 'General'}</p>
            </div>
          </div>

          {/* Tasks Completed */}
          <div>
            <h4 className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-zinc-400'} mb-1`}>
              Tasks Completed This Week
            </h4>
            <p className={`whitespace-pre-wrap leading-relaxed p-3 rounded-lg border ${
              isDark ? 'text-zinc-300 bg-zinc-950/40 border-zinc-800' : 'text-zinc-600 bg-zinc-50 border-zinc-200'
            }`}>
              {report.tasksCompleted}
            </p>
          </div>

          {/* Tasks Planned */}
          <div>
            <h4 className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-zinc-400'} mb-1`}>
              Tasks Planned for Next Week
            </h4>
            <p className={`whitespace-pre-wrap leading-relaxed p-3 rounded-lg border ${
              isDark ? 'text-zinc-300 bg-zinc-950/40 border-zinc-800' : 'text-zinc-600 bg-zinc-50 border-zinc-200'
            }`}>
              {report.tasksPlanned}
            </p>
          </div>

          {/* Blockers */}
          {report.blockers && (
            <div>
              <h4 className={`text-[10px] font-bold uppercase tracking-wider text-amber-500/80 mb-1`}>
                Blockers / Challenges
              </h4>
              <p className="whitespace-pre-wrap leading-relaxed text-amber-400/90 bg-amber-950/10 p-3 rounded-lg border border-amber-900/30">
                {report.blockers}
              </p>
            </div>
          )}

          {/* Notes */}
          {report.notes && (
            <div>
              <h4 className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-zinc-400'} mb-1`}>
                Notes & Links
              </h4>
              <p className={`whitespace-pre-wrap leading-relaxed p-3 rounded-lg border ${
                isDark ? 'text-zinc-400 bg-zinc-950/40 border-zinc-800' : 'text-zinc-500 bg-zinc-50 border-zinc-200'
              }`}>
                {report.notes}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportDetailModal;

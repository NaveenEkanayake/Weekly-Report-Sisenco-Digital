import React from 'react';

const getComplianceDot = (status) => {
  const styles = {
    Submitted: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]',
    Pending: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)] animate-pulse',
    Late: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)] animate-pulse'
  };
  return styles[status] || 'bg-zinc-500';
};

const SubmissionCompliance = ({ data = [], isDark }) => {
  return (
    <div className={`rounded-xl border ${isDark ? 'bg-zinc-900/20 border-zinc-800' : 'bg-white border-zinc-200'}`}>
      <div className={`px-6 py-4 border-b ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
        <h2 className="text-sm font-semibold">Weekly Submission Compliance Checklist</h2>
      </div>
      <div className="overflow-x-auto w-full text-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className={`border-b font-semibold ${isDark ? 'border-zinc-800 text-zinc-400' : 'border-zinc-200 text-zinc-500 bg-zinc-50'}`}>
              <th className="p-4">Team Member</th>
              <th className="p-4">Department</th>
              <th className="p-4">Submission Status</th>
              <th className="p-4">Last Updated</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? 'divide-zinc-800/80 text-zinc-300' : 'divide-zinc-200 text-zinc-700'}`}>
            {data.length > 0 ? (
              data.map((row, index) => (
                <tr key={index} className={`transition-colors ${isDark ? 'hover:bg-zinc-900/10' : 'hover:bg-zinc-50/50'}`}>
                  <td className="p-4 font-semibold">{row.user?.name}</td>
                  <td className="p-4">{row.user?.department || 'N/A'}</td>
                  <td className="p-4 flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${getComplianceDot(row.status)}`} />
                    <span className="font-semibold">{row.status}</span>
                  </td>
                  <td className="p-4 text-zinc-500 font-medium">
                    {row.user?.lastSubmittedAt ? new Date(row.user.lastSubmittedAt).toLocaleString() : 'Never'}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="p-8 text-center text-zinc-500">No team compliance records found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SubmissionCompliance;

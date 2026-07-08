/**
 * Returns Tailwind CSS classes for a given report status badge.
 * @param {string} status - Report status: 'Draft', 'Submitted', 'Reviewed', or 'Late'
 * @param {boolean} isDark - Whether dark mode is active
 * @returns {string} Tailwind CSS class string
 */
export const getReportStatusStyle = (status, isDark) => {
  const styles = {
    Draft: isDark
      ? 'bg-zinc-800/80 text-zinc-400 border border-zinc-700/60'
      : 'bg-zinc-100 text-zinc-600 border border-zinc-200',
    Submitted: isDark
      ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/60'
      : 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    Reviewed: isDark
      ? 'bg-indigo-950/40 text-indigo-400 border border-indigo-900/60'
      : 'bg-indigo-50 text-indigo-700 border border-indigo-200',
    Late: isDark
      ? 'bg-amber-950/40 text-amber-400 border border-amber-900/60'
      : 'bg-amber-50 text-amber-700 border border-amber-200',
  };
  return styles[status] || styles.Draft;
};

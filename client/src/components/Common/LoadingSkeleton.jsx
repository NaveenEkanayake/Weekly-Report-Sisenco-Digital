import React from 'react';

const Skeleton = ({ className = '', isDark = true }) => (
  <div
    className={`animate-pulse rounded-md ${
      isDark ? 'bg-zinc-800' : 'bg-zinc-200'
    } ${className}`}
  />
);

export const CardSkeleton = ({ isDark = true }) => (
  <div className={`p-6 rounded-xl border ${isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200'}`}>
    <div className="flex items-center gap-4">
      <Skeleton isDark={isDark} className="w-12 h-12 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton isDark={isDark} className="h-3 w-24" />
        <Skeleton isDark={isDark} className="h-6 w-16" />
      </div>
    </div>
  </div>
);

export const TableRowSkeleton = ({ isDark = true, columns = 6 }) => (
  <tr className={`border-b ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
    {Array.from({ length: columns }).map((_, i) => (
      <td key={i} className="p-4">
        <Skeleton isDark={isDark} className="h-4 w-full" />
      </td>
    ))}
  </tr>
);

export const TableSkeleton = ({ isDark = true, rows = 5, columns = 6 }) => (
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead>
        <tr className={`border-b ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
          {Array.from({ length: columns }).map((_, i) => (
            <th key={i} className="p-4">
              <Skeleton isDark={isDark} className="h-3 w-20" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, i) => (
          <TableRowSkeleton key={i} isDark={isDark} columns={columns} />
        ))}
      </tbody>
    </table>
  </div>
);

export const StatsGridSkeleton = ({ isDark = true, count = 4 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <CardSkeleton key={i} isDark={isDark} />
    ))}
  </div>
);

export const ChartSkeleton = ({ isDark = true }) => (
  <div className={`p-6 rounded-xl border ${isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200'}`}>
    <Skeleton isDark={isDark} className="h-4 w-48 mb-6" />
    <Skeleton isDark={isDark} className="h-[260px] w-full rounded-lg" />
  </div>
);

export default Skeleton;

import React from 'react';
import { RotateCcw } from 'lucide-react';

const TIME_PERIODS = [
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'This Quarter', value: 'quarter' },
  { label: 'This Year', value: 'year' },
  { label: 'All Time', value: 'all' },
];

const FilterBar = ({ filters, users, projects, isDark, onFilterChange, onReset, timePeriod, onTimePeriodChange }) => {
  return (
    <div className="space-y-4">
      {/* Time Period Presets */}
      <div className="flex flex-wrap items-center gap-2">
        <label className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
          Period:
        </label>
        <div className="flex flex-wrap gap-1.5">
          {TIME_PERIODS.map((period) => (
            <button
              key={period.value}
              onClick={() => onTimePeriodChange(period.value)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer border ${
                timePeriod === period.value
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                  : isDark
                    ? 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800 hover:text-zinc-200'
                    : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100 hover:text-zinc-800'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
            Team Member
          </label>
          <select
            name="user"
            value={filters.user}
            onChange={onFilterChange}
            className={`w-full cursor-pointer ${isDark ? 'input-field-dark' : 'input-field-light'}`}
          >
            <option value="">All Members</option>
            {users.map((user) => (
              <option key={user._id} value={user._id}>{user.name}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
            Project
          </label>
          <select
            name="project"
            value={filters.project}
            onChange={onFilterChange}
            className={`w-full cursor-pointer ${isDark ? 'input-field-dark' : 'input-field-light'}`}
          >
            <option value="">All Projects</option>
            {projects.map((proj) => (
              <option key={proj._id} value={proj._id}>{proj.name}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
            Start Date
          </label>
          <input
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={onFilterChange}
            className={`w-full ${isDark ? 'input-field-dark' : 'input-field-light'}`}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
            End Date
          </label>
          <div className="flex gap-2">
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={onFilterChange}
              className={`w-full ${isDark ? 'input-field-dark' : 'input-field-light'}`}
            />
            <button
              onClick={onReset}
              className={`p-2 rounded-lg border transition-all cursor-pointer flex-shrink-0 ${
                isDark
                  ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border-zinc-700/60'
                  : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-500 border-zinc-200'
              }`}
              title="Reset Filters"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;

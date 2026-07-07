import React from 'react';
import { motion } from 'framer-motion';
import { Inbox } from 'lucide-react';

const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No data found',
  description = 'There are no items to display at the moment.',
  action,
  isDark = true,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`flex flex-col items-center justify-center py-16 px-6 rounded-xl border ${
        isDark
          ? 'bg-zinc-900/20 border-zinc-800 text-zinc-400'
          : 'bg-white border-zinc-200 text-zinc-500'
      }`}
    >
      <div className={`p-4 rounded-full mb-4 ${
        isDark ? 'bg-zinc-800/50' : 'bg-zinc-100'
      }`}>
        <Icon size={32} className={isDark ? 'text-zinc-600' : 'text-zinc-300'} />
      </div>
      <h3 className={`text-sm font-semibold mb-1 ${
        isDark ? 'text-zinc-300' : 'text-zinc-700'
      }`}>
        {title}
      </h3>
      <p className="text-xs text-center max-w-sm mb-6">
        {description}
      </p>
      {action && action}
    </motion.div>
  );
};

export default EmptyState;

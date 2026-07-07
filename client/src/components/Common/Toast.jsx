import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertTriangle } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [message, duration, onClose]);

  if (!message) return null;

  return (
    <div className="fixed top-4 right-4 z-50 pointer-events-auto">
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.9, x: 50 }}
        animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -10, transition: { duration: 0.2 } }}
        className={`flex items-center gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-md min-w-[300px] max-w-sm ${
          type === 'success'
            ? 'bg-emerald-950/95 border-emerald-800 text-emerald-300'
            : 'bg-red-950/95 border-red-900 text-red-300'
        }`}
      >
        <div className="flex-shrink-0">
          {type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-400" />
          )}
        </div>
        <div className="flex-1 text-xs font-medium pr-2">
          {message}
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 p-1 rounded-lg hover:bg-white/10 text-white/65 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </motion.div>
    </div>
  );
};

export default Toast;

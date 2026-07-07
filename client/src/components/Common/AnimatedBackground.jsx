import React from 'react';
import { motion } from 'framer-motion';

export const AnimatedBackground = ({ theme = 'dark' }) => {
  const isDark = theme === 'dark';

  return (
    <div className={`fixed inset-0 w-full h-full overflow-hidden pointer-events-none z-0 transition-colors duration-500 ${
      isDark ? 'dot-bg-dark' : 'dot-bg-light'
    }`}>
      {/* Glow Blob 1 */}
      <motion.div
        className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full blur-[120px] opacity-45 pointer-events-none animate-float-1"
        style={{
          background: isDark
            ? 'radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, rgba(168, 85, 247, 0.1) 70%, transparent 100%)'
            : 'radial-gradient(circle, rgba(199, 210, 254, 0.6) 0%, rgba(243, 232, 255, 0.2) 70%, transparent 100%)',
        }}
      />

      {/* Glow Blob 2 */}
      <motion.div
        className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full blur-[120px] opacity-40 pointer-events-none animate-float-2"
        style={{
          background: isDark
            ? 'radial-gradient(circle, rgba(59, 130, 246, 0.35) 0%, rgba(99, 102, 241, 0.08) 75%, transparent 100%)'
            : 'radial-gradient(circle, rgba(191, 219, 254, 0.5) 0%, rgba(224, 231, 255, 0.25) 75%, transparent 100%)',
        }}
      />

      {/* Glow Blob 3 (Center subtle accent) */}
      <motion.div
        className="absolute top-[30%] left-[40%] w-[35vw] h-[35vw] rounded-full blur-[140px] opacity-25 pointer-events-none"
        style={{
          background: isDark
            ? 'radial-gradient(circle, rgba(236, 72, 153, 0.15) 0%, transparent 80%)'
            : 'radial-gradient(circle, rgba(251, 207, 232, 0.3) 0%, transparent 80%)',
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.3, 0.2],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Gradient Fade Cover (adds depth and softens edges) */}
      <div className={`absolute inset-0 w-full h-full ${
        isDark 
          ? 'bg-gradient-to-t from-zinc-950 via-transparent to-zinc-950/20' 
          : 'bg-gradient-to-t from-white via-transparent to-white/20'
      }`} />
    </div>
  );
};

export default AnimatedBackground;

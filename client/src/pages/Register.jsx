import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, UserPlus, Sparkles, FileText, Users, TrendingUp, Shield } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedBackground } from '../components/Common/AnimatedBackground';

const AnimatedSignUp = () => {
  const [theme, setTheme] = useState('light');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Team Member',
    department: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setMounted(true);
    document.documentElement.className = theme;
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await register(formData);
      if (response.success) {
        if (formData.role === 'Manager') {
          navigate('/manager/dashboard');
        } else {
          navigate('/member/dashboard');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) return null;

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        when: 'beforeChildren',
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  const imageVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 20 },
    visible: (i) => ({
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.6,
        delay: i * 0.1,
        ease: 'easeOut',
      },
    }),
  };

  return (
    <div className="min-h-screen w-full relative">
      <AnimatedBackground theme={theme} />

      <div className="flex min-h-screen items-center justify-center p-4 md:p-8 relative z-10">
        <motion.div
          className={`w-full max-w-6xl overflow-hidden rounded-2xl relative backdrop-blur-sm transition-all duration-500 ${
            theme === 'dark'
              ? 'bg-slate-800/90 shadow-2xl shadow-indigo-500/20 border border-slate-700/50'
              : 'bg-white/90 shadow-2xl shadow-indigo-200/50 border border-white/20'
          }`}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Theme Toggle */}
          <motion.button
            onClick={toggleTheme}
            className={`absolute right-4 top-4 rounded-full p-2 transition-colors z-50 ${
              theme === 'dark'
                ? 'bg-slate-700 text-yellow-400 hover:bg-slate-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            whileHover={{ scale: 1.1, rotate: 180 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.3 }}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2" /><path d="M12 20v2" />
                <path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" />
                <path d="M2 12h2" /><path d="M20 12h2" />
                <path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
              </svg>
            )}
          </motion.button>

          <div className="flex flex-col md:flex-row">
            {/* Collage Section */}
            <div
              className={`hidden md:block w-full md:w-3/5 p-6 relative overflow-hidden ${
                theme === 'dark'
                  ? 'bg-gradient-to-br from-slate-900 to-slate-800'
                  : 'bg-gradient-to-br from-gray-50 to-gray-100'
              }`}
            >
              <div className="grid grid-cols-2 grid-rows-3 gap-4 h-full max-h-[650px] relative z-10">
                {/* Card: Submit */}
                <motion.div
                  className={`rounded-xl flex flex-col justify-center items-center p-6 text-white shadow-lg ${
                    theme === 'dark'
                      ? 'bg-gradient-to-br from-indigo-700 to-indigo-500'
                      : 'bg-gradient-to-br from-indigo-600 to-indigo-400'
                  }`}
                  custom={0}
                  variants={imageVariants}
                  whileHover={{ scale: 1.05, rotate: 2 }}
                >
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <FileText size={36} className="mb-3" />
                  </motion.div>
                  <h2 className="text-2xl font-bold mb-1">Submit</h2>
                  <p className="text-center text-xs opacity-90">
                    Share weekly progress reports with your team effortlessly.
                  </p>
                </motion.div>

                {/* Image: Team working */}
                <motion.div
                  className="overflow-hidden rounded-xl shadow-lg"
                  custom={1}
                  variants={imageVariants}
                >
                  <motion.img
                    src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=400&fit=crop"
                    alt="Team working together"
                    className="w-full h-full object-cover"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.div>

                {/* Image: Writing report */}
                <motion.div
                  className="overflow-hidden rounded-xl shadow-lg"
                  custom={2}
                  variants={imageVariants}
                >
                  <motion.img
                    src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&h=400&fit=crop"
                    alt="Writing report on laptop"
                    className="w-full h-full object-cover"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.div>

                {/* Card: Track */}
                <motion.div
                  className={`rounded-xl flex flex-col justify-center items-center p-6 text-white shadow-lg ${
                    theme === 'dark'
                      ? 'bg-gradient-to-br from-purple-700 to-purple-500'
                      : 'bg-gradient-to-br from-purple-600 to-purple-400'
                  }`}
                  custom={3}
                  variants={imageVariants}
                  whileHover={{ scale: 1.05, rotate: -2 }}
                >
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                  >
                    <TrendingUp size={36} className="mb-3" />
                  </motion.div>
                  <h2 className="text-2xl font-bold mb-1">Track</h2>
                  <p className="text-center text-xs opacity-90">
                    Monitor team performance and submission trends weekly.
                  </p>
                </motion.div>

                {/* Image: Dashboard */}
                <motion.div
                  className="overflow-hidden rounded-xl shadow-lg"
                  custom={4}
                  variants={imageVariants}
                >
                  <motion.img
                    src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop"
                    alt="Dashboard analytics"
                    className="w-full h-full object-cover"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.div>

                {/* Image: Meeting review */}
                <motion.div
                  className="overflow-hidden rounded-xl shadow-lg"
                  custom={5}
                  variants={imageVariants}
                >
                  <motion.img
                    src="https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&h=400&fit=crop"
                    alt="Manager reviewing reports"
                    className="w-full h-full object-cover"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.div>
              </div>
            </div>

            {/* Form Side */}
            <motion.div
              className={`w-full md:w-2/5 p-8 md:p-12 flex flex-col justify-center transition-all duration-700 ${
                theme === 'dark'
                  ? 'bg-slate-800/50 text-white'
                  : 'bg-white/50 text-gray-900'
              }`}
              variants={itemVariants}
            >
              <motion.div className="flex justify-end mb-4" variants={itemVariants}>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Already registered?{' '}
                  <Link to="/login" className="ml-1 font-medium text-indigo-500 hover:underline">
                    Sign in
                  </Link>
                </p>
              </motion.div>

              <motion.div className="mb-5" variants={itemVariants}>
                <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
                  Join{' '}
                  <span className="text-indigo-500 flex items-center gap-1">
                    Weekly Reports
                    <motion.span
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    >
                      <Sparkles size={20} className="text-indigo-500" />
                    </motion.span>
                  </span>
                </h1>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Create your workspace and start submitting weekly reports.
                </p>
              </motion.div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    className={`mb-3 px-4 py-2 rounded-lg text-sm border ${
                      theme === 'dark'
                        ? 'bg-red-950/40 border-red-900 text-red-400'
                        : 'bg-red-50 border-red-200 text-red-700'
                    }`}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSignUp} className="space-y-3.5">
                {/* Name */}
                <motion.div variants={itemVariants}>
                  <label htmlFor="name" className="block text-xs font-medium uppercase tracking-wider mb-1 opacity-80">
                    Full Name
                  </label>
                  <motion.input
                    type="text"
                    name="name"
                    id="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`block w-full rounded-md border py-2.5 px-3 focus:outline-none focus:ring-2 text-sm transition-all ${
                      theme === 'dark'
                        ? 'bg-slate-700/50 border-slate-600 focus:ring-indigo-500 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 focus:ring-indigo-500 placeholder-gray-400'
                    }`}
                    placeholder="John Doe"
                    required
                    whileFocus={{ scale: 1.02 }}
                  />
                </motion.div>

                {/* Email */}
                <motion.div variants={itemVariants}>
                  <label htmlFor="email" className="block text-xs font-medium uppercase tracking-wider mb-1 opacity-80">
                    Email Address
                  </label>
                  <motion.input
                    type="email"
                    name="email"
                    id="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`block w-full rounded-md border py-2.5 px-3 focus:outline-none focus:ring-2 text-sm transition-all ${
                      theme === 'dark'
                        ? 'bg-slate-700/50 border-slate-600 focus:ring-indigo-500 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 focus:ring-indigo-500 placeholder-gray-400'
                    }`}
                    placeholder="you@example.com"
                    required
                    whileFocus={{ scale: 1.02 }}
                  />
                </motion.div>

                {/* Password */}
                <motion.div variants={itemVariants}>
                  <label htmlFor="password" className="block text-xs font-medium uppercase tracking-wider mb-1 opacity-80">
                    Password
                  </label>
                  <div className="relative">
                    <motion.input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      id="password"
                      value={formData.password}
                      onChange={handleChange}
                      minLength={6}
                      className={`block w-full rounded-md border py-2.5 px-3 pr-10 focus:outline-none focus:ring-2 text-sm transition-all ${
                        theme === 'dark'
                          ? 'bg-slate-700/50 border-slate-600 focus:ring-indigo-500 text-white placeholder-gray-400'
                          : 'bg-white border-gray-300 focus:ring-indigo-500 placeholder-gray-400'
                      }`}
                      placeholder="••••••••"
                      required
                      whileFocus={{ scale: 1.02 }}
                    />
                    <motion.button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center opacity-70"
                      onClick={() => setShowPassword(!showPassword)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </motion.button>
                  </div>
                </motion.div>

                {/* Role & Department */}
                <motion.div className="grid grid-cols-2 gap-3" variants={itemVariants}>
                  <div>
                    <label htmlFor="role" className="block text-xs font-medium uppercase tracking-wider mb-1 opacity-80">
                      Workspace Role
                    </label>
                    <motion.select
                      name="role"
                      id="role"
                      value={formData.role}
                      onChange={handleChange}
                      className={`block w-full rounded-md border py-2.5 px-2 focus:outline-none focus:ring-2 text-sm transition-all ${
                        theme === 'dark'
                          ? 'bg-slate-700/50 border-slate-600 focus:ring-indigo-500 text-white'
                          : 'bg-white border-gray-300 focus:ring-indigo-500'
                      }`}
                      whileFocus={{ scale: 1.02 }}
                    >
                      <option value="Team Member">Team Member</option>
                      <option value="Manager">Manager</option>
                    </motion.select>
                  </div>

                  <div>
                    <label htmlFor="department" className="block text-xs font-medium uppercase tracking-wider mb-1 opacity-80">
                      Department
                    </label>
                    <motion.input
                      type="text"
                      name="department"
                      id="department"
                      value={formData.department}
                      onChange={handleChange}
                      className={`block w-full rounded-md border py-2.5 px-3 focus:outline-none focus:ring-2 text-sm transition-all ${
                        theme === 'dark'
                          ? 'bg-slate-700/50 border-slate-600 focus:ring-indigo-500 text-white placeholder-gray-400'
                          : 'bg-white border-gray-300 focus:ring-indigo-500 placeholder-gray-400'
                      }`}
                      placeholder="Engineering"
                      whileFocus={{ scale: 1.02 }}
                    />
                  </div>
                </motion.div>

                {/* Submit */}
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center gap-2 rounded-md bg-gradient-to-r from-indigo-600 to-indigo-500 mt-2 py-2.5 text-sm font-semibold text-white hover:from-indigo-500 hover:to-indigo-400 transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/25"
                  whileHover={{ scale: isLoading ? 1 : 1.02 }}
                  whileTap={{ scale: isLoading ? 1 : 0.98 }}
                  variants={itemVariants}
                >
                  {isLoading ? (
                    <>
                      <motion.div
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <UserPlus size={16} /> Create Account
                    </>
                  )}
                </motion.button>
              </form>

              {/* Feature highlights */}
              <motion.div
                className={`mt-6 pt-5 border-t space-y-2.5 ${
                  theme === 'dark' ? 'border-slate-700' : 'border-gray-200'
                }`}
                variants={itemVariants}
              >
                <p className={`text-xs font-medium uppercase tracking-wider ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  What you get with Weekly Reports
                </p>
                {[
                  { icon: FileText, text: 'Structured weekly report templates' },
                  { icon: Users, text: 'Team collaboration & visibility' },
                  { icon: Shield, text: 'Role-based access for managers & members' },
                ].map((feature, i) => (
                  <motion.div
                    key={i}
                    className="flex items-center gap-2"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.2 + i * 0.15, duration: 0.4 }}
                  >
                    <feature.icon
                      size={14}
                      className={theme === 'dark' ? 'text-indigo-400' : 'text-indigo-500'}
                    />
                    <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {feature.text}
                    </span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AnimatedSignUp;
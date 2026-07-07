import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, LogIn, FileText, Users, TrendingUp, Shield } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedBackground } from '../components/Common/AnimatedBackground';

import authService from '../services/authService';

const Login = () => {
  const [theme, setTheme] = useState('dark');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Forgot Password / Reset Password states
  const [view, setView] = useState('login'); // 'login' | 'forgot' | 'reset'
  const [forgotEmail, setForgotEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setMounted(true);
    // Sync theme class to document body
    document.documentElement.className = theme;
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await login(formData);
      if (response.success) {
        if (response.data.role === 'Manager') {
          navigate('/manager/dashboard');
        } else {
          navigate('/member/dashboard');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const response = await authService.forgotPassword(forgotEmail);
      if (response.success) {
        setSuccess(response.message || 'OTP verification code sent successfully!');
        setView('reset');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send verification code. Please check your email.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const response = await authService.resetPassword({
        email: forgotEmail,
        otp: otpCode,
        newPassword
      });
      if (response.success) {
        setSuccess('Password reset successfully! Redirecting to login...');
        setTimeout(() => {
          setView('login');
          setForgotEmail('');
          setOtpCode('');
          setNewPassword('');
          setSuccess('');
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP. Please try again.');
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
    <div className={`min-h-screen w-full relative transition-colors duration-500 ${theme === 'dark' ? 'bg-zinc-950 text-white' : 'bg-white text-zinc-900'}`}>
      <AnimatedBackground theme={theme} />

      <div className="flex min-h-screen items-center justify-center p-4 md:p-8 relative z-10">
        <motion.div
          className={`w-full max-w-6xl overflow-hidden rounded-2xl relative backdrop-blur-sm transition-all duration-500 ${
            theme === 'dark'
              ? 'bg-zinc-900/90 shadow-2xl shadow-indigo-500/10 border border-zinc-800/80'
              : 'bg-white/90 shadow-2xl shadow-indigo-200/50 border border-zinc-200'
          }`}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Theme Toggle */}
          <motion.button
            onClick={toggleTheme}
            className={`absolute right-4 top-4 rounded-full p-2.5 transition-colors z-50 cursor-pointer ${
              theme === 'dark'
                ? 'bg-zinc-800 text-yellow-400 hover:bg-zinc-700'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
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
                  ? 'bg-gradient-to-br from-zinc-950 to-zinc-900 border-r border-zinc-800/80'
                  : 'bg-gradient-to-br from-zinc-50 to-zinc-100 border-r border-zinc-200'
              }`}
            >
              <div className="grid grid-cols-2 grid-rows-3 gap-4 h-full max-h-[550px] relative z-10">
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
                  <h2 className="text-xl font-bold mb-1">Submit</h2>
                  <p className="text-center text-xs opacity-90">
                    Share weekly progress reports with your team effortlessly.
                  </p>
                </motion.div>

                {/* Image: Team working */}
                <motion.div
                  className="overflow-hidden rounded-xl shadow-lg border border-zinc-800/40"
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
                  className="overflow-hidden rounded-xl shadow-lg border border-zinc-800/40"
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
                  <h2 className="text-xl font-bold mb-1">Track</h2>
                  <p className="text-center text-xs opacity-90">
                    Monitor team performance and submission trends weekly.
                  </p>
                </motion.div>

                {/* Image: Dashboard */}
                <motion.div
                  className="overflow-hidden rounded-xl shadow-lg border border-zinc-800/40"
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
                  className="overflow-hidden rounded-xl shadow-lg border border-zinc-800/40"
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
                  ? 'bg-zinc-900/40 text-zinc-100'
                  : 'bg-white/50 text-zinc-900'
              }`}
              variants={itemVariants}
            >
              <motion.div className="flex justify-end mb-6" variants={itemVariants}>
                <p className={`text-sm ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  New here?{' '}
                  <Link to="/register" className="ml-1 font-medium text-indigo-500 hover:underline">
                    Create account
                  </Link>
                </p>
              </motion.div>

              {view === 'login' && (
                <motion.div className="mb-6" variants={itemVariants}>
                  <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                    Welcome back
                  </h1>
                  <p className={`text-sm ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    Please enter your details to sign in.
                  </p>
                </motion.div>
              )}

              {view === 'forgot' && (
                <motion.div className="mb-6" variants={itemVariants}>
                  <h1 className="text-3xl font-bold mb-2 text-indigo-500">
                    Forgot Password
                  </h1>
                  <p className={`text-sm ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    Enter your email address to receive a secure 6-digit verification code.
                  </p>
                </motion.div>
              )}

              {view === 'reset' && (
                <motion.div className="mb-6" variants={itemVariants}>
                  <h1 className="text-3xl font-bold mb-2 text-indigo-500">
                    Enter Verification Code
                  </h1>
                  <p className={`text-sm ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    We sent a 6-digit OTP code to <strong className="text-indigo-400">{forgotEmail}</strong>. Please enter the code and your new password.
                  </p>
                </motion.div>
              )}

              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    className={`mb-4 px-4 py-2.5 rounded-lg text-sm border ${
                      theme === 'dark'
                        ? 'bg-red-950/40 border-red-900/60 text-red-400'
                        : 'bg-red-50 border-red-200 text-red-700'
                    }`}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    key="login-error"
                  >
                    {error}
                  </motion.div>
                )}
                {success && (
                  <motion.div
                    className={`mb-4 px-4 py-2.5 rounded-lg text-sm border ${
                      theme === 'dark'
                        ? 'bg-emerald-950/40 border-emerald-900/60 text-emerald-400'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    }`}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    key="login-success"
                  >
                    {success}
                  </motion.div>
                )}
              </AnimatePresence>

              {view === 'login' && (
                <form onSubmit={handleLogin} className="space-y-4">
                  {/* Email */}
                  <motion.div variants={itemVariants}>
                    <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider mb-1.5 opacity-80">
                      Email Address
                    </label>
                    <motion.input
                      type="email"
                      name="email"
                      id="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`block w-full rounded-lg border py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm transition-all ${
                        theme === 'dark'
                          ? 'bg-zinc-950 border-zinc-800 text-zinc-100 placeholder-zinc-500'
                          : 'bg-white border-zinc-200 text-zinc-800 placeholder-zinc-400'
                      }`}
                      placeholder="you@example.com"
                      required
                      whileFocus={{ scale: 1.01 }}
                    />
                  </motion.div>

                  {/* Password */}
                  <motion.div variants={itemVariants}>
                    <div className="flex justify-between items-center mb-1.5">
                      <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider opacity-80">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => { setView('forgot'); setError(''); setSuccess(''); }}
                        className="text-xs text-indigo-500 hover:underline font-medium cursor-pointer"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <motion.input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        id="password"
                        value={formData.password}
                        onChange={handleChange}
                        className={`block w-full rounded-lg border py-2.5 px-3 pr-10 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm transition-all ${
                          theme === 'dark'
                            ? 'bg-zinc-950 border-zinc-800 text-zinc-100 placeholder-zinc-500'
                            : 'bg-white border-zinc-200 text-zinc-800 placeholder-zinc-400'
                        }`}
                        placeholder="••••••••"
                        required
                        whileFocus={{ scale: 1.01 }}
                      />
                      <motion.button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center opacity-60 hover:opacity-100 transition-opacity"
                        onClick={() => setShowPassword(!showPassword)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </motion.button>
                    </div>
                  </motion.div>

                  {/* Submit */}
                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 mt-4 py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-50 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/35 border border-indigo-500/20 cursor-pointer"
                    whileHover={{ scale: isLoading ? 1 : 1.01 }}
                    whileTap={{ scale: isLoading ? 1 : 0.99 }}
                    variants={itemVariants}
                  >
                    {isLoading ? (
                      <>
                        <motion.div
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        />
                        Signing In...
                      </>
                    ) : (
                      <>
                        <LogIn size={16} /> Sign In
                      </>
                    )}
                  </motion.button>
                </form>
              )}

              {view === 'forgot' && (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <motion.div variants={itemVariants}>
                    <label htmlFor="forgotEmail" className="block text-xs font-semibold uppercase tracking-wider mb-1.5 opacity-80">
                      Email Address
                    </label>
                    <motion.input
                      type="email"
                      name="forgotEmail"
                      id="forgotEmail"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className={`block w-full rounded-lg border py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm transition-all ${
                        theme === 'dark'
                          ? 'bg-zinc-950 border-zinc-800 text-zinc-100 placeholder-zinc-500'
                          : 'bg-white border-zinc-200 text-zinc-800 placeholder-zinc-400'
                      }`}
                      placeholder="you@example.com"
                      required
                      whileFocus={{ scale: 1.01 }}
                    />
                  </motion.div>

                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 mt-4 py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-50 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/35 border border-indigo-500/20 cursor-pointer"
                    whileHover={{ scale: isLoading ? 1 : 1.01 }}
                    whileTap={{ scale: isLoading ? 1 : 0.99 }}
                    variants={itemVariants}
                  >
                    {isLoading ? 'Sending Code...' : 'Get Verification Code'}
                  </motion.button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => { setView('login'); setError(''); setSuccess(''); }}
                      className="text-xs text-indigo-500 hover:underline font-medium cursor-pointer"
                    >
                      &larr; Back to Sign In
                    </button>
                  </div>
                </form>
              )}

              {view === 'reset' && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <motion.div variants={itemVariants}>
                    <label htmlFor="otpCode" className="block text-xs font-semibold uppercase tracking-wider mb-1.5 opacity-80">
                      6-Digit OTP Code
                    </label>
                    <motion.input
                      type="text"
                      name="otpCode"
                      id="otpCode"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className={`block w-full rounded-lg border py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm tracking-widest text-center font-bold transition-all ${
                        theme === 'dark'
                          ? 'bg-zinc-950 border-zinc-800 text-zinc-100 placeholder-zinc-500'
                          : 'bg-white border-zinc-200 text-zinc-800 placeholder-zinc-400'
                      }`}
                      placeholder="123456"
                      required
                      whileFocus={{ scale: 1.01 }}
                    />
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <label htmlFor="newPassword" className="block text-xs font-semibold uppercase tracking-wider mb-1.5 opacity-80">
                      New Password
                    </label>
                    <motion.input
                      type="password"
                      name="newPassword"
                      id="newPassword"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={`block w-full rounded-lg border py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm transition-all ${
                        theme === 'dark'
                          ? 'bg-zinc-950 border-zinc-800 text-zinc-100 placeholder-zinc-500'
                          : 'bg-white border-zinc-200 text-zinc-800 placeholder-zinc-400'
                      }`}
                      placeholder="••••••••"
                      required
                      whileFocus={{ scale: 1.01 }}
                    />
                  </motion.div>

                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 mt-4 py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-50 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/35 border border-indigo-500/20 cursor-pointer"
                    whileHover={{ scale: isLoading ? 1 : 1.01 }}
                    whileTap={{ scale: isLoading ? 1 : 0.99 }}
                    variants={itemVariants}
                  >
                    {isLoading ? 'Resetting...' : 'Reset Password'}
                  </motion.button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => { setView('forgot'); setError(''); setSuccess(''); }}
                      className="text-xs text-indigo-500 hover:underline font-medium cursor-pointer"
                    >
                      &larr; Resend Code
                    </button>
                  </div>
                </form>
              )}

              {/* Feature highlights */}
              <motion.div
                className={`mt-8 pt-6 border-t space-y-3 ${
                  theme === 'dark' ? 'border-zinc-800' : 'border-zinc-200'
                }`}
                variants={itemVariants}
              >
                <p className={`text-xs font-semibold uppercase tracking-wider ${
                  theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'
                }`}>
                  Platform features
                </p>
                {[
                  { icon: FileText, text: 'Structured weekly report templates' },
                  { icon: Users, text: 'Consolidated manager dashboard insights' },
                  { icon: Shield, text: 'Role-based access & encrypted sessions' },
                ].map((feature, i) => (
                  <motion.div
                    key={i}
                    className="flex items-center gap-2.5"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.0 + i * 0.1, duration: 0.4 }}
                  >
                    <feature.icon
                      size={15}
                      className={theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}
                    />
                    <span className={`text-xs ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
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

export default Login;
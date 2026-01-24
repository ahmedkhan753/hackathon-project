import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { login, register } from '../services/auth';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User, Mail, Lock, CheckCircle, AlertCircle, Loader } from 'lucide-react';

const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        name: '',
        email: '',
        password: ''
    });
    const [formErrors, setFormErrors] = useState({});
    const navigate = useNavigate();

    const validateForm = () => {
        const errors = {};

        if (!isLogin) {
            if (!formData.name.trim()) errors.name = 'Full name is required';
            if (!formData.email.trim()) errors.email = 'Email is required';
            else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Email is invalid';
        }

        if (!formData.username.trim()) errors.username = 'Username is required';
        if (!formData.password.trim()) errors.password = 'Password is required';
        else if (formData.password.length < 6) errors.password = 'Password must be at least 6 characters';

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });

        // Clear specific error when user starts typing
        if (formErrors[name]) {
            setFormErrors({ ...formErrors, [name]: '' });
        }

        setError(null);
        setSuccess(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            if (isLogin) {
                const response = await login(formData.username, formData.password);
                localStorage.setItem('token', response.access_token);

                // Add a small delay for smooth transition
                setTimeout(() => {
                    navigate('/dashboard');
                }, 500);
            } else {
                await register(formData.username, formData.name, formData.email, formData.password);
                setSuccess('Account created successfully! Please login with your credentials.');
                setIsLogin(true);
                setFormData({ username: '', name: '', email: '', password: '' });
            }
        } catch (err) {
            console.error('Auth error:', err);
            setError(err.message || 'Connection failed. Please check if the backend is running.');
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setError(null);
        setSuccess(null);
        setFormErrors({});
    };

    const containerVariants = {
        hidden: { opacity: 0, y: 50 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.6,
                ease: "easeOut",
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0 }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <motion.div
                    className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20"
                    animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, 180, 360],
                    }}
                    transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                />
                <motion.div
                    className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20"
                    animate={{
                        scale: [1.1, 1, 1.1],
                        rotate: [360, 180, 0],
                    }}
                    transition={{
                        duration: 25,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                />
            </div>

            <motion.div
                className="w-full max-w-md bg-slate-800/90 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-slate-700/50 relative z-10"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div variants={itemVariants} className="text-center mb-8">
                    <motion.h1
                        className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-indigo-200 bg-clip-text text-transparent mb-2"
                        initial={{ scale: 0.5 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    >
                        Neighbourly
                    </motion.h1>
                    <motion.p
                        className="text-slate-400 text-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        Connect with your community
                    </motion.p>
                </motion.div>

                <motion.div variants={itemVariants} className="flex mb-8 bg-slate-700/50 p-1 rounded-xl backdrop-blur-sm">
                    <motion.button
                        onClick={toggleMode}
                        className={`flex-1 py-3 px-4 rounded-lg transition-all duration-300 font-medium ${
                            isLogin
                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                                : 'text-slate-400 hover:text-slate-300'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        Login
                    </motion.button>
                    <motion.button
                        onClick={toggleMode}
                        className={`flex-1 py-3 px-4 rounded-lg transition-all duration-300 font-medium ${
                            !isLogin
                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                                : 'text-slate-400 hover:text-slate-300'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        Register
                    </motion.button>
                </motion.div>

                <AnimatePresence>
                    {(error || success) && (
                        <motion.div
                            variants={itemVariants}
                            initial={{ opacity: 0, y: -20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.95 }}
                            className={`p-4 rounded-xl mb-6 flex items-center gap-3 ${
                                success
                                    ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                                    : 'bg-red-500/20 border border-red-500/30 text-red-400'
                            }`}
                        >
                            {success ? (
                                <CheckCircle size={20} />
                            ) : (
                                <AlertCircle size={20} />
                            )}
                            <span className="text-sm font-medium">{success || error}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.form
                    onSubmit={handleSubmit}
                    className="space-y-5"
                    variants={containerVariants}
                >
                    <AnimatePresence mode="wait">
                        {!isLogin && (
                            <motion.div
                                key="register-fields"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-5"
                            >
                                <motion.div variants={itemVariants}>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                                        <input
                                            type="text"
                                            name="name"
                                            placeholder="Full Name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className={`w-full bg-slate-700/50 border text-white pl-12 pr-4 py-4 rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 backdrop-blur-sm ${
                                                formErrors.name
                                                    ? 'border-red-500 focus:ring-red-500'
                                                    : 'border-slate-600 focus:ring-indigo-500'
                                            }`}
                                        />
                                    </div>
                                    {formErrors.name && (
                                        <motion.p
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="text-red-400 text-sm mt-1"
                                        >
                                            {formErrors.name}
                                        </motion.p>
                                    )}
                                </motion.div>

                                <motion.div variants={itemVariants}>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                                        <input
                                            type="email"
                                            name="email"
                                            placeholder="Email Address"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className={`w-full bg-slate-700/50 border text-white pl-12 pr-4 py-4 rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 backdrop-blur-sm ${
                                                formErrors.email
                                                    ? 'border-red-500 focus:ring-red-500'
                                                    : 'border-slate-600 focus:ring-indigo-500'
                                            }`}
                                        />
                                    </div>
                                    {formErrors.email && (
                                        <motion.p
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="text-red-400 text-sm mt-1"
                                        >
                                            {formErrors.email}
                                        </motion.p>
                                    )}
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <motion.div variants={itemVariants}>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                name="username"
                                placeholder="Username"
                                value={formData.username}
                                onChange={handleChange}
                                className={`w-full bg-slate-700/50 border text-white pl-12 pr-4 py-4 rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 backdrop-blur-sm ${
                                    formErrors.username
                                        ? 'border-red-500 focus:ring-red-500'
                                        : 'border-slate-600 focus:ring-indigo-500'
                                }`}
                            />
                        </div>
                        {formErrors.username && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-red-400 text-sm mt-1"
                            >
                                {formErrors.username}
                            </motion.p>
                        )}
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                placeholder="Password"
                                value={formData.password}
                                onChange={handleChange}
                                className={`w-full bg-slate-700/50 border text-white pl-12 pr-12 py-4 rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 backdrop-blur-sm ${
                                    formErrors.password
                                        ? 'border-red-500 focus:ring-red-500'
                                        : 'border-slate-600 focus:ring-indigo-500'
                                }`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        {formErrors.password && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-red-400 text-sm mt-1"
                            >
                                {formErrors.password}
                            </motion.p>
                        )}
                    </motion.div>

                    <motion.button
                        type="submit"
                        disabled={loading}
                        variants={itemVariants}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                        whileHover={{ scale: loading ? 1 : 1.02 }}
                        whileTap={{ scale: loading ? 1 : 0.98 }}
                    >
                        {loading ? (
                            <>
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                >
                                    <Loader size={20} />
                                </motion.div>
                                Processing...
                            </>
                        ) : (
                            isLogin ? 'Sign In' : 'Create Account'
                        )}
                    </motion.button>
                </motion.form>

                <motion.div
                    variants={itemVariants}
                    className="text-center mt-6"
                >
                    <p className="text-slate-400 text-sm">
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <button
                            onClick={toggleMode}
                            className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                        >
                            {isLogin ? 'Sign up' : 'Sign in'}
                        </button>
                    </p>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default AuthPage;

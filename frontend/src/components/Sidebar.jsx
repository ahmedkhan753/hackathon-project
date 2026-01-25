import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Home, Package, Calendar, User, LogOut, Plus, CreditCard } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar = ({ user, onLogout }) => {
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        { icon: Home, label: 'Dashboard', path: '/dashboard' },
        { icon: Package, label: 'Browse Services', path: '/services' },
        { icon: Plus, label: 'My Services', path: '/my-services' },
        { icon: Calendar, label: 'My Bookings', path: '/bookings' },
        { icon: CreditCard, label: 'Payments', path: '/payments' },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            className="fixed left-0 top-0 h-screen w-64 border-r"
            style={{
                background: 'var(--color-bg-secondary)',
                borderColor: 'var(--color-surface-border)',
                zIndex: 40
            }}
        >
            <div className="flex flex-col h-full">
                {/* Logo */}
                <div className="p-6 border-b" style={{ borderColor: 'var(--color-surface-border)' }}>
                    <motion.h1
                        className="text-2xl font-bold"
                        style={{
                            background: 'var(--gradient-primary)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text'
                        }}
                        whileHover={{ scale: 1.05 }}
                    >
                        Neighbourly
                    </motion.h1>
                    <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                        Community Marketplace
                    </p>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-2">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);

                        return (
                            <motion.button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                                style={{
                                    background: active ? 'var(--gradient-primary)' : 'transparent',
                                    color: active ? 'white' : 'var(--color-text-secondary)',
                                }}
                                whileHover={{
                                    scale: 1.02,
                                    backgroundColor: active ? undefined : 'var(--color-surface-hover)'
                                }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Icon size={20} />
                                <span className="font-medium">{item.label}</span>
                            </motion.button>
                        );
                    })}
                </nav>

                {/* User Section */}
                <div className="p-4 border-t space-y-2" style={{ borderColor: 'var(--color-surface-border)' }}>
                    {/* Theme Toggle */}
                    <motion.button
                        onClick={toggleTheme}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                        style={{
                            background: 'var(--color-surface)',
                            color: 'var(--color-text-secondary)',
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                        <span className="font-medium">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                    </motion.button>

                    {/* User Info */}
                    <div
                        className="flex items-center gap-3 px-4 py-3 rounded-xl"
                        style={{ background: 'var(--color-surface)' }}
                    >
                        <div
                            className="w-10 h-10 rounded-full flex items-center justify-center"
                            style={{ background: 'var(--gradient-primary)' }}
                        >
                            <User size={20} color="white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate" style={{ color: 'var(--color-text-primary)' }}>
                                {user?.name}
                            </p>
                            <p className="text-xs truncate" style={{ color: 'var(--color-text-tertiary)' }}>
                                @{user?.username}
                            </p>
                        </div>
                    </div>

                    {/* Logout */}
                    <motion.button
                        onClick={onLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                        style={{
                            background: 'transparent',
                            color: 'var(--color-error)',
                        }}
                        whileHover={{
                            scale: 1.02,
                            backgroundColor: 'var(--color-error-bg)'
                        }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <LogOut size={20} />
                        <span className="font-medium">Logout</span>
                    </motion.button>
                </div>
            </div>
        </motion.aside>
    );
};

export default Sidebar;

import React from 'react';
import { motion } from 'framer-motion';

export const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    icon: Icon,
    onClick,
    disabled = false,
    className = '',
    ...props
}) => {
    const sizeClasses = {
        sm: 'px-3 py-2 text-xs',
        md: 'px-4 py-2.5 text-sm',
        lg: 'px-6 py-3 text-base',
    };

    const variantStyles = {
        primary: {
            background: 'var(--gradient-primary)',
            color: 'white',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
        },
        secondary: {
            background: 'var(--color-surface)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-surface-border)',
        },
        ghost: {
            background: 'transparent',
            color: 'var(--color-text-secondary)',
        },
        danger: {
            background: 'var(--color-error)',
            color: 'white',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)',
        },
    };

    return (
        <motion.button
            onClick={onClick}
            disabled={disabled}
            className={`btn ${sizeClasses[size]} ${className}`}
            style={{
                ...variantStyles[variant],
                opacity: disabled ? 0.5 : 1,
                cursor: disabled ? 'not-allowed' : 'pointer',
            }}
            whileHover={!disabled ? {
                scale: 1.02,
                y: -1,
                boxShadow: variant === 'primary'
                    ? '0 6px 20px rgba(99, 102, 241, 0.35)'
                    : variant === 'danger'
                        ? '0 6px 20px rgba(239, 68, 68, 0.35)'
                        : 'var(--shadow-lg)'
            } : {}}
            whileTap={!disabled ? { scale: 0.98 } : {}}
            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            {...props}
        >
            {Icon && <Icon size={size === 'sm' ? 16 : size === 'lg' ? 20 : 18} />}
            {children}
        </motion.button>
    );
};

export const Card = ({ children, className = '', hover = true, ...props }) => {
    return (
        <motion.div
            className={`card ${className}`}
            whileHover={hover ? { y: -4, boxShadow: 'var(--shadow-xl)' } : {}}
            transition={{ duration: 0.2 }}
            {...props}
        >
            {children}
        </motion.div>
    );
};

export const Input = ({
    label,
    error,
    icon: Icon,
    className = '',
    ...props
}) => {
    return (
        <div className="space-y-1">
            {label && (
                <label className="block text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                    {label}
                </label>
            )}
            <div className="relative">
                {Icon && (
                    <Icon
                        className="absolute left-3 top-1/2 transform -translate-y-1/2"
                        size={18}
                        style={{ color: 'var(--color-text-tertiary)' }}
                    />
                )}
                <input
                    className={`input ${Icon ? 'pl-10' : ''} ${error ? 'border-error' : ''} ${className}`}
                    style={{
                        borderColor: error ? 'var(--color-error)' : undefined,
                    }}
                    {...props}
                />
            </div>
            {error && (
                <p className="text-xs" style={{ color: 'var(--color-error)' }}>
                    {error}
                </p>
            )}
        </div>
    );
};

export const Badge = ({ children, variant = 'info', className = '' }) => {
    const customVariants = {
        purple: {
            background: 'rgba(168, 85, 247, 0.1)',
            color: 'var(--color-accent-purple)',
        },
        blue: {
            background: 'rgba(59, 130, 246, 0.1)',
            color: 'var(--color-accent-blue)',
        },
        pink: {
            background: 'rgba(236, 72, 153, 0.1)',
            color: 'var(--color-accent-pink)',
        }
    };

    const style = customVariants[variant] || {};
    const baseClass = customVariants[variant] ? '' : `badge-${variant}`;

    return (
        <span className={`badge ${baseClass} ${className}`} style={style}>
            {children}
        </span>
    );
};

export const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl' }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ background: 'var(--color-bg-overlay)' }}
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ y: 20, opacity: 0, scale: 0.95 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 20, opacity: 0, scale: 0.95 }}
                        transition={{ type: 'spring', duration: 0.4 }}
                        className={`w-full ${maxWidth} rounded-2xl overflow-hidden`}
                        style={{
                            background: 'var(--color-bg-elevated)',
                            border: '1px solid var(--color-surface-border)',
                            boxShadow: 'var(--shadow-xl)',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {title && (
                            <div className="px-6 py-4 border-b border-[var(--color-surface-border)] flex items-center justify-between">
                                <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                                    {title}
                                </h2>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-full hover:bg-[var(--color-surface-hover)] transition-colors"
                                    style={{ color: 'var(--color-text-secondary)' }}
                                >
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>
                            </div>
                        )}
                        <div className="p-6">
                            {children}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export const LoadingSpinner = ({ size = 'md' }) => {
    const sizeMap = {
        sm: 16,
        md: 24,
        lg: 32,
    };

    return (
        <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            style={{
                width: sizeMap[size],
                height: sizeMap[size],
                border: '3px solid var(--color-surface-border)',
                borderTopColor: 'var(--color-primary)',
                borderRadius: '50%',
            }}
        />
    );
};

export const EmptyState = ({ icon: Icon, title, description, action }) => {
    return (
        <div className="text-center py-12">
            {Icon && (
                <div className="flex justify-center mb-4">
                    <div
                        className="w-16 h-16 rounded-full flex items-center justify-center"
                        style={{ background: 'var(--color-surface)' }}
                    >
                        <Icon size={32} style={{ color: 'var(--color-text-tertiary)' }} />
                    </div>
                </div>
            )}
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                {title}
            </h3>
            <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
                {description}
            </p>
            {action}
        </div>
    );
};

export const Skeleton = ({ className = '', width, height, variant = 'rect' }) => {
    const style = {
        width: width,
        height: height,
    };

    const variantClasses = {
        rect: 'rounded-xl',
        circle: 'rounded-full',
        text: 'rounded-md h-4 mb-2 last:mb-0 w-full',
    };

    return (
        <div
            className={`skeleton ${variantClasses[variant]} ${className}`}
            style={style}
        />
    );
};

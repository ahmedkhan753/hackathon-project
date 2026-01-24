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
            whileHover={!disabled ? { scale: 1.02 } : {}}
            whileTap={!disabled ? { scale: 0.98 } : {}}
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
    return (
        <span className={`badge badge-${variant} ${className}`}>
            {children}
        </span>
    );
};

export const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl' }) => {
    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0, 0, 0, 0.7)' }}
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className={`w-full ${maxWidth} rounded-2xl p-6`}
                style={{
                    background: 'var(--color-bg-elevated)',
                    border: '1px solid var(--color-surface-border)',
                    boxShadow: 'var(--shadow-xl)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {title && (
                    <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                        {title}
                    </h2>
                )}
                {children}
            </motion.div>
        </motion.div>
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

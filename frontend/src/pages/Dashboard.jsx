import React, { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, LoadingSpinner } from '../components/UIComponents';
import { Package, Calendar, TrendingUp, Users, MessageSquare, Star } from 'lucide-react';
import { servicesAPI, bookingsAPI, chatAPI, reviewsAPI } from '../services/api';

const DashboardPage = () => {
    const { user, handleLogout } = useOutletContext();
    const [stats, setStats] = useState({
        myServices: 0,
        myBookings: 0,
        totalServices: 0,
    });
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch stats
                const [myServices, bookings, allServices, unreadData, topProvidersData] = await Promise.all([
                    servicesAPI.list({ provider_id: user.id }),
                    bookingsAPI.list(),
                    servicesAPI.list({ limit: 1 }),
                    chatAPI.getUnreadCount(),
                    reviewsAPI.getTop(3)
                ]);

                setStats({
                    myServices: myServices.length,
                    myBookings: bookings.length,
                    totalServices: allServices.length,
                    unreadCount: unreadData.unread_count,
                    topProviders: topProvidersData || []
                });
            } catch (error) {
                console.error('Failed to fetch data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchData();
        }
    }, [user]);

    if (loading) {
        return (
            <div
                className="flex items-center justify-center p-12"
            >
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    const statCards = [
        {
            title: 'My Services',
            value: stats.myServices,
            icon: Package,
            color: 'var(--color-accent-purple)',
            bgColor: 'rgba(168, 85, 247, 0.1)',
        },
        {
            title: 'My Bookings',
            value: stats.myBookings,
            icon: Calendar,
            color: 'var(--color-accent-blue)',
            bgColor: 'rgba(59, 130, 246, 0.1)',
        },
        {
            title: 'Available Services',
            value: stats.totalServices,
            icon: TrendingUp,
            color: 'var(--color-success)',
            bgColor: 'var(--color-success-bg)',
        },
    ];

    return (
        <div className="container">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <h1
                    className="text-4xl font-bold mb-2"
                    style={{ color: 'var(--color-text-primary)' }}
                >
                    Welcome back, {user.name}! 👋
                </h1>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                    Here's what's happening in your community today
                </p>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {statCards.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <motion.div
                            key={stat.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p
                                            className="text-sm font-medium mb-1"
                                            style={{ color: 'var(--color-text-secondary)' }}
                                        >
                                            {stat.title}
                                        </p>
                                        <p
                                            className="text-3xl font-bold"
                                            style={{ color: 'var(--color-text-primary)' }}
                                        >
                                            {stat.value}
                                        </p>
                                    </div>
                                    <div
                                        className="w-14 h-14 rounded-2xl flex items-center justify-center"
                                        style={{
                                            background: stat.bgColor,
                                        }}
                                    >
                                        <Icon size={28} style={{ color: stat.color }} />
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>

            {/* Top Rated Neighbors */}
            {stats.topProviders && stats.topProviders.length > 0 && (
                <div className="mb-8">
                    <h2
                        className="text-2xl font-bold mb-4"
                        style={{ color: 'var(--color-text-primary)' }}
                    >
                        Top Rated Neighbors 🏆
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {stats.topProviders.map((item, index) => (
                            <motion.div
                                key={item.provider_id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2 + index * 0.1 }}
                            >
                                <Card className="!p-5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)] font-bold">
                                            {item.provider_name.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-[var(--color-text-primary)] truncate">
                                                {item.provider_name}
                                            </h3>
                                            <div className="flex items-center gap-1 text-[var(--color-warning)]">
                                                <Star size={14} fill="currentColor" />
                                                <span className="text-sm font-bold">
                                                    {item.score_data.overall_score}
                                                </span>
                                                <span className="text-xs text-[var(--color-text-tertiary)] ml-1">
                                                    ({item.score_data.total_reviews} reviews)
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <h2
                    className="text-2xl font-bold mb-4"
                    style={{ color: 'var(--color-text-primary)' }}
                >
                    Quick Actions
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card hover>
                        <button
                            onClick={() => navigate('/services')}
                            className="w-full text-left"
                        >
                            <div className="flex items-center gap-4">
                                <div
                                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                                    style={{ background: 'var(--gradient-primary)' }}
                                >
                                    <Package size={24} color="white" />
                                </div>
                                <div>
                                    <h3
                                        className="font-semibold mb-1"
                                        style={{ color: 'var(--color-text-primary)' }}
                                    >
                                        Browse Services
                                    </h3>
                                    <p
                                        className="text-sm"
                                        style={{ color: 'var(--color-text-secondary)' }}
                                    >
                                        Discover services in your community
                                    </p>
                                </div>
                            </div>
                        </button>
                    </Card>

                    <Card hover>
                        <button
                            onClick={() => navigate('/my-services')}
                            className="w-full text-left"
                        >
                            <div className="flex items-center gap-4">
                                <div
                                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                                    style={{ background: 'var(--gradient-accent)' }}
                                >
                                    <Users size={24} color="white" />
                                </div>
                                <div>
                                    <h3
                                        className="font-semibold mb-1"
                                        style={{ color: 'var(--color-text-primary)' }}
                                    >
                                        Manage My Services
                                    </h3>
                                    <p
                                        className="text-sm"
                                        style={{ color: 'var(--color-text-secondary)' }}
                                    >
                                        Add or edit your service listings
                                    </p>
                                </div>
                            </div>
                        </button>
                    </Card>

                    <Card hover>
                        <button
                            onClick={() => navigate('/bookings')}
                            className="w-full text-left"
                        >
                            <div className="flex items-center gap-4">
                                <div
                                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                                    style={{ background: 'var(--color-primary)' }}
                                >
                                    <MessageSquare size={24} color="white" />
                                </div>
                                <div>
                                    <h3
                                        className="font-semibold mb-1"
                                        style={{ color: 'var(--color-text-primary)' }}
                                    >
                                        Messages
                                    </h3>
                                    <p
                                        className="text-sm"
                                        style={{ color: 'var(--color-text-secondary)' }}
                                    >
                                        You have {stats.unreadCount || 0} unread messages
                                    </p>
                                </div>
                            </div>
                        </button>
                    </Card>
                </div>
            </motion.div>
        </div>
    );
};

export default DashboardPage;

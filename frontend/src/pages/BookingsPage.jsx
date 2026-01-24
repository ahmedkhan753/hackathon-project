import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getCurrentUser } from '../services/auth';
import { bookingsAPI } from '../services/api';
import Sidebar from '../components/Sidebar';
import { Card, Button, LoadingSpinner, EmptyState, Badge } from '../components/UIComponents';
import { Calendar, Clock, User as UserIcon, Package, CheckCircle, XCircle } from 'lucide-react';

const BookingsPage = () => {
    const [user, setUser] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, as_seeker, as_provider
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/auth');
            return;
        }

        fetchData();
    }, [navigate, filter]);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const userData = await getCurrentUser(token);
            setUser(userData);

            const params = filter === 'all'
                ? { as_seeker: true, as_provider: true }
                : filter === 'as_seeker'
                    ? { as_seeker: true, as_provider: false }
                    : { as_seeker: false, as_provider: true };

            const bookingsData = await bookingsAPI.list(params);
            setBookings(bookingsData);
        } catch (error) {
            console.error('Failed to fetch data:', error);
            localStorage.removeItem('token');
            navigate('/auth');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (bookingId, newStatus) => {
        try {
            await bookingsAPI.updateStatus(bookingId, newStatus);
            fetchData();
        } catch (error) {
            alert(error.message);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/auth');
    };

    const getStatusBadge = (status) => {
        const variants = {
            pending: 'warning',
            confirmed: 'info',
            completed: 'success',
            cancelled: 'error',
        };
        return <Badge variant={variants[status] || 'info'}>{status}</Badge>;
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading || !user) {
        return (
            <div
                className="min-h-screen flex items-center justify-center"
                style={{ background: 'var(--color-bg-primary)' }}
            >
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div style={{ background: 'var(--color-bg-primary)', minHeight: '100vh' }}>
            <Sidebar user={user} onLogout={handleLogout} />

            <main className="ml-64 p-8">
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
                            My Bookings
                        </h1>
                        <p style={{ color: 'var(--color-text-secondary)' }}>
                            Manage your service bookings
                        </p>
                    </motion.div>

                    {/* Filter Tabs */}
                    <div className="mb-6 flex gap-2">
                        <Button
                            variant={filter === 'all' ? 'primary' : 'secondary'}
                            size="sm"
                            onClick={() => setFilter('all')}
                        >
                            All Bookings
                        </Button>
                        <Button
                            variant={filter === 'as_seeker' ? 'primary' : 'secondary'}
                            size="sm"
                            onClick={() => setFilter('as_seeker')}
                        >
                            My Requests
                        </Button>
                        <Button
                            variant={filter === 'as_provider' ? 'primary' : 'secondary'}
                            size="sm"
                            onClick={() => setFilter('as_provider')}
                        >
                            Service Requests
                        </Button>
                    </div>

                    {/* Bookings List */}
                    {bookings.length === 0 ? (
                        <EmptyState
                            icon={Calendar}
                            title="No bookings found"
                            description="You don't have any bookings yet"
                        />
                    ) : (
                        <div className="space-y-4">
                            {bookings.map((booking, index) => {
                                const isProvider = booking.service.provider_id === user.id;

                                return (
                                    <motion.div
                                        key={booking.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <Card>
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className="flex-1 space-y-3">
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <h3
                                                                className="text-lg font-bold mb-1"
                                                                style={{ color: 'var(--color-text-primary)' }}
                                                            >
                                                                {booking.service.title}
                                                            </h3>
                                                            <div className="flex items-center gap-2">
                                                                {getStatusBadge(booking.status)}
                                                                <Badge variant="info">
                                                                    {isProvider ? 'As Provider' : 'As Seeker'}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        <div
                                                            className="flex items-center gap-2 text-sm"
                                                            style={{ color: 'var(--color-text-secondary)' }}
                                                        >
                                                            <Clock size={16} />
                                                            <span>Start: {formatDate(booking.slot_start)}</span>
                                                        </div>
                                                        <div
                                                            className="flex items-center gap-2 text-sm"
                                                            style={{ color: 'var(--color-text-secondary)' }}
                                                        >
                                                            <Clock size={16} />
                                                            <span>End: {formatDate(booking.slot_end)}</span>
                                                        </div>
                                                    </div>

                                                    <div
                                                        className="flex items-center gap-2 text-sm"
                                                        style={{ color: 'var(--color-text-tertiary)' }}
                                                    >
                                                        <UserIcon size={16} />
                                                        <span>
                                                            {isProvider
                                                                ? `Booked by: ${booking.seeker?.name || 'Unknown'}`
                                                                : `Provider: ${booking.service.provider?.name || 'Unknown'}`
                                                            }
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                {booking.status === 'pending' && (
                                                    <div className="flex flex-col gap-2">
                                                        {isProvider ? (
                                                            <>
                                                                <Button
                                                                    variant="primary"
                                                                    size="sm"
                                                                    icon={CheckCircle}
                                                                    onClick={() => handleUpdateStatus(booking.id, 'confirmed')}
                                                                >
                                                                    Confirm
                                                                </Button>
                                                                <Button
                                                                    variant="danger"
                                                                    size="sm"
                                                                    icon={XCircle}
                                                                    onClick={() => handleUpdateStatus(booking.id, 'cancelled')}
                                                                >
                                                                    Cancel
                                                                </Button>
                                                            </>
                                                        ) : (
                                                            <Button
                                                                variant="danger"
                                                                size="sm"
                                                                icon={XCircle}
                                                                onClick={() => handleUpdateStatus(booking.id, 'cancelled')}
                                                            >
                                                                Cancel
                                                            </Button>
                                                        )}
                                                    </div>
                                                )}

                                                {booking.status === 'confirmed' && isProvider && (
                                                    <div className="flex flex-col gap-2">
                                                        <Button
                                                            variant="primary"
                                                            size="sm"
                                                            icon={CheckCircle}
                                                            onClick={() => handleUpdateStatus(booking.id, 'completed')}
                                                        >
                                                            Mark Complete
                                                        </Button>
                                                        <Button
                                                            variant="danger"
                                                            size="sm"
                                                            icon={XCircle}
                                                            onClick={() => handleUpdateStatus(booking.id, 'cancelled')}
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </Card>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default BookingsPage;

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getCurrentUser } from '../services/auth';
import { servicesAPI, bookingsAPI } from '../services/api';
import Sidebar from '../components/Sidebar';
import { Card, Button, Modal, LoadingSpinner, EmptyState, Badge } from '../components/UIComponents';
import { Calendar, User as UserIcon, Package, Sparkles, Tag, DollarSign, Clock } from 'lucide-react';

const AllServicesPage = () => {
    const [user, setUser] = useState(null);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [bookingModal, setBookingModal] = useState(false);
    const [selectedService, setSelectedService] = useState(null);
    const [bookingData, setBookingData] = useState({
        slot_start: '',
        slot_end: '',
    });
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/auth');
            return;
        }

        initializePage();
    }, [navigate]);

    const initializePage = async () => {
        try {
            const token = localStorage.getItem('token');
            const [userData, servicesData] = await Promise.all([
                getCurrentUser(token),
                servicesAPI.getAllDetailed()
            ]);
            setUser(userData);
            setServices(servicesData);
        } catch (error) {
            console.error('Failed to initialize page:', error);
            if (error.message.includes('auth') || error.message.includes('token')) {
                localStorage.removeItem('token');
                navigate('/auth');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleBookService = async () => {
        try {
            await bookingsAPI.create({
                service_id: selectedService.id,
                slot_start: new Date(bookingData.slot_start).toISOString(),
                slot_end: new Date(bookingData.slot_end).toISOString(),
            });
            setBookingModal(false);
            setSelectedService(null);
            setBookingData({ slot_start: '', slot_end: '' });
            alert('Booking created successfully!');
        } catch (error) {
            alert(error.message);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/auth');
    };

    if (loading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)]">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div style={{ background: 'var(--color-bg-primary)', minHeight: '100vh' }}>
            <Sidebar user={user} onLogout={handleLogout} />

            <main className="ml-64 p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-10"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-4xl font-bold text-[var(--color-text-primary)]">
                                All Services
                            </h1>
                            <Sparkles size={32} className="text-[var(--color-accent-purple)]" />
                        </div>
                        <p className="text-[var(--color-text-secondary)]">
                            Explore all available services in your community
                        </p>
                    </motion.div>

                    {/* Results Grid */}
                    {services.length === 0 ? (
                        <EmptyState
                            icon={Package}
                            title="No services found"
                            description="It looks like there are no services available right now."
                        />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {services.map((service, index) => (
                                <motion.div
                                    key={service.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <Card className="h-full flex flex-col hover:shadow-xl transition-shadow duration-300">
                                        <div className="p-5 flex-1 flex flex-col space-y-4">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-1">
                                                        {service.title}
                                                    </h3>
                                                    <Badge variant="purple" className="flex items-center gap-1 w-fit">
                                                        <Tag size={12} />
                                                        {service.category || 'General'}
                                                    </Badge>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-2xl font-bold text-[var(--color-accent-blue)]">
                                                        ${service.price}
                                                    </span>
                                                    <span className="text-xs text-[var(--color-text-tertiary)]">per hour</span>
                                                </div>
                                            </div>

                                            <p className="text-[var(--color-text-secondary)] text-sm line-clamp-4 flex-1">
                                                {service.description}
                                            </p>

                                            <div className="space-y-2 pt-4 border-t border-[var(--color-surface-border)]">
                                                <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                                                    <UserIcon size={16} className="text-[var(--color-accent-purple)]" />
                                                    <span className="font-medium">
                                                        {service.provider?.name || `Provider #${service.provider_id}`}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-[var(--color-text-tertiary)]">
                                                    <Clock size={14} />
                                                    <span>Added {new Date(service.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>

                                            <Button
                                                variant="primary"
                                                className="w-full mt-2"
                                                icon={Calendar}
                                                onClick={() => {
                                                    if (service.provider_id === user.id) {
                                                        alert('You cannot book your own service');
                                                        return;
                                                    }
                                                    setSelectedService(service);
                                                    setBookingModal(true);
                                                }}
                                                disabled={service.provider_id === user.id}
                                            >
                                                {service.provider_id === user.id ? 'Your Service' : 'Book Now'}
                                            </Button>
                                        </div>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Booking Modal */}
            <AnimatePresence>
                {bookingModal && selectedService && (
                    <Modal
                        isOpen={bookingModal}
                        onClose={() => {
                            setBookingModal(false);
                            setSelectedService(null);
                            setBookingData({ slot_start: '', slot_end: '' });
                        }}
                        title={`Book Appointment: ${selectedService.title}`}
                    >
                        <div className="space-y-6">
                            <div className="p-4 rounded-xl bg-[var(--color-surface-bg-hover)] border border-[var(--color-surface-border)]">
                                <h4 className="font-bold text-[var(--color-text-primary)] mb-1">Service Details</h4>
                                <p className="text-sm text-[var(--color-text-secondary)]">{selectedService.description}</p>
                                <div className="mt-3 flex items-center gap-2 text-[var(--color-accent-blue)] font-bold">
                                    <DollarSign size={16} />
                                    <span>{selectedService.price} / hour</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <Input
                                    label="Desired Start Time"
                                    type="datetime-local"
                                    value={bookingData.slot_start}
                                    onChange={(e) => setBookingData({ ...bookingData, slot_start: e.target.value })}
                                />

                                <Input
                                    label="Desired End Time"
                                    type="datetime-local"
                                    value={bookingData.slot_end}
                                    onChange={(e) => setBookingData({ ...bookingData, slot_end: e.target.value })}
                                />
                            </div>

                            <div className="flex gap-4 pt-2">
                                <Button
                                    variant="secondary"
                                    className="flex-1"
                                    onClick={() => {
                                        setBookingModal(false);
                                        setSelectedService(null);
                                        setBookingData({ slot_start: '', slot_end: '' });
                                    }}
                                >
                                    Maybe Later
                                </Button>
                                <Button
                                    variant="primary"
                                    className="flex-1"
                                    onClick={handleBookService}
                                    disabled={!bookingData.slot_start || !bookingData.slot_end}
                                >
                                    Confirm Booking
                                </Button>
                            </div>
                        </div>
                    </Modal>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AllServicesPage;

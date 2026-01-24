import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getCurrentUser } from '../services/auth';
import { servicesAPI, bookingsAPI } from '../services/api';
import Sidebar from '../components/Sidebar';
import { Card, Button, Input, Modal, LoadingSpinner, EmptyState, Badge } from '../components/UIComponents';
import { Search, Filter, MapPin, Calendar, User as UserIcon, Package } from 'lucide-react';

const ServicesPage = () => {
    const [user, setUser] = useState(null);
    const [services, setServices] = useState([]);
    const [filteredServices, setFilteredServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedService, setSelectedService] = useState(null);
    const [bookingModal, setBookingModal] = useState(false);
    const [bookingData, setBookingData] = useState({
        slot_start: '',
        slot_end: '',
    });
    const navigate = useNavigate();

    const categories = ['all', 'teaching', 'repair', 'rental', 'consulting', 'other'];

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/auth');
            return;
        }

        const fetchData = async () => {
            try {
                const [userData, servicesData] = await Promise.all([
                    getCurrentUser(token),
                    servicesAPI.list(),
                ]);
                setUser(userData);
                setServices(servicesData);
                setFilteredServices(servicesData);
            } catch (error) {
                console.error('Failed to fetch data:', error);
                localStorage.removeItem('token');
                navigate('/auth');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [navigate]);

    useEffect(() => {
        let filtered = services;

        if (searchQuery) {
            filtered = filtered.filter(service =>
                service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                service.description.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (selectedCategory !== 'all') {
            filtered = filtered.filter(service => service.category === selectedCategory);
        }

        setFilteredServices(filtered);
    }, [searchQuery, selectedCategory, services]);

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
                            Browse Services
                        </h1>
                        <p style={{ color: 'var(--color-text-secondary)' }}>
                            Discover and book services from your community
                        </p>
                    </motion.div>

                    {/* Search and Filter */}
                    <div className="mb-6 space-y-4">
                        <Input
                            icon={Search}
                            placeholder="Search services..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />

                        <div className="flex gap-2 flex-wrap">
                            {categories.map(category => (
                                <Button
                                    key={category}
                                    variant={selectedCategory === category ? 'primary' : 'secondary'}
                                    size="sm"
                                    onClick={() => setSelectedCategory(category)}
                                >
                                    {category.charAt(0).toUpperCase() + category.slice(1)}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Services Grid */}
                    {filteredServices.length === 0 ? (
                        <EmptyState
                            icon={Package}
                            title="No services found"
                            description="Try adjusting your search or filters"
                        />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredServices.map((service, index) => (
                                <motion.div
                                    key={service.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <Card>
                                        <div className="space-y-3">
                                            <div className="flex items-start justify-between">
                                                <h3
                                                    className="text-lg font-bold"
                                                    style={{ color: 'var(--color-text-primary)' }}
                                                >
                                                    {service.title}
                                                </h3>
                                                <Badge variant="info">
                                                    {service.category}
                                                </Badge>
                                            </div>

                                            <p
                                                className="text-sm line-clamp-3"
                                                style={{ color: 'var(--color-text-secondary)' }}
                                            >
                                                {service.description}
                                            </p>

                                            <div
                                                className="flex items-center gap-2 text-sm"
                                                style={{ color: 'var(--color-text-tertiary)' }}
                                            >
                                                <UserIcon size={16} />
                                                <span>{service.provider?.name || 'Provider'}</span>
                                            </div>

                                            <Button
                                                variant="primary"
                                                className="w-full"
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
                        title={`Book: ${selectedService.title}`}
                    >
                        <div className="space-y-4">
                            <p style={{ color: 'var(--color-text-secondary)' }}>
                                {selectedService.description}
                            </p>

                            <Input
                                label="Start Date & Time"
                                type="datetime-local"
                                value={bookingData.slot_start}
                                onChange={(e) => setBookingData({ ...bookingData, slot_start: e.target.value })}
                            />

                            <Input
                                label="End Date & Time"
                                type="datetime-local"
                                value={bookingData.slot_end}
                                onChange={(e) => setBookingData({ ...bookingData, slot_end: e.target.value })}
                            />

                            <div className="flex gap-3">
                                <Button
                                    variant="secondary"
                                    className="flex-1"
                                    onClick={() => {
                                        setBookingModal(false);
                                        setSelectedService(null);
                                        setBookingData({ slot_start: '', slot_end: '' });
                                    }}
                                >
                                    Cancel
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

export default ServicesPage;

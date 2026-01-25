import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getCurrentUser } from '../services/auth';
import { searchAPI, bookingsAPI } from '../services/api';
import Sidebar from '../components/Sidebar';
import { Card, Button, Input, Modal, LoadingSpinner, EmptyState, Badge } from '../components/UIComponents';
import { Search, MapPin, Calendar, User as UserIcon, Package, Sparkles } from 'lucide-react';

const ServicesPage = () => {
    const [user, setUser] = useState(null);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [userLocation, setUserLocation] = useState(null);
    const [radius, setRadius] = useState(5);
    const [selectedService, setSelectedService] = useState(null);
    const [bookingModal, setBookingModal] = useState(false);
    const [bookingData, setBookingData] = useState({
        slot_start: '',
        slot_end: '',
    });
    const navigate = useNavigate();

    const radiusOptions = [1, 5, 10, 25];

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/auth');
            return;
        }

        fetchData();

        // Get user's location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => {
                    console.warn('Geolocation error:', error);
                    // Default to NYC if geolocation fails
                    setUserLocation({ lat: 40.7128, lng: -74.0060 });
                }
            );
        } else {
            // Default location
            setUserLocation({ lat: 40.7128, lng: -74.0060 });
        }
    }, [navigate]);

    const fetchData = async () => {
        try {
            const userData = await getCurrentUser(localStorage.getItem('token'));
            setUser(userData);
        } catch (error) {
            console.error('Failed to fetch data:', error);
            localStorage.removeItem('token');
            navigate('/auth');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim() || !userLocation) {
            alert('Please enter a search query and allow location access');
            return;
        }

        setSearching(true);
        try {
            const results = await searchAPI.search({
                query: searchQuery,
                lat: userLocation.lat,
                lng: userLocation.lng,
                km: radius,
                limit: 20
            });
            setServices(results);
        } catch (error) {
            console.error('Search error:', error);
            alert(error.message);
        } finally {
            setSearching(false);
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
                        <div className="flex items-center gap-2 mb-2">
                            <h1
                                className="text-4xl font-bold"
                                style={{ color: 'var(--color-text-primary)' }}
                            >
                                Semantic Search
                            </h1>
                            <Sparkles size={32} style={{ color: 'var(--color-accent-purple)' }} />
                        </div>
                        <p style={{ color: 'var(--color-text-secondary)' }}>
                            AI-powered search that understands meaning, not just keywords
                        </p>
                    </motion.div>

                    {/* Search Bar */}
                    <Card className="mb-6">
                        <div className="space-y-4">
                            <div className="flex gap-3">
                                <div className="flex-1">
                                    <Input
                                        icon={Search}
                                        placeholder='Try "bike repair", "math tutor", or "house cleaning"...'
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    />
                                </div>
                                <Button
                                    variant="primary"
                                    icon={Search}
                                    onClick={handleSearch}
                                    disabled={searching || !userLocation}
                                >
                                    {searching ? 'Searching...' : 'Search'}
                                </Button>
                            </div>

                            {/* Location & Radius */}
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2" style={{ color: 'var(--color-text-secondary)' }}>
                                    <MapPin size={16} />
                                    <span className="text-sm">
                                        {userLocation
                                            ? `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`
                                            : 'Getting location...'}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                                        Radius:
                                    </span>
                                    {radiusOptions.map(km => (
                                        <Button
                                            key={km}
                                            variant={radius === km ? 'primary' : 'secondary'}
                                            size="sm"
                                            onClick={() => setRadius(km)}
                                        >
                                            {km}km
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            {/* Search Tips */}
                            <div
                                className="text-xs p-3 rounded-lg"
                                style={{
                                    background: 'var(--color-info-bg)',
                                    color: 'var(--color-text-secondary)'
                                }}
                            >
                                💡 <strong>Tip:</strong> Our AI understands context! "bike fix" finds "motorcycle repair",
                                "math help" finds "algebra tutoring", etc.
                            </div>
                        </div>
                    </Card>

                    {/* Results */}
                    {services.length === 0 ? (
                        <EmptyState
                            icon={Package}
                            title="No results yet"
                            description="Enter a search query and click Search to find services near you"
                        />
                    ) : (
                        <div className="space-y-4">
                            <h2
                                className="text-xl font-bold"
                                style={{ color: 'var(--color-text-primary)' }}
                            >
                                Found {services.length} services
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {services.map((service, index) => (
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

                                                {/* Relevance Score */}
                                                {service.score !== null && (
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="h-2 flex-1 rounded-full overflow-hidden"
                                                            style={{ background: 'var(--color-surface-border)' }}
                                                        >
                                                            <div
                                                                className="h-full rounded-full"
                                                                style={{
                                                                    width: `${service.score * 100}%`,
                                                                    background: 'var(--gradient-primary)'
                                                                }}
                                                            />
                                                        </div>
                                                        <span
                                                            className="text-xs font-medium"
                                                            style={{ color: 'var(--color-text-tertiary)' }}
                                                        >
                                                            {(service.score * 100).toFixed(0)}% match
                                                        </span>
                                                    </div>
                                                )}

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
                                                    <span>Provider #{service.provider_id}</span>
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

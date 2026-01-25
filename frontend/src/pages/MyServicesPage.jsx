import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getCurrentUser } from '../services/auth';
import { servicesAPI } from '../services/api';
import Sidebar from '../components/Sidebar';
import { Card, Button, Input, Modal, LoadingSpinner, EmptyState, Badge } from '../components/UIComponents';
import { Plus, Edit2, Trash2, Package } from 'lucide-react';

const MyServicesPage = () => {
    const [user, setUser] = useState(null);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'teaching',
        latitude: null,
        longitude: null,
    });
    const navigate = useNavigate();

    const categories = ['teaching', 'repair', 'rental', 'consulting', 'other'];

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/auth');
            return;
        }

        fetchData();
    }, [navigate]);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const userData = await getCurrentUser(token);
            setUser(userData);

            const servicesData = await servicesAPI.list({ provider_id: userData.id });
            setServices(servicesData);
        } catch (error) {
            console.error('Failed to fetch data:', error);
            localStorage.removeItem('token');
            navigate('/auth');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        try {
            if (editingService) {
                await servicesAPI.update(editingService.id, formData);
            } else {
                await servicesAPI.create(formData);
            }
            setShowModal(false);
            setEditingService(null);
            setFormData({ title: '', description: '', category: 'teaching' });
            fetchData();
        } catch (error) {
            alert(error.message);
        }
    };

    const handleEdit = (service) => {
        setEditingService(service);
        setFormData({
            title: service.title,
            description: service.description,
            category: service.category,
        });
        setShowModal(true);
    };

    const handleDelete = async (serviceId) => {
        if (!confirm('Are you sure you want to delete this service?')) return;

        try {
            await servicesAPI.delete(serviceId);
            fetchData();
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
                        className="mb-8 flex items-center justify-between"
                    >
                        <div>
                            <h1
                                className="text-4xl font-bold mb-2"
                                style={{ color: 'var(--color-text-primary)' }}
                            >
                                My Services
                            </h1>
                            <p style={{ color: 'var(--color-text-secondary)' }}>
                                Manage your service listings
                            </p>
                        </div>
                        <Button
                            variant="primary"
                            icon={Plus}
                            onClick={() => {
                                setEditingService(null);
                                setFormData({ title: '', description: '', category: 'teaching' });
                                setShowModal(true);
                            }}
                        >
                            Add Service
                        </Button>
                    </motion.div>

                    {/* Services Grid */}
                    {services.length === 0 ? (
                        <EmptyState
                            icon={Package}
                            title="No services yet"
                            description="Create your first service to start offering your skills to the community"
                            action={
                                <Button
                                    variant="primary"
                                    icon={Plus}
                                    onClick={() => setShowModal(true)}
                                >
                                    Create Service
                                </Button>
                            }
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
                                    <Card>
                                        <div className="space-y-3">
                                            <div className="flex items-start justify-between">
                                                <h3
                                                    className="text-lg font-bold"
                                                    style={{ color: 'var(--color-text-primary)' }}
                                                >
                                                    {service.title}
                                                </h3>
                                                <Badge variant={service.state === 'active' ? 'success' : 'warning'}>
                                                    {service.state}
                                                </Badge>
                                            </div>

                                            <Badge variant="info">
                                                {service.category}
                                            </Badge>

                                            <p
                                                className="text-sm"
                                                style={{ color: 'var(--color-text-secondary)' }}
                                            >
                                                {service.description}
                                            </p>

                                            <div className="flex gap-2">
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    icon={Edit2}
                                                    className="flex-1"
                                                    onClick={() => handleEdit(service)}
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    icon={Trash2}
                                                    className="flex-1"
                                                    onClick={() => handleDelete(service.id)}
                                                >
                                                    Delete
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Add/Edit Service Modal */}
            <AnimatePresence>
                {showModal && (
                    <Modal
                        isOpen={showModal}
                        onClose={() => {
                            setShowModal(false);
                            setEditingService(null);
                            setFormData({ title: '', description: '', category: 'teaching' });
                        }}
                        title={editingService ? 'Edit Service' : 'Add New Service'}
                    >
                        <div className="space-y-4">
                            <Input
                                label="Service Title"
                                placeholder="e.g., Math Tutoring"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />

                            <div className="space-y-1">
                                <label className="block text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                                    Description
                                </label>
                                <textarea
                                    className="input"
                                    rows="4"
                                    placeholder="Describe your service..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                                    Category
                                </label>
                                <select
                                    className="input"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                >
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>
                                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Location Fields */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                                    Location (Optional - for search)
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <Input
                                        label="Latitude"
                                        type="number"
                                        step="0.000001"
                                        placeholder="40.7128"
                                        value={formData.latitude || ''}
                                        onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || null })}
                                    />
                                    <Input
                                        label="Longitude"
                                        type="number"
                                        step="0.000001"
                                        placeholder="-74.0060"
                                        value={formData.longitude || ''}
                                        onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || null })}
                                    />
                                </div>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => {
                                        if (navigator.geolocation) {
                                            navigator.geolocation.getCurrentPosition(
                                                (position) => {
                                                    setFormData({
                                                        ...formData,
                                                        latitude: position.coords.latitude,
                                                        longitude: position.coords.longitude
                                                    });
                                                },
                                                (error) => alert('Could not get location: ' + error.message)
                                            );
                                        } else {
                                            alert('Geolocation not supported');
                                        }
                                    }}
                                >
                                    📍 Use My Location
                                </Button>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    variant="secondary"
                                    className="flex-1"
                                    onClick={() => {
                                        setShowModal(false);
                                        setEditingService(null);
                                        setFormData({ title: '', description: '', category: 'teaching' });
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    className="flex-1"
                                    onClick={handleSubmit}
                                    disabled={!formData.title || !formData.description}
                                >
                                    {editingService ? 'Update' : 'Create'}
                                </Button>
                            </div>
                        </div>
                    </Modal>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MyServicesPage;

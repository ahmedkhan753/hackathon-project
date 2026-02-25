import React, { useEffect, useState } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { getCurrentUser } from '../services/auth';
import Sidebar from './Sidebar';
import { LoadingSpinner } from './UIComponents';

const Layout = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/auth');
            return;
        }

        const fetchUser = async () => {
            try {
                const userData = await getCurrentUser(token);
                setUser(userData);
            } catch (error) {
                console.error('Layout: Session expired', error);
                localStorage.removeItem('token');
                navigate('/auth');
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/auth');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg-primary)' }}>
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div style={{ background: 'var(--color-bg-primary)', minHeight: '100vh' }}>
            <Sidebar user={user} onLogout={handleLogout} />
            <main className="ml-64 p-8 transition-all duration-300">
                <div className="container mx-auto">
                    <Outlet context={{ user, handleLogout }} />
                </div>
            </main>
        </div>
    );
};

export default Layout;

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../services/auth';
import { LogOut, User } from 'lucide-react';

const Dashboard = () => {
    const [user, setUser] = useState(null);
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
                console.error('Failed to fetch user:', error);
                localStorage.removeItem('token');
                navigate('/auth');
            }
        };

        fetchUser();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/auth');
    };

    if (!user) return <div className="min-h-screen flex items-center justify-center bg-gray-100">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm p-4 flex justify-between items-center">
                <h1 className="text-xl font-bold text-indigo-600">Neighbourly</h1>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-gray-600">
                        <User size={20} />
                        <span>{user.name}</span>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <LogOut size={20} />
                        Logout
                    </button>
                </div>
            </nav>

            <main className="p-8">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h2>
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center py-20">
                        <h3 className="text-xl text-gray-500">Welcome to your dashboard!</h3>
                        <p className="text-gray-400 mt-2">More features coming soon...</p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;

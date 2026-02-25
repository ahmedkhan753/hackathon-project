import { useNavigate, useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { paymentsAPI } from '../services/api';
import { Card, Button, LoadingSpinner, EmptyState, Badge } from '../components/UIComponents';
import { CreditCard, DollarSign } from 'lucide-react';

const PaymentsPage = () => {
    const { user, handleLogout } = useOutletContext();
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        try {
            const paymentsData = await paymentsAPI.getHistory();
            setPayments(paymentsData);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
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
            <div className="flex items-center justify-center p-12">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="container">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                    Payment History
                </h1>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                    View your payment transactions
                </p>
            </motion.div>

            {/* Payments List */}
            {payments.length === 0 ? (
                <EmptyState icon={CreditCard} title="No payments yet" description="Your payment history will appear here" />
            ) : (
                <div className="space-y-4">
                    {payments.map((payment, index) => (
                        <motion.div key={payment.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                            <Card>
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                                                    {payment.booking.service.title}
                                                </h3>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="success">{payment.status}</Badge>
                                                    <Badge variant="info">Transaction ID: {payment.transaction_id}</Badge>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                                                <DollarSign size={16} />
                                                <span>Amount: ${payment.amount}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                                                <span>Paid on: {formatDate(payment.created_at)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PaymentsPage;

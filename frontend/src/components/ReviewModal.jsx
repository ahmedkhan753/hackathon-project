import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star } from 'lucide-react';
import { Button, Card, LoadingSpinner } from './UIComponents';
import { reviewsAPI } from '../services/api';

const ReviewModal = ({ isOpen, onClose, booking, onSuccess }) => {
    const [rating, setRating] = useState(5);
    const [hover, setHover] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            await reviewsAPI.create({
                booking_id: booking.id,
                rating,
                comment
            });
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (!booking) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-md"
                    >
                        <Card className="!p-0 overflow-hidden">
                            <div className="p-6 border-b border-[var(--color-border)] flex items-center justify-between">
                                <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                                    Rate your experience
                                </h2>
                                <button onClick={onClose} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                <div className="text-center">
                                    <p className="text-[var(--color-text-secondary)] mb-4">
                                        How was your service with {booking.service.title}?
                                    </p>

                                    <div className="flex items-center justify-center gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                className="transition-transform active:scale-95"
                                                onMouseEnter={() => setHover(star)}
                                                onMouseLeave={() => setHover(0)}
                                                onClick={() => setRating(star)}
                                            >
                                                <Star
                                                    size={32}
                                                    fill={(hover || rating) >= star ? "var(--color-warning)" : "none"}
                                                    color={(hover || rating) >= star ? "var(--color-warning)" : "var(--color-text-tertiary)"}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                    <p className="mt-2 font-bold text-[var(--color-warning)]">
                                        {rating === 5 ? 'Excellent!' : rating === 4 ? 'Great' : rating === 3 ? 'Good' : rating === 2 ? 'Fair' : 'Poor'}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                        Tell us more (optional)
                                    </label>
                                    <textarea
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        placeholder="What did you like? What could be improved?"
                                        rows={4}
                                        className="w-full bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] p-4 rounded-xl border border-[var(--color-border)] focus:border-[var(--color-primary)] outline-none transition-colors resize-none"
                                    />
                                </div>

                                {error && (
                                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm">
                                        {error}
                                    </div>
                                )}

                                <div className="flex gap-3">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        className="flex-1"
                                        onClick={onClose}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        className="flex-1"
                                        disabled={submitting}
                                    >
                                        {submitting ? <LoadingSpinner size="sm" /> : 'Submit Review'}
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ReviewModal;

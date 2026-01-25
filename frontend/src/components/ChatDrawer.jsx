import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, User } from 'lucide-react';
import { chatAPI } from '../services/api';
import { Button, Input, LoadingSpinner, Badge } from './UIComponents';

const ChatDrawer = ({ isOpen, onClose, booking, currentUser }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [connected, setConnected] = useState(false);
    const socketRef = useRef(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen && booking) {
            loadMessages();
            connectWebSocket();
        }
        return () => {
            if (socketRef.current) {
                socketRef.current.close();
            }
        };
    }, [isOpen, booking]);

    useEffect(scrollToBottom, [messages]);

    const loadMessages = async () => {
        try {
            setLoading(true);
            const data = await chatAPI.getMessages(booking.id);
            setMessages(data.messages || []);
            await chatAPI.markRead(booking.id);
        } catch (error) {
            console.error('Failed to load messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const connectWebSocket = () => {
        const url = chatAPI.getWebSocketUrl(booking.id);
        const socket = new WebSocket(url);

        socket.onopen = () => {
            console.log('Connected to chat');
            setConnected(true);
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'chat_message') {
                setMessages(prev => [...prev, data]);
            }
        };

        socket.onclose = () => {
            console.log('Chat disconnected');
            setConnected(false);
        };

        socketRef.current = socket;
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !socketRef.current) return;

        const recipientId = currentUser.id === booking.seeker_id
            ? booking.service.provider_id
            : booking.seeker_id;

        const msgData = {
            type: 'text',
            content: newMessage,
            recipient_id: recipientId
        };

        socketRef.current.send(JSON.stringify(msgData));

        // Add to local state immediately
        const optimisticMsg = {
            id: Date.now(),
            sender_id: currentUser.id,
            message: newMessage,
            timestamp: new Date().toISOString(),
            is_optimistic: true
        };
        setMessages(prev => [...prev, optimisticMsg]);
        setNewMessage('');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 h-full w-full max-w-md bg-[var(--color-bg-secondary)] shadow-2xl z-[70] flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)]">
                                    <User size={24} />
                                </div>
                                <div>
                                    <h2 className="font-bold text-[var(--color-text-primary)]">
                                        Chat - {booking.service.title}
                                    </h2>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
                                        <span className="text-xs text-[var(--color-text-secondary)]">
                                            {connected ? 'Realtime Connected' : 'Disconnected'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-[var(--color-bg-primary)] rounded-full transition-colors text-[var(--color-text-primary)]">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {loading ? (
                                <div className="h-full flex items-center justify-center">
                                    <LoadingSpinner size="md" />
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-[var(--color-text-secondary)] opacity-50">
                                    <p>No messages yet. Start the conversation!</p>
                                </div>
                            ) : (
                                messages.map((msg) => {
                                    const isMe = msg.sender_id === currentUser.id;
                                    return (
                                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div
                                                className={`max-w-[80%] p-3 rounded-2xl ${isMe
                                                        ? 'bg-[var(--color-primary)] text-white rounded-tr-none'
                                                        : 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] rounded-tl-none border border-[var(--color-border)]'
                                                    }`}
                                            >
                                                <p className="text-sm">{msg.message}</p>
                                                <span className={`text-[10px] block mt-1 ${isMe ? 'text-white/70' : 'text-[var(--color-text-secondary)]'}`}>
                                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSendMessage} className="p-4 border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] px-4 py-2 rounded-xl outline-none border border-[var(--color-border)] focus:border-[var(--color-primary)] transition-colors"
                                />
                                <Button
                                    type="submit"
                                    variant="primary"
                                    icon={Send}
                                    disabled={!newMessage.trim() || !connected}
                                    size="sm"
                                    className="!rounded-xl"
                                />
                            </div>
                        </form>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ChatDrawer;

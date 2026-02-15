import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import useWebSocket from '../hooks/useWebSocket';
import apiClient from '../api/client';
import Toast from '../components/common/Toast';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [toast, setToast] = useState(null);

    const showToast = useCallback((message, type = 'info', onClick = null) => {
        setToast({ message, type, onClick });
    }, []);

    const fetchNotifications = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            // Default to recent (24h) for bell
            const response = await apiClient.get('notifications/?filter=recent');
            const notificationsData = Array.isArray(response.data)
                ? response.data
                : (response.data?.results || []);
            setNotifications(notificationsData);

            const countResponse = await apiClient.get('notifications/unread_count/?filter=recent');
            setUnreadCount(countResponse.data.count);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        }
    }, [isAuthenticated]);

    const fetchArchivedNotifications = useCallback(async () => {
        if (!isAuthenticated) return [];
        try {
            const response = await apiClient.get('notifications/?filter=archived');
            return Array.isArray(response.data) ? response.data : (response.data?.results || []);
        } catch (error) {
            console.error('Failed to fetch archived notifications', error);
            return [];
        }
    }, [isAuthenticated]);

    const registerPush = useCallback(async () => {
        if (!isAuthenticated || !('serviceWorker' in navigator)) return;

        try {
            // Check if permission is already granted
            if (Notification.permission !== 'granted') return;

            const registration = await navigator.serviceWorker.ready;

            const publicVapidKey = 'BPatCliCZSYI7aZuvBB29XJ43S4Y6_fT3mYpI6r9F0Jm6XzpLvc94QDqLQhtMcUf08z1nc7R6b2bU-8yY8oN87Y';

            let subscription = await registration.pushManager.getSubscription();

            if (!subscription) {
                const uint8Array = new Uint8Array(
                    atob(publicVapidKey.replace(/-/g, '+').replace(/_/g, '/'))
                        .split('')
                        .map(char => char.charCodeAt(0))
                );

                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: uint8Array
                });
            }

            // Sync with backend
            await apiClient.post('push/subscribe/', {
                subscription: {
                    endpoint: subscription.endpoint,
                    keys: {
                        p256dh: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('p256dh')))),
                        auth: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('auth'))))
                    }
                }
            });
        } catch (error) {
            console.error('Push notification setup failed', error);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchNotifications();
            registerPush();
        }
    }, [isAuthenticated, fetchNotifications, registerPush]);

    const handleWebSocketMessage = useCallback(async (data) => {
        console.log('WebSocket message received:', data);

        if (data.type === 'notification') {
            setNotifications(prev => [data.notification, ...prev]);
            setUnreadCount(prev => prev + 1);

            // Show in-app toast
            if (showToast) {
                const targetId = data.notification.related_agenda?.id;
                showToast(
                    data.notification.title || 'New Notification',
                    'info',
                    targetId ? () => navigate(`/tasks/${targetId}`) : null
                );
            }

            // Show native push notification via Service Worker
            if (Notification.permission === 'granted' && 'serviceWorker' in navigator) {
                try {
                    const registration = await navigator.serviceWorker.ready;

                    await registration.showNotification(data.notification.title, {
                        body: data.notification.message,
                        icon: '/logo192.png',
                        badge: '/logo192.png',
                        tag: `notification-${data.notification.id}`,
                        requireInteraction: false,
                        vibrate: [200, 100, 200],
                        data: {
                            url: data.notification.related_agenda
                                ? `/tasks/${data.notification.related_agenda.id}`
                                : '/'
                        },
                        actions: [
                            { action: 'open', title: 'View' },
                            { action: 'close', title: 'Dismiss' }
                        ]
                    });
                } catch (error) {
                    console.error('Failed to show notification:', error);
                }
            }
        }
    }, []);

    // Construct WebSocket URL with JWT token
    const wsUrl = isAuthenticated && user
        ? `wss://${window.location.hostname}/ws/notifications/?token=${localStorage.getItem('access_token')}`
        : null;

    const { send } = useWebSocket(wsUrl, handleWebSocketMessage);

    const markAsRead = async (id) => {
        try {
            await apiClient.post(`notifications/${id}/mark_read/`);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, is_read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));

            // Also notify via WebSocket to sync across tabs if needed
            send({ action: 'mark_read', notification_id: id });
        } catch (error) {
            console.error('Failed to mark notification as read', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await apiClient.post('notifications/mark_all_read/');
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all notifications as read', error);
        }
    };

    const deleteNotification = async (id) => {
        try {
            await apiClient.delete(`notifications/${id}/`);
            // Optimistically update lists
            setNotifications(prev => prev.filter(n => n.id !== id));
            // We might need to update unread count if we deleted an unread one
            // But usually we delete archived ones which are read. 
            // If strictly needed, we could fetch count again or track is_read.
        } catch (error) {
            console.error('Failed to delete notification', error);
            throw error;
        }
    };

    const clearArchivedNotifications = async () => {
        try {
            await apiClient.post('notifications/clear_archived/');
            // No local state update needed for archive list as it's fetched on demand in the page
            // But good to have function available
        } catch (error) {
            console.error('Failed to clear archived notifications', error);
            throw error;
        }
    };

    const value = {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        refresh: fetchNotifications,
        showToast,
        showToast,
        registerPush,
        fetchArchivedNotifications,
        deleteNotification,
        clearArchivedNotifications
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                    onClick={() => {
                        if (toast.onClick) toast.onClick();
                        setToast(null);
                    }}
                />
            )}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import {
    Bell, Check, X, AlertCircle, Clock,
    Calendar, UserPlus, Info, CheckCircle2
} from 'lucide-react';
import './NotificationCenter.css';

const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
};

const getNotificationIcon = (type) => {
    switch (type) {
        case 'stagnation':
        case 'agenda_overdue':
            return <AlertCircle className="icon-overdue" size={18} />;
        case 'deadline_warning':
            return <Clock className="icon-warning" size={18} />;
        case 'meeting_invite':
        case 'project_created':
            return <Calendar className="icon-info" size={18} />;
        case 'collaborator_added':
            return <UserPlus className="icon-success" size={18} />;
        case 'agenda_updated':
            return <Info className="icon-info" size={18} />;
        default:
            return <Bell size={18} />;
    }
};

const NotificationCenter = () => {
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);

    // Close on click outside
    useEffect(() => {
        if (!isOpen) return;
        const handleClick = () => setIsOpen(false);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, [isOpen]);

    return (
        <div className="notification-center" onClick={(e) => e.stopPropagation()}>
            <button
                className={`notification-trigger ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Notifications"
            >
                <Bell size={22} strokeWidth={2.5} />
                {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
            </button>

            {isOpen && (
                <>
                    <div className="mobile-backdrop md:hidden" onClick={() => setIsOpen(false)} />
                    <div className="notification-dropdown">
                        <div className="dropdown-header">
                            <div className="header-title">
                                <h3>Notifications</h3>
                                {unreadCount > 0 && <span className="unread-pill">{unreadCount} New</span>}
                            </div>
                            <div className="header-actions">
                                {unreadCount > 0 && (
                                    <button onClick={markAllAsRead} className="mark-all-btn">
                                        Mark all as read
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="notification-list custom-scrollbar">
                            {notifications.length > 0 ? (
                                notifications.map(n => (
                                    <div
                                        key={n.id}
                                        className={`notification-item ${n.is_read ? 'read' : 'unread'} cursor-pointer hover:bg-gray-50`}
                                        onClick={() => {
                                            if (!n.is_read) markAsRead(n.id);
                                            if (n.related_agenda) {
                                                navigate(`/tasks/${n.related_agenda.id || n.related_agenda}`);
                                                setIsOpen(false);
                                            } else if (n.related_project) {
                                                navigate(`/projects/${n.related_project.id || n.related_project}/edit`);
                                                setIsOpen(false);
                                            }
                                        }}
                                    >
                                        <div className="notification-icon-wrapper">
                                            {getNotificationIcon(n.notification_type)}
                                        </div>
                                        <div className="notification-content">
                                            <h4>{n.title}</h4>
                                            <p>{n.message}</p>
                                            <span className="notification-time">
                                                {formatRelativeTime(n.created_at)}
                                            </span>
                                        </div>
                                        {!n.is_read && (
                                            <div className="unread-indicator" />
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="empty-notifications">
                                    <div className="empty-icon">
                                        <CheckCircle2 size={48} strokeWidth={1} />
                                    </div>
                                    <p>You're all caught up!</p>
                                    <span>No new notifications at the moment.</span>
                                </div>
                            )}
                        </div>

                        <div className="dropdown-footer border-t border-gray-100 p-3 bg-gray-50/50">
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    navigate('/notifications/archive');
                                }}
                                className="w-full py-2 flex items-center justify-center gap-2 text-sm font-bold text-gray-500 hover:text-indigo-600 hover:bg-white rounded-xl transition-all border border-transparent hover:border-gray-200 hover:shadow-sm"
                            >
                                <Clock size={16} />
                                View Past Notifications
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default NotificationCenter;

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import { ArrowLeft, Bell, Calendar, AlertCircle, UserPlus, Info, Clock, Trash2, Trash } from 'lucide-react';
import { toast } from 'react-hot-toast';
import ConfirmModal from '../components/common/ConfirmModal';

const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
};

const getNotificationIcon = (type) => {
    switch (type) {
        case 'stagnation':
        case 'agenda_overdue':
            return <AlertCircle className="text-red-500" size={20} />;
        case 'deadline_warning':
            return <Clock className="text-amber-500" size={20} />;
        case 'meeting_invite':
        case 'project_created':
            return <Calendar className="text-indigo-500" size={20} />;
        case 'collaborator_added':
            return <UserPlus className="text-emerald-500" size={20} />;
        case 'agenda_updated':
            return <Info className="text-blue-500" size={20} />;
        default:
            return <Bell className="text-gray-500" size={20} />;
    }
};

const NotificationArchive = () => {
    const navigate = useNavigate();
    const { fetchArchivedNotifications, deleteNotification, clearArchivedNotifications } = useNotifications();
    const [archivedNotifications, setArchivedNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isClearModalOpen, setIsClearModalOpen] = useState(false);
    const [clearing, setClearing] = useState(false);

    useEffect(() => {
        const loadArchive = async () => {
            setLoading(true);
            const data = await fetchArchivedNotifications();
            setArchivedNotifications(data);
            setLoading(false);
        };
        loadArchive();
    }, [fetchArchivedNotifications]);

    const handleClearAll = async () => {
        setClearing(true);
        try {
            await clearArchivedNotifications();
            setArchivedNotifications([]);
            toast.success('Archive cleared successfully');
            setIsClearModalOpen(false);
        } catch (error) {
            toast.error('Failed to clear archive');
        } finally {
            setClearing(false);
        }
    };

    const handleDeleteOne = async (e, id) => {
        e.stopPropagation();
        try {
            await deleteNotification(id);
            setArchivedNotifications(prev => prev.filter(n => n.id !== id));
            toast.success('Notification deleted');
        } catch (error) {
            toast.error('Failed to delete notification');
        }
    };

    // Group notifications by date
    const groupedNotifications = archivedNotifications.reduce((groups, notification) => {
        const date = new Date(notification.created_at).toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(notification);
        return groups;
    }, {});

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 md:p-12 animate-fade-in custom-scrollbar">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:shadow-sm transition-all"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-gray-800 tracking-tight">Notification Archive</h1>
                            <p className="text-gray-500 font-medium">History of your past alerts and updates</p>
                        </div>
                    </div>

                    {archivedNotifications.length > 0 && (
                        <button
                            onClick={() => setIsClearModalOpen(true)}
                            className="px-4 py-2 bg-white border border-gray-200 text-red-500 font-bold rounded-xl hover:bg-red-50 hover:border-red-100 transition-all flex items-center gap-2 text-sm shadow-sm"
                        >
                            <Trash2 size={16} />
                            <span className="hidden sm:inline">Clear History</span>
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
                    </div>
                ) : archivedNotifications.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-[2rem] border border-gray-100 shadow-sm">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                            <Bell size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">No archived notifications</h3>
                        <p className="text-gray-400">Your notification history is clean!</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {Object.entries(groupedNotifications).map(([date, notifications]) => (
                            <div key={date} className="animate-fade-in">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 ml-2">{date}</h3>
                                <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                                    {notifications.map((n, index) => (
                                        <div
                                            key={n.id}
                                            className={`p-5 flex gap-4 hover:bg-gray-50 transition-colors cursor-pointer group relative ${index !== notifications.length - 1 ? 'border-b border-gray-50' : ''}`}
                                            onClick={() => {
                                                if (n.related_agenda) {
                                                    navigate(`/tasks/${n.related_agenda.id || n.related_agenda}`);
                                                } else if (n.related_project) {
                                                    navigate(`/projects/${n.related_project.id || n.related_project}/edit`);
                                                }
                                            }}
                                        >
                                            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0">
                                                {getNotificationIcon(n.notification_type)}
                                            </div>
                                            <div className="flex-grow">
                                                <div className="flex justify-between items-start gap-4">
                                                    <h4 className="font-bold text-gray-800">{n.title}</h4>
                                                    <span className="text-xs font-medium text-gray-400 whitespace-nowrap">
                                                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <p className="text-gray-600 text-sm mt-1 mb-1">{n.message}</p>
                                            </div>

                                            {/* Delete Button (Visible on Hover/Focus) */}
                                            <button
                                                onClick={(e) => handleDeleteOne(e, n.id)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                                                title="Delete notification"
                                            >
                                                <Trash size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <ConfirmModal
                isOpen={isClearModalOpen}
                title="Clear Archive?"
                message="This will permanently delete all archived notifications. This action cannot be undone."
                confirmText={clearing ? "Clearing..." : "Yes, Clear All"}
                confirmLabel="Clear History"
                type="danger"
                onConfirm={handleClearAll}
                onCancel={() => setIsClearModalOpen(false)}
            />

            <style>{`
                @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fade-in 0.4s ease-out; }
            `}</style>
        </div>
    );
};

export default NotificationArchive;

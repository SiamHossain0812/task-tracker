import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/common/Toast';
import ConfirmModal from '../components/common/ConfirmModal';

const PendingRequests = () => {
    const [pendingUsers, setPendingUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuth();

    // UI State
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [confirmModal, setConfirmModal] = useState({ show: false, userId: null });

    useEffect(() => {
        fetchPendingRequests();
    }, []);

    const fetchPendingRequests = async () => {
        try {
            const response = await apiClient.get('auth/pending/');
            setPendingUsers(response.data);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch requests', err);
            setError('Failed to load pending requests');
            setLoading(false);
        }
    };

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
    };

    const initiateApprove = (userId) => {
        setConfirmModal({ show: true, userId });
    };

    const handleConfirmApprove = async () => {
        const userId = confirmModal.userId;
        setConfirmModal({ show: false, userId: null });

        try {
            await apiClient.post(`auth/approve/${userId}/`);
            setPendingUsers(pendingUsers.filter(u => u.id !== userId));
            showToast('User approved successfully', 'success');
        } catch (err) {
            console.error('Failed to approve user', err);
            showToast('Failed to approve user', 'error');
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading requests...</div>;
    if (!user?.is_superuser) return <div className="p-8 text-center text-red-500 font-bold">Access Denied</div>;

    return (
        <div className="animate-fade-in h-full flex flex-col pb-8 relative">
            {toast.show && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast({ ...toast, show: false })}
                />
            )}

            <ConfirmModal
                isOpen={confirmModal.show}
                title="Approve User?"
                message="Are you sure you want to approve this user? They will be granted access to the workspace immediately."
                confirmText="Approve Access"
                onConfirm={handleConfirmApprove}
                onCancel={() => setConfirmModal({ show: false, userId: null })}
            />

            <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-800 tracking-tight mb-1">Access Requests</h2>
                <p className="text-gray-400 font-medium">Review and approve new user registrations</p>
            </div>

            {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 font-medium">{error}</div>}

            {pendingUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-400 text-2xl">
                        <i className="fas fa-check"></i>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No Pending Requests</h3>
                    <p className="text-gray-400 font-medium">All caught up! No new users waiting for approval.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {pendingUsers.map(user => (
                        <div key={user.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 text-xl font-black uppercase">
                                    {(user.first_name?.[0] || user.username[0])}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">
                                        {user.first_name} {user.last_name}
                                        {(!user.first_name && !user.last_name) && user.username}
                                    </h3>
                                    <div className="flex gap-4 text-sm text-gray-500 font-medium mt-1">
                                        <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-lg">
                                            <i className="fas fa-phone text-xs"></i>
                                            {user.username}
                                        </span>
                                        {user.email && (
                                            <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-lg">
                                                <i className="far fa-envelope text-xs"></i>
                                                {user.email}
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-lg">
                                            <i className="far fa-clock text-xs"></i>
                                            {new Date(user.date_joined).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => initiateApprove(user.id)}
                                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 transition-all flex items-center gap-2"
                            >
                                <i className="fas fa-check"></i>
                                <span>Approve</span>
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PendingRequests;

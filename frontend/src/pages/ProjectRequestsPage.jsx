import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

const ProjectRequestsPage = () => {
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const response = await apiClient.get('project-requests/');
            setRequests(response.data);
        } catch (err) {
            console.error('Failed to fetch project requests', err);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        if (!window.confirm('Are you sure you want to approve this project?')) return;
        setProcessingId(id);
        try {
            await apiClient.post(`project-requests/${id}/approve/`);
            fetchRequests();
        } catch (err) {
            console.error('Failed to approve request', err);
            alert('Failed to approve project. Check if name already exists.');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (id) => {
        const comment = window.prompt('Enter reason for rejection:');
        if (comment === null) return;

        setProcessingId(id);
        try {
            await apiClient.post(`project-requests/${id}/reject/`, { admin_comment: comment });
            fetchRequests();
        } catch (err) {
            console.error('Failed to reject request', err);
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
        </div>
    );

    return (
        <div className="h-full flex flex-col p-4 sm:p-8 animate-fade-in">
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Project Requests</h1>
                    <p className="text-gray-500 font-medium">
                        {user?.is_superuser
                            ? "Review and manage project proposals from your team members."
                            : "Submit and track your project creation requests."}
                    </p>
                </div>
                {!user?.is_superuser && (
                    <Link
                        to="/projects/new"
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-100 transition-all hover:-translate-y-0.5"
                    >
                        <i className="fas fa-plus"></i>
                        New Request
                    </Link>
                )}
            </div>

            <div className="grid gap-6">
                {requests.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i className="fas fa-inbox text-2xl text-gray-300"></i>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">All Caught Up!</h3>
                        <p className="text-gray-400">No pending project requests at the moment.</p>
                    </div>
                ) : (
                    requests.map((request) => (
                        <div key={request.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                            {/* Status Badge */}
                            <div className={`absolute top-0 right-0 px-6 py-2 rounded-bl-2xl text-[10px] font-black uppercase tracking-widest ${request.status === 'pending' ? 'bg-amber-100 text-amber-600' :
                                request.status === 'approved' ? 'bg-emerald-100 text-emerald-600' :
                                    'bg-red-100 text-red-600'
                                }`}>
                                {request.status}
                            </div>

                            <div className="flex flex-col md:flex-row gap-6">
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-inner`}
                                    style={{ backgroundColor: `${request.color || 'indigo'}15`, color: request.color || 'indigo' }}>
                                    <i className="fas fa-project-diagram text-2xl"></i>
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h2 className="text-xl font-bold text-gray-800">{request.name}</h2>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-gray-400 font-bold mb-4 uppercase tracking-wider">
                                        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-lg text-gray-600">
                                            <i className="fas fa-user"></i> {request.user_name}
                                        </span>
                                        <span>
                                            <i className="far fa-clock"></i> {new Date(request.created_at).toLocaleDateString()}
                                        </span>
                                    </div>

                                    <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100 mb-6">
                                        <p className="text-gray-600 leading-relaxed italic">
                                            "{request.description || 'No description provided'}"
                                        </p>
                                    </div>


                                    {request.status === 'pending' && user?.is_superuser && (
                                        <div className="flex gap-3">
                                            <button
                                                disabled={processingId === request.id}
                                                onClick={() => handleApprove(request.id)}
                                                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-100 flex items-center gap-2"
                                            >
                                                {processingId === request.id ? <i className="fas fa-spinner animate-spin"></i> : <i className="fas fa-check"></i>}
                                                Approve
                                            </button>
                                            <button
                                                disabled={processingId === request.id}
                                                onClick={() => handleReject(request.id)}
                                                className="px-6 py-3 bg-white hover:bg-red-50 text-red-600 border border-red-100 font-bold rounded-xl transition-all"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    )}


                                    {request.admin_comment && (
                                        <div className="mt-4 pt-4 border-t border-gray-100 text-sm">
                                            <span className="font-bold text-gray-700">Admin Comment:</span>
                                            <p className="text-gray-500 mt-1">{request.admin_comment}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ProjectRequestsPage;

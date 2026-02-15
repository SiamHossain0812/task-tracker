import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import apiClient from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import ConfirmModal from '../common/ConfirmModal';
import ExtendTaskModal from './ExtendTaskModal';

const AgendaDetailView = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [responding, setResponding] = useState(false);
    const [myAssignment, setMyAssignment] = useState(null);
    const [rejectModal, setRejectModal] = useState({ show: false, reason: '' });
    const [deleteModal, setDeleteModal] = useState(false);
    const [extendModal, setExtendModal] = useState(false);

    const fetchTaskDetails = async () => {
        try {
            const [agendaRes, collaboratorsRes] = await Promise.all([
                apiClient.get(`agendas/${id}/`),
                apiClient.get('collaborators/')
            ]);

            const agendaData = agendaRes.data;
            setTask(agendaData);

            // Find current user's assignment
            const me = collaboratorsRes.data.find(c => c.user?.id == user?.id);
            if (me) {
                const assignment = agendaData.assignments?.find(a => a.collaborator == me.id);
                setMyAssignment(assignment);
            }
        } catch (err) {
            console.error('Failed to fetch task details', err);
            setError('Failed to load task details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTaskDetails();
    }, [id]);

    const handleStatusToggle = async () => {
        setResponding(true);
        try {
            await apiClient.post(`agendas/${id}/toggle/`);
            toast.success('Status updated successfully!');
            await fetchTaskDetails();
        } catch (err) {
            console.error('Status update failed', err);
            toast.error('Failed to update status');
        } finally {
            setResponding(false);
        }
    };

    const handleAccept = async () => {
        setResponding(true);
        try {
            await apiClient.post(`agendas/${id}/accept/`);
            toast.success('Invitation accepted!');
            await fetchTaskDetails();
        } catch (err) {
            console.error('Accept failed', err);
            toast.error('Failed to accept invitation');
        } finally {
            setResponding(false);
        }
    };

    const handleRejectSubmit = async () => {
        if (!rejectModal.reason.trim()) {
            toast.error('Please provide a reason');
            return;
        }
        setResponding(true);
        try {
            await apiClient.post(`agendas/${id}/reject/`, {
                rejection_reason: rejectModal.reason
            });
            toast.success('Invitation rejected');
            navigate('/tasks');
        } catch (err) {
            console.error('Reject failed', err);
            toast.error('Failed to reject invitation');
        } finally {
            setResponding(false);
            setRejectModal({ show: false, reason: '' });
        }
    };

    const handleDelete = async () => {
        setResponding(true);
        try {
            await apiClient.delete(`agendas/${id}/`);
            toast.success('Task deleted successfully');
            navigate('/tasks');
        } catch (err) {
            console.error('Delete failed', err);
            toast.error('Failed to delete task');
        } finally {
            setResponding(false);
            setDeleteModal(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
        </div>
    );

    if (error || !task) return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-4 shadow-inner">
                <i className="fas fa-exclamation-triangle text-2xl"></i>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Oops! Something went wrong</h2>
            <p className="text-gray-500 mb-6">{error || 'Task not found'}</p>
            <button
                onClick={() => navigate('/tasks')}
                className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-all"
            >
                Back to Tasks
            </button>
        </div>
    );

    const isMeeting = task.type === 'meeting';
    const canEdit = user?.is_superuser || task.created_by === user?.id;
    const canDelete = user?.is_superuser || task.created_by === user?.id;

    // Permission check for extending time
    const isApprover = task.can_approve_extension;
    const canRequest = (myAssignment && myAssignment.status === 'accepted') && !isApprover;

    // Total permission to interact with extension system
    const canExtend = isApprover || canRequest;

    const handleExtensionAction = async (action) => {
        try {
            await apiClient.post(`agendas/${id}/extend-time/`, { action });
            toast.success(action === 'approve' ? 'Extension approved' : 'Extension rejected');
            fetchTaskDetails();
        } catch (error) {
            console.error('Extension action failed', error);
            toast.error(error.response?.data?.error || 'Action failed');
        }
    };


    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 pt-8 animate-fade-in">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* 1. Header Navigation */}
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center text-sm font-bold text-gray-400 hover:text-gray-900 transition-colors group"
                    >
                        <i className="fas fa-arrow-left mr-2 transition-transform group-hover:-translate-x-1"></i>
                        Back to Board
                    </button>

                    {/* Global Page Actions */}
                    <div className="flex items-center gap-2">
                        {canEdit && (
                            <NavLink
                                to={`/tasks/${id}/edit`}
                                className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-400 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
                                title="Edit Task"
                            >
                                <i className="fas fa-pen text-xs"></i>
                            </NavLink>
                        )}
                        {canDelete && (
                            <button
                                onClick={() => setDeleteModal(true)}
                                className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-200 transition-all shadow-sm"
                                title="Delete Task"
                            >
                                <i className="fas fa-trash text-xs"></i>
                            </button>
                        )}
                    </div>
                </div>

                {/* 2. Extension Banner (Conditional) */}
                {task.extension_status === 'pending' && (
                    <div className="mb-8 rounded-2xl bg-white border border-indigo-100 shadow-lg shadow-indigo-50/50 relative overflow-hidden animate-fade-in">
                        {/* Decorative Background */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

                        <div className="p-6 relative z-10">
                            <div className="flex flex-col md:flex-row gap-6 justify-between items-start">

                                {/* Left: Requester & Details */}
                                <div className="flex-1 w-full">
                                    {/* Header: Who requested */}
                                    <div className="flex items-center gap-3 mb-4">
                                        {task.extension_requested_by ? (
                                            <>
                                                {task.extension_requested_by.image_url ? (
                                                    <img src={task.extension_requested_by.image_url} alt={task.extension_requested_by.name} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold border-2 border-white shadow-sm">
                                                        {task.extension_requested_by.name?.charAt(0) || '?'}
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">
                                                        {task.extension_requested_by.name}
                                                    </p>
                                                    <p className="text-xs text-indigo-600 font-medium">Requested an extension</p>
                                                </div>
                                            </>
                                        ) : (
                                            // Fallback if no requester recorded (old data)
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-lg">
                                                    <i className="fas fa-user"></i>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">Unknown User</p>
                                                    <p className="text-xs text-gray-500">Extension Request</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Proposal Details Card */}
                                    <div className="bg-indigo-50/30 rounded-xl p-4 border border-indigo-100/50 space-y-3">
                                        {/* New Date */}
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs">
                                                <i className="fas fa-calendar-alt"></i>
                                            </div>
                                            <span className="text-sm text-gray-600 font-medium">Proposed Deadline:</span>
                                            <span className="text-sm font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                                {task.requested_finish_date}
                                                {task.requested_finish_time && ` at ${task.requested_finish_time}`}
                                            </span>
                                        </div>

                                        {/* Reason */}
                                        {task.extension_reason && (
                                            <div className="flex items-start gap-2">
                                                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs mt-0.5 shrink-0">
                                                    <i className="fas fa-quote-left"></i>
                                                </div>
                                                <p className="text-sm text-gray-600 italic">"{task.extension_reason}"</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Right: Actions */}
                                {isApprover ? (
                                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto mt-2 md:mt-0">
                                        <button
                                            onClick={() => handleExtensionAction('approve')}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-indigo-200 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                                        >
                                            <i className="fas fa-check"></i> Approve
                                        </button>
                                        <button
                                            onClick={() => handleExtensionAction('reject')}
                                            className="bg-white border-2 border-gray-100 text-gray-500 hover:border-red-100 hover:text-red-600 hover:bg-red-50 px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                                        >
                                            <i className="fas fa-times"></i> Reject
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg border border-yellow-100 text-sm font-bold shrink-0">
                                        <i className="fas fa-clock fa-spin"></i> Pending Review
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. Unified Dashboard Panel */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col lg:flex-row min-h-[500px]">

                    {/* Left Panel: Content (2/3) */}
                    <div className="flex-1 p-8 lg:p-10 border-b lg:border-b-0 lg:border-r border-gray-100">
                        {/* Task Header info */}
                        <div className="mb-8">
                            <div className="flex flex-wrap items-center gap-2 mb-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${task.priority === 'high' ? 'bg-red-50 text-red-700 border-red-100' :
                                    task.priority === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                        'bg-emerald-50 text-emerald-700 border-emerald-100'
                                    }`}>
                                    {task.priority} Priority
                                </span>
                                {task.category && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded bg-gray-50 text-gray-500 border border-gray-100 text-[10px] font-bold uppercase tracking-wider">
                                        {task.category}
                                    </span>
                                )}
                            </div>

                            <h1 className="text-3xl font-bold text-gray-900 leading-tight mb-4">
                                {task.title}
                            </h1>

                            <div className="flex items-center gap-6 text-xs font-medium text-gray-400">
                                <div className="flex items-center gap-2">
                                    <i className="far fa-calendar"></i>
                                    <span>Created {new Date(task.created_at).toLocaleDateString()}</span>
                                </div>
                                {task.project && (
                                    <NavLink to={`/projects/${task.project.id}`} className="flex items-center gap-2 hover:text-indigo-600 transition-colors">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: task.project.color || '#ccc' }}></div>
                                        <span>{task.project.name}</span>
                                    </NavLink>
                                )}
                            </div>
                        </div>

                        {/* Description Body */}
                        <div className="prose prose-sm max-w-none text-gray-600 mb-10 leading-relaxed">
                            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-3 border-b border-gray-50 pb-2 w-fit">Description</h3>
                            {task.description ? (
                                <p className="whitespace-pre-wrap">{task.description}</p>
                            ) : (
                                <p className="italic text-gray-400">No detailed description provided for this entry.</p>
                            )}
                        </div>

                        {/* Attachments / Links Grid */}
                        {(task.attachment_url || (isMeeting && task.meeting_link)) && (
                            <div className="mt-auto pt-8 border-t border-gray-50">
                                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-4">Resources & Links</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {isMeeting && task.meeting_link && (
                                        <a href={task.meeting_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-emerald-400 hover:bg-emerald-50/30 transition-all group">
                                            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                                <i className="fas fa-video"></i>
                                            </div>
                                            <div className="overflow-hidden">
                                                <div className="font-bold text-gray-900 text-sm truncate">Join Meeting</div>
                                                <div className="text-xs text-gray-500">Google Meet</div>
                                            </div>
                                        </a>
                                    )}
                                    {task.attachment_url && (
                                        <a href={task.attachment_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all group">
                                            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                                <i className="fas fa-paperclip"></i>
                                            </div>
                                            <div className="overflow-hidden">
                                                <div className="font-bold text-gray-900 text-sm truncate">View Attachment</div>
                                                <div className="text-xs text-gray-500">Document</div>
                                            </div>
                                        </a>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Panel: Sidebar (1/3) */}
                    <div className="lg:w-[360px] bg-gray-50/50 p-8 flex flex-col gap-8">

                        {/* A. Status & Info Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Current Status</h4>
                            <div className={`flex items-center gap-3 p-3 rounded-lg border mb-4 ${task.status === 'completed' ? 'bg-emerald-50 border-emerald-100' :
                                task.is_overdue ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'
                                }`}>
                                <div className={`w-3 h-3 rounded-full ${task.status === 'completed' ? 'bg-emerald-500 animate-pulse' :
                                    task.is_overdue ? 'bg-red-500' : 'bg-indigo-500'
                                    }`}></div>
                                <span className={`text-sm font-bold ${task.status === 'completed' ? 'text-emerald-700' :
                                    task.is_overdue ? 'text-red-700' : 'text-gray-700'
                                    }`}>
                                    {task.status === 'completed' ? 'Completed' :
                                        task.is_overdue ? 'Overdue' :
                                            (task.status_display || task.status.replace('-', ' '))}
                                </span>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-gray-50">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-medium text-gray-500">Start Date</span>
                                    <span className="text-sm font-bold text-gray-900">{task.date}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-medium text-gray-500">Due Date</span>
                                    <span className={`text-sm font-bold ${task.is_overdue ? 'text-red-600' : 'text-gray-900'}`}>{task.expected_finish_date}</span>
                                </div>
                                {task.expected_finish_time && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-medium text-gray-500">Time</span>
                                        <span className="text-sm font-bold text-gray-700">{task.expected_finish_time}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* B. Action Buttons */}
                        <div>
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">Actions</h4>
                            <div className="space-y-3">
                                {myAssignment?.status === 'pending' ? (
                                    <>
                                        <button
                                            onClick={handleAccept}
                                            disabled={responding}
                                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md shadow-indigo-200 transition-all hover:scale-[1.02]"
                                        >
                                            {responding ? 'Processing...' : 'Accept Assignment'}
                                        </button>
                                        <button
                                            onClick={() => setRejectModal({ show: true, reason: '' })}
                                            disabled={responding}
                                            className="w-full py-3 bg-white border border-gray-200 hover:border-red-200 text-gray-600 hover:text-red-600 rounded-xl font-bold text-sm transition-all"
                                        >
                                            Decline
                                        </button>
                                    </>
                                ) : myAssignment?.status === 'accepted' ? (
                                    <>
                                        {task.status !== 'completed' ? (
                                            <button
                                                onClick={handleStatusToggle}
                                                disabled={responding}
                                                className={`w-full py-3.5 rounded-xl font-bold text-sm shadow-lg transition-all hover:scale-[1.02] flex items-center justify-center gap-2 ${task.status === 'in-progress'
                                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
                                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
                                                    }`}
                                            >
                                                {responding ? <i className="fas fa-spinner fa-spin"></i> : (
                                                    <>
                                                        <i className={`fas ${task.status === 'in-progress' ? 'fa-check' : 'fa-play'}`}></i>
                                                        {task.status === 'in-progress' ? 'Mark Completed' : 'Start Task'}
                                                    </>
                                                )}
                                            </button>
                                        ) : (
                                            <button
                                                onClick={handleStatusToggle}
                                                className="w-full py-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl font-bold text-sm hover:bg-emerald-100 transition-all"
                                            >
                                                Re-open Task
                                            </button>
                                        )}

                                        {canExtend && task.extension_status === 'none' && task.is_overdue && task.extension_count < 1 && (
                                            <button
                                                onClick={() => setExtendModal(true)}
                                                className="w-full py-3 bg-white border border-amber-200 text-amber-700 hover:bg-amber-50 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm mt-3"
                                            >
                                                <i className={`fas ${isApprover ? 'fa-clock' : 'fa-hand-paper'}`}></i>
                                                {isApprover ? 'Extend Time' : 'Request Extension'}
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <div className="p-4 bg-gray-100 rounded-xl text-center text-xs font-bold text-gray-400">
                                        Read-only View
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* C. Team */}
                        <div>
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">Collaborators</h4>
                            <div className="flex flex-col gap-3">
                                {task.team_leader && (
                                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white transition-colors">
                                        <div className="relative">
                                            <img
                                                src={task.team_leader.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(task.team_leader.name)}&background=104a37&color=fff`}
                                                alt={task.team_leader.name}
                                                className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-sm"
                                            />
                                            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5" title="Team Leader">
                                                <i className="fas fa-crown text-[10px] text-amber-500"></i>
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-bold text-gray-900 truncate">{task.team_leader.name}</div>
                                            <div className="text-[10px] text-gray-500">Leader</div>
                                        </div>
                                    </div>
                                )}

                                {task.assignments?.filter(a => a.collaborator !== task.team_leader?.id).map((assignment, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white transition-colors">
                                        <img
                                            src={assignment.collaborator_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(assignment.collaborator_name)}&background=f3f4f6&color=4b5563`}
                                            alt={assignment.collaborator_name}
                                            className={`w-9 h-9 rounded-full object-cover border-2 border-white shadow-sm ${assignment.status === 'rejected' ? 'grayscale opacity-50' : ''}`}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-bold text-gray-900 truncate">{assignment.collaborator_name}</div>
                                            <div className={`text-[10px] font-bold uppercase tracking-wider ${assignment.status === 'accepted' ? 'text-emerald-600' :
                                                assignment.status === 'rejected' ? 'text-red-500' : 'text-amber-500'
                                                }`}>
                                                {assignment.status}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>

                {/* Modals placed here */}
                <ConfirmModal
                    isOpen={rejectModal.show}
                    onClose={() => setRejectModal({ show: false, reason: '' })}
                    onConfirm={handleRejectSubmit}
                    title="Reject Assignment"
                    message="Are you sure you want to decline this task? Please let the leader know why."
                    type="danger"
                    confirmLabel="Reject"
                >
                    <div className="mt-4">
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Decline Reason *</label>
                        <textarea
                            value={rejectModal.reason}
                            onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-red-100 focus:border-red-500 outline-none transition-all text-sm min-h-[100px] font-medium resize-none placeholder-gray-400"
                            placeholder="e.g. Current workload is high..."
                        />
                    </div>
                </ConfirmModal>

                <ConfirmModal
                    isOpen={deleteModal}
                    onClose={() => setDeleteModal(false)}
                    onConfirm={handleDelete}
                    title="Delete Task"
                    message="Are you sure you want to permanently delete this task? This action cannot be undone."
                    type="danger"
                    confirmLabel="Delete Permanently"
                />

                <ExtendTaskModal
                    task={task}
                    isOpen={extendModal}
                    onClose={() => setExtendModal(false)}
                    onUpdate={fetchTaskDetails}
                    isApprover={isApprover}
                />
            </div>

            <style>{`
                @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fade-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
            `}</style>
        </div>
    );
};

export default AgendaDetailView;

import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

const TasksPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [data, setData] = useState({
        all_undone: [],
        completed_today: [],
        pending_invitations: [],
        pending_count: 0,
        in_progress_count: 0,
        high_priority_count: 0,
        completed_today_count: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [modal, setModal] = useState({ show: false, task: null, nextStatus: '', statusLabel: '' });
    const [deleteModal, setDeleteModal] = useState({ show: false, task: null });
    const [rejectModal, setRejectModal] = useState({ show: false, task: null, reason: '' });
    const [toggling, setToggling] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [responding, setResponding] = useState(false);

    const fetchTasks = async () => {
        try {
            const response = await apiClient.get('tasks/overview/');
            setData(response.data);
        } catch (err) {
            console.error('Failed to fetch tasks', err);
            setError('Failed to load tasks overview');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const handleAccept = async (taskId) => {
        setResponding(true);
        try {
            await apiClient.post(`agendas/${taskId}/accept/`);
            await fetchTasks();
        } catch (err) {
            console.error('Accept failed', err);
            alert('Failed to accept invitation');
        } finally {
            setResponding(false);
        }
    };

    const handleRejectClick = (task) => {
        setRejectModal({ show: true, task, reason: '' });
    };

    const confirmReject = async () => {
        if (!rejectModal.task || !rejectModal.reason.trim()) {
            alert('Please provide a reason for rejection');
            return;
        }
        setResponding(true);
        try {
            await apiClient.post(`agendas/${rejectModal.task.id}/reject/`, {
                rejection_reason: rejectModal.reason
            });
            await fetchTasks();
            setRejectModal({ show: false, task: null, reason: '' });
        } catch (err) {
            console.error('Reject failed', err);
            alert('Failed to reject invitation');
        } finally {
            setResponding(false);
        }
    };

    const handleToggleClick = (task) => {
        const nextStatus = task.status === 'pending' ? 'in-progress' : (task.status === 'in-progress' ? 'completed' : 'pending');
        const statusLabel = nextStatus === 'in-progress' ? 'In Progress' : (nextStatus === 'completed' ? 'Completed' : 'Pending');
        setModal({ show: true, task, nextStatus, statusLabel });
    };

    const confirmToggle = async () => {
        if (!modal.task) return;
        setToggling(true);
        try {
            await apiClient.post(`agendas/${modal.task.id}/toggle/`);
            await fetchTasks();
            setModal({ show: false, task: null, nextStatus: '', statusLabel: '' });
        } catch (err) {
            console.error('Toggle failed', err);
            alert('Failed to update status');
        } finally {
            setToggling(false);
        }
    };

    const handleDeleteClick = (task) => {
        setDeleteModal({ show: true, task });
    };

    const confirmDelete = async () => {
        if (!deleteModal.task) return;
        setDeleting(true);
        try {
            await apiClient.delete(`agendas/${deleteModal.task.id}/`);
            await fetchTasks();
            setDeleteModal({ show: false, task: null });
        } catch (err) {
            console.error('Delete failed', err);
            alert('Failed to delete task');
        } finally {
            setDeleting(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
        </div>
    );

    return (
        <div className="animate-fade-in pb-20 md:pb-8 w-full">
            {/* Page Header */}
            <div className="mb-8 flex flex-col sm:flex-row items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800 tracking-tight mb-1">Tasks Overview</h2>
                    <p className="text-gray-400 font-medium">Manage your progress and research agendas</p>
                </div>
                <NavLink
                    to="/tasks/new"
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-200 transition-all flex items-center gap-2"
                >
                    <i className="fas fa-plus"></i>
                    <span>New Task</span>
                </NavLink>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="text-gray-400 text-xs font-bold uppercase mb-2">Pending</div>
                    <div className="flex items-end justify-between">
                        <span className="text-4xl font-bold text-gray-800">{data.pending_count}</span>
                        <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
                            <i className="far fa-clock"></i>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="text-gray-400 text-xs font-bold uppercase mb-2">In Progress</div>
                    <div className="flex items-end justify-between">
                        <span className="text-4xl font-bold text-indigo-600">{data.in_progress_count}</span>
                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500">
                            <i className="fas fa-spinner animate-spin-slow"></i>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="text-gray-400 text-xs font-bold uppercase mb-2">High Priority</div>
                    <div className="flex items-end justify-between">
                        <span className="text-4xl font-bold text-red-600">{data.high_priority_count}</span>
                        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                            <i className="fas fa-exclamation-circle"></i>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-md">
                    <div className="text-emerald-600 text-xs font-bold uppercase mb-2">Completed Today</div>
                    <div className="flex items-end justify-between">
                        <span className="text-4xl font-bold text-emerald-600">{data.completed_today_count}</span>
                        <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
                            <i className="fas fa-check-double"></i>
                        </div>
                    </div>
                </div>
            </div>

            {/* Task Invitations */}
            {data.pending_invitations && data.pending_invitations.length > 0 && (
                <div className="mb-8 animate-fade-in-up">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                            <i className="fas fa-envelope-open-text"></i>
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">New Task Invitations <span className="text-indigo-400 text-sm font-medium ml-2">({data.pending_invitations.length})</span></h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {data.pending_invitations.map(invitation => (
                            <div
                                key={invitation.id}
                                onClick={() => navigate(`/tasks/${invitation.id}`)}
                                className="bg-white p-5 rounded-3xl border border-indigo-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">Invitation</span>
                                        <h4 className="font-bold text-gray-800">{invitation.title}</h4>
                                    </div>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${invitation.priority === 'high' ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                        <i className={`fas ${invitation.type === 'meeting' ? 'fa-video' : 'fa-clipboard-list'} text-sm`}></i>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                                    <i className="far fa-calendar-alt"></i>
                                    <span>{invitation.date} {invitation.time}</span>
                                    <span className="mx-1">•</span>
                                    <span>By {invitation.team_leader_name || 'Admin'}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleAccept(invitation.id); }}
                                        disabled={responding}
                                        className="flex-[1.5] py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md shadow-emerald-100 disabled:opacity-50"
                                    >
                                        {responding ? <i className="fas fa-spinner fa-spin"></i> : 'Accept'}
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); navigate(`/tasks/${invitation.id}`); }}
                                        className="flex-1 py-2 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
                                    >
                                        Details
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleRejectClick(invitation); }}
                                        disabled={responding}
                                        className="flex-1 py-2 bg-white border border-gray-100 hover:bg-gray-50 text-gray-400 hover:text-red-500 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all disabled:opacity-50"
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Content Area */}
            <div className="space-y-8">
                {/* Undone Tasks Section */}
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
                            <i className="fas fa-tasks"></i>
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">Undone Tasks <span className="text-gray-400 text-sm font-medium ml-2">({data.all_undone.length})</span></h3>
                    </div>

                    {data.all_undone.length > 0 ? (
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-bold uppercase tracking-wider text-gray-400">
                                            <th className="px-6 py-4 w-12"></th>
                                            <th className="px-6 py-4">Task Name</th>
                                            <th className="px-6 py-4">Project</th>
                                            <th className="px-6 py-4">Due Date</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4 w-12 text-right pr-8">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {data.all_undone.map(task => (
                                            <tr key={task.id} className="group hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className={`w-2 h-2 rounded-full ${task.priority === 'high' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : task.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <NavLink to={`/tasks/${task.id}`} className="flex flex-col hover:text-emerald-600 transition-colors">
                                                        <span className="text-sm font-bold text-gray-800">{task.title}</span>
                                                        {task.description && <span className="text-[10px] text-gray-400 truncate max-w-xs">{task.description}</span>}
                                                    </NavLink>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {task.project_info ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700">
                                                            {task.project_info.name}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">Inbox</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-bold text-gray-700">{task.date}</td>
                                                <td className="px-6 py-4">
                                                    <button
                                                        onClick={() => handleToggleClick(task)}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all w-28 ${task.status === 'in-progress' ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                                                    >
                                                        {task.status_display || (task.status === 'in-progress' ? 'In Progress' : task.status)}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4 text-right pr-8">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <NavLink to={`/tasks/${task.id}`} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-emerald-600 hover:bg-emerald-50">
                                                            <i className="fas fa-eye text-xs"></i>
                                                        </NavLink>
                                                        {(user?.is_superuser || task.created_by === user?.id) && (
                                                            <button
                                                                onClick={() => handleDeleteClick(task)}
                                                                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50"
                                                            >
                                                                <i className="fas fa-trash text-xs"></i>
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-8 text-center animate-pulse-subtle">
                            <p className="text-gray-400 font-medium">No undone tasks.</p>
                        </div>
                    )}
                </div>

                {/* Completed Today Section */}
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                            <i className="fas fa-check-circle"></i>
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">Completed Today <span className="text-emerald-400 text-sm font-medium ml-2">({data.completed_today.length})</span></h3>
                    </div>

                    {data.completed_today.length > 0 ? (
                        <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm overflow-hidden opacity-90">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-emerald-50/30 border-b border-emerald-50 text-xs font-bold uppercase tracking-wider text-emerald-700">
                                            <th className="px-6 py-4 w-12"></th>
                                            <th className="px-6 py-4">Task Name</th>
                                            <th className="px-6 py-4">Project</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4 w-12 text-right pr-8">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-emerald-50/50">
                                        {data.completed_today.map(task => (
                                            <tr key={task.id} className="group hover:bg-emerald-50/20 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <NavLink to={`/tasks/${task.id}`} className="text-sm font-bold text-gray-500 line-through decoration-emerald-200 hover:text-emerald-600 transition-colors">
                                                        {task.title}
                                                    </NavLink>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {task.project_info ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-gray-50 text-gray-400">
                                                            {task.project_info.name}
                                                        </span>
                                                    ) : null}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button
                                                        onClick={() => handleToggleClick(task)}
                                                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 w-28 hover:bg-emerald-100 transition-all"
                                                    >
                                                        Completed
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4 text-right pr-8">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <NavLink to={`/tasks/${task.id}`} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 hover:text-emerald-600 hover:bg-emerald-50 transition-all">
                                                            <i className="fas fa-eye text-xs"></i>
                                                        </NavLink>
                                                        {(user?.is_superuser || task.created_by === user?.id) && (
                                                            <button
                                                                onClick={() => handleDeleteClick(task)}
                                                                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50"
                                                            >
                                                                <i className="fas fa-trash text-xs"></i>
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gray-50 rounded-3xl border border-dashed border-gray-200 p-8 text-center">
                            <p className="text-gray-400 text-sm italic">Finish your first task today!</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Confirmation Modal */}
            {modal.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm animate-fade-in" onClick={() => !toggling && setModal({ ...modal, show: false })}></div>
                    <div className="relative transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all sm:max-w-sm w-full animate-fade-in-up z-10">
                        <div className="p-6">
                            <div className="flex items-start gap-4">
                                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                    <i className="fas fa-exchange-alt"></i>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Update Status</h3>
                                    <div className="mt-2 text-sm text-gray-500">
                                        Change status to <span className="font-bold text-gray-800">{modal.statusLabel}</span>?
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6 flex flex-row-reverse gap-3">
                                <button
                                    onClick={confirmToggle}
                                    disabled={toggling}
                                    className="flex-1 bg-emerald-600 text-white rounded-xl py-2 text-sm font-semibold hover:bg-emerald-500 transition-all shadow-md shadow-emerald-100 disabled:opacity-50"
                                >
                                    {toggling ? <i className="fas fa-spinner fa-spin"></i> : 'Yes, Update'}
                                </button>
                                <button
                                    onClick={() => setModal({ ...modal, show: false })}
                                    disabled={toggling}
                                    className="flex-1 bg-white border border-gray-100 text-gray-900 rounded-xl py-2 text-sm font-semibold hover:bg-gray-50 transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Deletion Modal */}
            {deleteModal.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm animate-fade-in" onClick={() => !deleting && setDeleteModal({ show: false, task: null })}></div>
                    <div className="relative transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all sm:max-w-sm w-full animate-fade-in-up z-10">
                        <div className="p-6">
                            <div className="flex items-start gap-4">
                                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                                    <i className="fas fa-trash-alt"></i>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Delete Task</h3>
                                    <div className="mt-2 text-sm text-gray-500">
                                        Are you sure you want to delete <span className="font-bold text-gray-800">{deleteModal.task?.title}</span>? This action cannot be undone.
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6 flex flex-row-reverse gap-3">
                                <button
                                    onClick={confirmDelete}
                                    disabled={deleting}
                                    className="flex-1 bg-red-600 text-white rounded-xl py-2 text-sm font-semibold hover:bg-red-500 transition-all shadow-md shadow-red-100 disabled:opacity-50"
                                >
                                    {deleting ? <i className="fas fa-spinner fa-spin"></i> : 'Yes, Delete'}
                                </button>
                                <button
                                    onClick={() => setDeleteModal({ show: false, task: null })}
                                    disabled={deleting}
                                    className="flex-1 bg-white border border-gray-100 text-gray-900 rounded-xl py-2 text-sm font-semibold hover:bg-gray-50 transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Rejection Modal */}
            {rejectModal.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm animate-fade-in" onClick={() => !responding && setRejectModal({ ...rejectModal, show: false })}></div>
                    <div className="relative transform overflow-hidden rounded-3xl bg-white shadow-xl transition-all sm:max-w-md w-full animate-fade-in-up z-10">
                        <div className="p-8">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="h-12 w-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-500 text-xl">
                                    <i className="fas fa-times-circle"></i>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">Reject Invitation</h3>
                                    <p className="text-gray-500 text-sm">Please provide a reason for rejecting</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Task</label>
                                    <div className="p-3 bg-gray-50 rounded-xl text-sm font-bold text-gray-700 border border-gray-100 italic">
                                        "{rejectModal.task?.title}"
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Reason for Rejection <span className="text-red-500">*</span></label>
                                    <textarea
                                        value={rejectModal.reason}
                                        onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm min-h-[120px]"
                                        placeholder="Explain why you cannot join this task..."
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="mt-8 flex gap-3">
                                <button
                                    onClick={() => setRejectModal({ ...rejectModal, show: false })}
                                    disabled={responding}
                                    className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl text-sm font-bold transition-all disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmReject}
                                    disabled={responding || !rejectModal.reason.trim()}
                                    className="flex-[2] px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-sm font-bold transition-all shadow-lg shadow-red-100 disabled:opacity-50 disabled:shadow-none"
                                >
                                    {responding ? <i className="fas fa-spinner fa-spin mr-2"></i> : null}
                                    Confirm Rejection
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                @keyframes fade-in-up { 
                    from { opacity: 0; transform: translateY(10px); } 
                    to { opacity: 1; transform: translateY(0); } 
                }
                .animate-fade-in { animation: fade-in 0.3s ease-out; }
                .animate-fade-in-up { animation: fade-in-up 0.3s ease-out; }
                .animate-pulse-subtle { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.8; } }
            `}</style>
        </div>
    );
};

export default TasksPage;

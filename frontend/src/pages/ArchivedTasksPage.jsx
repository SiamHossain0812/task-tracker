import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

const ArchivedTasksPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [restoreModal, setRestoreModal] = useState({ show: false, task: null });
    const [deleteModal, setDeleteModal] = useState({ show: false, task: null });
    const [actionLoading, setActionLoading] = useState(false);

    const fetchArchivedTasks = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('agendas/?archived=true');
            setTasks(response.data);
        } catch (err) {
            console.error('Failed to fetch archived tasks', err);
            setError('Failed to load archived tasks');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchArchivedTasks();
    }, []);

    const handleRestoreClick = (task) => {
        setRestoreModal({ show: true, task });
    };

    const confirmRestore = async () => {
        if (!restoreModal.task) return;
        setActionLoading(true);
        try {
            await apiClient.post(`agendas/${restoreModal.task.id}/unarchive/`);
            await fetchArchivedTasks();
            setRestoreModal({ show: false, task: null });
        } catch (err) {
            console.error('Restore failed', err);
            alert('Failed to restore task');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteClick = (task) => {
        setDeleteModal({ show: true, task });
    };

    const confirmDelete = async () => {
        if (!deleteModal.task) return;
        setActionLoading(true);
        try {
            await apiClient.delete(`agendas/${deleteModal.task.id}/`);
            await fetchArchivedTasks();
            setDeleteModal({ show: false, task: null });
        } catch (err) {
            console.error('Delete failed', err);
            alert('Failed to delete task');
        } finally {
            setActionLoading(false);
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
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 tracking-tight mb-1">Archived Tasks</h1>
                    <p className="text-sm sm:text-base text-gray-400 font-medium">View and manage archived research agendas</p>
                </div>
                <NavLink
                    to="/tasks"
                    className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold rounded-xl transition-all flex items-center gap-2"
                >
                    <i className="fas fa-arrow-left"></i>
                    <span>Back to Tasks</span>
                </NavLink>
            </div>

            {/* List */}
            {tasks.length > 0 ? (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-bold uppercase tracking-wider text-gray-400">
                                    <th className="px-6 py-4 w-12"></th>
                                    <th className="px-6 py-4">Task Name</th>
                                    <th className="px-6 py-4">Project</th>
                                    <th className="px-6 py-4">Archived Date</th>
                                    <th className="px-6 py-4">Last Status</th>
                                    <th className="px-6 py-4 w-12 text-right pr-8">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {tasks.map(task => (
                                    <tr key={task.id} className="group hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                                                <i className="fas fa-archive text-sm"></i>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-700">{task.title}</span>
                                                {task.description && <span className="text-[10px] text-gray-400 truncate max-w-xs">{task.description}</span>}
                                            </div>
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
                                        <td className="px-6 py-4 text-sm font-medium text-gray-500">
                                            {new Date(task.updated_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-gray-100 text-gray-500 border border-gray-200">
                                                {task.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right pr-8">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => handleRestoreClick(task)}
                                                    className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all tooltip"
                                                    title="Restore Task"
                                                >
                                                    <i className="fas fa-undo text-sm"></i>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(task)}
                                                    className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all tooltip"
                                                    title="Permanently Delete"
                                                >
                                                    <i className="fas fa-trash text-sm"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-20 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mx-auto mb-4">
                        <i className="fas fa-archive text-2xl"></i>
                    </div>
                    <p className="text-gray-400 font-medium">No archived tasks found.</p>
                </div>
            )}

            {/* Restore Modal */}
            {restoreModal.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm animate-fade-in" onClick={() => !actionLoading && setRestoreModal({ show: false, task: null })}></div>
                    <div className="relative transform overflow-hidden rounded-3xl bg-white shadow-xl transition-all sm:max-w-sm w-full animate-fade-in-up z-10 p-8">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 text-2xl mx-auto mb-4">
                                <i className="fas fa-undo"></i>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Restore Task?</h3>
                            <p className="text-gray-500 text-sm mt-2">
                                This will move <span className="font-bold text-gray-800">{restoreModal.task?.title}</span> back to the active tasks list.
                            </p>
                        </div>
                        <div className="mt-8 flex gap-3">
                            <button
                                onClick={() => setRestoreModal({ show: false, task: null })}
                                disabled={actionLoading}
                                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl text-sm font-bold transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmRestore}
                                disabled={actionLoading}
                                className="flex-[2] px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-sm font-bold transition-all shadow-lg shadow-emerald-100"
                            >
                                {actionLoading ? <i className="fas fa-spinner fa-spin mr-2"></i> : null}
                                Restore Task
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {deleteModal.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm animate-fade-in" onClick={() => !actionLoading && setDeleteModal({ show: false, task: null })}></div>
                    <div className="relative transform overflow-hidden rounded-3xl bg-white shadow-xl transition-all sm:max-w-sm w-full animate-fade-in-up z-10 p-8">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 text-2xl mx-auto mb-4">
                                <i className="fas fa-trash-alt"></i>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Permanently Delete?</h3>
                            <p className="text-gray-500 text-sm mt-2">
                                This action <span className="text-red-600 font-bold uppercase tracking-widest text-[10px]">Cannot be undone</span>.
                            </p>
                        </div>
                        <div className="mt-8 flex gap-3">
                            <button
                                onClick={() => setDeleteModal({ show: false, task: null })}
                                disabled={actionLoading}
                                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl text-sm font-bold transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={actionLoading}
                                className="flex-[2] px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-sm font-bold transition-all shadow-lg shadow-red-100"
                            >
                                {actionLoading ? <i className="fas fa-spinner fa-spin mr-2"></i> : null}
                                Delete Forever
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                @keyframes fade-in-up { 
                    from { opacity: 0; transform: translateY(10px); } 
                    to { opacity: 1; transform: translateY(0); } 
                }
                .animate-fade-in { animation: fade-in 0.3s ease-out; }
                .animate-fade-in-up { animation: fade-in-up 0.3s ease-out; }
            `}</style>
        </div>
    );
};

export default ArchivedTasksPage;

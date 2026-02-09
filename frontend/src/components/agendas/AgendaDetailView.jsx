import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import apiClient from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import ConfirmModal from '../common/ConfirmModal';

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

    const fetchTaskDetails = async () => {
        try {
            const [agendaRes, collaboratorsRes] = await Promise.all([
                apiClient.get(`agendas/${id}/`),
                apiClient.get('collaborators/')
            ]);

            const agendaData = agendaRes.data;
            setTask(agendaData);

            // Find current user's assignment
            const me = collaboratorsRes.data.find(c => c.user?.id === user?.id);
            if (me) {
                const assignment = agendaData.assignments?.find(a => a.collaborator === me.id);
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

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in pb-24">
            {/* Header / Navigation */}
            <div className="flex items-center justify-between mb-8">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-400 hover:text-emerald-600 font-bold transition-all group"
                >
                    <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-center group-hover:border-emerald-100 group-hover:shadow-emerald-50">
                        <i className="fas fa-arrow-left text-sm transition-transform group-hover:-translate-x-1"></i>
                    </div>
                    <span>Go Back</span>
                </button>

                <div className="flex items-center gap-3">
                    {canEdit && (
                        <NavLink
                            to={`/tasks/${id}/edit`}
                            className="px-5 py-2.5 bg-white border border-gray-100 shadow-sm hover:border-emerald-200 text-gray-600 hover:text-emerald-600 rounded-xl font-bold transition-all flex items-center gap-2"
                        >
                            <i className="fas fa-pen-nib text-sm"></i>
                            <span>Edit Context</span>
                        </NavLink>
                    )}
                    {canDelete && (
                        <button
                            onClick={() => setDeleteModal(true)}
                            className="w-10 h-10 bg-white border border-gray-100 shadow-sm hover:border-red-200 text-gray-400 hover:text-red-500 rounded-xl transition-all flex items-center justify-center"
                            title="Delete Task"
                        >
                            <i className="fas fa-trash-alt text-sm"></i>
                        </button>
                    )}
                    <div className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-sm ${task.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                        task.status === 'in-progress' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                            'bg-amber-50 text-amber-600 border border-amber-100'
                        }`}>
                        {task.status_display || task.status}
                    </div>
                </div>
            </div>

            {/* Main Content Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-8">
                    {/* Title & Description Workspace */}
                    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/50 p-8 sm:p-12 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-50 to-indigo-50 rounded-full -mr-32 -mt-32 opacity-50 group-hover:scale-110 transition-transform duration-700"></div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className={`w-3 h-12 rounded-full ${task.priority === 'high' ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]' :
                                    task.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                                    }`}></div>
                                <div>
                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">
                                        {task.category} • {isMeeting ? 'Meeting Session' : 'Task Flow'}
                                    </div>
                                    <h1 className="text-3xl sm:text-4xl font-black text-gray-800 tracking-tight leading-tight">
                                        {task.title}
                                    </h1>
                                </div>
                            </div>

                            <div className="prose prose-emerald max-w-none">
                                <p className="text-gray-500 text-lg leading-relaxed font-medium whitespace-pre-wrap">
                                    {task.description || 'No detailed description provided for this entry.'}
                                </p>
                            </div>

                            {/* Meeting Link Integration */}
                            {isMeeting && task.meeting_link && (
                                <div className="mt-10 p-6 bg-gradient-to-br from-[#104a37] to-[#063f2e] rounded-[2rem] text-white shadow-xl shadow-emerald-100 flex flex-col sm:flex-row items-center justify-between gap-6 overflow-hidden relative">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
                                    <div className="flex items-center gap-5 relative z-10">
                                        <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-3xl">
                                            <i className="fas fa-video"></i>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-emerald-50">Join Virtual Meeting</h4>
                                            <p className="text-xs text-emerald-200/80 font-medium">Click to connect via Google Meet</p>
                                        </div>
                                    </div>
                                    <a
                                        href={task.meeting_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full sm:w-auto px-8 py-3 bg-white text-emerald-800 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-50 transition-all shadow-lg text-center relative z-10"
                                    >
                                        Enter Meeting
                                    </a>
                                </div>
                            )}

                            {/* Attachments Section */}
                            {task.attachment_url && (
                                <div className="mt-8 pt-8 border-t border-gray-100">
                                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Attached Resources</h4>
                                    <a
                                        href={task.attachment_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-3 p-4 bg-gray-50 hover:bg-emerald-50 border border-gray-100 hover:border-emerald-200 rounded-2xl transition-all group"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-emerald-600 shadow-sm">
                                            <i className="fas fa-file-pdf"></i>
                                        </div>
                                        <div className="text-left">
                                            <div className="text-sm font-bold text-gray-800">Review Document</div>
                                            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Click to browse attachment</div>
                                        </div>
                                        <i className="fas fa-external-link-alt text-[10px] text-gray-300 ml-4 group-hover:text-emerald-400"></i>
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Timeline & Context */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm flex flex-col items-center text-center">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mb-4 shadow-inner">
                                <i className="far fa-calendar-alt text-xl"></i>
                            </div>
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Schedule Date</h4>
                            <p className="text-lg font-black text-gray-800">{task.date}</p>
                            <p className="text-xs text-gray-400 font-bold">{task.time || 'All Day Focus'}</p>
                        </div>
                        <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm flex flex-col items-center text-center">
                            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mb-4 shadow-inner">
                                <i className="fas fa-flag-checkered text-xl"></i>
                            </div>
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Expected Completion</h4>
                            <p className="text-lg font-black text-gray-800">{task.expected_finish_date || 'Ongoing'}</p>
                            <p className="text-xs text-gray-400 font-bold">{task.expected_finish_time || 'End of Day'}</p>
                        </div>
                    </div>
                </div>

                {/* Sidebar Context */}
                <div className="space-y-8">
                    {/* Invitation Actions Section */}
                    {myAssignment?.status === 'pending' && (
                        <div className="bg-indigo-600 rounded-[2rem] p-8 text-white shadow-xl shadow-indigo-100 animate-bounce-subtle">
                            <div className="flex flex-col items-center text-center">
                                <div className="w-16 h-16 rounded-[1.5rem] bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl mb-6">
                                    <i className="fas fa-handshake"></i>
                                </div>
                                <h3 className="text-xl font-black mb-2 tracking-tight">Accept Request?</h3>
                                <p className="text-indigo-100 text-sm font-medium mb-8 leading-relaxed">
                                    You've been invited to collaborate on this {isMeeting ? 'meeting' : 'research task'}.
                                </p>
                                <div className="flex flex-col gap-3 w-full">
                                    <button
                                        onClick={handleAccept}
                                        disabled={responding}
                                        className="w-full py-4 bg-white text-indigo-700 rounded-2xl font-black text-xs uppercase tracking-[0.15em] hover:bg-indigo-50 transition-all shadow-lg disabled:opacity-50"
                                    >
                                        {responding ? <i className="fas fa-spinner fa-spin"></i> : 'Accept Task'}
                                    </button>
                                    <button
                                        onClick={() => setRejectModal({ show: true, reason: '' })}
                                        disabled={responding}
                                        className="w-full py-4 bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.15em] hover:bg-indigo-400 transition-all border border-indigo-400/50 disabled:opacity-50"
                                    >
                                        Decline
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Progress Control */}
                    {myAssignment?.status === 'accepted' && (
                        <div className="bg-white rounded-[2rem] border border-emerald-100 p-8 shadow-lg shadow-emerald-50 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full -mr-12 -mt-12"></div>

                            <div className="relative z-10 text-center">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Workspace Control</h4>
                                {task.status === 'completed' ? (
                                    <div className="flex flex-col items-center">
                                        <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center text-2xl shadow-xl shadow-emerald-100 mb-4 animate-scale-in">
                                            <i className="fas fa-check-double"></i>
                                        </div>
                                        <h3 className="text-xl font-black text-emerald-700 mb-6">Mission Accomplished</h3>
                                        <button
                                            onClick={handleStatusToggle}
                                            disabled={responding}
                                            className="w-full py-3 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all"
                                        >
                                            Re-open Task
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleStatusToggle}
                                        disabled={responding}
                                        className={`w-full py-6 rounded-3xl font-black text-xs uppercase tracking-[0.15em] transition-all shadow-xl flex flex-col items-center gap-3 ${task.status === 'in-progress'
                                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
                                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
                                            }`}
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl">
                                            <i className={`fas ${task.status === 'in-progress' ? 'fa-check' : 'fa-play'}`}></i>
                                        </div>
                                        {responding ? <i className="fas fa-spinner fa-spin"></i> : (task.status === 'in-progress' ? 'Finish Task' : 'Start Task Now')}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Team Workspace */}
                    <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Collaborators</h4>
                            <div className="w-5 h-5 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-[10px] font-black text-gray-400">
                                {task.collaborators?.length || 0}
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Team Leader */}
                            {task.team_leader && (
                                <div className="flex items-center gap-4 p-3 bg-emerald-50 border border-emerald-100 rounded-2xl">
                                    <div className="relative">
                                        <img
                                            src={task.team_leader.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(task.team_leader.name)}&background=104a37&color=fff`}
                                            alt={task.team_leader.name}
                                            className="w-10 h-10 rounded-xl object-cover border border-white"
                                        />
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-[8px] text-white" title="Team Leader">
                                            <i className="fas fa-crown"></i>
                                        </div>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-sm font-black text-emerald-900 truncate">{task.team_leader.name}</div>
                                        <div className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter">Team Leader</div>
                                    </div>
                                </div>
                            )}

                            {/* Collaborators List */}
                            <div className="space-y-2">
                                {task.assignments?.filter(a => a.collaborator !== task.team_leader?.id).map((assignment, idx) => (
                                    <div key={idx} className="flex items-center gap-4 p-2.5 hover:bg-gray-50 rounded-xl transition-colors group">
                                        <img
                                            src={assignment.collaborator_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(assignment.collaborator_name)}&background=f0fdf4&color=104a37`}
                                            alt={assignment.collaborator_name}
                                            className="w-9 h-9 rounded-xl object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all border border-gray-50"
                                        />
                                        <div className="min-w-0 flex-1">
                                            <div className="text-xs font-bold text-gray-700 truncate">{assignment.collaborator_name}</div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${assignment.status === 'accepted' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                    assignment.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-100' :
                                                        'bg-amber-50 text-amber-600 border-amber-100'
                                                    }`}>
                                                    {assignment.status === 'pending' ? 'Waiting' : assignment.status}
                                                </div>
                                            </div>
                                            {assignment.status === 'rejected' && assignment.rejection_reason && (user?.is_superuser || (task.team_leader && task.team_leader.user?.id === user?.id)) && (
                                                <div className="mt-1.5 p-2 bg-red-50/50 border border-red-100/50 rounded-lg">
                                                    <p className="text-[10px] text-red-600 font-medium italic leading-tight">
                                                        <i className="fas fa-comment-dots mr-1 opacity-50"></i>
                                                        "{assignment.rejection_reason}"
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Project Association */}
                    {task.project && (
                        <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-100 rounded-[2rem] p-8 shadow-sm">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Under Project</h4>
                            <NavLink to={`/projects/${task.project.id}`} className="flex items-start gap-4 group">
                                <div
                                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-lg transition-transform group-hover:scale-105"
                                    style={{ backgroundColor: `${task.project.color}15`, color: task.project.color }}
                                >
                                    <i className="fas fa-folder"></i>
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-sm font-black text-gray-800 group-hover:text-emerald-600 transition-colors truncate">{task.project.name}</h4>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Explore project context</p>
                                </div>
                            </NavLink>
                        </div>
                    )}
                </div>
            </div>

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
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-red-100 focus:border-red-500 outline-none transition-all text-sm min-h-[100px] font-medium"
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

            <style>{`
                @keyframes fade-in { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes scale-in { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                .animate-fade-in { animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .animate-scale-in { animation: scale-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
                .animate-bounce-subtle { animation: bounce-subtle 3s ease-in-out infinite; }
                @keyframes bounce-subtle { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
            `}</style>
        </div>
    );
};

export default AgendaDetailView;

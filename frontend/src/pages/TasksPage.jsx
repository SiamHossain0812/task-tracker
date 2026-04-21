import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import CompleteTaskModal from '../components/agendas/CompleteTaskModal';

const TASK_TAG_LABELS = {
    'professional_knowledge': 'Professional Knowledge',
    'quality_of_work': 'Quality of Work',
    'devotion_to_duty': 'Devotion to Duty',
    'quantity_of_work_performed': 'Quantity of Work Performed',
    'decision_making_skills': 'Decision-Making Skills',
    'ability_to_implement_decisions': 'Ability to Implement Decisions',
    'supervise_lead_subordinates': 'Capacity to Supervise and Lead Subordinates',
    'teamwork_leadership': 'Capacity for Teamwork, Cooperation, and Leadership',
    'efiling_internet_usage': 'Interest and Proficiency in E-filing and Internet Usage',
    'innovative_work': 'Interest and Capacity for Innovative Work',
    'expression_writing': 'Power of Expression (Writing)',
    'expression_verbal': 'Power of Expression (Verbal)',
    'morality_ethics': 'Morality / Ethics',
    'honesty_integrity': 'Honesty / Integrity',
    'discipline': 'Sense of Discipline',
    'judgment_proportion': 'Judgment and Sense of Proportion',
    'personality': 'Personality',
    'cooperative_attitude': 'Cooperative Attitude',
    'punctuality': 'Punctuality',
    'reliability_dependability': 'Reliability / Dependability',
    'responsibility': 'Sense of Responsibility',
    'interest_attentiveness': 'Interest and Attentiveness in Work',
    'following_instructions': 'Promptness in Following Instructions of Higher Authorities',
    'initiative': 'Initiative',
    'stakeholder_behavior': 'Behavior with Service Recipients / Stakeholders'
};

const TasksPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [data, setData] = useState({
        all_undone: [],
        all_completed: [],
        all_archived: [],
        completed_today: [],
        pending_invitations: [],
        pending_count: 0,
        in_progress_count: 0,
        high_priority_count: 0,
        completed_total_count: 0,
        completed_today_count: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [modal, setModal] = useState({ show: false, task: null, nextStatus: '', statusLabel: '' });
    const [completeModal, setCompleteModal] = useState({ show: false, task: null });
    const [archiveModal, setArchiveModal] = useState({ show: false, task: null });
    const [deleteModal, setDeleteModal] = useState({ show: false, task: null });
    const [rejectModal, setRejectModal] = useState({ show: false, task: null, reason: '' });
    const [restoreModal, setRestoreModal] = useState({ show: false, task: null });
    const [isArchiveOpen, setIsArchiveOpen] = useState(false);
    const [toggling, setToggling] = useState(false);
    const [archiving, setArchiving] = useState(false);
    const [restoring, setRestoring] = useState(false);
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
        if (task.status === 'pending') return;
        const nextStatus = task.status === 'in-progress' ? 'completed' : 'in-progress';
        
        if (nextStatus === 'completed') {
            setCompleteModal({ show: true, task });
            return;
        }

        const statusLabel = nextStatus === 'completed' ? 'Completed' : 'In Progress';
        setModal({ show: true, task, nextStatus, statusLabel });
    };

    const handleCompleteTask = async (qualityScores) => {
        if (!completeModal.task) return;
        try {
            await apiClient.post(`agendas/${completeModal.task.id}/toggle/`, {
                quality_scores: qualityScores
            });
            await fetchTasks();
            setCompleteModal({ show: false, task: null });
        } catch (err) {
            console.error('Completion toggle failed', err);
            alert('Failed to complete task');
            throw err;
        }
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

    const handleArchiveClick = (task) => {
        setArchiveModal({ show: true, task });
    };

    const confirmArchive = async () => {
        if (!archiveModal.task) return;
        setArchiving(true);
        try {
            await apiClient.post(`agendas/${archiveModal.task.id}/archive/`);
            await fetchTasks();
            setArchiveModal({ show: false, task: null });
        } catch (err) {
            console.error('Archive failed', err);
            alert('Failed to archive task');
        } finally {
            setArchiving(false);
        }
    };

    const handleUnarchiveClick = (task) => {
        setRestoreModal({ show: true, task });
    };

    const confirmRestore = async () => {
        if (!restoreModal.task) return;
        setRestoring(true);
        try {
            await apiClient.post(`agendas/${restoreModal.task.id}/unarchive/`);
            await fetchTasks();
            setRestoreModal({ show: false, task: null });
        } catch (err) {
            console.error('Restore failed', err);
            alert('Failed to restore task');
        } finally {
            setRestoring(false);
        }
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
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 tracking-tight mb-1">Tasks Overview</h1>
                    <p className="text-sm sm:text-base text-gray-400 font-medium">Manage your progress and research agendas</p>
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
                    <div className="text-emerald-600 text-xs font-bold uppercase mb-2">Completed Tasks</div>
                    <div className="flex items-end justify-between">
                        <span className="text-4xl font-bold text-emerald-600">{data.completed_total_count}</span>
                        <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
                            <i className="fas fa-check-double"></i>
                        </div>
                    </div>
                    <div className="text-[10px] text-emerald-400 font-bold mt-2 font-mono">
                        +{data.completed_today_count} TODAY
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
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-bold text-gray-800">{task.title}</span>
                                                            {task.task_tag && (
                                                                <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase tracking-widest border border-emerald-100/50">
                                                                    {TASK_TAG_LABELS[task.task_tag] || task.task_tag}
                                                                </span>
                                                            )}
                                                            {task.is_approved === false && (
                                                                <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 text-[8px] font-black uppercase tracking-widest border border-amber-200" title="Pending admin approval">
                                                                    Awaiting Approval
                                                                </span>
                                                            )}
                                                        </div>
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
                                                    {task.status === 'pending' ? (
                                                        <div className={`px-3 py-1.5 rounded-lg text-xs font-bold w-28 text-center ${
                                                            task.is_overdue ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-500'
                                                        }`}>
                                                            {task.is_overdue ? 'OVERDUE' : (task.status_display || 'Pending')}
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleToggleClick(task)}
                                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all w-28 ${task.status === 'in-progress' ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100' :
                                                                    'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                                                }`}
                                                        >
                                                            {task.status_display || (task.status === 'in-progress' ? 'In Progress' : 'Completed')}
                                                        </button>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right pr-8">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <NavLink to={`/tasks/${task.id}`} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-emerald-600 hover:bg-emerald-50">
                                                            <i className="fas fa-eye text-xs"></i>
                                                        </NavLink>
                                                        {(user?.is_superuser || task.created_by === user?.id) && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleArchiveClick(task)}
                                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-amber-500 hover:bg-amber-50 transition-all"
                                                                    title="Archive Task"
                                                                >
                                                                    <i className="fas fa-archive text-xs"></i>
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteClick(task)}
                                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50"
                                                                >
                                                                    <i className="fas fa-trash text-xs"></i>
                                                                </button>
                                                            </>
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

                {/* Completed Tasks Section */}
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                            <i className="fas fa-check-circle"></i>
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">Completed Tasks <span className="text-emerald-400 text-sm font-medium ml-2">({data.all_completed.length})</span></h3>
                    </div>

                    {data.all_completed.length > 0 ? (
                        <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm overflow-hidden opacity-90 max-h-[500px] overflow-y-auto custom-scrollbar">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="sticky top-0 bg-white z-10">
                                        <tr className="bg-emerald-50/30 border-b border-emerald-50 text-xs font-bold uppercase tracking-wider text-emerald-700">
                                            <th className="px-6 py-4 w-12"></th>
                                            <th className="px-6 py-4">Task Name</th>
                                            <th className="px-6 py-4">Project</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4 w-12 text-right pr-8">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-emerald-50/50">
                                        {data.all_completed.map(task => (
                                            <tr key={task.id} className="group hover:bg-emerald-50/20 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <NavLink to={`/tasks/${task.id}`} className="flex flex-col hover:text-emerald-600 transition-colors group/item">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-bold text-gray-500 line-through decoration-emerald-200 group-hover/item:text-emerald-600 transition-colors">
                                                                {task.title}
                                                            </span>
                                                            {task.task_tag && (
                                                                <span className="px-1.5 py-0.5 rounded bg-gray-50 text-gray-400 text-[8px] font-bold uppercase tracking-widest border border-gray-100">
                                                                    {TASK_TAG_LABELS[task.task_tag] || task.task_tag}
                                                                </span>
                                                            )}
                                                        </div>
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
                                                            <>
                                                                <button
                                                                    onClick={() => handleArchiveClick(task)}
                                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 hover:text-amber-500 hover:bg-amber-50 transition-all"
                                                                    title="Archive Task"
                                                                >
                                                                    <i className="fas fa-archive text-xs"></i>
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteClick(task)}
                                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50"
                                                                >
                                                                    <i className="fas fa-trash text-xs"></i>
                                                                </button>
                                                            </>
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

                {/* Archived Tasks Section */}
                <div className="pt-4 border-t border-gray-100">
                    <button 
                        onClick={() => setIsArchiveOpen(!isArchiveOpen)}
                        className="flex items-center gap-3 group hover:opacity-80 transition-opacity"
                    >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isArchiveOpen ? 'bg-amber-100 text-amber-600' : 'bg-gray-50 text-gray-400'}`}>
                            <i className={`fas ${isArchiveOpen ? 'fa-folder-open' : 'fa-folder'} text-sm`}></i>
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">Archived History <span className="text-gray-400 text-sm font-medium ml-2">({data.all_archived?.length || 0})</span></h3>
                        <i className={`fas fa-chevron-right text-[10px] text-gray-300 transition-transform duration-300 ${isArchiveOpen ? 'rotate-90' : ''}`}></i>
                    </button>

                    {isArchiveOpen && (
                        <div className="mt-6 animate-fade-in">
                            {data.all_archived && data.all_archived.length > 0 ? (
                                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                                    <th className="px-6 py-4 w-12"></th>
                                                    <th className="px-6 py-4">Task Name</th>
                                                    <th className="px-6 py-4">Status</th>
                                                    <th className="px-6 py-4 w-12 text-right pr-8">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {data.all_archived.map(task => (
                                                    <tr key={task.id} className="group hover:bg-gray-50/50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col">
                                                                <div className="flex items-center gap-2 mb-0.5">
                                                                    <span className="text-sm font-bold text-gray-400 italic">{task.title}</span>
                                                                    {task.task_tag && (
                                                                        <span className="px-1.5 py-0.5 rounded bg-gray-50 text-gray-300 text-[8px] font-bold uppercase tracking-widest border border-gray-100">
                                                                            {TASK_TAG_LABELS[task.task_tag] || task.task_tag}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{task.project_info?.name || 'InBox'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="px-2.5 py-1 rounded-lg bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest border border-gray-100">
                                                                {task.status_display || task.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right pr-8">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button
                                                                    onClick={() => handleUnarchiveClick(task)}
                                                                    className="px-4 py-1.5 rounded-xl bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-widest border border-amber-100 hover:bg-amber-100 transition-all"
                                                                >
                                                                    Restore
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteClick(task)}
                                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
                                                                >
                                                                    <i className="fas fa-trash text-xs"></i>
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
                                <div className="p-12 text-center border-2 border-dashed border-gray-100 rounded-[2.5rem] opacity-40">
                                    <i className="fas fa-archive text-2xl mb-3 block"></i>
                                    <p className="text-sm font-bold italic tracking-tight">Your archive is currently empty.</p>
                                </div>
                            )}
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

            {/* Archive Modal */}
            {archiveModal.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm animate-fade-in" onClick={() => !archiving && setArchiveModal({ show: false, task: null })}></div>
                    <div className="relative transform overflow-hidden rounded-3xl bg-white shadow-xl transition-all sm:max-w-sm w-full animate-fade-in-up z-10 p-8">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 text-2xl mx-auto mb-4">
                                <i className="fas fa-archive"></i>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Archive Task?</h3>
                            <p className="text-gray-500 text-sm mt-2">
                                Tasks are hidden from daily views but retained for reference. You can unarchive them later.
                            </p>
                        </div>
                        <div className="mt-8 flex gap-3">
                            <button
                                onClick={() => setArchiveModal({ show: false, task: null })}
                                disabled={archiving}
                                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl text-sm font-bold transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmArchive}
                                disabled={archiving}
                                className="flex-[2] px-4 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-sm font-bold transition-all shadow-lg shadow-amber-100"
                            >
                                {archiving ? <i className="fas fa-spinner fa-spin mr-2"></i> : null}
                                Yes, Archive
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Restore Modal */}
            {restoreModal.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm animate-fade-in" onClick={() => !restoring && setRestoreModal({ show: false, task: null })}></div>
                    <div className="relative transform overflow-hidden rounded-[2rem] bg-white shadow-2xl transition-all sm:max-w-sm w-full animate-fade-in-up z-10 p-8 border border-gray-100">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 text-2xl mx-auto mb-4 border border-emerald-100/50">
                                <i className="fas fa-undo"></i>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Restore Task?</h3>
                            <p className="text-gray-500 text-xs font-medium mt-2 leading-relaxed">
                                This will move the task back to your active lists. Its previous status and data will be preserved.
                            </p>
                        </div>
                        <div className="mt-8 flex gap-3">
                            <button
                                onClick={() => setRestoreModal({ show: false, task: null })}
                                disabled={restoring}
                                className="flex-1 px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmRestore}
                                disabled={restoring}
                                className="flex-[2] px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-emerald-100"
                            >
                                {restoring ? <i className="fas fa-spinner fa-spin mr-2"></i> : null}
                                Yes, Restore
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
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

            {/* Complete Task Modal with Ratings */}
            <CompleteTaskModal
                task={completeModal.task}
                isOpen={completeModal.show}
                onClose={() => setCompleteModal({ show: false, task: null })}
                onConfirm={handleCompleteTask}
            />

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

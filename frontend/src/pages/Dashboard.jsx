import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import apiClient from '../api/client';
import ProjectRequestModal from '../components/projects/ProjectRequestModal';
import { toast } from 'react-hot-toast';

const Dashboard = () => {
    const { user } = useAuth();
    const { refresh: refreshNotifications, showToast } = useNotifications();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [activeCard, setActiveCard] = useState(null); // 'completed', 'in_progress', 'todo', 'overdue'

    const [responding, setResponding] = useState(false);
    const [rejectModal, setRejectModal] = useState({ show: false, task: null, reason: '' });

    const fetchDashboardData = async () => {
        try {
            const response = await apiClient.get('dashboard/');
            setData(response.data);
        } catch (error) {
            console.error('Failed to fetch dashboard data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();

        // Poll for updates (and trigger alerts) every 60 seconds
        const intervalId = setInterval(() => {
            fetchDashboardData();
        }, 60000);

        return () => clearInterval(intervalId);
    }, []);

    const handleAccept = async (taskId) => {
        setResponding(true);
        try {
            await apiClient.post(`agendas/${taskId}/accept/`);
            await fetchDashboardData();
            toast.success('Invitation accepted!');
        } catch (err) {
            console.error('Accept failed', err);
            toast.error('Failed to accept invitation');
        } finally {
            setResponding(false);
        }
    };

    const handleRejectClick = (task) => {
        setRejectModal({ show: true, task, reason: '' });
    };

    const confirmReject = async () => {
        if (!rejectModal.task || !rejectModal.reason.trim()) {
            toast.error('Please provide a reason');
            return;
        }
        setResponding(true);
        try {
            await apiClient.post(`agendas/${rejectModal.task.id}/reject/`, {
                rejection_reason: rejectModal.reason
            });
            await fetchDashboardData();
            setRejectModal({ show: false, task: null, reason: '' });
            toast.success('Invitation rejected');
        } catch (err) {
            console.error('Reject failed', err);
            toast.error('Failed to reject invitation');
        } finally {
            setResponding(false);
        }
    };

    const toggleCard = (card) => {
        setActiveCard(prev => prev === card ? null : card);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    const stats = data?.stats || {};
    const overallProgress = stats.overall_progress || 0;

    return (
        <div className="h-full flex flex-col animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 tracking-tight mb-1">Dashboard</h1>
                    <p className="text-sm sm:text-base text-gray-400 font-medium">
                        Plan, prioritize, and accomplish your tasks.
                    </p>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                    <NavLink
                        to="/tasks/new"
                        className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2 text-sm"
                    >
                        <i className="fas fa-plus"></i>
                        <span>Task</span>
                    </NavLink>

                    {user?.is_superuser && (
                        <NavLink
                            to="/projects/new"
                            className="flex-1 sm:flex-none px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 rounded-xl font-bold shadow-sm border border-gray-200 transition-all flex items-center justify-center gap-2 text-sm"
                        >
                            <i className="fas fa-folder-plus text-emerald-500"></i>
                            <span>New Project</span>
                        </NavLink>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-8">
                {/* Total Projects */}
                <div onClick={() => navigate('/projects')} className="bg-gradient-to-br from-[#104a37] to-[#047857] rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-white relative overflow-hidden shadow-xl shadow-emerald-100 h-32 sm:h-48 flex flex-col justify-between group cursor-pointer hover:scale-[1.02] transition-transform">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-5 rounded-full blur-2xl -mr-8 -mt-8"></div>
                    <div className="flex justify-between items-start relative z-10">
                        <span className="text-xs sm:text-sm font-medium text-emerald-100">Projects</span>
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                            <i className="fas fa-folder text-[10px] sm:text-xs"></i>
                        </div>
                    </div>
                    <div className="relative z-10">
                        <div className="text-3xl sm:text-5xl font-bold mb-1 sm:mb-3">{data?.projects?.length || 0}</div>
                        <div className="text-[10px] font-medium text-emerald-200/80">Active</div>
                    </div>
                </div>

                {/* Completed Tasks */}
                <div 
                    onClick={() => toggleCard('completed')} 
                    className={`rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border h-32 sm:h-48 flex flex-col justify-between group cursor-pointer transition-all hover:shadow-md ${activeCard === 'completed' ? 'bg-emerald-50 border-emerald-200 ring-2 ring-emerald-500/20' : 'bg-white border-gray-100'}`}
                >
                    <div className="flex justify-between items-start">
                        <span className="text-xs sm:text-sm font-bold text-gray-700">Completed</span>
                        <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full border flex items-center justify-center transition-colors ${activeCard === 'completed' ? 'bg-emerald-500 border-emerald-600 text-white' : 'border-gray-100 text-emerald-500'}`}>
                            <i className="fas fa-check text-[10px] sm:text-xs"></i>
                        </div>
                    </div>
                    <div>
                        <div className="text-3xl sm:text-5xl font-bold text-gray-800 mb-1 sm:mb-3">{stats.completed_agendas || 0}</div>
                        <div className="text-[10px] font-medium text-gray-400">Tasks</div>
                    </div>
                </div>

                {/* In Progress */}
                <div 
                    onClick={() => toggleCard('in_progress')} 
                    className={`rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border h-32 sm:h-48 flex flex-col justify-between group cursor-pointer transition-all hover:shadow-md ${activeCard === 'in_progress' ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-500/20' : 'bg-white border-gray-100'}`}
                >
                    <div className="flex justify-between items-start">
                        <span className="text-xs sm:text-sm font-bold text-gray-700">In Progress</span>
                        <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full border flex items-center justify-center transition-colors ${activeCard === 'in_progress' ? 'bg-blue-500 border-blue-600 text-white' : 'border-gray-100 text-blue-500'}`}>
                            <i className="fas fa-spinner text-[10px] sm:text-xs animate-spin-slow"></i>
                        </div>
                    </div>
                    <div>
                        <div className="text-3xl sm:text-5xl font-bold text-gray-800 mb-1 sm:mb-3">{stats.in_progress_agendas || 0}</div>
                        <div className="text-[10px] font-medium text-gray-400">Current</div>
                    </div>
                </div>

                {/* Pending Tasks */}
                <div 
                    onClick={() => toggleCard('todo')} 
                    className={`rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border h-32 sm:h-48 flex flex-col justify-between group cursor-pointer transition-all hover:shadow-md ${activeCard === 'todo' ? 'bg-amber-50 border-amber-200 ring-2 ring-amber-500/20' : 'bg-white border-gray-100'}`}
                >
                    <div className="flex justify-between items-start">
                        <span className="text-xs sm:text-sm font-bold text-gray-700">To Do</span>
                        <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full border flex items-center justify-center transition-colors ${activeCard === 'todo' ? 'bg-amber-500 border-amber-600 text-white' : 'border-gray-100 text-amber-500'}`}>
                            <i className="fas fa-hourglass-start text-[10px] sm:text-xs"></i>
                        </div>
                    </div>
                    <div>
                        <div className="text-3xl sm:text-5xl font-bold text-gray-800 mb-1 sm:mb-3">{stats.pending_agendas || 0}</div>
                        <div className="text-[10px] font-medium text-gray-400">Waiting</div>
                    </div>
                </div>

                {/* Overdue Tasks */}
                <div 
                    onClick={() => toggleCard('overdue')} 
                    className={`rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border h-32 sm:h-48 flex flex-col justify-between group cursor-pointer transition-all hover:shadow-md ${activeCard === 'overdue' ? 'bg-red-50 border-red-200 ring-2 ring-red-500/20' : 'bg-white border-gray-100'}`}
                >
                    <div className="flex justify-between items-start">
                        <span className="text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-tighter">Overdue</span>
                        <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full border flex items-center justify-center transition-colors ${activeCard === 'overdue' ? 'bg-red-500 border-red-600 text-white' : 'border-gray-100 text-red-500'}`}>
                            <i className="fas fa-exclamation-triangle text-[10px] sm:text-xs"></i>
                        </div>
                    </div>
                    <div>
                        <div className="text-3xl sm:text-5xl font-bold text-gray-800 mb-1 sm:mb-3">{stats.overdue_count || 0}</div>
                        <div className="text-[10px] font-medium text-gray-400">Alerts</div>
                    </div>
                </div>
            </div>

            {/* Stats Table Modal */}
            {activeCard && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" 
                        onClick={() => toggleCard(null)}
                    ></div>
                    
                    {/* Modal Content */}
                    <div className="relative bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[85vh] shadow-2xl overflow-hidden flex flex-col animate-modal-enter border border-gray-100">
                        {/* Status Header */}
                        <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-[1.25rem] flex items-center justify-center shadow-sm transition-colors ${
                                    activeCard === 'completed' ? 'bg-emerald-100 text-emerald-600' :
                                    activeCard === 'in_progress' ? 'bg-blue-100 text-blue-600' :
                                    activeCard === 'todo' ? 'bg-amber-100 text-amber-600' :
                                    'bg-red-100 text-red-600'
                                }`}>
                                    <i className={`fas text-xl ${
                                        activeCard === 'completed' ? 'fa-check-circle' :
                                        activeCard === 'in_progress' ? 'fa-spinner fa-spin-slow' :
                                        activeCard === 'todo' ? 'fa-list-ul' :
                                        'fa-exclamation-circle'
                                    }`}></i>
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-gray-800 text-xl capitalize leading-none mb-1">
                                        {activeCard.replace('_', ' ')} Tasks
                                    </h3>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        Summary of your current activities
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => toggleCard(null)}
                                className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-800 transition-all border border-gray-50"
                            >
                                <i className="fas fa-times text-lg"></i>
                            </button>
                        </div>

                        {/* Table Body */}
                        <div className="overflow-y-auto flex-1 p-8 custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 bg-white z-10 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                                    <tr className="border-b border-gray-50">
                                        <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Task Detail</th>
                                        <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Project</th>
                                        <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date / Time</th>
                                        <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Priority</th>
                                        <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right pr-2">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {(activeCard === 'completed' ? data.completed_agendas_list :
                                      activeCard === 'in_progress' ? data.in_progress_agendas_list :
                                      activeCard === 'todo' ? data.pending_agendas_list :
                                      data.overdue_agendas
                                    )?.map((task) => (
                                        <tr key={task.id} className="group hover:bg-gray-50/50 transition-colors">
                                            <td className="py-5 pl-2">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-gray-800 group-hover:text-emerald-600 transition-colors truncate max-w-[240px]" title={task.title}>
                                                        {task.title}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter mt-0.5">ID: #{task.id}</span>
                                                </div>
                                            </td>
                                            <td className="py-5">
                                                {task.project_info ? (
                                                    <span className="px-2.5 py-1 rounded-xl bg-gray-100 text-[10px] font-black text-gray-600 uppercase tracking-wider">
                                                        {task.project_info.name}
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">General</span>
                                                )}
                                            </td>
                                            <td className="py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-gray-600">{task.date}</span>
                                                    <span className="text-[10px] text-gray-400">{task.time || 'All day'}</span>
                                                </div>
                                            </td>
                                            <td className="py-5">
                                                <span className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                                    task.priority === 'high' ? 'bg-red-50 text-red-500' :
                                                    task.priority === 'medium' ? 'bg-blue-50 text-blue-500' :
                                                    'bg-gray-50 text-gray-400'
                                                }`}>
                                                    {task.priority || 'low'}
                                                </span>
                                            </td>
                                            <td className="py-5 text-right pr-2">
                                                <NavLink 
                                                    to={`/tasks/${task.id}`}
                                                    className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-gray-50 text-gray-400 hover:bg-[#104a37] hover:text-white transition-all group/btn shadow-sm"
                                                >
                                                    <i className="fas fa-arrow-right text-[10px] group-hover/btn:translate-x-0.5 transition-transform"></i>
                                                </NavLink>
                                            </td>
                                        </tr>
                                    ))}
                                    {((activeCard === 'completed' ? data.completed_agendas_list :
                                      activeCard === 'in_progress' ? data.in_progress_agendas_list :
                                      activeCard === 'todo' ? data.pending_agendas_list :
                                      data.overdue_agendas
                                    )?.length === 0) && (
                                        <tr>
                                            <td colSpan="5" className="py-20 text-center opacity-30">
                                                <div className="w-20 h-20 rounded-[2rem] bg-gray-100 flex items-center justify-center mx-auto mb-4">
                                                    <i className="fas fa-clipboard-list text-3xl"></i>
                                                </div>
                                                <p className="text-sm font-bold text-gray-500">No tasks found in this category.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        
                        {/* Footer */}
                        <div className="px-8 py-4 bg-gray-50/50 border-t border-gray-100 flex justify-end shrink-0">
                            <button 
                                onClick={() => toggleCard(null)}
                                className="px-6 py-2.5 bg-white border border-gray-200 hover:bg-gray-100 text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
                            >
                                Close View
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Overdue Alert */}

            {/* Overdue Alert */}
            {stats.overdue_count > 0 && (
                <div className="mb-8 animate-bounce-subtle">
                    <div className="bg-red-50 border border-red-100 rounded-3xl p-4 flex items-center justify-between gap-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 shadow-sm">
                                <i className="fas fa-triangle-exclamation"></i>
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-red-800 uppercase tracking-tighter">Overdue Action Required</h4>
                                <p className="text-xs text-red-600 font-medium">
                                    You have {stats.overdue_count} tasks that need immediate attention.
                                </p>
                            </div>
                        </div>
                        <NavLink
                            to="/tasks?filter=overdue"
                            className="px-4 py-2 bg-red-600 text-white text-[10px] font-black rounded-xl uppercase tracking-widest hover:bg-red-700 transition-colors"
                        >
                            View All
                        </NavLink>
                    </div>
                </div>
            )}

            {/* Task Invitations */}
            {data?.pending_invitations && data.pending_invitations.length > 0 && (
                <div className="mb-8 animate-fade-in-up">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-200">
                            <i className="fas fa-envelope-open-text"></i>
                        </div>
                        <h4 className="text-sm font-black text-indigo-800 uppercase tracking-tighter">Task Invitations <span className="text-indigo-400 font-medium ml-1">({data.pending_invitations.length})</span></h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {data.pending_invitations.map(invitation => (
                            <div
                                key={invitation.id}
                                onClick={() => navigate(`/tasks/${invitation.id}`)}
                                className="bg-white p-5 rounded-3xl border border-indigo-100 shadow-sm hover:shadow-md transition-all group cursor-pointer"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-1">Attention Required</span>
                                        <h4 className="font-bold text-gray-800 truncate" title={invitation.title}>{invitation.title}</h4>
                                    </div>
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${invitation.priority === 'high' ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                        <i className={`fas ${invitation.type === 'meeting' ? 'fa-video' : 'fa-clipboard-list'} text-sm`}></i>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-gray-500 font-semibold mb-4">
                                    <i className="far fa-calendar-alt"></i>
                                    <span>{invitation.date} • {invitation.time || 'All Day'}</span>
                                    <span className="mx-1 opacity-30">|</span>
                                    <span className="truncate">Leader: {invitation.team_leader_name || 'Admin'}</span>
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

            {/* Main Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 mb-8 lg:min-h-[500px]">
                {/* Today (Order 1) */}
                <div className="order-1 col-span-1 lg:col-start-2 lg:row-start-2">
                    <div className="bg-indigo-600 rounded-3xl p-6 shadow-lg shadow-indigo-200 text-white h-full relative overflow-hidden flex flex-col justify-center">
                        <h3 className="font-bold text-indigo-100 mb-1 text-xs sm:text-base">Today's Focus</h3>
                        <div className="text-3xl sm:text-4xl font-bold mb-1">{data?.today_tasks?.length || 0}</div>
                        <p className="text-[10px] sm:text-sm text-indigo-200">Scheduled for today</p>
                    </div>
                </div>

                {/* Next Up (Order 2) */}
                <div className="order-2 col-span-1 lg:col-start-2 lg:row-start-1">
                    <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-100 flex flex-col h-full justify-between">
                        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                                <i className="far fa-bell text-xs sm:text-base"></i>
                            </div>
                            <h3 className="font-bold text-gray-800 text-xs sm:text-base">Next Up</h3>
                        </div>

                        {data?.upcoming_tasks?.length > 0 ? (
                            <div className="flex flex-col gap-2">
                                <h4 className="text-sm sm:text-xl font-bold text-gray-800 line-clamp-1 sm:line-clamp-2">
                                    {data.upcoming_tasks[0].title}
                                </h4>
                                <p className="text-[10px] sm:text-sm text-gray-500 font-medium flex flex-col gap-0.5">
                                    <span>
                                        <i className="far fa-calendar mr-1"></i>
                                        {data.upcoming_tasks[0].date}
                                        {data.upcoming_tasks[0].time && ` at ${data.upcoming_tasks[0].time}`}
                                    </span>
                                </p>
                                <NavLink
                                    to={`/tasks/${data.upcoming_tasks[0].id}`}
                                    className="mt-2 w-full py-2 sm:py-3 bg-[#104a37] hover:bg-[#063f2e] text-white rounded-xl font-bold text-[10px] sm:text-sm flex items-center justify-center gap-1 group"
                                >
                                    View
                                    <i className="fas fa-arrow-right text-[8px] group-hover:translate-x-1 transition-transform"></i>
                                </NavLink>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center">
                                <p className="text-[10px] sm:text-sm text-gray-500 font-medium">All caught up!</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Progress (Order 3) */}
                <div className="order-3 col-span-2 lg:col-span-1 lg:col-start-3 lg:row-start-1 lg:row-span-2">
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col h-full">
                        <h3 className="font-bold text-gray-800 mb-4 text-center lg:text-left">Overall Completion</h3>
                        <div className="flex-1 flex items-center justify-center">
                            <div className="relative w-full max-w-[240px] aspect-[1.6]">
                                <svg viewBox="0 0 200 120" className="w-full h-full">
                                    <path
                                        d="M 20 100 A 80 80 0 0 1 180 100"
                                        fill="none"
                                        stroke="#e5e7eb"
                                        strokeWidth="18"
                                        strokeLinecap="round"
                                    />
                                    <path
                                        d="M 20 100 A 80 80 0 0 1 180 100"
                                        fill="none"
                                        stroke="#059669"
                                        strokeWidth="18"
                                        strokeLinecap="round"
                                        strokeDasharray="251"
                                        strokeDashoffset={251 - (251 * overallProgress / 100)}
                                        className="transition-all duration-1000 ease-out"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pt-6 pointer-events-none">
                                    <span className="text-3xl sm:text-4xl font-extrabold text-gray-800 leading-none">{overallProgress}%</span>
                                    <span className="text-[10px] font-bold tracking-widest text-gray-400 mt-1 uppercase">Rate</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-center gap-4 mt-2">
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                                <span className="text-[10px] font-bold text-gray-500">Completed</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-gray-200"></span>
                                <span className="text-[10px] font-bold text-gray-500">Left</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Tasks (Order 4) */}
                <div className="order-4 col-span-2 lg:col-span-1 lg:col-start-1 lg:row-start-1 lg:row-span-2">
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col h-full lg:min-h-[300px]">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="font-bold text-gray-800">Recent Tasks</h3>
                            <NavLink
                                to="/tasks"
                                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                            >
                                View All <i className="fas fa-arrow-right ml-1"></i>
                            </NavLink>
                        </div>
                        <div className="space-y-3 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                            {data?.recent_agendas?.length > 0 ? (
                                data.recent_agendas.map((task) => (
                                    <NavLink
                                        key={task.id}
                                        to={`/tasks/${task.id}`}
                                        className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100 group"
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${task.status === 'completed' ? 'bg-emerald-50 text-emerald-500' :
                                            task.is_overdue ? 'bg-red-50 text-red-500' :
                                                'bg-amber-50 text-amber-500'
                                            }`}>
                                            <i className={`fas ${task.status === 'completed' ? 'fa-check' :
                                                task.is_overdue ? 'fa-exclamation-circle' :
                                                    'fa-clock'
                                                } text-sm`}></i>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-bold text-gray-800 truncate group-hover:text-emerald-600 transition-colors">
                                                {task.title}
                                            </h4>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] font-bold text-gray-400">
                                                    {task.date}
                                                </span>
                                                {task.project_info && (
                                                    <>
                                                        <span className="text-gray-300">•</span>
                                                        <span className="text-[10px] font-extrabold text-[#104a37] uppercase tracking-wider">
                                                            {task.project_info.name}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${task.priority === 'high' ? 'bg-red-50 text-red-500' :
                                                task.priority === 'medium' ? 'bg-blue-50 text-blue-500' :
                                                    'bg-gray-50 text-gray-400'
                                                }`}>
                                                {task.priority}
                                            </span>
                                            <i className="fas fa-chevron-right text-[10px] text-gray-300 group-hover:text-emerald-500 transition-colors"></i>
                                        </div>
                                    </NavLink>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-10 opacity-40">
                                    <i className="fas fa-clipboard-list text-3xl mb-2"></i>
                                    <p className="text-sm font-medium">No recent activity.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {/* Rejection Modal */}
            {rejectModal.show && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm animate-fade-in" onClick={() => !responding && setRejectModal({ ...rejectModal, show: false })}></div>
                    <div className="relative transform overflow-hidden rounded-[40px] bg-white shadow-2xl transition-all sm:max-w-md w-full animate-fade-in-up z-10 p-1">
                        <div className="bg-white rounded-[36px] p-8 border border-gray-50">
                            <div className="flex items-center gap-4 mb-6 text-center sm:text-left flex-col sm:flex-row">
                                <div className="h-16 w-16 rounded-[24px] bg-red-50 flex items-center justify-center text-red-500 text-2xl shadow-inner shadow-red-100">
                                    <i className="fas fa-comment-slash"></i>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">Reject Task</h3>
                                    <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">Reason is mandatory</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Invited Task</label>
                                    <p className="text-sm font-bold text-gray-700 italic px-1">"{rejectModal.task?.title}"</p>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Why are you rejecting? <span className="text-red-500">*</span></label>
                                    <textarea
                                        value={rejectModal.reason}
                                        onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
                                        className="w-full px-5 py-4 bg-white border-2 border-gray-100 rounded-3xl focus:ring-4 focus:ring-red-50 focus:border-red-500 transition-all text-sm min-h-[140px] font-medium placeholder:text-gray-300 shadow-sm"
                                        placeholder="I'm currently over capacity / Not my area of expertise..."
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="mt-8 flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={() => setRejectModal({ ...rejectModal, show: false })}
                                    disabled={responding}
                                    className="order-2 sm:order-1 flex-1 px-6 py-4 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                                >
                                    Go Back
                                </button>
                                <button
                                    onClick={confirmReject}
                                    disabled={responding || !rejectModal.reason.trim()}
                                    className="order-1 sm:order-2 flex-[2] px-6 py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-red-100 disabled:opacity-50 disabled:shadow-none"
                                >
                                    {responding ? <i className="fas fa-spinner fa-spin mr-2"></i> : null}
                                    Confirm Rejection
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <ProjectRequestModal
                isOpen={isRequestModalOpen}
                onClose={() => setIsRequestModalOpen(false)}
                onSuccess={() => {
                    if (window.toast) {
                        window.toast.success("Project request submitted successfully!");
                    } else {
                        alert("Project request submitted successfully!");
                    }
                }}
            />
        </div>
    );
};

export default Dashboard;

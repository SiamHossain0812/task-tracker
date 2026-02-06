import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';

const Dashboard = () => {
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Parallel fetch: Dashboard data AND Trigger alert check
                const [dashboardRes, _] = await Promise.all([
                    apiClient.get('dashboard/'),
                    apiClient.get('alerts/check/')
                ]);
                setData(dashboardRes.data);
            } catch (error) {
                console.error('Failed to fetch dashboard data', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

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
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1">Dashboard</h1>
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

                    <NavLink
                        to="/projects/new"
                        className="flex-1 sm:flex-none px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 rounded-xl font-bold shadow-sm border border-gray-200 transition-all flex items-center justify-center gap-2 text-sm"
                    >
                        <i className="fas fa-folder-plus"></i>
                        <span>Project</span>
                    </NavLink>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
                {/* Total Projects */}
                <div className="bg-gradient-to-br from-[#104a37] to-[#047857] rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-white relative overflow-hidden shadow-xl shadow-emerald-100 h-32 sm:h-48 flex flex-col justify-between group">
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
                <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-100 h-32 sm:h-48 flex flex-col justify-between group">
                    <div className="flex justify-between items-start">
                        <span className="text-xs sm:text-sm font-bold text-gray-700">Completed</span>
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border border-gray-100 flex items-center justify-center text-emerald-500">
                            <i className="fas fa-check text-[10px] sm:text-xs"></i>
                        </div>
                    </div>
                    <div>
                        <div className="text-3xl sm:text-5xl font-bold text-gray-800 mb-1 sm:mb-3">{stats.completed_agendas || 0}</div>
                        <div className="text-[10px] font-medium text-gray-400">Tasks</div>
                    </div>
                </div>

                {/* In Progress */}
                <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-100 h-32 sm:h-48 flex flex-col justify-between group">
                    <div className="flex justify-between items-start">
                        <span className="text-xs sm:text-sm font-bold text-gray-700">In Progress</span>
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border border-gray-100 flex items-center justify-center text-blue-500">
                            <i className="fas fa-spinner text-[10px] sm:text-xs animate-spin-slow"></i>
                        </div>
                    </div>
                    <div>
                        <div className="text-3xl sm:text-5xl font-bold text-gray-800 mb-1 sm:mb-3">{stats.in_progress_agendas || 0}</div>
                        <div className="text-[10px] font-medium text-gray-400">Current</div>
                    </div>
                </div>

                {/* Pending Tasks */}
                <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-100 h-32 sm:h-48 flex flex-col justify-between group">
                    <div className="flex justify-between items-start">
                        <span className="text-xs sm:text-sm font-bold text-gray-700">To Do</span>
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border border-gray-100 flex items-center justify-center text-amber-500">
                            <i className="fas fa-hourglass-start text-[10px] sm:text-xs"></i>
                        </div>
                    </div>
                    <div>
                        <div className="text-3xl sm:text-5xl font-bold text-gray-800 mb-1 sm:mb-3">{stats.pending_agendas || 0}</div>
                        <div className="text-[10px] font-medium text-gray-400">Waiting</div>
                    </div>
                </div>
            </div>

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
                                    to={`/tasks/${data.upcoming_tasks[0].id}/edit`}
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

                {/* Projects (Order 4) */}
                <div className="order-4 col-span-2 lg:col-span-1 lg:col-start-1 lg:row-start-1 lg:row-span-2">
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col h-full lg:min-h-[400px]">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="font-bold text-gray-800">Projects</h3>
                            <NavLink
                                to="/projects/new"
                                className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-500 hover:bg-gray-50 transition-colors flex items-center gap-1"
                            >
                                <i className="fas fa-plus"></i> New
                            </NavLink>
                        </div>
                        <div className="space-y-4 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                            {data?.projects?.length > 0 ? (
                                data.projects.map((project) => (
                                    <NavLink
                                        key={project.id}
                                        to={`/projects/${project.id}`}
                                        className="flex items-start gap-3 group cursor-pointer hover:bg-gray-50 p-2 rounded-xl transition-colors"
                                    >
                                        <div
                                            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-gray-100"
                                            style={{ backgroundColor: `${project.color}15`, color: project.color }}
                                        >
                                            <i className="fas fa-folder text-sm"></i>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-bold text-gray-800 group-hover:text-emerald-600 transition-colors truncate">
                                                {project.name}
                                            </h4>
                                            {project.description && (
                                                <p className="text-[10px] text-gray-400 font-medium truncate">{project.description}</p>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-[10px] font-bold text-gray-500">
                                            {project.total_agendas || 0}
                                        </div>
                                    </NavLink>
                                ))
                            ) : (
                                <p className="text-sm text-gray-400 text-center py-8">No projects yet.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

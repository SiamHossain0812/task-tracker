import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import apiClient from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import Toast from '../common/Toast';
import ConfirmModal from '../common/ConfirmModal';

const ProjectAnalytics = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [projectsData, setProjectsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reportDays, setReportDays] = useState(7);

    // UI State
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [confirmModal, setConfirmModal] = useState({ show: false, projectId: null });

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const response = await apiClient.get('analytics/');
            setStats(response.data.global_stats);
            setProjectsData(response.data.projects_data);
        } catch (error) {
            console.error('Failed to fetch analytics', error);
        } finally {
            setLoading(false);
        }
    };

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
    };

    const initiateDelete = (projectId) => {
        setConfirmModal({ show: true, projectId });
    };

    const handleDeleteProject = async () => {
        const projectId = confirmModal.projectId;
        setConfirmModal({ show: false, projectId: null });

        try {
            await apiClient.delete(`projects/${projectId}/`);
            setProjectsData(projectsData.filter(p => p.project.id !== projectId));
            showToast('Project deleted successfully', 'success');
        } catch (error) {
            console.error('Failed to delete project', error);
            showToast('Failed to delete project. Ensure it has no dependencies or try again.', 'error');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in flex flex-col relative">
            {toast.show && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast({ ...toast, show: false })}
                />
            )}

            <ConfirmModal
                isOpen={confirmModal.show}
                title="Delete Project?"
                message="Are you sure you want to delete this project? This action cannot be undone and will delete all associated tasks."
                confirmText="Delete Project"
                cancelText="Cancel"
                isDangerous={true}
                onConfirm={handleDeleteProject}
                onCancel={() => setConfirmModal({ show: false, projectId: null })}
            />

            {/* Header */}
            <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 shrink-0">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 tracking-tight mb-1">
                        Projects & Analytics
                    </h2>
                    <p className="text-sm sm:text-base text-gray-400 font-medium">Manage your workspaces and track performance</p>
                </div>
                {user?.is_superuser && (
                    <NavLink
                        to="/projects/new"
                        className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2"
                    >
                        <i className="fas fa-plus"></i>
                        <span>New Project</span>
                    </NavLink>
                )}
            </div>

            {/* Global Summary Section */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col items-center text-center">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
                        <i className="fas fa-layer-group"></i>
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Projects</div>
                    <div className="text-xl font-black text-gray-800">{stats?.total_projects || 0}</div>
                </div>

                <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col items-center text-center">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
                        <i className="fas fa-list-check"></i>
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Tasks</div>
                    <div className="text-xl font-black text-gray-800">{stats?.total_tasks || 0}</div>
                </div>

                <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col items-center text-center group">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-3 group-hover:rotate-12 transition-transform">
                        <i className="fas fa-spinner"></i>
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Progress</div>
                    <div className="text-xl font-black text-emerald-600">{stats?.progress || 0}%</div>
                </div>

                <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col items-center text-center">
                    <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mb-3">
                        <i className="fas fa-triangle-exclamation"></i>
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Overdue</div>
                    <div className="text-xl font-black text-red-600">{stats?.overdue_tasks || 0}</div>
                </div>
            </div>

            {/* Export Reports Section */}
            <div className="mb-8">
                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-6 sm:p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50"></div>

                    <div className="relative flex flex-col lg:flex-row items-center justify-between gap-8">
                        <div className="flex-1 text-center lg:text-left">
                            <div className="flex items-center justify-center lg:justify-start gap-3 mb-2">
                                <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white text-sm shadow-md shadow-emerald-200">
                                    <i className="fas fa-file-pdf"></i>
                                </div>
                                <h2 className="text-xl font-black text-gray-800 tracking-tight uppercase">Work Reports</h2>
                            </div>
                            <p className="text-sm text-gray-400 font-medium">Generate and download a detailed PDF report of your past completed works.</p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                            {/* Range Selection */}
                            <div className="flex items-center bg-gray-50 p-1.5 rounded-2xl border border-gray-100 w-full sm:w-auto gap-2">
                                <div className="flex">
                                    {[7, 15, 30].map(days => (
                                        <button
                                            key={days}
                                            onClick={() => setReportDays(days)}
                                            className={`px-3 sm:px-4 py-2 rounded-xl text-[10px] sm:text-xs font-black transition-all ${reportDays === days
                                                ? 'bg-white text-emerald-600 shadow-sm'
                                                : 'text-gray-400 hover:text-gray-600'
                                                }`}
                                        >
                                            {days}D
                                        </button>
                                    ))}
                                </div>
                                <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>
                                <div className="flex items-center gap-1.5 px-2">
                                    <input
                                        type="number"
                                        placeholder="Custom"
                                        className="w-14 bg-transparent text-xs font-black text-emerald-600 placeholder:text-gray-300 focus:outline-none text-center"
                                        onChange={(e) => setReportDays(e.target.value)}
                                    />
                                    <span className="text-[10px] font-black text-gray-400">D</span>
                                </div>
                            </div>

                            {/* Generate Button */}
                            <a
                                href={`${apiClient.defaults.baseURL}export/past-work-pdf/?days=${reportDays}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full sm:w-auto px-8 py-3.5 bg-gray-900 hover:bg-black text-white font-black rounded-2xl shadow-xl shadow-gray-100 transition-all flex items-center justify-center gap-2 tracking-tight uppercase text-xs"
                            >
                                <i className="fas fa-download text-[10px]"></i>
                                <span>Generate PDF</span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                <th className="px-8 py-5">Project</th>
                                <th className="px-6 py-5">Team</th>
                                <th className="px-6 py-5">Progress</th>
                                <th className="px-6 py-5">Task Summary</th>
                                <th className="px-6 py-5 text-right">Performance</th>
                                <th className="px-8 py-5 w-24"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {projectsData.map((p, idx) => (
                                <tr key={p.project.id} className="group hover:bg-gray-50/80 transition-colors animate-slide-in" style={{ animationDelay: `${idx * 0.05}s` }}>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div
                                                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-sm shrink-0"
                                                style={{ backgroundColor: `${p.project.color}15`, color: p.project.color }}
                                            >
                                                <i className="fas fa-folder-open"></i>
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-bold text-gray-800 leading-tight">{p.project.name}</h3>
                                                <p className="text-[11px] text-gray-400 font-medium truncate max-w-[180px]">
                                                    {p.project.description || "Active Project"}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex -space-x-1.5">
                                            {p.collaborators?.slice(0, 4).map(collab => (
                                                <div key={collab.id} className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600 shadow-sm" title={collab.name}>
                                                    {collab.name[0]}
                                                </div>
                                            ))}
                                            {p.collaborators?.length > 4 && (
                                                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] font-bold shadow-sm">
                                                    +{p.collaborators.length - 4}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-700"
                                                    style={{ width: `${p.project.progress_percent}%`, backgroundColor: p.project.color }}
                                                ></div>
                                            </div>
                                            <span className="text-xs font-black text-gray-700 w-10 text-right">{p.project.progress_percent}%</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-xs font-bold">
                                        <div className="flex items-center gap-2">
                                            <span className="text-emerald-600">{p.completed_count} Done</span>
                                            <span className="text-gray-300">/</span>
                                            <span className="text-amber-600">{p.pending_count} Wait</span>
                                            {p.overdue_count > 0 && (
                                                <>
                                                    <span className="text-gray-300">/</span>
                                                    <span className="text-red-600">{p.overdue_count} Late</span>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${p.performance === 'High' ? 'bg-emerald-100 text-emerald-600' :
                                            p.performance === 'Medium' ? 'bg-amber-100 text-amber-600' :
                                                'bg-red-100 text-red-600'
                                            }`}>
                                            {p.performance}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        {user?.is_superuser && (
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <NavLink
                                                    to={`/projects/${p.project.id}/edit`}
                                                    className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                                                    title="Edit Project"
                                                >
                                                    <i className="fas fa-pen text-xs"></i>
                                                </NavLink>
                                                <button
                                                    onClick={() => initiateDelete(p.project.id)}
                                                    className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                    title="Delete Project"
                                                >
                                                    <i className="fas fa-trash-alt text-xs"></i>
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile/Tablet Grid View */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:hidden gap-6">
                {projectsData.map(p => (
                    <div key={p.project.id} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 relative overflow-hidden group hover:shadow-md transition-all">
                        <div className="absolute top-0 left-0 w-full h-1.5" style={{ backgroundColor: p.project.color }}></div>
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-sm shrink-0"
                                    style={{ backgroundColor: `${p.project.color}15`, color: p.project.color }}
                                >
                                    <i className="fas fa-folder-open"></i>
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800 leading-tight">{p.project.name}</h3>
                                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider mt-1 ${p.performance === 'High' ? 'bg-emerald-50 text-emerald-600' :
                                        p.performance === 'Medium' ? 'bg-amber-50 text-amber-600' :
                                            'bg-red-50 text-red-600'
                                        }`}>
                                        {p.performance}
                                    </span>
                                </div>
                            </div>
                            {/* Mobile Actions */}
                            {user?.is_superuser && (
                                <div className="flex gap-1">
                                    <NavLink
                                        to={`/projects/${p.project.id}/edit`}
                                        className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-gray-400 hover:text-emerald-600 active:bg-emerald-50 transition-colors"
                                    >
                                        <i className="fas fa-pen text-xs"></i>
                                    </NavLink>
                                    <button
                                        onClick={() => initiateDelete(p.project.id)}
                                        className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 active:bg-red-50 transition-colors"
                                    >
                                        <i className="fas fa-trash-alt text-xs"></i>
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="mb-5">
                            <div className="flex items-center justify-between text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-tighter">
                                <span>Completion</span>
                                <span className="text-gray-800">{p.project.progress_percent}%</span>
                            </div>
                            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-700"
                                    style={{ width: `${p.project.progress_percent}%`, backgroundColor: p.project.color }}
                                ></div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mb-5">
                            <div className="bg-emerald-50/50 border border-emerald-50 rounded-2xl p-2.5 text-center">
                                <div className="text-[10px] font-black text-emerald-600/70 uppercase mb-0.5 tracking-widest">Done</div>
                                <div className="text-sm font-black text-emerald-700">{p.completed_count}</div>
                            </div>
                            <div className="bg-amber-50/50 border border-amber-50 rounded-2xl p-2.5 text-center">
                                <div className="text-[10px] font-black text-amber-600/70 uppercase mb-0.5 tracking-widest">Wait</div>
                                <div className="text-sm font-black text-amber-700">{p.pending_count}</div>
                            </div>
                            <div className="bg-red-50/50 border border-red-50 rounded-2xl p-2.5 text-center">
                                <div className="text-[10px] font-black text-red-600/70 uppercase mb-0.5 tracking-widest">Late</div>
                                <div className="text-sm font-black text-red-700">{p.overdue_count}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <style>{`
                @keyframes slide-in {
                    from { opacity: 0; transform: translateX(-20px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                .animate-slide-in {
                    animation: slide-in 0.3s ease-out backwards;
                }
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.4s ease-out;
                }
            `}</style>
        </div>
    );
};

export default ProjectAnalytics;

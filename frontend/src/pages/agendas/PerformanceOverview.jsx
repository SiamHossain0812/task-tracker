import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { collaboratorService } from '../../api/collaborators';
import { toast } from 'react-hot-toast';

const PerformanceOverview = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [collaborators, setCollaborators] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        teamAverage: 0,
        topPerformer: null,
        totalTasks: 0
    });

    const getPerformanceCategory = (score) => {
        if (score >= 85) return { label: 'Excellent', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' };
        if (score >= 70) return { label: 'Good', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' };
        if (score >= 50) return { label: 'Average', color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' };
        return { label: 'Critical', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' };
    };

    useEffect(() => {
        if (!user?.is_superuser) {
            toast.error("Unauthorized Access restricted to administrators.");
            navigate('/');
            return;
        }

        const fetchAllPerformance = async () => {
            try {
                const teamResponse = await collaboratorService.getAll();
                const teamData = teamResponse.data;
                
                const performancePromises = teamData.map(c => 
                    collaboratorService.getPerformance(c.id)
                        .then(res => ({ ...c, performance: res.data }))
                        .catch(() => ({ ...c, performance: null }))
                );

                const updatedTeam = await Promise.all(performancePromises);
                const filteredTeam = updatedTeam.filter(c => c.performance !== null);

                setCollaborators(filteredTeam);

                if (filteredTeam.length > 0) {
                    const avg = filteredTeam.reduce((acc, curr) => acc + curr.performance.composite_score, 0) / filteredTeam.length;
                    const top = [...filteredTeam].sort((a, b) => b.performance.composite_score - a.performance.composite_score)[0];
                    const tasks = filteredTeam.reduce((acc, curr) => acc + curr.performance.tasks_count, 0);

                    setStats({
                        teamAverage: Math.round(avg),
                        topPerformer: top,
                        totalTasks: tasks
                    });
                }
            } catch (error) {
                console.error("Failed to fetch performance overview", error);
                toast.error("Communication error with analytics server.");
            } finally {
                setLoading(false);
            }
        };

        fetchAllPerformance();
    }, [user, navigate]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">Loading Analytics Intelligence...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-24 pt-12 font-sans selection:bg-indigo-100">
            <div className="max-w-7xl mx-auto px-6 lg:px-12">
                
                {/* 1. Dashboard Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-1 h-6 bg-indigo-600 rounded-full"></div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600/60">Administrative Management</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 tracking-tight mb-1">
                            Team Performance Analytics
                        </h1>
                        <p className="text-sm sm:text-base text-gray-400 font-medium leading-relaxed">
                            A comprehensive overview of collaborator efficacy, quality metrics, and task-based reliability data.
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="px-6 py-4 bg-white rounded-2xl border border-slate-100 shadow-sm text-right min-w-[140px]">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Team Health</div>
                            <div className="flex items-center justify-end gap-2">
                                <span className="text-2xl font-black text-slate-900">{stats.teamAverage}%</span>
                                <div className={`w-2.5 h-2.5 rounded-full ${stats.teamAverage > 70 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]'}`}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. KPI Summary Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
                    <div className="md:col-span-2 p-8 bg-slate-900 rounded-[2.5rem] text-white shadow-2xl shadow-slate-200 relative overflow-hidden group">
                        <div className="absolute right-0 bottom-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mb-32"></div>
                        <div className="relative z-10 flex flex-col h-full justify-between">
                            <div className="flex items-center justify-between mb-8">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300">Quarterly Leader</span>
                                <i className="fas fa-crown text-amber-400 text-lg"></i>
                            </div>
                            <div>
                                <h3 className="text-xs font-medium text-slate-400 mb-1">Top Contributor</h3>
                                <div className="text-2xl font-black tracking-tight mb-2">{stats.topPerformer?.name || '---'}</div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full border border-white/5">
                                        <span className="text-[9px] font-black text-indigo-200 uppercase tracking-widest">{stats.topPerformer?.performance?.composite_score} points</span>
                                    </div>
                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Efficiency: 98%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-indigo-100 transition-colors">
                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                            <i className="fas fa-layer-group text-base"></i>
                        </div>
                        <div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Analyzed Datasets</div>
                            <div className="text-3xl font-black text-slate-900 tracking-tight">{stats.totalTasks}</div>
                            <div className="text-[9px] text-slate-300 font-bold uppercase mt-1">Total Assignments</div>
                        </div>
                    </div>

                    <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-emerald-100 transition-colors">
                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-all text-base">
                            <i className="fas fa-microscope text-base"></i>
                        </div>
                        <div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Research</div>
                            <div className="text-3xl font-black text-slate-900 tracking-tight">{collaborators.length}</div>
                            <div className="text-[9px] text-slate-300 font-bold uppercase mt-1">Team Members</div>
                        </div>
                    </div>
                </div>

                {/* 3. Performance Record Table */}
                <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
                    <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                        <h2 className="font-black text-slate-900 uppercase tracking-widest text-xs">Collaborator Efficiency Index</h2>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Ranking</span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50">
                                    <th className="px-10 py-6">Member Identity</th>
                                    <th className="px-6 py-6 text-center">Efficiency</th>
                                    <th className="px-6 py-6 text-center">Quality</th>
                                    <th className="px-6 py-6 text-center">Reliability</th>
                                    <th className="px-6 py-6 text-center">Composite (OPS)</th>
                                    <th className="px-6 py-6 text-center">Category Status</th>
                                    <th className="pr-10 py-6 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {collaborators.map((c) => {
                                    const cat = getPerformanceCategory(c.performance.composite_score);
                                    return (
                                        <tr key={c.id} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="px-10 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-slate-100 shrink-0 overflow-hidden border-2 border-white shadow-sm transition-transform group-hover:scale-105">
                                                        {c.image ? <img src={c.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-black text-slate-400 uppercase">{c.name[0]}</div>}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">{c.name}</div>
                                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{c.designation || 'Collaborator'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 text-center">
                                                <div className="flex items-center justify-center gap-3">
                                                    <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-indigo-500" style={{ width: `${c.performance.efficiency}%` }}></div>
                                                    </div>
                                                    <span className="text-xs font-black text-slate-900">{c.performance.efficiency}%</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 text-center">
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black border border-emerald-100">
                                                    {Math.round(c.performance.quality/20)} Stars
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 text-center">
                                                <span className="text-xs font-black text-slate-600">{c.performance.reliability}</span>
                                            </td>
                                            <td className="px-6 py-6 text-center">
                                                <span className="text-2xl font-black text-slate-900">{c.performance.composite_score}</span>
                                            </td>
                                            <td className="px-6 py-6 text-center">
                                                <div className={`inline-flex px-3 py-1 rounded-full border ${cat.bg} ${cat.color} ${cat.border} text-[10px] font-black uppercase tracking-widest`}>
                                                    {cat.label}
                                                </div>
                                            </td>
                                            <td className="pr-10 py-6 text-right">
                                                <Link 
                                                    to={`/profile/${c.id}`} 
                                                    className="inline-flex h-10 px-6 items-center justify-center bg-white border border-slate-200 text-slate-900 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all"
                                                >
                                                    Analysis
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PerformanceOverview;

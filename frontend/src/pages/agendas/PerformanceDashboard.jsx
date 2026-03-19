import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { collaboratorService } from '../../api/collaborators';

const PerformanceDashboard = () => {
    const { id } = useParams(); // Collaborator ID
    const navigate = useNavigate();
    const { user } = useAuth();
    
    // Fallback ID if not provided in URL
    const targetId = id || user?.collaborator_id;

    const [performanceData, setPerformanceData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Redirection for non-admins
        if (!user?.is_superuser) {
            toast.error("Access Denied: Performance metrics are for Admin review only.");
            navigate('/');
            return;
        }

        if (!targetId) {
            setError("No collaborator profile found.");
            setLoading(false);
            return;
        }

        const fetchPerformance = async () => {
            try {
                const res = await collaboratorService.getPerformance(targetId);
                setPerformanceData(res.data);
            } catch (err) {
                console.error("Failed to fetch performance stats:", err);
                setError("Could not load performance metrics.");
            } finally {
                setLoading(false);
            }
        };

        fetchPerformance();
    }, [targetId]);


    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
    );

    if (error || !performanceData) return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center text-gray-500">
            <i className="fas fa-chart-bar text-4xl mb-4 text-gray-300"></i>
            <h2 className="text-xl font-bold mb-2">Unavailable</h2>
            <p>{error || "Performance data is not yet available."}</p>
        </div>
    );

    // Format Data for Radar Chart
    const radarData = [
        { subject: 'Quality', A: performanceData.quality, fullMark: 100 },
        { subject: 'Timeliness', A: performanceData.timeliness, fullMark: 100 },
        { subject: 'Efficiency', A: performanceData.efficiency, fullMark: 100 },
        { subject: 'Reliability', A: performanceData.reliability, fullMark: 100 },
    ];

    // Get Performance Category based on score
    const getPerformanceCategory = (score) => {
        if (score >= 85) return { label: 'Excellent', icon: '⭐', color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100' };
        if (score >= 70) return { label: 'Good', icon: '👍', color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100' };
        if (score >= 50) return { label: 'Average', icon: '⚠️', color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-100' };
        return { label: 'Needs Improvement', icon: '🚨', color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100' };
    };

    const category = getPerformanceCategory(performanceData.composite_score);

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 pt-8 animate-fade-in relative overflow-hidden">
            {/* Ambient Backgrounds */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-50 rounded-full blur-3xl -mr-40 -mt-40 pointer-events-none opacity-60"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-50 rounded-full blur-3xl -ml-40 -mb-40 pointer-events-none opacity-60"></div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* 1. Header Navigation */}
                <div className="flex items-center justify-between mb-8">
                    <button 
                        onClick={() => navigate(-1)} 
                        className="flex items-center text-sm font-bold text-gray-400 hover:text-gray-900 transition-colors group"
                    >
                        <i className="fas fa-arrow-left mr-2 transition-transform group-hover:-translate-x-1"></i>
                        Back
                    </button>
                </div>

                {/* 2. Hero Section */}
                <div className="mb-8 p-8 rounded-3xl bg-white border border-gray-100 shadow-xl shadow-gray-200/40 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-indigo-50 to-transparent pointer-events-none"></div>
                    
                    <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 font-bold text-xs uppercase tracking-widest rounded-full">
                                Performance Overview
                            </span>
                            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${category.bg} ${category.color} ${category.border} text-xs font-bold animate-pulse`}>
                                <span>{category.icon}</span>
                                <span>{category.label}</span>
                            </div>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 tracking-tight mb-1">
                            {performanceData.collaborator_name}
                        </h1>
                        <p className="text-sm sm:text-base text-gray-400 font-medium">Aggregated metrics based on completed tasks.</p>
                    </div>

                    <div className="flex items-center justify-center p-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-200 text-white min-w-[160px] text-center transform hover:scale-105 transition-transform duration-300">
                        <div>
                            <div className="text-[10px] uppercase tracking-widest font-bold text-indigo-100 mb-1">Composite Score</div>
                            <div className="text-3xl font-black">{performanceData.composite_score}</div>
                            <div className="text-[10px] text-indigo-200 font-medium mt-1 uppercase tracking-widest">Score</div>
                        </div>
                    </div>
                </div>

                {/* 3. Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left Panel: Radar Chart */}
                    <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex flex-col justify-between">
                        <div>
                            <h3 className="text-base font-bold text-gray-900 uppercase tracking-wider">Dimension Analysis</h3>
                            <p className="text-[10px] text-gray-500 font-medium mt-1">Visual breakdown of the 4 KPI pillars</p>
                        </div>
                        
                        <div className="h-[360px] w-full mt-4 flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                    <PolarGrid stroke="#f3f4f6" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#4b5563', fontSize: 10, fontWeight: 700 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 9 }} />
                                    <Radar name={performanceData.collaborator_name} dataKey="A" stroke="#4f46e5" strokeWidth={3} fill="#6366f1" fillOpacity={0.4} />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 'bold', fontSize: '10px' }}
                                        itemStyle={{ color: '#4f46e5' }}
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Right Panel: Metric Cards */}
                    <div className="flex flex-col gap-4">
                        
                        {/* Task Completion Stats */}
                        <div className="bg-gray-900 rounded-3xl p-6 text-white relative overflow-hidden h-28 flex items-center">
                            <i className="fas fa-check-double absolute -right-4 -bottom-4 text-6xl text-gray-800 opacity-50 transform rotate-12"></i>
                            <div className="relative z-10">
                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Completed Tasks</h4>
                                <div className="text-3xl font-black text-white">{performanceData.total_completed_tasks}</div>
                            </div>
                        </div>

                        {/* Card 1: Quality */}
                        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-1.5 h-full bg-amber-400"></div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center text-sm">
                                    <i className="fas fa-star"></i>
                                </div>
                                <div className="text-xl font-black text-gray-900 group-hover:scale-110 transition-transform origin-right">{performanceData.quality}</div>
                            </div>
                            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-tight">Quality</h4>
                        </div>

                        {/* Card 2: Timeliness */}
                        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-1.5 h-full bg-emerald-400"></div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center text-sm">
                                    <i className="fas fa-stopwatch"></i>
                                </div>
                                <div className="text-xl font-black text-gray-900 group-hover:scale-110 transition-transform origin-right">{performanceData.timeliness}</div>
                            </div>
                            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-tight">Timeliness</h4>
                        </div>

                        {/* Card 3: Efficiency */}
                        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-1.5 h-full bg-blue-400"></div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center text-sm">
                                    <i className="fas fa-bolt"></i>
                                </div>
                                <div className="text-xl font-black text-gray-900 group-hover:scale-110 transition-transform origin-right">{performanceData.efficiency}</div>
                            </div>
                            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-tight">Efficiency</h4>
                        </div>

                        {/* Card 4: Reliability */}
                        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-1.5 h-full bg-purple-400"></div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-500 flex items-center justify-center text-sm">
                                    <i className="fas fa-shield-alt"></i>
                                </div>
                                <div className="text-xl font-black text-gray-900 group-hover:scale-110 transition-transform origin-right">{performanceData.reliability}</div>
                            </div>
                            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-tight">Reliability</h4>
                        </div>
                    </div>

                </div>
            </div>
            
            <style>{`
                @keyframes fade-in { 
                    from { opacity: 0; transform: translateY(15px); } 
                    to { opacity: 1; transform: translateY(0); } 
                }
                .animate-fade-in { 
                    animation: fade-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; 
                }
            `}</style>
        </div>
    );
};

export default PerformanceDashboard;

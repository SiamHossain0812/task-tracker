import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import scheduleApi from '../api/schedules';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import ScheduleForm from '../components/schedules/ScheduleForm';

const SchedulesPage = () => {
    const { user } = useAuth();
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [filtering, setFiltering] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState(null);
    const [filter, setFilter] = useState('today'); // 'today', 'week', 'all'
    const [nextPage, setNextPage] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (user && !user.is_superuser) {
            toast.error('Access Denied: Superadmin only');
            navigate('/');
        }
    }, [user, navigate]);

    const fetchSchedules = async (isLoadMore = false, isFilterChange = false) => {
        if (isLoadMore) setLoadingMore(true);
        else if (isFilterChange) setFiltering(true);
        else setLoading(true);

        try {
            const params = { filter: filter !== 'all' ? filter : undefined };
            let response;

            if (isLoadMore && nextPage) {
                const url = new URL(nextPage);
                const pageNum = url.searchParams.get('page');
                response = await scheduleApi.list({ ...params, page: pageNum });
            } else {
                response = await scheduleApi.list(params);
            }

            const newSchedules = response.data.results || response.data;
            const next = response.data.next;

            if (isLoadMore) {
                setSchedules(prev => [...prev, ...newSchedules]);
            } else {
                setSchedules(newSchedules);
            }
            setNextPage(next);
        } catch (err) {
            console.error('Failed to fetch schedules', err);
            toast.error('Failed to load schedules');
        } finally {
            setLoading(false);
            setLoadingMore(false);
            setFiltering(false);
        }
    };

    useEffect(() => {
        fetchSchedules(false, true);
    }, [filter]);

    const handleToggleStatus = async (id) => {
        try {
            await scheduleApi.toggleStatus(id);
            setSchedules(prev => prev.map(item =>
                item.id === id ? { ...item, status: item.status === 'done' ? 'undone' : 'done' } : item
            ));
            toast.success('Status updated');
        } catch (err) {
            toast.error('Failed to update status');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this schedule?')) return;
        try {
            await scheduleApi.delete(id);
            setSchedules(prev => prev.filter(item => item.id !== id));
            toast.success('Schedule deleted');
        } catch (err) {
            toast.error('Failed to delete schedule');
        }
    };

    if (loading && schedules.length === 0) return (
        <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
        </div>
    );

    return (
        <div className="animate-fade-in pb-20 md:pb-8 w-full">
            <div className="mb-8 flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800 tracking-tight mb-2">My Schedule</h2>
                    <p className="text-gray-400 font-medium font-outfit">Your private time-blocks and personal plans</p>
                </div>

                <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                    <div className="flex bg-gray-100/80 p-1 rounded-2xl border border-gray-200 shadow-inner">
                        {[
                            { id: 'today', label: 'Today' },
                            { id: 'week', label: 'This Week' },
                            { id: 'all', label: 'All Time' }
                        ].map(f => (
                            <button
                                key={f.id}
                                type="button"
                                onClick={(e) => { e.preventDefault(); setFilter(f.id); }}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${filter === f.id
                                    ? 'bg-white text-emerald-600 shadow-md transform scale-105'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => { setEditingSchedule(null); setShowForm(true); }}
                        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-xl shadow-emerald-100 transition-all flex items-center gap-2 ml-auto lg:ml-0 active:scale-95"
                    >
                        <i className="fas fa-plus"></i>
                        <span>New Schedule</span>
                    </button>
                </div>
            </div>

            <div className={`relative bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-50/50 overflow-hidden transition-opacity duration-300 ${filtering ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                {filtering && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/30 backdrop-blur-[1px]">
                        <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                <th className="px-8 py-6 w-20 text-center font-bold">SL</th>
                                <th className="px-6 py-6 font-black tracking-wider">Subject & Details</th>
                                <th className="px-6 py-6 font-black tracking-wider text-center">Date</th>
                                <th className="px-6 py-6 font-black tracking-wider text-center">Time Block</th>
                                <th className="px-6 py-6 font-black tracking-wider text-center">Status</th>
                                <th className="px-6 py-6 text-right pr-10 font-black tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 font-medium">
                            {schedules.length > 0 ? schedules.map((item, index) => (
                                <tr key={item.id} className="group hover:bg-emerald-50/30 transition-colors">
                                    <td className="px-8 py-5 text-center text-gray-300 font-bold text-xs">
                                        {(index + 1).toString().padStart(2, '0')}
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col gap-0.5">
                                            <span className={`text-sm font-bold ${item.status === 'done' ? 'text-gray-400 line-through decoration-2' : 'text-gray-900 group-hover:text-emerald-600 transition-colors'}`}>
                                                {item.subject}
                                            </span>
                                            {item.description && (
                                                <span className="text-[11px] text-gray-400 leading-relaxed max-w-sm line-clamp-1 italic font-normal">
                                                    {item.description}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-sm font-semibold text-gray-500 text-center">
                                        <div className="inline-flex items-center gap-2">
                                            <i className="far fa-calendar-alt text-[10px] opacity-40"></i>
                                            {new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <span className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl text-[11px] font-black border border-emerald-100 shadow-sm inline-flex items-center gap-2">
                                            <i className="far fa-clock opacity-60"></i>
                                            {item.start_time.substring(0, 5)} - {item.end_time.substring(0, 5)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <button
                                            onClick={() => handleToggleStatus(item.id)}
                                            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all hover:scale-105 active:scale-95 ${item.status === 'done'
                                                ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-100'
                                                : 'bg-amber-100 text-amber-700 border-amber-200 shadow-sm shadow-amber-50'
                                                }`}
                                        >
                                            {item.status}
                                        </button>
                                    </td>
                                    <td className="px-6 py-5 text-right pr-10">
                                        <div className="flex items-center justify-end gap-2 opactiy-0 group-hover:opacity-100 transition-opacity">
                                            {item.status === 'undone' && (
                                                <button
                                                    onClick={() => { setEditingSchedule(item); setShowForm(true); }}
                                                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-gray-400 hover:text-emerald-600 hover:bg-white hover:shadow-lg border border-transparent hover:border-emerald-50 transition-all active:scale-90"
                                                    title="Reschedule / Edit"
                                                >
                                                    <i className="fas fa-edit text-sm"></i>
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="w-10 h-10 rounded-2xl flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-white hover:shadow-lg border border-transparent hover:border-red-50 transition-all active:scale-90"
                                            >
                                                <i className="fas fa-trash-alt text-sm"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : !filtering && (
                                <tr>
                                    <td colSpan="6" className="px-6 py-24 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-200 text-2xl mb-2">
                                                <i className="fas fa-calendar-times"></i>
                                            </div>
                                            <p className="text-gray-400 font-bold italic">No schedules found for this filter.</p>
                                            {filter !== 'all' && (
                                                <button onClick={() => setFilter('all')} className="text-emerald-600 text-xs font-black underline underline-offset-4">
                                                    Show All Schedules
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Load More Smart Button */}
                {nextPage && (
                    <div className="p-8 flex justify-center border-t border-gray-50 bg-gray-50/30">
                        <button
                            onClick={() => fetchSchedules(true)}
                            disabled={loadingMore}
                            className={`group relative px-10 py-4 bg-white border border-gray-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-600 hover:text-emerald-600 hover:border-emerald-100 hover:shadow-xl transition-all active:scale-95 ${loadingMore ? 'cursor-wait' : ''}`}
                        >
                            {loadingMore ? (
                                <div className="flex items-center gap-3">
                                    <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                                    <span>Syncing...</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <span>Load More Records</span>
                                    <i className="fas fa-chevron-down text-[10px] group-hover:translate-y-0.5 transition-transform"></i>
                                </div>
                            )}
                        </button>
                    </div>
                )}
            </div>

            {showForm && (
                <ScheduleForm
                    schedule={editingSchedule}
                    onClose={() => setShowForm(false)}
                    onSuccess={() => { setShowForm(false); fetchSchedules(); }}
                />
            )}

            <style>{`
                @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fade-in 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
                .line-clamp-1 { display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
            `}</style>
        </div>
    );
};

export default SchedulesPage;

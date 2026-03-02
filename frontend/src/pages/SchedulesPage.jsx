import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import scheduleApi from '../api/schedules';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import ScheduleForm from '../components/schedules/ScheduleForm';

const SchedulesPage = () => {
    const { user } = useAuth();
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState(null);
    const [reschedulingItem, setReschedulingItem] = useState(null);

    const fetchSchedules = async () => {
        try {
            const response = await scheduleApi.list();
            setSchedules(response.data);
        } catch (err) {
            console.error('Failed to fetch schedules', err);
            toast.error('Failed to load schedules');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSchedules();
    }, []);

    const handleToggleStatus = async (id) => {
        try {
            await scheduleApi.toggleStatus(id);
            fetchSchedules();
            toast.success('Status updated');
        } catch (err) {
            toast.error('Failed to update status');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this schedule?')) return;
        try {
            await scheduleApi.delete(id);
            fetchSchedules();
            toast.success('Schedule deleted');
        } catch (err) {
            toast.error('Failed to delete schedule');
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
    );

    return (
        <div className="animate-fade-in pb-20 md:pb-8 w-full">
            <div className="mb-8 flex flex-col sm:flex-row items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800 tracking-tight mb-1">My Schedule</h2>
                    <p className="text-gray-400 font-medium">Your private time-blocks and personal plans</p>
                </div>
                <button
                    onClick={() => { setEditingSchedule(null); setShowForm(true); }}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center gap-2"
                >
                    <i className="fas fa-plus"></i>
                    <span>New Schedule</span>
                </button>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-bold uppercase tracking-wider text-gray-400">
                                <th className="px-6 py-4 w-16 text-center">SL</th>
                                <th className="px-6 py-4">Subject</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Time Range</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right pr-8">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 font-medium">
                            {schedules.length > 0 ? schedules.map((item, index) => (
                                <tr key={item.id} className="group hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-center text-gray-400 text-sm">
                                        {index + 1}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className={`text-sm font-bold ${item.status === 'done' ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                                {item.subject}
                                            </span>
                                            {item.description && <span className="text-[10px] text-gray-400 truncate max-w-xs">{item.description}</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {item.date}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg text-xs font-bold">
                                            {item.start_time.substring(0, 5)} - {item.end_time.substring(0, 5)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => handleToggleStatus(item.id)}
                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${item.status === 'done'
                                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                    : 'bg-amber-50 text-amber-600 border border-amber-100'
                                                }`}
                                        >
                                            {item.status}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-right pr-8">
                                        <div className="flex items-center justify-end gap-1">
                                            {item.status === 'undone' && (
                                                <button
                                                    onClick={() => { setEditingSchedule(item); setShowForm(true); }}
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                                                    title="Reschedule / Edit"
                                                >
                                                    <i className="fas fa-calendar-alt text-xs"></i>
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                                            >
                                                <i className="fas fa-trash text-xs"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-400 italic">
                                        No schedules found. Create your first one!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showForm && (
                <ScheduleForm
                    schedule={editingSchedule}
                    onClose={() => setShowForm(false)}
                    onSuccess={() => { setShowForm(false); fetchSchedules(); }}
                />
            )}

            <style>{`
                @keyframes fade-in { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fade-in 0.3s ease-out; }
            `}</style>
        </div>
    );
};

export default SchedulesPage;

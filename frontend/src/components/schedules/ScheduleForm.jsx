import React, { useState, useEffect } from 'react';
import scheduleApi from '../../api/schedules';
import { toast } from 'react-hot-toast';

const ScheduleForm = ({ schedule, onClose, onSuccess }) => {
    const isEdit = !!schedule;
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        subject: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        start_time: '',
        end_time: '',
        place: '',
        remarks: '',
        status: 'undone'
    });

    useEffect(() => {
        if (schedule) {
            setFormData({
                subject: schedule.subject || '',
                description: schedule.description || '',
                date: schedule.date || '',
                start_time: schedule.start_time ? schedule.start_time.substring(0, 5) : '',
                end_time: schedule.end_time ? schedule.end_time.substring(0, 5) : '',
                place: schedule.place || '',
                remarks: schedule.remarks || '',
                status: schedule.status || 'undone'
            });
        }
    }, [schedule]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isEdit) {
                // If it's an edit, we can use either patch or the dedicated reschedule action
                // For simplicity and to reset is_notified, we'll use a mix or the reschedule endpoint if time changed.
                await scheduleApi.update(schedule.id, formData);
                toast.success('Schedule updated');
            } else {
                await scheduleApi.create(formData);
                toast.success('Schedule created');
            }
            onSuccess();
        } catch (err) {
            console.error('Save failed', err);
            toast.error(err.response?.data?.error || 'Failed to save schedule');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative transform overflow-hidden rounded-3xl bg-white shadow-2xl transition-all sm:max-w-lg w-full z-10 animate-scale-in">
                <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h3 className="text-xl font-bold text-gray-800">
                        {isEdit ? 'Reschedule item' : 'New Schedule'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <i className="fas fa-times text-xl"></i>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Subject *</label>
                            <input
                                type="text"
                                required
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-sm"
                                placeholder="What's the plan?"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Place</label>
                            <input
                                type="text"
                                value={formData.place}
                                onChange={(e) => setFormData({ ...formData, place: e.target.value })}
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-sm"
                                placeholder="Where?"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium h-16 resize-none text-sm"
                                placeholder="Add details..."
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Remarks</label>
                            <textarea
                                value={formData.remarks}
                                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium h-16 resize-none text-sm"
                                placeholder="Any remarks..."
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Date *</label>
                            <input
                                type="date"
                                required
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Start *</label>
                            <input
                                type="time"
                                required
                                value={formData.start_time}
                                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">End *</label>
                            <input
                                type="time"
                                required
                                value={formData.end_time}
                                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-sm"
                            />
                        </div>
                    </div>

                    <div className="pt-2 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 bg-gray-50 hover:bg-gray-100 text-gray-500 font-bold rounded-2xl transition-all text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-[2] px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-100 transition-all disabled:opacity-50 text-sm"
                        >
                            {loading ? <i className="fas fa-spinner fa-spin mr-2"></i> : null}
                            {isEdit ? 'Save Changes' : 'Create Schedule'}
                        </button>
                    </div>
                </form>
            </div>
            <style>{`
                @keyframes scale-in { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                .animate-scale-in { animation: scale-in 0.2s ease-out; }
            `}</style>
        </div>
    );
};

export default ScheduleForm;

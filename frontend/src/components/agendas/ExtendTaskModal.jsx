import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import apiClient from '../../api/client';
import { toast } from 'react-hot-toast';

const ExtendTaskModal = ({ task, isOpen, onClose, onUpdate, isApprover }) => {
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);

    const isRequest = !isApprover;
    const themeColor = isRequest ? 'blue' : 'amber';
    const ThemeIcon = isRequest ? 'fa-paper-plane' : 'fa-hourglass-half';

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = { date };
            if (time) payload.time = time;
            if (isRequest) payload.reason = reason;

            await apiClient.post(`agendas/${task.id}/extend-time/`, payload);
            toast.success(isRequest ? 'Extension request submitted' : 'Task time extended successfully');
            onUpdate(); // Refresh parent data
            onClose();
        } catch (error) {
            console.error('Extension failed', error);
            const msg = error.response?.data?.error || 'Failed to process request';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden ring-1 ring-black/5">
                {/* Header */}
                <div className={`px-6 py-5 border-b border-gray-100 flex items-center justify-between ${isRequest ? 'bg-blue-50/50' : 'bg-amber-50/50'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${isRequest ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
                            <i className={`fas ${ThemeIcon}`}></i>
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-gray-900">
                                {isRequest ? 'Request Extension' : 'Extend Timeline'}
                            </h3>
                            <p className="text-xs font-medium text-gray-500">
                                {isRequest ? 'Propose new deadline' : 'One-time extension'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all"
                    >
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <div className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">
                                    New Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    required
                                    min={new Date().toISOString().split('T')[0]}
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all font-semibold text-gray-900 text-sm"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">
                                    New Time
                                </label>
                                <input
                                    type="time"
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all font-semibold text-gray-900 text-sm"
                                />
                            </div>
                        </div>

                        {isRequest && (
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">
                                    Reason <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    required
                                    className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all font-medium text-gray-700 text-sm min-h-[100px] resize-none placeholder-gray-400"
                                    placeholder="Explain why you need more time..."
                                />
                            </div>
                        )}

                        {!isRequest && (
                            <div className="bg-amber-50 rounded-xl p-4 flex gap-3">
                                <i className="fas fa-info-circle text-amber-500 mt-0.5"></i>
                                <p className="text-xs text-amber-800 font-medium leading-relaxed">
                                    This extension is final and will be logged in the task history. You cannot undo this action.
                                </p>
                            </div>
                        )}

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-3 ${isRequest ? 'bg-blue-600 hover:bg-blue-700' : 'bg-indigo-600 hover:bg-indigo-700'} text-white rounded-xl font-bold text-sm shadow-md transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2`}
                            >
                                {loading ? <i className="fas fa-spinner fa-spin"></i> : (
                                    <>
                                        <i className={`fas ${isRequest ? 'fa-paper-plane' : 'fa-check'}`}></i>
                                        {isRequest ? 'Submit Request' : 'Confirm Extension'}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <style>{`
                @keyframes fade-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                .animate-fade-in { animation: fade-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
            `}</style>
        </div>
    );
};


export default ExtendTaskModal;

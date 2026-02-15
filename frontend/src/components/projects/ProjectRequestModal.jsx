import React, { useState } from 'react';
import apiClient from '../../api/client';

const ProjectRequestModal = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        color: 'indigo'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const colors = [
        { value: 'emerald', name: 'Emerald' },
        { value: 'indigo', name: 'Indigo' },
        { value: 'blue', name: 'Blue' },
        { value: 'rose', name: 'Rose' },
        { value: 'amber', name: 'Amber' },
        { value: 'purple', name: 'Purple' },
        { value: 'orange', name: 'Orange' },
        { value: 'slate', name: 'Slate' }
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await apiClient.post('project-requests/', formData);
            setFormData({ name: '', description: '', color: 'indigo' });
            onSuccess();
            onClose();
        } catch (err) {
            console.error('Failed to submit project request', err);
            setError(err.response?.data ? JSON.stringify(err.response.data) : 'Failed to submit request');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-scale-up">
                <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Request Project</h2>
                        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 mt-1">Submit proposal to Admin</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-800 hover:bg-white transition-all border border-transparent hover:border-gray-200"
                    >
                        <i className="fas fa-times text-lg"></i>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-100 p-4 rounded-2xl text-red-600 text-xs font-bold animate-shake">
                            <i className="fas fa-exclamation-triangle mr-2"></i>
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Project Name <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-5 py-4 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all placeholder-gray-400 font-bold text-xl bg-gray-50/30"
                            placeholder="e.g. Research Initiative 2024"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Why is this project needed?</label>
                        <textarea
                            rows="4"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-5 py-4 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all placeholder-gray-400 font-medium resize-none bg-gray-50/30"
                            placeholder="Briefly describe the goals and impact..."
                        ></textarea>
                    </div>

                    <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                        <label className="block text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                            <i className="fas fa-palette text-emerald-500"></i> Suggest a Color
                        </label>
                        <div className="flex flex-wrap gap-4 justify-between px-2">
                            {colors.map(color => (
                                <button
                                    key={color.value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, color: color.value })}
                                    className={`w-10 h-10 rounded-full transition-all focus:outline-none hover:scale-125 shadow-md border-2 ${formData.color === color.value ? 'ring-4 ring-emerald-500/20 scale-125 border-white' : 'border-transparent'}`}
                                    style={{ backgroundColor: color.value === 'slate' ? '#64748b' : color.value === 'emerald' ? '#10b981' : color.value === 'indigo' ? '#6366f1' : color.value === 'blue' ? '#3b82f6' : color.value === 'rose' ? '#f43f5e' : color.value === 'amber' ? '#f59e0b' : color.value === 'purple' ? '#a855f7' : '#f97316' }}
                                    title={color.name}
                                ></button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-6">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-4 bg-gradient-to-br from-emerald-600 to-teal-500 text-white font-bold rounded-2xl shadow-xl shadow-emerald-200 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:from-emerald-700 hover:to-teal-600'}`}
                        >
                            {loading ? (
                                <i className="fas fa-spinner animate-spin"></i>
                            ) : (
                                <i className="fas fa-paper-plane"></i>
                            )}
                            <span>{loading ? 'Submitting...' : 'Submit Request'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProjectRequestModal;

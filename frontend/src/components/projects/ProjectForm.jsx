import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const ProjectForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isEdit = !!id;

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        color: 'indigo'
    });

    const [loading, setLoading] = useState(isEdit);
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

    useEffect(() => {
        // Security check
        if (user && !user.is_superuser) {
            navigate('/projects');
            return;
        }

        if (isEdit) {
            const fetchProject = async () => {
                try {
                    const response = await apiClient.get(`projects/${id}/`);
                    setFormData({
                        name: response.data.name,
                        description: response.data.description || '',
                        color: response.data.color || 'indigo'
                    });
                } catch (err) {
                    console.error('Failed to fetch project', err);
                    setError('Failed to load project details');
                } finally {
                    setLoading(false);
                }
            };
            fetchProject();
        }
    }, [id, isEdit, user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEdit) {
                await apiClient.put(`projects/${id}/`, formData);
            } else {
                await apiClient.post('projects/', formData);
            }
            navigate('/projects');
        } catch (err) {
            console.error('Failed to save project', err);
            setError(err.response?.data ? JSON.stringify(err.response.data) : 'Failed to save project');
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
        </div>
    );

    return (
        <div className="h-full flex items-center justify-center p-4 animate-fade-in">
            <div className="card w-full max-w-lg bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
                            {isEdit ? 'Edit Project' : 'New Project'}
                        </h2>
                        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 mt-1">
                            {isEdit ? 'Modify Workspace' : 'Create Workspace'}
                        </p>
                    </div>
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-800 hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-gray-200"
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
                            className="w-full px-5 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all placeholder-gray-400 font-medium text-lg"
                            placeholder="e.g. Website Redesign"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                        <textarea
                            rows="3"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-5 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all placeholder-gray-400 font-medium resize-none"
                            placeholder="Brief description of the project..."
                        ></textarea>
                    </div>

                    <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                        <label className="block text-sm font-bold text-gray-700 mb-4">Color Label</label>
                        <div className="flex flex-wrap gap-4 mb-2">
                            {colors.map(color => (
                                <button
                                    key={color.value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, color: color.value })}
                                    className={`w-10 h-10 rounded-full transition-all focus:outline-none hover:scale-110 shadow-sm border-2 ${formData.color === color.value ? 'ring-2 ring-gray-300 scale-110 border-white' : 'border-transparent'}`}
                                    style={{ backgroundColor: color.value === 'slate' ? '#64748b' : color.value === 'emerald' ? '#10b981' : color.value === 'indigo' ? '#6366f1' : color.value === 'blue' ? '#3b82f6' : color.value === 'rose' ? '#f43f5e' : color.value === 'amber' ? '#f59e0b' : color.value === 'purple' ? '#a855f7' : '#f97316' }}
                                    title={color.name}
                                ></button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-6 flex gap-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="flex-1 px-6 py-3.5 border border-gray-200 text-gray-600 font-bold rounded-xl text-center hover:bg-gray-50 hover:text-gray-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 hover:shadow-emerald-300 transform transition-all hover:-translate-y-0.5"
                        >
                            {isEdit ? 'Save Changes' : 'Create Project'}
                        </button>
                    </div>
                </form>
            </div>

            <style>{`
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

export default ProjectForm;

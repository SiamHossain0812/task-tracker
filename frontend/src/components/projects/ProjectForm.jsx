import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';

const ProjectForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isEdit = !!id;

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        color: 'indigo',
        member_ids: []
    });

    const [collaborators, setCollaborators] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
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
        // Fetch collaborators for member selection
        const fetchCollaborators = async () => {
            try {
                const response = await apiClient.get('collaborators/');
                setCollaborators(response.data);
            } catch (err) {
                console.error('Failed to fetch collaborators', err);
            }
        };
        fetchCollaborators();

        if (isEdit) {
            const fetchProject = async () => {
                try {
                    const response = await apiClient.get(`projects/${id}/`);
                    setFormData({
                        name: response.data.name,
                        description: response.data.description || '',
                        color: response.data.color || 'indigo',
                        member_ids: response.data.members?.map(m => m.id) || []
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
    }, [id, isEdit]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEdit) {
                await apiClient.put(`projects/${id}/`, formData);
                toast.success('Project updated successfully');
            } else {
                if (user?.is_superuser) {
                    await apiClient.post('projects/', formData);
                    toast.success('Project launched successfully');
                } else {
                    await apiClient.post('project-requests/', formData);
                    toast.success('Project request submitted for admin approval');
                    navigate('/project-requests');
                    return;
                }
            }
            navigate('/projects');
        } catch (err) {
            console.error('Failed to save project', err);
            const errorMsg = err.response?.data?.error || (err.response?.data ? JSON.stringify(err.response.data) : 'Failed to save project');
            setError(errorMsg);
            toast.error(errorMsg);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
        </div>
    );

    return (
        <div className="flex justify-center p-4 min-h-full animate-fade-in custom-scrollbar">
            <div className="card w-full max-w-2xl bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden mt-4 mb-8">

                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
                            {isEdit ? 'Edit Project' : (user?.is_superuser ? 'New Project' : 'Request New Project')}
                        </h2>
                        <p className="text-xs font-medium text-emerald-600 uppercase tracking-widest mt-1">
                            {isEdit ? 'Modify Workspace' : (user?.is_superuser ? 'Create Workspace' : 'Submit Proposal')}
                        </p>
                    </div>
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-800 hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-gray-200"
                    >
                        <i className="fas fa-times text-lg"></i>
                    </button>
                </div>

                <div className="p-8 pb-10">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 border border-red-100 p-4 rounded-2xl text-red-600 text-xs font-bold animate-shake">
                                <i className="fas fa-exclamation-triangle mr-2"></i>
                                {error}
                            </div>
                        )}

                        {/* Project Name */}
                        <div className="group">
                            <label className="block text-sm font-bold text-gray-700 mb-1.5 group-focus-within:text-emerald-600 transition-colors">Project Name <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-5 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all placeholder-gray-400 font-medium text-lg"
                                placeholder="E.g. Website Overhaul"
                            />
                        </div>

                        {/* Description */}
                        <div className="group">
                            <label className="block text-sm font-bold text-gray-700 mb-1.5 group-focus-within:text-emerald-600 transition-colors">Description</label>
                            <textarea
                                rows="4"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-5 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all placeholder-gray-400 font-medium resize-none shadow-sm"
                                placeholder="Describe the purpose of this project..."
                            ></textarea>
                        </div>

                        {/* Member Selection Section */}
                        <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100 space-y-4 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                    <i className="fas fa-users"></i> Team Members
                                </h3>
                                <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-black uppercase tracking-wider">
                                    {formData.member_ids.length} Selected
                                </div>
                            </div>

                            <div className="relative mb-4 group/search">
                                <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within/search:text-emerald-500 transition-colors"></i>
                                <input
                                    type="text"
                                    placeholder="Search collaborators..."
                                    className="w-full pl-11 pr-5 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-sm bg-white"
                                    onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
                                />
                            </div>

                            <div className="max-h-52 overflow-y-auto pr-2 custom-scrollbar">
                                <div className="grid grid-cols-1 gap-3">
                                    {collaborators
                                        .filter(c => c.user?.id !== user?.id)
                                        .filter(c => !searchTerm ||
                                            c.name?.toLowerCase().includes(searchTerm) ||
                                            c.email?.toLowerCase().includes(searchTerm))
                                        .map(collab => (
                                            <label
                                                key={collab.id}
                                                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${formData.member_ids.includes(collab.id)
                                                    ? 'bg-emerald-50 border-emerald-500 shadow-sm'
                                                    : 'hover:bg-white border-gray-100 bg-white/50'
                                                    }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={formData.member_ids.includes(collab.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setFormData({ ...formData, member_ids: [...formData.member_ids, collab.id] });
                                                        } else {
                                                            setFormData({ ...formData, member_ids: formData.member_ids.filter(id => id !== collab.id) });
                                                        }
                                                    }}
                                                    className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                                                />
                                                <div className="min-w-0">
                                                    <div className={`font-bold text-xs truncate transition-colors ${formData.member_ids.includes(collab.id) ? 'text-emerald-700' : 'text-gray-800'}`}>
                                                        {collab.name}
                                                    </div>
                                                    <div className="text-[10px] text-gray-400 font-medium truncate uppercase tracking-tighter">{collab.designation || 'Collaborator'}</div>
                                                </div>
                                            </label>
                                        ))}
                                </div>
                            </div>

                            {formData.member_ids.length === 0 && (
                                <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100 text-[10px] font-bold text-amber-600 uppercase tracking-wider animate-pulse">
                                    <i className="fas fa-info-circle text-sm"></i>
                                    Please select at least one team member
                                </div>
                            )}
                        </div>

                        {/* Color Picker */}
                        <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100 shadow-sm">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2 mb-4">
                                <i className="fas fa-palette"></i> Thematic Color
                            </h3>
                            <div className="flex flex-wrap gap-4">
                                {colors.map(color => (
                                    <button
                                        key={color.value}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, color: color.value })}
                                        className={`w-10 h-10 rounded-xl transition-all hover:scale-110 shadow-sm border-2 ${formData.color === color.value ? 'ring-4 ring-emerald-500/20 scale-110 border-white shadow-md' : 'border-transparent'}`}
                                        style={{ backgroundColor: color.value === 'slate' ? '#64748b' : color.value === 'emerald' ? '#10b981' : color.value === 'indigo' ? '#6366f1' : color.value === 'blue' ? '#3b82f6' : color.value === 'rose' ? '#f43f5e' : color.value === 'amber' ? '#f59e0b' : color.value === 'purple' ? '#a855f7' : '#f97316' }}
                                        title={color.name}
                                    ></button>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-6 flex gap-4 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="flex-1 px-6 py-3.5 border border-gray-200 text-gray-400 font-bold rounded-xl text-center hover:bg-gray-50 hover:text-gray-600 transition-all uppercase text-[10px] tracking-[0.2em]"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 hover:shadow-emerald-300 transform transition-all hover:-translate-y-0.5 uppercase text-[10px] tracking-[0.2em]"
                            >
                                {isEdit ? 'Save Changes' : (user?.is_superuser ? 'Launch Project' : 'Submit Request')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                @keyframes fade-in { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fade-in 0.5s cubic-bezier(0.23, 1, 0.32, 1); }
            `}</style>
        </div>
    );
};

export default ProjectForm;

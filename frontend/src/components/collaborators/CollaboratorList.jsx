import React, { useEffect, useState, useRef } from 'react';
import apiClient from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

const CollaboratorList = () => {
    const { user } = useAuth();
    const [collaborators, setCollaborators] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCollaborator, setEditingCollaborator] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        institute: '',
        email: '',
        whatsapp_number: '',
        address: '',
        image: null
    });
    const [imagePreview, setImagePreview] = useState(null);
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef(null);

    const fetchCollaborators = async () => {
        try {
            const response = await apiClient.get('collaborators/');
            setCollaborators(response.data);
        } catch (error) {
            console.error('Failed to fetch collaborators', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCollaborators();
    }, []);

    const handleOpenModal = (collaborator = null) => {
        if (collaborator) {
            setEditingCollaborator(collaborator);
            setFormData({
                name: collaborator.name,
                institute: collaborator.institute || '',
                email: collaborator.email || '',
                whatsapp_number: collaborator.whatsapp_number || '',
                address: collaborator.address || '',
                image: null
            });
            setImagePreview(collaborator.image);
        } else {
            setEditingCollaborator(null);
            setFormData({
                name: '',
                institute: '',
                email: '',
                whatsapp_number: '',
                address: '',
                image: null
            });
            setImagePreview(null);
        }
        setIsModalOpen(true);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, image: file });
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        const data = new FormData();
        Object.keys(formData).forEach(key => {
            if (formData[key] !== null) {
                data.append(key, formData[key]);
            }
        });

        try {
            if (editingCollaborator) {
                await apiClient.put(`collaborators/${editingCollaborator.id}/`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await apiClient.post('collaborators/', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            await fetchCollaborators();
            setIsModalOpen(false);
        } catch (error) {
            console.error('Failed to save collaborator', error);
            alert('Failed to save collaborator. Please check the data.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this member?')) return;
        try {
            await apiClient.delete(`collaborators/${id}/`);
            await fetchCollaborators();
        } catch (error) {
            console.error('Failed to delete collaborator', error);
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
        <div className="space-y-8 animate-fade-in pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Team Members</h1>
                    <p className="text-gray-500 mt-1 font-medium">Manage collaborators and shared research efforts</p>
                </div>
                {user?.is_superuser && (
                    <button
                        onClick={() => handleOpenModal()}
                        className="w-full sm:w-auto px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2"
                    >
                        <i className="fas fa-plus"></i> Add Member
                    </button>
                )}
            </div>



            {/* Collaborators Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {collaborators.map((collaborator) => (
                    <div key={collaborator.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full blur-3xl -mr-12 -mt-12 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                        {/* ... content ... */}


                        <Link to={`/profile/${collaborator.id}`} className="flex items-center gap-4 mb-5 relative z-10 hover:-translate-y-0.5 transition-transform cursor-pointer">
                            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-black text-2xl overflow-hidden border-4 border-white shadow-sm shrink-0 uppercase">
                                {collaborator.image ? (
                                    <img src={collaborator.image} className="w-full h-full object-cover" alt={collaborator.name} />
                                ) : (
                                    collaborator.name[0]
                                )}
                            </div>
                            <div className="min-w-0">
                                <h3 className="font-bold text-gray-800 group-hover:text-emerald-600 transition-colors truncate">{collaborator.name}</h3>
                                <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{collaborator.designation || collaborator.institute || "Collaborator"}</div>
                            </div>
                        </Link>

                        <div className="space-y-3 text-sm text-gray-600 relative z-10">
                            {collaborator.whatsapp_number && (
                                <div className="flex items-center gap-3 font-medium bg-emerald-50/50 p-2 rounded-xl border border-emerald-50">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs">
                                        <i className="fab fa-whatsapp"></i>
                                    </div>
                                    <span className="truncate">{collaborator.whatsapp_number}</span>
                                </div>
                            )}
                            {collaborator.email && (
                                <div className="flex items-center gap-3 font-medium bg-gray-50/50 p-2 rounded-xl border border-gray-100">
                                    <div className="w-8 h-8 rounded-lg bg-white text-gray-400 flex items-center justify-center text-xs border border-gray-100">
                                        <i className="far fa-envelope"></i>
                                    </div>
                                    <span className="truncate">{collaborator.email}</span>
                                </div>
                            )}
                            {collaborator.address && (
                                <div className="flex items-start gap-3 text-xs text-gray-400 pl-2">
                                    <i className="fas fa-map-marker-alt mt-0.5"></i>
                                    <span className="line-clamp-2">{collaborator.address}</span>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        {user?.is_superuser && (
                            <div className="mt-6 pt-4 border-t border-gray-50 flex justify-end gap-2 relative z-10">
                                <button
                                    onClick={() => handleOpenModal(collaborator)}
                                    className="w-10 h-10 rounded-xl bg-gray-100 text-gray-600 hover:text-white hover:bg-emerald-500 flex items-center justify-center transition-all shadow-sm"
                                    title="Edit"
                                >
                                    <i className="fas fa-pen text-sm"></i>
                                </button>
                                <button
                                    onClick={() => handleDelete(collaborator.id)}
                                    className="w-10 h-10 rounded-xl bg-red-50 text-red-500 hover:text-white hover:bg-red-500 flex items-center justify-center transition-all shadow-sm"
                                    title="Delete"
                                >
                                    <i className="fas fa-trash text-sm"></i>
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {collaborators.length === 0 && (
                <div className="py-20 text-center text-gray-400 bg-white rounded-[3rem] border border-dashed border-gray-200">
                    <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <i className="fas fa-users text-4xl opacity-20"></i>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">No Members Yet</h3>
                    <p className="max-w-xs mx-auto mb-8 font-medium">Add your research partners to start collaborating on tasks.</p>
                    {user?.is_superuser && (
                        <button onClick={() => handleOpenModal()} className="px-6 py-2.5 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all shadow-lg shadow-gray-100">
                            Add First Member
                        </button>
                    )}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-fade-in" onClick={() => !saving && setIsModalOpen(false)}></div>
                    <div className="relative transform overflow-hidden rounded-3xl bg-white shadow-2xl transition-all sm:max-w-lg w-full animate-fade-in-up">
                        {/* Modal Header */}
                        <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800 tracking-tight">{editingCollaborator ? 'Edit Member' : 'Add New Member'}</h2>
                                <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600 mt-1">Research Collaborator</p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-800 hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-gray-200"
                            >
                                <i className="fas fa-times text-lg"></i>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
                            {/* Image Upload */}
                            <div className="flex flex-col items-center justify-center mb-6">
                                <div
                                    className="relative group cursor-pointer"
                                    onClick={() => fileInputRef.current.click()}
                                >
                                    <div className="w-28 h-28 rounded-full border-4 border-white shadow-md overflow-hidden bg-gray-50 flex items-center justify-center group-hover:scale-105 transition-all duration-300">
                                        {imagePreview ? (
                                            <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                                        ) : (
                                            <div className="w-full h-full bg-emerald-50 flex items-center justify-center text-emerald-300">
                                                <i className="fas fa-user-plus text-4xl"></i>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <i className="fas fa-camera text-white text-xl"></i>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-[10px] text-gray-400 mt-3 font-bold uppercase tracking-widest">Update Photo</p>
                                <input
                                    type="file" ref={fileInputRef} className="hidden" accept="image/*"
                                    onChange={handleImageChange}
                                />
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Full Name *</label>
                                    <input
                                        type="text" required
                                        value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium text-gray-800"
                                        placeholder="Enter name..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Institute / Organization</label>
                                    <input
                                        type="text"
                                        value={formData.institute} onChange={(e) => setFormData({ ...formData, institute: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium text-gray-800"
                                        placeholder="e.g. BRRI"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Email</label>
                                        <input
                                            type="email"
                                            value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium text-gray-800"
                                            placeholder="mail@example.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">WhatsApp</label>
                                        <input
                                            type="text"
                                            value={formData.whatsapp_number} onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium text-gray-800"
                                            placeholder="+880..."
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Address</label>
                                    <textarea
                                        rows="2"
                                        value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium text-gray-800 resize-none"
                                        placeholder="Enter address..."
                                    ></textarea>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="pt-4 flex gap-4">
                                <button
                                    type="button" onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-6 py-3.5 border border-gray-100 text-gray-500 font-bold rounded-xl hover:bg-gray-50 transition-colors uppercase text-xs tracking-widest"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit" disabled={saving}
                                    className="flex-1 px-6 py-3.5 bg-gray-900 hover:bg-black text-white font-bold rounded-xl shadow-xl shadow-gray-200 transition-all uppercase text-xs tracking-widest disabled:opacity-50"
                                >
                                    {saving ? <i className="fas fa-spinner fa-spin"></i> : 'Save Member'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                @keyframes fade-in-up { 
                    from { opacity: 0; transform: translateY(15px); } 
                    to { opacity: 1; transform: translateY(0); } 
                }
                .animate-fade-in { animation: fade-in 0.4s ease-out; }
                .animate-fade-in-up { animation: fade-in-up 0.4s ease-out; }
            `}</style>
        </div>
    );
};

export default CollaboratorList;

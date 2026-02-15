import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { toast } from 'react-hot-toast';

const PersonalNotesDrawer = ({ isOpen, onClose }) => {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingNote, setEditingNote] = useState(null);
    const [formData, setFormData] = useState({ title: '', content: '', color: '#fef3c7', is_pinned: false });

    const NOTE_COLORS = [
        { name: 'Yellow', value: '#fef3c7' },
        { name: 'Pink', value: '#fce7f3' },
        { name: 'Blue', value: '#dbeafe' },
        { name: 'Green', value: '#d1fae5' },
        { name: 'Purple', value: '#e9d5ff' },
        { name: 'Orange', value: '#fed7aa' },
    ];

    useEffect(() => {
        if (isOpen) {
            fetchNotes();
        }
    }, [isOpen]);

    const fetchNotes = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('personal-notes/');
            setNotes(response.data);
        } catch (error) {
            console.error('Failed to fetch notes', error);
            toast.error('Failed to load notes');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.content.trim()) {
            toast.error('Note content is required');
            return;
        }

        try {
            if (editingNote) {
                await apiClient.put(`personal-notes/${editingNote.id}/`, formData);
                toast.success('Note updated');
            } else {
                await apiClient.post('personal-notes/', formData);
                toast.success('Note created');
            }
            setFormData({ title: '', content: '', color: '#fef3c7', is_pinned: false });
            setEditingNote(null);
            fetchNotes();
        } catch (error) {
            console.error('Failed to save note', error);
            toast.error('Failed to save note');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this note?')) return;
        try {
            await apiClient.delete(`personal-notes/${id}/`);
            toast.success('Note deleted');
            fetchNotes();
        } catch (error) {
            console.error('Failed to delete note', error);
            toast.error('Failed to delete note');
        }
    };

    const handleEdit = (note) => {
        setEditingNote(note);
        setFormData({ title: note.title, content: note.content, color: note.color, is_pinned: note.is_pinned });
    };

    const togglePin = async (note) => {
        try {
            await apiClient.patch(`personal-notes/${note.id}/`, { is_pinned: !note.is_pinned });
            fetchNotes();
        } catch (error) {
            console.error('Failed to toggle pin', error);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 animate-fade-in" onClick={onClose}></div>

            {/* Drawer */}
            <div className="fixed right-0 top-0 h-full w-full sm:w-[480px] bg-white shadow-2xl z-50 flex flex-col animate-slide-in-right">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
                            <i className="fas fa-sticky-note"></i>
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white tracking-tight">My Notes</h2>
                            <p className="text-xs text-indigo-100 font-medium">{notes.length} total</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-all">
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                {/* Form */}
                <div className="p-6 border-b border-gray-100 bg-gray-50">
                    <form onSubmit={handleSubmit} className="space-y-3">
                        <input
                            type="text"
                            placeholder="Title (optional)"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        />
                        <textarea
                            placeholder="What's on your mind?"
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm min-h-[100px] focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                            required
                        />
                        <div className="flex items-center gap-2 flex-wrap">
                            {NOTE_COLORS.map(color => (
                                <button
                                    key={color.value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, color: color.value })}
                                    className={`w-8 h-8 rounded-lg border-2 transition-all ${formData.color === color.value ? 'border-indigo-600 scale-110' : 'border-gray-200'}`}
                                    style={{ backgroundColor: color.value }}
                                    title={color.name}
                                />
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="submit"
                                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-indigo-100"
                            >
                                {editingNote ? 'Update' : 'Add Note'}
                            </button>
                            {editingNote && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditingNote(null);
                                        setFormData({ title: '', content: '', color: '#fef3c7', is_pinned: false });
                                    }}
                                    className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-600 text-sm font-black uppercase tracking-widest rounded-xl transition-all"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* Notes List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
                        </div>
                    ) : notes.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                                <i className="fas fa-sticky-note text-2xl text-gray-300"></i>
                            </div>
                            <p className="text-sm text-gray-400 font-medium">No notes yet. Start writing!</p>
                        </div>
                    ) : (
                        notes.map(note => (
                            <div
                                key={note.id}
                                className="p-4 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all relative group"
                                style={{ backgroundColor: note.color }}
                            >
                                {note.is_pinned && (
                                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center shadow-lg">
                                        <i className="fas fa-thumbtack text-white text-xs"></i>
                                    </div>
                                )}
                                {note.title && (
                                    <h3 className="font-bold text-gray-800 mb-1 text-sm">{note.title}</h3>
                                )}
                                <p className="text-sm text-gray-700 whitespace-pre-wrap mb-3">{note.content}</p>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-gray-500 font-medium">
                                        {new Date(note.updated_at).toLocaleDateString()}
                                    </span>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => togglePin(note)}
                                            className="w-7 h-7 rounded-lg bg-white/80 hover:bg-white flex items-center justify-center text-gray-600 hover:text-indigo-600 transition-all"
                                            title={note.is_pinned ? 'Unpin' : 'Pin'}
                                        >
                                            <i className={`fas fa-thumbtack text-xs ${note.is_pinned ? 'text-indigo-600' : ''}`}></i>
                                        </button>
                                        <button
                                            onClick={() => handleEdit(note)}
                                            className="w-7 h-7 rounded-lg bg-white/80 hover:bg-white flex items-center justify-center text-gray-600 hover:text-blue-600 transition-all"
                                        >
                                            <i className="fas fa-edit text-xs"></i>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(note.id)}
                                            className="w-7 h-7 rounded-lg bg-white/80 hover:bg-white flex items-center justify-center text-gray-600 hover:text-red-600 transition-all"
                                        >
                                            <i className="fas fa-trash text-xs"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <style>{`
                .animate-slide-in-right {
                    animation: slideInRight 0.3s ease-out;
                }
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                    }
                    to {
                        transform: translateX(0);
                    }
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
            `}</style>
        </>
    );
};

export default PersonalNotesDrawer;

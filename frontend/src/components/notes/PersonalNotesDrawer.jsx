import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { toast } from 'react-hot-toast';

const PersonalNotesDrawer = ({ isOpen, onClose }) => {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [savingId, setSavingId] = useState(null); // ID of the note currently being saved
    const [editingNoteId, setEditingNoteId] = useState(null); // ID of the note being edited inline
    const [formData, setFormData] = useState({ title: '', content: '', color: '#fef3c7', is_pinned: false });
    const [editFormData, setEditFormData] = useState({ title: '', content: '', color: '#fef3c7', is_pinned: false });

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

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        if (!formData.content.trim()) {
            toast.error('Note content is required');
            return;
        }

        setSavingId('new');
        try {
            await apiClient.post('personal-notes/', formData);
            toast.success('Note created');
            setFormData({ title: '', content: '', color: '#fef3c7', is_pinned: false });
            fetchNotes();
        } catch (error) {
            console.error('Failed to save note', error);
            toast.error('Failed to save note');
        } finally {
            setSavingId(null);
        }
    };

    const handleInlineUpdate = async (id) => {
        if (!editFormData.content.trim()) {
            toast.error('Note content is required');
            return;
        }

        setSavingId(id);
        try {
            await apiClient.put(`personal-notes/${id}/`, editFormData);
            toast.success('Note updated');
            setEditingNoteId(null);
            fetchNotes();
        } catch (error) {
            console.error('Failed to update note', error);
            toast.error('Failed to update note');
        } finally {
            setSavingId(null);
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

    const startEditing = (note) => {
        setEditingNoteId(note.id);
        setEditFormData({ title: note.title || '', content: note.content, color: note.color, is_pinned: note.is_pinned });
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
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 flex items-center justify-between shadow-lg">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white ring-1 ring-white/30">
                            <i className="fas fa-sticky-note"></i>
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white tracking-tight">My Notes</h2>
                            <p className="text-xs text-indigo-100 font-medium">{notes.length} total • Personal</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white text-white hover:text-indigo-600 transition-all flex items-center justify-center ring-1 ring-white/30">
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                {/* New Note Form */}
                <div className="p-6 border-b border-gray-100 bg-gray-50/50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    <form onSubmit={handleAddSubmit} className="space-y-4 relative z-10">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">New Note</label>
                            <input
                                type="text"
                                placeholder="Give it a title (optional)"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-none"
                            />
                        </div>
                        <textarea
                            placeholder="What's on your mind?..."
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm min-h-[100px] focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-none resize-none"
                            required
                        />
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-1.5 flex-wrap">
                                {NOTE_COLORS.map(color => (
                                    <button
                                        key={color.value}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, color: color.value })}
                                        className={`w-6 h-6 rounded-full border-2 transition-all ${formData.color === color.value ? 'border-indigo-600 scale-125 shadow-md' : 'border-white hover:scale-110'}`}
                                        style={{ backgroundColor: color.value }}
                                        title={color.name}
                                    />
                                ))}
                            </div>
                            <button
                                type="submit"
                                disabled={savingId === 'new'}
                                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 flex items-center gap-2"
                            >
                                {savingId === 'new' ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-plus"></i>}
                                Add Note
                            </button>
                        </div>
                    </form>
                </div>

                {/* Notes List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-[#F8FAFC]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"></div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading notes...</p>
                        </div>
                    ) : notes.length === 0 ? (
                        <div className="text-center py-20 flex flex-col items-center">
                            <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm border border-gray-100">
                                <i className="fas fa-sticky-note text-3xl text-gray-200"></i>
                            </div>
                            <p className="text-gray-500 font-bold">Your wall is empty</p>
                            <p className="text-xs text-gray-400 mt-1 max-w-[200px] mx-auto leading-relaxed">Personal thoughts and quick reminders stay here.</p>
                        </div>
                    ) : (
                        notes.map(note => (
                            <div
                                key={note.id}
                                className={`group p-5 rounded-2xl border-2 shadow-sm transition-all relative ${editingNoteId === note.id ? 'border-indigo-500 bg-white ring-4 ring-indigo-50' : 'border-gray-100 hover:border-indigo-200 bg-white'}`}
                                style={{ backgroundColor: editingNoteId === note.id ? '#ffffff' : note.color }}
                            >
                                {note.is_pinned && editingNoteId !== note.id && (
                                    <div className="absolute -top-2 -right-1 w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center shadow-lg border-2 border-white">
                                        <i className="fas fa-thumbtack text-white text-[10px]"></i>
                                    </div>
                                )}

                                {editingNoteId === note.id ? (
                                    /* Inline Edit Mode */
                                    <div className="space-y-3">
                                        <input
                                            type="text"
                                            value={editFormData.title}
                                            onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                                            className="w-full px-0 py-1 bg-transparent border-b-2 border-indigo-100 focus:border-indigo-500 outline-none font-bold text-gray-800 text-sm transition-all"
                                            placeholder="Update title..."
                                            autoFocus
                                        />
                                        <textarea
                                            value={editFormData.content}
                                            onChange={(e) => setEditFormData({ ...editFormData, content: e.target.value })}
                                            className="w-full px-0 py-2 bg-transparent outline-none text-sm text-gray-700 min-h-[80px] resize-none"
                                            placeholder="Update content..."
                                        />
                                        <div className="flex items-center justify-between pt-2">
                                            <div className="flex gap-1.5">
                                                {NOTE_COLORS.map(color => (
                                                    <button
                                                        key={color.value}
                                                        type="button"
                                                        onClick={() => setEditFormData({ ...editFormData, color: color.value })}
                                                        className={`w-5 h-5 rounded-full border-2 transition-all ${editFormData.color === color.value ? 'border-indigo-600 scale-110 shadow-sm' : 'border-white'}`}
                                                        style={{ backgroundColor: color.value }}
                                                    />
                                                ))}
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setEditingNoteId(null)}
                                                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={() => handleInlineUpdate(note.id)}
                                                    disabled={savingId === note.id}
                                                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all shadow-md shadow-indigo-100 disabled:opacity-50 flex items-center gap-1.5"
                                                >
                                                    {savingId === note.id ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-check"></i>}
                                                    Save
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    /* Display Mode */
                                    <>
                                        <div className="flex justify-between items-start mb-2">
                                            {note.title && (
                                                <h3 className="font-black text-gray-800 text-sm tracking-tight">{note.title}</h3>
                                            )}
                                            {!note.title && <div className="h-4"></div>}
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => togglePin(note)}
                                                    className={`w-7 h-7 rounded-lg transition-all flex items-center justify-center ${note.is_pinned ? 'text-indigo-600 bg-white ring-1 ring-indigo-100' : 'text-gray-400 hover:text-indigo-600 hover:bg-white'}`}
                                                    title={note.is_pinned ? 'Unpin' : 'Pin'}
                                                >
                                                    <i className="fas fa-thumbtack text-[10px]"></i>
                                                </button>
                                                <button
                                                    onClick={() => startEditing(note)}
                                                    className="w-7 h-7 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-white transition-all flex items-center justify-center"
                                                    title="Edit Note"
                                                >
                                                    <i className="fas fa-pen text-[10px]"></i>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(note.id)}
                                                    className="w-7 h-7 rounded-lg text-gray-400 hover:text-red-600 hover:bg-white transition-all flex items-center justify-center"
                                                    title="Delete Note"
                                                >
                                                    <i className="fas fa-trash text-[10px]"></i>
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                            {note.content}
                                        </p>
                                        <div className="mt-4 flex items-center justify-between text-[10px] font-bold text-gray-400/80 uppercase tracking-widest">
                                            <span>{new Date(note.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                            <span className="opacity-0 group-hover:opacity-100 transition-opacity">Personal Note</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            <style>{`
                .animate-slide-in-right {
                    animation: slideInRight 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
                }
                @keyframes slideInRight {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                .animate-fade-in {
                    animation: fadeIn 0.3s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
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

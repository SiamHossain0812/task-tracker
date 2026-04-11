import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';

const TaskCommentSection = ({ task }) => {
    const { user } = useAuth();
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [isGroup, setIsGroup] = useState(true);
    const [selectedRecipients, setSelectedRecipients] = useState([]);
    
    const fetchComments = useCallback(async () => {
        try {
            const response = await apiClient.get(`comments/`, {
                params: { agenda: task.id }
            });
            setComments(response.data);
        } catch (err) {
            console.error('Failed to fetch comments', err);
        } finally {
            setLoading(false);
        }
    }, [task?.id]);

    useEffect(() => {
        if (task?.id) {
            fetchComments();
        }

        // Listen for real-time comment updates
        const handleNewComment = (e) => {
            if (e.detail?.agendaId == task.id) {
                fetchComments();
            }
        };

        window.addEventListener('task_comment_added', handleNewComment);
        return () => window.removeEventListener('task_comment_added', handleNewComment);
    }, [task?.id, fetchComments]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        if (!isGroup && selectedRecipients.length === 0) {
            toast.error('Please select at least one recipient for private comments');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                agenda: task.id,
                text: newComment,
                is_group_comment: isGroup,
                recipients: isGroup ? [] : selectedRecipients
            };
            
            await apiClient.post('comments/', payload);
            setNewComment('');
            if (!isGroup) setSelectedRecipients([]);
            toast.success('Comment posted');
            fetchComments();
        } catch (err) {
            console.error('Failed to post comment', err);
            toast.error('Failed to post comment');
        } finally {
            setSubmitting(false);
        }
    };

    if (!task) return null;

    // Potential recipients: All members except self
    const potentialRecipients = (task.assignments || [])
        .map(a => {
            const collab = (task.collaborators || []).find(c => c.id === a.collaborator);
            return {
                id: collab?.user?.id,
                name: a.collaborator_name,
                role: a.collaborator === task.team_leader?.id ? 'Leader' : 'Member'
            };
        })
        .filter(m => m.id && m.id !== user?.id);

    // Add Creator if not already in list and not self
    if (task.created_by_name && task.created_by !== user?.id && !potentialRecipients.find(m => m.id === task.created_by)) {
        potentialRecipients.push({
            id: task.created_by,
            name: task.created_by_name,
            role: 'Creator'
        });
    }

    const toggleRecipient = (id) => {
        setSelectedRecipients(prev => 
            prev.includes(id) ? prev.filter(rid => rid !== id) : [...prev, id]
        );
    };

    return (
        <div className="mt-12 bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden animate-fade-in mb-10">
            {/* Header */}
            <div className="px-8 py-6 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-100">
                        <i className="fas fa-comments text-lg"></i>
                    </div>
                    <div>
                        <h3 className="text-lg font-extrabold text-gray-900 tracking-tight">Activity & Discussions</h3>
                        <p className="text-xs text-gray-400 font-medium">Coordinate and share updates with task members</p>
                    </div>
                </div>
                <div className="px-4 py-1.5 bg-gray-100 rounded-full text-[10px] font-black text-gray-500 uppercase tracking-widest">
                    {comments.length} Messages
                </div>
            </div>

            <div className="p-8">
                {/* Modern Comment Form */}
                <form onSubmit={handleSubmit} className="mb-12 bg-gray-50/50 rounded-2xl p-6 border border-gray-100 shadow-inner">
                    <div className="mb-6">
                        <div className="flex flex-wrap items-center gap-4 mb-4">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Visibility Scope:</label>
                            <div className="flex bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
                                <button
                                    type="button"
                                    onClick={() => setIsGroup(true)}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${isGroup ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'text-gray-500 hover:text-gray-800'}`}
                                >
                                    Group (Everyone)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsGroup(false)}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${!isGroup ? 'bg-amber-600 text-white shadow-md shadow-amber-100' : 'text-gray-500 hover:text-gray-800'}`}
                                >
                                    Individual (Private)
                                </button>
                            </div>
                        </div>

                        {!isGroup && (
                            <div className="mb-4 animate-slide-down">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Select Recipients:</p>
                                <div className="flex flex-wrap gap-2">
                                    {potentialRecipients.map(member => (
                                        <button
                                            key={member.id}
                                            type="button"
                                            onClick={() => toggleRecipient(member.id)}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold transition-all ${
                                                selectedRecipients.includes(member.id)
                                                ? 'bg-amber-50 border-amber-200 text-amber-700'
                                                : 'bg-white border-gray-200 text-gray-500 hover:border-amber-200'
                                            }`}
                                        >
                                            <div className={`w-1.5 h-1.5 rounded-full ${selectedRecipients.includes(member.id) ? 'bg-amber-500 animate-pulse' : 'bg-gray-300'}`}></div>
                                            {member.name}
                                            <span className="text-[9px] opacity-60 font-medium">({member.role})</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="relative group">
                            <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder={isGroup ? "Share a message with the entire team..." : "Choose individual members for a private thread..."}
                                className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-50/50 focus:border-indigo-500 outline-none transition-all text-sm min-h-[120px] shadow-sm placeholder-gray-400 font-medium resize-none"
                            />
                            <div className="absolute bottom-4 right-4 flex items-center gap-2">
                                <span className={`text-[10px] font-bold ${newComment.length > 500 ? 'text-red-500' : 'text-gray-300'}`}>
                                    {newComment.length} chars
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={submitting || !newComment.trim() || (!isGroup && selectedRecipients.length === 0)}
                            className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg transition-all flex items-center gap-3 active:scale-95 ${
                                isGroup 
                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200' 
                                : 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-200'
                            } disabled:opacity-50 disabled:shadow-none disabled:active:scale-100`}
                        >
                            {submitting ? (
                                <i className="fas fa-spinner fa-spin"></i>
                            ) : (
                                <>
                                    <span>Post Comment</span>
                                    <i className="fas fa-paper-plane text-[10px]"></i>
                                </>
                            )}
                        </button>
                    </div>
                </form>

                {/* Highly Aesthetic Comments List */}
                <div className="space-y-8 relative">
                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-50 -z-10"></div>
                    
                    {loading ? (
                        <div className="flex flex-col items-center justify-center p-12 text-gray-400">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-600 mb-4"></div>
                            <p className="text-xs font-bold tracking-widest uppercase">Loading conversation...</p>
                        </div>
                    ) : comments.length > 0 ? (
                        comments.map((comment) => {
                            const isOwn = comment.author === user?.id;
                            const isPrivate = !comment.is_group_comment;
                            
                            return (
                                <div key={comment.id} className={`flex gap-6 animate-fade-in group`}>
                                    <div className="shrink-0 relative">
                                        <div className="w-12 h-12 rounded-2xl border-2 border-white shadow-md overflow-hidden bg-gray-100 flex items-center justify-center ring-4 ring-gray-50/50">
                                            {comment.author_image ? (
                                                <img src={comment.author_image} alt={comment.author_name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold uppercase">
                                                    {comment.author_username?.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2">
                                            <span className="text-sm font-extrabold text-gray-900">{isOwn ? 'You' : (comment.author_name || comment.author_username)}</span>
                                            
                                            {isPrivate ? (
                                                <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-100 text-[9px] font-black uppercase tracking-tight">
                                                    <i className="fas fa-lock text-[8px]"></i>
                                                    <span>Private to {comment.recipients_info?.length > 1 ? `${comment.recipients_info.length} members` : comment.recipients_info?.[0]?.name}</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 text-[9px] font-black uppercase tracking-tight">
                                                    <i className="fas fa-users text-[8px]"></i>
                                                    <span>Team Group</span>
                                                </div>
                                            )}

                                            <span className="text-[10px] font-bold text-gray-300 ml-auto group-hover:text-gray-400 transition-colors">
                                                {new Date(comment.created_at).toLocaleDateString()} at {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>

                                        <div className={`p-5 rounded-2xl shadow-sm border leading-relaxed transform transition-all group-hover:shadow-md ${
                                            isOwn 
                                            ? 'bg-white border-indigo-100' 
                                            : isPrivate 
                                              ? 'bg-amber-50/20 border-amber-100 italic' 
                                              : 'bg-white border-gray-100'
                                        }`}>
                                            <p className="text-sm text-gray-700 font-medium whitespace-pre-wrap">{comment.text}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-20 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-100">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-100">
                                <i className="fas fa-comments text-gray-300 text-xl"></i>
                            </div>
                            <h4 className="text-gray-900 font-extrabold text-sm mb-1">No discussions yet</h4>
                            <p className="text-gray-400 text-xs font-medium px-8">Be the first to share an update or start a private thread with a member.</p>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes slide-down { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-slide-down { animation: slide-down 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .animate-fade-in { animation: fade-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
            `}</style>
        </div>
    );
};

export default TaskCommentSection;

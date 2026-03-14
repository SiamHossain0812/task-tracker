import React, { useState } from 'react';
import apiClient from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';

const TaskUpdatesList = ({ task, onUpdatePosted }) => {
    const { user } = useAuth();
    const [newUpdateText, setNewUpdateText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Permission Check: Only assigned collaborators who accepted, the creator, or admins can post
    const isCreator = task?.created_by === user?.id;
    const isAdmin = user?.is_superuser;
    
    // Find current user's collaborator ID from the collaborators list
    const myCollabId = task?.collaborators?.find(c => 
        (c.user?.id || c.user) === user?.id || c.user_id === user?.id
    )?.id;

    // Check if THIS specific collaborator has an 'accepted' status for THIS task
    const isAcceptedCollaborator = task?.assignments?.some(
        a => a.collaborator === myCollabId && a.status === 'accepted'
    );

    const canPost = isCreator || isAcceptedCollaborator || isAdmin;





    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newUpdateText.trim()) return;

        setIsSubmitting(true);
        try {
            await apiClient.post(`agendas/${task.id}/add-update/`, {
                text: newUpdateText
            });
            toast.success('Update posted successfully!');
            setNewUpdateText('');
            if (onUpdatePosted) {
                onUpdatePosted(); // Trigger a refetch of the task details
            }
        } catch (error) {
            console.error('Failed to post update:', error);
            toast.error(error.response?.data?.error || 'Failed to post update');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Helper to determine the color of the performance badge
    const getPerformanceColor = (percentage) => {
        if (percentage <= 33) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        if (percentage <= 66) return 'bg-amber-100 text-amber-700 border-amber-200';
        if (percentage <= 100) return 'bg-orange-100 text-orange-700 border-orange-200';
        return 'bg-red-100 text-red-700 border-red-200'; // Overdue
    };

    return (
        <div className="mt-8 border-t border-gray-100 pt-8">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                <i className="fas fa-stream text-indigo-500"></i>
                Progress Updates
                <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                    {task.updates?.length || 0}
                </span>
            </h3>

            {/* Updates Timeline */}
            <div className="space-y-6 mb-8">
                {!task.updates || task.updates.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                        <i className="fas fa-comment-dots text-gray-300 text-3xl mb-3"></i>
                        <p className="text-sm text-gray-500 font-medium">No progress updates yet.</p>
                        {canPost && <p className="text-xs text-gray-400 mt-1">Be the first to post an update below.</p>}
                    </div>
                ) : (
                    task.updates.map((update) => (
                        <div key={update.id} className="relative pl-8 animate-fade-in group">
                            {/* Timeline Line */}
                            <div className="absolute left-[11px] top-6 bottom-0 w-[2px] bg-gray-100 group-last:bg-transparent"></div>
                            
                            {/* Timeline Dot */}
                            <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-indigo-50 border-2 border-indigo-500 flex items-center justify-center z-10 shadow-sm">
                                <i className="fas fa-check text-[10px] text-indigo-600"></i>
                            </div>

                            {/* Update Content Card */}
                            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all">
                                <div className="flex flex-wrap justify-between items-start gap-4 mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-inner">
                                            {update.author_name ? update.author_name.charAt(0) : '?'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900 leading-tight">
                                                {update.author_name || update.author_username}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {new Date(update.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Auto-Calculated Performance Badge */}
                                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold shadow-sm ${getPerformanceColor(update.time_elapsed_percentage)}`} title="Percentage of task time elapsed when this update was posted">
                                        <i className="fas fa-stopwatch text-[10px]"></i>
                                        {update.time_elapsed_percentage}% Time Elapsed
                                    </div>
                                </div>
                                
                                <div className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed mt-2 bg-gray-50/50 p-4 rounded-xl border border-gray-50">
                                    {update.text}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Post New Update Section */}
            {canPost ? (
                <div className="bg-indigo-50/30 rounded-2xl p-5 border border-indigo-100/50">
                    <form onSubmit={handleSubmit}>
                        <label htmlFor="updateText" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                            Post an Update
                        </label>
                        <div className="relative">
                            <textarea
                                id="updateText"
                                rows="3"
                                className="w-full px-4 py-3 bg-white border border-gray-200 hover:border-indigo-300 focus:border-indigo-500 rounded-xl transition-all shadow-sm outline-none resize-y text-sm text-gray-800 placeholder-gray-400 focus:ring-4 focus:ring-indigo-50"
                                placeholder="What progress have you made? e.g. 'Finished the first draft, moving to review.'"
                                value={newUpdateText}
                                onChange={(e) => setNewUpdateText(e.target.value)}
                                disabled={isSubmitting}
                            ></textarea>
                        </div>
                        <div className="flex justify-end mt-3">
                            <button
                                type="submit"
                                disabled={!newUpdateText.trim() || isSubmitting}
                                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <><i className="fas fa-spinner fa-spin"></i> Posting...</>
                                ) : (
                                    <><i className="fas fa-paper-plane"></i> Post Update</>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="text-center p-4 bg-gray-50 rounded-xl text-xs font-bold text-gray-400">
                    You must accept this task assignment to post updates.
                </div>
            )}
        </div>
    );
};

export default TaskUpdatesList;

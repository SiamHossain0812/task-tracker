import React, { useState } from 'react';
import apiClient from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';

const TaskUpdatesList = ({ task, onUpdatePosted }) => {
    const { user } = useAuth();
    const [newUpdateText, setNewUpdateText] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
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
        if (!newUpdateText.trim()) {
            toast.error('Please provide update text');
            return;
        }
        if (!selectedFile) {
            toast.error('File attachment is mandatory for updates');
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('text', newUpdateText);
            formData.append('attachment', selectedFile);

            await apiClient.post(`agendas/${task.id}/add-update/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.success('Update posted successfully!');
            setNewUpdateText('');
            setSelectedFile(null);
            // Reset file input manually
            const fileInput = document.getElementById('attachment');
            if (fileInput) fileInput.value = '';

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

                                {/* Attachment View Section */}
                                <div className="mt-4 flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                                    <div className="flex items-center gap-2">
                                        <i className={`fas ${update.can_view_attachment ? 'fa-file-alt text-indigo-500' : 'fa-lock text-gray-400'}`}></i>
                                        <span className="text-xs font-bold text-gray-600">Attached Report</span>
                                    </div>
                                    
                                    {update.can_view_attachment ? (
                                        <a 
                                            href={update.secure_download_url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="px-3 py-1.5 bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
                                        >
                                            <i className="fas fa-download text-[10px]"></i>
                                            Download
                                        </a>
                                    ) : (
                                        <span className="px-3 py-1.5 bg-gray-100 text-gray-400 rounded-lg text-[10px] font-bold border border-gray-200 flex items-center gap-2">
                                            <i className="fas fa-shield-alt"></i>
                                            Restricted access
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Post New Update Section */}
            {canPost ? (
                <div className="bg-indigo-50/30 rounded-2xl p-5 border border-indigo-100/50">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="updateText" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                Update Content <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                id="updateText"
                                rows="3"
                                className="w-full px-4 py-3 bg-white border border-gray-200 hover:border-indigo-300 focus:border-indigo-500 rounded-xl transition-all shadow-sm outline-none resize-y text-sm text-gray-800 placeholder-gray-400 focus:ring-4 focus:ring-indigo-50"
                                placeholder="What progress have you made?"
                                value={newUpdateText}
                                onChange={(e) => setNewUpdateText(e.target.value)}
                                disabled={isSubmitting}
                            ></textarea>
                        </div>

                        <div>
                            <label htmlFor="attachment" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                Attach Report / Proof <span className="text-red-500">*</span>
                            </label>
                            <div className="relative group">
                                <input
                                    type="file"
                                    id="attachment"
                                    onChange={(e) => setSelectedFile(e.target.files[0])}
                                    className="hidden"
                                    disabled={isSubmitting}
                                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.zip"
                                />
                                <label 
                                    htmlFor="attachment"
                                    className={`flex items-center justify-between w-full px-4 py-3 bg-white border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                                        selectedFile 
                                        ? 'border-emerald-200 bg-emerald-50/30' 
                                        : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedFile ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                                            <i className={`fas ${selectedFile ? 'fa-file-upload' : 'fa-cloud-upload-alt'}`}></i>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-700 truncate max-w-[200px]">
                                                {selectedFile ? selectedFile.name : 'Choose a file to upload'}
                                            </p>
                                            <p className="text-[10px] text-gray-400 font-medium">Max size: 10MB</p>
                                        </div>
                                    </div>
                                    {selectedFile ? (
                                        <i className="fas fa-check-circle text-emerald-500"></i>
                                    ) : (
                                        <span className="text-[10px] font-bold text-indigo-600 uppercase">Browse</span>
                                    )}
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                type="submit"
                                disabled={!newUpdateText.trim() || !selectedFile || isSubmitting}
                                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5"
                            >
                                {isSubmitting ? (
                                    <><i className="fas fa-spinner fa-spin"></i> Posting Report...</>
                                ) : (
                                    <><i className="fas fa-paper-plane"></i> Submit Update</>
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

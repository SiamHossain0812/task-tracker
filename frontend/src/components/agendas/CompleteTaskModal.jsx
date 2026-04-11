import React, { useState } from 'react';

const CompleteTaskModal = ({ task, isOpen, onClose, onConfirm }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [ratings, setRatings] = useState({});

    // Initialize ratings when modal opens
    React.useEffect(() => {
        if (isOpen && task && task.assignments) {
            const initial = {};
            task.assignments.forEach(a => {
                if (a.status === 'accepted') {
                   initial[a.collaborator] = a.quality_score || 5;
                }
            });
            setRatings(initial);
        }
    }, [isOpen, task]);

    if (!isOpen || !task) return null;

    const handleRate = (collaboratorId, score) => {
        setRatings(prev => ({ ...prev, [collaboratorId]: score }));
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            await onConfirm(ratings);
            onClose();
        } catch (error) {
            console.error("Error completing task:", error);
            setIsSubmitting(false);
        }
    };

    const ratedAssignments = task.assignments?.filter(a => a.status === 'accepted') || [];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-fade-in" onClick={onClose}>
            <div 
                className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden transform scale-100 transition-all border border-gray-100 flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-8 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50 shrink-0">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-white text-emerald-600 flex items-center justify-center shrink-0 shadow-sm border border-emerald-100/50">
                            <i className="fas fa-clipboard-check text-3xl"></i>
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Complete & Evaluate</h2>
                            <p className="text-xs text-emerald-700 font-bold uppercase tracking-widest mt-1">Final Performance Review</p>
                        </div>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                    <div className="bg-emerald-50/50 border border-emerald-100/50 rounded-[2rem] p-6 mb-8 text-center relative overflow-hidden">
                         <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-20 rounded-full blur-3xl -mr-16 -mt-16"></div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Wrapping up session?</h3>
                        <p className="text-sm text-gray-600 leading-relaxed px-4">
                            You are finalizing <span className="font-bold text-emerald-700">"{task.title}"</span>. 
                            Please provide a quick quality evaluation for the team members involved.
                        </p>
                    </div>

                    {/* Rating List */}
                    <div className="space-y-6">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                             Collaborator Performance 
                             <span className="h-px bg-gray-100 flex-1"></span>
                        </h4>
                        
                        {ratedAssignments.length > 0 ? ratedAssignments.map((assignment) => (
                            <div key={assignment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-emerald-200 transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <img 
                                            src={assignment.collaborator_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(assignment.collaborator_name)}&background=f3f4f6&color=4b5563`}
                                            alt={assignment.collaborator_name}
                                            className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                                        />
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white"></div>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-gray-800">{assignment.collaborator_name}</span>
                                        <span className="text-[10px] text-gray-400 font-bold uppercase">Accepted</span>
                                    </div>
                                </div>
                                
                                <div className="flex gap-1 bg-white p-2 rounded-xl border border-gray-100 group-hover:shadow-sm transition-all">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            onClick={() => handleRate(assignment.collaborator, star)}
                                            className={`w-7 h-7 flex items-center justify-center transition-all hover:scale-125 ${
                                                (ratings[assignment.collaborator] || 0) >= star
                                                ? 'text-amber-400'
                                                : 'text-gray-200 hover:text-amber-200'
                                            }`}
                                        >
                                            <i className="fas fa-star text-sm"></i>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )) : (
                            <div className="p-8 text-center border-2 border-dashed border-gray-100 rounded-3xl opacity-40">
                                <i className="fas fa-user-slash text-xl mb-2 block"></i>
                                <p className="text-xs font-bold italic">No other collaborators to evaluate.</p>
                            </div>
                        )}
                    </div>

                    <div className="p-5 mt-8 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-4">
                        <div className="w-8 h-8 rounded-xl bg-white text-amber-500 flex items-center justify-center shrink-0 shadow-sm">
                            <i className="fas fa-info-circle"></i>
                        </div>
                        <p className="text-[11px] text-amber-700 leading-relaxed font-medium">
                            Rating data is used for performance analytics and research output visualization. 
                            The task will be locked in the <span className="font-bold">Completed</span> section once confirmed.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row justify-end gap-3 shrink-0">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest text-gray-500 bg-white border border-gray-200 hover:bg-gray-100 transition-colors"
                    >
                        Keep Working
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-10 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-200 transition-all hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                        {isSubmitting ? (
                            <><i className="fas fa-circle-notch fa-spin"></i> Processing</>
                        ) : (
                            <><i className="fas fa-check"></i> Finalize and Close</>
                        )}
                    </button>
                </div>
            </div>
            
            <style>{`
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
            `}</style>
        </div>
    );
};

export default CompleteTaskModal;

import React, { useState } from 'react';

const CompleteTaskModal = ({ task, isOpen, onClose, onConfirm }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen || !task) return null;

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            await onConfirm({}); // Send empty ratings, backend will use existing scores
            onClose();
        } catch (error) {
            console.error("Error completing task:", error);
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div 
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform scale-100 transition-all border border-gray-100"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white text-emerald-600 flex items-center justify-center shrink-0 shadow-sm border border-emerald-100">
                            <i className="fas fa-clipboard-check text-2xl"></i>
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900 tracking-tight">Complete Task</h2>
                            <p className="text-sm text-emerald-700 font-medium mt-0.5">Finalize Initiative</p>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="p-8">
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5 mb-6 text-center">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-emerald-50">
                            <i className="fas fa-flag-checkered text-2xl text-emerald-600"></i>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Ready to wrap up?</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            You are marking <span className="font-bold text-emerald-700">"{task.title}"</span> as completed. 
                            Performance metrics will be calculated based on the quality ratings and timing data provided.
                        </p>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-start gap-3">
                        <i className="fas fa-shield-alt text-gray-400 mt-0.5"></i>
                        <p className="text-xs text-gray-500 leading-relaxed">
                            <span className="font-bold text-gray-700">Note:</span> Once completed, this task will move to the "Completed" section. You can always re-open it later if needed.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-6 py-2.5 rounded-xl font-bold text-sm text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 transition-colors w-full sm:w-auto"
                    >
                        Go Back
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-8 py-2.5 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-200 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2 w-full sm:w-auto disabled:opacity-70 disabled:transform-none disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <><i className="fas fa-circle-notch fa-spin"></i> Finalizing...</>
                        ) : (
                            <><i className="fas fa-check"></i> Confirm Completion</>
                        )}
                    </button>
                </div>
            </div>
            
            <style>{`
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default CompleteTaskModal;

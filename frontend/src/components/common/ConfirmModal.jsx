import React from 'react';

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', isDangerous = false }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-fade-in"
                onClick={onCancel}
            ></div>

            {/* Modal Content */}
            <div className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 transform transition-all animate-scale-up overflow-hidden">
                <div className="flex flex-col items-center text-center">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 text-2xl shadow-lg ${isDangerous ? 'bg-red-50 text-red-500 shadow-red-100' : 'bg-emerald-50 text-emerald-600 shadow-emerald-100'
                        }`}>
                        <i className={`fas ${isDangerous ? 'fa-exclamation-triangle' : 'fa-question'}`}></i>
                    </div>

                    <h3 className="text-xl font-black text-gray-800 mb-2">{title}</h3>
                    <p className="text-gray-500 font-medium mb-8 text-sm leading-relaxed">{message}</p>

                    <div className="flex gap-3 w-full">
                        <button
                            onClick={onCancel}
                            className="flex-1 px-5 py-3 border border-gray-100 text-gray-500 font-bold rounded-xl hover:bg-gray-50 transition-colors uppercase text-xs tracking-widest"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`flex-1 px-5 py-3 text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95 uppercase text-xs tracking-widest ${isDangerous
                                    ? 'bg-red-500 hover:bg-red-600 shadow-red-200'
                                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                                }`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                @keyframes scale-up { 
                    from { transform: scale(0.95); opacity: 0; } 
                    to { transform: scale(1); opacity: 1; } 
                }
                .animate-fade-in { animation: fade-in 0.2s ease-out; }
                .animate-scale-up { animation: scale-up 0.2s ease-out; }
            `}</style>
        </div>
    );
};

export default ConfirmModal;

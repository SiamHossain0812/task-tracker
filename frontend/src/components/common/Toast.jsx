import React, { useEffect } from 'react';

const Toast = ({ message, submessage, type = 'success', onClose, duration = 4000, onClick }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const bgColors = {
        success: 'bg-emerald-600',
        error: 'bg-red-500',
        info: 'bg-blue-600',
        warning: 'bg-amber-500'
    };

    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        info: 'fas fa-info-circle',
        warning: 'fas fa-bell'
    };

    const isWarning = type === 'warning';

    return (
        <div
            onClick={onClick}
            className={`fixed top-6 right-6 z-[9999] flex items-start gap-3 px-5 py-4 rounded-2xl shadow-2xl text-white transform transition-all animate-bounce-in ${isWarning ? 'ring-4 ring-amber-300/60' : ''
                } ${bgColors[type] || bgColors.success} ${onClick ? 'cursor-pointer hover:scale-105 active:scale-95' : ''}`}
            style={{ maxWidth: '360px', minWidth: '260px' }}
        >
            <i className={`${icons[type] || icons.success} text-2xl mt-0.5 flex-shrink-0`}></i>
            <div className="flex-1 min-w-0">
                <span className="font-bold text-sm tracking-wide block leading-snug">{message}</span>
                {submessage && (
                    <span className="text-xs opacity-90 mt-1 block leading-snug">{submessage}</span>
                )}
            </div>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                }}
                className="ml-1 hover:opacity-75 transition-opacity flex-shrink-0 mt-0.5"
            >
                <i className="fas fa-times text-sm"></i>
            </button>
            <style>{`
                @keyframes bounce-in {
                    0% { transform: scale(0.9) translateY(-20px); opacity: 0; }
                    50% { transform: scale(1.05); }
                    100% { transform: scale(1) translateY(0); opacity: 1; }
                }
                .animate-bounce-in { animation: bounce-in 0.35s cubic-bezier(0.68, -0.55, 0.265, 1.55); }
            `}</style>
        </div>
    );
};

export default Toast;

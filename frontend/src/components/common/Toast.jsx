import React, { useEffect } from 'react';

const Toast = ({ message, type = 'success', onClose, duration = 3000, onClick }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const bgColors = {
        success: 'bg-emerald-600',
        error: 'bg-red-500',
        info: 'bg-blue-500',
        warning: 'bg-orange-500'
    };

    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        info: 'fas fa-info-circle',
        warning: 'fas fa-exclamation-triangle'
    };

    return (
        <div
            onClick={onClick}
            className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl text-white transform transition-all animate-bounce-in ${bgColors[type] || bgColors.success} ${onClick ? 'cursor-pointer hover:scale-105 active:scale-95' : ''}`}
        >
            <i className={`${icons[type] || icons.success} text-xl`}></i>
            <span className="font-bold text-sm tracking-wide">{message}</span>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                }}
                className="ml-4 hover:opacity-75 transition-opacity"
            >
                <i className="fas fa-times"></i>
            </button>
            <style>{`
                @keyframes bounce-in {
                    0% { transform: scale(0.9) translateY(-20px); opacity: 0; }
                    50% { transform: scale(1.05); }
                    100% { transform: scale(1) translateY(0); opacity: 1; }
                }
                .animate-bounce-in { animation: bounce-in 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55); }
            `}</style>
        </div>
    );
};

export default Toast;

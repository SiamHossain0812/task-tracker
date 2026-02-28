import React, { useState, useEffect } from 'react';

const LoadingScreen = () => {
    const [isVisible, setIsVisible] = useState(true);
    const [status, setStatus] = useState("Preparing Workspace...");

    const statusMessages = [
        "Preparing Workspace...",
        "Organizing Research Tasks...",
        "Syncing Laboratory Library...",
        "Finalizing Layout...",
        "Welcome, Researcher."
    ];

    useEffect(() => {
        const isFirstVisit = !sessionStorage.getItem('welcomeShown');

        if (!isFirstVisit) {
            setIsVisible(false);
            return;
        }

        let messageIndex = 0;
        const statusInterval = setInterval(() => {
            if (messageIndex < statusMessages.length) {
                setStatus(statusMessages[messageIndex]);
                messageIndex++;
            } else {
                clearInterval(statusInterval);
            }
        }, 600);

        const timer = setTimeout(() => {
            setIsVisible(false);
            sessionStorage.setItem('welcomeShown', 'true');
        }, 3500);

        return () => {
            clearInterval(statusInterval);
            clearTimeout(timer);
        };
    }, []);

    if (!isVisible) return null;

    return (
        <div
            id="loader-wrapper"
            className="fixed inset-0 z-[9999] bg-gradient-to-br from-[#064e3b] to-[#065f46] flex flex-col items-center justify-center transition-opacity duration-1000"
        >
            <div className="loader-icon mb-6 animate-pulse-science text-[3rem] text-[#10b981] drop-shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                <i className="fas fa-seedling"></i>
            </div>
            <div className="loader-title text-white text-2xl font-extrabold tracking-tight mb-2">
                Agromet Lab Workspace
            </div>
            <div className="loader-status text-[#6ee7b7] text-sm font-medium uppercase tracking-widest h-5 transition-opacity duration-300">
                {status}
            </div>
            <div className="dna-bar w-[150px] h-1 bg-white/10 rounded-full mt-8 overflow-hidden relative">
                <div className="dna-progress absolute -left-full w-full h-full bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-dna-scan"></div>
            </div>
            <div className="mt-6 text-emerald-300/40 text-[10px] font-mono tracking-widest uppercase">
                Agromet Lab Task Tracker v4.1 Beta
            </div>

            <style>{`
        @keyframes dna-scan {
          100% { left: 100%; }
        }
        @keyframes pulse-science {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.1); opacity: 1; }
        }
        .animate-pulse-science {
          animation: pulse-science 2s infinite ease-in-out;
        }
        .animate-dna-scan {
          animation: dna-scan 1.5s infinite linear;
        }
      `}</style>
        </div>
    );
};

export default LoadingScreen;

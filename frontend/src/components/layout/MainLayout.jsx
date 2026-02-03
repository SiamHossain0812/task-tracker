import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import NotificationPrompt from '../common/NotificationPrompt';

const MainLayout = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex bg-[#F4F7FE] h-screen w-full overflow-hidden selection:bg-emerald-500 selection:text-white">
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-gray-900/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}

            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <div className="flex-1 flex flex-col h-full relative overflow-hidden">
                <Header onMenuToggle={() => setIsSidebarOpen(true)} />
                <main className="flex-1 overflow-x-hidden overflow-y-auto px-4 md:px-8 pb-8 custom-scrollbar">
                    {children}
                </main>
            </div>

            {/* Notification Permission Prompt */}
            <NotificationPrompt />

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            `}</style>
        </div>
    );
};

export default MainLayout;

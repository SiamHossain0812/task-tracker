import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import NotificationPrompt from '../common/NotificationPrompt';
import PersonalNotesDrawer from '../notes/PersonalNotesDrawer';

const MainLayout = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isNotesOpen, setIsNotesOpen] = useState(false);

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

            {/* Personal Notes Drawer */}
            <PersonalNotesDrawer isOpen={isNotesOpen} onClose={() => setIsNotesOpen(false)} />

            {/* Floating Action Button for Notes */}
            <button
                onClick={() => setIsNotesOpen(true)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl shadow-2xl shadow-indigo-200 flex items-center justify-center z-30 transition-all hover:scale-110 group"
                title="My Notes"
            >
                <i className="fas fa-sticky-note text-xl group-hover:rotate-12 transition-transform"></i>
            </button>

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

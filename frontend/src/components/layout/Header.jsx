import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationCenter from './NotificationCenter';

const Header = ({ onMenuToggle }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (e) => {
        if (e.key === 'Enter' && searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
        }
    };

    return (
        <header className="h-24 bg-transparent flex items-center justify-between px-8 shrink-0 z-20">
            {/* Mobile Menu Group */}
            <div className="flex items-center gap-2.5 md:hidden">
                <button
                    onClick={onMenuToggle}
                    className="p-2 -ml-2 text-gray-700 hover:text-emerald-600 transition-colors"
                >
                    <i className="fas fa-bars text-xl"></i>
                </button>
                <div className="flex flex-col justify-center border-l border-gray-100 pl-3">
                    <span className="text-[13px] font-black text-gray-900 leading-tight uppercase tracking-tight">
                        Dr. Niaz's
                    </span>
                    <span className="text-[10px] text-emerald-600 font-bold tracking-widest uppercase -mt-0.5">
                        Personal Agenda
                    </span>
                </div>
            </div>

            {/* Search (Desktop) */}
            <div className="hidden md:flex items-center flex-1 max-w-xl pl-8">
                <div className="w-full relative group">
                    <input
                        type="text"
                        placeholder="Search task"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleSearch}
                        className="w-full bg-white px-6 py-3.5 pl-12 rounded-2xl border border-transparent focus:border-emerald-200 focus:shadow-lg focus:shadow-emerald-100/50 outline-none text-sm font-medium transition-all duration-300 group-hover:bg-white/80"
                    />
                    <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors"></i>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 px-2 py-1 rounded-md bg-gray-100 text-xs text-gray-500 font-bold hidden lg:block">
                        ⌘ F
                    </div>
                </div>
            </div>

            {/* Header Right */}
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-3 pl-2 border-l border-gray-200">
                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden ring-2 ring-white shadow-md hover:ring-emerald-200 transition-all cursor-pointer">
                        {user?.image_url ? (
                            <img src={user.image_url} alt="Profile" className="w-full h-full object-cover" />
                        ) : user?.is_superuser ? (
                            <img src="/dr_niaz_flat_green.png" alt="Profile" className="w-full h-full object-contain bg-emerald-50" onError={(e) => { e.target.src = "https://ui-avatars.com/api/?name=Dr+Niaz&background=10b981&color=fff"; }} />
                        ) : (
                            <div className="w-full h-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
                                {user?.first_name?.[0] || user?.username?.[0] || '?'}
                            </div>
                        )}
                    </div>
                    <div className="hidden lg:block text-left relative group">
                        <div className="text-sm font-bold text-gray-800 leading-tight">
                            {user?.first_name || user?.username}
                        </div>
                        <div className="text-xs text-gray-400">
                            {user?.is_superuser ? 'Admin' : 'Collaborator'}
                        </div>

                        {/* Dropdown for Logout */}
                        <div className="absolute right-0 top-full mt-2 w-32 bg-white rounded-xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                            <button
                                onClick={logout}
                                className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg m-1"
                            >
                                <i className="fas fa-sign-out-alt mr-2"></i>Logout
                            </button>
                        </div>
                    </div>
                    <NotificationCenter />
                </div>
            </div>
        </header>
    );
};

export default Header;

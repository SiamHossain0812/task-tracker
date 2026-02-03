import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
    const { user, logout } = useAuth();

    const links = [
        { to: "/", icon: "fas fa-th-large", label: "Dashboard", adminOnly: true },
        { to: "/projects", icon: "fas fa-folder-open", label: "Projects", adminOnly: true },
        { to: "/tasks", icon: "fas fa-tasks", label: "Tasks", adminOnly: false },
        { to: "/calendar", icon: "far fa-calendar", label: "Calendar", adminOnly: true },
        { to: "/meetings", icon: "fas fa-video", label: "Meetings", adminOnly: false },
        { to: "/analytics", icon: "fas fa-chart-pie", label: "Analytics", adminOnly: true },
        { to: "/collaborators", icon: "fas fa-users", label: "Team", adminOnly: true },
        { to: "/auth/requests", icon: "fas fa-user-plus", label: "Access Requests", adminOnly: true },
    ];

    const filteredLinks = links.filter(link => !link.adminOnly || user?.is_superuser);

    return (
        <aside
            id="sidebar"
            className={`fixed inset-y-0 left-0 z-50 w-64 bg-white h-full flex flex-col shrink-0 border-r border-gray-100 
                 transition-transform duration-300 ease-in-out md:sticky md:inset-auto md:translate-x-0 
                 font-medium shadow-2xl md:shadow-none ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
            {/* Logo */}
            <div className="h-24 flex items-center px-8 relative">
                <NavLink to="/" className="flex items-center gap-3" onClick={onClose}>
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white text-xl shadow-lg shadow-emerald-200">
                        <i className="fas fa-check-double"></i>
                    </div>
                    <span className="text-lg font-bold text-gray-800 tracking-tight leading-tight">
                        Dr. Niaz's<br />Agenda Tracker
                    </span>
                </NavLink>
                {/* Close Button (Mobile) */}
                <button
                    onClick={onClose}
                    className="md:hidden absolute right-4 text-gray-400 hover:text-gray-600"
                >
                    <i className="fas fa-times"></i>
                </button>
            </div>

            {/* Menu */}
            <div className="flex-1 overflow-y-auto no-scrollbar py-4 px-4 space-y-8">
                {/* Main Group */}
                <div>
                    <h3 className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Menu</h3>
                    <nav className="space-y-1">
                        {filteredLinks.map((link) => (
                            <NavLink
                                key={link.to}
                                to={link.to}
                                className={({ isActive }) =>
                                    `sidebar-link relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                        ? 'text-emerald-600 bg-emerald-50 active'
                                        : 'text-gray-500 hover:text-emerald-600 hover:bg-emerald-50'
                                    }`
                                }
                                onClick={onClose}
                            >
                                <i className={`${link.icon} w-5 text-center`}></i>
                                <span>{link.label}</span>
                            </NavLink>
                        ))}
                    </nav>
                </div>

                {/* General Group */}
                <div>
                    <h3 className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">General</h3>
                    <nav className="space-y-1">
                        <NavLink
                            to="/about"
                            className={({ isActive }) =>
                                `sidebar-link relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                    ? 'text-emerald-600 bg-emerald-50 active'
                                    : 'text-gray-500 hover:text-emerald-600 hover:bg-emerald-50'
                                }`
                            }
                            onClick={onClose}
                        >
                            <i className="far fa-id-card w-5 text-center"></i>
                            <span>About</span>
                        </NavLink>
                        <NavLink
                            to="/settings"
                            className={({ isActive }) =>
                                `sidebar-link relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                    ? 'text-emerald-600 bg-emerald-50 active'
                                    : 'text-gray-500 hover:text-emerald-600 hover:bg-emerald-50'
                                }`
                            }
                            onClick={onClose}
                        >
                            <i className="fas fa-cog w-5 text-center"></i>
                            <span>Settings</span>
                        </NavLink>
                        <button
                            onClick={() => {
                                onClose();
                                logout();
                            }}
                            className="w-full sidebar-link relative flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-red-600 rounded-xl hover:bg-red-50 transition-all"
                        >
                            <i className="fas fa-sign-out-alt w-5 text-center"></i>
                            <span>Logout</span>
                        </button>
                    </nav>
                </div>
            </div>

            <style>{`
                .sidebar-link.active::before {
                    content: '';
                    position: absolute;
                    left: 0;
                    top: 50%;
                    transform: translateY(-50%);
                    height: 24px;
                    width: 4px;
                    background-color: #059669;
                    border-top-right-radius: 4px;
                    border-bottom-right-radius: 4px;
                }
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </aside>
    );
};

export default Sidebar;

import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
    const { user, logout } = useAuth();

    const [openMenus, setOpenMenus] = React.useState({
        tasks: false,
        admin: true // Admin menu open by default for visibility
    });

    const toggleMenu = (menu) => {
        setOpenMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
    };

    const navigation = [
        {
            title: "Overview",
            items: [
                { to: "/", icon: "fas fa-th-large", label: "Dashboard", end: true }
            ]
        },
        {
            title: "Execution & Projects",
            items: [
                { to: "/projects", icon: "fas fa-folder-open", label: "Projects", end: true },
                {
                    label: "Tasks",
                    icon: "fas fa-tasks",
                    id: "tasks",
                    subItems: [
                        { to: "/tasks", label: "Active Tasks", icon: "fas fa-list-check", end: true },
                        { to: "/tasks/archived", label: "Archived Tasks", icon: "fas fa-archive" }
                    ]
                },
                { to: "/meetings", icon: "fas fa-video", label: "Meetings" },
                { to: "/calendar", icon: "far fa-calendar", label: "Calendar" }
            ]
        },
        {
            title: "Personal Workspace",
            items: [
                { to: "/about", icon: "fas fa-user-circle", label: "My Profile" },
                { to: "/schedules", icon: "fas fa-clock", label: "My Schedule" },
                {
                    to: "/project-requests",
                    icon: "fas fa-file-contract",
                    label: user?.is_superuser ? "Requested Projects" : "Project Requests"
                }
            ]
        },
        ...(user?.is_superuser ? [{
            title: "Administration",
            id: "admin",
            items: [
                { to: "/collaborators", icon: "fas fa-users", label: "Team Management" },
                {
                    label: "Performance & Data",
                    icon: "fas fa-chart-line",
                    subItems: [
                        { to: "/analytics", label: "Analytics", icon: "fas fa-chart-pie" },
                        { to: "/performance", label: "KPIs Dashboard", icon: "fas fa-tachometer-alt" }
                    ]
                },
                { to: "/auth/requests", icon: "fas fa-user-plus", label: "Access Requests" }
            ]
        }] : [])
    ];

    const renderLink = (link, isSubItem = false) => {
        if (link.adminOnly && !user?.is_superuser) return null;

        const commonClasses = ({ isActive }) =>
            `sidebar-link relative flex items-center gap-3 rounded-xl transition-all ${isSubItem ? 'pl-11 pr-4 py-2 text-sm' : 'px-4 py-3'
            } ${isActive
                ? 'text-emerald-600 bg-emerald-50 active'
                : 'text-gray-500 hover:text-emerald-600 hover:bg-emerald-50'
            }`;

        if (link.subItems) {
            const isOpen = openMenus[link.id || link.label.toLowerCase()];
            return (
                <div key={link.label} className="space-y-1">
                    <button
                        onClick={() => toggleMenu(link.id || link.label.toLowerCase())}
                        className={`w-full flex items-center justify-between px-4 py-3 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all`}
                    >
                        <div className="flex items-center gap-3">
                            <i className={`${link.icon} w-5 text-center`}></i>
                            <span>{link.label}</span>
                        </div>
                        <i className={`fas fa-chevron-right text-[10px] transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`}></i>
                    </button>
                    {isOpen && (
                        <div className="space-y-1 mt-1">
                            {link.subItems.map(subItem => renderLink(subItem, true))}
                        </div>
                    )}
                </div>
            );
        }

        return (
            <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={commonClasses}
                onClick={onClose}
            >
                <i className={`${link.icon} ${isSubItem ? 'w-4 text-[12px]' : 'w-5'} text-center`}></i>
                <span>{link.label}</span>
            </NavLink>
        );
    };

    return (
        <aside
            id="sidebar"
            className={`fixed inset-y-0 left-0 z-50 w-64 bg-white h-full flex flex-col shrink-0 border-r border-gray-100 
                 transition-transform duration-300 ease-in-out md:sticky md:inset-auto md:translate-x-0 
                 font-medium shadow-2xl md:shadow-none ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
            {/* Logo Section */}
            <div className="h-24 flex items-center px-8 relative shrink-0">
                <NavLink to="/" className="flex items-center gap-3" onClick={onClose}>
                    <div className="w-12 h-12 flex items-center justify-center shrink-0">
                        <img src="/images/brri-logo.png" alt="BRRI Logo" className="w-full h-full object-contain" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-lg font-bold text-gray-800 tracking-tight leading-tight">
                            Agromet Lab<br />Task Tracker
                        </span>
                        <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full w-fit mt-1 uppercase tracking-wider">
                            v8.0 BETA
                        </span>
                    </div>
                </NavLink>
                <button onClick={onClose} className="md:hidden absolute right-4 text-gray-400 hover:text-gray-600">
                    <i className="fas fa-times"></i>
                </button>
            </div>

            {/* Structured Navigation */}
            <div className="flex-1 overflow-y-auto no-scrollbar py-6 px-4 space-y-8">
                {navigation.map((section) => (
                    <div key={section.title}>
                        <h3 className="px-4 text-[11px] font-bold text-gray-400 uppercase tracking-[0.1em] mb-3">
                            {section.title}
                        </h3>
                        <nav className="space-y-1">
                            {section.items.map(item => renderLink(item))}
                        </nav>
                    </div>
                ))}

                {/* Footer Group */}
                <div className="pt-4 border-t border-gray-50">
                    <h3 className="px-4 text-[11px] font-bold text-gray-400 uppercase tracking-[0.1em] mb-3">Configuration</h3>
                    <nav className="space-y-1">
                        <NavLink
                            to="/settings"
                            end={true}
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
                            onClick={() => { onClose(); logout(); }}
                            className="w-full sidebar-link relative flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-red-600 rounded-xl hover:bg-red-50 transition-all font-medium"
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

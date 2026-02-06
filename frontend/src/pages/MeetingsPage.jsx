import React, { useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

const MeetingsPage = () => {
    const { user } = useAuth();
    const [meetings, setMeetings] = useState([]);
    const [allCollaborators, setAllCollaborators] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingCollaborators, setEditingCollaborators] = useState(null);
    const [updating, setUpdating] = useState(false);

    const dropdownRef = useRef(null);

    const fetchMeetings = async () => {
        try {
            const response = await apiClient.get('agendas/');
            const allAgendas = response.data.results || response.data;
            // Filter to only show meetings with links
            const meetingsWithLinks = allAgendas.filter(item => item.meeting_link && item.meeting_link.trim() !== '');
            setMeetings(meetingsWithLinks);
        } catch (err) {
            console.error('Failed to fetch meetings', err);
            setError('Failed to load meetings');
        } finally {
            setLoading(false);
        }
    };

    const fetchCollaborators = async () => {
        try {
            const response = await apiClient.get('collaborators/');
            setAllCollaborators(response.data);
        } catch (err) {
            console.error('Failed to fetch collaborators', err);
        }
    };

    useEffect(() => {
        fetchMeetings();
        fetchCollaborators();

        // Check for auth success in URL
        const params = new URLSearchParams(window.location.search);
        if (params.get('auth') === 'success') {
            const successDiv = document.createElement('div');
            successDiv.className = 'fixed top-4 right-4 bg-emerald-500 text-white px-6 py-3 rounded-xl shadow-2xl z-50 animate-bounce font-bold flex items-center gap-2';
            successDiv.innerHTML = '<i class="fas fa-check-circle"></i> Google Account Connected!';
            document.body.appendChild(successDiv);
            window.history.replaceState({}, document.title, window.location.pathname);
            setTimeout(() => {
                successDiv.classList.add('opacity-0', 'transition-opacity');
                setTimeout(() => successDiv.remove(), 500);
            }, 3000);
        }

        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setEditingCollaborators(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to cancel this meeting?')) return;
        try {
            await apiClient.delete(`agendas/${id}/`);
            fetchMeetings();
        } catch (err) {
            console.error('Failed to delete meeting', err);
            alert('Failed to cancel meeting');
        }
    };

    const handleShare = (link) => {
        navigator.clipboard.writeText(link);
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-2xl shadow-2xl z-50 font-bold flex items-center gap-2 animate-fade-in';
        toast.innerHTML = '<i class="fas fa-copy text-emerald-400"></i> Link copied to clipboard!';
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('opacity-0', 'transition-opacity');
            setTimeout(() => toast.remove(), 500);
        }, 2000);
    };

    const toggleCollaborator = async (meeting, collabId) => {
        setUpdating(true);
        try {
            // Check if serializer expects collaborator_ids for update
            // Based on serializers.py, it takes collaborator_ids in write_only field
            const agendaResponse = await apiClient.get(`agendas/${meeting.id}/`);
            const currentIds = agendaResponse.data.collaborators.map(c => c.id);

            let newIds;
            if (currentIds.includes(collabId)) {
                newIds = currentIds.filter(id => id !== collabId);
            } else {
                newIds = [...currentIds, collabId];
            }

            await apiClient.patch(`agendas/${meeting.id}/`, {
                collaborator_ids: newIds
            });
            fetchMeetings();
        } catch (err) {
            console.error('Failed to update collaborators', err);
            alert('Failed to update participants');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
        </div>
    );

    return (
        <div className="animate-fade-in h-full flex flex-col pb-8">
            {/* Page Header */}
            <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800 tracking-tight mb-1">Scheduled Meetings</h2>
                    <p className="text-gray-400 font-medium font-mono text-sm">Agromet Lab Coordination Hub</p>
                </div>
                {user?.is_superuser && (
                    <NavLink
                        to="/meetings/new"
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-200 transition-all flex items-center gap-2"
                    >
                        <i className="fas fa-calendar-plus text-sm"></i>
                        <span>Schedule Meeting</span>
                    </NavLink>
                )}
            </div>

            {/* Meetings List */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                {meetings.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {meetings.map(meeting => (
                            <div key={meeting.id} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 relative hover:shadow-md transition-all flex flex-col group border-b-4 border-b-emerald-500/10">
                                {/* Admin Actions */}
                                {user?.is_superuser && (
                                    <button
                                        onClick={() => handleDelete(meeting.id)}
                                        className="absolute top-5 right-5 w-9 h-9 rounded-xl flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors z-10"
                                    >
                                        <i className="fas fa-trash-alt text-sm"></i>
                                    </button>
                                )}

                                {/* Header: Icon + Title */}
                                <div className="flex items-start gap-4 mb-4 pr-10">
                                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl shadow-sm shrink-0">
                                        <i className="fas fa-video"></i>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800 leading-snug mb-1">{meeting.title}</h3>
                                        <div className="flex items-center gap-1 text-xs font-bold text-gray-400">
                                            <i className="fas fa-user-circle"></i>
                                            <span>Organized by: {meeting.creator_name || 'Admin'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Description */}
                                {meeting.description && (
                                    <p className="text-sm text-gray-500 line-clamp-2 mb-4 bg-gray-50/50 p-3 rounded-xl border border-gray-50 italic">
                                        "{meeting.description}"
                                    </p>
                                )}

                                {/* Meta Info */}
                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <div className="bg-white border border-gray-100 p-3 rounded-2xl flex flex-col gap-1">
                                        <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Schedule</span>
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                                            <i className="far fa-calendar-alt text-emerald-500"></i>
                                            <span>{meeting.date}</span>
                                        </div>
                                        {meeting.time && (
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 ml-4">
                                                <span>{meeting.time}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="bg-white border border-gray-100 p-3 rounded-2xl flex flex-col gap-1">
                                        <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Participants</span>
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                                            <i className="fas fa-users text-indigo-500"></i>
                                            <span>{meeting.collaborator_count} People</span>
                                        </div>
                                        {/* Quick Add Participants Toggle */}
                                        {user?.is_superuser && (
                                            <button
                                                onClick={() => setEditingCollaborators(editingCollaborators === meeting.id ? null : meeting.id)}
                                                className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 underline mt-1 text-left"
                                            >
                                                + Manage
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Collaborator Selector Dropdown */}
                                {editingCollaborators === meeting.id && (
                                    <div ref={dropdownRef} className="absolute inset-x-6 top-[200px] z-50 bg-white border border-gray-100 rounded-2xl shadow-2xl p-2 animate-fade-in max-h-[250px] overflow-hidden flex flex-col">
                                        <div className="px-3 py-2 border-b border-gray-50 flex justify-between items-center">
                                            <span className="text-xs font-bold text-gray-500">Select Participants</span>
                                            {updating && <i className="fas fa-spinner animate-spin text-xs text-emerald-500"></i>}
                                        </div>
                                        <div className="overflow-y-auto custom-scrollbar p-1 space-y-0.5">
                                            {allCollaborators.map(collab => (
                                                <button
                                                    key={collab.id}
                                                    disabled={updating}
                                                    onClick={() => toggleCollaborator(meeting, collab.id)}
                                                    className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors flex items-center justify-between group ${meeting.collaborators?.some(c => c.id === collab.id) ||
                                                            // Fallback for list serializer collaborator_count vs detail serializer collaborators array
                                                            meeting.collaborator_count > 0 && meeting.collaborators?.some(c => c.id === collab.id)
                                                            ? 'bg-emerald-50 text-emerald-700'
                                                            : 'hover:bg-gray-50 text-gray-600'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-gray-100 text-[10px] flex items-center justify-center">
                                                            {collab.name[0]}
                                                        </div>
                                                        {collab.name}
                                                    </div>
                                                    {meeting.collaborators?.some(c => c.id === collab.id) && (
                                                        <i className="fas fa-check text-[10px]"></i>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Card Actions */}
                                <div className="mt-auto flex flex-col gap-2">
                                    <div className="flex gap-2">
                                        {meeting.meeting_link && (
                                            <button
                                                onClick={() => handleShare(meeting.meeting_link)}
                                                className="flex-1 py-3 bg-gray-50 text-gray-600 font-bold rounded-2xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 border border-gray-100"
                                                title="Copy connection link"
                                            >
                                                <i className="fas fa-share-alt"></i>
                                                <span>Share</span>
                                            </button>
                                        )}
                                        {meeting.meeting_link ? (
                                            <a
                                                href={meeting.meeting_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-[2] py-3 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 transform active:scale-95"
                                            >
                                                <i className="fas fa-video text-sm"></i>
                                                Join Meeting
                                            </a>
                                        ) : (
                                            <div className="w-full py-3 bg-gray-50 text-gray-400 font-bold rounded-2xl text-center border-2 border-dashed border-gray-200 cursor-not-allowed text-xs">
                                                Link Pending Configuration
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-[3rem] border-2 border-dashed border-gray-100 p-20 text-center flex flex-col items-center">
                        <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-6 text-emerald-200">
                            <i className="fas fa-calendar-check text-4xl"></i>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">Clean Slate!</h3>
                        <p className="text-gray-400 max-w-xs mx-auto">No upcoming meetings scheduled. Time to brainstorm your next big move?</p>
                        {user?.is_superuser && (
                            <NavLink to="/meetings/new" className="mt-8 text-emerald-600 font-bold flex items-center gap-2 hover:gap-3 transition-all">
                                Schedule Now <i className="fas fa-arrow-right"></i>
                            </NavLink>
                        )}
                    </div>
                )}
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                @keyframes fade-in { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fade-in 0.3s ease-out; }
            `}</style>
        </div>
    );
};

export default MeetingsPage;

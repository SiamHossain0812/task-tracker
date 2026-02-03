import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

const MeetingsPage = () => {
    const { user } = useAuth();
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchMeetings = async () => {
        try {
            // Fetch all agendas (tasks and meetings) that have meeting links
            const response = await apiClient.get('agendas/');
            // Filter to only show items with meeting links
            // API returns paginated response: {count, next, previous, results}
            const allAgendas = response.data.results || response.data;
            const meetingsWithLinks = allAgendas.filter(item => item.meeting_link && item.meeting_link.trim() !== '');
            setMeetings(meetingsWithLinks);
        } catch (err) {
            console.error('Failed to fetch meetings', err);
            setError('Failed to load meetings');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMeetings();

        // Check for auth success in URL
        const params = new URLSearchParams(window.location.search);
        if (params.get('auth') === 'success') {
            // Show success message and clean up URL
            const successDiv = document.createElement('div');
            successDiv.className = 'fixed top-4 right-4 bg-emerald-500 text-white px-6 py-3 rounded-xl shadow-2xl z-50 animate-bounce font-bold flex items-center gap-2';
            successDiv.innerHTML = '<i class="fas fa-check-circle"></i> Google Account Connected!';
            document.body.appendChild(successDiv);

            // Remove the query param from URL without refreshing
            window.history.replaceState({}, document.title, window.location.pathname);

            setTimeout(() => {
                successDiv.classList.add('opacity-0', 'transition-opacity');
                setTimeout(() => successDiv.remove(), 500);
            }, 3000);
        }
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
                    <p className="text-gray-400 font-medium">Coordinate with your team</p>
                </div>
                {user?.is_superuser && (
                    <NavLink
                        to="/meetings/new"
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center gap-2"
                    >
                        <i className="fas fa-calendar-plus"></i>
                        <span>Schedule Meeting</span>
                    </NavLink>
                )}
            </div>

            {/* Meetings List */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                {meetings.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {meetings.map(meeting => (
                            <div key={meeting.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 relative hover:shadow-md transition-shadow flex flex-col">
                                {/* Admin Actions - Absolute Top Right */}
                                {user?.is_superuser && (
                                    <button
                                        onClick={() => handleDelete(meeting.id)}
                                        className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors z-10"
                                    >
                                        <i className="fas fa-trash text-xs"></i>
                                    </button>
                                )}

                                {/* Header: Icon + Title */}
                                <div className="flex items-start gap-4 mb-3 pr-8">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl shadow-sm shrink-0">
                                        <i className="fas fa-video"></i>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800 leading-snug mb-1">{meeting.title}</h3>
                                        {meeting.description && <p className="text-sm text-gray-400 line-clamp-2">{meeting.description}</p>}
                                    </div>
                                </div>

                                {/* Meta Info */}
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium text-gray-500 mb-5">
                                    <div className="flex items-center gap-1.5">
                                        <i className="far fa-calendar text-gray-400"></i>
                                        <span>{meeting.date}</span>
                                        {meeting.time && <span>• {meeting.time}</span>}
                                    </div>

                                    {meeting.collaborator_count > 0 && (
                                        <div className="flex items-center gap-1.5">
                                            <i className="fas fa-users text-gray-400"></i>
                                            <span>{meeting.collaborator_count} Participants</span>
                                        </div>
                                    )}
                                </div>

                                {/* Join Button - Push to bottom */}
                                <div className="mt-auto">
                                    {meeting.meeting_link ? (
                                        <a
                                            href={meeting.meeting_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                                        >
                                            <i className="fas fa-video"></i>
                                            Join Meeting
                                        </a>
                                    ) : (
                                        <div className="w-full py-3 bg-gray-50 text-gray-400 font-bold rounded-xl text-center border dashed border-gray-200 cursor-not-allowed">
                                            No Link Available
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-12 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                            <i className="far fa-calendar-times text-2xl"></i>
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 mb-1">No upcoming meetings</h3>
                        <p className="text-gray-400">Schedule a meeting to get started.</p>
                    </div>
                )}
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                .animate-fade-in { animation: fade-in 0.3s ease-out; }
            `}</style>
        </div>
    );
};

export default MeetingsPage;

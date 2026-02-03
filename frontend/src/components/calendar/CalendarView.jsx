import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    isSameMonth,
    isSameDay,
    addDays,
    eachDayOfInterval,
    parseISO
} from 'date-fns';
import apiClient from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const CalendarView = () => {
    const { user } = useAuth();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const response = await apiClient.get('calendar/');
                setEvents(response.data);
            } catch (error) {
                console.error('Failed to fetch calendar events', error);
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, []);

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const goToToday = () => setCurrentMonth(new Date());

    const renderHeader = () => {
        return (
            <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 shrink-0">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 tracking-tight mb-1">Calendar</h2>
                    <p className="text-sm sm:text-base text-gray-400 font-medium">Your schedule at a glance</p>
                </div>
                <NavLink
                    to="/tasks/new"
                    className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2"
                >
                    <i className="fas fa-plus"></i>
                    <span>New Task</span>
                </NavLink>
            </div>
        );
    };

    const renderCalendar = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        const dateFormat = "d";
        const rows = [];
        let days = [];
        let day = startDate;
        let formattedDate = "";

        const allDays = eachDayOfInterval({ start: startDate, end: endDate });

        return (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
                {/* Custom Header Nav */}
                <div className="px-4 py-4 sm:px-6 sm:py-5 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center justify-between">
                        <button onClick={prevMonth} className="p-1.5 sm:p-2 rounded-xl text-gray-400 hover:text-gray-800 hover:bg-white border border-transparent hover:border-gray-200 transition-all">
                            <i className="fas fa-chevron-left text-sm sm:text-base"></i>
                        </button>

                        <div className="text-center flex items-center gap-2 sm:gap-4">
                            <h3 className="text-lg sm:text-2xl font-bold text-gray-800">
                                {format(currentMonth, "MMMM yyyy")}
                            </h3>
                            {!isSameMonth(currentMonth, new Date()) && (
                                <button onClick={goToToday} className="px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] sm:text-xs font-bold uppercase tracking-wider hover:bg-emerald-100 transition-colors">
                                    Today
                                </button>
                            )}
                        </div>

                        <button onClick={nextMonth} className="p-1.5 sm:p-2 rounded-xl text-gray-400 hover:text-gray-800 hover:bg-white border border-transparent hover:border-gray-200 transition-all">
                            <i className="fas fa-chevron-right text-sm sm:text-base"></i>
                        </button>
                    </div>
                </div>

                <div className="p-2 sm:p-6 flex flex-col">
                    {/* Day Headers */}
                    <div className="grid grid-cols-7 gap-1 sm:gap-4 mb-2 sm:mb-4">
                        {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map(d => (
                            <div key={d} className="text-center text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider py-1">
                                <span className="hidden sm:inline">{d}</span>
                                <span className="sm:hidden">{d[0]}</span>
                            </div>
                        ))}
                    </div>

                    {/* Days Grid */}
                    <div className="grid grid-cols-7 gap-1 sm:gap-4">
                        {allDays.map((day, idx) => {
                            const isCurrentMonth = isSameMonth(day, monthStart);
                            const isToday = isSameDay(day, new Date());
                            const dayEvents = events.filter(e => isSameDay(parseISO(e.start), day));

                            return (
                                <div
                                    key={day.toString()}
                                    onClick={() => {
                                        setSelectedDate(day);
                                        setIsModalOpen(true);
                                    }}
                                    className={`min-h-[60px] sm:min-h-24 relative flex flex-col border border-gray-100 rounded-lg sm:rounded-2xl p-1 sm:p-2 transition-all hover:shadow-md hover:border-emerald-200 group cursor-pointer 
                                        ${!isCurrentMonth ? 'bg-gray-50/20' : isToday ? 'bg-emerald-50/30 ring-1 ring-emerald-500/20' : 'bg-white hover:bg-emerald-50/10'}`}
                                >
                                    <div className="flex items-center justify-between mb-1 sm:mb-2 pointer-events-none">
                                        <span className={`text-[10px] sm:text-sm font-bold w-5 h-5 sm:w-7 sm:h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200' : 'text-gray-700 bg-gray-50'}`}>
                                            {format(day, "d")}
                                        </span>
                                        {dayEvents.length > 0 && (
                                            <span className="text-[8px] sm:text-[10px] font-bold text-emerald-600 bg-emerald-100 px-1 sm:px-1.5 py-0.5 rounded-full">
                                                {dayEvents.length}
                                            </span>
                                        )}
                                    </div>
                                    <div className="space-y-0.5 sm:space-y-1 overflow-hidden flex-1 pointer-events-none">
                                        {dayEvents.slice(0, 2).map(event => (
                                            <div key={event.id} className={`px-1 py-0.5 rounded-md text-[8px] sm:text-[9px] font-medium truncate ${event.priority === 'high' ? 'bg-red-50 text-red-700' : event.priority === 'medium' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                                {event.title}
                                            </div>
                                        ))}
                                        {dayEvents.length > 2 && (
                                            <div className="text-[8px] text-gray-400 font-bold ml-1">+{dayEvents.length - 2}</div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    const renderLegend = () => (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm"></div>
                <span className="text-gray-500 font-medium">High Priority</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500 shadow-sm"></div>
                <span className="text-gray-500 font-medium">Medium Priority</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm"></div>
                <span className="text-gray-500 font-medium">Low Priority</span>
            </div>
        </div>
    );

    const renderModal = () => {
        if (!selectedDate || !isModalOpen) return null;
        const dayEvents = events.filter(e => isSameDay(parseISO(e.start), selectedDate));

        return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                <div
                    className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
                    onClick={() => setIsModalOpen(false)}
                ></div>
                <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden relative z-[61] animate-modal-enter">
                    <div className="bg-emerald-600 px-6 py-6 text-white relative">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/10 flex items-center justify-center hover:bg-black/20 transition-all"
                        >
                            <i className="fas fa-times text-sm"></i>
                        </button>
                        <div className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Details for</div>
                        <h3 className="text-2xl font-black leading-tight tracking-tight">
                            {format(selectedDate, "d MMMM yyyy")}
                        </h3>
                    </div>

                    <div className="p-6">
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-xs font-black uppercase tracking-wider text-gray-400">Scheduled Tasks</h4>
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-[10px] font-bold">
                                    {dayEvents.length}
                                </span>
                            </div>
                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {dayEvents.length === 0 ? (
                                    <div className="py-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                        <i className="fas fa-calendar-day text-gray-200 text-3xl mb-3 block"></i>
                                        <p className="text-gray-400 font-medium text-sm">No tasks for this day</p>
                                    </div>
                                ) : (
                                    dayEvents.map(event => (
                                        <div key={event.id} className="flex items-center gap-3 p-3 rounded-2xl border border-gray-100 hover:border-emerald-200 transition-all group bg-white shadow-sm hover:shadow-md">
                                            <div className={`w-1.5 h-10 rounded-full ${event.priority === 'high' ? 'bg-red-500' : (event.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500')}`}></div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-bold text-gray-800 leading-snug truncate">
                                                    {event.title}
                                                </div>
                                                <div className="flex items-center gap-3 mt-1">
                                                    {event.time && <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1"><i className="far fa-clock"></i> {event.time}</span>}
                                                    {event.project_name && <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-tighter">{event.project_name}</span>}
                                                </div>
                                            </div>
                                            <NavLink to={`/tasks/${event.id}/edit`} className="w-9 h-9 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
                                                <i className="fas fa-edit text-xs"></i>
                                            </NavLink>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {user?.is_superuser && (
                            <NavLink
                                to={`/tasks/new?date=${format(selectedDate, "yyyy-MM-dd")}`}
                                className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-xl shadow-gray-200"
                            >
                                <i className="fas fa-plus text-xs"></i>
                                Add New Task
                            </NavLink>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in flex flex-col h-full overflow-y-auto pb-8 custom-scrollbar">
            {renderHeader()}
            {renderCalendar()}
            {renderLegend()}
            {renderModal()}

            <style>{`
                @keyframes modal-enter {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .animate-modal-enter {
                    animation: modal-enter 0.3s ease-out forwards;
                }
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.4s ease-out;
                }
            `}</style>
        </div>
    );
};

export default CalendarView;

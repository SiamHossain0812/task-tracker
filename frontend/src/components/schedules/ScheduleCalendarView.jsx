import React, { useState, useEffect, useMemo } from 'react';
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
    parseISO,
} from 'date-fns';
import scheduleApi from '../../api/schedules';

const ScheduleCalendarView = ({ onEditSchedule }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const fetchAllSchedules = async () => {
            setLoading(true);
            try {
                // Fetch schedules using the generic list function (hoping no heavy pagination for calendar bounds)
                const response = await scheduleApi.list({ filter: 'all' });
                // Handle paginated or non-paginated response
                let allItems = response.data.results || response.data || [];
                
                // If the API paginates, we might need to fetch multiple pages, but for now we assume 
                // fetching 'all' filter or having a sufficient page size gets the relevant ones.
                // We'll map them to calendar events:
                setSchedules(allItems);
            } catch (err) {
                console.error("Failed to load schedules for calendar:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAllSchedules();
    }, []);

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const goToToday = () => setCurrentMonth(new Date());

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const allDays = eachDayOfInterval({ start: startDate, end: endDate });

    const getSchedulesForDay = (day) => {
        return schedules.filter(s => isSameDay(parseISO(s.date), day));
    };

    const renderModal = () => {
        if (!selectedDate || !isModalOpen) return null;
        const daySchedules = getSchedulesForDay(selectedDate);

        return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                <div
                    className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
                    onClick={() => setIsModalOpen(false)}
                ></div>
                <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden relative z-[61] animate-modal-enter">
                    <div className="bg-rose-500 px-6 py-6 text-white relative">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/10 flex items-center justify-center hover:bg-black/20 transition-all"
                        >
                            <i className="fas fa-times text-sm"></i>
                        </button>
                        <div className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Schedule for</div>
                        <h3 className="text-2xl font-black leading-tight tracking-tight">
                            {format(selectedDate, "d MMMM yyyy")}
                        </h3>
                    </div>

                    <div className="p-6">
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-xs font-black uppercase tracking-wider text-gray-400">Activities</h4>
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-[10px] font-bold">
                                    {daySchedules.length}
                                </span>
                            </div>
                            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                                {daySchedules.length === 0 ? (
                                    <div className="py-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                        <i className="fas fa-calendar-day text-gray-200 text-3xl mb-3 block"></i>
                                        <p className="text-gray-400 font-medium text-sm">Nothing scheduled for today</p>
                                    </div>
                                ) : (
                                    daySchedules.map(schedule => {
                                        return (
                                            <div key={schedule.id} className="flex items-center gap-3 p-3 rounded-2xl border border-gray-100 hover:border-rose-200 transition-all group bg-white shadow-sm hover:shadow-md">
                                                <div className={`w-1.5 h-10 rounded-full bg-rose-500`}></div>
                                                <div className="flex-1 min-w-0">
                                                    <div className={`text-sm font-bold leading-snug truncate flex items-center gap-1.5 ${schedule.status === 'done' ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                                        {schedule.subject}
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                                                        <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                                                            <i className="far fa-clock"></i>
                                                            {schedule.start_time ? schedule.start_time.substring(0,5) : '--:--'} - {schedule.end_time ? schedule.end_time.substring(0,5) : '--:--'}
                                                        </span>
                                                        {schedule.place && (
                                                            <span className="text-[10px] font-bold text-rose-600/80 flex items-center gap-1">
                                                                <i className="fas fa-map-marker-alt text-[8px]"></i> {schedule.place}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setIsModalOpen(false);
                                                        onEditSchedule(schedule);
                                                    }}
                                                    className="w-9 h-9 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                                    title="Edit Schedule"
                                                >
                                                    <i className="fas fa-edit text-xs"></i>
                                                </button>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-50/50 flex flex-col relative w-full overflow-hidden">
            {/* Calendar Controls */}
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
                            <button onClick={goToToday} className="px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-rose-50 text-rose-600 text-[10px] sm:text-xs font-bold uppercase tracking-wider hover:bg-rose-100 transition-colors">
                                Today
                            </button>
                        )}
                    </div>

                    <button onClick={nextMonth} className="p-1.5 sm:p-2 rounded-xl text-gray-400 hover:text-gray-800 hover:bg-white border border-transparent hover:border-gray-200 transition-all">
                        <i className="fas fa-chevron-right text-sm sm:text-base"></i>
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="p-2 sm:p-6 flex flex-col">
                <div className="grid grid-cols-7 gap-1 sm:gap-4 mb-2 sm:mb-4">
                    {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map(d => (
                        <div key={d} className="text-center text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider py-1">
                            <span className="hidden sm:inline">{d}</span>
                            <span className="sm:hidden">{d[0]}</span>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-1 sm:gap-4">
                    {allDays.map((day) => {
                        const isCurrentMonth = isSameMonth(day, monthStart);
                        const isToday = isSameDay(day, new Date());
                        const daySchedules = getSchedulesForDay(day);

                        return (
                            <div
                                key={day.toString()}
                                onClick={() => {
                                    setSelectedDate(day);
                                    setIsModalOpen(true);
                                }}
                                className={`min-h-[60px] sm:min-h-24 relative flex flex-col border border-gray-100 rounded-lg sm:rounded-2xl p-1 sm:p-2 transition-all hover:shadow-md hover:border-rose-200 group cursor-pointer 
                                    ${!isCurrentMonth ? 'bg-gray-50/20 opacity-50' : isToday ? 'bg-rose-50/30 ring-1 ring-rose-500/20' : 'bg-white hover:bg-rose-50/10'}`}
                            >
                                <div className="flex items-center justify-between mb-1 sm:mb-2 pointer-events-none">
                                    <span className={`text-[10px] sm:text-sm font-bold w-5 h-5 sm:w-7 sm:h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-rose-500 text-white shadow-sm shadow-rose-200' : 'text-gray-700 bg-gray-50'}`}>
                                        {format(day, "d")}
                                    </span>
                                    {daySchedules.length > 0 && (
                                        <span className="text-[8px] sm:text-[10px] font-bold text-rose-600 bg-rose-100 px-1 sm:px-1.5 py-0.5 rounded-full">
                                            {daySchedules.length}
                                        </span>
                                    )}
                                </div>
                                <div className="space-y-0.5 sm:space-y-1 overflow-hidden flex-1 pointer-events-none">
                                    {daySchedules.slice(0, 3).map(sched => (
                                        <div key={sched.id} className="px-1 py-0.5 rounded-md text-[8px] sm:text-[9px] font-medium truncate border-l-2 bg-rose-50 text-rose-700 border-rose-200">
                                            {sched.subject}
                                        </div>
                                    ))}
                                    {daySchedules.length > 3 && (
                                        <div className="text-[8px] text-gray-400 font-bold ml-1">+{daySchedules.length - 3} more</div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            
            {renderModal()}
        </div>
    );
};

export default ScheduleCalendarView;

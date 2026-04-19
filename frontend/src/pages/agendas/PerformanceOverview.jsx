import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { collaboratorService } from '../../api/collaborators';
import { toast } from 'react-hot-toast';

/* ── tiny reusable bar ── */
const Bar = ({ value, color = '#6366f1' }) => (
    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(value, 100)}%`, background: color }} />
    </div>
);

/* ── star row ── */
const Stars = ({ quality }) => {
    const n = Math.round((quality / 100) * 5);
    return (
        <div className="flex items-center gap-0.5">
            {[1,2,3,4,5].map(i => (
                <i key={i} className={`fas fa-star text-[10px] ${i <= n ? 'text-amber-400' : 'text-gray-200'}`} />
            ))}
            <span className="ml-1.5 text-[10px] font-bold text-gray-400">{n}/5</span>
        </div>
    );
};

/* ── score tile ── */
const ScoreTile = ({ score }) => {
    const color = score >= 70 ? { bg: 'bg-emerald-600', shadow: 'shadow-emerald-100' }
                : score >= 50 ? { bg: 'bg-amber-500',   shadow: 'shadow-amber-100'   }
                :               { bg: 'bg-rose-500',     shadow: 'shadow-rose-100'    };
    return (
        <span className={`inline-flex items-center justify-center w-11 h-11 rounded-2xl font-black text-sm text-white shadow-lg ${color.bg} ${color.shadow}`}>
            {score}
        </span>
    );
};

/* ── status badge ── */
const StatusBadge = ({ score }) => {
    const cat = score >= 85 ? { label: 'Excellent',  cls: 'bg-amber-50 text-amber-700  border-amber-200',  dot: 'bg-amber-400'  }
              : score >= 70 ? { label: 'Good',        cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-400' }
              : score >= 50 ? { label: 'Average',     cls: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-orange-400'  }
              :               { label: 'Needs Work',  cls: 'bg-rose-50 text-rose-700 border-rose-200',  dot: 'bg-rose-400'   };
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${cat.cls}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cat.dot}`} />
            {cat.label}
        </span>
    );
};

const PRESETS = [
    { label: 'This Week',    key: 'week' },
    { label: 'This Month',   key: 'month' },
    { label: 'Last Quarter', key: 'quarter' },
    { label: 'All Time',     key: 'all' },
];

const PerformanceOverview = () => {
    const { user }    = useAuth();
    const navigate    = useNavigate();
    const [startDate, setStartDate] = useState('');
    const [endDate,   setEndDate]   = useState('');
    const [preset,    setPreset]    = useState('all');
    const [loading,   setLoading]   = useState(true);
    const [collaborators, setCollaborators] = useState([]);
    const [summary, setSummary]     = useState({ avg: 0, top: null, tasks: 0 });
    const [sortBy,  setSortBy]      = useState('score');

    const applyPreset = (key) => {
        setPreset(key);
        if (key === 'all') { setStartDate(''); setEndDate(''); return; }
        const today = new Date();
        const s = new Date(today);
        if (key === 'week')    s.setDate(today.getDate()    - 7);
        if (key === 'month')   s.setMonth(today.getMonth()  - 1);
        if (key === 'quarter') s.setMonth(today.getMonth()  - 3);
        setStartDate(s.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
    };

    const fetchAll = async (start, end) => {
        setLoading(true);
        try {
            const { data: team } = await collaboratorService.getAll();
            const results = await Promise.all(
                team.map(c => collaboratorService.getPerformance(c.id, start || null, end || null)
                    .then(r => ({ ...c, perf: r.data }))
                    .catch(() => ({ ...c, perf: null }))
                )
            );
            const valid = results.filter(c => c.perf !== null);
            const getScore = c => {
                const p = (start || end) ? c.perf?.period : c.perf?.lifetime;
                return p?.composite_score ?? 0;
            };
            valid.sort((a, b) => getScore(b) - getScore(a));
            setCollaborators(valid);
            if (valid.length) {
                const scores = valid.map(getScore);
                const avg = Math.round(scores.reduce((s, v) => s + v, 0) / scores.length);
                const getTasks = c => { const p = (start || end) ? c.perf?.period : c.perf?.lifetime; return p?.tasks_count ?? 0; };
                setSummary({ avg, top: valid[0], tasks: valid.reduce((s, c) => s + getTasks(c), 0) });
            }
        } catch {
            toast.error('Failed to load performance data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!user?.is_superuser) { toast.error('Admin access only.'); navigate('/'); return; }
        fetchAll(startDate, endDate);
    }, [user, navigate, startDate, endDate]);

    const isFiltered = !!(startDate || endDate);

    const sorted = [...collaborators].sort((a, b) => {
        const p = c => (isFiltered ? c.perf?.period : c.perf?.lifetime);
        if (sortBy === 'efficiency')  return (p(b)?.efficiency  ?? 0) - (p(a)?.efficiency  ?? 0);
        if (sortBy === 'reliability') return (p(b)?.reliability ?? 0) - (p(a)?.reliability ?? 0);
        return (p(b)?.composite_score ?? 0) - (p(a)?.composite_score ?? 0);
    });

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-10 h-10 rounded-full border-4 border-gray-100 border-t-emerald-600 animate-spin" />
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Loading performance data…</p>
        </div>
    );

    return (
        <div className="flex flex-col gap-6 pb-16 animate-fade-in">

            {/* ══ PAGE HEADER ══ */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 tracking-tight mb-1">
                        Team Performance
                    </h1>
                    <p className="text-sm text-gray-400 font-medium">Collaborator efficacy, quality, and reliability metrics</p>
                </div>
                {summary.top && (
                    <div className="flex items-center gap-3 bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm shrink-0">
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                            <i className="fas fa-trophy text-sm" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Top Performer</p>
                            <p className="text-sm font-bold text-gray-800">{summary.top.name}</p>
                        </div>
                        <div className="ml-2 px-2.5 py-1 bg-emerald-50 border border-emerald-100 rounded-xl">
                            <span className="text-xs font-black text-emerald-700">
                                {(summary.top.perf?.lifetime?.composite_score ?? 0)} pts
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* ══ STAT CARDS ══ */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Team Health',       value: `${summary.avg}%`, icon: 'fa-chart-line',       iconBg: 'bg-indigo-100',  iconClr: 'text-indigo-600', bar: summary.avg, barColor: '#6366f1' },
                    { label: 'Top Score',          value: collaborators[0] ? ((isFiltered ? collaborators[0].perf?.period?.composite_score : collaborators[0].perf?.lifetime?.composite_score) ?? 0) : '—', icon: 'fa-medal', iconBg: 'bg-amber-100', iconClr: 'text-amber-600', bar: null },
                    { label: 'Total Assignments',  value: summary.tasks,   icon: 'fa-list-check',        iconBg: 'bg-emerald-100', iconClr: 'text-emerald-600', bar: null },
                    { label: 'Active Members',     value: collaborators.length, icon: 'fa-users',         iconBg: 'bg-purple-100',  iconClr: 'text-purple-600',  bar: null },
                ].map((s, i) => (
                    <div key={i} className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col group hover:shadow-md transition-all">
                        <div className={`w-10 h-10 rounded-xl ${s.iconBg} ${s.iconClr} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                            <i className={`fas ${s.icon}`} />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{s.label}</p>
                        <p className="text-2xl font-black text-gray-800 mb-2 leading-none">{s.value}</p>
                        {s.bar != null && <Bar value={s.bar} color={s.barColor} />}
                    </div>
                ))}
            </div>

            {/* ══ FILTER BAR ══ */}
            <div className="bg-white border border-gray-100 rounded-[2rem] px-5 py-4 flex flex-wrap items-center gap-3 shadow-sm">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mr-1">Period</span>
                {PRESETS.map(p => (
                    <button key={p.key} onClick={() => applyPreset(p.key)}
                        className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                            preset === p.key
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-100'
                                : 'bg-gray-50 text-gray-500 border-gray-100 hover:border-emerald-200 hover:text-emerald-600'
                        }`}>
                        {p.label}
                    </button>
                ))}
                <div className="h-6 w-px bg-gray-100 mx-1 hidden sm:block" />
                <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setPreset(''); }}
                    className="px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer" />
                <span className="text-gray-300 text-xs font-bold">→</span>
                <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setPreset(''); }}
                    className="px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer" />
                {isFiltered && (
                    <button onClick={() => applyPreset('all')}
                        className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-500 hover:bg-rose-100 transition-colors text-[10px] font-black uppercase tracking-widest">
                        <i className="fas fa-times" /> Clear
                    </button>
                )}
            </div>

            {/* ══ LEADERBOARD ══ */}
            <div className="bg-white border border-gray-100 rounded-[2rem] shadow-sm overflow-hidden">
                {/* header */}
                <div className="px-8 py-5 border-b border-gray-50 bg-gray-50/40 flex items-center justify-between">
                    <div>
                        <h2 className="font-black text-gray-800 text-sm uppercase tracking-widest">Collaborator Leaderboard</h2>
                        <p className="text-[11px] text-gray-400 font-medium mt-0.5">Ranked by composite performance score — click a column to sort</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{collaborators.length} members</span>
                    </div>
                </div>

                {/* table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse" style={{ minWidth: 900 }}>
                        <thead>
                            <tr className="bg-gray-50/20 border-b border-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                <th className="px-6 py-4 w-16 text-center">Rank</th>
                                <th className="px-6 py-4">Member</th>
                                <th className="px-6 py-4 text-center cursor-pointer hover:text-gray-700 select-none" onClick={() => setSortBy('efficiency')}>
                                    Efficiency {sortBy === 'efficiency' && <i className="fas fa-arrow-down ml-1" />}
                                </th>
                                <th className="px-6 py-4 text-center">Quality</th>
                                <th className="px-6 py-4 text-center cursor-pointer hover:text-gray-700 select-none" onClick={() => setSortBy('reliability')}>
                                    Reliability {sortBy === 'reliability' && <i className="fas fa-arrow-down ml-1" />}
                                </th>
                                <th className="px-6 py-4 text-center cursor-pointer hover:text-gray-700 select-none" onClick={() => setSortBy('score')}>
                                    Score {sortBy === 'score' && <i className="fas fa-arrow-down ml-1" />}
                                </th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 pr-8 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {sorted.map((c, idx) => {
                                const perf  = isFiltered ? c.perf?.period : c.perf?.lifetime;
                                const score = perf?.composite_score ?? 0;
                                const eff   = perf?.efficiency ?? 0;
                                const qual  = perf?.quality ?? 0;
                                const rel   = perf?.reliability ?? 0;
                                const effColor = eff >= 70 ? '#10b981' : eff >= 40 ? '#f59e0b' : '#ef4444';

                                const rankLabel = idx === 0 ? <i className="fas fa-medal text-amber-400 text-lg" />
                                               : idx === 1 ? <i className="fas fa-medal text-gray-400 text-lg" />
                                               : idx === 2 ? <i className="fas fa-medal text-amber-700 text-base" />
                                               : <span className="text-sm font-bold text-gray-400">{idx + 1}</span>;

                                return (
                                    <tr key={c.id} className="group hover:bg-gray-50/70 transition-colors animate-slide-in" style={{ animationDelay: `${idx * 0.03}s` }}>
                                        {/* rank */}
                                        <td className="px-6 py-5 text-center">{rankLabel}</td>

                                        {/* member */}
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-gray-100 shrink-0 overflow-hidden border-2 border-white shadow-sm group-hover:scale-105 transition-transform flex items-center justify-center font-black text-gray-400 uppercase">
                                                    {c.image ? <img src={c.image} className="w-full h-full object-cover" alt="" /> : c.name?.[0]}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-gray-800 group-hover:text-emerald-600 transition-colors truncate">{c.name}</p>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">{c.designation || 'Collaborator'}</p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* efficiency */}
                                        <td className="px-6 py-5 min-w-[130px]">
                                            <div className="flex flex-col items-center gap-1.5">
                                                <span className="text-xs font-black" style={{ color: effColor }}>{eff}%</span>
                                                <Bar value={eff} color={effColor} />
                                            </div>
                                        </td>

                                        {/* quality */}
                                        <td className="px-6 py-5 text-center">
                                            <Stars quality={qual} />
                                        </td>

                                        {/* reliability */}
                                        <td className="px-6 py-5 text-center">
                                            <span className="text-sm font-black text-gray-700">{rel}</span>
                                        </td>

                                        {/* score */}
                                        <td className="px-6 py-5 text-center">
                                            <ScoreTile score={score} />
                                        </td>

                                        {/* status */}
                                        <td className="px-6 py-5 text-center">
                                            <StatusBadge score={score} />
                                        </td>

                                        {/* action */}
                                        <td className="px-6 py-5 pr-8 text-right">
                                            <Link to={`/profile/${c.id}`}
                                                className="inline-flex items-center gap-2 h-9 px-5 bg-gray-900 hover:bg-emerald-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-sm hover:shadow-lg hover:shadow-emerald-100 transition-all">
                                                View <i className="fas fa-arrow-right text-[9px]" />
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}

                            {sorted.length === 0 && (
                                <tr>
                                    <td colSpan="8" className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-3 opacity-30">
                                            <i className="fas fa-chart-bar text-5xl text-gray-300" />
                                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No performance data yet</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* zero-data note */}
                {sorted.filter(c => { const p = isFiltered ? c.perf?.period : c.perf?.lifetime; return (p?.composite_score ?? 0) === 0; }).length > Math.floor(sorted.length * 0.5) && sorted.length > 0 && (
                    <div className="mx-6 mb-6 mt-0 flex items-start gap-3 rounded-2xl bg-amber-50 border border-amber-100 px-5 py-3">
                        <i className="fas fa-info-circle text-amber-500 mt-0.5" />
                        <p className="text-xs font-bold text-amber-700">Some members have not completed any rated tasks yet. Scores will update automatically once evaluations are submitted.</p>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes fade-in  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
                @keyframes slide-in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
                .animate-fade-in  { animation: fade-in  0.4s ease-out; }
                .animate-slide-in { animation: slide-in 0.35s ease-out backwards; }
            `}</style>
        </div>
    );
};

export default PerformanceOverview;

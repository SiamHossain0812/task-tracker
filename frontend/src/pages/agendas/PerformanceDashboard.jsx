import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { collaboratorService } from '../../api/collaborators';
import apiClient from '../../api/client';

/* ─── helpers ─── */
const getCategory = (score) => {
    if (score >= 85) return { label: 'Excellent',   cls: 'bg-amber-50 text-amber-700  border-amber-200',  dot: 'bg-amber-400'   };
    if (score >= 70) return { label: 'Good',         cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-400' };
    if (score >= 50) return { label: 'Average',      cls: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-orange-400'  };
    return                   { label: 'Needs Work',  cls: 'bg-rose-50 text-rose-700 border-rose-200',  dot: 'bg-rose-400'   };
};

const MetricBar = ({ value, color, label, lifetime, showDelta }) => {
    const delta = showDelta ? value - lifetime : null;
    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{label}</span>
                <div className="flex items-center gap-2">
                    {showDelta && delta != null && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${delta >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-rose-500 bg-rose-50'}`}>
                            {delta >= 0 ? '+' : ''}{Math.round(delta)}
                        </span>
                    )}
                    <span className="text-sm font-black text-gray-800">{Math.round(value)}</span>
                </div>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(value, 100)}%`, background: color }} />
            </div>
            {showDelta && (
                <p className="text-[10px] text-gray-300 font-medium text-right">Lifetime: {Math.round(lifetime)}</p>
            )}
        </div>
    );
};

const StatCard = ({ icon, iconBg, iconClr, label, value, sub, accent }) => (
    <div className={`bg-white rounded-[2rem] border border-gray-100 shadow-sm p-5 relative overflow-hidden flex flex-col justify-between group hover:shadow-md transition-all`}>
        {accent && <div className={`absolute top-0 right-0 w-1.5 h-full ${accent}`} />}
        <div className={`w-10 h-10 ${iconBg} ${iconClr} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
            <i className={`fas ${icon} text-sm`} />
        </div>
        <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{label}</p>
            <p className="text-2xl font-black text-gray-800 leading-none">{value}</p>
            {sub && <p className="text-[11px] text-gray-300 font-medium mt-1 uppercase tracking-widest">{sub}</p>}
        </div>
    </div>
);

const PRESETS = [
    { label: 'This Week',    key: 'week' },
    { label: 'This Month',   key: 'month' },
    { label: 'Last Quarter', key: 'quarter' },
    { label: 'All Time',     key: 'all' },
];

/* ═══════════════════════════════════════════
   CUSTOM SVG RADAR CHART
═══════════════════════════════════════════ */
const METRIC_ICONS = { Quality: 'fa-star', Timeliness: 'fa-clock', Efficiency: 'fa-bolt', Reliability: 'fa-shield-halved' };
const METRIC_COLORS = { Quality: '#f59e0b', Timeliness: '#10b981', Efficiency: '#6366f1', Reliability: '#8b5cf6' };

const CustomRadar = ({ data }) => {
    const SIZE   = 500;
    const CX     = SIZE / 2;
    const CY     = SIZE / 2;
    const RADIUS = 140;
    const RINGS  = [25, 50, 75, 100];
    const n      = data.length;

    const angleOf = (i) => (Math.PI * 2 * i) / n - Math.PI / 2;
    const pt = (val, i) => {
        const a = angleOf(i);
        const d = (val / 100) * RADIUS;
        return { x: CX + d * Math.cos(a), y: CY + d * Math.sin(a) };
    };
    const poly = (key) =>
        data.map((d, i) => { const p = pt(d[key], i); return `${p.x},${p.y}`; }).join(' ');

    return (
        <div className="w-full flex justify-center items-center py-4">
            <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full h-auto max-w-[420px] drop-shadow-sm" style={{ overflow: 'visible' }}>
                <defs>
                    {/* Radial canvas backdrop */}
                    <radialGradient id="canvasBg" cx="50%" cy="50%" r="50%">
                        <stop offset="0%"   stopColor="#eef2ff" stopOpacity="0.7" />
                        <stop offset="100%" stopColor="#f8fafc" stopOpacity="0"   />
                    </radialGradient>

                    {/* Period polygon — indigo-to-violet gradient */}
                    <radialGradient id="periodFill" cx="50%" cy="50%" r="60%">
                        <stop offset="0%"   stopColor="#a5b4fc" stopOpacity="0.75" />
                        <stop offset="60%"  stopColor="#6366f1" stopOpacity="0.45" />
                        <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.15" />
                    </radialGradient>

                    {/* Lifetime polygon — slate */}
                    <radialGradient id="lifetimeFill" cx="50%" cy="50%" r="50%">
                        <stop offset="0%"   stopColor="#e2e8f0" stopOpacity="0.55" />
                        <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0.1"  />
                    </radialGradient>

                    {/* Soft glow on period outline */}
                    <filter id="softGlow" x="-40%" y="-40%" width="180%" height="180%">
                        <feGaussianBlur stdDeviation="5" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>

                    {/* Strong glow for dots */}
                    <filter id="dotGlow" x="-80%" y="-80%" width="260%" height="260%">
                        <feGaussianBlur stdDeviation="3.5" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>

                    <style>{`
                        @keyframes radarBg    { from{opacity:0} to{opacity:1} }
                        @keyframes radarLife  { from{opacity:0;transform:scale(0.4) } to{opacity:1;transform:scale(1)} }
                        @keyframes radarPeriod{ from{opacity:0;transform:scale(0.2) } to{opacity:1;transform:scale(1)} }
                        @keyframes dotPop    {
                            0%  { transform:scale(0); opacity:0 }
                            70% { transform:scale(1.3) }
                            100%{ transform:scale(1);  opacity:1 }
                        }
                        @keyframes glowPulse {
                            0%,100%{ filter:drop-shadow(0 0 4px rgba(99,102,241,0.4)) }
                            50%    { filter:drop-shadow(0 0 12px rgba(99,102,241,0.75)) }
                        }
                        .r-bg      { animation: radarBg 0.5s ease-out forwards; transform-origin:${CX}px ${CY}px; }
                        .r-life    { animation: radarLife   0.55s ease-out both; transform-origin:${CX}px ${CY}px; }
                        .r-period  { animation: radarPeriod 0.75s 0.1s cubic-bezier(.34,1.4,.64,1) both;
                                     transform-origin:${CX}px ${CY}px;
                                     animation-fill-mode:both;
                                     animation: radarPeriod 0.75s 0.1s cubic-bezier(.34,1.4,.64,1) both,
                                                glowPulse 2.5s 0.9s ease-in-out infinite; }
                        .r-dot     { animation: dotPop 0.4s 0.8s ease-out both; transform-origin:inherit; }
                    `}</style>
                </defs>

                {/* ── Radial backdrop ── */}
                <circle cx={CX} cy={CY} r={RADIUS + 10}
                    fill="url(#canvasBg)" className="r-bg" />

                {/* ── Concentric ring grid (polygon-shaped) ── */}
                {RINGS.map((r, ri) => {
                    const pts = data.map((_, i) => { const p = pt(r, i); return `${p.x},${p.y}`; }).join(' ');
                    return (
                        <polygon key={r} points={pts} fill="none"
                            stroke={r === 100 ? '#c7d2fe' : r === 75 ? '#e0e7ff' : '#f1f5f9'}
                            strokeWidth={r === 100 ? 1.5 : 0.8}
                            strokeDasharray={r === 75 ? '4 3' : 'none'}
                            opacity={0.9 - ri * 0.08}
                        />
                    );
                })}

                {/* Ring value ticks */}
                {[25, 50, 75].map(r => (
                    <text key={`t${r}`}
                        x={CX + 4} y={CY - (r / 100) * RADIUS - 4}
                        fontSize={7.5} fill="#c7d2fe" fontWeight={700}
                        fontFamily="Outfit,sans-serif" textAnchor="start">
                        {r}
                    </text>
                ))}

                {/* ── Axis spokes ── */}
                {data.map((_, i) => {
                    const end = pt(100, i);
                    return (
                        <line key={i} x1={CX} y1={CY} x2={end.x} y2={end.y}
                            stroke="#e0e7ff" strokeWidth={1.2} strokeDasharray="3 3" />
                    );
                })}

                {/* ── Lifetime polygon ── */}
                <polygon className="r-life"
                    points={poly('Lifetime')}
                    fill="url(#lifetimeFill)"
                    stroke="#94a3b8"
                    strokeWidth={1.5}
                    strokeDasharray="6 4"
                    strokeLinejoin="round"
                />

                {/* ── Period polygon (animated glow) ── */}
                <polygon className="r-period"
                    points={poly('Period')}
                    fill="url(#periodFill)"
                    stroke="#6366f1"
                    strokeWidth={3}
                    strokeLinejoin="round"
                    filter="url(#softGlow)"
                />

                {/* ── Axis labels, dots, value callouts ── */}
                {data.map((d, i) => {
                    const angle   = angleOf(i);
                    const dot     = pt(d.Period, i);
                    const ldot    = pt(d.Lifetime, i);
                    const isRight = Math.cos(angle) > 0.1;
                    const isLeft  = Math.cos(angle) < -0.1;
                    const anchor  = isRight ? 'start' : isLeft ? 'end' : 'middle';
                    const color   = METRIC_COLORS[d.subject] || '#6366f1';

                    /* Axis label — place well beyond the outermost ring */
                    const labelDist = RADIUS + 48;
                    const lx = CX + labelDist * Math.cos(angle);
                    const ly = CY + labelDist * Math.sin(angle);

                    /* Value label — placed safely outside the dot and lines */
                    const pillDist = (d.Period / 100) * RADIUS + 24;
                    const pillX = CX + pillDist * Math.cos(angle);
                    const pillY = CY + pillDist * Math.sin(angle);

                    /* Identify top/bottom positions for vertical nudging */
                    const isTop    = Math.sin(angle) < -0.7;
                    const isBottom = Math.sin(angle) >  0.7;
                    const labelDY  = isTop ? -2 : isBottom ? 14 : 5;

                    /* Position value label to not collide with axis labels */
                    const vShift = isTop ? -8 : isBottom ? 8 : 0;

                    return (
                        <g key={i}>
                            {/* Colored tick at spoke end */}
                            <line
                                x1={CX + RADIUS * Math.cos(angle)}
                                y1={CY + RADIUS * Math.sin(angle)}
                                x2={CX + (RADIUS + 14) * Math.cos(angle)}
                                y2={CY + (RADIUS + 14) * Math.sin(angle)}
                                stroke={color} strokeWidth={2.5} strokeLinecap="round" opacity={0.6}
                            />

                            {/* Axis label */}
                            <text x={lx} y={ly + labelDY}
                                textAnchor={anchor}
                                fontSize={12} fontWeight={800}
                                fill="#1e293b"
                                fontFamily="Outfit,sans-serif">
                                {d.subject}
                            </text>

                            {/* Lifetime dot */}
                            <circle className="r-dot"
                                cx={ldot.x} cy={ldot.y} r={4}
                                fill="#e2e8f0" stroke="white" strokeWidth={1.5}
                                style={{ transformOrigin: `${ldot.x}px ${ldot.y}px` }}
                            />

                            {/* Period dot — colored, glowing */}
                            <circle className="r-dot"
                                cx={dot.x} cy={dot.y} r={6.5}
                                fill={color} stroke="white" strokeWidth={2.5}
                                filter="url(#dotGlow)"
                                style={{ transformOrigin: `${dot.x}px ${dot.y}px` }}
                            />

                            {/* Value label — refined pill badge outside the chart */}
                            {d.Period > 0 && (
                                <g className="r-dot" style={{ transformOrigin: `${pillX}px ${pillY}px` }}>
                                    <rect
                                        x={pillX - 13}
                                        y={pillY - 7 + vShift}
                                        width={26}
                                        height={15}
                                        rx={7.5}
                                        fill={color}
                                        opacity={0.15}
                                    />
                                    <text
                                        x={pillX} y={pillY + 4 + vShift}
                                        textAnchor="middle"
                                        fontSize={9} fontWeight={900}
                                        fill={color}
                                        fontFamily="Outfit,sans-serif">
                                        {Math.round(d.Period)}
                                    </text>
                                </g>
                            )}
                        </g>
                    );
                })}



                {/* Centre hub */}
                <circle cx={CX} cy={CY} r={6} fill="#6366f1" opacity={0.25} />
                <circle cx={CX} cy={CY} r={3} fill="#6366f1" opacity={0.7} />
            </svg>
        </div>
    );
};

const PerformanceDashboard = () => {
    const { id }       = useParams();
    const navigate     = useNavigate();
    const { user }     = useAuth();
    const targetId     = id || user?.collaborator_id;

    const [perf,      setPerf]      = useState(null);
    const [loading,   setLoading]   = useState(true);
    const [error,     setError]     = useState(null);
    const [startDate, setStartDate] = useState('');
    const [endDate,   setEndDate]   = useState('');
    const [preset,    setPreset]    = useState('all');

    const applyPreset = (key) => {
        setPreset(key);
        if (key === 'all') { setStartDate(''); setEndDate(''); return; }
        const today = new Date();
        const s = new Date(today);
        if (key === 'week')    s.setDate(today.getDate()   - 7);
        if (key === 'month')   s.setMonth(today.getMonth() - 1);
        if (key === 'quarter') s.setMonth(today.getMonth() - 3);
        setStartDate(s.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
    };

    const fetchPerformance = async (start, end) => {
        setLoading(true);
        try {
            const res = await collaboratorService.getPerformance(targetId, start || null, end || null);
            setPerf(res.data);
        } catch {
            setError('Could not load performance data.');
        } finally {
            setLoading(false);
        }
    };

    const handleRate = async (agendaId, score) => {
        try {
            await apiClient.post(`agendas/${agendaId}/rate/`, {
                quality_scores: { [targetId]: score }
            });
            toast.success('Rating given successfully!');
            fetchPerformance(startDate, endDate);
        } catch (err) {
            console.error('Failed to update rating', err);
            toast.error(err.response?.data?.error || 'Failed to update rating');
        }
    };

    useEffect(() => {
        if (!user?.is_superuser) { toast.error('Admin access only.'); navigate('/'); return; }
        if (!targetId) { setError('No collaborator found.'); setLoading(false); return; }
        fetchPerformance(startDate, endDate);
    }, [targetId, startDate, endDate]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-10 h-10 rounded-full border-4 border-gray-100 border-t-emerald-600 animate-spin" />
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Loading profile…</p>
        </div>
    );

    if (error || !perf) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
                <i className="fas fa-chart-bar text-2xl text-gray-300" />
            </div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{error || 'No data available yet.'}</p>
        </div>
    );

    const isFiltered  = !!(startDate || endDate);
    const activeStats = isFiltered ? perf.period : perf.lifetime;
    const lifetimeStats = perf.lifetime;
    const cat         = getCategory(activeStats?.composite_score ?? 0);

    const radarData = [
        { subject: 'Quality',     Period: perf.period?.quality    ?? 0, Lifetime: lifetimeStats?.quality    ?? 0 },
        { subject: 'Timeliness',  Period: perf.period?.timeliness ?? 0, Lifetime: lifetimeStats?.timeliness ?? 0 },
        { subject: 'Efficiency',  Period: perf.period?.efficiency ?? 0, Lifetime: lifetimeStats?.efficiency ?? 0 },
        { subject: 'Reliability', Period: perf.period?.reliability ?? 0, Lifetime: lifetimeStats?.reliability ?? 0 },
    ];

    const name = perf.collaborator_name || lifetimeStats?.collaborator_name || '—';

    return (
        <div className="flex flex-col gap-6 pb-16 animate-fade-in">

            {/* ══ BREADCRUMB / BACK ══ */}
            <button onClick={() => navigate(-1)}
                className="self-start flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-gray-800 transition-colors group">
                <i className="fas fa-arrow-left group-hover:-translate-x-1 transition-transform" />
                Back to Leaderboard
            </button>

            {/* ══ HERO CARD ══ */}
            <div className="bg-white border border-gray-100 rounded-[2rem] shadow-sm p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-gray-50 to-transparent pointer-events-none" />
                <div className="relative z-10">
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 font-bold text-[10px] uppercase tracking-widest rounded-full border border-indigo-100">
                            Performance Profile
                        </span>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest ${cat.cls}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cat.dot}`} />
                            {cat.label}
                        </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 tracking-tight mb-1">{name}</h1>
                    <p className="text-sm text-gray-400 font-medium">
                        {isFiltered
                            ? `Performance from ${startDate || 'start'} to ${endDate || 'today'}`
                            : 'Lifetime aggregated metrics based on all completed tasks'}
                    </p>
                </div>

                {/* Score pill */}
                <div className="relative z-10 flex flex-col items-center justify-center bg-gray-900 text-white rounded-2xl px-10 py-6 shadow-xl shrink-0 min-w-[160px]">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
                        {isFiltered ? 'Period Score' : 'Lifetime Score'}
                    </p>
                    <p className="text-5xl font-black">{activeStats?.composite_score ?? 0}</p>
                    {isFiltered && (
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                            Lifetime: {lifetimeStats?.composite_score ?? 0}
                        </p>
                    )}
                </div>
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
                        <i className="fas fa-times" /> Reset
                    </button>
                )}
            </div>

            {/* ══ MAIN GRID ══ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left — Radar */}
                <div className="lg:col-span-2 bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8">
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <h3 className="font-black text-gray-800 text-sm uppercase tracking-widest">Dimension Analysis</h3>
                            <p className="text-[11px] text-gray-400 font-medium mt-0.5">Period vs. Lifetime comparison across 4 dimensions</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="inline-block w-8 h-0.5 bg-indigo-500 rounded-full" />
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Period</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="inline-block w-8 h-px bg-gray-300 rounded-full" style={{borderTop:'2px dashed #cbd5e1',height:0}} />
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Lifetime</span>
                            </div>
                        </div>
                    </div>

                    {/* Custom SVG Radar */}
                    <CustomRadar data={radarData} />

                    {/* Value Summary Row */}
                    <div className="grid grid-cols-4 gap-3 mt-4">
                        {radarData.map((d) => {
                            const delta = d.Period - d.Lifetime;
                            return (
                                <div key={d.subject} className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-gray-50 border border-gray-100">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">{d.subject}</span>
                                    <span className="text-lg font-black text-gray-800">{Math.round(d.Period)}</span>
                                    {delta !== 0 && (
                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                                            delta > 0 ? 'text-emerald-600 bg-emerald-50' : 'text-rose-500 bg-rose-50'
                                        }`}>{delta > 0 ? '+' : ''}{Math.round(delta)} vs life</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right — metric cards */}
                <div className="flex flex-col gap-4">
                    <StatCard icon="fa-list-check" iconBg="bg-indigo-100" iconClr="text-indigo-600"
                        label="Tasks Completed" value={activeStats?.tasks_count ?? 0}
                        sub={isFiltered ? `Lifetime: ${lifetimeStats?.tasks_count ?? 0}` : 'All time'}
                        accent="bg-indigo-500" />
                    <StatCard icon="fa-star" iconBg="bg-amber-100" iconClr="text-amber-600"
                        label="Quality Score" value={`${Math.round(activeStats?.quality ?? 0)}`}
                        sub={isFiltered ? `Lifetime: ${Math.round(lifetimeStats?.quality ?? 0)}` : 'Avg rating'}
                        accent="bg-amber-400" />
                    <StatCard icon="fa-stopwatch" iconBg="bg-emerald-100" iconClr="text-emerald-600"
                        label="Timeliness" value={`${Math.round(activeStats?.timeliness ?? 0)}`}
                        sub={isFiltered ? `Lifetime: ${Math.round(lifetimeStats?.timeliness ?? 0)}` : '% on-time'}
                        accent="bg-emerald-500" />
                    <StatCard icon="fa-bolt" iconBg="bg-blue-100" iconClr="text-blue-600"
                        label="Efficiency" value={`${Math.round(activeStats?.efficiency ?? 0)}%`}
                        sub={isFiltered ? `Lifetime: ${Math.round(lifetimeStats?.efficiency ?? 0)}%` : 'Task speed'}
                        accent="bg-blue-500" />
                </div>
            </div>

            {/* ══ METRIC BREAKDOWN ══ */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8">
                <h3 className="font-black text-gray-800 text-sm uppercase tracking-widest mb-6">Metric Breakdown</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <MetricBar label="Quality"     value={activeStats?.quality     ?? 0} color="#f59e0b" lifetime={lifetimeStats?.quality     ?? 0} showDelta={isFiltered} />
                    <MetricBar label="Timeliness"  value={activeStats?.timeliness  ?? 0} color="#10b981" lifetime={lifetimeStats?.timeliness  ?? 0} showDelta={isFiltered} />
                    <MetricBar label="Efficiency"  value={activeStats?.efficiency  ?? 0} color="#6366f1" lifetime={lifetimeStats?.efficiency  ?? 0} showDelta={isFiltered} />
                    <MetricBar label="Reliability" value={activeStats?.reliability ?? 0} color="#8b5cf6" lifetime={lifetimeStats?.reliability ?? 0} showDelta={isFiltered} />
                </div>
            </div>

            {/* ══ TASK HISTORY LOG ══ */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-8 py-5 border-b border-gray-50 bg-gray-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h2 className="font-black text-gray-800 text-sm uppercase tracking-widest">Task Performance Log</h2>
                        <p className="text-[11px] text-gray-400 font-medium mt-0.5">Granular breakdown of every rated evaluation</p>
                    </div>
                    <span className="px-3 py-1.5 bg-white border border-gray-100 rounded-xl text-[10px] font-black text-gray-500 uppercase tracking-widest shadow-sm w-fit">
                        {(perf.history?.length ?? 0)} records
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse" style={{ minWidth: 700 }}>
                        <thead>
                            <tr className="bg-gray-50/20 border-b border-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                <th className="px-8 py-4">Task</th>
                                <th className="px-6 py-4 text-center">Quality</th>
                                <th className="px-6 py-4 text-center">Timeliness</th>
                                <th className="px-6 py-4 text-center">Efficiency</th>
                                <th className="px-6 py-4 text-center">Reliability</th>
                                <th className="px-6 py-4 pr-8 text-right">Composite</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {perf.history?.length > 0 ? perf.history.map((log) => (
                                <tr key={log.id} className="group hover:bg-gray-50/60 transition-colors">
                                    <td className="px-8 py-5">
                                        <p className="font-bold text-gray-800 group-hover:text-emerald-600 transition-colors cursor-pointer"
                                            onClick={() => navigate(`/tasks/${log.agenda_id}`)}>
                                            {log.task_title}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                {new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                            <span className="w-1 h-1 rounded-full bg-gray-200" />
                                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Verified</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        {log.quality ? (
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="flex gap-0.5">
                                                    {[1,2,3,4,5].map(i => (
                                                        <i key={i} className={`fas fa-star text-[9px] ${i <= log.quality ? 'text-amber-400' : 'text-gray-100'}`} />
                                                    ))}
                                                </div>
                                                <span className="text-[10px] font-black text-gray-500">{log.quality}/5</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="flex gap-1 group/rating">
                                                    {[1,2,3,4,5].map(i => (
                                                        <button 
                                                            key={i} 
                                                            onClick={(e) => { e.stopPropagation(); handleRate(log.agenda_id, i); }}
                                                            className={`text-sm transition-all hover:scale-125 text-gray-200 hover:text-amber-300`}
                                                            title={`Rate ${i} Stars`}
                                                        >
                                                            <i className="fas fa-star" />
                                                        </button>
                                                    ))}
                                                </div>
                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Rate Now</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <span className={`text-xs font-black ${log.timeliness >= 90 ? 'text-emerald-600' : 'text-rose-500'}`}>
                                            {log.timeliness}%
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <span className="text-xs font-black text-gray-700">{log.efficiency}%</span>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <span className="text-xs font-black text-gray-700">{log.reliability}%</span>
                                    </td>
                                    <td className="px-6 py-5 pr-8 text-right">
                                        <span className={`inline-flex h-9 w-12 items-center justify-center rounded-xl font-black text-sm ${
                                            log.composite_score >= 80
                                                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100'
                                                : log.composite_score >= 50
                                                ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                                : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            {log.composite_score}
                                        </span>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="6" className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-3 opacity-30">
                                            <i className="fas fa-clipboard-list text-5xl text-gray-300" />
                                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No history recorded yet</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <style>{`
                @keyframes fade-in { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
                .animate-fade-in { animation: fade-in 0.4s ease-out; }
            `}</style>
        </div>
    );
};

export default PerformanceDashboard;

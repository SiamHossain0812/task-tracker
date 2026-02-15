import React, { useState, useEffect } from 'react';
import { useSearchParams, NavLink } from 'react-router-dom';
import apiClient from '../api/client';

const SearchPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const [results, setResults] = useState({ projects: [], agendas: [] });
    const [loading, setLoading] = useState(false);
    const [localQuery, setLocalQuery] = useState(query);

    useEffect(() => {
        if (query) {
            const fetchResults = async () => {
                setLoading(true);
                try {
                    const response = await apiClient.get(`search/?q=${encodeURIComponent(query)}`);
                    setResults(response.data);
                } catch (error) {
                    console.error('Search failed', error);
                } finally {
                    setLoading(false);
                }
            };
            fetchResults();
        } else {
            setResults({ projects: [], agendas: [] });
        }
    }, [query]);

    const handleSearch = (e) => {
        e.preventDefault();
        setSearchParams({ q: localQuery });
    };

    const totalResults = results.projects.length + results.agendas.length;

    return (
        <div className="animate-fade-in h-full flex flex-col pb-8">
            {/* Search Header */}
            <div className="mb-8 shrink-0">
                <h2 className="text-3xl font-bold text-gray-800 tracking-tight mb-4">
                    Search Results
                </h2>

                {/* Search Form */}
                <form onSubmit={handleSearch} className="mb-6 relative z-10">
                    <div className="flex gap-3">
                        <div className="flex-1 relative group">
                            <input
                                type="text"
                                value={localQuery}
                                onChange={(e) => setLocalQuery(e.target.value)}
                                placeholder="Search projects, tasks, dates..."
                                className="w-full px-5 py-4 pl-14 rounded-2xl border border-gray-100 bg-white shadow-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder-gray-400 font-medium text-lg"
                                autoFocus
                            />
                            <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors text-lg"></i>
                        </div>
                        <button type="submit" className="px-8 py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 hover:shadow-emerald-300 transform hover:-translate-y-0.5">
                            Search
                        </button>
                    </div>
                </form>

                {query && (
                    <div className="flex items-center justify-between px-2">
                        <p className="text-gray-500 font-medium">
                            Found <span className="font-bold text-emerald-600">{totalResults}</span> result{totalResults !== 1 ? 's' : ''} for
                            <span className="font-bold text-gray-800 ml-1">"{query}"</span>
                        </p>
                        <button
                            onClick={() => { setLocalQuery(''); setSearchParams({}); }}
                            className="text-sm font-semibold text-gray-400 hover:text-emerald-600 transition-colors flex items-center gap-1"
                        >
                            <i className="fas fa-times-circle"></i> Clear search
                        </button>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
                </div>
            ) : query ? (
                <div className="flex-1 overflow-y-auto custom-scrollbar -mx-4 px-4 pb-4">
                    {totalResults === 0 ? (
                        <div className="h-96 flex flex-col items-center justify-center text-center bg-white rounded-3xl border border-gray-100 border-dashed">
                            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-50 flex items-center justify-center">
                                <i className="fas fa-search text-4xl text-gray-300"></i>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-2">No Results Found</h3>
                            <p className="text-gray-500 max-w-sm mx-auto">We couldn't find anything matching "{query}". Try different keywords or check for typos.</p>
                        </div>
                    ) : (
                        <>
                            {/* Projects Results */}
                            {results.projects.length > 0 && (
                                <div className="mb-10">
                                    <div className="flex items-center gap-3 mb-5 px-1">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                            <i className="fas fa-folder"></i>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-800">Projects <span className="text-gray-400 text-sm font-medium ml-1">({results.projects.length})</span></h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                        {results.projects.map(project => (
                                            <NavLink key={project.id} to={`/projects/${project.id}/edit`} className="block group">
                                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-6 h-full flex flex-col hover:border-emerald-200">
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <span className={`w-3 h-3 rounded-full bg-${project.color || 'indigo'}-500 ring-2 ring-${project.color || 'indigo'}-100 group-hover:scale-110 transition-transform`}></span>
                                                            <h4 className="font-bold text-gray-800 group-hover:text-emerald-700 transition-colors text-lg">{project.name}</h4>
                                                        </div>
                                                        <span className="text-gray-300 group-hover:text-emerald-500 transition-colors">
                                                            <i className="fas fa-pen"></i>
                                                        </span>
                                                    </div>
                                                    {project.description && (
                                                        <p className="text-sm text-gray-500 mb-6 line-clamp-2">{project.description}</p>
                                                    )}
                                                    <div className="mt-auto flex items-center justify-between">
                                                        <span className="text-xs font-semibold text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                                                            {project.agendas_count} tasks
                                                        </span>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                                <div className={`h-full bg-${project.color || 'indigo'}-500 rounded-full`} style={{ width: `${project.progress}%` }}></div>
                                                            </div>
                                                            <span className={`text-xs font-bold text-${project.color || 'indigo'}-600`}>{Math.round(project.progress)}%</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </NavLink>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Tasks Results */}
                            {results.agendas.length > 0 && (
                                <div className="mb-8">
                                    <div className="flex items-center gap-3 mb-5 px-1">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                            <i className="fas fa-check-circle"></i>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-800">Tasks <span className="text-gray-400 text-sm font-medium ml-1">({results.agendas.length})</span></h3>
                                    </div>

                                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-8">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-bold uppercase tracking-wider text-gray-400">
                                                        <th className="px-6 py-5 w-16 text-center">Pri</th>
                                                        <th className="px-6 py-5">Task Details</th>
                                                        <th className="px-6 py-5">Project</th>
                                                        <th className="px-6 py-5">Due Date</th>
                                                        <th className="px-6 py-5">Status</th>
                                                        <th className="px-6 py-5 w-24 text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50">
                                                    {results.agendas.map(task => (
                                                        <tr key={task.id} className="group hover:bg-gray-50/80 transition-colors">
                                                            <td className="px-6 py-4 text-center">
                                                                <div className={`w-3 h-3 rounded-full mx-auto ${task.priority === 'high' ? 'bg-red-500 shadow-sm shadow-red-200' : task.priority === 'medium' ? 'bg-amber-500 shadow-sm shadow-amber-200' : 'bg-emerald-500 shadow-sm shadow-emerald-200'}`}></div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex flex-col">
                                                                    <span className="font-bold text-gray-800 text-sm group-hover:text-emerald-700 transition-colors">{task.title}</span>
                                                                    {task.description && <span className="text-xs text-gray-400 truncate max-w-xs mt-0.5">{task.description}</span>}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                {task.project_info ? (
                                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-white border border-gray-100 shadow-sm text-gray-600">
                                                                        <span className={`w-1.5 h-1.5 rounded-full bg-${task.project_info.color || 'indigo'}-500`}></span>
                                                                        {task.project_info.name}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-xs font-medium text-gray-400 px-2 py-1 bg-gray-50 rounded-lg">Inbox</span>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm font-semibold text-gray-600">{task.date}</span>
                                                                    {task.time && <span className="text-xs text-gray-400">{task.time}</span>}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${task.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : task.status === 'in-progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                                                                    {task.status_display || task.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                                    <NavLink to={`/tasks/${task.id}/edit`} className="w-8 h-8 rounded-lg bg-white border border-gray-200 text-gray-400 hover:text-emerald-600 hover:border-emerald-200 shadow-sm flex items-center justify-center transition-all">
                                                                        <i className="fas fa-pen text-xs"></i>
                                                                    </NavLink>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8">
                    <div className="w-full max-w-2xl bg-white rounded-3xl border border-gray-100 shadow-sm p-10 text-center">
                        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-emerald-50 flex items-center justify-center">
                            <i className="fas fa-search text-4xl text-emerald-500"></i>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-3">Search Everything</h3>
                        <p className="text-gray-500 mb-8 max-w-md mx-auto">Find what you're looking for across all your projects, tasks, and team members.</p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left max-w-lg mx-auto">
                            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-indigo-500">
                                        <i className="fas fa-folder"></i>
                                    </div>
                                    <span className="font-bold text-gray-700">Projects</span>
                                </div>
                                <p className="text-xs text-gray-500 ml-11">Search by name or description</p>
                            </div>
                            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-emerald-500">
                                        <i className="fas fa-check-circle"></i>
                                    </div>
                                    <span className="font-bold text-gray-700">Tasks</span>
                                </div>
                                <p className="text-xs text-gray-500 ml-11">Search by title, status, or date</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
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

export default SearchPage;

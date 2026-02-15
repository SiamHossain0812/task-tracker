import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/client';
import { toast } from 'react-hot-toast';
import ConfirmModal from '../common/ConfirmModal';

const AgendaForm = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();
    const isEdit = !!id;
    const isReadOnly = isEdit && !user?.is_superuser;
    const isMeeting = location.pathname.includes('/meetings') || searchParams.get('type') === 'meeting';

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: isMeeting ? 'meeting' : 'task',
        project: searchParams.get('project') || '',
        date: searchParams.get('date') || new Date().toISOString().split('T')[0],
        time: '',
        expected_finish_date: '',
        expected_finish_time: '',
        status: 'pending',
        priority: 'medium',
        category: '', // Manual category selection
        external_link: '',
        collaborators: [],
        send_whatsapp: true,
        attachment: null,
        meeting_link: '',
        google_event_id: ''
    });

    // Helper function to calculate suggested finish date based on category
    const getSuggestedFinishDate = (category, startDate) => {
        if (!startDate || !category) return '';

        const start = new Date(startDate);
        let daysToAdd = 0;

        switch (category) {
            case 'short':
                daysToAdd = 2;
                break;
            case 'mid':
                daysToAdd = 7;
                break;
            case 'long':
                daysToAdd = 15;
                break;
            default:
                return '';
        }

        const finish = new Date(start);
        finish.setDate(finish.getDate() + daysToAdd);
        return finish.toISOString().split('T')[0];
    };

    // Helper function to calculate category from dates
    const getCalculatedCategory = (startDate, finishDate) => {
        if (!startDate || !finishDate) return 'short';

        const start = new Date(startDate);
        const finish = new Date(finishDate);
        const duration = Math.ceil((finish - start) / (1000 * 60 * 60 * 24));

        if (duration <= 3) return 'short';
        if (duration <= 10) return 'mid';
        return 'long';
    };

    const [projects, setProjects] = useState([]);
    const [collaborators, setCollaborators] = useState([]);
    const [loading, setLoading] = useState(isEdit);
    const [error, setError] = useState(null);
    const [validationError, setValidationError] = useState('');
    const [isCollabDropdownOpen, setIsCollabDropdownOpen] = useState(false);
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
    const [quickAddData, setQuickAddData] = useState({ name: '', whatsapp_number: '' });
    const [isManualCategory, setIsManualCategory] = useState(false);
    const [responding, setResponding] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [myAssignment, setMyAssignment] = useState(null);
    const [rejectModal, setRejectModal] = useState({ show: false, reason: '' });

    const dropdownRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [projectsRes, collaboratorsRes] = await Promise.all([
                    apiClient.get('projects/'),
                    apiClient.get('collaborators/')
                ]);
                setProjects(projectsRes.data);
                setCollaborators(collaboratorsRes.data);

                if (isEdit) {
                    const agendaRes = await apiClient.get(`agendas/${id}/`);
                    const agendaData = agendaRes.data;

                    setFormData({
                        ...agendaData,
                        project: agendaData.project?.id || agendaData.project_id || '',
                        collaborators: agendaData.collaborators?.map(c => c.id) || [],
                        send_whatsapp: true,
                        attachment: null
                    });

                    // Find current user's assignment
                    const me = collaboratorsRes.data.find(c => c.user?.id === user?.id);
                    if (me) {
                        const assignment = agendaData.assignments?.find(a => a.collaborator === me.id);
                        setMyAssignment(assignment);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch data', err);
                setError('Failed to load form data');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, isEdit]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsCollabDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Auto-calculate category when dates change (only if not manually selected)
    useEffect(() => {
        if (formData.date && formData.expected_finish_date && !isManualCategory) {
            const calculatedCategory = getCalculatedCategory(formData.date, formData.expected_finish_date);
            setFormData(prev => ({ ...prev, category: calculatedCategory }));
        }
    }, [formData.date, formData.expected_finish_date]);

    const validateTimes = () => {
        if (formData.date && formData.expected_finish_date) {
            const start = new Date(`${formData.date}T${formData.time || '00:00'}`);
            const finish = new Date(`${formData.expected_finish_date}T${formData.expected_finish_time || '23:59'}`);

            if (finish < start) {
                setValidationError('Careful! Finish time is before start time.');
                return false;
            }
        }
        setValidationError('');
        return true;
    };

    const handleCollabToggle = (collabId) => {
        setFormData(prev => {
            const newCollabs = prev.collaborators.includes(collabId)
                ? prev.collaborators.filter(id => id !== collabId)
                : [...prev.collaborators, collabId];
            return { ...prev, collaborators: newCollabs };
        });
    };

    const handleQuickAdd = async () => {
        if (!quickAddData.name) return;
        try {
            const response = await apiClient.post('collaborators/', quickAddData);
            const newCollab = response.data;
            setCollaborators(prev => [...prev, newCollab]);
            setFormData(prev => ({
                ...prev,
                collaborators: [...prev.collaborators, newCollab.id]
            }));
            setIsQuickAddOpen(false);
            setQuickAddData({ name: '', whatsapp_number: '' });
        } catch (err) {
            console.error('Quick add failed', err);
            setError('Failed to add collaborator');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateTimes()) return;

        const data = new FormData();
        Object.keys(formData).forEach(key => {
            if (key === 'collaborators') {
                // Send as collaborator_ids for the backend serializer
                formData[key].forEach(id => data.append('collaborator_ids', id));
            } else if (key === 'project') {
                // Send as project_id for the backend serializer
                if (formData[key]) {
                    data.append('project_id', formData[key]);
                }
            } else if (key === 'attachment' && formData[key]) {
                data.append('attachment', formData[key]);
            } else if (formData[key] !== null && formData[key] !== undefined && formData[key] !== '') {
                data.append(key, formData[key]);
            }
        });

        setSubmitting(true);
        try {
            if (isEdit) {
                await apiClient.put(`agendas/${id}/`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await apiClient.post('agendas/', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            navigate(-1);
        } catch (err) {
            console.error('Failed to save task', err);
            setError('Failed to save task. Check your fields.');
            setSubmitting(false);
        }
    };

    const handleAccept = async () => {
        setResponding(true);
        try {
            await apiClient.post(`agendas/${id}/accept/`);
            toast.success('Invitation accepted!');
            // Refresh data to update UI
            const agendaRes = await apiClient.get(`agendas/${id}/`);
            const agendaData = agendaRes.data;
            const me = (await apiClient.get('collaborators/')).data.find(c => c.user?.id === user?.id);
            if (me) {
                const assignment = agendaData.assignments?.find(a => a.collaborator === me.id);
                setMyAssignment(assignment);
            }
        } catch (err) {
            console.error('Accept failed', err);
            toast.error('Failed to accept invitation');
        } finally {
            setResponding(false);
        }
    };

    const handleRejectSubmit = async () => {
        if (!rejectModal.reason.trim()) {
            toast.error('Please provide a reason');
            return;
        }
        setResponding(true);
        try {
            await apiClient.post(`agendas/${id}/reject/`, {
                rejection_reason: rejectModal.reason
            });
            toast.success('Invitation rejected');
            navigate(-1);
        } catch (err) {
            console.error('Reject failed', err);
            toast.error('Failed to reject invitation');
        } finally {
            setResponding(false);
            setRejectModal({ show: false, reason: '' });
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
        </div>
    );

    return (
        <div className="flex justify-center p-4 min-h-full animate-fade-in custom-scrollbar">
            <div className="card w-full max-w-2xl bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden mt-4 mb-8">
                {/* Invitation Banner */}
                {isEdit && myAssignment?.status === 'pending' && (
                    <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3 text-white">
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                <i className="fas fa-envelope-open-text"></i>
                            </div>
                            <div>
                                <h4 className="font-bold">Pending Invitation</h4>
                                <p className="text-xs text-indigo-100">You've been invited to join this {isMeeting ? 'meeting' : 'task'}.</p>
                            </div>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <button
                                onClick={handleAccept}
                                disabled={responding}
                                className="flex-1 sm:flex-none px-6 py-2 bg-white text-indigo-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 transition-all disabled:opacity-50"
                            >
                                {responding ? <i className="fas fa-spinner fa-spin"></i> : 'Accept'}
                            </button>
                            <button
                                onClick={() => setRejectModal({ show: true, reason: '' })}
                                disabled={responding}
                                className="flex-1 sm:flex-none px-6 py-2 bg-indigo-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-400 transition-all border border-indigo-400 disabled:opacity-50"
                            >
                                Reject
                            </button>
                        </div>
                    </div>
                )}
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
                            {isReadOnly ? 'Task Details' : (isEdit ? (isMeeting ? 'Edit Meeting' : 'Edit Task') : (isMeeting ? 'Schedule Meeting' : 'New Task'))}
                        </h2>
                        {formData.project && (
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mt-1">
                                <span className={`w-2.5 h-2.5 rounded-full ring-2 bg-emerald-500 ring-emerald-100`}></span>
                                <span>{projects.find(p => p.id === parseInt(formData.project))?.name || 'Assigned Project'}</span>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-800 hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-gray-200"
                    >
                        <i className="fas fa-times text-lg"></i>
                    </button>
                </div>

                <div className="p-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="bg-red-50 border border-red-100 p-4 rounded-2xl text-red-600 text-xs font-bold animate-shake">
                                <i className="fas fa-exclamation-triangle mr-2"></i>
                                {error}
                            </div>
                        )}

                        {validationError && (
                            <div id="js-alert" className="bg-amber-50 border border-amber-100 p-4 rounded-2xl animate-fade-in mb-4 text-amber-700 text-sm font-bold">
                                <i className="fas fa-clock mr-2"></i>
                                {validationError}
                            </div>
                        )}

                        {/* a) Task Title */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">Task Title <span className="text-red-500">*</span></label>
                            <input
                                type="text" required
                                disabled={isReadOnly}
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-5 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all placeholder-gray-400 font-medium text-lg disabled:bg-gray-50 disabled:text-gray-500"
                                placeholder="What needs to be done?"
                            />
                        </div>

                        {/* b) Start and Expected Finish */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
                                <label className="text-xs font-bold text-gray-400 uppercase mb-4 flex items-center gap-2 font-mono tracking-widest">
                                    <i className="far fa-clock"></i> {isMeeting ? 'Meeting Time' : 'Start'}
                                </label>
                                <input
                                    type="date" required
                                    disabled={isReadOnly}
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full mb-3 px-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:border-emerald-500 outline-none text-sm font-medium disabled:bg-gray-50"
                                />
                                <input
                                    type="time"
                                    disabled={isReadOnly}
                                    value={formData.time}
                                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:border-emerald-500 outline-none text-sm font-medium disabled:bg-gray-50"
                                />
                            </div>
                            {!isMeeting && (
                                <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
                                    <label className="text-xs font-bold text-gray-400 uppercase mb-4 flex items-center gap-2 font-mono tracking-widest">
                                        <i className="fas fa-flag-checkered"></i> Expected Finish
                                    </label>
                                    <input
                                        type="date"
                                        disabled={isReadOnly}
                                        value={formData.expected_finish_date}
                                        onChange={(e) => setFormData({ ...formData, expected_finish_date: e.target.value })}
                                        className="w-full mb-3 px-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:border-emerald-500 outline-none text-sm font-medium disabled:bg-gray-50"
                                    />
                                    <input
                                        type="time"
                                        disabled={isReadOnly}
                                        value={formData.expected_finish_time}
                                        onChange={(e) => setFormData({ ...formData, expected_finish_time: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:border-emerald-500 outline-none text-sm font-medium disabled:bg-gray-50"
                                    />
                                </div>
                            )}
                        </div>

                        {/* c) Task Category (Automatic) */}
                        {!isMeeting && (
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Task Category</label>
                                <select
                                    value={formData.category}
                                    disabled={isReadOnly}
                                    onChange={(e) => {
                                        const newCategory = e.target.value;
                                        setIsManualCategory(newCategory !== ''); // Track if user manually selected
                                        setFormData(prev => ({ ...prev, category: newCategory }));
                                    }}
                                    className="w-full px-5 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium disabled:bg-gray-50"
                                >
                                    <option value="">Auto (based on dates)</option>
                                    <option value="short">🔵 Short-term (≤3 days)</option>
                                    <option value="mid">🟠 Mid-term (4-10 days)</option>
                                    <option value="long">🟣 Long-term (&gt;10 days)</option>
                                </select>
                                {formData.category && formData.expected_finish_date && (
                                    <p className="text-xs text-emerald-600 mt-2 font-medium">
                                        <i className="fas fa-lightbulb mr-1"></i>
                                        Suggested finish date based on {formData.category}-term category
                                    </p>
                                )}
                                {!formData.category && formData.date && formData.expected_finish_date && (
                                    <p className="text-xs text-gray-500 mt-2 font-medium">
                                        <i className="fas fa-tag mr-1"></i>
                                        This will be categorized as: <span className="font-bold text-gray-700 capitalize">{getCalculatedCategory(formData.date, formData.expected_finish_date)}-term</span>
                                    </p>
                                )}
                            </div>
                        )}

                        {/* d) Description/Activities */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">Description/Activities</label>
                            {isReadOnly ? (
                                <div className="w-full px-5 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-700 font-medium whitespace-pre-wrap min-h-[5rem]">
                                    {formData.description || 'No description provided.'}
                                </div>
                            ) : (
                                <textarea
                                    rows="4"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-5 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all placeholder-gray-400 font-medium resize-none"
                                    placeholder="Add details and activities..."
                                ></textarea>
                            )}
                        </div>

                        {/* e) Attachments & f) External Link */}
                        <div className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100 space-y-4">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                <i className="fas fa-paperclip"></i> Resources & Attachments
                            </h3>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">e) Attachments</label>
                                {isReadOnly ? (
                                    formData.attachment ? (
                                        <a
                                            href={formData.attachment}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-between w-full px-5 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                                    <i className="fas fa-file-alt"></i>
                                                </div>
                                                <span className="truncate max-w-[200px] sm:max-w-xs">{typeof formData.attachment === 'string' ? formData.attachment.split('/').pop() : 'Attached File'}</span>
                                            </div>
                                            <i className="fas fa-download text-gray-400"></i>
                                        </a>
                                    ) : (
                                        <div className="w-full px-5 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-400 font-medium italic">
                                            No attachment
                                        </div>
                                    )
                                ) : (
                                    <input
                                        type="file"
                                        onChange={(e) => setFormData({ ...formData, attachment: e.target.files[0] })}
                                        className="block w-full text-sm text-gray-500 bg-white border border-gray-200 rounded-xl file:mr-4 file:py-2.5 file:px-4 file:rounded-l-xl file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer transition-colors"
                                    />
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">f) External Link</label>
                                <div className="relative group">
                                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400 group-focus-within:text-emerald-500 transition-colors">
                                        <i className="fas fa-link"></i>
                                    </span>
                                    {isReadOnly ? (
                                        formData.external_link ? (
                                            <a
                                                href={formData.external_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block w-full pl-11 pr-5 py-3 border border-gray-200 rounded-xl bg-gray-50 text-emerald-600 font-medium hover:text-emerald-700 hover:bg-gray-100 transition-colors truncate"
                                            >
                                                {formData.external_link}
                                            </a>
                                        ) : (
                                            <div className="w-full pl-11 pr-5 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-400 font-medium italic">
                                                No external link
                                            </div>
                                        )
                                    ) : (
                                        <input
                                            type="url"
                                            value={formData.external_link}
                                            onChange={(e) => setFormData({ ...formData, external_link: e.target.value })}
                                            className="w-full pl-11 pr-5 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all placeholder-gray-400 font-medium bg-white"
                                            placeholder="https://example.com/doc"
                                        />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* g) Team Leader & h) Collaborators */}
                        <div className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100 space-y-4">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                <i className="fas fa-users"></i> Team & Collaborators
                            </h3>

                            <div className="relative" ref={dropdownRef}>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-bold text-gray-700">h) Collaborators</label>
                                    {!isReadOnly && (
                                        <button
                                            type="button"
                                            onClick={() => setIsQuickAddOpen(!isQuickAddOpen)}
                                            className="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors"
                                        >
                                            <i className="fas fa-plus"></i> Quick Add
                                        </button>
                                    )}
                                </div>

                                {isQuickAddOpen && (
                                    <div className="mb-4 p-4 bg-white rounded-xl border border-emerald-100 shadow-sm space-y-3 relative z-10 animate-fade-in">
                                        <div className="absolute -top-1.5 right-6 w-3 h-3 bg-white border-t border-l border-emerald-100 transform rotate-45"></div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <input
                                                type="text" placeholder="Name"
                                                value={quickAddData.name}
                                                onChange={(e) => setQuickAddData({ ...quickAddData, name: e.target.value })}
                                                className="text-sm px-4 py-2 border rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
                                            />
                                            <input
                                                type="text" placeholder="WhatsApp"
                                                value={quickAddData.whatsapp_number}
                                                onChange={(e) => setQuickAddData({ ...quickAddData, whatsapp_number: e.target.value })}
                                                className="text-sm px-4 py-2 border rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
                                            />
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <button type="button" onClick={() => setIsQuickAddOpen(false)} className="text-xs font-bold px-3 py-1.5 text-gray-500 hover:text-gray-700">Cancel</button>
                                            <button type="button" onClick={handleQuickAdd} className="text-xs font-bold px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition-colors">Add & Select</button>
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-2 mb-3">
                                    {formData.collaborators.map(id => {
                                        const collab = collaborators.find(c => c.id === id);
                                        return collab ? (
                                            <span key={id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 text-sm font-medium rounded-full">
                                                {collab.name}
                                                {!isReadOnly && (
                                                    <button type="button" onClick={() => handleCollabToggle(id)} className="hover:text-emerald-900 transition-colors">
                                                        <i className="fas fa-times text-xs"></i>
                                                    </button>
                                                )}
                                            </span>
                                        ) : null;
                                    })}
                                </div>

                                {!isReadOnly && (
                                    <button
                                        type="button"
                                        onClick={() => setIsCollabDropdownOpen(!isCollabDropdownOpen)}
                                        className="w-full px-5 py-3 border border-gray-200 rounded-xl bg-white text-left flex justify-between items-center hover:border-emerald-300 transition-colors"
                                    >
                                        <span className={`font-medium ${formData.collaborators.length > 0 ? 'text-gray-700' : 'text-gray-400'}`}>
                                            {formData.collaborators.length > 0 ? 'Add more...' : 'Select collaborators...'}
                                        </span>
                                        <i className={`fas fa-chevron-down text-xs text-gray-400 transition-transform ${isCollabDropdownOpen ? 'rotate-180' : ''}`}></i>
                                    </button>
                                )}

                                {isCollabDropdownOpen && (
                                    <div className="absolute z-20 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar p-1">
                                        <div className="space-y-0.5">
                                            {collaborators.map(collaborator => (
                                                <label key={collaborator.id} className="flex items-center px-4 py-2.5 hover:bg-emerald-50 cursor-pointer rounded-lg transition-colors group">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.collaborators.includes(collaborator.id)}
                                                        onChange={() => handleCollabToggle(collaborator.id)}
                                                        className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                                                    />
                                                    <div className="ml-3 flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold">
                                                            {collaborator.name[0]}
                                                        </div>
                                                        <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{collaborator.name}</span>
                                                    </div>
                                                </label>
                                            ))}
                                            {collaborators.length === 0 && <div className="px-4 py-3 text-sm text-gray-500 text-center">No collaborators found</div>}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* i) Project & j) Priority */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">i) Project</label>
                                <select
                                    value={formData.project}
                                    disabled={isReadOnly}
                                    onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                                    className="w-full px-5 py-3 border border-gray-200 rounded-xl bg-white text-gray-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all disabled:bg-gray-50"
                                >
                                    <option value="">No Project (Inbox)</option>
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">{isMeeting ? 'Meeting Priority' : 'j) Priority'}</label>
                                <div className="relative">
                                    <select
                                        value={formData.priority}
                                        disabled={isReadOnly}
                                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                        className="w-full px-5 py-3 border border-gray-200 rounded-xl bg-white text-gray-700 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all appearance-none disabled:bg-gray-50"
                                    >
                                        <option value="low">Low Priority</option>
                                        <option value="medium">Medium Priority</option>
                                        <option value="high">High Priority</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                                        <i className="fas fa-chevron-down text-xs"></i>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Meeting Link (if meeting type) */}
                        {isMeeting && (
                            <div className="p-5 bg-gradient-to-br from-emerald-50/50 to-indigo-50/30 rounded-[2rem] border border-emerald-100 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16"></div>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4 relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-200 shrink-0">
                                            <i className="fas fa-video"></i>
                                        </div>
                                        <div className="flex-grow">
                                            <label className="block text-sm font-bold text-gray-800">Connection Link</label>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Google Meet Integration</p>
                                        </div>
                                    </div>
                                    {!isReadOnly && (
                                        <a
                                            href="https://meet.google.com/"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full sm:w-auto px-4 py-2 bg-white text-emerald-600 border border-emerald-100 rounded-xl text-xs font-bold hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 shadow-sm"
                                        >
                                            <i className="fas fa-external-link-alt"></i>
                                            Generate Link
                                        </a>
                                    )}
                                </div>

                                <div className="flex gap-2 relative z-10">
                                    <div className="relative flex-grow">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <i className="fas fa-link text-emerald-400"></i>
                                        </div>
                                        <input
                                            type="text"
                                            name="meeting_link"
                                            disabled={isReadOnly}
                                            placeholder="Paste Meet link (e.g. meet.google.com/abc-xyz)"
                                            value={formData.meeting_link}
                                            onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
                                            onBlur={(e) => {
                                                let val = e.target.value.trim();
                                                if (val && !/^https?:\/\//i.test(val)) {
                                                    const newVal = 'https://' + val;
                                                    setFormData({ ...formData, meeting_link: newVal });
                                                }
                                            }}
                                            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-sm font-medium disabled:bg-gray-50"
                                        />
                                    </div>
                                    {formData.meeting_link && (
                                        <a
                                            href={formData.meeting_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-5 py-3 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all flex items-center justify-center shadow-lg shadow-emerald-100"
                                            title="Check Connection"
                                        >
                                            <i className="fas fa-external-link-alt text-sm"></i>
                                        </a>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="pt-5 flex gap-4 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="flex-1 px-6 py-3.5 border border-gray-200 text-gray-600 font-bold rounded-xl text-center hover:bg-gray-50 hover:text-gray-800 transition-colors"
                            >
                                {isReadOnly ? 'Close' : 'Cancel'}
                            </button>
                            {!isReadOnly && (
                                <button
                                    type="submit"
                                    disabled={!!validationError || submitting}
                                    className={`flex-1 px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 hover:shadow-emerald-300 transform transition-all hover:-translate-y-0.5 ${(!!validationError || submitting) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {submitting ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <i className="fas fa-spinner fa-spin"></i>
                                            <span>Saving...</span>
                                        </span>
                                    ) : (
                                        isEdit ? 'Save Changes' : (isMeeting ? 'Schedule Meeting' : 'Create Task')
                                    )}
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div >

            <ConfirmModal
                isOpen={rejectModal.show}
                onClose={() => setRejectModal({ show: false, reason: '' })}
                onConfirm={handleRejectSubmit}
                title="Reject Task"
                message="Are you sure you want to reject this task? This action cannot be undone."
                type="danger"
                confirmLabel="Reject"
            >
                <div className="mt-4">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Rejection Reason *</label>
                    <textarea
                        value={rejectModal.reason}
                        onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-red-100 focus:border-red-500 outline-none transition-all text-sm min-h-[100px]"
                        placeholder="Why are you rejecting?"
                    />
                </div>
            </ConfirmModal>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fade-in 0.4s ease-out; }
            `}</style>
        </div >
    );
};

export default AgendaForm;

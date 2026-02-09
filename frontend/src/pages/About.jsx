import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import { Link, useParams } from 'react-router-dom';

const About = () => {
    const { user: authUser } = useAuth();
    const { id } = useParams();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            try {
                if (id) {
                    // Fetch specific collaborator profile
                    const response = await apiClient.get(`collaborators/${id}/`);
                    // Unify structure: collaborators/:id returns the object directly, 
                    // but we need to normalize it to match auth/profile/ structure or adapt displayData
                    setProfile({
                        collaborator: response.data,
                        user: response.data.user
                    });
                } else {
                    // Fetch current user's profile
                    const response = await apiClient.get('auth/profile/');
                    setProfile(response.data);
                }
            } catch (err) {
                console.error('Failed to fetch profile', err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [authUser, id]);

    if (loading) return (
        <div className="flex items-center justify-center h-full min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
        </div>
    );

    const collaborator = profile?.collaborator;
    const user = profile?.user;

    const displayData = {
        name: collaborator?.name || user?.first_name ? `${user.first_name} ${user.last_name}` : user?.username,
        designation: collaborator?.designation || "Researcher",
        institute: collaborator?.institute || "Agromet Lab",
        organization: collaborator?.organization || "Bangladesh Rice Research Institute (BRRI)",
        division: collaborator?.division || "",
        address: collaborator?.address || "",
        email: user?.email || collaborator?.email || "",
        whatsapp: collaborator?.whatsapp_number || "",
        image: collaborator?.image_url || "/favicon.ico",
        research_interests: collaborator?.research_interests ? collaborator.research_interests.split(',').map(s => s.trim()) : [],
        research_experience: collaborator?.research_experience || "",
        publications: collaborator?.publications || "",
        education: collaborator?.education || ""
    };

    return (
        <div className="max-w-6xl mx-auto animate-fade-in pb-12 px-4 sm:px-0">
            {/* Header Section */}
            <div className="bg-white rounded-[3rem] border border-gray-100 shadow-xl shadow-emerald-500/5 overflow-hidden mb-8">
                <div className="h-48 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 relative">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                    <div className="absolute -bottom-16 left-8 sm:left-12">
                        <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-[2.5rem] bg-white p-1.5 shadow-2xl relative group">
                            <img
                                src={displayData.image}
                                alt={displayData.name}
                                className="w-full h-full rounded-[2.2rem] object-cover"
                            />
                            {authUser?.id === user?.id && (
                                <Link to="/settings" className="absolute inset-0 bg-black/40 rounded-[2.2rem] opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-white backdrop-blur-sm">
                                    <i className="fas fa-camera text-2xl"></i>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                <div className="pt-20 pb-10 px-8 sm:px-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">{displayData.name}</h1>
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-black uppercase tracking-widest rounded-lg">
                                {displayData.designation}
                            </span>
                            <span className="text-gray-400 font-bold text-sm">
                                <i className="fas fa-building mr-1.5"></i>
                                {displayData.division ? `${displayData.division}, ` : ""}{displayData.institute}
                            </span>
                        </div>
                        <p className="text-gray-500 font-medium max-w-2xl">
                            {displayData.organization}
                        </p>
                    </div>

                    <div className="flex gap-3 w-full md:w-auto">
                        {(authUser?.id === user?.id) && (
                            <Link to="/settings" className="flex-1 md:flex-none px-6 py-3.5 bg-gray-900 hover:bg-black text-white rounded-2xl font-bold transition-all shadow-xl shadow-gray-200 flex items-center justify-center gap-2">
                                <i className="fas fa-user-edit"></i>
                                <span>Edit Profile</span>
                            </Link>
                        )}
                        {id && authUser?.is_superuser && authUser?.id !== user?.id && (
                            <Link to="/collaborators" className="flex-1 md:flex-none px-6 py-3.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-2xl font-bold transition-all flex items-center justify-center gap-2">
                                <i className="fas fa-arrow-left"></i>
                                <span>Back to Team</span>
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column */}
                <div className="space-y-8">
                    {/* Contact Info */}
                    <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm">
                        <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                            <i className="fas fa-id-card text-emerald-500"></i>
                            Connect
                        </h3>
                        <div className="space-y-4">
                            {displayData.email && (
                                <a href={`mailto:${displayData.email}`} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-emerald-200 hover:bg-white transition-all group">
                                    <div className="w-10 h-10 rounded-xl bg-white text-gray-400 flex items-center justify-center shadow-sm group-hover:text-emerald-600 transition-colors">
                                        <i className="far fa-envelope"></i>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Email</p>
                                        <p className="text-sm font-bold text-gray-700 truncate">{displayData.email}</p>
                                    </div>
                                </a>
                            )}
                            {displayData.whatsapp && (
                                <a href={`https://wa.me/${displayData.whatsapp}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-emerald-200 hover:bg-white transition-all group">
                                    <div className="w-10 h-10 rounded-xl bg-white text-gray-400 flex items-center justify-center shadow-sm group-hover:text-emerald-600 transition-colors">
                                        <i className="fab fa-whatsapp"></i>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">WhatsApp</p>
                                        <p className="text-sm font-bold text-gray-700 truncate">{displayData.whatsapp}</p>
                                    </div>
                                </a>
                            )}
                            {displayData.address && (
                                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-transparent">
                                    <div className="w-10 h-10 rounded-xl bg-white text-gray-400 flex items-center justify-center shadow-sm">
                                        <i className="fas fa-map-marker-alt"></i>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Address</p>
                                        <p className="text-sm font-bold text-gray-700 line-clamp-2">{displayData.address}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Research Interests */}
                    <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm">
                        <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                            <i className="fas fa-lightbulb text-emerald-500"></i>
                            Interests
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {displayData.research_interests.length > 0 ? (
                                displayData.research_interests.map((interest, idx) => (
                                    <span key={idx} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-100">
                                        {interest}
                                    </span>
                                ))
                            ) : (
                                <p className="text-gray-400 text-sm italic">No interests listed.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Research Experience */}
                    <div className="bg-white rounded-[2.5rem] p-8 sm:p-10 border border-gray-100 shadow-sm">
                        <h3 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <i className="fas fa-microscope"></i>
                            </div>
                            Research Experience
                        </h3>
                        {displayData.research_experience ? (
                            <div className="prose prose-emerald max-w-none">
                                <p className="text-gray-600 leading-relaxed font-medium whitespace-pre-wrap">
                                    {displayData.research_experience}
                                </p>
                            </div>
                        ) : (
                            <div className="py-10 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No experience details added</p>
                            </div>
                        )}
                    </div>

                    {/* Publications */}
                    <div className="bg-white rounded-[2.5rem] p-8 sm:p-10 border border-gray-100 shadow-sm">
                        <h3 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                <i className="fas fa-book"></i>
                            </div>
                            Selected Publications
                        </h3>
                        {displayData.publications ? (
                            <div className="prose prose-blue max-w-none">
                                <p className="text-gray-600 leading-relaxed font-medium whitespace-pre-wrap">
                                    {displayData.publications}
                                </p>
                            </div>
                        ) : (
                            <div className="py-10 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No publications listed</p>
                            </div>
                        )}
                    </div>

                    {/* Education */}
                    <div className="bg-white rounded-[2.5rem] p-8 sm:p-10 border border-gray-100 shadow-sm">
                        <h3 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                                <i className="fas fa-graduation-cap"></i>
                            </div>
                            Education
                        </h3>
                        {displayData.education ? (
                            <div className="prose prose-purple max-w-none">
                                <p className="text-gray-600 leading-relaxed font-medium whitespace-pre-wrap">
                                    {displayData.education}
                                </p>
                            </div>
                        ) : (
                            <div className="py-10 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Education background not set</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes fade-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
            `}</style>
        </div>
    );
};

export default About;

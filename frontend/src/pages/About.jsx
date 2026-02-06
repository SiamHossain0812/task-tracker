import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';

const About = () => {
    const { user: authUser } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!authUser?.is_superuser) {
                try {
                    const response = await apiClient.get('auth/profile/');
                    setProfile(response.data);
                } catch (err) {
                    console.error('Failed to fetch profile', err);
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [authUser]);

    if (loading) return (
        <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
        </div>
    );

    // Dr. Niaz's Hardcoded Info for Superusers
    const drNiazInfo = {
        name: "Niaz Md. Farhat Rahman",
        title: "Principal Scientist",
        org: "Bangladesh Rice Research Institute (BRRI)",
        loc: "Dhaka, Bangladesh",
        image: "/dr_niaz_flat_green.png",
        skills: ['Teaching', 'Research', 'Science', 'Statistics'],
        linkedin: "https://www.linkedin.com/in/niaz-md-farhat-rahman-72407834",
        email: "scientist@brri.org",
        experience: [
            { title: 'Principal Scientist', org: 'Bangladesh Rice Research Institute (BRRI)', period: 'Dec 2022 - Present', loc: 'Gazipur District, Dhaka, Bangladesh', active: true },
            { title: 'Senior Scientist', org: 'Bangladesh Rice Research Institute (BRRI)', period: 'Sep 2014 - Oct 2023', loc: 'Gazipur District, Dhaka, Bangladesh' },
            { title: 'Scientist', org: 'Bangladesh Rice Research Institute (BRRI)', period: 'Jan 2013 - Sep 2014', loc: 'Gazipur District, Dhaka, Bangladesh' },
            { title: 'Lecturer', org: 'Bangladesh University', period: 'Apr 2012 - Dec 2012', loc: 'Teaching and Research' },
            { title: 'Lecturer', org: 'Mirpur College', period: 'July 2010 - April 2012', loc: 'Teaching and Research' }
        ],
        education: [
            { school: 'Bangladesh Agricultural University', degree: 'Master of Science (M.S.), Statistics', period: '2008 - 2009', active: true },
            { school: 'Shahjalal University of Science and Technology', degree: 'Bachelor of Science (B.Sc.), Statistics', period: '2002 - 2007' },
            { school: 'Govt. Debendra College, Manikganj', degree: 'HSC, Science', period: '1998 - 1999' }
        ]
    };

    const isSuper = authUser?.is_superuser;
    const displayData = isSuper ? drNiazInfo : {
        name: profile?.collaborator?.name || authUser?.username,
        title: profile?.collaborator?.institute || "Collaborator",
        org: profile?.collaborator?.address || "",
        loc: profile?.user?.email || "",
        image: profile?.collaborator?.image_url || "/favicon.ico",
        skills: ['Collaborative Research', 'Task Management'],
        experience: [],
        education: []
    };

    return (
        <div className="max-w-6xl mx-auto animate-fade-in pb-12 px-4 sm:px-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Sidebar: Profile Card */}
                <div className="space-y-6">
                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-lg shadow-gray-100/50 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-emerald-50 to-teal-50"></div>
                        <div className="relative z-10">
                            <div className="w-32 h-32 mx-auto mb-4 rounded-full p-1 bg-white ring-4 ring-emerald-50 shadow-sm overflow-hidden">
                                <img
                                    src={displayData.image}
                                    alt={displayData.name}
                                    className="w-full h-full rounded-full object-cover"
                                />
                            </div>
                            <h1 className="text-2xl font-bold text-gray-800 mb-1 leading-tight">{displayData.name}</h1>
                            <div className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wider rounded-full inline-block mb-4">
                                {displayData.title}
                            </div>
                            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                                {displayData.org}<br />
                                {displayData.loc}
                            </p>
                            <div className="space-y-3">
                                {isSuper && (
                                    <a
                                        href={displayData.linkedin}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 w-full py-3 bg-[#0a66c2] text-white rounded-xl font-semibold hover:bg-[#004182] transition-colors shadow-lg shadow-blue-200"
                                    >
                                        <i className="fab fa-linkedin"></i>
                                        <span>Connect on LinkedIn</span>
                                    </a>
                                )}
                                <a
                                    href={`mailto:${displayData.email || authUser?.email}`}
                                    className="flex items-center justify-center gap-2 w-full py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                                >
                                    <i className="far fa-envelope"></i>
                                    <span>Contact Me</span>
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                        <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <i className="fas fa-layer-group text-emerald-500"></i>
                            <span>Top Skills</span>
                        </h3>
                        <div className="flex flex-wrap gap-2 mb-8">
                            {displayData.skills.map(skill => (
                                <span key={skill} className="px-3 py-1.5 bg-gray-50 text-gray-600 text-sm font-medium rounded-lg border border-gray-100 italic">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Content: Experience & Education */}
                <div className="lg:col-span-2 space-y-8">
                    {displayData.experience.length > 0 && (
                        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                            <h2 className="text-xl font-bold text-gray-800 mb-8 pb-4 border-b border-gray-50 flex items-center gap-3">
                                <span className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg shadow-sm">
                                    <i className="fas fa-briefcase"></i>
                                </span>
                                Experience
                            </h2>
                            <div className="space-y-10 relative before:absolute before:left-3.5 before:top-2 before:h-full before:w-0.5 before:bg-gray-100">
                                {displayData.experience.map((item, idx) => (
                                    <div key={idx} className="relative pl-10 animate-slide-in" style={{ animationDelay: `${idx * 0.1}s` }}>
                                        <div className={`absolute left-1.5 top-1.5 w-4 h-4 rounded-full ring-4 ring-white shadow-md ${item.active ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                                        <h3 className="text-lg font-bold text-gray-800">{item.title}</h3>
                                        <div className={`${item.active ? 'text-emerald-600' : 'text-gray-600'} font-medium mb-1`}>{item.org}</div>
                                        <p className="text-sm text-gray-400 mb-1">{item.period}</p>
                                        <p className="text-sm text-gray-400">{item.loc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {displayData.education.length > 0 && (
                        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                            <h2 className="text-xl font-bold text-gray-800 mb-8 pb-4 border-b border-gray-50 flex items-center gap-3">
                                <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg shadow-sm">
                                    <i className="fas fa-graduation-cap"></i>
                                </span>
                                Education
                            </h2>
                            <div className="space-y-8 relative before:absolute before:left-3.5 before:top-2 before:h-full before:w-0.5 before:bg-gray-100">
                                {displayData.education.map((item, idx) => (
                                    <div key={idx} className="relative pl-10 animate-slide-in" style={{ animationDelay: `${0.5 + idx * 0.1}s` }}>
                                        <div className={`absolute left-2 top-2 w-3 h-3 rounded-full ring-4 ring-white shadow-sm ${item.active ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                                        <h3 className="text-lg font-bold text-gray-800">{item.school}</h3>
                                        <p className="text-gray-600 font-medium">{item.degree}</p>
                                        <p className="text-sm text-gray-400">{item.period}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {!isSuper && (
                        <div className="bg-emerald-50 rounded-3xl p-8 border border-emerald-100 text-center">
                            <p className="text-emerald-800 font-medium mb-4">Want to customize your lab profile details?</p>
                            <a href="/settings" className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100">
                                <i className="fas fa-user-edit"></i>
                                <span>Go to Settings</span>
                            </a>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slide-in { 
                    from { opacity: 0; transform: translateX(-15px); } 
                    to { opacity: 1; transform: translateX(0); } 
                }
                .animate-fade-in { animation: fade-in 0.6s ease-out; }
                .animate-slide-in { animation: slide-in 0.5s ease-out backwards; }
            `}</style>
        </div>
    );
};

export default About;

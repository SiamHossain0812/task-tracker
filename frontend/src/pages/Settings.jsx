import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';

const Settings = () => {
    const { user: authUser } = useAuth();
    const [profile, setProfile] = useState({
        name: '',
        institute: '',
        address: '',
        whatsapp_number: '',
        designation: '',
        division: '',
        organization: '',
        education: '',
        research_experience: '',
        publications: '',
        research_interests: '',
        image_url: null,
        image: null,
        image_preview: null
    });

    // Password state
    const [passwords, setPasswords] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const fileInputRef = useRef(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await apiClient.get('auth/profile/');
                const { collaborator } = response.data;
                setProfile(prev => ({
                    ...prev,
                    name: collaborator.name || '',
                    institute: collaborator.institute || '',
                    address: collaborator.address || '',
                    whatsapp_number: collaborator.whatsapp_number || '',
                    designation: collaborator.designation || '',
                    division: collaborator.division || '',
                    organization: collaborator.organization || '',
                    education: collaborator.education || '',
                    research_experience: collaborator.research_experience || '',
                    publications: collaborator.publications || '',
                    research_interests: collaborator.research_interests || '',
                    image_url: collaborator.image_url || null
                }));
            } catch (err) {
                console.error('Failed to fetch profile', err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswords(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfile(prev => ({ ...prev, image: file, image_preview: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ text: '', type: '' });

        try {
            const formData = new FormData();
            if (profile.image) {
                formData.append('image', profile.image);
            }

            // Append other fields
            formData.append('name', profile.name);
            formData.append('institute', profile.institute);
            formData.append('address', profile.address);
            formData.append('whatsapp_number', profile.whatsapp_number);
            formData.append('designation', profile.designation);
            formData.append('division', profile.division);
            formData.append('organization', profile.organization);
            formData.append('education', profile.education);
            formData.append('research_experience', profile.research_experience);
            formData.append('publications', profile.publications);
            formData.append('research_interests', profile.research_interests);

            // 1. Update Profile
            await apiClient.post('auth/profile/update/', formData);

            // 2. Handle Password Reset if requested
            if (passwords.new_password) {
                if (passwords.new_password !== passwords.confirm_password) {
                    throw new Error("New passwords do not match");
                }

                await apiClient.post('auth/password/change/', {
                    old_password: passwords.current_password,
                    new_password: passwords.new_password
                });
            }

            setMessage({ text: 'Settings updated successfully!', type: 'success' });

            // Clear passwords
            setPasswords({
                current_password: '',
                new_password: '',
                confirm_password: ''
            });

            // Cleanup image preview
            setProfile(prev => ({ ...prev, image_preview: null, image: null }));

            // Reload page to reflect changes
            setTimeout(() => window.location.reload(), 1500);

        } catch (err) {
            console.error('Update failed', err);
            const errorMsg = err.response?.data?.detail
                || err.response?.data?.error
                || err.message
                || 'Failed to update settings.';
            setMessage({ text: errorMsg, type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto animate-fade-in pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 px-4 md:px-0">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Account Settings</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage your professional identity and security</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold uppercase tracking-wider self-start md:self-center">
                    <i className="fas fa-shield-alt"></i>
                    <span>Secure Session</span>
                </div>
            </div>

            {message.text && (
                <div className={`mx-4 md:mx-0 mb-8 p-4 rounded-2xl flex items-center gap-3 animate-fade-in ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                    }`}>
                    <i className={`fas ${message.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
                    <p className="text-sm font-bold">{message.text}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8 px-4 md:px-0">
                {/* Profile Photo Section */}
                <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-xl hover:shadow-emerald-500/5 transition-all">
                    <h2 className="text-xl font-bold text-gray-800 mb-8 flex items-center gap-2">
                        <i className="far fa-image text-emerald-500"></i>
                        <span>Profile Picture</span>
                    </h2>

                    <div className="flex flex-col md:flex-row items-center gap-10">
                        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <div className="w-40 h-40 rounded-[2rem] overflow-hidden ring-8 ring-gray-50 shadow-lg transition-transform group-hover:scale-105 relative">
                                <img
                                    src={profile.image_preview || profile.image_url || "/favicon.ico"}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-emerald-600/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white backdrop-blur-sm">
                                    <i className="fas fa-camera text-3xl"></i>
                                </div>
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleImageChange}
                            />
                        </div>
                        <div className="text-center md:text-left space-y-4">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">Update Photo</h3>
                                <p className="text-sm text-gray-400 mt-1 max-w-xs">A professional photo helps collaborators recognize you easily.</p>
                            </div>
                            <div className="flex flex-wrap justify-center md:justify-start gap-4">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-6 py-3 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-bold hover:bg-emerald-100 transition-all active:scale-95"
                                >
                                    Select Image
                                </button>
                                {profile.image_preview && (
                                    <button
                                        type="button"
                                        onClick={() => setProfile(prev => ({ ...prev, image: null, image_preview: null }))}
                                        className="px-6 py-3 bg-red-50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 transition-all"
                                    >
                                        Reset
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Professional Info Section */}
                <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
                    <h2 className="text-xl font-bold text-gray-800 mb-8 flex items-center gap-2">
                        <i className="fas fa-user-graduate text-emerald-500"></i>
                        <span>Professional Details</span>
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-600 px-1">Full Name <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                required
                                name="name"
                                value={profile.name}
                                onChange={handleProfileChange}
                                className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-[1.25rem] focus:bg-white focus:border-emerald-500/30 focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-600 px-1">Designation</label>
                            <input
                                type="text"
                                name="designation"
                                value={profile.designation}
                                onChange={handleProfileChange}
                                placeholder="e.g. Senior Researcher"
                                className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-[1.25rem] focus:bg-white focus:border-emerald-500/30 focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-600 px-1">Division / Department</label>
                            <input
                                type="text"
                                name="division"
                                value={profile.division}
                                onChange={handleProfileChange}
                                placeholder="e.g. Computer Science & Engineering"
                                className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-[1.25rem] focus:bg-white focus:border-emerald-500/30 focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-600 px-1">Organization</label>
                            <input
                                type="text"
                                name="organization"
                                value={profile.organization}
                                onChange={handleProfileChange}
                                placeholder="e.g. BRRI / Agromet Lab"
                                className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-[1.25rem] focus:bg-white focus:border-emerald-500/30 focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none"
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-bold text-gray-600 px-1">Education</label>
                            <textarea
                                name="education"
                                rows="3"
                                value={profile.education}
                                onChange={handleProfileChange}
                                placeholder="Post-doc in AI, PhD in CSE..."
                                className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-[1.25rem] focus:bg-white focus:border-emerald-500/30 focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none resize-none"
                            ></textarea>
                        </div>
                    </div>
                </div>

                {/* Research & Experience Section */}
                <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
                    <h2 className="text-xl font-bold text-gray-800 mb-8 flex items-center gap-2">
                        <i className="fas fa-microscope text-emerald-500"></i>
                        <span>Research & Background</span>
                    </h2>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-600 px-1">Research Interests</label>
                            <input
                                type="text"
                                name="research_interests"
                                value={profile.research_interests}
                                onChange={handleProfileChange}
                                placeholder="e.g. Machine Learning, Agro-Meteorology, IoT"
                                className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-[1.25rem] focus:bg-white focus:border-emerald-500/30 focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-600 px-1">Research Experience</label>
                            <textarea
                                name="research_experience"
                                rows="4"
                                value={profile.research_experience}
                                onChange={handleProfileChange}
                                placeholder="Describe your background and previous research work..."
                                className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-[1.25rem] focus:bg-white focus:border-emerald-500/30 focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none resize-none"
                            ></textarea>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-600 px-1">Selected Publications</label>
                            <textarea
                                name="publications"
                                rows="4"
                                value={profile.publications}
                                onChange={handleProfileChange}
                                placeholder="List your key journals or conference papers..."
                                className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-[1.25rem] focus:bg-white focus:border-emerald-500/30 focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none resize-none"
                            ></textarea>
                        </div>
                    </div>
                </div>

                {/* Password Reset Section */}
                <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
                    <h2 className="text-xl font-bold text-gray-800 mb-8 flex items-center gap-2">
                        <i className="fas fa-fingerprint text-emerald-500"></i>
                        <span>Security & Access</span>
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-600 px-1">Current Password</label>
                            <input
                                type="password"
                                name="current_password"
                                value={passwords.current_password}
                                onChange={handlePasswordChange}
                                placeholder="••••••••"
                                autoComplete="current-password"
                                className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-[1.25rem] focus:bg-white focus:border-emerald-500/30 focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-600 px-1">New Password</label>
                            <input
                                type="password"
                                name="new_password"
                                value={passwords.new_password}
                                onChange={handlePasswordChange}
                                placeholder="••••••••"
                                autoComplete="new-password"
                                className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-[1.25rem] focus:bg-white focus:border-emerald-500/30 focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-600 px-1">Confirm Password</label>
                            <input
                                type="password"
                                name="confirm_password"
                                value={passwords.confirm_password}
                                onChange={handlePasswordChange}
                                placeholder="••••••••"
                                autoComplete="new-password"
                                className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-[1.25rem] focus:bg-white focus:border-emerald-500/30 focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Contact Section */}
                <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
                    <h2 className="text-xl font-bold text-gray-800 mb-8 flex items-center gap-2">
                        <i className="fas fa-headset text-emerald-500"></i>
                        <span>Contact Information</span>
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-600 px-1">WhatsApp / Phone</label>
                            <input
                                type="text"
                                name="whatsapp_number"
                                value={profile.whatsapp_number}
                                onChange={handleProfileChange}
                                placeholder="+880 1XXX-XXXXXX"
                                className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-[1.25rem] focus:bg-white focus:border-emerald-500/30 focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-600 px-1">Office Address</label>
                            <input
                                type="text"
                                name="address"
                                value={profile.address}
                                onChange={handleProfileChange}
                                placeholder="Room No, Building Name..."
                                className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-[1.25rem] focus:bg-white focus:border-emerald-500/30 focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex flex-col-reverse md:flex-row items-center justify-end gap-4 pb-10">
                    <button
                        type="button"
                        onClick={() => window.history.back()}
                        className="w-full md:w-auto px-10 py-5 text-gray-400 font-bold hover:text-gray-600 transition-colors"
                    >
                        Discard Changes
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full md:min-w-[240px] px-10 py-5 bg-gradient-to-br from-emerald-600 to-teal-500 text-white rounded-[1.5rem] font-bold hover:from-emerald-700 hover:to-teal-600 transition-all shadow-xl shadow-emerald-200/50 flex items-center justify-center gap-2 group disabled:opacity-70 transform hover:-translate-y-1 active:scale-95"
                    >
                        {saving ? (
                            <>
                                <i className="fas fa-spinner fa-spin"></i>
                                <span>Saving Profile...</span>
                            </>
                        ) : (
                            <>
                                <span>Update Account</span>
                                <i className="fas fa-check-double text-xs group-hover:scale-125 transition-transform"></i>
                            </>
                        )}
                    </button>
                </div>
            </form>

            <style>{`
                @keyframes fade-in { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
                input::placeholder, textarea::placeholder { color: #cbd5e1; }
                label span { font-size: 0.8em; }
            `}</style>
        </div>
    );
};

export default Settings;

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';

const Settings = () => {
    const { user: authUser } = useAuth();
    const [profile, setProfile] = useState({
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
            // 1. Handle Image Upload if changed
            if (profile.image) {
                const formData = new FormData();
                formData.append('image', profile.image);

                // Note: We don't set Content-Type manually to let browser set boundary
                await apiClient.post('auth/profile/update/', formData);
            }

            // 2. Handle Password Reset if requested
            if (passwords.new_password) {
                if (passwords.new_password !== passwords.confirm_password) {
                    throw new Error("New passwords do not match");
                }

                // Call password change endpoint (assuming Django standard or custom)
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
        <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
        </div>
    );

    return (
        <div className="max-w-3xl mx-auto animate-fade-in pb-12">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Account Settings</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage your profile photo and security</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold uppercase tracking-wider">
                    <i className="fas fa-shield-alt"></i>
                    <span>Secure Session</span>
                </div>
            </div>

            {message.text && (
                <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 animate-fade-in ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                    }`}>
                    <i className={`fas ${message.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
                    <p className="text-sm font-medium">{message.text}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Profile Photo Section */}
                <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm relative overflow-hidden">
                    <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <i className="far fa-image text-emerald-500"></i>
                        <span>Profile Photo</span>
                    </h2>

                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <div className="w-32 h-32 rounded-3xl overflow-hidden ring-4 ring-gray-50 shadow-md transition-transform group-hover:scale-105">
                                <img
                                    src={profile.image_preview || profile.image_url || "/favicon.ico"}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                    <i className="fas fa-camera text-2xl"></i>
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
                        <div className="text-center md:text-left">
                            <h3 className="text-lg font-bold text-gray-800 mb-1">Upload New Picture</h3>
                            <p className="text-sm text-gray-400 mb-4 max-w-xs">Supports JPG, PNG. Max size 2MB.</p>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-bold hover:bg-gray-200 transition-colors"
                            >
                                Choose File
                            </button>
                        </div>
                    </div>
                </div>

                {/* Password Reset Section */}
                <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <i className="fas fa-key text-emerald-500"></i>
                        <span>Change Password</span>
                    </h2>

                    <div className="space-y-4 max-w-lg">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-600 px-1">Current Password</label>
                            <input
                                type="password"
                                name="current_password"
                                value={passwords.current_password}
                                onChange={handlePasswordChange}
                                placeholder="••••••••"
                                className="w-full px-5 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-emerald-500/30 focus:ring-4 focus:ring-emerald-500/5 transition-all text-gray-700 outline-none"
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
                                className="w-full px-5 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-emerald-500/30 focus:ring-4 focus:ring-emerald-500/5 transition-all text-gray-700 outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-600 px-1">Confirm New Password</label>
                            <input
                                type="password"
                                name="confirm_password"
                                value={passwords.confirm_password}
                                onChange={handlePasswordChange}
                                placeholder="••••••••"
                                className="w-full px-5 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-emerald-500/30 focus:ring-4 focus:ring-emerald-500/5 transition-all text-gray-700 outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex items-center justify-end gap-4 pb-4">
                    <button
                        type="button"
                        onClick={() => window.location.href = '/about'}
                        className="px-8 py-4 text-gray-500 font-bold hover:text-gray-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="min-w-[160px] px-8 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 group disabled:opacity-70"
                    >
                        {saving ? (
                            <i className="fas fa-spinner fa-spin"></i>
                        ) : (
                            <>
                                <span>Save Changes</span>
                                <i className="fas fa-arrow-right text-xs group-hover:translate-x-1 transition-transform"></i>
                            </>
                        )}
                    </button>
                </div>
            </form>

            <style>{`
                @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fade-in 0.5s ease-out; }
                input::placeholder { color: #cbd5e1; }
            `}</style>
        </div>
    );
};

export default Settings;

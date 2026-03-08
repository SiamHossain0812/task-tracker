import React, { useState } from 'react';
import apiClient from '../api/client';

const Settings = () => {
    // Password state
    const [passwords, setPasswords] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });

    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswords(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ text: '', type: '' });

        try {
            if (passwords.new_password !== passwords.confirm_password) {
                throw new Error("New passwords do not match");
            }

            await apiClient.post('auth/password/change/', {
                old_password: passwords.current_password,
                new_password: passwords.new_password
            });

            setMessage({ text: 'Password updated successfully!', type: 'success' });

            // Clear passwords
            setPasswords({
                current_password: '',
                new_password: '',
                confirm_password: ''
            });

        } catch (err) {
            console.error('Update failed', err);
            const errorMsg = err.response?.data?.detail
                || err.response?.data?.error
                || err.message
                || 'Failed to update password.';
            setMessage({ text: errorMsg, type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto animate-fade-in pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 px-4 md:px-0">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Account Security</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage your password and secure your account</p>
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
                {/* Password Reset Section */}
                <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
                    <h2 className="text-xl font-bold text-gray-800 mb-8 flex items-center gap-2">
                        <i className="fas fa-fingerprint text-emerald-500"></i>
                        <span>Change Password</span>
                    </h2>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-600 px-1">Current Password</label>
                            <input
                                type="password"
                                name="current_password"
                                required
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
                                required
                                value={passwords.new_password}
                                onChange={handlePasswordChange}
                                placeholder="••••••••"
                                autoComplete="new-password"
                                className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-[1.25rem] focus:bg-white focus:border-emerald-500/30 focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-600 px-1">Confirm New Password</label>
                            <input
                                type="password"
                                name="confirm_password"
                                required
                                value={passwords.confirm_password}
                                onChange={handlePasswordChange}
                                placeholder="••••••••"
                                autoComplete="new-password"
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
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full md:min-w-[240px] px-10 py-5 bg-gradient-to-br from-emerald-600 to-teal-500 text-white rounded-[1.5rem] font-bold hover:from-emerald-700 hover:to-teal-600 transition-all shadow-xl shadow-emerald-200/50 flex items-center justify-center gap-2 group disabled:opacity-70 transform hover:-translate-y-1 active:scale-95"
                    >
                        {saving ? (
                            <>
                                <i className="fas fa-spinner fa-spin"></i>
                                <span>Updating...</span>
                            </>
                        ) : (
                            <>
                                <span>Change Password</span>
                                <i className="fas fa-shield-alt text-xs group-hover:scale-125 transition-transform"></i>
                            </>
                        )}
                    </button>
                </div>
            </form>

            <style>{`
                @keyframes fade-in { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
                input::placeholder { color: #cbd5e1; }
            `}</style>
        </div>
    );
};

export default Settings;

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/client';

const RequestAccess = () => {
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        username: '', // Phone number
        email: '',
        password: '',
        confirm_password: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirm_password) {
            setError("Passwords don't match");
            return;
        }

        setIsLoading(true);

        try {
            await apiClient.post('auth/register/', {
                username: formData.username,
                password: formData.password,
                email: formData.email,
                first_name: formData.first_name,
                last_name: formData.last_name
            });
            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f0fff4] font-outfit p-4">
                <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-emerald-100">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600 text-3xl shadow-lg shadow-emerald-50">
                        <i className="fas fa-check"></i>
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 mb-4">Request Sent!</h2>
                    <p className="text-gray-600 mb-8 font-medium leading-relaxed">
                        Your account has been created successfully. <br />
                        Please wait for an admin to approve your request before you can log in.
                    </p>
                    <Link
                        to="/login"
                        className="inline-flex items-center justify-center gap-2 bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200/50 w-full"
                    >
                        <i className="fas fa-arrow-left"></i>
                        <span>Back to Login</span>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col lg:flex-row selection:bg-emerald-500 selection:text-white font-outfit bg-[#f0fff4]">
            {/* Left Illustration Panel (Desktop only) */}
            <div className="hidden lg:flex flex-1 bg-[#f0fff4] items-center justify-center p-16 relative overflow-hidden">
                <div className="relative z-10 w-full max-w-2xl transform hover:scale-[1.02] transition-transform duration-700">
                    <div className="bg-white/40 backdrop-blur-md rounded-[3rem] p-12 shadow-2xl border border-white/50 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-100/20 rounded-full blur-3xl -mr-32 -mt-32"></div>

                        <div className="w-24 h-24 rounded-3xl bg-emerald-600 flex items-center justify-center text-white text-5xl shadow-2xl shadow-emerald-200 mb-10 overflow-hidden relative">
                            <i className="fas fa-microscope text-3xl"></i>
                        </div>

                        <h2 className="text-5xl font-extrabold text-gray-900 mb-6 leading-tight tracking-tighter">
                            Join the <br /> <span className="text-emerald-600 underline decoration-emerald-200 underline-offset-8">Collaboration.</span>
                        </h2>
                        <p className="text-xl text-gray-600 font-medium mb-10 leading-relaxed">
                            Request access to the Agromet Lab specialized task tracker and start contributing.
                        </p>
                    </div>
                </div>
                {/* Decorative blobs */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-200/20 rounded-full blur-[100px] -mr-48 -mt-48"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-300/10 rounded-full blur-[80px] -ml-24 -mb-24"></div>
            </div>

            {/* Right Panel - Form */}
            <div className="flex-1 bg-white flex items-center justify-center p-8 md:p-16 relative z-10 shadow-[-20px_0_50px_-20px_rgba(0,0,0,0.05)] overflow-y-auto">
                <div className="w-full max-w-[440px] py-8">
                    {/* Brand Identity Section */}
                    <div className="flex flex-col items-center lg:items-start mb-10 group cursor-pointer" onClick={() => navigate('/')}>
                        <div className="flex items-center gap-4 mb-4">
                            <img src="/images/brri-logo.png" alt="BRRI Logo" className="w-16 h-16 object-contain drop-shadow-sm group-hover:scale-110 transition-transform duration-500" />
                            <div className="flex flex-col">
                                <h2 className="text-xl font-black text-gray-900 leading-none tracking-tight uppercase">
                                    Agromet Lab
                                </h2>
                                <p className="text-sm text-emerald-600 font-bold tracking-[0.2em] uppercase mt-1">
                                    Task Tracker
                                </p>
                            </div>
                        </div>
                        <div className="w-20 h-1 bg-emerald-500 rounded-full opacity-20 group-hover:w-full transition-all duration-700"></div>
                    </div>

                    {/* Header */}
                    <div className="mb-8">
                        <Link to="/login" className="inline-flex items-center gap-2 text-gray-400 hover:text-emerald-600 transition-colors font-bold text-sm mb-6">
                            <i className="fas fa-arrow-left"></i> Back to Login
                        </Link>
                        <h1 className="text-4xl font-black text-gray-900 mb-3 tracking-tighter leading-none">Request Access</h1>
                        <p className="text-gray-500 text-base font-medium">Create an account to join the workspace.</p>
                    </div>

                    {/* Error Alerts */}
                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-600 p-5 rounded-2xl mb-8 flex items-center gap-4 text-sm font-bold animate-shake shadow-sm">
                            <i className="fas fa-exclamation-circle text-lg"></i>
                            {error}
                        </div>
                    )}

                    {/* Registration Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-700 ml-1 uppercase tracking-wider">First Name</label>
                                <input
                                    type="text"
                                    name="first_name"
                                    value={formData.first_name}
                                    onChange={handleChange}
                                    className="w-full h-12 px-4 bg-gray-50 border-2 border-gray-50 rounded-xl focus:bg-white focus:border-emerald-500 outline-none font-bold text-gray-800 transition-all text-sm"
                                    placeholder="John"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-700 ml-1 uppercase tracking-wider">Last Name</label>
                                <input
                                    type="text"
                                    name="last_name"
                                    value={formData.last_name}
                                    onChange={handleChange}
                                    className="w-full h-12 px-4 bg-gray-50 border-2 border-gray-50 rounded-xl focus:bg-white focus:border-emerald-500 outline-none font-bold text-gray-800 transition-all text-sm"
                                    placeholder="Doe"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-700 ml-1 uppercase tracking-wider">Phone Number (Username)</label>
                            <div className="relative group">
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    className="w-full h-12 pl-10 pr-4 bg-gray-50 border-2 border-gray-50 rounded-xl focus:bg-white focus:border-emerald-500 outline-none font-bold text-gray-800 transition-all text-sm"
                                    placeholder="017xxxxxxxx"
                                    required
                                />
                                <i className="fas fa-phone absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-emerald-500 transition-colors text-sm"></i>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-700 ml-1 uppercase tracking-wider">Email Address</label>
                            <div className="relative group">
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full h-12 pl-10 pr-4 bg-gray-50 border-2 border-gray-50 rounded-xl focus:bg-white focus:border-emerald-500 outline-none font-bold text-gray-800 transition-all text-sm"
                                    placeholder="john@example.com"
                                    required
                                />
                                <i className="far fa-envelope absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-emerald-500 transition-colors text-sm"></i>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-700 ml-1 uppercase tracking-wider">Password</label>
                            <div className="relative group">
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full h-12 pl-10 pr-4 bg-gray-50 border-2 border-gray-50 rounded-xl focus:bg-white focus:border-emerald-500 outline-none font-bold text-gray-800 transition-all text-sm"
                                    placeholder="••••••••"
                                    required
                                />
                                <i className="fas fa-lock absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-emerald-500 transition-colors text-sm"></i>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-700 ml-1 uppercase tracking-wider">Confirm Password</label>
                            <div className="relative group">
                                <input
                                    type="password"
                                    name="confirm_password"
                                    value={formData.confirm_password}
                                    onChange={handleChange}
                                    className="w-full h-12 pl-10 pr-4 bg-gray-50 border-2 border-gray-50 rounded-xl focus:bg-white focus:border-emerald-500 outline-none font-bold text-gray-800 transition-all text-sm"
                                    placeholder="••••••••"
                                    required
                                />
                                <i className="fas fa-check-circle absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-emerald-500 transition-colors text-sm"></i>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black transition-all shadow-lg shadow-emerald-200/50 transform active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none mt-6 flex items-center justify-center gap-3 uppercase tracking-widest text-sm"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <span>Send Request</span>
                                    <i className="fas fa-paper-plane text-xs"></i>
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>

            <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                .animate-shake {
                    animation: shake 0.4s ease-in-out 0s 2;
                }
            `}</style>
        </div>
    );
};

export default RequestAccess;

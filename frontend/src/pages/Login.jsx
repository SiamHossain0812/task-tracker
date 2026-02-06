import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const result = await login(username, password);

        if (result.success) {
            navigate('/');
        } else {
            setError(result.error || 'Invalid credentials');
        }
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen flex flex-col lg:flex-row font-outfit bg-white overflow-hidden relative">
            {/* Left Panel - Full Image */}
            <div className="hidden lg:flex flex-1 relative overflow-hidden bg-emerald-50">
                <img
                    src="/dr_niaz_flat_green.png"
                    alt="Agromet Lab Workspace"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-[20s] ease-in-out hover:scale-110"
                />
            </div>

            {/* Right Panel - Login Form */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-white relative">
                {/* Floating Background Shapes - Scaled Down */}
                <div className="absolute top-10 right-10 w-48 h-48 bg-emerald-100 rounded-full blur-[60px] opacity-60 animate-float-slow -z-10"></div>
                <div className="absolute bottom-10 left-10 w-64 h-64 bg-teal-50 rounded-full blur-[60px] opacity-60 animate-float-slow-reverse -z-10"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-white/40 backdrop-blur-[1px] -z-10"></div>

                <div className="w-full max-w-[380px] z-10 space-y-6">
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
                    <div className="mb-8 text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100/50 mb-4 shadow-sm hover:scale-105 transition-transform duration-300 cursor-default">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-800">Secure Access</span>
                        </div>

                        <h1 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">Welcome Back</h1>
                        <p className="text-gray-500 text-sm font-medium">Enter your credentials to access your workspace.</p>
                    </div>

                    {/* Error Alerts */}
                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded-lg flex items-start gap-3 animate-shake shadow-sm">
                            <i className="fas fa-exclamation-circle text-base mt-0.5"></i>
                            <div>
                                <h4 className="font-bold text-xs">Authentication Failed</h4>
                                <p className="text-xs mt-0.5 opacity-90">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-4">
                            <div className="group">
                                <label className="block text-[11px] font-bold text-gray-900 uppercase tracking-wider mb-1.5 ml-1">Phone Number</label>
                                <div className="relative transform transition-all duration-300 group-focus-within:-translate-y-0.5">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-emerald-600 transition-colors">
                                        <i className="fas fa-phone text-sm"></i>
                                    </div>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="block w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-emerald-500 focus:shadow-[0_0_0_3px_rgba(16,185,129,0.1)] transition-all font-semibold text-sm"
                                        placeholder="017xxxxxxxx"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="group">
                                <label className="block text-[11px] font-bold text-gray-900 uppercase tracking-wider mb-1.5 ml-1">Password</label>
                                <div className="relative transform transition-all duration-300 group-focus-within:-translate-y-0.5">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-emerald-600 transition-colors">
                                        <i className="fas fa-lock text-sm"></i>
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="block w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-emerald-500 focus:shadow-[0_0_0_3px_rgba(16,185,129,0.1)] transition-all font-semibold text-sm"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                            <label className="flex items-center gap-2 cursor-pointer group select-none">
                                <div className="relative flex items-center">
                                    <input type="checkbox" className="peer sr-only" />
                                    <div className="w-4 h-4 border-2 border-gray-300 rounded peer-checked:bg-emerald-600 peer-checked:border-emerald-600 transition-all duration-200"></div>
                                    <i className="fas fa-check text-white text-[8px] absolute left-0.5 top-0.5 opacity-0 peer-checked:opacity-100 transition-opacity"></i>
                                </div>
                                <span className="text-xs font-bold text-gray-500 group-hover:text-emerald-700 transition-colors">Remember me</span>
                            </label>
                            <a href="#" className="text-xs font-bold text-emerald-600 hover:text-emerald-800 transition-colors">Forgot password?</a>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-all shadow-[0_4px_14px_0_rgba(16,185,129,0.39)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.23)] transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-2 group relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                            {isLoading ? (
                                <i className="fas fa-circle-notch fa-spin"></i>
                            ) : (
                                <>
                                    <span>Sign In</span>
                                    <i className="fas fa-arrow-right text-xs group-hover:translate-x-0.5 transition-transform"></i>
                                </>
                            )}
                        </button>
                    </form>

                    <div className="pt-6 border-t border-gray-100 text-center">
                        <p className="text-gray-500 font-medium text-xs">
                            Don't have an account?
                            <Link to="/request-access" className="ml-1 text-emerald-600 font-bold hover:underline tracking-wide">
                                Request Access
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes float-slow {
                    0%, 100% { transform: translate(0, 0); }
                    50% { transform: translate(20px, 20px); }
                }
                @keyframes float-slow-reverse {
                    0%, 100% { transform: translate(0, 0); }
                    50% { transform: translate(-20px, -20px); }
                }
                .animate-float-slow {
                    animation: float-slow 10s infinite ease-in-out;
                }
                .animate-float-slow-reverse {
                    animation: float-slow-reverse 15s infinite ease-in-out;
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-4px); }
                    75% { transform: translateX(4px); }
                }
                .animate-shake {
                    animation: shake 0.4s ease-in-out;
                }
            `}</style>
        </div>
    );
};

export default Login;

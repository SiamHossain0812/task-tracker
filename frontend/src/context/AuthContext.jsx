import React, { createContext, useState, useEffect, useContext } from 'react';
import { jwtDecode } from 'jwt-decode';
import apiClient from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('access_token');
            if (token) {
                try {
                    // Verify token and get user profile
                    const response = await apiClient.get('auth/user/');
                    setUser(response.data);
                } catch (error) {
                    console.error('Failed to initialize auth', error);
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                }
            }
            setLoading(false);
        };

        initAuth();
    }, []);

    const login = async (username, password) => {
        try {
            const response = await apiClient.post('auth/login/', { username, password });
            const { user: userData, tokens } = response.data;

            localStorage.setItem('access_token', tokens.access);
            localStorage.setItem('refresh_token', tokens.refresh);
            setUser(userData);

            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Login failed',
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
    };

    const value = {
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

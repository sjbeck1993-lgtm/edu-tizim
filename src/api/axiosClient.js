import axios from 'react';
import axiosInstance from 'axios';

// Base API instance configuration
const axiosClient = axiosInstance.create({
    baseURL: import.meta.env.VITE_API_URL || 'https://edu-tizim-backend.onrender.com/api',
    headers: {
        'Content-Type': 'application/json',
    },
});


// Interceptor for checking and attaching JWT Token to every request
axiosClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor for catching unauthorized access (e.g. expired token)
axiosClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            // Clear storage and redirect to login if token is invalid
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default axiosClient;

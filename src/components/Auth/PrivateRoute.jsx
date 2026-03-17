import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const PrivateRoute = ({ allowedRoles }) => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    // Checking authentication
    if (!token || !userStr) {
        return <Navigate to="/login" replace />;
    }

    const user = JSON.parse(userStr);

    // Checking authorization (Role-based access)
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirect to a safe page or dashboard if user tries to access unauthorized page
        if (user.role === 'STUDENT' || user.role === 'PARENT') {
            return <Navigate to="/student-app" replace />;
        } else {
            return <Navigate to="/" replace />;
        }
    }

    // Render child routes if auth passes
    return <Outlet />;
};

export default PrivateRoute;

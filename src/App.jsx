import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Students from './pages/Students';
import Finance from './pages/Finance';
import HR from './pages/HR';
import Courses from './pages/Courses';
import Attendance from './pages/Attendance';
import Homework from './pages/Homework';
import StudentStats from './pages/StudentStats';
import AIAnalyst from './pages/AIAnalyst';
import Login from './pages/Login';
import PrivateRoute from './components/Auth/PrivateRoute';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />

        {/* Protected Routes (Needs to be logged in) */}
        <Route element={<PrivateRoute allowedRoles={['ADMIN', 'TEACHER', 'STUDENT', 'PARENT']} />}>
          <Route path="/" element={<MainLayout />}>

            {/* Admin & Teacher ONLY Routes */}
            <Route element={<PrivateRoute allowedRoles={['ADMIN', 'TEACHER']} />}>
              <Route index element={<Dashboard />} />
              <Route path="leads" element={<Leads />} />
              <Route path="students" element={<Students />} />
              <Route path="finance" element={<Finance />} />
              <Route path="hr" element={<HR />} />
              <Route path="courses" element={<Courses />} />
              <Route path="attendance" element={<Attendance />} />
              <Route path="homework" element={<Homework />} />
              <Route path="ai-analyst" element={<AIAnalyst />} />
            </Route>

            {/* Students & Parents Route */}
            <Route path="student-app" element={<StudentStats />} />

            <Route path="settings" element={<div className="p-4">Sozlamalar (Tez Kunda)</div>} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

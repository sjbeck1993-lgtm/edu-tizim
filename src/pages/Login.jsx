import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { Lock, Phone, User, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import './Login.css';

const Login = () => {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await axiosClient.post('/auth/login', { phone, password });

            const { token, user } = response.data;

            // Save to local storage explicitly
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            toast.success(response.data.message || 'Hush kelibsiz!', { icon: '👋' });

            // Navigate based on roles
            if (user.role === 'ADMIN' || user.role === 'TEACHER') {
                navigate('/'); // Main dashboard
            } else {
                navigate('/student-app'); // Parent/Student mobile view
            }

        } catch (error) {
            toast.error(error.response?.data?.message || 'Login qilishda xatolik! Raqam yoki parolni tekshiring.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <div className="login-logo">
                        <User size={32} className="text-primary-blue" />
                    </div>
                    <h2>Tizimga Kirish</h2>
                    <p>Smart Learning Center portali</p>
                </div>

                <form onSubmit={handleLogin} className="login-form">
                    <div className="input-group">
                        <label>Telefon raqam</label>
                        <div className="input-with-icon">
                            <Phone size={18} className="input-icon" />
                            <input
                                type="text"
                                placeholder="+998901234567"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Parol</label>
                        <div className="input-with-icon">
                            <Lock size={18} className="input-icon" />
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary login-btn"
                        disabled={loading}
                    >
                        {loading ? <span className="spinner-small"></span> : <><LogIn size={18} /> Kirish</>}
                    </button>
                </form>

                <div className="login-footer">
                    <p>Demo kirishlar:</p>
                    <div className="demo-creds">
                        <span><b>Admin:</b> +998901234567 / admin123</span>
                        <span><b>Ustoz:</b> +998991112233 / teacher123</span>
                        <span><b>O'quvchi:</b> +998900010001 / student123</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;

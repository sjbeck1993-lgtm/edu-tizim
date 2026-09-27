import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { Lock, Phone, LogIn, GraduationCap, BarChart3, ShieldCheck } from 'lucide-react';
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
        <div className="login-page">
            <div className="login-brand-panel">
                <div className="login-brand-content">
                    <div className="login-brand-logo">SC</div>
                    <h1>SmartCenter</h1>
                    <p className="login-brand-tagline">O'quv markazingizni boshqarish uchun yagona tizim</p>

                    <svg className="login-illustration" viewBox="0 0 440 320" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <circle cx="60" cy="280" r="5" fill="white" opacity="0.15" />
                        <circle cx="400" cy="255" r="4" fill="white" opacity="0.15" />
                        <circle cx="405" cy="55" r="5" fill="white" opacity="0.15" />
                        <circle cx="28" cy="110" r="3" fill="white" opacity="0.15" />

                        <rect x="40" y="30" width="360" height="240" rx="24" fill="white" opacity="0.06" stroke="white" strokeOpacity="0.28" strokeWidth="1.5" />

                        <rect x="100" y="180" width="32" height="50" rx="8" fill="white" opacity="0.3" />
                        <rect x="152" y="150" width="32" height="80" rx="8" fill="white" opacity="0.4" />
                        <rect x="204" y="165" width="32" height="65" rx="8" fill="white" opacity="0.5" />
                        <rect x="256" y="120" width="32" height="110" rx="8" fill="white" opacity="0.65" />
                        <rect x="308" y="90" width="32" height="140" rx="8" fill="#fbbf24" />

                        <polyline points="116,170 168,140 220,155 272,110 324,80" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
                        <circle cx="116" cy="170" r="3.5" fill="white" />
                        <circle cx="168" cy="140" r="3.5" fill="white" />
                        <circle cx="220" cy="155" r="3.5" fill="white" />
                        <circle cx="272" cy="110" r="3.5" fill="white" />
                        <circle cx="324" cy="80" r="4.5" fill="#fbbf24" />

                        <g transform="translate(346, 42)">
                            <path d="M18 0L36 9L18 18L0 9L18 0Z" fill="#fbbf24" />
                            <path d="M9 12.5V20C9 22.5 13 25 18 25C23 25 27 22.5 27 20V12.5L18 17L9 12.5Z" fill="#fbbf24" opacity="0.85" />
                            <line x1="33" y1="9" x2="33" y2="19" stroke="#fbbf24" strokeWidth="1.5" />
                        </g>
                    </svg>

                    <ul className="login-brand-features">
                        <li><GraduationCap size={20} /> O'quvchilar va guruhlarni boshqarish</li>
                        <li><BarChart3 size={20} /> Moliya va davomat bo'yicha real vaqt hisobotlari</li>
                        <li><ShieldCheck size={20} /> Xavfsiz va ishonchli ma'lumotlar bazasi</li>
                    </ul>
                </div>
            </div>

            <div className="login-form-panel">
                <div className="login-card">
                    <div className="login-header">
                        <div className="login-logo-mobile">SC</div>
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
                </div>
            </div>
        </div>
    );
};

export default Login;

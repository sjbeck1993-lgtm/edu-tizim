import React, { useState } from 'react';
import { Lock, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosClient from '../api/axiosClient';
import './Settings.css';

const Settings = () => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChangePassword = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast.error("Yangi parollar mos kelmadi!");
            return;
        }
        if (newPassword.length < 6) {
            toast.error("Yangi parol kamida 6 belgidan iborat bo'lishi kerak.");
            return;
        }

        setLoading(true);
        try {
            const response = await axiosClient.put('/auth/change-password', {
                currentPassword,
                newPassword
            });
            toast.success(response.data.message || "Parol o'zgartirildi!");
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            toast.error(error.response?.data?.message || "Parolni o'zgartirishda xatolik yuz berdi.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="settings-page">
            <div className="settings-header">
                <h1>Sozlamalar</h1>
                <p>Hisobingiz xavfsizligini shu yerdan boshqaring</p>
            </div>

            <div className="settings-card">
                <div className="settings-card-header">
                    <KeyRound size={20} />
                    <h2>Parolni o'zgartirish</h2>
                </div>

                <form onSubmit={handleChangePassword} className="settings-form">
                    <div className="input-group">
                        <label>Joriy parol</label>
                        <div className="input-with-icon">
                            <Lock size={18} className="input-icon" />
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Yangi parol</label>
                        <div className="input-with-icon">
                            <Lock size={18} className="input-icon" />
                            <input
                                type="password"
                                placeholder="Kamida 6 belgi"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Yangi parolni tasdiqlang</label>
                        <div className="input-with-icon">
                            <Lock size={18} className="input-icon" />
                            <input
                                type="password"
                                placeholder="Yangi parolni qayta kiriting"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Saqlanmoqda...' : 'Parolni saqlash'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Settings;

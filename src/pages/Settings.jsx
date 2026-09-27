import React, { useState, useRef } from 'react';
import { Lock, KeyRound, User, Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosClient from '../api/axiosClient';
import './Settings.css';

const Settings = () => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const [avatarUrl, setAvatarUrl] = useState(storedUser.avatarUrl || null);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const fileInputRef = useRef(null);

    const handleAvatarSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error("Faqat rasm fayllarini tanlang.");
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            toast.error("Rasm hajmi 2MB dan oshmasligi kerak.");
            return;
        }

        const formData = new FormData();
        formData.append('avatar', file);

        setAvatarUploading(true);
        try {
            const response = await axiosClient.post('/auth/avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const newAvatarUrl = response.data.user.avatarUrl;
            setAvatarUrl(newAvatarUrl);

            const updatedUser = { ...storedUser, avatarUrl: newAvatarUrl };
            localStorage.setItem('user', JSON.stringify(updatedUser));

            toast.success("Profil rasmi yangilandi!");
        } catch (error) {
            toast.error(error.response?.data?.message || "Rasmni yuklashda xatolik yuz berdi.");
        } finally {
            setAvatarUploading(false);
        }
    };

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
                    <User size={20} />
                    <h2>Profil rasmi</h2>
                </div>

                <div className="avatar-upload-row">
                    <div className="avatar-preview">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Profil rasmi" />
                        ) : (
                            <User size={32} />
                        )}
                    </div>
                    <div>
                        <button
                            type="button"
                            className="btn btn-outline"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={avatarUploading}
                        >
                            <Camera size={16} /> {avatarUploading ? 'Yuklanmoqda...' : 'Rasm tanlash'}
                        </button>
                        <p className="avatar-hint">JPG yoki PNG, maksimal 2MB</p>
                    </div>
                    <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleAvatarSelect}
                        style={{ display: 'none' }}
                    />
                </div>
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

import React, { useState, useEffect } from 'react';
import { Award, Target, TrendingUp, BookOpen, Clock, Calendar, UploadCloud, X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axiosClient from '../api/axiosClient';
import axios from 'axios';
import './StudentStats.css';

const performanceData = [
    { month: 'Sentabr', score: 65 },
    { month: 'Oktabr', score: 72 },
    { month: 'Noyabr', score: 85 },
    { month: 'Dekabr', score: 82 },
    { month: 'Yanvar', score: 90 },
    { month: 'Fevral', score: 95 },
];

const StudentStats = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    // Payment upload states
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [paymentData, setPaymentData] = useState({ amount: '300000', month: new Date().toISOString().split('T')[0], file: null });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await axiosClient.get('/student-profile/dashboard');
                setProfile(res.data);
            } catch (error) {
                console.error("Profile load err:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleUploadPayment = async (e) => {
        e.preventDefault();
        if (!paymentData.file) {
            toast.error("Iltimos, chek rasmini yuklang!");
            return;
        }

        const formData = new FormData();
        formData.append('amount', paymentData.amount);
        formData.append('month', paymentData.month);
        formData.append('receipt', paymentData.file);

        setUploading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/payments/upload', formData, {
                headers: {
                    'Authorization': `Bearer ${token}`
                    // Axios will automatically set Content-Type to multipart/form-data with the correct boundary
                }
            });
            toast.success("To'lov tekshirish uchun yuborildi!", { icon: '✅' });
            setIsPaymentModalOpen(false);
            setPaymentData({ amount: '300000', month: new Date().toISOString().split('T')[0], file: null });
        } catch (error) {
            toast.error(error.response?.data?.message || "Yuklashda xatolik yuz berdi");
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-muted">Ma'lumotlar yuklanmoqda...</div>;
    }

    if (!profile) {
        return <div className="p-8 text-center text-muted">Profil topilmadi.</div>;
    }

    return (
        <div className="mobile-app-container">
            <div className="mobile-header">
                <div className="user-profile-header">
                    <div className="avatar large">{profile.name.charAt(0)}</div>
                    <div className="user-details" style={{ flex: 1 }}>
                        <h2>{profile.name}</h2>
                        <p>{profile.courseName} ({profile.groupName})</p>
                    </div>
                </div>

                {profile.classDays && (
                    <div className={`mt-3 p-3 rounded-lg flex items-center gap-2 ${profile.classDays.includes(new Date().getDay()) ? 'bg-green-100 border border-green-200 text-green-800' : 'bg-gray-100 border text-gray-700'}`}>
                        <Calendar size={18} />
                        <span className="text-sm font-medium">
                            {profile.classDays.includes(new Date().getDay())
                                ? `Bugun darsingiz bor: ${profile.classTime || 'Vaqt belgilanmagan'}`
                                : `Bugun dars yo'q`}
                        </span>
                    </div>
                )}

                <button
                    className="btn btn-primary"
                    style={{ marginTop: '1rem', width: '100%', display: 'flex', justifyContent: 'center', gap: '8px' }}
                    onClick={() => setIsPaymentModalOpen(true)}
                >
                    <UploadCloud size={18} /> To'lov Chekini Yuklash
                </button>
            </div>

            <div className="mobile-content">
                <div className="level-card">
                    <div className="level-info">
                        <span className="level-badge"><Award size={16} /> {profile.level}-Daraja (Hacker)</span>
                        <span className="coins-badge"><Target size={16} /> {profile.coins} Tanga</span>
                    </div>
                    <div className="progress-container">
                        <div className="progress-labels">
                            <span>XP: {profile.xp}</span>
                            <span>10,000 gacha</span>
                        </div>
                        <div className="xp-bar">
                            <div className="xp-fill" style={{ width: `${Math.min((profile.xp / 10000) * 100, 100)}%` }}></div>
                        </div>
                    </div>
                </div>

                <h3 className="section-title-mobile mt-4">Joriy natijalar</h3>

                <div className="stats-cards-mobile">
                    <div className="stat-card-m">
                        <div className="stat-icon-m blue"><TrendingUp size={20} /></div>
                        <div className="stat-data-m">
                            <span className="stat-value-m">{profile.avgScore}%</span>
                            <span className="stat-label-m">O'rtacha baho</span>
                        </div>
                    </div>
                    <div className="stat-card-m">
                        <div className="stat-icon-m green"><Clock size={20} /></div>
                        <div className="stat-data-m">
                            <span className="stat-value-m">{profile.attendancePercentage}%</span>
                            <span className="stat-label-m">Davomat</span>
                        </div>
                    </div>
                </div>

                <h3 className="section-title-mobile mt-4">Rivojlanish grafigi</h3>
                <div className="chart-card-mobile">
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={performanceData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                            <YAxis hide domain={['dataMin - 10', 'dataMax + 5']} />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                            />
                            <Line
                                type="monotone"
                                dataKey="score"
                                stroke="var(--primary-blue)"
                                strokeWidth={3}
                                dot={{ r: 4, fill: "var(--primary-blue)", strokeWidth: 2, stroke: "white" }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <h3 className="section-title-mobile mt-4">So'nggi fanlar xulosasi</h3>
                <div className="subject-list">
                    {profile.subjects && profile.subjects.length > 0 ? (
                        profile.subjects.map(sub => (
                            <div key={sub.id} className="subject-item">
                                <div className="subject-icon"><BookOpen size={18} /></div>
                                <div className="subject-info">
                                    <h4>{sub.title}</h4>
                                    <p>Topshiriq bajarildi</p>
                                </div>
                                <div className={`subject-score ${sub.score >= 80 ? 'excellent' : 'warning'}`}>
                                    {sub.score} ball
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-4 text-center text-muted border border-dashed rounded-lg">Baholangan natijalar yo'q.</div>
                    )}
                </div>
            </div>

            {isPaymentModalOpen && (
                <div className="modal-overlay" onClick={() => setIsPaymentModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: 'white', color: 'black' }}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="modal-title m-0" style={{ color: 'black' }}>To'lov Qilish</h3>
                            <button className="icon-btn-small" onClick={() => setIsPaymentModalOpen(false)}><X size={20} color="black" /></button>
                        </div>
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <p className="text-sm text-blue-800 font-medium mb-1">To'lov uchun karta raqami:</p>
                            <h2 className="text-xl font-bold tracking-wider text-blue-900">8600 1234 5678 9012</h2>
                            <p className="text-xs text-blue-600 mt-1">Xurshidbek M.</p>
                        </div>
                        <form onSubmit={handleUploadPayment}>
                            <div className="mb-3">
                                <label className="label" style={{ color: '#4b5563' }}>To'lov summasi (UZS)</label>
                                <input
                                    type="number"
                                    className="input-field"
                                    placeholder="Masalan: 300000"
                                    value={paymentData.amount}
                                    style={{ color: 'black', background: 'white', border: '1px solid #d1d5db' }}
                                    onChange={e => setPaymentData({ ...paymentData, amount: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="mb-2">
                                <label className="label">To'lov boshlanish sanasi</label>
                                <input type="date" className="input-field"
                                    value={paymentData.month} onChange={e => setPaymentData({ ...paymentData, month: e.target.value })} required />
                            </div>
                            <div className="mb-4">
                                <label className="label" style={{ color: '#4b5563' }}>Chek rasmi (Skrinshot)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="input-field"
                                    style={{ color: 'black', background: 'white', border: '1px solid #d1d5db', padding: '8px' }}
                                    onChange={e => setPaymentData({ ...paymentData, file: e.target.files[0] })}
                                    required
                                />
                            </div>
                            <div className="flex gap-2 justify-end mt-4">
                                <button type="button" className="btn btn-outline" style={{ color: 'black', borderColor: '#d1d5db' }} onClick={() => setIsPaymentModalOpen(false)}>Bekor qilish</button>
                                <button type="submit" className="btn btn-primary" disabled={uploading}>
                                    {uploading ? 'Yuklanmoqda...' : 'Yuborish'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentStats;
